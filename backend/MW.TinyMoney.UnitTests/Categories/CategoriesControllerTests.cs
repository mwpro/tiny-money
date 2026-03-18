using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Categories.ApiModels;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.Categories;

public class CategoriesControllerTests
{
    private readonly CategoriesStoreStub _store;
    private readonly CategoriesController _controller;

    public CategoriesControllerTests()
    {
        _store = new CategoriesStoreStub();
        _controller = new CategoriesController(_store);
    }

    [Fact]
    public async Task CreateCategory_CallsStoreWithCorrectParameters()
    {
        var request = new CreateCategoryRequest { Name = "Jedzenie", IsIncome = false };

        var result = await _controller.CreateCategory(request);

        result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(201);
        _store.LastCreatedCategoryName.Should().Be("Jedzenie");
        _store.LastCreatedCategoryIsIncome.Should().BeFalse();
    }

    [Fact]
    public async Task CreateCategory_Income_SetsIsIncomeTrue()
    {
        var request = new CreateCategoryRequest { Name = "Wynagrodzenie", IsIncome = true };

        await _controller.CreateCategory(request);

        _store.LastCreatedCategoryIsIncome.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateCategory_FetchesThenSetsNameAndSaves()
    {
        _store.CategoryToReturn = new Category { Id = 5, Name = "Old name" };
        var request = new UpdateCategoryRequest { Name = "Nowa nazwa" };

        var result = await _controller.UpdateCategory(5, request);

        result.Should().BeOfType<OkResult>();
        _store.LastUpdatedCategoryId.Should().Be(5);
        _store.LastUpdatedCategoryName.Should().Be("Nowa nazwa");
    }

    [Fact]
    public async Task UpdateCategory_ReturnsNotFound_WhenCategoryNotFound()
    {
        _store.CategoryToReturn = null;
        var request = new UpdateCategoryRequest { Name = "Nowa nazwa" };

        var result = await _controller.UpdateCategory(99, request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteCategory_CallsStoreWithCategoryId()
    {
        _store.CategoryToReturn = new Category { Id = 3 };
        _store.CategoryHasSubcategoriesToReturn = false;

        var result = await _controller.DeleteCategory(3);

        result.Should().BeOfType<OkResult>();
        _store.LastDeletedCategoryId.Should().Be(3);
    }

    [Fact]
    public async Task DeleteCategory_ReturnsNotFound_WhenCategoryNotFound()
    {
        _store.CategoryToReturn = null;

        var result = await _controller.DeleteCategory(99);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteCategory_ReturnsConflict_WhenHasSubcategories()
    {
        _store.CategoryToReturn = new Category { Id = 3 };
        _store.CategoryHasSubcategoriesToReturn = true;

        var result = await _controller.DeleteCategory(3);

        result.Should().BeOfType<ConflictObjectResult>();
        _store.LastDeletedCategoryId.Should().Be(0);
    }

    [Fact]
    public async Task MoveCategoryUp_CallsStoreWithIdAndUpTrue()
    {
        var result = await _controller.MoveCategoryUp(7);

        result.Should().BeOfType<OkResult>();
        _store.LastMovedCategoryId.Should().Be(7);
        _store.LastMovedCategoryUp.Should().BeTrue();
    }

    [Fact]
    public async Task MoveCategoryDown_CallsStoreWithIdAndUpFalse()
    {
        var result = await _controller.MoveCategoryDown(7);

        result.Should().BeOfType<OkResult>();
        _store.LastMovedCategoryId.Should().Be(7);
        _store.LastMovedCategoryUp.Should().BeFalse();
    }

    [Fact]
    public async Task CreateSubcategory_CallsStoreWithCategoryIdAndName()
    {
        _store.CategoryToReturn = new Category { Id = 2 };
        var request = new CreateSubcategoryRequest { Name = "Dom" };

        var result = await _controller.CreateSubcategory(2, request);

        result.Should().BeOfType<StatusCodeResult>().Which.StatusCode.Should().Be(201);
        _store.LastCreatedSubcategoryCategoryId.Should().Be(2);
        _store.LastCreatedSubcategoryName.Should().Be("Dom");
    }

    [Fact]
    public async Task CreateSubcategory_ReturnsBadRequest_WhenParentNotFound()
    {
        _store.CategoryToReturn = null;
        var request = new CreateSubcategoryRequest { Name = "Dom" };

        var result = await _controller.CreateSubcategory(99, request);

        result.Should().BeOfType<BadRequestObjectResult>();
        _store.LastCreatedSubcategoryName.Should().BeNull();
    }

    [Fact]
    public async Task UpdateSubcategory_FetchesThenSetsFieldsAndSaves()
    {
        _store.SubcategoryToReturn = new Subcategory { Id = 10, Name = "Old", ParentCategoryId = 2 };
        _store.CategoryToReturn = new Category { Id = 4 };
        var request = new UpdateSubcategoryRequest { Name = "Miasto", ParentCategoryId = 4 };

        var result = await _controller.UpdateSubcategory(2, 10, request);

        result.Should().BeOfType<OkResult>();
        _store.LastUpdatedSubcategoryId.Should().Be(10);
        _store.LastUpdatedSubcategoryName.Should().Be("Miasto");
        _store.LastUpdatedSubcategoryParentCategoryId.Should().Be(4);
    }

    [Fact]
    public async Task UpdateSubcategory_ReturnsNotFound_WhenSubcategoryNotFound()
    {
        _store.SubcategoryToReturn = null;
        var request = new UpdateSubcategoryRequest { Name = "Miasto", ParentCategoryId = 4 };

        var result = await _controller.UpdateSubcategory(2, 99, request);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateSubcategory_ReturnsBadRequest_WhenParentNotFound()
    {
        _store.SubcategoryToReturn = new Subcategory { Id = 10, Name = "Old", ParentCategoryId = 2 };
        _store.CategoryToReturn = null;
        var request = new UpdateSubcategoryRequest { Name = "Miasto", ParentCategoryId = 99 };

        var result = await _controller.UpdateSubcategory(2, 10, request);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task DeleteSubcategory_CallsStoreWithId()
    {
        _store.SubcategoryToReturn = new Subcategory { Id = 15 };
        _store.SubcategoryHasUsagesToReturn = false;

        var result = await _controller.DeleteSubcategory(2, 15);

        result.Should().BeOfType<OkResult>();
        _store.LastDeletedSubcategoryId.Should().Be(15);
    }

    [Fact]
    public async Task DeleteSubcategory_ReturnsNotFound_WhenSubcategoryNotFound()
    {
        _store.SubcategoryToReturn = null;

        var result = await _controller.DeleteSubcategory(2, 99);

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteSubcategory_ReturnsConflict_WhenHasUsages()
    {
        _store.SubcategoryToReturn = new Subcategory { Id = 15 };
        _store.SubcategoryHasUsagesToReturn = true;

        var result = await _controller.DeleteSubcategory(2, 15);

        result.Should().BeOfType<ConflictObjectResult>();
        _store.LastDeletedSubcategoryId.Should().Be(0);
    }

    [Fact]
    public async Task MoveSubcategoryUp_CallsStoreWithCategoryIdAndIdAndUpTrue()
    {
        var result = await _controller.MoveSubcategoryUp(3, 12);

        result.Should().BeOfType<OkResult>();
        _store.LastMovedSubcategoryCategoryId.Should().Be(3);
        _store.LastMovedSubcategoryId.Should().Be(12);
        _store.LastMovedSubcategoryUp.Should().BeTrue();
    }

    [Fact]
    public async Task MoveSubcategoryDown_CallsStoreWithCategoryIdAndIdAndUpFalse()
    {
        var result = await _controller.MoveSubcategoryDown(3, 12);

        result.Should().BeOfType<OkResult>();
        _store.LastMovedSubcategoryCategoryId.Should().Be(3);
        _store.LastMovedSubcategoryId.Should().Be(12);
        _store.LastMovedSubcategoryUp.Should().BeFalse();
    }

    [Fact]
    public async Task CreateCategory_ReturnsBadRequest_WhenNameTooLong()
    {
        _controller.ModelState.AddModelError("Name", "The field Name must be a string or array type with a maximum length of '100'.");
        var request = new CreateCategoryRequest { Name = new string('x', 101), IsIncome = false };

        var result = await _controller.CreateCategory(request);

        result.Should().BeOfType<BadRequestObjectResult>();
        _store.LastCreatedCategoryName.Should().BeNull();
    }
}
