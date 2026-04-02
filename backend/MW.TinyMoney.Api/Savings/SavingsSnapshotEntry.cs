using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public class SavingsSnapshotEntry
{
    public int AccountId { get; set; }
    public string AccountName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public decimal Balance { get; set; }
    public decimal Deposited { get; set; }
    public decimal Withdrawn { get; set; }

    public SavingsSnapshotEntryResponseModel ToResponseModel() => new()
    {
        AccountId = AccountId,
        AccountName = AccountName,
        CategoryId = CategoryId,
        CategoryName = CategoryName,
        Balance = Balance,
        Deposited = Deposited,
        Withdrawn = Withdrawn
    };
}
