package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Subcategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubcategoriesRepository extends
        JpaRepository<Subcategory, Integer> {
    //Page<Subcategory> findByCategoryId(Integer categoryId, Pageable pageable);
}
