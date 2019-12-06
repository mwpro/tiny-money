using System;
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class BufferedTransactionApproval
    {
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
        public string Description { get; set; }

        public int VendorId { get; set; }
        public int SubcategorId { get; set; }
        public IEnumerable<int> TagIds { get; set; }
    }
}
