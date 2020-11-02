using System;
using System.Linq;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class SetBudgetAmount
    {
        public decimal BudgetAmount { get; set; }
    }

    public class SetBudgetNotes
    {
        public string Notes { get; set; }
    }
}
