using System.Collections.Generic;
using System.Threading.Tasks;
using MW.TinyMoney.Api.Budget;
using MW.TinyMoney.Api.Budget.ApiModels;

namespace MW.TinyMoney.UnitTests.Helpers;

public class BudgetStoreStub : IBudgetStore
{
    public MonthlyBudget MonthlyBudget { get; set; } = new MonthlyBudget
    {
        CategoryBudgets = new List<CategoryBudget>()
    };

    public Task<MonthlyBudget> GetMonthlyBudget(int year, int month)
        => Task.FromResult(MonthlyBudget);

    public Task SetBudget(int year, int month, int subcategoryId, decimal budgetAmount, string budgetNotes) => throw new System.NotImplementedException();
    public Task CopyBudget(int yearFrom, int monthFrom, int yearTo, int monthTo) => throw new System.NotImplementedException();
    public Task<IEnumerable<SubcategoryBudgetSuggestions>> GetBudgetSuggestions(int year, int month) => throw new System.NotImplementedException();
}
