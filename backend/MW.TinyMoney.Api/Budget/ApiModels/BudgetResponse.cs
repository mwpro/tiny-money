using System.Collections.Generic;

namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class BudgetResponse
    {
        public IEnumerable<BudgetEntry> BudgetEntries { get; set; }
    }
    public class BudgetResponseV2
    {
        public MonthlyBudget MonthlyBudget { get; set; }
    }
}