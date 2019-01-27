package com.mwpro.tinymoney.models.dtos;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

public class TransactionSearchOptions {
    private Boolean myTransactionsOnly;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate month;

    public Boolean getMyTransactionsOnly() {
        return myTransactionsOnly;
    }

    public void setMyTransactionsOnly(Boolean myTransactionsOnly) {
        this.myTransactionsOnly = myTransactionsOnly;
    }

    public LocalDate getMonth() {
        return month;
    }

    public void setMonth(LocalDate month) {
        this.month = month;
    }
}
