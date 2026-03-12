--
-- ADD OTHER DEDUCTIONS PAYSLIP ITEM TYPE
--

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled) VALUES
('2004', 'Other Deduction', 'DEDU', 'FIXE', FALSE, FALSE, NULL, TRUE);


--
-- ADD leave_types.is_deleted COLUMN
--

ALTER TABLE leave_types ADD COLUMN is_deleted BOOLEAN;
UPDATE leave_types SET is_deleted = FALSE;
ALTER TABLE leave_types ALTER COLUMN is_deleted SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 4);