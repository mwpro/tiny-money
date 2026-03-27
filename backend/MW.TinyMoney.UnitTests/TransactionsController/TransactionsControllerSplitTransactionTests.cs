using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Transaction.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.TransactionsController;

public class TransactionsControllerSplitTransactionTests
{
    private readonly TransactionStoreStub _transactionStore;
    private readonly Api.Transaction.TransactionsController _controller;

    public TransactionsControllerSplitTransactionTests()
    {
        _transactionStore = new TransactionStoreStub();
        _controller = new Api.Transaction.TransactionsController(
            _transactionStore, new VendorStoreStub(), new TagStoreStub(), new VendorMatchingServiceStub());
    }

    [Fact]
    public async Task Returns404_WhenTransactionNotFound()
    {
        _transactionStore.Transaction = null;

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits = new List<SplitPartDto>
            {
                new() { Amount = 5, IsExpense = true, Tags = [] },
                new() { Amount = 5, IsExpense = true, Tags = [] }
            }
        });

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Returns400_WhenFewerThanTwoSplits()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction();

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits = new List<SplitPartDto>
            {
                new() { Amount = 10, IsExpense = true, Tags = [] }
            }
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Returns400_WhenAmountsDoNotSumToTotal()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(); // Amount = 10

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits = new List<SplitPartDto>
            {
                new() { Amount = 3, IsExpense = true, Tags = [] },
                new() { Amount = 5, IsExpense = true, Tags = [] }
            }
        });

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ReturnsOk_AndCallsSplit_WhenValid()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(); // Amount = 10

        var result = await _controller.SplitTransaction(1, new SplitTransactionDto
        {
            Splits = new List<SplitPartDto>
            {
                new() { Amount = 7, IsExpense = true, Tags = [] },
                new() { Amount = 3, IsExpense = true, Tags = [] }
            }
        });

        result.Should().BeOfType<OkResult>();
        _transactionStore.SplitTransactionCalled.Should().BeTrue();
    }
}
