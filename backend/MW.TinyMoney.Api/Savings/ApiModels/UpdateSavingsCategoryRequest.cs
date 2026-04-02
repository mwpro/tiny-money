using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class UpdateSavingsCategoryRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }
}
