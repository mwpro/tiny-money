using System.Collections.Generic;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class UpdateSavingsCushionRequest
{
    public decimal CushionAmount { get; set; }
    public IReadOnlyCollection<int> CushionCategoryIds { get; set; } = [];
}
