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

    private readonly IDecisionsClient _decisionsClient;
    private readonly IAiSuggestionStore _suggestionStore;
    private readonly ICategoriesStore _categoriesStore;
    private readonly IDescriptionPreprocessor _descriptionPreprocessor;
    private readonly OpenRouterOptions _options;
    private readonly ILogger<AiSuggestionService> _logger;

    public AiSuggestionService(IDecisionsClient decisionsClient, IAiSuggestionStore suggestionStore,
        ICategoriesStore categoriesStore, IDescriptionPreprocessor descriptionPreprocessor,
        IOptions<OpenRouterOptions> options, ILogger<AiSuggestionService> logger)
    {
        _decisionsClient = decisionsClient;
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

        var response = await AskModel(transaction, description, subcategories, ct);

        // The model only classifies the subcategory; the vendor is always proposed as a new one named after the
        // description. Suggesting an existing vendor would set SuggestedVendorId and VendorConfidence instead,
        // which the table, DTO, editor and accuracy tracking already support.
        var suggestion = new AiSuggestion
        {
            TransactionId = transaction.Id,
            SuggestedVendorName = description,
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
}
