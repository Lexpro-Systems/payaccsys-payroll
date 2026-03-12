
--
-- ADD DISCOVERY BANK TO THE financial_institutions TABLE
--

INSERT INTO financial_institutions(code, name) VALUES
('DISC', 'Discovery')
ON CONFLICT DO NOTHING;

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 33);