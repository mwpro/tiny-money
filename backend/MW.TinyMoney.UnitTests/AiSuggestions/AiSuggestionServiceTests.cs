using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class AiSuggestionServiceTests
{
    private const int GroceriesId = 10;
    private const int FuelId = 11;
    private const int SalaryId = 20;

    private readonly LLMClientStub _llmClient = new();
    private readonly AiSuggestionStoreStub _suggestionStore = new();
    private readonly DescriptionPreprocessorMock _descriptionPreprocessor = new()
    {
        SanitizeOverride = description => $"sanitized({description})"
    };
    private readonly AiSuggestionService _service;

    public AiSuggestionServiceTests()
    {
        var categoriesStore = new CategoriesStoreStub
        {
            Categories = new List<Category>
            {
                new()
                {
                    Id = 1, Name = "Jedzenie", IsIncome = false,
                    Subcategories = new List<Subcategory> { new() { Id = GroceriesId, Name = "Zakupy spożywcze" } }
                },
                new()
                {
                    Id = 2, Name = "Samochód", IsIncome = false,
                    Subcategories = new List<Subcategory> { new() { Id = FuelId, Name = "Paliwo" } }
                },
                new()
                {
                    Id = 3, Name = "Przychody", IsIncome = true,
                    Subcategories = new List<Subcategory> { new() { Id = SalaryId, Name = "Wynagrodzenie" } }
                }
            }
        };
        _service = new AiSuggestionService(_llmClient, _suggestionStore, categoriesStore,
            _descriptionPreprocessor, OpenRouterTestOptions.Enabled(), NullLogger<AiSuggestionService>.Instance);
    }

    private static Api.Transaction.ApiModels.Transaction Expense(string description = "ZABKA WARSZAWA") =>
        TransactionsHelper.PrepareTransaction(vendorId: null, subcategoryId: null, description: description);

    [Fact]
    public async Task OffersOnlyExpenseSubcategories_ForExpense()
    {
        await _service.Suggest(Expense(), CancellationToken.None);

        _llmClient.LastQuestions[AiSuggestionService.SubcategoryQuestion].Criteria.Should()
            .BeEquivalentTo(new Dictionary<string, string>
            {
                [$"s{GroceriesId}"] = "Jedzenie / Zakupy spożywcze",
                [$"s{FuelId}"] = "Samochód / Paliwo"
            });
    }

    [Fact]
    public async Task OffersOnlyIncomeSubcategories_ForIncome()
    {
        var transaction = Expense();
        transaction.IsExpense = false;

        await _service.Suggest(transaction, CancellationToken.None);

        _llmClient.LastQuestions[AiSuggestionService.SubcategoryQuestion].Criteria.Keys.Should()
            .BeEquivalentTo([$"s{SalaryId}"]);
    }

    [Fact]
    public async Task SendsSanitizedDescription_AndSuggestedVendorName_ToCategoryModel()
    {
        _llmClient.ChatAnswer = new VendorNameAnswer("Biedronka");

        await _service.Suggest(Expense("BIEDRONKA"), CancellationToken.None);

        _llmClient.LastState.Should().BeEquivalentTo(new
        {
            bank_description = "sanitized(BIEDRONKA)", vendor = "Biedronka", direction = "expense"
        });
    }

    [Fact]
    public async Task OmitsVendorFromCategoryState_WhenVendorNameFails()
    {
        _llmClient.CompleteException = new HttpRequestException("Chat completions API returned 503");

        await _service.Suggest(Expense("BIEDRONKA"), CancellationToken.None);

        _llmClient.LastState.Should().BeEquivalentTo(new
        {
            bank_description = "sanitized(BIEDRONKA)", vendor = (string)null, direction = "expense"
        });
    }

    [Fact]
    public async Task AsksOnlyForSubcategory()
    {
        await _service.Suggest(Expense(), CancellationToken.None);

        _llmClient.LastQuestions.Keys.Should().BeEquivalentTo([AiSuggestionService.SubcategoryQuestion]);
    }

    [Fact]
    public async Task SuggestsSubcategory()
    {
        _llmClient.Answers[AiSuggestionService.SubcategoryQuestion] = new ChoiceAnswer($"s{GroceriesId}", 0.9m);

        var suggestion = await _service.Suggest(Expense(), CancellationToken.None);

        suggestion.SuggestedSubcategoryId.Should().Be(GroceriesId);
        suggestion.SubcategoryConfidence.Should().Be(0.9m);
    }

    [Fact]
    public async Task AsksChatModel_WithSanitizedDescription()
    {
        await _service.Suggest(Expense("JMP S.A. BIEDRONKA 123"), CancellationToken.None);

        _llmClient.LastChatRequest.SystemPrompt.Should().Be(AiSuggestionService.VendorNamePrompt);
        _llmClient.LastChatRequest.UserMessage.Should().Be("sanitized(JMP S.A. BIEDRONKA 123)");
    }

    [Fact]
    public async Task ProposesNewVendor_WithSuggestedName()
    {
        _llmClient.ChatAnswer = new VendorNameAnswer(" Biedronka ");

        var suggestion = await _service.Suggest(Expense("JMP S.A. BIEDRONKA 123"), CancellationToken.None);

        suggestion.SuggestedVendorId.Should().BeNull();
        suggestion.SuggestedVendorName.Should().Be("Biedronka");
        suggestion.VendorConfidence.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData(null)]
    public async Task FallsBackToDescription_WhenVendorNameIsMissing(string vendor)
    {
        _llmClient.ChatAnswer = new VendorNameAnswer(vendor);

        var suggestion = await _service.Suggest(Expense(), CancellationToken.None);

        suggestion.SuggestedVendorName.Should().Be("sanitized(ZABKA WARSZAWA)");
    }

    [Fact]
    public async Task FallsBackToDescription_WhenVendorNameFails_AndKeepsSubcategory()
    {
        _llmClient.Answers[AiSuggestionService.SubcategoryQuestion] = new ChoiceAnswer($"s{GroceriesId}", 0.9m);
        _llmClient.CompleteException = new HttpRequestException("Chat completions API returned 503");

        var suggestion = await _service.Suggest(Expense(), CancellationToken.None);

        suggestion.SuggestedVendorName.Should().Be("sanitized(ZABKA WARSZAWA)");
        suggestion.SuggestedSubcategoryId.Should().Be(GroceriesId);
        _suggestionStore.SavedSuggestions.Should().ContainSingle();
    }

    [Fact]
    public async Task IgnoresUnknownSubcategoryChoice()
    {
        _llmClient.Answers[AiSuggestionService.SubcategoryQuestion] = new ChoiceAnswer($"s{SalaryId}", 0.9m);

        var suggestion = await _service.Suggest(Expense(), CancellationToken.None);

        suggestion.SuggestedSubcategoryId.Should().BeNull();
        suggestion.SubcategoryConfidence.Should().BeNull();
    }

    [Fact]
    public async Task StoresSuggestion_WithServedModel()
    {
        var suggestion = await _service.Suggest(Expense(), CancellationToken.None);

        _suggestionStore.SavedSuggestions.Should().ContainSingle().Which.Should().BeSameAs(suggestion);
        suggestion.TransactionId.Should().Be(1);
        suggestion.Model.Should().Be("typesafe/jev-1.14-20261014");
    }
}
