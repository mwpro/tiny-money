CREATE TABLE plan (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(255)   NOT NULL,
    description   LONGTEXT       NULL,
    date_from     DATE           NOT NULL,
    date_to       DATE           NULL,
    created_date  DATETIME       NOT NULL,
    modified_date DATETIME       NULL
) CHARSET = latin2;

CREATE TABLE plan_tag (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    plan_id     INT            NOT NULL,
    tag_id      INT            NOT NULL,
    amount      DECIMAL(19, 2) NOT NULL,
    description LONGTEXT       NULL,
    CONSTRAINT fk_plan_tag_plan FOREIGN KEY (plan_id) REFERENCES plan (id),
    CONSTRAINT fk_plan_tag_tag  FOREIGN KEY (tag_id)  REFERENCES tag  (id),
    CONSTRAINT uq_plan_tag UNIQUE (plan_id, tag_id)
) CHARSET = latin2;
