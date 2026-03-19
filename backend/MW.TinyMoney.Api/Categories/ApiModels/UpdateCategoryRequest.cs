using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Categories.ApiModels;

public class UpdateCategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }
}
