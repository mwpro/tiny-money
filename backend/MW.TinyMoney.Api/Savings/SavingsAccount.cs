using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public class SavingsAccount
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public bool IsActive { get; set; }

    public SavingsAccountResponseModel ToResponseModel() => new()
    {
        Id = Id,
        Name = Name,
        CategoryId = CategoryId,
        CategoryName = CategoryName,
        IsActive = IsActive
    };
}
