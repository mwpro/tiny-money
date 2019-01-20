package com.mwpro.tinymoney.models;

import org.hibernate.annotations.Formula;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Date;

@Entity
@EntityListeners(AuditingEntityListener.class)
public class Budget {
    @EmbeddedId
    private BudgetKey budgetKey;

    @NotNull
    private BigDecimal amount;

    // todo this is mysql specific, meh
    @Formula("(SELECT IFNULL(SUM(t.amount), 0) FROM transaction t WHERE YEAR(t.transaction_date) = year AND MONTH(t.transaction_date) = month AND t.subcategory_id = subcategory_id)")
    private BigDecimal usedAmount;

    @Column(name = "created_date", nullable = false, updatable = false)
    @CreatedDate
    private Date createdDate;

    @Column(name = "modified_date")
    @LastModifiedDate
    private Date modifiedDate;

    public BudgetKey getBudgetKey() {
        return budgetKey;
    }

    public void setBudgetKey(BudgetKey budgetKey) {
        this.budgetKey = budgetKey;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

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

    public BigDecimal getUsedAmount() {
        return usedAmount;
    }

    public void setUsedAmount(BigDecimal usedAmount) {
        this.usedAmount = usedAmount;
    }
}


