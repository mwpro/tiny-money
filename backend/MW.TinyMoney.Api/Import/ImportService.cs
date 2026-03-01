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
    private readonly IngCsvBankStatementParser _ingParser;
    private readonly PekaoCsvBankStatementParser _pekaoParser;
    private readonly Transaction.ITransactionStore _transactionStore;
    private readonly MySqlConnectionFactory _connectionFactory;

    public ImportService(
        IngCsvBankStatementParser ingParser,
        PekaoCsvBankStatementParser pekaoParser,
        Transaction.ITransactionStore transactionStore,
        MySqlConnectionFactory connectionFactory)
    {
        _ingParser = ingParser;
        _pekaoParser = pekaoParser;
        _transactionStore = transactionStore;
        _connectionFactory = connectionFactory;
    }

    public async Task<ICommandResult<ImportResult>> ImportAsync(ImportRequest request)
    {
        IReadOnlyList<RawTransaction> parsed;
        if (_ingParser.CanHandle(request.FileType))
        {
            parsed = _ingParser.Parse(request.FileContent);
        }
        else if (_pekaoParser.CanHandle(request.FileType))
        {
            parsed = _pekaoParser.Parse(request.FileContent);
        }
        else
        {
            return new InvalidInputResult<ImportResult>($"Unknown file type: {request.FileType}");
        }

        if (parsed.Count == 0)
            return new CommandSuccess<ImportResult>(new ImportResult(0, 0));

        var duplicateFlags = await DetectDuplicates(parsed);

        var now = DateTime.UtcNow;
        var transactions = parsed.Select((raw, i) => new Transaction.ApiModels.Transaction
        {
            Amount = raw.Amount,
            IsExpense = raw.IsExpense,
            TransactionDate = raw.TransactionDate,
            Description = raw.RawDescription,
            VendorId = ImportPlaceholders.VendorId,
            SubcategoryId = ImportPlaceholders.SubcategoryId,
            IsVerified = false,
            IsPossibleDuplicate = duplicateFlags[i],
            CreatedDate = now,
            CreatedBy = "Import",
            ModifiedDate = now,
            TagIds = new List<int>()
        }).ToList();

        await _transactionStore.SaveTransactionsBatch(transactions);

        return new CommandSuccess<ImportResult>(new ImportResult(
            NumberOfImportedTransactions: transactions.Count,
            NumberOfPossibleDuplicates: duplicateFlags.Count(f => f)));
    }

    private async Task<bool[]> DetectDuplicates(IReadOnlyList<RawTransaction> parsed)
    {
        var minDate = parsed.Min(r => r.TransactionDate).AddDays(-3);
        var maxDate = parsed.Max(r => r.TransactionDate).AddDays(3);

        const string query = @"
            SELECT t.amount, t.is_expense AS isExpense, t.transaction_date AS transactionDate
            FROM transaction t
            WHERE t.is_verified = 1
              AND t.transaction_date BETWEEN @minDate AND @maxDate";

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        var candidates = (await connection.QueryAsync<(decimal amount, bool isExpense, DateTime transactionDate)>(
            query, new { minDate, maxDate })).ToList();

        var flags = new bool[parsed.Count];
        for (int i = 0; i < parsed.Count; i++)
        {
            var row = parsed[i];
            flags[i] = candidates.Any(c =>
                c.amount == row.Amount &&
                c.isExpense == row.IsExpense &&
                Math.Abs((c.transactionDate - row.TransactionDate).TotalDays) <= 3);
        }
        return flags;
    }
}
