--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD new_company_requests TABLE
--

CREATE TABLE new_company_requests
(
	id				SERIAL PRIMARY KEY NOT NULL,
	company_name			VARCHAR NOT NULL,
	company_alias			VARCHAR NOT NULL,
	physical_address_line_1		VARCHAR NOT NULL,
	physical_address_line_2		VARCHAR NOT NULL,
	physical_address_line_3		VARCHAR NOT NULL,
	physical_address_code		VARCHAR NOT NULL,
	postal_address_line_1		VARCHAR NOT NULL,
	postal_address_line_2		VARCHAR NOT NULL,
	postal_address_line_3		VARCHAR NOT NULL,
	postal_address_code		VARCHAR NOT NULL,
	company_contact_person		VARCHAR NOT NULL,
	company_phone_number		VARCHAR NOT NULL,
	company_email_address		VARCHAR NOT NULL,
	user_name			VARCHAR NOT NULL,
	user_phone_number		VARCHAR NOT NULL,
	user_email_address		VARCHAR NOT NULL,
	created_on			TIMESTAMP WITHOUT TIME ZONE,
	processed_on			TIMESTAMP WITHOUT TIME ZONE
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 8);
