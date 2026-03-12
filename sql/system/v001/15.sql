--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD THE NUMBER OF EMPLOYEES TO THE new_company_requests TABLE
--

ALTER TABLE new_company_requests ADD COLUMN IF NOT EXISTS number_of_employees INTEGER;


--
-- ADD COLUMNS FOR TRIALS TO THE companies TABLE
--

ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_trial BOOLEAN;
UPDATE companies SET is_trial = FALSE;
ALTER TABLE companies ALTER COLUMN is_trial SET NOT NULL;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_starts_on DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_expires_on DATE;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_updated_on TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_updated_by_user_id INTEGER REFERENCES users(id);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 15);