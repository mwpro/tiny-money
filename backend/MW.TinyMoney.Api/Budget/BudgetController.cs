using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Budget.ApiModels;

namespace MW.TinyMoney.Api.Budget
{
    [ApiController, Route("/api/budget"), Authorize]
    public class BudgetController : Controller
    {
        private readonly IBudgetStore _budgetStore;

        public BudgetController(IBudgetStore budgetStore)
        {
            _budgetStore = budgetStore;
        }

        [HttpGet("{year}/{month}")]
        public async Task<IActionResult> GetBudget([FromRoute]int year, [FromRoute]int month)
        {
            var monthlyBudget = await _budgetStore.GetMonthlyBudget(year, month);
            return Ok(new BudgetResponse() { BudgetEntries = monthlyBudget });
        }

        [HttpPost("{year}/{month}/subcategory/{subcategoryId}")]
        public async Task<IActionResult> SetBudget([FromRoute]int year, [FromRoute]int month, [FromRoute]int subcategoryId, [FromBody]SetBudget budget)
        {
            await _budgetStore.SetBudget(year, month, subcategoryId, budget.BudgetAmount, budget.Notes);
            return Accepted();
        }

        [HttpPost("{yearFrom}/{monthFrom}/copy/{yearTo}/{monthTo}")]
        public async Task<IActionResult> CopyBudget([FromRoute]int yearFrom, [FromRoute]int monthFrom, [FromRoute]int yearTo, [FromRoute] int monthTo)
        {
            await _budgetStore.CopyBudget(yearFrom, monthFrom, yearTo, monthTo);
            return CreatedAtAction(nameof(GetBudget), new { year = yearTo, month = monthTo }, null);
        }
    }

}
