namespace MW.TinyMoney.Api.AiSuggestions;

public class OpenRouterOptions
{
    public const string SectionName = "OpenRouter";

    public string ApiKey { get; set; }
    public string Model { get; set; }
    public string BaseUrl { get; set; }
    public decimal MinConfidence { get; set; }

    public bool IsEnabled => !string.IsNullOrWhiteSpace(ApiKey);
}
