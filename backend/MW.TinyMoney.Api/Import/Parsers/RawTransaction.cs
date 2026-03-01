using System;

namespace MW.TinyMoney.Api.Import.Parsers;

public record RawTransaction(decimal Amount, bool IsExpense, DateTime TransactionDate, string RawDescription);
