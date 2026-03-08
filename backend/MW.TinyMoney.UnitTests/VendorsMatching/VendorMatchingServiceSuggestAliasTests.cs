using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.Api.Vendors.Matching;
using MW.TinyMoney.UnitTests.Stubs;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsMatching;

public class VendorMatchingServiceSuggestAliasTests
{
    private readonly VendorStoreStub _vendorStoreStub;
    private readonly DescriptionPreprocessorMock _descriptionPreprocessorMock;
    
    private readonly VendorMatchingService _vendorMatchingService;

    public VendorMatchingServiceSuggestAliasTests()
    {
        _vendorStoreStub = new VendorStoreStub();
        _vendorStoreStub.Aliases = [];
        _descriptionPreprocessorMock = new DescriptionPreprocessorMock();

        var cache = new MemoryCache(new MemoryCacheOptions());
        _vendorMatchingService = new VendorMatchingService(_vendorStoreStub, cache, _descriptionPreprocessorMock);

    }
    
    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    private static VendorAlias MakeAlias(int vendorId, string alias) =>
        new() { Id = vendorId, VendorId = vendorId, Alias = alias };

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenDescriptionMatchesVendorName()
    {
        _vendorStoreStub.Vendors = [MakeVendor(1, "Stonka")];

        var result = await _vendorMatchingService.SuggestAlias(1, "Stonka");

        result.Should().BeNull();
    }

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenDescriptionMatchesVendorAlias()
    {
        _vendorStoreStub.Vendors = [MakeVendor(1, "Stonka")];
        _vendorStoreStub.Aliases = [MakeAlias(1, "Jan Kowalski")];

        var result = await _vendorMatchingService.SuggestAlias(1, "Jan Kowalski Bemowo");

        result.Should().BeNull();
    }

    [Fact]
    public async Task SuggestAlias_ReturnsPreprocessedDescriptionWhenNoMatch()
    {
        // Default mock preprocessor is passthrough; "Biedronka Warszawa" won't match vendor "Stonka"
        _vendorStoreStub.Vendors = [MakeVendor(1, "Stonka")];

        var result = await _vendorMatchingService.SuggestAlias(1, "Motyl Warszawa");

        result.Should().Be("Motyl Warszawa");
    }

    [Fact]
    public async Task SuggestAlias_ReturnsNullWhenPreprocessedDescriptionIsEmpty()
    {
        _vendorStoreStub.Vendors = [MakeVendor(1, "Stonka")];
        _descriptionPreprocessorMock.PreprocessOverride = _ => "   ";

        var result = await _vendorMatchingService.SuggestAlias(1, "PRZELEW");

        result.Should().BeNull();
    }
}
