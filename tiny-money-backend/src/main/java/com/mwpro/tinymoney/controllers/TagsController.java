package com.mwpro.tinymoney.controllers;

import com.mwpro.tinymoney.models.dtos.TagDto;
import com.mwpro.tinymoney.repositories.TagsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.stream.Collectors;

@Controller
@RequestMapping(path="/api/tag")
public class TagsController {
    @Autowired
    private TagsRepository tagsRepository;

    @GetMapping(path="")
    public ResponseEntity<Iterable<TagDto>> getTags() {
        return new ResponseEntity<>(tagsRepository.findAll()
                .stream().map(t -> {
                    TagDto tagDto = new TagDto();
                    tagDto.setId(t.getId());
                    tagDto.setName(t.getName());
                    return tagDto;
                })
                .collect(Collectors.toList()), HttpStatus.OK);
    }

}
