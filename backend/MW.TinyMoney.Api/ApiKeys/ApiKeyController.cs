using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MW.TinyMoney.Api.ApiKeys;

[ApiController, Route("/api/apikeys"), Authorize]
public class ApiKeyController : Controller
{
    private readonly IApiKeyStore _apiKeyStore;

    public ApiKeyController(IApiKeyStore apiKeyStore)
    {
        _apiKeyStore = apiKeyStore;
    }

    private string UserId => User.FindFirstValue("sub")
        ?? User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetApiKeys()
    {
        var keys = await _apiKeyStore.GetByUser(UserId);
        return Ok(keys);
    }

    public record CreateApiKeyRequest(string Name);
    public record CreateApiKeyResponse(int Id, string Name, string KeyPrefix, string RawKey);

    [HttpPost]
    [ProducesResponseType(typeof(CreateApiKeyResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        var rawBytes = RandomNumberGenerator.GetBytes(32);
        var base64 = Convert.ToBase64String(rawBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var rawKey = "tm_" + base64;

        var keyHash = ApiKeyAuthenticationHandler.ComputeHash(rawKey);
        var keyPrefix = rawKey[..8];

        var id = await _apiKeyStore.Create(request.Name, keyHash, keyPrefix, UserId);
        return StatusCode(StatusCodes.Status201Created, new CreateApiKeyResponse(id, request.Name, keyPrefix, rawKey));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteApiKey(int id)
    {
        await _apiKeyStore.Delete(id, UserId);
        return NoContent();
    }
}
