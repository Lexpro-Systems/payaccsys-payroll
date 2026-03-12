--
-- ADD sars_countries table
--

DROP TABLE IF EXISTS sars_countries;
CREATE TABLE sars_countries
(
    name VARCHAR,
    alpha_2_code VARCHAR,
    code VARCHAR PRIMARY KEY NOT NULL,
    is_passport BOOLEAN,
    is_address BOOLEAN
);

--
-- INSERT the values into the sars_countries table
--

INSERT INTO sars_countries (name, alpha_2_code, code, is_passport, is_address) VALUES
('Afghanistan', 'AF','AFG', true, true),
('Åland Islands', 'AX','ALA', true, true),
('Albania', 'AL','ALB', true, true),
('Algeria', 'DZ','DZA', true, true),
('American Samoa', 'AS','ASM', true, true),
('Andorra', 'AD','AND', true, true),
('Angola', 'AO','AGO', true, true),
('Anguilla', 'AI','AIA', true, true),
('Antarctica', 'AQ','ATA', true, true),
('Antigua and Barbuda', 'AG','ATG', true, true),
('Argentina', 'AR','ARG', true, true),
('Armenia', 'AM','ARM', true, true),
('Aruba', 'AW','ABW', true, true),
('Australia', 'AU','AUS', true, true),
('Austria', 'AT','AUT', true, true),
('Azerbaijan', 'AZ','AZE', true, true),
('Bahamas', 'BS','BHS', true, true),
('Bahrain', 'BH','BHR', true, true),
('Bangladesh', 'BD','BGD', true, true),
('Barbados', 'BB','BRB', true, true),
('Belarus', 'BY','BLR', true, true),
('Belgium', 'BE','BEL', true, true),
('Belize', 'BZ','BLZ', true, true),
('Benin', 'BJ','BEN', true, true),
('Bermuda', 'BM','BMU', true, true),
('Bhutan', 'BT','BTN', true, true),
('Bolivia (Plurinational State of)', 'BO','BOL', true, true),
('Bonaire, Sint Eustatius and Saba', 'BQ','BES', true, true),
('Bosnia and Herzegovina', 'BA','BIH', true, true),
('Botswana', 'BW','BWA', true, true),
('Bouvet Island', 'BV','BVT', true, true),
('Brazil', 'BR','BRA', true, true),
('British Indian Ocean Territories', 'IO','IOT', true, true),
('Brunei Darussalam', 'BN','BRN', true, true),
('Bulgaria', 'BG','BGR', true, true),
('Burkina Faso', 'BF','BFA', true, true),
('Burundi', 'BI','BDI', true, true),
('Cambodia', 'KH','KHM', true, true),
('Cameroon', 'CM','CMR', true, true),
('Canada', 'CA','CAN', true, true),
('Cape Verde', 'CV','CPV', true, true),
('Cayman Islands', 'KY','CYM', true, true),
('Central African Republic', 'CF','CAF', true, true),
('Chad', 'TD','TCD', true, true),
('Chile', 'CL','CHL', true, true),
('China', 'CN','CHN', true, true),
('Christmas Island', 'CX','CXR', true, true),
('Cocos (Keeling) Islands', 'CC','CCK', true, true),
('Colombia', 'CO','COL', true, true),
('Comoros', 'KM','COM', true, true),
('Congo', 'CG','COG', true, true),
('Congo (The Democratic Republic of the)', 'CD','COD', true, true),
('Cook Islands', 'CK','COK', true, true),
('Costa Rica', 'CR','CRI', true, true),
('Côte D''ivoire', 'CI','CIV', true, true),
('Croatia', 'HR','HRV', true, true),
('Cuba', 'CU','CUB', true, true),
('Curaçao', 'CW','CUW', true, true),
('Cyprus', 'CY','CYP', true, true),
('Czech Republic', 'CZ','CZE', true, true),
('Denmark', 'DK','DNK', true, true),
('Djibouti', 'DJ','DJI', true, true),
('Dominica', 'DM','DMA', true, true),
('Dominican Republic', 'DO','DOM', true, true),
('Ecuador', 'EC','ECU', true, true),
('Egypt', 'EG','EGY', true, true),
('El Salvador', 'SV','SLV', true, true),
('Equatorial Guinea', 'GQ','GNQ', true, true),
('Eritrea', 'ER','ERI', true, true),
('Estonia', 'EE','EST', true, true),
('Ethiopia', 'ET','ETH', true, true),
('Falkland Islands (Malvinas)', 'FK','FLK', true, true),
('Faroe Islands', 'FO','FRO', true, true),
('Fiji', 'FJ','FJI', true, true),
('Finland', 'FI','FIN', true, true),
('France', 'FR','FRA', true, true),
('French Guiana', 'GF','GUF', true, true),
('French Polynesia', 'PF','PYF', true, true),
('French Southern Territories', 'TF','ATF', true, true),
('Gabon', 'GA','GAB', true, true),
('Gambia', 'GM','GMB', true, true),
('Georgia', 'GE','GEO', true, true),
('Germany', 'DE','DEU', true, true),
('Ghana', 'GH','GHA', true, true),
('Gibraltar', 'GI','GIB', true, true),
('Greece', 'GR','GRC', true, true),
('Greenland', 'GL','GRL', true, true),
('Grenada', 'GD','GRD', true, true),
('Malawi', 'MW','MWI', true, true),
('Malaysia', 'MY','MYS', true, true),
('Maldives', 'MV','MDV', true, true),
('Mali', 'ML','MLI', true, true),
('Malta', 'MT','MLT', true, true),
('Marshall Islands', 'MH','MHL', true, true),
('Martinique', 'MQ','MTQ', true, true),
('Mauritania', 'MR','MRT', true, true),
('Mauritius', 'MU','MUS', true, true),
('Mayotte', 'YT','MYT', true, true),
('Mexico', 'MX','MEX', true, true),
('Micronesia (Federated States of)', 'FM','FSM', true, true),
('Moldova (Republic of)', 'MD','MDA', true, true),
('Monaco', 'MC','MCO', true, true),
('Mongolia', 'MN','MNG', true, true),
('Montenegro', 'ME','MNE', true, true),
('Montserrat', 'MS','MSR', true, true),
('Morocco', 'MA','MAR', true, true),
('Mozambique', 'MZ','MOZ', true, true),
('Myanmar', 'MM','MMR', true, true),
('Namibia', 'NA','NAM', true, true),
('Nauru', 'NR','NRU', true, true),
('Nepal', 'NP','NPL', true, true),
('Netherlands', 'NL','NLD', true, true),
('New Caledonia', 'NC','NCL', true, true),
('New Zealand', 'NZ','NZL', true, true),
('Nicaragua', 'NI','NIC', true, true),
('Niger', 'NE','NER', true, true),
('Nigeria', 'NG','NGA', true, true),
('Niue', 'NU','NIU', true, true),
('Norfolk Island', 'NF','NFK', true, true),
('Northern Mariana Islands', 'MP','MNP', true, true),
('Norway', 'NO','NOR', true, true),
('Oman', 'OM','OMN', true, true),
('Pakistan', 'PK','PAK', true, true),
('Palau', 'PW','PLW', true, true),
('Palestine (State of)', 'PS','PSE', true, true),
('Panama', 'PA','PAN', true, true),
('Papua New Guinea', 'PG','PNG', true, true),
('Paraguay', 'PY','PRY', true, true),
('Peru', 'PE','PER', true, true),
('Philippines', 'PH','PHL', true, true),
('Pitcairn', 'PN','PCN', true, true),
('Poland', 'PL','POL', true, true),
('Portugal', 'PT','PRT', true, true),
('Puerto Rico', 'PR','PRI', true, true),
('Qatar', 'QA','QAT', true, true),
('Réunion', 'RE','REU', true, true),
('Romania', 'RO','ROU', true, true),
('Russian Federation', 'RU','RUS', true, true),
('Rwanda', 'RW','RWA', true, true),
('Saint Barthélemy', 'BL','BLM', true, true),
('Saint Helena, Ascension and Tristan Da Cunha', 'SH','SHN', true, true),
('Saint Kitts and Nevis', 'KN','KNA', true, true),
('Saint Lucia', 'LC','LCA', true, true),
('Saint Martin (French Part)', 'MF','MAF', true, true),
('Saint Pierre and Miquelon', 'PM','SPM', true, true),
('Saint Vincent and the Grenadines', 'VC','VCT', true, true),
('Samoa', 'WS','WSM', true, true),
('San Marino', 'SM','SMR', true, true),
('Sao Tome and Principe', 'ST','STP', true, true),
('Saudi Arabia', 'SA','SAU', true, true),
('Senegal', 'SN','SEN', true, true),
('Serbia', 'RS','SRB', true, true),
('Seychelles', 'SC','SYC', true, true),
('Sierra Leone', 'SL','SLE', true, true),
('Singapore', 'SG','SGP', true, true),
('Sint Maarten (Dutch Part)', 'SX','SXM', true, true),
('Slovakia', 'SK','SVK', true, true),
('Slovenia', 'SI','SVN', true, true),
('Solomon Islands', 'SB','SLB', true, true),
('Somalia', 'SO','SOM', true, true),
('South Africa', 'ZA','ZAF', true, true),
('South Georgia and the South Sandwich Islands', 'GS','SGS', true, true),
('South Sudan', 'SS','SSD', true, true),
('Spain', 'ES','ESP', true, true),
('Sri Lanka', 'LK','LKA', true, true),
('Sudan', 'SD','SDN', true, true),
('Suriname', 'SR','SUR', true, true),
('Svalbard and Jan Mayen', 'SJ','SJM', true, true),
('Swaziland', 'SZ','SWZ', true, true),
('Sweden', 'SE','SWE', true, true),
('Switzerland', 'CH','CHE', true, true),
('Syrian Arab Republic', 'SY','SYR', true, true),
('Taiwan (Province of China)', 'TW','TWN', true, true),
('Tajikistan', 'TJ','TJK', true, true),
('Tanzania (United Republic of)', 'TZ','TZA', true, true),
('Thailand', 'TH','THA', true, true),
('Timor-Leste', 'TL','TLS', true, true),
('Togo', 'TG','TGO', true, true),
('Tokelau', 'TK','TKL', true, true),
('Tonga', 'TO','TON', true, true),
('Trinidad and Tobago', 'TT','TTO', true, true),
('Tunisia', 'TN','TUN', true, true),
('Turkey', 'TR','TUR', true, true),
('Turkmenistan', 'TM','TKM', true, true),
('Turks and Caicos Islands', 'TC','TCA', true, true),
('Tuvalu', 'TV','TUV', true, true),
('Uganda', 'UG','UGA', true, true),
('Ukraine', 'UA','UKR', true, true),
('United Arab Emirates', 'AE','ARE', true, true),
('United Kingdom', 'GB','GBZ', false, true),
('United Kingdom (Citizen) (Great Britain)', 'GB','GBR', true, false),
('United Kingdom (Dependent Territories Citizen)', 'GB','GBD', false, false),
('United Kingdom (National Oversees)', 'GB','GBN', true, false),
('United Kingdom (Overseas Citizen)', 'GB','GBO', true, false),
('United Kingdom (Protected Person)', 'GB','GBP', true, false),
('United Kingdom (Subject)', 'GB','GBS', true, false),
('United States', 'US','USA', true, true),
('United States Minor Outlying Islands', 'UM','UMI', true, true),
('Uruguay', 'UY','URY', true, true),
('Uzbekistan', 'UZ','UZB', true, true),
('Vanuatu', 'VU','VUT', true, true),
('Venezuela (Bolivarian Republic of)', 'VE','VEN', true, true),
('Viet NAM', 'VN','VNM', true, true),
('Virgin Islands (British)', 'VG','VGB', true, true),
('Virgin Islands (U.S.)', 'VI','VIR', true, true),
('Wallis and Futuna', 'WF','WLF', true, true),
('Western Sahara', 'EH','ESH', true, true),
('Yemen', 'YE','YEM', true, true),
('Zambia', 'ZM','ZMB', true, true),
('Zimbabwe', 'ZW','ZWE', true, true);

