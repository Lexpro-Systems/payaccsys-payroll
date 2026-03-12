--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;

-- Create lemployee_leave_request_status_types table
CREATE TABLE employee_leave_request_status_types 
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO employee_leave_request_status_types VALUES
('PEND', 'Pending'),
('DECL', 'Declined'),
('APPR', 'Approved');


-- Create employee_leave_requests table
CREATE TABLE employee_leave_requests
(
    id                              SERIAL PRIMARY KEY NOT NULL,
    code                            VARCHAR UNIQUE NOT NULL,
    company_id                      INTEGER REFERENCES companies(id) NOT NULL,
    leave_request_id                INTEGER NOT NULL,
    sent_by_employee_account_id     INTEGER REFERENCES employee_accounts(id) NOT NULL,
    sent_on                         TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    expires_on                      TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status_code                     CHAR(4) REFERENCES employee_leave_request_status_types(code) NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 12);