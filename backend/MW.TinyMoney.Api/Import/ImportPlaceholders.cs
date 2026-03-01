namespace MW.TinyMoney.Api.Import;

public static class ImportPlaceholders
{
    public static int VendorId { get; private set; }
    public static int SubcategoryId { get; private set; }

    public static void Setup(int vendorId, int subcategoryId)
    {
        VendorId = vendorId;
        SubcategoryId = subcategoryId;
    }
}
