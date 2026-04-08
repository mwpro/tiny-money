using System;
using System.Collections.Generic;
using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public class SavingsGoal
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal TargetAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public bool IsArchived { get; set; }
    public IReadOnlyCollection<int> CategoryIds { get; set; } = [];

    public SavingsGoalResponseModel ToResponseModel() => new()
    {
        Id = Id,
        Name = Name,
        TargetAmount = TargetAmount,
        TargetDate = TargetDate?.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture),
        IsArchived = IsArchived,
        CategoryIds = CategoryIds
    };
}
