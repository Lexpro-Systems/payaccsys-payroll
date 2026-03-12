-- INSERT values into config for sending birthday notifications and emailing payslips
INSERT INTO config (name, value) VALUES('send_birthday_notifications', 'no');
INSERT INTO config (name, value) VALUES('email_payslips_on_payrun_process', 'yes');

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 18);