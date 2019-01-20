package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.repositories.BudgetsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping(path="/api/budget")
public class BudgetsController {
    @Autowired
    private BudgetsRepository budgetsRepository;

    @GetMapping(path="")
    public ResponseEntity<List<Budget>> getBudgets() {
        return new ResponseEntity<>(budgetsRepository.findAll(), HttpStatus.OK);
    }

    @GetMapping(path="/{year}/{month}")
    public ResponseEntity<List<Budget>> getBudgetsForMonth(
            @PathVariable("year") Integer year, @PathVariable("month") Integer month) {
        return new ResponseEntity<>(budgetsRepository.findAll(), HttpStatus.OK);
    }
}
