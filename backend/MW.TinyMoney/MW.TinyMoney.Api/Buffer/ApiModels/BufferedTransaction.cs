using System;
using System.Linq;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class BufferedTransaction
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime ImportDate { get; set; }
        public DateTime TransactionDate { get; set; }
        public string RawBankStatementDescription { get; set; }

        public Transaction.ApiModels.Transaction Approve(BufferedTransactionApproval bufferedTransactionApproval)
        {
            return new Transaction.ApiModels.Transaction()
            {
                Amount = bufferedTransactionApproval.Amount ?? Amount,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = "Buffer",
                Description = bufferedTransactionApproval.Description,
                IsExpense = true,
                ModifiedDate = DateTime.UtcNow,
                SubcategoryId = bufferedTransactionApproval.SubcategoryId,
                TagIds = bufferedTransactionApproval.TagIds,
                TransactionDate = bufferedTransactionApproval.TransactionDate ?? TransactionDate,
                VendorId = bufferedTransactionApproval.Vendor.Id.Value
            };  
        }
    }
}
