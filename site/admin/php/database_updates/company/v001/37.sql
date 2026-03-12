
--
-- INSERT additional income payslip item types
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
    '1005',         -- code
    'Overtime',     -- name
    'INCO',         -- payslip_category_code
    'PHOU',         -- payslip_item_unit_code
    FALSE,          -- is_once_off
    FALSE,          -- auto_calculate
    NULL,           -- default_amount
    TRUE,           -- is_enabled
    FALSE,          -- allow_unit_source
    TRUE            -- include_in_nett_pay
) 
ON CONFLICT (code) DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 37);