using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public class SavingsCategory
{
    public int Id { get; set; }
    public string Name { get; set; }

    public SavingsCategoryResponseModel ToResponseModel() => new() { Id = Id, Name = Name };
}
