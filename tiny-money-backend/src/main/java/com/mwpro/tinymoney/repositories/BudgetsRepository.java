package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.models.BudgetKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BudgetsRepository extends JpaRepository<Budget, BudgetKey> {
    @Query("SELECT b FROM Budget b JOIN FETCH b.budgetKey.subcategory subCat JOIN FETCH subCat.parentCategory pc " +
            "WHERE b.budgetKey.year = :year AND b.budgetKey.month = :month")
    List<Budget> findAllForMonth(@Param("year") Integer year, @Param("month") Integer month);
}
