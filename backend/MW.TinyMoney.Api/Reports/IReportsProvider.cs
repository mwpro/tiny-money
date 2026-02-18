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

        Task<SummaryReportModel> PrepareSummaryReport(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth);
        Task<TopListReportModel> PrepareTopListReport(DateTime? dateFrom, DateTime? dateTo, int numberOfTransactions);
        Task<SankeyReportModel> PrepareSankeyReport(DateTime? dateFrom, DateTime? dateTo);
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

        private const string TopListQuery =
            @"SELECT /* Expenses */
                t.id AS `id`,
                v.id AS `vendorId`,
                v.name AS `vendorName`,
                t.amount,
                t.transaction_date AS `transactionDate`
            FROM transaction t
                JOIN vendor v ON t.vendor_id = v.id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1
            ORDER BY amount DESC
            LIMIT @numberOfTopEntries;
            SELECT /* Incomes */
                t.id AS `id`,
                v.id AS `vendorId`,
                v.name AS `vendorName`,
                t.amount,
                t.transaction_date AS `transactionDate`
            FROM transaction t
                JOIN vendor v ON t.vendor_id = v.id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 0
            ORDER BY amount DESC
            LIMIT @numberOfTopEntries;
            SELECT /* Expense vendors */
                v.id AS `id`,
                v.name AS `description`,
                SUM(t.amount) AS `amount`,
                COUNT(t.id) AS `numberOfTransactions`
            FROM transaction t
                JOIN vendor v ON t.vendor_id = v.id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1
            GROUP BY v.id
            ORDER BY SUM(amount) DESC
            LIMIT @numberOfTopEntries;
            SELECT /* Income vendors */
                v.id AS `id`,
                v.name AS `description`,
                SUM(t.amount) AS `amount`,
                COUNT(t.id) AS `numberOfTransactions`
            FROM transaction t
                JOIN vendor v ON t.vendor_id = v.id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 0
            GROUP BY v.id
            ORDER BY SUM(amount) DESC
            LIMIT @numberOfTopEntries;
            SELECT /* Top tags */
                tt.tag_id AS `id`,
                tag.name AS `description`,
                SUM(t.amount) AS `amount`,
                COUNT(t.id) AS `numberOfTransactions`
            FROM transaction t
                JOIN transaction_tag tt ON tt.transaction_id = t.id
                JOIN tag tag ON tag.id = tt.tag_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1
            GROUP BY tt.tag_id
            ORDER BY SUM(amount) DESC
            LIMIT @numberOfTopEntries;";
        
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

        private const string SummaryReportQuery = @"WITH periods AS (
                    SELECT DISTINCT DATE_FORMAT(transaction_date, @periodPattern) AS period_name
                    FROM transaction
                    WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
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

        private const string GetBudgetsQuery = @"SELECT
                DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m') AS 'period',
                SUM(amount) AS `budget`
            FROM budget b
            WHERE (@fromYear IS NULL OR year > @fromYear OR (year = @fromYear AND month >= @fromMonth))
                AND (@toYear IS NULL OR year < @toYear OR (year = @toYear AND month <= @toMonth))
            GROUP BY DATE_FORMAT(STR_TO_DATE(CONCAT(year, '-', month), '%Y-%m'), '%Y-%m')";

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

        public async Task<SummaryReportModel> PrepareSummaryReport(DateTime? dateFrom, DateTime? dateTo, bool splitByMonth)
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

        public async Task<TopListReportModel> PrepareTopListReport(DateTime? dateFrom, DateTime? dateTo, int numberOfTopEntries)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var queryResults = await connection.QueryMultipleAsync(TopListQuery,
                new
                {
                    dateFrom = dateFrom, dateTo = dateTo, numberOfTopEntries = numberOfTopEntries
                });
            var topExpenses = await queryResults.ReadAsync<TopTransactionModel>();
            var topIncomes = await queryResults.ReadAsync<TopTransactionModel>();
            var topExpenseVendors = await queryResults.ReadAsync<TopEntryModel>();
            var topIncomeVendors = await queryResults.ReadAsync<TopEntryModel>();
            var tags = await queryResults.ReadAsync<TopEntryModel>();

            return new TopListReportModel()
            {
                Expenses = topExpenses,
                Incomes = topIncomes,
                ExpenseVendors = topExpenseVendors,
                IncomeVendors = topIncomeVendors,
                Tags = tags
            };
        }

        public async Task<SankeyReportModel> PrepareSankeyReport(DateTime? dateFrom, DateTime? dateTo)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var queryResults = (await connection.QueryMultipleAsync(SankeyQuery,
                new
                {
                    dateFrom = dateFrom, dateTo = dateTo
                }));
            var categoryResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();
            var subcategoryResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();
            var vendorResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();

            const int rootNodeIndex = 0;
            var hasSingleIncomeCategory = categoryResults.Count(q => q.AggregationLevel == "category" && q.IsExpense == false) == 1;

            var rootNodes = categoryResults.Where(c => c.IsExpense || !hasSingleIncomeCategory).Select((q, i) => new SankeyNode()
            {
                Index = i + 1,
                Name = q.Label,
                NodeType = q.AggregationLevel,
                NodeId = q.Id,
                SubChart = PrepareSubcategorySankeySubChart(subcategoryResults, vendorResults, q, rootNodeIndex)
            }).ToList();
            if (hasSingleIncomeCategory)
            {
                var incomeCategoriesCount = rootNodes.Count + 1;
                rootNodes.AddRange(subcategoryResults.Where(c => !c.IsExpense).Select((q, i) => new SankeyNode()
                {
                    Index = incomeCategoriesCount + i,
                    Name = q.Label,
                    NodeType = q.AggregationLevel,
                    NodeId = q.Id,
                    SubChart = PrepareVendorSankeySubChart(vendorResults, q, rootNodeIndex)
                }));
            }    
            rootNodes.Insert(0, new SankeyNode()
            {
                Index = rootNodeIndex,
                Name = "Budżet"
            });
            var rootLinks = categoryResults.Where(t => t.IsExpense || !hasSingleIncomeCategory)
                .Select(t => new SankeyLink()
                {
                    Source = t.IsExpense ? rootNodeIndex : rootNodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index,
                    Target = t.IsExpense ? rootNodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index : rootNodeIndex,
                    Value = t.Value
                }).ToList();
            if (hasSingleIncomeCategory)
            {
                rootLinks.AddRange(subcategoryResults.Where(t => !t.IsExpense)
                    .Select(t => new SankeyLink()
                    {
                        Source = rootNodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index,
                        Target = rootNodeIndex,
                        Value = t.Value
                    }));
            }
            // var subcategoryLinks = queryResults.Where(t => t.AggregationLevel == "subcategory")
            //     .Select(t => new SankeyLink()
            //     {
            //         Source = t.IsExpense ? nodes.First(n => n.NodeType == "category" && n.NodeId == t.ParentId).Index : nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index,
            //         Target = t.IsExpense ? nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index : hasSingleIncomeCategory ? rootNodeIndex : nodes.First(n => n.NodeType == "category" && n.NodeId == t.ParentId).Index,
            //         Value = t.Value
            //     });
            // var categoryLinks = queryResults.Where(t => t.AggregationLevel == "category" && (!hasSingleIncomeCategory || t.IsExpense))
            //     .Select(t => new SankeyLink()
            //     {
            //         Source = t.IsExpense ? rootNodeIndex : nodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index,
            //         Target = t.IsExpense ? nodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index : rootNodeIndex,
            //         Value = t.Value
            //     });
            // var subcategoryLinks = queryResults.Where(t => t.AggregationLevel == "subcategory")
            //     .Select(t => new SankeyLink()
            //     {
            //         Source = t.IsExpense ? nodes.First(n => n.NodeType == "category" && n.NodeId == t.ParentId).Index : nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index,
            //         Target = t.IsExpense ? nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index : hasSingleIncomeCategory ? rootNodeIndex : nodes.First(n => n.NodeType == "category" && n.NodeId == t.ParentId).Index,
            //         Value = t.Value
            //     });
            // var vendorLinks = queryResults.Where(t => t.AggregationLevel == "vendor")
            //     .Select(t => new SankeyLink()
            //     {
            //         Source = t.IsExpense ? nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.ParentId).Index : nodes.First(n => n.NodeType == "vendor" && n.NodeId == t.Id).Index,
            //         Target = t.IsExpense ? nodes.First(n => n.NodeType == "vendor" && n.NodeId == t.Id).Index : nodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.ParentId).Index,
            //         Value = t.Value
            //     });

            return new SankeyReportModel()
            {
                Root = new SankeyChart()
                {
                    Nodes = rootNodes,
                    Links = rootLinks
                }
            };
        }

        private static SankeyChart PrepareVendorSankeySubChart(List<TransactionsSum> vendorResults, TransactionsSum parent, int rootNodeIndex)
        {
            return new SankeyChart()
            {
                Nodes = vendorResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s,
                    j) => new SankeyNode()
                {
                    Index = j + 1,
                    Name = s.Label,
                    NodeType = s.AggregationLevel,
                    NodeId = s.Id,
                }).Prepend(new SankeyNode()
                {
                    Index = rootNodeIndex,
                    Name = parent.Label
                }).ToList(),
                Links = vendorResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s, j) => new SankeyLink()
                {
                    Source = s.IsExpense ? rootNodeIndex : j + 1,
                    Target = s.IsExpense ? j + 1 : rootNodeIndex,
                    Value = s.Value
                }).ToList()
            };
        }

        private static SankeyChart PrepareSubcategorySankeySubChart(List<TransactionsSum> subcategoryResults, List<TransactionsSum> vendorResults, TransactionsSum parent, int rootNodeIndex)
        {
            return new SankeyChart()
            {
                Nodes = subcategoryResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s,
                    j) => new SankeyNode()
                {
                    Index = j + 1,
                    Name = s.Label,
                    NodeType = s.AggregationLevel,
                    NodeId = s.Id,
                    SubChart = PrepareVendorSankeySubChart(vendorResults, s, rootNodeIndex)
                }).Prepend(new SankeyNode()
                {
                    Index = rootNodeIndex,
                    Name = parent.Label
                }).ToList(),
                Links = subcategoryResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s, j) => new SankeyLink()
                {
                    Source = s.IsExpense ? rootNodeIndex : j + 1,
                    Target = s.IsExpense ? j + 1 : rootNodeIndex,
                    Value = s.Value
                }).ToList()
            };
        }

        private const string SankeyQuery = @"
            SELECT /* category level */
                'category' AS `aggregationLevel`,
                c.id AS 'id',
                null AS 'parentId',
                t.is_expense as `isExpense`, 
                c.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN subcategory s ON s.id = t.subcategory_id
                JOIN category c ON c.id = s.parent_category_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, c.id, c.name;
            SELECT /* subcategory level */
                'subcategory' AS `aggregationLevel`,
                s.id AS 'id',
                s.parent_category_id AS 'parentId',
                t.is_expense as `isExpense`, 
                s.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN subcategory s ON s.id = t.subcategory_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, s.id, s.name, s.parent_category_id;
            SELECT /* vendor level */
                'vendor' AS `aggregationLevel`,
                v.id AS 'id',
                t.subcategory_id AS 'parentId',
                t.is_expense as `isExpense`, 
                v.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN vendor v ON v.id = t.vendor_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, t.subcategory_id, v.id, v.name
            ORDER BY SUM(t.amount) DESC;
            ";

        public class TransactionsSum
        {
            public string AggregationLevel { get; set; }
            public int Id { get; set; }
            public int? ParentId { get; set; }
            public bool IsExpense { get; set; }
            public string Label { get; set; }
            public decimal Value { get; set; }
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