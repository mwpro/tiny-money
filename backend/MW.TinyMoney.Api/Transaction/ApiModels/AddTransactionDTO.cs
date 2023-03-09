using System;
using System.Collections.Generic;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Transaction.ApiModels
{
    public class AddTransactionDto
    {
        public AddTransactionDto()
        {
            Tags = new List<TagDto>();
        }

        public decimal Amount { get; set; }
        public bool IsExpense { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Description { get; set; }

        public VendorDto Vendor { get; set; }
        public int SubcategoryId { get; set; }
        public IEnumerable<TagDto> Tags { get; set; }
    }
}