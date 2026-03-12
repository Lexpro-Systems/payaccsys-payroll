--
-- ADD time_in_logged_at, time_out_logged_at
--

ALTER TABLE visitor_attendance ADD COLUMN time_in_logged_at TIMESTAMP;
ALTER TABLE visitor_attendance ADD COLUMN time_out_logged_at TIMESTAMP;
UPDATE visitor_attendance SET time_in_logged_at = time_in, time_out_logged_at = time_out;
ALTER TABLE visitor_attendance ALTER COLUMN time_in_logged_at SET NOT NULL;

ALTER TABLE employee_attendance ADD COLUMN time_in_logged_at TIMESTAMP;
ALTER TABLE employee_attendance ADD COLUMN time_out_logged_at TIMESTAMP;
UPDATE employee_attendance SET time_in_logged_at = time_in, time_out_logged_at = time_out;
ALTER TABLE employee_attendance ALTER COLUMN time_in_logged_at SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 7);