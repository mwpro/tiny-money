using System;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class PlanSummaryResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal SpentPercent { get; set; }
    public bool IsActive { get; set; }
}