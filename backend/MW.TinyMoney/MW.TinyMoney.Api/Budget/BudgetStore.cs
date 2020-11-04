using System;
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
        Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes);
        Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo);
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
        
        private const string SetBudgetQuery =
            @"INSERT INTO budget (year, month, subcategory_id, amount, notes, created_date, modified_date)
                     VALUES 
                        (@year, @month, @subcategoryId, @budgetAmount, @notes, @modifiedDate, @modifiedDate)
                     ON DUPLICATE KEY UPDATE
                        amount = @budgetAmount, notes = @notes, modified_date = @modifiedDate;";

        private const string CopyBudgetQuery =
            @"INSERT INTO budget (year, month, subcategory_id, amount, notes, created_date, modified_date)
                     SELECT @yearTo, @monthTo, f.subcategory_id, f.amount, f.notes, @modifiedDate, @modifiedDate FROM budget f 
                        WHERE f.year = @yearFrom AND f.month = @monthFrom
                     ON DUPLICATE KEY UPDATE
                        amount = f.amount, notes = f.notes, modified_date = @modifiedDate;";

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

        public Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return connection.ExecuteAsync(SetBudgetQuery, new
                {
                    year = year, month = month, subcategoryId = subcategoryId, 
                    budgetAmount = budgetAmount, notes = budgetNotes,
                    modifiedDate = DateTime.UtcNow
                });
            }
        }

        public Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return connection.ExecuteAsync(CopyBudgetQuery, new
                {
                    yearFrom = yearFrom,
                    monthFrom = monthFrom,
                    yearTo = yearTo,
                    monthTo = monthTo,
                    modifiedDate = DateTime.UtcNow
                });
            }
        }
    }
}