--
-- CREATE payslip_templates TABLE
--

CREATE TABLE payslip_templates
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	description		VARCHAR NOT NULL,
	enabled			BOOLEAN NOT NULL
);
INSERT INTO payslip_templates (name, description, enabled) VALUES
('default', 'Default', TRUE);


--
-- CREATE payslip_template_config TABLE
--

CREATE TABLE payslip_template_config
(
	id			SERIAL PRIMARY KEY NOT NULL,
	payslip_template_id	INTEGER REFERENCES payslip_templates(id) NOT NULL,
	name			VARCHAR NOT NULL,
	value			VARCHAR NOT NULL
);


--
-- UPDATE CONFIG
--

INSERT INTO config (name, value) VALUES
('client_data_dir', ''),
('payslip_template', 'default');


--
-- ADD payslip_status_codes
--

CREATE TABLE payslip_status_codes
(
	code		CHAR(4) PRIMARY KEY NOT NULL,
	name		VARCHAR
);
INSERT INTO payslip_status_codes (code, name) VALUES
('ACTI', 'Active'),
('DELE', 'Deleted'),
('NEWX', 'New');

ALTER TABLE payslips ADD COLUMN status_code CHAR(4) REFERENCES payslip_status_codes( code );
UPDATE payslips SET status_code = 'ACTI';
ALTER TABLE payslips ALTER COLUMN status_code SET NOT NULL;


--
-- ALTER payslips TABLE
--

ALTER TABLE payslips ADD COLUMN payment_period_code CHAR(4) REFERENCES payment_period_types( code );
ALTER TABLE payslips ADD COLUMN payment_day INTEGER;

UPDATE payslips SET payment_period_code = employees.payment_period_code, payment_day = employees.payment_day
FROM employees
WHERE payslips.employee_id = employees.id;

ALTER TABLE payslips ALTER COLUMN payment_period_code SET NOT NULL;
ALTER TABLE payslips ALTER COLUMN payment_day SET NOT NULL;


--
-- ADD accounting_vendors TABLE
--

CREATE TABLE accounting_vendors
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR UNIQUE NOT NULL,
	description		VARCHAR NOT NULL
	
);
INSERT INTO accounting_vendors (name, description) VALUES ('lexpro_accounting', 'Lexpro Accounting');


CREATE TABLE accounting_vendor_config
(
	id			SERIAL PRIMARY KEY NOT NULL,
	accounting_vendor_id	INTEGER REFERENCES accounting_vendors(id) NOT NULL,
	name			VARCHAR NOT NULL,
	value			VARCHAR NOT NULL,
	data			JSONB
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 9);