using System;
using Dapper;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports
{
    public interface IReportsProvider
    {
        Dictionary<int, IEnumerable<int>> GetAvailableMonths();

        IEnumerable<ReportQueryResult<decimal>> PrepareExpensesByMonthReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareMonthsSummaryReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareCategoriesBreakdownReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareIncomeBreakdownReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareTopVendorsReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareTopTagsReport(
            IEnumerable<DateTime> reportParametersMonths);

        IEnumerable<ReportQueryResult<decimal>> PrepareBudgetBurndownReport(
            DateTime reportParametersMonth);

        IEnumerable<ReportQueryResult<decimal>> PrepareTotalsReport(
            IEnumerable<DateTime> reportParametersMonths);

        Task<CategoriesReportModel> PrepareCategoriesReport(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth);
    }

    public class ReportQueryResult<TValue>
    {
        public string XLabel { get; set; }
        public string Series { get; set; }
        public TValue Value { get; set; }
    }

    public class MySqlReportsProvider : IReportsProvider
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlReportsProvider(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        private const string GetAvailableMonthsQuery = @"
            SELECT DISTINCT 
                YEAR(transaction_date) AS `year`,
                MONTH(transaction_date) AS `month`
            FROM transaction";

        private const string MonthsSummaryReportQuery = @"
            SELECT
                DATE_FORMAT(transaction_date, '%Y-%m') AS `xLabel`,
                (CASE WHEN is_expense = 1 THEN 'expenses' ELSE 'incomes' END) AS `series`,
                SUM(amount) AS `value`
            FROM transaction t
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), is_expense
            UNION
            SELECT
                DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m') AS `xLabel`,
                'budget' AS `series`,
                SUM(amount) AS `value`
            FROM budget b
            WHERE DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m') IN @months
            GROUP BY DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m')
            ORDER BY STR_TO_DATE(xLabel, '%Y-%m')";

        private const string ExpensesByMonthReportQuery =
            @"SELECT
                       DATE_FORMAT(transaction_date, '%Y-%m') AS `xLabel`,
                       sc.parent_category_id AS `series`,
                       SUM(amount) AS `value`
                FROM transaction t 
                LEFT JOIN subcategory sc ON sc.id = t.subcategory_id
                WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months AND t.is_expense = 1
                GROUP BY
                       DATE_FORMAT(transaction_date, '%Y-%m'),
                       sc.parent_category_id
                ORDER BY transaction_date";

        private const string CategoriesBreakdownReportQuery =
            @"SELECT
                   sc.parent_category_id AS `xLabel`,
                   'expenses' AS `series`,
                   SUM(amount) AS `value`
            FROM transaction t 
            LEFT JOIN subcategory sc ON sc.id = t.subcategory_id
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months AND t.is_expense = 1 
            GROUP BY sc.parent_category_id
            ORDER BY value DESC";

        private const string IncomeBreakdownReportQuery =
            @"SELECT
                    sc.id AS `xLabel`,
                    'expenses' AS `series`,
                    SUM(amount) AS `value`
                FROM transaction t
                LEFT JOIN subcategory sc ON sc.id = t.subcategory_id
                WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months AND t.is_expense = 0
                GROUP BY sc.id
                ORDER BY value DESC";

        private const string TopVendorsReportQuery =
            @"SELECT
                   t.vendor_id AS `xLabel`,
                   'expenses' AS `series`,
                   SUM(amount) AS `value`
            FROM transaction t 
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months AND t.is_expense = 1 
            GROUP BY t.vendor_id
            ORDER BY SUM(amount) DESC
            LIMIT 50";

        private const string TopTagsReportQuery =
            @"SELECT
                tt.tag_id AS `xLabel`,
                'expenses' AS `series`,
                SUM(amount) AS `value`
            FROM transaction t
                JOIN transaction_tag tt ON tt.transaction_id = t.id
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months AND t.is_expense = 1
            GROUP BY tt.tag_id
            ORDER BY SUM(amount) DESC
            LIMIT 50";

        private const string BudgetBurndownQuery =
            @"SELECT SUM(amount) AS 'budget'
                FROM budget b
                WHERE DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m') = @month;

                SELECT
                    DATE_FORMAT(transaction_date, '%Y-%m-%d') AS `xLabel`,
                    SUM(amount) AS `value`
                FROM transaction t
                WHERE DATE_FORMAT(transaction_date, '%Y-%m') = @month AND t.is_expense = 1
                GROUP BY DATE_FORMAT(transaction_date, '%Y-%m-%d')
                ORDER BY STR_TO_DATE(xLabel, '%Y-%m-%d');";

        private const string TotalsReportQuery =
            @"SELECT (IF(is_expense = 1, 'expensesSum', 'incomesSum')) AS `series`,
                   SUM(amount) AS `value`
            FROM transaction t
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
            GROUP BY is_expense
            UNION
            SELECT (IF(is_expense = 1, 'monthlyExpensesAvg', 'monthlyIncomesAvg')) AS `series`, 
                   AVG(value)
            FROM (SELECT is_expense,
                         SUM(amount) AS `value`
                  FROM transaction t
                  WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
                  GROUP BY DATE_FORMAT(transaction_date, '%Y-%m'), is_expense) byMonth
            GROUP BY series;";

        public Dictionary<int, IEnumerable<int>> GetAvailableMonths()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                var queryResult = connection.Query(GetAvailableMonthsQuery);
                return queryResult.GroupBy(x => x.year)
                    .ToDictionary(x => (int)x.Key,
                        x => x.Select(v => (int)v.month));
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareExpensesByMonthReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(ExpensesByMonthReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareMonthsSummaryReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(MonthsSummaryReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareCategoriesBreakdownReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(CategoriesBreakdownReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareIncomeBreakdownReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(IncomeBreakdownReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareTopVendorsReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(TopVendorsReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareTopTagsReport(
            IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(TopTagsReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        public IEnumerable<ReportQueryResult<decimal>> PrepareTotalsReport(IEnumerable<DateTime> reportParametersMonths)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(TotalsReportQuery, new
                {
                    months = reportParametersMonths.Select(x => x.ToString("yyyy-MM"))
                });
            }
        }

        private class CategoriesReportQueryResult
        {
            public string Period { get; set; }
            public bool IsIncome => !IsExpense;
            public bool IsExpense { get; set; }
            public int CategoryId { get; set; }
            public string CategoryName { get; set; }
            public int SubcategoryId { get; set; }
            public string SubcategoryName { get; set; }
            public decimal TransactionsSum { get; set; }
        }

        public async Task<CategoriesReportModel> PrepareCategoriesReport(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var sql = splitByMonth ? @"
                    select concat(year(transaction_date), '-', lpad(month(transaction_date), 2, '0')) as 'period', is_expense as 'isExpense', 
                           c.id as 'categoryId', c.name as 'categoryName', 
                           s.id as 'subcategoryId', s.name as 'subcategoryName',
                           sum(amount) as 'transactionsSum'
                    from transaction t
                    left join subcategory s ON t.subcategory_id = s.id
                    left join category c ON s.parent_category_id = c.id
                    where (@dateFrom IS NULL OR t.transaction_date >= @dateFrom)
                        AND (@dateTo IS NULL OR t.transaction_date <= @dateTo)
                    group by year(transaction_date), month(transaction_date), t.is_expense, subcategory_id
                    order by categoryId, subcategoryId, period;" :
                    @"select year(transaction_date) as 'period', is_expense as 'isExpense', 
                           c.id as 'categoryId', c.name as 'categoryName', 
                           s.id as 'subcategoryId', s.name as 'subcategoryName',
                           sum(amount) as 'transactionsSum'
                    from transaction t
                    left join subcategory s ON t.subcategory_id = s.id
                    left join category c ON s.parent_category_id = c.id
                    where (@dateFrom IS NULL OR t.transaction_date >= @dateFrom)
                        AND (@dateTo IS NULL OR t.transaction_date <= @dateTo)
                    group by year(transaction_date), t.is_expense, subcategory_id
                    order by categoryId, subcategoryId, period;";
            var queryResults = await connection.QueryAsync<CategoriesReportQueryResult>(sql,
            new
            {
                dateFrom = dateFrom, dateTo = dateTo
            });
            var result = new CategoriesReportModel();

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

                    return new ReportPeriod()
                    {
                        PeriodLabel = p.Key,
                        ExpensesSum = expensesSum,
                        IncomesSum = incomesSum,
                        Balance = incomesSum - expensesSum,
                        Budget = -1,
                    };
                });

            result.BudgetAvg = -1; // todo budgets
            result.BudgetSum = -1;
            result.IncomesAvg = result.Periods.Average(p => p.IncomesSum);
            result.IncomesSum = result.Periods.Sum(p => p.IncomesSum);
            result.ExpensesAvg = result.Periods.Average(p => p.ExpensesSum);
            result.ExpensesSum = result.Periods.Sum(p => p.ExpensesSum);
            result.BalanceAvg = result.Periods.Average(p => p.Balance);
            result.BalanceSum = result.Periods.Sum(p => p.Balance);

            return result;
        }


        public IEnumerable<ReportQueryResult<decimal>> PrepareBudgetBurndownReport(DateTime reportParametersMonth)
        {
            const string seriesName = "budgetLeft";
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                using (var multiQuery = connection.QueryMultiple(BudgetBurndownQuery,
                           new { month = reportParametersMonth.ToString("yyyy-MM") }))
                {
                    var monthlyBudget = multiQuery.ReadSingle<decimal>();
                    var expensesByDay = multiQuery.Read<ReportQueryResult<decimal>>();

                    var result = new List<ReportQueryResult<decimal>>
                    {
                        new()
                        {
                            XLabel = $"{reportParametersMonth:yyyy-MM}-00",
                            Series = seriesName,
                            Value = monthlyBudget
                        }
                    };

                    foreach (var day in expensesByDay)
                    {
                        monthlyBudget -= day.Value;
                        result.Add(new ReportQueryResult<decimal>()
                        {
                            XLabel = day.XLabel,
                            Series = seriesName,
                            Value = monthlyBudget
                        });
                    }

                    return result;
                }
            }
        }
    }
}