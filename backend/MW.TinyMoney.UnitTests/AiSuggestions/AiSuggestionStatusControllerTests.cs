using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.AiSuggestions;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class AiSuggestionStatusControllerTests
{
    private static (AiSuggestionQueue, AiSuggestionStatusController) Create(IOptions<OpenRouterOptions> options)
    {
        var queue = new AiSuggestionQueue(options, NullLogger<AiSuggestionQueue>.Instance);
        return (queue, new AiSuggestionStatusController(queue, options));
    }

    [Fact]
    public void ReturnsPendingSuggestions()
    {
        var (queue, controller) = Create(OpenRouterTestOptions.Enabled());
        queue.EnqueueUnrecognized([
            TransactionsHelper.PrepareTransaction(vendorId: null),
            TransactionsHelper.PrepareTransaction(vendorId: null)
        ]);
        queue.MarkProcessed();

        var result = controller.GetStatus();

        result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new AiSuggestionStatusDto(true, 1));
    }

    [Fact]
    public void ReportsDisabled_WhenNoApiKey()
    {
        var (_, controller) = Create(OpenRouterTestOptions.Disabled());

        var result = controller.GetStatus();

        result.Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().Be(new AiSuggestionStatusDto(false, 0));
    }
}
