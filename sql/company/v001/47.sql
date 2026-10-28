--
-- ADD WALLET SUBSCRIPTIONS TABLE
--

CREATE TABLE IF NOT EXISTS wallet_subscriptions
(
    employee_id       INTEGER PRIMARY KEY REFERENCES employees(id) NOT NULL,
    subscribed        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_on        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_by_user_id INTEGER NOT NULL,
    spendl_user_id    VARCHAR
);

CREATE TABLE IF NOT EXISTS wallet_histories
(
    id                          SERIAL PRIMARY KEY NOT NULL,
    payrun_id                   INTEGER REFERENCES payruns(id) NOT NULL,
    payslip_id                  INTEGER REFERENCES payslips(id) NOT NULL,
    employee_id                 INTEGER REFERENCES employees(id) NOT NULL,
    idempotency_key             VARCHAR(200) NOT NULL,
    http_status                 INTEGER NOT NULL,
    transport_ok                BOOLEAN NOT NULL,
    response_status             VARCHAR,
    spendl_payslip_id           VARCHAR,
    spendl_user_id              VARCHAR,
    idempotent_replay           BOOLEAN NOT NULL DEFAULT FALSE,
    error_type                  VARCHAR,
    error_message               TEXT,
    response_body               JSONB,
    created_on                  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    document_http_status        INTEGER,
    document_transport_ok       BOOLEAN,
    document_status             VARCHAR,
    document_error_type         VARCHAR,
    document_error_message      TEXT,
    document_response_body      JSONB,
    document_uploaded_on        TIMESTAMP WITHOUT TIME ZONE
);

--
-- ADD LOOKUP INDEXES
--

CREATE INDEX IF NOT EXISTS wallet_histories_payrun_id_idx
ON wallet_histories(payrun_id);

CREATE INDEX IF NOT EXISTS wallet_histories_payslip_id_idx
ON wallet_histories(payslip_id);

CREATE INDEX IF NOT EXISTS wallet_histories_employee_id_idx
ON wallet_histories(employee_id);

CREATE INDEX IF NOT EXISTS wallet_histories_idempotency_key_idx
ON wallet_histories(idempotency_key);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version)
VALUES (1, 47);
