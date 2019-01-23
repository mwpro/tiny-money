package com.mwpro.tinymoney.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;

@Entity
public class Subcategory {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Integer id;
    @NotNull
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    //@OnDelete
    //@JsonIgnore
    private Category parentCategory;


    @OneToMany(fetch = FetchType.LAZY,
            mappedBy = "subcategory")
    // cascade
    // fetch
    // mappedby
    @JsonIgnoreProperties("subcategory")
    private Set<Transaction> transactions = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY,
            mappedBy = "budgetKey.subcategory")
    // cascade
    // fetch
    // mappedby
    @JsonIgnore
    private Set<Budget> budgets = new HashSet<>();


    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Category getParentCategory() {
        return parentCategory;
    }

    public void setParentCategory(Category parentCategory) {
        this.parentCategory = parentCategory;
    }

    public Set<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(Set<Transaction> transactions) {
        this.transactions = transactions;
    }

    public Set<Budget> getBudgets() {
        return budgets;
    }

    public void setBudgets(Set<Budget> budgets) {
        this.budgets = budgets;
    }
}
