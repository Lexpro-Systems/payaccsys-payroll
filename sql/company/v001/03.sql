--
-- CHANGE database_version TABLE
--
-- Change database_version table to match database_updates table in system schema
--

ALTER TABLE database_version RENAME TO database_updates;
ALTER TABLE database_updates ADD COLUMN timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();


--
-- UPDATE database_updates TABLE
--
-- Add all missing database updates
--

INSERT INTO database_updates(major_version, minor_version) VALUES
(1, 1),
(1, 2);


--
-- ADD config TABLE
--

CREATE TABLE config
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	value			VARCHAR NOT NULL
);
-- Add lowercase unique index on name to ensure case insensiteve unique names
CREATE UNIQUE INDEX config_name_lower_idx ON config( LOWER(name) );

-- Add config values
INSERT INTO config (name, value) VALUES
('employee_code_mask', '####');


--
-- RECREATE employees TABLE
--
-- Recreate the employees table with an updated format.
--

-- Backup existing employees
CREATE TABLE employees_backup
(
	id					INTEGER,
	title_code				CHAR(4) REFERENCES title_types(code) NOT NULL,
	initials				VARCHAR NOT NULL,
	first_name				VARCHAR NOT NULL,
	second_name				VARCHAR NOT NULL,
	last_name				VARCHAR NOT NULL,
	alias					VARCHAR NOT NULL,
	id_number				VARCHAR NOT NULL,
	passport_number				VARCHAR NOT NULL,
	passport_country			CHAR(3) REFERENCES countries(code),
	date_of_birth				DATE NOT NULL,
	is_asylum_seeker			BOOLEAN NOT NULL,
	is_refugee				BOOLEAN NOT NULL,
	is_retired				BOOLEAN NOT NULL,

	physical_address_unit			VARCHAR NOT NULL,
	physical_address_complex		VARCHAR NOT NULL,
	physical_address_street			VARCHAR NOT NULL,
	physical_address_suburb			VARCHAR NOT NULL,
	physical_address_city			VARCHAR NOT NULL,
	physical_address_postal_code		VARCHAR NOT NULL,
	physical_address_country_code		CHAR(3) REFERENCES countries(code),

	postal_address_line_1			VARCHAR NOT NULL,
	postal_address_line_2			VARCHAR NOT NULL,
	postal_address_line_3			VARCHAR NOT NULL,
	postal_address_code			VARCHAR NOT NULL,

	work_address_unit			VARCHAR NOT NULL,
	work_address_complex			VARCHAR NOT NULL,
	work_address_street			VARCHAR NOT NULL,
	work_address_suburb			VARCHAR NOT NULL,
	work_address_city			VARCHAR NOT NULL,
	work_address_postal_code		VARCHAR NOT NULL,
	work_address_country_code		CHAR(3) REFERENCES countries(code),

	home_number				VARCHAR NOT NULL,
	work_number				VARCHAR NOT NULL,
	cell_number				VARCHAR NOT NULL,
	fax_number				VARCHAR NOT NULL,
	email_address				VARCHAR NOT NULL,

	emergency_contact_person		VARCHAR NOT NULL,
	emergency_contact_number		VARCHAR NOT NULL,

	employment_start_date			DATE NOT NULL,
	employment_end_date			DATE,
	employment_position			VARCHAR NOT NULL,

	department				INTEGER REFERENCES departments(id),

	payment_method_code			CHAR(4) REFERENCES payment_methods(code) NOT NULL,
	payment_period_code			CHAR(4) REFERENCES payment_period_types(code) NOT NULL,
	payment_day				INTEGER,

	income_tax_number			VARCHAR NOT NULL,
	income_tax_directive_1			VARCHAR NOT NULL,
	income_tax_directive_2			VARCHAR NOT NULL,
	income_tax_directive_3			VARCHAR NOT NULL,
	sic_code				CHAR(5) REFERENCES sic_codes(code) NOT NULL,

	created_on				DATE NOT NULL,
	created_by_user_id			INTEGER NOT NULL
);

-- Copy existing employees
INSERT INTO employees_backup SELECT * FROM employees;

-- Drop all columns except id from employees
ALTER TABLE employees
DROP COLUMN title_code,
DROP COLUMN initials,
DROP COLUMN first_name,
DROP COLUMN second_name,
DROP COLUMN last_name,
DROP COLUMN alias,
DROP COLUMN id_number,
DROP COLUMN passport_number,
DROP COLUMN passport_country,
DROP COLUMN date_of_birth,
DROP COLUMN is_asylum_seeker,
DROP COLUMN is_refugee,
DROP COLUMN is_retired,

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

DROP COLUMN department,

DROP COLUMN payment_method_code,
DROP COLUMN payment_period_code,
DROP COLUMN payment_day,

DROP COLUMN income_tax_number,
DROP COLUMN income_tax_directive_1,
DROP COLUMN income_tax_directive_2,
DROP COLUMN income_tax_directive_3,
DROP COLUMN sic_code,

DROP COLUMN created_on,
DROP COLUMN created_by_user_id;

-- Add new columns
ALTER TABLE employees
ADD COLUMN code					VARCHAR,
ADD COLUMN title_code				CHAR(4) REFERENCES title_types(code),
ADD COLUMN initials				VARCHAR,
ADD COLUMN full_names				VARCHAR,
ADD COLUMN first_name				VARCHAR,
ADD COLUMN last_name				VARCHAR,
ADD COLUMN alias				VARCHAR,
ADD COLUMN id_number				VARCHAR,
ADD COLUMN passport_number			VARCHAR,
ADD COLUMN passport_country			CHAR(3) REFERENCES countries(code),
ADD COLUMN date_of_birth			DATE,
ADD COLUMN is_asylum_seeker			BOOLEAN,
ADD COLUMN is_refugee				BOOLEAN,
ADD COLUMN is_retired				BOOLEAN,

