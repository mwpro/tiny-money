namespace MW.TinyMoney.Api.Categories.ApiModels;

public class UpdateSubcategoryRequest
{
    public string Name { get; set; }
    public int ParentCategoryId { get; set; }
}
