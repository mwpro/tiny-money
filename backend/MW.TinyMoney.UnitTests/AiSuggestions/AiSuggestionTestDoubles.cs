using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using MW.TinyMoney.Api.AiSuggestions;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class LLMClientStub : ILLMClient
{
    public Dictionary<string, ChoiceAnswer> Answers { get; set; } = new();
    public Exception DecideException { get; set; }
    public object LastState { get; private set; }
    public IReadOnlyDictionary<string, ChoiceQuestion> LastQuestions { get; private set; }

    public object ChatAnswer { get; set; } = new VendorNameAnswer("Żabka");
    public Exception CompleteException { get; set; }
    public ChatRequest LastChatRequest { get; private set; }

    public Task<DecisionsResponse> Decide(object state, IReadOnlyDictionary<string, ChoiceQuestion> questions, CancellationToken ct)
    {
        LastState = state;
        LastQuestions = questions;
        if (DecideException != null)
            throw DecideException;
        return Task.FromResult(new DecisionsResponse("typesafe/jev-1.14-20261014", Answers, new DecisionsUsage(100, 0.000004m)));
    }

    public Task<ChatResult<T>> Complete<T>(ChatRequest request, CancellationToken ct)
    {
        LastChatRequest = request;
        if (CompleteException != null)
            throw CompleteException;
        return Task.FromResult(new ChatResult<T>("google/gemini-3.8-flash-20260902", (T)ChatAnswer,
            new ChatUsage(200, 15, 0.0001m)));
    }
}

/// <summary>
/// Returns <see cref="SuggestionToReturn"/> (or an empty suggestion). Fails the first <see cref="FailuresBeforeSuccess"/> calls.
/// </summary>
public class AiSuggestionServiceStub : IAiSuggestionService
{
    public AiSuggestion SuggestionToReturn { get; set; }
    public int FailuresBeforeSuccess { get; set; }
    public Task Gate { get; set; } = Task.CompletedTask;
    private int _calls;
    private int _successes;
    private int _inFlight;
    private int _maxInFlight;
    public int Calls => Volatile.Read(ref _calls);
    public int Successes => Volatile.Read(ref _successes);
    public int InFlight => Volatile.Read(ref _inFlight);
    public int MaxInFlight => Volatile.Read(ref _maxInFlight);

    public async Task<AiSuggestion> Suggest(Api.Transaction.ApiModels.Transaction transaction, CancellationToken ct)
    {
        if (Interlocked.Increment(ref _calls) <= FailuresBeforeSuccess)
            throw new HttpRequestException("OpenRouter unavailable");

        var inFlight = Interlocked.Increment(ref _inFlight);
        int max;
        while (inFlight > (max = Volatile.Read(ref _maxInFlight)))
            Interlocked.CompareExchange(ref _maxInFlight, inFlight, max);
        try
        {
            await Gate.WaitAsync(ct);
        }
        finally
        {
            Interlocked.Decrement(ref _inFlight);
        }
        Interlocked.Increment(ref _successes);

        var suggestion = SuggestionToReturn ?? new AiSuggestion();
        suggestion.TransactionId = transaction.Id;
        return suggestion;
    }
}

public static class OpenRouterTestOptions
{
    public static IOptions<OpenRouterOptions> Enabled(decimal minConfidence = 0.5m) =>
        Options.Create(new OpenRouterOptions
        {
            ApiKey = "test-key", MinConfidence = minConfidence,
            ChatModel = "google/gemini-3.8-flash:floor", ChatProviderOrder = ["google-ai-studio/flex"]
        });

    public static IOptions<OpenRouterOptions> Disabled() => Options.Create(new OpenRouterOptions());
}
