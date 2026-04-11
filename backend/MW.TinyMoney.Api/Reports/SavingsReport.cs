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

        var allPeriods = rows.Select(r => r.Period).Distinct().OrderBy(p => p).ToList();
       
        var snapshotsByAccount = rows
            .GroupBy(r => r.AccountId)
            .ToDictionary(g => g.Key, g => g.OrderBy(r => r.Period).ToList());

        var categoryByAccount = rows
            .GroupBy(r => r.AccountId)
            .ToDictionary(g => g.Key, g => (CategoryId: g.First().CategoryId, CategoryName: g.First().CategoryName));

        var byCategory = BuildByCategory(rows).ToList();
        var cashFlows = BuildCashFlows(rows).ToList();
        var tableData = BuildTableData(snapshotsByAccount, categoryByAccount, allPeriods);

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
        return rows.GroupBy(r => (r.Period, r.CategoryId, r.CategoryName), row => row, (group, rows) =>
            {
                return new ByCategoryPoint(group.Period, group.CategoryId, group.CategoryName,
                    rows.Sum(r => r.Balance));
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

    private static SavingsTableData BuildTableData(
        Dictionary<int, List<SnapshotRow>> snapshotsByAccount,
        Dictionary<int, (int CategoryId, string CategoryName)> categoryByAccount,
        List<string> allPeriods)
    {
        var tableYears = allPeriods.Select(p => p[..4]).Distinct().OrderBy(y => y).ToList();

        var accountTableRows = new Dictionary<int, SavingsTableAccount>();
        foreach (var (accountId, snapshots) in snapshotsByAccount)
        {
            var firstRow = snapshots.First();
            var firstYear = firstRow.Period[..4];
            var lastYear = snapshots.Last().Period[..4];
            var isActive = firstRow.IsActive;

            var snapshotsByYear = snapshots.GroupBy(s => s.Period[..4])
                .ToDictionary(g => g.Key, g => g.ToList());

            var periodDataList = new List<SavingsTablePeriodData?>();
            decimal? prevYearBalance = null;

            foreach (var year in tableYears)
            {
                if (string.Compare(year, firstYear) < 0 || (!isActive && string.Compare(year, lastYear) > 0))
                {
                    periodDataList.Add(null);
                    continue;
                }

                var yearDeposited = snapshotsByYear.TryGetValue(year, out var ys) ? ys.Sum(s => s.Deposited) : 0m;
                var yearWithdrawn = snapshotsByYear.TryGetValue(year, out var yw) ? yw.Sum(s => s.Withdrawn) : 0m;
                var yearBalance = snapshots.LastOrDefault(s => string.Compare(s.Period[..4], year) <= 0)?.Balance ?? 0m;

                var startingBalance = prevYearBalance ?? 0m;
                var netGain = yearBalance - startingBalance - yearDeposited + yearWithdrawn;

                periodDataList.Add(new SavingsTablePeriodData(year, yearDeposited, yearWithdrawn, yearBalance, netGain, RoiPercent(netGain, startingBalance)));
                prevYearBalance = yearBalance;
            }

            var totalDeposited = snapshots.Sum(s => s.Deposited);
            var totalWithdrawn = snapshots.Sum(s => s.Withdrawn);
            var currentBalance = snapshots.Last().Balance;
            var netInvested = totalDeposited - totalWithdrawn;
            var totalNetGain = currentBalance - netInvested;

            accountTableRows[accountId] = new SavingsTableAccount(
                accountId, firstRow.AccountName, periodDataList,
                totalDeposited, totalWithdrawn, currentBalance,
                totalNetGain, RoiPercent(totalNetGain, netInvested)
            );
        }

        var categoriesById = categoryByAccount
            .GroupBy(kvp => kvp.Value.CategoryId)
            .Select(g =>
            {
                var categoryId = g.Key;
                var categoryName = g.First().Value.CategoryName;
                var accounts = g.Select(kvp => accountTableRows[kvp.Key]).OrderBy(a => a.AccountName).ToList();

                var catPeriodData = new List<SavingsTablePeriodData?>();
                decimal? catPrevBalance = null;

                foreach (var (year, yearIndex) in tableYears.Select((y, i) => (y, i)))
                {
                    var withData = accounts
                        .Where(a => a.PeriodData[yearIndex] != null)
                        .Select(a => a.PeriodData[yearIndex]!)
                        .ToList();

                    if (withData.Count == 0)
                    {
                        catPeriodData.Add(null);
                        continue;
                    }

                    var catDeposited = withData.Sum(p => p.Deposited);
                    var catWithdrawn = withData.Sum(p => p.Withdrawn);
                    var catBalance = withData.Sum(p => p.Balance);
                    var startingBalance = catPrevBalance ?? 0m;
                    var netGain = catBalance - startingBalance - catDeposited + catWithdrawn;

                    catPeriodData.Add(new SavingsTablePeriodData(year, catDeposited, catWithdrawn, catBalance, netGain, RoiPercent(netGain, startingBalance)));
                    catPrevBalance = catBalance;
                }

                var catTotalDeposited = accounts.Sum(a => a.TotalDeposited);
                var catTotalWithdrawn = accounts.Sum(a => a.TotalWithdrawn);
                var catCurrentBalance = accounts.Sum(a => a.CurrentBalance);
                var catNetInvested = catTotalDeposited - catTotalWithdrawn;
                var catTotalNetGain = catCurrentBalance - catNetInvested;

                return new SavingsTableCategory(
                    categoryId, categoryName, catPeriodData,
                    catTotalDeposited, catTotalWithdrawn, catCurrentBalance,
                    catTotalNetGain, RoiPercent(catTotalNetGain, catNetInvested),
                    accounts
                );
            })
            .OrderBy(c => c.CategoryName)
            .ToList();

        var totalsPeriodData = new List<SavingsTablePeriodData>();
        decimal? totalsPrevBalance = null;

        foreach (var (year, yearIndex) in tableYears.Select((y, i) => (y, i)))
        {
            var withData = categoriesById
                .Where(c => c.PeriodData[yearIndex] != null)
                .Select(c => c.PeriodData[yearIndex]!)
                .ToList();

            var totDeposited = withData.Sum(p => p.Deposited);
            var totWithdrawn = withData.Sum(p => p.Withdrawn);
            var totBalance = withData.Sum(p => p.Balance);
            var startingBalance = totalsPrevBalance ?? 0m;
            var netGain = totBalance - startingBalance - totDeposited + totWithdrawn;

            totalsPeriodData.Add(new SavingsTablePeriodData(year, totDeposited, totWithdrawn, totBalance, netGain, RoiPercent(netGain, startingBalance)));
            totalsPrevBalance = totBalance;
        }

        var grandTotalDeposited = categoriesById.Sum(c => c.TotalDeposited);
        var grandTotalWithdrawn = categoriesById.Sum(c => c.TotalWithdrawn);
        var grandCurrentBalance = categoriesById.Sum(c => c.CurrentBalance);
        var grandNetInvested = grandTotalDeposited - grandTotalWithdrawn;
        var grandTotalNetGain = grandCurrentBalance - grandNetInvested;

        return new SavingsTableData(
            tableYears,
            categoriesById,
            new SavingsTableRow(totalsPeriodData, grandTotalDeposited, grandTotalWithdrawn, grandCurrentBalance, grandTotalNetGain, RoiPercent(grandTotalNetGain, grandNetInvested))
        );
    }

    private static decimal? RoiPercent(decimal netGain, decimal startingBalance)
        => startingBalance > 0 ? netGain / startingBalance * 100m : (decimal?)null;

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