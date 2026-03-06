using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using MW.TinyMoney.Api.Budget;
using MW.TinyMoney.Api.Buffer;
using MW.TinyMoney.Api.Buffer.Parsers;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Import.Parsers;
using MW.TinyMoney.Api.Infrastructure;
using ImportIngParser = MW.TinyMoney.Api.Import.Parsers.IngCsvBankStatementParser;
using ImportPekaoParser = MW.TinyMoney.Api.Import.Parsers.PekaoCsvBankStatementParser;
using ImportVeloBankParser = MW.TinyMoney.Api.Import.Parsers.VeloBankPdfParser;
using MW.TinyMoney.Api.Reports;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.Api.Vendors;
using IngCsvBankStatementParser = MW.TinyMoney.Api.Buffer.Parsers.IngCsvBankStatementParser;
using PekaoCsvBankStatementParser = MW.TinyMoney.Api.Buffer.Parsers.PekaoCsvBankStatementParser;

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
    });

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

    services.AddSingleton(_ =>
    {
        var stopTokens = File.ReadAllLines("Vendors/StopTokens.txt");
        var stopPatterns = File.ReadAllLines("Vendors/StopPatterns.txt")
            .Select(p => new Regex(p.Split("#").First(), RegexOptions.Compiled, TimeSpan.FromMilliseconds(100)));
        return new DescriptionPreprocessor(stopTokens, stopPatterns);
    });

    services.AddTransient<MySqlConnectionFactory>();
    services.AddTransient<ITagStore, MySqlTagStore>();
    services.AddTransient<IBufferedTransactionStore, MySqlBufferedTransactionStore>();
    services.AddTransient<ITransactionStore, MySqlTransactionStore>();
    services.AddTransient<IVendorStore, MySqlVendorStore>();
    services.AddTransient<IVendorMatchingService, VendorMatchingService>();
    services.AddTransient<ICategoriesStore, MySqlCategoriesStore>();
    services.AddTransient<IReportsProvider, MySqlReportsProvider>();
    services.AddTransient<ISankeyReport, SankeyReport>();
    services.AddTransient<ITopListReport, TopListReport>();
    services.AddTransient<ISummaryReport, SummaryReport>();
    services.AddTransient<IBudgetStore, BudgetStore>();
    services.AddTransient<IImportTransactionsService, ImportTransactionsService>();
    services.AddTransient<IBankStatementParser, GetinPdfBankStatementParser>();
    services.AddTransient<IBankStatementParser, PekaoCsvBankStatementParser>();
    services.AddTransient<IBankStatementParser, IngCsvBankStatementParser>();

    // New import module
    services.AddTransient<IFileImportParser, ImportIngParser>();
    services.AddTransient<IFileImportParser, ImportPekaoParser>();
    services.AddTransient<IFileImportParser, ImportVeloBankParser>();
    services.AddTransient<IImportService, ImportService>();
    services.AddHostedService<ImportPlaceholdersInitializer>();
}