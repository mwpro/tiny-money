using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
namespace MW.TinyMoney.Api.Import;

[ApiController, Route("/api/transactions/import"), Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},ApiKey")]
public class ImportController : Controller
{
    private readonly IImportService _importService;

    public ImportController(IImportService importService)
    {
        _importService = importService;
    }

    public record ImportBankStatementResponse(int NumberOfImportedTransactions, int NumberOfPossibleDuplicates);

    [HttpPost("file")]
    [RequestSizeLimit(1 * 1024 * 1024)]
    [ProducesResponseType(typeof(ImportBankStatementResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> ImportFile(IFormFile file, [FromForm] string fileType, CancellationToken ct)
    {
        var result = await _importService.ImportFile(file.OpenReadStream(), fileType, ct);

        return result switch
        {
            CommandSuccess<ImportResult> success => StatusCode(StatusCodes.Status201Created,
                new ImportBankStatementResponse(success.Result.NumberOfImportedTransactions, success.Result.NumberOfPossibleDuplicates)),
            InvalidInputResult<ImportResult> invalid => BadRequest(invalid.Reason),
            _ => StatusCode(StatusCodes.Status500InternalServerError)
        };
    }
}
