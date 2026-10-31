using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Channels;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public interface IAiSuggestionQueue
{
    void EnqueueUnrecognized(IEnumerable<Transaction.ApiModels.Transaction> transactions);
    IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct);
}

public class AiSuggestionQueue : IAiSuggestionQueue
{
    private const int Capacity = 1000;

    private readonly Channel<int> _channel = Channel.CreateBounded<int>(
        new BoundedChannelOptions(Capacity) { SingleReader = true, FullMode = BoundedChannelFullMode.Wait });

    private readonly bool _isEnabled;
    private readonly ILogger<AiSuggestionQueue> _logger;

    public AiSuggestionQueue(IOptions<OpenRouterOptions> options, ILogger<AiSuggestionQueue> logger)
    {
        _isEnabled = options.Value.IsEnabled;
        _logger = logger;
    }

    public void EnqueueUnrecognized(IEnumerable<Transaction.ApiModels.Transaction> transactions)
    {
        if (!_isEnabled)
            return;

        var transactionIds = transactions
            .Where(t => t.VendorId == null && !string.IsNullOrWhiteSpace(t.Description))
            .Select(t => t.Id);
        foreach (var transactionId in transactionIds)
        {
            if (!_channel.Writer.TryWrite(transactionId))
                _logger.LogWarning("AI suggestion queue is full, dropping transaction {TransactionId}", transactionId);
        }
    }

    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);
}
