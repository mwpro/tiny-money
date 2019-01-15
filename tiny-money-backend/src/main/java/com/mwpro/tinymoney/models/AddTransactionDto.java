package com.mwpro.tinymoney.models;

import java.math.BigDecimal;
import java.util.Date;

public class AddTransactionDto {
    private Date transactionDate;
    private BigDecimal amount;
    private Integer subcategoryId;

    public Date getTransactionDate() {
        return transactionDate;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Integer getSubcategoryId() {
        return subcategoryId;
    }
}
