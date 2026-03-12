--
-- CREATE database_version TABLE
--

CREATE TABLE database_version
(
	id			SERIAL PRIMARY KEY NOT NULL,
	major_version		INTEGER NOT NULL,
	minor_version		INTEGER NOT NULL,
	
	UNIQUE(major_version, minor_version)
);


--
-- CREATE countries TABLE
--

CREATE TABLE countries
(
	code 			CHAR(3) PRIMARY KEY NOT NULL,
	alpha_2_code 		CHAR(2) NOT NULL,
	name 			VARCHAR NOT NULL,
	nationality 		VARCHAR NOT NULL
);


--
-- CREATE payment_methods TABLE
--

CREATE TABLE payment_methods
(
	code		CHAR(4) PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);


--
-- CREATE payment_period_types TABLE
--

CREATE TABLE payment_period_types
(
	code		CHAR(4) PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);


--
-- CREATE STANDARD INDUSTRY CLASSIFICATION (SIC) TABLES
--

-- Create sic_divisions TABLE
CREATE TABLE sic_divisions
(
	code			CHAR(2) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);

-- Create standard_industry_classifications TABLE
CREATE TABLE sic_codes
(
	code			CHAR(5) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	sic_division_code	CHAR(2) REFERENCES sic_divisions(code) NOT NULL,
	excluded_from_eti	BOOLEAN NOT NULL
);


--
-- CREATE eti_status_types TABLE
--

CREATE TABLE eti_status_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE special_economic_zones TABLE
--

CREATE TABLE special_economic_zones
(
	code			CHAR(3) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE company_details TABLE
--

CREATE TABLE company_details
(
	id					SERIAL PRIMARY KEY NOT NULL,
	name					VARCHAR NOT NULL,
	alias					VARCHAR NOT NULL,
	registration_number			VARCHAR NOT NULL,
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
	tel_number				VARCHAR NOT NULL,
	fax_number				VARCHAR NOT NULL,
	email_address				VARCHAR NOT NULL,
	paye_reference_number			VARCHAR NOT NULL,
	sdl_payment_reference_number		VARCHAR NOT NULL,
	uif_payment_reference_number		VARCHAR NOT NULL,
	uif_registration_number			VARCHAR NOT NULL,
	sic_code				CHAR(5) REFERENCES sic_codes(code),
	eti_status_code				CHAR(4) REFERENCES eti_status_types(code),
	special_economic_zone_code		CHAR(3) REFERENCES special_economic_zones(code),
	diplomatic_indemnity			BOOLEAN NOT NULL,
	sars_contact_person			VARCHAR NOT NULL,
	sars_contact_email_address		VARCHAR NOT NULL,
	sars_contact_number			VARCHAR NOT NULL,
	uif_contact_person			VARCHAR NOT NULL,
	uif_contact_email_address		VARCHAR NOT NULL,
	uif_contact_number			VARCHAR NOT NULL
);


--
-- CREATE title_types TABLE
--

CREATE TABLE title_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE departments TABLE
--

CREATE TABLE departments
(
	id		SERIAL PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);


--
-- CREATE employees TABLE
--

CREATE TABLE employees
(
	id					SERIAL PRIMARY KEY NOT NULL,
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


--
-- CREATE work_schedules TABLE
--

CREATE TABLE work_schedules
(
	id				SERIAL PRIMARY KEY NOT NULL,
	employee_id			INTEGER REFERENCES employees(id) UNIQUE NOT NULL,
	enable_leave			BOOLEAN NOT NULL,
	monday_hours			INTEGER,
	tuesday_hours			INTEGER,
	wednesday_hours			INTEGER,
	thursday_hours			INTEGER,
	friday_hours			INTEGER,
	saturday_hours			INTEGER,
	sunday_hours			INTEGER
);


--
-- CREATE employement_history TABLE
--

CREATE TABLE employment_history
(
	id				SERIAL PRIMARY KEY NOT NULL,
	employee_id			INTEGER REFERENCES employees(id) NOT NULL,
	employed_by_user_id		INTEGER NOT NULL,
	employed_on			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	employment_position		VARCHAR NOT NULL,
	employment_date			DATE NOT NULL,
	dismissed_by_user_id		INTEGER,
	dismissed_on			TIMESTAMP WITHOUT TIME ZONE,
	dismissal_position		VARCHAR,
	dismissal_date			DATE
);


--
-- CREATE TABLE payslip_item_units
--

CREATE TABLE payslip_item_units
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE payslip_categories
--

CREATE TABLE payslip_categories
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE payslip_item_types TABLE
--

CREATE TABLE payslip_item_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	payslip_category_code	CHAR(4) REFERENCES payslip_categories(code) NOT NULL,
	payslip_item_unit_code	CHAR(4) REFERENCES payslip_item_units(code),
	is_once_off		BOOLEAN NOT NULL,
	auto_calculate		BOOLEAN NOT NULL,
	default_amount		NUMERIC(15, 2),
	is_enabled		BOOLEAN NOT NULL
);


--
-- CREATE payslip_config_items TABLE
--

CREATE TABLE payslip_config_items
(
	id			SERIAL PRIMARY KEY NOT NULL,
	payslip_item_type_code	CHAR(4) REFERENCES payslip_item_types(code) NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	description		VARCHAR NOT NULL,
	auto_calculate		BOOLEAN NOT NULL,
	accrual_date		DATE,
	amount			NUMERIC(15, 2)
);


--
-- CREATE payruns TABLE
--

CREATE TABLE payruns
(
	id			SERIAL PRIMARY KEY NOT NULL,
	description		VARCHAR NOT NULL,
	from_date		DATE NOT NULL,
	to_date			DATE NOT NULL,
	created_on		DATE NOT NULL,
	processed_on		DATE,
	created_by_user_id	INTEGER NOT NULL
);


--
-- CREATE payslips TABLE
--

CREATE TABLE payslips
(
	id			SERIAL PRIMARY KEY NOT NULL,
	payrun_id		INTEGER REFERENCES payruns(id) NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	sars_year		INTEGER NOT NULL,
	period			INTEGER NOT NULL,
	from_date		DATE NOT NULL,
	to_date			DATE NOT NULL
);


--
-- CREATE payslip_items TABLE
--

CREATE TABLE payslip_items
(
	id			BIGSERIAL PRIMARY KEY NOT NULL,
	payslip_id		INTEGER REFERENCES payslips(id) NOT NULL,
	payslip_item_type_code	CHAR(4) REFERENCES payslip_item_types(code) NOT NULL,
	description		VARCHAR NOT NULL,
	accrual_date		DATE,
	auto_calculate		BOOLEAN NOT NULL,
	units			NUMERIC,
	rate			NUMERIC(15, 2),
	total			NUMERIC(15, 2)
);


--
-- CREATE leave_interval_types TABLE
--

CREATE TABLE leave_accrual_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE leave_units TABLE
--

CREATE TABLE leave_units
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE leave_types TABLE
--

CREATE TABLE leave_types
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	leave_unit_code		CHAR(4) REFERENCES leave_units(code) NOT NULL
);


