--
-- ADD NEW TAX DIRECTIVE COLUMNS REQUIRED BY SARS TO THE employees TABLE
--

ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_1_issued_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_1_source_code VARCHAR;
UPDATE employees SET income_tax_directive_1_source_code = '';
ALTER TABLE employees ALTER COLUMN income_tax_directive_1_source_code SET NOT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_1_amount NUMERIC(15, 2);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_2_issued_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_2_source_code VARCHAR;
UPDATE employees SET income_tax_directive_2_source_code = '';
ALTER TABLE employees ALTER COLUMN income_tax_directive_2_source_code SET NOT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_2_amount NUMERIC(15, 2);

ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_3_issued_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_3_source_code VARCHAR;
UPDATE employees SET income_tax_directive_3_source_code = '';
ALTER TABLE employees ALTER COLUMN income_tax_directive_3_source_code SET NOT NULL;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS income_tax_directive_3_amount NUMERIC(15, 2);


--
-- ADD NEW TAX DIRECTIVE COLUMNS REQUIRED BY SARS TO THE tax_certificates TABLE
--

ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_1_issued_date VARCHAR;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_1_source_code VARCHAR;
UPDATE tax_certificates SET employee_directive_1_source_code = '';
ALTER TABLE tax_certificates ALTER COLUMN employee_directive_1_source_code SET NOT NULL;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_1_amount VARCHAR;

ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_2_issued_date VARCHAR;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_2_source_code VARCHAR;
UPDATE tax_certificates SET employee_directive_2_source_code = '';
ALTER TABLE tax_certificates ALTER COLUMN employee_directive_2_source_code SET NOT NULL;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_2_amount VARCHAR;

ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_3_issued_date VARCHAR;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_3_source_code VARCHAR;
UPDATE tax_certificates SET employee_directive_3_source_code = '';
ALTER TABLE tax_certificates ALTER COLUMN employee_directive_3_source_code SET NOT NULL;
ALTER TABLE tax_certificates ADD COLUMN IF NOT EXISTS employee_directive_3_amount VARCHAR;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 29);