
--
-- INSERT additional allowance payslip item types
--

INSERT INTO payslip_item_types (
    code, 
    name, 
    payslip_category_code, 
    payslip_item_unit_code, 
    is_once_off, 
    auto_calculate, 
    default_amount, 
    is_enabled, 
    allow_unit_source, 
    include_in_nett_pay
) 
VALUES (
    '5006',                           -- code
    'Other Allowances (Taxable)',     -- name
    'ALLO',                           -- payslip_category_code
    'FIXE',                           -- payslip_item_unit_code
    FALSE,                            -- is_once_off
    FALSE,                            -- auto_calculate
    NULL,                             -- default_amount
    TRUE,                             -- is_enabled
    FALSE,                            -- allow_unit_source
    TRUE                              -- include_in_nett_pay
) 
ON CONFLICT (code) DO NOTHING;

INSERT INTO payslip_item_types (
    code, 
    name, 
    payslip_category_code, 
    payslip_item_unit_code, 
    is_once_off, 
    auto_calculate, 
    default_amount, 
    is_enabled, 
    allow_unit_source, 
    include_in_nett_pay
) 
VALUES (
    '5007',                             -- code
    'Other Allowances (Non-Taxable)',   -- name
    'ALLO',                             -- payslip_category_code
    'FIXE',                             -- payslip_item_unit_code
    FALSE,                              -- is_once_off
    FALSE,                              -- auto_calculate
    NULL,                               -- default_amount
    TRUE,                               -- is_enabled
    FALSE,                              -- allow_unit_source
    TRUE                                -- include_in_nett_pay
) 
ON CONFLICT (code) DO NOTHING;


--
-- UPDATE name of uniform allowance to indicate that it is non-taxable
--

UPDATE payslip_item_types SET name = 'Uniform Allowance (Non-Taxbale)' WHERE code = '5003';


--
-- UPDATE SARS code to ensure code 3714 reflects correctly on the IRP5 certificate
--

UPDATE sars_codes SET profit_loss = 'P' WHERE code = '3714';


--
-- ADD visitor_attendance.is_deleted COLUMN
--

ALTER TABLE visitor_attendance ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
UPDATE visitor_attendance SET is_deleted = FALSE;
ALTER TABLE visitor_attendance ALTER COLUMN is_deleted SET NOT NULL;


--
-- ADD employee_attendance.is_deleted COLUMN
--

ALTER TABLE employee_attendance ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
UPDATE employee_attendance SET is_deleted = FALSE;
ALTER TABLE employee_attendance ALTER COLUMN is_deleted SET NOT NULL;


--
-- ADD tax_reconciliations.is_deleted COLUMN
--

ALTER TABLE tax_reconciliations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN;
UPDATE tax_reconciliations SET is_deleted = FALSE;
ALTER TABLE tax_reconciliations ALTER COLUMN is_deleted SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 38);