using System;
using System.Collections.Generic;
using FluentAssertions;
using MW.TinyMoney.Api.Categories;
using MW.TinyMoney.Api.Import;
using MW.TinyMoney.Api.Vendors;
using Xunit;

namespace MW.TinyMoney.UnitTests.Import;

public class ImportServiceDefaultSubcategoryTests
{
    private const int VetId = 10;
    private const int SalaryId = 20;
    private static readonly DateTime HiddenFrom = new(2026, 10, 15);

    private static readonly IReadOnlyCollection<Category> Categories = new List<Category>
    {
        new()
        {
            Id = 1, Name = "Zwierzęta", IsIncome = false,
            Subcategories = new List<Subcategory> { new() { Id = VetId, Name = "Burek", HiddenFrom = HiddenFrom } }
        },
        new()
        {
            Id = 2, Name = "Przychody", IsIncome = true,
            Subcategories = new List<Subcategory> { new() { Id = SalaryId, Name = "Wynagrodzenie" } }
        }
    };

    private static Vendor VendorWithDefault(int subcategoryId) => new() { Id = 1, Name = "Weterynarz", DefaultSubcategoryId = subcategoryId };

    [Fact]
    public void UsesVendorDefault_WhenTransactionIsBeforeHiddenDate()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(VetId), isExpense: true, HiddenFrom.AddDays(-1))
            .Should().Be(VetId);
    }

    [Fact]
    public void LeavesUncategorized_WhenTransactionIsOnHiddenDate()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(VetId), isExpense: true, HiddenFrom)
            .Should().BeNull();
    }

    [Fact]
    public void LeavesUncategorized_WhenTransactionIsAfterHiddenDate()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(VetId), isExpense: true, HiddenFrom.AddDays(30))
            .Should().BeNull();
    }

    [Fact]
    public void UsesVendorDefault_WhenSubcategoryIsNotHidden()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(SalaryId), isExpense: false, HiddenFrom.AddDays(30))
            .Should().Be(SalaryId);
    }

    [Fact]
    public void LeavesUncategorized_WhenVendorDefaultSubcategoryIsUnknown()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(999), isExpense: true, HiddenFrom.AddDays(-1))
            .Should().BeNull();
    }

    [Fact]
    public void LeavesUncategorized_WhenDirectionDoesNotMatchCategoryType()
    {
        ImportService.DefaultSubcategoryFor(Categories, VendorWithDefault(SalaryId), isExpense: true, HiddenFrom.AddDays(-1))
            .Should().BeNull();
    }
}
