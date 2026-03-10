using System.Collections.Generic;
using MW.TinyMoney.Api.Tags.ApiModels;
using MW.TinyMoney.Api.Vendors.ApiModels;

namespace MW.TinyMoney.Api.Transaction.ApiModels
{
    public record SuggestedAliasDto(string Alias, int VendorId);

    public class AddTransactionResponse
    {
        public AddTransactionResponse()
        {
            NewTags = new List<TagDto>();
        }

        public Transaction Transaction { get; set; }
        public IList<TagDto> NewTags { get; set; }
        public VendorDto NewVendor { get; set; }
        public SuggestedAliasDto SuggestedAlias { get; set; }
    }
}