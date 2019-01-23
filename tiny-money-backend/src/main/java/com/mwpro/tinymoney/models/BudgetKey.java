package com.mwpro.tinymoney.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

@Embeddable
public class BudgetKey implements Serializable {
    @NotNull
    private int year;
    @NotNull
    private int month;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id")
    @NotNull
    @JsonIgnoreProperties({ "transactions"}) // TODO use DTO!
    private Subcategory subcategory;

    public BudgetKey() {
    }

    public BudgetKey(@NotNull int year, @NotNull int month, @NotNull Subcategory subcategory) {
        this.year = year;
        this.month = month;
        this.subcategory = subcategory;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public Subcategory getSubcategory() {
        return subcategory;
    }

    public void setSubcategory(Subcategory subcategory) {
        this.subcategory = subcategory;
    }
}
