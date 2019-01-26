package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagsRepository extends JpaRepository<Tag, Integer> {
}
