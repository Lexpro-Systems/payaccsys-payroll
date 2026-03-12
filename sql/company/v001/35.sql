--
-- ADD TABLE FOR EXPORTING UIF ELECTRONIC DECLARATIONS
--

CREATE TABLE uif_electronic_declartion_history
(
    id                              SERIAL PRIMARY KEY NOT NULL,
    file_number                     INTEGER UNIQUE NOT NULL,
    payroll_year                    INTEGER NOT NULL,
    payroll_month                   INTEGER NOT NULL,
    payrun_id                       INTEGER REFERENCES payruns(id),
    start_date                      DATE NOT NULL,
    end_date                        DATE NOT NULL,
    exported_on                     TIMESTAMP NOT NULL,
    exported_by_user_type_code      CHAR(4) REFERENCES user_types(code) NOT NULL,
    exported_by_user_id             INTEGER NOT NULL
);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 35);