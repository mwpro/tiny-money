using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MW.TinyMoney.Api.Budget.ApiModels;
using MW.TinyMoney.Api.Dashboard;
using MW.TinyMoney.UnitTests.Helpers;
using Xunit;

namespace MW.TinyMoney.UnitTests.Dashboard;

public class DashboardControllerTests
{
    private readonly DashboardStoreStub _dashboardStore;
    private readonly BudgetStoreStub _budgetStore;
    private readonly Api.Dashboard.DashboardController _controller;

    public DashboardControllerTests()
    {
        _dashboardStore = new DashboardStoreStub();
        _budgetStore = new BudgetStoreStub();
        _controller = new Api.Dashboard.DashboardController(_dashboardStore, _budgetStore);
    }

    [Fact]
    public async Task GetDashboard_MergesStoreDataAndBudgetData()
    {
        _dashboardStore.DashboardData = new DashboardData
        {
            IncomesTotal = 3000m,
            ExpensesTotal = 2100m,
            UnverifiedCount = 3,
            DailyExpenses = [new DailyExpense(1, 100m), new DailyExpense(5, 500m)]
        };
        _budgetStore.MonthlyBudget = new MonthlyBudget
        {
            Amount = 4000m,
            UsedAmount = 2100m,
            AmountLeft = 1900m,
            CategoryBudgets = new List<CategoryBudget>
            {
                new CategoryBudget { CategoryName = "Jedzenie", Amount = 1000m, AmountLeft = 400m, SubcategoryBudgets = new List<SubcategoryBudget>
                {
                    new SubcategoryBudget { SubcategoryName = "Restauracje", Amount = 600m, AmountLeft = 200m, Notes = "max 3x w tygodniu" },
                    new SubcategoryBudget { SubcategoryName = "Zakupy spożywcze", Amount = 400m, AmountLeft = 200m }
                }},
                new CategoryBudget { CategoryName = "Transport", Amount = 500m, AmountLeft = -100m, SubcategoryBudgets = new List<SubcategoryBudget>
                {
                    new SubcategoryBudget { SubcategoryName = "Paliwo", Amount = 500m, AmountLeft = -100m }
                }}
            }
        };

        var response = (await _controller.GetDashboard(2026, 3))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<DashboardResponse>()
            .Subject;

        response.IncomesTotal.Should().Be(3000m);
        response.ExpensesTotal.Should().Be(2100m);
        response.UnverifiedCount.Should().Be(3);
        response.BudgetAmount.Should().Be(4000m);
        response.BudgetUsed.Should().Be(2100m);
        response.BudgetLeft.Should().Be(1900m);
        response.DailyExpenses.Should().HaveCount(2);
        response.CategoryBudgets.Should().HaveCount(3);
        response.CategoryBudgets.Should().Contain(c => c.SubcategoryName == "Restauracje" && c.Amount == 600m && c.AmountLeft == 200m && c.Notes == "max 3x w tygodniu");
        response.CategoryBudgets.Should().Contain(c => c.SubcategoryName == "Zakupy spożywcze" && c.Amount == 400m && c.AmountLeft == 200m);
        response.CategoryBudgets.Should().Contain(c => c.SubcategoryName == "Paliwo" && c.Amount == 500m && c.AmountLeft == -100m);
    }

    [Fact]
    public async Task GetDashboard_ExcludesCategoriesWithNoBudget()
    {
        _dashboardStore.DashboardData = new DashboardData
        {
            IncomesTotal = 0m,
            ExpensesTotal = 0m,
            UnverifiedCount = 0,
            DailyExpenses = []
        };
        _budgetStore.MonthlyBudget = new MonthlyBudget
        {
            Amount = 1000m,
            UsedAmount = 0m,
            AmountLeft = 1000m,
            CategoryBudgets = new List<CategoryBudget>
            {
                new CategoryBudget { CategoryName = "Jedzenie", Amount = 1000m, AmountLeft = 1000m, SubcategoryBudgets = new List<SubcategoryBudget>
                {
                    new SubcategoryBudget { SubcategoryName = "Restauracje", Amount = 1000m, AmountLeft = 1000m }
                }},
                new CategoryBudget { CategoryName = "BezBudżetu", Amount = 0m, AmountLeft = 0m, SubcategoryBudgets = new List<SubcategoryBudget>
                {
                    new SubcategoryBudget { SubcategoryName = "NieUżywane", Amount = 0m, AmountLeft = 0m }
                }}
            }
        };

        var response = (await _controller.GetDashboard(2026, 3))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<DashboardResponse>()
            .Subject;

        response.CategoryBudgets.Should().HaveCount(1);
        response.CategoryBudgets.Should().Contain(c => c.SubcategoryName == "Restauracje");
        response.CategoryBudgets.Should().NotContain(c => c.SubcategoryName == "NieUżywane");
    }

    [Fact]
    public async Task GetDashboard_WhenNoBudgetSet_ReturnsBudgetFieldsAsZeroAndEmptyDailyExpenses()
    {
        _dashboardStore.DashboardData = new DashboardData
        {
            IncomesTotal = 1000m,
            ExpensesTotal = 500m,
            UnverifiedCount = 1,
            DailyExpenses = [new DailyExpense(10, 500m)]
        };
        _budgetStore.MonthlyBudget = new MonthlyBudget
        {
            Amount = 0m,
            UsedAmount = 0m,
            AmountLeft = 0m,
            CategoryBudgets = new List<CategoryBudget>()
        };

        var response = (await _controller.GetDashboard(2026, 3))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<DashboardResponse>()
            .Subject;

        response.BudgetAmount.Should().Be(0m);
        response.BudgetUsed.Should().Be(0m);
        response.BudgetLeft.Should().Be(0m);
        response.DailyExpenses.Should().BeEmpty();
    }

    [Fact]
    public async Task GetDashboard_ReturnsCorrectUnverifiedCount()
    {
        _dashboardStore.DashboardData = new DashboardData
        {
            IncomesTotal = 0m,
            ExpensesTotal = 0m,
            UnverifiedCount = 7,
            DailyExpenses = []
        };
        _budgetStore.MonthlyBudget = new MonthlyBudget
        {
            Amount = 1000m,
            UsedAmount = 0m,
            AmountLeft = 1000m,
            CategoryBudgets = new List<CategoryBudget>()
        };

        var response = (await _controller.GetDashboard(2026, 3))
            .Should().BeOfType<OkObjectResult>()
            .Which.Value.Should().BeOfType<DashboardResponse>()
            .Subject;

        response.UnverifiedCount.Should().Be(7);
    }
}
