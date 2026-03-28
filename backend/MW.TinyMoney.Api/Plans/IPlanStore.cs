using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Plans;

public class PlanSummary
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalSpent { get; set; }
}

public class PlanTag
{
    public int TagId { get; set; }
    public string TagName { get; set; }
    public decimal Amount { get; set; }
    public string TagDescription { get; set; }
    public decimal Spent { get; set; }
}

public class PlanDetail
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public IList<PlanTag> TagLines { get; set; } = new List<PlanTag>();
}

public interface IPlanStore
{
    Task<IEnumerable<PlanSummary>> GetPlans();
    Task<PlanDetail> GetPlanDetail(int planId);
    Task<int> CreatePlan(string title, string description, DateTime dateFrom, DateTime? dateTo);
    Task UpdatePlan(int planId, string title, string description, DateTime dateFrom, DateTime? dateTo);
    Task DeletePlan(int planId);
    Task AddPlanTag(int planId, int tagId, decimal amount, string description);
    Task UpdatePlanTag(int planId, int tagId, decimal amount, string description);
    Task DeletePlanTag(int planId, int tagId);
}

public class MySqlPlanStore : IPlanStore
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public MySqlPlanStore(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    private const string GetPlansQuery =
        """
        SELECT p.id, p.title, p.description, p.date_from AS dateFrom, p.date_to AS dateTo,
               COALESCE(SUM(pt.amount), 0) AS totalBudget,
               COALESCE(SUM(
                   (SELECT COALESCE(SUM(t.amount), 0)
                    FROM transaction t
                    INNER JOIN transaction_tag tt ON tt.transaction_id = t.id
                    WHERE tt.tag_id = pt.tag_id
                      AND t.transaction_date >= p.date_from
                      AND (p.date_to IS NULL OR t.transaction_date <= p.date_to)
                      AND t.is_expense = 1 AND t.is_verified = 1)
               ), 0) AS totalSpent
        FROM plan p
        LEFT JOIN plan_tag pt ON pt.plan_id = p.id
        GROUP BY p.id, p.title, p.description, p.date_from, p.date_to
        ORDER BY p.date_from DESC;
        """;

    private const string GetPlanDetailQuery =
        """
        SELECT p.id, p.title, p.description, p.date_from AS dateFrom, p.date_to AS dateTo,
               pt.tag_id AS tagId, tg.name AS tagName,
               pt.amount, pt.description AS tagDescription,
               COALESCE(SUM(t.amount), 0) AS spent
        FROM plan p
        LEFT JOIN plan_tag pt ON pt.plan_id = p.id
        LEFT JOIN tag tg ON tg.id = pt.tag_id
        LEFT JOIN transaction_tag tt ON tt.tag_id = pt.tag_id
        LEFT JOIN transaction t ON t.id = tt.transaction_id
            AND t.transaction_date >= p.date_from
            AND (p.date_to IS NULL OR t.transaction_date <= p.date_to)
            AND t.is_expense = 1 AND t.is_verified = 1
        WHERE p.id = @planId
        GROUP BY p.id, p.title, p.description, p.date_from, p.date_to,
                 pt.tag_id, tg.name, pt.amount, pt.description;
        """;

    private const string CreatePlanQuery =
        """
        INSERT INTO plan (title, description, date_from, date_to, created_date)
        VALUES (@title, @description, @dateFrom, @dateTo, @createdDate);
        SELECT LAST_INSERT_ID();
        """;

    private const string UpdatePlanQuery =
        """
        UPDATE plan
        SET title = @title, description = @description, date_from = @dateFrom, date_to = @dateTo, modified_date = @modifiedDate
        WHERE id = @planId;
        """;

    private const string DeletePlanQuery =
        """
        DELETE FROM plan_tag WHERE plan_id = @planId;
        DELETE FROM plan WHERE id = @planId;
        """;

    private const string AddPlanTagQuery =
        """
        INSERT INTO plan_tag (plan_id, tag_id, amount, description)
        VALUES (@planId, @tagId, @amount, @description);
        """;

    private const string UpdatePlanTagQuery =
        """
        UPDATE plan_tag
        SET amount = @amount, description = @description
        WHERE plan_id = @planId AND tag_id = @tagId;
        """;

    private const string DeletePlanTagQuery =
        """
        DELETE FROM plan_tag WHERE plan_id = @planId AND tag_id = @tagId;
        """;

    public async Task<IEnumerable<PlanSummary>> GetPlans()
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QueryAsync<PlanSummary>(GetPlansQuery);
    }

    public async Task<PlanDetail> GetPlanDetail(int planId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();

        PlanDetail plan = null;
        await connection.QueryAsync<PlanDetail, PlanTag, PlanDetail>(
            GetPlanDetailQuery,
            (p, pt) =>
            {
                plan ??= p;
                if (pt?.TagId > 0)
                    plan.TagLines.Add(pt);
                return plan;
            },
            new { planId },
            splitOn: "tagId"
        );
        return plan;
    }

    public async Task<int> CreatePlan(string title, string description, DateTime dateFrom, DateTime? dateTo)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        return await connection.QuerySingleAsync<int>(CreatePlanQuery,
            new { title, description, dateFrom, dateTo, createdDate = DateTime.UtcNow });
    }

    public async Task UpdatePlan(int planId, string title, string description, DateTime dateFrom, DateTime? dateTo)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdatePlanQuery,
            new { planId, title, description, dateFrom, dateTo, modifiedDate = DateTime.UtcNow });
    }

    public async Task DeletePlan(int planId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var dbTransaction = await connection.BeginTransactionAsync();
        await connection.ExecuteAsync(DeletePlanQuery, new { planId }, dbTransaction);
        await dbTransaction.CommitAsync();
    }

    public async Task AddPlanTag(int planId, int tagId, decimal amount, string description)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(AddPlanTagQuery, new { planId, tagId, amount, description });
    }

    public async Task UpdatePlanTag(int planId, int tagId, decimal amount, string description)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(UpdatePlanTagQuery, new { planId, tagId, amount, description });
    }

    public async Task DeletePlanTag(int planId, int tagId)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();
        await connection.ExecuteAsync(DeletePlanTagQuery, new { planId, tagId });
    }
}
