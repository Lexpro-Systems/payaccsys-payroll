--
-- CREATE payslip_item_unit_sources TABLE
-- 

CREATE TABLE payslip_item_unit_sources
(
    code            CHAR(4) PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL
);
INSERT INTO payslip_item_unit_sources(code, name) VALUES
('ATTE', 'Attendance Register'),
('TIME', 'Timesheet');


--
-- ADD the unit_source COLUMN to the payslip_items TABLE
--

ALTER TABLE payslip_items ADD COLUMN IF NOT EXISTS unit_source_code CHAR(4) REFERENCES payslip_item_unit_sources(code);
ALTER TABLE payslip_config_items ADD COLUMN IF NOT EXISTS unit_source_code CHAR(4) REFERENCES payslip_item_unit_sources(code);

--
-- ADD the allow_unit_source COLUMN to the payslip_item_types TABLE
--

ALTER TABLE payslip_item_types ADD COLUMN IF NOT EXISTS allow_unit_source BOOLEAN;
UPDATE payslip_item_types SET allow_unit_source = FALSE;
UPDATE payslip_item_types SET allow_unit_source = TRUE WHERE payslip_item_unit_code = 'PHOU';
ALTER TABLE payslip_item_types ALTER COLUMN allow_unit_source SET NOT NULL;

--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 20);