#nullable enable
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports;

public interface ISavingsReport
{
    Task<SavingsReportResponse> Prepare();
}

public class SavingsReport(MySqlConnectionFactory connectionFactory) : ISavingsReport
{
    private const string GetAllSnapshotsQuery = """
        SELECT ss.account_id AS AccountId,
           ss.period AS Period,
           ss.balance AS Balance,
           ss.deposited AS Deposited,
           ss.withdrawn AS Withdrawn,
           sa.name AS AccountName,
           sa.category_id AS CategoryId,
           sc.name AS CategoryName,
           sa.is_active AS IsActive
        FROM savings_snapshot ss
        JOIN savings_account sa ON ss.account_id = sa.id
        JOIN savings_category sc ON sa.category_id = sc.id
        ORDER BY ss.period, ss.account_id
        """;

    public async Task<SavingsReportResponse> Prepare()
    {
        var rows = await GetSnapshots();

        if (rows.Count == 0)
            return SavingsReportResponse.Empty;

        var byCategory = BuildByCategory(rows).ToList();
        var cashFlows = BuildCashFlows(rows).ToList();
        var tableData = BuildTableData(rows);

        return new SavingsReportResponse(byCategory, cashFlows, tableData);
    }

    private async Task<List<SnapshotRow>> GetSnapshots()
    {
        await using var connection = connectionFactory.CreateConnection();
        var rows = (await connection.QueryAsync<SnapshotRow>(GetAllSnapshotsQuery)).ToList();
        return rows;
    }

    private static IEnumerable<ByCategoryPoint> BuildByCategory(IReadOnlyCollection<SnapshotRow> rows)
    {
        return rows.GroupBy(r => (r.Period, r.CategoryId, r.CategoryName), row => row, (group, groupedRows) =>
            {
                return new ByCategoryPoint(group.Period, group.CategoryId, group.CategoryName,
                    groupedRows.Sum(row => row.Balance));
            }).ToList();
    }

    private static IEnumerable<CashFlowPoint> BuildCashFlows(
        IReadOnlyCollection<SnapshotRow> rows)
    {
        var snapshotsByPeriod = rows
            .GroupBy(r => r.Period)
            .OrderBy(g => g.Key);

        CashFlowPoint? previous = null;
        foreach (var g in snapshotsByPeriod)
        {
            var deposited = g.Sum(r => r.Deposited);
            var withdrawn = g.Sum(r => r.Withdrawn);
            var currentBalance = g.Sum(r => r.Balance);
            var prevBalance = previous?.CurrentBalance ?? 0m;
            var netGain = currentBalance - prevBalance - deposited + withdrawn;
            previous = new CashFlowPoint(g.Key, currentBalance, deposited, withdrawn, netGain);
            yield return previous;
        }
    }

    private static SavingsTableData BuildTableData(IReadOnlyCollection<SnapshotRow> rows)
    {
        var yearlyRows = rows
            .GroupBy(r => (r.AccountId, Year: r.Period[..4]))
            .Select(g => new YearlySnapshotRow(
                g.Key.AccountId, g.First().AccountName,
                g.First().CategoryId, g.First().CategoryName,
                g.Key.Year, g.Sum(r => r.Deposited), g.Sum(r => r.Withdrawn),
                g.OrderBy(r => r.Period).Last().Balance, g.First().IsActive))
            .ToList();

        var tableYears = yearlyRows.Select(r => r.Year).Distinct().OrderBy(y => y).ToList();

        var accountRows = yearlyRows
            .GroupBy(r => r.AccountId)
            .ToDictionary(g => g.Key, g => BuildAccountRow(g.OrderBy(r => r.Year).ToList(), tableYears));

        var categories = yearlyRows
            .GroupBy(r => (r.CategoryId, r.CategoryName))
            .Select(g =>
            {
                var accounts = g.Select(r => r.AccountId).Distinct()
                    .Select(id => accountRows[id]).OrderBy(a => a.AccountName).ToList();
                return BuildCategoryRow(g.Key.CategoryId, g.Key.CategoryName, accounts, tableYears);
            })
            .OrderBy(c => c.CategoryName)
            .ToList();

        return new SavingsTableData(tableYears, categories, BuildTotalsRow(categories, tableYears));
    }

