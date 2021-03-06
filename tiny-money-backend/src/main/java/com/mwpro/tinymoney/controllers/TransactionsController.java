package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Tag;
import com.mwpro.tinymoney.models.Vendor;
import com.mwpro.tinymoney.models.dtos.*;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import com.mwpro.tinymoney.repositories.TagsRepository;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import com.mwpro.tinymoney.repositories.VendorsRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.*;
import javax.validation.Valid;
import java.security.Principal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping(path = "/api/transaction")
public class TransactionsController {
    @Autowired
    private TransactionsRepository transactionsRepository;
    @Autowired
    private SubcategoriesRepository subcategoriesRepository;
    @Autowired
    private TagsRepository tagsRepository;
    @Autowired
    private VendorsRepository vendorsRepository;

    @PostMapping(path = "/{id}")
    public ResponseEntity<AddTransactionResultDto> editTransaction
            (@PathVariable("id") Integer transactionId,
             @Valid @RequestBody AddTransactionDto addTransactionDto,
             Principal principal) {

        Optional<Transaction> transactionOption = transactionsRepository.findById(transactionId);

        if (!transactionOption.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();

        Transaction transaction = transactionOption.get();

        Vendor vendor;
        if (addTransactionDto.getVendor().getId() == null) {
            vendor = new Vendor();
            vendor.setName(addTransactionDto.getVendor().getName());
            vendor.setDefaultSubcategory(subcategory);
            vendorsRepository.save(vendor);
        } else {
            vendor = vendorsRepository.getOne(addTransactionDto.getVendor().getId());
        }
        transaction.setVendor(vendor);

        transaction.setSubcategory(subcategory);
        transaction.setAmount(addTransactionDto.getAmount());
        transaction.setTransactionDate(addTransactionDto.getTransactionDate().plusDays(1)); // todo plusDays(1) hack for MySql issues
        transaction.setIsExpense(addTransactionDto.getIsExpense());
        transaction.setDescription(addTransactionDto.getDescription());

        Set<Tag> newTagsToSave = new HashSet<>();
        transaction.getTags().forEach(t -> t.getTransactions().remove(transaction));
        transaction.getTags().clear();
        for (TagDto tagDto : addTransactionDto.getTags()) {
            Tag tag;
            if (tagDto.getId() == null) {
                // adding new tag
                tag = new Tag();
                tag.setName(tagDto.getName());
                newTagsToSave.add(tag);
            } else {
                // existing tag
                tag = tagsRepository.getOne(tagDto.getId());
            }
            tag.getTransactions().add(transaction);
            transaction.getTags().add(tag);
        }

        transactionsRepository.save(transaction);
        tagsRepository.saveAll(newTagsToSave);

        AddTransactionResultDto result = new AddTransactionResultDto();
        result.setAddedTags(newTagsToSave.stream().map(t -> mapToDto(t)).collect(Collectors.toSet()));
        transaction.setTransactionDate(transaction.getTransactionDate().minusDays(1)); // todo .minusDays(1) hack for MySql issues
        result.setTransaction(transaction);

        return new ResponseEntity<>(result, HttpStatus.OK);
    }

    private TagDto mapToDto(Tag t) {
        TagDto tagDto = new TagDto();
        tagDto.setId(t.getId());
        tagDto.setName(t.getName());
        return tagDto;
    }

    @PostMapping(path = "")
    @ResponseBody
    public ResponseEntity<AddTransactionResultDto> addTransaction(@Valid @RequestBody AddTransactionDto addTransactionDto,
                                                                  Principal principal) {
        Transaction transaction = new Transaction();
        Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();

        Vendor vendor;
        if (addTransactionDto.getVendor().getId() == null) {
            vendor = new Vendor();
            vendor.setName(addTransactionDto.getVendor().getName());
            vendor.setDefaultSubcategory(subcategory);
            vendorsRepository.save(vendor);
        } else {
            vendor = vendorsRepository.getOne(addTransactionDto.getVendor().getId());
        }
        transaction.setVendor(vendor);

        transaction.setSubcategory(subcategory);
        transaction.setAmount(addTransactionDto.getAmount());
        transaction.setTransactionDate(addTransactionDto.getTransactionDate().plusDays(1)); // todo plusDays(1) hack for MySql issues
        transaction.setIsExpense(addTransactionDto.getIsExpense());
        transaction.setCreatedBy(principal.getName());
        transaction.setDescription(addTransactionDto.getDescription());

        Set<Tag> newTagsToSave = new HashSet<>();
        for (TagDto tagDto : addTransactionDto.getTags()) {
            Tag tag;
            if (tagDto.getId() == null) {
                // adding new tag
                tag = new Tag();
                tag.setName(tagDto.getName());
                newTagsToSave.add(tag);
            } else {
                // existing tag
                tag = tagsRepository.getOne(tagDto.getId());
            }
            tag.getTransactions().add(transaction);
            transaction.getTags().add(tag);
        }

        transactionsRepository.save(transaction);
        tagsRepository.saveAll(newTagsToSave);

        AddTransactionResultDto result = new AddTransactionResultDto();
        result.setAddedTags(newTagsToSave.stream().map(t -> mapToDto(t)).collect(Collectors.toSet()));
        transaction.setTransactionDate(transaction.getTransactionDate().minusDays(1)); // todo .minusDays(1) hack for MySql issues
        result.setTransaction(transaction);

        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @DeleteMapping(path = "/{id}")
    public ResponseEntity deleteTransaction(@PathVariable("id") Integer transactionId) {
        Transaction transaction = transactionsRepository.getOne(transactionId);
        if (transaction == null){
            return new ResponseEntity(HttpStatus.NOT_FOUND);
        }
        transaction.getTags().forEach(t -> t.getTransactions().remove(transaction));
        transaction.getTags().clear();
        transactionsRepository.delete(transaction);
        return new ResponseEntity(HttpStatus.OK);
    }
}
