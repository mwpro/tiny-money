using System;
using MW.TinyMoney.Api.Plans.ApiModels;

namespace MW.TinyMoney.Api.Plans;

public class PlanSummary
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalSpent { get; set; }
    
    public PlanSummaryResponse ToResponseModel()
    {
        var today = DateTime.UtcNow;
        return new PlanSummaryResponse
        {
            Id = Id,
            Title = Title,
            Description = Description,
            DateFrom = DateFrom,
            DateTo = DateTo,
            TotalBudget = TotalBudget,
            TotalSpent = TotalSpent,
            SpentPercent = TotalBudget > 0 ? TotalSpent / TotalBudget * 100m : 0m,
            IsActive = DateFrom <= today && (!DateTo.HasValue || DateTo.Value >= today)
        };
    }
}