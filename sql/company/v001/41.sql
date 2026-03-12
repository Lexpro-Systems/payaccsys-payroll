--
-- ADD THE calculate_taxable_benefit COLUMN TO THE loans TABLE
--

ALTER TABLE loans ADD COLUMN IF NOT EXISTS calculate_taxable_benefit BOOLEAN;
UPDATE loans SET calculate_taxable_benefit = TRUE;
ALTER TABLE loans ALTER COLUMN calculate_taxable_benefit SET NOT NULL;


--
-- UPDATE THE name OF THE 'Low Interest or Interest Free Loans' PAYSLIP ITEM
--

UPDATE payslip_item_types SET name = 'Low Interest or Interest Free Loan Taxable Benefit' WHERE code = '4004';


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 41);