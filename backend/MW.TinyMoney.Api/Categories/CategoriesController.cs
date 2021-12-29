using System.Collections.Generic;
using System.Linq;
using System.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        public IActionResult GetCategories()
        {
            var result = _categoriesStore.GetCategories().Select(x => new CategoryDto() 
            {
                Id = x.Id,
                Name = x.Name,
                Subcategories = x.Subcategories.Select(s => new SubcategoryDto()
                {
                    Id = s.Id,
                    Name = s.Name
                })
            });
            return Ok(result);
        }
    }
}
