
--
-- ADD THE enable_paye_correction COLUMN TO THE employees TABLE
--

ALTER TABLE employees ADD COLUMN IF NOT EXISTS enable_paye_correction BOOLEAN;
UPDATE employees SET enable_paye_correction = true;
ALTER TABLE employees ALTER COLUMN enable_paye_correction SET NOT NULL;


--
-- CREATE paye_calculation_types TABLE
-- 

CREATE TABLE paye_calculation_types 
(
    code        CHAR(4) PRIMARY KEY NOT NULL,
    name        VARCHAR NOT NULL
);
INSERT INTO paye_calculation_types(code, name) VALUES
('PERI', 'Periodic'),
('AVER', 'Tax Averaging')
ON CONFLICT DO NOTHING;


--
-- ADD THE paye_calculation_type_code COLUMN TO THE company_details TABLE
--

ALTER TABLE company_details ADD COLUMN IF NOT EXISTS paye_calculation_type_code CHAR(4) REFERENCES paye_calculation_types(code);
UPDATE company_details SET paye_calculation_type_code = 'PERI';
ALTER TABLE company_details ALTER COLUMN paye_calculation_type_code SET NOT NULL;


--
-- ADD THE paye_calculation_type_code COLUMN TO THE payslips TABLE
--

ALTER TABLE payslips ADD COLUMN IF NOT EXISTS paye_calculation_type_code CHAR(4) REFERENCES paye_calculation_types(code);
UPDATE payslips SET paye_calculation_type_code = 'PERI';
ALTER TABLE payslips ALTER COLUMN paye_calculation_type_code SET NOT NULL;

--
-- ADD THE department_id COLUMN TO THE payruns TABLE
--

ALTER TABLE payruns ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id);
UPDATE payruns SET department_id = NULL;

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 32);