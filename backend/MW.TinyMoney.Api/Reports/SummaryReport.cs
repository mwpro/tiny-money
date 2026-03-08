using System;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Import;
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
                         WHERE s.id != @importSubcategoryId
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

    public async Task<SummaryReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();

        var queryResults = await connection.QueryAsync<SummaryReportQueryResult>(SummaryReportQuery,
            new
            {
                dateFrom = dateFrom, dateTo = dateTo, periodPattern = splitByMonth ? "%Y-%m" : "%Y",
                importSubcategoryId = TransactionPlaceholders.UncategorizedSubcategoryId
            });

        var budgets = await connection.QueryAsync<(string Period, decimal Budget)>(GetBudgetsQuery,
            new {
                fromYear = dateFrom?.Year, fromMonth = dateFrom?.Month, 
                toYear = dateTo?.Year, toMonth = dateTo?.Month
            });

        var result = new SummaryReportModel();
        result.Categories = queryResults.GroupBy(r => (r.CategoryId, r.IsIncome))
            .Select(category =>
            {
                var categoryInfo = category.First();
                var periodsOnCategoryLevel = category.GroupBy(c => c.Period)
                    .Select(p => new ReportPeriodCategory()
                    {
                        PeriodLabel = p.Key,
                        TransactionsSum = p.Sum(t => t.TransactionsSum)
                    });
                var subcategories = category.GroupBy(c => c.SubcategoryId)
                    .Select(subcategory =>
                    {
                        var subcategoryInfo = subcategory.First();
                        var periodsOnSubcategoryLevel = subcategory.GroupBy(c => c.Period)
                            .Select(p => new ReportPeriodSubcategory()
                            {
                                PeriodLabel = p.Key,
                                TransactionsSum = p.Sum(t => t.TransactionsSum)
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

        result.Periods = queryResults.GroupBy(r => r.Period)
            .Select(p =>
            {
                var expensesSum = p.Where(x => !x.IsIncome).Sum(x => x.TransactionsSum);
                var incomesSum = p.Where(x => x.IsIncome).Sum(x => x.TransactionsSum);
                var budget = splitByMonth ? (budgets.FirstOrDefault(b => b.Period == p.Key).Budget) : -1;
                var budgetDifference = budget > 0 ? budget - expensesSum : 0;
                    
                return new ReportPeriod()
                {
                    PeriodLabel = p.Key,
                    ExpensesSum = expensesSum,
                    IncomesSum = incomesSum,
                    Balance = incomesSum - expensesSum,
                    Budget = budget,
                    BudgetDifference = budgetDifference
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