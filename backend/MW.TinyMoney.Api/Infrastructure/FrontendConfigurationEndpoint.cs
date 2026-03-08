using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using MW.TinyMoney.Api.Import;

namespace MW.TinyMoney.Api.Infrastructure;

public static class FrontendConfigurationEndpoint
{
    public static void UseFrontendConfigurationEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("configuration.json", (IConfiguration config) =>
        {
            var frontendConfig = config.GetSection("FrontendConfiguration").Get<FrontendConfiguration>();
            frontendConfig.UnknownVendorId = TransactionPlaceholders.UnknownVendorId;
            frontendConfig.UncategorizedSubcategoryId = TransactionPlaceholders.UncategorizedSubcategoryId;
            return frontendConfig;
        });
    }

    public class FrontendConfiguration
    {
        public string ApiUrl { get; set; }
        public string Auth0Domain { get; set; }
        public string Auth0ClientId { get; set; }
        public string Auth0Audience { get; set; }
        public int UnknownVendorId { get; set; }
        public int UncategorizedSubcategoryId { get; set; }
    }
}