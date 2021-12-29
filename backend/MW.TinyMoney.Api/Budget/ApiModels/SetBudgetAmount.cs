using System;
using System.Linq;
using System.Threading.Tasks;

namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class SetBudget
    {
        public decimal BudgetAmount { get; set; }
        public string Notes { get; set; }
    }
}
