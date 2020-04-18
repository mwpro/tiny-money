using System;
using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Reports
{
    public interface IReportsProvider
    {
        IEnumerable<ReportQueryResult<decimal>> PrepareExpensesByMonthReport(
            IEnumerable<DateTime> reportParametersMonths);
        IEnumerable<ReportQueryResult<decimal>> PrepareMonthsSummaryReport(
            IEnumerable<DateTime> reportParametersMonths);
        IEnumerable<ReportQueryResult<decimal>> PrepareCategoriesBreakdownReport(
            IEnumerable<DateTime> reportParametersMonths);
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

        private const string MonthsSummaryReportQuery = @"
            SELECT
                DATE_FORMAT(transaction_date, '%Y-%m') AS `xLabel`,
                'expenses' AS `series`,
                SUM(amount) AS `value`
            FROM transaction t
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
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
                WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months
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
            WHERE DATE_FORMAT(transaction_date, '%Y-%m') IN @months 
            GROUP BY
                   sc.parent_category_id";

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

        public IEnumerable<ReportQueryResult<decimal>> PrepareMonthsSummaryReport(IEnumerable<DateTime> reportParametersMonths)
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
        
        public IEnumerable<ReportQueryResult<decimal>> PrepareCategoriesBreakdownReport(IEnumerable<DateTime> reportParametersMonths)
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
    }
}