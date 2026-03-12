--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD an employee limit to the companies TABLE
--

ALTER TABLE companies ADD COLUMN IF NOT EXISTS employee_limit INTEGER;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 13);