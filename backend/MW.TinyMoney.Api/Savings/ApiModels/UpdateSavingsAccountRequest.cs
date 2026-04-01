using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class UpdateSavingsAccountRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; }

    [Range(1, int.MaxValue)]
    public int CategoryId { get; set; }

    public bool IsActive { get; set; }
}
