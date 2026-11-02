using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Channels;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public interface IAiSuggestionQueue
{
    int EnqueueUnrecognized(IEnumerable<Transaction.ApiModels.Transaction> transactions);
    IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct);
    void MarkProcessed();
    int Pending { get; }
}

public class AiSuggestionQueue : IAiSuggestionQueue
{
    private const int Capacity = 1000;

    private readonly Channel<int> _channel = Channel.CreateBounded<int>(
        new BoundedChannelOptions(Capacity) { SingleReader = true, FullMode = BoundedChannelFullMode.Wait });

    private readonly bool _isEnabled;
    private readonly ILogger<AiSuggestionQueue> _logger;
    private int _pending;

    public AiSuggestionQueue(IOptions<OpenRouterOptions> options, ILogger<AiSuggestionQueue> logger)
    {
        _isEnabled = options.Value.IsEnabled;
        _logger = logger;
    }

    public int Pending => Volatile.Read(ref _pending);

    public int EnqueueUnrecognized(IEnumerable<Transaction.ApiModels.Transaction> transactions)
    {
        if (!_isEnabled)
            return 0;

        var transactionIds = transactions
            .Where(t => t.VendorId == null && !string.IsNullOrWhiteSpace(t.Description))
            .Select(t => t.Id);
        var queued = 0;
        foreach (var transactionId in transactionIds)
        {
            Interlocked.Increment(ref _pending);
            if (_channel.Writer.TryWrite(transactionId))
            {
                queued++;
            }
            else
            {
                Interlocked.Decrement(ref _pending);
                _logger.LogWarning("AI suggestion queue is full, dropping transaction {TransactionId}", transactionId);
            }
        }
        return queued;
    }

    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);

    public void MarkProcessed() => Interlocked.Decrement(ref _pending);
}
