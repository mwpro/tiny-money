using System.Collections.Generic;

namespace MW.TinyMoney.Api.Reports;

public record ActivePlanSummary(int Id, string Title, decimal TotalBudget, decimal TotalSpent, decimal SpentPercent);

public record DailyExpense(int Day, decimal Amount, decimal BudgetLeft);

public record CategoryBudgetSummary(int SubcategoryId, string CategoryName, string SubcategoryName, decimal Amount, decimal AmountLeft, string Notes);

public class DashboardResponse
{
    public decimal IncomesTotal { get; set; }
    public decimal ExpensesTotal { get; set; }
    public decimal BudgetAmount { get; set; }
    public decimal BudgetUsed { get; set; }
    public decimal BudgetLeft { get; set; }
    public int UnverifiedCount { get; set; }
    public IReadOnlyCollection<DailyExpense> DailyExpenses { get; set; } = [];
    public IReadOnlyCollection<CategoryBudgetSummary> TopRemainingBudgetCategories { get; set; } = [];
    public IReadOnlyCollection<CategoryBudgetSummary> TopOverspentBudgetCategories { get; set; } = [];
    public IReadOnlyCollection<ActivePlanSummary> ActivePlans { get; set; } = [];
    public decimal TotalSavings { get; set; }
    public decimal CushionTarget { get; set; }
    public decimal CushionActual { get; set; }
}