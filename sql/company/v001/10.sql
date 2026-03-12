--
-- ADD ACCOUNTING EXPORT LOG TABLES
--

CREATE TABLE accounting_export_history
(
	id			SERIAL PRIMARY KEY NOT NULL,
	accounting_vendor_id	INTEGER REFERENCES accounting_vendors(id) NOT NULL,
	payrun_id		INTEGER REFERENCES payruns(id) NOT NULL,
	exported_on		TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	exported_by_user_id	INTEGER NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 10);