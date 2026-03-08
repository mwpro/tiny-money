using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerUpdateTransactionTests
{
    private const int UnknownVendorId = 99;
    private const int VendorA = 1;
    private const int VendorB = 2;
    private const int UncategorizedSubcategoryId = 999; 
    private const int RealSubcategoryId = 1;

    private readonly TransactionStoreStub _transactionStore;
    private readonly VendorMatchingServiceStub _vendorMatchingService;
    
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerUpdateTransactionTests()
    {
        TransactionPlaceholders.Setup(UnknownVendorId, UncategorizedSubcategoryId);
        
        _transactionStore = new TransactionStoreStub();
        var vendorStore = new VendorStoreStub();
        vendorStore.SaveVendorMutation = v => v.Id = VendorA;
        var tagStore = new TagStoreStub();
        _vendorMatchingService = new VendorMatchingServiceStub();
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, vendorStore, tagStore,
            _vendorMatchingService);
    }

    private static AddTransactionDto MakeUpdateDto(int vendorId = VendorA, bool isVerified = true, int subcategoryId = RealSubcategoryId) =>
        new()
        {
            Amount = 10,
            IsExpense = true,
            TransactionDate = DateTime.UtcNow,
            Description = "some description",
            Vendor = new VendorDto { Id = vendorId, Name = "Stonka" },
            SubcategoryId = subcategoryId,
            Tags = new List<TagDto>(),
            IsVerified = isVerified
        };

    [Fact]
    public async Task NoAliasSuggested_WhenCreatedByIsNotImport()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: UnknownVendorId);
        _transactionStore.Transaction.CreatedBy = TransactionPlaceholders.CreatedByApi;
        _vendorMatchingService.SuggestAliasResult = "motyl";

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto()))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenVendorDoesNotChange()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: VendorA);
        _vendorMatchingService.SuggestAliasResult = "motyl";

        var response = (await _controller.UpdateTransaction(VendorA, MakeUpdateDto(VendorA)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;
        
        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenTransactionDoesNotBecomeVerified()
    {
        // autoVerify requires subcategoryId != UncategorizedSubcategoryId; use uncategorized to keep isVerified=false
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: VendorA, isVerified: false);
        _vendorMatchingService.SuggestAliasResult = "motyl";

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto(VendorB, isVerified: false, subcategoryId: UncategorizedSubcategoryId)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;
        
        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenTransactionWasAlreadyVerified()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: VendorA, isVerified: true);
        _vendorMatchingService.SuggestAliasResult = "motyl";

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto(VendorB, isVerified: true)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenDescriptionMatchesVendor()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: VendorA);
        _vendorMatchingService.SuggestAliasResult = null;

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto(VendorB)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task AliasSuggested_WhenVendorChangesFromOneToAnotherAndVerifiedAndImportAndNoMatch()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: VendorA);
        _vendorMatchingService.SuggestAliasResult = "some description";

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto(VendorB)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().NotBeNull();
        response.SuggestedAlias.Alias.Should().Be("some description");
        response.SuggestedAlias.VendorId.Should().Be(VendorB);
    }

    [Fact]
    public async Task AliasSuggested_WhenVendorChangesFromUnknownVendorToRealAndVerifiedAndImportAndNoMatch()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: UnknownVendorId, isVerified: false);
        _vendorMatchingService.SuggestAliasResult = "some description";

        var response = (await _controller.UpdateTransaction(1, MakeUpdateDto(VendorA, isVerified: false)))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<AddTransactionResponse>()
            .Subject;

        response.SuggestedAlias.Should().NotBeNull();
        response.SuggestedAlias.VendorId.Should().Be(VendorA);
    }
}