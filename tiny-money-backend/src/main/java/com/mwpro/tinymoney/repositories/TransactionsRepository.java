package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.validation.constraints.NotNull;
import java.util.Date;
import java.util.List;

@Repository
public interface TransactionsRepository extends JpaRepository<Transaction, Integer> {
     List<Transaction> findAllByOrderByTransactionDateDescCreatedDateDesc();
     List<Transaction> findAllByTransactionDateBetweenOrderByTransactionDateDescCreatedDateDesc
             (@NotNull Date dateFrom, @NotNull Date dateTo);
}
