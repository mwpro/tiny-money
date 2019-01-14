package com.mwpro.tinymoney.models;

import java.math.BigDecimal;
import java.util.Date;

//@Entity
public class Transaction {
    private Integer id;
    private Date date;
    private String category;
    private BigDecimal amount;

    public Transaction(Integer id, Date date, String category, BigDecimal amount) {
        this.id = id;
        this.date = date;
        this.category = category;
        this.amount = amount;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
