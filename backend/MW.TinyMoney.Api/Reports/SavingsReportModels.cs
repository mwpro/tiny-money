#nullable enable
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Reports;

public record SavingsReportResponse(
    IReadOnlyList<ByCategoryPoint> ByCategory,
    IReadOnlyList<CashFlowPoint> CashFlows
)
{
    public static SavingsReportResponse Empty => new SavingsReportResponse([], []);
};
public record ByCategoryPoint(string Period, int CategoryId, string CategoryName, decimal Balance);
public record CashFlowPoint(
    string Period,
    decimal CurrentBalance,
    decimal Deposited,
    decimal Withdrawn,
    decimal NetGain);
