using System.Collections.Generic;
using FluentAssertions;
using MW.TinyMoney.Api.Vendors;
using MW.TinyMoney.UnitTests.Stubs;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsMatching;

public class VendorMatcherTests
{
    private readonly DescriptionPreprocessorMock _descriptionPreprocessorMock = new DescriptionPreprocessorMock();

    private VendorMatcher Build(IReadOnlyCollection<Vendor> vendors, IReadOnlyCollection<VendorAlias>? aliases = null)
        => new(vendors, aliases ?? [], _descriptionPreprocessorMock);

    private static Vendor MakeVendor(int id, string name) =>
        new() { Id = id, Name = name, DefaultSubcategoryId = id };

    private static VendorAlias MakeAlias(int vendorId, string alias) =>
        new() { Id = vendorId, VendorId = vendorId, Alias = alias };

    [Fact]
    public void UsesPreprocessing()
    {
        _descriptionPreprocessorMock.PreprocessOverride = s => "stonka";
        var result = Build([MakeVendor(1, "Stonka"), 
                MakeVendor(2, "Mucha"), MakeVendor(3, "Komar")])
            .Match("stonka mucha komar");
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("Stonka"));
    }
    
    [Theory]
    [InlineData("Stonka")]
    [InlineData("Stonka poznan")]
    public void MatchesVendorByName(string descriptionToMatch)
    {
        var result = Build([MakeVendor(1, "Stonka")]).Match(descriptionToMatch);
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("Stonka"));
    }

    [Fact]
    public void MatchesVendorByAlias()
    {
        var result = Build([MakeVendor(1, "Stonka")], 
            [MakeAlias(1, "Jan Kowalski Franczyza")]).Match("Jan Kowalski Franczyza Bemowo");
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("Stonka"));
    }

    [Fact]
    public void PrefersAliasOverVendorName()
    {
        var result = Build(
            [MakeVendor(1, "VendorWithAlias"), MakeVendor(2, "Stonka")],
            [MakeAlias(1, "Stonka")]
        ).Match("Stonka POZNAN");
        
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("VendorWithAlias"));
    }

    [Fact]
    public void PrefersResultWithHighestScore_sorted_by_highest_score()
    {
        var result = Build(
            [MakeVendor(1, "Stonka"), MakeVendor(2, "Stonka sklep zoologiczny"), 
                MakeVendor(3, "Stonka sklep wielobranżowy"), MakeVendor(4, "sklep wielobranżowy"),
                MakeVendor(5, "market wielobranżowy"), MakeVendor(6, "sklep")]
        ).Match("Stonka sklep wielobranżowy", 3);
        
        result.Should().SatisfyRespectively(
            s => s.Name.Should().Be("Stonka sklep wielobranżowy"),
            s => s.Name.Should().Be("Stonka sklep zoologiczny"),
            s => s.Name.Should().Be("sklep wielobranżowy"));
    }
    
    [Fact]
    public void HandlesShatteredWord()
    {
        var result = Build([MakeVendor(1, "Stonka")]).Match("Sto nka");
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("Stonka"));
    }

    [Fact]
    public void HandlesShatteredAlias()
    {
        var result = Build([MakeVendor(1, "Stonka")], 
            [MakeAlias(1, "Robal")]).Match("Ro bal");
        result.Should().SatisfyRespectively(s => s.Name.Should().Be("Stonka"));
    }
    
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ReturnsNull_ForEmptyOrWhitespace(string? description)
    {
        Build([MakeVendor(1, "Stonka")]).Match(description!).Should().BeEmpty();
    }

    [Fact]
    public void ReturnsNull_WhenNoTokensMatchAnyVendor()
    {
        var result = Build([MakeVendor(1, "Stonka")]).Match("PRZELEW SP PL");
        result.Should().BeEmpty();
    }

    [Fact]
    public void ReturnsNull_WhenNoVendors()
    {
        Build([]).Match("STONKA POZNAN").Should().BeEmpty();
    }

    [Fact]
    public void MatchesVendor_ReturnsTrueWhenDescriptionTokenMatchesVendorName()
    {
        var result = Build([MakeVendor(1, "Stonka")]).MatchesVendor(1, "Stonka Poznan");
        result.Should().BeTrue();
    }

    [Fact]
    public void MatchesVendor_ReturnsTrueWhenDescriptionTokenMatchesVendorAlias()
    {
        var result = Build([MakeVendor(1, "Stonka")], [MakeAlias(1, "Jan Kowalski")])
            .MatchesVendor(1, "Jan Kowalski Bemowo");
        result.Should().BeTrue();
    }

    [Fact]
    public void MatchesVendor_ReturnsFalseWhenNoTokensOverlapVendor()
    {
        var result = Build([MakeVendor(1, "Stonka")]).MatchesVendor(1, "Motyl Warszawa");
        result.Should().BeFalse();
    }

    [Fact]
    public void MatchesVendor_ReturnsFalseForVendorNotInIndex()
    {
        var result = Build([MakeVendor(1, "Stonka")]).MatchesVendor(99, "Stonka Poznan");
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MatchesVendor_ReturnsFalseForEmptyDescription(string description)
    {
        Build([MakeVendor(1, "Stonka")]).MatchesVendor(1, description!).Should().BeFalse();
    }
}
