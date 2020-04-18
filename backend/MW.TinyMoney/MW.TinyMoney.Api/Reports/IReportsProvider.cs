using Dapper;
using MW.TinyMoney.Api.Infrasatructure;
using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Reports
{
    public interface IReportsProvider
    {
        IEnumerable<ReportQueryResult<decimal>> PrepareExpensesByMonthReport();
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
        
        private const string ExpensesByMonthReportQuery =
              @"SELECT
                       DATE_FORMAT(transaction_date, '%Y-%m') AS `xLabel`,
                       sc.parent_category_id AS `series`,
                       SUM(amount) AS `value`
                FROM transaction t 
                LEFT JOIN subcategory sc ON sc.id = t.subcategory_id
                GROUP BY
                       DATE_FORMAT(transaction_date, '%Y-%m'),
                       sc.parent_category_id
                ORDER BY transaction_date";

        public IEnumerable<ReportQueryResult<decimal>> PrepareExpensesByMonthReport()
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();
                return connection.Query<ReportQueryResult<decimal>>(ExpensesByMonthReportQuery);
            }
        }
    }
}
