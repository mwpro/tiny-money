using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;

namespace MW.TinyMoney.Api.Infrastructure;

public static class FrontendConfigurationEndpoint
{
    public static void UseFrontendConfigurationEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("configuration.json", (IConfiguration config) =>
        {
            return config.GetSection("FrontendConfiguration").Get<FrontendConfiguration>();
        });
    }

    public class FrontendConfiguration
    {
        public string ApiUrl { get; set; }
        public string Auth0Domain { get; set; }
        public string Auth0ClientId { get; set; }
        public string Auth0Audience { get; set; }
        public string SentryDsn { get; set; }
    }
}