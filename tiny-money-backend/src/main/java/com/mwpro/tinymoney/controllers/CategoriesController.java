package com.mwpro.tinymoney.controllers;


import com.mwpro.tinymoney.models.Category;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.repositories.BudgetsRepository;
import com.mwpro.tinymoney.repositories.CategoriesRepository;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.JoinType;
@Controller
@RequestMapping(path="/api/category")
public class CategoriesController {
    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private SubcategoriesRepository subcategoriesRepository;

    @Autowired
    private BudgetsRepository budgetsRepository;

    @GetMapping(path="")
    public ResponseEntity<Iterable<Category>> getCategories() {
        return new ResponseEntity<>(categoriesRepository.findAll((Specification<Category>)
                (root, query, cb) -> {
                    root.fetch("subcategories", JoinType.LEFT);
                    return cb.and();
                }), HttpStatus.OK);
    }

    @PostMapping(path="")
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public Category addCategory(@RequestBody Category category) {
        categoriesRepository.save(category);
        return category;
    }

    @PostMapping(path="/{id}/subcategory")
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public Subcategory addSubcategory(@PathVariable("id") Integer categoryId,
                                @RequestBody Subcategory subcategory) {
        Category category = categoriesRepository.findById(categoryId).get();
        subcategory.setParentCategory(category);
        //category.getSubcategories().add(subcategory);
        subcategoriesRepository.save(subcategory);
        return subcategory;
    }

    @DeleteMapping(path = "/{id}")
    public ResponseEntity deleteCategory(@PathVariable("id") Integer categoryId) {
        Category category = categoriesRepository.getOne(categoryId);
        if (category == null){
            return new ResponseEntity(HttpStatus.NOT_FOUND);
        }
        if (!category.getSubcategories().isEmpty())
            return new ResponseEntity("CANNOT_REMOVE_CATEGORY_WITH_SUBCATEGORIES", HttpStatus.BAD_REQUEST);

        categoriesRepository.delete(category);

        return new ResponseEntity(HttpStatus.OK);
    }


    @DeleteMapping(path="/{id}/subcategory/{subcategoryId}")
    public ResponseEntity deleteSubcategory(@PathVariable("subcategoryId") Integer subcategoryId) {
        Subcategory subcategory = subcategoriesRepository.getOne(subcategoryId);
        if (subcategory == null){
            return new ResponseEntity(HttpStatus.NOT_FOUND);
        }
        if (!subcategory.getTransactions().isEmpty())
            return new ResponseEntity("CANNOT_REMOVE_SUBCATEGORY_WITH_TRANSACTIONS", HttpStatus.BAD_REQUEST);

        budgetsRepository.deleteAll(subcategory.getBudgets());
        subcategoriesRepository.delete(subcategory);

        return new ResponseEntity(HttpStatus.OK);
    }
}
