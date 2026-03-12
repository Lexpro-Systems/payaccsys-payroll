--
-- FIX THE LEAVE REQUEST APPROVED STATUS
--

INSERT INTO leave_request_status( code, name) VALUES( 'APPR', 'Approved' ) ON CONFLICT DO NOTHING;
UPDATE leave_requests SET leave_request_status_code = 'APPR' WHERE leave_request_status_code = 'ACCE';
DELETE FROM leave_request_status WHERE code = 'ACCE';


--
-- ADD A COLUMN To THE LEAVE REQUESTS TABLE ALLOWING THE USER TO EXPLAIN THE REASON FOR THE STATUS CHANGE
--

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS status_update_message VARCHAR;


--
-- ADD A CONFIG ITEM FOR THE EMAIL OF THE PERSON ADMINISTRATING LEAVE REQUESTS
--

INSERT INTO config (name, value) VALUES('leave_request_admin_email_address', '') ON CONFLICT DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 23);