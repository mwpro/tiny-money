package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping(path="/api/transaction")
public class TransactionsController {
    @Autowired
    private TransactionsRepository transactionsRepository;

    @GetMapping(path="")
    public @ResponseBody Iterable<Transaction> getTransactions() {
        return transactionsRepository.findAll();
    }

    @PostMapping(path="")
    @ResponseStatus(HttpStatus.CREATED)
    @ResponseBody
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        transactionsRepository.save(transaction);
        return transaction;
    }
}
