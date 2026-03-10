using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Import;

public record ImportResult(int NumberOfImportedTransactions, int NumberOfPossibleDuplicates);

public interface IImportService
{
    Task<ICommandResult<ImportResult>> ImportFile(Stream fileStream, string fileType, CancellationToken ct);
}
