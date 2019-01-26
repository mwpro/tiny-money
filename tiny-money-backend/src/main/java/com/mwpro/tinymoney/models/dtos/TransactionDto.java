package com.mwpro.tinymoney.models.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Date;
import java.util.Set;

public class TransactionDto {
    private Integer id;
    private LocalDate transactionDate;
    @JsonProperty(value="isExpense")
    private Boolean isExpense;
    private BigDecimal amount;
    private Date createdDate;
    private Date modifiedDate;
    private SubcategoryDto subcategory;

    private Set<TagDto> tags;

    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    public Date getModifiedDate() {
        return modifiedDate;
    }

    public void setModifiedDate(Date modifiedDate) {
        this.modifiedDate = modifiedDate;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public LocalDate getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDate transactionDate) {
        this.transactionDate = transactionDate;
    }

    public Boolean getExpense() {
        return isExpense;
    }

    public void setExpense(Boolean expense) {
        isExpense = expense;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public SubcategoryDto getSubcategory() {
        return subcategory;
    }

    public void setSubcategory(SubcategoryDto subcategory) {
        this.subcategory = subcategory;
    }

    public Set<TagDto> getTags() {
        return tags;
    }

    public void setTags(Set<TagDto> tags) {
        this.tags = tags;
    }
}
