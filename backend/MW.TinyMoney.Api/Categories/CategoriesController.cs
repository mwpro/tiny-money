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

        [HttpGet("")]
        [ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(IEnumerable<CategoryDto>))]
        public async Task<IActionResult> GetCategories([FromQuery] bool? detailed = false)
        {
            if (detailed == true)
                return Ok((await _categoriesStore.GetDetailedCategories()).Select(x => x.ToDto()));
            return Ok((await _categoriesStore.GetCategories()).Select(x => x.ToDto(detailed: false)));
        }

        [HttpPost("")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            await _categoriesStore.CreateCategory(request.Name, request.IsIncome);
            return StatusCode((int)HttpStatusCode.Created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
        {
            var category = await _categoriesStore.GetCategoryById(id);
            if (category == null) return NotFound();
            category.Name = request.Name;
            await _categoriesStore.UpdateCategory(category);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            await _categoriesStore.DeleteCategory(id);
            return Ok();
        }

        [HttpPost("{id}/restore")]
        public async Task<IActionResult> RestoreCategory(int id)
        {
            var category = await _categoriesStore.GetCategoryById(id);
            if (category == null) return NotFound();
            category.DeletedAt = null;
            await _categoriesStore.UpdateCategory(category);
            return Ok();
        }

        [HttpPost("{id}/move-up")]
        public async Task<IActionResult> MoveCategoryUp(int id)
        {
            await _categoriesStore.MoveCategory(id, up: true);
            return Ok();
        }

        [HttpPost("{id}/move-down")]
        public async Task<IActionResult> MoveCategoryDown(int id)
        {
            await _categoriesStore.MoveCategory(id, up: false);
            return Ok();
        }

        [HttpPost("{categoryId}/subcategories")]
        public async Task<IActionResult> CreateSubcategory(int categoryId, [FromBody] CreateSubcategoryRequest request)
        {
            await _categoriesStore.CreateSubcategory(categoryId, request.Name);
            return StatusCode((int)HttpStatusCode.Created);
        }

        [HttpPut("{categoryId}/subcategories/{id}")]
        public async Task<IActionResult> UpdateSubcategory(int categoryId, int id, [FromBody] UpdateSubcategoryRequest request)
        {
            var subcategory = await _categoriesStore.GetSubcategoryById(id);
            if (subcategory == null) return NotFound();
            subcategory.Name = request.Name;
            subcategory.ParentCategoryId = request.ParentCategoryId;
            await _categoriesStore.UpdateSubcategory(subcategory);
            return Ok();
        }

        [HttpDelete("{categoryId}/subcategories/{id}")]
        public async Task<IActionResult> DeleteSubcategory(int categoryId, int id)
        {
            await _categoriesStore.DeleteSubcategory(id);
            return Ok();
        }

        [HttpPost("{categoryId}/subcategories/{id}/restore")]
        public async Task<IActionResult> RestoreSubcategory(int categoryId, int id)
        {
            var subcategory = await _categoriesStore.GetSubcategoryById(id);
            if (subcategory == null) return NotFound();
            subcategory.DeletedAt = null;
            await _categoriesStore.UpdateSubcategory(subcategory);
            return Ok();
        }

        [HttpPost("{categoryId}/subcategories/{id}/move-up")]
        public async Task<IActionResult> MoveSubcategoryUp(int categoryId, int id)
        {
            await _categoriesStore.MoveSubcategory(categoryId, id, up: true);
            return Ok();
        }

        [HttpPost("{categoryId}/subcategories/{id}/move-down")]
        public async Task<IActionResult> MoveSubcategoryDown(int categoryId, int id)
        {
            await _categoriesStore.MoveSubcategory(categoryId, id, up: false);
            return Ok();
        }
    }
}
