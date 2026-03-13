using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Budget;

namespace MW.TinyMoney.Api.Reports;

[ApiController, Route("/api/reports/dashboard"), Authorize]
public class DashboardController : Controller
{
    private readonly IDashboardStore _dashboardStore;

    public DashboardController(IDashboardStore dashboardStore)
    {
        _dashboardStore = dashboardStore;
    }

    [HttpGet("{year}/{month}")]
    [ProducesResponseType(typeof(DashboardResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard([FromRoute] int year, [FromRoute] int month)
    {
        var dashboardData = await _dashboardStore.GetDashboardData(year, month);

        return Ok(new DashboardResponse
        {
            IncomesTotal = dashboardData.IncomesTotal,
            ExpensesTotal = dashboardData.ExpensesTotal,
            UnverifiedCount = dashboardData.UnverifiedCount,
            DailyExpenses = dashboardData.DailyExpenses,
            BudgetAmount = dashboardData.BudgetAmount,
            BudgetUsed = dashboardData.BudgetUsed,
            BudgetLeft = dashboardData.BudgetLeft,
            TopOverspentBudgetCategories = dashboardData.TopOverspentBudgetCategories,
            TopRemainingBudgetCategories = dashboardData.TopRemainingBudgetCategories
        });
    }
}