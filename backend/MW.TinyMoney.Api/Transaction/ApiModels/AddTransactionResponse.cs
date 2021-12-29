using System.Collections.Generic;
using MW.TinyMoney.Api.Buffer.ApiModels;

namespace MW.TinyMoney.Api.Transaction.ApiModels
{
    public class AddTransactionResponse
    {
        public AddTransactionResponse()
        {
            NewTags = new List<TagDto>();
        }

        public Transaction Transaction { get; set; }
        public IList<TagDto> NewTags { get; set; }
        public VendorDto NewVendor { get; set; }
    }
}