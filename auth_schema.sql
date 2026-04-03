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


CREATE TABLE Loan_Applications (
    loan_application_id INT             NOT NULL AUTO_INCREMENT,
    customer_id         INT             NOT NULL,
    branch_id           INT             NOT NULL,
    linked_account_id   INT             NOT NULL,
    loan_type           ENUM(
                            'Home',
                            'Personal',
                            'Auto',
                            'Education',
                            'Gold',
                            'Business'
                        )               NOT NULL,
    requested_amount    DECIMAL(15,2)   NOT NULL,
    approved_amount     DECIMAL(15,2)   NULL,
    annual_interest_rate DECIMAL(5,2)   NOT NULL,
    tenure_months       SMALLINT        NOT NULL,
    estimated_emi       DECIMAL(15,2)   NOT NULL,
    purpose             VARCHAR(255)    NOT NULL,
    application_status  ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    review_notes        VARCHAR(255)    NULL,
    reviewed_by         INT             NULL,
    reviewed_at         DATETIME        NULL,
    created_loan_id     INT             NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_loan_applications           PRIMARY KEY (loan_application_id),
    CONSTRAINT fk_loan_app_customer           FOREIGN KEY (customer_id)
        REFERENCES Customers(customer_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_loan_app_branch             FOREIGN KEY (branch_id)
        REFERENCES Branches(branch_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_loan_app_account            FOREIGN KEY (linked_account_id)
        REFERENCES Accounts(account_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_loan_app_reviewer           FOREIGN KEY (reviewed_by)
        REFERENCES Accountants(accountant_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT fk_loan_app_created_loan       FOREIGN KEY (created_loan_id)
        REFERENCES Loans(loan_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT chk_loan_app_requested_amount  CHECK (requested_amount > 0),
    CONSTRAINT chk_loan_app_approved_amount   CHECK (approved_amount IS NULL OR approved_amount > 0),
    CONSTRAINT chk_loan_app_tenure            CHECK (tenure_months > 0)
) ENGINE = InnoDB;



INSERT INTO Customer_Login (customer_id, password_hash)
SELECT customer_id,
       SHA2(CONCAT('Cust@', customer_id), 256)
FROM Customers;

INSERT INTO Admin_Login (accountant_id, password_hash)
SELECT accountant_id,
       SHA2(CONCAT('Admin@', accountant_id), 256)
FROM Accountants;
