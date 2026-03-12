--
--  Add the start_date columns to the leave_config_items and leave_types TABLES
--

ALTER TABLE leave_config_items ADD COLUMN IF NOT EXISTS employee_leave_start_date DATE;
ALTER TABLE leave_types ADD COLUMN IF NOT EXISTS start_date DATE;


--
-- CREATE loan_interest_types TABLE
-- 

CREATE TABLE loan_interest_types
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO loan_interest_types (code, name) VALUES
('COMP', 'Compound'),
('SIMP', 'Simple');


--
-- CREATE loan_capitalization_period_types TABLE
-- 

CREATE TABLE loan_capitalization_period_types
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO loan_capitalization_period_types (code, name) VALUES
('DAIL', 'Daily'),
('WEEK', 'Weekly'),
('BWEE', 'Biweekly'),
('MONT', 'Monthly'),
('ANNU', 'Annually');


--
-- CREATE loan_status_types TABLE
-- 

CREATE TABLE loan_status_types
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO loan_status_types (code, name) VALUES
('ACTI', 'Active'),
('CANC', 'Cancelled'),
('PAID', 'Fully Paid');


--
-- CREATE loans TABLE
--

CREATE TABLE loans
(
    id                              SERIAL PRIMARY KEY NOT NULL,
    employee_id                     INTEGER REFERENCES employees(id) NOT NULL,
    description                     VARCHAR NOT NULL,
    loan_status_type_code           CHAR(4) REFERENCES loan_status_types(code),
    loan_interest_type_code         CHAR(4) REFERENCES loan_interest_types(code),
    principal_amount                NUMERIC(15, 2) NOT NULL,
    adjust_loan_amount              BOOLEAN NOT NULL,
    start_date                      DATE NOT NULL,
    fully_paid_on                   DATE,
    cancelled_on                    DATE,
    cancelled_by_user_id            INTEGER,
    created_on                      DATE NOT NULL,
    created_by_user_id              INTEGER NOT NULL
);


--
-- CREATE loan_history TABLE
--

CREATE TABLE loan_history
(
    id                                      SERIAL PRIMARY KEY NOT NULL,
    loan_id                                 INTEGER REFERENCES loans(id) NOT NULL,
    total_payments                          INTEGER NOT NULL,
    interest_rate                           NUMERIC(11, 6) NOT NULL,
    instalment_amount                       NUMERIC(15, 2) NOT NULL,
    loan_capitalization_period_type_code    CHAR(4) REFERENCES loan_capitalization_period_types(code),
    capitalization_day                      INTEGER,
    added_on                                DATE,
    added_by_user_id                        INTEGER
);


--
-- CREATE loan_payments TABLE
--

CREATE TABLE loan_payments
(
    id                                  SERIAL PRIMARY KEY NOT NULL,
    loan_id                             INTEGER REFERENCES loans(id) NOT NULL,
    interest_rate                       NUMERIC(11, 6) NOT NULL,
    interest_amount                     NUMERIC(15, 2) NOT NULL,
    paid_amount                         NUMERIC(15, 2) NOT NULL,
    paid_on                             DATE NOT NULL,
    payslip_item_id                     INTEGER REFERENCES payslip_items(id),
    added_by_user_id                    INTEGER
);


--
-- INSERT the payslip item types related to employee loans
--

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled) VALUES
('2008', 'Employee Loan', 'DEDU', 'FIXE', FALSE, TRUE, NULL, FALSE),
('4004', 'Low Interest or Interest Free Loans', 'FBEN', 'FIXE', FALSE, TRUE, NULL, FALSE) ON CONFLICT (code) DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 16);