using FluentAssertions;
using MW.TinyMoney.Api.Reports;
using Xunit;

namespace MW.TinyMoney.UnitTests.Reports;

public class SummaryReportLabelHelpersTests
{
    [Theory]
    [InlineData("2024-03", true, "2023-03")]
    [InlineData("2024-01", true, "2023-01")]
    [InlineData("2023-12", true, "2022-12")]
    [InlineData("2020-06", true, "2019-06")]
    [InlineData("2024", false, "2023")]
    [InlineData("2020", false, "2019")]
    [InlineData("2000", false, "1999")]
    public void GetYoyLabel_ReturnsExpectedLabel(string input, bool splitByMonth, string expected)
    {
        SummaryReport.GetYoyLabel(input, splitByMonth).Should().Be(expected);
    }

    [Theory]
    [InlineData("2024-03", "2024-02")]
    [InlineData("2024-01", "2023-12")]
    [InlineData("2023-03", "2023-02")]
    [InlineData("2020-06", "2020-05")]
    public void GetMomLabel_ReturnsExpectedLabel(string input, string expected)
    {
        SummaryReport.GetMomLabel(input).Should().Be(expected);
    }
}
