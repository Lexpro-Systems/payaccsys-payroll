
--
-- ADD OVERTIME ITEM TO Payslip_item_types TABLE
--

ALTER TABLE xrttestingstation.employees
ADD COLUMN IF NOT EXISTS bwee_custom_pped DATE,
ADD COLUMN IF NOT EXISTS bwee_custom_payment_day DATE;


ALTER TABLE xrttestingstation.employees
ADD COLUMN IF NOT EXISTS first_period_start INT,
ADD COLUMN IF NOT EXISTS first_period_end INT,
ADD COLUMN IF NOT EXISTS first_period_payment_day INT,
ADD COLUMN IF NOT EXISTS second_period_start INT,
ADD COLUMN IF NOT EXISTS second_period_end INT,
ADD COLUMN IF NOT EXISTS second_period_payment_day INT;

-- INSERT section
insert into xrttestingstation.payment_period_types (code, name) values ('TWMO', 'Twice Monthly') ON CONFLICT DO NOTHING;;

insert into xrttestingstation.financial_institutions (code, name) values ('ZMUK', 'Zero Mukuru') ON CONFLICT DO NOTHING;;

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 46);