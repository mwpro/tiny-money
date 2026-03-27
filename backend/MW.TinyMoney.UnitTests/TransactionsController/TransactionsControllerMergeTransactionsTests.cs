using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Tags.ApiModels;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.Api.Vendors.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerMergeTransactionsTests
{
    private readonly TransactionStoreStub _transactionStore;
    private readonly VendorStoreStub _vendorStore;
    private readonly TagStoreStub _tagStore;
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerMergeTransactionsTests()
    {
        _transactionStore = new TransactionStoreStub();
        _vendorStore = new VendorStoreStub();
        _tagStore = new TagStoreStub();
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, _vendorStore, _tagStore, new VendorMatchingServiceStub());
    }

    private static MergeTransactionsDto ValidDto(IEnumerable<int> ids = null) => new()
    {
        TransactionIds = ids ?? [1, 2],
        TransactionDate = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc),
        Description = "test",
        SubcategoryId = 10,
        Vendor = new VendorDto { Id = 5, Name = "Shop" },
        Tags = []
    };

    private static Transaction MakeTransaction(decimal amount, bool isExpense)
    {
        var t = TransactionsHelper.PrepareTransaction(amount: amount);
        t.IsExpense = isExpense;
        return t;
    }

    [Fact]
    public async Task Returns400_WhenFewerThanTwoIds()
    {
        var result = await _controller.MergeTransactions(new MergeTransactionsDto
        {
            TransactionIds = [1],
            SubcategoryId = 10,
            Vendor = new VendorDto { Id = 5, Name = "Shop" },
            Tags = []
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenVendorMissing()
    {
        var result = await _controller.MergeTransactions(new MergeTransactionsDto
        {
            TransactionIds = [1, 2],
            SubcategoryId = 10,
            Vendor = new VendorDto { Name = "" },
            Tags = []
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenCategoryMissing()
    {
        var result = await _controller.MergeTransactions(new MergeTransactionsDto
        {
            TransactionIds = [1, 2],
            SubcategoryId = 0,
            Vendor = new VendorDto { Id = 5, Name = "Shop" },
            Tags = []
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns404_WhenAnyTransactionNotFound()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(100, isExpense: true)
        };

        var result = await _controller.MergeTransactions(ValidDto([1, 2]));

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns400_WhenNetAmountIsZero()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(100, isExpense: true),
            MakeTransaction(100, isExpense: false)
        };

        var result = await _controller.MergeTransactions(ValidDto());

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task MergedIsExpense_WhenNetNegative()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(70, isExpense: true),
            MakeTransaction(30, isExpense: true)
        };

        await _controller.MergeTransactions(ValidDto());

        _transactionStore.MergedTransaction.IsExpense.Should().BeTrue();
        _transactionStore.MergedTransaction.Amount.Should().Be(100);
    }

    [Fact]
    public async Task MergedIsIncome_WhenNetPositive()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(100, isExpense: false),
            MakeTransaction(15, isExpense: true)
        };

        await _controller.MergeTransactions(ValidDto());

        _transactionStore.MergedTransaction.IsExpense.Should().BeFalse();
        _transactionStore.MergedTransaction.Amount.Should().Be(85);
    }

    [Fact]
    public async Task MergedTransaction_UsesUserSuppliedDate()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(50, isExpense: true),
            MakeTransaction(50, isExpense: true)
        };

        var expectedDate = new DateTime(2024, 6, 15, 0, 0, 0, DateTimeKind.Utc);
        var dto = ValidDto();
        dto.TransactionDate = expectedDate;

        await _controller.MergeTransactions(dto);

        _transactionStore.MergedTransaction.TransactionDate.Should().Be(expectedDate);
    }

    [Fact]
    public async Task MergedTransaction_IsVerifiedAndNotDuplicate()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(50, isExpense: true),
            MakeTransaction(50, isExpense: true)
        };

        await _controller.MergeTransactions(ValidDto());

        _transactionStore.MergedTransaction.IsVerified.Should().BeTrue();
        _transactionStore.MergedTransaction.IsPossibleDuplicate.Should().BeFalse();
    }

    [Fact]
    public async Task ReturnsOk_AndCallsMerge_WhenValid()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(60, isExpense: true),
            MakeTransaction(40, isExpense: true)
        };

        var result = await _controller.MergeTransactions(ValidDto());

        result.Should().BeOfType<OkResult>();
        _transactionStore.MergeTransactionCalled.Should().BeTrue();
    }

    [Fact]
    public async Task CreatesNewVendor_WhenVendorHasNoId()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(50, isExpense: true),
            MakeTransaction(50, isExpense: true)
        };
        _vendorStore.SaveVendorMutation = v => { v.Id = 99; };

        var dto = ValidDto();
        dto.Vendor = new VendorDto { Name = "New Vendor" };

        await _controller.MergeTransactions(dto);

        _vendorStore.SaveVendorCallCount.Should().Be(1);
        _transactionStore.MergedTransaction.VendorId.Should().Be(99);
    }

    [Fact]
    public async Task CreatesNewTag_WhenTagHasNoId()
    {
        _transactionStore.TransactionsByIds = new List<Transaction>
        {
            MakeTransaction(50, isExpense: true),
            MakeTransaction(50, isExpense: true)
        };

        var dto = ValidDto();
        dto.Tags = [new TagDto { Name = "new-tag" }];

        await _controller.MergeTransactions(dto);

        _tagStore.SaveTagCallCount.Should().Be(1);
        _transactionStore.MergedTransaction.Tags.Should().ContainSingle(t => t.Name == "new-tag" && t.Id == 1);
    }
}
