using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

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

public record ChatRequest(string SystemPrompt, string UserMessage, object JsonSchema);

public record ChatUsage(
    [property: JsonPropertyName("prompt_tokens")] int PromptTokens,
    [property: JsonPropertyName("completion_tokens")] int CompletionTokens,
    [property: JsonPropertyName("cost")] decimal? Cost);

public record ChatResult<T>(string Model, T Answer, ChatUsage Usage);

public interface ILLMClient
{
    Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct);
    Task<ChatResult<T>> Complete<T>(ChatRequest request, CancellationToken ct);
}
