--
-- ADD payment_period_end_day COLUMN TO employees TABLE
--

-- Add the column
ALTER TABLE employees ADD COLUMN payment_period_end_day INTEGER;

-- Update the column so that it is the same as payment_day
UPDATE employees SET payment_period_end_day = payment_day;


--
-- CHANGE payslips.payment_day COLUMN TO payslips.payment_period_end_day
--

ALTER TABLE payslips RENAME payment_day TO payment_period_end_day;


--
-- SET UIF AND SDL ITEM TYPES TO USE FIXED AMOUNTS RATHER THAN PERCENTAGE
--

UPDATE payslip_item_types SET payslip_item_unit_code = 'FIXE' WHERE code = '2002' OR code = '3001' OR code = '3002';


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 11);