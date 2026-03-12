using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Budget;

namespace MW.TinyMoney.Api.Dashboard
{
    [ApiController, Route("/api/dashboard"), Authorize]
    public class DashboardController : Controller
    {
        private readonly IDashboardStore _dashboardStore;
        private readonly IBudgetStore _budgetStore;

        public DashboardController(IDashboardStore dashboardStore, IBudgetStore budgetStore)
        {
            _dashboardStore = dashboardStore;
            _budgetStore = budgetStore;
        }

        [HttpGet("{year}/{month}")]
        [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDashboard([FromRoute] int year, [FromRoute] int month)
        {
            var dashboardData = await _dashboardStore.GetDashboardData(year, month);
            var budget = await _budgetStore.GetMonthlyBudget(year, month);

            var categoryBudgets = budget.CategoryBudgets
                .SelectMany(c => c.SubcategoryBudgets)
                .Where(s => s.Amount > 0)
                .Select(s => new CategoryBudgetSummary(s.SubcategoryName, s.Amount, s.AmountLeft))
                .ToList();

            if (budget.Amount == 0)
            {
                return Ok(new DashboardResponse
                {
                    IncomesTotal = dashboardData.IncomesTotal,
                    ExpensesTotal = dashboardData.ExpensesTotal,
                    UnverifiedCount = dashboardData.UnverifiedCount,
                    DailyExpenses = [],
                    BudgetAmount = 0,
                    BudgetUsed = 0,
                    BudgetLeft = 0,
                    CategoryBudgets = categoryBudgets
                });
            }

            return Ok(new DashboardResponse
            {
                IncomesTotal = dashboardData.IncomesTotal,
                ExpensesTotal = dashboardData.ExpensesTotal,
                UnverifiedCount = dashboardData.UnverifiedCount,
                DailyExpenses = dashboardData.DailyExpenses,
                BudgetAmount = budget.Amount,
                BudgetUsed = budget.UsedAmount,
                BudgetLeft = budget.AmountLeft,
                CategoryBudgets = categoryBudgets
            });
        }
    }
}
