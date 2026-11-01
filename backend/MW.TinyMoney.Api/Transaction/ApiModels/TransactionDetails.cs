using MW.TinyMoney.Api.AiSuggestions;

namespace MW.TinyMoney.Api.Transaction.ApiModels;

/// <summary>
/// Single transaction as returned by <c>GET /api/transactions/{id}</c>, with the latest AI suggestion for unverified transactions.
/// </summary>
public class TransactionDetails : Transaction
{
    public AiSuggestionDto AiSuggestion { get; set; }

    public static TransactionDetails From(Transaction transaction, AiSuggestionDto aiSuggestion) => new()
    {
        Id = transaction.Id,
        Amount = transaction.Amount,
#pragma warning disable CS0612
        CreatedBy = transaction.CreatedBy,
#pragma warning restore CS0612
        CreatedDate = transaction.CreatedDate,
        Description = transaction.Description,
        IsExpense = transaction.IsExpense,
        ModifiedDate = transaction.ModifiedDate,
        TransactionDate = transaction.TransactionDate,
        VendorId = transaction.VendorId,
        VendorName = transaction.VendorName,
        SubcategoryId = transaction.SubcategoryId,
        SubcategoryName = transaction.SubcategoryName,
        CategoryName = transaction.CategoryName,
        Tags = transaction.Tags,
        IsVerified = transaction.IsVerified,
        IsPossibleDuplicate = transaction.IsPossibleDuplicate,
        AiSuggestion = aiSuggestion
    };
}
