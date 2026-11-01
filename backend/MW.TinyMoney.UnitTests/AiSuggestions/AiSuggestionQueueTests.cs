using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class AiSuggestionQueueTests
{
    private static AiSuggestionQueue CreateQueue(IOptions<OpenRouterOptions> options) =>
        new(options, NullLogger<AiSuggestionQueue>.Instance);

    private static Api.Transaction.ApiModels.Transaction Unrecognized(int id, string description = "ZABKA")
    {
        var transaction = TransactionsHelper.PrepareTransaction(vendorId: null, description: description);
        transaction.Id = id;
        return transaction;
    }

    private static async Task<List<int>> ReadForAWhile(AiSuggestionQueue queue)
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(100));
        var read = new List<int>();
        try
        {
            await foreach (var id in queue.ReadAllAsync(cts.Token))
                read.Add(id);
        }
        catch (OperationCanceledException)
        {
        }
        return read;
    }

    [Fact]
    public async Task EnabledQueue_ReturnsTransactionsInOrder()
    {
        var queue = CreateQueue(OpenRouterTestOptions.Enabled());

        queue.EnqueueUnrecognized([Unrecognized(1), Unrecognized(2)]);

        (await ReadForAWhile(queue)).Should().Equal(1, 2);
    }

    [Fact]
    public async Task SkipsTransactionsWithVendorOrWithoutDescription()
    {
        var queue = CreateQueue(OpenRouterTestOptions.Enabled());
        var recognized = TransactionsHelper.PrepareTransaction(vendorId: 5);
        recognized.Id = 2;

        queue.EnqueueUnrecognized([Unrecognized(1), recognized, Unrecognized(3, description: "  "), Unrecognized(4, description: null)]);

        (await ReadForAWhile(queue)).Should().Equal(1);
    }

    [Fact]
    public async Task DisabledQueue_IgnoresTransactions()
    {
        var queue = CreateQueue(OpenRouterTestOptions.Disabled());

        queue.EnqueueUnrecognized([Unrecognized(1), Unrecognized(2)]);

        (await ReadForAWhile(queue)).Should().BeEmpty();
    }
}
