using System;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Reports;
using Xunit;

namespace MW.TinyMoney.UnitTests.Reports;

public class ReportsControllerTests
{
    private readonly DashboardReportStub _dashboardReport;
    private readonly ReportsController _controller;

    public ReportsControllerTests()
    {
        _dashboardReport = new DashboardReportStub();
        _controller = new ReportsController();
    }

    [Fact]
    public async Task GetTrmnlDashboard_CallsGetDashboardDataWithCurrentYearAndMonth_ReturnsOkWithResult()
    {
        var expectedResponse = new DashboardResponse { IncomesTotal = 1000m, ExpensesTotal = 800m };
        _dashboardReport.Response = expectedResponse;

        var result = await _controller.GetTrmnlDashboard(_dashboardReport);

        var now = DateTime.UtcNow;
        _dashboardReport.LastYear.Should().Be(now.Year);
        _dashboardReport.LastMonth.Should().Be(now.Month);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeSameAs(expectedResponse);
    }

    private class DashboardReportStub : IDashboardReport
    {
        public DashboardResponse Response { get; set; } = new();
        public int LastYear { get; private set; }
        public int LastMonth { get; private set; }

        public Task<DashboardResponse> GetDashboardData(int year, int month)
        {
            LastYear = year;
            LastMonth = month;
            return Task.FromResult(Response);
        }
    }
}
