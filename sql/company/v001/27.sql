--
-- ADD A COLUMN TO THE tax_certificates TABLE ALLOWING TAX CERTIFICATES TO BE ACCESSED IN THE SELF-SERVICE PORTAL
--

ALTER TABLE tax_certificates ADD COLUMN self_service_access BOOLEAN;
UPDATE tax_certificates SET self_service_access = FALSE;
ALTER TABLE tax_certificates ALTER COLUMN self_service_access SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 27);