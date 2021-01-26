using System.Collections.Generic;

namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class BudgetResponse
    {
        public IEnumerable<BudgetEntry> BudgetEntries { get; set; }
    }
}