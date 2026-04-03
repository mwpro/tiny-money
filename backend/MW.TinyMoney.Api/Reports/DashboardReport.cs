using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports;

public interface IDashboardReport
{
    Task<DashboardResponse> GetDashboardData(int year, int month);
}

public class DashboardReport : IDashboardReport
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public DashboardReport(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    private const string DashboardQuery =
        """
        SELECT COALESCE(SUM(IF(is_expense = 0 AND is_verified = 1, amount, 0)), 0) AS incomesTotal,
               COALESCE(SUM(IF(is_expense = 1 AND is_verified = 1, amount, 0)), 0) AS expensesTotal,
               (SELECT COUNT(*) FROM transaction WHERE is_verified = 0) AS unverifiedCount
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

        SELECT p.id, p.title,
               COALESCE(SUM(pt.amount), 0) AS totalBudget,
               COALESCE(SUM(CASE WHEN t.id IS NOT NULL THEN t.amount ELSE 0 END), 0) AS totalSpent
        FROM plan p
        LEFT JOIN plan_tag pt ON pt.plan_id = p.id
        LEFT JOIN transaction_tag tt ON tt.tag_id = pt.tag_id
        LEFT JOIN transaction t ON t.id = tt.transaction_id
            AND t.transaction_date >= p.date_from
            AND (p.date_to IS NULL OR t.transaction_date <= p.date_to)
            AND t.is_expense = 1 AND t.is_verified = 1
        WHERE p.date_from <= @today AND (p.date_to IS NULL OR p.date_to >= @today)
        GROUP BY p.id, p.title
        ORDER BY p.date_from;

        SELECT COALESCE(SUM(s.balance), 0)
        FROM savings_account a
        JOIN savings_snapshot s ON s.account_id = a.id
        LEFT JOIN savings_snapshot s_newer
            ON s_newer.account_id = a.id AND s_newer.period > s.period
        WHERE a.is_active = 1 AND s_newer.id IS NULL;
        """;

    public async Task<DashboardResponse> GetDashboardData(int year, int month)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        var dateFrom = new DateTime(year, month, 1);
        var dateTo = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        var today = DateTime.Today;

        var reader = await connection.QueryMultipleAsync(DashboardQuery, new { dateFrom, dateTo, year, month, today });

        var gauges = await reader.ReadFirstAsync<(decimal IncomesTotal, decimal ExpensesTotal, int UnverifiedCount)>();
        var dailyExpenses = (await reader.ReadAsync<(int Day, decimal Amount)>()).ToList();
        var topOverspentBudgetCategories = (await reader.ReadAsync<CategoryBudgetSummary>()).ToList();
        var topRemainingBudgetCategories = (await reader.ReadAsync<CategoryBudgetSummary>()).ToList();
        var budgetSummary = await reader.ReadFirstAsync<(decimal Amount, decimal UsedAmount, decimal AmountLeft)>();
        var activePlans = (await reader.ReadAsync<(int Id, string Title, decimal TotalBudget, decimal TotalSpent)>()).ToList();
        var totalSavings = await reader.ReadFirstAsync<decimal>();

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
            ActivePlans = activePlans.Select(p => new ActivePlanSummary(
                p.Id, p.Title, p.TotalBudget, p.TotalSpent,
                p.TotalBudget > 0 ? p.TotalSpent / p.TotalBudget * 100m : 0m
            )).ToList(),
            TotalSavings = totalSavings
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
            result.Add(new DailyExpense(dailyExpense.Day, dailyExpense.Amount, budgetLeft));
        }

        return result;
    }
}
