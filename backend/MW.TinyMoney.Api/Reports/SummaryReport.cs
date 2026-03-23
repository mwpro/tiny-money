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
                         SELECT p.period_name, c.id AS catId, c.is_income as isIncome, c.name AS catName, s.id AS subId, s.name AS subName
                         FROM periods p
                                  CROSS JOIN category c
                                  JOIN subcategory s ON s.parent_category_id = c.id
                     ),
                     monthly_sums AS (
                         SELECT
                             DATE_FORMAT(transaction_date, @periodPattern) AS period_name,
                             subcategory_id,
                             SUM(amount) AS total_amount
                         FROM transaction
                         WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                           AND (@dateTo IS NULL OR transaction_date <= @dateTo)
                           AND is_verified = 1
                         GROUP BY period_name, subcategory_id
                     )
                SELECT
                    ac.period_name AS 'period',
                    ac.catId AS 'categoryId', ac.isIncome AS 'isIncome', ac.catName AS 'categoryName',
                    ac.subId AS 'subcategoryId', ac.subName AS 'subcategoryName',
                    COALESCE(ms.total_amount, 0) AS 'transactionsSum'
                FROM all_combinations ac
                         LEFT JOIN monthly_sums ms ON ac.period_name = ms.period_name AND ac.subId = ms.subcategory_id
                ORDER BY period, categoryId, subcategoryId;";

    private const string ComparisonSumsQuery = @"SELECT
    DATE_FORMAT(transaction_date, @periodPattern) AS 'periodName',
    subcategory_id AS 'subcategoryId',
    SUM(amount) AS 'totalAmount'
FROM transaction
WHERE (@compDateFrom IS NULL OR transaction_date >= @compDateFrom)
  AND (@compDateTo IS NULL OR transaction_date <= @compDateTo)
  AND is_verified = 1
