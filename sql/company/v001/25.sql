--
-- CREATE public_holidays TABLE
-- 

CREATE TABLE public_holidays
(
    id          SERIAL PRIMARY KEY NOT NULL,
    date        DATE NOT NULL,
    name        VARCHAR NOT NULL
);


--
-- CREATE employee_dismissal_reasons TABLE
-- 

CREATE TABLE employee_dismissal_reasons
(
    code        CHAR(4) PRIMARY KEY NOT NULL,
    name        VARCHAR NOT NULL
);
INSERT INTO employee_dismissal_reasons(code, name) VALUES
('ABSC', 'Absconded'),
('BUCL', 'Business Closed'),
('CODI', 'Constructively Dismissed'),
('DECE', 'Deceased'),
('DISM', 'Dismissed'),
('EMIN', 'Employer Insolvency'),
('ENCO', 'End of Contract'),
('ILLN', 'Illness'),
('RESI', 'Resigned'),
('RETR', 'Retrenched'),
('TRAN', 'Transferred');


--
-- ADD A COLUMN TO THE employment_history TABLE ALLOWING THE USER TO EXPLAIN THE REASON FOR DISMISSAL
--

ALTER TABLE employment_history ADD COLUMN IF NOT EXISTS dismissal_reason CHAR(4) REFERENCES employee_dismissal_reasons(code);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 25);