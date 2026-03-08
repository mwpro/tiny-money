using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using MW.TinyMoney.UnitTests.VendorsMatching.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsMatching;

public class VendorMatchingServiceSuggestAliasTests
{
    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    private static VendorAlias MakeAlias(int vendorId, string alias) =>
        new() { Id = vendorId, VendorId = vendorId, Alias = alias };

    private VendorMatchingService Build(StubVendorStore store, DescriptionPreprocessorMock preprocessor = null)
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new VendorMatchingService(store, cache, preprocessor ?? new DescriptionPreprocessorMock());
    }

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenDescriptionMatchesVendorName()
    {
        var store = new StubVendorStore([MakeVendor(1, "Stonka")]);
        var svc = Build(store);

        var result = await svc.SuggestAlias(1, "Stonka");

        result.Should().BeNull();
    }

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenDescriptionMatchesVendorAlias()
    {
        var store = new StubVendorStore([MakeVendor(1, "Stonka")], [MakeAlias(1, "Jan Kowalski")]);
        var svc = Build(store);

        var result = await svc.SuggestAlias(1, "Jan Kowalski Bemowo");

        result.Should().BeNull();
    }

    [Fact]
    public async Task SuggestAlias_ReturnsPreprocessedDescriptionWhenNoMatch()
    {
        // Default mock preprocessor is passthrough; "Biedronka Warszawa" won't match vendor "Stonka"
        var store = new StubVendorStore([MakeVendor(1, "Stonka")]);
        var svc = Build(store);

        var result = await svc.SuggestAlias(1, "Biedronka Warszawa");

        result.Should().Be("Biedronka Warszawa");
    }

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenPreprocessedDescriptionIsEmpty()
    {
        var store = new StubVendorStore([MakeVendor(1, "Stonka")]);
        var preprocessor = new DescriptionPreprocessorMock
        {
            PreprocessOverride = _ => "   "
        };
        var svc = Build(store, preprocessor);

        var result = await svc.SuggestAlias(1, "PRZELEW");

        result.Should().BeNull();
    }

    [Fact]
    public async Task InvalidateCache_CausesStoreToBeQueriedAgain()
    {
        var store = new StubVendorStore([MakeVendor(1, "Stonka")]);
        var svc = Build(store);

        await svc.CreateMatcher();
        svc.InvalidateCache();
        await svc.CreateMatcher();

        store.GetVendorsCallCount.Should().Be(2);
    }
}
