--
-- ADD THE include_in_nett_pay COLUMN TO THE payslip_items TABLE
--

ALTER TABLE payslip_items ADD COLUMN IF NOT EXISTS include_in_nett_pay BOOLEAN;
UPDATE payslip_items SET include_in_nett_pay = false;
UPDATE payslip_items SET include_in_nett_pay = true WHERE (
    ( (SELECT payslip_category_code FROM payslip_item_types WHERE payslip_item_types.code = payslip_items.payslip_item_type_code) = 'INCO' ) OR 
    ( (SELECT payslip_category_code FROM payslip_item_types WHERE payslip_item_types.code = payslip_items.payslip_item_type_code) = 'ALLO' ) 
);
ALTER TABLE payslip_items ALTER COLUMN include_in_nett_pay SET NOT NULL;


--
-- ADD THE include_in_nett_pay COLUMN TO THE payslip_config_items TABLE
--

ALTER TABLE payslip_config_items ADD COLUMN IF NOT EXISTS include_in_nett_pay BOOLEAN;
UPDATE payslip_config_items SET include_in_nett_pay = false;
UPDATE payslip_config_items SET include_in_nett_pay = true WHERE (
    ( (SELECT payslip_category_code FROM payslip_item_types WHERE payslip_item_types.code = payslip_config_items.payslip_item_type_code) = 'INCO' ) OR 
    ( (SELECT payslip_category_code FROM payslip_item_types WHERE payslip_item_types.code = payslip_config_items.payslip_item_type_code) = 'ALLO' ) 
);
ALTER TABLE payslip_config_items ALTER COLUMN include_in_nett_pay SET NOT NULL;


--
-- ADD THE include_in_nett_pay COLUMN TO THE payslip_item_types TABLE
--

ALTER TABLE payslip_item_types ADD COLUMN IF NOT EXISTS include_in_nett_pay BOOLEAN;
UPDATE payslip_item_types SET include_in_nett_pay = false;
UPDATE payslip_item_types SET include_in_nett_pay = true WHERE (
    ( payslip_category_code = 'INCO' ) OR 
    ( payslip_category_code = 'ALLO' ) 
);
ALTER TABLE payslip_item_types ALTER COLUMN include_in_nett_pay SET NOT NULL;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 30);