--
-- ADD ACCOUNTING EXPORT LOG TRANSACTION TABLES
--

CREATE TABLE accounting_export_transaction_history
(
    id                              SERIAL PRIMARY KEY NOT NULL,
    accounting_export_history_id    INTEGER REFERENCES accounting_export_history(id) NOT NULL,
    payslip_id                      INTEGER REFERENCES payslips(id),
    type                            VARCHAR NOT NULL,
    account_number                  VARCHAR NOT NULL,
    date                            DATE NOT NULL,
    description                     VARCHAR NOT NULL,
    vat                             VARCHAR NOT NULL,
    bank_account_id                 INTEGER NOT NULL,
    amount                          VARCHAR NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 34);