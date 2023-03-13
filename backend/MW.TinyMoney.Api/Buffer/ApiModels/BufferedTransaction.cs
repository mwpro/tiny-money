using System;
using System.Linq;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class BufferedTransaction
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public bool IsExpense { get; set; }
        public DateTime ImportDate { get; set; }
        public DateTime TransactionDate { get; set; }
        public string RawBankStatementDescription { get; set; }

        public Transaction.ApiModels.Transaction Approve(BufferedTransactionApproval bufferedTransactionApproval)
        {
            return new Transaction.ApiModels.Transaction()
            {
                Amount = Amount,
                IsExpense = IsExpense,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "Buffer",
                Description = bufferedTransactionApproval.Description,
                ModifiedDate = DateTime.UtcNow,
                SubcategoryId = bufferedTransactionApproval.SubcategoryId,
                TagIds = bufferedTransactionApproval.Tags.Select(x => x.Id.Value).ToList(),
                TransactionDate = bufferedTransactionApproval.TransactionDate ?? TransactionDate,
                VendorId = bufferedTransactionApproval.Vendor.Id.Value
            };  
        }
    }
}
