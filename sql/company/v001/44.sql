

--
-- ADD OTHER DEDUCTIONS PAYSLIP ITEM TYPE
--

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source, include_in_nett_pay) VALUES
(2009, 'PAYE OD Credit Balance', 'DEDU', 'FIXE', false, false, NULL, true, false, false) ON CONFLICT DO NOTHING;;
INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source, include_in_nett_pay) VALUES
(2010, 'PAYE OD Debit', 'DEDU', 'FIXE', false, false, NULL, true, false, false) ON CONFLICT DO NOTHING;;


--
-- ADD payslips.is_encrypted COLUMN
--

ALTER TABLE payslips ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 44);