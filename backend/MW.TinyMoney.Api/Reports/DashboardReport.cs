using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;
using MW.TinyMoney.Api.Plans;

namespace MW.TinyMoney.Api.Reports;

public interface IDashboardReport
{
    Task<DashboardResponse> GetDashboardData(int year, int month);
}

public class DashboardReport : IDashboardReport
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;
    private readonly IPlanStore _planStore;

    public DashboardReport(MySqlConnectionFactory mySqlConnectionFactory, IPlanStore planStore)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
        _planStore = planStore;
    }

    private const string DashboardQuery =
        """
        SELECT COALESCE(SUM(IF(is_expense = 0 AND is_verified = 1, amount, 0)), 0) AS incomesTotal,
               COALESCE(SUM(IF(is_expense = 1 AND is_verified = 1, amount, 0)), 0) AS expensesTotal,
               COUNT(CASE WHEN is_verified = 0 THEN 1 END) AS unverifiedCount
        FROM transaction WHERE transaction_date >= @dateFrom AND transaction_date <= @dateTo;
        
        SELECT DAY(transaction_date) AS Day, SUM(amount) AS Amount 
            FROM transaction 
            WHERE is_expense = 1 AND is_verified = 1 AND transaction_date >= @dateFrom AND transaction_date <= @dateTo 
            GROUP BY DAY(transaction_date) 
            ORDER BY Day;

        WITH monthlyBudgets AS (
            SELECT c.id AS 'categoryId', c.name AS 'categoryName', s.id AS `subcategoryId`, s.name AS 'subcategoryName', b.notes,
            COALESCE(b.amount, 0) AS `Amount`,
            COALESCE(SUM(t.amount), 0) AS `UsedAmount`,
            COALESCE(b.amount, 0) - COALESCE(SUM(t.amount), 0) AS 'AmountLeft'
            FROM category c
            LEFT JOIN subcategory s ON s.parent_category_id = c.id 
            LEFT JOIN budget b ON b.year = @year AND b.month = @month AND b.subcategory_id = s.id
            LEFT JOIN transaction t ON transaction_date >= @dateFrom AND transaction_date <= @dateTo AND t.subcategory_id = s.id AND t.is_expense = 1 AND t.is_verified = 1
            WHERE c.is_income = 0
            GROUP BY c.id, c.name, s.id, s.name, b.amount, b.notes
        )
        SELECT subcategoryId, categoryName, subcategoryName, amount, amountLeft, notes
            FROM monthlyBudgets
            WHERE AmountLeft < 0
            ORDER BY AmountLeft ASC
            LIMIT 5;

        WITH monthlyBudgets AS (
            SELECT c.id AS 'categoryId', c.name AS 'categoryName', s.id AS `subcategoryId`, s.name AS 'subcategoryName', b.notes,
            COALESCE(b.amount, 0) AS `Amount`,
            COALESCE(SUM(t.amount), 0) AS `UsedAmount`,
            COALESCE(b.amount, 0) - COALESCE(SUM(t.amount), 0) AS 'AmountLeft'
            FROM category c
            LEFT JOIN subcategory s ON s.parent_category_id = c.id
            LEFT JOIN budget b ON b.year = @year AND b.month = @month AND b.subcategory_id = s.id
            LEFT JOIN transaction t ON transaction_date >= @dateFrom AND transaction_date < @dateTo AND t.subcategory_id = s.id AND t.is_expense = 1 AND t.is_verified = 1
            WHERE c.is_income = 0
            GROUP BY c.id, c.name, s.id, s.name, b.amount, b.notes
        )
        SELECT subcategoryId, categoryName, subcategoryName, amount, amountLeft, notes
            FROM monthlyBudgets
            WHERE AmountLeft > 0
            ORDER BY AmountLeft DESC
            LIMIT 5;

        SELECT SUM(Amount) AS `Amount`, SUM(UsedAmount) AS `UsedAmount`, SUM(AmountLeft) AS `AmountLeft`
        FROM (
            SELECT COALESCE(b.amount, 0) AS `Amount`,
               COALESCE(SUM(t.amount), 0) AS `UsedAmount`,
               COALESCE(b.amount, 0) - COALESCE(SUM(t.amount), 0) AS 'AmountLeft'
            FROM category c
                     LEFT JOIN subcategory s ON s.parent_category_id = c.id
                     LEFT JOIN budget b ON b.year = @year AND b.month = @month AND b.subcategory_id = s.id
                     LEFT JOIN transaction t ON transaction_date >= @dateFrom AND transaction_date < @dateTo AND t.subcategory_id = s.id AND t.is_expense = 1 AND t.is_verified = 1
            WHERE c.is_income = 0
            GROUP BY c.id, c.name, s.id, s.name, b.amount) b;
        """;
        
    public async Task<DashboardResponse> GetDashboardData(int year, int month)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var dateFrom = new DateTime(year, month, 1);
        var dateTo = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        var reader = await connection.QueryMultipleAsync(DashboardQuery, new {dateFrom, dateTo, year, month});

        var gauges = await reader.ReadFirstAsync<(decimal IncomesTotal, decimal ExpensesTotal, int UnverifiedCount)>();
        var dailyExpenses = (await reader.ReadAsync<(int Day, decimal Amount)>()).ToList();
        var topOverspentBudgetCategories = (await reader.ReadAsync<CategoryBudgetSummary>()).ToList();
        var topRemainingBudgetCategories = (await reader.ReadAsync<CategoryBudgetSummary>()).ToList();
        var budgetSummary = await reader.ReadFirstAsync<(decimal Amount, decimal UsedAmount, decimal AmountLeft)>();

        var activePlans = (await _planStore.GetActivePlans(DateTime.Today)).ToList();

        return new DashboardResponse
        {
            IncomesTotal = gauges.IncomesTotal,
            ExpensesTotal = gauges.ExpensesTotal,
            UnverifiedCount = gauges.UnverifiedCount,
            DailyExpenses = CalculateRemainingBudget(dailyExpenses, budgetSummary.Amount),
            TopOverspentBudgetCategories = topOverspentBudgetCategories,
            TopRemainingBudgetCategories = topRemainingBudgetCategories,
            BudgetAmount = budgetSummary.Amount,
            BudgetUsed = budgetSummary.UsedAmount,
            BudgetLeft = budgetSummary.AmountLeft,
            ActivePlans = activePlans.Select(p => new ActivePlanSummary(p.Id, p.Title, p.TotalBudget, p.TotalSpent)).ToList()
        };
    }

    private static IReadOnlyCollection<DailyExpense> CalculateRemainingBudget(List<(int Day, decimal Amount)> dailyExpenses,
        decimal totalBudgetAmount)
    {
        var result = new List<DailyExpense>(dailyExpenses.Count);
        var budgetLeft = totalBudgetAmount;
        foreach (var dailyExpense in dailyExpenses)
        {
            budgetLeft -= dailyExpense.Amount;
            result.Add(new DailyExpense(dailyExpense.Day, dailyExpense.Amount, budgetLeft ));
        }
        
        return result;
    }
}