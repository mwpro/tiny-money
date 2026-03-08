using FluentAssertions;
using MW.TinyMoney.Api.Vendors.Matching;
using Xunit;

namespace MW.TinyMoney.UnitTests.VendorsMatching;

public class DescriptionPreprocessorTests
{
    private static readonly DescriptionPreprocessor Preprocessor = DescriptionPreprocessor.CreateFromFiles();

    [Fact]
    public void Preprocess_LowercasesInput()
    {
        Preprocessor.Preprocess("STONKA").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StripsStopWords()
    {
        Preprocessor.Preprocess("STONKA PL SP ZAKUP PRZY UZYCIU KARTY").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StopWordMatchIsWordBoundaryOnly()
    {
        // "pl" is a stop word but must not mangle "platnosc" or "poznan"
        Preprocessor.Preprocess("zakupy poznan").Should().Be("zakupy poznan");
    }

    [Fact]
    public void Preprocess_StripsDate()
    {
        Preprocessor.Preprocess("stonka 12.03.2024").Should().Be("stonka");
    }

    [Theory]
    [InlineData("1234 5678 9012 3456")]
    [InlineData("4321 xxxx xxxx 1234")]
    [InlineData("4321xxxxxxxx1234")]
    public void Preprocess_StripsCardNumber(string creditCardNumber)
    {
        Preprocessor.Preprocess($"stonka {creditCardNumber}").Should().Be("stonka");
    }

    [Theory]
    [InlineData("12 1234 1234 1234 1234 1234 1234")]
    [InlineData("12123412341234123412341234")]
    [InlineData("PL12 1234 1234 1234 1234 1234 1234")]
    [InlineData("PL12123412341234123412341234")]
    public void Preprocess_StripsPlIBAN(string polishBankAccountNumber)
    {
        Preprocessor.Preprocess($"stonka {polishBankAccountNumber}").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StripsAmount()
    {
        Preprocessor.Preprocess("stonka 123.45").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StripsPunctuation()
    {
        Preprocessor.Preprocess("stonka o.o.").Should().Be("stonka o o");
    }

    [Fact]
    public void Preprocess_NormalizesWhitespace()
    {
        Preprocessor.Preprocess("  stonka   poznan  ").Should().Be("stonka poznan");
    }

    [Fact]
    public void GenerateShatteredCombinations_TwoFragments()
    {
        var result = Preprocessor.GenerateShatteredCombinations("super market");
        result.Should().BeEquivalentTo("supermarket");
    }

    [Fact]
    public void GenerateShatteredCombinations_ThreeFragments()
    {
        var result = Preprocessor.GenerateShatteredCombinations("su per market");
        result.Should().BeEquivalentTo("super", "permarket", "supermarket");
    }

    [Fact]
    public void GenerateShatteredCombinations_CapsAtThreePieces()
    {
        var result = Preprocessor.GenerateShatteredCombinations("ala su per market kota");
        result.Should().BeEquivalentTo("alasu", "alasuper", "super", "permarket", "supermarket", "permarketkota", "marketkota");
    }

    [Fact]
    public void GenerateShatteredCombinations_SingleFragment_ReturnsEmpty()
    {
        var result = Preprocessor.GenerateShatteredCombinations("stonka");
        result.Should().BeEmpty();
    }

    [Fact]
    public void Tokenize_SplitsOnWhitespace()
    {
        var tokens = Preprocessor.Tokenize("stonka poznan");
        tokens.Should().BeEquivalentTo("stonka", "poznan");
    }

    [Fact]
    public void Tokenize_FiltersShortTokens()
    {
        var tokens = Preprocessor.Tokenize("stonka ab c");
        tokens.Should().BeEquivalentTo("stonka");
    }

    [Fact]
    public void Tokenize_RemovesDuplicateTokens()
    {
        var tokens = Preprocessor.Tokenize("stonka poznan stonka");
        tokens.Should().BeEquivalentTo("stonka", "poznan");
    }
}
