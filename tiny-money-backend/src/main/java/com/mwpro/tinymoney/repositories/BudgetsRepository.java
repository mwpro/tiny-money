package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.models.BudgetKey;
import com.mwpro.tinymoney.models.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public interface BudgetsRepository extends JpaRepository<Budget, BudgetKey> {
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE YEAR(t.transactionDate) = :year AND MONTH(t.transactionDate) = :month AND t.subcategory = :subcategory")
    BigDecimal sumTransactionsForMonth(@Param("year") Integer year, @Param("month") Integer month, @Param("subcategory") Subcategory subcategory);

    List<Budget> findAllByBudgetKeyYearAndBudgetKeyMonth(@NotNull int budgetKey_year, @NotNull int budgetKey_month);
}
