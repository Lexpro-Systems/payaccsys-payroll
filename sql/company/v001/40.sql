--
-- ADJUST THE PAYMENT PERIOD END DAY FOR BI-WEEKLY PAYMENTS
--

UPDATE employees SET payment_day = (payment_day - 7) WHERE (payment_period_code = 'BWEE') AND (payment_day >= 7);
UPDATE employees SET payment_period_end_day = (payment_period_end_day - 7) WHERE (payment_period_code = 'BWEE') AND (payment_period_end_day >= 7);


--
-- ADJUST THE PAYMENT PERIOD END DAY FOR BI-WEEKLY PAYMENTS
--

UPDATE payslips SET payment_period_end_day = (payment_period_end_day - 7) WHERE (payment_period_code = 'BWEE') AND (payment_period_end_day >= 7);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 40);