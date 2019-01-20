package com.mwpro.tinymoney.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;

public class AddTransactionDto {
    private LocalDate transactionDate;
    private BigDecimal amount;
    private Integer subcategoryId;

    @JsonProperty(value="isExpense")
    private Boolean isExpense;

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Integer getSubcategoryId() {
        return subcategoryId;
    }

    public Boolean getIsExpense() {
        return isExpense;
    }
}
