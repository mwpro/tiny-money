ALTER TABLE category
    ADD COLUMN sort_order INT      NOT NULL DEFAULT 0;

ALTER TABLE subcategory
    ADD COLUMN sort_order INT      NOT NULL DEFAULT 0;

UPDATE category c
    JOIN (SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn FROM category) r ON c.id = r.id
    SET c.sort_order = r.rn;

UPDATE subcategory s
    JOIN (SELECT id, parent_category_id, ROW_NUMBER() OVER (PARTITION BY parent_category_id ORDER BY id) AS rn
          FROM subcategory) r ON s.id = r.id
    SET s.sort_order = r.rn;
