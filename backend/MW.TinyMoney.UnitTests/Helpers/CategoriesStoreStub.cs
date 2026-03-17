using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Categories;

namespace MW.TinyMoney.UnitTests.Helpers;

public class CategoriesStoreStub : ICategoriesStore
{
    public IReadOnlyCollection<Category> Categories { get; set; } = new List<Category>();

    public string LastCreatedCategoryName { get; private set; }
    public bool LastCreatedCategoryIsIncome { get; private set; }

    public int LastUpdatedCategoryId { get; private set; }
    public string LastUpdatedCategoryName { get; private set; }

    public int LastDeletedCategoryId { get; private set; }
    public int LastRestoredCategoryId { get; private set; }

    public int LastMovedCategoryId { get; private set; }
    public bool LastMovedCategoryUp { get; private set; }

    public int LastCreatedSubcategoryCategoryId { get; private set; }
    public string LastCreatedSubcategoryName { get; private set; }

    public int LastUpdatedSubcategoryId { get; private set; }
    public string LastUpdatedSubcategoryName { get; private set; }
    public int LastUpdatedSubcategoryParentCategoryId { get; private set; }

    public int LastDeletedSubcategoryId { get; private set; }
    public int LastRestoredSubcategoryId { get; private set; }

    public int LastMovedSubcategoryCategoryId { get; private set; }
    public int LastMovedSubcategoryId { get; private set; }
    public bool LastMovedSubcategoryUp { get; private set; }

    public Task<IReadOnlyCollection<Category>> GetCategories() =>
        Task.FromResult(Categories);

    public Task CreateCategory(string name, bool isIncome)
    {
        LastCreatedCategoryName = name;
        LastCreatedCategoryIsIncome = isIncome;
        return Task.CompletedTask;
    }

    public Task UpdateCategory(int id, string name)
    {
        LastUpdatedCategoryId = id;
        LastUpdatedCategoryName = name;
        return Task.CompletedTask;
    }

    public Task DeleteCategory(int id)
    {
        LastDeletedCategoryId = id;
        return Task.CompletedTask;
    }

    public Task RestoreCategory(int id)
    {
        LastRestoredCategoryId = id;
        return Task.CompletedTask;
    }

    public Task MoveCategory(int id, bool up)
    {
        LastMovedCategoryId = id;
        LastMovedCategoryUp = up;
        return Task.CompletedTask;
    }

    public Task CreateSubcategory(int categoryId, string name)
    {
        LastCreatedSubcategoryCategoryId = categoryId;
        LastCreatedSubcategoryName = name;
        return Task.CompletedTask;
    }

    public Task UpdateSubcategory(int id, string name, int parentCategoryId)
    {
        LastUpdatedSubcategoryId = id;
        LastUpdatedSubcategoryName = name;
        LastUpdatedSubcategoryParentCategoryId = parentCategoryId;
        return Task.CompletedTask;
    }

    public Task DeleteSubcategory(int id)
    {
        LastDeletedSubcategoryId = id;
        return Task.CompletedTask;
    }

    public Task RestoreSubcategory(int id)
    {
        LastRestoredSubcategoryId = id;
        return Task.CompletedTask;
    }

    public Task MoveSubcategory(int categoryId, int id, bool up)
    {
        LastMovedSubcategoryCategoryId = categoryId;
        LastMovedSubcategoryId = id;
        LastMovedSubcategoryUp = up;
        return Task.CompletedTask;
    }
}
