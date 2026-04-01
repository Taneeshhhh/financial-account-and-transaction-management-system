CREATE TABLE Customer_Login (
    customer_login_id   INT AUTO_INCREMENT PRIMARY KEY,

    customer_id         INT NOT NULL,

    password_hash       VARCHAR(255) NOT NULL,

    is_active           TINYINT NOT NULL DEFAULT 1,
    last_login          DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_customer_login_customer
        FOREIGN KEY (customer_id)
        REFERENCES Customers(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_customer_login_customer
        UNIQUE (customer_id)
) ENGINE = InnoDB;


CREATE TABLE Admin_Login (
    admin_login_id      INT AUTO_INCREMENT PRIMARY KEY,

    accountant_id       INT NOT NULL,

    password_hash       VARCHAR(255) NOT NULL,

    is_active           TINYINT NOT NULL DEFAULT 1,
    last_login          DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_login_accountant
        FOREIGN KEY (accountant_id)
        REFERENCES Accountants(accountant_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_admin_login_accountant
        UNIQUE (accountant_id)
) ENGINE = InnoDB;



INSERT INTO Customer_Login (customer_id, password_hash)
SELECT customer_id,
       SHA2(CONCAT('Cust@', customer_id), 256)
FROM Customers;

INSERT INTO Admin_Login (accountant_id, password_hash)
SELECT accountant_id,
       SHA2(CONCAT('Admin@', accountant_id), 256)
FROM Accountants;