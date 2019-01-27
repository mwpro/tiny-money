package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.Tag;
import com.mwpro.tinymoney.models.dtos.*;
import com.mwpro.tinymoney.models.Subcategory;
import com.mwpro.tinymoney.models.Transaction;
import com.mwpro.tinymoney.repositories.SubcategoriesRepository;
import com.mwpro.tinymoney.repositories.TagsRepository;
import com.mwpro.tinymoney.repositories.TransactionsRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import javax.persistence.criteria.*;
import java.security.Principal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
    private ModelMapper modelMapper;

    @GetMapping(path = "")
    public ResponseEntity<List<TransactionDto>> getTransactions
            (TransactionSearchOptions searchOptions,
             Principal principal) {

        @SuppressWarnings("unchecked")
        List<Transaction> transactions = transactionsRepository.findAll((Specification<Transaction>)
                (root, query, cb) -> {

                    List<Predicate> predicates = new ArrayList<>();

                    if (searchOptions.getMonth() != null) {
                        LocalDate date = searchOptions.getMonth().withDayOfMonth(1);
                        predicates.add(cb.between(root.get("transactionDate"), date, date.plusMonths(1)));
                    }

                    if (searchOptions.getMyTransactionsOnly() != null && searchOptions.getMyTransactionsOnly()) {
                        predicates.add(cb.equal(root.get("createdBy"), principal.getName()));
                    }

                    query.orderBy(cb.desc(root.get("transactionDate")), cb.desc(root.get("createdDate")));
                    root.fetch("subcategory").fetch("parentCategory");
                    root.fetch("tags", JoinType.LEFT);

                    query.distinct(true);
                    return cb.and(predicates.toArray(new Predicate[0]));
                });

        return new ResponseEntity<>(transactions.stream()
                .map(t -> mapToDto(t)).collect(Collectors.toList()), HttpStatus.OK);
    }

    private TransactionDto mapToDto(Transaction t) {
        TransactionDto transactionDto = modelMapper.map(t, TransactionDto.class);
        return transactionDto;
    }

    @PostMapping(path = "")
    @ResponseBody
    public ResponseEntity<AddTransactionResultDto> addTransaction(@RequestBody AddTransactionDto addTransactionDto,
                                                                  Principal principal) {
        Transaction transaction = new Transaction();
        Subcategory subcategory = subcategoriesRepository.findById(addTransactionDto.getSubcategoryId()).get();

        transaction.setSubcategory(subcategory);
        transaction.setAmount(addTransactionDto.getAmount());
        transaction.setTransactionDate(addTransactionDto.getTransactionDate());
        transaction.setIsExpense(addTransactionDto.getIsExpense());
        transaction.setCreatedBy(principal.getName());

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
        result.setAddedTags(newTagsToSave.stream().map(t -> {
            TagDto tagDto = new TagDto();
            tagDto.setId(t.getId());
            tagDto.setName(t.getName());
            return tagDto;
        }).collect(Collectors.toSet()));
        result.setTransaction(transaction);

        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    // TODO something sucks about primary keys in db - some weird hibernate_sequence table is created?

    // TODO update

    // TODO delete

    // TODO get single

    // TODO advanced get list

    // TODO jpa auditing

    // todo rewrite controller methods as ResponseEntity<> with valid status codes

    // todo rewrite using DTOs

    // TODO use java.time instead of Date...

    // TODO configure /api prefix globally

}
