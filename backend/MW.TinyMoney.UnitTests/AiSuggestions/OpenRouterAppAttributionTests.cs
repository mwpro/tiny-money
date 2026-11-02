using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Hosting.Internal;
using MW.TinyMoney.Api.AiSuggestions;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class OpenRouterAppAttributionTests
{
    [Theory]
    [InlineData("1.0.0", "1.0.0")]
    [InlineData("1.0.0+80fed8e1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7", "1.0.0+80fed8e")]
    [InlineData(null, "unknown")]
    [InlineData("", "unknown")]
    public void ShortensCommitHashInVersion(string informationalVersion, string expected)
    {
        AiSuggestionsServiceCollectionExtensions.AppVersion(informationalVersion).Should().Be(expected);
    }

    [Fact]
    public void BuildsRefererFromEnvironmentAndVersion()
    {
        AiSuggestionsServiceCollectionExtensions.AppReferer("Production", "1.0.0+80fed8e")
            .Should().Be("production.tinymoney/1.0.0+80fed8e");
    }

    [Fact]
    public void SendsAttributionHeaders_AndHidesApp()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string>
            {
                ["OpenRouter:ApiKey"] = "test-key", ["OpenRouter:BaseUrl"] = "https://openrouter.ai"
            })
            .Build();
        var services = new ServiceCollection()
            .AddLogging()
            .AddSingleton<IHostEnvironment>(new HostingEnvironment
            {
                EnvironmentName = "Production", ApplicationName = "MW.TinyMoney.Api"
            })
            .AddAiSuggestions(configuration)
            .BuildServiceProvider();

        var client = services.GetRequiredService<IHttpClientFactory>().CreateClient(nameof(ILLMClient));

        var headers = client.DefaultRequestHeaders;
        headers.Authorization!.ToString().Should().Be("Bearer test-key");
        headers.GetValues("HTTP-Referer").Single().Should().StartWith("production.tinymoney/");
        headers.GetValues("X-OpenRouter-Title").Single().Should().MatchRegex(@"^MW\.TinyMoney\.Api .+ \(Production\)$");
        headers.GetValues("X-OpenRouter-App-Visibility").Single().Should().Be("hidden");
    }
}