GROUP BY periodName, subcategoryId";

    private class SummaryReportQueryResult
    {
        public string Period { get; set; }
        public bool IsIncome { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int SubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        public decimal TransactionsSum { get; set; }
    }

    private class ComparisonQueryResult
    {
        public string PeriodName { get; set; }
        public int SubcategoryId { get; set; }
        public decimal TotalAmount { get; set; }
    }

    internal static string GetYoyLabel(string mainLabel, bool splitByMonth) =>
        splitByMonth
            ? DateTime.ParseExact(mainLabel, "yyyy-MM", null).AddYears(-1).ToString("yyyy-MM")
            : (int.Parse(mainLabel) - 1).ToString();

    internal static string GetMomLabel(string mainLabel) =>
        DateTime.ParseExact(mainLabel, "yyyy-MM", null).AddMonths(-1).ToString("yyyy-MM");

    public async Task<SummaryReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();

        var queryResults = await connection.QueryAsync<SummaryReportQueryResult>(SummaryReportQuery,
            new
            {
                dateFrom = dateFrom, dateTo = dateTo, periodPattern = splitByMonth ? "%Y-%m" : "%Y"
            });

        var budgets = await connection.QueryAsync<(string Period, decimal Budget)>(GetBudgetsQuery,
            new {
                fromYear = dateFrom?.Year, fromMonth = dateFrom?.Month,
                toYear = dateTo?.Year, toMonth = dateTo?.Month
            });

        var yoyResults = await connection.QueryAsync<ComparisonQueryResult>(
            ComparisonSumsQuery,
            new { compDateFrom = dateFrom?.AddYears(-1), compDateTo = dateTo?.AddYears(-1), periodPattern = splitByMonth ? "%Y-%m" : "%Y" });
        var yoyLookup = yoyResults.ToDictionary(r => (r.PeriodName, r.SubcategoryId), r => r.TotalAmount);

        Dictionary<(string, int), decimal> momLookup = new();
        if (splitByMonth)
        {
            var momResults = await connection.QueryAsync<ComparisonQueryResult>(
                ComparisonSumsQuery,
                new { compDateFrom = dateFrom?.AddMonths(-1), compDateTo = dateTo?.AddMonths(-1), periodPattern = "%Y-%m" });
            momLookup = momResults.ToDictionary(r => (r.PeriodName, r.SubcategoryId), r => r.TotalAmount);
        }

        var queryResultsList = queryResults.ToList();

        var subcategoryIsIncome = queryResultsList
            .GroupBy(r => r.SubcategoryId)
            .ToDictionary(g => g.Key, g => g.First().IsIncome);

        var result = new SummaryReportModel();
        result.Categories = queryResultsList.GroupBy(r => (r.CategoryId, r.IsIncome))
            .Select(category =>
            {
                var categoryInfo = category.First();
                var periodsOnCategoryLevel = category.GroupBy(c => c.Period)
                    .Select(p =>
                    {
                        var yoyLabel = GetYoyLabel(p.Key, splitByMonth);
                        var momLabel = splitByMonth ? GetMomLabel(p.Key) : null;

                        var subIds = p.Select(r => r.SubcategoryId).Distinct().ToList();

                        var yoyValues = subIds
                            .Where(subId => yoyLookup.ContainsKey((yoyLabel, subId)))
                            .Select(subId => yoyLookup[(yoyLabel, subId)])
                            .ToList();
                        decimal? categoryYoySum = yoyValues.Count > 0 ? yoyValues.Sum() : null;

                        decimal? categoryMomSum = null;
                        if (momLabel != null)
                        {
                            var momValues = subIds
                                .Where(subId => momLookup.ContainsKey((momLabel, subId)))
                                .Select(subId => momLookup[(momLabel, subId)])
                                .ToList();
                            categoryMomSum = momValues.Count > 0 ? momValues.Sum() : null;
                        }

                        return new ReportPeriodCategory
                        {
                            PeriodLabel = p.Key,
                            TransactionsSum = p.Sum(t => t.TransactionsSum),
                            YoySum = categoryYoySum,
                            MomSum = categoryMomSum
                        };
                    });

                var subcategories = category.GroupBy(c => c.SubcategoryId)
                    .Select(subcategory =>
                    {
                        var subcategoryInfo = subcategory.First();
                        var periodsOnSubcategoryLevel = subcategory.GroupBy(c => c.Period)
                            .Select(p =>
                            {
                                var yoyLabel = GetYoyLabel(p.Key, splitByMonth);
                                var momLabel = splitByMonth ? GetMomLabel(p.Key) : null;

                                return new ReportPeriodSubcategory
                                {
                                    PeriodLabel = p.Key,
                                    TransactionsSum = p.Sum(t => t.TransactionsSum),
                                    YoySum = yoyLookup.TryGetValue((yoyLabel, subcategoryInfo.SubcategoryId), out var yoy) ? yoy : null,
                                    MomSum = momLabel != null && momLookup.TryGetValue((momLabel, subcategoryInfo.SubcategoryId), out var mom) ? mom : (decimal?)null
                                };
                            });
                        return new ReportSubcategory()
                        {
                            SubcategoryId = subcategoryInfo.SubcategoryId,
                            SubcategoryName = subcategoryInfo.SubcategoryName,
                            TransactionsSum = periodsOnSubcategoryLevel.Sum(p => p.TransactionsSum),
                            TransactionsAvg = periodsOnSubcategoryLevel.Average(p => p.TransactionsSum),
                            Periods = periodsOnSubcategoryLevel
                        };
                    });

                return new ReportCategory()
                {
                    CategoryId = categoryInfo.CategoryId,
                    CategoryName = categoryInfo.CategoryName,
                    IsIncome = categoryInfo.IsIncome,
                    Periods = periodsOnCategoryLevel,
                    Subcategories = subcategories,
                    TransactionsSum = periodsOnCategoryLevel.Sum(p => p.TransactionsSum),
                    TransactionsAvg = periodsOnCategoryLevel.Average(p => p.TransactionsSum)
                };
            });

        result.Periods = queryResultsList.GroupBy(r => r.Period)
            .Select(p =>
            {
                var expensesSum = p.Where(x => !x.IsIncome).Sum(x => x.TransactionsSum);
                var incomesSum = p.Where(x => x.IsIncome).Sum(x => x.TransactionsSum);
                var budget = splitByMonth ? (budgets.FirstOrDefault(b => b.Period == p.Key).Budget) : -1;
                var budgetDifference = budget > 0 ? budget - expensesSum : 0;

                var yoyLabel = GetYoyLabel(p.Key, splitByMonth);
                var momLabel = splitByMonth ? GetMomLabel(p.Key) : null;

                decimal? yoyExpensesSum = null, yoyIncomesSum = null;
                foreach (var (subId, isIncome) in subcategoryIsIncome)
                {
                    if (yoyLookup.TryGetValue((yoyLabel, subId), out var yoyAmt))
                    {
                        if (isIncome) yoyIncomesSum = (yoyIncomesSum ?? 0) + yoyAmt;
                        else yoyExpensesSum = (yoyExpensesSum ?? 0) + yoyAmt;
                    }
                }
                decimal? yoyBalance = yoyExpensesSum.HasValue || yoyIncomesSum.HasValue
                    ? (yoyIncomesSum ?? 0) - (yoyExpensesSum ?? 0) : null;

                decimal? momExpensesSum = null, momIncomesSum = null;
                if (momLabel != null)
                {
                    foreach (var (subId, isIncome) in subcategoryIsIncome)
                    {
                        if (momLookup.TryGetValue((momLabel, subId), out var momAmt))
                        {
                            if (isIncome) momIncomesSum = (momIncomesSum ?? 0) + momAmt;
                            else momExpensesSum = (momExpensesSum ?? 0) + momAmt;
                        }
                    }
                }
                decimal? momBalance = momExpensesSum.HasValue || momIncomesSum.HasValue
                    ? (momIncomesSum ?? 0) - (momExpensesSum ?? 0) : null;

                return new ReportPeriod()
                {
                    PeriodLabel = p.Key,
                    ExpensesSum = expensesSum,
                    IncomesSum = incomesSum,
                    Balance = incomesSum - expensesSum,
                    Budget = budget,
                    BudgetDifference = budgetDifference,
                    YoyExpensesSum = yoyExpensesSum,
                    YoyIncomesSum = yoyIncomesSum,
                    YoyBalance = yoyBalance,
                    MomExpensesSum = momExpensesSum,
                    MomIncomesSum = momIncomesSum,
                    MomBalance = momBalance
                };
            });

        if (result.Periods.Any())
        {
            result.IncomesAvg = result.Periods.Average(p => p.IncomesSum);
            result.IncomesSum = result.Periods.Sum(p => p.IncomesSum);
            result.ExpensesAvg = result.Periods.Average(p => p.ExpensesSum);
            result.ExpensesSum = result.Periods.Sum(p => p.ExpensesSum);
            result.BalanceAvg = result.Periods.Average(p => p.Balance);
            result.BalanceSum = result.Periods.Sum(p => p.Balance);
        }

        return result;
    }
}
