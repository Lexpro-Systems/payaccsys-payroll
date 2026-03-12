--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- CREATE platform_types TABLE
--

CREATE TABLE platform_types
(
	code			CHAR(4) PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);
INSERT INTO platform_types (code, name) VALUES
('APPX', 'App'),
('WEBX', 'Web');


--
-- CREATE user_sessions TABLE
--

CREATE TABLE user_sessions
(
	id			BIGSERIAL PRIMARY KEY NOT NULL,
	user_id			INTEGER REFERENCES users(id) NOT NULL,
	company_id		INTEGER REFERENCES companies(id),
	platform_type_code	CHAR(4) REFERENCES platform_types(code) NOT NULL,
	device_name		VARCHAR NOT NULL,
	refresh_token		VARCHAR UNIQUE NOT NULL,
	lifetime		INTEGER NOT NULL,
	last_accessed_on	TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	created_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL
);


--
-- UPDATE user_company_access TABLE
--
-- Update the table to make provision to store revocation details.
--

ALTER TABLE user_company_access ADD COLUMN revoked BOOLEAN;
ALTER TABLE user_company_access ADD COLUMN revoked_on TIMESTAMP WITHOUT TIME ZONE;

-- Set value for revoked
UPDATE user_company_access SET revoked = FALSE;

-- Set NOT NULL constraint on revoked
ALTER TABLE user_company_access ALTER COLUMN revoked SET NOT NULL;

-- Remove unique constraint on (user_id, company_id)
ALTER TABLE user_company_access DROP CONSTRAINT user_company_access_user_id_company_id_key;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 2);
