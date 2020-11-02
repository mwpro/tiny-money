using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Budget.ApiModels;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Budget
{
    public interface IBudgetStore
    {
        Task<IEnumerable<BudgetEntry>> GetMonthlyBudget(int year, int month);
    }

    public class BudgetStore : IBudgetStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        private const string MonthlyBudgetQuery =
            @"SELECT s.id AS `subcategoryId`, b.notes,
	            COALESCE(b.amount, 0) AS `Amount`,
                COALESCE(SUM(t.amount), 0) AS `UsedAmount`
                FROM subcategory s 
	            JOIN category c ON s.parent_category_id = c.id
	            LEFT JOIN budget b ON b.year = @year AND b.month = @month AND b.subcategory_id = s.id
	            LEFT JOIN transaction t ON YEAR(t.transaction_date) = @year AND MONTH(t.transaction_date) = @month AND t.subcategory_id = s.id
	            GROUP BY s.id, b.amount, b.notes";

        public BudgetStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        public async Task<IEnumerable<BudgetEntry>> GetMonthlyBudget(int year, int month)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return await connection.QueryAsync<BudgetEntry>(MonthlyBudgetQuery, new { year = year, month = month });
            }
        }
    }
}