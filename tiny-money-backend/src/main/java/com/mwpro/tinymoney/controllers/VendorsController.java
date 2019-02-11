package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.models.Vendor;
import com.mwpro.tinymoney.models.dtos.CategoryDto;
import com.mwpro.tinymoney.models.dtos.SubcategoryDto;
import com.mwpro.tinymoney.models.dtos.TagDto;
import com.mwpro.tinymoney.models.dtos.VendorDto;
import com.mwpro.tinymoney.repositories.TagsRepository;
import com.mwpro.tinymoney.repositories.VendorsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/vendor")
public class VendorsController {
    @Autowired
    private VendorsRepository vendorsRepository;

    @GetMapping(path="")
    public ResponseEntity<Iterable<VendorDto>> getVendors() {
        return new ResponseEntity<>(vendorsRepository.findAll((Specification<Vendor>)
                (root, query, cb) -> {
                    root.fetch("defaultSubcategory", JoinType.LEFT).fetch("parentCategory");
                    return cb.and();
                })
                .stream().map(t -> {
                    VendorDto vendorDto = new VendorDto();
                    vendorDto.setId(t.getId());
                    vendorDto.setName(t.getName());
                    if (t.getDefaultSubcategory() != null) {
                        SubcategoryDto defaultSubcategoryDto = new SubcategoryDto();
                        defaultSubcategoryDto.setId(t.getDefaultSubcategory().getId());
                        defaultSubcategoryDto.setName(t.getDefaultSubcategory().getName());
                        CategoryDto defaultCategoryDto = new CategoryDto();
                        defaultCategoryDto.setId(t.getDefaultSubcategory().getParentCategory().getId());
                        defaultCategoryDto.setName(t.getDefaultSubcategory().getParentCategory().getName());
                        defaultSubcategoryDto.setParentCategory(defaultCategoryDto);
                        vendorDto.setDefaultSubcategory(defaultSubcategoryDto);
                    }
                    return vendorDto;
                })
                .collect(Collectors.toList()), HttpStatus.OK);
    }

}

