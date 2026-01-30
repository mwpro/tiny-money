using System.Collections.Generic;

namespace MW.TinyMoney.Api.Transaction.ApiModels;

public class TransactionsResponse
{
    public IEnumerable<Transaction> Transactions { get; set; }
    public TransactionsSummary Summary { get; set; }
}

public class TransactionsSummary
{
    public decimal IncomesTotal { get; set; }
    public int IncomesCount { get; set; }
    public decimal ExpensesTotal { get; set; }
    public int ExpensesCount { get; set; }
    public decimal Balance => IncomesTotal - ExpensesTotal;
}