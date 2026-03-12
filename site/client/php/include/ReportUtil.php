<?php
    // Set namespace
    namespace ReportUtil;
    
    // Import namespaces
    use \DateTime as DateTime;
    
    // Import files
    \System::includeFile('Util.php');
    
    // Function to get the data required for the birthday report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getBirthdayData($data, $user, $db) {
        $sqlParams = [];
        
        // Build where clause if a search string was given
        $whereClause = '';
        if( isset($data['searchString']) && $data['searchString'] !== '' ) {
            $sqlParams[] = $data['searchString'];
            $whereClause = 
                ' WHERE (' . 
                'employees.code ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                ' OR employees.full_names || \' \' || employees.last_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR employees.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR employees.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR employees.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
        }
        
        // Add a filter for the birtday month
        if( isset($data['month']) && ($data['month'] !== null) ) {
            if( $whereClause !== '' ) {
                $whereClause = $whereClause . ' AND ';
            }
            else {
                $whereClause = 'WHERE ';
            }
            
            $sqlParams[] = $data['month'];
            $whereClause = $whereClause . ' (EXTRACT(MONTH FROM date_of_birth) = $'. count($sqlParams) . ') ';
        }
        
        // Add a filter for the birtday day
        if( isset($data['day']) && ($data['day'] !== null) ) {
            if( $whereClause !== '' ) {
                $whereClause = $whereClause . ' AND ';
            }
            else {
                $whereClause = 'WHERE ';
            }
            
            $sqlParams[] = $data['day'];
            $whereClause = $whereClause . ' (EXTRACT(DAY FROM date_of_birth) = $'. count($sqlParams) . ') ';
        }
        
        // Check that sort order given is valid
        if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
            return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
        }
        
        // Process limit offset
        $limitOffset = '';
        if( $data['limit'] !== null ) {
            $sqlParams[] = $data['limit'];
            $limitOffset = $limitOffset . 'LIMIT $' . count($sqlParams) . ' ';
        }
        
        // Add offset if given
        if( $data['offset'] !== null ) {
            $sqlParams[] = $data['offset'];
            $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
        }
        
        // Load all employees from the employees table
        $sqlQuery = 
            'SELECT ' .
                'employees.id, ' .
                'employees.code, ' .
                'employees.cell_number, ' .
                'employees.email_address, ' .
                'employees.alias, ' .
                'employees.date_of_birth ' .
            'FROM ' .
                'employees ' .
            $whereClause . ' ' .
            'ORDER BY ' .
                'EXTRACT( MONTH FROM employees.date_of_birth ) ' . $data['sortOrder'] . ', ' . 
                'EXTRACT( DAY FROM employees.date_of_birth ) ' . $data['sortOrder'] . ', ' . 
                'employees.alias ' . $data['sortOrder'] . ' ' .
            $limitOffset;
        $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Create the result
        $employees = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Convert the date string to a date object
            $dateOfBirth = date_create($sqlRow['date_of_birth']);
            
            // Add the row
            $employees[] = [
                'id' => $sqlRow['id'],
                'code' => $sqlRow['code'],
                'alias' => $sqlRow['alias'],
                'dateOfBirth' => $sqlRow['date_of_birth'],
                'cellNumber' => $sqlRow['cell_number'],
                'emailAddress' => $sqlRow['email_address'],
                'birthday' => date_format($dateOfBirth, "F j")
            ];
        }
        
        // Return the result
        return( ['ok' => true, 'employees' => $employees] );
    }
    
    // Function to get the data required for the employee details report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getEmployeeDetailsData($data, $user, $db) {
        $sqlParams = [];
            
        // Build where clause
        $whereClause = '';
        
        // Should a departmentId filter be added?
        if( isset($data['departmentId']) && $data['departmentId'] !== '' ) {
            if( $whereClause === '') 
                $whereClause = 'WHERE ' ;
            else 
                $whereClause = $whereClause . 'AND ';
            $sqlParams[] = $data['departmentId'];
            $whereClause = $whereClause . ' departments.id = $' . count($sqlParams);
        }
        
        // Should a departmentName filter be added?
        if( isset($data['departmentName']) && $data['departmentName'] !== '' ) {
            if( $whereClause === '') 
                $whereClause = 'WHERE ' ;
            else 
                $whereClause = $whereClause . 'AND ';
            $sqlParams[] = $data['departmentName'];
            $whereClause = $whereClause . ' departments.name = $' . count($sqlParams);
        }
        
        // Should a employment status filter be added?
        if( isset($data['employeeStatus']) && $data['employeeStatus'] !== '' ) {
            if ($data['employeeStatus'] !== 'all') {
                if( $whereClause === '') {
                    $whereClause = 'WHERE ' ;
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                
                if ($data['employeeStatus'] === 'employed') {
                    $whereClause = $whereClause . ' employment_end_date IS NULL ';
                }
                else if ($data['employeeStatus'] === 'dismissed') {
                    $whereClause = $whereClause . 'employment_end_date IS NOT NULL AND employment_end_date <= NOW()::Date ';
                }
            }
        }
        
        // Add filters for employee start and end date
        $whereOrAnd = ' AND ' ;
        if( $whereClause === '') {
            $whereOrAnd = 'WHERE ' ;
        }
        
        if( $data['employmentStartDate'] !== '' && $data['employmentEndDate'] !== '' ) {
            $sqlParams[] = $data['employmentStartDate'];
            $whereClause = $whereClause . $whereOrAnd . ' (employment_start_date BETWEEN $' . count($sqlParams);
            $sqlParams[] = $data['employmentEndDate'];
            $whereClause = $whereClause . ' AND $' .count($sqlParams) . ') ';
        }
        else if( $data['employmentStartDate'] === '' && $data['employmentEndDate'] !== '' ) {
            $sqlParams[] = $data['employmentEndDate'];
            $whereClause = $whereClause . $whereOrAnd . ' (employment_start_date < $' . count($sqlParams) . ') ';
        }
        else if( $data['employmentStartDate'] !== '' && $data['employmentEndDate'] === '' ) {
            $sqlParams[] = $data['employmentStartDate'];
            $whereClause = $whereClause . $whereOrAnd . '  (employment_start_date > $' . count($sqlParams) . ') ';
        }
        
        // Check that sort order given is valid
        if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
            return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
        }
        
        // Process limit offset
        $limitOffset = '';
        
        // Load all employees from the employees table
        $sqlQuery = 
            // 'WITH payslip_details AS ( ' .
            //     'SELECT ' .
            //         'payslips.id AS payslip_id,'.
            //         'payslips.employee_id, ' .
            //         'payslip_items.payslip_item_type_code, ' .
            //         'payslip_item_types.payslip_category_code, ' .
            //         'payslip_items.total ' .
            //     'FROM  ' .
            //         'payslips ' .
                
            //     'LEFT JOIN ' .
            //         'payruns ON payruns.id = payslips.payrun_id ' .
            //     'LEFT JOIN  ' .
            //         'payslip_items ON payslip_items.payslip_id = payslips.id ' .
            //     'LEFT JOIN ' .
            //         'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
            //     'WHERE ' .
            //         'payslips.status_code = \'ACTI\' AND ' .
            //         'payruns.processed_on IS NOT NULL AND ' .
            //        // 'EXTRACT(MONTH FROM payslips.to_date) = ' .
            //         'EXTRACT(YEAR FROM payslips.to_date) = EXTRACT(YEAR FROM NOW()) ' .
            //     '), ' . 
            //     'income_details AS ( ' .
            //         'SELECT ' .
            //             'payslip_id, ' .
            //             'employee_id, ' .
            //             'SUM(total) AS total ' .
            //         'FROM ' .
            //             'payslip_details ' .
            //         'WHERE ' .
            //             'payslip_category_code = \'INCO\' ' .
            //         'GROUP BY ' .
            //             'payslip_id, employee_id ' .
            // ') ' . 
            'SELECT ' .
                'employees.id, ' . 
                'employees.code, ' . 
                'employees.title_code, ' .
                'title_types.name AS title_name, ' .
                'employees.initials, ' .
                'employees.full_names, ' . 
                'employees.first_name, ' . 
                'employees.last_name, ' . 
                'employees.alias, ' .
                'employees.id_number, ' . 
                'employees.passport_number, ' . 
                'employees.passport_country AS passport_country_code, ' .
                'passport_countries.name AS passport_country_name,' .
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
                'physical_address_countries.name AS physical_address_country_name, ' . 
                'employees.postal_same_as_physical_address, ' .
                'employees.postal_address_line_1, ' . 
                'employees.postal_address_line_2, ' .
                'employees.postal_address_line_3, ' . 
                'employees.postal_address_code, ' .
                'employees.postal_address_country_code, ' . 
                'postal_address_countries.name AS postal_address_country_name, ' . 
                'employees.work_same_as_company_address, ' .
                'employees.work_address_unit, ' . 
                'employees.work_address_complex, ' .
                'employees.work_address_street, ' . 
                'employees.work_address_suburb, ' .
                'employees.work_address_city, ' . 
                'employees.work_address_postal_code, ' .
                'employees.work_address_country_code, ' . 
                'work_address_countries.name AS work_address_country_name, ' .
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
                'departments.name AS department_name, ' . 
                'employees.payment_method_code, ' .
                'payment_methods.name AS payment_method_name, ' . 
                'employees.payment_period_code, ' . 
                'payment_period_types.name AS payment_period_type_name, ' . 
                'employees.payment_day, ' . 
                'employees.payment_period_end_day, ' . 
                'employees.income_tax_number, ' .
                'employee_bank_details.account_number AS employee_account_number, ' . 
                'employee_bank_details.branch_code AS employee_branch_code, '.
                'financial_institutions.name AS employee_financial_institution_name, ' . 
                'bank_account_types.code AS employee_bank_account_type_code,'.
                'employees.sic_code, ' . 
                'employees.send_payslip_by_email, ' .
                'employees.created_on, ' . 
                'employees.created_by_user_id, ' . 
                'employees.enable_paye_correction, ' .
                'sic_codes.code AS sic_code, ' . 
                'employees.income_tax_directive_1, ' . 
                'employees.income_tax_directive_1_issued_date, ' . 
                'employees.income_tax_directive_1_source_code, ' . 
                'employees.income_tax_directive_1_amount,'.
                'employees.income_tax_directive_2, ' .
                'employees.income_tax_directive_2_issued_date, ' . 
                'employees.income_tax_directive_2_source_code, ' . 
                'employees.income_tax_directive_2_amount, ' .
                'employees.income_tax_directive_3, ' . 
                'employees.income_tax_directive_3_issued_date,' . 
                'employees.income_tax_directive_3_source_code, ' . 
                'employees.income_tax_directive_3_amount '.
               // 'income_details.total AS gross_salary '.
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'departments ON employees.department_id = departments.id ' .
            'LEFT JOIN ' .
                'sic_codes ON employees.sic_code = sic_codes.code ' .
            'LEFT JOIN '.
                'title_types ON employees.title_code = title_types.code '.
            'LEFT JOIN ' .
                'payment_methods ON payment_method_code = payment_methods.code ' .
            'LEFT JOIN ' .
                'payment_period_types ON payment_period_code = payment_period_types.code ' .
            'LEFT JOIN ' .
                'countries AS work_address_countries ON work_address_country_code = work_address_countries.code ' .
            'LEFT JOIN ' .
                'countries AS physical_address_countries ON physical_address_country_code = physical_address_countries.code ' .
            'LEFT JOIN ' .
                'countries AS passport_countries ON passport_country = passport_countries.code ' .
            'LEFT JOIN '.
                'countries AS postal_address_countries ON postal_address_country_code = postal_address_countries.code '.
            'LEFT JOIN '. 
                'employee_bank_details  ON employees.id = employee_bank_details.employee_id '.
            'LEFT JOIN '.
                'financial_institutions ON employee_bank_details.financial_institution_code = financial_institutions.code '.
            'LEFT JOIN '.
                'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code '.
           // 'LEFT JOIN '.
            //    'income_details ON  employees.id = income_details.employee_id '.
            $whereClause . ' ' .
            'ORDER BY ' .
                'employees.alias ' . $data['sortOrder'];
        $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Create the result
        $employees = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set employment period and status
            $employmentEndDate = ($sqlRow['employment_end_date'] !== null ? new DateTime($sqlRow['employment_end_date']) : null);
            $employmentStartDate = new DateTime($sqlRow['employment_start_date']);
            $currentDate = new DateTime();
            $employmentStatus = 'Employed';
            if ($sqlRow['employment_end_date'] !== null) {
                if ($employmentEndDate <= $currentDate) {
                    $employmentStatus = 'Dismissed';
                }
            }
            
            if ($employmentStartDate > $currentDate) {
                $employmentStatus = 'Pending';
            }
            
            $employees[] = [
                'id' => $sqlRow['id'],
                'code' => $sqlRow['code'],
                'titleCode' => $sqlRow['title_code'],
                'titleName' => $sqlRow['title_name'],
                'initials' => $sqlRow['initials'],
                'fullNames' => $sqlRow['full_names'],
                'firstName' => $sqlRow['first_name'],
                'lastName' => $sqlRow['last_name'],
                'alias' => $sqlRow['alias'],
                'idNumber' => $sqlRow['id_number'],
                'passportNumber' => $sqlRow['passport_number'],
                'passportCountryCode' => $sqlRow['passport_country_code'],
                'passportCountryName' => $sqlRow['passport_country_name'],
                'dateOfBirth' => $sqlRow['date_of_birth'],
                'isAsylumSeeker' => $sqlRow['is_asylum_seeker'],
                'isRefugee' => $sqlRow['is_refugee'],
                'isRetired' => $sqlRow['is_retired'],
                'physicalAddressUnit' => $sqlRow['physical_address_unit'],
                'physicalAddressComplex' => $sqlRow['physical_address_complex'],
                'physicalAddressStreet' => $sqlRow['physical_address_street'],
                'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                'physicalAddressCity' => $sqlRow['physical_address_city'],
                'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                'physicalAddressCountryCode' => $sqlRow['physical_address_country_code'],
                'physicalAddressCountryName' => $sqlRow['physical_address_country_name'],
                'postalSameAsPhysicalAddress' => $sqlRow['postal_same_as_physical_address'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'postalAddressCountryCode' => $sqlRow['postal_address_country_code'],
                'postalAddressCountryName' => $sqlRow['postal_address_country_name'],
                'workSameAsCompanyAddress' => $sqlRow['work_same_as_company_address'],
                'workAddressUnit' => $sqlRow['work_address_unit'],
                'workAddressComplex' => $sqlRow['work_address_complex'],
                'workAddressStreet' => $sqlRow['work_address_street'],
                'workAddressSuburb' => $sqlRow['work_address_suburb'],
                'workAddressCity' => $sqlRow['work_address_city'],
                'workAddressPostalCode' => $sqlRow['work_address_postal_code'],
                'workAddressCountryCode' => $sqlRow['work_address_country_code'],
                'workAddressCountryName' => $sqlRow['work_address_country_name'],
                'homeNumber' => $sqlRow['home_number'],
                'workNumber' => $sqlRow['work_number'],
                'cellNumber' => $sqlRow['cell_number'],
                'faxNumber' => $sqlRow['fax_number'],
                'emailAddress' => $sqlRow['email_address'],
                'emergencyContactPerson' => $sqlRow['emergency_contact_person'],
                'emergencyContactNumber' => $sqlRow['emergency_contact_number'],
                'employmentStartDate' => $sqlRow['employment_start_date'],
                'employmentEndDate' => $sqlRow['employment_end_date'],
                'employmentPosition' => $sqlRow['employment_position'],
                'employmentStatus' => $employmentStatus,
                'departmentId' => $sqlRow['department_id'],
                'departmentName' => $sqlRow['department_name'],
                'paymentMethodCode' => $sqlRow['payment_method_code'],
                'paymentMethodName' => $sqlRow['payment_method_name'],
                'paymentPeriodCode' => $sqlRow['payment_period_code'],
                'paymentPeriodTypeName' => $sqlRow['payment_period_type_name'],
                'paymentDay' => $sqlRow['payment_day'],
                'paymentPeriodEndDay' => $sqlRow['payment_period_end_day'],
                'employeeFinancialInstitutionName' => $sqlRow['employee_financial_institution_name'],
                'employeeBankAccountTypeCode' => $sqlRow['employee_bank_account_type_code'],
                'employeeAccountNumber' => $sqlRow['employee_account_number'],
                'employeeBranchCode' => $sqlRow['employee_branch_code'],
                'incomeTaxNumber' => $sqlRow['income_tax_number'],
                'incomeTaxDirective1' => $sqlRow['income_tax_directive_1'],
                'incomeTaxDirective1IssuedDate' => $sqlRow['income_tax_directive_1_issued_date'],
                'incomeTaxDirective1SourceCode' => $sqlRow['income_tax_directive_1_source_code'],
                'incomeTaxDirective1Amount' => $sqlRow['income_tax_directive_1_amount'],
                'incomeTaxDirective2' => $sqlRow['income_tax_directive_2'],
                'incomeTaxDirective2IssuedDate' => $sqlRow['income_tax_directive_2_issued_date'],
                'incomeTaxDirective2SourceCode' => $sqlRow['income_tax_directive_2_source_code'],
                'incomeTaxDirective2Amount' => $sqlRow['income_tax_directive_2_amount'],
                'incomeTaxDirective3' => $sqlRow['income_tax_directive_3'],
                'incomeTaxDirective3IssuedDate' => $sqlRow['income_tax_directive_3_issued_date'],
                'incomeTaxDirective3SourceCode' => $sqlRow['income_tax_directive_3_source_code'],
                'incomeTaxDirective3Amount' => $sqlRow['income_tax_directive_3_amount'],
                'sicCode' => $sqlRow['sic_code'],
                'sendPayslipByEmail' => $sqlRow['send_payslip_by_email'],
                'enablePayeCorrection' => $sqlRow['enable_paye_correction'],
                // 'grossSalary' => $sqlRow['gross_salary'],
                'createdOn' => $sqlRow['created_on'],
                'createdByUserId' => $sqlRow['created_by_user_id'],
            ];
        }
        
        // Return the result
        return( ['ok' => true, 'employees' => $employees] );
    }
    
    // Function to get the data required for the leave summary report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getLeaveSummaryData($data, $user, $db) {
        // Get details about the specified leave type
        $sqlQuery = 'SELECT name, leave_unit_code FROM leave_types WHERE id = $1';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        $sqlRow = $sqlResult->fetchAssociative();
        $leaveTypeName = $sqlRow['name'];
        
        $leaveTypeUnit = 'h';
        if ($sqlRow['leave_unit_code'] === 'DAYS') {
            $leaveTypeUnit = 'd';
        }
        
        // Get the leave actions
        $sqlQuery = 'SELECT code, name FROM leave_actions';
        $sqlResult = $db->paramQuery($sqlQuery, []);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        $leaveActions = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $leaveActions[] = [
                'code' => $sqlRow['code'],
                'name' => $sqlRow['name'],
                'amount' => '0.00'
            ];
        }
        
        // Get the employee details
        $sqlQuery = 'SELECT id, alias, code FROM employees ORDER BY alias ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, []);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Create the leave summary for each employee
        $leaveSummary = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $closingBalanceAmount = 0;
            $leaveWhereClause = '';
            $leaveSqlParams = [];
            $leave = $leaveActions;
            
            $startingSqlParams = [];
            $closingSqlParams = [];
            
            $useStartBalance = false;
            $useClosingBalance = false;
            $startingSqlParams[] = $sqlRow['id'];
            $startingSqlParams[] = $data['leaveTypeId'];
            
            $closingSqlParams[] = $sqlRow['id'];
            $closingSqlParams[] = $data['leaveTypeId'];
            
            $leaveSqlParams[] = $sqlRow['id'];
            $leaveSqlParams[] = $data['leaveTypeId'];
            
            // Setup filters and parameters depending on the start and end dates
            if ($data['startDate'] !== '' && $data['endDate'] !== '') {
                $leaveWhereClause = 'AND (date BETWEEN $3 AND $4) ';
                
                $leaveSqlParams[] = $data['startDate'];
                $leaveSqlParams[] = $data['endDate'];
                $startingSqlParams[] = $data['startDate'];
                $closingSqlParams[] = $data['endDate'];
                
                $useStartBalance = true;
                $useClosingBalance = true;
            }
            else if ($data['startDate'] === '' && $data['endDate'] !== '') {
                $leaveWhereClause = 'AND (date < $3) ';
                
                $leaveSqlParams[] = $data['endDate'];
                $closingSqlParams[] = $data['endDate'];
                
                $useStartBalance = false;
                $useClosingBalance = true;
            }
            else if ($data['startDate'] !== '' && $data['endDate'] === '') {
                $leaveWhereClause = 'AND (date > $3) ';
                
                $leaveSqlParams[] = $data['startDate'];
                $startingSqlParams[] = $data['startDate'];
                
                $useStartBalance = true;
                $useClosingBalance = false;
            }
            else if ($data['startDate'] === '' && $data['endDate'] === '') {
                $leaveWhereClause = '';
                
                $useStartBalance = false;
                $useClosingBalance = false;
            }
            
            // Run the query to get leave details
            $leaveQuery = 
                'SELECT ' .
                    'SUM(days) AS days, SUM(hours) AS hours, leave_action_code ' .
                'FROM ' .
                    'leave  ' .
                'LEFT JOIN ' .
                    'leave_types ON leave.leave_type_id = leave_types.id ' .
                'WHERE ' .
                    'employee_id = $1 AND leave_type_id = $2 ' . 
                    $leaveWhereClause  .
                'GROUP BY leave_action_code ' ;
            $leaveSqlResult = $db->paramQuery($leaveQuery, $leaveSqlParams);
            if( !$leaveSqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Get leave and calculate closing balance
            while( $leaveSqlRow = $leaveSqlResult->fetchAssociative() ) {
                for ($i=0; $i < count($leave); $i++) { 
                    if ($leave[$i]['code'] === $leaveSqlRow['leave_action_code']) {
                        $amount = $leaveSqlRow['hours'];
                        if ($leaveTypeUnit === 'd') {
                            $amount = $leaveSqlRow['days'];
                        }
                        $leave[$i]['amount'] = $amount;
                        $closingBalanceAmount = $closingBalanceAmount + $amount;
                    }
                }
            }
            
            // Calculate the starting balance, if any
            $startingBalanceAmount = 0;
            if ($useStartBalance) {
                $startingBalanceQuery = 
                    'SELECT ' .
                        'SUM(days) AS days, SUM(hours) AS hours, leave_units.name AS leave_unit_name ' .
                    'FROM ' . 
                        'leave  ' .
                    'LEFT JOIN ' .
                        'leave_types ON leave.leave_type_id = leave_types.id ' .
                    'LEFT JOIN ' .
                        'leave_units ON leave_types.leave_unit_code = leave_units.code ' .
                    'WHERE '. 
                        'employee_id = $1 AND leave_type_id = $2 AND (date < $3) ' .
                    'GROUP BY leave_units.name ' ;
                $startingBalanceSqlResult = $db->paramQuery($startingBalanceQuery, $startingSqlParams);
                if( !$startingBalanceSqlResult->isValid() ) {
                    return( ['ok' => false, 'error' => 'Database error.'] );
                }
                
                if( $startingBalanceSqlResult->getRowCount() == 1 ) {
                    $startingBalanceLeaveSqlRow = $startingBalanceSqlResult->fetchAssociative();
                    $startingBalanceAmount = $startingBalanceLeaveSqlRow['hours'];
                    if ($leaveTypeUnit === 'd') {
                        $startingBalanceAmount = $startingBalanceLeaveSqlRow['days'];
                        $closingBalanceAmount = $closingBalanceAmount + $startingBalanceLeaveSqlRow['days'];
                    }
                }
            }
            
            // Add the leave summary for the specified employee
            $leaveSummary[] = [
                'id' => $sqlRow['id'],
                'code' => $sqlRow['code'],
                'alias' => $sqlRow['alias'],
                'leave' => $leave,
                'startingBalanceAmount' => $startingBalanceAmount,
                'closingBalanceAmount' => $closingBalanceAmount,
                'leaveTypeUnit' => $leaveTypeUnit,
            ];
        }
        
        // Return the result
        return( ['ok' => true, 'leaveSummary' => $leaveSummary] );
    }
    
    // Function to get the data required for the employee leave report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getEmployeeLeaveData($data, $user, $db) {
        // Check if the start date is valid
        $tempDate = explode('-', $data['startDate']);
        if( !checkdate($tempDate[1], $tempDate[2], $tempDate[0]) ) {
            return( ['ok' => false, 'error' => '\'' . $data['startDate'] . '\' is not a valid start date'] );
        }
        
        // Check if the end date is valid
        $tempDate = explode('-', $data['endDate']);
        if( !checkdate($tempDate[1], $tempDate[2], $tempDate[0]) ) {
            return( ['ok' => false, 'error' => '\'' . $data['startDate'] . '\' is not a valid end date'] );
        }
        
        // Check if the start date is before the end date
        if( $data['startDate'] > $data['endDate'] ) {
            return( ['ok' => false, 'error' => 'The start date cannot be after the end date'] );
        }
        
        // Get the leave starting balance data
        $leaveStartingBalanceData = \LeaveUtil\getLeaveBalances( 
            $data['employeeId'], 
            '1900-01-01', 
            $data['startDate'], 
            null, 
            $db 
        );
        
        // Get the leave data
        $leaveData = \LeaveUtil\getLeaveBalances( 
            $data['employeeId'], 
            $data['startDate'], 
            $data['endDate'], 
            null, 
            $db 
        );
        
        // Set the leave balances
        $employeeLeave = [];
        foreach($leaveData as $key => $value) {
            $employeeLeave[] = [
                'leaveType' => $key,
                'leaveTypeId' => $leaveData[$key]['id'],
                'adjustment' => $leaveData[$key]['adjustment'],
                'leaveTaken' => $leaveData[$key]['taken'],
                'accrued' => $leaveData[$key]['accrued'],
                'startingBalance' => $leaveStartingBalanceData[$key]['balance'],
                'closingBalance' => $leaveData[$key]['balance'],
                'leaveTypeUnit' => $leaveData[$key]['unit']
            ];
        }
        
        // Sort the balances array
        array_multisort(array_column($employeeLeave, 'leaveType'),  SORT_ASC,
            array_column($employeeLeave, 'closingBalance'), SORT_ASC,
            $employeeLeave
        );
        
        // Return the result
        return( ['ok' => true, 'employeeLeave' => $employeeLeave] );
    }
    
    // Function to get the data required for the uif report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getUifData($data, $user, $db) {
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Depending on the selected filter type
        if( $data['filterType'] === 'PAYR' ) {
        }
        else if( $data['filterType'] === 'PERI' ) {
        }
        else {
            return( ['ok' => false, 'error' => 'Unknown filter specified'] );
        }
        
        
        //
        // GET REQUIRED COMPANY UIF DETAILS
        //
        
        $sqlQuery =
            'SELECT ' . 
                'company_details.sdl_payment_reference_number, ' .
                'company_details.uif_payment_reference_number, ' .
                'company_details.uif_registration_number, ' .
                'company_details.uif_contact_person, ' .
                'company_details.uif_contact_email_address, ' .
                'company_details.uif_contact_number ' .
            'FROM ' . 
                'company_details '.
            'ORDER BY id DESC LIMIT 1; ';
            
        $sqlResult = $db->paramQuery($sqlQuery, []);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        $sqlRow = $sqlResult->fetchAssociative();
        $uifReferenceNumber = $sqlRow['uif_payment_reference_number'];
        
        
        //
        // GET REQUIRED PAYRUN DETAILS
        //
        
        // Should the report be filtered by payrun?
        if( $data['filterType'] === 'PAYR' ) {
            // Get payrun details from database
            $sqlQuery =
                'SELECT ' . 
                    'payruns.from_date, ' .
                    'payruns.to_date ' .
                'FROM ' . 
                    'payruns '.
                'WHERE '  . 
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                return( ['ok' => false, 'error' => 'The specified payrun could not be found.'] );
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $startDate = $sqlRow['from_date'];
            $endDate = $sqlRow['to_date'];
        }
        
        
        //
        // BUILD QUERY
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
                $whereClause = $whereClause . '(employees.employment_start_date <= $' . count($sqlParams) .') ';
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
        
        // Load all employees from the employees table
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
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Create employees array
        $employees = [];
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
            
            // Set the first part of the filter caluse
            // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
            $filterClause = ' AND (';
            
            // Depending on the selected filter type
            if( $data['filterType'] === 'PAYR' ) {
                // Was no payrun specified?
                if( $data['payrunId'] == null ) {
                    return( ['ok' => false, 'error' => 'No payrun specified'] );
                }
                
                // Setup the filter clause
                $filterCount++;
                $filterValues[] = $data['payrunId'];
                $filterClause = $filterClause . '(payrun_id = $' . $filterCount . ') ';
            }
            else if( $data['filterType'] === 'PERI' ) {
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
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Are there no payslips for the specified employee?
            if( $payslipResult->getRowCount() <= 0 ) {
                // Set the non-contribution reason
                $nonContributionReason = 6;
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
                    return( ['ok' => false, 'error' => 'Database error.'] );
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
                            return( ['ok' => false, 'error' => 'Database error.'] );
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
                                return( ['ok' => false, 'error' => 'Database error.'] );
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
                            $nonContributionReason = 5;
                        }
                        else if( $totalHoursWorked < 24 ) {
                            $nonContributionReason = 1;
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
            $employmentStatus = '';
            if( $employmentEndDate !== '' ) {
                $employmentStatus = 4;
                
                if( $sqlRow['dismissal_reason'] === 'ABSC' ) {
                    $employmentStatus = 13;
                }
                else if( $sqlRow['dismissal_reason'] === 'BUCL' ) {
                    $employmentStatus = 14;
                }
                else if( $sqlRow['dismissal_reason'] === 'CODI' ) {
                    $employmentStatus = 7;
                }
                else if( $sqlRow['dismissal_reason'] === 'DECE' ) {
                    $employmentStatus = 2;
                }
                else if( $sqlRow['dismissal_reason'] === 'DISM' ) {
                    $employmentStatus = 4;
                }
                else if( $sqlRow['dismissal_reason'] === 'EMIN' ) {
                    $employmentStatus = 8;
                }
                else if( $sqlRow['dismissal_reason'] === 'ENCO' ) {
                    $employmentStatus = 5;
                }
                else if( $sqlRow['dismissal_reason'] === 'ILLN' ) {
                    $employmentStatus = 10;
                }
                else if( $sqlRow['dismissal_reason'] === 'RESI' ) {
                    $employmentStatus = 6;
                }
                else if( $sqlRow['dismissal_reason'] === 'RETR' ) {
                    $employmentStatus = 11;
                }
                else if( $sqlRow['dismissal_reason'] === 'TRAN' ) {
                    $employmentStatus = 12;
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
            
            // Don'y add the employee details if it is not a detailed report
            if( $data['detail'] !== 'DETA' ) continue;
            
            // Add the employee UIF details
            $employees[] = [
                'uifReferenceNumber' => $uifReferenceNumber,
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
        }
        
        $totals = [
            'hoursWorkedTotal' => $hoursWorkedTotal,
            'taxableRemunerationTotal' => $taxableRemunerationTotal,
            'uifRemunerationTotal' => $uifRemunerationTotal,
            'uifContributionTotal' => $uifContributionTotal
        ];
        
        // Return the result
        return( ['ok' => true, 'employees' => $employees, 'totals' => $totals] );
    }
    
    // Function to get the data required for the nett pay report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getNettPayData($data, $user, $db) {
        $payrunName = '';
            
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Depending on the selected filter type
        if( $data['filterType'] === 'PAYR' ) {
            // Was no payrun specified?
            if( $data['payrunId'] == null ) {
                return( ['ok' => false, 'error' => 'No payrun specified'] );
            }
            
            // Get the payrun name
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunName = $sqlRow['description'];
            
            // Setup the filter clause
            $filterCount++;
            $filterValues[] = $data['payrunId'];
            $filterClause = ' AND payrun_id = $' . $filterCount;
            
        }
        else if( $data['filterType'] === 'PERI' ) {
            // Was either a start or end date specified?
            if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND ( ';
                
                // Was a start date specified?
                if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                    // Set the payrun name
                    $payrunName = $payrunName . '' . $data['startDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['startDate'];
                    $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                }
                
                // Was an end date specified?
                if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                    // Set the payrun name
                    if( $filterCount > 0 ) $payrunName = $payrunName . '_';
                    $payrunName = $payrunName . 'to_' . $data['endDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['endDate'];
                    $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                }
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
            }
            else {
                // Set the payrun name
                $payrunName = 'All Time';
            }
        }
        else {
            return( ['ok' => false, 'error' => 'Unknown filter specified'] );
        }
        
        // Load all payslip items from database
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM  ' .
                    'payslips ' .
                'LEFT JOIN  ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' ' . 
                    $filterClause .
            '), ' . 
            'income_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'INCO\' OR ' .
                    'payslip_category_code = \'ALLO\' OR ' .
                    'payslip_category_code = \'FBEN\' AND include_in_nett_pay = true ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'deduction_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'DEDU\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            ') ' . 
            'SELECT ' .
                'payslips.id AS payslip_id, ' .
                'payslips.employee_id, ' .
                'employees.code AS employee_code, ' .
                'employees.full_names, ' .
                'employees.last_name, ' .
                'employees.alias AS employee_alias, ' .
                'employees.id_number, ' .
                'employees.email_address, ' .
                'payment_methods.name AS payment_method_name, ' .
                'bank_account_types.name AS bank_account_type_name, ' .
                'financial_institutions.name AS financial_institution_name, ' .
                'employee_bank_details.account_number, ' .
                'employee_bank_details.branch_code, ' .
                'CAST(COALESCE(income_details.total, 0) - COALESCE(deduction_details.total, 0) AS FLOAT) AS nett_income ' .
            'FROM ' .
                'payslips ' .
            'LEFT JOIN ' .
                'income_details ON income_details.payslip_id = payslips.id AND ' .
                    'income_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'deduction_details ON deduction_details.payslip_id = payslips.id AND ' .
                    'deduction_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'employees ON employees.id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'payment_methods ON employees.payment_method_code = payment_methods.code ' .
            'LEFT JOIN ' .
                'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'bank_account_types ON bank_account_types.code = employee_bank_details.bank_account_type_code ' .
            'LEFT JOIN ' .
                'financial_institutions ON financial_institutions.code = employee_bank_details.financial_institution_code ' .
            'WHERE ' .
                'payslips.status_code = \'ACTI\' ' . 
                $filterClause .
            'ORDER BY ' . 
                'employee_alias ASC, ' . 
                'employee_code ASC ';
        $sqlResult = $db->paramQuery($sqlQuery, $filterValues);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Save the employee details
        $employees = [];
        $nettPayTotal = 0;
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'paymentMethodName' => $sqlRow['payment_method_name'],
                'employeeId' => $sqlRow['employee_id'],
                'financialInstitutionName' => $sqlRow['financial_institution_name'],
                'branchCode' => $sqlRow['branch_code'],
                'bankAccountTypeName' => $sqlRow['bank_account_type_name'],
                'accountNumber' => $sqlRow['account_number'],
                'nettPay' => $sqlRow['nett_income']
            ];
            
            $nettPayTotal = $nettPayTotal + $sqlRow['nett_income'];
        }
        
        // Return the result
        return( ['ok' => true, 'payrunName' => $payrunName, 'employees' => $employees, 'nettPayTotal' => $nettPayTotal] );
    }
    
    // Function to get the data required for the EMP 201 report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getEmp201Data($data, $user, $db) {
        // Set the tax month
        $taxMonth = $data['monthNumber'];
        
        // Set the year to the year before given tax year
        $actualYear = $data['taxYear'] - 1;
        
        // Are we in the given tax year?
        if( $taxMonth < 3 ) { 
            // Set the year to the given tax year
            $actualYear = $data['taxYear'];
        }
        
        // Get the PAYE, UIF, & SDL totals for the given period
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.employee_id, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_items.total ' .
                'FROM  ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                'LEFT JOIN  ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payruns.processed_on IS NOT NULL AND ' .
                    'EXTRACT(MONTH FROM payslips.to_date) = $1 AND ' .
                    'EXTRACT(YEAR FROM payslips.to_date) = $2 ' .
            '), ' . 
            'paye_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2000\' OR  ' .
                    'payslip_item_type_code = \'2001\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' . 
            'uif_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2002\' OR ' .
                    'payslip_item_type_code = \'3001\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' . 
            'sdl_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'3002\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            ') ' .
            'SELECT DISTINCT ' .
                'payslips.employee_id, ' .
                'employees.alias AS employee_alias, ' .
                'employees.code AS employee_code, ' .
                'employees.email_address, ' .
                'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                'CAST(COALESCE(uif_details.total, 0) AS FLOAT) AS total_uif, ' .
                'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl ' .
            'FROM ' .
                'payslips ' .
            'LEFT JOIN ' .
                'payruns ON payruns.id = payslips.payrun_id ' .
            'LEFT JOIN ' .
                'employees ON employees.id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'paye_details ON paye_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'uif_details ON uif_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'sdl_details ON sdl_details.employee_id = payslips.employee_id ' .
            'WHERE ' .
                'payslips.status_code = \'ACTI\' AND ' .
                'payruns.processed_on IS NOT NULL AND ' .
                'EXTRACT(MONTH FROM payslips.to_date) = $1 AND ' .
                'EXTRACT(YEAR FROM payslips.to_date) = $2 ' .
            'ORDER BY ' .
                ' employees.alias ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, [$taxMonth, $actualYear]);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Save the employee details
        $employees = [];
        $payeTotal = 0;
        $uifTotal = 0;
        $sdlTotal = 0;
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'employeeId' => $sqlRow['employee_id'],
                'paye' => number_format((float)$sqlRow['total_paye'], 2, '.', ''),
                'uif' => number_format((float)$sqlRow['total_uif'], 2, '.', ''),
                'sdl' => number_format((float)$sqlRow['total_sdl'], 2, '.', '')
            ];
            
            $payeTotal = $payeTotal + $sqlRow['total_paye'];
            $uifTotal = $uifTotal + $sqlRow['total_uif'];
            $sdlTotal = $sdlTotal + $sqlRow['total_sdl'];
        }
        
        // Save the totals
        $totals = [
            'payeTotal' => $payeTotal,
            'uifTotal' => $uifTotal,
            'sdlTotal' => $sdlTotal
        ];
        
        // Return the result
        return( ['ok' => true, 'employees' => $employees, 'totals' => $totals] );
    }
    
    // Function to get the data required for the EMP 501 report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getEmp501Data($data, $user, $db) {
        // Set the number of months to process depending on the reconciliation type
        $numMonths = 12;
        if( $data['reconciliationType'] === 'INTE' ) {
            $numMonths = 6;
        }
        
        $results = [];
        $payeTotal = 0;
        $uifTotal = 0;
        $sdlTotal = 0;
        $liabilityTotal = 0;
        
        // For every month of the tax year (starting in March of the previous year)
        $taxMonth = 3;
        $actualYear = $data['taxYear'] - 1;
        for( $i = 0; $i < $numMonths; $i++ ) {
            // Get the payrun totals for payruns in the given period
            $sqlQuery =
                'SELECT ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'SUM( payslip_items.total ) AS total ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                'LEFT JOIN ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payruns.processed_on IS NOT NULL AND ' .
                    'EXTRACT(MONTH FROM payslips.to_date) = $1 AND ' .
                    'EXTRACT(YEAR FROM payslips.to_date) = $2 ' .
                'GROUP BY ' .
                    'payslip_items.payslip_item_type_code;';
            $sqlResult = $db->paramQuery($sqlQuery, [$taxMonth, $actualYear]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Calculate the totals for the tax month
            $payeAmount = 0;
            $uifAmount = 0;
            $sdlAmount = 0;
            $liabilityAmount = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Add to the totals depending on the type
                if( ($sqlRow['payslip_item_type_code'] == '2000') || ($sqlRow['payslip_item_type_code'] == '2001') ) {
                    $liabilityAmount = $liabilityAmount + $sqlRow['total'];
                    $payeAmount = $payeAmount + $sqlRow['total'];
                }
                else if( ($sqlRow['payslip_item_type_code'] == '2002') || ($sqlRow['payslip_item_type_code'] == '3001') ) {
                    $liabilityAmount = $liabilityAmount + $sqlRow['total'];
                    $uifAmount = $uifAmount + $sqlRow['total'];
                }
                else if( $sqlRow['payslip_item_type_code'] == '3002' ) {
                    $liabilityAmount = $liabilityAmount + $sqlRow['total'];
                    $sdlAmount = $sdlAmount + $sqlRow['total'];
                }
            }
            
            // Convert the month to a date object so we can get the month name
            $taxMonthDate = DateTime::createFromFormat('!m', $taxMonth);
            
            // Add the amounts to the result
            $results[] = [
                'month' => $taxMonth,
                'monthName' => $taxMonthDate->format('F'),
                'payeAmount' => (int)$payeAmount,
                'uifAmount' => (int)$uifAmount,
                'sdlAmount' => (int)$sdlAmount,
                'liabilityAmount' => (int)$liabilityAmount
            ];
            
            // Add the amounts to the totals
            $payeTotal = $payeTotal + $payeAmount;
            $uifTotal = $uifTotal + $uifAmount;
            $sdlTotal = $sdlTotal + $sdlAmount;
            $liabilityTotal = $liabilityTotal + $liabilityAmount;
            
            // Go to the next month
            $taxMonth = $taxMonth + 1;
            
            // Reset the month, if greater than 12
            if($taxMonth > 12 ) $taxMonth = 1;
            
            // Are we in the given tax year?
            if( $taxMonth < 3 ) { 
                // Set the year to the given tax year
                $actualYear = $data['taxYear'];
            }
        }
        
        // Save the totals
        $totals = [
            'payeTotal' => $payeTotal,
            'uifTotal' => $uifTotal,
            'sdlTotal' => $sdlTotal,
            'liabilityTotal' => $liabilityTotal
        ];
        
        // Return the result
        return( ['ok' => true, 'results' => $results, 'totals' => $totals] );
    }
    
    // Function to get the data required for the Earnings / Cost Analysis report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getEarningsCostAnalysisData($data, $user, $db) {
        $payrunName = '';
            
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Depending on the selected filter type
        if( $data['filterType'] === 'PAYR' ) {
            // Was no payrun specified?
            if( $data['payrunId'] == null ) {
                return( ['ok' => false, 'error' => 'No payrun specified'] );
            }
            
            // Get the payrun name
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunName = $sqlRow['description'];
            
            // Setup the filter clause
            $filterCount++;
            $filterValues[] = $data['payrunId'];
            $filterClause = ' AND payrun_id = $' . $filterCount;
            
        }
        else if( $data['filterType'] === 'PERI' ) {
            // Was either a start or end date specified?
            if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND ( ';
                
                // Was a start date specified?
                if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                    // Set the payrun name
                    $payrunName = $payrunName . '' . $data['startDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['startDate'];
                    $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                }
                
                // Was an end date specified?
                if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                    // Set the payrun name
                    if( $filterCount > 0 ) $payrunName = $payrunName . '_';
                    $payrunName = $payrunName . 'to_' . $data['endDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['endDate'];
                    $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                }
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
            }
            else {
                // Set the payrun name
                $payrunName = 'all';
            }
        }
        else {
            return( ['ok' => false, 'error' => 'Unknown filter specified'] );
        }
        
        // Load all payslip items from database
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'MAX(employees.id) AS employee_id, ' .
                    'MAX(employees.alias) AS employee_alias, ' .
                    'MAX(employees.code) AS employee_code, ' .
                    'payslip_categories.code AS category_code, ' .
                    'payslip_categories.name AS category_name, ' .
                    'SUM(payslip_items.total) AS amount ' .
                'FROM ' .
                    'payslip_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_items.payslip_item_type_code = payslip_item_types.code ' .
                'LEFT JOIN ' .
                    'payslips ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' ' .
                    $filterClause .
                'GROUP BY ' .
                    'payslips.id, payslip_categories.code, payslip_categories.name ' .
                'ORDER BY ' .
                    'employee_alias, employee_code ASC ' .
            '), ' .
            'income_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(amount) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'category_code = \'INCO\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'allowance_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(amount) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'category_code = \'ALLO\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'deductions_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(amount) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'category_code = \'DEDU\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'contributions_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(amount) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'category_code = \'CONT\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'benefits_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(amount) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'category_code = \'FBEN\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            ') ' .
            'SELECT ' .
                '\'\', ' .
                'employees.id AS employee_id, ' .
                'employees.code AS employee_code, ' .
                'employees.alias AS employee_alias, ' .
                'COALESCE(income_details.total, 0.00) AS income_total, ' .
                'COALESCE(allowance_details.total, 0.00) AS allowance_total, ' .
                'COALESCE(deductions_details.total, 0.00) AS deductions_total, ' .
                'COALESCE(contributions_details.total, 0.00) AS contributions_total, ' .
                'COALESCE(benefits_details.total, 0.00) AS benefits_total ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'income_details ON employees.id = income_details.employee_id ' .
            'LEFT JOIN ' .
                'allowance_details ON employees.id = allowance_details.employee_id ' .
            'LEFT JOIN ' .
                'deductions_details ON employees.id = deductions_details.employee_id ' .
            'LEFT JOIN ' .
                'contributions_details ON employees.id = contributions_details.employee_id ' .
            'LEFT JOIN ' .
                'benefits_details ON employees.id = benefits_details.employee_id ' .
            'ORDER BY ' .
                'employees.alias ASC, employees.code ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, $filterValues);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        $employees = [];
        $incomeTotal = 0;
        $deductionsTotal = 0;
        $companyContributionsTotal = 0;
        $fringeBenefitsTotal = 0;
        $allowancesTotal = 0;
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set the employee details
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'employeeId' => $sqlRow['employee_id'],
                'income' => $sqlRow['income_total'],
                'deductions' =>  $sqlRow['deductions_total'],
                'companyContributions' =>  $sqlRow['contributions_total'],
                'fringeBenefits' =>  $sqlRow['benefits_total'],
                'allowances' =>  $sqlRow['allowance_total']
            ];
            
            // Calculate the totals
            $incomeTotal = $incomeTotal + $sqlRow['income_total'];
            $deductionsTotal = $deductionsTotal + $sqlRow['deductions_total'];
            $companyContributionsTotal = $companyContributionsTotal + $sqlRow['contributions_total'];
            $fringeBenefitsTotal = $fringeBenefitsTotal + $sqlRow['benefits_total'];
            $allowancesTotal = $allowancesTotal + $sqlRow['allowance_total'];
        }
        
        // Save the totals
        $totals = [
            'incomeTotal' => $incomeTotal,
            'deductionsTotal' => $deductionsTotal,
            'companyContributionsTotal' => $companyContributionsTotal,
            'fringeBenefitsTotal' => $fringeBenefitsTotal,
            'allowancesTotal' => $allowancesTotal
        ];
        
        // Return the result
        return( ['ok' => true, 'payrunName' => $payrunName, 'employees' => $employees, 'totals' => $totals] );
    }
    
    // Function to get the data required for the payslip report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getPayslipData($data, $user, $db) {
        // Get the report details
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM  ' .
                    'payslips ' .
                'LEFT JOIN  ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' . 
                    'payslips.payrun_id = $1 ' .
            '), ' . 
            'income_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'INCO\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'deduction_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'DEDU\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'contribution_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'CONT\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'fringe_benefit_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'FBEN\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'included_fringe_benefit_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'FBEN\' AND ' .
                    'include_in_nett_pay = true ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'allowance_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'ALLO\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'paye_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2000\' OR  ' .
                    'payslip_item_type_code = \'2001\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'employee_uif_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2002\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'other_deduction_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'DEDU\' AND ' .
                    '( ' .
                        'payslip_item_type_code != \'2000\' AND ' .
                        'payslip_item_type_code != \'2001\' AND ' .
                        'payslip_item_type_code != \'2002\' ' .
                    ') ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'employer_uif_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'3001\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            '), ' . 
            'sdl_details AS ( ' .
                'SELECT ' .
                    'payslip_id, ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'3002\' ' .
                'GROUP BY ' .
                    'payslip_id, employee_id ' .
            ') ' .
            'SELECT ' .
                'payslips.id AS payslip_id, ' .
                'payslips.from_date, ' .
                'payslips.to_date, ' .
                'payslips.employee_id, ' .
                'employees.code, ' .
                'employees.full_names, ' .
                'employees.last_name, ' .
                'employees.alias, ' .
                'employees.id_number, ' .
                'employees.email_address, ' .
                'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS total_income, ' .
                'CAST(COALESCE(deduction_details.total, 0) AS FLOAT) AS total_deductions, ' .
                'CAST(COALESCE(contribution_details.total, 0) AS FLOAT) AS total_contributions, ' .
                'CAST(COALESCE(fringe_benefit_details.total, 0) AS FLOAT) AS total_fringe_benefits, ' .
                'CAST(COALESCE(allowance_details.total, 0) AS FLOAT) AS total_allowances, ' .
                'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                'CAST(COALESCE(employee_uif_details.total, 0) AS FLOAT) AS total_employee_uif, ' .
                'CAST(COALESCE(other_deduction_details.total, 0) AS FLOAT) AS total_other_deductions, ' .
                'CAST(COALESCE(employer_uif_details.total, 0) AS FLOAT) AS total_employer_uif, ' .
                'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl, ' .
                'CAST(COALESCE(income_details.total, 0) + COALESCE(allowance_details.total,0) AS FLOAT) AS gross_income, ' .
                'CAST(COALESCE(income_details.total, 0) - 
                    COALESCE(deduction_details.total, 0) + 
                    COALESCE(allowance_details.total, 0) + 
                    COALESCE(included_fringe_benefit_details.total, 0) 
                    AS FLOAT) AS net_income ' .
            'FROM ' .
                'payslips ' .
            'LEFT JOIN ' .
                'employees ON employees.id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'income_details ON income_details.payslip_id = payslips.id AND ' .
                    'income_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'deduction_details ON deduction_details.payslip_id = payslips.id AND ' .
                    'deduction_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'contribution_details ON contribution_details.payslip_id = payslips.id AND ' .
                    'contribution_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'fringe_benefit_details ON fringe_benefit_details.payslip_id = payslips.id AND ' .
                    'fringe_benefit_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'included_fringe_benefit_details ON included_fringe_benefit_details.payslip_id = payslips.id AND ' .
                    'included_fringe_benefit_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'allowance_details ON allowance_details.payslip_id = payslips.id AND ' .
                    'allowance_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'paye_details ON paye_details.payslip_id = payslips.id AND ' .
                    'paye_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'employee_uif_details ON employee_uif_details.payslip_id = payslips.id AND ' .
                    'employee_uif_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'other_deduction_details ON other_deduction_details.payslip_id = payslips.id AND ' .
                    'other_deduction_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'employer_uif_details ON employer_uif_details.payslip_id = payslips.id AND ' .
                    'employer_uif_details.employee_id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'sdl_details ON sdl_details.payslip_id = payslips.id AND ' .
                    'sdl_details.employee_id = payslips.employee_id ' .
            'WHERE ' .
                'payslips.status_code = \'ACTI\' AND ' . 
                'payslips.payrun_id = $1 ' .
            'ORDER BY ' .
                ' employees.alias ASC, ' .
                ' payslips.to_date ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        $employees = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $employees[] = [
                'toDate' => $sqlRow['to_date'],
                'code' => $sqlRow['code'],
                'alias' => $sqlRow['alias'],
                'fullNames' => $sqlRow['full_names'],
                'lastName' => $sqlRow['last_name'],
                'idNumber' => $sqlRow['id_number'],
                'emailAddress' => $sqlRow['email_address'],
                'totalEmployerUif' => $sqlRow['total_employer_uif'],
                'totalSdl' => $sqlRow['total_sdl'],
                'totalContributions' => $sqlRow['total_contributions'],
                'totalFringeBenefits' => $sqlRow['total_fringe_benefits'], 
                'totalIncome' => $sqlRow['total_income'],
                'totalAllowances' => $sqlRow['total_allowances'],
                'grossIncome' => $sqlRow['gross_income'],
                'totalPaye' => $sqlRow['total_paye'],
                'totalEmployeeUif' => $sqlRow['total_employee_uif'],
                'totalOtherDeductions' => $sqlRow['total_other_deductions'],
                'totalDeductions' => $sqlRow['total_deductions'],
                'netIncome' => $sqlRow['net_income']
            ];
        }
        
        // Return the result
        return( ['ok' => true, 'employees' => $employees] );
    }
    
    // Function to get the data required for the payslip items report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getPayslipItemsData($data, $user, $db) {
        $payrunName = '';
            
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Depending on the selected filter type
        if( $data['filterType'] === 'PAYR' ) {
            // Was no payrun specified?
            if( $data['payrunId'] == null ) {
                return( ['ok' => false, 'error' => 'No payrun specified'] );
            }
            
            // Get the payrun name
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunName = $sqlRow['description'];
            
            // Setup the filter clause
            $filterCount++;
            $filterValues[] = $data['payrunId'];
            $filterClause = ' AND payrun_id = $' . $filterCount;
            
        }
        else if( $data['filterType'] === 'PERI' ) {
            // Was either a start or end date specified?
            if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND ( ';
                
                // Was a start date specified?
                if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                    // Set the payrun name
                    $payrunName = $payrunName . '' . $data['startDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['startDate'];
                    $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                }
                
                // Was an end date specified?
                if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                    // Set the payrun name
                    if( $filterCount > 0 ) $payrunName = $payrunName . '_';
                    $payrunName = $payrunName . 'to_' . $data['endDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['endDate'];
                    $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                }
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
            }
            else {
                // Set the payrun name
                $payrunName = 'all';
            }
        }
        else {
            return( ['ok' => false, 'error' => 'Unknown filter specified'] );
        }

        // Load all payslip items from database
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' . 
                    'payslip_items.description, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' ' .
                    $filterClause .
            '), ' .
            'income_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'INCO\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'deduction_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'DEDU\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'contribution_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'CONT\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'fringe_benefit_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'FBEN\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'included_fringe_benefit_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'FBEN\' AND ' .
                    'include_in_nett_pay = true ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'allowance_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'ALLO\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            // 'paye_details AS ( ' .
            //     'SELECT ' .
            //         'employee_id, ' .
            //         'SUM(
            //             CASE 
            //                 WHEN payslip_item_type_code = \'2000\' THEN total 
            //                 WHEN payslip_item_type_code = \'2001\' AND (description IS DISTINCT FROM \'PAYE Correction\') THEN total 
            //                 ELSE 0 
            //             END
            //         ) AS total ' .
            //     'FROM ' .
            //         'payslip_details ' .
            //     'WHERE ' .
            //         'payslip_item_type_code IN (\'2000\', \'2001\') ' .
            //     'GROUP BY ' .
            //         'employee_id ' .
            // '), ' .
            'paye_details AS ( ' .
            'SELECT ' .
                'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2000\' OR ' .
                    '(payslip_item_type_code = \'2001\' AND (description IS DISTINCT FROM \'PAYE Correction\')) ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'employee_uif_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'2002\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'other_deduction_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_category_code = \'DEDU\' AND ' .
                    '( ' .
                        'payslip_item_type_code != \'2000\' AND ' .
                        'payslip_item_type_code != \'2001\' AND ' .
                        'payslip_item_type_code != \'2002\' ' .
                    ') ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'employer_uif_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'3001\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            '), ' .
            'sdl_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'WHERE ' .
                    'payslip_item_type_code = \'3002\' ' .
                'GROUP BY ' .
                    'employee_id ' .
            ') ' .
            'SELECT DISTINCT ' .
                'employees.id AS employee_id, ' .
                'employees.code AS employee_code, ' .
                'employees.full_names AS employee_full_names, ' .
                'employees.last_name AS employee_last_name, ' .
                'employees.alias AS employee_alias, ' .
                'employees.id_number AS employee_id_number, ' .
                'employees.email_address AS employee_email_address, ' .
                'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS total_income, ' .
                'CAST(COALESCE(deduction_details.total, 0) AS FLOAT) AS total_deductions, ' .
                'CAST(COALESCE(contribution_details.total, 0) AS FLOAT) AS total_contributions, ' .
                'CAST(COALESCE(fringe_benefit_details.total, 0) AS FLOAT) AS total_fringe_benefits, ' .
                'CAST(COALESCE(allowance_details.total, 0) AS FLOAT) AS total_allowances, ' .
                'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                'CAST(COALESCE(employee_uif_details.total, 0) AS FLOAT) AS total_employee_uif, ' .
                'CAST(COALESCE(other_deduction_details.total, 0) AS FLOAT) AS total_other_deductions, ' .
                'CAST(COALESCE(employer_uif_details.total, 0) AS FLOAT) AS total_employer_uif, ' .
                'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl, ' .
                'CAST(COALESCE(income_details.total, 0) + COALESCE(allowance_details.total,0) AS FLOAT) AS gross_income, ' .
                'CAST(COALESCE(income_details.total, 0) - ' .
                    'COALESCE(deduction_details.total, 0) + ' .
                    'COALESCE(allowance_details.total, 0) + ' .
                    'COALESCE(included_fringe_benefit_details.total, 0) ' .
                    'AS FLOAT) AS net_income ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'income_details ON income_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'deduction_details ON deduction_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'contribution_details ON contribution_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'fringe_benefit_details ON fringe_benefit_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'included_fringe_benefit_details ON included_fringe_benefit_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'allowance_details ON allowance_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'paye_details ON paye_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'employee_uif_details ON employee_uif_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'other_deduction_details ON other_deduction_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'employer_uif_details ON employer_uif_details.employee_id = employees.id ' .
            'LEFT JOIN ' .
                'sdl_details ON sdl_details.employee_id = employees.id ' .
            'ORDER BY ' .
                'employees.alias ASC, ' .
                'employees.code ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, $filterValues);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
       
        $employees = [];
        $totalEmployerUif = 0.00;
        $totalSdl = 0.00;
        $totalContributions = 0.00;
        $totalFringeBenefits = 0.00;
        $totalIncome = 0.00;
        $totalAllowances = 0.00;
        $totalGrossIncome = 0.00;
        $totalPaye = 0.00;
        $totalEmployeeUif = 0.00;
        $totalOtherDeductions = 0.00;
        $totalDeductions = 0.00;
        $totalNetIncome = 0.00;
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set the employee details
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'employeeId' => $sqlRow['employee_id'],
                'employeeFullNames' => $sqlRow['employee_full_names'],
                'employeeLastName' => $sqlRow['employee_last_name'],
                'employeeIdNumber' => $sqlRow['employee_id_number'],
                'employeeEmailAddress' => $sqlRow['employee_email_address'],
                'totalEmployerUif' => $sqlRow['total_employer_uif'],
                'totalSdl' => $sqlRow['total_sdl'],
                'totalContributions' => $sqlRow['total_contributions'],
                'totalFringeBenefits' => $sqlRow['total_fringe_benefits'], 
                'totalIncome' => $sqlRow['total_income'],
                'totalAllowances' => $sqlRow['total_allowances'],
                'grossIncome' => $sqlRow['gross_income'],
                'totalPaye' => $sqlRow['total_paye'],
                'totalEmployeeUif' => $sqlRow['total_employee_uif'],
                'totalOtherDeductions' => $sqlRow['total_other_deductions'],
                'totalDeductions' => $sqlRow['total_deductions'],
                'netIncome' => $sqlRow['net_income']
            ];
            error_log('employee_id ' . $sqlRow['employee_id'] );
            // Calculate the totals
            $totalEmployerUif = $totalEmployerUif + $sqlRow['total_employer_uif'];
            $totalSdl = $totalSdl + $sqlRow['total_sdl'];
            $totalContributions = $totalContributions + $sqlRow['total_contributions'];
            $totalFringeBenefits = $totalFringeBenefits + $sqlRow['total_fringe_benefits'];
            $totalIncome = $totalIncome + $sqlRow['total_income'];
            $totalAllowances = $totalAllowances + $sqlRow['total_allowances'];
            $totalGrossIncome = $totalGrossIncome + $sqlRow['gross_income'];
            $totalPaye = $totalPaye + $sqlRow['total_paye'];
            $totalEmployeeUif = $totalEmployeeUif + $sqlRow['total_employee_uif'];
            $totalOtherDeductions = $totalOtherDeductions + $sqlRow['total_other_deductions'];
            $totalDeductions = $totalDeductions + $sqlRow['total_deductions'];
            $totalNetIncome = $totalNetIncome + $sqlRow['net_income'];
        }
        
        // Save the totals
        $totals = [
            'totalEmployerUif' => $totalEmployerUif,
            'totalSdl' => $totalSdl,
            'totalContributions' => $totalContributions,
            'totalFringeBenefits' => $totalFringeBenefits,
            'totalIncome' => $totalIncome,
            'totalAllowances' => $totalAllowances,
            'totalGrossIncome' => $totalGrossIncome,
            'totalPaye' => $totalPaye,
            'totalEmployeeUif' => $totalEmployeeUif,
            'totalOtherDeductions' => $totalOtherDeductions,
            'totalDeductions' => $totalDeductions,
            'totalNetIncome' => $totalNetIncome
        ];
        
        // Return the result
        return( ['ok' => true, 'payrunName' => $payrunName, 'employees' => $employees, 'totals' => $totals] );
    }
    
    // Function to get the data required for the return of earnings report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getReturnOfEarningsData($data, $user, $db) {
            // Get the compensation fund earnings cap (per employee per year)
            $earningsCap = \PayslipUtil\getCompensationFundEarningCap( new DateTime(($data['taxYear'] - 1) . '-03-01')  );
            
            // Set the number of months to process
            $numMonths = 12;
            
            $results = [];
            $grossIncomeTotal = 0;
            // $employeeEarnings = [];
            
            // For every month of the tax year (starting in March of the previous year)
            $taxMonth = 3;
            $actualYear = $data['taxYear'] - 1;
            for( $i = 0; $i < $numMonths; $i++ ) {
                // Get the payrun totals for payruns in the given period
                $sqlQuery =
                    'WITH payslip_details AS ( ' .
                        'SELECT ' .
                            'payslips.id AS payslip_id, ' .
                            'payslips.employee_id, ' .
                            'payslips.from_date, ' .
                            'payslips.to_date, ' .
                            'payslip_items.payslip_item_type_code, ' .
                            'payslip_item_types.payslip_category_code, ' .
                            'payslip_items.total, ' .
                            'payslip_items.include_in_nett_pay ' .
                        'FROM ' .
                            'payslips ' .
                        'LEFT JOIN ' .
                            'payruns ON payruns.id = payslips.payrun_id ' .
                        'LEFT JOIN  ' .
                            'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                        'LEFT JOIN ' .
                            'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                        'LEFT JOIN ' .
                            'employees ON employees.id = payslips.employee_id ' .
                        'WHERE ' .
                            'payslips.status_code = \'ACTI\' AND ' .
                            'payruns.processed_on IS NOT NULL AND ' .
                            'payruns.processed_on IS NOT NULL AND ' .
                            '(employees.department_id = $1 OR $1 IS NULL) AND ' .
                            'EXTRACT(MONTH FROM payslips.to_date) = $2 AND ' .
                            'EXTRACT(YEAR FROM payslips.to_date) = $3 ' .
                    '), ' .
                    // 'deduction_details AS ( ' .
                    //     'SELECT ' .
                    //         'employee_id, ' .
                    //         'SUM(total) AS total ' .
                    //     'FROM ' .
                    //         'payslip_details ' .
                    //     'WHERE ' .
                    //         'payslip_category_code = \'DEDU\' ' .
                    //     'GROUP BY ' .
                    //         'employee_id ' .
                    // '), ' .
                    'income_details AS ( ' .
                        'SELECT ' .
                            'employee_id, ' .
                            'SUM(total) AS total ' .
                        'FROM ' .
                            'payslip_details ' .
                        'WHERE ' .
                            'payslip_category_code = \'INCO\' OR ' .
                            'payslip_category_code = \'ALLO\' OR ' .
                            'payslip_category_code = \'FBEN\' ' . // AND ' .
                            // 'include_in_nett_pay = true ' .
                        'GROUP BY ' .
                            'employee_id ' .
                    ') ' .
                    'SELECT DISTINCT ON (payslip_details.employee_id) ' .
                        'payslip_details.employee_id, ' .
                        // 'CAST(COALESCE(income_details.total, 0) - COALESCE(deduction_details.total, 0) AS FLOAT) AS nett_income, ' .
                        'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS gross_income ' .
                    'FROM ' .
                        'payslip_details ' .
                    'LEFT JOIN ' .
                        'income_details ON income_details.employee_id = payslip_details.employee_id ' .
                    // 'LEFT JOIN ' .
                    //     'deduction_details ON deduction_details.employee_id = payslip_details.employee_id ' .
                    'ORDER BY ' .
                        'payslip_details.employee_id ASC;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['departmentId'], 
                    $taxMonth, 
                    $actualYear]
                );
                if( !$sqlResult->isValid() ) {
                    return( ['ok' => false, 'error' => 'Database error.'] );
                }
                
                // Calculate the totals for the tax month
                $grossIncomeAmount = 0;
                $employeeCount = 0;
                while( $sqlRow = $sqlResult->fetchAssociative() ) {
                    // Should the earnings cap be implmented
                    if( !$data['disableEarningsCap'] ) {
                        // Less accurate method of implementing the earnings threshold (as used by simple pay)
                        if( $sqlRow['gross_income'] < ($earningsCap / 12) ) {
                            $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                        }
                        else {
                            $grossIncomeAmount = $grossIncomeAmount + ($earningsCap / 12);
                        }
                        
                        // NOTE:
                        
                        // The following code is a more accurate way of implementing the earnings cap but the way it displays
                        // may confuse the user since the amounts earned will become less towards the end of the year as the 
                        // cap is reached for more employees.
                        
                        // // Has the employee been added?
                        // $employeeFound = false;
                        // for( $j = 0; $j < count($employeeEarnings); $j++ ) {
                        //     // Was the employee found?
                        //     if( $employeeEarnings[$j]['employeeId'] == $sqlRow['employee_id'] ) {
                        //         // Will adding the income exceed the earnings cap?
                        //         if( ($employeeEarnings[$j]['grossIncomeAmount'] + $sqlRow['gross_income']) > $earningsCap ) {
                        //             // Does the nett pay not already match the earnings cap?
                        //             if( $employeeEarnings[$j]['grossIncomeAmount'] < $earningsCap ) {
                        //                 // Calculatte the nett pay amount
                        //                 $grossIncomeAmount = $grossIncomeAmount + ($earningsCap - $employeeEarnings[$j]['grossIncomeAmount']);
                        //             }
                                    
                        //             // The earnings cap has been reached
                        //             $employeeEarnings[$j]['grossIncomeAmount'] = $earningsCap;
                        //         }
                        //         else {
                        //             // Calculatte the nett pay amount
                        //             $employeeEarnings[$j]['grossIncomeAmount'] = $employeeEarnings[$j]['grossIncomeAmount'] + $sqlRow['gross_income'];
                        //             $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                        //         }
                                
                        //         // Remember that the employee was found
                        //         $employeeFound = true;
                        //         break;
                        //     }
                        // }
                        
                        // // Was the employee not found?
                        // if( !$employeeFound ) {
                        //     // Add the employee
                        //     $employeeEarnings[] = [
                        //         'employeeId' => $sqlRow['employee_id'],
                        //         'grossIncomeAmount' => $sqlRow['gross_income'] 
                        //     ];
                            
                        //     // Calculatte the nett pay amount
                        //     $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                        // }
                    }
                    else {
                        $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                    }
                    
                    // Count the number of employees
                    $employeeCount++;
                }
                
                // Add the amounts to the result
                $results[] = [
                    'month' => $taxMonth,
                    'grossIncomeAmount' => (int)$grossIncomeAmount,
                    'employeeCount' => (int)$employeeCount
                ];
                
                // Add the amounts to the totals
                $grossIncomeTotal = $grossIncomeTotal + $grossIncomeAmount;
                
                // Go to the next month
                $taxMonth = $taxMonth + 1;
                
                // Reset the month, if greater than 12
                if($taxMonth > 12 ) $taxMonth = 1;
                
                // Are we in the given tax year?
                if( $taxMonth < 3 ) { 
                    // Set the year to the given tax year
                    $actualYear = $data['taxYear'];
                }
            }
            
            // Add the totals to the result
            $totals = [
                'grossIncomeTotal' => $grossIncomeTotal
            ];
        
        // Return the result
        return( ['ok' => true, 'results' => $results, 'totals' => $totals] );
    }

    // Function to get the data required for the COIDA payroll report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getDetailedPayrollData($data, $user, $db) {
        $sqlParams = [];
        $actualYear = $data['taxYear'];
        $grossIncomeTotal = 0;

        // Get the compensation fund earnings cap (per employee per year)
        $earningsCap = \PayslipUtil\getCompensationFundEarningCap( new DateTime(($data['taxYear'] - 1) . '-03-01')  );
            
        // Build where clause
        $whereClause = '';
        
        // Should a departmentId filter be added?
        if( isset($data['departmentId']) && $data['departmentId'] !== '' ) {
            if( $whereClause === '') 
                $whereClause = 'WHERE ' ;
            else 
                $whereClause = $whereClause . 'AND ';
            $sqlParams[] = $data['departmentId'];
            $whereClause = $whereClause . ' departments.id = $' . count($sqlParams);
        }
        
        // Should a departmentName filter be added?
        if( isset($data['departmentName']) && $data['departmentName'] !== '' ) {
            if( $whereClause === '') 
                $whereClause = 'WHERE ' ;
            else 
                $whereClause = $whereClause . 'AND ';
            $sqlParams[] = $data['departmentName'];
            $whereClause = $whereClause . ' departments.name = $' . count($sqlParams);
        }
        
        // Should a employment status filter be added?
        if( isset($data['employeeStatus']) && $data['employeeStatus'] !== '' ) {
            if ($data['employeeStatus'] !== 'all') {
                if( $whereClause === '') {
                    $whereClause = 'WHERE ' ;
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                
                if ($data['employeeStatus'] === 'employed') {
                    $whereClause = $whereClause . ' employment_end_date IS NULL ';
                }
                else if ($data['employeeStatus'] === 'dismissed') {
                    $whereClause = $whereClause . 'employment_end_date IS NOT NULL AND employment_end_date <= NOW()::Date ';
                }
            }
        }
        
        // Add filters for employee start and end date
        $whereOrAnd = ' AND ' ;
        if( $whereClause === '') {
            $whereOrAnd = 'WHERE ' ;
        }
        $whereClause = $whereClause . $whereOrAnd . "payslips.sars_year = " . $actualYear . " AND payslip_item_types.payslip_category_code IN ('ALLO','FBEN','INCO')" ;

        $whereClause = $whereClause . " AND payslips.status_code = 'ACTI'";
        
        // if( $data['employmentStartDate'] !== '' && $data['employmentEndDate'] !== '' ) {
        //     $sqlParams[] = $data['employmentStartDate'];
        //     $whereClause = $whereClause . $whereOrAnd . ' (employment_start_date BETWEEN $' . count($sqlParams);
        //     $sqlParams[] = $data['employmentEndDate'];
        //     $whereClause = $whereClause . ' AND $' .count($sqlParams) . ') ';
        // }
        // else if( $data['employmentStartDate'] === '' && $data['employmentEndDate'] !== '' ) {
        //     $sqlParams[] = $data['employmentEndDate'];
        //     $whereClause = $whereClause . $whereOrAnd . ' (employment_start_date < $' . count($sqlParams) . ') ';
        // }
        // else if( $data['employmentStartDate'] !== '' && $data['employmentEndDate'] === '' ) {
        //     $sqlParams[] = $data['employmentStartDate'];
        //     $whereClause = $whereClause . $whereOrAnd . '  (employment_start_date > $' . count($sqlParams) . ') ';
        // }
        
        // Check that sort order given is valid
        // if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
        //     return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
        // }
        
        // Process limit offset
        $limitOffset = '';
        
        // Load all employees from the employees table
        // $sqlQuery = 
        //     'SELECT ' .
        //         'employees.id, ' . 
        //         'employees.code, ' . 
        //         'employees.full_names, ' . 
        //         'employees.last_name, ' . 
        //         'employees.id_number, ' . 
        //         'employees.passport_number, ' . 
        //         'employees.passport_country AS passport_country_code, ' .
        //         'passport_countries.name AS passport_country_name,' .
        //         'employees.cell_number, ' . 
        //         'employees.email_address, ' .
        //         'employees.department_id, ' . 
        //         'departments.name AS department_name, ' . 
        //         'employees.payment_period_code, ' . 
        //         'payment_period_types.name AS payment_period_type_name, ' . 
        //         'employees.income_tax_number, ' .
        //         'payslips.sars_year, ' .
               
        //        "SUM(CASE 
        //             WHEN payslip_items.payslip_item_type_code IN ('5006', '5000', '5002', '5004', '5005') 
        //             THEN payslip_items.total 
        //             ELSE 0 
        //         END) AS total_allowances,

        //         SUM(CASE 
        //             WHEN payslip_items.payslip_item_type_code IN ('1005', '1000', '1002', '1003', '1004', '1001') 
        //             THEN payslip_items.total 
        //             ELSE 0 
        //         END) AS total_income,

        //         SUM(CASE 
        //             WHEN payslip_items.payslip_item_type_code IN ('4000', '4001', '4002', '4003', '4005', '4006', '4007') 
        //             THEN payslip_items.total 
        //             ELSE 0 
        //         END) AS total_benefits, " .
                
        //         "TRIM(BOTH ', ' FROM CONCAT_WS(', ',
        //             CASE 
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' AND payslip_item_types.code IN ('1000','1002','1001') THEN 1 ELSE 0 END) > 0 
        //                 THEN 'Salary' 
        //             END,
        //             CASE
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1003' THEN 1 ELSE 0 END) > 0
        //                 THEN 'Commission'
        //             END,
        //             CASE
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1004' THEN 1 ELSE 0 END) > 0
        //                 THEN 'Bonus'
        //             END,
        //             CASE
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1005' THEN 1 ELSE 0 END) > 0
        //                 THEN 'Overtime'
        //             END,
        //             CASE 
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'ALLO' AND payslip_item_types.code IN ('5000','5002','5004','5005','5006') THEN 1 ELSE 0 END) > 0 
        //                 THEN 'Allowances' 
        //             END,
        //             CASE 
        //                 WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'FBEN' AND payslip_item_types.code IN ('4000','4001','4002','4003','4005','4006','4007') THEN 1 ELSE 0 END) > 0 
        //                 THEN 'Fringe Benefits' 
        //             END
        //         )) AS wage_types " .
        //     'FROM ' .
        //         'employees ' .
        //     'LEFT JOIN ' .
        //         'departments ON employees.department_id = departments.id ' .
        //     'LEFT JOIN ' .
        //         'sic_codes ON employees.sic_code = sic_codes.code ' .
        //     'LEFT JOIN '.
        //         'title_types ON employees.title_code = title_types.code '.
        //     'LEFT JOIN ' .
        //         'payment_methods ON payment_method_code = payment_methods.code ' .
        //     'LEFT JOIN ' .
        //         'payment_period_types ON payment_period_code = payment_period_types.code ' .
        //     'LEFT JOIN ' .
        //         'countries AS passport_countries ON passport_country = passport_countries.code ' .
        //     'LEFT JOIN ' . 
        //         'payslips ON employees.id = payslips.employee_id ' .
        //     'LEFT JOIN ' .
        //         'payslip_items ON payslips.id = payslip_items.payslip_id ' .
        //     'LEFT JOIN ' .
        //         'payslip_item_types ON payslip_items.payslip_item_type_code = payslip_item_types.code ' .
        //     'LEFT JOIN ' .
        //         'payruns ON payslips.payrun_id = payruns.id ' .
        //     $whereClause . ' ' .
        //     'GROUP BY 
        //         employees.id, employees.code, employees.full_names, employees.last_name, 
        //         employees.id_number, employees.passport_number, employees.passport_country, 
        //         passport_countries.name, employees.cell_number, employees.email_address, 
        //         employees.department_id, departments.name, employees.payment_period_code, 
        //         payment_period_types.name, employees.income_tax_number, payslips.sars_year ' .
            
        //     'ORDER BY ' .
        //         'employees.alias ';

        $sqlQuery = 
            'SELECT ' .
                'employees.id, ' . 
                'employees.code, ' . 
                'employees.full_names, ' . 
                'employees.last_name, ' . 
                'employees.id_number, ' . 
                'employees.passport_number, ' . 
                'employees.passport_country AS passport_country_code, ' .
                'passport_countries.name AS passport_country_name,' .
                'employees.cell_number, ' . 
                'employees.email_address, ' .
                'employees.department_id, ' . 
                'departments.name AS department_name, ' . 
                'employees.payment_period_code, ' . 
                'payment_period_types.name AS payment_period_type_name, ' . 
                'employees.income_tax_number, ' .
                'payslips.sars_year, ' .
               
               "SUM(CASE 
                    WHEN payslip_item_types.payslip_category_code = 'ALLO' 
                    THEN payslip_items.total 
                    ELSE 0 
                END) AS total_allowances,

                SUM(CASE 
                    WHEN payslip_item_types.payslip_category_code = 'INCO' 
                    THEN payslip_items.total 
                    ELSE 0 
                END) AS total_income,

                SUM(CASE 
                    WHEN payslip_item_types.payslip_category_code = 'FBEN' 
                    THEN payslip_items.total 
                    ELSE 0 
                END) AS total_benefits, " .
                
                "TRIM(BOTH ', ' FROM CONCAT_WS(', ',
                    CASE 
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' AND payslip_item_types.code IN ('1000','1002','1001') THEN 1 ELSE 0 END) > 0 
                        THEN 'Salary' 
                    END,
                    CASE
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1003' THEN 1 ELSE 0 END) > 0
                        THEN 'Commission'
                    END,
                    CASE
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1004' THEN 1 ELSE 0 END) > 0
                        THEN 'Bonus'
                    END,
                    CASE
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'INCO' and payslip_item_types.code = '1005' THEN 1 ELSE 0 END) > 0
                        THEN 'Overtime'
                    END,
                    CASE 
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'ALLO' THEN 1 ELSE 0 END) > 0 
                        THEN 'Allowances' 
                    END,
                    CASE 
                        WHEN SUM(CASE WHEN payslip_item_types.payslip_category_code = 'FBEN' THEN 1 ELSE 0 END) > 0 
                        THEN 'Fringe Benefits' 
                    END
                )) AS wage_types " .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'departments ON employees.department_id = departments.id ' .
            'LEFT JOIN ' .
                'sic_codes ON employees.sic_code = sic_codes.code ' .
            'LEFT JOIN '.
                'title_types ON employees.title_code = title_types.code '.
            'LEFT JOIN ' .
                'payment_methods ON payment_method_code = payment_methods.code ' .
            'LEFT JOIN ' .
                'payment_period_types ON payment_period_code = payment_period_types.code ' .
            'LEFT JOIN ' .
                'countries AS passport_countries ON passport_country = passport_countries.code ' .
            'LEFT JOIN ' . 
                'payslips ON employees.id = payslips.employee_id ' .
            'LEFT JOIN ' .
                'payslip_items ON payslips.id = payslip_items.payslip_id ' .
            'LEFT JOIN ' .
                'payslip_item_types ON payslip_items.payslip_item_type_code = payslip_item_types.code ' .
            'LEFT JOIN ' .
                'payruns ON payslips.payrun_id = payruns.id ' .
            $whereClause . ' ' .
            'GROUP BY 
                employees.id, employees.code, employees.full_names, employees.last_name, 
                employees.id_number, employees.passport_number, employees.passport_country, 
                passport_countries.name, employees.cell_number, employees.email_address, 
                employees.department_id, departments.name, employees.payment_period_code, 
                payment_period_types.name, employees.income_tax_number, payslips.sars_year ' .
            
            'ORDER BY ' .
                'employees.alias ';
        $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
       
        // Create the result
        $employees = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set employment period and status
            // $employmentEndDate = ($sqlRow['employment_end_date'] !== null ? new DateTime($sqlRow['employment_end_date']) : null);
            // $employmentStartDate = new DateTime($sqlRow['employment_start_date']);
            // $currentDate = new DateTime();
            // $employmentStatus = 'Employed';
            // if ($sqlRow['employment_end_date'] !== null) {
            //     if ($employmentEndDate <= $currentDate) {
            //         $employmentStatus = 'Dismissed';
            //     }
            // }
            
            // if ($employmentStartDate > $currentDate) {
            //     $employmentStatus = 'Pending';
            // }

            $grossIncomeAmount = 0;
            $grossIncome = ($sqlRow['total_income'] + $sqlRow['total_allowances'] + $sqlRow['total_benefits']);
            
            // Should the earnings cap be implmented
            if( !$data['disableEarningsCap'] ) {
                // Less accurate method of implementing the earnings threshold (as used by simple pay)
                if( $grossIncome < $earningsCap ) {
                    $grossIncomeAmount = $grossIncomeAmount + $grossIncome;
                }
                else {
                    $grossIncomeAmount = $grossIncomeAmount + $earningsCap;
                }
                
                // NOTE:
                
                // The following code is a more accurate way of implementing the earnings cap but the way it displays
                // may confuse the user since the amounts earned will become less towards the end of the year as the 
                // cap is reached for more employees.
                
                // // Has the employee been added?
                // $employeeFound = false;
                // for( $j = 0; $j < count($employeeEarnings); $j++ ) {
                //     // Was the employee found?
                //     if( $employeeEarnings[$j]['employeeId'] == $sqlRow['employee_id'] ) {
                //         // Will adding the income exceed the earnings cap?
                //         if( ($employeeEarnings[$j]['grossIncomeAmount'] + $sqlRow['gross_income']) > $earningsCap ) {
                //             // Does the nett pay not already match the earnings cap?
                //             if( $employeeEarnings[$j]['grossIncomeAmount'] < $earningsCap ) {
                //                 // Calculatte the nett pay amount
                //                 $grossIncomeAmount = $grossIncomeAmount + ($earningsCap - $employeeEarnings[$j]['grossIncomeAmount']);
                //             }
                            
                //             // The earnings cap has been reached
                //             $employeeEarnings[$j]['grossIncomeAmount'] = $earningsCap;
                //         }
                //         else {
                //             // Calculatte the nett pay amount
                //             $employeeEarnings[$j]['grossIncomeAmount'] = $employeeEarnings[$j]['grossIncomeAmount'] + $sqlRow['gross_income'];
                //             $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                //         }
                        
                //         // Remember that the employee was found
                //         $employeeFound = true;
                //         break;
                //     }
                // }
                
                // // Was the employee not found?
                // if( !$employeeFound ) {
                //     // Add the employee
                //     $employeeEarnings[] = [
                //         'employeeId' => $sqlRow['employee_id'],
                //         'grossIncomeAmount' => $sqlRow['gross_income'] 
                //     ];
                    
                //     // Calculatte the nett pay amount
                //     $grossIncomeAmount = $grossIncomeAmount + $sqlRow['gross_income'];
                // }
            }
            else {
                $grossIncomeAmount = $grossIncomeAmount + $grossIncome;
            }

            $grossIncomeTotal = $grossIncomeTotal + $grossIncomeAmount;
            
            $employees[] = [
                'id' => $sqlRow['id'],
                'code' => $sqlRow['code'],
                'name' => $sqlRow['full_names'] . ' ' . $sqlRow['last_name'],
                'idno' => $sqlRow['id_number'],
                'passportNumber' => $sqlRow['passport_number'],
                'passportCountryCode' => $sqlRow['passport_country_code'],
                'passportCountryName' => $sqlRow['passport_country_name'],
                'cellphone' => $sqlRow['cell_number'],
                'email' => $sqlRow['email_address'],
                'departmentId' => $sqlRow['department_id'],
                'departmentName' => $sqlRow['department_name'],
                'paymentPeriodTypeName' => $sqlRow['payment_period_type_name'],
                'incomeTaxNumber' => $sqlRow['income_tax_number'],
                'sarsYear' => $sqlRow['sars_year'],
                'total_income' => $sqlRow['total_income'],
                'total_allowances' => $sqlRow['total_allowances'],
                'total_benefits' => $sqlRow['total_benefits'],
                'grand_total' => ($sqlRow['total_income'] + $sqlRow['total_allowances'] + $sqlRow['total_benefits']),
                'gross_income' => $grossIncomeAmount,
                'wage_types' => $sqlRow['wage_types']
            ];
        }

        // Add the totals to the result
        $totals = [
            'grossIncomeTotal' => $grossIncomeTotal
        ];
        
        // Return the result
        return( ['ok' => true, 'results' => $employees, 'totals' => $totals] );
    }
    
    // Function to get the data required for the overtime report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getOvertimeData($data, $user, $db) {
        $payrunName = '';
            
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Depending on the selected filter type
        if( $data['filterType'] === 'PAYR' ) {
            // Was no payrun specified?
            if( $data['payrunId'] == null ) {
                return( ['ok' => false, 'error' => 'No payrun specified'] );
            }
            
            // Get the payrun name
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunName = $sqlRow['description'];
            
            // Setup the filter clause
            $filterCount++;
            $filterValues[] = $data['payrunId'];
            $filterClause = ' AND payrun_id = $' . $filterCount;
            
        }
        else if( $data['filterType'] === 'PERI' ) {
            // Was either a start or end date specified?
            if( (($data['startDate'] != null) && ($data['startDate'] != '')) || (($data['endDate'] != null) && ($data['endDate'] != '')) ) {
                // Set the first part of the filter caluse
                // $filterClause = ' AND payrun_id IN( SELECT id FROM payruns WHERE ';
                $filterClause = ' AND ( ';
                
                // Was a start date specified?
                if( ($data['startDate'] != null) && ($data['startDate'] != '') ) {
                    // Set the payrun name
                    $payrunName = $payrunName . '' . $data['startDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['startDate'];
                    $filterClause = $filterClause . 'payslips.to_date >= $' . $filterCount;
                }
                
                // Was an end date specified?
                if( ($data['endDate'] != null) && ($data['endDate'] != '') ) {
                    // Set the payrun name
                    if( $filterCount > 0 ) $payrunName = $payrunName . '_';
                    $payrunName = $payrunName . 'to_' . $data['endDate'];
                    
                    // Set the filters
                    if( $filterCount > 0 ) $filterClause = $filterClause . ' AND ';
                    
                    $filterCount++;
                    $filterValues[] = $data['endDate'];
                    $filterClause = $filterClause . 'payslips.to_date <= $' . $filterCount;
                }
                
                // Finish the filter clause
                $filterClause = $filterClause . ') ';
            }
            else {
                // Set the payrun name
                $payrunName = 'all';
            }
        }
        else {
            return( ['ok' => false, 'error' => 'Unknown filter specified'] );
        }
        
        // Load all payslip items from database
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' . 
                    'payslip_items.units, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payslip_items.payslip_item_type_code = \'1005\' ' .
                    $filterClause .
            '), ' .
            'overtime_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'MIN(payslip_details.from_date) AS start_date, ' .
                    'SUM(units) AS units, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'GROUP BY ' .
                    'employee_id ' .
            ') ' .
            'SELECT DISTINCT ' .
                'employees.id AS employee_id, ' .
                'employees.code AS employee_code, ' .
                'employees.full_names AS employee_full_names, ' .
                'employees.last_name AS employee_last_name, ' .
                'employees.alias AS employee_alias, ' .
                'CASE WHEN ' . 
                    'employees.id_number IS NOT NULL AND employees.id_number != \'\' ' . 
                'THEN ' . 
                    'employees.id_number ' . 
                'ELSE ' . 
                    'employees.passport_number ' . 
                'END AS employee_id_number, ' .
                'employees.cell_number AS employee_cell_number, ' .
                'employees.email_address AS employee_email_address, ' .
                'CAST(COALESCE(overtime_details.units, 0) AS FLOAT) AS overtime_units, ' .
                'CAST(COALESCE(overtime_details.total, 0) AS FLOAT) AS overtime_amount ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'overtime_details ON overtime_details.employee_id = employees.id ' .
            'WHERE ' . 
                'employment_end_date IS NULL OR ' . 
                'employment_end_date >= COALESCE(overtime_details.start_date, \'9999-12-31\') ' .
            'ORDER BY ' .
                'employees.alias ASC, ' .
                'employees.code ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, $filterValues);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        $employees = [];
        $totalOvertimeUnits = 0.00;
        $totalOvertimeAmount = 0.00;
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set the employee details
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'employeeId' => $sqlRow['employee_id'],
                'employeeFullNames' => $sqlRow['employee_full_names'],
                'employeeLastName' => $sqlRow['employee_last_name'],
                'employeeIdNumber' => $sqlRow['employee_id_number'],
                'employeeCellNumber' => $sqlRow['employee_cell_number'],
                'employeeEmailAddress' => $sqlRow['employee_email_address'],
                'overtimeUnits' => $sqlRow['overtime_units'],
                'overtimeAmount' => $sqlRow['overtime_amount']
            ];
            
            // Calculate the totals
            $totalOvertimeUnits = $totalOvertimeUnits + $sqlRow['overtime_units'];
            $totalOvertimeAmount = $totalOvertimeAmount + $sqlRow['overtime_amount'];
        }
        
        // Save the totals
        $totals = [
            'totalOvertimeUnits' => $totalOvertimeUnits,
            'totalOvertimeAmount' => $totalOvertimeAmount
        ];
        
        // Return the result
        return( ['ok' => true, 'payrunName' => $payrunName, 'employees' => $employees, 'totals' => $totals] );
    }

    // Function to get the data required for the overtime report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getPayslipItemSpecifiedData($data, $user, $db) {
        $payrunName = '';
        $filterClause = '';
        $filterCount = 0;
        $filterValues = [];
        
        // Ensure that payslipItem is properly retrieved
        if (!isset($data['payslipItem']) || empty($data['payslipItem'])) {
            return ['ok' => false, 'error' => 'Payslip item is not specified'];
        }
        
        $payslipItem = $data['payslipItem'];
        
        // Add $payslipItem to the filter values
        $filterCount++;
        $filterValues[] = $payslipItem; // Adding it as the first value in filterValues
    
        // Depending on the selected filter type
        if ($data['filterType'] === 'PAYR') {
            if ($data['payrunId'] == null) {
                return ['ok' => false, 'error' => 'No payrun specified'];
            }
    
            // Get the payrun name
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if (!$sqlResult->isValid()) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunName = $sqlRow['description'];
            
            // Setup the filter clause for payrunId
            $filterCount++;
            $filterValues[] = $data['payrunId']; // Adding it as the second value in filterValues
            $filterClause .= ' AND payrun_id = $' . $filterCount; // Adding a new placeholder for payrunId
    
        } else if ($data['filterType'] === 'PERI') {
            // Check if a start or end date is specified
            if (!empty($data['startDate']) || !empty($data['endDate'])) {
                $filterClause = ' AND ( ';
                if (!empty($data['startDate'])) {
                    $payrunName .= $data['startDate'];
                    $filterCount++;
                    $filterValues[] = $data['startDate'];
                    $filterClause .= 'payslips.to_date >= $' . $filterCount;
                }
                if (!empty($data['endDate'])) {
                    if ($filterCount > 1) $payrunName .= '_';
                    $payrunName .= 'to_' . $data['endDate'];
                    $filterCount++;
                    $filterValues[] = $data['endDate'];
                    $filterClause .= ' AND payslips.to_date <= $' . $filterCount;
                }
                $filterClause .= ') ';
            } else {
                $payrunName = 'all';
            }
        } else {
            return ['ok' => false, 'error' => 'Unknown filter specified'];
        }
    error_log('filterClause ' . $filterClause);
        // Load all payslip items from database
        $sqlQuery =
            'WITH payslip_details AS ( ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_category_code, ' . 
                    'payslip_items.units, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payslip_items.payslip_item_type_code = $1 ' . // Placeholder for payslipItem
                    $filterClause .
            '), ' .
            'overtime_details AS ( ' .
                'SELECT ' .
                    'employee_id, ' .
                    'MIN(payslip_details.from_date) AS start_date, ' .
                    'SUM(units) AS units, ' .
                    'SUM(total) AS total ' .
                'FROM ' .
                    'payslip_details ' .
                'GROUP BY ' .
                    'employee_id ' .
            ') ' .
            'SELECT DISTINCT ' .
                'employees.id AS employee_id, ' .
                'employees.code AS employee_code, ' .
                'employees.full_names AS employee_full_names, ' .
                'employees.last_name AS employee_last_name, ' .
                'employees.alias AS employee_alias, ' .
                'CASE WHEN ' . 
                    'employees.id_number IS NOT NULL AND employees.id_number != \'\' ' . 
                'THEN ' . 
                    'employees.id_number ' . 
                'ELSE ' . 
                    'employees.passport_number ' . 
                'END AS employee_id_number, ' .
                'employees.cell_number AS employee_cell_number, ' .
                'employees.email_address AS employee_email_address, ' .
                'CAST(COALESCE(overtime_details.units, 0) AS FLOAT) AS overtime_units, ' .
                'CAST(COALESCE(overtime_details.total, 0) AS FLOAT) AS overtime_amount ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'overtime_details ON overtime_details.employee_id = employees.id ' .
            'WHERE ' . 
                'employment_end_date IS NULL OR ' . 
                'employment_end_date >= COALESCE(overtime_details.start_date, \'9999-12-31\') ' .
            'ORDER BY ' .
                'employees.alias ASC, ' .
                'employees.code ASC;';
        
        // Execute the query
        $sqlResult = $db->paramQuery($sqlQuery, $filterValues);
        if (!$sqlResult->isValid()) {
            return ['ok' => false, 'error' => 'Database error.'];
        }
    
        // Process result
        $employees = [];
        $totalOvertimeUnits = 0.00;
        $totalOvertimeAmount = 0.00;
        while ($sqlRow = $sqlResult->fetchAssociative()) {
            $employees[] = [
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'employeeId' => $sqlRow['employee_id'],
                'employeeFullNames' => $sqlRow['employee_full_names'],
                'employeeLastName' => $sqlRow['employee_last_name'],
                'employeeIdNumber' => $sqlRow['employee_id_number'],
                'employeeCellNumber' => $sqlRow['employee_cell_number'],
                'employeeEmailAddress' => $sqlRow['employee_email_address'],
                'overtimeUnits' => $sqlRow['overtime_units'],
                'overtimeAmount' => $sqlRow['overtime_amount']
            ];
    
            $totalOvertimeUnits += $sqlRow['overtime_units'];
            $totalOvertimeAmount += $sqlRow['overtime_amount'];
        }
    
        $totals = [
            'totalOvertimeUnits' => $totalOvertimeUnits,
            'totalOvertimeAmount' => $totalOvertimeAmount
        ];
    
        return ['ok' => true, 'payrunName' => $payrunName, 'employees' => $employees, 'totals' => $totals];
    }
    
?>