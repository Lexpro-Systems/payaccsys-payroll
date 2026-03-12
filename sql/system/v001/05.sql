--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- ADD admin_groups TABLE
--

CREATE TABLE admin_groups
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL
);


--
-- ADD admin_group_users TABLE
--

CREATE TABLE admin_group_users
(
	id			SERIAL PRIMARY KEY NOT NULL,
	admin_group_id		INTEGER REFERENCES admin_groups(id) NOT NULL,
	user_id			INTEGER REFERENCES users(id) NOT NULL,

	UNIQUE(admin_group_id, user_id)
);


--
-- CREATE admin_group_companies TABLE
--

CREATE TABLE admin_group_companies
(
	id			SERIAL PRIMARY KEY NOT NULL,
	admin_group_id		INTEGER REFERENCES admin_groups(id) NOT NULL,
	company_id		INTEGER REFERENCES companies(id) NOT NULL,

	UNIQUE(admin_group_id, company_id)
);


--
-- CREATE sql_servers TABLE
--

CREATE TABLE sql_servers
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name			VARCHAR NOT NULL,
	database_host		VARCHAR NOT NULL,
	database_name		VARCHAR NOT NULL,
	enabled			BOOLEAN NOT NULL,
	is_default		BOOLEAN NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 5);
