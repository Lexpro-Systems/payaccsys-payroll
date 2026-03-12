--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD COLUMN FOR SETUP TO THE companies TABLE
--

ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_setup_complete BOOLEAN;
UPDATE companies SET is_setup_complete = TRUE;
ALTER TABLE companies ALTER COLUMN is_setup_complete SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 17);