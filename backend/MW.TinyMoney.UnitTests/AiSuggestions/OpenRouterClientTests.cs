using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.AiSuggestions;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class OpenRouterClientTests
{
    private static readonly ChatRequest Request = new("system prompt", "ZABKA Z1234", new { type = "object" });

    private readonly FakeHandler _handler = new();

    private OpenRouterClient CreateClient(OpenRouterOptions options = null) =>
        new(new HttpClient(_handler) { BaseAddress = new Uri("https://openrouter.test") },
            Options.Create(options ?? new OpenRouterOptions
            {
                ChatModel = "google/gemini-3.8-flash:floor",
                ChatProviderOrder = ["google-ai-studio/flex"],
                ChatMaxTokens = 500,
                ChatReasoningEffort = "low"
            }));

    private static string ChatBody(string content) => JsonSerializer.Serialize(new
    {
        model = "google/gemini-3.8-flash-20260902",
        choices = new[] { new { message = new { content } } },
        usage = new { prompt_tokens = 200, completion_tokens = 15, cost = 0.0001m }
    });

    [Fact]
    public async Task Complete_SendsChatSettingsFromOptions()
    {
        _handler.ResponseBody = ChatBody("""{"vendor":"Żabka"}""");

        await CreateClient().Complete<VendorNameAnswer>(Request, CancellationToken.None);

        _handler.LastPath.Should().Be("/api/v1/chat/completions");
        var body = JsonNode.Parse(_handler.LastBody)!;
        body["model"]!.GetValue<string>().Should().Be("google/gemini-3.8-flash:floor");
        body["max_tokens"]!.GetValue<int>().Should().Be(500);
        body["reasoning"]!["effort"]!.GetValue<string>().Should().Be("low");
        body["provider"]!["order"]![0]!.GetValue<string>().Should().Be("google-ai-studio/flex");
        body["messages"]![0]!["content"]!.GetValue<string>().Should().Be("system prompt");
        body["messages"]![1]!["content"]!.GetValue<string>().Should().Be("ZABKA Z1234");
        body["response_format"]!["json_schema"]!["strict"]!.GetValue<bool>().Should().BeTrue();
    }

    [Fact]
    public async Task Complete_OmitsReasoningAndProvider_WhenNotConfigured()
    {
        _handler.ResponseBody = ChatBody("""{"vendor":"Żabka"}""");

        await CreateClient(new OpenRouterOptions { ChatModel = "some/model" })
            .Complete<VendorNameAnswer>(Request, CancellationToken.None);

        var body = JsonNode.Parse(_handler.LastBody)!.AsObject();
        body.ContainsKey("reasoning").Should().BeFalse();
        body.ContainsKey("provider").Should().BeFalse();
    }

    [Fact]
    public async Task Complete_DeserializesAnswer()
    {
        _handler.ResponseBody = ChatBody("""{"vendor":"Żabka"}""");

        var result = await CreateClient().Complete<VendorNameAnswer>(Request, CancellationToken.None);

        result.Answer.Should().Be(new VendorNameAnswer("Żabka"));
        result.Model.Should().Be("google/gemini-3.8-flash-20260902");
        result.Usage.Should().Be(new ChatUsage(200, 15, 0.0001m));
    }

    [Fact]
    public async Task Complete_Throws_WhenContentIsNotJson()
    {
        _handler.ResponseBody = ChatBody("Żabka");

        var act = () => CreateClient().Complete<VendorNameAnswer>(Request, CancellationToken.None);

        await act.Should().ThrowAsync<JsonException>();
    }

    [Fact]
    public async Task Complete_Throws_WhenContentIsEmpty()
    {
        _handler.ResponseBody = ChatBody(null);

        var act = () => CreateClient().Complete<VendorNameAnswer>(Request, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Throws_WithResponseBody_OnErrorStatus()
    {
        _handler.StatusCode = HttpStatusCode.ServiceUnavailable;
        _handler.ResponseBody = """{"error":{"message":"no flex capacity"}}""";

        var act = () => CreateClient().Complete<VendorNameAnswer>(Request, CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>().WithMessage("*503*no flex capacity*");
    }

    private class FakeHandler : HttpMessageHandler
    {
        public HttpStatusCode StatusCode { get; set; } = HttpStatusCode.OK;
        public string ResponseBody { get; set; }
        public string LastPath { get; private set; }
        public string LastBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            LastPath = request.RequestUri!.AbsolutePath;
            LastBody = await request.Content!.ReadAsStringAsync(ct);
            return new HttpResponseMessage(StatusCode)
            {
                Content = new StringContent(ResponseBody ?? "", Encoding.UTF8, "application/json")
            };
        }
    }
}
