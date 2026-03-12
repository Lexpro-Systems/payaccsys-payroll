--
-- CREATE paye_bonus_calculation_types TABLE
-- 

CREATE TABLE paye_bonus_calculation_types 
(
    code        CHAR(4) PRIMARY KEY NOT NULL,
    name        VARCHAR NOT NULL
);
INSERT INTO paye_bonus_calculation_types(code, name) VALUES
    ('STAN', 'Standard'),
    ('ACCU', 'Accurate')
ON CONFLICT DO NOTHING;


--
-- ADD THE paye_bonus_calculation_type_code COLUMN TO THE company_details TABLE
--

ALTER TABLE company_details ADD COLUMN IF NOT EXISTS paye_bonus_calculation_type_code CHAR(4) REFERENCES paye_bonus_calculation_types(code);
UPDATE company_details SET paye_bonus_calculation_type_code = 'STAN';
ALTER TABLE company_details ALTER COLUMN paye_bonus_calculation_type_code SET NOT NULL;


--
-- ADD THE paye_bonus_calculation_type_code COLUMN TO THE payslips TABLE
--

ALTER TABLE payslips ADD COLUMN IF NOT EXISTS paye_bonus_calculation_type_code CHAR(4) REFERENCES paye_bonus_calculation_types(code);
UPDATE payslips SET paye_bonus_calculation_type_code = 'STAN';
ALTER TABLE payslips ALTER COLUMN paye_bonus_calculation_type_code SET NOT NULL;


--
-- UPDATE THE DESCRIPTION OF BIWEEKLY PAYMENTS TO AVOID CONFUSION
--

UPDATE payment_period_types SET name = 'Every Two Weeks' WHERE code = 'BWEE';


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 39);