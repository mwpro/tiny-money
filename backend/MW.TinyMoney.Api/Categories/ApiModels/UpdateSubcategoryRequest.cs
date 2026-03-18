using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Categories.ApiModels;

public class UpdateSubcategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }
    public int ParentCategoryId { get; set; }
}
