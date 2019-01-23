package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.models.BudgetKey;
import com.mwpro.tinymoney.models.Category;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.models.dtos.BudgetCategoryDto;
import com.mwpro.tinymoney.models.dtos.BudgetSubcategoryDto;
import com.mwpro.tinymoney.models.dtos.SetBudgetDto;
import com.mwpro.tinymoney.repositories.BudgetsRepository;
import com.mwpro.tinymoney.repositories.CategoriesRepository;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/budget")
public class BudgetsController {
    @Autowired
    private BudgetsRepository budgetsRepository;
    @Autowired
    private CategoriesRepository categoriesRepository;
    @Autowired
    private SubcategoriesRepository subcategoriesRepository;

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

    @PostMapping(path="")
    public ResponseEntity<SetBudgetDto> setBudget(
            @RequestBody SetBudgetDto budgetDto) {
        Optional<Subcategory> subcategory =  subcategoriesRepository.findById(budgetDto.getSubcategoryId());
        BudgetKey budgetKey = new BudgetKey(budgetDto.getYear(), budgetDto.getMonth(), subcategory.get());
        Budget budget = budgetsRepository.findById(budgetKey).orElse(new Budget(budgetKey));
        budget.setAmount(budgetDto.getAmount());
        budgetsRepository.save(budget);
        return new ResponseEntity<>(budgetDto, HttpStatus.OK);
    }

    @PostMapping(path="/{yearFrom}/{monthFrom}/copy/{yearTo}/{monthTo}")
    public ResponseEntity<String> copyBudget(
            @PathVariable("yearFrom") Integer yearFrom, @PathVariable("monthFrom") Integer monthFrom,
            @PathVariable("yearTo") Integer yearTo, @PathVariable("monthTo") Integer monthTo) {

        List<Budget> sourceBudgets = budgetsRepository.findAllByBudgetKeyYearAndBudgetKeyMonth(yearFrom, monthFrom);
        List<Budget> destinationBudgets = budgetsRepository.findAllByBudgetKeyYearAndBudgetKeyMonth(yearTo, monthTo);

        List<Budget> budgetsToCopy = sourceBudgets.stream()
                .filter(src -> destinationBudgets.stream().allMatch(dest -> dest.getBudgetKey().getSubcategory() != src.getBudgetKey().getSubcategory()))
                .map(src -> {
                    Budget result = new Budget(new BudgetKey(yearTo, monthTo, src.getBudgetKey().getSubcategory()));
                    result.setAmount(src.getAmount());
                    return result;
                }).collect(Collectors.toList());

        budgetsRepository.saveAll(budgetsToCopy);

        return new ResponseEntity<>(yearFrom + " " + monthFrom + " " + yearTo + " " + monthTo, HttpStatus.OK);
    }
}
