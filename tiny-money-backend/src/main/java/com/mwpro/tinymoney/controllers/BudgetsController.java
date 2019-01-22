package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.models.Category;
import com.mwpro.tinymoney.models.dtos.BudgetCategoryDto;
import com.mwpro.tinymoney.models.dtos.BudgetSubcategoryDto;
import com.mwpro.tinymoney.models.dtos.SubcategoryDto;
import com.mwpro.tinymoney.repositories.BudgetsRepository;
import com.mwpro.tinymoney.repositories.CategoriesRepository;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/budget")
public class BudgetsController {
    @Autowired
    private BudgetsRepository budgetsRepository;
    @Autowired
    private CategoriesRepository categoriesRepository;

    @GetMapping(path="")
    public ResponseEntity<List<Budget>> getBudgets() {
        return new ResponseEntity<>(budgetsRepository.findAll(), HttpStatus.OK);
    }

    @GetMapping(path="/{year}/{month}")
    public ResponseEntity<List<BudgetCategoryDto>> getBudgetsForMonth(
            @PathVariable("year") Integer year, @PathVariable("month") Integer month) {
        // TODO query of shame... but... it works ;-) I will fix it one day. Or another. Or Never.
        List<Category> categories = categoriesRepository.findAll();
        List<BudgetCategoryDto> result = categories.stream().map(c -> {
            BudgetCategoryDto category = new BudgetCategoryDto();
            category.setName(c.getName());
            category.setSubcategories(c.getSubcategories().stream().map(s -> {
                BudgetSubcategoryDto subcategory = new BudgetSubcategoryDto();
                subcategory.setSubcategoryName(s.getName());
                BigDecimal budget = s.getBudgets().stream().filter(x -> x.getBudgetKey().getMonth() == month &&
                        x.getBudgetKey().getYear() == year).findFirst().map(x -> x.getAmount()).orElse(BigDecimal.ZERO);
                subcategory.setAmount(budget);
                subcategory.setSubcategoryId(s.getId());
                subcategory.setUsedAmount(budgetsRepository.sumTransactionsForMonth(year, month, s));
                return subcategory;
            }).collect(Collectors.toList()));
            return category;
        }).collect(Collectors.toList());
        return new ResponseEntity<>(result, HttpStatus.OK);
    }
}
