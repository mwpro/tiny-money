using System.Collections.Generic;

namespace MW.TinyMoney.Api.Categories.ApiModels;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public bool IsIncome { get; set; }
    public IEnumerable<SubcategoryDto> Subcategories { get; set; }
}

public class DetailedCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public bool IsIncome { get; set; }
    public bool IsDeleted { get; set; }
    public IEnumerable<DetailedSubcategoryDto> Subcategories { get; set; }
}
