
--
-- ADD OVERTIME ITEM TO Payslip_item_types TABLE
--

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS bwee_custom_pped DATE,
ADD COLUMN IF NOT EXISTS bwee_custom_payment_day DATE;


ALTER TABLE employees
ADD COLUMN IF NOT EXISTS first_period_start INT,
ADD COLUMN IF NOT EXISTS first_period_end INT,
ADD COLUMN IF NOT EXISTS first_period_payment_day INT,
ADD COLUMN IF NOT EXISTS second_period_start INT,
ADD COLUMN IF NOT EXISTS second_period_end INT,
ADD COLUMN IF NOT EXISTS second_period_payment_day INT;

ALTER TABLE work_schedules
ADD COLUMN IF NOT EXISTS department_id INT;

ALTER TABLE work_schedules
ALTER COLUMN employee_id DROP NOT NULL;

-- INSERT section
insert into payment_period_types (code, name) values ('TWMO', 'Twice Monthly') ON CONFLICT DO NOTHING;;

insert into financial_institutions (code, name) values ('ZMUK', 'Zero Mukuru') ON CONFLICT DO NOTHING;;

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 47);