    private static SavingsTableAccount BuildAccountRow(List<YearlySnapshotRow> yearlySnapshots, IReadOnlyList<string> tableYears)
    {
        var firstYear = yearlySnapshots.First().Year;
        var lastYear = yearlySnapshots.Last().Year;
        var isActive = yearlySnapshots.First().IsActive;
        var byYear = yearlySnapshots.ToDictionary(s => s.Year);

        var periodData = new List<SavingsTablePeriodData?>();
        decimal? prevYearBalance = null;
        foreach (var year in tableYears)
        {
            if (string.CompareOrdinal(year, firstYear) < 0 || (!isActive && string.CompareOrdinal(year, lastYear) > 0))
            {
                periodData.Add(null);
                continue;
            }

            byYear.TryGetValue(year, out var ys);
            var deposited = ys?.Deposited ?? 0m;
            var withdrawn = ys?.Withdrawn ?? 0m;
            var balance = ys?.YearEndBalance ?? prevYearBalance ?? 0m;
            var startingBalance = prevYearBalance ?? 0m;
            var netGain = balance - startingBalance - deposited + withdrawn;

            periodData.Add(new SavingsTablePeriodData(year, deposited, withdrawn, balance, netGain, RoiPercent(netGain, startingBalance)));
            prevYearBalance = balance;
        }

        var totalDeposited = yearlySnapshots.Sum(s => s.Deposited);
        var totalWithdrawn = yearlySnapshots.Sum(s => s.Withdrawn);
        var currentBalance = yearlySnapshots.Last().YearEndBalance;
        var netInvested = totalDeposited - totalWithdrawn;
        var totalNetGain = currentBalance - netInvested;
        return new SavingsTableAccount(yearlySnapshots.First().AccountId, yearlySnapshots.First().AccountName, periodData,
            totalDeposited, totalWithdrawn, currentBalance, totalNetGain, RoiPercent(totalNetGain, netInvested, currentBalance));
    }

    private static SavingsTableCategory BuildCategoryRow(int categoryId, string categoryName,
        List<SavingsTableAccount> accounts, IReadOnlyList<string> tableYears)
    {
        var periodData = AggregatePeriodData(accounts.Select(a => a.PeriodData).ToList(), tableYears);
        var totalDeposited = accounts.Sum(a => a.TotalDeposited);
        var totalWithdrawn = accounts.Sum(a => a.TotalWithdrawn);
        var currentBalance = accounts.Sum(a => a.CurrentBalance);
        var netInvested = totalDeposited - totalWithdrawn;
        var totalNetGain = currentBalance - netInvested;
        return new SavingsTableCategory(categoryId, categoryName, periodData,
            totalDeposited, totalWithdrawn, currentBalance, totalNetGain, RoiPercent(totalNetGain, netInvested, currentBalance), accounts);
    }

    private static SavingsTableRow BuildTotalsRow(List<SavingsTableCategory> categories, IReadOnlyList<string> tableYears)
    {
        var periodData = AggregatePeriodData(categories.Select(c => c.PeriodData).ToList(), tableYears)
            .Select((pd, i) => pd ?? new SavingsTablePeriodData(tableYears[i], 0, 0, 0, 0, null))
            .ToList();
        var totalDeposited = categories.Sum(c => c.TotalDeposited);
        var totalWithdrawn = categories.Sum(c => c.TotalWithdrawn);
        var currentBalance = categories.Sum(c => c.CurrentBalance);
        var netInvested = totalDeposited - totalWithdrawn;
        var totalNetGain = currentBalance - netInvested;
        return new SavingsTableRow(periodData, totalDeposited, totalWithdrawn, currentBalance, totalNetGain, RoiPercent(totalNetGain, netInvested, currentBalance));
    }

    private static List<SavingsTablePeriodData?> AggregatePeriodData(
        List<IReadOnlyList<SavingsTablePeriodData?>> childPeriodDatas, IReadOnlyList<string> tableYears)
    {
        var result = new List<SavingsTablePeriodData?>();
        decimal? prevBalance = null;
        for (var i = 0; i < tableYears.Count; i++)
        {
            var withData = childPeriodDatas.Select(pd => pd[i]).Where(pd => pd != null).Select(pd => pd!).ToList();
            if (withData.Count == 0)
            {
                result.Add(null);
                continue;
            }

            var deposited = withData.Sum(p => p.Deposited);
            var withdrawn = withData.Sum(p => p.Withdrawn);
            var balance = withData.Sum(p => p.Balance);
            var startingBalance = prevBalance ?? 0m;
            var netGain = balance - startingBalance - deposited + withdrawn;

            result.Add(new SavingsTablePeriodData(tableYears[i], deposited, withdrawn, balance, netGain, RoiPercent(netGain, startingBalance)));
            prevBalance = balance;
        }
        return result;
    }

    private static decimal? RoiPercent(decimal netGain, decimal startingBalance, decimal? fallbackBase = null)
    {
        var @base = startingBalance > 0 ? startingBalance : fallbackBase;
        return @base > 0 ? netGain / @base * 100m : null;
    }

    private record YearlySnapshotRow(
        int AccountId, string AccountName, int CategoryId, string CategoryName,
        string Year, decimal Deposited, decimal Withdrawn, decimal YearEndBalance, bool IsActive);

    private class SnapshotRow
    {
        public int AccountId { get; set; }
        public string Period { get; set; } = "";
        public decimal Balance { get; set; }
        public decimal Deposited { get; set; }
        public decimal Withdrawn { get; set; }
        public string AccountName { get; set; } = "";
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = "";
        public bool IsActive { get; set; }
    }
}