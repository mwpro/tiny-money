using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using MW.TinyMoney.UnitTests.VendorsMatching.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsMatching;

public class VendorMatchingServiceTests
{
    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    [Fact]
    public async Task CachesIndex_StoreQueriedOnlyOnce()
    {
        var store = new StubVendorStore([MakeVendor(1, "Stonka")]);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var svc = new VendorMatchingService(store, cache, new DescriptionPreprocessorMock());

        await svc.CreateMatcher();
        await svc.CreateMatcher();

        store.GetVendorsCallCount.Should().Be(1);
    }
}