using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using MW.TinyMoney.Api.Budget;
using MW.TinyMoney.Api.Buffer;
using MW.TinyMoney.Api.Buffer.Parsers;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Reports;
using MW.TinyMoney.Api.Tags;
using MW.TinyMoney.Api.Transaction;
using MW.TinyMoney.Api.Vendors;

var builder = WebApplication.CreateBuilder(args);

ConfigureServices(builder.Services, builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MW.TinyMoney API V1");
});

app.UseAuthentication();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

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
            cors.WithOrigins(configuration["Cors:AllowedOrigins"])
                .WithHeaders("Authorization", "Content-Type")
                .WithMethods("GET", "POST", "DELETE"));
    });

    services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "MW.TinyMoney API", Version = "v1" });
    });

    services.AddTransient<MySqlConnectionFactory>();
    services.AddTransient<ITagStore, MySqlTagStore>();
    services.AddTransient<IBufferedTransactionStore, MySqlBufferedTransactionStore>();
    services.AddTransient<ITransactionStore, MySqlTransactionStore>();
    services.AddTransient<IVendorStore, MySqlVendorStore>();
    services.AddTransient<ICategoriesStore, MySqlCategoriesStore>();
    services.AddTransient<IReportsProvider, MySqlReportsProvider>();
    services.AddTransient<IBudgetStore, BudgetStore>();
    services.AddTransient<IImportTransactionsService, ImportTransactionsService>();
    services.AddTransient<IBankStatementParser, GetinPdfBankStatementParser>();
    services.AddTransient<IBankStatementParser, PekaoCsvBankStatementParser>();
}