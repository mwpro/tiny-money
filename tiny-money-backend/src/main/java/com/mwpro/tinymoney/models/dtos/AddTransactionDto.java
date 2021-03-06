package com.mwpro.tinymoney.models.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public class AddTransactionDto {
    @NotNull
    private LocalDate transactionDate;
    @NotNull
    private BigDecimal amount;
    @NotNull
    private Integer subcategoryId;
    private Set<TagDto> tags;

    @JsonProperty(value="isExpense")
    private Boolean isExpense;

    @NotNull
    private VendorDto vendor;

    private String description;

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

    public Set<TagDto> getTags() {
        return tags;
    }

    public VendorDto getVendor() {
        return vendor;
    }

    public void setVendor(VendorDto vendor) {
        this.vendor = vendor;
    }

    public String getDescription() {
        return description;
    }
}
