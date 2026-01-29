using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Categories.ApiModels;

namespace MW.TinyMoney.Api.Categories
{
    [ApiController, Route("/api/categories"), Authorize]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoriesStore _categoriesStore;

        public CategoriesController(ICategoriesStore categoriesStore)
        {
            _categoriesStore = categoriesStore;
        }

        [HttpGet, Route("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<CategoryDto>))]
        public async Task<IActionResult> GetCategories(bool useV2 = false)
        {
            var categories = await _categoriesStore.GetCategories();
            return Ok(categories.Select(x => x.ToDto()));
        }
    }
}
