package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Transaction;
import org.springframework.data.repository.CrudRepository;

public interface TransactionsRepository extends CrudRepository<Transaction, Integer> {
}
