package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionsRepository extends JpaRepository<Transaction, Integer> {
     @Query("SELECT t FROM Transaction t JOIN FETCH t.subcategory subCat JOIN FETCH subCat.parentCategory pc LEFT JOIN FETCH t.tags tags WHERE t.transactionDate BETWEEN :dateFrom AND :dateTo ORDER BY t.transactionDate DESC, t.createdDate DESC")
     List<Transaction> findAllFromMonthForListing(@Param("dateFrom") LocalDate dateFrom, @Param("dateTo") LocalDate dateTo);
}
