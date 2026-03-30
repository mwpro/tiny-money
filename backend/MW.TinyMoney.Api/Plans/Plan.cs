
using System;
using System.Collections.Generic;
using System.Linq;
using MW.TinyMoney.Api.Plans.ApiModels;

namespace MW.TinyMoney.Api.Plans;

public class Plan
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public IList<PlanTag> TagLines { get; set; } = new List<PlanTag>();

    public decimal TotalBudget => TagLines.Sum(t => t.Amount);
    public decimal TotalSpent => TagLines.Sum(t => t.Spent);

    public PlanResponse ToResponseModel() => new PlanResponse
    {
        Id = Id,
        Title = Title,
        Description = Description,
        DateFrom = DateFrom,
        DateTo = DateTo,
        TotalBudget = TotalBudget,
        TotalSpent = TotalSpent,
        SpentPercent = TotalBudget > 0 ? TotalSpent / TotalBudget * 100m : 0m,
        TagLines = TagLines.Select(t => t.ToResponseModel())
    };
}

public class PlanTag
{
    public int TagId { get; set; }
    public string TagName { get; set; }
    public decimal Amount { get; set; }
    public string TagDescription { get; set; }
    public decimal Spent { get; set; }
    
    public PlanTagResponse ToResponseModel() => new()
    {
        TagId = TagId,
        TagName = TagName,
        Amount = Amount,
        Description = TagDescription,
        Spent = Spent,
        SpentPercent = Amount > 0 ? Spent / Amount * 100m : 0m
    };
}