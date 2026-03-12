--
-- Add a column to the leave_request_items TABLE allowing for fractions of a day
--

ALTER TABLE leave_request_items ADD COLUMN day_fraction NUMERIC(11, 6);
UPDATE leave_request_items SET day_fraction = 1;
ALTER TABLE leave_request_items ALTER COLUMN day_fraction SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 28);