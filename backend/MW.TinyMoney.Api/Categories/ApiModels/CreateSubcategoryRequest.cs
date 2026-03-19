using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Categories.ApiModels;

public class CreateSubcategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }
}
