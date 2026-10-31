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

    [Theory]
    [InlineData("ŻABKA", "zabka")]
    [InlineData("Żabka", "zabka")]
    [InlineData("zażółć gęślą jaźń", "zazolc gesla jazn")]
    [InlineData("ŁÓDŹ ŚRÓDMIEŚCIE", "lodz srodmiescie")]
    public void Preprocess_RemovesPolishDiacritics(string input, string expected)
    {
        Preprocessor.Preprocess(input).Should().Be(expected);
    }

    [Theory]
    [InlineData("STONKA PŁATNOŚĆ KARTĄ")]
    [InlineData("STONKA PLATNOSC KARTA")]
    public void Preprocess_StripsStopWordsWithAndWithoutDiacritics(string input)
    {
        Preprocessor.Preprocess(input).Should().Be("stonka");
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
    [InlineData("DE89 3704 0044 0532 0130 00")]
    [InlineData("GB29NWBK60161331926819")]
    public void Preprocess_StripsIBAN(string iban)
    {
        Preprocessor.Preprocess($"stonka {iban}").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StripsAmount()
    {
        Preprocessor.Preprocess("stonka 123.45").Should().Be("stonka");
    }

    [Fact]
    public void Preprocess_StripsPunctuation()
    {
        Preprocessor.Preprocess("stonka x,d,").Should().Be("stonka x d");
    }

    [Fact]
    public void Preprocess_NormalizesWhitespace()
    {
        Preprocessor.Preprocess("  stonka   poznan  ").Should().Be("stonka poznan");
    }

    [Theory]
    [InlineData("e.st", "est")]
    [InlineData("e-st", "est")]
    [InlineData("stonka.com.pl", "stonkacompl")]
    [InlineData("stonka-online.pl", "stonkaonlinepl")]
    public void Preprocess_JoinsWordsOnDotsAndHyphens(string input, string expectedResult)
    {
        Preprocessor.Preprocess(input).Should().Be(expectedResult);
    }
    
    [Fact]
    public void Preprocess_SplitsWordsOnSpecialChars()
    {
        Preprocessor.Preprocess("stonka_pl").Should().Be("stonka pl");
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

    [Theory]
    [InlineData("Przelew na rachunek PL61 1090 1014 0000 0712 1981 2874 Czynsz", "Przelew na rachunek Czynsz")]
    [InlineData("Przelew DE89370400440532013000 Miete", "Przelew Miete")]
    [InlineData("ZAKUP 4246 **** **** 1234 BIEDRONKA", "ZAKUP BIEDRONKA")]
    [InlineData("Karta 424242******1234 ZABKA Z1234", "Karta ZABKA Z1234")]
    [InlineData("Karta XXXX XXXX XXXX 1234 ORLEN", "Karta ORLEN")]
    [InlineData("BLIK przelew na telefon +48 600 123 456", "BLIK przelew na telefon")]
    [InlineData("Nr ref. 2026101400123456 ALLEGRO", "Nr ref ALLEGRO")]
    [InlineData("Data transakcji 2026-10-14 LIDL", "Data transakcji LIDL")]
    [InlineData("MAXXI PIZZA 45,50 PLN", "MAXXI PIZZA PLN")]
    public void Sanitize_RemovesNumbersAndPunctuation(string description, string expected)
    {
        Preprocessor.Sanitize(description).Should().Be(expected);
    }

    [Theory]
    [InlineData("ZABKA Z1234 WARSZAWA")]
    [InlineData("AB12 Warszawa Marszałkowska")]
    [InlineData("Zakup przy użyciu karty STONKA")]
    public void Sanitize_KeepsCasingStopTokensAndCodes(string description)
    {
        Preprocessor.Sanitize(description).Should().Be(description);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    public void Sanitize_ReturnsEmpty_ForBlankDescription(string description)
    {
        Preprocessor.Sanitize(description).Should().BeEmpty();
    }

    [Fact]
    public void Tokenize_FiltersShortTokens()
    {
        var tokens = Preprocessor.Tokenize("stonka 4f c");
        tokens.Should().BeEquivalentTo("stonka", "4f");
    }

    [Theory]
    [InlineData("H&M", "hm")]
    [InlineData("4F", "4f")]
    [InlineData("C & A", "ca")]
    [InlineData("H&M HENNES", "hm", "hennes")]
    public void Tokenize_KeepsShortNames(string name, params string[] expected)
    {
        var tokens = Preprocessor.Tokenize(Preprocessor.Preprocess(name));
        tokens.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void Preprocess_DoesNotJoinWordsAroundAmpersand()
    {
        Preprocessor.Preprocess("Hennes & Mauritz").Should().Be("hennes mauritz");
    }

    [Theory]
    [InlineData("STONKA UL DLUGA 5", "stonka", "dluga")]
    [InlineData("STONKA SP Z O.O. SP.K.", "stonka")]
    [InlineData("AMAZON DE", "amazon")]
    public void Tokenize_DropsShortNoiseTokens(string description, params string[] expected)
    {
        var tokens = Preprocessor.Tokenize(Preprocessor.Preprocess(description));
        tokens.Should().BeEquivalentTo(expected);
    }

    [Fact]
    public void Tokenize_ReturnsEmptyForSingleCharacter()
    {
        var tokens = Preprocessor.Tokenize("x");
        tokens.Should().BeEmpty();
    }

    [Fact]
    public void Tokenize_RemovesDuplicateTokens()
    {
        var tokens = Preprocessor.Tokenize("stonka poznan stonka");
        tokens.Should().BeEquivalentTo("stonka", "poznan");
    }
}
