using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class CreateSavingsAccountRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }
}
