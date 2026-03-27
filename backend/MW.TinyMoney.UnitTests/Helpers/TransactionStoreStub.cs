using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.Api.Transaction.ApiModels;

namespace MW.TinyMoney.UnitTests.Helpers;

public class TransactionStoreStub : ITransactionStore
{
    public Transaction Transaction { get; set; }
    public bool SplitTransactionCalled { get; private set; }
    public IEnumerable<Transaction> LastSplitTransactions { get; private set; }

    public Task<Transaction> GetTransaction(int transactionId)
        => Task.FromResult(Transaction);

    public Task UpdateTransaction(Transaction transaction)
        => Task.CompletedTask;

    public Task SplitTransaction(Transaction parent, IEnumerable<Transaction> newTransactions)
    {
        SplitTransactionCalled = true;
        LastSplitTransactions = newTransactions;
        return Task.CompletedTask;
    }

    public void SaveTransaction(Transaction transaction) => throw new NotImplementedException();
    public Task SaveTransactionsBatch(IReadOnlyList<Transaction> transactions) => throw new NotImplementedException();
    public Task<IReadOnlyCollection<Transaction>> GetTransactions(DateTime? dateFrom, DateTime? dateTo, bool? isExpense, decimal? amountFrom, decimal? amountTo, int? vendorId, int? subcategoryId, int? tagId, bool? isVerified) => throw new NotImplementedException();
    public Task DeleteTransaction(Transaction transaction) => throw new NotImplementedException();
    public Task DeleteTransactions(IReadOnlyList<int> transactionIds) => throw new NotImplementedException();
}