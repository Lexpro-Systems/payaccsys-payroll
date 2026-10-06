--
-- ADD LEAVE TYPE ITEMS TO LEAVE_ACCRUAL_TYPES TABLE
--

insert into leave_accrual_types (code,name)
values
('PPEE','Payment Period End Day End'),
('PPES','Payment Period End Day Start') ON CONFLICT DO NOTHING;;

--
-- ADD LEAVE-Payout ITEM TO Payslip_item_types TABLE
--
INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source, include_in_nett_pay) 
VALUES
(1006, 'Leave Payout', 'INCO', 'FIXE', true, true, NULL, true, false, true) ON CONFLICT DO NOTHING;;

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source, include_in_nett_pay) 
VALUES
(5008, 'Overtime (1.5)', 'INCO', 'PHOU', false, false, null, true, false, true),
(5009, 'Overtime (2.0)', 'INCO', 'PHOU', false, false, null, true, false, true) ON CONFLICT DO NOTHING;;

--
-- ADD RESET_INTERVAL & CARRY_OVER_INTERVAL COLUMN TO LEAVE_ITEM_TYPES TABLE
--

ALTER TABLE leave_type_rules
ADD COLUMN IF NOT EXISTS reset_interval integer NOT NULL DEFAULT 0
CHECK (reset_interval >= 0);

ALTER TABLE leave_type_rules
ADD COLUMN IF NOT EXISTS carry_over_interval integer NOT NULL DEFAULT 0
CHECK (carry_over_interval >= 0);

--
-- ADD Days Worked COLUMNs TO WORK_SCHEDULES TABLE
--

ALTER TABLE work_schedules
ADD COLUMN IF NOT EXISTS monday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tuesday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wednesday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS thursday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS friday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS saturday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sunday_wd BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wd_enable_leave BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 45);

