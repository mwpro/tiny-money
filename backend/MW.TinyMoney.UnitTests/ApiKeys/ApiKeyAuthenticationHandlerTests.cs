using System;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.ApiKeys;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.ApiKeys;

public class ApiKeyAuthenticationHandlerTests
{
    private readonly ApiKeyStoreStub _store = new();

    private async Task<AuthenticateResult> Authenticate(string? authorizationHeader)
    {
        var handler = new ApiKeyAuthenticationHandler(
            new OptionsMonitorStub<AuthenticationSchemeOptions>(new AuthenticationSchemeOptions()),
            NullLoggerFactory.Instance,
            UrlEncoder.Default,
            _store);

        var context = new DefaultHttpContext();
        if (authorizationHeader != null)
            context.Request.Headers.Authorization = authorizationHeader;

        var scheme = new AuthenticationScheme("ApiKey", null, typeof(ApiKeyAuthenticationHandler));
        await handler.InitializeAsync(scheme, context);
        return await handler.AuthenticateAsync();
    }

    [Fact]
    public async Task NoAuthorizationHeader_ReturnsNoResult()
    {
        var result = await Authenticate(null);
        result.None.Should().BeTrue();
    }

    [Fact]
    public async Task WrongScheme_ReturnsNoResult()
    {
        var result = await Authenticate("Bearer some-jwt-token");
        result.None.Should().BeTrue();
    }

    [Fact]
    public async Task UnknownKey_ReturnsNoResult()
    {
        _store.FindByHashResult = null;
        var result = await Authenticate("ApiKey tm_unknownkey123");
        result.None.Should().BeTrue();
    }

    [Fact]
    public async Task ValidKey_ReturnsSuccess_WithCorrectClaims()
    {
        _store.FindByHashResult = new ApiKeyRecord(42, "auth0|user123");

        var result = await Authenticate("ApiKey tm_validkey123456789");

        result.Succeeded.Should().BeTrue();
        result.Principal!.FindFirstValue(ClaimTypes.NameIdentifier).Should().Be("auth0|user123");
        result.Principal.FindFirstValue("sub").Should().Be("auth0|user123");
    }

    [Fact]
    public async Task ValidKey_PassesCorrectHashToStore()
    {
        _store.FindByHashResult = new ApiKeyRecord(42, "auth0|user123");
        var rawKey = "tm_validkey123456789";
        var expectedHash = ApiKeyAuthenticationHandler.ComputeHash(rawKey);

        await Authenticate($"ApiKey {rawKey}");

        _store.LastFindByHashArgument.Should().Be(expectedHash);
    }

    [Fact]
    public async Task ValidKey_CallsUpdateLastUsedWithCorrectId()
    {
        _store.FindByHashResult = new ApiKeyRecord(42, "auth0|user123");

        await Authenticate("ApiKey tm_validkey123456789");

        _store.UpdateLastUsedCalledWithId.Should().Be(42);
    }

    private class OptionsMonitorStub<T> : IOptionsMonitor<T>
    {
        private readonly T _value;
        public OptionsMonitorStub(T value) => _value = value;
        public T CurrentValue => _value;
        public T Get(string? name) => _value;
        public IDisposable OnChange(Action<T, string?> listener) => null!;
    }
}
