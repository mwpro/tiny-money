package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Transaction;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;

@Controller
@RequestMapping(path="/api/transaction")
public class TransactionsController {

    @GetMapping(path="")
    public @ResponseBody Iterable<Transaction> getTransactions() {
        ArrayList<Transaction> result = new ArrayList<Transaction>();

        int transactionId = 1;

        result.add(new Transaction(transactionId++, Date.from(Instant.now()), "Jedzenie / Dom", BigDecimal.valueOf(125.21)));
        result.add(new Transaction(transactionId++, Date.from(Instant.now()), "Przychody / Pensja", BigDecimal.valueOf(8000)));
        result.add(new Transaction(transactionId++, Date.from(Instant.now()), "Jedzenie / Dom", BigDecimal.valueOf(54.91)));
        result.add(new Transaction(transactionId++, Date.from(Instant.now()), "Zwierzęta / Niczko", BigDecimal.valueOf(120)));
        result.add(new Transaction(transactionId++, Date.from(Instant.now()), "Zwierzęta / Króliki", BigDecimal.valueOf(144)));

        return result;
    }
}
