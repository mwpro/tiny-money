using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public record ChoiceQuestion(
    [property: JsonPropertyName("instructions")] string Instructions,
    [property: JsonPropertyName("criteria")] IReadOnlyDictionary<string, string> Criteria)
{
    [JsonPropertyName("type")]
    public string Type => "choice";
}

public record ChoiceAnswer(
    [property: JsonPropertyName("choice")] string Choice,
    [property: JsonPropertyName("confidence")] decimal Confidence);

public record DecisionsUsage(
    [property: JsonPropertyName("input_tokens")] int InputTokens,
    [property: JsonPropertyName("cost")] decimal? Cost);

public record DecisionsResponse(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("answers")] IReadOnlyDictionary<string, ChoiceAnswer> Answers,
    [property: JsonPropertyName("usage")] DecisionsUsage Usage);

/// <summary>
/// Client for OpenRouter's Decisions API (System One models such as Jev), which answers typed
/// questions about a state with probabilities instead of generating text.
/// </summary>
public interface IDecisionsClient
{
    Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct);
}

public class OpenRouterDecisionsClient : IDecisionsClient
{
    private readonly HttpClient _httpClient;
    private readonly OpenRouterOptions _options;

    public OpenRouterDecisionsClient(HttpClient httpClient, IOptions<OpenRouterOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    // BaseAddress and the Authorization header are configured in AddAiSuggestions
    public async Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct)
    {
        using var response = await _httpClient.PostAsJsonAsync("/api/alpha/decisions",
            new { model = _options.Model, state, questions }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"Decisions API returned {(int)response.StatusCode}: {body}");
        }

        return await response.Content.ReadFromJsonAsync<DecisionsResponse>(ct)
               ?? throw new InvalidOperationException("Decisions API returned an empty body");
    }
}
