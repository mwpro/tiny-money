namespace MW.TinyMoney.Api.AiSuggestions;

public class OpenRouterOptions
{
    public const string SectionName = "OpenRouter";

    public string ApiKey { get; set; }
    public string DecisionModel { get; set; }
    public string ChatModel { get; set; }
    public string[] ChatProviderOrder { get; set; } = [];
    public int ChatMaxTokens { get; set; } = 1000;
    public string ChatReasoningEffort { get; set; }
    public string BaseUrl { get; set; }
    public decimal MinConfidence { get; set; }

    public bool IsEnabled => !string.IsNullOrWhiteSpace(ApiKey);
}
