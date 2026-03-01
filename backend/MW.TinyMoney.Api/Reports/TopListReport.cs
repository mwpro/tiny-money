using System;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports;

public interface ITopListReport
{
    Task<TopListReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, int numberOfTransactions);
}

public class TopListReport : ITopListReport
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public TopListReport(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

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
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1 AND t.is_verified = 1
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
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 0 AND t.is_verified = 1
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
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1 AND t.is_verified = 1
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
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 0 AND t.is_verified = 1
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
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo) AND t.is_expense = 1 AND t.is_verified = 1
            GROUP BY tt.tag_id
            ORDER BY SUM(amount) DESC
            LIMIT @numberOfTopEntries;";
        
    public async Task<TopListReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo, int numberOfTopEntries)
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
}