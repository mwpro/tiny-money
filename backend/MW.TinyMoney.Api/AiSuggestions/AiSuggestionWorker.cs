using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MW.TinyMoney.Api.Transaction;

namespace MW.TinyMoney.Api.AiSuggestions;

public class AiSuggestionWorker : BackgroundService
{
    private const int MaxAttempts = 2;
    private const int MaxConcurrency = 3;

    private readonly IAiSuggestionQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AiSuggestionWorker> _logger;

    public TimeSpan RetryDelay { get; init; } = TimeSpan.FromSeconds(10);

    public AiSuggestionWorker(IAiSuggestionQueue queue, IServiceScopeFactory scopeFactory, ILogger<AiSuggestionWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var parallelOptions = new ParallelOptions { MaxDegreeOfParallelism = MaxConcurrency, CancellationToken = stoppingToken };
        await Parallel.ForEachAsync(_queue.ReadAllAsync(stoppingToken), parallelOptions,
            async (transactionId, ct) => await Process(transactionId, ct));
    }

    public async Task Process(int transactionId, CancellationToken ct)
    {
        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var transactionStore = scope.ServiceProvider.GetRequiredService<ITransactionStore>();
                var suggestionService = scope.ServiceProvider.GetRequiredService<IAiSuggestionService>();

                var transaction = await transactionStore.GetTransaction(transactionId);
                if (transaction == null || transaction.IsVerified)
                    return;

                await suggestionService.Suggest(transaction, ct);
                return;
            }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                if (attempt < MaxAttempts)
                {
                    _logger.LogWarning(ex, "AI suggestion for transaction {TransactionId} failed, retrying", transactionId);
                    await Task.Delay(RetryDelay, ct);
                }
                else
                {
                    _logger.LogError(ex, "AI suggestion for transaction {TransactionId} failed {Attempts} times, dropping",
                        transactionId, MaxAttempts);
                }
            }
        }
    }
}
