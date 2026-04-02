namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SavingsSnapshotEntryResponseModel
{
    public int AccountId { get; set; }
    public string AccountName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public decimal Balance { get; set; }
    public decimal Deposited { get; set; }
    public decimal Withdrawn { get; set; }
}
