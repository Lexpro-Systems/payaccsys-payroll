--
-- ADD employee_attendance TABLE
--

CREATE TABLE employee_attendance
(
	id			SERIAL PRIMARY KEY NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,
	time_in			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	in_logged_by_user_id	INTEGER NOT NULL,
	time_out		TIMESTAMP WITHOUT TIME ZONE,
	out_logged_by_user_id	INTEGER
);


--
-- ADD visitors TABLES
--

CREATE TABLE visitors
(
	id			SERIAL PRIMARY KEY NOT NULL,
	is_regular		BOOLEAN NOT NULL,
	name			VARCHAR NOT NULL,
	email_address		VARCHAR NOT NULL,
	cell_number		VARCHAR NOT NULL,
	vehicle_registration	VARCHAR NOT NULL
);


CREATE TABLE visitor_attendance
(
	id			SERIAL PRIMARY KEY NOT NULL,
	visitor_id		INTEGER REFERENCES visitors(id) NOT NULL,
	reason_for_visit	VARCHAR NOT NULL,
	time_in			TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	in_logged_by_user_id	INTEGER NOT NULL,
	time_out		TIMESTAMP WITHOUT TIME ZONE,
	out_logged_by_user_id	INTEGER
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 5);