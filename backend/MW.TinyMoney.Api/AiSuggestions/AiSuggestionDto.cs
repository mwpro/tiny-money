using System;

namespace MW.TinyMoney.Api.AiSuggestions;

public record AiSuggestionDto(int? VendorId, string VendorName, int? SubcategoryId, string Model, DateTime CreatedAt)
{
    public static AiSuggestionDto From(AiSuggestion suggestion, decimal minConfidence)
    {
        var vendorConfident = suggestion.VendorConfidence == null || suggestion.VendorConfidence >= minConfidence;
        var subcategoryConfident = suggestion.SubcategoryConfidence >= minConfidence;

        return new AiSuggestionDto(
            vendorConfident ? suggestion.SuggestedVendorId : null,
            vendorConfident ? suggestion.SuggestedVendorName : null,
            subcategoryConfident ? suggestion.SuggestedSubcategoryId : null,
            suggestion.Model,
            suggestion.CreatedAt);
    }
}
