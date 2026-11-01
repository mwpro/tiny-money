using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.UnitTests.AiSuggestions;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerGetTransactionTests
{
    private readonly TransactionStoreStub _transactionStore = new();
    private readonly AiSuggestionStoreStub _aiSuggestionStore = new();
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerGetTransactionTests()
    {
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, new VendorStoreStub(), new TagStoreStub(), new VendorMatchingServiceStub(),
            _aiSuggestionStore, OpenRouterTestOptions.Enabled(minConfidence: 0.5m));
    }

    private void StoreSuggestion(int? vendorId, string vendorName, decimal? vendorConfidence, int? subcategoryId, decimal? subcategoryConfidence) =>
        _aiSuggestionStore.SaveSuggestion(new AiSuggestion
        {
            TransactionId = 1,
            SuggestedVendorId = vendorId,
            SuggestedVendorName = vendorName,
            VendorConfidence = vendorConfidence,
            SuggestedSubcategoryId = subcategoryId,
            SubcategoryConfidence = subcategoryConfidence,
            Model = "jev",
            CreatedAt = DateTime.UtcNow
        });

    private async Task<TransactionDetails> GetTransaction() =>
        (await _controller.GetTransaction(1))
            .Should().BeOfType<OkObjectResult>().Which.Value.Should().BeOfType<TransactionDetails>().Subject;

    [Fact]
    public async Task Returns404_WhenTransactionNotFound()
    {
        _transactionStore.Transaction = null;

        var result = await _controller.GetTransaction(1);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ReturnsTransactionWithoutSuggestion_WhenNoneStored()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null, description: "LIDL");

        var transaction = await GetTransaction();

        transaction.Id.Should().Be(1);
        transaction.Description.Should().Be("LIDL");
        transaction.AiSuggestion.Should().BeNull();
    }

    [Fact]
    public async Task ReturnsLatestSuggestion_ForUnverifiedTransaction()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        StoreSuggestion(5, "Old", 0.9m, 10, 0.9m);
        StoreSuggestion(6, "Żabka", 0.9m, 11, 0.9m);

        var suggestion = (await GetTransaction()).AiSuggestion;

        suggestion.VendorId.Should().Be(6);
        suggestion.VendorName.Should().Be("Żabka");
        suggestion.SubcategoryId.Should().Be(11);
    }

    [Fact]
    public async Task OmitsSuggestion_ForVerifiedTransaction()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(isVerified: true);
        StoreSuggestion(6, "Żabka", 0.9m, 11, 0.9m);

        var transaction = await GetTransaction();

        transaction.AiSuggestion.Should().BeNull();
    }

    [Fact]
    public async Task HidesSuggestionPartsBelowConfidenceThreshold()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        StoreSuggestion(6, "Żabka", 0.4m, 11, 0.6m);

        var suggestion = (await GetTransaction()).AiSuggestion;

        suggestion.VendorId.Should().BeNull();
        suggestion.VendorName.Should().BeNull();
        suggestion.SubcategoryId.Should().Be(11);
    }

    [Fact]
    public async Task ShowsNewVendorName_WhenVendorQuestionWasNotAsked()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        StoreSuggestion(null, "ORLEN STACJA", null, null, null);

        var suggestion = (await GetTransaction()).AiSuggestion;

        suggestion.VendorId.Should().BeNull();
        suggestion.VendorName.Should().Be("ORLEN STACJA");
        suggestion.SubcategoryId.Should().BeNull();
    }
}
