--
-- CREATE loan_agreement_templates TABLE
--

CREATE TABLE loan_agreement_templates
(
    id              SERIAL PRIMARY KEY NOT NULL,
    name            VARCHAR NOT NULL,
    description     VARCHAR NOT NULL,
    enabled         BOOLEAN NOT NULL
);
INSERT INTO loan_agreement_templates (name, description, enabled) VALUES
('default', 'Default', TRUE);


--
-- CREATE loan_agreement_template_config TABLE
--

CREATE TABLE loan_agreement_template_config
(
    id                          SERIAL PRIMARY KEY NOT NULL,
    loan_agreement_template_id  INTEGER REFERENCES loan_agreement_templates(id) NOT NULL,
    name                        VARCHAR NOT NULL,
    value                       VARCHAR NOT NULL
);


--
-- UPDATE CONFIG
--

INSERT INTO config (name, value) VALUES
('loan_agreement_template', 'default');


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 19);