--
-- CREATE leave_type_rules TABLE
--

CREATE TABLE leave_type_rules
(
	id			SERIAL PRIMARY KEY NOT NULL,
	leave_type_id		INTEGER REFERENCES leave_types(id) NOT NULL,
	start_month		INTEGER NOT NULL,
	accrual_interval	INTEGER NOT NULL,
	leave_accrual_type_code	CHAR(4) REFERENCES leave_accrual_types(code) NOT NULL,
	amount			NUMERIC(11, 6) NOT NULL,
	reset_accrued		BOOLEAN NOT NULL,
	reset_taken		BOOLEAN NOT NULL
);


--
-- CREATE leave_config_items TABLE
--

CREATE TABLE leave_config_items
(
	id			SERIAL PRIMARY KEY NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	leave_type_id		INTEGER REFERENCES leave_types(id) NOT NULL
);


--
-- CREATE leave_actions TABLE
--

CREATE TABLE leave_actions
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE leave_source_types TABLE
--

CREATE TABLE leave_source_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- CREATE leave TABLE
--

CREATE TABLE leave
(
	id			BIGSERIAL PRIMARY KEY NOT NULL,
	leave_action_code	CHAR(4) REFERENCES leave_actions(code) NOT NULL,
	description		VARCHAR NOT NULL,
	hours			NUMERIC(11, 6) NOT NULL,
	days			NUMERIC(11, 6) NOT NULL,
	date			DATE NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	leave_type_id		INTEGER REFERENCES leave_types(id) NOT NULL,
	leave_source_type_code	CHAR(4) REFERENCES leave_source_types(code) NOT NULL,
	process_time		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	added_by_user_id	INTEGER
);


--
-- CREATE leave_maintenance_log TABLE
--

CREATE TABLE leave_maintenance_log
(
	id			SERIAL PRIMARY KEY NOT NULL,
	date			DATE NOT NULL,
	start_time		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	end_time		TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
