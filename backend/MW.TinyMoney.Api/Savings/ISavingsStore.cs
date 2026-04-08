using Dapper;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

public class SavingsSettings
{
    public decimal CushionAmount { get; set; }
    public IReadOnlyCollection<int> CushionCategoryIds { get; set; } = [];
}

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

    Task<SavingsSettings> GetSettings();
    Task UpsertSettings(decimal cushionAmount, IEnumerable<int> categoryIds);
    Task<(decimal ThreeMonths, decimal SixMonths, decimal TwelveMonths)> GetAvgMonthlyExpenses(DateTime today);

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

    private const string GetSettingsQuery =
        """
        SELECT COALESCE(cushion_amount, 0) FROM savings_setting LIMIT 1;
        SELECT category_id FROM savings_cushion_category;
        """;

    private const string UpsertSettingsDeleteQuery =
        """
        DELETE FROM savings_cushion_category;
        DELETE FROM savings_setting;
        """;

    private const string InsertSettingAmountQuery =
        "INSERT INTO savings_setting (cushion_amount) VALUES (@cushionAmount)";

    private const string InsertCushionCategoryQuery =
        "INSERT INTO savings_cushion_category (category_id) VALUES (@categoryId)";

    private const string GetAvgMonthlyExpensesQuery =
        """
        SELECT
          COALESCE(SUM(CASE WHEN transaction_date >= DATE_FORMAT(DATE_SUB(@today, INTERVAL 3 MONTH), '%Y-%m-01') THEN amount END), 0) / 3 AS threeMonths,
          COALESCE(SUM(CASE WHEN transaction_date >= DATE_FORMAT(DATE_SUB(@today, INTERVAL 6 MONTH), '%Y-%m-01') THEN amount END), 0) / 6 AS sixMonths,
          COALESCE(SUM(amount), 0) / 12 AS twelveMonths
        FROM transaction
        WHERE is_expense = 1 AND is_verified = 1
          AND transaction_date >= DATE_FORMAT(DATE_SUB(@today, INTERVAL 12 MONTH), '%Y-%m-01')
          AND transaction_date <= LAST_DAY(DATE_SUB(@today, INTERVAL 1 MONTH))
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
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsCategory>(GetCategoriesQuery);
        return results.ToList().AsReadOnly();
    }

    public async Task<SavingsCategory> GetCategoryById(int id)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<SavingsCategory>(GetCategoryByIdQuery, new { id });
    }

    public async Task CreateCategory(string name)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(CreateCategoryQuery, new { name });
    }

    public async Task UpdateCategory(int id, string name)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdateCategoryQuery, new { id, name });
    }

    public async Task DeleteCategory(int id)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(DeleteCategoryQuery, new { id });
    }

    public async Task<bool> CategoryHasAccounts(int id)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var count = await connection.ExecuteScalarAsync<int>(CountAccountsForCategoryQuery, new { id });
        return count > 0;
    }

    public async Task<IReadOnlyCollection<SavingsAccount>> GetAccounts(bool includeArchived = false)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsAccount>(GetAccountsQuery, new { includeArchived = includeArchived ? 1 : 0 });
        return results.ToList().AsReadOnly();
    }

    public async Task<SavingsAccount> GetAccountById(int id)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<SavingsAccount>(GetAccountByIdQuery, new { id });
    }

    public async Task CreateAccount(string name, int categoryId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(CreateAccountQuery, new { name, categoryId });
    }

    public async Task UpdateAccount(int id, string name, int categoryId, bool isActive)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdateAccountQuery, new { id, name, categoryId, isActive });
    }

    public async Task<IReadOnlyCollection<SavingsSnapshotEntry>> GetSnapshotPeriod(string period)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var results = await connection.QueryAsync<SavingsSnapshotEntry>(GetSnapshotPeriodQuery, new { period });
        return results.ToList().AsReadOnly();
    }

    public async Task UpsertSnapshots(string period, IEnumerable<SnapshotEntryRequest> entries)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var parameters = entries.Select(e => new
        {
            e.AccountId,
            period,
            e.Balance,
            e.Deposited,
            e.Withdrawn
        });
        await connection.ExecuteAsync(UpsertSnapshotQuery, parameters, transaction);
        await transaction.CommitAsync();
    }

    public async Task<SavingsSettings> GetSettings()
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var reader = await connection.QueryMultipleAsync(GetSettingsQuery);
        var cushionAmount = await reader.ReadFirstOrDefaultAsync<decimal?>();
        var categoryIds = (await reader.ReadAsync<int>()).ToList();
        return new SavingsSettings
        {
            CushionAmount = cushionAmount ?? 0m,
            CushionCategoryIds = categoryIds.AsReadOnly()
        };
    }

    public async Task UpsertSettings(decimal cushionAmount, IEnumerable<int> categoryIds)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        await connection.ExecuteAsync(UpsertSettingsDeleteQuery, transaction: transaction);
        await connection.ExecuteAsync(InsertSettingAmountQuery, new { cushionAmount }, transaction);
        var ids = categoryIds.ToList();
        if (ids.Count > 0)
            await connection.ExecuteAsync(InsertCushionCategoryQuery, ids.Select(id => new { categoryId = id }), transaction);
        await transaction.CommitAsync();
    }

    public async Task<(decimal ThreeMonths, decimal SixMonths, decimal TwelveMonths)> GetAvgMonthlyExpenses(DateTime today)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var result = await connection.QuerySingleAsync<(decimal ThreeMonths, decimal SixMonths, decimal TwelveMonths)>(GetAvgMonthlyExpensesQuery, new { today });
        return result;
    }

}
