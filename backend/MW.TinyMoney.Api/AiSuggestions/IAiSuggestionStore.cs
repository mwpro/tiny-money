using System;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.AiSuggestions;

public class AiSuggestion
{
    public int Id { get; set; }
    public int TransactionId { get; set; }
    public int? SuggestedVendorId { get; set; }
    public string SuggestedVendorName { get; set; }
    public decimal? VendorConfidence { get; set; }
    public int? SuggestedSubcategoryId { get; set; }
    public decimal? SubcategoryConfidence { get; set; }
    public string Model { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface IAiSuggestionStore
{
    Task SaveSuggestion(AiSuggestion suggestion);
    Task<AiSuggestion> GetLatestSuggestion(int transactionId);
    Task RecordVerification(int transactionId, int? vendorId, int? subcategoryId);
}

public class MySqlAiSuggestionStore : IAiSuggestionStore
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public MySqlAiSuggestionStore(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    private const string SaveSuggestionQuery =
        """
        INSERT INTO transaction_ai_suggestion (transaction_id, suggested_vendor_id, suggested_vendor_name, vendor_confidence,
                                               suggested_subcategory_id, subcategory_confidence, model, created_at)
        VALUES (@transactionId, @suggestedVendorId, @suggestedVendorName, @vendorConfidence,
                @suggestedSubcategoryId, @subcategoryConfidence, @model, @createdAt);
        SELECT LAST_INSERT_ID();
        """;

    private const string GetLatestSuggestionQuery =
        """
        SELECT s.id, s.transaction_id AS transactionId,
               s.suggested_vendor_id AS suggestedVendorId,
               COALESCE(v.name, s.suggested_vendor_name) AS suggestedVendorName,
               s.vendor_confidence AS vendorConfidence,
               s.suggested_subcategory_id AS suggestedSubcategoryId,
               s.subcategory_confidence AS subcategoryConfidence,
               s.model, s.created_at AS createdAt
        FROM transaction_ai_suggestion s
        LEFT JOIN vendor v ON s.suggested_vendor_id = v.id
        WHERE s.transaction_id = @transactionId
        ORDER BY s.id DESC
        LIMIT 1
        """;

    private const string RecordVerificationQuery =
        """
        UPDATE transaction_ai_suggestion
        SET verified_at = @verifiedAt,
            vendor_correct = IF(suggested_vendor_id IS NULL, NULL, suggested_vendor_id <=> @vendorId),
            subcategory_correct = IF(suggested_subcategory_id IS NULL, NULL, suggested_subcategory_id <=> @subcategoryId)
        WHERE transaction_id = @transactionId AND verified_at IS NULL
        ORDER BY id DESC
        LIMIT 1
        """;

    public async Task SaveSuggestion(AiSuggestion suggestion)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        suggestion.Id = await connection.QuerySingleAsync<int>(SaveSuggestionQuery, suggestion);
    }

    public async Task<AiSuggestion> GetLatestSuggestion(int transactionId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<AiSuggestion>(GetLatestSuggestionQuery, new { transactionId });
    }

    public async Task RecordVerification(int transactionId, int? vendorId, int? subcategoryId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(RecordVerificationQuery,
            new { transactionId, vendorId, subcategoryId, verifiedAt = DateTime.UtcNow });
    }
}
