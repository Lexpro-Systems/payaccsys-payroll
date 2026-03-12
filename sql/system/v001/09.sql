--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD user_quicklogin_tokens TABLE
--

CREATE TABLE user_quickaccess_tokens
(
	id			SERIAL PRIMARY KEY NOT NULL,
	company_id		INTEGER REFERENCES companies(id) NOT NULL,
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	token			VARCHAR UNIQUE NOT NULL,
	created_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	expires_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	used			BOOLEAN NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 9);
