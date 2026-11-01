using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.Transaction;

namespace MW.TinyMoney.Api.AiSuggestions;

[ApiController, Route("/api/transactions/{transactionId}/ai-suggestion"), Authorize]
public class AiSuggestionsController : Controller
{
    private readonly ITransactionStore _transactionStore;
    private readonly IAiSuggestionService _suggestionService;
    private readonly OpenRouterOptions _options;

    public AiSuggestionsController(ITransactionStore transactionStore, IAiSuggestionService suggestionService,
        IOptions<OpenRouterOptions> options)
    {
        _transactionStore = transactionStore;
        _suggestionService = suggestionService;
        _options = options.Value;
    }

    [HttpPost("")]
    [ProducesResponseType(typeof(AiSuggestionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CreateSuggestion([FromRoute] int transactionId, CancellationToken ct)
    {
        if (!_options.IsEnabled)
            return NoContent();

        var transaction = await _transactionStore.GetTransaction(transactionId);
        if (transaction == null)
            return NotFound();
        if (transaction.IsVerified)
            return BadRequest("Cannot suggest for a verified transaction.");

        var suggestion = await _suggestionService.Suggest(transaction, ct);
        return Ok(AiSuggestionDto.From(suggestion, _options.MinConfidence));
    }
}
