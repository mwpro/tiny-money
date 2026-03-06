using System.Collections.Generic;
using FluentAssertions;
using MW.TinyMoney.Api.Vendors;
using Xunit;

namespace MW.TinyMoney.UnitTests.Vendors;

public class VendorIndexTests
{
    // Preprocessor with no patterns and minimal stop tokens — preprocessing is
    // tested separately in DescriptionPreprocessorTests.
    private static readonly DescriptionPreprocessor Preprocessor =
        new(["pl", "sp", "sa", "z", "oo", "zakup", "przy", "uzyciu", "karty", "karta", "przelew", "pln"], []);

    private static VendorIndex Build(IList<Vendor> vendors, IList<VendorAlias>? aliases = null)
        => new(vendors, aliases ?? [], Preprocessor);

    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    private static VendorAlias MakeAlias(int vendorId, string alias) =>
        new() { Id = vendorId, VendorId = vendorId, Alias = alias };

    // ── Name-based matching ──────────────────────────────────────────────────

    [Fact]
    public void MatchesVendorByName()
    {
        var result = Build([MakeVendor(1, "Biedronka")]).Match("BIEDRONKA POZNAN");
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public void IsCaseInsensitive()
    {
        var result = Build([MakeVendor(1, "Biedronka")]).Match("biedronka sklep");
        result!.Name.Should().Be("Biedronka");
    }

    // ── Alias-based matching ─────────────────────────────────────────────────

    [Fact]
    public void MatchesVendorByAlias()
    {
        var result = Build([MakeVendor(1, "4F Store")], [MakeAlias(1, "octf")]).Match("OCTF Piotrkowska Lodz");
        result!.Name.Should().Be("4F Store");
    }

    [Fact]
    public void PrefersAliasOverVendorName()
    {
        // Vendor 1 has alias "biedronka" (score 2), Vendor 2 has name "Biedronka" (score 1)
        var result = Build(
            [MakeVendor(1, "VendorWithAlias"), MakeVendor(2, "Biedronka")],
            [MakeAlias(1, "biedronka")]
        ).Match("BIEDRONKA POZNAN");

        result!.Id.Should().Be(1, "alias token scores 2, name token scores 1");
    }

    // ── Stop word filtering ──────────────────────────────────────────────────

    [Fact]
    public void IgnoresStopWords()
    {
        var result = Build([MakeVendor(1, "Biedronka")]).Match("BIEDRONKA PL SP Z ZAKUP PRZY UZYCIU KARTY");
        result!.Name.Should().Be("Biedronka");
    }

    // ── Shattered words ──────────────────────────────────────────────────────

    [Fact]
    public void HandlesShatteredWord_TwoFragments()
    {
        var result = Build([MakeVendor(1, "Biedronka")]).Match("BIEDR ONKA");
        result.Should().NotBeNull("fallback should join 'biedr'+'onka' → 'biedronka'");
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public void HandlesShatteredWord_TwoFragments2()
    {
        var result = Build([MakeVendor(1, "Bella Napoli")]).Match(" Za\nmówienie 2026-01-16 13:21 w Be lla N apoli.");
        result.Should().NotBeNull();
        result!.Name.Should().Be("Bella Napoli");
    }

    [Fact]
    public void HandlesShatteredWord_ThreeFragmentsWithShortPiece()
    {
        // "BI" is only 2 chars — filtered from tokenization but kept in concatenation
        var result = Build([MakeVendor(1, "Biedronka")]).Match("BI EDR ONKA");
        result.Should().NotBeNull("short fragment 'bi' must be retained in concatenation");
        result!.Name.Should().Be("Biedronka");
    }

    [Fact]
    public void HandlesShatteredAlias()
    {
        var result = Build([MakeVendor(1, "Kaufland")], [MakeAlias(1, "kaufland")]).Match("KAUF LAND SP Z");
        result!.Name.Should().Be("Kaufland");
    }

    // ── No match / null cases ────────────────────────────────────────────────

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ReturnsNull_ForEmptyOrWhitespace(string? description)
    {
        Build([MakeVendor(1, "Biedronka")]).Match(description!).Should().BeNull();
    }

    [Fact]
    public void ReturnsNull_WhenNoTokensMatchAnyVendor()
    {
        var result = Build([MakeVendor(1, "Biedronka")]).Match("PRZELEW SP PL");
        result.Should().BeNull();
    }

    [Fact]
    public void ReturnsNull_WhenNoVendors()
    {
        Build([]).Match("BIEDRONKA POZNAN").Should().BeNull();
    }
}
