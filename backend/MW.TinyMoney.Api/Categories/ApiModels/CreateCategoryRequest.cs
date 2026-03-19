using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Categories.ApiModels;

public class CreateCategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }
    public bool IsIncome { get; set; }
}
