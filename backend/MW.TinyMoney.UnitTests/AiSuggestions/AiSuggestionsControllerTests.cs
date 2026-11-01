using System;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class AiSuggestionsControllerTests
{
    private readonly TransactionStoreStub _transactionStore = new();
    private readonly AiSuggestionServiceStub _suggestionService = new();

    private AiSuggestionsController CreateController(bool enabled = true, decimal minConfidence = 0.5m)
    {
        var options = enabled ? OpenRouterTestOptions.Enabled(minConfidence) : OpenRouterTestOptions.Disabled();
        return new AiSuggestionsController(_transactionStore, _suggestionService, options);
    }

    private static AiSuggestion Suggestion(int? vendorId, string vendorName, decimal? vendorConfidence, int? subcategoryId, decimal? subcategoryConfidence) =>
        new()
        {
            SuggestedVendorId = vendorId,
            SuggestedVendorName = vendorName,
            VendorConfidence = vendorConfidence,
            SuggestedSubcategoryId = subcategoryId,
            SubcategoryConfidence = subcategoryConfidence,
            Model = "jev",
            CreatedAt = DateTime.UtcNow
        };

    private static AiSuggestionDto OkDto(IActionResult result) =>
        result.Should().BeOfType<OkObjectResult>().Which.Value.Should().BeOfType<AiSuggestionDto>().Subject;

    [Fact]
    public async Task Post_Returns204_WhenDisabled()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);

        var result = await CreateController(enabled: false).CreateSuggestion(1, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        _suggestionService.Calls.Should().Be(0);
    }

    [Fact]
    public async Task Post_Returns404_WhenTransactionNotFound()
    {
        _transactionStore.Transaction = null;

        var result = await CreateController().CreateSuggestion(1, CancellationToken.None);

        result.Should().BeOfType<NotFoundResult>();
        _suggestionService.Calls.Should().Be(0);
    }

    [Fact]
    public async Task Post_Returns400_WhenTransactionVerified()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(isVerified: true);

        var result = await CreateController().CreateSuggestion(1, CancellationToken.None);

        result.Should().BeOfType<BadRequestObjectResult>();
        _suggestionService.Calls.Should().Be(0);
    }

    [Fact]
    public async Task Post_ReturnsNewSuggestion()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: 5);
        _suggestionService.SuggestionToReturn = Suggestion(6, "Żabka", 0.9m, 11, 0.9m);

        var dto = OkDto(await CreateController().CreateSuggestion(1, CancellationToken.None));

        _suggestionService.Calls.Should().Be(1);
        dto.VendorId.Should().Be(6);
        dto.VendorName.Should().Be("Żabka");
        dto.SubcategoryId.Should().Be(11);
    }

    [Fact]
    public async Task Post_HidesPartsBelowConfidenceThreshold()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        _suggestionService.SuggestionToReturn = Suggestion(6, "Żabka", 0.4m, 11, 0.6m);

        var dto = OkDto(await CreateController(minConfidence: 0.5m).CreateSuggestion(1, CancellationToken.None));

        dto.VendorId.Should().BeNull();
        dto.VendorName.Should().BeNull();
        dto.SubcategoryId.Should().Be(11);
    }
}
