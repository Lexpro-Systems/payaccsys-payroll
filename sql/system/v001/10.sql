--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- CREATE EMPLOYEES PROFILE TABLES
--

CREATE TABLE employee_profiles
(
    id              SERIAL PRIMARY KEY NOT NULL,
    company_id      INTEGER REFERENCES companies(id) NOT NULL,
    employee_id     INTEGER NOT NULL,
    id_number       VARCHAR NOT NULL,
    passport_number VARCHAR NOT NULL,
    email_address   VARCHAR NOT NULL,
    
    CONSTRAINT employee_profiles_company_id_employee_id_unique UNIQUE(company_id, employee_id)
);


--
-- ADD EMPLOYEE PORTAL USER TABLES
--

CREATE TABLE employee_accounts
(
    id              SERIAL PRIMARY KEY NOT NULL,
    first_name      VARCHAR NOT NULL,
    last_name       VARCHAR NOT NULL,
    email_address   VARCHAR NOT NULL,
    password        VARCHAR NOT NULL,
    created_on      TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
CREATE UNIQUE INDEX employee_accounts_email_address_lower_idx ON employee_accounts( LOWER(email_address) );

CREATE TABLE employee_account_sessions
(
    id                      BIGSERIAL PRIMARY KEY NOT NULL,
    employee_account_id     INTEGER REFERENCES employee_accounts(id) NOT NULL,
    company_id              INTEGER REFERENCES companies(id),
    platform_type_code      CHAR(4) REFERENCES platform_types(code) NOT NULL,
    device_name             VARCHAR NOT NULL,
    refresh_token           VARCHAR NOT NULL,
    lifetime                INTEGER NOT NULL,
    last_accessed_on        TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_on              TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE employee_account_reset_passwords
(
    id                      SERIAL PRIMARY KEY NOT NULL,
    employee_account_id     INTEGER REFERENCES employee_accounts(id) NOT NULL,
    email_address           VARCHAR NOT NULL,
    verification_code       VARCHAR NOT NULL,
    created_on              TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE employee_account_employee_profile_access
(
    id                      SERIAL PRIMARY KEY NOT NULL,
    employee_account_id     INTEGER REFERENCES employee_accounts(id) NOT NULL,
    employee_profile_id     INTEGER REFERENCES employee_profiles(id) NOT NULL,
    granted_on              TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    revoked                 BOOLEAN NOT NULL,
    revoked_on              TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE employee_profile_verification_codes
(
    id                      SERIAL PRIMARY KEY NOT NULL,
    employee_account_id     INTEGER REFERENCES employee_accounts(id) NOT NULL,
    employee_profile_id     INTEGER REFERENCES employee_profiles(id) NOT NULL,
    code                    VARCHAR NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 10);