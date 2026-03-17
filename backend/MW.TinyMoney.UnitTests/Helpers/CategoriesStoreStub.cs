using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Categories;

namespace MW.TinyMoney.UnitTests.Helpers;

public class CategoriesStoreStub : ICategoriesStore
{
    public IReadOnlyCollection<Category> Categories { get; set; } = new List<Category>();
    public IReadOnlyCollection<Category> DetailedCategories { get; set; } = new List<Category>();

    public Category CategoryToReturn { get; set; }
    public Subcategory SubcategoryToReturn { get; set; }

    public string LastCreatedCategoryName { get; private set; }
    public bool LastCreatedCategoryIsIncome { get; private set; }

    public Category LastUpdatedCategory { get; private set; }
    public int LastUpdatedCategoryId => LastUpdatedCategory?.Id ?? 0;
    public string LastUpdatedCategoryName => LastUpdatedCategory?.Name;

    public int LastDeletedCategoryId { get; private set; }

    public int LastMovedCategoryId { get; private set; }
    public bool LastMovedCategoryUp { get; private set; }

    public int LastCreatedSubcategoryCategoryId { get; private set; }
    public string LastCreatedSubcategoryName { get; private set; }

    public Subcategory LastUpdatedSubcategory { get; private set; }
    public int LastUpdatedSubcategoryId => LastUpdatedSubcategory?.Id ?? 0;
    public string LastUpdatedSubcategoryName => LastUpdatedSubcategory?.Name;
    public int LastUpdatedSubcategoryParentCategoryId => LastUpdatedSubcategory?.ParentCategoryId ?? 0;

    public int LastDeletedSubcategoryId { get; private set; }

    public int LastMovedSubcategoryCategoryId { get; private set; }
    public int LastMovedSubcategoryId { get; private set; }
    public bool LastMovedSubcategoryUp { get; private set; }

    public Task<IReadOnlyCollection<Category>> GetCategories() =>
        Task.FromResult(Categories);

    public Task<IReadOnlyCollection<Category>> GetDetailedCategories() =>
        Task.FromResult(DetailedCategories);

    public Task<Category> GetCategoryById(int id) =>
        Task.FromResult(CategoryToReturn);

    public Task<Subcategory> GetSubcategoryById(int id) =>
        Task.FromResult(SubcategoryToReturn);

    public Task CreateCategory(string name, bool isIncome)
    {
        LastCreatedCategoryName = name;
        LastCreatedCategoryIsIncome = isIncome;
        return Task.CompletedTask;
    }

    public Task UpdateCategory(Category category)
    {
        LastUpdatedCategory = category;
        return Task.CompletedTask;
    }

    public Task DeleteCategory(int id)
    {
        LastDeletedCategoryId = id;
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

    public Task UpdateSubcategory(Subcategory subcategory)
    {
        LastUpdatedSubcategory = subcategory;
        return Task.CompletedTask;
    }

    public Task DeleteSubcategory(int id)
    {
        LastDeletedSubcategoryId = id;
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
