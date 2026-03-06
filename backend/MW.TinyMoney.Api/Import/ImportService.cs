using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Buffer;
using MW.TinyMoney.Api.Import.Parsers;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.Api.Import;

public class ImportService : IImportService
{
    private const int DuplicateDetectionWindowDays = 3;

    private const string DuplicateCandidatesQuery = """
        SELECT t.amount, t.is_expense AS isExpense, t.transaction_date AS transactionDate
        FROM transaction t
        WHERE t.transaction_date BETWEEN @minDate AND @maxDate
        """;

    private readonly IEnumerable<IFileImportParser> _parsers;
    private readonly Transaction.ITransactionStore _transactionStore;
    private readonly MySqlConnectionFactory _connectionFactory;
    private readonly IVendorMatchingService _vendorMatchingService;

    public ImportService(
        IEnumerable<IFileImportParser> parsers,
        Transaction.ITransactionStore transactionStore,
        MySqlConnectionFactory connectionFactory,
        IVendorMatchingService vendorMatchingService)
    {
        _parsers = parsers;
        _transactionStore = transactionStore;
        _connectionFactory = connectionFactory;
        _vendorMatchingService = vendorMatchingService;
    }

    public async Task<ICommandResult<ImportResult>> ImportFile(Stream fileStream, string fileType, CancellationToken ct)
    {
        var parser = _parsers.FirstOrDefault(p => p.CanHandle(fileType));
        if (parser == null)
            return new InvalidInputResult<ImportResult>($"Unknown file type: {fileType}");

        var parsed = parser.ParseStream(fileStream);
        return await CreateAndSaveTransactions(parsed, ct);
    }

    private async Task<ICommandResult<ImportResult>> CreateAndSaveTransactions(
        IReadOnlyCollection<RawTransaction> parsed, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        
        if (parsed.Count == 0)
            return new CommandSuccess<ImportResult>(new ImportResult(0, 0));

        var now = DateTime.UtcNow;
        var matcher = await _vendorMatchingService.CreateMatcher();
        var transactions = parsed.Select(raw =>
        {
            var matchedVendor = matcher.Match(raw.RawDescription, 1).FirstOrDefault();
            return new Transaction.ApiModels.Transaction
            {
                Amount = raw.Amount,
                IsExpense = raw.IsExpense,
                TransactionDate = raw.TransactionDate,
                Description = raw.RawDescription,
                VendorId = matchedVendor?.Id ?? ImportPlaceholders.VendorId,
                SubcategoryId = matchedVendor?.DefaultSubcategoryId ?? ImportPlaceholders.SubcategoryId,
                IsVerified = false,
                IsPossibleDuplicate = false,
                CreatedDate = now,
                CreatedBy = "Import",
                ModifiedDate = now,
                TagIds = new List<int>()
            };
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
