using System.Collections.Generic;
using System.Linq;

namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class BudgetEntry
    {
        public int SubcategoryId { get; set; }
        public decimal Amount { get; set; }
        public decimal UsedAmount { get; set; }
        public string Notes { get; set; }
    }

    public class MonthlyBudget
    {
        public decimal Amount => CategoryBudgets.Sum(s => s.Amount);
        public decimal UsedAmount => CategoryBudgets.Sum(s => s.UsedAmount);
        public decimal AmountLeft => CategoryBudgets.Sum(s => s.AmountLeft);
        
        public IEnumerable<CategoryBudget> CategoryBudgets { get; set; }
    }

    public class CategoryBudget
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        
        public decimal Amount => SubcategoryBudgets.Sum(s => s.Amount);
        public decimal UsedAmount => SubcategoryBudgets.Sum(s => s.UsedAmount);
        public decimal AmountLeft => SubcategoryBudgets.Sum(s => s.AmountLeft);
        
        public IEnumerable<SubcategoryBudget> SubcategoryBudgets { get; set; }
    }
    
    public class SubcategoryBudget
    {
        public int SubcategoryId { get; set; }
        public string SubcategoryName { get; set; }
        
        public decimal Amount { get; set; }
        public decimal UsedAmount { get; set; }
        public decimal AmountLeft { get; set; }
        
        public string Notes { get; set; }
    }
}