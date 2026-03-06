using System.Text.RegularExpressions;
using FluentAssertions;
using MW.TinyMoney.Api.Vendors;
using Xunit;

namespace MW.TinyMoney.UnitTests.Vendors;

public class DescriptionPreprocessorTests
{
    private static readonly Regex[] StopPatterns =
    [
        new(@"\b\d{1,2}[.\-]\d{1,2}[.\-]\d{2,4}\b", RegexOptions.Compiled),  // dates
        new(@"([0-9x]{4}[\s*xX]+){2,4}", RegexOptions.Compiled),              // card numbers
        new(@"\b\d+[,.]?\d*\b", RegexOptions.Compiled),                        // amounts
        new(@"[^\w\s]", RegexOptions.Compiled),                                 // punctuation
        new(@"\s+", RegexOptions.Compiled),                                     // whitespace
    ];

    private static readonly string[] StopTokens = ["pl", "sp", "sa", "z", "oo", "zakup", "przy", "uzyciu", "karty", "karta", "przelew", "pln"];

    private static DescriptionPreprocessor Build(string[]? stopTokens = null)
        => new(stopTokens ?? StopTokens, StopPatterns);

    // ── Preprocess ───────────────────────────────────────────────────────────

    [Fact]
    public void Preprocess_LowercasesInput()
    {
        var result = Build().Preprocess("BIEDRONKA");
        result.Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsDate()
    {
        var result = Build().Preprocess("biedronka 12.03.2024");
        result.Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsCardNumber()
    {
        var result = Build().Preprocess("biedronka 1234 5678 9012 3456");
        result.Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsAmount()
    {
        var result = Build().Preprocess("biedronka 123.45");
        result.Should().Be("biedronka");
    }

    [Fact]
    public void Preprocess_StripsPunctuation()
    {
        var result = Build().Preprocess("sp. z o.o.");
        result.Should().Be("sp z o o");
    }

    [Fact]
    public void Preprocess_NormalizesWhitespace()
    {
        var result = Build().Preprocess("  biedronka   poznan  ");
        result.Should().Be("biedronka poznan");
    }

    // ── Tokenize ─────────────────────────────────────────────────────────────

    [Fact]
    public void Tokenize_FiltersStopTokens()
    {
        var preprocessor = Build();
        var tokens = preprocessor.Tokenize("biedronka pl sp zakup");
        tokens.Should().BeEquivalentTo(["biedronka"]);
    }

    [Fact]
    public void Tokenize_FiltersShortTokens()
    {
        var preprocessor = Build();
        var tokens = preprocessor.Tokenize("biedronka ab c");
        tokens.Should().BeEquivalentTo(["biedronka"]);
    }

    // ── IsStopToken ──────────────────────────────────────────────────────────

    [Fact]
    public void IsStopToken_ReturnsTrueForStopToken()
    {
        Build().IsStopToken("pl").Should().BeTrue();
    }

    [Fact]
    public void IsStopToken_IsCaseInsensitive()
    {
        Build().IsStopToken("PL").Should().BeTrue();
    }

    [Fact]
    public void IsStopToken_ReturnsFalseForNonStopToken()
    {
        Build().IsStopToken("biedronka").Should().BeFalse();
    }
}
