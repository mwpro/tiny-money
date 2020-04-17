using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MW.TinyMoney.Api.Reports
{
    [ApiController, Route("/api/reports"), Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportsProvider _categoriesStore;

        public ReportsController(IReportsProvider categoriesStore)
        {
            _categoriesStore = categoriesStore;
        }

        [HttpGet, Route("expensesByMonth")]
        //[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<CategoryDto>))]
        public async Task<IActionResult> GetExpensesByMonthReport()
        {
//            var result = _categoriesStore.GetCategories().Select(x => new CategoryDto() 
//            {
//                Id = x.Id,
//                Name = x.Name,
//                Subcategories = x.Subcategories.Select(s => new SubcategoryDto()
//                {
//                    Id = s.Id,
//                    Name = s.Name
//                })
//            });
            return Ok();
        }
    }
}
