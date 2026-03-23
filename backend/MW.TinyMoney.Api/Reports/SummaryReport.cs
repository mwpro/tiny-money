using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports;

public interface ISummaryReport
{
    Task<SummaryReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth);
}

public class SummaryReport : ISummaryReport
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public SummaryReport(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    private const string GetBudgetsQuery = @"SELECT
                DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m') AS 'period',
                SUM(amount) AS `budget`
            FROM budget b
            WHERE (@fromYear IS NULL OR year > @fromYear OR (year = @fromYear AND month >= @fromMonth))
                AND (@toYear IS NULL OR year < @toYear OR (year = @toYear AND month <= @toMonth))
            GROUP BY DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m')";

    private const string SummaryReportQuery = @"WITH periods AS (
                    SELECT DISTINCT DATE_FORMAT(transaction_date, @periodPattern) AS period_name
                    FROM transaction
                    WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
                      AND is_verified = 1
                ),
                all_combinations AS (
                    SELECT
                        p.period_name,
                        IF(@periodPattern = '%Y-%m',
                            DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(p.period_name, '-01'), '%Y-%m-%d'), INTERVAL 1 YEAR), '%Y-%m'),
                            DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(p.period_name, '-01-01'), '%Y-%m-%d'), INTERVAL 1 YEAR), '%Y')
                        ) AS yoy_period_name,
                        DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(p.period_name, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '%Y-%m') AS mom_period_name,
                        c.id AS catId, c.is_income AS isIncome, c.name AS catName,
                        s.id AS subId, s.name AS subName
                    FROM periods p
                    CROSS JOIN category c
                    JOIN subcategory s ON s.parent_category_id = c.id
                ),
                monthly_sums AS (
                    SELECT DATE_FORMAT(transaction_date, @periodPattern) AS period_name,
                           subcategory_id, SUM(amount) AS total_amount
                    FROM transaction
                    WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
                      AND is_verified = 1
                    GROUP BY period_name, subcategory_id
                ),
                yoy_sums AS (
                    SELECT DATE_FORMAT(transaction_date, @periodPattern) AS period_name,
                           subcategory_id, SUM(amount) AS total_amount
                    FROM transaction
                    WHERE (@yoyDateFrom IS NULL OR transaction_date >= @yoyDateFrom)
                      AND (@yoyDateTo IS NULL OR transaction_date <= @yoyDateTo)
                      AND is_verified = 1
                    GROUP BY period_name, subcategory_id
                ),
                mom_sums AS (
                    SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS period_name,
                           subcategory_id, SUM(amount) AS total_amount
                    FROM transaction
                    WHERE (@momDateFrom IS NULL OR transaction_date >= @momDateFrom)
                      AND (@momDateTo IS NULL OR transaction_date <= @momDateTo)
                      AND is_verified = 1
                    GROUP BY period_name, subcategory_id
                )
                SELECT
                    ac.period_name AS 'period',
                    ac.catId AS 'categoryId', ac.isIncome AS 'isIncome', ac.catName AS 'categoryName',
                    ac.subId AS 'subcategoryId', ac.subName AS 'subcategoryName',
                    COALESCE(ms.total_amount, 0) AS 'transactionsSum',
                    yoy.total_amount AS 'yoySum',
                    mom.total_amount AS 'momSum'
                FROM all_combinations ac
                LEFT JOIN monthly_sums ms  ON ac.period_name     = ms.period_name  AND ac.subId = ms.subcategory_id
                LEFT JOIN yoy_sums yoy     ON ac.yoy_period_name = yoy.period_name AND ac.subId = yoy.subcategory_id
                LEFT JOIN mom_sums mom     ON ac.mom_period_name = mom.period_name AND ac.subId = mom.subcategory_id
                ORDER BY period, categoryId, subcategoryId;";

    private class SummaryReportQueryResult
    {
        public string Period { get; set; }
        public bool IsIncome { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int SubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        public decimal TransactionsSum { get; set; }
        public decimal? YoySum { get; set; }
        public decimal? MomSum { get; set; }
    }

    private static (decimal? ExpensesSum, decimal? IncomesSum, decimal? Balance) AggregateComparison(
        IEnumerable<SummaryReportQueryResult> rows, Func<SummaryReportQueryResult, decimal?> selector)
    {
        decimal? expensesSum = null, incomesSum = null;
        foreach (var row in rows)
        {
            var value = selector(row);
            if (!value.HasValue) continue;
            if (row.IsIncome) incomesSum = (incomesSum ?? 0) + value.Value;
            else expensesSum = (expensesSum ?? 0) + value.Value;
        }
        decimal? balance = expensesSum.HasValue || incomesSum.HasValue
            ? (incomesSum ?? 0) - (expensesSum ?? 0) : null;
        return (expensesSum, incomesSum, balance);
    }

    public static string GetYoyLabel(string mainLabel, bool splitByMonth) =>
        splitByMonth
            ? DateTime.ParseExact(mainLabel, "yyyy-MM", null).AddYears(-1).ToString("yyyy-MM")
            : (int.Parse(mainLabel) - 1).ToString();

    public static string GetMomLabel(string mainLabel) =>
        DateTime.ParseExact(mainLabel, "yyyy-MM", null).AddMonths(-1).ToString("yyyy-MM");

    private List<ReportCategory> BuildCategories(List<SummaryReportQueryResult> rows, bool splitByMonth) =>
        rows.GroupBy(r => (r.CategoryId, r.IsIncome))
            .Select(category =>
            {
                var info = category.First();
                var periods = category.GroupBy(c => c.Period)
                    .Select(p => new ReportPeriodCategory
                    {
                        PeriodLabel = p.Key,
                        TransactionsSum = p.Sum(t => t.TransactionsSum),
                        YoySum = p.Any(r => r.YoySum.HasValue) ? p.Sum(r => r.YoySum.GetValueOrDefault()) : null,
                        MomSum = splitByMonth && p.Any(r => r.MomSum.HasValue) ? p.Sum(r => r.MomSum.GetValueOrDefault()) : null,
                    })
                    .ToList();

                var subcategories = category.GroupBy(c => c.SubcategoryId)
                    .Select(subcategory =>
                    {
                        var subInfo = subcategory.First();
                        var subPeriods = subcategory.GroupBy(c => c.Period)
                            .Select(p =>
                            {
                                var row = p.First();
                                return new ReportPeriodSubcategory
                                {
                                    PeriodLabel = p.Key,
                                    TransactionsSum = p.Sum(t => t.TransactionsSum),
                                    YoySum = row.YoySum,
                                    MomSum = splitByMonth ? row.MomSum : null,
                                };
                            })
                            .ToList();
                        return new ReportSubcategory
                        {
                            SubcategoryId = subInfo.SubcategoryId,
                            SubcategoryName = subInfo.SubcategoryName,
                            TransactionsSum = subPeriods.Sum(p => p.TransactionsSum),
                            TransactionsAvg = subPeriods.Average(p => p.TransactionsSum),
                            Periods = subPeriods
                        };
                    })
                    .ToList();

                return new ReportCategory
                {
                    CategoryId = info.CategoryId,
                    CategoryName = info.CategoryName,
                    IsIncome = info.IsIncome,
                    Periods = periods,
                    Subcategories = subcategories,
                    TransactionsSum = periods.Sum(p => p.TransactionsSum),
                    TransactionsAvg = periods.Average(p => p.TransactionsSum)
                };
            })
            .ToList();

    private List<ReportPeriod> BuildPeriods(List<SummaryReportQueryResult> rows,
        IEnumerable<(string Period, decimal Budget)> budgets, bool splitByMonth) =>
        rows.GroupBy(r => r.Period)
            .Select(p =>
            {
                var expensesSum = p.Where(x => !x.IsIncome).Sum(x => x.TransactionsSum);
                var incomesSum  = p.Where(x =>  x.IsIncome).Sum(x => x.TransactionsSum);
                var budget = splitByMonth ? budgets.FirstOrDefault(b => b.Period == p.Key).Budget : -1;

                var (yoyExpensesSum, yoyIncomesSum, yoyBalance) = AggregateComparison(p, r => r.YoySum);

                decimal? momExpensesSum = null, momIncomesSum = null, momBalance = null;
                if (splitByMonth)
                    (momExpensesSum, momIncomesSum, momBalance) = AggregateComparison(p, r => r.MomSum);

                return new ReportPeriod
                {
                    PeriodLabel = p.Key,
                    ExpensesSum = expensesSum,
                    IncomesSum  = incomesSum,
                    Balance     = incomesSum - expensesSum,
                    Budget = budget,
                    BudgetDifference = budget > 0 ? budget - expensesSum : 0,
                    YoyExpensesSum = yoyExpensesSum,
                    YoyIncomesSum  = yoyIncomesSum,
                    YoyBalance     = yoyBalance,
                    MomExpensesSum = momExpensesSum,
                    MomIncomesSum  = momIncomesSum,
                    MomBalance     = momBalance,
                };
            })
            .ToList();

    public async Task<SummaryReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();

        var queryResults = await connection.QueryAsync<SummaryReportQueryResult>(SummaryReportQuery,
            new
            {
                dateFrom, dateTo,
                periodPattern = splitByMonth ? "%Y-%m" : "%Y",
                yoyDateFrom = dateFrom?.AddYears(-1), yoyDateTo = dateTo?.AddYears(-1),
                momDateFrom = splitByMonth ? dateFrom?.AddMonths(-1) : (DateTime?)null,
                momDateTo   = splitByMonth ? dateTo?.AddMonths(-1)   : (DateTime?)null,
            });

        var budgets = await connection.QueryAsync<(string Period, decimal Budget)>(GetBudgetsQuery,
            new {
                fromYear = dateFrom?.Year, fromMonth = dateFrom?.Month,
                toYear = dateTo?.Year, toMonth = dateTo?.Month
            });

        var rows = queryResults.ToList();
        var periods = BuildPeriods(rows, budgets, splitByMonth);

        return new SummaryReportModel
        {
            Categories  = BuildCategories(rows, splitByMonth),
            Periods     = periods,
            IncomesAvg  = periods.Count > 0 ? periods.Average(p => p.IncomesSum)  : 0,
            IncomesSum  = periods.Sum(p => p.IncomesSum),
            ExpensesAvg = periods.Count > 0 ? periods.Average(p => p.ExpensesSum) : 0,
            ExpensesSum = periods.Sum(p => p.ExpensesSum),
            BalanceAvg  = periods.Count > 0 ? periods.Average(p => p.Balance)     : 0,
            BalanceSum  = periods.Sum(p => p.Balance),
        };
    }
}
