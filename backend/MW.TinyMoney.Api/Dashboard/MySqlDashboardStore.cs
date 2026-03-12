using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Dashboard
{
    public class MySqlDashboardStore : IDashboardStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        public MySqlDashboardStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        public async Task<DashboardData> GetDashboardData(int year, int month)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();

            var incomesTotal = await connection.QueryFirstAsync<decimal>(
                "SELECT COALESCE(SUM(amount), 0) FROM transaction WHERE is_expense = 0 AND MONTH(transaction_date) = @month AND YEAR(transaction_date) = @year",
                new { year, month });

            var expensesTotal = await connection.QueryFirstAsync<decimal>(
                "SELECT COALESCE(SUM(amount), 0) FROM transaction WHERE is_expense = 1 AND MONTH(transaction_date) = @month AND YEAR(transaction_date) = @year",
                new { year, month });

            var unverifiedCount = await connection.QueryFirstAsync<int>(
                "SELECT COUNT(*) FROM transaction WHERE is_verified = 0 AND MONTH(transaction_date) = @month AND YEAR(transaction_date) = @year",
                new { year, month });

            var dailyExpenses = (await connection.QueryAsync<DailyExpense>(
                "SELECT DAY(transaction_date) AS Day, SUM(amount) AS Amount FROM transaction WHERE is_expense = 1 AND MONTH(transaction_date) = @month AND YEAR(transaction_date) = @year GROUP BY DAY(transaction_date) ORDER BY Day",
                new { year, month })).ToList();

            return new DashboardData
            {
                IncomesTotal = incomesTotal,
                ExpensesTotal = expensesTotal,
                UnverifiedCount = unverifiedCount,
                DailyExpenses = dailyExpenses
            };
        }
    }
}
