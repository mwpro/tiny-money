using System.Collections.Generic;

namespace MW.TinyMoney.Api.Dashboard
{
    public record DailyExpense(int Day, decimal Amount);

    public record CategoryBudgetSummary(string SubcategoryName, decimal Amount, decimal AmountLeft);

    public class DashboardResponse
    {
        public decimal IncomesTotal { get; set; }
        public decimal ExpensesTotal { get; set; }
        public decimal BudgetAmount { get; set; }
        public decimal BudgetUsed { get; set; }
        public decimal BudgetLeft { get; set; }
        public int UnverifiedCount { get; set; }
        public List<DailyExpense> DailyExpenses { get; set; } = [];
        public List<CategoryBudgetSummary> CategoryBudgets { get; set; } = [];
    }
}
