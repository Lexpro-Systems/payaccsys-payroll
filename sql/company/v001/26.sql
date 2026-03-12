--
-- ALTER the date column of the public_holidays TABLE so that it is UNIQUE
-- 

ALTER TABLE public_holidays DROP CONSTRAINT IF EXISTS public_holidays_date_key;
ALTER TABLE public_holidays ADD CONSTRAINT public_holidays_date_key UNIQUE(date);


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 26);