--
-- DROP the countries table and all references to it
--

ALTER TABLE company_details DROP CONSTRAINT company_details_physical_address_country_code_fkey;
ALTER TABLE employees DROP CONSTRAINT employees_passport_country_fkey;
ALTER TABLE employees DROP CONSTRAINT employees_physical_address_country_code_fkey;
ALTER TABLE employees DROP CONSTRAINT employees_postal_address_country_code_fkey;
ALTER TABLE employees DROP CONSTRAINT employees_work_address_country_code_fkey;
DROP TABLE IF EXISTS countries;

--
-- Replace all references to the countries table
-- 

UPDATE company_details SET physical_address_country_code = null WHERE physical_address_country_code NOT IN( SELECT code FROM sars_countries);
UPDATE employees SET passport_country = null WHERE physical_address_country_code NOT IN( SELECT code FROM sars_countries);
UPDATE employees SET physical_address_country_code = null WHERE physical_address_country_code NOT IN( SELECT code FROM sars_countries);
UPDATE employees SET postal_address_country_code = null WHERE physical_address_country_code NOT IN( SELECT code FROM sars_countries);
UPDATE employees SET work_address_country_code = null WHERE physical_address_country_code NOT IN( SELECT code FROM sars_countries);

ALTER TABLE sars_countries RENAME TO countries;
ALTER TABLE company_details ADD CONSTRAINT company_details_physical_address_country_code_fkey FOREIGN KEY (physical_address_country_code) REFERENCES countries(code);
ALTER TABLE employees ADD CONSTRAINT employees_passport_country_fkey FOREIGN KEY (passport_country) REFERENCES countries(code);
ALTER TABLE employees ADD CONSTRAINT employees_physical_address_country_code_fkey FOREIGN KEY (physical_address_country_code) REFERENCES countries(code);
ALTER TABLE employees ADD CONSTRAINT employees_postal_address_country_code_fkey FOREIGN KEY (postal_address_country_code) REFERENCES countries(code);
ALTER TABLE employees ADD CONSTRAINT employees_work_address_country_code_fkey FOREIGN KEY (work_address_country_code) REFERENCES countries(code);

