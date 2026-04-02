using Dapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public interface ISavingsStore
{
    Task<IReadOnlyCollection<SavingsCategory>> GetCategories();
    Task CreateCategory(string name);
    Task<SavingsCategory> GetCategoryById(int id);
    Task UpdateCategory(int id, string name);
    Task DeleteCategory(int id);
    Task<bool> CategoryHasAccounts(int id);

    Task<IReadOnlyCollection<SavingsAccount>> GetAccounts(bool includeArchived = false);
    Task CreateAccount(string name, int categoryId);
    Task<SavingsAccount> GetAccountById(int id);
    Task UpdateAccount(int id, string name, int categoryId, bool isActive);

    Task<IReadOnlyCollection<SavingsSnapshotEntry>> GetSnapshotPeriod(string period);
    Task UpsertSnapshots(string period, IEnumerable<SnapshotEntryRequest> entries);
}

public class MySqlSavingsStore : ISavingsStore
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public MySqlSavingsStore(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    private const string GetCategoriesQuery =
        "SELECT id, name FROM savings_category ORDER BY name";

    private const string GetCategoryByIdQuery =
        "SELECT id, name FROM savings_category WHERE id = @id";

    private const string CreateCategoryQuery =
        "INSERT INTO savings_category (name) VALUES (@name)";

    private const string UpdateCategoryQuery =
        "UPDATE savings_category SET name = @name WHERE id = @id";

    private const string DeleteCategoryQuery =
        "DELETE FROM savings_category WHERE id = @id";

    private const string CountAccountsForCategoryQuery =
        "SELECT COUNT(*) FROM savings_account WHERE category_id = @id";

    private const string GetAccountsQuery =
        """
        SELECT a.id, a.name, a.category_id AS 'categoryId',
               sc.name AS 'categoryName', a.is_active AS 'isActive'
        FROM savings_account a
        JOIN savings_category sc ON a.category_id = sc.id
        WHERE (@includeArchived = 1 OR a.is_active = 1)
        ORDER BY a.name
        """;

    private const string GetAccountByIdQuery =
        """
        SELECT a.id, a.name, a.category_id AS 'categoryId',
               sc.name AS 'categoryName', a.is_active AS 'isActive'
        FROM savings_account a
        JOIN savings_category sc ON a.category_id = sc.id
        WHERE a.id = @id
        """;

    private const string CreateAccountQuery =
        "INSERT INTO savings_account (name, category_id) VALUES (@name, @categoryId)";

    private const string UpdateAccountQuery =
        "UPDATE savings_account SET name = @name, category_id = @categoryId, is_active = @isActive WHERE id = @id";

    private const string GetSnapshotPeriodQuery =
        """
        SELECT
            a.id          AS accountId,
            a.name        AS accountName,
            a.category_id AS categoryId,
            sc.name       AS categoryName,
            COALESCE(exact.balance,   prior.balance,   0) AS balance,
            COALESCE(exact.deposited, 0)                  AS deposited,
            COALESCE(exact.withdrawn, 0)                  AS withdrawn
        FROM savings_account a
        JOIN savings_category sc ON a.category_id = sc.id
        LEFT JOIN savings_snapshot exact
            ON exact.account_id = a.id AND exact.period = @period
        LEFT JOIN savings_snapshot prior
            ON prior.account_id = a.id AND prior.period < @period
        LEFT JOIN savings_snapshot prior_newer
            ON prior_newer.account_id = a.id
            AND prior_newer.period < @period
            AND prior_newer.period > prior.period
        WHERE a.is_active = 1
          AND prior_newer.id IS NULL
        ORDER BY sc.name, a.name
        """;

    private const string UpsertSnapshotQuery =
        """
        INSERT INTO savings_snapshot (account_id, period, balance, deposited, withdrawn)
        VALUES (@AccountId, @period, @Balance, @Deposited, @Withdrawn)
        ON DUPLICATE KEY UPDATE
            balance   = VALUES(balance),
            deposited = VALUES(deposited),
            withdrawn = VALUES(withdrawn)
        """;

    public async Task<IReadOnlyCollection<SavingsCategory>> GetCategories()
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsCategory>(GetCategoriesQuery);
        return results.ToList().AsReadOnly();
    }

    public async Task<SavingsCategory> GetCategoryById(int id)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<SavingsCategory>(GetCategoryByIdQuery, new { id });
    }

    public async Task CreateCategory(string name)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(CreateCategoryQuery, new { name });
    }

    public async Task UpdateCategory(int id, string name)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdateCategoryQuery, new { id, name });
    }

    public async Task DeleteCategory(int id)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(DeleteCategoryQuery, new { id });
    }

    public async Task<bool> CategoryHasAccounts(int id)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var count = await connection.ExecuteScalarAsync<int>(CountAccountsForCategoryQuery, new { id });
        return count > 0;
    }

    public async Task<IReadOnlyCollection<SavingsAccount>> GetAccounts(bool includeArchived = false)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsAccount>(GetAccountsQuery, new { includeArchived = includeArchived ? 1 : 0 });
        return results.ToList().AsReadOnly();
    }

    public async Task<SavingsAccount> GetAccountById(int id)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<SavingsAccount>(GetAccountByIdQuery, new { id });
    }

    public async Task CreateAccount(string name, int categoryId)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(CreateAccountQuery, new { name, categoryId });
    }

    public async Task UpdateAccount(int id, string name, int categoryId, bool isActive)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdateAccountQuery, new { id, name, categoryId, isActive });
    }

    public async Task<IReadOnlyCollection<SavingsSnapshotEntry>> GetSnapshotPeriod(string period)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsSnapshotEntry>(GetSnapshotPeriodQuery, new { period });
        return results.ToList().AsReadOnly();
    }

    public async Task UpsertSnapshots(string period, IEnumerable<SnapshotEntryRequest> entries)
    {
        using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        foreach (var entry in entries)
        {
            await connection.ExecuteAsync(UpsertSnapshotQuery, new
            {
                entry.AccountId,
                period,
                entry.Balance,
                entry.Deposited,
                entry.Withdrawn
            });
        }
    }
}
