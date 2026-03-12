--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


-- Add the employee alias to the employee profiles table
ALTER TABLE employee_profiles ADD COLUMN alias VARCHAR;
UPDATE employee_profiles SET alias = '';
ALTER TABLE employee_profiles ALTER COLUMN alias SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 11);