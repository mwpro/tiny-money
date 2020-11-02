using System;
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

        [HttpPost("{year}/{month}/subcategory/{subcategoryId}/amount")]
        public async Task<IActionResult> SetBudgetAmount([FromRoute]int year, [FromRoute]int month, [FromRoute]int subcategoryId, [FromBody]SetBudgetAmount budgetAmount)
        {
            throw new NotImplementedException();
            return Ok();
        }

        [HttpPost("{year}/{month}/subcategory/{subcategoryId}/notes")]
        public async Task<IActionResult> SetBudgetNotes([FromRoute]int year, [FromRoute]int month, [FromRoute]int subcategoryId, [FromBody]SetBudgetNotes budgetNotes)
        {
            throw new NotImplementedException();
            return Ok();
        }

        [HttpPost("{yearFrom}/{monthFrom}/copy/{yearTo}/{monthTo}")]
        public async Task<IActionResult> SetBudget([FromRoute]int year, [FromRoute]int month, [FromRoute]int yearTo, [FromRoute] int monthTo)
        {
            throw new NotImplementedException();
            return Ok();
        }
    }

}
