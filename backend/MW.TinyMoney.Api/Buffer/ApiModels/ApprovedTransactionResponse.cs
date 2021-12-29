using System.Collections.Generic;

namespace MW.TinyMoney.Api.Buffer.ApiModels
{
    public class ApprovedTransactionResponse
    {
        public ApprovedTransactionResponse()
        {
            NewTags = new List<TagDto>();
        }

        public Transaction.ApiModels.Transaction Transaction { get; set; }
        public IList<TagDto> NewTags { get; set; }
        public VendorDto NewVendor { get; set; }
    }
}
