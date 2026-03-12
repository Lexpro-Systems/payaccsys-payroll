--
-- MAKE SURE WE ARE MAKING CHANGES TO THE SYSTEM SCHEMA
--

SET search_path TO system;


--
-- CREATE A STORED FUNCTION THAT WILL CREATE OR REPLACE A VIEW FOR PAYRUN STATISTICS FOR EACH COMPANY
--

CREATE OR REPLACE FUNCTION refresh_company_payrun_statistics_view() RETURNS void AS $$
DECLARE
  schema RECORD;
  result RECORD;
  sql TEXT := '';
BEGIN
  FOR schema IN EXECUTE (
    'SELECT companies.id AS company_id, companies.database_schema FROM system.companies'
  )
  LOOP
    sql := sql || format('SELECT %s AS company_id, MAX(payruns.created_on) AS last_payrun, COUNT(payruns.created_on) AS total_payruns FROM %I.payruns UNION ALL ', schema.company_id, schema.database_schema);
  END LOOP;

  EXECUTE
    format('CREATE OR REPLACE VIEW %I AS ', 'company_payrun_statistics') || left(sql, -11);
END
$$ LANGUAGE plpgsql;


--
-- UPDATE DATABASE VERSION
--

INSERT INTO database_updates (major_version, minor_version) VALUES (1, 16);