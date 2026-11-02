using FluentAssertions;
using MW.TinyMoney.Api.AiSuggestions;
using Xunit;

namespace MW.TinyMoney.UnitTests.AiSuggestions;

public class OpenRouterAppAttributionTests
{
    [Theory]
    [InlineData("1.0.0", "1.0.0")]
    [InlineData("1.0.0+80fed8e1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7", "1.0.0+80fed8e")]
    [InlineData(null, "unknown")]
    [InlineData("", "unknown")]
    public void ShortensCommitHashInVersion(string informationalVersion, string expected)
    {
        AiSuggestionsServiceCollectionExtensions.AppVersion(informationalVersion).Should().Be(expected);
    }

    [Fact]
    public void BuildsRefererFromEnvironmentAndVersion()
    {
        AiSuggestionsServiceCollectionExtensions.AppReferer("Production", "1.0.0+80fed8e")
            .Should().Be("production.tinymoney/1.0.0+80fed8e");
    }
}
