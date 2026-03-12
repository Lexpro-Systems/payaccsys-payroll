--
-- ADD visitors.id_number COLUMN
--

ALTER TABLE visitors ADD COLUMN id_number VARCHAR;
UPDATE visitors SET id_number = '';
ALTER TABLE visitors ALTER COLUMN id_number SET NOT NULL;


--
-- ADD temperature and note COLUMN TO visitors_attendance AND employee_attendance TABLES
--

ALTER TABLE visitor_attendance ADD COLUMN temperature VARCHAR;
ALTER TABLE visitor_attendance ADD COLUMN note VARCHAR;
UPDATE visitor_attendance SET temperature = '', note = '';
ALTER TABLE visitor_attendance ALTER COLUMN temperature SET NOT NULL;
ALTER TABLE visitor_attendance ALTER COLUMN note SET NOT NULL;

ALTER TABLE employee_attendance ADD COLUMN temperature VARCHAR;
ALTER TABLE employee_attendance ADD COLUMN note VARCHAR;
UPDATE employee_attendance SET temperature = '', note = '';
ALTER TABLE employee_attendance ALTER COLUMN temperature SET NOT NULL;
ALTER TABLE employee_attendance ALTER COLUMN note SET NOT NULL;


--
-- ADD postal_same_as_physical_address, work_same_as_company_address AND postal_address_country_code COLUMNS
--

-- Backup existing employees
CREATE TEMP TABLE employees_backup AS SELECT * FROM employees;

-- Drop columns
ALTER TABLE employees
DROP COLUMN physical_address_unit,
DROP COLUMN physical_address_complex,
DROP COLUMN physical_address_street,
DROP COLUMN physical_address_suburb,
DROP COLUMN physical_address_city,
DROP COLUMN physical_address_postal_code,
DROP COLUMN physical_address_country_code,

DROP COLUMN postal_address_line_1,
DROP COLUMN postal_address_line_2,
DROP COLUMN postal_address_line_3,
DROP COLUMN postal_address_code,

DROP COLUMN work_address_unit,
DROP COLUMN work_address_complex,
DROP COLUMN work_address_street,
DROP COLUMN work_address_suburb,
DROP COLUMN work_address_city,
DROP COLUMN work_address_postal_code,
DROP COLUMN work_address_country_code,

DROP COLUMN home_number,
DROP COLUMN work_number,
DROP COLUMN cell_number,
DROP COLUMN fax_number,
DROP COLUMN email_address,

DROP COLUMN emergency_contact_person,
DROP COLUMN emergency_contact_number,

DROP COLUMN employment_start_date,
DROP COLUMN employment_end_date,
DROP COLUMN employment_position,

DROP COLUMN department_id,

DROP COLUMN payment_method_code,
DROP COLUMN payment_period_code,
DROP COLUMN payment_day,

DROP COLUMN income_tax_number,
DROP COLUMN income_tax_directive_1,
DROP COLUMN income_tax_directive_2,
DROP COLUMN income_tax_directive_3,
DROP COLUMN sic_code,

DROP COLUMN send_payslip_by_email,

DROP COLUMN created_on,
DROP COLUMN created_by_user_id;

-- Add back columns with the new ones
ALTER TABLE employees
ADD COLUMN physical_address_unit		VARCHAR,
ADD COLUMN physical_address_complex		VARCHAR,
ADD COLUMN physical_address_street		VARCHAR,
ADD COLUMN physical_address_suburb		VARCHAR,
ADD COLUMN physical_address_city		VARCHAR,
ADD COLUMN physical_address_postal_code		VARCHAR,
ADD COLUMN physical_address_country_code	CHAR(3) REFERENCES countries(code),

ADD COLUMN postal_same_as_physical_address	BOOLEAN,
ADD COLUMN postal_address_line_1		VARCHAR,
ADD COLUMN postal_address_line_2		VARCHAR,
ADD COLUMN postal_address_line_3		VARCHAR,
ADD COLUMN postal_address_code			VARCHAR,
ADD COLUMN postal_address_country_code		CHAR(3) REFERENCES countries(code),

ADD COLUMN work_same_as_company_address		BOOLEAN,
ADD COLUMN work_address_unit			VARCHAR,
ADD COLUMN work_address_complex			VARCHAR,
ADD COLUMN work_address_street			VARCHAR,
ADD COLUMN work_address_suburb			VARCHAR,
ADD COLUMN work_address_city			VARCHAR,
ADD COLUMN work_address_postal_code		VARCHAR,
ADD COLUMN work_address_country_code		CHAR(3) REFERENCES countries(code),

ADD COLUMN home_number				VARCHAR,
ADD COLUMN work_number				VARCHAR,
ADD COLUMN cell_number				VARCHAR,
ADD COLUMN fax_number				VARCHAR,
ADD COLUMN email_address			VARCHAR,

ADD COLUMN emergency_contact_person		VARCHAR,
ADD COLUMN emergency_contact_number		VARCHAR,

ADD COLUMN employment_start_date		DATE,
ADD COLUMN employment_end_date			DATE,
ADD COLUMN employment_position			VARCHAR,

ADD COLUMN department_id			INTEGER REFERENCES departments(id),

