using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Import;

public record ImportResult(int NumberOfImportedTransactions, int NumberOfPossibleDuplicates);

public record SingleTransactionRequest(DateTime Date, bool IsExpense, decimal Amount, string Description);

public interface IImportService
{
    Task<ICommandResult<ImportResult>> ImportFile(Stream fileStream, string fileType, CancellationToken ct);
    Task<ICommandResult<int>> ImportSingle(SingleTransactionRequest request, CancellationToken ct);
}
