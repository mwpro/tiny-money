using Dapper;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.ApiKeys;

public record ApiKeySummary(int Id, string Name, string KeyPrefix, DateTime CreatedAt, DateTime? LastUsedAt);
public record ApiKeyRecord(int Id, string UserId);

public interface IApiKeyStore
{
    Task<ApiKeyRecord?> FindByHash(string keyHash);
    Task<IEnumerable<ApiKeySummary>> GetByUser(string userId);
    Task<int> Create(string name, string keyHash, string keyPrefix, string userId);
    Task Delete(int id, string userId);
    Task UpdateLastUsed(int id);
}

public class MySqlApiKeyStore : IApiKeyStore
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public MySqlApiKeyStore(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    private const string FindByHashQuery =
        """
        SELECT id, user_id as UserId FROM api_key WHERE key_hash = @keyHash LIMIT 1
        """;

    private const string GetByUserQuery =
        """
        SELECT id, name, key_prefix as KeyPrefix, created_at as CreatedAt, last_used_at as LastUsedAt
        FROM api_key WHERE user_id = @userId ORDER BY created_at DESC
        """;

    private const string CreateQuery =
        """
        INSERT INTO api_key (name, key_hash, key_prefix, user_id) VALUES (@name, @keyHash, @keyPrefix, @userId);
        SELECT LAST_INSERT_ID();
        """;

    private const string DeleteQuery =
        """
        DELETE FROM api_key WHERE id = @id AND user_id = @userId
        """;

    private const string UpdateLastUsedQuery =
        """
        UPDATE api_key SET last_used_at = UTC_TIMESTAMP() WHERE id = @id
        """;

    public async Task<ApiKeyRecord?> FindByHash(string keyHash)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleOrDefaultAsync<ApiKeyRecord>(FindByHashQuery, new { keyHash });
    }

    public async Task<IEnumerable<ApiKeySummary>> GetByUser(string userId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<ApiKeySummary>(GetByUserQuery, new { userId });
    }

    public async Task<int> Create(string name, string keyHash, string keyPrefix, string userId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleAsync<int>(CreateQuery, new { name, keyHash, keyPrefix, userId });
    }

    public async Task Delete(int id, string userId)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(DeleteQuery, new { id, userId });
    }

    public async Task UpdateLastUsed(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdateLastUsedQuery, new { id });
    }
}
