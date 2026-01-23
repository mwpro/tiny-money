using System.Collections.Generic;

namespace MW.TinyMoney.Api.Budget.ApiModels;

public class BudgetSuggestionsResponse
{
    public IEnumerable<SubcategoryBudgetSuggestions> SubcategoryBudgetSuggestions { get; set; }
}

public class SubcategoryBudgetSuggestions
{
    public int SubcategoryId { get; set; }
    public IEnumerable<BudgetSuggestion> Suggestions { get; set; }
}

public class BudgetSuggestion
{
    public string SuggestionName { get; set; }
    public decimal SuggestedAmount { get; set; }
}