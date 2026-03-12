--
-- ADD tags TABLE
--

CREATE TABLE tags
(
	id			SERIAL PRIMARY KEY NOT NULL,
	name		VARCHAR NOT NULL
);


--
-- ADD tag_employees TABLE
--

CREATE TABLE tag_employees
(
	id			        SERIAL PRIMARY KEY NOT NULL,
	tags_id		        INTEGER REFERENCES tags(id) NOT NULL,
	employee_id		INTEGER REFERENCES employees(id) NOT NULL,

	UNIQUE(tags_id, employee_id)
);

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 42);