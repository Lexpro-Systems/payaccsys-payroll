--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEME
--

SET search_path TO system;


--
-- CREATE database_version TABLE
--

CREATE TABLE database_updates
(
	id			SERIAL PRIMARY KEY NOT NULL,
	major_version		INTEGER NOT NULL,
	minor_version		INTEGER NOT NULL,
	timestamp		TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),

	UNIQUE(major_version, minor_version)
);


--
-- CREATE USER RELATED TABLES
--

-- Create users table
CREATE TABLE users
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	email_address		VARCHAR NOT NULL,
	password		VARCHAR NOT NULL,
	cell_number		VARCHAR NOT NULL,
	is_active		BOOLEAN NOT NULL,
	last_login		TIMESTAMP WITHOUT TIME ZONE,
	created_on		DATE NOT NULL
);

-- Create case insensitive unique constraint on users table
CREATE UNIQUE INDEX users_email_address_lower_idx ON users(LOWER(email_address));

-- Create user_right_types table
CREATE TABLE user_right_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);
INSERT INTO user_right_types (code, name) VALUES
('AUSE', 'Add User'),
('RUSE', 'Remove User');

-- Create user reset password table
CREATE TABLE user_reset_passwords
(
	id			SERIAL PRIMARY KEY NOT NULL,
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	email_address		VARCHAR NOT NULL,
	verification_code	VARCHAR NOT NULL,
	timestamp 		TIMESTAMP WITHOUT TIME ZONE
);


--
-- CREATE COMPANY RELATED TABLES
--

-- Create companies table
CREATE TABLE companies
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR UNIQUE NOT NULL,
	alias			VARCHAR NOT NULL,
	contact_person		VARCHAR NOT NULL,
	contact_number		VARCHAR NOT NULL,
	contact_email		VARCHAR NOT NULL,
	database_name		VARCHAR NOT NULL,
	database_schema		VARCHAR NOT NULL,
	database_host		VARCHAR NOT NULL,
	is_active		BOOLEAN NOT NULL,
	owner_user_id		INTEGER REFERENCES users(id) NOT NULL,
	created_on		DATE NOT NULL
);

-- Create user_company_access table
CREATE TABLE user_company_access
(
	id			SERIAL PRIMARY KEY NOT NULL,
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	company_id		INTEGER REFERENCES companies(id) NOT NULL,
	is_default		BOOLEAN NOT NULL,
	granted_by_user_id	INTEGER REFERENCES users(id) NOT NULL,
	granted_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL,

	UNIQUE (user_id, company_id)
);

-- Create user_campany_rights
CREATE TABLE user_company_rights
(
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	company_id		INTEGER REFERENCES companies(id) NOT NULL,
	user_right_code		CHAR(4) REFERENCES user_right_types(code) NOT NULL,
	
	PRIMARY KEY (user_id, company_id, user_right_code)
);

-- Create user_company_invatition_status_types table
CREATE TABLE user_company_invitation_status_types 
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);
INSERT INTO user_company_invitation_status_types VALUES
('PEND', 'Pending'),
('DECL', 'Declined'),
('ACCE', 'Accepted');

-- Create user_campany_invitations table
CREATE TABLE user_company_invitations
(
	id			SERIAL PRIMARY KEY NOT NULL,
	code			VARCHAR UNIQUE NOT NULL,
	company_id		INTEGER REFERENCES companies(id) NOT NULL,
	invitee_email_address	VARCHAR NOT NULL,
	invitee_name		VARCHAR NOT NULL,
	sent_by_user_id		INTEGER REFERENCES users(id) NOT NULL,
	sent_on			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	expires_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	status_code		CHAR(4) REFERENCES user_company_invitation_status_types(code) NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 1);
