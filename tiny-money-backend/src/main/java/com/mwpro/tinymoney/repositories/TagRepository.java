package com.mwpro.tinymoney.repositories;

import com.mwpro.tinymoney.models.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Integer> {
}
