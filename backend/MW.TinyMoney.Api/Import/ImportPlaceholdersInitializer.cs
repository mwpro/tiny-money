using System;
using System.Threading;
using System.Threading.Tasks;
using Dapper;
using Microsoft.Extensions.Hosting;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Import;

public class ImportPlaceholdersInitializer : IHostedService
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ImportPlaceholdersInitializer(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var vendorId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM vendor WHERE name = 'Unknown' LIMIT 1");

        var subcategoryId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM subcategory WHERE name = 'Uncategorized' LIMIT 1");

        if (!vendorId.HasValue || !subcategoryId.HasValue)
        {
            throw new InvalidOperationException(
                "Import placeholder records not found in database. " +
                "Please seed the 'Unknown' vendor and 'Uncategorized' subcategory.");
        }

        ImportPlaceholders.Setup(vendorId.Value, subcategoryId.Value);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
