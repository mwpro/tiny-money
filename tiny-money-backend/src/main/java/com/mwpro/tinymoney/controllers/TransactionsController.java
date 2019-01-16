package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.AddTransactionDto;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.Month;
import java.time.temporal.TemporalAmount;
import java.time.temporal.TemporalUnit;
import java.util.Comparator;
import java.util.Date;

@Controller
@RequestMapping(path="/api/transaction")
public class TransactionsController {
    @Autowired
    private TransactionsRepository transactionsRepository;
    @Autowired
    private SubcategoriesRepository subcategoriesRepository;

    @GetMapping(path="")
    public @ResponseBody Iterable<Transaction> getTransactions() {
        return transactionsRepository.findAllByOrderByTransactionDateDescCreatedDateDesc();
    }

    @PostMapping(path="")
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public Transaction addTransaction(@RequestBody AddTransactionDto addTransactionDto) {
        Transaction transaction = new Transaction();
        Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();

        transaction.setSubcategory(subcategory);
        transaction.setAmount(addTransactionDto.getAmount());
        transaction.setTransactionDate(addTransactionDto.getTransactionDate());
        transaction.setIsExpense(addTransactionDto.getIsExpense());

        transactionsRepository.save(transaction);
        return transaction;
    }

    // TODO update

    // TODO delete

    // TODO get single

    // TODO advanced get list

    // TODO jpa auditing
}
