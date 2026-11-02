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

public record VendorNameAnswer(string Vendor);

public class AiSuggestionService : IAiSuggestionService
{
    public const string SubcategoryQuestion = "subcategory";

    public const string VendorNamePrompt =
        """
        You name vendors for a Polish personal budgeting app. Given a bank transaction description, return the name
        of the merchant, brand or person the money went to or came from, as a person would write it in their budget:
        the consumer-facing brand rather than the legal entity that operates it, with proper Polish diacritics and
        capitalization, completing truncated words when you recognise the business. Drop store numbers, locations,
        legal suffixes, card numbers and payment wording. If you don't recognise the business, return a cleaned-up
        name from the text instead of guessing.
        """;

    private static readonly object VendorNameSchema = new
    {
        type = "object",
        properties = new { vendor = new { type = "string" } },
        required = new[] { "vendor" },
        additionalProperties = false
    };

    private readonly ILLMClient _llmClient;
    private readonly IAiSuggestionStore _suggestionStore;
    private readonly ICategoriesStore _categoriesStore;
    private readonly IDescriptionPreprocessor _descriptionPreprocessor;
    private readonly OpenRouterOptions _options;
    private readonly ILogger<AiSuggestionService> _logger;

    public AiSuggestionService(ILLMClient llmClient, IAiSuggestionStore suggestionStore,
        ICategoriesStore categoriesStore, IDescriptionPreprocessor descriptionPreprocessor,
        IOptions<OpenRouterOptions> options, ILogger<AiSuggestionService> logger)
    {
        _llmClient = llmClient;
        _suggestionStore = suggestionStore;
        _categoriesStore = categoriesStore;
        _descriptionPreprocessor = descriptionPreprocessor;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AiSuggestion> Suggest(Transaction.ApiModels.Transaction transaction, CancellationToken ct)
    {
        var description = _descriptionPreprocessor.Sanitize(transaction.Description);

        var vendorName = await SuggestVendorName(transaction, description, ct);
        var category = await SuggestCategory(transaction, description, vendorName, ct);

        var suggestion = new AiSuggestion
        {
            TransactionId = transaction.Id,
            SuggestedVendorName = vendorName ?? description,
            SuggestedSubcategoryId = category.SubcategoryId,
            SubcategoryConfidence = category.Confidence,
            Model = category.Model ?? _options.DecisionModel,
            CreatedAt = DateTime.UtcNow
        };

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

    private record CategorySuggestion(string Model, int? SubcategoryId, decimal? Confidence);

    private async Task<CategorySuggestion> SuggestCategory(Transaction.ApiModels.Transaction transaction,
        string description, string vendorName, CancellationToken ct)
    {
        var subcategories = (await _categoriesStore.GetCategories())
            .Where(c => c.IsIncome != transaction.IsExpense)
            .SelectMany(c => c.Subcategories.Select(s => new SubcategoryOption(c, s)))
            .ToList();
        var questions = new Dictionary<string, ChoiceQuestion>
        {
            [SubcategoryQuestion] = new(
                "Which budget category does this bank transaction belong to?",
                subcategories.ToDictionary(s => s.Key, s => s.Label))
        };
        var state = new
        {
            bank_description = description,
            vendor = vendorName,
            direction = transaction.IsExpense ? "expense" : "income"
        };

        var stopwatch = Stopwatch.StartNew();
        var response = await _llmClient.Decide(state, questions, ct);
        stopwatch.Stop();

        _logger.LogInformation(
            "AI suggestion for transaction {TransactionId} by {Model}: {InputTokens} input tokens, cost {Cost}, {ElapsedMs} ms",
            transaction.Id, response.Model, response.Usage?.InputTokens, response.Usage?.Cost, stopwatch.ElapsedMilliseconds);

        if (!response.Answers.TryGetValue(SubcategoryQuestion, out var answer))
            return new CategorySuggestion(response.Model, null, null);

        var subcategory = subcategories.FirstOrDefault(s => s.Key == answer.Choice);
        if (subcategory == null)
        {
            _logger.LogWarning("Model returned unknown subcategory choice {Choice} for transaction {TransactionId}",
                answer.Choice, transaction.Id);
            return new CategorySuggestion(response.Model, null, null);
        }

        return new CategorySuggestion(response.Model, subcategory.Id, answer.Confidence);
    }

    // Returns null when the model fails or finds nothing, so a vendor name outage never blocks the category
    private async Task<string> SuggestVendorName(Transaction.ApiModels.Transaction transaction, string description,
        CancellationToken ct)
    {
        try
        {
            var stopwatch = Stopwatch.StartNew();
            var result = await _llmClient.Complete<VendorNameAnswer>(
                new ChatRequest(VendorNamePrompt, description, VendorNameSchema), ct);
            stopwatch.Stop();

            _logger.LogInformation(
                "AI vendor name for transaction {TransactionId} by {Model}: {InputTokens} input tokens, {OutputTokens} output tokens, cost {Cost}, {ElapsedMs} ms",
                transaction.Id, result.Model, result.Usage?.PromptTokens, result.Usage?.CompletionTokens,
                result.Usage?.Cost, stopwatch.ElapsedMilliseconds);

            if (!string.IsNullOrWhiteSpace(result.Answer?.Vendor))
                return result.Answer.Vendor.Trim();
        }
        catch (Exception e) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(e, "AI vendor name failed for transaction {TransactionId}", transaction.Id);
        }

        return null;
    }
}
