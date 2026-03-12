<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('PayslipUtil.php');
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    
    //
    // TAX RECONCILIATION CONTROLLER CLASS
    //
    
    class TaxReconciliation extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to generate a list of exceptions (if any) for a tax reconciliation for a given tax year 
        // and period
        //
        // Required Parameters
        //  taxYear             The tax year of the reconciliation certifcate details
        //  periodCode          Annual (ANNU) or interim (INTE)
        //
        // Optional Parameters
        //  None
        //
        // Returns
        //  [
        //      'isCritical',               // Whether the exception is critical
        //      'source',                   // The source of the exception (employer, employee, etc.)
        //      'value',                    // The value that caused the exception
        //      'newValue',                 // The new value if a value will be changed
        //      'description'               // A description of the exception
        //      'fullDescription'           // A full description for the exception
        //  ]
        public function getExceptions($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'periodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the reconciliation exceptions
            $result = $this->generateExceptions($db, $data['taxYear'], $data['periodCode']);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $exceptions = $result['exceptions'];
            
            echo( json_encode(['ok' => true, 'exceptions' => $exceptions]) );
            return true;
            
        }
        
        // Function to generate a tax reconciliation for a given tax year and period
        //
        // Required Parameters
        //  taxYear             The tax year of the reconciliation certifcate details
        //  periodCode          Annual (ANNU) or interim (INTE)
        //  note                A note regarding the reconciliation
        //
        // Optional Parameters
        //  None
        public function generate($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'periodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the all exceptions for the tax reconciliation
            $result = $this->generateExceptions($db, $data['taxYear'], $data['periodCode']);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $exceptions = $result['exceptions'];
            
            // Don't generate the reconciliation if there are any critical exceptions
            foreach( $exceptions as $exception ) {
                if( $exception['isCritical'] ) {
                    echo( json_encode(['ok' => false, 'error' => 'Critical exceptions have been found.']) );
                    return false;
                }
            }
            
            $periodCode = $data['periodCode'];;
            $taxYear = $data['taxYear'];
            $reconciliationStartYear = $taxYear - 1;
            $reconciliationEndYear = $taxYear;
            $reconciliationStartDate = $reconciliationStartYear . '-03-01';
            $nextReconciliationStartDate = $reconciliationEndYear . '-03-01';
            $reconciliationEndMonth = 2;
            
            // Is it an interim reconciliation certificate?
            if( $periodCode === 'INTE' ) {
                // Period is a maximum of 6 months
                $nextReconciliationStartDate = $reconciliationStartYear . '-09-01';
                $reconciliationEndYear = $reconciliationStartYear;
                $reconciliationEndMonth = 8;
            }
            
            // Get that reconciliation period end date
            $reconciliationEndDate = new DateTime( $nextReconciliationStartDate );
            $reconciliationEndDate->sub(new DateInterval('P1D'));
            
            // Get the required employer details
            $sqlQuery =
                'SELECT ' . 
                    'company_details.name, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.sars_contact_first_name, ' .
                    'company_details.sars_contact_last_name, ' .
                    'company_details.sars_contact_business_number, ' .
                    'company_details.sars_contact_cell_number, ' .
                    'company_details.sars_contact_email_address ' .
                'FROM ' . 
                    'company_details '.
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlEmployerRow = $sqlResult->fetchAssociative();
            $employerPayeNumber = $sqlEmployerRow['paye_reference_number'];
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE tax_certificate_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE tax_certificates IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE tax_reconciliations IN ACCESS EXCLUSIVE MODE', []);
            
            // Insert the tax reconciliation details
            $sqlQuery = 
                'INSERT INTO tax_reconciliations ( ' .
                    'sars_year, ' .
                    'tax_reconciliation_period_code, ' .
                    'employer_name, ' .
                    'employer_paye_number, ' .
                    'employer_sdl_number, ' .
                    'employer_uif_number, ' .
                    'employer_sic_code, ' .
                    'employer_eti_status_code, ' .
                    'employer_special_economic_zone_code, ' .
                    'employer_diplomatic_indemnity, ' .
                    'employer_address_unit, ' .
                    'employer_address_complex, ' .
                    'employer_address_street_number, ' .
                    'employer_address_street_name, ' .
                    'employer_address_suburb, ' .
                    'employer_address_city, ' .
                    'employer_address_postal_code, ' .
                    'employer_address_country_code, ' .
                    'employer_contact_person_first_name, ' .
                    'employer_contact_person_last_name, ' .
                    'employer_contact_person_position, ' .
                    'employer_contact_person_tel_number, ' .
                    'employer_contact_person_fax_number, ' .
                    'employer_contact_person_cell_number, ' .
                    'employer_contact_person_email_address, ' .
                    'note, ' .
                    'generated_on, ' .
                    'is_deleted ' .
                ') ' .
                'VALUES ( ' .
                    ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' . 
                    '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' . 
                    '$21, $22, $23, $24, $25, $26, $27, $28 ' . 
                ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $taxYear,                                           // sars_year
                $periodCode,                                        // tax_reconciliation_period_code
                $sqlEmployerRow['name'],                            // employer_name
                $employerPayeNumber,                                // employer_paye_number
                $sqlEmployerRow['sdl_payment_reference_number'],    // employer_sdl_number
                $sqlEmployerRow['uif_payment_reference_number'],    // employer_uif_number
                $sqlEmployerRow['sic_code'],                        // employer_sic_code
                $sqlEmployerRow['eti_status_code'],                 // employer_eti_status_code
                $sqlEmployerRow['special_economic_zone_code'],      // employer_special_economic_zone_code
                $sqlEmployerRow['diplomatic_indemnity'],            // employer_diplomatic_indemnity
                $sqlEmployerRow['physical_address_unit'],           // employer_address_unit
                $sqlEmployerRow['physical_address_complex'],        // employer_address_complex
                '',                                                 // employer_address_street_number
                $sqlEmployerRow['physical_address_street'],         // employer_address_street_name
                $sqlEmployerRow['physical_address_suburb'],         // employer_address_suburb
                $sqlEmployerRow['physical_address_city'],           // employer_address_city
                $sqlEmployerRow['physical_address_postal_code'],    // employer_address_postal_code
                $sqlEmployerRow['physical_address_country_code'],   // employer_address_country_code
                $sqlEmployerRow['sars_contact_first_name'],         // employer_contact_person_first_name
                $sqlEmployerRow['sars_contact_last_name'],          // employer_contact_person_last_name
                '',                                                 // employer_contact_person_position
                $sqlEmployerRow['sars_contact_business_number'],    // employer_contact_person_tel_number
                '',                                                 // employer_contact_person_fax_number
                $sqlEmployerRow['sars_contact_cell_number'],        // employer_contact_person_cell_number
                $sqlEmployerRow['sars_contact_email_address'],      // employer_contact_person_email_address
                $data['note'],                                      // note
                date('Y-m-d H:i:s', time()),                        // generated_on
                false                                               // is_deleted
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $reconciliationId = $sqlRow['id'];
            
            // Get details of all employees who should get tax certificates for the given tax year
            $sqlEmployeeQuery = 
                'SELECT DISTINCT ' .
                    'employees.id AS employee_id, ' .
                    'employees.code, ' .
                    'employees.title_code, ' .
                    'employees.initials, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.passport_country, ' .
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
                    'employees.payment_method_code, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_period_end_day, ' .
                    'employees.payment_day, ' .
                    'employees.income_tax_number, ' .
                    'employees.income_tax_directive_1, ' .
                    'employees.income_tax_directive_1_issued_date, ' .
                    'employees.income_tax_directive_1_source_code, ' .
                    'employees.income_tax_directive_1_amount, ' .
                    'employees.income_tax_directive_2, ' .
                    'employees.income_tax_directive_2_issued_date, ' .
                    'employees.income_tax_directive_2_source_code, ' .
                    'employees.income_tax_directive_2_amount, ' .
                    'employees.income_tax_directive_3, ' .
                    'employees.income_tax_directive_3_issued_date, ' .
                    'employees.income_tax_directive_3_source_code, ' .
                    'employees.income_tax_directive_3_amount, ' .
                    'employees.sic_code, ' .
                    'employee_bank_details.financial_institution_code, ' . 
                    'COALESCE(financial_institutions.name, \'\') AS financial_institution_name, ' . 
                    'employee_bank_details.bank_account_type_code, ' . 
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'COALESCE(employee_bank_details.account_number, \'\') AS account_number, ' . 
                    'COALESCE(employee_bank_details.branch_code, \'\') AS branch_code ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
                'LEFT JOIN ' . 
                    'financial_institutions ON employee_bank_details.financial_institution_code = financial_institutions.code ' . 
                'LEFT JOIN ' .
                    'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' . 
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payruns.processed_on IS NOT NULL AND ( ' .
                        '(payslips.to_date >= TO_DATE($1, \'YYYY-MM-DD\')) AND ' .
                        '(payslips.to_date < TO_DATE($2, \'YYYY-MM-DD\')) ' .
                    ') AND ' .
                    'employees.employment_start_date < TO_DATE($2, \'YYYY-MM-DD\') AND ' .
                    '( ' .
                        'employees.employment_end_date IS NULL OR ' .
                        'employees.employment_end_date >= TO_DATE($1, \'YYYY-MM-DD\') ' .
                    ') ' .
                'ORDER BY employees.alias ASC;';
            $sqlEmployeeResult = $db->paramQuery($sqlEmployeeQuery, [
                $reconciliationStartDate,
                $nextReconciliationStartDate,
            ]);
            if( !$sqlEmployeeResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the tax certificates for each employee
            while( $sqlEmployeeRow = $sqlEmployeeResult->fetchAssociative() ) {
                $taxCertificateType = 'IT3A';
                $reasonForNonDeduction = '02';
                    
                // Set time limit to 5 minutes
                set_time_limit(300);
                
                $employeeId = $sqlEmployeeRow['employee_id'];
                
                // Set the employee nature
                $employeeNature = 'A';
                if( $sqlEmployeeRow['is_asylum_seeker'] ) {
                    $employeeNature = 'M';
                }
                else if( $sqlEmployeeRow['is_refugee'] ) {
                    $employeeNature = 'R';
                }
                
                // Set the default date of the first payslip
                $firstPaylsipToDate = new DateTime($sqlEmployeeRow['employment_start_date']);
                
                // Is the employee not paid monthly?
                if( $sqlEmployeeRow['payment_period_code'] !== 'MONT' ) {
                    // Get the to date of the first payslip in the tax reconciliation period
                    $sqlFirstPayslipDateQuery = 
                        'SELECT ' .
                            'payslips.to_date ' .
                        'FROM ' .
                            'payslips ' .
                        'LEFT JOIN ' .
                            'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                        'LEFT JOIN ' .
                            'payruns ON payruns.id = payslips.payrun_id ' .
                        'LEFT JOIN ' .
                            'employees ON employees.id = payslips.employee_id ' .
                        'WHERE ' .
                            'payslips.employee_id = $1 AND ' .
                            'payslips.status_code = \'ACTI\' AND ' .
                            'payruns.processed_on IS NOT NULL AND ( ' .
                                '(payslips.to_date >= TO_DATE($2, \'YYYY-MM-DD\')) AND ' .
                                '(payslips.to_date < TO_DATE($3, \'YYYY-MM-DD\')) ' .
                            ') AND ' .
                            'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                            '( ' .
                                'employees.employment_end_date IS NULL OR ' .
                                'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                            ') ' .
                        'ORDER BY payslips.to_date ASC LIMIT 1;';
                    $sqlFirstPayslipDateResult = $db->paramQuery($sqlFirstPayslipDateQuery, [
                        $employeeId,
                        $reconciliationStartDate,
                        $nextReconciliationStartDate,
                    ]);
                    if( !$sqlFirstPayslipDateResult->isValid() ) {
                        return( ['ok' => false, 'error' => 'Database error.'] );
                    }
                    
                    // Are there no employee certificates to be generated?
                    if( $sqlFirstPayslipDateResult->getRowCount() == 1 ) {
                        $firstPayslipDateRow = $sqlFirstPayslipDateResult->fetchAssociative();
                        $firstPaylsipToDate = new DateTime($firstPayslipDateRow['to_date']);
                    }
                }
                
                // Caluclate the number of pay periods for the employee
                $paymentPeriodEndDay = $sqlEmployeeRow['payment_period_end_day'];
                if( $sqlEmployeeRow['payment_period_code'] === 'MONT' ) {
                    $payPeriods = 12;
                }
                else if( $sqlEmployeeRow['payment_period_code'] === 'WEEK' ) {
                    $payPeriods = \PayslipUtil\getWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                    // $payPeriods = 52;
                }
                else if( $sqlEmployeeRow['payment_period_code'] === 'BWEE' ) {
                    $payPeriods = \PayslipUtil\getBiWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                    // $payPeriods = 26;
                }
                
                // $payPeriods = 12;
                // if( $sqlEmployeeRow['payment_period_code'] === 'WEEK' ) {
                //     // Set the end date
                //     $endDate = new DateTime( $nextReconciliationStartDate );
                //     $endDate->setTime(0, 0, 0);
                    
                //     // Set the start date to the beginning of the SARS tax year
                //     $startDate = new DateTime( $reconciliationStartDate );
                //     $startDate->setTime(0, 0, 0);
                    
                //     // Convert the tax year to a period of days
                //     $taxYearPeriod = new DatePeriod($startDate, new DateInterval('P1D'), $endDate);
                    
                //     // Count the number of weeks from the start of the tax year
                //     $payPeriods = 0;
                //     foreach($taxYearPeriod as $taxYearDay) {
                //         if( $taxYearDay->format('w') == $paymentPeriodEndDay ) {
                //             $payPeriods = $payPeriods + 1;
                //         }
                //     }
                // }
                // else if( $sqlEmployeeRow['payment_period_code'] === 'BWEE' ) {
                //     $payPeriods = 26;
                // }
                
                // Set the reconciliation certificate number. This is a unique thirty (30) digit number allocated 
                // to each specific reconciliation/IT3(a) certificate issued by the employer.
                //
                // The certificate number comprises the following:
                // - The first ten (10) digits = PAYE reference number (or alternatively, the Income Tax reference 
                //   number)
                // - The next four(4) digits = Transaction Year
                // - The next two (2) digits = Last two digits of period of reconciliation (08 or 02)
                // - The next fourteen (14) digits can contain any unique combination of alpha and numeric 
                //   characters
                $certificateNumber = str_replace(' ', '', $employerPayeNumber);
                $certificateNumber = str_replace('/', '', $certificateNumber);
                $certificateNumber = strtoupper(substr($certificateNumber, 0 , 10));
                $certificateNumber = $certificateNumber . $taxYear;
                
                // Is it an interim reconciliation certificate?
                $employeeEmployedTo = $sqlEmployeeRow['employment_end_date'];
                if( $data['periodCode'] === 'INTE' ) {
                    // Was the employee dismissed during the interim period?
                    if( ($employeeEmployedTo !== null) && ($employeeEmployedTo < $nextReconciliationStartDate) ) {
                        $certificateNumber = $certificateNumber . '02';
                    }
                    else {
                        $certificateNumber = $certificateNumber . '08';
                    }
                }
                else {
                    $certificateNumber = $certificateNumber . '02';
                }
                
                // Get a unique number to append to the tax certificate number
                $sqlQuery = 'SELECT MAX(RIGHT(number, 14)) AS number FROM tax_certificates;';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $number = 1;
                if( $sqlResult->getRowCount() > 0 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $number = $sqlRow['number'] + 1;
                }
                $certificateNumber = $certificateNumber . str_pad(intval($number), 14, "0", STR_PAD_LEFT);
                
                // Adjust the employee employed to date to match the certficate values
                if( $employeeEmployedTo === null || $employeeEmployedTo > $reconciliationEndDate->format('Y-m-d') ) {
                    $employeeEmployedTo = $reconciliationEndDate->format('Y-m-d');
                }
                
                // Get all the payslips for the employee for the given tax year
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
                    'LEFT JOIN ' .
                        'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payslips.status_code = \'ACTI\' AND ' .
                        'payslips.employee_id = $1 AND ' .
                        'payruns.processed_on IS NOT NULL AND ( ' .
                            '(payslips.to_date >= TO_DATE($2, \'YYYY-MM-DD\')) AND ' .
                            '(payslips.to_date < TO_DATE($3, \'YYYY-MM-DD\')) ' .
                        ') AND ' .
                        'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                        '( ' .
                            'employees.employment_end_date IS NULL OR ' .
                            'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                        ') ' .
                    'ORDER BY payslips.to_date ASC;';
                $payslipResult = $db->paramQuery($payslipQuery, [
                    $employeeId, 
                    $reconciliationStartDate,
                    $nextReconciliationStartDate,
                ]);
                if( !$payslipResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Are there no payslips for tax period?
                if( $payslipResult->getRowCount() <= 0 ) {
                    echo( json_encode(['ok' => true, 'id' => null]) );
                    return true;
                }
                
                // Calculate and set all the IRP 5 items
                $totalIncome = 0.00;
                $totalTaxableIncome = 0.00;
                $totalNonTaxableIncome = 0.00;
                $totalRetirementIncome = 0.00;
                $totalNonRetirementIncome = 0.00;
                $totalDeductions = 0.00;
                $totalPayeOnLumpSums = 0.00;
                $totalMedicalSchemeCredit = 0.00;
                $totalMedicalExpenses = 0.00;
                $totalStandardIncomeTax = 0.00;
                $totalPaye = 0.00;
                $totalTax = 0.00;
                $totalUif = 0.00;
                $totalSdl = 0.00;
                $totalRemuneration = 0.00;
                $payPeriodsWorked = 0;
                $taxCertificateItems = [];
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
                    
                    // Add to the number of pay periods worked
                    $payPeriodsWorked = $payPeriodsWorked + 1;
                    
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
                        'ORDER BY custom_sort, payslip_items.description ASC, payslip_items.payslip_item_type_code ASC;';
                    $itemResult = $db->paramQuery($itemQuery, [
                        $payslipRow['id']
                    ]);
                    if( !$itemResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // For every payslip item
                    $items = [];
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
                                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $employeeId]);
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
                        
                        // Set the reconciliation item amount
                        $amount = doubleval($itemRow['total']);
                        
                        // Get the SARS code and amount for the relevant payslip items
                        $sarsItems = [];
                        if( ( $itemRow['payslip_item_type_code'] === '1000' ) ||
                            ( $itemRow['payslip_item_type_code'] === '1001' ) ||
                            ( $itemRow['payslip_item_type_code'] === '1002' ) ) {
                            $sarsItems[] = ['code' => '3601', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '1003' ) {
                            $sarsItems[] = ['code' => '3606', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '1004' ) {
                            $sarsItems[] = ['code' => '3605', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '1005' ) {
                            $sarsItems[] = ['code' => '3607', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2000' ) {
                            $totalPaye = $totalPaye + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2001' ) {
                            $totalPaye = $totalPaye + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2002' ) {
                            $totalUif = $totalUif + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2003' ) {
                            $sarsItems[] = ['code' => '4005', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2004' ) {
                            // Other deductions aren't reflected on the reconciliation
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2005' ) {
                            $sarsItems[] = ['code' => '4001', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2006' ) {
                            $sarsItems[] = ['code' => '4003', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2007' ) {
                            $sarsItems[] = ['code' => '4006', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2008' ) {
                            // Employee loans aren's reflected on the reconciliation
                        }
                        else if( $itemRow['payslip_item_type_code'] === '3001' ) {
                            $totalUif = $totalUif + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '3002' ) {
                            $totalSdl = $totalSdl + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4000' ) {
                            $sarsItems[] = ['code' => '3810', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            
                            $sarsItems[] = ['code' => '4005', 'amount' => $amount];
                            $sarsItems[] = ['code' => '4474', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4001' ) {
                            $sarsItems[] = ['code' => '3817', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            
                            $sarsItems[] = ['code' => '4001', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4002' ) {
                            $sarsItems[] = ['code' => '3825', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            
                            $sarsItems[] = ['code' => '4003', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4003' ) {
                            $sarsItems[] = ['code' => '3828', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            
                            $sarsItems[] = ['code' => '4006', 'amount' => $amount];
                            $totalDeductions = $totalDeductions + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4004' ) {
                            $sarsItems[] = ['code' => '3801', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4005' ) {
                            $sarsItems[] = ['code' => '3801', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4006' ) {
                            $sarsItems[] = ['code' => '3802', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4007' ) {
                            $sarsItems[] = ['code' => '3805', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4008' ) {
                            $sarsItems[] = ['code' => '3815', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            // $totalNonTaxableIncome = $totalNonTaxableIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4009' ) {
                            $sarsItems[] = ['code' => '3821', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            // $totalNonTaxableIncome = $totalNonTaxableIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5000' ) {
                            // Add travel allowance
                            $sarsItems[] = ['code' => '3701', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                            
                            // Add the portion that represents remuneration
                            $sarsItems[] = ['code' => '4582', 'amount' => ($amount / 100) * 80];
                            $totalDeductions = $totalDeductions + ($amount / 100) * 80;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5001' ) {
                            // Calculate the reimbursive travel allowance limit
                            $reimbursiveLimit = \PayslipUtil\getTravelAllowancePrescribedRate( new DateTime( $payslipRow['to_date'] ) ) * $itemRow['units'];
                            
                            // Is the amount under the limit?
                            if( $amount <= $reimbursiveLimit ) {
                                // Add reimbursive travel allowance
                                $sarsItems[] = ['code' => '3703', 'amount' => $amount];
                            }
                            else {
                                // Add reimbursive travel allowance
                                $sarsItems[] = ['code' => '3702', 'amount' => $reimbursiveLimit];
                                $sarsItems[] = ['code' => '3722', 'amount' => ($amount - $reimbursiveLimit)];
                            }
                            $totalIncome = $totalIncome + $amount;
                            
                            // // Add the amount above the tax threshold, if any
                            // if( $itemRow['units'] !== null ) {
                            //     $taxThreshold = \PayslipUtil\getTravelAllowancePrescribedRate( new DateTime( $payslipRow['to_date'] ) ) * $itemRow['units'];
                                
                            //     if( $itemRow['total'] > $taxThreshold ) {
                            //         $sarsItems[] = ['code' => '3722', 'amount' => ($itemRow['total'] - $taxThreshold)];
                            //         $totalIncome = $totalIncome + ($itemRow['total'] - $taxThreshold);
                            //     }
                            // }
                            
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5002' ) {
                            // $sarsItems[] = ['code' => '3706', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3713', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5003' ) {
                            // $sarsItems[] = ['code' => '3709', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3714', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5004' ) {
                            // $sarsItems[] = ['code' => '3711', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3713', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5005' ) {
                            // $sarsItems[] = ['code' => '3712', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3713', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5006' ) {
                            // $sarsItems[] = ['code' => '3712', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3713', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5007' ) {
                            // $sarsItems[] = ['code' => '3712', 'amount' => $amount]; // Not applicable form 2010
                            $sarsItems[] = ['code' => '3714', 'amount' => $amount];
                            $totalIncome = $totalIncome + $amount;
                        }
                        else {
                            echo( json_encode(['ok' => false, 'error' => 'Unidentified payslip item found.']) );
                            return false;
                        }
                        
                        // Are there no sars items to be listed on the reconciliation?
                        if( count($sarsItems) <= 0 ) {
                            continue;
                        }
                        
                        // For every SARS items
                        foreach( $sarsItems AS $sarsItem) {
                            // Try to find the SARS code index in the reconciliation item array
                            $index = null;
                            for( $i = 0; $i < count($taxCertificateItems); $i++ ) {
                                if( $taxCertificateItems[$i]['sarsCode'] === $sarsItem['code'] ) {
                                    $index = $i;
                                    break;
                                }
                            }
                            
                            // Was the SARS code found?
                            if( $index !== null ) {
                                // Add the amount to the relevant reconciliation item
                                $taxCertificateItems[$i]['amount'] = $taxCertificateItems[$i]['amount'] + $sarsItem['amount'];
                            }
                            else {
                                // Add the relevant reconciliation item
                                $taxCertificateItems[] = [
                                    'sarsCode' => $sarsItem['code'],
                                    'clearanceNumber' => '',
                                    'retirementFund' => false,
                                    'amount' => $sarsItem['amount']
                                ];
                            }
                        }
                    }
                    
                    // Calculate the payslip totals
                    $payslip['items'] = $items;
                    $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslip );
                    $totalTaxableIncome = $totalTaxableIncome + $payslipTotals['taxableIncome'];
                    $totalNonTaxableIncome = $totalNonTaxableIncome + $payslipTotals['nonTaxableIncome'];
                }
                
                // Re-imbursive travel allowances can only fall under either code 3702 (and 3722) or 3703. If both
                // are present, consolidate them to code 3702.
                for( $i = 0; $i < count($taxCertificateItems); $i++ ) {
                    if( $taxCertificateItems[$i]['sarsCode'] === '3702' ) {
                        for( $j = 0; $j < count($taxCertificateItems); $j++ ) {
                            if( $taxCertificateItems[$j]['sarsCode'] === '3703' ) {
                                $taxCertificateItems[$i]['amount'] =  $taxCertificateItems[$i]['amount'] + $taxCertificateItems[$j]['amount'];
                                $totalNonTaxableIncome = $totalNonTaxableIncome - $taxCertificateItems[$j]['amount'];
                                unset($taxCertificateItems[$j]);
                                break;
                            }
                        }
                        break;
                    }
                }

                for ($i = 0; $i < count($taxCertificateItems); $i++) {
                    if ($taxCertificateItems[$i]['sarsCode'] === '3701') {
                        for ($j = 0; $j < count($taxCertificateItems); $j++) {
                            if ($taxCertificateItems[$j]['sarsCode'] === '3703') {
                                // Combine amounts
                                // $taxCertificateItems[$i]['amount'] += $taxCertificateItems[$j]['amount'];    // Julian - Comment out to fix issue on IRP5 - 2025-10-16
                                $totalNonTaxableIncome -= $taxCertificateItems[$j]['amount'];
                                
                                // Change '3703' to '3702'
                                $taxCertificateItems[$j]['sarsCode'] = '3702';
                                
                                break;
                            }
                        }
                        break;
                    }
                }
                
                // Is there any PAYE?
                if( $totalPaye > 0.009 ) {
                    $taxCertificateType = 'IRP5';
                    $reasonForNonDeduction = '';
                }
                
                // Calculate the total tax
                $totalTax = $totalPaye + $totalStandardIncomeTax;
                
                $employeePostalAddressLine1 = $sqlEmployeeRow['postal_address_line_1'];
                $employeePostalAddressLine2 = $sqlEmployeeRow['postal_address_line_2'];
                $employeePostalAddressLine3 = $sqlEmployeeRow['postal_address_line_3'];
                $employeePostalAddressLine4 = '';
                $employeePostalAddressCode = $sqlEmployeeRow['postal_address_code'];
                $employeePostalAddressCountryCode = $sqlEmployeeRow['postal_address_country_code'];
                
                // Is the employee's postal address teh same as the physical address?
                if( $sqlEmployeeRow['postal_same_as_physical_address'] ) {
                    // Convert the physical address to the required format
                    if( ($sqlEmployeeRow['physical_address_unit'] !== null) && (strlen($sqlEmployeeRow['physical_address_unit']) > 0) ) {
                        $employeePostalAddressLine1 = $employeePostalAddressLine1 . $sqlEmployeeRow['physical_address_unit'];
                    }
                    if( ($sqlEmployeeRow['physical_address_complex'] !== null) && (strlen($sqlEmployeeRow['physical_address_complex']) > 0) ) {
                        if( $employeePostalAddressLine1 !== '') $employeePostalAddressLine1 = $employeePostalAddressLine1 . ', ';
                        $employeePostalAddressLine1 = $employeePostalAddressLine1 . $sqlEmployeeRow['physical_address_complex'];
                    }
                    if( ($sqlEmployeeRow['physical_address_street'] !== null) && (strlen($sqlEmployeeRow['physical_address_street']) > 0) ) {
                        if( $employeePostalAddressLine1 === '') {
                            $employeePostalAddressLine1 = $sqlEmployeeRow['physical_address_street'];
                        }
                        else {
                            $employeePostalAddressLine2 = $sqlEmployeeRow['physical_address_street'];
                        }
                    }
                    if( ($sqlEmployeeRow['physical_address_suburb'] !== null) && (strlen($sqlEmployeeRow['physical_address_suburb']) > 0) ) {
                        if( $employeePostalAddressLine2 === '') {
                            $employeePostalAddressLine2 = $sqlEmployeeRow['physical_address_suburb'];
                        }
                        else {
                            $employeePostalAddressLine3 = $sqlEmployeeRow['physical_address_suburb'];
                        }
                    }
                    if( ($sqlEmployeeRow['physical_address_city'] !== null) && (strlen($sqlEmployeeRow['physical_address_city']) > 0) ) {
                        if( $employeePostalAddressLine3 === '') {
                            $employeePostalAddressLine3 = $sqlEmployeeRow['physical_address_city'];
                        }
                        else {
                            $employeePostalAddressLine4 = $sqlEmployeeRow['physical_address_city'];
                        }
                    }
                    $employeePostalAddressCode = $sqlEmployeeRow['physical_address_postal_code'];
                    $employeePostalAddressCountryCode = $sqlEmployeeRow['physical_address_country_code'];
                }
                
                // Add the tax certificate for the specified employee
                $sqlQuery = 
                    'INSERT INTO tax_certificates ( ' .
                        'tax_reconciliation_id, ' .
                        'tax_certificate_type_code, ' .
                        'reason_for_non_deduction, ' .
                        'number, ' .
                        'pay_periods, ' .
                        'pay_periods_worked, ' .
                        'employee_id, ' .
                        'employee_nature, ' .
                        'employee_sic_code, ' .
                        'employee_fixed_rate_income, ' .
                        'employee_voluntary_over_deduction, ' .
                        'employee_directive_1, ' .
                        'employee_directive_1_issued_date, ' .
                        'employee_directive_1_source_code, ' .
                        'employee_directive_1_amount, ' .
                        'employee_directive_2, ' .
                        'employee_directive_2_issued_date, ' .
                        'employee_directive_2_source_code, ' .
                        'employee_directive_2_amount, ' .
                        'employee_directive_3, ' .
                        'employee_directive_3_issued_date, ' .
                        'employee_directive_3_source_code, ' .
                        'employee_directive_3_amount, ' .
                        'employee_surname, ' .
                        'employee_first_names, ' .
                        'employee_initials, ' .
                        'employee_id_number, ' .
                        'employee_passport_number, ' .
                        'employee_passport_country, ' .
                        'employee_date_of_birth, ' .
                        'employee_income_tax_number, ' .
                        'employee_number, ' .
                        'employee_employed_from, ' .
                        'employee_employed_to, ' .
                        'employee_work_address_unit, ' .
                        'employee_work_address_complex, ' .
                        'employee_work_address_street_number, ' .
                        'employee_work_address_street_name, ' .
                        'employee_work_address_suburb, ' .
                        'employee_work_address_city, ' .
                        'employee_work_address_postal_code, ' .
                        'employee_work_address_country_code, ' .
                        'employee_residential_address_unit, ' .
                        'employee_residential_address_complex, ' .
                        'employee_residential_address_street_number, ' .
                        'employee_residential_address_street_name, ' .
                        'employee_residential_address_suburb, ' .
                        'employee_residential_address_city, ' .
                        'employee_residential_address_postal_code, ' .
                        'employee_residential_address_country_code, ' .
                        'employee_postal_address_line_1, ' .
                        'employee_postal_address_line_2, ' .
                        'employee_postal_address_line_3, ' .
                        'employee_postal_address_line_4, ' .
                        'employee_postal_address_code, ' .
                        'employee_postal_address_country_code, ' .
                        'employee_home_number, ' .
                        'employee_work_number, ' .
                        'employee_cell_number, ' .
                        'employee_fax_number, ' .
                        'employee_email_address, ' .
                        'employee_financial_institution_code, ' .
                        'employee_financial_institution_name, ' .
                        'employee_bank_account_type_code, ' .
                        'employee_account_number, ' .
                        'employee_branch_code, ' .
                        'total_income, ' .
                        'total_taxable_income, ' .
                        'total_non_taxable_income, ' .
                        'total_retirement_income, ' .
                        'total_non_retirement_income, ' .
                        'total_deductions, ' .
                        'total_paye_on_lump_sums, ' .
                        'total_medical_scheme_credit, ' .
                        'total_medical_expenses, ' .
                        'total_standard_income_tax, ' .
                        'total_paye, ' .
                        'total_tax, ' .
                        'total_uif, ' .
                        'total_sdl, ' .
                        'self_service_access ' .
                    ') ' .
                    'VALUES ( ' .
                        ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' . 
                        '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' . 
                        '$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, ' . 
                        '$31, $32, $33, $34, $35, $36, $37, $38, $39, $40, ' . 
                        '$41, $42, $43, $44, $45, $46, $47, $48, $49, $50, ' . 
                        '$51, $52, $53, $54, $55, $56, $57, $58, $59, $60, ' . 
                        '$61, $62, $63, $64, $65, $66, $67, $68, $69, $70, ' . 
                        '$71, $72, $73, $74, $75, $76, $77, $78, $79, $80, ' . 
                        '$81 ' .
                    ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                        $reconciliationId,                                  // tax_reconciliation_id
                        $taxCertificateType,                                // tax_certificate_type_code
                        $reasonForNonDeduction,                             // reason_for_non_deduction
                        $certificateNumber,                                 // number
                        $payPeriods,                                        // pay_periods
                        $payPeriodsWorked,                                  // pay_periods_worked
                        $employeeId,                                        // employee_id
                        $employeeNature,                                    // employee_nature
                        $sqlEmployeeRow['sic_code'],                        // employee_sic_code
                        false,                                              // employee_fixed_rate_income
                        false,                                              // employee_voluntary_over_deduction
                        $sqlEmployeeRow['income_tax_directive_1'],                      // employee_directive_1
                        $sqlEmployeeRow['income_tax_directive_1_issued_date'],          // employee_directive_1_issued_date
                        trim($sqlEmployeeRow['income_tax_directive_1_source_code']),    // employee_directive_1_source_code
                        $sqlEmployeeRow['income_tax_directive_1_amount'],               // employee_directive_1_amount
                        $sqlEmployeeRow['income_tax_directive_2'],                      // employee_directive_2
                        $sqlEmployeeRow['income_tax_directive_2_issued_date'],          // employee_directive_2_issued_date
                        trim($sqlEmployeeRow['income_tax_directive_2_source_code']),    // employee_directive_2_source_code
                        $sqlEmployeeRow['income_tax_directive_2_amount'],               // employee_directive_2_amount
                        $sqlEmployeeRow['income_tax_directive_3'],                      // employee_directive_3
                        $sqlEmployeeRow['income_tax_directive_3_issued_date'],          // employee_directive_3_issued_date
                        trim($sqlEmployeeRow['income_tax_directive_3_source_code']),    // employee_directive_3_source_code
                        $sqlEmployeeRow['income_tax_directive_3_amount'],               // employee_directive_3_amount
                        $sqlEmployeeRow['last_name'],                       // employee_surname
                        $sqlEmployeeRow['full_names'],                      // employee_first_names
                        $sqlEmployeeRow['initials'],                        // employee_initials
                        $sqlEmployeeRow['id_number'],                       // employee_id_number
                        $sqlEmployeeRow['passport_number'],                 // employee_passport_number
                        $sqlEmployeeRow['passport_country'],                // employee_passport_country
                        $sqlEmployeeRow['date_of_birth'],                   // employee_date_of_birth
                        $sqlEmployeeRow['income_tax_number'],               // employee_income_tax_number
                        $sqlEmployeeRow['code'],                            // employee_number
                        $sqlEmployeeRow['employment_start_date'],           // employee_employed_from
                        $sqlEmployeeRow['employment_end_date'],             // employee_employed_to
                        $sqlEmployeeRow['work_address_unit'],               // employee_work_address_unit
                        $sqlEmployeeRow['work_address_complex'],            // employee_work_address_complex
                        '',                                                 // employee_work_address_street_number
                        $sqlEmployeeRow['work_address_street'],             // employee_work_address_street_name
                        $sqlEmployeeRow['work_address_suburb'],             // employee_work_address_suburb
                        $sqlEmployeeRow['work_address_city'],               // employee_work_address_city
                        $sqlEmployeeRow['work_address_postal_code'],        // employee_work_address_postal_code
                        $sqlEmployeeRow['work_address_country_code'],       // employee_work_address_country_code
                        $sqlEmployeeRow['physical_address_unit'],           // employee_residential_address_unit
                        $sqlEmployeeRow['physical_address_complex'],        // employee_residential_address_complex
                        '',                                                 // employee_residential_address_street_number
                        $sqlEmployeeRow['physical_address_street'],         // employee_residential_address_street_name
                        $sqlEmployeeRow['physical_address_suburb'],         // employee_residential_address_suburb
                        $sqlEmployeeRow['physical_address_city'],           // employee_residential_address_city
                        $sqlEmployeeRow['physical_address_postal_code'],    // employee_residential_address_postal_code
                        $sqlEmployeeRow['physical_address_country_code'],   // employee_residential_address_country_code
                        $employeePostalAddressLine1,                        // employee_postal_address_line_1
                        $employeePostalAddressLine2,                        // employee_postal_address_line_2
                        $employeePostalAddressLine3,                        // employee_postal_address_line_3
                        $employeePostalAddressLine4,                        // emptotal_incomeloyee_postal_address_line_4
                        $employeePostalAddressCode,                         // employee_postal_address_code
                        $employeePostalAddressCountryCode,                  // employee_postal_address_country_code
                        $sqlEmployeeRow['home_number'],                     // employee_home_number
                        $sqlEmployeeRow['work_number'],                     // employee_work_number
                        $sqlEmployeeRow['cell_number'],                     // employee_cell_number
                        $sqlEmployeeRow['fax_number'],                      // employee_fax_number
                        $sqlEmployeeRow['email_address'],                   // employee_email_address
                        $sqlEmployeeRow['financial_institution_code'],      // employee_financial_institution_code
                        $sqlEmployeeRow['financial_institution_name'],      // employee_financial_institution_name
                        $sqlEmployeeRow['bank_account_type_code'],          // employee_bank_account_type_code
                        $sqlEmployeeRow['account_number'],                  // employee_account_number
                        $sqlEmployeeRow['branch_code'],                     // employee_branch_code
                        $totalIncome,                                       // total_income
                        $totalTaxableIncome,                                // total_taxable_income
                        $totalNonTaxableIncome,                             // total_non_taxable_income
                        $totalRetirementIncome,                             // total_retirement_income
                        $totalNonRetirementIncome,                          // total_non_retirement_income
                        $totalDeductions,                                   // total_deductions
                        $totalPayeOnLumpSums,                               // total_paye_on_lump_sums
                        $totalMedicalSchemeCredit,                          // total_medical_scheme_credit
                        $totalMedicalExpenses,                              // total_medical_expenses
                        $totalStandardIncomeTax,                            // total_standard_income_tax
                        $totalPaye,                                         // total_paye
                        $totalTax,                                          // total_tax
                        $totalUif,                                          // total_uif
                        $totalSdl,                                          // total_sdl
                        false                                               // self_service_access
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                $taxCertificateId = $sqlRow['id'];
                
                // Add all the tax certificate items
                foreach( $taxCertificateItems as $item ) {
                    $sqlQuery = 
                        'INSERT INTO tax_certificate_items ( ' .
                            'tax_certificate_id, ' .
                            'sars_code, ' .
                            'clearance_number, ' .
                            'retirement_fund, ' .
                            'amount ' .
                        ') ' .
                        'VALUES ( ' . 
                            '$1, $2, $3, $4, $5 ' .
                        ')';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $taxCertificateId,
                        $item['sarsCode'],
                        $item['clearanceNumber'],
                        $item['retirementFund'],
                        $item['amount']
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'id' => $reconciliationId]) );
            return true;
        }
        
        // Function to get a list of tax reconciliation periods
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getPeriodList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC'
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize query parameters
            $sqlParams = [];
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = ' WHERE ( ' .
                    'tax_reconciliation_periods.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ') ';
            }
            
            // Check that sort order given is valid
            if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
                echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
                return false;
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
            
            // Load periods from database
            $sqlQuery =
                'SELECT ' .
                    'tax_reconciliation_periods.code AS period_code, ' . 
                    'tax_reconciliation_periods.name AS period_name ' . 
                'FROM ' .
                    'tax_reconciliation_periods ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'tax_reconciliation_periods.name ' . $data['sortOrder'] . ' ' . $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create periods array
            $periods = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $periods[] = [
                    'code' => $sqlRow['period_code'],
                    'name' => $sqlRow['period_name']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'periods' => $periods]) );
            return true;
        }
        
        // Function to get a list of tax reconciliations
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  taxYear                 Limit reconciliation details to only the selected tax year
        //  periodCode              Limit reconciliation details to only the selected period
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'taxYear' => null,
                'periodCode' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'taxYear' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'periodCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            
            // Build where clause if a search string was given
            $whereClause = 'WHERE (tax_reconciliations.is_deleted = FALSE)  ';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 'AND ( ';
                $whereClause = $whereClause . '(tax_reconciliation_periods.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(tax_reconciliations.note ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(CAST(tax_reconciliations.sars_year AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(CAST(tax_reconciliations.sars_year - 1 AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ') ';
            }
            
            // Was a tax year filter specfied?
            if( isset($data['taxYear']) && $data['taxYear'] !== '' ) {
                if( $whereClause === '' ) {
                    $whereClause = $whereClause . 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                $sqlParams[] = $data['taxYear'];
                $whereClause = $whereClause . ' (tax_reconciliations.sars_year = $' . count($sqlParams) . ') ';
            }
            
            // Was a type filter specfied?
            if( isset($data['periodCode']) && $data['periodCode'] !== '' ) {
                if( $whereClause === '' ) {
                    $whereClause = $whereClause . 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                $sqlParams[] = $data['periodCode'];
                $whereClause = $whereClause . ' (tax_reconciliations.tax_reconciliation_period_code = $' . count($sqlParams) . ') ';
            }
            
            // Check that sort order given is valid
            if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
                echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
                return false;
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
            
            // Get the tax years for all the available payruns
            $sqlQuery =
                'SELECT ' .
                    'tax_reconciliations.id, ' .
                    'tax_reconciliations.tax_reconciliation_period_code AS period_code, ' .
                    'tax_reconciliation_periods.name AS period_name, ' .
                    'tax_reconciliations.sars_year, ' .
                    'tax_reconciliations.generated_on, ' .
                    'tax_reconciliations.note ' .
                'FROM ' .
                    'tax_reconciliations ' .
                'LEFT JOIN ' .
                    'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                $whereClause .
                'ORDER BY ' .
                    'tax_reconciliations.sars_year ' . $data['sortOrder'] . ', ' . 
                    'tax_reconciliations.tax_reconciliation_period_code ASC, ' . 
                    'tax_reconciliations.generated_on DESC ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the array
            $reconciliations = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $reconciliations[] = [
                    'id' => $sqlRow['id'],
                    'taxYear' => $sqlRow['sars_year'],
                    'periodCode' => $sqlRow['period_code'],
                    'periodName' => $sqlRow['period_name'],
                    'generatedOn' => $sqlRow['generated_on'],
                    'note' => $sqlRow['note']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'reconciliations' => $reconciliations]) );
            return true;
        }
        
        // Function to get the reconciliation details
        //
        // Required Parameters
        //  reconciliationId            The id of the reconciliation whose details to get
        //
        // Optional Parameters
        //  None
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'reconciliationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the reconciliation details
            $sqlQuery =
                'SELECT ' .
                    'tax_reconciliations.id, ' . 
                    'tax_reconciliations.sars_year, ' . 
                    'tax_reconciliations.tax_reconciliation_period_code AS period_code, ' .
                    'tax_reconciliation_periods.name AS period_name, ' .
                    'tax_reconciliations.employer_name, ' . 
                    'tax_reconciliations.employer_paye_number, ' . 
                    'tax_reconciliations.employer_sdl_number, ' . 
                    'tax_reconciliations.employer_uif_number, ' . 
                    'tax_reconciliations.employer_sic_code, ' . 
                    'sic_codes.name AS employer_sic_name, ' . 
                    'tax_reconciliations.employer_eti_status_code, ' . 
                    'eti_status_types.name AS employer_eti_status_name, ' . 
                    'tax_reconciliations.employer_special_economic_zone_code, ' . 
                    'special_economic_zones.name AS employer_special_economic_zone_name, ' . 
                    'tax_reconciliations.employer_diplomatic_indemnity, ' . 
                    'tax_reconciliations.employer_address_unit, ' . 
                    'tax_reconciliations.employer_address_complex, ' . 
                    'tax_reconciliations.employer_address_street_number, ' . 
                    'tax_reconciliations.employer_address_street_name, ' . 
                    'tax_reconciliations.employer_address_suburb, ' . 
                    'tax_reconciliations.employer_address_city, ' . 
                    'tax_reconciliations.employer_address_postal_code, ' . 
                    'tax_reconciliations.employer_address_country_code, ' . 
                    'countries.name AS employer_address_country_name, ' . 
                    'tax_reconciliations.employer_contact_person_first_name, ' . 
                    'tax_reconciliations.employer_contact_person_last_name, ' . 
                    'tax_reconciliations.employer_contact_person_position, ' . 
                    'tax_reconciliations.employer_contact_person_tel_number, ' . 
                    'tax_reconciliations.employer_contact_person_fax_number, ' . 
                    'tax_reconciliations.employer_contact_person_cell_number, ' . 
                    'tax_reconciliations.employer_contact_person_email_address, ' . 
                    'tax_reconciliations.note, ' . 
                    'tax_reconciliations.generated_on ' .
                'FROM ' .
                    'tax_reconciliations ' .
                'LEFT JOIN ' .
                    'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                'LEFT JOIN ' .
                    'sic_codes ON sic_codes.code = tax_reconciliations.employer_sic_code ' .
                'LEFT JOIN ' .
                    'eti_status_types ON eti_status_types.code = tax_reconciliations.employer_eti_status_code ' .
                'LEFT JOIN ' .
                    'special_economic_zones ON special_economic_zones.code = tax_reconciliations.employer_special_economic_zone_code ' .
                'LEFT JOIN ' .
                    'countries ON countries.code = tax_reconciliations.employer_address_country_code ' .
                'WHERE ' . 
                    'tax_reconciliations.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['reconciliationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the reconciliation details
            $sqlRow = $sqlResult->fetchAssociative();
            $reconciliation = [
                'id' => $sqlRow['id'],
                'sarsYear' => $sqlRow['sars_year'],
                'periodCode' => $sqlRow['period_code'],
                'periodName' => $sqlRow['period_name'],
                'note' => $sqlRow['note'],
                'generatedOn' => $sqlRow['generated_on'],
                'employer' => [
                    'name' => $sqlRow['employer_name'],
                    'payeNumber' => $sqlRow['employer_paye_number'],
                    'sdlNumber' => $sqlRow['employer_sdl_number'],
                    'uifNumber' => $sqlRow['employer_uif_number'],
                    'sicCode' => $sqlRow['employer_sic_code'],
                    'sicName' => $sqlRow['employer_sic_name'],
                    'etiStatusCode' => $sqlRow['employer_eti_status_code'],
                    'etiStatusName' => $sqlRow['employer_eti_status_name'],
                    'specialEconomicZoneCode' => $sqlRow['employer_special_economic_zone_code'],
                    'specialEconomicZoneName' => $sqlRow['employer_special_economic_zone_name'],
                    'diplomaticIndemnity' => $sqlRow['employer_diplomatic_indemnity'],
                    'address' => [
                        'unit' => $sqlRow['employer_address_unit'],
                        'complex' => $sqlRow['employer_address_complex'],
                        'streetNumber' => $sqlRow['employer_address_street_number'],
                        'streetName' => $sqlRow['employer_address_street_name'],
                        'suburb' => $sqlRow['employer_address_suburb'],
                        'city' => $sqlRow['employer_address_city'],
                        'postalCode' => $sqlRow['employer_address_postal_code'],
                        'countryCode' => $sqlRow['employer_address_country_code'],
                        'countryName' => $sqlRow['employer_address_country_name']
                    ]
                ],
                'contactPerson' => [
                    'firstName' => $sqlRow['employer_contact_person_first_name'],
                    'lastName' => $sqlRow['employer_contact_person_last_name'],
                    'position' => $sqlRow['employer_contact_person_position'],
                    'telNumber' => $sqlRow['employer_contact_person_tel_number'],
                    'faxNumber' => $sqlRow['employer_contact_person_fax_number'],
                    'cellNumber' => $sqlRow['employer_contact_person_cell_number'],
                    'emailAddress' => $sqlRow['employer_contact_person_email_address']
                ],
                'certificates' => null
            ];
            
            // Get a list of tax certificates for the reconciliation
            $sqlQuery =
                'SELECT ' .
                    'tax_certificates.id, ' .
                    'tax_certificates.tax_certificate_type_code AS type_code, ' .
                    'tax_certificate_types.name AS type_name, ' .
                    'tax_certificates.number, ' .
                    'tax_reconciliations.tax_reconciliation_period_code AS period_code, ' .
                    'tax_reconciliation_periods.name AS period_name, ' .
                    'tax_certificates.employee_id, ' .
                    'employees.alias AS employee_name, ' .
                    'employees.email_address AS employee_email_address, ' .
                    'tax_reconciliations.sars_year, ' .
                    'tax_reconciliations.generated_on ' .
                'FROM ' .
                    'tax_certificates ' .
                'LEFT JOIN ' .
                    'tax_certificate_types ON tax_certificate_types.code = tax_certificates.tax_certificate_type_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = tax_certificates.employee_id ' .
                'LEFT JOIN ' .
                    'tax_reconciliations ON tax_reconciliations.id = tax_certificates.tax_reconciliation_id ' .
                'LEFT JOIN ' .
                    'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                'WHERE ' .
                    'tax_certificates.tax_reconciliation_id = $1 ' . 
                'ORDER BY ' .
                    'sars_year ASC, ' . 
                    'tax_reconciliation_period_code ASC, ' . 
                    'employees.alias ASC;';
            $sqlResult = $db->paramQuery($sqlQuery,[$data['reconciliationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the array
            $certificates = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $certificates[] = [
                    'id' => $sqlRow['id'],
                    'number' => $sqlRow['number'],
                    'typeCode' => $sqlRow['type_code'],
                    'typeName' => $sqlRow['type_name'],
                    'employeeId' => $sqlRow['employee_id'],
                    'employeeName' => $sqlRow['employee_name'],
                    'employeeEmailAddress' => $sqlRow['employee_email_address'],
                    'taxYear' => $sqlRow['sars_year'],
                    'periodCode' => $sqlRow['period_code'],
                    'periodName' => $sqlRow['period_name'],
                    'generatedOn' => $sqlRow['generated_on']
                ];
            }
            $reconciliation['certificates'] = $certificates;
            
            // Send result
            echo( json_encode(['ok' => true, 'reconciliation' => $reconciliation]) );
            return true;
        }
        
        // Function to mark a tax reconciliation as deleted
        //
        // Required Parameters
        //  id                          The id of the tax reconciliation to remove
        //
        // Optional Parameters
        //  None
        // 
        public function remove($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE tax_certificates IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE tax_reconciliations IN ACCESS EXCLUSIVE MODE', []);
            
            // Mark the specified attenance as deleted
            $sqlQuery = 'UPDATE tax_reconciliations SET is_deleted = TRUE WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['id']         // tax_reconciliations.id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Mark the tax certificates as unavailable in th eslef-service portal
            $sqlQuery = 'UPDATE tax_certificates SET self_service_access = $1 WHERE tax_reconciliation_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                false,              // self_service_access
                $data['id']         // tax_reconciliation_id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to export the SARS reconciliation CSV file
        //
        // Required Parameters
        //  reconciliationId        The id of the reconciliation to export
        //  type                    The the type of reconciliation to export (TEST or LIVE)
        //
        // Optional Parameters
        //  None
        public function exportSars($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'reconciliationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $totalRecords = 0;
            $totalCodeValue = 0;
            $totalAmount = 0.00;
            $fileContents = [];
            
            
            // NOTE:
            //
            // We cannot use the SPOUT writer because SARS uses a non-standerd CSV format where certain 
            // values are to be enclosed with double quotes where neither SPOUT nor the built-in PHP csv 
            // functions would do so
            
            // Set the headers
            // $headers = [];
            
            // Initialize the writer
            // $writer = $this->writeReport(['format' => 'csv'], $data['taxYear'] . '_sars_reconciliation', $headers);
            
            // Get the employer details
            $sqlQuery =
                'SELECT ' . 
                    'tax_reconciliations.sars_year, ' . 
                    'tax_reconciliations.tax_reconciliation_period_code, ' . 
                    'tax_reconciliations.employer_name, ' . 
                    'tax_reconciliations.employer_paye_number, ' . 
                    'tax_reconciliations.employer_sdl_number, ' . 
                    'tax_reconciliations.employer_uif_number, ' . 
                    'tax_reconciliations.employer_sic_code, ' . 
                    'tax_reconciliations.employer_eti_status_code, ' . 
                    'tax_reconciliations.employer_special_economic_zone_code, ' . 
                    'tax_reconciliations.employer_diplomatic_indemnity, ' . 
                    'tax_reconciliations.employer_address_unit, ' . 
                    'tax_reconciliations.employer_address_complex, ' . 
                    'tax_reconciliations.employer_address_street_number, ' . 
                    'tax_reconciliations.employer_address_street_name, ' . 
                    'tax_reconciliations.employer_address_suburb, ' . 
                    'tax_reconciliations.employer_address_city, ' . 
                    'tax_reconciliations.employer_address_postal_code, ' . 
                    'employer_countries.alpha_2_code AS employer_address_country_code, ' . 
                    'tax_reconciliations.employer_contact_person_first_name, ' . 
                    'tax_reconciliations.employer_contact_person_last_name, ' . 
                    'tax_reconciliations.employer_contact_person_position, ' . 
                    'tax_reconciliations.employer_contact_person_tel_number, ' . 
                    'tax_reconciliations.employer_contact_person_fax_number, ' . 
                    'tax_reconciliations.employer_contact_person_cell_number, ' . 
                    'tax_reconciliations.employer_contact_person_email_address, ' . 
                    'tax_reconciliations.note, ' . 
                    'tax_reconciliations.generated_on ' . 
                'FROM ' . 
                    'tax_reconciliations '.
                'LEFT JOIN ' . 
                    'countries AS employer_countries ON employer_countries.code = tax_reconciliations.employer_address_country_code '.
                'WHERE ' . 
                    'tax_reconciliations.id = $1 ' .
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['reconciliationId']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Set the tax period details
            $taxYear = $sqlRow['sars_year'];
            $periodCode = $sqlRow['tax_reconciliation_period_code'];
            $reconciliationPeriodStartYear = $taxYear - 1;
            $reconciliationPeriodEndYear = $taxYear;
            $reconciliationPeriodStartDate = $reconciliationPeriodStartYear . '-03-01';
            $nextReconciliationPeriodStartDate = $reconciliationPeriodEndYear . '-03-01';
            
            // Is it an interim reconciliation certificate?
            if( $periodCode === 'INTE' ) {
                // Period is a maximum of 6 months
                $nextReconciliationPeriodStartDate = $reconciliationPeriodStartYear . '-09-01';
            }
            
            // Get that reconciliation period start and end date
            $reconciliationPeriodStartDate = new DateTime( $reconciliationPeriodStartDate );
            $reconciliationPeriodEndDate = new DateTime( $nextReconciliationPeriodStartDate );
            $reconciliationPeriodEndDate->sub(new DateInterval('P1D'));
            
            // Set the employer details
            $employerName = $this->formatSarsString($sqlRow['employer_name'], 90);
            $employerPayeNumber = substr(preg_replace('/[^0-9]+/', '', $sqlRow['employer_paye_number']), 0, 10);
            $employerSdlNumber = substr(preg_replace('/[^0-9L]+/', '', $sqlRow['employer_sdl_number']), 0, 10);
            $employerUifNumber = substr(preg_replace('/[^0-9U]+/', '', $sqlRow['employer_uif_number']), 0, 10);
            $employerContactPersonFirstName = $this->formatSarsString($sqlRow['employer_contact_person_first_name'], 50);
            $employerContactPersonSurname = $this->formatSarsString($sqlRow['employer_contact_person_last_name'], 50);
            $employerContactPersonPosition = $this->formatSarsString($sqlRow['employer_contact_person_position'], 50);;
            $employerContactPersonBusTel = str_replace('+27', '0', $sqlRow['employer_contact_person_tel_number']);
            $employerContactPersonBusTel = substr(preg_replace('/[^0-9]+/', '', $employerContactPersonBusTel), 0, 15);
            $employerContactPersonFaxNo = str_replace('+27', '0', $sqlRow['employer_contact_person_fax_number']);
            $employerContactPersonFaxNo = substr(preg_replace('/[^0-9]+/', '', $employerContactPersonFaxNo), 0, 15);
            $employerContactPersonCellNo = str_replace('+27', '0', $sqlRow['employer_contact_person_cell_number']);
            $employerContactPersonCellNo = substr(preg_replace('/[^0-9]+/', '', $employerContactPersonCellNo), 0, 15);
            $employerContactPersonEmailAddress = $this->formatSarsString($sqlRow['employer_contact_person_email_address'], 70);
            
            $periodOfReconciliation = $taxYear. '02';
            if( $periodCode === 'INTE' ) {
                $periodOfReconciliation = ($taxYear - 1) . '08';
            }
            
            $diplomaticIndemnity = '"N"';
            if( $sqlRow['employer_diplomatic_indemnity'] ) {
                $diplomaticIndemnity = '"Y"';
            }
            
            $employerAddressUnitNumber = $this->formatSarsString($sqlRow['employer_address_unit'], 8);
            $employerAddressComplex = $this->formatSarsString($sqlRow['employer_address_complex'], 26);
            $employerAddressStreetNumber = $this->formatSarsString($sqlRow['employer_address_street_number'], 8);
            $employerAddressStreetName = $this->formatSarsString($sqlRow['employer_address_street_name'], 26);
            $employerAddressSuburb = $this->formatSarsString($sqlRow['employer_address_suburb'], 33);
            $employerAddressCity = $this->formatSarsString($sqlRow['employer_address_city'], 21);
            $employerAddressPostalCode = substr(preg_replace('/[^0-9]+/', '', $sqlRow['employer_address_postal_code']), 0, 4);
            $employerAddressPostalCode = str_pad($employerAddressPostalCode, 4, '0', STR_PAD_LEFT);
            $employerAddressCountryCode = $this->formatSarsString($sqlRow['employer_address_country_code'], 2);
            
            // Write employer details
            $totalRecords = $totalRecords + 1;
            $rowContent = [
                '2010',
                $employerName,
                '2015',
                $data['type'], 
                '2020',
                $employerPayeNumber
            ];
            
            // Is the employer registered for SDL?
            if( strlen($employerSdlNumber) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2022',
                    $employerSdlNumber
                ]);
            }
            
            // Is the employer registered for UIF?
            $hasUifReferenceNumber = false;
            if( strlen($employerUifNumber) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2024',
                    $employerUifNumber
                ]);
                $hasUifReferenceNumber = true;
            }
            
            // Add employer contact person details
            $rowContent = array_merge($rowContent, [
                '2025', 
                $employerContactPersonFirstName,
                '2036', 
                $employerContactPersonSurname,
            ]);
            
            if( strlen($employerContactPersonPosition) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2038', 
                    $employerContactPersonPosition
                ]);
            }
            if( strlen($employerContactPersonPosition) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2038', 
                    $employerContactPersonPosition
                ]);
            }
            if( strlen($employerContactPersonBusTel) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2026', 
                    $employerContactPersonBusTel
                ]);
            }
            if( strlen($employerContactPersonFaxNo) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2039', 
                    $employerContactPersonFaxNo
                ]);
            }
            // Either the bussiness telephone number or cell number must be provided
            if( strlen($employerContactPersonBusTel) <= 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2040', 
                    $employerContactPersonCellNo
                ]);
            }
            else if( strlen($employerContactPersonCellNo) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2040', 
                    $employerContactPersonCellNo
                ]);
            }
            if( strlen($employerContactPersonEmailAddress) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2027', 
                    $employerContactPersonEmailAddress
                ]);
            }
            
            // Add payroll details
            $rowContent = array_merge($rowContent, [
                '2028',
                'Lexpro Systems (Pty) Ltd',
                '2029',
                'Lexpro Payroll',
            ]);
            
            // Add reconcilialtion period details
            $rowContent = array_merge($rowContent, [
                '2030',
                $taxYear,
                '2031',
                $periodOfReconciliation
            ]);
            
            // Add the SIC code 
            $rowContent = array_merge($rowContent, [
                '2082',
                $this->formatSarsString($sqlRow['employer_sic_code'], 5)
            ]);
            
            // Add the SEZ code (optional)
            if( $taxYear < '2020' ) {
                $rowContent = array_merge($rowContent, [
                    '2083',
                    $this->formatSarsString($sqlRow['employer_special_economic_zone_code'], 3)
                ]);
            }
            
            // Add the Employer Trade Classification (optional)
            if( $taxYear < '2021' ) {
                $rowContent = array_merge($rowContent, [
                    '2035',
                    $this->formatSarsString('', null)
                ]);
            }
            
            // Add the Diplomatic Indemnity Indicator
            $rowContent = array_merge($rowContent, [
                '2037',
                $diplomaticIndemnity
            ]);
            
            // Add the address details
            if( strlen($employerAddressUnitNumber) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2061',
                    $employerAddressUnitNumber
                ]);
            }
            if( strlen($employerAddressComplex) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2062',
                    $employerAddressComplex
                ]);
            }
            if( strlen($employerAddressStreetNumber) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2063',
                    $employerAddressStreetNumber
                ]);
            }
            $rowContent = array_merge($rowContent, [
                '2064',
                $employerAddressStreetName
            ]);
            if( strlen($employerAddressSuburb) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2065',
                    $employerAddressSuburb
                ]);
            }
            if( strlen($employerAddressSuburb) <= 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2066',
                    $employerAddressCity
                ]);
            }
            else if( strlen($employerAddressCity) > 0 ) {
                $rowContent = array_merge($rowContent, [
                    '2066',
                    $employerAddressCity
                ]);
            }
            $rowContent = array_merge($rowContent, [
                '2080',
                $employerAddressPostalCode
            ]);
            $rowContent = array_merge($rowContent, [
                '2081',
                $employerAddressCountryCode
            ]);
            
            // Finalize and add the row to the file contents
            $rowContent = array_merge($rowContent, ['9999']);
            // $writer->addRow($rowContent);
            $fileContents[] = $rowContent;
            
            // Get the tax certificate details for each employee
            $sqlQuery =
                'SELECT ' .
                    'tax_certificates.id, ' .
                    'tax_certificates.tax_reconciliation_id, ' .
                    'tax_certificates.tax_certificate_type_code, ' .
                    'tax_certificate_types.name AS tax_certificate_type_name, ' .
                    'tax_certificates.reason_for_non_deduction, ' .
                    'tax_certificates.number, ' .
                    'tax_certificates.pay_periods, ' .
                    'tax_certificates.pay_periods_worked, ' .
                    'tax_certificates.employee_id, ' .
                    'tax_certificates.employee_nature, ' .
                    'tax_certificates.employee_sic_code, ' .
                    'tax_certificates.employee_fixed_rate_income, ' .
                    'tax_certificates.employee_voluntary_over_deduction, ' .
                    'tax_certificates.employee_directive_1, ' .
                    'tax_certificates.employee_directive_1_issued_date, ' .
                    'tax_certificates.employee_directive_1_source_code, ' .
                    'tax_certificates.employee_directive_1_amount, ' .
                    'tax_certificates.employee_directive_2, ' .
                    'tax_certificates.employee_directive_2_issued_date, ' .
                    'tax_certificates.employee_directive_2_source_code, ' .
                    'tax_certificates.employee_directive_2_amount, ' .
                    'tax_certificates.employee_directive_3, ' .
                    'tax_certificates.employee_directive_3_issued_date, ' .
                    'tax_certificates.employee_directive_3_source_code, ' .
                    'tax_certificates.employee_directive_3_amount, ' .
                    'tax_certificates.employee_surname, ' .
                    'tax_certificates.employee_first_names, ' .
                    'tax_certificates.employee_initials, ' .
                    'tax_certificates.employee_id_number, ' .
                    'tax_certificates.employee_passport_number, ' .
                    'tax_certificates.employee_passport_country, ' .
                    'tax_certificates.employee_date_of_birth, ' .
                    'tax_certificates.employee_income_tax_number, ' .
                    'tax_certificates.employee_number, ' .
                    'tax_certificates.employee_employed_from, ' .
                    'tax_certificates.employee_employed_to, ' .
                    'tax_certificates.employee_work_address_unit, ' .
                    'tax_certificates.employee_work_address_complex, ' .
                    'tax_certificates.employee_work_address_street_number, ' .
                    'tax_certificates.employee_work_address_street_name, ' .
                    'tax_certificates.employee_work_address_suburb, ' .
                    'tax_certificates.employee_work_address_city, ' .
                    'tax_certificates.employee_work_address_postal_code, ' .
                    'work_address_countries.alpha_2_code AS employee_work_address_country_code, ' .
                    'tax_certificates.employee_residential_address_unit, ' .
                    'tax_certificates.employee_residential_address_complex, ' .
                    'tax_certificates.employee_residential_address_street_number, ' .
                    'tax_certificates.employee_residential_address_street_name, ' .
                    'tax_certificates.employee_residential_address_suburb, ' .
                    'tax_certificates.employee_residential_address_city, ' .
                    'tax_certificates.employee_residential_address_postal_code, ' .
                    'residential_address_countries.alpha_2_code AS employee_residential_address_country_code, ' .
                    'tax_certificates.employee_postal_address_line_1, ' .
                    'tax_certificates.employee_postal_address_line_2, ' .
                    'tax_certificates.employee_postal_address_line_3, ' .
                    'tax_certificates.employee_postal_address_line_4, ' .
                    'tax_certificates.employee_postal_address_code, ' .
                    'postal_address_countries.alpha_2_code AS employee_postal_address_country_code, ' .
                    'tax_certificates.employee_home_number, ' .
                    'tax_certificates.employee_work_number, ' .
                    'tax_certificates.employee_cell_number, ' .
                    'tax_certificates.employee_fax_number, ' .
                    'tax_certificates.employee_email_address, ' .
                    'tax_certificates.employee_financial_institution_code, ' .
                    'tax_certificates.employee_financial_institution_name, ' .
                    'tax_certificates.employee_bank_account_type_code, ' .
                    'tax_certificates.employee_account_number, ' .
                    'tax_certificates.employee_branch_code, ' .
                    'tax_certificates.total_income, ' .
                    'tax_certificates.total_taxable_income, ' .
                    'tax_certificates.total_non_taxable_income, ' .
                    'tax_certificates.total_retirement_income, ' .
                    'tax_certificates.total_non_retirement_income, ' .
                    'tax_certificates.total_deductions, ' .
                    'tax_certificates.total_paye_on_lump_sums, ' .
                    'tax_certificates.total_medical_scheme_credit, ' .
                    'tax_certificates.total_medical_expenses, ' .
                    'tax_certificates.total_standard_income_tax, ' .
                    'tax_certificates.total_paye, ' .
                    'tax_certificates.total_tax, ' .
                    'tax_certificates.total_uif, ' .
                    'tax_certificates.total_sdl ' .
                'FROM ' .
                    'tax_certificates ' .
                'LEFT JOIN ' . 
                    'tax_certificate_types ON tax_certificate_types.code = tax_certificates.tax_certificate_type_code '.
                'LEFT JOIN ' . 
                    'countries AS work_address_countries ON work_address_countries.code = tax_certificates.employee_work_address_country_code '.
                'LEFT JOIN ' . 
                    'countries AS residential_address_countries ON residential_address_countries.code = tax_certificates.employee_residential_address_country_code '.
                'LEFT JOIN ' . 
                    'countries AS postal_address_countries ON postal_address_countries.code = tax_certificates.employee_postal_address_country_code '.
                'WHERE ' . 
                    'tax_certificates.tax_reconciliation_id = $1 ' . 
                'ORDER BY ' . 
                    'tax_certificates.employee_surname ASC, tax_certificates.employee_first_names ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['reconciliationId']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the reconciliation details
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $hasMedicalSchemeItems = false;
                $medicalSchemeItemTotal = 0.00;
                
                // Write employee details
                $totalRecords = $totalRecords + 1;
                $rowContent = [
                    '3010',
                    $this->formatSarsString($sqlRow['number'], 30),
                    '3015',
                    $this->formatSarsString($sqlRow['tax_certificate_type_name'], 6),
                    '3020',
                    $this->formatSarsString($sqlRow['employee_nature'], 1),
                    '3025',
                    $taxYear
                ];
                
                // Conditional – The value must only be completed if the employer qualifies for ETI: 
                // Determine if the employer qualifies for ETI, by checking if all of the following 
                // conditions  are true: 
                // 
                //  o Type of certificate (code 3015) is IRP5 or IT3(a); 
                //  o Year of Assessment (code 3025) is 2014 or later; 
                //  o Period of reconciliation (code 2031) is 201402 or later; 
                //  o Employer SIC7 code (code 2082) is not listed in appendix D 
                // 
                // If the employer does not qualify for ETI, then this field MUST NOT be included in the 
                // import file. If the employer qualifies for ETI, then determine if the employee 
                // qualifies for ETI in  terms of the ETI Act for one or more months in the reconciliation 
                // period by checking if all of the following conditions are true: 
                //
                //  o Nature of person (code 3020) is A or C or R and Id number is valid; 
                //  o Nature of person (code 3020) is M and Alternate Identification Number is populated; 
                //  o ETI Employment date (code 3190) is on or after 01/10/2013 and Year of Assessment 
                //    (code 3025) is < 2021 and > 2022. Note: For the 2021 & 2022 YoA, the employment date
                //    is not validated to allow employer to claim ETI for employees as per the COVID-19 
                //    rules; 
                //  o Year of Assessment (code 3025) is equal to Transaction Year (code 2030);
                $employeeSicCode = $sqlRow['employee_sic_code'];
                $employeeQualifiesForEti = false;
                if( ( $employeeSicCode !== '84111' ) && 
                    ( $employeeSicCode !== '84112' ) && 
                    ( $employeeSicCode !== '84113' ) && 
                    ( $employeeSicCode !== '84121' ) && 
                    ( $employeeSicCode !== '84122' ) && 
                    ( $employeeSicCode !== '84123' ) && 
                    ( $employeeSicCode !== '84131' ) && 
                    ( $employeeSicCode !== '84132' ) && 
                    ( $employeeSicCode !== '84133' ) && 
                    ( $employeeSicCode !== '84140' ) && 
                    ( $employeeSicCode !== '84210' ) && 
                    ( $employeeSicCode !== '84220' ) && 
                    ( $employeeSicCode !== '84231' ) && 
                    ( $employeeSicCode !== '84232' ) && 
                    ( $employeeSicCode !== '84233' ) && 
                    ( $employeeSicCode !== '84300' ) ) {
                    
                    // Check if the employee qualifies for ETI
                    if( ( ( ( ($sqlRow['employee_nature'] === 'A')  || ($sqlRow['employee_nature'] === 'C')  || ($sqlRow['employee_nature'] === 'R') ) && (strlen($sqlRow['employee_id_number']) > 0) ) || 
                          ( ($sqlRow['employee_nature'] === 'M') && false ) ) && // Note: Code 3065 (i.e., alternative ID number) not implemented yet 
                        ( ( (str_replace('-', '', $sqlRow['employee_employed_from']) >= '20131001') && ( ($taxYear < '2021') || ($taxYear > '2022') ) ) || 
                          ( ($taxYear >= '2021') && ($taxYear <= '2022') ) ) && 
                        ( ($taxYear === $taxYear) ) ) { // Note: Different transaction year (2030) and tax year (3025) not implemneted yet 
                            // $employeeQualifiesForEti = true;
                    }
                    
                    if( $employeeQualifiesForEti ) {
                        $rowContent = array_merge($rowContent, [
                            '3026',     // ETI (Employment Tax Incentive) Indicator
                            '"Y"'
                        ]);
                    }
                    else {
                        $rowContent = array_merge($rowContent, [
                            '3026',     // ETI (Employment Tax Incentive) Indicator
                            '"N"'
                        ]);
                    }
                }
                
                // Add personal details
                $firstNames = trim($sqlRow['employee_first_names']);
                if( strpos($firstNames, ' ', strpos($firstNames, ' ', 0) + 1) !== false ) {
                    $firstNames = substr($firstNames, 0, strpos($firstNames, ' ', strpos($firstNames, ' ', 0) + 1));
                }
                $rowContent = array_merge($rowContent, [
                    '3030',
                    $this->formatSarsString($sqlRow['employee_surname'], 120),
                    '3040',
                    $this->formatSarsString($firstNames, 90),
                    '3050',
                    $this->formatSarsString(preg_replace('/[^a-zA-Z]/', '', $sqlRow['employee_initials']), 5)
                ]);
                
                // Add id number (required if passport number is not provided)
                if( strlen($sqlRow['employee_passport_number']) <= 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3060',
                        substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_id_number']), 0, 13)
                    ]);
                }
                else if( strlen($sqlRow['employee_id_number']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3060',
                        substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_id_number']), 0, 13)
                    ]);
                }
                
                // Add passport number (required if id number is not provided)
                if( strlen($sqlRow['employee_id_number']) <= 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3070',
                        $this->formatSarsString($sqlRow['employee_passport_number'], 18),
                        '3075',     // Country of Issue
                        $this->formatSarsString($sqlRow['employee_passport_country'], 3)
                    ]);
                }
                else if( strlen($sqlRow['employee_passport_number']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3070',
                        $this->formatSarsString($sqlRow['employee_passport_number'], 18),
                        '3075',     // Country of Issue
                        $this->formatSarsString($sqlRow['employee_passport_country'], 3)
                    ]);
                }
                
                // Alternate Identification Type (Must not be completed if Nature of Person is A / B / C / 
                // F / N or R. May be completed if Nature of Person is D / E / G / H. Must be completed if 
                // Nature of Person is M)
                if( false ) {
                    $rowContent = array_merge($rowContent, [
                        '3065',     // Alternate Identification Type
                        '',
                        '3066',     // Alternate Identification Number
                        ''
                    ]);
                }
                
                // Add date of birth (mandatory if Nature of Person is A / B / C / M / N / R)
                if( ($sqlRow['employee_nature'] == 'A') ||  
                    ($sqlRow['employee_nature'] == 'B') ||  
                    ($sqlRow['employee_nature'] == 'C') ||  
                    ($sqlRow['employee_nature'] == 'M') ||  
                    ($sqlRow['employee_nature'] == 'N') ||  
                    ($sqlRow['employee_nature'] == 'R') ) {
                    $rowContent = array_merge($rowContent, [
                        '3080',
                        str_replace('-', '', $sqlRow['employee_date_of_birth'])
                    ]);
                }
                
                // Add the income tax reference number
                if( ($sqlRow['employee_nature'] !== 'F') ) {
                    $rowContent = array_merge($rowContent, [
                        '3100',
                        substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_income_tax_number']), 0, 10)
                    ]);
                }
                
                // Add the employee SIC7 Code
                if( $sqlRow['employee_nature'] != 'N' ) {
                    $rowContent = array_merge($rowContent, [
                        '3263',     // Employee SIC7 Code
                        $this->formatSarsString($sqlRow['employee_sic_code'], 5)
                    ]);
                }
                
                // Add the SEZ code (optional)
                if( $taxYear < '2020' ) {
                    $rowContent = array_merge($rowContent, [
                        '3264',     // Employee SEZ Code
                        ''
                    ]);
                }
                
                // Add the employee contact details
                if( strlen($sqlRow['employee_email_address']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3125',     // Employee e-mail address
                        $this->formatSarsString($sqlRow['employee_email_address'], 70)
                    ]);
                }
                if( strlen($sqlRow['employee_home_number']) > 0 ) {
                    $value = str_replace('+27', '0', $sqlRow['employee_home_number']);
                    $value = preg_replace('/[^0-9]+/', '', $value);
                    $rowContent = array_merge($rowContent, [
                        '3135',     // Employee Home Tel No
                        $this->formatSarsString($value, 15)
                    ]);
                }
                if( $sqlRow['employee_nature'] != 'N' ) {
                    $value = str_replace('+27', '0', $sqlRow['employee_work_number']);
                    $value = preg_replace('/[^0-9]+/', '', $value);
                    $rowContent = array_merge($rowContent, [
                        '3136',     // Employee Bus Tel No
                        $this->formatSarsString($value, 15)
                    ]);
                }
                if( strlen($sqlRow['employee_fax_number']) > 0 ) {
                    $value = str_replace('+27', '0', $sqlRow['employee_fax_number']);
                    $value = preg_replace('/[^0-9]+/', '', $value);
                    $rowContent = array_merge($rowContent, [
                        '3137',     // Employee Fax No
                        $this->formatSarsString($value, 15)
                    ]);
                }
                if( strlen($sqlRow['employee_cell_number']) > 0 ) {
                    $value = str_replace('+27', '0', $sqlRow['employee_cell_number']);
                    $value = preg_replace('/[^0-9]+/', '', $value);
                    $rowContent = array_merge($rowContent, [
                        '3138',     // Employee Cell No
                        $this->formatSarsString($value, 15)
                    ]);
                }
                
                // Add employee physical work address details
                if( $sqlRow['employee_nature'] != 'N' ) {
                    if( strlen($sqlRow['employee_work_address_unit']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3144',     // Employee Physical Work Address Details -: Unit Number
                            $this->formatSarsString($sqlRow['employee_work_address_unit'], 8)
                        ]);
                    }
                    if( strlen($sqlRow['employee_work_address_complex']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3145',     // Employee Physical Work Address Details -: Complex
                            $this->formatSarsString($sqlRow['employee_work_address_complex'], 26)
                        ]);
                    }
                    if( strlen($sqlRow['employee_work_address_street_number']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3146',     // Employee Physical Work Address Details: Street Number
                            $this->formatSarsString($sqlRow['employee_work_address_street_number'], 8)
                        ]);
                    }
                    $rowContent = array_merge($rowContent, [
                        '3147',     // Employee Physical Work Address Details -: Street/Name of Farm
                        $this->formatSarsString($sqlRow['employee_work_address_street_name'], 26)
                    ]);
                    if( strlen($sqlRow['employee_work_address_city']) <= 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3148',     // Employee Physical Work Address Details -: Suburb/District
                            $this->formatSarsString($sqlRow['employee_work_address_suburb'], 33)
                        ]);
                    }
                    else if( strlen($sqlRow['employee_work_address_suburb']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3148',     // Employee Physical Work Address Details -: Suburb/District
                            $this->formatSarsString($sqlRow['employee_work_address_suburb'], 33)
                        ]);
                    }
                    if( strlen($sqlRow['employee_work_address_suburb']) <= 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3149',     // Employee Physical Work Address Details -: City/Town
                            $this->formatSarsString($sqlRow['employee_work_address_city'], 21)
                        ]);
                    }
                    else if( strlen($sqlRow['employee_work_address_city']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3149',     // Employee Physical Work Address Details -: City/Town
                            $this->formatSarsString($sqlRow['employee_work_address_city'], 21)
                        ]);
                    }
                    if( $sqlRow['employee_work_address_country_code'] === 'ZA' ) {
                        $value = preg_replace('/[^0-9]+/', '', $sqlRow['employee_work_address_postal_code']);
                        $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                        $rowContent = array_merge($rowContent, [
                            '3150',     // Employee Physical Work Address Details -: Postal Code
                            $this->formatSarsString($value, 10)
                        ]);
                    }
                    $rowContent = array_merge($rowContent, [
                        '3151',     // Employee Physical Work Address Details - : Country Code
                        $this->formatSarsString($sqlRow['employee_work_address_country_code'], 2)
                    ]);
                }
                
                // Add the employee number (Mandatory for Nature of Person B & N. Optional for Nature of 
                // Person A, C, D, E, F, G, H, M and R)
                $rowContent = array_merge($rowContent, [
                    '3160',
                    substr($sqlRow['employee_number'], 0, 25)
                ]);
                
                // Add the certifcate tax period start and end-date
                $rowContent = array_merge($rowContent, [
                    '3170',     // Certificate Tax Period Start Date
                    $reconciliationPeriodStartDate->format('Ymd'),
                    '3180',     // Certificate Tax Period End Date
                    $reconciliationPeriodEndDate->format('Ymd')
                ]);
                
                // Add the ETI employment date
                // o if ETI Indicator (code 3026) is Y, then this field is mandatory;
                // o if ETI indicator (code 3026) is N, then this field is optional;
                // o if ETI indicator (code 3026) is not completed, then this field must not be completed
                // * Must be in the format CCYYMMDD
                // * Cannot be later than “Certificate Tax Period Start Date” (code 3170).
                // * if the certificate type is ITREG this field must not be completed
                if( $employeeQualifiesForEti ) {
                    $etiEmploymentDate = $reconciliationPeriodStartDate->format('Ymd');
                    if( $sqlRow['employee_employed_from'] < $etiEmploymentDate ) {
                        $etiEmploymentDate =  $sqlRow['employee_employed_from'];
                    }
                    $rowContent = array_merge($rowContent, [
                        '3190',
                        str_replace('-', '', $etiEmploymentDate) // ETI Employment Date
                    ]);
                }
                
                // Add the voluntary over deduction only if IRP5
                $voluntaryOverDeduction = '"N"';
                if( $sqlRow['employee_voluntary_over_deduction'] === true ) {
                    $voluntaryOverDeduction = '"Y"';
                }
                if( $sqlRow['tax_certificate_type_code'] !== 'IT3A' ) {
                    $rowContent = array_merge($rowContent, [
                        '3195',
                        $voluntaryOverDeduction
                    ]);
                }
                
                // Add pay periods
                $rowContent = array_merge($rowContent, [
                    '3200',
                    $sqlRow['pay_periods'],
                    '3210',
                    $sqlRow['pay_periods_worked']
                ]);
                
                // Add the fixed rate income only if IRP5
                $fixedRateIncome = '"N"';
                if( $sqlRow['employee_fixed_rate_income'] === true ) {
                    $fixedRateIncome = '"Y"';
                }
                if( $sqlRow['tax_certificate_type_code'] !== 'IT3A' ) {
                    $rowContent = array_merge($rowContent, [
                        '3220',
                        $fixedRateIncome
                    ]);
                }
                
                // Add the employee residential address
                if( strlen($sqlRow['employee_residential_address_unit']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3211',     // Employee Address Details - Residential: Unit number
                        $this->formatSarsString($sqlRow['employee_residential_address_unit'], 8)
                    ]);
                }
                if( strlen($sqlRow['employee_residential_address_complex']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3212',     // Employee Address Details - Residential: Complex
                        $this->formatSarsString($sqlRow['employee_residential_address_complex'], 26)
                    ]);
                }
                if( strlen($sqlRow['employee_residential_address_street_number']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3213',     // Employee Address Details - Residential: Street Number
                        $this->formatSarsString($sqlRow['employee_residential_address_street_number'], 8)
                    ]);
                }
                $rowContent = array_merge($rowContent, [
                    '3214',     // Employee Address Details - Residential: Street/Name of Farm
                    $this->formatSarsString($sqlRow['employee_residential_address_street_name'], 26)
                ]);
                if( strlen($sqlRow['employee_residential_address_city']) <= 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3215',     // Employee Address Details - Residential: Suburb/District
                        $this->formatSarsString($sqlRow['employee_residential_address_suburb'], 33)
                    ]);
                }
                else if( strlen($sqlRow['employee_residential_address_suburb']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3215',     // Employee Address Details - Residential: Suburb/District
                        $this->formatSarsString($sqlRow['employee_residential_address_suburb'], 33)
                    ]);
                }
                if( strlen($sqlRow['employee_residential_address_suburb']) <= 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3216',     // Employee Address Details - Residential: City/Town
                        $this->formatSarsString($sqlRow['employee_residential_address_city'], 21)
                    ]);
                }
                else if( strlen($sqlRow['employee_residential_address_city']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3216',     // Employee Address Details - Residential: City/Town
                        $this->formatSarsString($sqlRow['employee_residential_address_city'], 21)
                    ]);
                }
                if( $sqlRow['employee_residential_address_country_code'] === 'ZA' ) {
                    $value = preg_replace('/[^0-9]+/', '', $sqlRow['employee_residential_address_postal_code']);
                    $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                    $rowContent = array_merge($rowContent, [
                        '3217',     // Employee Address Details - Residential: Postal Code
                        $this->formatSarsString($value, 10)
                    ]);
                }
                $rowContent = array_merge($rowContent, [
                    '3285',     // Employee Address Details - Residential: Country Code
                    $this->formatSarsString($sqlRow['employee_residential_address_country_code'], 2)
                ]);
                
                // Add the care of address indicator
                $rowContent = array_merge($rowContent, [
                    '3279',
                    '"N"'
                ]);
                
                // Add the care of intermediary
                if( '3279' === 'Y' ) {
                    $rowContent = array_merge($rowContent, [
                        '3283',
                        ''
                    ]);
                }
                
                // Add the postal Address Structure Indicator (Valid values:
                // - 1: Structured Physical Address (same as Residential Address)
                // - 2: Structured Postal Address
                // - 3: Structured Physical Address (not the same as Residential Address)
                // - 4: Unstructured 4 line Postal Address)
                $rowContent = array_merge($rowContent, [
                    '3288',
                    '4'
                ]);
                
                // $rowContent = array_merge($rowContent, [
                //     '3249',      // Employee Postal Address Details - PO Box or Private Bag indicator
                //     '',
                //     '3280',      // Employee Postal Address Details - Other PO Special Service (specify)
                //     '',
                //     '3262',      // Employee Postal Address Details - Number
                //     '',
                //     '3251',      // Employee Postal Address Details - Postal Agency or Sub-unit (if applicable) (e.g. Postnet Suite ID)
                //     '',
                //     '3253',      // Employee Postal Address Details - Post Office
                //     '',
                //     '3254',      // Employee Postal Address Details - Postal Code
                //     '',
                //     '3286',      // Employee Postal Address Details - Country Code
                //     '',
                //     '3255',      // Employee Postal Address Details : Unit number
                //     '',
                //     '3256',      // Employee Postal Address Details Complex
                //     '',
                //     '3257',      // Employee Postal Address Details Street Number
                //     '',
                //     '3258',      // Employee Postal Address Details: Street/Name of Farm
                //     '',
                //     '3259',      // Employee Postal Address Details Suburb/District
                //     '',
                //     '3260',      // Employee Postal Address Details City/Town
                //     '',
                //     '3261',      // Employee Postal Address Details Postal Code
                //     '',
                //     '3287',      // Employee Postal Address Details Country Code
                //     '',
                // ]);
                
                // Add the address details (non-structured)
                $rowContent = array_merge($rowContent, [
                    '3289',
                    $this->formatSarsString($sqlRow['employee_postal_address_line_1'], 35)
                ]);
                if( strlen($sqlRow['employee_postal_address_line_2']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3290',
                        $this->formatSarsString($sqlRow['employee_postal_address_line_2'], 35)
                    ]);
                }
                if( strlen($sqlRow['employee_postal_address_line_3']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3291',
                        $this->formatSarsString($sqlRow['employee_postal_address_line_3'], 35)
                    ]);
                }
                if( strlen($sqlRow['employee_postal_address_line_4']) > 0 ) {
                    $rowContent = array_merge($rowContent, [
                        '3292',
                        $this->formatSarsString($sqlRow['employee_postal_address_line_4'], 35)
                    ]);
                }
                if( $sqlRow['employee_nature'] != 'N' ) {
                    if( $sqlRow['employee_postal_address_country_code'] === 'ZA' ) {
                        $value = preg_replace('/[^0-9]+/', '', $sqlRow['employee_postal_address_code']);
                        $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                            $rowContent = array_merge($rowContent, [
                            '3293',     // Employee Postal Address Details: Postal Code
                            $this->formatSarsString($value, 10)
                        ]);
                    }
                    $rowContent = array_merge($rowContent, [
                        '3294',     // Employee Postal Address Details: Country Code
                        $this->formatSarsString($sqlRow['employee_postal_address_country_code'], 2)
                    ]);
                }
                
                // Only add lump sum directives
                // if( $sqlRow['employee_fixed_rate_income'] !== true ) {
                    // Are there directive numbers to be added?
                    if( strlen($sqlRow['employee_directive_1']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3230',     // Directive number
                            $this->formatSarsString(str_pad($sqlRow['employee_directive_1'], 15, '0', STR_PAD_LEFT), 15)
                        ]);
                        // If tax year >= 2022
                        if( $taxYear >= '2022' ) {
                            // If any of the details were completedm all of the details are required
                            if( ($sqlRow['employee_directive_1_issued_date'] != null ) ||
                                (strlen($sqlRow['employee_directive_1_source_code']) > 0 ) || 
                                ($sqlRow['employee_directive_1_amount'] != null ) ) {
                                $rowContent = array_merge($rowContent, [
                                    '3231',     // Directive Issued Date
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_1_issued_date']), 0, 8)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3232',     // Directive Income Source code
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_1_source_code']), 0, 4)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3233',     // Directive Income Amount
                                    number_format(floor($sqlRow['employee_directive_1_amount']), 0, '', '')
                                ]);
                            }
                        }
                    }
                    
                    if( strlen($sqlRow['employee_directive_2']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3230',     // Directive number
                            $this->formatSarsString(str_pad($sqlRow['employee_directive_2'], 15, '0', STR_PAD_LEFT), 15)
                        ]);
                        // If tax year >= 2022
                        if( $taxYear >= '2022' ) {
                            // If any of the details were completedm all of the details are required
                            if( ($sqlRow['employee_directive_2_issued_date'] != null ) ||
                                (strlen($sqlRow['employee_directive_2_source_code']) > 0 ) || 
                                ($sqlRow['employee_directive_2_amount'] != null ) ) {
                                $rowContent = array_merge($rowContent, [
                                    '3231',     // Directive Issued Date
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_2_issued_date']), 0, 8)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3232',     // Directive Income Source code
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_2_source_code']), 0, 4)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3233',     // Directive Income Amount
                                    number_format(floor($sqlRow['employee_directive_2_amount']), 0, '', '')
                                ]);
                            }
                        }
                    }
                    
                    if( strlen($sqlRow['employee_directive_3']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3230',     // Directive number
                            $this->formatSarsString(str_pad($sqlRow['employee_directive_3'], 15, '0', STR_PAD_LEFT), 15)
                        ]);
                        // If tax year >= 2022
                        if( $taxYear >= '2022' ) {
                            // If any of the details were completedm all of the details are required
                            if( ($sqlRow['employee_directive_3_issued_date'] != null ) ||
                                (strlen($sqlRow['employee_directive_3_source_code']) > 0 ) || 
                                ($sqlRow['employee_directive_3_amount'] != null ) ) {
                                $rowContent = array_merge($rowContent, [
                                    '3231',     // Directive Issued Date
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_3_issued_date']), 0, 8)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3232',     // Directive Income Source code
                                    substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_directive_3_source_code']), 0, 4)
                                ]);
                                $rowContent = array_merge($rowContent, [
                                    '3233',     // Directive Income Amount
                                    number_format(floor($sqlRow['employee_directive_3_amount']), 0, '', '')
                                ]);
                            }
                        }
                    }
                // }
                
                // Directive codes 3231, 3232, 3233 not implemented yet:
                //
                // 3231 [N8]
                // Directive Issued Date: The date the directive was issued by SARS 
                // Conditional: 
                //  o If Directive Number is completed, then Directive issued date is mandatory; 
                //  o If Directive Number is not completed, the Directive issued date must not be completed; 
                // Must consists of 8 numeric characters; Format: CCYYMMDD 
                // Only applicable from Transaction Year >= 2022 
                
                // 3232 [N4]
                // Directive Income Source Code: The specific income source code indicated on the directive issued 
                // Conditional: 
                //  o If Directive Number is completed, then Directive Income Source Code is mandatory; 
                //  o If Directive Number is not completed, the Directive Income Source Code must not be completed; 
                // The Directive Income Source code can only be one of the following source codes: 
                //  o 3608/3658, 3614/3664, 
                //  o 3901/3951, 3902/3952, 3903/3953, 3904/3954, 3905/3955, 3907/3957, 3908, 3909, 3915, 3920, 3921, 3922, 3923, 3924 
                //  o 3707/3757, 3718/3768, 3719/3769, 3720/3770, 3721/3771, 3723/3773 
                // The Directive Income Source code must be listed as an Income Source Code; 
                // Only applicable from Transaction Year >= 2022
                
                // 3233 [N15]
                // Directive Income Amount: The value of the lump sum or taxable benefit as per the directive issued 
                // Conditional: 
                //  o If Directive Number is completed, then Directive Income amount is mandatory; 
                //  o If Directive Number is not completed, the Directive Income amount must not be completed; 
                // Only applicable from Transaction Year >= 2022
                
                // The following bank account type options must be used:
                // 0 = Not Paid by electronic bank transfer
                // 1 = Cheque/Current Account
                // 2 = Savings Account
                // 3 = Transmission Account
                // 4 = Bond Account
                // 5 = Credit Card Account
                // 6 = Subscription Share Account
                // 7 = Foreign Bank Account
                $bankAccountType = '0';
                if( $sqlRow['employee_bank_account_type_code'] === 'CACC' ) {
                    $bankAccountType = '1';
                }
                else if( $sqlRow['employee_bank_account_type_code'] === 'SACC' ) {
                    $bankAccountType = '2';
                }
                $rowContent = array_merge($rowContent, [
                    '3240',     // Employee Bank Account Type
                    $bankAccountType
                ]);
                if( ($bankAccountType !== '0') && ($bankAccountType !== '7') ) {
                    $rowContent = array_merge($rowContent, [
                        '3241',     // Employee Bank Account Number
                        substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_account_number']), 0, 16),
                        '3242',     // Employee Bank Branch Number
                        substr(preg_replace('/[^0-9]+/', '', $sqlRow['employee_branch_code']), 0, 6)
                    ]);
                    if( strlen($sqlRow['employee_financial_institution_name']) > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3243',     // Employee Bank Name
                            $this->formatSarsString($sqlRow['employee_financial_institution_name'], 50)
                        ]);
                    }
                    if( strlen('') > 0 ) {
                        $rowContent = array_merge($rowContent, [
                            '3244',     // Employee Bank Branch Name
                            ''
                        ]);
                    }
                    // Mandatory if the value for code 3240 is not “0” or “7”. The Code and the value must not be completed if code 3240 is “0” or “7”
                    $rowContent = array_merge($rowContent, [
                        '3245',     // Employee Account Holder Name
                        $this->formatSarsString($sqlRow['employee_first_names'] . ' ' . $sqlRow['employee_surname'], 49),
                        '3246',     // Employee Account Holder Relationship (The values for this field must only be: 1. Own 2. Joint 3. Third Party)
                        '1'
                    ]);
                }
                
                // Get the tax_certificate items
                $sqlItemQuery =
                    'SELECT ' .
                        'tax_certificate_items.sars_code, ' .
                        'sars_codes.description, ' .
                        'sars_codes.profit_loss, ' .
                        'tax_certificate_items.clearance_number, ' .
                        'tax_certificate_items.retirement_fund, ' .
                        'tax_certificate_items.amount ' .
                    'FROM ' .
                        'tax_certificate_items ' .
                    'LEFT JOIN ' .
                        'sars_codes ON sars_codes.code = tax_certificate_items.sars_code ' .
                    'WHERE ' .
                        'tax_certificate_items.tax_certificate_id = $1 ' .
                    'ORDER BY ' .
                        'tax_certificate_items.sars_code ASC;';
                $sqlItemResult = $db->paramQuery($sqlItemQuery, [$sqlRow['id']]);
                if( !$sqlItemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Create employees array
                $incomeItems = [];
                $deductionItems = [];
                while( $sqlItemRow = $sqlItemResult->fetchAssociative() ) {
                    // if IT3(a) is indicated, code 4150 must have a value and codes 4101, 4102 and 4115 must 
                    // not be included. if IT3(a) is indicated, code 4150 must have a value and codes 4101, 
                    // 4102 and 4115 must not be included
                    // if( $sqlItemRow['sars_code'] === '4150' ) {
                    //     $certificateType = '"IT3(a)"';
                    // }
                    
                    // Remove the Afrikaans part of the description
                    $description = strtoupper($sqlItemRow['description']);
                    if( strpos($description, '/') !== false ) {
                        $description = substr($description, 0, strpos($description, '/'));
                    }
                    
                    // Is it an income item?
                    if( $sqlItemRow['profit_loss'] === 'P' ) {
                        $incomeItems[] = [
                            'code' => $sqlItemRow['sars_code'], 
                            'description' => $description, 
                            'rfIndicator' => '',
                            'amount' => number_format($sqlItemRow['amount'], 2, '.', '')
                        ];
                    }
                    else {
                        $deductionItems[] = [
                            'code' => $sqlItemRow['sars_code'], 
                            'description' => strtoupper($sqlItemRow['description']), 
                            'clearanceNumber' => '',
                            'amount' => number_format($sqlItemRow['amount'], 2, '.', '')
                        ];
                    }
                }
                $sqlRow['incomeItems'] = $incomeItems;
                $sqlRow['deductionItems'] = $deductionItems;
                
                // Add income items (maximum of 20)
                // $incomeCount = 0;
                foreach( $sqlRow['incomeItems'] as $incomeItem ) {
                    // Is it a medical scheme item?
                    if( $incomeItem['code'] === '3810' ) {
                        $hasMedicalSchemeItems = true;
                    }
                    
                    // Set and format the amount 
                    $amount = number_format(floor($incomeItem['amount']), 0, '', '');
                    
                    $rowContent = array_merge($rowContent, [
                        $incomeItem['code'],
                        $amount
                    ]);
                    
                    // NOTE: This hould be checked when generating reconciliations
                    //
                    // Another income item was added
                    // $incomeCount = $incomeCount + 1;
                    // if( $incomeCount > 20 ) {
                    //     return false;
                    // }
                }
                
                // Is there non-taxable income to add?
                if( doubleval($sqlRow['total_non_taxable_income']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '3696',
                        number_format(floor($sqlRow['total_non_taxable_income']), 0, '', '')
                    ]);
                }
                
                // Is there retirment income to add?
                if( doubleval($sqlRow['total_retirement_income']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '3697',
                        number_format(floor($sqlRow['total_retirement_income']), 0, '', '')
                    ]);
                }
                
                // Is there non-retirment income to add?
                if( doubleval($sqlRow['total_non_retirement_income']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '3698',
                        number_format(floor($sqlRow['total_non_retirement_income']), 0, '', '')
                    ]);
                }
                
                // Is there income to add?
                if( doubleval($sqlRow['total_taxable_income']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '3699',
                        number_format(floor($sqlRow['total_taxable_income']), 0, '', '')
                    ]);
                }
                
                // Add deduction items (maximum of 12)
                // $deductionCount = 0;
                $totalDeductions = 0.00;
                foreach( $sqlRow['deductionItems'] as $deductionItem ) {
                    // Is it a medical scheme item?
                    if( $deductionItem['code'] === '4005' ) {
                        $hasMedicalSchemeItems = true;
                    }
                    
                    // Set and format the amount (remove cents)
                    $amount = number_format(floor($deductionItem['amount']), 0, '', '');
                    
                    // Add the deduction item
                    $rowContent = array_merge($rowContent, [
                        $deductionItem['code'],
                        $amount
                    ]);
                    
                    // Add to total deductions (if applicable)
                    if( (substr($deductionItem['code'], 0, 2) == '40') ||
                        (substr($deductionItem['code'], 0, 2) == '44') ||
                        (substr($deductionItem['code'], 0, 2) == '45') ) {
                        $totalDeductions = $totalDeductions + doubleval($deductionItem['amount']);
                    }
                    
                    // NOTE: This hould be checked when generating reconciliations
                    //
                    // Another deduction item was added
                    // $deductionCount = $deductionCount + 1;
                    // if( $deductionCount > 12 ) {
                    //     return false;
                    // }
                }
                
                // Are there deductions to add?
                if( $totalDeductions > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4497',
                        number_format(floor($totalDeductions), 0, '', '')
                    ]);
                }
                
                // Is there SITE to add?
                $totalTax = 0.00;
                if( doubleval($sqlRow['total_standard_income_tax']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4101',
                        $sqlRow['total_standard_income_tax']
                    ]);
                    $totalTax = $totalTax + doubleval($sqlRow['total_standard_income_tax']);
                }
                
                // Is there PAYE to add?
                if( doubleval($sqlRow['total_paye']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4102',
                        $sqlRow['total_paye']
                    ]);
                    $totalTax = $totalTax + doubleval($sqlRow['total_paye']);
                }
                
                // Is there PAYE on retirement lump sum and severance benefits to add?
                if( doubleval($sqlRow['total_paye_on_lump_sums']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4115',
                        $sqlRow['total_paye_on_lump_sums']
                    ]);
                    $totalTax = $totalTax + doubleval($sqlRow['total_paye_on_lump_sums']);
                }
                
                // Is there UIF to add?
                if( (doubleval($sqlRow['total_uif']) > 0.009) || $hasUifReferenceNumber ) {
                    $uifAmount = '0.00';
                    if( $sqlRow['total_uif'] !== null ) {
                        $uifAmount = $sqlRow['total_uif'];
                    }
                    $rowContent = array_merge($rowContent, [
                        '4141',
                        $uifAmount
                    ]);
                    $totalTax = $totalTax + doubleval($uifAmount);
                }
                
                // Is there SDL to add?
                if( doubleval($sqlRow['total_sdl']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4142',
                        $sqlRow['total_sdl']
                    ]);
                    $totalTax = $totalTax + doubleval($sqlRow['total_sdl']);
                }
                
                // Is there tax to add?
                if( doubleval($totalTax) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4149',
                        number_format($totalTax, 2, '.', '')
                    ]);
                }
                
                // Is there medical scheme fees tax credit to add?
                if( (doubleval($sqlRow['total_medical_scheme_credit']) > 0.009) || $hasMedicalSchemeItems ) {
                    $rowContent = array_merge($rowContent, [
                        '4116',
                        number_format($sqlRow['total_medical_scheme_credit'], 2, '.', '')
                    ]);
                }
                
                // Is there additional medical expenses tax credit credit to add?
                if( doubleval($sqlRow['total_medical_expenses']) > 0.009 ) {
                    $rowContent = array_merge($rowContent, [
                        '4120',
                        $sqlRow['total_medical_expenses']
                    ]);
                }
                
                // Is there Employment Tax Incentive (ETI) to add?
                if( $employeeQualifiesForEti ) {
                    $rowContent = array_merge($rowContent, [
                        '4118',
                        '0.00'
                    ]);
                }
                
                // Is it an IT3(a) certificate?
                if( $sqlRow['tax_certificate_type_code'] === 'IT3A' ) {
                    // Add eeason code for IT3(a) (reason for non-deduction of tax)
                    $rowContent = array_merge($rowContent, [
                        '4150',
                        $sqlRow['reason_for_non_deduction']
                    ]);
                }
                
                // Add ETI Employment Tax Incentive Information, if any
                // ... 
                
                // Add the employee details to the CSV file
                $rowContent = array_merge($rowContent, ['9999']);
                // $writer->addRow($rowContent);
                $fileContents[] = $rowContent;
            }
            
            // Add the total records
            if( $totalRecords > 0 ) {
                $rowContent = [
                    '6010',
                    $totalRecords
                ];
            }
            
            // Add the code total (optional)
            if( $totalCodeValue > 0 ) {
                $rowContent = [
                    '6020',
                    $totalCodeValue
                ];
            }
            
            // Add the total amount (optional)
            if( $totalAmount > 0.009 ) {
                $rowContent = [
                    '6030',
                    number_format($totalAmount, 2, '.', '')
                ];
            }
            
            // Add the employer trailer to the CSV file
            $rowContent = array_merge($rowContent, ['9999']);
            // $writer->addRow($rowContent);
            $fileContents[] = $rowContent;
            
            // Close the writer
            // $writer->close();
            
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
                header('Content-Disposition: attachment; filename=' . $taxYear . '_sars_reconciliation.csv');
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
        
        // Function to run employees details report
        //
        // Required Parameters
        //  exceptions               An array containing the exceptions to export
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  none
        public function exportExceptions($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'exceptions' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'isCritical' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                        'source' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'fullDescription' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "SOURCE",
                "CRITICAL",
                "DESCRIPTION",
                "NOTES"
            ];
            
            $writer = $this->writeReport($data, 'reconciliation_exceptions_' . date('Y-m-d'), $headers);
            
            // For each exception
            foreach( $data['exceptions'] AS $exception ) {
                $isCritical = 'No';
                if( $exception['isCritical'] ) {
                    $isCritical = 'Yes';
                }
                
                // Add the data
                $content = [
                    $exception['source'],
                    $isCritical,
                    $exception['description'],
                    $exception['fullDescription']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
            return true;
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // Function to generate a list of exceptions (if any) for a tax reconciliation for a given tax year 
        // and period
        //
        // Required Parameters
        //  taxYear             The tax year of the reconciliation certifcate details
        //  periodCode          Annual (ANNU) or interim (INTE)
        //
        // Optional Parameters
        //  None
        //
        // Returns
        //  [
        //      'isCritical',               // Whether the exception is critical
        //      'source',                   // The source of the exception (employer, employee, etc.)
        //      'value',                    // The value that caused the exception
        //      'newValue',                 // The new value if a value will be changed
        //      'description'               // A description of the exception
        //      'fullDescription'           // A full description for the exception
        //  ]
        private function generateExceptions($db, $taxYear, $periodCode) {
            $exceptions = [];
            $today = new DateTime( date("Y-m-d") );
            $reconciliationStartYear = $taxYear - 1;
            $reconciliationEndYear = $taxYear;
            $reconciliationStartDate = $reconciliationStartYear . '-03-01';
            $nextReconciliationStartDate = $reconciliationEndYear . '-03-01';
            $reconciliationEndMonth = 2;
            
            // Is it an interim reconciliation certificate?
            if( $periodCode === 'INTE' ) {
                // Period is a maximum of 6 months
                $nextReconciliationStartDate = $reconciliationStartYear . '-09-01';
                $reconciliationEndYear = $reconciliationStartYear;
                $reconciliationEndMonth = 8;
            }
            
            // Get that reconciliation period end date
            $reconciliationEndDate = new DateTime( $nextReconciliationStartDate );
            $reconciliationEndDate->sub(new DateInterval('P1D'));
            
            // Is it not yet time for the SARS reconcilliation to be exported?
            if( $today->format('Y-m-d') <= $reconciliationEndDate->format('Y-m-d') ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Reconciliation',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Reconciliation period not completed',
                    'fullDescription' => 
                        'To ensure that all the payruns for the reconciliation period have been processed, ' . 
                        'the reconciliation should only be generated after the reconciliation period ' . 
                        'end date on ' . $reconciliationEndDate->format('Y-m-d') . '.'
                ];
            }
            
            // Get the required employer details
            $sqlQuery =
                'SELECT ' . 
                    'company_details.name, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.sars_contact_first_name, ' .
                    'company_details.sars_contact_last_name, ' .
                    'company_details.sars_contact_business_number, ' .
                    'company_details.sars_contact_cell_number, ' .
                    'company_details.sars_contact_email_address ' .
                'FROM ' . 
                    'company_details '.
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            $sqlEmployerRow = $sqlResult->fetchAssociative();
            
            // Check the employer name
            $value = trim($sqlEmployerRow['name']);
            if( ($sqlEmployerRow['name'] === null) || (strlen($value) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer name specified',
                    'fullDescription' => 
                        'The name or trading name of employer issuing the certificate is mandatory.'
                ];
            }
            else if( strlen($value) > 90 ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Employer name is too long',
                    'fullDescription' => 
                        'The employer name cannot be longer than 90 characters and will be truncated ' . 
                        'to \'' . substr($value, 0, 90) . '\''
                ];
            }
            
            // Check the employer PAYE reference number
            $value = preg_replace('/[^0-9]+/', '', $sqlEmployerRow['paye_reference_number']);
            if( ($sqlEmployerRow['paye_reference_number'] === null) || (strlen($value) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer PAYE reference number',
                    'fullDescription' => 
                        'The employer PAYE reference number is mandatory.'
                ];
            }
            else if( (strlen($value) !== 10) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Invalid employer PAYE reference number',
                    'fullDescription' => 
                        '\'' . $sqlEmployerRow['paye_reference_number'] . '\' is not a valid PAYE reference number. The PAYE reference number must consist of 10 numeric characters.'
                ];
            }
            
            // Check the employer SDL reference number
            $value = preg_replace('/[^0-9L]+/', '', $sqlEmployerRow['sdl_payment_reference_number']);
            if( ($sqlEmployerRow['sdl_payment_reference_number'] === null) || (strlen($sqlEmployerRow['sdl_payment_reference_number']) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer SDL reference number',
                    'fullDescription' => 
                        'The SDL reference number is mandatory if the employer registered for SDL.'
                ];
            }
            else if( (strlen($value) !== 10) || (substr($value, 0, 1) !== 'L') ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Invalid employer SDL reference number',
                    'fullDescription' => 
                        '\'' . $sqlEmployerRow['sdl_payment_reference_number'] . '\' is not a valid SDL reference number. The SDL reference number must consist of 1 ' . 
                        'alpha and 9 numerical characters and must start with an "L".'
                ];
            }
            
            // Check the employer UIF reference number
            $value = preg_replace('/[^0-9U]+/', '', $sqlEmployerRow['uif_payment_reference_number']);
            if( ($sqlEmployerRow['uif_payment_reference_number'] === null) || (strlen($sqlEmployerRow['uif_payment_reference_number']) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer UIF reference number',
                    'fullDescription' => 
                        'The UIF reference number is mandatory if the employer registered for UIF.'
                ];
            }
            else if( (strlen($value) !== 10) || (substr($value, 0, 1) !== 'U') ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Invalid employer UIF reference number',
                    'fullDescription' => 
                        '\'' . $sqlEmployerRow['uif_payment_reference_number'] . '\' is not a valid UIF reference number. The UIF reference number must consist of 1 ' . 
                        'alpha and 9 numerical characters and must start with a "U".'
                ];
            }
            
            // Check the SARS contact person first name
            $value = trim($sqlEmployerRow['sars_contact_first_name']);
            if( ($sqlEmployerRow['sars_contact_first_name'] === null) || (strlen($value) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No SARS contact person first name',
                    'fullDescription' => 
                        'The first name of the the contact person for all reconciliation related queries is mandatory.'
                ];
            }
            else if( strlen($value) > 30 ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'SARS contact person first name is too long',
                    'fullDescription' => 
                        'The SARS contact person first name cannot be longer than 30 characters and will be truncated ' . 
                        'to \'' . substr($value, 0, 30) . '\''
                ];
            }
            
            // Check the SARS contact person surname
            $value = trim($sqlEmployerRow['sars_contact_last_name']);
            if( ($sqlEmployerRow['sars_contact_last_name'] === null) || (strlen($value) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No SARS contact person surname',
                    'fullDescription' => 
                        'The surname of the the contact person for all reconciliation related queries is mandatory.'
                ];
            }
            else if( strlen($value) > 30 ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => false,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'SARS contact person surname is too long',
                    'fullDescription' => 
                        'The SARS contact person surname cannot be longer than 30 characters and will be truncated ' . 
                        'to \'' . substr($value, 0, 30) . '\''
                ];
            }
            
            // Check if neither the contact business or cell number is completed
            if( (($sqlEmployerRow['sars_contact_business_number'] === null) || (strlen(trim($sqlEmployerRow['sars_contact_business_number'])) <= 0 )) &&
                (($sqlEmployerRow['sars_contact_cell_number'] === null) || (strlen(trim($sqlEmployerRow['sars_contact_cell_number'])) <= 0 ))) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No SARS contact person number',
                    'fullDescription' => 
                        'Either the SARS contact person business or cell number must be provided.'
                ];
            }
            
            // Check the SARS contact person business number, if any
            $value = str_replace('+27', '0', $sqlEmployerRow['sars_contact_business_number']);
            $value = preg_replace('/[^0-9]+/', '', $value);
            if( ($sqlEmployerRow['sars_contact_business_number'] !== null) && (strlen($value) > 0 ) ) {
                if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid SARS contact person business number',
                        'fullDescription' => 
                            '\'' . $sqlEmployerRow['sars_contact_business_number'] . '\' is not a valid value for the SARS contact person business number. ' . 
                            'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                    ];
                }
            }
            
            // Check the SARS contact person cell number, if any
            $value = str_replace('+27', '0', $sqlEmployerRow['sars_contact_cell_number']);
            $value = preg_replace('/[^0-9]+/', '', $value);
            if( ($sqlEmployerRow['sars_contact_cell_number'] !== null) && (strlen($value) > 0 ) ) {
                if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid SARS contact person cell number',
                        'fullDescription' => 
                            '\'' . $sqlEmployerRow['sars_contact_cell_number'] . '\' is not a valid value for the SARS contact person cell number. ' . 
                            'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                    ];
                }
            }
            
            // Check the SARS contact person email address, if any
            $value = trim($sqlEmployerRow['sars_contact_email_address']);
            if( ($sqlEmployerRow['sars_contact_email_address'] !== null) && (strlen($value) > 0 ) ) {
                $isValid = true;
                
                // Check for characters that are not allowed
                $moreInfo = ' It also may not contain any of the following characters: (, ), \\, “, |, or %.';
                if( strpos($value, '(') !== false ) {
                    $isValid = false;
                }
                else if( strpos($value, ')') !== false ) {
                    $isValid = false;
                }
                else if( strpos($value, '\\') !== false ) {
                    $isValid = false;
                }
                else if( strpos($value, '“') !== false ) {
                    $isValid = false;
                }
                else if( strpos($value, '|') !== false ) {
                    $isValid = false;
                }
                else if( strpos($value, '%') !== false ) {
                    $isValid = false;
                }
                else {
                    $moreInfo = '';
                }
                
                // Check that the first and last character are alpha-numeric
                if( !ctype_alnum(substr($value, 0, 1)) || !ctype_alnum(substr($value, -1)) ) {
                    $moreInfo = ' The first and last character MUST NOT be a special character.';
                    $isValid = false;
                }
                
                // Check that there is only one '@' character
                if( strpos($value, '@', 0) === false ) {
                    $isValid = false;
                }
                else if( strpos($value, '@', strpos($value, '@', 0) + 1) !== false ) {
                    $isValid = false;
                }
                
                // Check that there is a domain after the '@' character
                if( $isValid ) {
                    if( (strpos($value, '.', 0) === false) || (strpos($value, '.', strpos($value, '@', 0) + 1) === false) ) {
                        $isValid = false;
                    }
                }
                
                if( (strlen($value) > 70) || !$isValid ) {
                    // Break the long string into smaller parts for display
                    $value = str_split($value, 40);
                    $value = implode("<br>", $value);
                    
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid SARS contact person email address',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the SARS contact person email address. ' . 
                            'The value must contain only one \'@\' character followed by a value and a domain ' . 
                            'starting with a \'.\' character and cannot be more than 70 characters long.' . 
                            $moreInfo
                    ];
                }
            }
            
            // Check the physical address unit number, if any
            $value = trim($sqlEmployerRow['physical_address_unit']);
            if( ($sqlEmployerRow['physical_address_unit'] !== null) && (strlen($value) > 0 ) ) {
                if( strlen($value) > 8 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employer physical address unit number',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the unit number of the physical address of the employer. ' . 
                            'The value cannot be longer than 8 characters.'
                    ];
                }
            }
            
            // Check the physical address complex, if any
            $value = trim($sqlEmployerRow['physical_address_complex']);
            if( ($sqlEmployerRow['physical_address_complex'] !== null) && (strlen($value) > 0 ) ) {
                if( strlen($value) > 26 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employer physical address complex',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the complex of the physical address of the employer. ' . 
                            'The value cannot be longer than 26 characters.'
                    ];
                }
            }
            
            // Check the physical address street name
            $value = trim($sqlEmployerRow['physical_address_street']);
            if( ($sqlEmployerRow['physical_address_street'] === null) || (strlen($value) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer physical address street name',
                    'fullDescription' => 
                        'The street name of the physical address of the employer is mandatory.'
                ];
            }
            else if( strlen($value) > 26 ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Invalid employer physical address street name',
                    'fullDescription' => 
                        '\'' . $value . '\' is not a valid value for the street name of the physical address of the employer. ' . 
                        'The value cannot be longer than 26 characters.'
                ];
            }
            
            // Check if neither the physical address suburb or city is completed
            if( (($sqlEmployerRow['physical_address_suburb'] === null) || (strlen(trim($sqlEmployerRow['physical_address_suburb'])) <= 0 )) &&
                (($sqlEmployerRow['physical_address_city'] === null) || (strlen(trim($sqlEmployerRow['physical_address_city'])) <= 0 ))) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer physical address suburb or city',
                    'fullDescription' => 
                        'Either the employer physical address suburb or city must be provided.'
                ];
            }
            
            // Check the physical address suburb, if any
            $value = trim($sqlEmployerRow['physical_address_suburb']);
            if( ($sqlEmployerRow['physical_address_suburb'] !== null) && (strlen($value) > 0 ) ) {
                if( strlen($value) > 33 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employer physical address suburb',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the suburb of the physical address of the employer. ' . 
                            'The value cannot be longer than 33 characters.'
                    ];
                }
            }
            
            // Check the physical address suburb, if any
            $value = trim($sqlEmployerRow['physical_address_city']);
            if( ($sqlEmployerRow['physical_address_city'] !== null) && (strlen($value) > 0 ) ) {
                if( strlen($value) > 21 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => 'Employer',
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employer physical address city',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the city of the physical address of the employer. ' . 
                            'The value cannot be longer than 21 characters.'
                    ];
                }
            }
            
            // Check the physical address postal code
            $isValid = true;
            $value = preg_replace('/[^0-9]+/', '', $sqlEmployerRow['physical_address_postal_code']);
            if( $value !== $sqlEmployerRow['physical_address_postal_code'] ) {
                $isValid = false;
            }
            $value = str_pad($value, 4, '0', STR_PAD_LEFT);
            if( ($sqlEmployerRow['physical_address_postal_code'] === null) || (strlen($sqlEmployerRow['physical_address_postal_code']) <= 0 ) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employer physical address postal code',
                    'fullDescription' => 
                        'The postal code of the physical address of the employer is mandatory.'
                ];
            }
            else if( (strlen($value) !== 4) || !$isValid ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Employer',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'Invalid employer physical address postal code',
                    'fullDescription' => 
                        '\'' . $sqlEmployerRow['physical_address_postal_code'] . '\' is not a valid value for the postal code of the physical address of the employer. ' . 
                        'The value must consist of 4 numeric characters.'
                ];
            }
            
            // Get details of all employees who should get tax certificates for the given tax year
            $sqlEmployeeQuery = 
                'SELECT DISTINCT ' .
                    'employees.id AS employee_id, ' .
                    'employees.code, ' .
                    'employees.title_code, ' .
                    'employees.initials, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.passport_country, ' .
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
                    'employees.payment_method_code, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_period_end_day, ' .
                    'employees.payment_day, ' .
                    'employees.income_tax_number, ' .
                    'employees.income_tax_directive_1, ' .
                    'employees.income_tax_directive_1_issued_date, ' .
                    'employees.income_tax_directive_1_source_code, ' .
                    'employees.income_tax_directive_1_amount, ' .
                    'employees.income_tax_directive_2, ' .
                    'employees.income_tax_directive_2_issued_date, ' .
                    'employees.income_tax_directive_2_source_code, ' .
                    'employees.income_tax_directive_2_amount, ' .
                    'employees.income_tax_directive_3, ' .
                    'employees.income_tax_directive_3_issued_date, ' .
                    'employees.income_tax_directive_3_source_code, ' .
                    'employees.income_tax_directive_3_amount, ' .
                    'employees.sic_code, ' .
                    'employee_bank_details.financial_institution_code, ' . 
                    'COALESCE(financial_institutions.name, \'\') AS financial_institution_name, ' . 
                    'employee_bank_details.bank_account_type_code, ' . 
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'COALESCE(employee_bank_details.account_number, \'\') AS account_number, ' . 
                    'COALESCE(employee_bank_details.branch_code, \'\') AS branch_code ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
                'LEFT JOIN ' . 
                    'financial_institutions ON employee_bank_details.financial_institution_code = financial_institutions.code ' . 
                'LEFT JOIN ' .
                    'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' . 
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' .
                    'payruns.processed_on IS NOT NULL AND ( ' .
                        '(payslips.to_date >= TO_DATE($1, \'YYYY-MM-DD\')) AND ' .
                        '(payslips.to_date < TO_DATE($2, \'YYYY-MM-DD\')) ' .
                    ') AND ' .
                    'employees.employment_start_date < TO_DATE($2, \'YYYY-MM-DD\') AND ' .
                    '( ' .
                        'employees.employment_end_date IS NULL OR ' .
                        'employees.employment_end_date >= TO_DATE($1, \'YYYY-MM-DD\') ' .
                    ') ' .
                'ORDER BY employees.alias ASC;';
            $sqlEmployeeResult = $db->paramQuery($sqlEmployeeQuery, [
                $reconciliationStartDate,
                $nextReconciliationStartDate,
            ]);
            if( !$sqlEmployeeResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Are there no employee certificates to be generated?
            if( $sqlEmployeeResult->getRowCount() < 1 ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'source' => 'Payslips',
                    'value' =>  null,
                    'newValue' =>  null,
                    'description' => 'No employee payslips found',
                    'fullDescription' => 
                        'No tax certificates can be generated for the specified tax reconciliation period. ' . 
                        'Please ensure that all payruns for the period have been processed.'
                ];
            }
            
            // Create the tax certificates for each employee
            while( $sqlEmployeeRow = $sqlEmployeeResult->fetchAssociative() ) {
                // Set time limit to 5 minutes
                set_time_limit(300);
                
                $employeeId = $sqlEmployeeRow['employee_id'];
                
                // Set the employee nature
                $employeeNature = 'A';
                if( $sqlEmployeeRow['is_asylum_seeker'] ) {
                    $employeeNature = 'M';
                }
                else if( $sqlEmployeeRow['is_refugee'] ) {
                    $employeeNature = 'R';
                }
                
                // Check the employee last name
                $value = trim($sqlEmployeeRow['last_name']);
                if( ($sqlEmployeeRow['last_name'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee surname specified',
                        'fullDescription' => 
                            'The surname of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 120 ) {
                    // Break the long string into smaller parts for display
                    $value = str_split($value, 40);
                    $value = implode("<br>", $value);
                    
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Employee surname is too long',
                        'fullDescription' => 
                            'The surname of the employee cannot be longer than 120 characters and will be truncated ' . 
                            'to \'' . substr($value, 0, 120) . '\''
                    ];
                }
                
                // Check the employee name
                $value = trim($sqlEmployeeRow['full_names']);
                if( strpos($value, ' ', strpos($value, ' ', 0) + 1) !== false ) {
                    $value = substr($value, 0, strpos($value, ' ', strpos($value, ' ', 0) + 1));
                }
                if( ($sqlEmployeeRow['full_names'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee first names specified',
                        'fullDescription' => 
                            'The first two names of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 90 ) {
                    // Break the long string into smaller parts for display
                    $value = str_split($value, 40);
                    $value = implode("<br>", $value);
                    
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Employee first names are too long',
                        'fullDescription' => 
                            'The first two names of the employee cannot be longer than 90 characters and will be truncated ' . 
                            'to \'' . substr($value, 0, 90) . '\''
                    ];
                }
                
                // Check the employee initials
                $value = preg_replace('/[^a-zA-Z]/','', $sqlEmployeeRow['initials']);
                if( ($sqlEmployeeRow['initials'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee initials specified',
                        'fullDescription' => 
                            'The initials of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 5 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Too many employee initails',
                        'fullDescription' => 
                            'There can be a maximum of 5 employee initials. The initails will be truncated ' . 
                            'to \'' . substr($value, 0, 5) . '\''
                    ];
                }
                
                // Check if neither the employee id number or passport number is completed
                if( ($employeeNature === 'A') || ($employeeNature === 'C') ) {
                    if( (($sqlEmployeeRow['id_number'] === null) || (strlen(preg_replace('/[^0-9]+/','', $sqlEmployeeRow['id_number'])) <= 0 )) &&
                        (($sqlEmployeeRow['passport_number'] === null) || (strlen(trim($sqlEmployeeRow['passport_number'])) <= 0 ))) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'No employee identity or passport number',
                            'fullDescription' => 
                                'Either the employee identity number or passport number must be provided.'
                        ];
                    }
                }
                
                // Check the employee id number, if any
                $idNumber = null;
                $value = preg_replace('/[^0-9]+/','', $sqlEmployeeRow['id_number']);
                if( ($sqlEmployeeRow['id_number'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) !== 13 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid RSA identification number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['id_number'] . '\' is not a valid RSA identitity number. ' . 
                                'The value must consist of 13 numeric characters.'
                        ];
                    }
                    else {
                        $idNumber = $value;
                    }
                }
                
                // Check the employee passport number, if any
                $value = trim($sqlEmployeeRow['passport_number']);
                if( ($sqlEmployeeRow['passport_number'] !== null) && (strlen($value) > 0 ) ) {
                    // Was no passport country specified?
                    if( ($sqlEmployeeRow['passport_country'] === null) || (strlen(trim($sqlEmployeeRow['passport_country'])) <= 0 ) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'No employee passport country of issue',
                            'fullDescription' => 
                                'The country that issued the passport is mandatory if passport number has been completed..'
                        ];
                    }
                    
                    // Is the passport number not valid?
                    if( (strlen($value) < 6) || (strlen($value) > 18) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee passport number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['passport_number'] . '\' is not a valid passport number. ' . 
                                'The value must be between 6 and 18 characters long.'
                        ];
                    }
                }
                
                // Check the employee date of birth
                $value = preg_replace('/[^0-9]+/','', $sqlEmployeeRow['date_of_birth']);
                if( ($sqlEmployeeRow['date_of_birth'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee date of birth specified',
                        'fullDescription' => 
                            'The date of birth of the employee is mandatory.'
                    ];
                }
                else {
                    // Was an id number given?
                    if( $idNumber !== null ) {
                        // Check that the id number matches the date of birth
                        $dateOfBirth = substr(str_replace('-', '', $sqlEmployeeRow['date_of_birth']), -6, 6);
                        if( $dateOfBirth !== substr($idNumber, 0, 6) ) {
                            // Add an exception
                            $exceptions[] = [
                                'isCritical' => true,
                                'source' => $sqlEmployeeRow['alias'],
                                'value' =>  null,
                                'newValue' =>  null,
                                'description' => 'Employee ID number does not match date of birth',
                                'fullDescription' => 
                                '\'' . $idNumber . '\' does not match ' . $sqlEmployeeRow['date_of_birth'] . '.'
                            ];
                        }
                    }
                }
                
                // Check the employee income tax reference number
                $value = preg_replace('/[^0-9U]+/', '', $sqlEmployeeRow['income_tax_number']);
                if( ($sqlEmployeeRow['income_tax_number'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee income tax reference number',
                        'fullDescription' => 
                            'The employee income tax reference number is mandatory.'
                    ];
                }
                else if( (strlen($value) !== 10) || ( (substr($value, 0, 1) !== '0') && 
                        (substr($value, 0, 1) !== '1') && (substr($value, 0, 1) !== '2') && 
                        (substr($value, 0, 1) !== '3') ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee income tax reference number',
                        'fullDescription' => 
                            '\'' . $sqlEmployeeRow['income_tax_number'] . '\' is not a valid income tax reference number. The income tax reference number must consist of ' . 
                            '10 numerical characters and must start with a \'0\', \'1\', \'2\', or \'3\'.'
                    ];
                }
                
                // Check the employee sic code
                $value = $sqlEmployeeRow['sic_code'];
                if( ($sqlEmployeeRow['sic_code'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee standard industry classification code specified',
                        'fullDescription' => 
                            'The standard industry classification code in which the employee mainly works is mandatory.'
                    ];
                }
                
                // Check the employee tax directive 1, if any
                $taxDirectiveSourceCodes = [
                    '3608', '3658', '3614', '3664', '3901', '3951', '3902', '3952', '3953', '3904', '3954', 
                    '3955', '3907', '3957', '3908', '3909', '3915', '3920', '3921', '3922', '3923', '3924', 
                    '3707', '3757', '3718', '3768', '3719', '3769', '3720', '3770', '3721', '3771', '3723', 
                    '3773' // , '3903', '3905' not applicable from 2009
                ];
                $value = trim($sqlEmployeeRow['income_tax_directive_1']);
                if( strlen($value) > 0 ) {
                    // Check the tax directive number
                    if( (strlen($value) > 15) || (!ctype_alnum($value)) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid income tax directive 1 number',
                            'fullDescription' => 
                                'The income tax directive number must consist only of alhpha-numerical characters and must be 15 characters or less in length.'
                        ];
                    }
                    
                    // Check other required values for the 2022 tax year and later
                    if( $taxYear >= '2022' ) {
                        // Was any of the directive details specified?
                        if( ($sqlEmployeeRow['income_tax_directive_1_issued_date'] != null ) ||
                            (strlen($sqlEmployeeRow['income_tax_directive_1_source_code']) > 0 ) || 
                            ($sqlEmployeeRow['income_tax_directive_1_amount'] != null ) ) {
                                
                            $value = preg_replace('/[^0-9]+/','', ($sqlEmployeeRow['income_tax_directive_1_issued_date'] !== null ? $sqlEmployeeRow['income_tax_directive_1_issued_date'] : ''));
                            if( ($sqlEmployeeRow['income_tax_directive_1_issued_date'] === null) || (strlen($value) <= 0 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 1 date issued',
                                    'fullDescription' => 
                                        'If directive income source code or directive income amount has been completed, then directive issued date is mandatory.'
                                ];
                            }
                            
                            $value = preg_replace('/[^0-9]+/','', $sqlEmployeeRow['income_tax_directive_1_source_code']);
                            if( ($sqlEmployeeRow['income_tax_directive_1_source_code']) === null || (strlen($value) <= 0) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 1 source code',
                                    'fullDescription' => 
                                        'If directive issued date or directive income amount has been completed, then directive income source code is mandatory.'
                                ];
                            }
                            else if( strlen($value) !== 4 ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 1 source code',
                                    'fullDescription' => 
                                        'This value must consist of 4 numeric characters. ' . 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            else if( !in_array($value, $taxDirectiveSourceCodes) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 1 source code',
                                    'fullDescription' => 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            
                            $value = $sqlEmployeeRow['income_tax_directive_1_amount'];
                            if( ($sqlEmployeeRow['income_tax_directive_1_amount'] === null) || (strlen($value) <= 0 ) || ($value < 0.00 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 1 amount',
                                    'fullDescription' => 
                                        'If directive issued date or directive income source code has been completed, then directive income amount is mandatory.'
                                ];
                            }
                        }
                    }
                }
                
                // Check the employee tax directive 12, if any
                $value = trim($sqlEmployeeRow['income_tax_directive_2']);
                if( strlen($value) > 0 ) {
                    // Check the tax directive number
                    if( (strlen($value) > 15) || (!ctype_alnum($value)) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid income tax directive 2 number',
                            'fullDescription' => 
                                'The income tax directive number must consist only of alhpha-numerical characters and must be 15 characters or less in length.'
                        ];
                    }
                    
                    // Check other required values for the 2022 tax year and later
                    if( $taxYear >= '2022' ) {
                        // Was any of the directive details specified?
                        if( ($sqlEmployeeRow['income_tax_directive_2_issued_date'] != null ) ||
                            (strlen($sqlEmployeeRow['income_tax_directive_2_source_code']) > 0 ) || 
                            ($sqlEmployeeRow['income_tax_directive_2_amount'] != null ) ) {
                            
                            $value = preg_replace('/[^0-9]+/','', ($sqlEmployeeRow['income_tax_directive_2_issued_date'] !== null ? $sqlEmployeeRow['income_tax_directive_2_issued_date'] : ''));
                            if( ($sqlEmployeeRow['income_tax_directive_2_issued_date'] === null) || (strlen($value) <= 0 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 2 date issued',
                                    'fullDescription' => 
                                        'If directive income source code or directive income amount has been completed, then directive issued date is mandatory.'
                                ];
                            }
                            
                            $value = preg_replace('/[^0-9]+/','', $sqlEmployeeRow['income_tax_directive_2_source_code']);
                            if( ($sqlEmployeeRow['income_tax_directive_2_source_code']) === null || (strlen($value) <= 0) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 2 source code',
                                    'fullDescription' => 
                                        'If directive issued date or directive income amount has been completed, then directive income source code is mandatory.'
                                ];
                            }
                            else if( strlen($value) !== 4 ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 2 source code',
                                    'fullDescription' => 
                                        'This value must consist of 4 numeric characters. ' . 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            else if( !in_array($value, $taxDirectiveSourceCodes) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 2 source code',
                                    'fullDescription' => 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            
                            $value = $sqlEmployeeRow['income_tax_directive_2_amount'];
                            if( ($sqlEmployeeRow['income_tax_directive_2_amount'] === null) || (strlen($value) <= 0 ) || ($value < 0.00 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 2 amount',
                                    'fullDescription' => 
                                        'If directive issued date or directive income source code has been completed, then directive income amount is mandatory.'
                                ];
                            }
                        }
                    }
                }
                
                // Check the employee tax directive 3, if any
                $value = trim($sqlEmployeeRow['income_tax_directive_3']);
                if( strlen($value) > 0 ) {
                    // Check the tax directive number
                    if( (strlen($value) > 15) || (!ctype_alnum($value)) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid income tax directive 3 number',
                            'fullDescription' => 
                                'The income tax directive number must consist only of alhpha-numerical characters and must be 15 characters or less in length.'
                        ];
                    }
                    
                    // Check other required values for the 2022 tax year and later
                    if( $taxYear >= '2022' ) {
                        // Was any of the directive details specified?
                        if( ($sqlEmployeeRow['income_tax_directive_3_issued_date'] != null ) ||
                            (strlen($sqlEmployeeRow['income_tax_directive_3_source_code']) > 0 ) || 
                            ($sqlEmployeeRow['income_tax_directive_3_amount'] != null ) ) {
                            
                            $value = preg_replace('/[^0-9]+/','', ($sqlEmployeeRow['income_tax_directive_3_issued_date'] !== null ? $sqlEmployeeRow['income_tax_directive_3_issued_date'] : ''));
                            if( ($sqlEmployeeRow['income_tax_directive_3_issued_date'] === null) || (strlen($value) <= 0 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 3 date issued',
                                    'fullDescription' => 
                                        'If directive income source code or directive income amount has been completed, then directive issued date is mandatory.'
                                ];
                            }
                            
                            $value = preg_replace('/[^0-9]+/','', $sqlEmployeeRow['income_tax_directive_3_source_code']);
                            if( ($sqlEmployeeRow['income_tax_directive_3_source_code']) === null || (strlen($value) <= 0) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 3 source code',
                                    'fullDescription' => 
                                        'If directive issued date or directive income amount has been completed, then directive income source code is mandatory.'
                                ];
                            }
                            else if( strlen($value) !== 4 ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 3 source code',
                                    'fullDescription' => 
                                        'This value must consist of 4 numeric characters. ' . 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            else if( !in_array($value, $taxDirectiveSourceCodes) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'Invalid income tax directive 3 source code',
                                    'fullDescription' => 
                                        'The code must be one of the following:<br><br>' . implode(' ', $taxDirectiveSourceCodes)
                                ];
                            }
                            
                            $value = $sqlEmployeeRow['income_tax_directive_3_amount'];
                            if( ($sqlEmployeeRow['income_tax_directive_3_amount'] === null) || (strlen($value) <= 0 ) || ($value < 0.00 ) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'isCritical' => true,
                                    'source' => $sqlEmployeeRow['alias'],
                                    'value' =>  null,
                                    'newValue' =>  null,
                                    'description' => 'No income tax directive 3 amount',
                                    'fullDescription' => 
                                        'If directive issued date or directive income source code has been completed, then directive income amount is mandatory.'
                                ];
                            }
                        }
                    }
                }
                
                // Check the employee email address, if any
                $value = trim($sqlEmployeeRow['email_address']);
                if( ($sqlEmployeeRow['email_address'] !== null) && (strlen($value) > 0 ) ) {
                    $isValid = true;
                    
                    // Check for characters that are not allowed
                    $moreInfo = ' It also may not contain any of the following characters: (, ), \\, “, |, or %.';
                    if( strpos($value, '(') !== false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, ')') !== false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, '\\') !== false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, '“') !== false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, '|') !== false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, '%') !== false ) {
                        $isValid = false;
                    }
                    else {
                        $moreInfo = '';
                    }
                    
                    // Check that the first and last character are alpha-numeric
                    if( !ctype_alnum(substr($value, 0, 1)) || !ctype_alnum(substr($value, -1)) ) {
                        $moreInfo = ' The first and last character MUST NOT be a special character.';
                        $isValid = false;
                    }
                    
                    // Check that there is only one '@' character
                    if( strpos($value, '@', 0) === false ) {
                        $isValid = false;
                    }
                    else if( strpos($value, '@', strpos($value, '@', 0) + 1) !== false ) {
                        $isValid = false;
                    }
                    
                    // Check that there is a domain after the '@' character
                    if( $isValid ) {
                        if( (strpos($value, '.', 0) === false) || (strpos($value, '.', strpos($value, '@', 0) + 1) === false) ) {
                            $isValid = false;
                        }
                    }
                    
                    if( (strlen($value) > 70) || !$isValid ) {
                        // Break the long string into smaller parts for display
                        $value = str_split($value, 40);
                        $value = implode("<br>", $value);
                        
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee contact email address',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the employee contact email address. ' . 
                                'The value must contain only one \'@\' character followed by a value and a domain ' . 
                                'starting with a \'.\' character and cannot be more than 70 characters long.' . 
                                $moreInfo
                        ];
                    }
                }
                
                // Check the employee home telephone number, if any
                $value = str_replace('+27', '0', $sqlEmployeeRow['home_number']);
                $value = preg_replace('/[^0-9]+/', '', $value);
                if( ($sqlEmployeeRow['home_number'] !== null) && (strlen($value) > 0 ) ) {
                    if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee home telephone number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['home_number'] . '\' is not a valid value for the employee home telephone number. ' . 
                                'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                        ];
                    }
                }
                
                // Check the employee business telephone number
                $value = str_replace('+27', '0', $sqlEmployeeRow['work_number']);
                $value = preg_replace('/[^0-9]+/', '', $value);
                if( ($sqlEmployeeRow['work_number'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee business telephone number',
                        'fullDescription' => 
                            'The employee business telephone number is mandatory.'
                    ];
                }
                else if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee business telephone number',
                        'fullDescription' => 
                            '\'' . $sqlEmployeeRow['work_number'] . '\' is not a valid value for the employee business telephone number. ' . 
                            'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                    ];
                }
                
                // Check the employee cell number, if any
                $value = str_replace('+27', '0', $sqlEmployeeRow['cell_number']);
                $value = preg_replace('/[^0-9]+/', '', $value);
                if( ($sqlEmployeeRow['cell_number'] !== null) && (strlen($value) > 0 ) ) {
                    if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee cell number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['cell_number'] . '\' is not a valid value for the employee cell number. ' . 
                                'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                        ];
                    }
                    else if( (substr($value, 0, 1) !== '0') && (substr($value, 0, 2) !== '00') ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee cell number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['cell_number'] . '\' is not a valid value for the employee cell number. ' . 
                                'National numbers must start with a 0 and International numbers must start with 00.'
                        ];
                    }
                }
                
                // Check the employee fax number, if any
                $value = str_replace('+27', '0', $sqlEmployeeRow['fax_number']);
                $value = preg_replace('/[^0-9]+/', '', $value);
                if( ($sqlEmployeeRow['fax_number'] !== null) && (strlen($value) > 0 ) ) {
                    if( (strlen($value) < 10) || (strlen($value) > 15) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee fax number',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['fax_number'] . '\' is not a valid value for the employee fax number. ' . 
                                'The value must contain only numeric characters and must be between 10 and 15 characters long.'
                        ];
                    }
                }
                
                // Check the work address unit number, if any
                $value = trim($sqlEmployeeRow['work_address_unit']);
                if( ($sqlEmployeeRow['work_address_unit'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 8 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee work address unit number',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the unit number of the work address of the employee. ' . 
                                'The value cannot be longer than 8 characters.'
                        ];
                    }
                }
                
                // Check the work address complex, if any
                $value = trim($sqlEmployeeRow['work_address_complex']);
                if( ($sqlEmployeeRow['work_address_complex'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 26 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee work address complex',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the complex of the work address of the employee. ' . 
                                'The value cannot be longer than 26 characters.'
                        ];
                    }
                }
                
                // Check the work address street name
                $value = trim($sqlEmployeeRow['work_address_street']);
                if( ($sqlEmployeeRow['work_address_street'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee work address street name',
                        'fullDescription' => 
                            'The street name of the work address of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 26 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee work address street name',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the street name of the work address of the employee. ' . 
                            'The value cannot be longer than 26 characters.'
                    ];
                }
                
                // Check if neither the work address suburb or city is completed
                if( (($sqlEmployeeRow['work_address_suburb'] === null) || (strlen(trim($sqlEmployeeRow['work_address_suburb'])) <= 0 )) &&
                    (($sqlEmployeeRow['work_address_city'] === null) || (strlen(trim($sqlEmployeeRow['work_address_city'])) <= 0 ))) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee work address suburb or city',
                        'fullDescription' => 
                            'Either the employee work address suburb or city must be provided.'
                    ];
                }
                
                // Check the work address suburb, if any
                $value = trim($sqlEmployeeRow['work_address_suburb']);
                if( ($sqlEmployeeRow['work_address_suburb'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 33 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee work address suburb',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the suburb of the work address of the employee. ' . 
                                'The value cannot be longer than 33 characters.'
                        ];
                    }
                }
                
                // Check the work address suburb, if any
                $value = trim($sqlEmployeeRow['work_address_city']);
                if( ($sqlEmployeeRow['work_address_city'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 21 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee work address city',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the city of the work address of the employee. ' . 
                                'The value cannot be longer than 21 characters.'
                        ];
                    }
                }
                
                // Check the work address postal code
                $isValid = true;
                $value = preg_replace('/[^0-9]+/', '', $sqlEmployeeRow['work_address_postal_code']);
                if( $value !== $sqlEmployeeRow['work_address_postal_code'] ) {
                    $isValid = false;
                }
                $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                if( ($sqlEmployeeRow['work_address_postal_code'] === null) || (strlen($sqlEmployeeRow['work_address_postal_code']) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee work address postal code',
                        'fullDescription' => 
                            'The postal code of the work address of the employee is mandatory.'
                    ];
                }
                else if( (strlen($value) !== 4) || !$isValid ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee work address postal code',
                        'fullDescription' => 
                            '\'' . $sqlEmployeeRow['work_address_postal_code'] . '\' is not a valid value for the postal code of the work address of the employee. ' . 
                            'The value must consist of 4 numeric characters.'
                    ];
                }
                
                // Check for work address country code
                if( ($sqlEmployeeRow['work_address_country_code'] === null) || (strlen($sqlEmployeeRow['work_address_country_code']) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee work address country code',
                        'fullDescription' => 
                            'The country code of the work address of the employee is mandatory.'
                    ];
                }
                
                // Check the physical address unit number, if any
                $value = trim($sqlEmployeeRow['physical_address_unit']);
                if( ($sqlEmployeeRow['physical_address_unit'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 8 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee physical address unit number',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the unit number of the physical address of the employee. ' . 
                                'The value cannot be longer than 8 characters.'
                        ];
                    }
                }
                
                // Check the physical address complex, if any
                $value = trim($sqlEmployeeRow['physical_address_complex']);
                if( ($sqlEmployeeRow['physical_address_complex'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 26 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee physical address complex',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the complex of the physical address of the employee. ' . 
                                'The value cannot be longer than 26 characters.'
                        ];
                    }
                }
                
                // Check the physical address street name
                $value = trim($sqlEmployeeRow['physical_address_street']);
                if( ($sqlEmployeeRow['physical_address_street'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee physical address street name',
                        'fullDescription' => 
                            'The street name of the physical address of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 26 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee physical address street name',
                        'fullDescription' => 
                            '\'' . $value . '\' is not a valid value for the street name of the physical address of the employee. ' . 
                            'The value cannot be longer than 26 characters.'
                    ];
                }
                
                // Check if neither the physical address suburb or city is completed
                if( (($sqlEmployeeRow['physical_address_suburb'] === null) || (strlen(trim($sqlEmployeeRow['physical_address_suburb'])) <= 0 )) &&
                    (($sqlEmployeeRow['physical_address_city'] === null) || (strlen(trim($sqlEmployeeRow['physical_address_city'])) <= 0 ))) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee physical address suburb or city',
                        'fullDescription' => 
                            'Either the employee physical address suburb or city must be provided.'
                    ];
                }
                
                // Check the physical address suburb, if any
                $value = trim($sqlEmployeeRow['physical_address_suburb']);
                if( ($sqlEmployeeRow['physical_address_suburb'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 33 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee physical address suburb',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the suburb of the physical address of the employee. ' . 
                                'The value cannot be longer than 33 characters.'
                        ];
                    }
                }
                
                // Check the physical address suburb, if any
                $value = trim($sqlEmployeeRow['physical_address_city']);
                if( ($sqlEmployeeRow['physical_address_city'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 21 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee physical address city',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the city of the physical address of the employee. ' . 
                                'The value cannot be longer than 21 characters.'
                        ];
                    }
                }
                
                // Check the physical address postal code
                $isValid = true;
                $value = preg_replace('/[^0-9]+/', '', $sqlEmployeeRow['physical_address_postal_code']);
                if( $value !== $sqlEmployeeRow['physical_address_postal_code'] ) {
                    $isValid = false;
                }
                $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                if( ($sqlEmployeeRow['physical_address_postal_code'] === null) || (strlen($sqlEmployeeRow['physical_address_postal_code']) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee physical address postal code',
                        'fullDescription' => 
                            'The postal code of the physical address of the employee is mandatory.'
                    ];
                }
                else if( (strlen($value) !== 4) || !$isValid ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee physical address postal code',
                        'fullDescription' => 
                            '\'' . $sqlEmployeeRow['physical_address_postal_code'] . '\' is not a valid value for the postal code of the physical address of the employee. ' . 
                            'The value must consist of 4 numeric characters.'
                    ];
                }
                
                // Check for physical address country code
                if( ($sqlEmployeeRow['physical_address_country_code'] === null) || (strlen($sqlEmployeeRow['physical_address_country_code']) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee physical address country code',
                        'fullDescription' => 
                            'The country code of the physical address of the employee is mandatory.'
                    ];
                }
                
                // Check if the postal address line 1 is completed
                $value = trim($sqlEmployeeRow['postal_address_line_1']);
                if( ($sqlEmployeeRow['postal_address_line_1'] === null) || (strlen($value) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee postal address line 1',
                        'fullDescription' => 
                            'The first line of the postal address of the employee is mandatory.'
                    ];
                }
                else if( strlen($value) > 35 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee postal address line 1',
                        'fullDescription' => 
                            'The first line of the postal address of the employee cannot be longer than 35 characters and will be truncated ' . 
                            'to \'' . substr($value, 0, 35) . '\''
                    ];
                }
                
                // Check the postal address line 2, if any
                $value = trim($sqlEmployeeRow['postal_address_line_2']);
                if( ($sqlEmployeeRow['postal_address_line_2'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 35 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => false,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee postal address line 2',
                            'fullDescription' => 
                                'The second line of the postal address of the employee cannot be longer than 35 characters and will be truncated ' . 
                                'to \'' . substr($value, 0, 35) . '\''
                        ];
                    }
                }
                
                // Check the postal address line 3, if any
                $value = trim($sqlEmployeeRow['postal_address_line_3']);
                if( ($sqlEmployeeRow['postal_address_line_3'] !== null) && (strlen($value) > 0 ) ) {
                    if( strlen($value) > 35 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => false,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee postal address line 3',
                            'fullDescription' => 
                                'The third line of the postal address of the employee cannot be longer than 35 characters and will be truncated ' . 
                                'to \'' . substr($value, 0, 35) . '\''
                    ];
                    }
                }
                
                // Check the postal address postal code
                $isValid = true;
                $value = preg_replace('/[^0-9]+/', '', $sqlEmployeeRow['postal_address_code']);
                if( $value !== $sqlEmployeeRow['postal_address_code'] ) {
                    $isValid = false;
                }
                $value = str_pad($value, 4, '0', STR_PAD_LEFT);
                if( ($sqlEmployeeRow['postal_address_code'] === null) || (strlen($sqlEmployeeRow['postal_address_code']) <= 0 ) ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee postal address code',
                        'fullDescription' => 
                            'The code of the postal address of the employee is mandatory.'
                    ];
                }
                else if( (strlen($value) !== 4) || !$isValid ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Invalid employee postal address code',
                        'fullDescription' => 
                            '\'' . $sqlEmployeeRow['postal_address_code'] . '\' is not a valid value for the code of the postal address of the employee. ' . 
                            'The value must consist of 4 numeric characters.'
                    ];
                }
                
                // Check for the postal address country code
                if( $employeeNature != 'N' ) {
                    if( ($sqlEmployeeRow['postal_address_country_code'] === null) || (strlen($sqlEmployeeRow['postal_address_country_code']) <= 0 ) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'No employee postal address country code',
                            'fullDescription' => 
                                'The country code of the postal address of the employee is mandatory if the employee nature is not \'N\'.'
                        ];
                    }
                }
                
                // Are there employee bank details?
                $hasBankDetails = false;
                if( ($sqlEmployeeRow['bank_account_type_code'] !== null) && (strlen($sqlEmployeeRow['bank_account_type_code']) > 0) ) {
                    $hasBankDetails = true;
                }
                
                // Make certain all bank details have been completed, if any
                if( $hasBankDetails ) {
                    // Check the employee bank account number
                    $value = preg_replace('/[^0-9]+/', '', $sqlEmployeeRow['account_number']);
                    if( ($sqlEmployeeRow['account_number'] === null) || (strlen($sqlEmployeeRow['account_number']) <= 0 ) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'No employee bank account number',
                            'fullDescription' => 
                                'The employee bank account number is mandatory.'
                        ];
                    }
                    else if( strlen($value) > 16 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee bank account',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['account_number'] . '\' is not a valid value for the employee bank account number. ' . 
                                'The value must contain only numeric characters and must not be more than 16 characters long.'
                        ];
                    }
                    
                    // Check the employee bank account number
                    $value = preg_replace('/[^0-9]+/', '', $sqlEmployeeRow['branch_code']);
                    if( ($sqlEmployeeRow['branch_code'] === null) || (strlen($sqlEmployeeRow['branch_code']) <= 0 ) ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'No employee bank branch code',
                            'fullDescription' => 
                                'The employee bank branch code is mandatory.'
                        ];
                    }
                    else if( strlen($value) !== 6 ) {
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => true,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee bank branch code',
                            'fullDescription' => 
                                '\'' . $sqlEmployeeRow['branch_code'] . '\' is not a valid value for the employee bank branch code. ' . 
                                'The value must contain only numeric characters and must be 6 characters long.'
                        ];
                    }
                    
                    // Check if the employee bank account holder name is completed
                    $value = trim($sqlEmployeeRow['full_names'] . ' ' . $sqlEmployeeRow['last_name']);
                    if( strlen($value) > 49 ) {
                        // Break the long string into smaller parts for display
                        $value = str_split($value, 40);
                        $value = implode("<br>", $value);
                        
                        // Add an exception
                        $exceptions[] = [
                            'isCritical' => false,
                            'source' => $sqlEmployeeRow['alias'],
                            'value' =>  null,
                            'newValue' =>  null,
                            'description' => 'Invalid employee bank account holder name',
                            'fullDescription' => 
                                '\'' . $value . '\' is not a valid value for the employee bank account holder name. ' . 
                                'The value cannot be longer than 49 characters.'
                        ];
                    }
                }
                
                // Set the default date of the first payslip
                $firstPaylsipToDate = new DateTime($sqlEmployeeRow['employment_start_date']);
                
                // Is the employee not paid monthly?
                if( $sqlEmployeeRow['payment_period_code'] !== 'MONT' ) {
                    // Get the to date of the first payslip in the tax reconciliation period
                    $sqlFirstPayslipDateQuery = 
                        'SELECT ' .
                            'payslips.to_date ' .
                        'FROM ' .
                            'payslips ' .
                        'LEFT JOIN ' .
                            'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                        'LEFT JOIN ' .
                            'payruns ON payruns.id = payslips.payrun_id ' .
                        'LEFT JOIN ' .
                            'employees ON employees.id = payslips.employee_id ' .
                        'WHERE ' .
                            'payslips.employee_id = $1 AND ' .
                            'payslips.status_code = \'ACTI\' AND ' .
                            'payruns.processed_on IS NOT NULL AND ( ' .
                                '(payslips.to_date >= TO_DATE($2, \'YYYY-MM-DD\')) AND ' .
                                '(payslips.to_date < TO_DATE($3, \'YYYY-MM-DD\')) ' .
                            ') AND ' .
                            'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                            '( ' .
                                'employees.employment_end_date IS NULL OR ' .
                                'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                            ') ' .
                        'ORDER BY payslips.to_date ASC LIMIT 1;';
                    $sqlFirstPayslipDateResult = $db->paramQuery($sqlFirstPayslipDateQuery, [
                        $employeeId,
                        $reconciliationStartDate,
                        $nextReconciliationStartDate,
                    ]);
                    if( !$sqlFirstPayslipDateResult->isValid() ) {
                        return( ['ok' => false, 'error' => 'Database error.'] );
                    }
                    
                    // Are there no employee certificates to be generated?
                    if( $sqlFirstPayslipDateResult->getRowCount() == 1 ) {
                        $firstPayslipDateRow = $sqlFirstPayslipDateResult->fetchAssociative();
                        $firstPaylsipToDate = new DateTime($firstPayslipDateRow['to_date']);
                    }
                }
                
                // Caluclate the number of pay periods for the employee
                $paymentPeriodEndDay = $sqlEmployeeRow['payment_period_end_day'];
                $payPeriods = 12;
                if( $periodCode === 'INTE' ) {
                    if( $sqlEmployeeRow['payment_period_code'] === 'MONT' ) {
                        $payPeriods = 6;
                    }
                    else if( $sqlEmployeeRow['payment_period_code'] === 'WEEK' ) {
                        $payPeriods = \PayslipUtil\getWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                        // $payPeriods = 26;
                    }
                    else if( $sqlEmployeeRow['payment_period_code'] === 'BWEE' ) {
                        $payPeriods = \PayslipUtil\getBiWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                        // $payPeriods = 13;
                    }
                }
                else {
                    if( $sqlEmployeeRow['payment_period_code'] === 'MONT' ) {
                        $payPeriods = 12;
                    }
                    else if( $sqlEmployeeRow['payment_period_code'] === 'WEEK' ) {
                        $payPeriods = \PayslipUtil\getWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                        // $payPeriods = 52;
                    }
                    else if( $sqlEmployeeRow['payment_period_code'] === 'BWEE' ) {
                        $payPeriods = \PayslipUtil\getBiWeeklyPayslipPeriod($reconciliationEndDate, $firstPaylsipToDate, $paymentPeriodEndDay);
                        // $payPeriods = 26;
                    }
                }
                // if( $sqlEmployeeRow['payment_period_code'] === 'WEEK' ) {
                //     // Set the end date
                //     $endDate = new DateTime( $nextReconciliationStartDate );
                //     $endDate->setTime(0, 0, 0);
                    
                //     // Set the start date to the beginning of the SARS tax year
                //     $startDate = new DateTime( $reconciliationStartDate );
                //     $startDate->setTime(0, 0, 0);
                    
                //     // Convert the tax year to a period of days
                //     $taxYearPeriod = new DatePeriod($startDate, new DateInterval('P1D'), $endDate);
                    
                //     // Count the number of weeks from the start of the tax year
                //     $payPeriods = 0;
                //     foreach($taxYearPeriod as $taxYearDay) {
                //         if( $taxYearDay->format('w') == $paymentPeriodEndDay ) {
                //             $payPeriods = $payPeriods + 1;
                //         }
                //     }
                // }
                // else if( $sqlEmployeeRow['payment_period_code'] === 'BWEE' ) {
                //     $payPeriods = 13;
                // }
                
                // Get all the payslips for the employee for the given tax reconciliation period
                $payPeriodsWorked = 0;
                $totalIncomeItems = 0;
                $totalDeductionItems = 0;
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
                    'LEFT JOIN ' .
                        'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payslips.status_code = \'ACTI\' AND ' .
                        'payslips.employee_id = $1 AND ' .
                        'payruns.processed_on IS NOT NULL AND ( ' .
                            '(payslips.to_date >= TO_DATE($2, \'YYYY-MM-DD\')) AND ' .
                            '(payslips.to_date < TO_DATE($3, \'YYYY-MM-DD\')) ' .
                        ') AND ' .
                        'employees.employment_start_date < TO_DATE($3, \'YYYY-MM-DD\') AND ' .
                        '( ' .
                            'employees.employment_end_date IS NULL OR ' .
                            'employees.employment_end_date >= TO_DATE($2, \'YYYY-MM-DD\') ' .
                        ') ' .
                    'ORDER BY payslips.to_date ASC;';
                $payslipResult = $db->paramQuery($payslipQuery, [
                    $employeeId, 
                    $reconciliationStartDate,
                    $nextReconciliationStartDate,
                ]);
                if( !$payslipResult->isValid() ) {
                    return( ['ok' => false, 'error' => 'Database error.'] );
                }
                
                // Are there no payslips for tax period?
                if( $payslipResult->getRowCount() <= 0 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'No employee payslips',
                        'fullDescription' => 
                            'No processed payslips for the specified employee during the reconciliation period.'
                    ];
                    continue;
                }
                
                // For every payslip of the employee
                $sarsCodes = [];
                while( $payslipRow = $payslipResult->fetchAssociative() ) {
                    // Count the number of periods for the employee
                    $payPeriodsWorked = $payPeriodsWorked + 1;
                    
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
                        'ORDER BY custom_sort, payslip_items.description ASC, payslip_items.payslip_item_type_code ASC;';
                    $itemResult = $db->paramQuery($itemQuery, [
                        $payslipRow['id']
                    ]);
                    if( !$itemResult->isValid() ) {
                        return( ['ok' => false, 'error' => 'Database error.'] );
                    }
                    
                    // For every payslip item
                    while( $itemRow = $itemResult->fetchAssociative() ) {
                        $units = $itemRow['units'];
                        if( $units !== null ) $units = doubleval($units);
                        
                        $rate = $itemRow['rate'];
                        if( $rate !== null ) $rate = doubleval($rate);
                        
                        $amount = $itemRow['total'];
                        if( $amount !== null ) $amount = doubleval($amount);
                        
                        $providentFundId = $itemRow['provident_fund_id'];
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
                                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $employeeId]);
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
                        
                        // Get the SARS code and amount for the relevant payslip items
                        $hasIncomeItem = false;
                        $hasDeductionItem = false;
                        if( ( $itemRow['payslip_item_type_code'] === '1000' ) ||
                            ( $itemRow['payslip_item_type_code'] === '1001' ) ||
                            ( $itemRow['payslip_item_type_code'] === '1002' ) ) {
                                $hasIncomeItem = true;
                            }
                        else if( $itemRow['payslip_item_type_code'] === '1003' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '1004' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '1005' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2000' ) {
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2001' ) {
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2002' ) {
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2003' ) {
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2004' ) {
                            // Other deductions aren't reflected on the reconciliation
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2005' ) {
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2006' ) {
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2007' ) {
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '2008' ) {
                            // Employee loan deductions aren't reflected on the reconciliation
                        }
                        else if( $itemRow['payslip_item_type_code'] === '3001' ) {
                        }
                        else if( $itemRow['payslip_item_type_code'] === '3002' ) {
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4000' ) {
                            $hasIncomeItem = true;
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4001' ) {
                            $hasIncomeItem = true;
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4002' ) {
                            $hasIncomeItem = true;
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4003' ) {
                            $hasIncomeItem = true;
                            $hasDeductionItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4004' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4005' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4006' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4007' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4008' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '4009' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5000' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5001' ) {
                            $hasIncomeItem = true;
                            
                            // Add the amount above the tax threshold, if any
                            if( $itemRow['units'] !== null ) {
                                $taxThreshold = \PayslipUtil\getTravelAllowancePrescribedRate( new DateTime( $payslipRow['to_date'] ) ) * $itemRow['units'];
                                
                                if( $itemRow['total'] > $taxThreshold ) {
                                    $hasIncomeItem = true;
                                }
                            }
                            
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5002' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5003' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5004' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5005' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5006' ) {
                            $hasIncomeItem = true;
                        }
                        else if( $itemRow['payslip_item_type_code'] === '5007' ) {
                            $hasIncomeItem = true;
                        }
                        else {
                            // Add an exception
                            $exceptions[] = [
                                'isCritical' => true,
                                'source' => $sqlEmployeeRow['alias'],
                                'value' =>  null,
                                'newValue' =>  null,
                                'description' => 'Unidentified payslip item found',
                                'fullDescription' => 
                                    'An item was found on the payslip that does not correspond to any of the SARS code currently supported.'
                            ];
                        }
                        
                        // Add the code to the array and count the income/deduction items
                        if( !in_array( $itemRow['payslip_item_type_code'], $sarsCodes) ) {
                            $sarsCodes[] = $itemRow['payslip_item_type_code'];
                            
                            if( $hasIncomeItem ) {
                                $totalIncomeItems = $totalIncomeItems + 1;
                            }
                            
                            if( $hasDeductionItem ) {
                                $totalDeductionItems = $totalDeductionItems + 1;
                            }
                        }
                    }
                }
                
                if( $payPeriodsWorked != $payPeriods ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => false,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Missing reconcilliation periods',
                        'fullDescription' => 
                            'The number of payslips for the employee [' . $payPeriodsWorked . 
                            '] do not match the number of periods of the reconciliation [' . 
                            $payPeriods . '].'
                    ];
                }
                
                // Are there too many income items?
                if( $totalIncomeItems > 20 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Too many income items on payslip',
                        'fullDescription' => 
                            'A maximum of 20 income codes must be used.'
                    ];
                }
                
                // Are there too many deduction items?
                if( $totalDeductionItems > 20 ) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'source' => $sqlEmployeeRow['alias'],
                        'value' =>  null,
                        'newValue' =>  null,
                        'description' => 'Too many deduction items on payslip',
                        'fullDescription' => 
                            'A maximum of 12 deduction codes must be used.'
                    ];
                }
            }
            
            return( ['ok' => true, 'exceptions' => $exceptions] );
        }
        
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
        
        // @param $data             The request data
        // @param $report           Name The name of the report
        // @param $headers          The report fieldnames
        private function writeReport($data, $reportName, $headers) {
            //set format
            $formatType = 'xls';
            
            if(isset($data['format']) && $data['format'] !== '') {
                if(in_array($data['format'], array('xls','csv','xlsx'))) {
                   $formatType = trim($data['format']);
                }
                if($formatType == 'xlsx' || $formatType == 'xls'){
                    $formatType = 'xlsx';
                }
            }
            
            // Create the file name for the report
            $fileName = $reportName .'_'. date('Ymd') . '.'.$formatType;
            
            $writer = null;
            if($formatType == 'xlsx') {
               $writer = WriterEntityFactory::createXLSXWriter();
            }
            else {
                $writer = WriterEntityFactory::createCSVWriter();
            }
            $writer->openToBrowser($fileName); 
            
            //wirte headers
            foreach($headers as $header ) {
                $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
            }
            
            return $writer;
        }
    }
?>