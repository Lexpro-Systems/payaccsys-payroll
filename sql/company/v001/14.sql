--
-- ADD company_bank_accounts TABLE
--

CREATE TABLE company_bank_accounts
(
	id				SERIAL PRIMARY KEY NOT NULL,
	financial_institution_code	CHAR(4) REFERENCES financial_institutions(code) NOT NULL,
	bank_account_type_code		CHAR(4) REFERENCES bank_account_types(code) NOT NULL,
	account_number			VARCHAR NOT NULL,
	branch_code			VARCHAR NOT NULL
);


--
-- ADD file_types TABLE
--

CREATE TABLE file_types
(
	code				CHAR(4) PRIMARY KEY NOT NULL,
	name				VARCHAR NOT NULL,
	extension			VARCHAR NOT NULL,
	mime_type			VARCHAR NOT NULL
);
INSERT INTO file_types(code, name, extension, mime_type) VALUES
('PDFF', 'Pdf Document', 'pdf', 'application/pdf'),
('DOCX', 'Microsoft Word Document', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
('DOCF', 'Microsoft Word Document', 'doc', 'application/msword'),
('XLSX', 'Microsoft Excel Spreadsheet', 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
('XLSF', 'Microsoft Excel Spreadsheet', 'xls', 'application/vnd.ms-excel'),
('CSVF', 'CSV File', 'csv', 'text/csv'),
('TXTF', 'Text File', 'txt', 'text/plain'),
('PNGF', 'PNG Image', 'png', 'image/png'),
('JPEG', 'JPEG Image', 'jpeg', 'image/jpeg'),
('SVGF', 'SVG Image', 'jpeg', 'image/svg+xml'),
('ODSF', 'OpenDocument Spreadsheet', 'ods', 'application/vnd.oasis.opendocument.spreadsheet'),
('ODTF', 'OpenDocument Text', 'odt', 'application/vnd.oasis.opendocument.text');


--
-- ADD employee_document_categories TABLE
--

CREATE TABLE document_categories (
	id				SERIAL PRIMARY KEY NOT NULL,
	name				VARCHAR NOT NULL
);
INSERT INTO document_categories (name) VALUES
('Sick Notes'),
('Employment Contracts');


--
-- ADD employee_documents TABLE
--

CREATE TABLE employee_documents
(
	id				SERIAL PRIMARY KEY NOT NULL,
	employee_id			INTEGER REFERENCES employees(id) NOT NULL,
	document_category_id		INTEGER REFERENCES document_categories(id),
	description			VARCHAR NOT NULL,
	filename			VARCHAR NOT NULL,
	file_type_code			CHAR(4) REFERENCES file_types(code) NOT NULL,
	size				BIGINT NOT NULL,
	uploaded_on			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	uploaded_by_user_id		INTEGER NOT NULL			
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 14);