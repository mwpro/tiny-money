package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.dtos.TagDto;
import com.mwpro.tinymoney.models.dtos.VendorDto;
import com.mwpro.tinymoney.repositories.TagsRepository;
import com.mwpro.tinymoney.repositories.VendorsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/vendor")
public class VendorsController {
    @Autowired
    private VendorsRepository vendorsRepository;

    @GetMapping(path="")
    public ResponseEntity<Iterable<VendorDto>> getVendors() {
        return new ResponseEntity<>(vendorsRepository.findAll()
                .stream().map(t -> {
                    VendorDto vendorDto = new VendorDto();
                    vendorDto.setId(t.getId());
                    vendorDto.setName(t.getName());
                    return vendorDto;
                })
                .collect(Collectors.toList()), HttpStatus.OK);
    }

}

