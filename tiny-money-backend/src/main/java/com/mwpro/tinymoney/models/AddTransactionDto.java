package com.mwpro.tinymoney.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.Date;

public class AddTransactionDto {
    private Date transactionDate;
    private BigDecimal amount;
    private Integer subcategoryId;

    @JsonProperty(value="isExpense")
    private Boolean isExpense;

    public Date getTransactionDate() {
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
