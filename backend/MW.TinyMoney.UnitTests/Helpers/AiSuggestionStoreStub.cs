using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.AiSuggestions;

namespace MW.TinyMoney.UnitTests.Helpers;

public class AiSuggestionStoreStub : IAiSuggestionStore
{
    public List<AiSuggestion> SavedSuggestions { get; } = new();
    public List<(int transactionId, int? vendorId, int? subcategoryId)> RecordedVerifications { get; } = new();

    public Task SaveSuggestion(AiSuggestion suggestion)
    {
        suggestion.Id = SavedSuggestions.Count + 1;
        SavedSuggestions.Add(suggestion);
        return Task.CompletedTask;
    }

    public Task<AiSuggestion> GetLatestSuggestion(int transactionId)
        => Task.FromResult(SavedSuggestions.LastOrDefault(s => s.TransactionId == transactionId));

    public Task RecordVerification(int transactionId, int? vendorId, int? subcategoryId)
    {
        RecordedVerifications.Add((transactionId, vendorId, subcategoryId));
        return Task.CompletedTask;
    }
}
