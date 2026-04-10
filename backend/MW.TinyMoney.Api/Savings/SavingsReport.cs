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
    private const string GetAllSnapshotsQuery = @"
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
        ORDER BY ss.period, ss.account_id";

    public async Task<SavingsReportResponse> Prepare()
    {
        using var connection = connectionFactory.CreateConnection();
        var rows = (await connection.QueryAsync<SnapshotRow>(GetAllSnapshotsQuery)).ToList();

        if (rows.Count == 0)
            return new SavingsReportResponse([], [], [],
                new SavingsTableData([], [], new SavingsTableRow([], 0, 0, 0, 0, null)));

        var allPeriods = rows.Select(r => r.Period).Distinct().OrderBy(p => p).ToList();
        var allAccountIds = rows.Select(r => r.AccountId).Distinct().ToList();

        // For each account, build a sorted list of (period, balance) snapshots
        var snapshotsByAccount = rows
            .GroupBy(r => r.AccountId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderBy(r => r.Period).ToList()
            );

        // Chart 1: Total balance history
        var balanceHistory = new List<BalanceHistoryPoint>();
        foreach (var period in allPeriods)
        {
            var total = 0m;
            foreach (var accountId in allAccountIds)
            {
                if (!snapshotsByAccount.TryGetValue(accountId, out var snapshots)) continue;
                var lastKnown = snapshots.LastOrDefault(s => string.Compare(s.Period, period) <= 0);
                if (lastKnown != null)
                    total += lastKnown.Balance;
            }
            balanceHistory.Add(new BalanceHistoryPoint(period, total));
        }

        // Chart 2: By-category stacked (uses account's current category)
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

        // Chart 3: Cash flows per month
        var balanceByPeriod = balanceHistory.ToDictionary(p => p.Period, p => p.TotalBalance);
        var cashFlows = rows
            .GroupBy(r => r.Period)
            .OrderBy(g => g.Key)
            .Select((g, i) =>
            {
                var deposited = g.Sum(r => r.Deposited);
                var withdrawn = g.Sum(r => r.Withdrawn);
                var currentBalance = balanceByPeriod[g.Key];
                var prevPeriodIndex = allPeriods.IndexOf(g.Key) - 1;
                var prevBalance = prevPeriodIndex >= 0 ? balanceByPeriod[allPeriods[prevPeriodIndex]] : 0m;
                var netGain = currentBalance - prevBalance - deposited + withdrawn;
                return new CashFlowPoint(g.Key, deposited, withdrawn, netGain);
            })
            .ToList();

        // Table: per-account, per-year breakdown
        var tableData = BuildTableData(rows, snapshotsByAccount, categoryByAccount, allPeriods);

        return new SavingsReportResponse(balanceHistory, byCategoryPoints, cashFlows, tableData);
    }

    private static SavingsTableData BuildTableData(
        List<SnapshotRow> rows,
        Dictionary<int, List<SnapshotRow>> snapshotsByAccount,
        Dictionary<int, (int CategoryId, string CategoryName)> categoryByAccount,
        List<string> allPeriods)
    {
        var tableYears = allPeriods.Select(p => p[..4]).Distinct().OrderBy(y => y).ToList();

        // Build per-account data
        var accountTableRows = new Dictionary<int, SavingsTableAccount>();
        foreach (var (accountId, snapshots) in snapshotsByAccount)
        {
            var firstRow = snapshots.First();
            var firstYear = firstRow.Period[..4];
            var lastYear = snapshots.Last().Period[..4];
            var isActive = firstRow.IsActive;

            var periodDataList = new List<SavingsTablePeriodData?>();
            decimal? prevYearBalance = null;

            foreach (var year in tableYears)
            {
                // Empty cell before account opened or after inactive account's last snapshot
                if (string.Compare(year, firstYear) < 0 || (!isActive && string.Compare(year, lastYear) > 0))
                {
                    periodDataList.Add(null);
                    continue;
                }

                var yearSnapshots = snapshots.Where(s => s.Period[..4] == year).ToList();
                var yearDeposited = yearSnapshots.Sum(s => s.Deposited);
                var yearWithdrawn = yearSnapshots.Sum(s => s.Withdrawn);

                // Carry-forward: last known balance up to end of this year
                var lastKnownInOrBefore = snapshots.LastOrDefault(s => string.Compare(s.Period[..4], year) <= 0);
                var yearBalance = lastKnownInOrBefore?.Balance ?? 0m;

                var startingBalance = prevYearBalance ?? 0m;
                var netGain = yearBalance - startingBalance - yearDeposited + yearWithdrawn;
                decimal? roi = startingBalance > 0 ? netGain / startingBalance * 100m : (decimal?)null;

                periodDataList.Add(new SavingsTablePeriodData(year, yearDeposited, yearWithdrawn, yearBalance, netGain, roi));
                prevYearBalance = yearBalance;
            }

            var totalDeposited = snapshots.Sum(s => s.Deposited);
            var totalWithdrawn = snapshots.Sum(s => s.Withdrawn);
            var currentBalance = snapshots.Last().Balance;
            var netInvested = totalDeposited - totalWithdrawn;
            var totalNetGain = currentBalance - netInvested;
            decimal? totalRoi = netInvested > 0 ? totalNetGain / netInvested * 100m : (decimal?)null;

            accountTableRows[accountId] = new SavingsTableAccount(
                accountId,
                firstRow.AccountName,
                periodDataList,
                totalDeposited,
                totalWithdrawn,
                currentBalance,
                totalNetGain,
                totalRoi
            );
        }

        // Group accounts by category, sorted alphabetically
        var categoriesById = categoryByAccount
            .GroupBy(kvp => kvp.Value.CategoryId)
            .Select(g =>
            {
                var categoryId = g.Key;
                var categoryName = g.First().Value.CategoryName;
                var accounts = g
                    .Select(kvp => accountTableRows[kvp.Key])
                    .OrderBy(a => a.AccountName)
                    .ToList();

                // Aggregate per year across accounts in this category
                var catPeriodData = new List<SavingsTablePeriodData?>();
                decimal? catPrevBalance = null;

                foreach (var (year, yearIndex) in tableYears.Select((y, i) => (y, i)))
                {
                    var accountsWithData = accounts
                        .Where(a => a.PeriodData[yearIndex] != null)
                        .Select(a => a.PeriodData[yearIndex]!)
                        .ToList();

                    if (accountsWithData.Count == 0)
                    {
                        catPeriodData.Add(null);
                        continue;
                    }

                    var catDeposited = accountsWithData.Sum(p => p.Deposited);
                    var catWithdrawn = accountsWithData.Sum(p => p.Withdrawn);
                    var catBalance = accountsWithData.Sum(p => p.Balance);

                    var startingBalance = catPrevBalance ?? 0m;
                    var netGain = catBalance - startingBalance - catDeposited + catWithdrawn;
                    decimal? roi = startingBalance > 0 ? netGain / startingBalance * 100m : (decimal?)null;

                    catPeriodData.Add(new SavingsTablePeriodData(year, catDeposited, catWithdrawn, catBalance, netGain, roi));
                    catPrevBalance = catBalance;
                }

                var catTotalDeposited = accounts.Sum(a => a.TotalDeposited);
                var catTotalWithdrawn = accounts.Sum(a => a.TotalWithdrawn);
                var catCurrentBalance = accounts.Sum(a => a.CurrentBalance);
                var catNetInvested = catTotalDeposited - catTotalWithdrawn;
                var catTotalNetGain = catCurrentBalance - catNetInvested;
                decimal? catTotalRoi = catNetInvested > 0
                    ? catTotalNetGain / catNetInvested * 100m
                    : (decimal?)null;

                return new SavingsTableCategory(
                    categoryId,
                    categoryName,
                    catPeriodData,
                    catTotalDeposited,
                    catTotalWithdrawn,
                    catCurrentBalance,
                    catTotalNetGain,
                    catTotalRoi,
                    accounts
                );
            })
            .OrderBy(c => c.CategoryName)
            .ToList();

        // Grand totals row
        var totalsPeriodData = new List<SavingsTablePeriodData>();
        decimal? totalsPrevBalance = null;

        foreach (var (year, yearIndex) in tableYears.Select((y, i) => (y, i)))
        {
            var catsWithData = categoriesById
                .Where(c => c.PeriodData[yearIndex] != null)
                .Select(c => c.PeriodData[yearIndex]!)
                .ToList();

            var totDeposited = catsWithData.Sum(p => p.Deposited);
            var totWithdrawn = catsWithData.Sum(p => p.Withdrawn);
            var totBalance = catsWithData.Sum(p => p.Balance);

            var startingBalance = totalsPrevBalance ?? 0m;
            var netGain = totBalance - startingBalance - totDeposited + totWithdrawn;
            decimal? roi = startingBalance > 0 ? netGain / startingBalance * 100m : (decimal?)null;

            totalsPeriodData.Add(new SavingsTablePeriodData(year, totDeposited, totWithdrawn, totBalance, netGain, roi));
            totalsPrevBalance = totBalance;
        }

        var grandTotalDeposited = categoriesById.Sum(c => c.TotalDeposited);
        var grandTotalWithdrawn = categoriesById.Sum(c => c.TotalWithdrawn);
        var grandCurrentBalance = categoriesById.Sum(c => c.CurrentBalance);
        var grandNetInvested = grandTotalDeposited - grandTotalWithdrawn;
        var grandTotalNetGain = grandCurrentBalance - grandNetInvested;
        decimal? grandTotalRoi = grandNetInvested > 0
            ? grandTotalNetGain / grandNetInvested * 100m
            : (decimal?)null;

        var totals = new SavingsTableRow(totalsPeriodData, grandTotalDeposited, grandTotalWithdrawn, grandCurrentBalance, grandTotalNetGain, grandTotalRoi);

        return new SavingsTableData(tableYears, categoriesById, totals);
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
