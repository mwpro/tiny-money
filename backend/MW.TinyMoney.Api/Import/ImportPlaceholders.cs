namespace MW.TinyMoney.Api.Import;

public static class ImportPlaceholders
{
    public const string ImportCreatedBy = "Import";
    public const string ApiCreatedBy = "API";

    public static int VendorId { get; private set; }
    public static int SubcategoryId { get; private set; }

    public static void Setup(int vendorId, int subcategoryId)
    {
        VendorId = vendorId;
        SubcategoryId = subcategoryId;
    }
}
