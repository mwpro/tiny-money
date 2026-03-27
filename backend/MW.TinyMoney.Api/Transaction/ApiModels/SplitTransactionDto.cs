using System.Collections.Generic;
using MW.TinyMoney.Api.Tags.ApiModels;
using MW.TinyMoney.Api.Vendors.ApiModels;

namespace MW.TinyMoney.Api.Transaction.ApiModels;

public class SplitTransactionDto
{
    public IEnumerable<SplitPartDto> Splits { get; set; }
}

public class SplitPartDto
{
    public decimal Amount { get; set; }
    public bool IsExpense { get; set; }
    public int? SubcategoryId { get; set; }
    public VendorDto Vendor { get; set; }
    public IEnumerable<TagDto> Tags { get; set; }
}
