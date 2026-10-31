CREATE TABLE transaction_ai_suggestion (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id           INT          NOT NULL,
    suggested_vendor_id      INT          NULL,
    suggested_vendor_name    VARCHAR(255) NULL,
    vendor_confidence        DECIMAL(5,4) NULL,
    suggested_subcategory_id INT          NULL,
    subcategory_confidence   DECIMAL(5,4) NULL,
    model                    VARCHAR(100) NOT NULL,
    created_at               DATETIME     NOT NULL,
    verified_at              DATETIME     NULL,
    vendor_correct           BOOLEAN      NULL,
    subcategory_correct      BOOLEAN      NULL,
    INDEX idx_tas_transaction_created (transaction_id, created_at),
    CONSTRAINT fk_tas_transaction
        FOREIGN KEY (transaction_id) REFERENCES `transaction` (id) ON DELETE CASCADE,
    CONSTRAINT fk_tas_vendor
        FOREIGN KEY (suggested_vendor_id) REFERENCES vendor (id) ON DELETE SET NULL,
    CONSTRAINT fk_tas_subcategory
        FOREIGN KEY (suggested_subcategory_id) REFERENCES subcategory (id) ON DELETE SET NULL
) CHARSET = utf8mb4;
