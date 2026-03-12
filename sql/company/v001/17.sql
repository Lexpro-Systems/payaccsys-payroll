--
--  Add the payslip id to the leave TABLE and position it next to the leave_source_type-code COLUMN
--

ALTER TABLE leave ADD COLUMN IF NOT EXISTS payslip_id INTEGER REFERENCES payslips(id);

ALTER TABLE leave RENAME COLUMN process_time TO old_process_time;
ALTER TABLE leave ADD COLUMN IF NOT EXISTS process_time TIMESTAMP WITHOUT TIME ZONE;
UPDATE leave SET process_time = old_process_time;
ALTER TABLE leave ALTER COLUMN process_time SET NOT NULL;
ALTER TABLE leave DROP COLUMN IF EXISTS old_process_time;

ALTER TABLE leave RENAME COLUMN added_by_user_id TO old_added_by_user_id;
ALTER TABLE leave ADD COLUMN IF NOT EXISTS added_by_user_id INTEGER;
UPDATE leave SET added_by_user_id = old_added_by_user_id;
ALTER TABLE leave DROP COLUMN IF EXISTS old_added_by_user_id;


-- 
-- UPDATE the payslip id's in the leave TABLE with the historical data
--

UPDATE 
    leave 
SET 
    payslip_id = payslips.id 
FROM 
    payslips 
WHERE 
    leave.leave_source_type_code = 'PAYS' AND
    leave.employee_id = payslips.employee_id AND
    leave.date >= payslips.from_date AND
    leave.date <= payslips.to_date;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 17);