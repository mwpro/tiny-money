using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using MW.TinyMoney.Api.Infrastructure;

namespace MW.TinyMoney.Api.Reports;

public interface ISankeyReport
{
    Task<SankeyReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo);
}

public class SankeyReport : ISankeyReport
{
    private readonly MySqlConnectionFactory _mySqlConnectionFactory;

    public SankeyReport(MySqlConnectionFactory mySqlConnectionFactory)
    {
        _mySqlConnectionFactory = mySqlConnectionFactory;
    }

    public async Task<SankeyReportModel> Prepare(DateTime? dateFrom, DateTime? dateTo)
    {
        await using var connection = _mySqlConnectionFactory.CreateConnection();
        await connection.OpenAsync();

        var queryResults = (await connection.QueryMultipleAsync(SankeyQuery,
            new
            {
                dateFrom = dateFrom, dateTo = dateTo
            }));
        var categoryResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();
        var subcategoryResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();
        var vendorResults = (await queryResults.ReadAsync<TransactionsSum>()).ToList();

        const int rootNodeIndex = 0;
        var hasSingleIncomeCategory = categoryResults.Count(q => q.AggregationLevel == "category" && q.IsExpense == false) == 1;

        var rootNodes = categoryResults.Where(c => c.IsExpense || !hasSingleIncomeCategory).Select((q, i) => new SankeyNode()
        {
            Index = i + 1,
            Name = q.Label,
            NodeType = q.AggregationLevel,
            NodeId = q.Id,
            SubChart = PrepareSubcategorySankeySubChart(subcategoryResults, vendorResults, q, rootNodeIndex)
        }).ToList();
        if (hasSingleIncomeCategory)
        {
            var incomeCategoriesCount = rootNodes.Count + 1;
            rootNodes.AddRange(subcategoryResults.Where(c => !c.IsExpense).Select((q, i) => new SankeyNode()
            {
                Index = incomeCategoriesCount + i,
                Name = q.Label,
                NodeType = q.AggregationLevel,
                NodeId = q.Id,
                SubChart = PrepareVendorSankeySubChart(vendorResults, q, rootNodeIndex)
            }));
        }    
        rootNodes.Insert(0, new SankeyNode()
        {
            Index = rootNodeIndex,
            Name = "Budżet"
        });
        var rootLinks = categoryResults.Where(t => t.IsExpense || !hasSingleIncomeCategory)
            .Select(t => new SankeyLink()
            {
                Source = t.IsExpense ? rootNodeIndex : rootNodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index,
                Target = t.IsExpense ? rootNodes.First(n => n.NodeType == "category" && n.NodeId == t.Id).Index : rootNodeIndex,
                Value = t.Value,
                IsExpense = t.IsExpense
            }).ToList();
        if (hasSingleIncomeCategory)
        {
            rootLinks.AddRange(subcategoryResults.Where(t => !t.IsExpense)
                .Select(t => new SankeyLink()
                {
                    Source = rootNodes.First(n => n.NodeType == "subcategory" && n.NodeId == t.Id).Index,
                    Target = rootNodeIndex,
                    Value = t.Value,
                    IsExpense = t.IsExpense
                }));
        }
        
        return new SankeyReportModel()
        {
            Root = new SankeyChart()
            {
                Nodes = rootNodes,
                Links = rootLinks
            }
        };
    }

    private static SankeyChart PrepareVendorSankeySubChart(List<TransactionsSum> vendorResults, TransactionsSum parent, int rootNodeIndex)
    {
        return new SankeyChart()
        {
            Nodes = vendorResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s,
                j) => new SankeyNode()
            {
                Index = j + 1,
                Name = s.Label,
                NodeType = s.AggregationLevel,
                NodeId = s.Id,
            }).Prepend(new SankeyNode()
            {
                Index = rootNodeIndex,
                Name = parent.Label
            }).ToList(),
            Links = vendorResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s, j) => new SankeyLink()
            {
                Source = s.IsExpense ? rootNodeIndex : j + 1,
                Target = s.IsExpense ? j + 1 : rootNodeIndex,
                Value = s.Value,
                IsExpense = s.IsExpense
            }).ToList()
        };
    }

    private static SankeyChart PrepareSubcategorySankeySubChart(List<TransactionsSum> subcategoryResults, List<TransactionsSum> vendorResults, TransactionsSum parent, int rootNodeIndex)
    {
        return new SankeyChart()
        {
            Nodes = subcategoryResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s,
                j) => new SankeyNode()
            {
                Index = j + 1,
                Name = s.Label,
                NodeType = s.AggregationLevel,
                NodeId = s.Id,
                SubChart = PrepareVendorSankeySubChart(vendorResults, s, rootNodeIndex)
            }).Prepend(new SankeyNode()
            {
                Index = rootNodeIndex,
                Name = parent.Label
            }).ToList(),
            Links = subcategoryResults.Where(s => s.IsExpense == parent.IsExpense && s.ParentId == parent.Id).Select((s, j) => new SankeyLink()
            {
                Source = s.IsExpense ? rootNodeIndex : j + 1,
                Target = s.IsExpense ? j + 1 : rootNodeIndex,
                Value = s.Value,
                IsExpense = s.IsExpense
            }).ToList()
        };
    }

    private const string SankeyQuery = @"
            SELECT /* category level */
                'category' AS `aggregationLevel`,
                c.id AS 'id',
                null AS 'parentId',
                t.is_expense as `isExpense`, 
                c.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN subcategory s ON s.id = t.subcategory_id
                JOIN category c ON c.id = s.parent_category_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, c.id, c.name;
            SELECT /* subcategory level */
                'subcategory' AS `aggregationLevel`,
                s.id AS 'id',
                s.parent_category_id AS 'parentId',
                t.is_expense as `isExpense`, 
                s.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN subcategory s ON s.id = t.subcategory_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, s.id, s.name, s.parent_category_id;
            SELECT /* vendor level */
                'vendor' AS `aggregationLevel`,
                v.id AS 'id',
                t.subcategory_id AS 'parentId',
                t.is_expense as `isExpense`, 
                v.name as `label`,
                SUM(t.amount) AS `value`
            FROM transaction t
                JOIN vendor v ON v.id = t.vendor_id
            WHERE (@dateFrom IS NULL OR transaction_date >= @dateFrom)
                      AND (@dateTo IS NULL OR transaction_date <= @dateTo)
            GROUP BY t.is_expense, t.subcategory_id, v.id, v.name
            ORDER BY SUM(t.amount) DESC;
            ";

    private class TransactionsSum
    {
        public string AggregationLevel { get; set; }
        public int Id { get; set; }
        public int? ParentId { get; set; }
        public bool IsExpense { get; set; }
        public string Label { get; set; }
        public decimal Value { get; set; }
    }
}