CREATE TABLE savings_category (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) CHARSET = utf8mb4;

CREATE TABLE savings_account (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_savings_account_category
        FOREIGN KEY (category_id) REFERENCES savings_category (id)
) CHARSET = utf8mb4;

CREATE TABLE savings_snapshot (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    period     VARCHAR(7) NOT NULL,
    balance    DECIMAL(19,2) NOT NULL,
    deposited  DECIMAL(19,2) NOT NULL,
    withdrawn  DECIMAL(19,2) NOT NULL,
    UNIQUE KEY uq_savings_snapshot_account_period (account_id, period),
    CONSTRAINT fk_savings_snapshot_account
        FOREIGN KEY (account_id) REFERENCES savings_account (id)
) CHARSET = utf8mb4;

CREATE TABLE savings_goal (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    target_amount DECIMAL(19,2) NOT NULL,
    target_date   DATE NULL,
    is_archived   BOOLEAN NOT NULL DEFAULT FALSE
) CHARSET = utf8mb4;

CREATE TABLE savings_goal_category (
    goal_id     INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (goal_id, category_id),
    CONSTRAINT fk_sgc_goal     FOREIGN KEY (goal_id)     REFERENCES savings_goal     (id),
    CONSTRAINT fk_sgc_category FOREIGN KEY (category_id) REFERENCES savings_category (id)
) CHARSET = utf8mb4;

CREATE TABLE savings_setting (
    cushion_amount DECIMAL(19,2) NOT NULL
) CHARSET = utf8mb4;

CREATE TABLE savings_cushion_category (
    category_id INT NOT NULL,
    PRIMARY KEY (category_id),
    CONSTRAINT fk_scc_category FOREIGN KEY (category_id) REFERENCES savings_category (id)
) CHARSET = utf8mb4;
