package com.mwpro.tinymoney.controllers;


import com.mwpro.tinymoney.models.Category;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.repositories.CategoriesRepository;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(path="/api/category")
public class CategoriesController {
    @Autowired
    private CategoriesRepository categoriesRepository;

    @Autowired
    private SubcategoriesRepository subcategoriesRepository;

    @GetMapping(path="")
    public @ResponseBody
    Iterable<Category> getCategories() {
        return categoriesRepository.findAll();
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
}
