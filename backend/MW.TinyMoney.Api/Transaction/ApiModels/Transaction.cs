using System;
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Transaction.ApiModels
{
    public class TransactionTag
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class Transaction
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        [Obsolete]
        public string CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
        public string Description { get; set; }
        public bool IsExpense { get; set; }
        public DateTime ModifiedDate { get; set; }
        public DateTime TransactionDate { get; set; }

        public int? VendorId { get; set; }
        public string VendorName { get; set; }
        public int? SubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        public string CategoryName { get; set; }
        public IList<int> TagIds { get; set; }
        public IList<TransactionTag> Tags { get; set; }
        public bool IsVerified { get; set; }
        public bool IsPossibleDuplicate { get; set; }
    }
}
