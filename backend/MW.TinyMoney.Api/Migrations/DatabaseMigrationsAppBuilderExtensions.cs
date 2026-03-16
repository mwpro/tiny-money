using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace MW.TinyMoney.Api.Migrations;

public static class DatabaseMigrationsAppBuilderExtensions
{
    public static IApplicationBuilder RunDatabaseMigrations(this IApplicationBuilder app)
    {
        new DatabaseMigrationRunner(
            app.ApplicationServices.GetRequiredService<IConfiguration>(),
            app.ApplicationServices.GetRequiredService<ILogger<DatabaseMigrationRunner>>()
        ).Run();
        return app;
    }
}