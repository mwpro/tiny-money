package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VendorsRepository extends
        JpaRepository<Vendor, Integer> {

}
