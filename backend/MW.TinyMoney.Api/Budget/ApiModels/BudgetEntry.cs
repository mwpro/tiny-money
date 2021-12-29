namespace MW.TinyMoney.Api.Budget.ApiModels
{
    public class BudgetEntry
    {
        public int SubcategoryId { get; set; }
        public decimal Amount { get; set; }
        public decimal UsedAmount { get; set; }
        public string Notes { get; set; }
    }
}