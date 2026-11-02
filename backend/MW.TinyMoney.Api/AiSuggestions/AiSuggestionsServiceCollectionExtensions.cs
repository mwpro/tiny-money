using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace MW.TinyMoney.Api.AiSuggestions;

public static class AiSuggestionsServiceCollectionExtensions
{
    public static IServiceCollection AddAiSuggestions(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<OpenRouterOptions>(configuration.GetSection(OpenRouterOptions.SectionName));
        services.AddHttpClient<ILLMClient, OpenRouterClient>(ConfigureOpenRouterClient);
        services.AddTransient<IAiSuggestionStore, MySqlAiSuggestionStore>();
        services.AddTransient<IAiSuggestionService, AiSuggestionService>();
        services.AddSingleton<IAiSuggestionQueue, AiSuggestionQueue>();
        services.AddHostedService<AiSuggestionWorker>();
        return services;
    }

    private static void ConfigureOpenRouterClient(IServiceProvider sp, HttpClient client)
    {
        var options = sp.GetRequiredService<IOptions<OpenRouterOptions>>().Value;
        client.BaseAddress = new Uri(options.BaseUrl);
        client.Timeout = TimeSpan.FromSeconds(30);
        if (options.IsEnabled)
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);

        var environment = sp.GetRequiredService<IHostEnvironment>();
        var version = AppVersion(Assembly.GetEntryAssembly()?
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion);
        client.DefaultRequestHeaders.TryAddWithoutValidation("HTTP-Referer",
            AppReferer(environment.EnvironmentName, version));
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-OpenRouter-Title",
            $"{environment.ApplicationName} {version} ({environment.EnvironmentName})");
        client.DefaultRequestHeaders.TryAddWithoutValidation("X-OpenRouter-App-Visibility", "hidden");
    }

    public static string AppVersion(string informationalVersion)
    {
        var version = string.IsNullOrWhiteSpace(informationalVersion) ? "unknown" : informationalVersion;
        var plus = version.IndexOf('+');
        return plus >= 0 && version.Length > plus + 8 ? version[..(plus + 8)] : version;
    }

    public static string AppReferer(string environmentName, string version) =>
        $"https://{environmentName.ToLowerInvariant()}.tinymoney/{version}";
}
