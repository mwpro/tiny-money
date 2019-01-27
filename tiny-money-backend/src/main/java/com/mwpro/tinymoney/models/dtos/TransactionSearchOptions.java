package com.mwpro.tinymoney.models.dtos;

import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TransactionSearchOptions {
    private Boolean myTransactionsOnly;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate month;

    public Boolean getMyTransactionsOnly() {
        return myTransactionsOnly;
    }

    public void setMyTransactionsOnly(Boolean myTransactionsOnly) {
        this.myTransactionsOnly = myTransactionsOnly;
    }

    public BigDecimal getMinAmount() {
        return minAmount;
    }

    public void setMinAmount(BigDecimal minAmount) {
        this.minAmount = minAmount;
    }

    public BigDecimal getMaxAmount() {
        return maxAmount;
    }

    public void setMaxAmount(BigDecimal maxAmount) {
        this.maxAmount = maxAmount;
    }

    public LocalDate getMonth() {
        return month;
    }

    public void setMonth(LocalDate month) {
        this.month = month;
    }
}