ADD COLUMN payment_method_code			CHAR(4) REFERENCES payment_methods(code),
ADD COLUMN payment_period_code			CHAR(4) REFERENCES payment_period_types(code),
ADD COLUMN payment_day				INTEGER,

ADD COLUMN income_tax_number			VARCHAR,
ADD COLUMN income_tax_directive_1		VARCHAR,
ADD COLUMN income_tax_directive_2		VARCHAR,
ADD COLUMN income_tax_directive_3		VARCHAR,
ADD COLUMN sic_code				CHAR(5) REFERENCES sic_codes(code),

ADD COLUMN send_payslip_by_email		BOOLEAN,

ADD COLUMN created_on				DATE,
ADD COLUMN created_by_user_id			INTEGER;

-- Copy data back from backup
UPDATE employees SET
	physical_address_unit = employees_backup.physical_address_unit, physical_address_complex = employees_backup.physical_address_complex, physical_address_street = employees_backup.physical_address_street, 
	physical_address_suburb = employees_backup.physical_address_suburb, physical_address_city = employees_backup.physical_address_city, physical_address_postal_code = employees_backup.physical_address_postal_code, 
	physical_address_country_code = employees_backup.physical_address_country_code, 

	postal_same_as_physical_address = FALSE,
	postal_address_line_1 = employees_backup.postal_address_line_1, postal_address_line_2 = employees_backup.postal_address_line_2,postal_address_line_3 = employees_backup.postal_address_line_3, 
	postal_address_code = employees_backup.postal_address_code, postal_address_country_code = 'ZAF',

	work_same_as_company_address = FALSE,
	work_address_unit = employees_backup.work_address_unit, work_address_complex = employees_backup.work_address_complex, work_address_street = employees_backup.work_address_street, 
	work_address_suburb = employees_backup.work_address_suburb, work_address_city = employees_backup.work_address_city, work_address_postal_code = employees_backup.work_address_postal_code, 
	work_address_country_code = employees_backup.work_address_country_code, 
	
	home_number = employees_backup.home_number, work_number = employees_backup.work_number, cell_number = employees_backup.cell_number, fax_number = employees_backup.fax_number, email_address = employees_backup.email_address,

	emergency_contact_person = employees_backup.emergency_contact_person, emergency_contact_number = employees_backup.emergency_contact_number,

	employment_start_date = employees_backup.employment_start_date, employment_end_date = employees_backup.employment_end_date, employment_position = employees_backup.employment_position,

	department_id = employees_backup.department_id,

	payment_method_code = employees_backup.payment_method_code, payment_period_code = employees_backup.payment_period_code, payment_day = employees_backup.payment_day,

	income_tax_number = employees_backup.income_tax_number, income_tax_directive_1 = employees_backup.income_tax_directive_1, income_tax_directive_2 = employees_backup.income_tax_directive_2, 
	income_tax_directive_3 = employees_backup.income_tax_directive_3, sic_code = employees_backup.sic_code,

	send_payslip_by_email = employees_backup.send_payslip_by_email,

	created_on = employees_backup.created_on, created_by_user_id = employees_backup.created_by_user_id
FROM
	employees_backup
WHERE
	employees.id = employees_backup.id;

-- Reset NOT NULL constraints
ALTER TABLE employees

ALTER COLUMN postal_same_as_physical_address SET NOT NULL,
ALTER COLUMN postal_address_line_1 SET NOT NULL,
ALTER COLUMN postal_address_line_2 SET NOT NULL,
ALTER COLUMN postal_address_line_3 SET NOT NULL,
ALTER COLUMN postal_address_code SET NOT NULL,

ALTER COLUMN work_same_as_company_address SET NOT NULL,
ALTER COLUMN work_address_unit SET NOT NULL,
ALTER COLUMN work_address_complex SET NOT NULL,
ALTER COLUMN work_address_street SET NOT NULL,
ALTER COLUMN work_address_suburb SET NOT NULL,
ALTER COLUMN work_address_city SET NOT NULL,
ALTER COLUMN work_address_postal_code SET NOT NULL,

ALTER COLUMN home_number SET NOT NULL,
ALTER COLUMN work_number SET NOT NULL,
ALTER COLUMN cell_number SET NOT NULL,
ALTER COLUMN fax_number SET NOT NULL,
ALTER COLUMN email_address SET NOT NULL,

ALTER COLUMN emergency_contact_person SET NOT NULL,
ALTER COLUMN emergency_contact_number SET NOT NULL,

ALTER COLUMN employment_start_date SET NOT NULL,
ALTER COLUMN employment_position SET NOT NULL,

ALTER COLUMN payment_method_code SET NOT NULL,
ALTER COLUMN payment_period_code SET NOT NULL,

ALTER COLUMN income_tax_number SET NOT NULL,
ALTER COLUMN income_tax_directive_1 SET NOT NULL,
ALTER COLUMN income_tax_directive_2 SET NOT NULL,
ALTER COLUMN income_tax_directive_3 SET NOT NULL,
ALTER COLUMN sic_code SET NOT NULL,

ALTER COLUMN send_payslip_by_email SET NOT NULL,
ALTER COLUMN created_on SET NOT NULL,
ALTER COLUMN created_by_user_id SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 6);