ADD COLUMN physical_address_unit		VARCHAR,
ADD COLUMN physical_address_complex		VARCHAR,
ADD COLUMN physical_address_street		VARCHAR,
ADD COLUMN physical_address_suburb		VARCHAR,
ADD COLUMN physical_address_city		VARCHAR,
ADD COLUMN physical_address_postal_code		VARCHAR,
ADD COLUMN physical_address_country_code	CHAR(3) REFERENCES countries(code),

ADD COLUMN postal_address_line_1		VARCHAR,
ADD COLUMN postal_address_line_2		VARCHAR,
ADD COLUMN postal_address_line_3		VARCHAR,
ADD COLUMN postal_address_code			VARCHAR,

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

-- Add lowercase unique index on code to ensure case insensiteve unique employee codes
CREATE UNIQUE INDEX employee_code_lower_idx ON employees( LOWER(code) );

-- Copy data back from backup
UPDATE employees SET
	code = LPAD(CAST(employees_backup.id AS VARCHAR), 4, '0'),

	title_code = employees_backup.title_code, initials = employees_backup.initials, full_names = TRIM(employees_backup.first_name || ' ' || employees_backup.second_name), first_name = employees_backup.first_name,
	last_name = employees_backup.last_name, alias = employees_backup.alias, id_number = employees_backup.id_number, passport_number = employees_backup.passport_number, passport_country = employees_backup.passport_country,
	date_of_birth = employees_backup.date_of_birth, is_asylum_seeker = employees_backup.is_asylum_seeker, is_refugee = employees_backup.is_refugee, is_retired = employees_backup.is_retired,

	physical_address_unit = employees_backup.physical_address_unit, physical_address_complex = employees_backup.physical_address_complex, physical_address_street = employees_backup.physical_address_street, 
	physical_address_suburb = employees_backup.physical_address_suburb, physical_address_city = employees_backup.physical_address_city, physical_address_postal_code = employees_backup.physical_address_postal_code, 
	physical_address_country_code = employees_backup.physical_address_country_code, 

	postal_address_line_1 = employees_backup.postal_address_line_1, postal_address_line_2 = employees_backup.postal_address_line_2,postal_address_line_3 = employees_backup.postal_address_line_3, 
	postal_address_code = employees_backup.postal_address_code,

	work_address_unit = employees_backup.work_address_unit, work_address_complex = employees_backup.work_address_complex, work_address_street = employees_backup.work_address_street, 
	work_address_suburb = employees_backup.work_address_suburb, work_address_city = employees_backup.work_address_city, work_address_postal_code = employees_backup.work_address_postal_code, 
	work_address_country_code = employees_backup.work_address_country_code, 
	
	home_number = employees_backup.home_number, work_number = employees_backup.work_number, cell_number = employees_backup.cell_number, fax_number = employees_backup.fax_number, email_address = employees_backup.email_address,

	emergency_contact_person = employees_backup.emergency_contact_person, emergency_contact_number = employees_backup.emergency_contact_number,

	employment_start_date = employees_backup.employment_start_date, employment_end_date = employees_backup.employment_end_date, employment_position = employees_backup.employment_position,

	department_id = employees_backup.department,

	payment_method_code = employees_backup.payment_method_code, payment_period_code = employees_backup.payment_period_code, payment_day = employees_backup.payment_day,

	income_tax_number = employees_backup.income_tax_number, income_tax_directive_1 = employees_backup.income_tax_directive_1, income_tax_directive_2 = employees_backup.income_tax_directive_2, 
	income_tax_directive_3 = employees_backup.income_tax_directive_3, sic_code = employees_backup.sic_code,

	send_payslip_by_email = TRUE,

	created_on = employees_backup.created_on, created_by_user_id = employees_backup.created_by_user_id
FROM
	employees_backup
WHERE
	employees.id = employees_backup.id;

-- Reset NOT NULL constraints
ALTER TABLE employees
ALTER COLUMN code SET NOT NULL,
ALTER COLUMN title_code SET NOT NULL,
ALTER COLUMN initials SET NOT NULL,
ALTER COLUMN full_names SET NOT NULL,
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN alias SET NOT NULL,
ALTER COLUMN id_number SET NOT NULL,
ALTER COLUMN passport_number SET NOT NULL,
ALTER COLUMN date_of_birth SET NOT NULL,
ALTER COLUMN is_asylum_seeker SET NOT NULL,
ALTER COLUMN is_refugee SET NOT NULL,
ALTER COLUMN is_retired SET NOT NULL,

ALTER COLUMN physical_address_unit SET NOT NULL,
ALTER COLUMN physical_address_complex SET NOT NULL,
ALTER COLUMN physical_address_street SET NOT NULL,
ALTER COLUMN physical_address_suburb SET NOT NULL,
ALTER COLUMN physical_address_city SET NOT NULL,
ALTER COLUMN physical_address_postal_code SET NOT NULL,

ALTER COLUMN postal_address_line_1 SET NOT NULL,
ALTER COLUMN postal_address_line_2 SET NOT NULL,
ALTER COLUMN postal_address_line_3 SET NOT NULL,
ALTER COLUMN postal_address_code SET NOT NULL,

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

-- Delete backup
DROP TABLE employees_backup;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 3);