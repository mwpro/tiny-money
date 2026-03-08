namespace MW.TinyMoney.Api.Import;

public static class TransactionPlaceholders
{
    public const string CreatedByImport = "Import";
    public const string CreatedByApi = "API";

    public static int UnknownVendorId { get; private set; }
    public static int UncategorizedSubcategoryId { get; private set; }

    public static void Setup(int vendorId, int subcategoryId)
    {
        UnknownVendorId = vendorId;
        UncategorizedSubcategoryId = subcategoryId;
    }
}
