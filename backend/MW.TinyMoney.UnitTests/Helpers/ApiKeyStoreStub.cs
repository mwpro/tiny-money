using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.ApiKeys;

namespace MW.TinyMoney.UnitTests.Helpers;

public class ApiKeyStoreStub : IApiKeyStore
{
    public ApiKeyRecord FindByHashResult { get; set; }
    public string LastFindByHashArgument { get; private set; }
    public int UpdateLastUsedCalledWithId { get; private set; }

    public Task<ApiKeyRecord> FindByHash(string keyHash)
    {
        LastFindByHashArgument = keyHash;
        return Task.FromResult(FindByHashResult);
    }

    public Task UpdateLastUsed(int id)
    {
        UpdateLastUsedCalledWithId = id;
        return Task.CompletedTask;
    }

    public Task<IEnumerable<ApiKeySummary>> GetByUser(string userId) => throw new NotImplementedException();
    public Task<int> Create(string name, string keyHash, string keyPrefix, string userId) => throw new NotImplementedException();
    public Task Delete(int id, string userId) => throw new NotImplementedException();
}
