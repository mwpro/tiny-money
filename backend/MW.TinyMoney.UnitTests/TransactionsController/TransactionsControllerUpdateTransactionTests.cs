using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Buffer.ApiModels;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerUpdateTransactionTests
{
    private const int UnknownVendorId = 99;
    private const int VendorA = 1;
    private const int VendorB = 2;

    public TransactionsControllerUpdateTransactionTests()
    {
        TransactionPlaceholders.Setup(UnknownVendorId, 99);
    }

    private static Api.Transaction.ApiModels.Transaction MakeImportedTransaction(
        int vendorId = UnknownVendorId,
        string description = "some description",
        bool isVerified = false) =>
        new()
        {
            Id = 1,
            Amount = 10,
            IsExpense = true,
            TransactionDate = DateTime.UtcNow,
            Description = description,
            VendorId = vendorId,
            SubcategoryId = 1,
            IsVerified = isVerified,
            IsPossibleDuplicate = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = TransactionPlaceholders.CreatedByImport,
            ModifiedDate = DateTime.UtcNow,
            TagIds = new List<int>()
        };

    private static AddTransactionDto MakeUpdateDto(int vendorId = VendorA, bool isVerified = true) =>
        new()
        {
            Amount = 10,
            IsExpense = true,
            TransactionDate = DateTime.UtcNow,
            Description = "some description",
            Vendor = new VendorDto { Id = vendorId, Name = "Stonka" },
            SubcategoryId = 1,
            Tags = new List<TagDto>(),
            IsVerified = isVerified
        };

    private static Api.Transaction.TransactionsController BuildController(
        Api.Transaction.ApiModels.Transaction existingTransaction,
        StubVendorMatchingService vendorMatchingService = null)
    {
        var transactionStore = new StubTransactionStore(existingTransaction);
        var vendorStore = new StubVendorStore();
        var tagStore = new StubTagStore();
        return new Api.Transaction.TransactionsController(
            transactionStore, vendorStore, tagStore,
            vendorMatchingService ?? new StubVendorMatchingService());
    }

    [Fact]
    public async Task NoAliasSuggested_WhenCreatedByIsNotImport()
    {
        var transaction = MakeImportedTransaction();
        transaction.CreatedBy = TransactionPlaceholders.CreatedByApi;
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "biedronka" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto());
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenVendorDoesNotChange()
    {
        var transaction = MakeImportedTransaction(vendorId: VendorA);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "biedronka" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorA));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenTransactionDoesNotBecomeVerified()
    {
        var transaction = MakeImportedTransaction(vendorId: VendorA, isVerified: false);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "biedronka" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorB, isVerified: false));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenTransactionWasAlreadyVerified()
    {
        var transaction = MakeImportedTransaction(vendorId: VendorA, isVerified: true);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "biedronka" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorB, isVerified: true));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task NoAliasSuggested_WhenDescriptionMatchesVendor()
    {
        var transaction = MakeImportedTransaction(vendorId: VendorA);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = null };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorB));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().BeNull();
    }

    [Fact]
    public async Task AliasSuggested_WhenVendorChangesAndVerifiedAndImportAndNoMatch()
    {
        var transaction = MakeImportedTransaction(vendorId: VendorA);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "some description" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorB));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().NotBeNull();
        response.SuggestedAlias.Alias.Should().Be("some description");
        response.SuggestedAlias.VendorId.Should().Be(VendorB);
    }

    [Fact]
    public async Task AliasSuggested_WhenAutoVerifyFires_UnknownVendorToReal()
    {
        var transaction = MakeImportedTransaction(vendorId: UnknownVendorId, isVerified: false);
        var matchingService = new StubVendorMatchingService { SuggestAliasResult = "some description" };

        var controller = BuildController(transaction, matchingService);
        var result = (OkObjectResult)await controller.UpdateTransaction(1, MakeUpdateDto(VendorA, isVerified: false));
        var response = (AddTransactionResponse)result.Value;

        response.SuggestedAlias.Should().NotBeNull();
        response.SuggestedAlias.VendorId.Should().Be(VendorA);
    }

    // Stubs

    private class StubTransactionStore : ITransactionStore
    {
        private readonly Api.Transaction.ApiModels.Transaction _transaction;

        public StubTransactionStore(Api.Transaction.ApiModels.Transaction transaction)
            => _transaction = transaction;

        public Task<Api.Transaction.ApiModels.Transaction> GetTransaction(int transactionId)
            => Task.FromResult(_transaction);

        public Task UpdateTransaction(Api.Transaction.ApiModels.Transaction transaction)
            => Task.CompletedTask;

        public void SaveTransaction(Api.Transaction.ApiModels.Transaction transaction) => throw new NotImplementedException();
        public Task SaveTransactionsBatch(IReadOnlyList<Api.Transaction.ApiModels.Transaction> transactions) => throw new NotImplementedException();
        public IEnumerable<Api.Transaction.ApiModels.Transaction> GetTopExpenses(IEnumerable<DateTime> months) => throw new NotImplementedException();
        public Task<IReadOnlyCollection<Api.Transaction.ApiModels.Transaction>> GetTransactions(DateTime? dateFrom, DateTime? dateTo, bool? isExpense, decimal? amountFrom, decimal? amountTo, int? vendorId, int? subcategoryId, int? tagId, bool? isVerified) => throw new NotImplementedException();
        public Task DeleteTransaction(Api.Transaction.ApiModels.Transaction transaction) => throw new NotImplementedException();
        public Task DeleteTransactions(IReadOnlyList<int> transactionIds) => throw new NotImplementedException();
    }

    private class StubVendorStore : IVendorStore
    {
        public Task SaveVendor(Vendor vendor) { vendor.Id = VendorA; return Task.CompletedTask; }
        public Task<IEnumerable<Vendor>> GetVendors() => throw new NotImplementedException();
        public Task<IEnumerable<VendorAlias>> GetAllAliases() => throw new NotImplementedException();
        public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
        public Task<VendorWithAliases> GetVendorWithAliases(int vendorId) => throw new NotImplementedException();
        public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
        public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
        public Task<Api.Infrastructure.Result<VendorAlias>> AddVendorAlias(int vendorId, string alias) => throw new NotImplementedException();
        public Task DeleteVendorAlias(int vendorId, int aliasId) => throw new NotImplementedException();
    }

    private class StubTagStore : ITagStore
    {
        public Task SaveTag(Tag tag) { tag.Id = 1; return Task.CompletedTask; }
        public Task<IEnumerable<TagDetails>> GetTags() => throw new NotImplementedException();
        public Task<Tag> GetTag(int id) => throw new NotImplementedException();
        public Task DeleteTag(int id) => throw new NotImplementedException();
        public Task UpdateTag(int tagId, Tag tag) => throw new NotImplementedException();
    }

    private class StubVendorMatchingService : IVendorMatchingService
    {
        public string SuggestAliasResult { get; set; }

        public Task<string> SuggestAlias(int vendorId, string description) => Task.FromResult(SuggestAliasResult);
        public Task<IEnumerable<Vendor>> SuggestVendor(string description, int limit) => throw new NotImplementedException();
        public Task<IVendorMatcher> CreateMatcher() => throw new NotImplementedException();
    }
}
