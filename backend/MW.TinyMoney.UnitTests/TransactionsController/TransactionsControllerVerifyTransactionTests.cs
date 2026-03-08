using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.UnitTests.Stubs;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerVerifyTransactionTests
{
    private const int UnknownVendorId = 99;
    private const int UncategorizedSubcategoryId = 999;
    private const int RealVendorId = 1;
    private const int RealSubcategoryId = 1;

    private readonly TransactionStoreStub _transactionStore;
    private readonly VendorMatchingServiceStub _vendorMatchingService;
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerVerifyTransactionTests()
    {
        TransactionPlaceholders.Setup(UnknownVendorId, UncategorizedSubcategoryId);

        _transactionStore = new TransactionStoreStub();
        _vendorMatchingService = new VendorMatchingServiceStub();
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, new VendorStoreStub(), new TagStoreStub(), _vendorMatchingService);
    }

    private static Transaction MakeTransaction(
        int vendorId = RealVendorId,
        int subcategoryId = RealSubcategoryId,
        bool isVerified = false,
        string createdBy = TransactionPlaceholders.CreatedByImport,
        string description = "some description") =>
        new()
        {
            Id = 1,
            Amount = 10,
            IsExpense = true,
            TransactionDate = DateTime.UtcNow,
            Description = description,
            VendorId = vendorId,
            SubcategoryId = subcategoryId,
            IsVerified = isVerified,
            IsPossibleDuplicate = true,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = createdBy,
            ModifiedDate = DateTime.UtcNow,
            TagIds = new List<int>()
        };

    [Fact]
    public async Task Returns404_WhenTransactionNotFound()
    {
        _transactionStore.Transaction = null;

        var result = await _controller.VerifyTransaction(1);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns400_WhenAlreadyVerified()
    {
        _transactionStore.Transaction = MakeTransaction(isVerified: true);

        var result = await _controller.VerifyTransaction(1);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenVendorIsUnknown()
    {
        _transactionStore.Transaction = MakeTransaction(vendorId: UnknownVendorId);

        var result = await _controller.VerifyTransaction(1);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenSubcategoryIsUncategorized()
    {
        _transactionStore.Transaction = MakeTransaction(subcategoryId: UncategorizedSubcategoryId);

        var result = await _controller.VerifyTransaction(1);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task VerifiesTransaction_AndClearsPossibleDuplicate()
    {
        _transactionStore.Transaction = MakeTransaction();

        var response = (await _controller.VerifyTransaction(1))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.Transaction.IsVerified.Should().BeTrue();
        response.Transaction.IsPossibleDuplicate.Should().BeFalse();
    }

    [Fact]
    public async Task SuggestsAlias_WhenImportedAndDescriptionDoesNotMatch()
    {
        _transactionStore.Transaction = MakeTransaction();
        _vendorMatchingService.SuggestAliasResult = "some description";

        var response = (await _controller.VerifyTransaction(1))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().NotBeNull();
        response.SuggestedAlias!.Alias.Should().Be("some description");
        response.SuggestedAlias.VendorId.Should().Be(RealVendorId);
    }

    [Fact]
    public async Task NoAliasSuggested_WhenNotImported()
    {
        _transactionStore.Transaction = MakeTransaction(createdBy: TransactionPlaceholders.CreatedByApi);
        _vendorMatchingService.SuggestAliasResult = "some description";

        var response = (await _controller.VerifyTransaction(1))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenDescriptionMatchesVendor()
    {
        _transactionStore.Transaction = MakeTransaction();
        _vendorMatchingService.SuggestAliasResult = null;

        var response = (await _controller.VerifyTransaction(1))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().BeNull();
    }
}
