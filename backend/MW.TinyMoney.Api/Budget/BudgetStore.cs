using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Budget.ApiModels;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Budget
{
    public interface IBudgetStore
    {
        Task<IEnumerable<BudgetEntry>> GetMonthlyBudgetOld(int year, int month);
        Task<MonthlyBudget> GetMonthlyBudget(int year, int month);
        Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes);
        Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo);
        Task<IEnumerable<SubcategoryBudgetSuggestions>> GetBudgetSuggestions(int year, int month);
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
	            LEFT JOIN transaction t ON YEAR(t.transaction_date) = @year AND MONTH(t.transaction_date) = @month AND t.subcategory_id = s.id AND t.is_expense = 1 AND t.is_verified = 1
                WHERE c.is_income = 0
                AND (s.id IS NULL OR s.id != @importSubcategoryId)
	            GROUP BY c.id, c.name, s.id, s.name, b.amount, b.notes";

        private const string SetBudgetQuery =
            @"INSERT INTO budget (year, month, subcategory_id, amount, notes, created_date, modified_date)
                     VALUES 
                        (@year, @month, @subcategoryId, @budgetAmount, @notes, @modifiedDate, @modifiedDate)
                     ON DUPLICATE KEY UPDATE
                        amount = @budgetAmount, notes = @notes, modified_date = @modifiedDate;";

        private const string CopyBudgetQuery =
            @"DELETE FROM budget WHERE year = @yearTo AND month = @monthTo;
              INSERT INTO budget (year, month, subcategory_id, amount, notes, created_date, modified_date)
                     SELECT @yearTo, @monthTo, f.subcategory_id, f.amount, f.notes, @modifiedDate, @modifiedDate FROM budget f 
                        WHERE f.year = @yearFrom AND f.month = @monthFrom;";

        private const string SubcategoryBudgetSuggestionsQuery = @"
                SELECT s.id AS `subcategoryId`, 'Poprzedni miesiąc - budżet' AS 'suggestionName', COALESCE(b.amount, 0) AS 'suggestedAmount'
                FROM category c
                LEFT JOIN subcategory s ON s.parent_category_id = c.id
	            LEFT JOIN budget b ON b.subcategory_id = s.id AND b.year = @previousPeriodYear AND b.month = @previousPeriodMonth
                WHERE c.is_income = 0
                AND (s.id IS NULL OR s.id != @importSubcategoryId)

	            UNION ALL

	            SELECT s.id AS `subcategoryId`, 'Poprzedni miesiąc - wydatki' AS 'suggestionName', COALESCE(SUM(t.amount), 0) AS 'suggestedAmount'
                FROM category c
                LEFT JOIN subcategory s ON s.parent_category_id = c.id
                LEFT JOIN transaction t ON t.subcategory_id = s.id AND t.is_expense = 1 AND YEAR(t.transaction_date) = @previousPeriodYear AND MONTH(t.transaction_date) = @previousPeriodMonth
                WHERE c.is_income = 0
                AND (s.id IS NULL OR s.id != @importSubcategoryId)
	            GROUP BY s.id

	            UNION ALL

	            SELECT
                    s.id AS `subcategoryId`,
                    'Średnie wydatki za 3 ostatnie mc' AS 'suggestionName',
                    COALESCE(SUM(t.amount), 0) / 3 AS 'suggestedAmount'
                FROM category c
                LEFT JOIN subcategory s ON s.parent_category_id = c.id
                    LEFT JOIN transaction t ON t.subcategory_id = s.id
                       AND t.is_expense = 1
                       AND t.transaction_date BETWEEN @last3mPeriodStart AND @last3mPeriodEnd
                WHERE c.is_income = 0
                AND (s.id IS NULL OR s.id != @importSubcategoryId)
                GROUP BY s.id

	            UNION ALL

	            SELECT s.id AS `subcategoryId`, 'Ten miesiąc rok temu - wydatki' AS 'suggestionName', COALESCE(SUM(t.amount), 0) AS 'suggestedAmount'
                FROM category c
                LEFT JOIN subcategory s ON s.parent_category_id = c.id
                LEFT JOIN transaction t ON t.subcategory_id = s.id AND t.is_expense = 1 AND YEAR(t.transaction_date) = @thisPeriodLastYearYear AND MONTH(t.transaction_date) = @thisPeriodLastYearMonth
                WHERE c.is_income = 0
                AND (s.id IS NULL OR s.id != @importSubcategoryId)
	            GROUP BY s.id
	            ";

        public BudgetStore(MySqlConnectionFactory mySqlConnectionFactory)
        {
            _mySqlConnectionFactory = mySqlConnectionFactory;
        }

        public async Task<IEnumerable<BudgetEntry>> GetMonthlyBudgetOld(int year, int month)
        {
            using (var connection = _mySqlConnectionFactory.CreateConnection())
            {
                connection.Open();

                return await connection.QueryAsync<BudgetEntry>(MonthlyBudgetQuery, new { year = year, month = month, importSubcategoryId = TransactionPlaceholders.UncategorizedSubcategoryId });
            }
        }

        public async Task<MonthlyBudget> GetMonthlyBudget(int year, int month)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            var categoryBudgets = new Dictionary<int, CategoryBudget>();
            await connection.QueryAsync<CategoryBudget, SubcategoryBudget, CategoryBudget>(
                MonthlyBudgetQuery,
                (category, subcategory) =>
                {
                    if (!categoryBudgets .TryGetValue(category.CategoryId, out var categoryEntry))
                    {
                        categoryEntry = category;
                        categoryBudgets .Add(categoryEntry.CategoryId, categoryEntry);
                    }

                    if (subcategory != null)
                    {
                        categoryEntry.SubcategoryBudgets ??= new List<SubcategoryBudget>();
                        categoryEntry.SubcategoryBudgets.Add(subcategory);
                    }
                        
                    return categoryEntry;
                },
                new { year = year, month = month, importSubcategoryId = TransactionPlaceholders.UncategorizedSubcategoryId },
                splitOn: "subcategoryId");
            
            foreach (var (_, categoryBudget) in categoryBudgets)
            {
                categoryBudget.Amount = categoryBudget.SubcategoryBudgets.Sum(s => s.Amount);
                categoryBudget.UsedAmount = categoryBudget.SubcategoryBudgets.Sum(s => s.UsedAmount);
                categoryBudget.AmountLeft = categoryBudget.SubcategoryBudgets.Sum(s => s.AmountLeft);
            }

            return new MonthlyBudget()
            {
                CategoryBudgets = categoryBudgets.Values,
                Amount = categoryBudgets.Values.Sum(s => s.Amount),
                UsedAmount = categoryBudgets.Values.Sum(s => s.UsedAmount),
                AmountLeft = categoryBudgets.Values.Sum(s => s.AmountLeft),
            };
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

        public async Task<IEnumerable<SubcategoryBudgetSuggestions>> GetBudgetSuggestions(int year, int month)
        {
            await using var connection = _mySqlConnectionFactory.CreateConnection();
            await connection.OpenAsync();
            
            var dateFromPeriod = new DateTime(year, month, 1);
            var previousPeriod = dateFromPeriod.AddMonths(-1);
            var thisPeriodLastYear = dateFromPeriod.AddYears(-1);
            var last3mPeriodStart = dateFromPeriod.AddMonths(-3);
            var last3mPeriodEnd = dateFromPeriod.AddDays(-1);

            var suggestionsResult = new Dictionary<int, ICollection<BudgetSuggestion>>();
            await connection.QueryAsync<SubcategoryBudgetSuggestions, BudgetSuggestion, SubcategoryBudgetSuggestions>(
                SubcategoryBudgetSuggestionsQuery,
                (subcategory, suggestion) =>
                {
                    if (!suggestionsResult.TryGetValue(subcategory.SubcategoryId, out var subcategoryBudgetSuggestions))
                    {
                        subcategoryBudgetSuggestions = new List<BudgetSuggestion>();
                        suggestionsResult.Add(subcategory.SubcategoryId, subcategoryBudgetSuggestions);
                    }

                    if (suggestion != null)
                    {
                        subcategoryBudgetSuggestions.Add(suggestion);
                    }
                        
                    return subcategory;
                },
                new
                {
                    previousPeriodYear = previousPeriod.Year, previousPeriodMonth = previousPeriod.Month,
                    thisPeriodLastYearYear = thisPeriodLastYear.Year, thisPeriodLastYearMonth = thisPeriodLastYear.Month,
                    last3mPeriodStart = last3mPeriodStart, last3mPeriodEnd = last3mPeriodEnd,
                    importSubcategoryId = TransactionPlaceholders.UncategorizedSubcategoryId
                },
                splitOn: "suggestionName");
            
            return suggestionsResult.Select(kv =>
            {
                var (subcategoryId, suggestions) = kv;
                return new SubcategoryBudgetSuggestions()
                {
                    SubcategoryId = subcategoryId,
                    Suggestions = suggestions
                };
            });
        }
    }
}