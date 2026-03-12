--
-- ADD provident_funds TABLE
--

CREATE TABLE provident_fund_calculation_types
(
	code			VARCHAR PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);
INSERT INTO provident_fund_calculation_types(code, name) VALUES
('FIXE', 'Fixed'),
('PRFI', '% of RFI Income');

CREATE TABLE provident_funds
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	provident_fund_calculation_type_code	CHAR(4) REFERENCES provident_fund_calculation_types(code) NOT NULL,
	employee_amount		NUMERIC(15, 6) NOT NULL,
	employer_amount		NUMERIC(15, 6) NOT NULL,
	category_factor		NUMERIC(11, 6) NOT NULL,
	is_active		BOOLEAN NOT NULL,
	created_on		VARCHAR NOT NULL
);

CREATE TABLE provident_fund_members
(
	id			SERIAL PRIMARY KEY NOT NULL,
	provident_fund_id	INTEGER REFERENCES provident_funds(id) NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	joined_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL
);


--
-- CREATE employee_rfi_items TABLE
--

CREATE TABLE employee_rfi_items
(
	id			SERIAL PRIMARY KEY NOT NULL,
	provident_fund_id	INTEGER REFERENCES provident_funds(id) NOT NULL,
	payslip_config_item_id	INTEGER REFERENCES payslip_config_items(id) NOT NULL,
	percentage		NUMERIC(11, 6) NOT NULL
);


--
-- ADD provident_fund_id COLUMN TO payslip_items
--

ALTER TABLE payslip_items ADD COLUMN provident_fund_id INTEGER REFERENCES provident_funds(id);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 12);