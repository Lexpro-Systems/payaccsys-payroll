-- DELETE FROM payslip_items WHERE payslip_item_type_code = '4008' OR payslip_item_type_code = '4009' OR payslip_item_type_code = '4010' OR payslip_item_type_code = '4011';
-- DELETE FROM payslip_config_items WHERE payslip_item_type_code = '4008' OR payslip_item_type_code = '4009' OR payslip_item_type_code = '4010' OR payslip_item_type_code = '4011';
-- DELETE FROM payslip_item_types WHERE code = '4008' OR code = '4009' OR code = '4010' OR code = '4011';


--
-- INSERT additional fringe benefit payslip item types
--

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source, include_in_nett_pay) VALUES
    ('4008', 'Non-taxable Bursaries (Basic Education)',   'FBEN', 'FIXE', TRUE, FALSE, NULL, TRUE, FALSE, FALSE), 
    ('4009', 'Non-taxable Bursaries (Further Education)', 'FBEN', 'FIXE', TRUE, FALSE, NULL, TRUE, FALSE, FALSE) ON CONFLICT (code) DO NOTHING;


--
-- UPDATE THE profit_loss COLUMN IN THE sars_codes TABLE FOR CODE 3820
--

UPDATE sars_codes SET profit_loss = 'P' WHERE code = '3703';
UPDATE sars_codes SET profit_loss = 'P' WHERE code = '3815';
UPDATE sars_codes SET profit_loss = 'P' WHERE code = '3820';


--
-- FIX THE total_taxable_income COLUMN IN THE tax_certificates TABLE
--

UPDATE tax_certificates SET total_taxable_income = (total_income - total_non_taxable_income) WHERE total_taxable_income = 0.00 AND total_income > 0.00;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 31);