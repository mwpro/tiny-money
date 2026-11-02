using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

[ApiController, Route("/api/ai-suggestions/status"), Authorize]
public class AiSuggestionStatusController : Controller
{
    private readonly IAiSuggestionQueue _queue;
    private readonly OpenRouterOptions _options;

    public AiSuggestionStatusController(IAiSuggestionQueue queue, IOptions<OpenRouterOptions> options)
    {
        _queue = queue;
        _options = options.Value;
    }

    [HttpGet("")]
    [ProducesResponseType(typeof(AiSuggestionStatusDto), StatusCodes.Status200OK)]
    public IActionResult GetStatus() => Ok(new AiSuggestionStatusDto(_options.IsEnabled, _queue.Pending));
}
