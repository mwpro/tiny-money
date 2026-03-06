using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using Xunit;

namespace MW.TinyMoney.UnitTests.Vendors;

public class VendorMatchingServiceTests
{
    private static readonly DescriptionPreprocessor Preprocessor = new([], []);

    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    [Fact]
    public async Task CachesIndex_StoreQueriedOnlyOnce()
    {
        var store = new StubVendorStore([MakeVendor(1, "Biedronka")]);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var svc = new VendorMatchingService(store, cache, Preprocessor);

        await svc.CreateMatcher();
        await svc.CreateMatcher();

        store.GetVendorsCallCount.Should().Be(1, "second call should hit the cache");
    }

    private class StubVendorStore : IVendorStore
    {
        private readonly IEnumerable<Vendor> _vendors;

        public int GetVendorsCallCount { get; private set; }

        public StubVendorStore(IEnumerable<Vendor> vendors) => _vendors = vendors;

        public Task<IEnumerable<Vendor>> GetVendors()
        {
            GetVendorsCallCount++;
            return Task.FromResult(_vendors);
        }

        public Task<IEnumerable<VendorAlias>> GetAllAliases() => Task.FromResult<IEnumerable<VendorAlias>>([]);

        public Task SaveVendor(Vendor vendor) => throw new NotImplementedException();
        public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
        public Task<VendorDetails> GetVendorDetails(int vendorId) => throw new NotImplementedException();
        public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
        public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
        public Task<IEnumerable<VendorAlias>> GetVendorAliases(int vendorId) => throw new NotImplementedException();
        public Task<Result<VendorAlias>> AddVendorAlias(int vendorId, string alias) => throw new NotImplementedException();
        public Task DeleteVendorAlias(int aliasId) => throw new NotImplementedException();
    }
}
