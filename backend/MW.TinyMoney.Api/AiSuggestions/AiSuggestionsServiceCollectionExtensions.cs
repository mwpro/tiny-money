using System;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public static class AiSuggestionsServiceCollectionExtensions
{
    public static IServiceCollection AddAiSuggestions(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OpenRouterOptions>(configuration.GetSection(OpenRouterOptions.SectionName));
        services.AddHttpClient<IDecisionsClient, OpenRouterDecisionsClient>((sp, client) =>
        {
            var options = sp.GetRequiredService<IOptions<OpenRouterOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
            client.Timeout = TimeSpan.FromSeconds(30);
            if (options.IsEnabled)
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
        });
        services.AddTransient<IAiSuggestionStore, MySqlAiSuggestionStore>();
        services.AddTransient<IAiSuggestionService, AiSuggestionService>();
        services.AddSingleton<IAiSuggestionQueue, AiSuggestionQueue>();
        services.AddHostedService<AiSuggestionWorker>();
        return services;
    }
}
