#nullable enable
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Savings.ApiModels;

public record SavingsReportResponse(
    IReadOnlyList<BalanceHistoryPoint> BalanceHistory,
    IReadOnlyList<ByCategoryPoint> ByCategory,
    IReadOnlyList<CashFlowPoint> CashFlows,
    SavingsTableData TableData
);

public record BalanceHistoryPoint(string Period, decimal TotalBalance);
public record ByCategoryPoint(string Period, int CategoryId, string CategoryName, decimal Balance);
public record CashFlowPoint(string Period, decimal Deposited, decimal Withdrawn, decimal NetGain);

public record SavingsTableData(
    IReadOnlyList<string> Periods,
    IReadOnlyList<SavingsTableCategory> Categories,
    SavingsTableRow Totals
);

public record SavingsTableCategory(
    int CategoryId,
    string CategoryName,
    IReadOnlyList<SavingsTablePeriodData?> PeriodData,
    decimal TotalDeposited,
    decimal TotalWithdrawn,
    decimal CurrentBalance,
    decimal TotalNetGain,
    decimal? TotalRoi,
    IReadOnlyList<SavingsTableAccount> Accounts
);

public record SavingsTableAccount(
    int AccountId,
    string AccountName,
    IReadOnlyList<SavingsTablePeriodData?> PeriodData,
    decimal TotalDeposited,
    decimal TotalWithdrawn,
    decimal CurrentBalance,
    decimal TotalNetGain,
    decimal? TotalRoi
);

public record SavingsTablePeriodData(string Period, decimal Deposited, decimal Withdrawn, decimal Balance, decimal NetGain, decimal? Roi);

public record SavingsTableRow(
    IReadOnlyList<SavingsTablePeriodData> PeriodData,
    decimal TotalDeposited,
    decimal TotalWithdrawn,
    decimal CurrentBalance,
    decimal TotalNetGain,
    decimal? TotalRoi
);
