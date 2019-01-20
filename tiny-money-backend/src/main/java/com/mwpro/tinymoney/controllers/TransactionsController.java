package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.AddTransactionDto;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.models.dtos.TransactionDto;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/transaction")
public class TransactionsController {
    @Autowired
    private TransactionsRepository transactionsRepository;
    @Autowired
    private SubcategoriesRepository subcategoriesRepository;

    @Autowired
    private ModelMapper modelMapper;

    @GetMapping(path="")
    public ResponseEntity<List<TransactionDto>> getTransactions
            (@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        LocalDate date = month.withDayOfMonth(1);
        List<Transaction> transactions = transactionsRepository.findAllFromMonthForListing(date,
                date.plusMonths(1));

        return new ResponseEntity<>(transactions.stream()
                .map(t -> mapToDto(t)).collect(Collectors.toList()), HttpStatus.OK);
    }

    private TransactionDto mapToDto(Transaction t) {
        TransactionDto transactionDto = modelMapper.map(t, TransactionDto.class);
        return transactionDto;
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

    // TODO something sucks about primary keys in db - some weird hibernate_sequence table is created?

    // TODO update

    // TODO delete

    // TODO get single

    // TODO advanced get list

    // TODO jpa auditing

    // todo rewrite controller methods as ResponseEntity<> with valid status codes

    // todo rewrite using DTOs

    // TODO use java.time instead of Date...

}
