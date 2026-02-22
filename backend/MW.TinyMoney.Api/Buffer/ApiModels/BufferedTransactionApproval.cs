using System;
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class VendorDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public int? DefaultSubcategoryId { get; set; }
    }
    public class VendorDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int DefaultSubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        public string CategoryName { get; set; }
        public bool IsIncomeCategory { get; set; }
        public int NumberOfTransactions { get; set; }
        public DateTime LastTransactionDate { get; set; }
    }

    public class TagDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
    }

    public class NewTagDto
    {
        public string Name { get; set; }
    }

    public class TagDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int NumberOfTransactions { get; set; }
    }

    public class BufferedTransactionApproval
    {
        public BufferedTransactionApproval()
        {
            Tags = new List<TagDto>();
        }

        public DateTime? TransactionDate { get; set; }
        public string Description { get; set; }

        public VendorDto Vendor { get; set; }
        public int SubcategoryId { get; set; }
        public IEnumerable<TagDto> Tags { get; set; }
    }
}
