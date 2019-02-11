package com.mwpro.tinymoney.models.dtos;

public class VendorDto {
    private Integer id;
    private String name;
    private SubcategoryDto defaultSubcategory;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SubcategoryDto getDefaultSubcategory() {
        return defaultSubcategory;
    }

    public void setDefaultSubcategory(SubcategoryDto defaultSubcategory) {
        this.defaultSubcategory = defaultSubcategory;
    }
}
