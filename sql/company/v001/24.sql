--
-- INSERT additional fringe benefit payslip item types
--

INSERT INTO payslip_item_types (code, name, payslip_category_code, payslip_item_unit_code, is_once_off, auto_calculate, default_amount, is_enabled, allow_unit_source) VALUES
    ('4005', 'General Fringe Benefits', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE, FALSE),
    ('4006', 'Right Of Use Of Motor Vehicle', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE, FALSE),
    ('4007', 'Free Or Cheap Accommodation', 'FBEN', 'FIXE', FALSE, FALSE, NULL, TRUE, FALSE) ON CONFLICT (code) DO NOTHING;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 24);