--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD ADDITIONAL USER RIGHT TYPES
--

INSERT INTO user_right_types (code, name) VALUES
('APPO', 'Access Payroll Portal'),
('AAPO', 'Access Attendance Portal');


--
-- ADD user_company_invitation_rights TABLE
--

CREATE TABLE user_company_invitation_rights
(
	id				SERIAL PRIMARY KEY NOT NULL,
	user_company_invitation_id	INTEGER REFERENCES user_company_invitations(id) NOT NULL,
	user_right_code			CHAR(4) REFERENCES user_right_types(code) NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 4);
