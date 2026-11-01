using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.AiSuggestions;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class DecisionsClientStub : IDecisionsClient
{
    public Dictionary<string, ChoiceAnswer> Answers { get; set; } = new();
    public Exception ExceptionToThrow { get; set; }
    public object LastState { get; private set; }
    public IReadOnlyDictionary<string, ChoiceQuestion> LastQuestions { get; private set; }
    public int CallCount { get; private set; }

    public Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct)
    {
        CallCount++;
        LastState = state;
        LastQuestions = questions;
        if (ExceptionToThrow != null)
            throw ExceptionToThrow;
        return Task.FromResult(new DecisionsResponse("typesafe/jev-1.14-20261014", Answers, new DecisionsUsage(100, 0.000004m)));
    }
}

public class ExtractionsClientStub : IExtractionsClient
{
    public Dictionary<string, TextAnswer> Answers { get; set; } = new();
    public Exception ExceptionToThrow { get; set; }
    public string LastState { get; private set; }
    public IReadOnlyDictionary<string, TextField> LastFields { get; private set; }
    public int CallCount { get; private set; }

    public Task<ExtractionsResponse> Extract(string state, IReadOnlyDictionary<string, TextField> fields, CancellationToken ct)
    {
        CallCount++;
        LastState = state;
        LastFields = fields;
        if (ExceptionToThrow != null)
            throw ExceptionToThrow;
        return Task.FromResult(new ExtractionsResponse("inception/mercury-decide-20260930", Answers, new ExtractionsUsage(50, 0.000001m)));
    }
}

/// <summary>
/// Returns <see cref="SuggestionToReturn"/> (or an empty suggestion). Fails the first <see cref="FailuresBeforeSuccess"/> calls.
/// </summary>
public class AiSuggestionServiceStub : IAiSuggestionService
{
    public AiSuggestion SuggestionToReturn { get; set; }
    public int FailuresBeforeSuccess { get; set; }
    public int Calls { get; private set; }
    public int Successes { get; private set; }

    public Task<AiSuggestion> Suggest(Api.Transaction.ApiModels.Transaction transaction, CancellationToken ct)
    {
        Calls++;
        if (Calls <= FailuresBeforeSuccess)
            throw new HttpRequestException("OpenRouter unavailable");
        Successes++;

        var suggestion = SuggestionToReturn ?? new AiSuggestion();
        suggestion.TransactionId = transaction.Id;
        return Task.FromResult(suggestion);
    }
}

public static class OpenRouterTestOptions
{
    public static IOptions<OpenRouterOptions> Enabled(decimal minConfidence = 0.5m) =>
        Options.Create(new OpenRouterOptions { ApiKey = "test-key", MinConfidence = minConfidence });

    public static IOptions<OpenRouterOptions> Disabled() => Options.Create(new OpenRouterOptions());
}
