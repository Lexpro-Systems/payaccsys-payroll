
--
-- ADD BANK ZERO and BIDVEST BANK TO THE financial_institutions TABLE
--

INSERT INTO financial_institutions(code, name) VALUES
('ZERO', 'Bank Zero')
ON CONFLICT DO NOTHING;

INSERT INTO financial_institutions(code, name) VALUES
('BIDV', 'Bidvest')
ON CONFLICT DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 43);