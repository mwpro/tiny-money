CREATE TABLE IF NOT EXISTS category (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    is_income BIT          NOT NULL
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS subcategory (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    parent_category_id INT          NOT NULL,
    CONSTRAINT FK4okdhhvwkuyq53wuta7dxqrej
        FOREIGN KEY (parent_category_id) REFERENCES category (id)
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS budget (
    month          INT            NOT NULL,
    year           INT            NOT NULL,
    amount         DECIMAL(19, 2) NOT NULL,
    created_date   DATETIME       NOT NULL,
    modified_date  DATETIME       NULL,
    subcategory_id INT            NOT NULL,
    notes          LONGTEXT       NULL,
    PRIMARY KEY (month, subcategory_id, year),
    CONSTRAINT FK1mdblf9aysk4sawqhi9krtfwd
        FOREIGN KEY (subcategory_id) REFERENCES subcategory (id)
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS tag (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS vendor (
    id                     INT AUTO_INCREMENT PRIMARY KEY,
    name                   VARCHAR(255) NOT NULL,
    default_subcategory_id INT          NOT NULL,
    CONSTRAINT FKae5dj4ttu92wn1om6envbnn76
        FOREIGN KEY (default_subcategory_id) REFERENCES subcategory (id)
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS vendor_alias (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT          NOT NULL,
    alias     VARCHAR(255) NOT NULL,
    CONSTRAINT uq_vendor_alias_alias UNIQUE (alias),
    CONSTRAINT fk_vendor_alias_vendor
        FOREIGN KEY (vendor_id) REFERENCES vendor (id)
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS `transaction` (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    amount                DECIMAL(19, 2)       NOT NULL,
    created_by            VARCHAR(255)         NOT NULL,
    created_date          DATETIME             NOT NULL,
    description           LONGTEXT             NULL,
    is_expense            BIT                  NOT NULL,
    modified_date         DATETIME             NULL,
    transaction_date      DATE                 NOT NULL,
    subcategory_id        INT                  NULL,
    vendor_id             INT                  NULL,
    is_verified           TINYINT(1) DEFAULT 1 NOT NULL,
    is_possible_duplicate TINYINT(1) DEFAULT 0 NOT NULL,
    CONSTRAINT FK5cpv0vgf70pxdtuna3mh69qw1
        FOREIGN KEY (vendor_id) REFERENCES vendor (id),
    CONSTRAINT FKp7w3w7p3no2jxxxgljm500jw9
        FOREIGN KEY (subcategory_id) REFERENCES subcategory (id)
) CHARSET = latin2;

CREATE TABLE IF NOT EXISTS api_key (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100)  NOT NULL,
    key_hash     CHAR(64)      NOT NULL,
    key_prefix   CHAR(8)       NOT NULL,
    user_id      VARCHAR(255)  NOT NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME      NULL,
    INDEX idx_key_hash (key_hash),
    INDEX idx_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS transaction_tag (
    tag_id         INT NOT NULL,
    transaction_id INT NOT NULL,
    PRIMARY KEY (tag_id, transaction_id),
    CONSTRAINT FK7d8lvqkvukcf4gvfmtg4wfig6
        FOREIGN KEY (transaction_id) REFERENCES `transaction` (id),
    CONSTRAINT FKl823jm48pl3r8n5or978p4sup
        FOREIGN KEY (tag_id) REFERENCES tag (id)
) CHARSET = latin2;
