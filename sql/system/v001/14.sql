--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- CREATE public_holidays TABLE
-- 

CREATE TABLE public_holidays
(
    id                  SERIAL PRIMARY KEY NOT NULL,
    date                DATE UNIQUE NOT NULL,
    name                VARCHAR NOT NULL,
    added_by_user_id    INTEGER REFERENCES users(id) NOT NULL,
    added_on            DATE NOT NULL,
    updated_by_user_id  INTEGER REFERENCES users(id),
    updated_on          DATE
);


--
-- Remove the NOT NULL constraint on the  sent_by_employee_account_id column of the employee_leave_requests TABLE
--

ALTER TABLE employee_leave_requests ALTER COLUMN sent_by_employee_account_id DROP NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 14);