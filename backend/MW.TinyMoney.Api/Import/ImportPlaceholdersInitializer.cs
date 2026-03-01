using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Import;

public class ImportPlaceholdersInitializer
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ImportPlaceholdersInitializer(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task InitializeAsync()
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        var vendorId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM vendor WHERE name = 'Unknown' LIMIT 1");

        var subcategoryId = await connection.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM subcategory WHERE name = 'Uncategorized' LIMIT 1");

        ImportPlaceholders.VendorId = vendorId ?? 0;
        ImportPlaceholders.SubcategoryId = subcategoryId ?? 0;
    }
}
