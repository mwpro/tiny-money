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

        return new SavingsReportResponse(byCategory, cashFlows);
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