-- 
-- UPDATE the references to United Kingdom for address details
--

UPDATE company_details SET physical_address_country_code = 'GBZ' WHERE physical_address_country_code = 'GBR';
UPDATE employees SET physical_address_country_code = 'GBZ' WHERE physical_address_country_code = 'GBR';
UPDATE employees SET postal_address_country_code = 'GBZ' WHERE postal_address_country_code = 'GBR';
UPDATE employees SET work_address_country_code = 'GBZ' WHERE work_address_country_code = 'GBR';

--
-- Change the SARS contact person details to reflect the SARS reconciliation requirements
--

ALTER TABLE company_details ADD COLUMN sars_contact_first_name VARCHAR;
ALTER TABLE company_details RENAME COLUMN sars_contact_person TO sars_contact_last_name;
UPDATE company_details SET sars_contact_first_name = LEFT(sars_contact_last_name, STRPOS(sars_contact_last_name, ' '));
UPDATE company_details SET sars_contact_last_name = SUBSTR(sars_contact_last_name, STRPOS(sars_contact_last_name, ' ') + 1);
ALTER TABLE company_details ADD COLUMN sars_contact_cell_number VARCHAR;
ALTER TABLE company_details RENAME COLUMN sars_contact_number TO sars_contact_business_number;
UPDATE company_details SET sars_contact_cell_number = '';
ALTER TABLE company_details ALTER COLUMN sars_contact_first_name SET NOT NULL, ALTER COLUMN sars_contact_cell_number SET NOT NULL;

