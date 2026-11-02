using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public class OpenRouterClient : ILLMClient
{
    private static readonly JsonSerializerOptions SerializerOptions =
        new(JsonSerializerDefaults.Web) { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };

    private record ChatMessage([property: JsonPropertyName("content")] string Content);

    private record ChatChoice([property: JsonPropertyName("message")] ChatMessage Message);

    private record ChatResponse(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("choices")] IReadOnlyList<ChatChoice> Choices,
        [property: JsonPropertyName("usage")] ChatUsage Usage);

    private readonly HttpClient _httpClient;
    private readonly OpenRouterOptions _options;

    public OpenRouterClient(HttpClient httpClient, IOptions<OpenRouterOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct) =>
        Post<DecisionsResponse>("/api/alpha/decisions", new { model = _options.DecisionModel, state, questions }, ct);

    public async Task<ChatResult<T>> Complete<T>(ChatRequest request, CancellationToken ct)
    {
        var body = new
        {
            model = _options.ChatModel,
            messages = new[]
            {
                new { role = "system", content = request.SystemPrompt },
                new { role = "user", content = request.UserMessage }
            },
            response_format = new
            {
                type = "json_schema",
                json_schema = new { name = "result", strict = true, schema = request.JsonSchema }
            },
            reasoning = string.IsNullOrWhiteSpace(_options.ChatReasoningEffort)
                ? null
                : new { effort = _options.ChatReasoningEffort },
            max_tokens = _options.ChatMaxTokens,
            provider = _options.ChatProviderOrder is { Length: > 0 } ? new { order = _options.ChatProviderOrder } : null
        };
        var response = await Post<ChatResponse>("/api/v1/chat/completions", body, ct);

        var content = response.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(content))
            throw new InvalidOperationException($"Chat model {response.Model} returned no content");
        var answer = JsonSerializer.Deserialize<T>(content, SerializerOptions);

        return new ChatResult<T>(response.Model, answer, response.Usage);
    }

    private async Task<TResponse> Post<TResponse>(string path, object body, CancellationToken ct)
    {
        using var response = await _httpClient.PostAsJsonAsync(path, body, SerializerOptions, ct);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"OpenRouter {path} returned {(int)response.StatusCode}: {error}");
        }

        return await response.Content.ReadFromJsonAsync<TResponse>(ct)
               ?? throw new InvalidOperationException($"OpenRouter {path} returned an empty body");
    }
}
