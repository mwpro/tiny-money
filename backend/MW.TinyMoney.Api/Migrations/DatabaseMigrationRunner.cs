using System;
using System.Reflection;
using DbUp;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MW.TinyMoney.Api.Migrations;

public class DatabaseMigrationRunner(IConfiguration configuration, ILogger<DatabaseMigrationRunner> logger)
{
    private readonly string _connectionString = configuration.GetConnectionString("TransactionsDb")
        ?? throw new InvalidOperationException("Connection string 'TransactionsDb' is not configured.");

    public void Run()
    {
        var upgrader = DeployChanges.To
            .MySqlDatabase(_connectionString)
            .WithScriptsEmbeddedInAssembly(Assembly.GetExecutingAssembly())
            .LogTo(logger)
            .Build();

        var result = upgrader.PerformUpgrade();

        if (!result.Successful)
        {
            logger.LogError(result.Error, "Database migration failed. Application startup will be aborted.");
            throw new Exception("Database migration failed.", result.Error);
        }
    }
}
