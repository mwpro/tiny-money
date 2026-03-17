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
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoriesStore.GetCategories();
            return Ok(categories.Select(x => x.ToDto()));
        }

        [HttpPost, Route("")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            await _categoriesStore.CreateCategory(request.Name, request.IsIncome);
            return Ok();
        }

        [HttpPut, Route("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
        {
            await _categoriesStore.UpdateCategory(id, request.Name);
            return Ok();
        }

        [HttpDelete, Route("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            await _categoriesStore.DeleteCategory(id);
            return Ok();
        }

        [HttpPost, Route("{id}/restore")]
        public async Task<IActionResult> RestoreCategory(int id)
        {
            await _categoriesStore.RestoreCategory(id);
            return Ok();
        }

        [HttpPost, Route("{id}/move-up")]
        public async Task<IActionResult> MoveCategoryUp(int id)
        {
            await _categoriesStore.MoveCategory(id, up: true);
            return Ok();
        }

        [HttpPost, Route("{id}/move-down")]
        public async Task<IActionResult> MoveCategoryDown(int id)
        {
            await _categoriesStore.MoveCategory(id, up: false);
            return Ok();
        }

        [HttpPost, Route("{categoryId}/subcategories")]
        public async Task<IActionResult> CreateSubcategory(int categoryId, [FromBody] CreateSubcategoryRequest request)
        {
            await _categoriesStore.CreateSubcategory(categoryId, request.Name);
            return Ok();
        }

        [HttpPut, Route("{categoryId}/subcategories/{id}")]
        public async Task<IActionResult> UpdateSubcategory(int categoryId, int id, [FromBody] UpdateSubcategoryRequest request)
        {
            await _categoriesStore.UpdateSubcategory(id, request.Name, request.ParentCategoryId);
            return Ok();
        }

        [HttpDelete, Route("{categoryId}/subcategories/{id}")]
        public async Task<IActionResult> DeleteSubcategory(int categoryId, int id)
        {
            await _categoriesStore.DeleteSubcategory(id);
            return Ok();
        }

        [HttpPost, Route("{categoryId}/subcategories/{id}/restore")]
        public async Task<IActionResult> RestoreSubcategory(int categoryId, int id)
        {
            await _categoriesStore.RestoreSubcategory(id);
            return Ok();
        }

        [HttpPost, Route("{categoryId}/subcategories/{id}/move-up")]
        public async Task<IActionResult> MoveSubcategoryUp(int categoryId, int id)
        {
            await _categoriesStore.MoveSubcategory(categoryId, id, up: true);
            return Ok();
        }

        [HttpPost, Route("{categoryId}/subcategories/{id}/move-down")]
        public async Task<IActionResult> MoveSubcategoryDown(int categoryId, int id)
        {
            await _categoriesStore.MoveSubcategory(categoryId, id, up: false);
            return Ok();
        }
    }
}
