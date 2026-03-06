using FluentAssertions;
using MW.TinyMoney.Api.Vendors.Matching;
using Xunit;

namespace MW.TinyMoney.UnitTests.Vendors;

public class DescriptionPreprocessorTests
{
    private static readonly string[] StopPatterns =
    [
        @"\b\d{1,2}[.\-]\d{1,2}[.\-]\d{2,4}\b",  // dates
        @"([0-9x]{4}[\s*xX]+){2,4}",             // card numbers
        @"\b\d+[,.]?\d*\b",                      // amounts
        @"[^\w\s]",                              // punctuation
        @"\s+",                                  // whitespace
    ];

    private static readonly string[] StopTokens = ["pl", "sp", "sa", "z", "oo", "zakup", "przy", "uzyciu", "karty", "karta", "przelew", "pln"];

    private static DescriptionPreprocessor Build(string[]? stopTokens = null)
        => new(stopTokens ?? StopTokens, StopPatterns);

    // ── Preprocess ───────────────────────────────────────────────────────────

    [Fact]
    public void Preprocess_LowercasesInput()
    {
        Build().Preprocess("BIEDRONKA").Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsStopWords()
    {
        Build().Preprocess("BIEDRONKA PL SP ZAKUP PRZY UZYCIU KARTY").Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StopWordMatchIsWordBoundaryOnly()
    {
        // "pl" is a stop word but must not mangle "platnosc" or "poznan"
        Build().Preprocess("platnosc poznan").Should().Be("platnosc poznan");
    }

    [Fact]
    public void Preprocess_StripsDate()
    {
        Build().Preprocess("biedronka 12.03.2024").Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsCardNumber()
    {
        Build().Preprocess("biedronka 1234 5678 9012 3456").Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsAmount()
    {
        Build().Preprocess("biedronka 123.45").Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsPunctuation()
    {
        // no stop words in input so only punctuation stripping is exercised
        Build(stopTokens: []).Preprocess("biedronka o.o.").Should().Be("biedronka o o");
    }

    [Fact]
    public void Preprocess_NormalizesWhitespace()
    {
        Build().Preprocess("  biedronka   poznan  ").Should().Be("biedronka poznan");
    }

    // ── GenerateShatteredCombinations ────────────────────────────────────────

    [Fact]
    public void GenerateShatteredCombinations_TwoFragments()
    {
        var result = Build().GenerateShatteredCombinations("biedr onka");
        result.Should().BeEquivalentTo(["biedronka"]);
    }

    [Fact]
    public void GenerateShatteredCombinations_ThreeFragments()
    {
        var result = Build().GenerateShatteredCombinations("bi edr onka");
        result.Should().BeEquivalentTo(["biedr", "biedronka", "edronka"]);
    }

    [Fact]
    public void GenerateShatteredCombinations_CapsAtThreePieces()
    {
        // "ab cd ef gh" — combinations spanning more than 3 fragments should not be generated
        var result = Build().GenerateShatteredCombinations("ab cd ef gh");
        result.Should().Contain("abcd");     // 2 fragments ✓
        result.Should().Contain("abcdef");   // 3 fragments ✓
        result.Should().NotContain("abcdefgh"); // 4 fragments — capped
    }

    [Fact]
    public void GenerateShatteredCombinations_SingleFragment_ReturnsEmpty()
    {
        var result = Build().GenerateShatteredCombinations("biedronka");
        result.Should().BeEmpty();
    }

    // ── Tokenize ─────────────────────────────────────────────────────────────

    [Fact]
    public void Tokenize_SplitsOnWhitespace()
    {
        var tokens = Build().Tokenize("biedronka poznan");
        tokens.Should().BeEquivalentTo(["biedronka", "poznan"]);
    }

    [Fact]
    public void Tokenize_FiltersShortTokens()
    {
        var tokens = Build().Tokenize("biedronka ab c");
        tokens.Should().BeEquivalentTo(["biedronka"]);
    }
}
