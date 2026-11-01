using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public record TextField(
    [property: JsonPropertyName("instructions")] string Instructions)
{
    [JsonPropertyName("type")]
    public string Type => "text";
}

public record TextAnswer(
    [property: JsonPropertyName("value")] string Value,
    [property: JsonPropertyName("confidence")] decimal? Confidence);

public record ExtractionsUsage(
    [property: JsonPropertyName("input_tokens")] int InputTokens,
    [property: JsonPropertyName("cost")] decimal? Cost);

public record ExtractionsResponse(
    [property: JsonPropertyName("model")] string Model,
    [property: JsonPropertyName("answers")] IReadOnlyDictionary<string, TextAnswer> Answers,
    [property: JsonPropertyName("usage")] ExtractionsUsage Usage);

public interface IExtractionsClient
{
    Task<ExtractionsResponse> Extract(string state, IReadOnlyDictionary<string, TextField> fields, CancellationToken ct);
}

public class OpenRouterExtractionsClient : IExtractionsClient
{
    private readonly HttpClient _httpClient;
    private readonly OpenRouterOptions _options;

    public OpenRouterExtractionsClient(HttpClient httpClient, IOptions<OpenRouterOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }
    
    public async Task<ExtractionsResponse> Extract(string state, IReadOnlyDictionary<string, TextField> fields, CancellationToken ct)
    {
        using var response = await _httpClient.PostAsJsonAsync("/api/alpha/extractions",
            new { model = _options.Model, state, fields }, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"Extractions API returned {(int)response.StatusCode}: {body}");
        }

        return await response.Content.ReadFromJsonAsync<ExtractionsResponse>(ct)
               ?? throw new InvalidOperationException("Extractions API returned an empty body");
    }
}
