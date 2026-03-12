--
-- ADD ADDITIONAL PAYSLIP ITEM TYPES
--

INSERT INTO 
	payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled)
VALUES
	('2005', 'Employee Pension Fund Contribution', 'DEDU', 'FIXE', FALSE, FALSE, NULL, TRUE),
	('2006', 'Employee Provident Fund Contribution', 'DEDU', 'FIXE', FALSE, FALSE, NULL, TRUE),
	('2007', 'Employee Retirement Annuity Fund Contribution', 'DEDU', 'FIXE', FALSE, FALSE, NULL, TRUE),
	('4001', 'Employer Pension Fund Contribution', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE),
	('4002', 'Employer Provident Fund Contribution', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE),
	('4003', 'Employer Retirement Annuity Fund Contribution', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE);


--
-- ADD BANK ACCOUNT RELATED TABLES
--

-- Create financial_institutions table
CREATE TABLE financial_institutions
(
	code		CHAR(4) PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);
INSERT INTO financial_institutions (code, name) VALUES
('ABSA', 'ABSA Bank'),
('ABAN', 'African Bank'),
('CAPI', 'Capitec'),
('FNBA', 'First National Bank'),
('INVE', 'Investec'),
('NEDB', 'Nedbank'),
('SBAN', 'Standard Bank'),
('TBAN', 'TymeBank');

-- Create bank_account_types table
CREATE TABLE bank_account_types
(
	code		CHAR(4) PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);
INSERT INTO bank_account_types (code, name) VALUES
('SACC', 'Savings Account'),
('CACC', 'Cheque Account');

-- Create employee_bank_details table
CREATE TABLE employee_bank_details
(
	id				SERIAL PRIMARY KEY NOT NULL,
	employee_id			INTEGER REFERENCES employees(id) UNIQUE NOT NULL,
	financial_institution_code	CHAR(4) REFERENCES financial_institutions(code),
	bank_account_type_code		CHAR(4) REFERENCES bank_account_types(code),
	account_number			VARCHAR NOT NULL,
	branch_code			VARCHAR NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 8);