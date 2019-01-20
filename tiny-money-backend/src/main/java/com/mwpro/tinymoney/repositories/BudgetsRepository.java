package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Budget;
import com.mwpro.tinymoney.models.BudgetKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetsRepository extends JpaRepository<Budget, BudgetKey> {
}
