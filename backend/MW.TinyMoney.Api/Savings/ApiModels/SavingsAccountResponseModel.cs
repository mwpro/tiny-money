namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SavingsAccountResponseModel
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public bool IsActive { get; set; }
}
