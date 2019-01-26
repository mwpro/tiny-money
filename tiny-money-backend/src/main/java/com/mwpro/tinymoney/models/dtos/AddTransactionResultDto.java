package com.mwpro.tinymoney.models.dtos;

import com.mwpro.tinymoney.models.Transaction;

import java.util.Set;

public class AddTransactionResultDto {
    private Set<TagDto> addedTags;
    private Transaction transaction;

    public Set<TagDto> getAddedTags() {
        return addedTags;
    }

    public void setAddedTags(Set<TagDto> addedTags) {
        this.addedTags = addedTags;
    }

    public Transaction getTransaction() {
        return transaction;
    }

    public void setTransaction(Transaction transaction) {
        this.transaction = transaction;
    }
}
