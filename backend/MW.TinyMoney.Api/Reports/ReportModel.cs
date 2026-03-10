using System;
using System.Collections.Generic;

namespace MW.TinyMoney.Api.Reports;

public class SummaryReportModel
{
    public IEnumerable<ReportPeriod> Periods { get; set; }
    public IEnumerable<ReportCategory> Categories { get; set; }
    
    public decimal IncomesAvg { get; set; }
    public decimal IncomesSum { get; set; }
    public decimal ExpensesAvg { get; set; }
    public decimal ExpensesSum { get; set; }
    public decimal BalanceAvg { get; set; }
    public decimal BalanceSum { get; set; }
}

public class ReportPeriod
{
    public string PeriodLabel { get; set; }
    
    public decimal Budget { get; set; }
    public decimal BudgetDifference { get; set; }
    public decimal IncomesSum { get; set; }
    public decimal ExpensesSum { get; set; }
    public decimal Balance { get; set; }
}

public class ReportCategory
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public bool IsIncome { get; set; }

    public decimal TransactionsSum { get; set; }
    public decimal TransactionsAvg { get; set; }
    
    public IEnumerable<ReportPeriodCategory> Periods { get; set; }
    public IEnumerable<ReportSubcategory> Subcategories { get; set; }
}

public class ReportPeriodCategory
{
    public string PeriodLabel { get; set; }
    
    public decimal TransactionsSum { get; set; }
}

public class ReportSubcategory
{
    public int SubcategoryId { get; set; }
    public string SubcategoryName { get; set; }
    
    public decimal TransactionsSum { get; set; }
    public decimal TransactionsAvg { get; set; }
    
    public IEnumerable<ReportPeriodSubcategory> Periods { get; set; }
}

public class ReportPeriodSubcategory
{
    public string PeriodLabel { get; set; }
    
    public decimal TransactionsSum { get; set; }
}

public class TopListReportModel
{
    public IEnumerable<TopTransactionModel> Expenses { get; set; }
    public IEnumerable<TopTransactionModel> Incomes { get; set; }
    public IEnumerable<TopEntryModel> ExpenseVendors { get; set; }
    public IEnumerable<TopEntryModel> IncomeVendors { get; set; }
    public IEnumerable<TopEntryModel> Tags { get; set; }
}

public class TopTransactionModel
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public string VendorName { get; set; }
    public DateTime TransactionDate { get; set; }
    public decimal Amount { get; set; }
}

public class TopEntryModel
{
    public int Id { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public int NumberOfTransactions { get; set; }
}

public class SankeyReportModel
{
    public SankeyChart Root { get; set; }
}

public class SankeyChart
{
    public IEnumerable<SankeyNode> Nodes { get; set; }
    public IEnumerable<SankeyLink> Links { get; set; }
}

public class SankeyNode
{
    public int Index { get; set; }
    public string Name { get; set; }
    public int NodeId { get; set; }
    
    public SankeyChart SubChart { get; set; }
}

public class SankeyLink
{
    public int Source { get; set; }
    public int Target { get; set; }
    public decimal Value { get; set; }
    public bool IsExpense { get; set; }
}