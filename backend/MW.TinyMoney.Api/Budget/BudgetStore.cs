using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Budget.ApiModels;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Budget
{
    public interface IBudgetStore
    {
        Task<IEnumerable<BudgetEntry>> GetMonthlyBudgetOld(int year, int month);
        Task<MonthlyBudget> GetMonthlyBudget(int year, int month);
        Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes);
        Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo);
    }

    public class BudgetStore : IBudgetStore
    {
        private readonly MySqlConnectionFactory _mySqlConnectionFactory;

        private const string MonthlyBudgetQuery =
            @"SELECT c.id AS 'categoryId', c.name AS 'categoryName', s.id AS `subcategoryId`, s.name AS 'subcategoryName', b.notes,
	            COALESCE(b.amount, 0) AS `Amount`,
                COALESCE(SUM(t.amount), 0) AS `UsedAmount`,
                COALESCE(b.amount, 0) - COALESCE(SUM(t.amount), 0) AS 'AmountLeft'
                FROM category c
                LEFT JOIN subcategory s ON s.parent_category_id = c.id 
	            LEFT JOIN budget b ON b.year = @year AND b.month = @month AND b.subcategory_id = s.id
	            LEFT JOIN transaction t ON YEAR(t.transaction_date) = @year AND MONTH(t.transaction_date) = @month AND t.subcategory_id = s.id AND t.is_expense = 1
	            GROUP BY c.id, c.name, s.id, s.name, b.amount, b.notes";

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

        public async Task<IEnumerable<BudgetEntry>> GetMonthlyBudgetOld(int year, int month)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return await connection.QueryAsync<BudgetEntry>(MonthlyBudgetQuery, new { year = year, month = month });
            }
        }

        public async Task<MonthlyBudget> GetMonthlyBudget(int year, int month)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                var categoryBudgets = await connection.QueryAsync<CategoryBudget, SubcategoryBudget, CategoryBudget>(
                    MonthlyBudgetQuery,
                    (category, subcategory) =>
                    {
                        category.SubcategoryBudgets = category.SubcategoryBudgets == null
                            ? new[] { subcategory }
                            : category.SubcategoryBudgets.Append(subcategory);
                        return category;
                    },
                    new { year = year, month = month },
                    splitOn: "subcategoryId");

                return new MonthlyBudget()
                {
                    CategoryBudgets = categoryBudgets.GroupBy(p => p.CategoryId).Select(g =>
                    {
                        var groupedPost = g.First();
                        groupedPost.SubcategoryBudgets = g.Select(p => p.SubcategoryBudgets.Single()).ToList();
                        return groupedPost;
                    }).ToList()
                };
            }
        }

        public async Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                await connection.ExecuteAsync(SetBudgetQuery, new
                {
                    year = year, month = month, subcategoryId = subcategoryId,
                    budgetAmount = budgetAmount, notes = budgetNotes,
                    modifiedDate = DateTime.UtcNow
                });
            }
        }

        public async Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                await connection.ExecuteAsync(CopyBudgetQuery, new
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