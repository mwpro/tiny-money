using System;
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Plans.ApiModels;

public class PlanResponse
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal SpentPercent { get; set; }
    public IEnumerable<PlanTagResponse> TagLines { get; set; }
}