using System.Threading.Tasks;
using MW.TinyMoney.Api.Buffer;

namespace MW.TinyMoney.Api.Import;

public record ImportRequest(string FileContent, string FileType);
public record ImportResult(int NumberOfImportedTransactions, int NumberOfPossibleDuplicates);

public interface IImportService
{
    Task<ICommandResult<ImportResult>> ImportAsync(ImportRequest request);
}
