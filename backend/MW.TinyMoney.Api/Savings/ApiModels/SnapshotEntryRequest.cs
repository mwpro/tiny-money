using System.ComponentModel.DataAnnotations;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public class SnapshotEntryRequest
{
    [Range(1, int.MaxValue)]
    public int AccountId { get; set; }

    public decimal Balance { get; set; }
    public decimal Deposited { get; set; }
    public decimal Withdrawn { get; set; }
}
