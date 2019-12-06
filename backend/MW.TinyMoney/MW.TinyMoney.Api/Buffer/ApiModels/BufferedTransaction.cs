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
    }
}
