#nullable enable
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Savings.ApiModels;

namespace MW.TinyMoney.Api.Savings;

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
        await using var connection = connectionFactory.CreateConnection();
        var rows = (await connection.QueryAsync<SnapshotRow>(GetAllSnapshotsQuery)).ToList();

        if (rows.Count == 0)
            return new SavingsReportResponse([], [], [],
                new SavingsTableData([], [], new SavingsTableRow([], 0, 0, 0, 0, null)));

        var allPeriods = rows.Select(r => r.Period).Distinct().OrderBy(p => p).ToList();
        var allAccountIds = rows.Select(r => r.AccountId).Distinct().ToList();
        var periodIndex = allPeriods.Select((p, i) => (p, i)).ToDictionary(x => x.p, x => x.i);

        var snapshotsByAccount = rows
            .GroupBy(r => r.AccountId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(r => r.Period).ToList()
            );

        var balanceHistory = new List<BalanceHistoryPoint>();
        foreach (var period in allPeriods)
        {
            var total = 0m;
            foreach (var accountId in allAccountIds)
            {
                if (!snapshotsByAccount.TryGetValue(accountId, out var snapshots)) continue;
                var lastKnown = snapshots.LastOrDefault(s => string.CompareOrdinal(s.Period, period) <= 0);
                if (lastKnown != null)
                    total += lastKnown.Balance;
            }
            balanceHistory.Add(new BalanceHistoryPoint(period, total));
        }

        var categoryByAccount = rows
            .GroupBy(r => r.AccountId)
            .ToDictionary(g => g.Key, g => (CategoryId: g.First().CategoryId, CategoryName: g.First().CategoryName));

        var byCategoryPoints = new List<ByCategoryPoint>();
        foreach (var period in allPeriods)
        {
            var categoryBalances = new Dictionary<int, (string Name, decimal Balance)>();
            foreach (var accountId in allAccountIds)
            {
                if (!snapshotsByAccount.TryGetValue(accountId, out var snapshots)) continue;
                var lastKnown = snapshots.LastOrDefault(s => string.Compare(s.Period, period) <= 0);
                if (lastKnown == null) continue;

                var (catId, catName) = categoryByAccount[accountId];
                if (categoryBalances.TryGetValue(catId, out var existing))
                    categoryBalances[catId] = (catName, existing.Balance + lastKnown.Balance);
                else
                    categoryBalances[catId] = (catName, lastKnown.Balance);
            }
            foreach (var kvp in categoryBalances)
                byCategoryPoints.Add(new ByCategoryPoint(period, kvp.Key, kvp.Value.Name, kvp.Value.Balance));
        }

        var balanceByPeriod = balanceHistory.ToDictionary(p => p.Period, p => p.TotalBalance);
        var cashFlows = rows
            .GroupBy(r => r.Period)
            .OrderBy(g => g.Key)
            .Select(g =>
            {
                var deposited = g.Sum(r => r.Deposited);
                var withdrawn = g.Sum(r => r.Withdrawn);
                var currentBalance = balanceByPeriod[g.Key];
                var prevIdx = periodIndex[g.Key] - 1;
                var prevBalance = prevIdx >= 0 ? balanceByPeriod[allPeriods[prevIdx]] : 0m;
                var netGain = currentBalance - prevBalance - deposited + withdrawn;
                return new CashFlowPoint(g.Key, deposited, withdrawn, netGain);
            })
            .ToList();

        var tableData = BuildTableData(snapshotsByAccount, categoryByAccount, allPeriods);

        return new SavingsReportResponse(balanceHistory, byCategoryPoints, cashFlows, tableData);
    }

    private static decimal? RoiPercent(decimal netGain, decimal startingBalance)
        => startingBalance > 0 ? netGain / startingBalance * 100m : (decimal?)null;

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
