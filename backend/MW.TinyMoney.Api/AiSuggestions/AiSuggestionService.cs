using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Vendors.Matching;

namespace MW.TinyMoney.Api.AiSuggestions;

public interface IAiSuggestionService
{
    Task<AiSuggestion> Suggest(Transaction.ApiModels.Transaction transaction, CancellationToken ct);
}

public class AiSuggestionService : IAiSuggestionService
{
    public const string SubcategoryQuestion = "subcategory";
    public const string VendorNameField = "vendor_name";

    private readonly IDecisionsClient _decisionsClient;
    private readonly IExtractionsClient _extractionsClient;
    private readonly IAiSuggestionStore _suggestionStore;
    private readonly ICategoriesStore _categoriesStore;
    private readonly IDescriptionPreprocessor _descriptionPreprocessor;
    private readonly OpenRouterOptions _options;
    private readonly ILogger<AiSuggestionService> _logger;

    public AiSuggestionService(IDecisionsClient decisionsClient, IExtractionsClient extractionsClient,
        IAiSuggestionStore suggestionStore, ICategoriesStore categoriesStore,
        IDescriptionPreprocessor descriptionPreprocessor, IOptions<OpenRouterOptions> options,
        ILogger<AiSuggestionService> logger)
    {
        _decisionsClient = decisionsClient;
        _extractionsClient = extractionsClient;
        _suggestionStore = suggestionStore;
        _categoriesStore = categoriesStore;
        _descriptionPreprocessor = descriptionPreprocessor;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AiSuggestion> Suggest(Transaction.ApiModels.Transaction transaction, CancellationToken ct)
    {
        var description = _descriptionPreprocessor.Sanitize(transaction.Description);
        var subcategories = await GetSubcategoryOptions(transaction.IsExpense);

        var responseTask = AskModel(transaction, description, subcategories, ct);
        var vendorNameTask = ExtractVendorName(transaction, description, ct);
        var response = await responseTask;

        var suggestion = new AiSuggestion
        {
            TransactionId = transaction.Id,
            SuggestedVendorName = await vendorNameTask,
            Model = response.Model ?? _options.Model,
            CreatedAt = DateTime.UtcNow
        };
        ApplySubcategoryAnswer(suggestion, response, subcategories);

        await _suggestionStore.SaveSuggestion(suggestion);
        return suggestion;
    }

    private record SubcategoryOption(string Key, int Id, string Label)
    {
        public SubcategoryOption(Category category, Subcategory subcategory)
            : this($"s{subcategory.Id}", subcategory.Id, $"{category.Name} / {subcategory.Name}")
        {
        }
    }

    private async Task<IReadOnlyList<SubcategoryOption>> GetSubcategoryOptions(bool isExpense) =>
        (await _categoriesStore.GetCategories())
            .Where(c => c.IsIncome != isExpense)
            .SelectMany(c => c.Subcategories.Select(s => new SubcategoryOption(c, s)))
            .ToList();

    private async Task<DecisionsResponse> AskModel(Transaction.ApiModels.Transaction transaction, string description,
        IReadOnlyList<SubcategoryOption> subcategories, CancellationToken ct)
    {
        var questions = new Dictionary<string, ChoiceQuestion>
        {
            [SubcategoryQuestion] = new(
                "Which budget category does this bank transaction belong to?",
                subcategories.ToDictionary(s => s.Key, s => s.Label))
        };
        var state = new
        {
            bank_description = description,
            direction = transaction.IsExpense ? "expense" : "income"
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await _decisionsClient.Decide(state, questions, ct);
        stopwatch.Stop();

        _logger.LogInformation(
            "AI suggestion for transaction {TransactionId} by {Model}: {InputTokens} input tokens, cost {Cost}, {ElapsedMs} ms",
            transaction.Id, response.Model, response.Usage?.InputTokens, response.Usage?.Cost, stopwatch.ElapsedMilliseconds);

        return response;
    }

    private void ApplySubcategoryAnswer(AiSuggestion suggestion, DecisionsResponse response,
        IReadOnlyList<SubcategoryOption> subcategories)
    {
        if (!response.Answers.TryGetValue(SubcategoryQuestion, out var answer))
            return;

        var subcategory = subcategories.FirstOrDefault(s => s.Key == answer.Choice);
        if (subcategory == null)
        {
            _logger.LogWarning("Model returned unknown subcategory choice {Choice} for transaction {TransactionId}",
                answer.Choice, suggestion.TransactionId);
            return;
        }

        suggestion.SuggestedSubcategoryId = subcategory.Id;
        suggestion.SubcategoryConfidence = answer.Confidence;
    }

    private async Task<string> ExtractVendorName(Transaction.ApiModels.Transaction transaction, string description,
        CancellationToken ct)
    {
        var fields = new Dictionary<string, TextField>
        {
            [VendorNameField] = new(
                "The merchant or counterparty name as a person would write it, e.g. 'Żabka' for " +
                "'ZABKA Z1234 K.1 WARSZAWA'. Without store numbers, locations, legal suffixes or payment details.")
        };

        try
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await _extractionsClient.Extract(description, fields, ct);
            stopwatch.Stop();

            _logger.LogInformation(
                "AI vendor extraction for transaction {TransactionId} by {Model}: {InputTokens} input tokens, cost {Cost}, {ElapsedMs} ms",
                transaction.Id, response.Model, response.Usage?.InputTokens, response.Usage?.Cost, stopwatch.ElapsedMilliseconds);

            if (response.Answers.TryGetValue(VendorNameField, out var answer) && !string.IsNullOrWhiteSpace(answer.Value))
                return answer.Value.Trim();
        }
        catch (Exception e) when (e is not OperationCanceledException)
        {
            _logger.LogWarning(e, "AI vendor extraction failed for transaction {TransactionId}", transaction.Id);
        }

        return description;
    }
}
