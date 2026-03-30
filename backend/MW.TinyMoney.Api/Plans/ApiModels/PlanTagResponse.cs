namespace MW.TinyMoney.Api.Plans.ApiModels;

public class PlanTagResponse
{
    public int TagId { get; set; }
    public string TagName { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; }
    public decimal Spent { get; set; }
    public decimal SpentPercent { get; set; }
}