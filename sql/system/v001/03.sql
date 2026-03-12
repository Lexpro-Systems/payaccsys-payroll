--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD users.is_admin COLUMN
--

-- Store affected columns
CREATE TEMPORARY TABLE temp_users
(
	user_id			INTEGER NOT NULL,
	is_active		BOOLEAN,
	last_login		TIMESTAMP WITHOUT TIME ZONE,
	created_on		DATE
);
INSERT INTO temp_users (user_id, is_active, last_login, created_on)
SELECT id, is_active, last_login, created_on FROM users;

-- Drop columns
ALTER TABLE users DROP COLUMN is_active;
ALTER TABLE users DROP COLUMN last_login;
ALTER TABLE users DROP COLUMN created_on;

-- Add is_admin column
ALTER TABLE users ADD COLUMN is_admin BOOLEAN;
UPDATE users SET is_admin = FALSE;
ALTER TABLE users ALTER COLUMN is_admin SET NOT NULL;

-- Add dropped columns
ALTER TABLE users ALTER COLUMN is_admin SET NOT NULL;
ALTER TABLE users ADD COLUMN is_active BOOLEAN;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN created_on DATE;

-- Restore data for dropped columns
UPDATE users SET is_active = temp_users.is_active, last_login = temp_users.last_login, created_on = temp_users.created_on
FROM temp_users
WHERE users.id = temp_users.user_id;

-- Restore NOT NULL constraints.
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_on SET NOT NULL;


--
-- CREATE consultants TABLE
--

CREATE TABLE consultants
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	email_address		VARCHAR NOT NULL,
	tel_number		VARCHAR NOT NULL,
	cell_number		VARCHAR NOT NULL
);


--
-- ADD companies.consultant_id COLUMN
--

ALTER TABLE companies ADD COLUMN consultant_id INTEGER REFERENCES consultants(id);


--
-- ADD user_messages TABLE
--

CREATE TABLE user_messages
(
	id			SERIAL PRIMARY KEY NOT NULL,
	number			INTEGER NOT NULL,
	description		VARCHAR NOT NULL
);
INSERT INTO user_messages(number, description) VALUES
(1, 'Main Menu Tutorial'),
(2, 'User Menu Tutorial'),
(3, 'Options Menu Tutorial');

CREATE TABLE user_messages_read
(
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	user_message_id		INTEGER REFERENCES user_messages(id) NOT NULL
);
CREATE INDEX user_messages_read_user_id_idx ON user_messages_read(user_id);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 3);
