using System.Collections.Generic;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SavingsGoalResponseModel
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal TargetAmount { get; set; }
    public string TargetDate { get; set; }
    public bool IsArchived { get; set; }
    public IReadOnlyCollection<int> CategoryIds { get; set; } = [];
}
