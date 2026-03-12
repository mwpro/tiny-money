using System;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.ApiKeys;

public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IApiKeyStore _apiKeyStore;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IApiKeyStore apiKeyStore) : base(options, logger, encoder)
    {
        _apiKeyStore = apiKeyStore;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
            return AuthenticateResult.NoResult();

        var headerValue = authHeader.ToString();
        if (!headerValue.StartsWith("ApiKey ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var rawKey = headerValue["ApiKey ".Length..].Trim();
        if (string.IsNullOrEmpty(rawKey))
            return AuthenticateResult.NoResult();

        var hash = ComputeHash(rawKey);
        var record = await _apiKeyStore.FindByHash(hash);
        if (record is null)
            return AuthenticateResult.NoResult();

        ObserveKeyUsage(record);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, record.UserId),
            new Claim("sub", record.UserId)
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }

    private void ObserveKeyUsage(ApiKeyRecord record)
    {
        Task.Run(async () =>
        {
            try
            {
                await _apiKeyStore.UpdateLastUsed(record.Id);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to update last used timestamp for API key {ApiKeyId}", record.Id);
            }
        });
    }

    public static string ComputeHash(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
