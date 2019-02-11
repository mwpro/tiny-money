package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoriesRepository extends
        JpaRepository<Category, Integer>,
        JpaSpecificationExecutor<Category> {
}