--
-- CREATE tax_reconciliation_periods TABLE
--

CREATE TABLE tax_reconciliation_periods
(
    code                CHAR(4) PRIMARY KEY NOT NULL,
    name                VARCHAR NOT NULL
);
INSERT INTO tax_reconciliation_periods(code, name) VALUES
('INTE', 'Interim'),
('ANNU', 'Annual');

--
-- CREATE tax_reconciliations TABLE
--

CREATE TABLE tax_reconciliations
(
    id                                      SERIAL PRIMARY KEY NOT NULL,
    legacy_ids                              VARCHAR NOT NULL,
    sars_year                               INTEGER NOT NULL,
    tax_reconciliation_period_code          CHAR(4) REFERENCES tax_reconciliation_periods(code) NOT NULL,
    employer_name                           VARCHAR NOT NULL,
    employer_paye_number                    VARCHAR NOT NULL,
    employer_sdl_number                     VARCHAR NOT NULL,
    employer_uif_number                     VARCHAR NOT NULL,
    employer_sic_code                       CHAR(5) REFERENCES sic_codes(code),
    employer_eti_status_code                CHAR(4) REFERENCES eti_status_types(code),
    employer_special_economic_zone_code     CHAR(3) REFERENCES special_economic_zones(code),
    employer_diplomatic_indemnity           BOOLEAN NOT NULL,
    employer_address_unit                   VARCHAR NOT NULL,
    employer_address_complex                VARCHAR NOT NULL,
    employer_address_street_number          VARCHAR NOT NULL,
    employer_address_street_name            VARCHAR NOT NULL,
    employer_address_suburb                 VARCHAR NOT NULL,
    employer_address_city                   VARCHAR NOT NULL,
    employer_address_postal_code            VARCHAR NOT NULL,
    employer_address_country_code           CHAR(3) REFERENCES countries(code),
    employer_contact_person_first_name      VARCHAR NOT NULL,
    employer_contact_person_last_name       VARCHAR NOT NULL,
    employer_contact_person_position        VARCHAR NOT NULL,
    employer_contact_person_tel_number      VARCHAR NOT NULL,
    employer_contact_person_fax_number      VARCHAR NOT NULL,
    employer_contact_person_cell_number     VARCHAR NOT NULL,
    employer_contact_person_email_address   VARCHAR NOT NULL,
    note                                    VARCHAR NOT NULL,
    generated_on                            TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

--
-- INSERT the relevant data from the irp5s TABLE into the tax_reconciliations TABLE
--

INSERT INTO tax_reconciliations
(
    legacy_ids, 
    sars_year,
    tax_reconciliation_period_code,
    employer_name,
    employer_paye_number,
    employer_sdl_number,
    employer_uif_number,
    employer_sic_code,
    employer_eti_status_code,
    employer_special_economic_zone_code,
    employer_diplomatic_indemnity,
    employer_address_unit,
    employer_address_complex,
    employer_address_street_number,
    employer_address_street_name,
    employer_address_suburb,
    employer_address_city,
    employer_address_postal_code,
    employer_address_country_code,
    employer_contact_person_first_name,
    employer_contact_person_last_name,
    employer_contact_person_position,
    employer_contact_person_tel_number,
    employer_contact_person_fax_number,
    employer_contact_person_cell_number,
    employer_contact_person_email_address,
    note,
    generated_on
)
SELECT
    STRING_AGG(CAST(id AS VARCHAR), ','), 
    sars_year,
    irp5_type_code,
    MAX(employer_name),
    MAX(employer_paye_number),
    MAX(employer_sdl_number),
    MAX(employer_uif_number),
    (SELECT sic_code FROM company_details),
    (SELECT eti_status_code FROM company_details),
    (SELECT special_economic_zone_code FROM company_details),
    BOOL_AND(diplomatic_indemnity),
    (SELECT physical_address_unit FROM company_details),
    (SELECT physical_address_complex FROM company_details),
    '',
    (SELECT physical_address_street FROM company_details),
    (SELECT physical_address_suburb FROM company_details),
    (SELECT physical_address_city FROM company_details),
    (SELECT physical_address_postal_code FROM company_details),
    (SELECT physical_address_country_code FROM company_details),
    (SELECT sars_contact_first_name FROM company_details),
    (SELECT sars_contact_last_name FROM company_details),
    '',
    (SELECT sars_contact_business_number FROM company_details),
    '',
    (SELECT sars_contact_cell_number FROM company_details),
    (SELECT sars_contact_email_address FROM company_details),
    '',
    MAX(generated_on)
FROM 
    irp5s
GROUP BY 
    sars_year, irp5_type_code;

--
-- CREATE tax_certificate_types TABLE
--

CREATE TABLE tax_certificate_types
(
    code                CHAR(4) PRIMARY KEY NOT NULL,
    name                VARCHAR NOT NULL
);
INSERT INTO tax_certificate_types(code, name) VALUES
('IRP5', 'IRP5'),
('IT3A', 'IT3(a)');

--
-- CREATE tax_certificates TABLE
--

CREATE TABLE tax_certificates
(
    id                                          SERIAL PRIMARY KEY NOT NULL,
    legacy_id                                   INTEGER NOT NULL,
    tax_reconciliation_id                       INTEGER REFERENCES tax_reconciliations(id) NOT NULL,
    tax_certificate_type_code                   CHAR(4) REFERENCES tax_certificate_types(code) NOT NULL,
    reason_for_non_deduction                    VARCHAR NOT NULL,
    number                                      VARCHAR NOT NULL,
    pay_periods                                 NUMERIC(7, 4) NOT NULL,
    pay_periods_worked                          NUMERIC(7, 4) NOT NULL,
    employee_id                                 INTEGER REFERENCES employees(id) NOT NULL,
    employee_nature                             CHAR(1) NOT NULL,
    employee_sic_code                           CHAR(5) REFERENCES sic_codes(code),
    employee_fixed_rate_income                  BOOLEAN NOT NULL,
    employee_voluntary_over_deduction           BOOLEAN NOT NULL,
    employee_directive_1                        VARCHAR NOT NULL,
    employee_directive_2                        VARCHAR NOT NULL,
    employee_directive_3                        VARCHAR NOT NULL,
    employee_surname                            VARCHAR NOT NULL,
    employee_first_names                        VARCHAR NOT NULL,
    employee_initials                           VARCHAR NOT NULL,
    employee_id_number                          VARCHAR NOT NULL,
    employee_passport_number                    VARCHAR NOT NULL,
    employee_passport_country                   CHAR(3) REFERENCES countries(code),
    employee_date_of_birth                      VARCHAR NOT NULL,
    employee_income_tax_number                  VARCHAR NOT NULL,
    employee_number                             VARCHAR NOT NULL,
    employee_employed_from                      DATE NOT NULL,
    employee_employed_to                        DATE,
    employee_work_address_unit                  VARCHAR NOT NULL,
    employee_work_address_complex               VARCHAR NOT NULL,
    employee_work_address_street_number         VARCHAR NOT NULL,
    employee_work_address_street_name           VARCHAR NOT NULL,
    employee_work_address_suburb                VARCHAR NOT NULL,
    employee_work_address_city                  VARCHAR NOT NULL,
    employee_work_address_postal_code           VARCHAR NOT NULL,
    employee_work_address_country_code          CHAR(3) REFERENCES countries(code),
    employee_residential_address_unit           VARCHAR NOT NULL,
    employee_residential_address_complex        VARCHAR NOT NULL,
    employee_residential_address_street_number  VARCHAR NOT NULL,
    employee_residential_address_street_name    VARCHAR NOT NULL,
    employee_residential_address_suburb         VARCHAR NOT NULL,
    employee_residential_address_city           VARCHAR NOT NULL,
    employee_residential_address_postal_code    VARCHAR NOT NULL,
    employee_residential_address_country_code   CHAR(3) REFERENCES countries(code),
    employee_postal_address_line_1              VARCHAR NOT NULL,
    employee_postal_address_line_2              VARCHAR NOT NULL,
    employee_postal_address_line_3              VARCHAR NOT NULL,
    employee_postal_address_line_4              VARCHAR NOT NULL,
    employee_postal_address_code                VARCHAR NOT NULL,
    employee_postal_address_country_code        CHAR(3) REFERENCES countries(code),
    employee_home_number                        VARCHAR NOT NULL,
    employee_work_number                        VARCHAR NOT NULL,
    employee_cell_number                        VARCHAR NOT NULL,
    employee_fax_number                         VARCHAR NOT NULL,
    employee_email_address                      VARCHAR NOT NULL,
    employee_financial_institution_code         CHAR(4) REFERENCES financial_institutions(code),
    employee_financial_institution_name         VARCHAR NOT NULL,
    employee_bank_account_type_code             CHAR(4) REFERENCES bank_account_types(code),
    employee_account_number                     VARCHAR NOT NULL,
    employee_branch_code                        VARCHAR NOT NULL,
    total_income                                NUMERIC(15, 2) NOT NULL,
    total_taxable_income                        NUMERIC(15, 2) NOT NULL,
    total_non_taxable_income                    NUMERIC(15, 2) NOT NULL,
    total_retirement_income                     NUMERIC(15, 2) NOT NULL,
    total_non_retirement_income                 NUMERIC(15, 2) NOT NULL,
    total_deductions                            NUMERIC(15, 2) NOT NULL,
    total_paye_on_lump_sums                     NUMERIC(15, 2) NOT NULL,
    total_medical_scheme_credit                 NUMERIC(15, 2) NOT NULL,
    total_medical_expenses                      NUMERIC(15, 2) NOT NULL,
    total_standard_income_tax                   NUMERIC(15, 2) NOT NULL,
    total_paye                                  NUMERIC(15, 2) NOT NULL,
    total_tax                                   NUMERIC(15, 2) NOT NULL,
    total_uif                                   NUMERIC(15, 2) NOT NULL,
    total_sdl                                   NUMERIC(15, 2) NOT NULL
);

--
-- INSERT the relevant data from the irp5s TABLE into the tax_certificates TABLE
--

INSERT INTO tax_certificates
(
    legacy_id,
    tax_reconciliation_id,
    tax_certificate_type_code,
    reason_for_non_deduction,
    number,
    pay_periods,
    pay_periods_worked,
    employee_id,
    employee_nature,
    employee_sic_code,
    employee_fixed_rate_income,
    employee_voluntary_over_deduction,
    employee_directive_1,
    employee_directive_2,
    employee_directive_3,
    employee_surname,
    employee_first_names,
    employee_initials,
    employee_id_number,
    employee_passport_number,
    employee_passport_country,
    employee_date_of_birth,
    employee_income_tax_number,
    employee_number,
    employee_employed_from,
    employee_employed_to,
    employee_work_address_unit,
    employee_work_address_complex,
    employee_work_address_street_number,
    employee_work_address_street_name,
    employee_work_address_suburb,
    employee_work_address_city,
    employee_work_address_postal_code,
    employee_work_address_country_code,
    employee_residential_address_unit,
    employee_residential_address_complex,
    employee_residential_address_street_number,
    employee_residential_address_street_name,
    employee_residential_address_suburb,
    employee_residential_address_city,
    employee_residential_address_postal_code,
    employee_residential_address_country_code,
    employee_postal_address_line_1,
    employee_postal_address_line_2,
    employee_postal_address_line_3,
    employee_postal_address_line_4,
    employee_postal_address_code,
    employee_postal_address_country_code,
    employee_home_number,
    employee_work_number,
    employee_cell_number,
    employee_fax_number,
    employee_email_address,
    employee_financial_institution_code,
    employee_financial_institution_name,
    employee_bank_account_type_code,
    employee_account_number,
    employee_branch_code,
    total_income,
    total_taxable_income,
    total_non_taxable_income,
    total_retirement_income,
    total_non_retirement_income,
    total_deductions,
    total_paye_on_lump_sums,
    total_medical_scheme_credit,
    total_medical_expenses,
    total_standard_income_tax,
    total_paye,
    total_tax,
    total_uif,
    total_sdl
)
SELECT 
    id,
    (SELECT tax_reconciliations.id FROM tax_reconciliations WHERE irp5s.id = ANY(CAST(STRING_TO_ARRAY(tax_reconciliations.legacy_ids, ',') AS int[]))),
    'IRP5',
    reason_for_non_deduction,
    number,
    pay_periods,
    pay_periods_worked,
    employee_id,
    employee_nature,
    (SELECT employer_sic_code FROM tax_reconciliations WHERE irp5s.id = ANY(CAST(STRING_TO_ARRAY(tax_reconciliations.legacy_ids, ',') AS int[]))),
    fixed_rate_income,
    voluntary_over_deduction,
    directive_1,
    directive_2,
    directive_3,
    employee_surname,
    employee_first_names,
    employee_initials,
    employee_id_number,
    employee_passport_number,
    (SELECT passport_country FROM employees WHERE employees.id = irp5s.employee_id),
    employee_date_of_birth,
    employee_income_tax_number,
    employee_number,
    employee_employed_from,
    employee_employed_to,
    (SELECT work_address_unit FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_address_complex FROM employees WHERE employees.id = irp5s.employee_id),
    '',
    (SELECT work_address_street FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_address_suburb FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_address_city FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_address_postal_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_address_country_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_unit FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_complex FROM employees WHERE employees.id = irp5s.employee_id),
    '',
    (SELECT physical_address_street FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_suburb FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_city FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_postal_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT physical_address_country_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT postal_address_line_1 FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT postal_address_line_2 FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT postal_address_line_3 FROM employees WHERE employees.id = irp5s.employee_id),
    '',
    (SELECT employee_address_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT postal_address_country_code FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT home_number FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT work_number FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT cell_number FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT fax_number FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT email_address FROM employees WHERE employees.id = irp5s.employee_id),
    (SELECT financial_institution_code FROM employee_bank_details WHERE employee_bank_details.employee_id = irp5s.employee_id),
    (SELECT(COALESCE((SELECT name FROM employee_bank_details LEFT JOIN financial_institutions ON financial_institutions.code = employee_bank_details.financial_institution_code WHERE employee_bank_details.employee_id = irp5s.employee_id), ''))),
    (SELECT bank_account_type_code FROM employee_bank_details WHERE employee_bank_details.employee_id = irp5s.employee_id),
    (SELECT(COALESCE((SELECT account_number FROM employee_bank_details WHERE employee_bank_details.employee_id = irp5s.employee_id), ''))),
    (SELECT(COALESCE((SELECT branch_code FROM employee_bank_details WHERE employee_bank_details.employee_id = irp5s.employee_id), ''))),
    total_income,
    total_taxable_income,
    total_non_taxable_income,
    total_retirement_income,
    total_non_retirement_income,
    total_deductions,
    total_paye_on_lump_sums,
    total_medical_scheme_credit,
    total_medical_expenses,
    total_standard_income_tax,
    total_paye,
    total_tax,
    total_uif,
    total_sdl
FROM 
    irp5s;

--
-- CREATE tax_certificate_items TABLE
--

CREATE TABLE tax_certificate_items
(
    id                  SERIAL PRIMARY KEY NOT NULL,
    tax_certificate_id  INTEGER REFERENCES tax_certificates(id) NOT NULL,
    sars_code           CHAR(4) REFERENCES sars_codes(code) NOT NULL,
    clearance_number    VARCHAR NOT NULL,
    retirement_fund     BOOLEAN NOT NULL,
    amount              NUMERIC(15, 2) NOT NULL
);

--
-- INSERT the relevant data from the irp5_items TABLE into the tax_certificate_items TABLE
--

INSERT INTO tax_certificate_items
(
    tax_certificate_id,
    sars_code,
    clearance_number,
    retirement_fund,
    amount
)
SELECT 
    (SELECT tax_certificates.id FROM tax_certificates WHERE irp5_items.irp5_id = tax_certificates.legacy_id),
    sars_code,
    clearance_number,
    retirement_fund,
    amount
FROM 
    irp5_items;

--
-- DROP the legacy_id columns
--

ALTER TABLE tax_reconciliations DROP COLUMN legacy_ids;
ALTER TABLE tax_certificates DROP COLUMN legacy_id;

--
-- DROP the old irp5 tables
--

DROP TABLE irp5_items;
DROP TABLE irp5s;
DROP TABLE irp5_types;

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 15);