using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using MW.TinyMoney.Api.Vendors;

namespace MW.TinyMoney.UnitTests.Vendors;

public class VendorMatchingServiceTests
{
    #region Helpers

    private static VendorMatchingService Build(
        IEnumerable<Vendor> vendors,
        IEnumerable<VendorAlias>? aliases = null)
    {
        var store = new StubVendorStore(vendors, aliases);
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new VendorMatchingService(store, cache);
    }

    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    private static VendorAlias MakeAlias(int vendorId, string alias) =>
        new() { Id = vendorId, VendorId = vendorId, Alias = alias };

    #endregion

    // ── Name-based matching ──────────────────────────────────────────────────

    [Fact]
    public async Task MatchesVendorByName()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BIEDRONKA 4521 POZNAN");

        result.Should().NotBeNull();
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public async Task IsCaseInsensitive()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("biedronka sklep");

        result!.Name.Should().Be("Biedronka");
    }

    // ── Alias-based matching ─────────────────────────────────────────────────

    [Fact]
    public async Task MatchesVendorByAlias()
    {
        var svc = Build(
            [MakeVendor(1, "4F Store")],
            [MakeAlias(1, "octf")]);

        var result = await svc.SuggestVendor("OCTF Piotrkowska 43 Lodz");

        result.Should().NotBeNull();
        result!.Name.Should().Be("4F Store");
    }

    [Fact]
    public async Task PrefersAliasOverVendorNameWhenBothMatch()
    {
        // Vendor 1 has explicit alias "biedronka" (score 2 per token)
        // Vendor 2 has name "Biedronka" (score 1 per token)
        var svc = Build(
            [MakeVendor(1, "VendorWithAlias"), MakeVendor(2, "Biedronka")],
            [MakeAlias(1, "biedronka")]);

        var result = await svc.SuggestVendor("BIEDRONKA 4521 POZNAN");

        result!.Id.Should().Be(1, "alias token scores 2, name token scores 1");
    }

    // ── Noise removal ────────────────────────────────────────────────────────

    [Fact]
    public async Task IgnoresStopWords()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BIEDRONKA PL SP Z O.O. ZAKUP PRZY UZYCIU KARTY");

        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public async Task StripsDateAndAmountNoise()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BIEDRONKA 12.03.2024 123.45");

        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public async Task StripsCardNumber()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BIEDRONKA 1234 5678 9012 3456");

        result!.Name.Should().Be("Biedronka");
    }

    // ── Shattered words ──────────────────────────────────────────────────────

    [Fact]
    public async Task HandlesShatteredWord_TwoFragments()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BIEDR ONKA");

        result.Should().NotBeNull("shattered 2-fragment fallback should join 'biedr'+'onka' to 'biedronka'");
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public async Task HandlesShatteredWord_ThreeFragmentsWithShortPiece()
    {
        // "BI" is only 2 chars — filtered from normal token matching, but kept in concatenation
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("BI EDR ONKA");

        result.Should().NotBeNull("short fragment 'bi' must be retained in the concatenation step");
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public async Task HandlesShatteredAlias()
    {
        // Alias "kaufland" split as "KAUF LAND"
        var svc = Build(
            [MakeVendor(1, "Kaufland")],
            [MakeAlias(1, "kaufland")]);

        var result = await svc.SuggestVendor("KAUF LAND SP Z O.O.");

        result!.Name.Should().Be("Kaufland");
    }

    // ── No match / null cases ────────────────────────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task ReturnsNull_ForEmptyOrWhitespace(string? description)
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor(description!);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ReturnsNull_WhenAllTokensAreStopWords()
    {
        var svc = Build([MakeVendor(1, "Biedronka")]);

        var result = await svc.SuggestVendor("PRZELEW PL SP");

        result.Should().BeNull();
    }

    [Fact]
    public async Task ReturnsNull_WhenNoVendors()
    {
        var svc = Build([]);

        var result = await svc.SuggestVendor("BIEDRONKA 4521 POZNAN");

        result.Should().BeNull();
    }

    // ── Caching ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task CachesIndex_StoreQueriedOnlyOnce()
    {
        var store = new StubVendorStore([MakeVendor(1, "Biedronka")]);
        var cache = new MemoryCache(new MemoryCacheOptions());
        var svc = new VendorMatchingService(store, cache);

        await svc.CreateMatcher();
        await svc.CreateMatcher();

        store.GetVendorsCallCount.Should().Be(1, "second call should hit the cache");
    }

    // ── Stub ─────────────────────────────────────────────────────────────────

    private class StubVendorStore : IVendorStore
    {
        private readonly IEnumerable<Vendor> _vendors;
        private readonly IEnumerable<VendorAlias> _aliases;

        public int GetVendorsCallCount { get; private set; }

        public StubVendorStore(IEnumerable<Vendor> vendors, IEnumerable<VendorAlias>? aliases = null)
        {
            _vendors = vendors;
            _aliases = aliases ?? [];
        }

        public Task<IEnumerable<Vendor>> GetVendors()
        {
            GetVendorsCallCount++;
            return Task.FromResult(_vendors);
        }

        public Task<IEnumerable<VendorAlias>> GetAllAliases() => Task.FromResult(_aliases);

        public Task SaveVendor(Vendor vendor) => throw new NotImplementedException();
        public Task<IEnumerable<VendorDetails>> GetDetailedVendors() => throw new NotImplementedException();
        public Task<VendorDetails> GetVendorDetails(int vendorId) => throw new NotImplementedException();
        public Task UpdateVendor(int vendorId, Vendor vendor) => throw new NotImplementedException();
        public Task DeleteVendor(VendorDetails vendorToDelete, int? mergeToVendorId) => throw new NotImplementedException();
        public Task<IEnumerable<VendorAlias>> GetVendorAliases(int vendorId) => throw new NotImplementedException();
        public Task<VendorAlias> AddVendorAlias(int vendorId, string alias) => throw new NotImplementedException();
        public Task DeleteVendorAlias(int aliasId) => throw new NotImplementedException();
    }
}
