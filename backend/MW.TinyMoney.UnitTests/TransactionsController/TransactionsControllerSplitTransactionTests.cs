using System;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Tags.ApiModels;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerSplitTransactionTests
{
    private readonly TransactionStoreStub _transactionStore;
    private readonly VendorStoreStub _vendorStore;
    private readonly TagStoreStub _tagStore;
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerSplitTransactionTests()
    {
        _transactionStore = new TransactionStoreStub();
        _vendorStore = new VendorStoreStub();
        _tagStore = new TagStoreStub();
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, _vendorStore, _tagStore, new VendorMatchingServiceStub());
    }

    [Fact]
    public async Task Returns404_WhenTransactionNotFound()
    {
        _transactionStore.Transaction = null;

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 5, IsExpense = true },
                new() { Amount = 5, IsExpense = true }
            ]
        });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns400_WhenFewerThanTwoSplits()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 10);

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits = [new() { Amount = 10, IsExpense = true }]
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenAmountsDoNotSumToTotal()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 150);

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 75, IsExpense = true },
                new() { Amount = 50, IsExpense = true }
            ]
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ReturnsOk_AndCallsSplit_WhenValid()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 150);

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 75, IsExpense = true },
                new() { Amount = 50, IsExpense = true },
                new() { Amount = 25, IsExpense = true }
            ]
        });

        result.Should().BeOfType<OkResult>();
        _transactionStore.SplitTransactionCalled.Should().BeTrue();
    }

    [Fact]
    public async Task SplitParts_InheritFieldsFromParent()
    {
        var originalCreatedDate = new DateTime(2025, 6, 15, 10, 0, 0, DateTimeKind.Utc);
        var parent = TransactionsHelper.PrepareTransaction(
            amount: 100, description: "Original description", createdBy: "import", createdDate: originalCreatedDate);

        _transactionStore.Transaction = parent;
        var testStart = DateTime.UtcNow;

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true },
                new() { Amount = 40, IsExpense = true }
            ]
        });

        _transactionStore.LastSplitTransactions.Should().AllSatisfy(t =>
        {
            t.TransactionDate.Should().Be(parent.TransactionDate);
            t.Description.Should().Be(parent.Description);
            t.CreatedDate.Should().Be(originalCreatedDate);
            t.CreatedBy.Should().Be(parent.CreatedBy);
            t.ModifiedDate.Should().BeOnOrAfter(testStart);
            t.ModifiedDate.Should().BeAfter(originalCreatedDate);
        });
    }

    [Fact]
    public async Task SplitParts_AreVerifiedAndNotDuplicate()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100, isVerified: false);

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true },
                new() { Amount = 40, IsExpense = true }
            ]
        });

        _transactionStore.LastSplitTransactions.Should().AllSatisfy(t =>
        {
            t.IsVerified.Should().BeTrue();
            t.IsPossibleDuplicate.Should().BeFalse();
        });
    }

    [Fact]
    public async Task SplitParts_HaveCorrectAmountCategoryAndVendor()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100);

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true, SubcategoryId = 10, Vendor = new VendorDto { Id = 5, Name = "Shop A" } },
                new() { Amount = 40, IsExpense = false, SubcategoryId = 20, Vendor = new VendorDto { Id = 7, Name = "Shop B" } }
            ]
        });

        var splits = _transactionStore.LastSplitTransactions.ToList();
        splits[0].Amount.Should().Be(60);
        splits[0].IsExpense.Should().BeTrue();
        splits[0].SubcategoryId.Should().Be(10);
        splits[0].VendorId.Should().Be(5);

        splits[1].Amount.Should().Be(40);
        splits[1].IsExpense.Should().BeFalse();
        splits[1].SubcategoryId.Should().Be(20);
        splits[1].VendorId.Should().Be(7);
    }

    [Fact]
    public async Task CreatesNewVendor_WhenVendorHasNoId()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100);
        int? savedVendorId = null;
        _vendorStore.SaveVendorMutation = v => { v.Id = 99; savedVendorId = 99; };

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true, Vendor = new VendorDto { Name = "New Vendor" } },
                new() { Amount = 40, IsExpense = true, Vendor = new VendorDto { Id = 5, Name = "Existing Vendor" } }
            ]
        });

        savedVendorId.Should().Be(99);
        _transactionStore.LastSplitTransactions.First().VendorId.Should().Be(99);
    }

    [Fact]
    public async Task CreatesNewTag_WhenTagHasNoId()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100);

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new()
                {
                    Amount = 60, IsExpense = true,
                    Tags = [new TagDto { Name = "new-tag" }]
                },
                new() { Amount = 40, IsExpense = true }
            ]
        });

        var firstSplit = _transactionStore.LastSplitTransactions.First();
        firstSplit.Tags.Should().ContainSingle(t => t.Name == "new-tag" && t.Id == 1);
    }

    [Fact]
    public async Task DoesNotCreateDuplicateVendor_WhenMultipleSplitsHaveSameNewVendorName()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100);

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true, SubcategoryId = 10, Vendor = new VendorDto { Name = "New Shop" } },
                new() { Amount = 40, IsExpense = true, SubcategoryId = 20, Vendor = new VendorDto { Name = "New Shop" } }
            ]
        });

        _vendorStore.SaveVendorCallCount.Should().Be(1);
    }

    [Fact]
    public async Task DoesNotCreateDuplicateTag_WhenMultipleSplitsHaveSameNewTagName()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(amount: 100);

        await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits =
            [
                new() { Amount = 60, IsExpense = true, Tags = [new TagDto { Name = "promo" }] },
                new() { Amount = 40, IsExpense = true, Tags = [new TagDto { Name = "promo" }] }
            ]
        });

        _tagStore.SaveTagCallCount.Should().Be(1);
    }
}
