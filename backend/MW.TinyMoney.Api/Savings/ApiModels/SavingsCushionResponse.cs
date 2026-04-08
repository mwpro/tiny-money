using System.Collections.Generic;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SavingsCushionResponse
{
    public decimal CushionAmount { get; set; }
    public IReadOnlyCollection<int> CushionCategoryIds { get; set; } = [];
    public decimal AvgMonthlyExpenseThreeMonths { get; set; }
    public decimal AvgMonthlyExpenseSixMonths { get; set; }
    public decimal AvgMonthlyExpenseTwelveMonths { get; set; }
}
