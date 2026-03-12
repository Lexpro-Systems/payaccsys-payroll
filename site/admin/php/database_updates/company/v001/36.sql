--
-- ADD THE employee_id COLUMN TO THE accounting_vendor_config TABLE
--

ALTER TABLE accounting_vendor_config ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id);


--
-- ADD ACCESS BANK TO THE financial_institutions TABLE
--

INSERT INTO financial_institutions(code, name) VALUES
('ACCE', 'Access Bank')
ON CONFLICT DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 36);