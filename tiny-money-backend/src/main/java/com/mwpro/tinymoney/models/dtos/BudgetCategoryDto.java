package com.mwpro.tinymoney.models.dtos;
import java.util.List;

public class BudgetCategoryDto {
    private String name;

    private List<BudgetSubcategoryDto> subcategories;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<BudgetSubcategoryDto> getSubcategories() {
        return subcategories;
    }

    public void setSubcategories(List<BudgetSubcategoryDto> subcategories) {
        this.subcategories = subcategories;
    }
}

