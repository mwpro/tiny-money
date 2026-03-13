using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
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
        [ProducesResponseType(typeof(BudgetResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBudget([FromRoute]int year, [FromRoute]int month, bool useV2 = false)
        {
            var monthlyBudget = await _budgetStore.GetMonthlyBudget(year, month);
            return Ok(new BudgetResponse() { MonthlyBudget = monthlyBudget });
        }
        
        [HttpGet("{year}/{month}/suggestions")]
        [ProducesResponseType(typeof(BudgetSuggestionsResponse), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBudgetSuggestions([FromRoute]int year, [FromRoute]int month)
        {
            var subcategoryBudgetSuggestions = await _budgetStore.GetBudgetSuggestions(year, month);
            return Ok(new BudgetSuggestionsResponse() { SubcategoryBudgetSuggestions = subcategoryBudgetSuggestions });
        }

        [HttpPost("{year}/{month}/subcategory/{subcategoryId}")]
        [ProducesResponseType(StatusCodes.Status202Accepted)]
        public async Task<IActionResult> SetBudget([FromRoute]int year, [FromRoute]int month, [FromRoute]int subcategoryId, [FromBody]SetBudget budget)
        {
            await _budgetStore.SetBudget(year, month, subcategoryId, budget.BudgetAmount, budget.Notes);
            return Accepted();
        }

        [HttpPost("{yearFrom}/{monthFrom}/copy/{yearTo}/{monthTo}")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        public async Task<IActionResult> CopyBudget([FromRoute]int yearFrom, [FromRoute]int monthFrom, [FromRoute]int yearTo, [FromRoute] int monthTo)
        {
            await _budgetStore.CopyBudget(yearFrom, monthFrom, yearTo, monthTo);
            return CreatedAtAction(nameof(GetBudget), new { year = yearTo, month = monthTo }, null);
        }
    }

}
