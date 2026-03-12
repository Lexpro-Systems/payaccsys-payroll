--
-- UPDATE the description if the item with SARS code 4582
--

UPDATE sars_codes SET description = 'The portion of 3701, 3702, 3802, and 3816 which represents remuneration' WHERE code = '4582';


--
-- CREATE user_types TABLE
-- 

CREATE TABLE user_types
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO user_types(code, name) VALUES
('EMPL', 'Employee Account'),
('USER', 'Payroll User');

--
-- CREATE leave_request_status TABLE
-- 

CREATE TABLE leave_request_status
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO leave_request_status(code, name) VALUES
('PEND', 'Pending'),
('ACCE', 'Accepted'),
('DECL', 'Declined');


--
-- CREATE leave_requests TABLE
-- 

CREATE TABLE leave_requests
(
    id                          SERIAL PRIMARY KEY NOT NULL,
    employee_id                 INTEGER REFERENCES employees(id) NOT NULL,
    leave_type_id               INTEGER REFERENCES leave_types(id) NOT NULL,
    note                        VARCHAR NOT NULL,
    leave_request_status_code   CHAR(4) REFERENCES leave_request_status(code) NOT NULL,
    status_updated_on           DATE,
    status_updated_by_user_id   INTEGER,
    added_on                    DATE NOT NULL,
    added_by_user_type_code     CHAR(4) REFERENCES user_types(code) NOT NULL,
    added_by_user_id            INTEGER NOT NULL
);


--
-- CREATE leave_request_items TABLE
-- 

CREATE TABLE leave_request_items
(
    id                  SERIAL PRIMARY KEY NOT NULL,
    leave_request_id    INTEGER REFERENCES leave_requests(id) NOT NULL,
    leave_date          DATE NOT NULL,
    leave_hours         NUMERIC(15, 2)
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 21);