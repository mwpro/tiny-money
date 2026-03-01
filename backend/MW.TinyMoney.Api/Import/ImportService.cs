using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Buffer;
using MW.TinyMoney.Api.Import.Parsers;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Import;

public class ImportService : IImportService
{
    private const int DuplicateDetectionWindowDays = 3;

    private const string DuplicateCandidatesQuery = """
        SELECT t.amount, t.is_expense AS isExpense, t.transaction_date AS transactionDate
        FROM transaction t
        WHERE t.transaction_date BETWEEN @minDate AND @maxDate
        """;

    private readonly IEnumerable<IImportParser> _parsers;
    private readonly Transaction.ITransactionStore _transactionStore;
    private readonly MySqlConnectionFactory _connectionFactory;

    public ImportService(
        IEnumerable<IImportParser> parsers,
        Transaction.ITransactionStore transactionStore,
        MySqlConnectionFactory connectionFactory)
    {
        _parsers = parsers;
        _transactionStore = transactionStore;
        _connectionFactory = connectionFactory;
    }

    public async Task<ICommandResult<ImportResult>> ImportAsync(ImportRequest request)
    {
        var parser = _parsers.FirstOrDefault(p => p.CanHandle(request.FileType));
        if (parser == null)
            return new InvalidInputResult<ImportResult>($"Unknown file type: {request.FileType}");

        var parsed = parser.Parse(request.FileContent);
        if (parsed.Count == 0)
            return new CommandSuccess<ImportResult>(new ImportResult(0, 0));

        var now = DateTime.UtcNow;
        var transactions = parsed.Select(raw => new Transaction.ApiModels.Transaction
        {
            Amount = raw.Amount,
            IsExpense = raw.IsExpense,
            TransactionDate = raw.TransactionDate,
            Description = raw.RawDescription,
            VendorId = ImportPlaceholders.VendorId,
            SubcategoryId = ImportPlaceholders.SubcategoryId,
            IsVerified = false,
            IsPossibleDuplicate = false,
            CreatedDate = now,
            CreatedBy = "Import",
            ModifiedDate = now,
            TagIds = new List<int>()
        }).ToList();

        await DetectDuplicates(transactions);
        await _transactionStore.SaveTransactionsBatch(transactions);

        return new CommandSuccess<ImportResult>(new ImportResult(
            NumberOfImportedTransactions: transactions.Count,
            NumberOfPossibleDuplicates: transactions.Count(t => t.IsPossibleDuplicate)));
    }

    private async Task DetectDuplicates(IReadOnlyList<Transaction.ApiModels.Transaction> transactions)
    {
        var minDate = transactions.Min(t => t.TransactionDate).AddDays(-DuplicateDetectionWindowDays);
        var maxDate = transactions.Max(t => t.TransactionDate).AddDays(DuplicateDetectionWindowDays);

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        var candidates = (await connection.QueryAsync<(decimal amount, bool isExpense, DateTime transactionDate)>(
            DuplicateCandidatesQuery, new { minDate, maxDate })).ToList();

        foreach (var transaction in transactions)
        {
            transaction.IsPossibleDuplicate = candidates.Any(c =>
                c.amount == transaction.Amount &&
                c.isExpense == transaction.IsExpense &&
                Math.Abs((c.transactionDate - transaction.TransactionDate).TotalDays) <= DuplicateDetectionWindowDays);
        }
    }
}
