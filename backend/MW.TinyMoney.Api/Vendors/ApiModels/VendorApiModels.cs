namespace MW.TinyMoney.Api.Vendors.ApiModels;

public class VendorDto
{
    public int? Id { get; set; }
    public string Name { get; set; }
    public int? DefaultSubcategoryId { get; set; }
}

public class DeleteVendorRequest
{
    public int? MergeToVendorId { get; set; }
}