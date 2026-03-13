using System;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using MW.TinyMoney.Api.ApiKeys;
using MW.TinyMoney.Api.Budget;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Import.Parsers;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Reports;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;

System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("/run/secrets/appsettings.secret.json", optional: true);

ConfigureServices(builder.Services, builder.Configuration);

var app = builder.Build();

app.MapStaticAssets().ShortCircuit();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MW.TinyMoney API V1");
});

app.UseAuthentication();
app.UseCors();
app.UseAuthorization();
app.UseFrontendConfigurationEndpoint();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

void ConfigureServices(IServiceCollection services, IConfiguration configuration)
{
    services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        options.Authority = $"https://{configuration["Auth0:Domain"]}/";
        options.Audience = configuration["Auth0:ApiIdentifier"];
    }).AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>("ApiKey", _ => { });

    services.AddControllers();

    services.AddCors(conf =>
    {
        conf.AddDefaultPolicy(cors =>
            cors.WithOrigins(configuration["Cors:AllowedOrigins"].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .WithHeaders("Authorization", "Content-Type")
                .WithMethods("GET", "POST", "PUT", "DELETE"));
    });

    services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "MW.TinyMoney API", Version = "v1" });
    });

    services.AddMemoryCache();

    services.AddSingleton<IDescriptionPreprocessor>(_ => DescriptionPreprocessor.CreateFromFiles());

    services.AddTransient<MySqlConnectionFactory>();
    services.AddTransient<ITagStore, MySqlTagStore>();
    services.AddTransient<ITransactionStore, MySqlTransactionStore>();
    services.AddTransient<IVendorStore, MySqlVendorStore>();
    services.AddTransient<IVendorMatchingService, VendorMatchingService>();
    services.AddTransient<ICategoriesStore, MySqlCategoriesStore>();
    services.AddTransient<ISankeyReport, SankeyReport>();
    services.AddTransient<ITopListReport, TopListReport>();
    services.AddTransient<ISummaryReport, SummaryReport>();
    services.AddTransient<IBudgetStore, BudgetStore>();
    services.AddTransient<IDashboardReport, DashboardReport>();
    services.AddTransient<IFileImportParser, IngCsvBankStatementParser>();
    services.AddTransient<IFileImportParser, PekaoCsvBankStatementParser>();
    services.AddTransient<IFileImportParser, VeloBankPdfParser>();
    services.AddTransient<IApiKeyStore, MySqlApiKeyStore>();
    services.AddTransient<IImportService, ImportService>();
    services.AddHostedService<TransactionPlaceholdersInitializer>();
}