using System;
using System.Collections.Generic;
using MW.TinyMoney.Api.Tags.ApiModels;
using MW.TinyMoney.Api.Vendors.ApiModels;

namespace MW.TinyMoney.Api.Transaction.ApiModels;

public class MergeTransactionsDto
{
    public IEnumerable<int> TransactionIds { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Description { get; set; }
    public int SubcategoryId { get; set; }
    public VendorDto Vendor { get; set; }
    public IEnumerable<TagDto> Tags { get; set; }
}
