using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class AiSuggestionWorkerTests
{
    private readonly TransactionStoreStub _transactionStore = new();
    private readonly AiSuggestionServiceStub _suggestionService = new();
    private readonly AiSuggestionWorker _worker;

    public AiSuggestionWorkerTests()
    {
        var services = new ServiceCollection()
            .AddSingleton<ITransactionStore>(_transactionStore)
            .AddSingleton<IAiSuggestionService>(_suggestionService)
            .BuildServiceProvider();
        // Process() doesn't read the queue; ProcessesQueuedTransactions builds its own worker with a real one
        _worker = new AiSuggestionWorker(null, services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AiSuggestionWorker>.Instance) { RetryDelay = TimeSpan.Zero };
    }

    [Fact]
    public async Task SuggestsForUnverifiedTransaction()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);

        await _worker.Process(1, CancellationToken.None);

        _suggestionService.Calls.Should().Be(1);
    }

    [Fact]
    public async Task Skips_WhenTransactionVerifiedInTheMeantime()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(isVerified: true);

        await _worker.Process(1, CancellationToken.None);

        _suggestionService.Calls.Should().Be(0);
    }

    [Fact]
    public async Task Skips_WhenTransactionDeleted()
    {
        _transactionStore.Transaction = null;

        await _worker.Process(1, CancellationToken.None);

        _suggestionService.Calls.Should().Be(0);
    }

    [Fact]
    public async Task RetriesOnce_AfterFailure()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        _suggestionService.FailuresBeforeSuccess = 1;

        await _worker.Process(1, CancellationToken.None);

        _suggestionService.Calls.Should().Be(2);
        _suggestionService.Successes.Should().Be(1);
    }

    [Fact]
    public async Task DropsTransaction_AfterSecondFailure()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        _suggestionService.FailuresBeforeSuccess = 5;

        var act = () => _worker.Process(1, CancellationToken.None);

        await act.Should().NotThrowAsync();
        _suggestionService.Calls.Should().Be(2);
        _suggestionService.Successes.Should().Be(0);
    }

    [Fact]
    public async Task ProcessesQueuedTransactions()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        var queue = new AiSuggestionQueue(OpenRouterTestOptions.Enabled(), NullLogger<AiSuggestionQueue>.Instance);
        var services = new ServiceCollection()
            .AddSingleton<ITransactionStore>(_transactionStore)
            .AddSingleton<IAiSuggestionService>(_suggestionService)
            .BuildServiceProvider();
        var worker = new AiSuggestionWorker(queue, services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AiSuggestionWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        queue.EnqueueUnrecognized([
            TransactionsHelper.PrepareTransaction(vendorId: null),
            TransactionsHelper.PrepareTransaction(vendorId: null),
            TransactionsHelper.PrepareTransaction(vendorId: null)
        ]);
        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (_suggestionService.Calls < 3 && DateTime.UtcNow < deadline)
            await Task.Delay(10, TestContext.Current.CancellationToken);
        await worker.StopAsync(CancellationToken.None);

        _suggestionService.Calls.Should().Be(3);
        queue.Pending.Should().Be(0);
    }

    [Fact]
    public async Task MarksQueuedTransactionProcessed_WhenSuggestionKeepsFailing()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        _suggestionService.FailuresBeforeSuccess = 5;
        var queue = new AiSuggestionQueue(OpenRouterTestOptions.Enabled(), NullLogger<AiSuggestionQueue>.Instance);
        var services = new ServiceCollection()
            .AddSingleton<ITransactionStore>(_transactionStore)
            .AddSingleton<IAiSuggestionService>(_suggestionService)
            .BuildServiceProvider();
        var worker = new AiSuggestionWorker(queue, services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AiSuggestionWorker>.Instance) { RetryDelay = TimeSpan.Zero };

        await worker.StartAsync(CancellationToken.None);
        queue.EnqueueUnrecognized([TransactionsHelper.PrepareTransaction(vendorId: null)]);
        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (queue.Pending > 0 && DateTime.UtcNow < deadline)
            await Task.Delay(10, TestContext.Current.CancellationToken);
        await worker.StopAsync(CancellationToken.None);

        _suggestionService.Calls.Should().Be(2);
        queue.Pending.Should().Be(0);
    }

    [Fact]
    public async Task ProcessesQueuedTransactionsInParallel_UpToThreeAtOnce()
    {
        _transactionStore.Transaction = TransactionsHelper.PrepareTransaction(vendorId: null);
        var gate = new TaskCompletionSource();
        _suggestionService.Gate = gate.Task;
        var queue = new AiSuggestionQueue(OpenRouterTestOptions.Enabled(), NullLogger<AiSuggestionQueue>.Instance);
        var services = new ServiceCollection()
            .AddSingleton<ITransactionStore>(_transactionStore)
            .AddSingleton<IAiSuggestionService>(_suggestionService)
            .BuildServiceProvider();
        var worker = new AiSuggestionWorker(queue, services.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AiSuggestionWorker>.Instance);

        await worker.StartAsync(CancellationToken.None);
        queue.EnqueueUnrecognized(Enumerable.Range(0, 5)
            .Select(_ => TransactionsHelper.PrepareTransaction(vendorId: null)).ToList());
        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (_suggestionService.InFlight < 3 && DateTime.UtcNow < deadline)
            await Task.Delay(10, TestContext.Current.CancellationToken);
        var inFlightWhileBlocked = _suggestionService.InFlight;
        gate.SetResult();
        while (_suggestionService.Successes < 5 && DateTime.UtcNow < deadline)
            await Task.Delay(10, TestContext.Current.CancellationToken);
        await worker.StopAsync(CancellationToken.None);

        inFlightWhileBlocked.Should().Be(3);
        _suggestionService.MaxInFlight.Should().Be(3);
        _suggestionService.Successes.Should().Be(5);
    }
}
