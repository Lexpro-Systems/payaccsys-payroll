<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    System::includeFile('PayslipUtil.php');
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    
    //
    // UIF DECLARTION CONTROLLER CLASS
    //
    
    class UifDeclaration extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get the next UIF declartion file number
        //
        // Required Parameters
        //  payrunId                The id of the payrun for the report
        //  startDate               The start date for the report
        //  endDate                 The end date for the report
        //
        // Optional Parameters
        //   None
        //
        public function getFileNumber($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Save the declaration details
            $payrunId = $data['payrunId'];
            $endDate = $data['endDate'];
            
            // Was no end date specified?
            if( $payrunId != null ) {
                // Get the end date
                $sqlQuery =
                    'SELECT ' . 
                        'payruns.from_date, ' .
                        'payruns.to_date ' .
                    'FROM ' . 
                        'payruns '.
                    'WHERE ' . 
                        'payruns.id = $1; ';
                $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                // If we did not find precisely on row then there was an error
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Payrun not found']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $endDate = $sqlRow['to_date'];
            }
            
            // Use current month and year as default
            $payrollYear = date('Y');
            $payrollMonth = date('m');
            
            // Was an end date found?
            if( $endDate !== null ) {
                // Calculate the year and month from the end date
                $payrollYear = substr($endDate, 0, 4);
                $payrollMonth = substr($endDate, 5, 2);
            }
            
            
            //
            // BUILD QUERY
            //
            
            // Try to get the export histroy for the specified declaration period
            $sqlQuery =
                'SELECT ' . 
                    'uif_electronic_declartion_history.file_number, ' .
                    'uif_electronic_declartion_history.exported_on ' .
                'FROM ' . 
                    'uif_electronic_declartion_history '.
                'WHERE ' . 
                    'uif_electronic_declartion_history.payroll_year = $1 AND ' .
                    'uif_electronic_declartion_history.payroll_month = $2 ' . 
                'ORDER BY ' . 
                    'uif_electronic_declartion_history.exported_on DESC ' . 
                'LIMIT 1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $payrollYear,
                $payrollMonth
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the decalrtion exported before?
            $fileNumber = null;
            $exportedOn = null;
            if( $sqlResult->getRowCount() === 1 ) {
                // Get the declartion number
                $sqlRow = $sqlResult->fetchAssociative();
                $fileNumber = $sqlRow['file_number'];
                $exportedOn = $sqlRow['exported_on'];
            }
            
            // Was no declartion found?
            if( $fileNumber === null ) {
                // Get a unique number
                $sqlQuery = 'SELECT MAX(uif_electronic_declartion_history.file_number) AS file_number FROM uif_electronic_declartion_history;';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['file_number'] !== null ) {
                    $fileNumber = (int)$sqlRow['file_number'] + 1;
                }
                else {
                    $fileNumber = 1;
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'fileNumber' => $fileNumber, 'exportedOn' => $exportedOn]) );
            return true;
        }
        
        // Function to check the UIF declaration export
        //
        // Required Parameters
        //  payrunId                The id of the payrun for the report
        //  startDate               The start date for the report
        //  endDate                 The end date for the report
        //
        // Optional Parameters
        //   None
        //
        public function validate($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'fileNumber' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $filterClause = '';
            $filterCount = 0;
            $filterValues = [];
            
            $payrunId = $data['payrunId'];
            $startDate = $data['startDate'];
            $endDate = $data['endDate'];
            
            // Check if the file number is valid
            $fileNumber = $data['fileNumber'];
            if( ((int)$fileNumber < 0) || ((int)$fileNumber > 999) ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid file number. File number must be in the range of 1 to 999.']) );
                return false;
            }
            
            // Was no end date specified?
            if( $payrunId != null ) {
                // Get the end date
                $sqlQuery =
                    'SELECT ' . 
                        'payruns.from_date, ' .
                        'payruns.to_date ' .
                    'FROM ' . 
                        'payruns '.
                    'WHERE ' . 
                        'payruns.id = $1; ';
                $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                // If we did not find precisely on row then there was an error
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Payrun not found']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $startDate = $sqlRow['from_date'];
                $endDate = $sqlRow['to_date'];
            }
            
            // Use current month and year as default
            $payrollYear = date('Y');
            $payrollMonth = date('m');
            
            // Was an end date found?
            if( $endDate !== null ) {
                // Calculate the year and month from the end date
                $payrollYear = substr($endDate, 0, 4);
                $payrollMonth = substr($endDate, 5, 2);
            }
            
            
            //
            // GET REQUIRED COMPANY UIF DETAILS
            //
            
            // Get information required for creator record from the database
            $sqlQuery =
                'SELECT ' . 
                    'company_details.id, ' .
                    'company_details.name, ' .
                    'company_details.alias, ' .
                    'company_details.registration_number, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.postal_address_line_1, ' .
                    'company_details.postal_address_line_2, ' .
                    'company_details.postal_address_line_3, ' .
                    'company_details.postal_address_code, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.uif_registration_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.sars_contact_first_name, ' .
                    'company_details.sars_contact_last_name, ' .
                    'company_details.sars_contact_email_address, ' .
                    'company_details.sars_contact_business_number, ' .
                    'company_details.sars_contact_cell_number, ' .
                    'company_details.uif_contact_person, ' .
                    'company_details.uif_contact_email_address, ' .
                    'company_details.uif_contact_number, ' .
                    'company_details.tel_number, ' .
                    'company_details.fax_number, ' .
                    'company_details.email_address, ' .
                    'countries.name AS physical_address_country_name, ' .
                    'eti_status_types.name AS eti_status_name, ' .
                    'special_economic_zones.name AS special_economic_zone_name, ' .
                    'sic_codes.name AS sic_name ' .
                'FROM ' . 
                    'company_details '.
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'LEFT JOIN ' .
                    'eti_status_types ON eti_status_types.code = company_details.eti_status_code ' .
                'LEFT JOIN ' .
                    'special_economic_zones ON special_economic_zones.code = company_details.special_economic_zone_code ' .
                'LEFT JOIN ' .
                    'sic_codes ON sic_codes.code = company_details.sic_code ' .
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add details to the company array
            $sqlRow = $sqlResult->fetchAssociative();
            $company = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'alias' => $sqlRow['alias'],
                'registrationNumber' => $sqlRow['registration_number'],
                'physicalAddressUnit' => $sqlRow['physical_address_unit'],
                'physicalAddressComplex' => $sqlRow['physical_address_complex'],
                'physicalAddressStreet' => $sqlRow['physical_address_street'],
                'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                'physicalAddressCity' => $sqlRow['physical_address_city'],
                'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                'physicalAddressCountryCode' => $sqlRow['physical_address_country_code'],
                'physicalAddressCountryName' => $sqlRow['physical_address_country_name'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'telNumber' => $sqlRow['tel_number'],
                'faxNumber' => $sqlRow['fax_number'],
                'emailAddress' => $sqlRow['email_address'],
                'payeReferenceNumber' => $sqlRow['paye_reference_number'],
                'sdlPaymentReferenceNumber' => $sqlRow['sdl_payment_reference_number'],
                'uifPaymentReferenceNumber' => $sqlRow['uif_payment_reference_number'],
                'uifRegistrationNumber' => $sqlRow['uif_registration_number'],
                'sicCode' => $sqlRow['sic_code'],
                'sicName' => $sqlRow['sic_name'],
                'etiStatusCode' => $sqlRow['eti_status_code'],
                'etiStatusName' => $sqlRow['eti_status_name'],
                'specialEconomicZoneCode' => $sqlRow['special_economic_zone_code'],
                'specialEconomicZoneName' => $sqlRow['special_economic_zone_name'],
                'diplomaticIndemnity' => $sqlRow['diplomatic_indemnity'],
                'sarsContactFirstName' => $sqlRow['sars_contact_first_name'],
                'sarsContactLastName' => $sqlRow['sars_contact_last_name'],
                'sarsContactEmailAddress' => $sqlRow['sars_contact_email_address'],
                'sarsContactBusinessNumber' => $sqlRow['sars_contact_business_number'],
                'sarsContactCellNumber' => $sqlRow['sars_contact_cell_number'],
                'uifContactPerson' => $sqlRow['uif_contact_person'],
                'uifContactEmailAddress' => $sqlRow['uif_contact_email_address'],
                'uifContactNumber' => $sqlRow['uif_contact_number']
            ];
            
            // File format:
            
            // - A comma-delimited file layout combined with the described code structure, must be used.
            // - The file must be submitted in ASCII format.
            // - All numeric fields with decimal values (i.e. Rands and cents) must have the decimal point specified. Take note 
            //   that this is always a point and not a comma.
            // - All numeric fields with no decimal values (i.e. Rands only), must not have the decimal point specified.
            // - Alphanumeric fields must always be enclosed in double quotes (e.g. “O’Reilly”).
            // - A comma must not precede the first field of a record, and must not follow the last field of a record.
            // - Every record must be followed by a carriage return character.
            // - In all cases except for the UI Employer reference number, the leading zeros for numeric fields and the 
            //   trailing spaces for alphanumeric fields should preferably be truncated, but this is not mandatory.
            // - Negative values are allowed (the minus sign must be in the leftmost position in the field).
            // - SARS comma delimited file only: 
            //   The code and its associated field must not be included in the record if the field does not have a value. The 
            //   absence of the code and its associated field value, implies a zero or space value for the field.
            // - Simple comma delimited file only: 
            //   All the fields need to be included in the record. If a field has no value it must be included as a NULL value 
            //   i.e. (“xxxxxx”, “zzzzzz”,,1234,1,2). A space or a 0 will be regarded as a value.
            
            
            //
            // CHECK CREATOR RECORD
            //
            
            // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
            // 8000         Record Type                         Alphanumeric 4          Mandatory
            // 8010         Format Type                         Alphanumeric 2          Mandatory
            // 8015         Version No.                         Alphanumeric 3          Mandatory
            // 8020         UIF Reference Number                Alphanumeric 9          Mandatory
            // 8030         Test Live Indicator                 Alphanumeric 4          Mandatory
            // 8040         Contact Person                      Alphanumeric 30         Required
            // 8050         Contact Telephone Number            Alphanumeric 16         Required
            // 8060         Contact E-mail Address              Alphanumeric 50         Optional
            // 8070         Payroll Month                       Numeric 6               Mandatory
            
            // 8020 - UIF Reference Number
            // Each Creator must register with the Fund unless the Creator is already registered as an employer. The Registration 
            // form is available at any Department of Labour Office and must be completed and posted to the Fund at UIF/WVF, 
            // Pretoria, 0052 or e-mailed to newui8registrations@labour.gov.za
            // The UIF reference number must be a valid UIF reference number, must be zero filled from the left, and must exclude 
            // any non-numeric characters e.g. 123456/8 should be sent as 001234568. The formula to validate this number using a 
            // Check Digit routine is supplied in the appendix to this specification.
            // An invalid reference number will cause the entire file to be rejected.
            // Format the company UIF number
            $companyUifNumber = preg_replace('/[^0-9]+/', '', $company['uifRegistrationNumber']);
            if( strlen($companyUifNumber) != 8  ) {
                echo( json_encode(['ok' => false, 'error' => 'No valid company UIF registration number specified. Please update your company setup with the correct UIF number.']) );
                return false;
            }
            
            //
            // CHECK EMPLOYEE DETAIL RECORDS
            //
            
            $sqlParams = [];
            $whereClause = '';
            
            // Was either a start or end date specified?
            if( (($startDate != null) && ($startDate != '')) || (($endDate != null) && ($endDate != '')) ) {
                // Set the first part of the where clause
                $whereClause = ' WHERE ( ';
                
                // Was an end date specified?
                if( ($endDate != null) && ($endDate != '') ) {
                    if( count($sqlParams) > 0 ) $whereClause = $whereClause . ' AND ';
                    
                    $sqlParams[] = $endDate;
                    $whereClause = $whereClause . '((employees.employment_start_date <= $' . count($sqlParams) . ') AND (employees.employment_end_date IS NULL OR employees.employment_end_date <= $' . count($sqlParams) . ')) ';
                }
                
                // Was a start date specified?
                if( ($startDate != null) && ($startDate != '') ) {
                    if( count($sqlParams) > 0 ) $whereClause = $whereClause . ' AND ';
                    
                    $sqlParams[] = $startDate;
                    $whereClause = $whereClause . '(employees.employment_end_date IS NULL OR employees.employment_end_date >= $' . count($sqlParams) . ') ';
                }
                
                // Finish the where clause
                $whereClause = $whereClause . ') ';
            }
            
            // Get information required for employee records from the database
            $sqlQuery = 
                'SELECT ' .
                    'employees.id AS employee_id, ' .
                    'employees.code AS employee_code, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias AS employee_alias, ' .
                    'employees.id_number, ' .
                    'employees.email_address, ' .
                    'employees.title_code, ' . 
                    'employees.initials, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.passport_country, ' .
                    'countries.alpha_2_code AS passport_country_alpha_2_code, ' .
                    'employees.date_of_birth, ' .
                    'employees.is_asylum_seeker, ' .
                    'employees.is_refugee, ' .
                    'employees.is_retired, ' .
                    'employees.physical_address_unit, ' .
                    'employees.physical_address_complex, ' .
                    'employees.physical_address_street, ' .
                    'employees.physical_address_suburb, ' .
                    'employees.physical_address_city, ' .
                    'employees.physical_address_postal_code, ' .
                    'employees.physical_address_country_code, ' .
                    'employees.postal_same_as_physical_address, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.postal_address_country_code, ' .
                    'employees.work_same_as_company_address, ' .
                    'employees.work_address_unit, ' .
                    'employees.work_address_complex, ' .
                    'employees.work_address_street, ' .
                    'employees.work_address_suburb, ' .
                    'employees.work_address_city, ' .
                    'employees.work_address_postal_code, ' .
                    'employees.work_address_country_code, ' .
                    'employees.home_number, ' .
                    'employees.work_number, ' .
                    'employees.cell_number, ' .
                    'employees.fax_number, ' .
                    'employees.email_address, ' .
                    'employees.emergency_contact_person, ' .
                    'employees.emergency_contact_number, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.employment_position, ' .
                    'employees.department_id, ' .
                    'employees.payment_method_code, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'employees.income_tax_number, ' .
                    'employees.income_tax_directive_1, ' .
                    'employees.income_tax_directive_2, ' .
                    'employees.income_tax_directive_3, ' .
                    'employees.sic_code, ' .
                    'employees.send_payslip_by_email, ' .
                    'employees.created_on, ' .
                    'employees.created_by_user_id, ' .
                    'employees.payment_period_end_day, ' .
                    '(SELECT dismissal_reason FROM employment_history WHERE employment_history.employee_id = employees.id ORDER BY dismissal_date DESC LIMIT 1) AS dismissal_reason, ' .
                    'work_schedules.monday_hours, ' .
                    'work_schedules.tuesday_hours, ' .
                    'work_schedules.wednesday_hours, ' .
                    'work_schedules.thursday_hours, ' .
                    'work_schedules.friday_hours, ' .
                    'work_schedules.saturday_hours, ' .
                    'work_schedules.sunday_hours ' .
                'FROM ' .
                    'employees ' .
                'LEFT JOIN ' .
                    'countries ON employees.passport_country = countries.code ' .
                'LEFT JOIN ' .
                    'work_schedules ON work_schedules.employee_id = employees.id ' .
                $whereClause .
                'ORDER BY ' . 
                    'employee_alias ASC, ' . 
                    'employee_code ASC ';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $employees = [];
            $numEmployees = 0;
            $hoursWorkedTotal = 0;
            $taxableRemunerationTotal = 0;
            $uifRemunerationTotal = 0;
            $uifContributionTotal = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Get all the payslips for the employee for the given payrun
                $taxableRemuneration = 0;
                $uifRemuneration = 0;
                $uifContribution = 0;
                $totalHoursWorked = 0;
                $nonContributionReason = '';
                
                $filterClause = '';
                $filterCount = 0;
                $filterValues = [];
                
                // Count the number of employees
                $numEmployees = $numEmployees + 1;
                
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND (';
                
                // Was a payrun id specified?
                if( $data['payrunId'] !== null  ) {
                    // Setup the filter clause
                    $filterCount++;
                    $filterValues[] = $data['payrunId'];
                    $filterClause = $filterClause . '(payrun_id = $' . $filterCount . ') ';
                }
                else {
                    // Was either a start or end date specified?
                    if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                        
                        // Was a start date specified?
                        if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                            if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                            
                            $filterCount++;
                            $filterValues[] = $data['startDate'];
                            $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                        }
                        
                        // Was an end date specified?
                        if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                            if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                            
                            $filterCount++;
                            $filterValues[] = $data['endDate'];
                            $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                        }
                        
                    }
                }
                
                // Add the employee id
                if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                $filterCount++;
                $filterValues[] = $sqlRow['employee_id'];
                $filterClause = $filterClause . 'payslips.employee_id = $' . $filterCount . ' ';
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
                
                // Get the required payslips
                $payslipQuery = 
                    'SELECT ' .
                        'payslips.id, ' .
                        'payslips.period, ' .
                        'payslips.sars_year, ' .
                        'payslips.from_date, ' .
                        'payslips.to_date, ' .
                        'payslips.status_code, ' .
                        'payslip_status_codes.name AS status_name, ' .
                        'payslips.payment_period_code, ' .
                        'payslips.payment_period_end_day, ' .
                        'payslips.paye_bonus_calculation_type_code, ' .
                        'payslips.employee_id, ' .
                        'employees.first_name AS employee_first_name, ' .
                        'employees.last_name AS employee_last_name, ' .
                        'employees.alias AS employee_alias, ' .
                        'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                        'employees.employment_start_date, ' .
                        'employees.employment_end_date, ' .
                        'employees.email_address ' .
                    'FROM ' .
                        'payslips ' .
                    'LEFT JOIN ' .
                        'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                    'LEFT JOIN ' .
                        'employees ON employees.id = payslips.employee_id ' .
                    // 'LEFT JOIN ' .
                    //     'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payslips.status_code = \'ACTI\' ' .
                        $filterClause .
                        // 'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                        // '( ' .
                        //     'employees.employment_end_date IS NULL OR ' .
                        //     'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                        // ') ' .
                    'ORDER BY payslips.to_date ASC;';
                $payslipResult = $db->paramQuery($payslipQuery, $filterValues);
                if( !$payslipResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Are there no payslips for the specified employee?
                if( $payslipResult->getRowCount() <= 0 ) {
                    // Set the non-contribution reason
                    $nonContributionReason = '06';
                }
                
                // Get the payslip details
                $payslip = null;
                while( $payslipRow = $payslipResult->fetchAssociative() ) {
                    $payslip = [
                        'id' => $payslipRow['id'],
                        'statusCode' => $payslipRow['status_code'],
                        'statusName' => $payslipRow['status_name'],
                        'employee' => [
                            'id' => $payslipRow['employee_id'],
                            'name' => $payslipRow['employee_alias'],
                            'age' => $payslipRow['employee_age'],
                            'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                            'emailAddress' => $payslipRow['email_address']
                        ],
                        'taxPeriod' => [
                            'type' => $payslipRow['payment_period_code'],
                            'number' => $payslipRow['period'],
                            'taxYear' => $payslipRow['sars_year']
                        ],
                        'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                        'fromDate' => $payslipRow['from_date'],
                        'toDate' => $payslipRow['to_date'],
                        'items' => []
                    ];
                    
                    // Get all the items for the specified payslip
                    $itemQuery = 
                        'SELECT DISTINCT ' .
                            'payslip_items.id, ' .
                            'payslip_items.payslip_item_type_code, ' .
                            'payslip_item_types.payslip_item_unit_code, ' .
                            'payslip_item_types.payslip_category_code, ' .
                            'payslip_items.description, ' .
                            'payslip_items.accrual_date, ' .
                            'payslip_items.auto_calculate, ' .
                            'payslip_items.units, ' .
                            'payslip_items.rate, ' .
                            'payslip_items.total, ' .
                            'payslip_items.provident_fund_id, ' .
                            'payslip_categories AS payslip_category_name, ' .
                            'payslip_categories.code, ' .
                            'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                        'FROM ' .
                            'payslip_items ' .
                        'LEFT JOIN ' .
                            'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                        'LEFT JOIN ' .
                            'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                        'WHERE ' .
                            'payslip_items.payslip_id = $1 ' .
                        'ORDER BY ' . 
                            'custom_sort, payslip_items.description ASC, payslip_items.payslip_item_type_code ASC;';
                    $itemResult = $db->paramQuery($itemQuery, [
                        $payslipRow['id']
                    ]);
                    if( !$itemResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // For every payslip item
                    $items = [];
                    $hasCalculatedHoursWorked = false;
                    while( $itemRow = $itemResult->fetchAssociative() ) {
                        $units = $itemRow['units'];
                        if( $units !== null ) $units = doubleval($units);
                        
                        $rate = $itemRow['rate'];
                        if( $rate !== null ) $rate = doubleval($rate);
                        
                        $amount = $itemRow['total'];
                        if( $amount !== null ) $amount = doubleval($amount);
                        
                        $providentFundId = $itemRow['provident_fund_id'];
                        $employeeAmount = null;
                        $employerAmount = null;
                        $rfiItems = [];
                        
                        // Is it a provident fund item?
                        if( $providentFundId !== null ) {
                            // Load the provident fund details
                            $providentFundQuery = 
                                'SELECT ' . 
                                    'provident_funds.id, ' .
                                    'provident_funds.name, ' .
                                    'provident_funds.provident_fund_calculation_type_code, ' .
                                    'provident_funds.employee_amount, ' .
                                    'provident_funds.employer_amount, ' .
                                    'provident_funds.category_factor, ' .
                                    'provident_funds.is_active ' .
                                'FROM ' . 
                                    'provident_funds ' .
                                'LEFT JOIN ' .
                                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                                'WHERE ' . 
                                    'provident_funds.is_active IS TRUE AND ' .
                                    'provident_funds.id = $1 ' .
                                'ORDER BY ' . 
                                    'provident_funds.name ASC;';
                            $providentResult = $db->paramQuery($providentFundQuery, [$providentFundId]);
                            if( !$providentResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            
                            $providentFundRow = $providentResult->fetchAssociative();
                            $employeeAmount = doubleval( $providentFundRow['employee_amount'] );
                            $employerAmount = doubleval( $providentFundRow['employer_amount'] );
                            
                            // Is the provident fund calculation based on retirement fund income items?
                            if( $providentFundRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
                                // Get all the relevant retirement fund income items
                                $rfiItemSqlQuery =
                                    'SELECT ' . 
                                        'payslip_config_items.payslip_item_type_code, ' .
                                        'employee_rfi_items.percentage ' .
                                    'FROM ' . 
                                        'payslip_config_items ' .
                                    'LEFT JOIN ' .
                                        'employee_rfi_items ON employee_rfi_items.payslip_config_item_id = payslip_config_items.id AND ' .
                                            'employee_rfi_items.provident_fund_id = $1 ' .
                                    'WHERE ' . 
                                        'employee_rfi_items.id IS NOT NULL AND ' .
                                        'payslip_config_items.employee_id = $2;';
                                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [
                                    $providentFundId, 
                                    $sqlRow['employee_id']
                                ]);
                                if( !$rfiItemSqlResult->isValid() ) {
                                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                    return false;
                                }
                                
                                while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                                    $rfiItems[] = [
                                        'payslipItemTypeCode'  => $rfiItemSqlRow['payslip_item_type_code'],
                                        'percentage' => $rfiItemSqlRow['percentage']
                                    ];
                                }
                            }
                        }
                        
                        $items[] = [
                            'id' => $itemRow['id'],
                            'type' => [
                                'code' => $itemRow['payslip_item_type_code'],
                                'unitCode' => $itemRow['payslip_item_unit_code'],
                            ],
                            'category' => [
                                'code' => $itemRow['payslip_category_code'],
                                'name' => $itemRow['payslip_category_name']
                            ],
                            'providentFund' => [
                                'id' => $providentFundId,
                                'employeeAmount' => $employeeAmount,
                                'employerAmount' => $employerAmount,
                                'rfiItems' => $rfiItems
                            ],
                            'description' => $itemRow['description'],
                            'accrualDate' => $itemRow['accrual_date'],
                            'autoCalculate' => $itemRow['auto_calculate'],
                            'units' => $units,
                            'rate' => $rate,
                            'amount' => $amount
                        ];
                        
                        // Is it an income item that is not an annual payment?
                        if( ($itemRow['payslip_item_type_code'] < 1004) && (!$hasCalculatedHoursWorked) ) {
                            // Determine if the employee has a workschedule
                            $hasWorkSchedule = true;
                            if( ($sqlRow['sunday_hours'] == null) && ($sqlRow['monday_hours'] == null) && 
                                ($sqlRow['tuesday_hours'] == null) && ($sqlRow['wednesday_hours'] == null) && 
                                ($sqlRow['thursday_hours'] == null) && ($sqlRow['friday_hours'] == null) && 
                                ($sqlRow['saturday_hours'] == null) ) {
                                $hasWorkSchedule = false;
                            }
                            
                            // Does the employee have a work schedule?
                            $workScheduleHoursWorked = 0;
                            $workScheduleDaysWorked = 0;
                            if( $hasWorkSchedule ) {
                                // Set the start date for the work schedule calculation
                                $scheduleStartDate = $payslip['fromDate'];
                                if( ($sqlRow['employment_start_date'] > $payslip['fromDate']) ) { 
                                    $scheduleStartDate = $payslip['employment_start_date'];
                                    // $scheduleStartDate = date('Y-m-d', strtotime($scheduleStartDate . ' +1 day'));
                                }
                                
                                // Set the end date for the work schedule calculation
                                $scheduleEndDate = $payslip['toDate'];
                                if( $sqlRow['employment_end_date'] != null && ( $sqlRow['employment_end_date'] < $payslip['toDate'] ) ) { 
                                    $scheduleEndDate = $sqlRow['employment_end_date'] ;
                                }
                                
                                // Calculate hours and days worked for every day since the start date up to the end date
                                $workScheduleHoursWorked = 0;
                                $workScheduleDaysWorked = 0;
                                while( $scheduleStartDate <= $scheduleEndDate) {
                                    // Is the employee paid per day?
                                    if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                                        // Stop counting when we've reached the actual number of days worked
                                        if( $workScheduleDaysWorked >= $units ) {
                                            break;
                                        }
                                    }
                                    
                                    // Get the day of the week 
                                    $dayOfWeek = date('w', strtotime($scheduleStartDate));
                                    
                                    // Depending on the day of the week
                                    if( $dayOfWeek == 0 ) {
                                        if( $sqlRow['sunday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['sunday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 1 ) {
                                        if( $sqlRow['monday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['monday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 2 ) {
                                        if( $sqlRow['tuesday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['tuesday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 3 ) {
                                        if( $sqlRow['wednesday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['wednesday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 4 ) {
                                        if( $sqlRow['thursday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['thursday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 5 ) {
                                        if( $sqlRow['friday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['friday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 6 ) {
                                        if( $sqlRow['saturday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['saturday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    
                                    // Add one day to the start date
                                    $scheduleStartDate = date('Y-m-d', strtotime($scheduleStartDate . ' +1 day'));
                                }
                            }
                            
                            // Calculate total hours worked
                            if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                                $totalHoursWorked = $totalHoursWorked + ($units !== null ? $units : 0);
                            }
                            else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                                // Is there a workschedule?
                                if( $hasWorkSchedule ) {
                                    // Us ethe work schedule hours
                                    $totalHoursWorked = $totalHoursWorked + $workScheduleHoursWorked;
                                }
                                else {
                                    // Calculate add 8 hours for every day worked
                                    $totalHoursWorked = $totalHoursWorked + ($units !== null ? $units * 8 : 0);
                                }
                            }
                            else {
                                // Is there a workschedule?
                                if( $hasWorkSchedule ) {
                                    // Us ethe work schedule hours
                                    $totalHoursWorked = $totalHoursWorked + $workScheduleHoursWorked;
                                }
                                else {
                                    // Get the number of working days in the payslip period and add 8 hours for every day
                                    $daysWorked = \LeaveUtil\getWorkingDays($payslip['fromDate'], $payslip['toDate'], []);
                                    $totalHoursWorked = $totalHoursWorked + ($daysWorked * 8);
                                }
                            }
                            
                            // Remember that hours worked has already been calculated for this payslip (i.e. ignore further income items)
                            $hasCalculatedHoursWorked = true;
                        }
                    }
                    
                    // Was the hours worked not specified?
                    // if( $totalHoursWorked <= 0 ) {
                    //     // Get the number of working days in the payrun period
                    //     $daysWorked = \LeaveUtil\getWorkingDays(($startDate == null ? $sqlRow['employment_start_date'] : $startDate), ($endDate == null ? '' : $endDate), []);
                    //     $totalHoursWorked = $totalHoursWorked + ($daysWorked * 8);
                    // }
                    
                    // Calculate the total hours worked for all employees
                    // $hoursWorkedTotal = $hoursWorkedTotal + $totalHoursWorked;
                    
                    // Calculate the payslip totals
                    $payslip['items'] = $items;
                    $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslip );
                    $taxableRemuneration = $taxableRemuneration + $payslipTotals['taxableIncome'];
                    $uifRemuneration = $uifRemuneration + $payslipTotals['uifIncome'];
                    $uifContribution = $uifContribution + ($payslipTotals['employeeUif'] + $payslipTotals['employerUif']);
                    
                    // Determine reason for non-contribution (if not already set)
                    // 1 - Temporary employees (less than 24 hours per month)
                    // 2 - Learners in terms of the skills development act
                    // 3 - Employees in the national and provincial spheres of government
                    // 4 - Employees who are repatriated at the end of their contract of service
                    // 5 - Employees who earn commission only
                    // 6 - No income paid for the payroll period
                    if( $uifContribution <= 0 && $nonContributionReason == '' ) {
                        if( $payslipTotals['employeeUif'] + $payslipTotals['employerUif'] == 0 ) {
                            if( $payslipTotals['totalIncome'] == $payslipTotals['commissionIncome'] ) {
                                $nonContributionReason = '05';
                            }
                            else if( $totalHoursWorked < 24 ) {
                                $nonContributionReason = '01';
                            }
                            else {
                                2;
                            }
                        }
                    }
                }
                
                // Calculate the total hours worked for all employees
                $hoursWorkedTotal = $hoursWorkedTotal + $totalHoursWorked;
                
                // Caculate the totals
                $taxableRemunerationTotal = $taxableRemunerationTotal + $taxableRemuneration;
                $uifRemunerationTotal = $uifRemunerationTotal + $uifRemuneration;
                $uifContributionTotal = $uifContributionTotal + $uifContribution;
                
                // Set employment end date
                $employmentEndDate = ($sqlRow['employment_end_date'] !== null ? $sqlRow['employment_end_date'] : null);
                
                // Employment end date should only be listed if it occurs in the period of the payrun
                if( $employmentEndDate < $startDate || $employmentEndDate > $endDate ) {
                    $employmentEndDate = '';
                }
                
                // Determine employement status 
                //  
                //  2 - Deceased
                //  3 - Retired
                //  4 - Dismissed
                //  5 - Contract Expired
                //  6 - Resigned
                //  7 - Constructively Dismissed
                //  8 - Employers Insolvency
                //  9 - Maternity / Adoption leave
                //  10 - Illness leave
                //  11 - Retrenched
                //  12 - Transfer to another branch
                //  13 - Absconded
                //  14 - Business Closed
                //  15 - Death of Domestic Employer
                //  16 - Voluntary Severance Package
                //  17 - Reduced Working Time
                $employmentStatus = '01';
                if( $employmentEndDate !== '' ) {
                    $employmentStatus = '04';
                    
                    if( $sqlRow['dismissal_reason'] === 'DECE' ) {
                        $employmentStatus = '02';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'DISM' ) {
                        $employmentStatus = '04';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ENCO' ) {
                        $employmentStatus = '05';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'RESI' ) {
                        $employmentStatus = '06';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'CODI' ) {
                        $employmentStatus = '07';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'EMIN' ) {
                        $employmentStatus = '08';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ILLN' ) {
                        $employmentStatus = '10';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'RETR' ) {
                        $employmentStatus = '11';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'TRAN' ) {
                        $employmentStatus = '12';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ABSC' ) {
                        $employmentStatus = '13';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'BUCL' ) {
                        $employmentStatus = '14';
                    }
                }
                
                // Determine the title number
                $titleNumber = 5;
                if( $sqlRow['title_code'] === 'ADVO' ) {
                    $titleNumber = 1;
                }
                else if( $sqlRow['title_code'] === 'DOCT' ) {
                    $titleNumber = 2;
                }
                else if( $sqlRow['title_code'] === 'MISS' ) {
                    $titleNumber = 4;
                }
                else if( $sqlRow['title_code'] === 'MIST' ) {
                    $titleNumber = 5;
                }
                else if( $sqlRow['title_code'] === 'MISI' ) {
                    $titleNumber = 6;
                }
                else if( $sqlRow['title_code'] === 'MISX' ) {
                    $titleNumber = 7;
                }
                else if( $sqlRow['title_code'] === 'PROF' ) {
                    $titleNumber = 8;
                }
                
                // Add the employee UIF details
                $employees = [
                    'id' => $sqlRow['employee_id'],
                    'code' => $sqlRow['employee_code'],
                    'titleCode' => $sqlRow['title_code'],
                    'titleNumber' => $titleNumber,
                    'initials' => $sqlRow['initials'],
                    'initial' => substr($sqlRow['initials'], 0, 1),
                    'fullNames' => $sqlRow['full_names'],
                    'lastName' => $sqlRow['last_name'],
                    'alias' => $sqlRow['employee_alias'],
                    'idType' => ($sqlRow['id_number'] !== null && strlen($sqlRow['id_number']) > 0 ? 1 : 2),
                    'idNumber' => $sqlRow['id_number'],
                    'passportNumber' => $sqlRow['passport_number'],
                    'physicalAddressLine1' => $sqlRow['physical_address_street'],
                    'physicalAddressLine2' => $sqlRow['physical_address_unit'],
                    'physicalAddressLine3' => $sqlRow['physical_address_complex'],
                    'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                    'physicalAddressCity' => $sqlRow['physical_address_city'],
                    'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                    'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                    'postalAddressLine2' => '',
                    'postalAddressLine3' => '',
                    'postalAddressSuburb' => $sqlRow['postal_address_line_2'],
                    'postalAddressCity' => $sqlRow['postal_address_line_3'],
                    'postalAddressCode' => $sqlRow['postal_address_code'],
                    'passportCountryCode' => $sqlRow['passport_country'],
                    'passportCountryAlpha2Code' => $sqlRow['passport_country_alpha_2_code'],
                    'dateOfBirth' => $sqlRow['date_of_birth'],
                    'employmentStartDate' => $sqlRow['employment_start_date'],
                    'employmentEndDate' => $employmentEndDate,
                    'totalHoursWorked' => $totalHoursWorked,
                    'employmentStatus' => $employmentStatus,
                    'nonContributionReason' => $nonContributionReason,
                    'taxableRemuneration' => $taxableRemuneration,
                    'uifRemuneration' => $uifRemuneration,
                    'uifContribution' => $uifContribution
                ];
                
                // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
                // 8001         Record Type                         Alphanumeric 4          Mandatory
                // 8110         UIF Reference Number                Alphanumeric 9          Mandatory
                // 8200         ID Number                           Numeric 13              Required
                // 8210         Other Number                        Alphanumeric 16         Required
                // 8220         Alternate Number                    Alphanumeric 25         Required
                // 8230         Surname                             Alphanumeric 120        Required
                // 8240         First Names                         Alphanumeric 90         Required
                // 8250         Date Of Birth                       Date 8                  Required
                // 8260         Date Employed From                  Date 8                  Required
                // 8270         Date Employed To                    Date 8                  Required
                // 8280         Employment Status                   Numeric 2               Required
                // 8290         Reason for Non Contribution         Numeric 2               Required
                // 8300         Gross Taxable Remuneration          Numeric 13.2            Required
                // 8310         Remuneration subject to UIF         Numeric 13.2            Required
                // 8320         UIF Contribution                    Numeric 13.2            Required
                // 8330         Bank Branch Code                    Numeric 8               Optional
                // 8340         Bank Account Number                 Numeric 16              Optional
                // 8350         Bank Account Type                   Numeric 2               Optional
                
                // 8220 - Alternate Number
                // This field is mandatory if fields 8200 or 8210 are invalid or not present (see rules 8200 and 8210). This field should 
                // contain either the personnel, clock card or payroll number.
                // If no valid ID, Other, or Alternate number is supplied, then the record will be rejected.
                $fieldValue = '';
                if( $employees['idNumber'] !== null && strlen($employees['idNumber']) ) {
                    $fieldValue = preg_replace('/[^0-9]+/', '', $employees['idNumber']);
                    if( strlen($fieldValue) != 13  ) {
                        echo( json_encode(['ok' => false, 'error' => 'No valid employee id number specified for \"' . $employees['fullNames'] . ' ' . $employees['lastName'] . '\".']) );
                        return false;
                    }
                }
                
                // 8250 - Date Of Birth
                // This field is required for statutory reasons, and must be in CCYYMMDD format.
                $fieldValue = preg_replace('/[^0-9]+/', '', $employees['dateOfBirth']);
                if( strlen($fieldValue) != 8  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid employee birth date specified for \"' . $employees['fullNames'] . ' ' . $employees['lastName'] . '\".']) );
                    return false;
                }
                
                // 8260 - Date Employed From
                // This field is required for statutory reasons, and must be in CCYYMMDD format. The date must be the latest date that the 
                // employee started work at the employer.
                $fieldValue = preg_replace('/[^0-9]+/', '', $employees['employmentStartDate']);
                if( strlen($fieldValue) != 8  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid employee employment start date specified for \"' . $employees['fullNames'] . ' ' . $employees['lastName'] . '\".']) );
                    return false;
                }
                
                // 8270 - Date Employed To
                // This field is required for statutory reasons, and must be in CCYYMMDD format. The date required in this field is the 
                // employee’s termination of services date. This date may not exceed the last day of the following processing month, and 
                // cannot be less than the date in code 8260. If any other employment status is supplied, then the date employed to is 
                // required. Note that remuneration (and contributions) can be received after the processing month in which the contributor’s 
                // services were terminated.
                if( $employees['employmentEndDate'] != '' ) {
                    $fieldValue = preg_replace('/[^0-9]+/', '', $employees['employmentEndDate']);
                    if( strlen($fieldValue) != 8  ) {
                        echo( json_encode(['ok' => false, 'error' => 'No valid employee employment start date specified for \"' . $employees['fullNames'] . ' ' . $employees['lastName'] . '\".']) );
                        return false;
                    }
                }
            }
            
            
            //
            // CHECK EMPLOYER RECORD DETAILS
            //
            
            // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
            // 8002         Record Type                         Alphanumeric 4          Mandatory
            // 8115         UIF Reference Number                Alphanumeric 9          Mandatory
            // 8120         PAYE Number                         Numeric 10              Required
            // 8130         Total Gross Taxable Remuneration    Numeric 13.2            Required
            // 8135         Total Remuneration subject to UIF   Numeric 13.2            Required
            // 8140         Total Contributions                 Numeric 13.2            Required
            // 8150         Total Employees                     Numeric 15              Required
            // 8160         Employer’s Email address            Alphanumeric 50         Optional
            
            // 8120 - PAYE Employer Number
            // If registered with SARS, the Employer's PAYE-reference number, under which employee’s tax is deducted and paid 
            // over to SARS, must be reflected. This number starts with a "7" and must be a valid reference number as supplied by 
            // SARS. If the employer is not registered with SARS, then this number will not be present.
            if( $company['payeReferenceNumber'] !== null ) {
                $fieldValue = preg_replace('/[^0-9]+/', '', $company['payeReferenceNumber']);
                if( strlen($company['payeReferenceNumber']) != 10  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid PAYE reference number specified. Please update your company setup with the correct PAYE reference number.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to export the UIF declaration
        //
        // Required Parameters
        //  fileNumber              The number of the file to export [001 ... 999]
        //  type                    The type of export ('LIVE' or 'TEST')
        //  payrunId                The id of the payrun for the report
        //  startDate               The start date for the report
        //  endDate                 The end date for the report
        // 
        public function export($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'fileNumber' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $filterClause = '';
            $filterCount = 0;
            $filterValues = [];
            
            $payrunId = $data['payrunId'];
            $startDate = $data['startDate'];
            $endDate = $data['endDate'];
            
            // Check if the file number is valid
            $fileNumber = $data['fileNumber'];
            if( ((int)$fileNumber < 0) || ((int)$fileNumber > 999) ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid file number. File number must be in the range of 1 to 999.']) );
                return false;
            }
            
            // Was no end date specified?
            if( $payrunId != null ) {
                // Get the end date
                $sqlQuery =
                    'SELECT ' . 
                        'payruns.from_date, ' .
                        'payruns.to_date ' .
                    'FROM ' . 
                        'payruns '.
                    'WHERE ' . 
                        'payruns.id = $1; ';
                $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                // If we did not find precisely on row then there was an error
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Payrun not found']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $startDate = $sqlRow['from_date'];
                $endDate = $sqlRow['to_date'];
            }
            
            // Use current month and year as default
            $payrollYear = date('Y');
            $payrollMonth = date('m');
            
            // Was an end date found?
            if( $endDate !== null ) {
                // Calculate the year and month from the end date
                $payrollYear = substr($endDate, 0, 4);
                $payrollMonth = substr($endDate, 5, 2);
            }
            
            
            //
            // GET REQUIRED COMPANY UIF DETAILS
            //
            
            // Get information required for creator record from the database
            $sqlQuery =
                'SELECT ' . 
                    'company_details.id, ' .
                    'company_details.name, ' .
                    'company_details.alias, ' .
                    'company_details.registration_number, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.postal_address_line_1, ' .
                    'company_details.postal_address_line_2, ' .
                    'company_details.postal_address_line_3, ' .
                    'company_details.postal_address_code, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.uif_registration_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.sars_contact_first_name, ' .
                    'company_details.sars_contact_last_name, ' .
                    'company_details.sars_contact_email_address, ' .
                    'company_details.sars_contact_business_number, ' .
                    'company_details.sars_contact_cell_number, ' .
                    'company_details.uif_contact_person, ' .
                    'company_details.uif_contact_email_address, ' .
                    'company_details.uif_contact_number, ' .
                    'company_details.tel_number, ' .
                    'company_details.fax_number, ' .
                    'company_details.email_address, ' .
                    'countries.name AS physical_address_country_name, ' .
                    'eti_status_types.name AS eti_status_name, ' .
                    'special_economic_zones.name AS special_economic_zone_name, ' .
                    'sic_codes.name AS sic_name ' .
                'FROM ' . 
                    'company_details '.
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'LEFT JOIN ' .
                    'eti_status_types ON eti_status_types.code = company_details.eti_status_code ' .
                'LEFT JOIN ' .
                    'special_economic_zones ON special_economic_zones.code = company_details.special_economic_zone_code ' .
                'LEFT JOIN ' .
                    'sic_codes ON sic_codes.code = company_details.sic_code ' .
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add details to the company array
            $sqlRow = $sqlResult->fetchAssociative();
            $company = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'alias' => $sqlRow['alias'],
                'registrationNumber' => $sqlRow['registration_number'],
                'physicalAddressUnit' => $sqlRow['physical_address_unit'],
                'physicalAddressComplex' => $sqlRow['physical_address_complex'],
                'physicalAddressStreet' => $sqlRow['physical_address_street'],
                'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                'physicalAddressCity' => $sqlRow['physical_address_city'],
                'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                'physicalAddressCountryCode' => $sqlRow['physical_address_country_code'],
                'physicalAddressCountryName' => $sqlRow['physical_address_country_name'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'telNumber' => $sqlRow['tel_number'],
                'faxNumber' => $sqlRow['fax_number'],
                'emailAddress' => $sqlRow['email_address'],
                'payeReferenceNumber' => $sqlRow['paye_reference_number'],
                'sdlPaymentReferenceNumber' => $sqlRow['sdl_payment_reference_number'],
                'uifPaymentReferenceNumber' => $sqlRow['uif_payment_reference_number'],
                'uifRegistrationNumber' => $sqlRow['uif_registration_number'],
                'sicCode' => $sqlRow['sic_code'],
                'sicName' => $sqlRow['sic_name'],
                'etiStatusCode' => $sqlRow['eti_status_code'],
                'etiStatusName' => $sqlRow['eti_status_name'],
                'specialEconomicZoneCode' => $sqlRow['special_economic_zone_code'],
                'specialEconomicZoneName' => $sqlRow['special_economic_zone_name'],
                'diplomaticIndemnity' => $sqlRow['diplomatic_indemnity'],
                'sarsContactFirstName' => $sqlRow['sars_contact_first_name'],
                'sarsContactLastName' => $sqlRow['sars_contact_last_name'],
                'sarsContactEmailAddress' => $sqlRow['sars_contact_email_address'],
                'sarsContactBusinessNumber' => $sqlRow['sars_contact_business_number'],
                'sarsContactCellNumber' => $sqlRow['sars_contact_cell_number'],
                'uifContactPerson' => $sqlRow['uif_contact_person'],
                'uifContactEmailAddress' => $sqlRow['uif_contact_email_address'],
                'uifContactNumber' => $sqlRow['uif_contact_number']
            ];
            
            // Format the company UIF number
            $companyUifNumber = preg_replace('/[^0-9]+/', '', $company['uifRegistrationNumber']);
            if( strlen($companyUifNumber) != 8  ) {
                echo( json_encode(['ok' => false, 'error' => 'No valid company UIF registration number specified. Please update your company setup with the correct UIF number.']) );
                return false;
            }
            
            // NOTE:
            //
            // We cannot use the SPOUT writer because SARS uses a non-standerd CSV format where certain 
            // values are to be enclosed with double quotes where neither SPOUT nor the built-in PHP csv 
            // functions would do so
            
            $totalRecords = 0;
            $totalCodeValue = 0;
            $totalAmount = 0.00;
            $fileContents = [];
            
            // File format:
            
            // - A comma-delimited file layout combined with the described code structure, must be used.
            // - The file must be submitted in ASCII format.
            // - All numeric fields with decimal values (i.e. Rands and cents) must have the decimal point specified. Take note 
            //   that this is always a point and not a comma.
            // - All numeric fields with no decimal values (i.e. Rands only), must not have the decimal point specified.
            // - Alphanumeric fields must always be enclosed in double quotes (e.g. “O’Reilly”).
            // - A comma must not precede the first field of a record, and must not follow the last field of a record.
            // - Every record must be followed by a carriage return character.
            // - In all cases except for the UI Employer reference number, the leading zeros for numeric fields and the 
            //   trailing spaces for alphanumeric fields should preferably be truncated, but this is not mandatory.
            // - Negative values are allowed (the minus sign must be in the leftmost position in the field).
            // - SARS comma delimited file only: 
            //   The code and its associated field must not be included in the record if the field does not have a value. The 
            //   absence of the code and its associated field value, implies a zero or space value for the field.
            // - Simple comma delimited file only: 
            //   All the fields need to be included in the record. If a field has no value it must be included as a NULL value 
            //   i.e. (“xxxxxx”, “zzzzzz”,,1234,1,2). A space or a 0 will be regarded as a value.
            
            
            //
            // CREATOR RECORD
            //
            
            // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
            // 8000         Record Type                         Alphanumeric 4          Mandatory
            // 8010         Format Type                         Alphanumeric 2          Mandatory
            // 8015         Version No.                         Alphanumeric 3          Mandatory
            // 8020         UIF Reference Number                Alphanumeric 9          Mandatory
            // 8030         Test Live Indicator                 Alphanumeric 4          Mandatory
            // 8040         Contact Person                      Alphanumeric 30         Required
            // 8050         Contact Telephone Number            Alphanumeric 16         Required
            // 8060         Contact E-mail Address              Alphanumeric 50         Optional
            // 8070         Payroll Month                       Numeric 6               Mandatory
            
            // 8000 - Record Type 
            // The record type can only be UICR. Any other value will cause the entire file to be rejected.
            // Write employer details
            $totalRecords = $totalRecords + 1;
            $rowContent = [];
            $rowContent = array_merge($rowContent, [
                '8000',
                $this->formatSarsString('UICR', 4)
            ]);
            
            // 8010 - Format Type
            // This field identifies comma-delimited format used to create the file. The format type must be either U1 (for the SARS 
            // format), or U2 (for the Simple Comma Delimited format). Any other values will cause the entire file to be rejected.
            $rowContent = array_merge($rowContent, [
                '8010',
                $this->formatSarsString('U1', 2)
            ]);
            
            // 8015 - Version Number
            // This field identifies the version of the declaration used to create the file. This number must be E03 for 
            // declarations submitted in accordance with the specifications described in this document.
            // Any other value will cause the entire file to be rejected.
            $rowContent = array_merge($rowContent, [
                '8015',
                $this->formatSarsString('E03', 3)
            ]);
            
            // 8020 - UIF Reference Number
            // Each Creator must register with the Fund unless the Creator is already registered as an employer. The Registration 
            // form is available at any Department of Labour Office and must be completed and posted to the Fund at UIF/WVF, 
            // Pretoria, 0052 or e-mailed to newui8registrations@labour.gov.za
            // The UIF reference number must be a valid UIF reference number, must be zero filled from the left, and must exclude 
            // any non-numeric characters e.g. 123456/8 should be sent as 001234568. The formula to validate this number using a 
            // Check Digit routine is supplied in the appendix to this specification.
            // An invalid reference number will cause the entire file to be rejected.
            $rowContent = array_merge($rowContent, [
                '8020',
                $this->formatSarsString(str_pad($companyUifNumber, 9, '0', STR_PAD_LEFT), 9)
            ]);
            
            // 8030 - TEST / LIVE Indicator
            // The indicator must be either TEST or LIVE. TEST data will be validated but not be stored on the employee database, 
            // whereas LIVE data will be validated and stored if accepted.
            // Any other value will cause the entire file to be rejected.
            $rowContent = array_merge($rowContent, [
                '8030',
                ($data['type'] === 'LIVE' ? $this->formatSarsString('LIVE', 4) : $this->formatSarsString('TEST', 4))
            ]);
            
            // 8040 - Contact Person
            // This is a required field for correspondence purposes.
            $rowContent = array_merge($rowContent, [
                '8040',
                $this->formatSarsString($company['uifContactPerson'], 30)
            ]);
            
            // 8050 - Contact Telephone Number
            // This is a required field for communication purposes.
            $rowContent = array_merge($rowContent, [
                '8050',
                $this->formatSarsString($company['uifContactNumber'], 16)
            ]);
            
            // 8060 - Contact E-mail address
            // This is an optional field for correspondence purposes. Confirmation of receipt of the submission will be sent to 
            // the creator’s e-mail address in field 8060. If this field is not present, then the confirmation will be sent to the 
            // e-mail address of the sender of the e-mail.
            $rowContent = array_merge($rowContent, [
                '8060',
                $this->formatSarsString($company['uifContactEmailAddress'], 50)
            ]);
            
            // 8070 - Payroll Month
            // This is a mandatory field, which identifies the processing month that is being declared. The only acceptable 
            // format is CCYYMM.
            // An error in this field will cause the entire file to be rejected.
            $rowContent = array_merge($rowContent, [
                '8070',
                ($payrollYear . $payrollMonth)
            ]);
            
            // Add the row to the file contents
            $fileContents[] = $rowContent;
            
            
            //
            // EMPLOYEE DETAIL RECORDS
            //
            
            $sqlParams = [];
            $whereClause = '';
            
            // Was either a start or end date specified?
            if( (($startDate != null) && ($startDate != '')) || (($endDate != null) && ($endDate != '')) ) {
                // Set the first part of the where clause
                $whereClause = ' WHERE ( ';
                
                // Was an end date specified?
                if( ($endDate != null) && ($endDate != '') ) {
                    if( count($sqlParams) > 0 ) $whereClause = $whereClause . ' AND ';
                    
                    $sqlParams[] = $endDate;
                    $whereClause = $whereClause . '((employees.employment_start_date <= $' . count($sqlParams) . ') AND (employees.employment_end_date IS NULL OR employees.employment_end_date <= $' . count($sqlParams) . ')) ';
                }
                
                // Was a start date specified?
                if( ($startDate != null) && ($startDate != '') ) {
                    if( count($sqlParams) > 0 ) $whereClause = $whereClause . ' AND ';
                    
                    $sqlParams[] = $startDate;
                    $whereClause = $whereClause . '(employees.employment_end_date IS NULL OR employees.employment_end_date >= $' . count($sqlParams) . ') ';
                }
                
                // Finish the where clause
                $whereClause = $whereClause . ') ';
            }
            
            // Get information required for employee records from the database
            $sqlQuery = 
                'SELECT ' .
                    'employees.id AS employee_id, ' .
                    'employees.code AS employee_code, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias AS employee_alias, ' .
                    'employees.id_number, ' .
                    'employees.email_address, ' .
                    'employees.title_code, ' . 
                    'employees.initials, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.passport_country, ' .
                    'countries.alpha_2_code AS passport_country_alpha_2_code, ' .
                    'employees.date_of_birth, ' .
                    'employees.is_asylum_seeker, ' .
                    'employees.is_refugee, ' .
                    'employees.is_retired, ' .
                    'employees.physical_address_unit, ' .
                    'employees.physical_address_complex, ' .
                    'employees.physical_address_street, ' .
                    'employees.physical_address_suburb, ' .
                    'employees.physical_address_city, ' .
                    'employees.physical_address_postal_code, ' .
                    'employees.physical_address_country_code, ' .
                    'employees.postal_same_as_physical_address, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.postal_address_country_code, ' .
                    'employees.work_same_as_company_address, ' .
                    'employees.work_address_unit, ' .
                    'employees.work_address_complex, ' .
                    'employees.work_address_street, ' .
                    'employees.work_address_suburb, ' .
                    'employees.work_address_city, ' .
                    'employees.work_address_postal_code, ' .
                    'employees.work_address_country_code, ' .
                    'employees.home_number, ' .
                    'employees.work_number, ' .
                    'employees.cell_number, ' .
                    'employees.fax_number, ' .
                    'employees.email_address, ' .
                    'employees.emergency_contact_person, ' .
                    'employees.emergency_contact_number, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.employment_position, ' .
                    'employees.department_id, ' .
                    'employees.payment_method_code, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'employees.income_tax_number, ' .
                    'employees.income_tax_directive_1, ' .
                    'employees.income_tax_directive_2, ' .
                    'employees.income_tax_directive_3, ' .
                    'employees.sic_code, ' .
                    'employees.send_payslip_by_email, ' .
                    'employees.created_on, ' .
                    'employees.created_by_user_id, ' .
                    'employees.payment_period_end_day, ' .
                    '(SELECT dismissal_reason FROM employment_history WHERE employment_history.employee_id = employees.id ORDER BY dismissal_date DESC LIMIT 1) AS dismissal_reason, ' .
                    'work_schedules.monday_hours, ' .
                    'work_schedules.tuesday_hours, ' .
                    'work_schedules.wednesday_hours, ' .
                    'work_schedules.thursday_hours, ' .
                    'work_schedules.friday_hours, ' .
                    'work_schedules.saturday_hours, ' .
                    'work_schedules.sunday_hours ' .
                'FROM ' .
                    'employees ' .
                'LEFT JOIN ' .
                    'countries ON employees.passport_country = countries.code ' .
                'LEFT JOIN ' .
                    'work_schedules ON work_schedules.employee_id = employees.id ' .
                $whereClause .
                'ORDER BY ' . 
                    'employee_alias ASC, ' . 
                    'employee_code ASC ';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $employees = [];
            $numEmployees = 0;
            $hoursWorkedTotal = 0;
            $taxableRemunerationTotal = 0;
            $uifRemunerationTotal = 0;
            $uifContributionTotal = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Get all the payslips for the employee for the given payrun
                $taxableRemuneration = 0;
                $uifRemuneration = 0;
                $uifContribution = 0;
                $totalHoursWorked = 0;
                $nonContributionReason = '';
                
                $filterClause = '';
                $filterCount = 0;
                $filterValues = [];
                
                // Count the number of employees
                $numEmployees = $numEmployees + 1;
                
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND (';
                
                // Was a payrun id specified?
                if( $data['payrunId'] !== null  ) {
                    // Setup the filter clause
                    $filterCount++;
                    $filterValues[] = $data['payrunId'];
                    $filterClause = $filterClause . '(payrun_id = $' . $filterCount . ') ';
                }
                else {
                    // Was either a start or end date specified?
                    if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                        
                        // Was a start date specified?
                        if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                            if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                            
                            $filterCount++;
                            $filterValues[] = $data['startDate'];
                            $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                        }
                        
                        // Was an end date specified?
                        if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                            if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                            
                            $filterCount++;
                            $filterValues[] = $data['endDate'];
                            $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                        }
                        
                    }
                }
                
                // Add the employee id
                if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                $filterCount++;
                $filterValues[] = $sqlRow['employee_id'];
                $filterClause = $filterClause . 'payslips.employee_id = $' . $filterCount . ' ';
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
                
                // Get the required payslips
                $payslipQuery = 
                    'SELECT ' .
                        'payslips.id, ' .
                        'payslips.period, ' .
                        'payslips.sars_year, ' .
                        'payslips.from_date, ' .
                        'payslips.to_date, ' .
                        'payslips.status_code, ' .
                        'payslip_status_codes.name AS status_name, ' .
                        'payslips.payment_period_code, ' .
                        'payslips.payment_period_end_day, ' .
                        'payslips.paye_bonus_calculation_type_code, ' .
                        'payslips.employee_id, ' .
                        'employees.first_name AS employee_first_name, ' .
                        'employees.last_name AS employee_last_name, ' .
                        'employees.alias AS employee_alias, ' .
                        'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                        'employees.employment_start_date, ' .
                        'employees.employment_end_date, ' .
                        'employees.email_address ' .
                    'FROM ' .
                        'payslips ' .
                    'LEFT JOIN ' .
                        'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                    'LEFT JOIN ' .
                        'employees ON employees.id = payslips.employee_id ' .
                    // 'LEFT JOIN ' .
                    //     'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payslips.status_code = \'ACTI\' ' .
                        $filterClause .
                        // 'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                        // '( ' .
                        //     'employees.employment_end_date IS NULL OR ' .
                        //     'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                        // ') ' .
                    'ORDER BY payslips.to_date ASC;';
                $payslipResult = $db->paramQuery($payslipQuery, $filterValues);
                if( !$payslipResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Are there no payslips for the specified employee?
                if( $payslipResult->getRowCount() <= 0 ) {
                    // Set the non-contribution reason
                    $nonContributionReason = '06';
                }
                
                // Get the payslip details
                $payslip = null;
                while( $payslipRow = $payslipResult->fetchAssociative() ) {
                    $payslip = [
                        'id' => $payslipRow['id'],
                        'statusCode' => $payslipRow['status_code'],
                        'statusName' => $payslipRow['status_name'],
                        'employee' => [
                            'id' => $payslipRow['employee_id'],
                            'name' => $payslipRow['employee_alias'],
                            'age' => $payslipRow['employee_age'],
                            'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                            'emailAddress' => $payslipRow['email_address']
                        ],
                        'taxPeriod' => [
                            'type' => $payslipRow['payment_period_code'],
                            'number' => $payslipRow['period'],
                            'taxYear' => $payslipRow['sars_year']
                        ],
                        'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                        'fromDate' => $payslipRow['from_date'],
                        'toDate' => $payslipRow['to_date'],
                        'items' => []
                    ];
                    
                    // Get all the items for the specified payslip
                    $itemQuery = 
                        'SELECT DISTINCT ' .
                            'payslip_items.id, ' .
                            'payslip_items.payslip_item_type_code, ' .
                            'payslip_item_types.payslip_item_unit_code, ' .
                            'payslip_item_types.payslip_category_code, ' .
                            'payslip_items.description, ' .
                            'payslip_items.accrual_date, ' .
                            'payslip_items.auto_calculate, ' .
                            'payslip_items.units, ' .
                            'payslip_items.rate, ' .
                            'payslip_items.total, ' .
                            'payslip_items.provident_fund_id, ' .
                            'payslip_categories AS payslip_category_name, ' .
                            'payslip_categories.code, ' .
                            'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                        'FROM ' .
                            'payslip_items ' .
                        'LEFT JOIN ' .
                            'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                        'LEFT JOIN ' .
                            'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                        'WHERE ' .
                            'payslip_items.payslip_id = $1 ' .
                        'ORDER BY ' . 
                            'custom_sort, payslip_items.description ASC, payslip_items.payslip_item_type_code ASC;';
                    $itemResult = $db->paramQuery($itemQuery, [
                        $payslipRow['id']
                    ]);
                    if( !$itemResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // For every payslip item
                    $items = [];
                    $hasCalculatedHoursWorked = false;
                    while( $itemRow = $itemResult->fetchAssociative() ) {
                        $units = $itemRow['units'];
                        if( $units !== null ) $units = doubleval($units);
                        
                        $rate = $itemRow['rate'];
                        if( $rate !== null ) $rate = doubleval($rate);
                        
                        $amount = $itemRow['total'];
                        if( $amount !== null ) $amount = doubleval($amount);
                        
                        $providentFundId = $itemRow['provident_fund_id'];
                        $employeeAmount = null;
                        $employerAmount = null;
                        $rfiItems = [];
                        
                        // Is it a provident fund item?
                        if( $providentFundId !== null ) {
                            // Load the provident fund details
                            $providentFundQuery = 
                                'SELECT ' . 
                                    'provident_funds.id, ' .
                                    'provident_funds.name, ' .
                                    'provident_funds.provident_fund_calculation_type_code, ' .
                                    'provident_funds.employee_amount, ' .
                                    'provident_funds.employer_amount, ' .
                                    'provident_funds.category_factor, ' .
                                    'provident_funds.is_active ' .
                                'FROM ' . 
                                    'provident_funds ' .
                                'LEFT JOIN ' .
                                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                                'WHERE ' . 
                                    'provident_funds.is_active IS TRUE AND ' .
                                    'provident_funds.id = $1 ' .
                                'ORDER BY ' . 
                                    'provident_funds.name ASC;';
                            $providentResult = $db->paramQuery($providentFundQuery, [$providentFundId]);
                            if( !$providentResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            
                            $providentFundRow = $providentResult->fetchAssociative();
                            $employeeAmount = doubleval( $providentFundRow['employee_amount'] );
                            $employerAmount = doubleval( $providentFundRow['employer_amount'] );
                            
                            // Is the provident fund calculation based on retirement fund income items?
                            if( $providentFundRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
                                // Get all the relevant retirement fund income items
                                $rfiItemSqlQuery =
                                    'SELECT ' . 
                                        'payslip_config_items.payslip_item_type_code, ' .
                                        'employee_rfi_items.percentage ' .
                                    'FROM ' . 
                                        'payslip_config_items ' .
                                    'LEFT JOIN ' .
                                        'employee_rfi_items ON employee_rfi_items.payslip_config_item_id = payslip_config_items.id AND ' .
                                            'employee_rfi_items.provident_fund_id = $1 ' .
                                    'WHERE ' . 
                                        'employee_rfi_items.id IS NOT NULL AND ' .
                                        'payslip_config_items.employee_id = $2;';
                                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [
                                    $providentFundId, 
                                    $sqlRow['employee_id']
                                ]);
                                if( !$rfiItemSqlResult->isValid() ) {
                                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                    return false;
                                }
                                
                                while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                                    $rfiItems[] = [
                                        'payslipItemTypeCode'  => $rfiItemSqlRow['payslip_item_type_code'],
                                        'percentage' => $rfiItemSqlRow['percentage']
                                    ];
                                }
                            }
                        }
                        
                        $items[] = [
                            'id' => $itemRow['id'],
                            'type' => [
                                'code' => $itemRow['payslip_item_type_code'],
                                'unitCode' => $itemRow['payslip_item_unit_code'],
                            ],
                            'category' => [
                                'code' => $itemRow['payslip_category_code'],
                                'name' => $itemRow['payslip_category_name']
                            ],
                            'providentFund' => [
                                'id' => $providentFundId,
                                'employeeAmount' => $employeeAmount,
                                'employerAmount' => $employerAmount,
                                'rfiItems' => $rfiItems
                            ],
                            'description' => $itemRow['description'],
                            'accrualDate' => $itemRow['accrual_date'],
                            'autoCalculate' => $itemRow['auto_calculate'],
                            'units' => $units,
                            'rate' => $rate,
                            'amount' => $amount
                        ];
                        
                        // Is it an income item that is not an annual payment?
                        if( ($itemRow['payslip_item_type_code'] < 1004) && (!$hasCalculatedHoursWorked) ) {
                            // Determine if the employee has a workschedule
                            $hasWorkSchedule = true;
                            if( ($sqlRow['sunday_hours'] == null) && ($sqlRow['monday_hours'] == null) && 
                                ($sqlRow['tuesday_hours'] == null) && ($sqlRow['wednesday_hours'] == null) && 
                                ($sqlRow['thursday_hours'] == null) && ($sqlRow['friday_hours'] == null) && 
                                ($sqlRow['saturday_hours'] == null) ) {
                                $hasWorkSchedule = false;
                            }
                            
                            // Does the employee have a work schedule?
                            $workScheduleHoursWorked = 0;
                            $workScheduleDaysWorked = 0;
                            if( $hasWorkSchedule ) {
                                // Set the start date for the work schedule calculation
                                $scheduleStartDate = $payslip['fromDate'];
                                if( ($sqlRow['employment_start_date'] > $payslip['fromDate']) ) { 
                                    $scheduleStartDate = $payslip['employment_start_date'];
                                    // $scheduleStartDate = date('Y-m-d', strtotime($scheduleStartDate . ' +1 day'));
                                }
                                
                                // Set the end date for the work schedule calculation
                                $scheduleEndDate = $payslip['toDate'];
                                if( $sqlRow['employment_end_date'] != null && ( $sqlRow['employment_end_date'] < $payslip['toDate'] ) ) { 
                                    $scheduleEndDate = $sqlRow['employment_end_date'] ;
                                }
                                
                                // Calculate hours and days worked for every day since the start date up to the end date
                                $workScheduleHoursWorked = 0;
                                $workScheduleDaysWorked = 0;
                                while( $scheduleStartDate <= $scheduleEndDate) {
                                    // Is the employee paid per day?
                                    if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                                        // Stop counting when we've reached the actual number of days worked
                                        if( $workScheduleDaysWorked >= $units ) {
                                            break;
                                        }
                                    }
                                    
                                    // Get the day of the week 
                                    $dayOfWeek = date('w', strtotime($scheduleStartDate));
                                    
                                    // Depending on the day of the week
                                    if( $dayOfWeek == 0 ) {
                                        if( $sqlRow['sunday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['sunday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 1 ) {
                                        if( $sqlRow['monday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['monday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 2 ) {
                                        if( $sqlRow['tuesday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['tuesday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 3 ) {
                                        if( $sqlRow['wednesday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['wednesday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 4 ) {
                                        if( $sqlRow['thursday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['thursday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 5 ) {
                                        if( $sqlRow['friday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['friday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    else if( $dayOfWeek == 6 ) {
                                        if( $sqlRow['saturday_hours'] != null ) {
                                            $workScheduleHoursWorked = $workScheduleHoursWorked + (int)$sqlRow['saturday_hours'];
                                            $workScheduleDaysWorked = $workScheduleDaysWorked + 1;
                                        }
                                    }
                                    
                                    // Add one day to the start date
                                    $scheduleStartDate = date('Y-m-d', strtotime($scheduleStartDate . ' +1 day'));
                                }
                            }
                            
                            // Calculate total hours worked
                            if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                                $totalHoursWorked = $totalHoursWorked + ($units !== null ? $units : 0);
                            }
                            else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                                // Is there a workschedule?
                                if( $hasWorkSchedule ) {
                                    // Us ethe work schedule hours
                                    $totalHoursWorked = $totalHoursWorked + $workScheduleHoursWorked;
                                }
                                else {
                                    // Calculate add 8 hours for every day worked
                                    $totalHoursWorked = $totalHoursWorked + ($units !== null ? $units * 8 : 0);
                                }
                            }
                            else {
                                // Is there a workschedule?
                                if( $hasWorkSchedule ) {
                                    // Us ethe work schedule hours
                                    $totalHoursWorked = $totalHoursWorked + $workScheduleHoursWorked;
                                }
                                else {
                                    // Get the number of working days in the payslip period and add 8 hours for every day
                                    $daysWorked = \LeaveUtil\getWorkingDays($payslip['fromDate'], $payslip['toDate'], []);
                                    $totalHoursWorked = $totalHoursWorked + ($daysWorked * 8);
                                }
                            }
                            
                            // Remember that hours worked has already been calculated for this payslip (i.e. ignore further income items)
                            $hasCalculatedHoursWorked = true;
                        }
                    }
                    
                    // Was the hours worked not specified?
                    // if( $totalHoursWorked <= 0 ) {
                    //     // Get the number of working days in the payrun period
                    //     $daysWorked = \LeaveUtil\getWorkingDays(($startDate == null ? $sqlRow['employment_start_date'] : $startDate), ($endDate == null ? '' : $endDate), []);
                    //     $totalHoursWorked = $totalHoursWorked + ($daysWorked * 8);
                    // }
                    
                    // Calculate the total hours worked for all employees
                    // $hoursWorkedTotal = $hoursWorkedTotal + $totalHoursWorked;
                    
                    // Calculate the payslip totals
                    $payslip['items'] = $items;
                    $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslip );
                    $taxableRemuneration = $taxableRemuneration + $payslipTotals['taxableIncome'];
                    $uifRemuneration = $uifRemuneration + $payslipTotals['uifIncome'];
                    $uifContribution = $uifContribution + ($payslipTotals['employeeUif'] + $payslipTotals['employerUif']);
                    
                    // Determine reason for non-contribution (if not already set)
                    // 1 - Temporary employees (less than 24 hours per month)
                    // 2 - Learners in terms of the skills development act
                    // 3 - Employees in the national and provincial spheres of government
                    // 4 - Employees who are repatriated at the end of their contract of service
                    // 5 - Employees who earn commission only
                    // 6 - No income paid for the payroll period
                    if( $uifContribution <= 0 && $nonContributionReason == '' ) {
                        if( $payslipTotals['employeeUif'] + $payslipTotals['employerUif'] == 0 ) {
                            if( $payslipTotals['totalIncome'] == $payslipTotals['commissionIncome'] ) {
                                $nonContributionReason = '05';
                            }
                            else if( $totalHoursWorked < 24 ) {
                                $nonContributionReason = '01';
                            }
                            else {
                                2;
                            }
                        }
                    }
                }
                
                // Calculate the total hours worked for all employees
                $hoursWorkedTotal = $hoursWorkedTotal + $totalHoursWorked;
                
                // Caculate the totals
                $taxableRemunerationTotal = $taxableRemunerationTotal + $taxableRemuneration;
                $uifRemunerationTotal = $uifRemunerationTotal + $uifRemuneration;
                $uifContributionTotal = $uifContributionTotal + $uifContribution;
                
                // Set employment end date
                $employmentEndDate = ($sqlRow['employment_end_date'] !== null ? $sqlRow['employment_end_date'] : null);
                
                // Employment end date should only be listed if it occurs in the period of the payrun
                if( $employmentEndDate < $startDate || $employmentEndDate > $endDate ) {
                    $employmentEndDate = '';
                }
                
                // Determine employement status 
                //  
                //  2 - Deceased
                //  3 - Retired
                //  4 - Dismissed
                //  5 - Contract Expired
                //  6 - Resigned
                //  7 - Constructively Dismissed
                //  8 - Employers Insolvency
                //  9 - Maternity / Adoption leave
                //  10 - Illness leave
                //  11 - Retrenched
                //  12 - Transfer to another branch
                //  13 - Absconded
                //  14 - Business Closed
                //  15 - Death of Domestic Employer
                //  16 - Voluntary Severance Package
                //  17 - Reduced Working Time
                $employmentStatus = '01';
                if( $employmentEndDate !== '' ) {
                    $employmentStatus = '04';
                    
                    if( $sqlRow['dismissal_reason'] === 'DECE' ) {
                        $employmentStatus = '02';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'DISM' ) {
                        $employmentStatus = '04';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ENCO' ) {
                        $employmentStatus = '05';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'RESI' ) {
                        $employmentStatus = '06';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'CODI' ) {
                        $employmentStatus = '07';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'EMIN' ) {
                        $employmentStatus = '08';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ILLN' ) {
                        $employmentStatus = '10';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'RETR' ) {
                        $employmentStatus = '11';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'TRAN' ) {
                        $employmentStatus = '12';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'ABSC' ) {
                        $employmentStatus = '13';
                    }
                    else if( $sqlRow['dismissal_reason'] === 'BUCL' ) {
                        $employmentStatus = '14';
                    }
                }
                
                // Determine the title number
                $titleNumber = 5;
                if( $sqlRow['title_code'] === 'ADVO' ) {
                    $titleNumber = 1;
                }
                else if( $sqlRow['title_code'] === 'DOCT' ) {
                    $titleNumber = 2;
                }
                else if( $sqlRow['title_code'] === 'MISS' ) {
                    $titleNumber = 4;
                }
                else if( $sqlRow['title_code'] === 'MIST' ) {
                    $titleNumber = 5;
                }
                else if( $sqlRow['title_code'] === 'MISI' ) {
                    $titleNumber = 6;
                }
                else if( $sqlRow['title_code'] === 'MISX' ) {
                    $titleNumber = 7;
                }
                else if( $sqlRow['title_code'] === 'PROF' ) {
                    $titleNumber = 8;
                }
                
                // Add the employee UIF details
                $employees = [
                    'id' => $sqlRow['employee_id'],
                    'code' => $sqlRow['employee_code'],
                    'titleCode' => $sqlRow['title_code'],
                    'titleNumber' => $titleNumber,
                    'initials' => $sqlRow['initials'],
                    'initial' => substr($sqlRow['initials'], 0, 1),
                    'fullNames' => $sqlRow['full_names'],
                    'lastName' => $sqlRow['last_name'],
                    'alias' => $sqlRow['employee_alias'],
                    'idType' => ($sqlRow['id_number'] !== null && strlen($sqlRow['id_number']) > 0 ? 1 : 2),
                    'idNumber' => $sqlRow['id_number'],
                    'passportNumber' => $sqlRow['passport_number'],
                    'physicalAddressLine1' => $sqlRow['physical_address_street'],
                    'physicalAddressLine2' => $sqlRow['physical_address_unit'],
                    'physicalAddressLine3' => $sqlRow['physical_address_complex'],
                    'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                    'physicalAddressCity' => $sqlRow['physical_address_city'],
                    'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                    'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                    'postalAddressLine2' => '',
                    'postalAddressLine3' => '',
                    'postalAddressSuburb' => $sqlRow['postal_address_line_2'],
                    'postalAddressCity' => $sqlRow['postal_address_line_3'],
                    'postalAddressCode' => $sqlRow['postal_address_code'],
                    'passportCountryCode' => $sqlRow['passport_country'],
                    'passportCountryAlpha2Code' => $sqlRow['passport_country_alpha_2_code'],
                    'dateOfBirth' => $sqlRow['date_of_birth'],
                    'employmentStartDate' => $sqlRow['employment_start_date'],
                    'employmentEndDate' => $employmentEndDate,
                    'totalHoursWorked' => $totalHoursWorked,
                    'employmentStatus' => $employmentStatus,
                    'nonContributionReason' => $nonContributionReason,
                    'taxableRemuneration' => $taxableRemuneration,
                    'uifRemuneration' => $uifRemuneration,
                    'uifContribution' => $uifContribution
                ];
                
                // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
                // 8001         Record Type                         Alphanumeric 4          Mandatory
                // 8110         UIF Reference Number                Alphanumeric 9          Mandatory
                // 8200         ID Number                           Numeric 13              Required
                // 8210         Other Number                        Alphanumeric 16         Required
                // 8220         Alternate Number                    Alphanumeric 25         Required
                // 8230         Surname                             Alphanumeric 120        Required
                // 8240         First Names                         Alphanumeric 90         Required
                // 8250         Date Of Birth                       Date 8                  Required
                // 8260         Date Employed From                  Date 8                  Required
                // 8270         Date Employed To                    Date 8                  Required
                // 8280         Employment Status                   Numeric 2               Required
                // 8290         Reason for Non Contribution         Numeric 2               Required
                // 8300         Gross Taxable Remuneration          Numeric 13.2            Required
                // 8310         Remuneration subject to UIF         Numeric 13.2            Required
                // 8320         UIF Contribution                    Numeric 13.2            Required
                // 8330         Bank Branch Code                    Numeric 8               Optional
                // 8340         Bank Account Number                 Numeric 16              Optional
                // 8350         Bank Account Type                   Numeric 2               Optional
                
                // 8001 - Record Type
                // The record type can only be UIWK. Any other value will cause the record to be rejected.
                $rowContent = [];
                $rowContent = array_merge($rowContent, [
                    '8001',
                    $this->formatSarsString('UIWK', 4)
                ]);
                
                // 8110 - UIF Employer Reference Number
                // The UIF reference number must be a valid UIF reference number (see field 8020)
                // An invalid reference number will cause the record to be rejected.
                $rowContent = array_merge($rowContent, [
                    '8110',
                    $this->formatSarsString(str_pad($companyUifNumber, 9, '0', STR_PAD_LEFT), 9)
                ]);
                    
                // 8200 - ID Number
                // This field is mandatory if fields 8210 or 8220 are invalid or not present (see rules 8210 and 8220). The ID number supplied 
                // must be a valid 13 digit, bar coded RSA national ID number. Please note that this number is the key to the UI system, 
                // without which an applicant cannot claim benefits from the Fund. The employee and employer are still obliged to pay 
                // contributions in respect of the employee and to furnish details of the employee to the Fund if the employee does not have 
                // an ID number. In this event, either a number for field 8210 or for field 8220 must be supplied to enable the Fund to record 
                // and track the contribution payments. If the ID number is invalid or not present, the employee’s details will be stored in a 
                // separate database for proof of payment of contributions, without which the employee will not be allowed to claim benefits.
                // If no valid ID, Other, or Alternate number is supplied, then the record will be rejected.
                
                // 8210 - Other Number
                // This field is mandatory if fields 8200 or 8220 are invalid or not present (see rules 8200 and 8220). This field can contain 
                // any other number including a passport number, residence permit, (temporary or permanent), old National ID Numbers, etc.
                // If no valid ID, Other, or Alternate number is supplied, then the record will be rejected.
                
                // 8220 - Alternate Number
                // This field is mandatory if fields 8200 or 8210 are invalid or not present (see rules 8200 and 8210). This field should 
                // contain either the personnel, clock card or payroll number.
                // If no valid ID, Other, or Alternate number is supplied, then the record will be rejected.
                $fieldCode = null;
                $fieldValue = '';
                if( $employees['idNumber'] !== null && strlen($employees['idNumber']) ) {
                    $fieldValue = preg_replace('/[^0-9]+/', '', $employees['idNumber']);
                    if( strlen($fieldValue) != 13  ) {
                        echo( json_encode(['ok' => false, 'error' => 'No valid employee id number specified.']) );
                        return false;
                    }
                    
                    $fieldCode = '8200';
                    $fieldValue = $employees['idNumber'];
                }
                else if( $employees['passportNumber'] !== null && strlen($employees['passportNumber']) ) {
                    $fieldCode = '8210';
                    $fieldValue = $this->formatSarsString($employees['passportNumber'], 16);
                }
                else if( $employees['code'] !== null && strlen($employees['code']) ) {
                    $fieldCode = '8220';
                    $fieldValue = $this->formatSarsString($employees['code'], 25);
                }
                $rowContent = array_merge($rowContent, [
                    $fieldCode,
                    $fieldValue
                ]);
                
                // 8230 - Surname
                // This field is required in order to identify the employee.
                $rowContent = array_merge($rowContent, [
                    '8230',
                    $this->formatSarsString($employees['lastName'], 120)
                ]);
                
                // 8240 - First Names
                // This field is required in order to identify the employee.
                $rowContent = array_merge($rowContent, [
                    '8240',
                    $this->formatSarsString($employees['fullNames'], 90)
                ]);
                
                // 8250 - Date Of Birth
                // This field is required for statutory reasons, and must be in CCYYMMDD format.
                $fieldValue = preg_replace('/[^0-9]+/', '', $employees['dateOfBirth']);
                if( strlen($fieldValue) != 8  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid employee birth date specified.']) );
                    return false;
                }
                $rowContent = array_merge($rowContent, [
                    '8250',
                    $fieldValue
                ]);
                
                
                // 8260 - Date Employed From
                // This field is required for statutory reasons, and must be in CCYYMMDD format. The date must be the latest date that the 
                // employee started work at the employer.
                $fieldValue = preg_replace('/[^0-9]+/', '', $employees['employmentStartDate']);
                if( strlen($fieldValue) != 8  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid employee employment start date specified.']) );
                    return false;
                }
                $rowContent = array_merge($rowContent, [
                    '8260',
                    $fieldValue
                ]);
                
                // 8270 - Date Employed To
                // This field is required for statutory reasons, and must be in CCYYMMDD format. The date required in this field is the 
                // employee’s termination of services date. This date may not exceed the last day of the following processing month, and 
                // cannot be less than the date in code 8260. If any other employment status is supplied, then the date employed to is 
                // required. Note that remuneration (and contributions) can be received after the processing month in which the contributor’s 
                // services were terminated.
                if( $employees['employmentEndDate'] != '' ) {
                    $fieldValue = preg_replace('/[^0-9]+/', '', $employees['employmentEndDate']);
                    if( strlen($fieldValue) != 8  ) {
                        echo( json_encode(['ok' => false, 'error' => 'No valid employee employment start date specified.']) );
                        return false;
                    }
                    $rowContent = array_merge($rowContent, [
                        '8270',
                        $fieldValue
                    ]);
                }
                
                // 8280 - Employment Status code
                // This field is required and contains the employee’s employment status as at the month end.
                // The following employment status codes are valid:
                // Code     Description
                // 01       Active
                // 02       Deceased
                // 03       Retired
                // 04       Dismissed
                // 05       Contract Expired
                // 06       Resigned
                // 07       Constructively Dismissed
                // 08       Employers Insolvency
                // 09       Maternity / Adoption leave
                // 10       Illness leave
                // 11       Retrenched
                // 12       Transfer to another branch
                // 13       Absconded
                // 14       Business Closed
                // 15       Death of Domestic employer
                // 16       Voluntary Severance Package
                // 17       Reduced Working Time
                // 19       Parental Leave
                $rowContent = array_merge($rowContent, [
                    '8280',
                    $employees['employmentStatus']
                ]);
                
                // 8290 - Reason Code for Non-Contribution
                // The Reason code for non-contribution is a required field if the UIF contribution amount is zero.
                // The following reasons for non-contribution codes are valid:
                // Code     Description
                // 01       Temporary employees (less than 24 hours per month)
                // 02       Learners in terms of the skills development act -
                // 03       Employees in the national and provincial spheres of government
                // 04       Employees who are repatriated at the end of their contract of service
                // 05       Employees who earn commission only
                // 06       No income paid for the payroll period
                if( $employees['uifContribution'] < 0.01 ) {
                    $rowContent = array_merge($rowContent, [
                        '8290',
                        $employees['nonContributionReason']
                    ]);
                }
                
                // 8300 - Gross Taxable Remuneration
                // The gross taxable remuneration must be accumulated from the same remuneration amounts that make up the total reflected on 
                // the SARS tax certificate under code 3699. Note that 100% of the travel allowance and the public office allowance must be 
                // accumulated for this field. Gross taxable remuneration must not be zero unless a reason for non-contribution code is present.
                $rowContent = array_merge($rowContent, [
                    '8300',
                    number_format($employees['taxableRemuneration'], 2, '.', '')
                ]);
            
                // 8310 - Remuneration subject to UIF
                // The remuneration subject to UIF is the remuneration on which the UI contribution has been calculated, and is defined in terms 
                // of section 1 of the Unemployment Insurance Contributions Act. This remuneration is normally limited to the monthly limit, 
                // unless remuneration is received in the current month in respect of processing periods outside of the current month.
                // This amount is a required field unless the contributor does not contribute to the Fund and the applicable reason code is 
                // shown in field 8290.
                $rowContent = array_merge($rowContent, [
                    '8310',
                    number_format($employees['uifRemuneration'], 2, '.', '')
                ]);
            
                // 8320 - UIF Contribution
                // This field contains the total of the employer and the employee UIF contribution in respect of the employee. If present, this 
                // amount must be 2% of the remuneration subject to UIF (field 8310). This amount is a required field unless the contributor 
                // does not contribute to the Fund and the applicable reason code is shown in field 8290.
                $rowContent = array_merge($rowContent, [
                    '8320',
                    number_format($employees['uifContribution'], 2, '.', '')
                ]);
            
                // 8330 - Bank Branch Code
                // This is the bank branch code where the employee’s bank account is held. It is an optional field, which, along with 
                // fields 8340 and 8350, will result in more efficient benefit payments if supplied. Valid branch codes as per the ACB 
                // specifications should be supplied.
                
                // 8340 - Bank Account Number
                // This is the employees’ bank account number.
                
                // 8350 - Bank Account Type
                // This is the employee’s bank account type.
                // The account types as per the ACB specification manual are:
                // 1 = Current (Cheque) account.
                // 2 = Savings account.
                // 3 = Transmission account.
                // 4 = Bond account.
                // 6 = Subscription Share account.
                
                // Add the row to the file contents
                $fileContents[] = $rowContent;
            }
            
            
            //
            // EMPLOYER RECORD
            //
            
            // SARS CODE    FIELD NAME                          FIELD TYPE AND LENGTH   FIELD STATUS
            // 8002         Record Type                         Alphanumeric 4          Mandatory
            // 8115         UIF Reference Number                Alphanumeric 9          Mandatory
            // 8120         PAYE Number                         Numeric 10              Required
            // 8130         Total Gross Taxable Remuneration    Numeric 13.2            Required
            // 8135         Total Remuneration subject to UIF   Numeric 13.2            Required
            // 8140         Total Contributions                 Numeric 13.2            Required
            // 8150         Total Employees                     Numeric 15              Required
            // 8160         Employer’s Email address            Alphanumeric 50         Optional
            
            // 8002 - Record Type
            // The record type can only be UIEM.
            // Any other values will cause all the employee records for the same UIF reference number to be rejected.
            $rowContent = [];
            $rowContent = array_merge($rowContent, [
                '8002',
                $this->formatSarsString('UIEM', 4)
            ]);
        
            // 8115 - UIF Employer Reference Number
            // The UIF reference number must be a valid UIF reference number (see field 8020)
            // An invalid reference number will cause this record, as well as all employee records for the same reference number, 
            // to be rejected.
            $rowContent = array_merge($rowContent, [
                '8115',
                $this->formatSarsString(str_pad($companyUifNumber, 9, '0', STR_PAD_LEFT), 9)
            ]);
        
            // 8120 - PAYE Employer Number
            // If registered with SARS, the Employer's PAYE-reference number, under which employee’s tax is deducted and paid 
            // over to SARS, must be reflected. This number starts with a "7" and must be a valid reference number as supplied by 
            // SARS. If the employer is not registered with SARS, then this number will not be present.
            if( $company['payeReferenceNumber'] !== null ) {
                $fieldValue = preg_replace('/[^0-9]+/', '', $company['payeReferenceNumber']);
                if( strlen($company['payeReferenceNumber']) != 10  ) {
                    echo( json_encode(['ok' => false, 'error' => 'No valid PAYE reference number specified. Please update your company setup with the correct PAYE reference number.']) );
                    return false;
                }
                $rowContent = array_merge($rowContent, [
                    '8120',
                    $company['payeReferenceNumber']
                ]);
            }
            
            // 8130 - Total Gross Taxable Remuneration
            // This is the total of all fields 8300 in the associated employees’ records.
            $rowContent = array_merge($rowContent, [
                '8130',
                number_format($taxableRemunerationTotal, 2, '.', '')
            ]);
        
            // 8135 – Total Remuneration subject to UIF
            // This is the total of all fields 8310 in the associated employees’ records.
            $rowContent = array_merge($rowContent, [
                '8135',
                number_format($uifRemunerationTotal, 2, '.', '')
            ]);
            
            // 8140 - Total UIF Contribution
            // This is the total of all fields 8320 in the associated employees’ records.
            $rowContent = array_merge($rowContent, [
                '8140',
                number_format($uifContributionTotal, 2, '.', '')
            ]);
            
            // 8150 - Total Number of Employee records
            // The total number of employee records must equal the number of employee records supplied.
            $rowContent = array_merge($rowContent, [
                '8150',
                $numEmployees
            ]);
            
            // 8160 - Employer’s e-mail Address
            // This is an optional field for correspondence purposes. If rejection and warning messages are generated, they will be sent to the employer’s e-mail address in field 8160. If field 8160 is not present, then the messages will be sent to the creator’s e-mail address in field 8060. If field 8060 is not present, then the messages will be sent to the e-mail address of the sender of the submission.
            if( ($company['emailAddress'] !== null) && (strlen(trim($company['emailAddress'])) !== '') ) {
                $rowContent = array_merge($rowContent, [
                    '8160',
                    $this->formatSarsString($company['emailAddress'], 50)
                ]);
            }
            
            
            // Add the row to the file contents
            $fileContents[] = $rowContent;
            
            
            //
            // SAVE EXPORT HISTORY 
            //
            
            // Try to get the export histroy for the specified declaration period
            $sqlQuery =
                'SELECT ' . 
                    'uif_electronic_declartion_history.id ' .
                'FROM ' . 
                    'uif_electronic_declartion_history '.
                'WHERE ' . 
                    'uif_electronic_declartion_history.payroll_year = $1 AND ' .
                    'uif_electronic_declartion_history.payroll_month = $2 ' . 
                'ORDER BY ' . 
                    'uif_electronic_declartion_history.exported_on DESC ' . 
                'LIMIT 1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $payrollYear,
                $payrollMonth
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the declartion exported before?
            if( $sqlResult->getRowCount() === 1 ) {
                // Get the declartion id
                $sqlRow = $sqlResult->fetchAssociative();
                $declarationId = $sqlRow['id'];
                
                // Update the declartion
                $sqlQuery =
                    'UPDATE ' .
                        'uif_electronic_declartion_history ' .
                    'SET ' .
                        'file_number = $1, ' .
                        'payroll_year = $2, ' .
                        'payroll_month = $3, ' .
                        'payrun_id = $4, ' .
                        'start_date = $5, ' .
                        'end_date = $6, ' .
                        'exported_on = $7, ' .
                        'exported_by_user_type_code = $8, ' .
                        'exported_by_user_id = $9 ' .
                    'WHERE  ' .
                        'id = $10';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $fileNumber,            // file_number
                    $payrollYear,           // payroll_year
                    $payrollMonth,          // payroll_month
                    $payrunId,              // payrun_id
                    $startDate,             // start_date
                    $endDate,               // end_date
                    date('Y-m-d H:i:s'),    // exported_on
                    'USER',                 // exported_by_user_type_code
                    $user['id'],            // exported_by_user_id
                    $declarationId          // id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            else {
                // Insert the declartion
                $sqlQuery =
                    'INSERT INTO uif_electronic_declartion_history ( ' .
                        'file_number, ' .
                        'payroll_year, ' .
                        'payroll_month, ' .
                        'payrun_id, ' .
                        'start_date, ' .
                        'end_date, ' .
                        'exported_on, ' .
                        'exported_by_user_type_code, ' .
                        'exported_by_user_id ' .
                    ') ' .
                    'VALUES ( ' .
                        '$1, $2, $3, $4, $5, $6, $7, $8, $9 ' .
                    ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $fileNumber,            // file_number
                    $payrollYear,           // payroll_year
                    $payrollMonth,          // payroll_month
                    $payrunId,              // payrun_id
                    $startDate,             // start_date
                    $endDate,               // end_date
                    date('Y-m-d H:i:s'),    // exported_on
                    'USER',                 // exported_by_user_type_code
                    $user['id']             // exported_by_user_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            
            //
            // WRITE THE FILE
            //
            
            // The name of the file for both e-mail and FTP submissions must be made up as follows: uuuuuuuu.nnn
            // 
            // Where: uuuuuuuu = UIF reference number
            //
            // This is the number supplied to each Employer on registration with the Fund and is always used on any correspondence 
            // from the UIF. The last 8 digits of the creator’s UIF Reference number (field 8020) must be used. Only numeric digits 
            // are allowed and the slash between the last two digits must be excluded.
            //
            // nnn = File Number
            //
            // The file number is a 3 digit numeric number, which serves to make the file name unique where more that one file is 
            // submitted under the same UIF reference number. In the normal course of events, this file number can be incremented 
            // by 1 each time a submission is made for subsequent months, or if an additional submission is made in order to 
            // resubmit records that were rejected in a previous submission.
            //
            // It is important to know that if a file is sent more than once with the same file name, the last file received will 
            // be used, and it will overwrite all previously sent files with the same file name.
            //
            // For example, the third submission by a creator with a UIF reference number of 1234567/8 must have the following 
            // file name: 12345678.003
            $attachmentName = $companyUifNumber . '.' . str_pad($fileNumber , 3, '0', STR_PAD_LEFT); // . '000';
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir . '/';
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Create a random filename for the csv file
            $filename = '';
            for ($i = 0; $i < 32; $i++) {
                $filename = $filename . $characters[rand(0, $charactersLength - 1)];
            }
            $filename = $destDir . $filename . '.csv';
            $fp = fopen($filename, "w");
            
            // Write the records
            for($i = 0; $i < count($fileContents); $i++) {
                // For every row in the file
                for( $j = 0; $j < count($fileContents[$i]); $j++ ) {
                    // Write the value
                    fwrite($fp, $fileContents[$i][$j]);
                    
                    // Is it not the last value?
                    if( ($j + 1) < count($fileContents[$i]) ) {
                        // Add a comma
                        fwrite($fp, ',');
                    }
                }
                
                // Go to the next line
                if( ($i + 1) < count($fileContents) ) {
                    fwrite($fp, "\r\n");
                }
            }
            
            // Close the file
            fclose($fp);
            clearstatcache();
            
            // Send the file back to the client
            if( file_exists($filename) ) {
                header('Content-Length: ' . filesize($filename));
                header('Content-Type: text/plain');
                header('Cache-Control: cache, max-age=31536000');
                header('Content-Disposition: attachment; filename=' . $attachmentName);
                header('Expires: ' . date('D, d M Y H:i:s \G\M\T', time() + 31536000));
                header('Pragma: no-cache');
                header('Last-Modified: ' . date('D, d M Y H:i:s \G\M\T', filemtime($filename)));
                readfile($filename);
            }
            
            // Delete the file
            unlink($filename);
            
            // Delete the temp folder
            rmdir($destDir);
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // @param $string               The string to format
        // @param $maxLength            The maximum length of the string or null
        private function formatSarsString($string, $maxLength) {
            if( strlen($string) === 0 ) {
                return '';
            }
            
            // Remove all whitespace characters from the start and end of the string
            $formattedString = trim($string);
            
            // Remove unallowed characters from the string
            $formattedString = str_replace("," , "" , $formattedString);
            $formattedString = str_replace("|" , "" , $formattedString);
            
            // Is there a max length for the stirng?
            if( $maxLength !== null ) {
                $formattedString = substr($formattedString, 0, $maxLength);
            }
            
            // Add the quotes for the string
            $formattedString = '"' . $formattedString . '"';
            
            return $formattedString;
        }
    }
?>