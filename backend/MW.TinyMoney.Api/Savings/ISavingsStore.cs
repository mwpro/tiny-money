using Dapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;

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
}
