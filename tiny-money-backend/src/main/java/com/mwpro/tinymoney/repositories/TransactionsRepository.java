package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionsRepository extends JpaRepository<Transaction, Integer> {
     List<Transaction> findAllByOrderByTransactionDateDescCreatedDateDesc();
}
