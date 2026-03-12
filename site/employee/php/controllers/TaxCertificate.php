<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('PayslipUtil.php');
    System::includeFile('LeaveUtil.php');
    
    
    //
    // USER CONTROLLER CLASS
    //
    
    class TaxCertificate extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to send certificate to self via email
        //
        // Required Parameters
        //  emailData            An array describing the emailData to send
        // 
        //  emailData = [
        //      'id'                    // The certificate id
        //  ]
        //
        public function send($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            foreach( $data['emailData'] as $certificate ) {
                $validationResult = Json::validate($certificate, [
                    'id' => ['type' => Json::TYPE_INT, 'nullable' => true]
                ]);
                if( $validationResult !== true ) {
                    echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                    return false;
                }
            }
            
            // Connect to the main database to check user's login
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the user email address
            $sqlQuery = 'SELECT email_address FROM employee_accounts WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $emailAddress = $sqlRow['email_address'];
            
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO ' . $_SESSION['dbCache']['schema'] . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Load the tax certificate template
            System::includeFile('tax_certificate_printing/TaxCertificatePrinterDefault.php');
            
            // Create a new tax certificate printer
            $printer = new TaxCertificatePrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create tax certificate template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] .'/payslip_images/';
            
            // Get saved config details
            $sqlQuery = 
                'SELECT ' .
                    'payslip_templates.id, payslip_template_config.name, payslip_template_config.value ' .
                'FROM ' .
                    'payslip_templates ' .
                'LEFT JOIN ' .
                    'payslip_template_config ON payslip_template_id = payslip_templates.id ' .
                'WHERE ' . 
                    'payslip_templates.name = \'default\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $config = [];
            
            // Create config array
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $skip = false;
                for ($i=0; $i < count($templateConfig); $i++) {
                    if ($sqlRow['name'] === $templateConfig[$i]['name']) {
                        if($templateConfig[$i]['type'] === 'image') {
                            if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                                $config[$sqlRow['name']] = $imageDir . $sqlRow['value'] . '.png';
                            }
                            $skip = true;
                            break;
                        }
                    }
                }
                if(!$skip){
                    $config[$sqlRow['name']] = $sqlRow['value'];
                }
            }
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir;
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Use the mailer module to send taxCertificates
            System::useModule('phpmailer');
            
            // For every tax certificate in the array
            foreach( $data['emailData'] as $taxCertificate ) {
                // Set time limit to 10 minutes
                set_time_limit(600);
                
                $taxCertificateId = $taxCertificate['id'];
                // $emailAddress = $taxCertificate['emailAddress'];
                
                // Get the tax certificate details
                $taxCertificateSqlQuery =
                    'SELECT ' .
                        'tax_certificates.id, tax_certificates.tax_reconciliation_id, tax_certificates.tax_certificate_type_code, ' .
                        'tax_certificates.reason_for_non_deduction, tax_certificates.number, tax_certificates.pay_periods, ' .
                        'tax_certificates.pay_periods_worked, tax_certificates.employee_id, tax_certificates.employee_nature, ' .
                        'tax_certificates.employee_sic_code, tax_certificates.employee_fixed_rate_income, ' .
                        'tax_certificates.employee_voluntary_over_deduction, tax_certificates.employee_directive_1, ' .
                        'tax_certificates.employee_directive_2, tax_certificates.employee_directive_3, tax_certificates.employee_surname, ' .
                        'tax_certificates.employee_first_names, tax_certificates.employee_initials, tax_certificates.employee_id_number, ' .
                        'tax_certificates.employee_passport_number, tax_certificates.employee_passport_country, ' .
                        'tax_certificates.employee_date_of_birth, tax_certificates.employee_income_tax_number, ' .
                        'tax_certificates.employee_number, tax_certificates.employee_employed_from, tax_certificates.employee_employed_to, ' .
                        'tax_certificates.employee_work_address_unit, tax_certificates.employee_work_address_complex, ' .
                        'tax_certificates.employee_work_address_street_number, tax_certificates.employee_work_address_street_name, ' .
                        'tax_certificates.employee_work_address_suburb, tax_certificates.employee_work_address_city, ' .
                        'tax_certificates.employee_work_address_postal_code, tax_certificates.employee_work_address_country_code, ' .
                        'tax_certificates.employee_residential_address_unit, tax_certificates.employee_residential_address_complex, ' .
                        'tax_certificates.employee_residential_address_street_number, tax_certificates.employee_residential_address_street_name, ' .
                        'tax_certificates.employee_residential_address_suburb, tax_certificates.employee_residential_address_city, ' .
                        'tax_certificates.employee_residential_address_postal_code, tax_certificates.employee_residential_address_country_code, ' .
                        'employee_country.name AS employee_country_name, ' .
                        'tax_certificates.employee_postal_address_line_1, tax_certificates.employee_postal_address_line_2, ' .
                        'tax_certificates.employee_postal_address_line_3, tax_certificates.employee_postal_address_line_4, ' .
                        'tax_certificates.employee_postal_address_code, tax_certificates.employee_postal_address_country_code, ' .
                        'tax_certificates.employee_home_number, tax_certificates.employee_work_number, tax_certificates.employee_cell_number, ' .
                        'tax_certificates.employee_fax_number, tax_certificates.employee_email_address, ' .
                        'tax_certificates.employee_financial_institution_code, tax_certificates.employee_financial_institution_name, ' .
                        'tax_certificates.employee_bank_account_type_code, tax_certificates.employee_account_number, ' .
                        'tax_certificates.employee_branch_code, tax_certificates.total_income, tax_certificates.total_taxable_income, ' .
                        'tax_certificates.total_non_taxable_income, tax_certificates.total_retirement_income, ' .
                        'tax_certificates.total_non_retirement_income, tax_certificates.total_deductions, ' .
                        'tax_certificates.total_paye_on_lump_sums, tax_certificates.total_medical_scheme_credit, ' .
                        'tax_certificates.total_medical_expenses, tax_certificates.total_standard_income_tax, ' .
                        'tax_certificates.total_paye, tax_certificates.total_tax, tax_certificates.total_uif, tax_certificates.total_sdl, ' .
                        'tax_reconciliations.sars_year, ' .
                        'tax_reconciliations.tax_reconciliation_period_code, ' .
                        'tax_reconciliations.employer_name, tax_reconciliations.employer_paye_number, ' .
                        'tax_reconciliations.employer_sdl_number, tax_reconciliations.employer_uif_number, ' .
                        'tax_reconciliations.employer_sic_code, tax_reconciliations.employer_eti_status_code, ' .
                        'tax_reconciliations.employer_special_economic_zone_code, ' .
                        'tax_reconciliations.employer_diplomatic_indemnity, ' .
                        'tax_reconciliations.employer_address_unit, tax_reconciliations.employer_address_complex, ' .
                        'tax_reconciliations.employer_address_street_number, tax_reconciliations.employer_address_street_name, ' .
                        'tax_reconciliations.employer_address_suburb, tax_reconciliations.employer_address_city, ' .
                        'tax_reconciliations.employer_address_postal_code, tax_reconciliations.employer_address_country_code, ' .
                        'employer_country.name AS employer_country_name, ' .
                        'tax_reconciliations.employer_contact_person_first_name, ' .
                        'tax_reconciliations.employer_contact_person_last_name, ' .
                        'tax_reconciliations.employer_contact_person_position, ' .
                        'tax_reconciliations.employer_contact_person_tel_number, ' .
                        'tax_reconciliations.employer_contact_person_fax_number, ' .
                        'tax_reconciliations.employer_contact_person_cell_number, ' .
                        'tax_reconciliations.employer_contact_person_email_address, ' .
                        'tax_reconciliations.note, tax_reconciliations.generated_on, ' .
                        'tax_certificate_types.name AS tax_certificate_type_name, ' .
                        'employees.alias, tax_reconciliation_periods.name AS tax_reconciliation_period_name, ' .
                        'full_names, last_name ' .
                    'FROM ' .
                        'tax_certificates ' .
                    'LEFT JOIN ' .
                        'tax_reconciliations ON tax_reconciliations.id = tax_certificates.tax_reconciliation_id ' .
                    'LEFT JOIN ' .
                        'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                    'LEFT JOIN ' .
                        'employees ON employees.id = tax_certificates.employee_id ' .
                    'LEFT JOIN ' .
                        'countries AS employer_country ON employer_country.code = tax_reconciliations.employer_address_country_code ' .
                    'LEFT JOIN ' .
                        'countries AS employee_country ON employee_country.code = tax_certificates.employee_residential_address_country_code ' .
                    'LEFT JOIN ' .
                        'tax_certificate_types ON tax_certificate_types.code = tax_certificates.tax_certificate_type_code ' .
                    'WHERE ' . 
                        'tax_certificates.employee_id = $1 AND ' .
                        'tax_certificates.id = $2;';
                $taxCertificateSqlResult = $db->paramQuery($taxCertificateSqlQuery, [
                    $user['employeeId'],            // tax_certificates.employee_id
                    $taxCertificateId               // tax_certificates.id
                ]);
                
                if( !$taxCertificateSqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $taxCertificateSqlRow = $taxCertificateSqlResult->fetchAssociative();
                
                $taxCertificateType = $taxCertificateSqlRow['tax_certificate_type_name'];
                
                // $string = $taxCertificateSqlRow['employer_address_unit'] . ',' .
                // $taxCertificateSqlRow['employer_address_complex'] . ',' .
                // $taxCertificateSqlRow['employer_address_street_number'] . ',' .
                // $taxCertificateSqlRow['employer_address_street_name'] . ',' .
                // $taxCertificateSqlRow['employer_address_suburb'] . ',' .
                // $taxCertificateSqlRow['employer_address_city'] . ',' .
                // $taxCertificateSqlRow['employer_country_name'];
                // $addressItems = explode(',', $string);
                
                $addressLine1 = '';
                $addressLine2 = '';
                $addressLine3 = '';
                $addressLine4 = '';
                
                // Specify the unit and complex
                if( trim($taxCertificateSqlRow['employer_address_unit']) !== '' ) {
                    $addressLine1 = $taxCertificateSqlRow['employer_address_unit'] . ' ' . trim($taxCertificateSqlRow['employer_address_complex']) . ', ';
                }
                else if( trim($taxCertificateSqlRow['employer_address_complex']) !== '' ) {
                    $addressLine1 = trim($taxCertificateSqlRow['employer_address_complex']) . ', ';
                }
                
                // Specify the street address
                if( $addressLine1 !== '' ) {
                    $addressLine2 = trim($taxCertificateSqlRow['employer_address_street_number']) . ' ' . trim($taxCertificateSqlRow['employer_address_street_name']) . ', ';
                }
                else {
                    $addressLine1 = trim($taxCertificateSqlRow['employer_address_street_number']) . ' ' . trim($taxCertificateSqlRow['employer_address_street_name']) . ', ';
                }
                
                // Specify the suburb
                if( $addressLine2 === '' ) {
                    $addressLine2 = $taxCertificateSqlRow['employer_address_suburb'] . ', ';
                }
                else {
                    $addressLine3 = $taxCertificateSqlRow['employer_address_suburb'] . ', ';
                }
                
                // Specify the city
                if( $addressLine3 !== '' ) {
                    $addressLine3 = $addressLine3 . $taxCertificateSqlRow['employer_address_city'] . ', ';
                }
                else {
                    $addressLine3 = $taxCertificateSqlRow['employer_address_city'] . ', ';
                }
                
                // Specify the country
                if( $addressLine4 === '' ) {
                    $addressLine4 = $taxCertificateSqlRow['employer_country_name'];
                }
                
                // Remove the comma from the last line
                if($addressLine2 === '') {
                    $addressLine1 = rtrim($addressLine1, ', ');
                }
                else if($addressLine3 === '') {
                    $addressLine2 = rtrim($addressLine2, ', ');
                }
                else if($addressLine4 === '') {
                    $addressLine3 = rtrim($addressLine3, ', ');
                }
                else {
                    $addressLine4 = rtrim($addressLine4, ', ');
                }
                
                // Set company details
                $companyLogo = '';
                $companyName = $taxCertificateSqlRow['employer_name'];
                $companyPayeReference = $taxCertificateSqlRow['employer_paye_number'];
                $companySdlReference = $taxCertificateSqlRow['employer_sdl_number'];
                $companyUifReference = $taxCertificateSqlRow['employer_uif_number'];
                $companyDiplomaticIndemnity = 'N';
                if( $taxCertificateSqlRow['employer_diplomatic_indemnity'] ) {
                    $companyDiplomaticIndemnity = 'Y';
                }
                $companyAddressLine1 = $addressLine1;
                $companyAddressLine2 = $addressLine2;
                $companyAddressLine3 = $addressLine3;
                $companyAddressLine4 = $addressLine4;
                
                $companyAddressPostalCode = $taxCertificateSqlRow['employer_address_postal_code'];
                
                // Set employee details
                $employeeNature = $taxCertificateSqlRow['employee_nature'];
                $employeeSurname = $taxCertificateSqlRow['employee_surname'];
                $employeeInitials = $taxCertificateSqlRow['employee_initials'];
                $employeeFullNames = $taxCertificateSqlRow['employee_first_names'];
                $employeeIdNumber = $taxCertificateSqlRow['employee_id_number'];
                $employeePassportNumber = $taxCertificateSqlRow['employee_passport_number'];
                $employeeBirthDate = str_replace('-', '', $taxCertificateSqlRow['employee_date_of_birth']);
                $employeeCompanyNumber = '';
                $employeeIncomeTaxNumber = $taxCertificateSqlRow['employee_income_tax_number'];
                $employeeNumber = $taxCertificateSqlRow['employee_number'];
                
                // $string = $taxCertificateSqlRow['employee_residential_address_unit'] . ',' .
                // $taxCertificateSqlRow['employee_residential_address_complex'] . ',' .
                // $taxCertificateSqlRow['employee_residential_address_street_number'] . ',' .
                // $taxCertificateSqlRow['employee_residential_address_street_name'] . ',' .
                // $taxCertificateSqlRow['employee_residential_address_suburb'] . ',' .
                // $taxCertificateSqlRow['employee_residential_address_city'] . ',' .
                // $taxCertificateSqlRow['employee_country_name'];
                // $addressList = explode(',', $string);
                
                $addressLine1 = '';
                $addressLine2 = '';
                $addressLine3 = '';
                $addressLine4 = '';
                
                // Specify the unit and complex
                if( trim($taxCertificateSqlRow['employee_residential_address_unit']) !== '' ) {
                    $addressLine1 = $taxCertificateSqlRow['employee_residential_address_unit'] . ' ' . trim($taxCertificateSqlRow['employee_residential_address_complex']) . ', ';
                }
                else if( trim($taxCertificateSqlRow['employee_residential_address_complex']) !== '' ) {
                    $addressLine1 = trim($taxCertificateSqlRow['employee_residential_address_complex']) . ', ';
                }
                
                // Specify the street address
                if( $addressLine1 !== '' ) {
                    $addressLine2 = trim($taxCertificateSqlRow['employee_residential_address_street_number']) . ' ' . trim($taxCertificateSqlRow['employee_residential_address_street_name']) . ', ';
                }
                else {
                    $addressLine1 = trim($taxCertificateSqlRow['employee_residential_address_street_number']) . ' ' . trim($taxCertificateSqlRow['employee_residential_address_street_name']) . ', ';
                }
                
                // Specify the suburb
                if( $addressLine2 === '' ) {
                    $addressLine2 = $taxCertificateSqlRow['employee_residential_address_suburb'] . ', ';
                }
                else {
                    $addressLine3 = $taxCertificateSqlRow['employee_residential_address_suburb'] . ', ';
                }
                
                // Specify the city
                if( $addressLine3 !== '' ) {
                    $addressLine3 = $addressLine3 . $taxCertificateSqlRow['employee_residential_address_city'] . ', ';
                }
                else {
                    $addressLine3 = $taxCertificateSqlRow['employee_residential_address_city'] . ', ';
                }
                
                // Specify the country
                if( $addressLine4 === '' ) {
                    $addressLine4 = $taxCertificateSqlRow['employee_country_name'];
                }
                
                // Remove the comma from the last line
                if($addressLine2 === '') {
                    $addressLine1 = rtrim($addressLine1, ', ');
                }
                else if($addressLine3 === '') {
                    $addressLine2 = rtrim($addressLine2, ', ');
                }
                else if($addressLine4 === '') {
                    $addressLine3 = rtrim($addressLine3, ', ');
                }
                else {
                    $addressLine4 = rtrim($addressLine4, ', ');
                }
                
                $employeeAddressLine1 = $addressLine1;
                $employeeAddressLine2 = $addressLine2;
                $employeeAddressLine3 = $addressLine3;
                $employeeAddressLine4 = $addressLine4;
                $employeeAddressPostalCode = $taxCertificateSqlRow['employee_residential_address_postal_code'];
                if ($taxCertificateSqlRow['employee_residential_address_postal_code'] === null) {
                    $employeeAddressPostalCode = '';
                }
                
                $employeeEmployedFromDate = str_replace('-', '', $taxCertificateSqlRow['employee_employed_from']);
                $employeeEmployedToDate = '';
                if( $taxCertificateSqlRow['employee_employed_to'] !== null ) {
                    $employeeEmployedToDate = str_replace('-', '', $taxCertificateSqlRow['employee_employed_to']);
                }
                $employeeVoluntaryOverDeduction = 'N';
                if( $taxCertificateSqlRow['employee_voluntary_over_deduction'] ) {
                    $employeeVoluntaryOverDeduction = 'Y';
                }
                $reasonForNonDeduction = $taxCertificateSqlRow['reason_for_non_deduction'];
                
                // Set the tax certificate details
                $taxCertificateNumber = $taxCertificateSqlRow['number'];
                $taxYear = $taxCertificateSqlRow['sars_year'];
                $taxYearPayPeriods = number_format($taxCertificateSqlRow['pay_periods'], 0, '.', '');
                $taxYearPayPeriodsWorked = number_format($taxCertificateSqlRow['pay_periods_worked'], 0, '.', '');
                $fixedRateIncome = 'N';
                if( $taxCertificateSqlRow['employee_fixed_rate_income'] ) {
                    $fixedRateIncome = 'Y';
                }
                $directiveNumber = '';
                $directive1 = $taxCertificateSqlRow['employee_directive_1'];
                $directive2 = $taxCertificateSqlRow['employee_directive_2'];
                $directive3 = $taxCertificateSqlRow['employee_directive_3'];
                
                $totalTaxableIncome = number_format($taxCertificateSqlRow['total_taxable_income'], 0, '.', ''); 
                $totalNonTaxableIncome = number_format($taxCertificateSqlRow['total_non_taxable_income'], 0, '.', '');
                $totalIncome = number_format($taxCertificateSqlRow['total_income'], 0, '.', '');
                $totalRetirementFundingIncome = number_format($taxCertificateSqlRow['total_retirement_income'], 0, '.', '');
                $totalNonRetirementFundingIncome = number_format($taxCertificateSqlRow['total_non_retirement_income'], 0, '.', '');
                
                $totalDeductions = number_format($taxCertificateSqlRow['total_deductions'], 0, '.', '');
                $totalSite = number_format($taxCertificateSqlRow['total_standard_income_tax'], 0, '.', '');
                $totalPaye = number_format($taxCertificateSqlRow['total_paye'], 0, '.', '');
                $totalUif = number_format($taxCertificateSqlRow['total_uif'], 0, '.', '');
                $totalSdl = number_format($taxCertificateSqlRow['total_sdl'], 0, '.', '');
                $totalTax = number_format($taxCertificateSqlRow['total_tax'], 0, '.', '');
                $totalPayeOnLumpSums = number_format($taxCertificateSqlRow['total_paye_on_lump_sums'], 0, '.', '');
                $totalMedicalSchemeCredit = number_format($taxCertificateSqlRow['total_medical_scheme_credit'], 0, '.', '');
                $totalMedicalExpensesCredit = number_format($taxCertificateSqlRow['total_medical_expenses'], 0, '.', '');
                
                // Get the tax certificate items
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
                $sqlItemResult = $db->paramQuery($sqlItemQuery, [$taxCertificateId]);
                if( !$sqlItemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Create employees array
                $incomeItems = [];
                $deductionItems = [];
                while( $sqlItemRow = $sqlItemResult->fetchAssociative() ) {
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
                            'amount' => number_format($sqlItemRow['amount'], 0, '.', '')
                        ];
                    }
                    else {
                        $deductionItems[] = [
                            'code' => $sqlItemRow['sars_code'], 
                            'description' => $description, 
                            'clearanceNumber' => '',
                            'amount' => number_format($sqlItemRow['amount'], 0, '.', '')
                        ];
                    }
                }
                
                // Clear previous printer details, if any
                $printer->clear();
                
                // Set config of the pdf
                $printer->setConfig($config);
                
                // Add the all the relevant details to the tax certificate printer
                $printer->setCertificateType($taxCertificateType);
                $printer->setCompanyName($companyName);
                $printer->setCompanyPayeReference($companyPayeReference);
                $printer->setCompanySdlReference($companySdlReference);
                $printer->setCompanyUifReference($companyUifReference);
                $printer->setCompanyDiplomaticIndemnity($companyDiplomaticIndemnity);
                $printer->setCompanyAddress($companyAddressLine1, $companyAddressLine2, $companyAddressLine3, $companyAddressLine4, $companyAddressPostalCode);
                
                $printer->setCompanyLogo($companyLogo);
                
                $printer->setEmployeeNature($employeeNature);
                $printer->setEmployeeSurname($employeeSurname);
                $printer->setEmployeeInitials($employeeInitials);
                $printer->setEmployeeFullNames($employeeFullNames);
                $printer->setEmployeeIdNumber($employeeIdNumber);
                $printer->setEmployeePassportNumber($employeePassportNumber);
                $printer->setEmployeeBirthDate($employeeBirthDate);
                $printer->setEmployeeCompanyNumber($employeeCompanyNumber);
                $printer->setEmployeeIncomeTaxNumber($employeeIncomeTaxNumber);
                $printer->setEmployeeNumber($employeeNumber);
                $printer->setEmployeeAddress($employeeAddressLine1, $employeeAddressLine2, $employeeAddressLine3, $employeeAddressLine4, $employeeAddressPostalCode);
                $printer->setEmployeeEmployedFromDate($employeeEmployedFromDate);
                $printer->setEmployeeEmployedToDate($employeeEmployedToDate);
                $printer->setEmployeeVoluntaryOverDeduction($employeeVoluntaryOverDeduction);
                
                $printer->setIrp5Number($taxCertificateNumber);
                $printer->setTaxYear($taxYear);
                $printer->setTaxYearPayPeriods($taxYearPayPeriods);
                $printer->settaxYearPayPeriodsWorked($taxYearPayPeriodsWorked);
                $printer->setFixedRateIncome($fixedRateIncome);
                $printer->setDirectiveNumber($directiveNumber);
                $printer->setDirective1($directive1);
                $printer->setDirective1($directive2);
                $printer->setDirective1($directive3);
                
                foreach( $incomeItems AS $item ) {
                    $printer->addIncomeItem($item['code'], $item['description'], $item['rfIndicator'], $item['amount']);
                }
                
                $printer->setTotalTaxableIncome($totalTaxableIncome);
                $printer->setTotalNonTaxableIncome($totalNonTaxableIncome);
                $printer->setTotalRetirementFundingIncome($totalRetirementFundingIncome);
                $printer->setTotalNonRetirementFundingIncome($totalNonRetirementFundingIncome);
                $printer->setTotalIncome($totalIncome);
                
                foreach( $deductionItems AS $item ) {
                    $printer->addDeductionItem($item['code'], $item['description'], $item['clearanceNumber'], $item['amount']);
                }
                
                $printer->setTotalDeductions($totalDeductions);
                $printer->setTotalSite($totalSite);
                $printer->setTotalPaye($totalPaye);
                $printer->setTotalUif($totalUif);
                $printer->setTotalSdl($totalSdl);
                $printer->setTotalTax($totalTax);
                $printer->setTotalPayeOnLumpSums($totalPayeOnLumpSums);
                $printer->setTotalMedicalSchemeCredit($totalMedicalSchemeCredit);
                $printer->setTotalMedicalExpensesCredit($totalMedicalExpensesCredit);
                $printer->setReasonForNonDeduction($reasonForNonDeduction);
                
                // Print the tax certificate
                $printer->printTaxCertificate();
                
                // Create a random filename for the irp5
                $filename = '';
                for ($i = 0; $i < 32; $i++) {
                    $filename = $filename . $characters[rand(0, $charactersLength - 1)];
                }
                $filename = $destDir . '/' . $filename . '.pdf';
                
                // Save the file
                $printer->saveToFile($filename);
                
                // Send the email
                $mail = new PHPMailer\PHPMailer\PHPMailer();
                
                //Set SMPT settings
                $mail->isSMTP();
                $mail->Host = CONF_SMTP_HOST;
                $mail->Port = CONF_SMTP_PORT;
                $mail->charSet = 'UTF-8';
                $mail->SMTPAuth = true;
                $mail->Username = CONF_SMTP_USERNAME;
                $mail->Password = CONF_SMTP_PASSW;
            
                //Recipients
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->addAddress($emailAddress, $taxCertificateSqlRow['alias']);
            
                // Add the tax certificate as an attachment
                $mail->addAttachment($filename, 'irp5_' . strtolower($taxCertificateSqlRow['number']) . '.pdf');
                
                // Set the email text
                $htmlBody = 
                    'Dear ' . $taxCertificateSqlRow['alias'] . ',<br><br>' .
                    'Please find the attached ' . strtolower($taxCertificateSqlRow['tax_reconciliation_period_name']) . ' tax certificate for <b>' . $taxCertificateSqlRow['full_names'] . ' ' . $taxCertificateSqlRow['last_name'] . '</b> for the <b>' . $taxCertificateSqlRow['sars_year']  . '</b> tax year.<br><br>' .
                    'If you have any queries, please don\'t hesitate to contact us.<br><br>' .
                    'Regards,<br><br>' .
                    'HR Department,<br><br>' .
                    $companyName;
                
                $plainTexBody = 
                    "Dear " . $taxCertificateSqlRow['alias'] . ",\r\n\r\n" .
                    "Please find the attached " . strtolower($taxCertificateSqlRow['tax_reconciliation_period_name']) . " tax certificate for " . $taxCertificateSqlRow['full_names'] . " " . $taxCertificateSqlRow['last_name'] . " for the " . $taxCertificateSqlRow['sars_year'] . " tax year.\r\n\r\n" .
                    "If you have any queries, please don\'t hesitate to contact us.\r\n\r\n" .
                    "Regards,\r\n\r\n" .
                    "HR Department,\r\n\r\n" .
                    $companyName;
                
                // Set the email content
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = 'Tax certificate for the ' . $taxCertificateSqlRow['sars_year'] . ' tax year';
                $mail->Body    = $htmlBody;
                $mail->AltBody = $plainTexBody;
                
                // Send the email
                $mail->send();
                
                // Delete the PDF
                unlink($filename);
            }
            
            // Delete the temp folder
            rmdir($destDir);
            
            echo( json_encode(['ok' => true]) );
            
            return true;
        }
        
        // Function to a list of tax certificate types
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getTypeList($data, $user, $db) {
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
                    'tax_certificate_types.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
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
            
            // Load types from database
            $sqlQuery =
                'SELECT ' .
                    'tax_certificate_types.code AS type_code, ' . 
                    'tax_certificate_types.name AS type_name ' . 
                'FROM ' .
                    'tax_certificate_types ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'tax_certificate_types.name ' . $data['sortOrder'] . ' ' . $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $types = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $types[] = [
                    'code' => $sqlRow['type_code'],
                    'name' => $sqlRow['type_name']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'types' => $types]) );
            return true;
        }
        
        // Function to list certificates
        //
        // Required Parameters
        //  taxCertificateId               The id of the certificate to download
        //
        public function download($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxCertificateId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the irp5 template
            System::includeFile('tax_certificate_printing/TaxCertificatePrinterDefault.php');
            
            // Create a new tax certificate printer
            $printer = new TaxCertificatePrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create tax certificate template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] .'/payslip_images/';
            
            // Get saved config details
            $sqlQuery = 
                'SELECT ' .
                    'payslip_templates.id, payslip_template_config.name, payslip_template_config.value ' .
                'FROM ' .
                    'payslip_templates ' .
                'LEFT JOIN ' .
                    'payslip_template_config ON payslip_template_id = payslip_templates.id ' .
                'WHERE ' . 
                    'payslip_templates.name = \'default\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $config = [];
            
            // Create config array
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $skip = false;
                for ($i=0; $i < count($templateConfig); $i++) {
                    if ($sqlRow['name'] === $templateConfig[$i]['name']) {
                        if($templateConfig[$i]['type'] === 'image') {
                            if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                                $config[$sqlRow['name']] = $imageDir . $sqlRow['value'] . '.png';
                            }
                            $skip = true;
                            break;
                        }
                    }
                }
                if(!$skip){
                    $config[$sqlRow['name']] = $sqlRow['value'];
                }
            }
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir;
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Get the tax certificate details
            $sqlQuery =
                'SELECT ' .
                    'tax_certificates.id, tax_certificates.tax_reconciliation_id, tax_certificates.tax_certificate_type_code, ' .
                    'tax_certificates.reason_for_non_deduction, tax_certificates.number, tax_certificates.pay_periods, ' .
                    'tax_certificates.pay_periods_worked, tax_certificates.employee_id, tax_certificates.employee_nature, ' .
                    'tax_certificates.employee_sic_code, tax_certificates.employee_fixed_rate_income, ' .
                    'tax_certificates.employee_voluntary_over_deduction, tax_certificates.employee_directive_1, ' .
                    'tax_certificates.employee_directive_2, tax_certificates.employee_directive_3, tax_certificates.employee_surname, ' .
                    'tax_certificates.employee_first_names, tax_certificates.employee_initials, tax_certificates.employee_id_number, ' .
                    'tax_certificates.employee_passport_number, tax_certificates.employee_passport_country, ' .
                    'tax_certificates.employee_date_of_birth, tax_certificates.employee_income_tax_number, ' .
                    'tax_certificates.employee_number, tax_certificates.employee_employed_from, tax_certificates.employee_employed_to, ' .
                    'tax_certificates.employee_work_address_unit, tax_certificates.employee_work_address_complex, ' .
                    'tax_certificates.employee_work_address_street_number, tax_certificates.employee_work_address_street_name, ' .
                    'tax_certificates.employee_work_address_suburb, tax_certificates.employee_work_address_city, ' .
                    'tax_certificates.employee_work_address_postal_code, tax_certificates.employee_work_address_country_code, ' .
                    'tax_certificates.employee_residential_address_unit, tax_certificates.employee_residential_address_complex, ' .
                    'tax_certificates.employee_residential_address_street_number, tax_certificates.employee_residential_address_street_name, ' .
                    'tax_certificates.employee_residential_address_suburb, tax_certificates.employee_residential_address_city, ' .
                    'tax_certificates.employee_residential_address_postal_code, tax_certificates.employee_residential_address_country_code, ' .
                    'employee_country.name AS employee_country_name, ' .
                    'tax_certificates.employee_postal_address_line_1, tax_certificates.employee_postal_address_line_2, ' .
                    'tax_certificates.employee_postal_address_line_3, tax_certificates.employee_postal_address_line_4, ' .
                    'tax_certificates.employee_postal_address_code, tax_certificates.employee_postal_address_country_code, ' .
                    'tax_certificates.employee_home_number, tax_certificates.employee_work_number, tax_certificates.employee_cell_number, ' .
                    'tax_certificates.employee_fax_number, tax_certificates.employee_email_address, ' .
                    'tax_certificates.employee_financial_institution_code, tax_certificates.employee_financial_institution_name, ' .
                    'tax_certificates.employee_bank_account_type_code, tax_certificates.employee_account_number, ' .
                    'tax_certificates.employee_branch_code, tax_certificates.total_income, tax_certificates.total_taxable_income, ' .
                    'tax_certificates.total_non_taxable_income, tax_certificates.total_retirement_income, ' .
                    'tax_certificates.total_non_retirement_income, tax_certificates.total_deductions, ' .
                    'tax_certificates.total_paye_on_lump_sums, tax_certificates.total_medical_scheme_credit, ' .
                    'tax_certificates.total_medical_expenses, tax_certificates.total_standard_income_tax, ' .
                    'tax_certificates.total_paye, tax_certificates.total_tax, tax_certificates.total_uif, tax_certificates.total_sdl, ' .
                    'tax_reconciliations.sars_year, ' .
                    'tax_reconciliations.tax_reconciliation_period_code, ' .
                    'tax_reconciliations.employer_name, tax_reconciliations.employer_paye_number, ' .
                    'tax_reconciliations.employer_sdl_number, tax_reconciliations.employer_uif_number, ' .
                    'tax_reconciliations.employer_sic_code, tax_reconciliations.employer_eti_status_code, ' .
                    'tax_reconciliations.employer_special_economic_zone_code, ' .
                    'tax_reconciliations.employer_diplomatic_indemnity, ' .
                    'tax_reconciliations.employer_address_unit, tax_reconciliations.employer_address_complex, ' .
                    'tax_reconciliations.employer_address_street_number, tax_reconciliations.employer_address_street_name, ' .
                    'tax_reconciliations.employer_address_suburb, tax_reconciliations.employer_address_city, ' .
                    'tax_reconciliations.employer_address_postal_code, tax_reconciliations.employer_address_country_code, ' .
                    'employer_country.name AS employer_country_name, ' .
                    'tax_reconciliations.employer_contact_person_first_name, ' .
                    'tax_reconciliations.employer_contact_person_last_name, ' .
                    'tax_reconciliations.employer_contact_person_position, ' .
                    'tax_reconciliations.employer_contact_person_tel_number, ' .
                    'tax_reconciliations.employer_contact_person_fax_number, ' .
                    'tax_reconciliations.employer_contact_person_cell_number, ' .
                    'tax_reconciliations.employer_contact_person_email_address, ' .
                    'tax_reconciliations.note, tax_reconciliations.generated_on, ' .
                    'tax_certificate_types.name AS tax_certificate_type_name ' .
                'FROM ' .
                    'tax_certificates ' .
                'LEFT JOIN ' .
                    'tax_reconciliations ON tax_reconciliations.id = tax_certificates.tax_reconciliation_id ' .
                'LEFT JOIN ' .
                    'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = tax_certificates.employee_id ' .
                'LEFT JOIN ' .
                    'countries AS employer_country ON employer_country.code = tax_reconciliations.employer_address_country_code ' .
                'LEFT JOIN ' .
                    'countries AS employee_country ON employee_country.code = tax_certificates.employee_residential_address_country_code ' .
                'LEFT JOIN ' .
                    'tax_certificate_types ON tax_certificate_types.code = tax_certificates.tax_certificate_type_code ' .
                'WHERE ' . 
                    'tax_certificates.employee_id = $1 AND ' .
                    'tax_certificates.id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $user['employeeId'],            // tax_certificates.employee_id
                $data['taxCertificateId']       // tax_certificates.id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            $taxCertificateType = $sqlRow['tax_certificate_type_name'];
            
            // $string = $sqlRow['employer_address_unit'] . ',' .
            // $sqlRow['employer_address_complex'] . ',' .
            // $sqlRow['employer_address_street_number'] . ',' .
            // $sqlRow['employer_address_street_name'] . ',' .
            // $sqlRow['employer_address_suburb'] . ',' .
            // $sqlRow['employer_address_city'] . ',' .
            // $sqlRow['employer_country_name'];
            // $addressItems = explode(',', $string);
            
            $addressLine1 = '';
            $addressLine2 = '';
            $addressLine3 = '';
            $addressLine4 = '';
            
            // Specify the unit and complex
            if( trim($sqlRow['employer_address_unit']) !== '' ) {
                $addressLine1 = $sqlRow['employer_address_unit'] . ' ' . trim($sqlRow['employer_address_complex']) . ', ';
            }
            else if( trim($sqlRow['employer_address_complex']) !== '' ) {
                $addressLine1 = trim($sqlRow['employer_address_complex']) . ', ';
            }
            
            // Specify the street address
            if( $addressLine1 !== '' ) {
                $addressLine2 = trim($sqlRow['employer_address_street_number']) . ' ' . trim($sqlRow['employer_address_street_name']) . ', ';
            }
            else {
                $addressLine1 = trim($sqlRow['employer_address_street_number']) . ' ' . trim($sqlRow['employer_address_street_name']) . ', ';
            }
            
            // Specify the suburb
            if( $addressLine2 === '' ) {
                $addressLine2 = $sqlRow['employer_address_suburb'] . ', ';
            }
            else {
                $addressLine3 = $sqlRow['employer_address_suburb'] . ', ';
            }
            
            // Specify the city
            if( $addressLine3 !== '' ) {
                $addressLine3 = $addressLine3 . $sqlRow['employer_address_city'] . ', ';
            }
            else {
                $addressLine3 = $sqlRow['employer_address_city'] . ', ';
            }
            
            // Specify the country
            if( $addressLine4 === '' ) {
                $addressLine4 = $sqlRow['employer_country_name'];
            }
            
            // Remove the comma from the last line
            if($addressLine2 === '') {
                $addressLine1 = rtrim($addressLine1, ', ');
            }
            else if($addressLine3 === '') {
                $addressLine2 = rtrim($addressLine2, ', ');
            }
            else if($addressLine4 === '') {
                $addressLine3 = rtrim($addressLine3, ', ');
            }
            else {
                $addressLine4 = rtrim($addressLine4, ', ');
            }
            
            // Set company details
            $companyLogo = '';
            $companyName = $sqlRow['employer_name'];
            $companyPayeReference = $sqlRow['employer_paye_number'];
            $companySdlReference = $sqlRow['employer_sdl_number'];
            $companyUifReference = $sqlRow['employer_uif_number'];
            $companyDiplomaticIndemnity = 'N';
            if( $sqlRow['employer_diplomatic_indemnity'] ) {
                $companyDiplomaticIndemnity = 'Y';
            }
            $companyAddressLine1 = $addressLine1;
            $companyAddressLine2 = $addressLine2;
            $companyAddressLine3 = $addressLine3;
            $companyAddressLine4 = $addressLine4;
            $companyAddressPostalCode = $sqlRow['employer_address_postal_code'];
            
            // Set employee details
            $employeeNature = $sqlRow['employee_nature'];
            $employeeSurname = $sqlRow['employee_surname'];
            $employeeInitials = $sqlRow['employee_initials'];
            $employeeFullNames = $sqlRow['employee_first_names'];
            $employeeIdNumber = $sqlRow['employee_id_number'];
            $employeePassportNumber = $sqlRow['employee_passport_number'];
            $employeeBirthDate = str_replace('-', '', $sqlRow['employee_date_of_birth']);
            $employeeCompanyNumber = '';
            $employeeIncomeTaxNumber = $sqlRow['employee_income_tax_number'];
            $employeeNumber = $sqlRow['employee_number'];
            
            // $string = $sqlRow['employee_residential_address_unit'] . ',' .
            // $sqlRow['employee_residential_address_complex'] . ',' .
            // $sqlRow['employee_residential_address_street_number'] . ',' .
            // $sqlRow['employee_residential_address_street_name'] . ',' .
            // $sqlRow['employee_residential_address_suburb'] . ',' .
            // $sqlRow['employee_residential_address_city'] . ',' .
            // $sqlRow['employee_country_name'];
            // $addressList = explode(',', $string);
            
            $addressLine1 = '';
            $addressLine2 = '';
            $addressLine3 = '';
            $addressLine4 = '';
            
            // Specify the unit and complex
            if( trim($sqlRow['employee_residential_address_unit']) !== '' ) {
                $addressLine1 = $sqlRow['employee_residential_address_unit'] . ' ' . trim($sqlRow['employee_residential_address_complex']) . ', ';
            }
            else if( trim($sqlRow['employee_residential_address_complex']) !== '' ) {
                $addressLine1 = trim($sqlRow['employee_residential_address_complex']) . ', ';
            }
            
            // Specify the street address
            if( $addressLine1 !== '' ) {
                $addressLine2 = trim($sqlRow['employee_residential_address_street_number']) . ' ' . trim($sqlRow['employee_residential_address_street_name']) . ', ';
            }
            else {
                $addressLine1 = trim($sqlRow['employee_residential_address_street_number']) . ' ' . trim($sqlRow['employee_residential_address_street_name']) . ', ';
            }
            
            // Specify the suburb
            if( $addressLine2 === '' ) {
                $addressLine2 = $sqlRow['employee_residential_address_suburb'] . ', ';
            }
            else {
                $addressLine3 = $sqlRow['employee_residential_address_suburb'] . ', ';
            }
            
            // Specify the city
            if( $addressLine3 !== '' ) {
                $addressLine3 = $addressLine3 . $sqlRow['employee_residential_address_city'] . ', ';
            }
            else {
                $addressLine3 = $sqlRow['employee_residential_address_city'] . ', ';
            }
            
            // Specify the country
            if( $addressLine4 === '' ) {
                $addressLine4 = $sqlRow['employee_country_name'];
            }
            
            // Remove the comma from the last line
            if($addressLine2 === '') {
                $addressLine1 = rtrim($addressLine1, ', ');
            }
            else if($addressLine3 === '') {
                $addressLine2 = rtrim($addressLine2, ', ');
            }
            else if($addressLine4 === '') {
                $addressLine3 = rtrim($addressLine3, ', ');
            }
            else {
                $addressLine4 = rtrim($addressLine4, ', ');
            }
            
            $employeeAddressLine1 = $addressLine1;
            $employeeAddressLine2 = $addressLine2;
            $employeeAddressLine3 = $addressLine3;
            $employeeAddressLine4 = $addressLine4;
            $employeeAddressPostalCode = $sqlRow['employee_residential_address_postal_code'];
            $employeeEmployedFromDate = str_replace('-', '', $sqlRow['employee_employed_from']);
            $employeeEmployedToDate = '';
            if( $sqlRow['employee_employed_to'] !== null ) {
                $employeeEmployedToDate = str_replace('-', '', $sqlRow['employee_employed_to']);
            }
            $employeeVoluntaryOverDeduction = 'N';
            if( $sqlRow['employee_voluntary_over_deduction'] ) {
                $employeeVoluntaryOverDeduction = 'Y';
            }
            $reasonForNonDeduction = $sqlRow['reason_for_non_deduction'];
            
            // Set the tax certificate details
            $taxCertificateNumber = $sqlRow['number'];
            $taxYear = $sqlRow['sars_year'];
            $taxYearPayPeriods = number_format($sqlRow['pay_periods'], 0, '.', '');
            $taxYearPayPeriodsWorked = number_format($sqlRow['pay_periods_worked'], 0, '.', '');
            $fixedRateIncome = 'N';
            if( $sqlRow['employee_fixed_rate_income'] ) {
                $fixedRateIncome = 'Y';
            }
            $directiveNumber = '';
            $directive1 = $sqlRow['employee_directive_1'];
            $directive2 = $sqlRow['employee_directive_2'];
            $directive3 = $sqlRow['employee_directive_3'];
            
            $totalTaxableIncome = number_format($sqlRow['total_taxable_income'], 0, '.', ''); 
            $totalNonTaxableIncome = number_format($sqlRow['total_non_taxable_income'], 0, '.', '');
            $totalIncome = number_format($sqlRow['total_income'], 0, '.', '');
            $totalRetirementFundingIncome = number_format($sqlRow['total_retirement_income'], 0, '.', '');
            $totalNonRetirementFundingIncome = number_format($sqlRow['total_non_retirement_income'], 0, '.', '');
            
            $totalDeductions = number_format($sqlRow['total_deductions'], 0, '.', '');
            $totalSite = number_format($sqlRow['total_standard_income_tax'], 0, '.', '');
            $totalPaye = number_format($sqlRow['total_paye'], 0, '.', '');
            $totalUif = number_format($sqlRow['total_uif'], 0, '.', '');
            $totalSdl = number_format($sqlRow['total_sdl'], 0, '.', '');
            $totalTax = number_format($sqlRow['total_tax'], 0, '.', '');
            $totalPayeOnLumpSums = number_format($sqlRow['total_paye_on_lump_sums'], 0, '.', '');
            $totalMedicalSchemeCredit = number_format($sqlRow['total_medical_scheme_credit'], 0, '.', '');
            $totalMedicalExpensesCredit = number_format($sqlRow['total_medical_expenses'], 0, '.', '');
            
            // Get the tax certificate items
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
            $sqlItemResult = $db->paramQuery($sqlItemQuery, [$data['taxCertificateId']]);
            if( !$sqlItemResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $incomeItems = [];
            $deductionItems = [];
            while( $sqlItemRow = $sqlItemResult->fetchAssociative() ) {
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
                        'amount' => number_format($sqlItemRow['amount'], 0, '.', '')
                    ];
                }
                else {
                    $deductionItems[] = [
                        'code' => $sqlItemRow['sars_code'], 
                        'description' => $description, 
                        'clearanceNumber' => '',
                        'amount' => number_format($sqlItemRow['amount'], 0, '.', '')
                    ];
                }
            }
            
            // Clear previous printer details, if any
            $printer->clear();
            
            // Set config of the pdf
            $printer->setConfig($config);
            
            // Add the all the relevant details to the tax certificate printer
            $printer->setCertificateType($taxCertificateType);
            $printer->setCompanyName($companyName);
            $printer->setCompanyPayeReference($companyPayeReference);
            $printer->setCompanySdlReference($companySdlReference);
            $printer->setCompanyUifReference($companyUifReference);
            $printer->setCompanyDiplomaticIndemnity($companyDiplomaticIndemnity);
            $printer->setCompanyAddress($companyAddressLine1, $companyAddressLine2, $companyAddressLine3, $companyAddressLine4, $companyAddressPostalCode);
            $printer->setCompanyLogo($companyLogo);
            
            $printer->setEmployeeNature($employeeNature);
            $printer->setEmployeeSurname($employeeSurname);
            $printer->setEmployeeInitials($employeeInitials);
            $printer->setEmployeeFullNames($employeeFullNames);
            $printer->setEmployeeIdNumber($employeeIdNumber);
            $printer->setEmployeePassportNumber($employeePassportNumber);
            $printer->setEmployeeBirthDate($employeeBirthDate);
            $printer->setEmployeeCompanyNumber($employeeCompanyNumber);
            $printer->setEmployeeIncomeTaxNumber($employeeIncomeTaxNumber);
            $printer->setEmployeeNumber($employeeNumber);
            $printer->setEmployeeAddress($employeeAddressLine1, $employeeAddressLine2, $employeeAddressLine3, $employeeAddressLine4, $employeeAddressPostalCode);
            $printer->setEmployeeEmployedFromDate($employeeEmployedFromDate);
            $printer->setEmployeeEmployedToDate($employeeEmployedToDate);
            $printer->setEmployeeVoluntaryOverDeduction($employeeVoluntaryOverDeduction);
            
            $printer->setIrp5Number($taxCertificateNumber);
            $printer->setTaxYear($taxYear);
            $printer->setTaxYearPayPeriods($taxYearPayPeriods);
            $printer->settaxYearPayPeriodsWorked($taxYearPayPeriodsWorked);
            $printer->setFixedRateIncome($fixedRateIncome);
            $printer->setDirectiveNumber($directiveNumber);
            $printer->setDirective1($directive1);
            $printer->setDirective1($directive2);
            $printer->setDirective1($directive3);
            
            foreach( $incomeItems AS $item ) {
                $printer->addIncomeItem($item['code'], $item['description'], $item['rfIndicator'], $item['amount']);
            }
            
            $printer->setTotalTaxableIncome($totalTaxableIncome);
            $printer->setTotalNonTaxableIncome($totalNonTaxableIncome);
            $printer->setTotalRetirementFundingIncome($totalRetirementFundingIncome);
            $printer->setTotalNonRetirementFundingIncome($totalNonRetirementFundingIncome);
            $printer->setTotalIncome($totalIncome);
            
            foreach( $deductionItems AS $item ) {
                $printer->addDeductionItem($item['code'], $item['description'], $item['clearanceNumber'], $item['amount']);
            }
            
            $printer->setTotalDeductions($totalDeductions);
            $printer->setTotalSite($totalSite);
            $printer->setTotalPaye($totalPaye);
            $printer->setTotalUif($totalUif);
            $printer->setTotalSdl($totalSdl);
            $printer->setTotalTax($totalTax);
            $printer->setTotalPayeOnLumpSums($totalPayeOnLumpSums);
            $printer->setTotalMedicalSchemeCredit($totalMedicalSchemeCredit);
            $printer->setTotalMedicalExpensesCredit($totalMedicalExpensesCredit);
            $printer->setReasonForNonDeduction($reasonForNonDeduction);
            
            // Print the tax certificate
            $printer->printTaxCertificate();
            
            // Create a random filename for the irp5
            $filename = '';
            for ($i = 0; $i < 32; $i++) {
                $filename = $filename . $characters[rand(0, $charactersLength - 1)];
            }
            $filename = $destDir . '/' . $filename . '.pdf';
            
            // Erase the output buffer and turn off output buffering
            ob_end_clean();
            
            // Download the file
            $printer->output($filename);
            unset($printer);
            
            // Delete the temp folder
            rmdir($destDir);
        }
        
        
        // Function to list tax certificate details
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  employeeId              Limit tax certificate details to only the selected employee
        //  taxYear                 Limit tax certificate details to only the selected tax year
        //  periodCode                Limit tax certificate details to only the selected type
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'reconciliationId' => null,
                'employeeId' => null,
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
                'reconciliationId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'taxYear' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'periodCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            $whereClause = '';
            
            // List only the tax certificates for the specified user
            $sqlParams[] = $user['employeeId'];
            $whereClause = 'WHERE ( tax_certificates.employee_id = $' . count($sqlParams) . ' AND  tax_certificates.self_service_access = TRUE ) ';
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 'AND ( ';
                $whereClause = $whereClause . '(employees.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(tax_certificates.number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(tax_reconciliation_periods.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(CAST(tax_reconciliations.sars_year AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(CAST(tax_reconciliations.sars_year - 1 AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ') ';
            }
            
            // Was a reconciliation filter specfied?
            if( isset($data['reconciliationId']) && $data['reconciliationId'] !== '' ) {
                if( $whereClause === '' ) {
                    $whereClause = $whereClause . 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                $sqlParams[] = $data['reconciliationId'];
                $whereClause = $whereClause . ' (tax_reconciliation_id = $' . count($sqlParams) . ') ';
            }
            
            // Was an employee filter specfied?
            if( isset($data['employeeId']) && $data['employeeId'] !== '' ) {
                if( $whereClause === '' ) {
                    $whereClause = $whereClause . 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                $sqlParams[] = $data['employeeId'];
                $whereClause = $whereClause . ' (employee_id = $' . count($sqlParams) . ') ';
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
            
            // Get the tax certificates
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
                    'tax_certificates.self_service_access, ' .
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
                $whereClause .
                'ORDER BY ' .
                    'sars_year ' . $data['sortOrder'] . ', ' . 
                    'tax_reconciliation_period_code DESC, ' . 
                    'generated_on DESC, ' .
                    'employees.alias ASC ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            
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
                    'selfServiceAccess' => $sqlRow['self_service_access'],
                    'taxYear' => $sqlRow['sars_year'],
                    'periodCode' => $sqlRow['period_code'],
                    'periodName' => $sqlRow['period_name'],
                    'generatedOn' => $sqlRow['generated_on']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'certificates' => $certificates]) );
            return true;
        }
        
        // Function to get the tax certificate details
        //
        // Required Parameters
        //  taxCertificateId              The id of the tax certificate details to get
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
                'taxCertificateId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the tax certificate details
            $sqlQuery =
                'SELECT ' .
                    'tax_certificates.id, tax_certificates.tax_reconciliation_id, tax_certificates.tax_certificate_type_code, ' .
                    'tax_certificates.reason_for_non_deduction, tax_certificates.number, tax_certificates.pay_periods, ' .
                    'tax_certificates.pay_periods_worked, tax_certificates.employee_id, tax_certificates.employee_nature, ' .
                    'tax_certificates.employee_sic_code, tax_certificates.employee_fixed_rate_income, ' .
                    'tax_certificates.employee_voluntary_over_deduction, tax_certificates.employee_directive_1, ' .
                    'tax_certificates.employee_directive_2, tax_certificates.employee_directive_3, tax_certificates.employee_surname, ' .
                    'tax_certificates.employee_first_names, tax_certificates.employee_initials, tax_certificates.employee_id_number, ' .
                    'tax_certificates.employee_passport_number, tax_certificates.employee_passport_country, ' .
                    'tax_certificates.employee_date_of_birth, tax_certificates.employee_income_tax_number, ' .
                    'tax_certificates.employee_number, tax_certificates.employee_employed_from, tax_certificates.employee_employed_to, ' .
                    'tax_certificates.employee_work_address_unit, tax_certificates.employee_work_address_complex, ' .
                    'tax_certificates.employee_work_address_street_number, tax_certificates.employee_work_address_street_name, ' .
                    'tax_certificates.employee_work_address_suburb, tax_certificates.employee_work_address_city, ' .
                    'tax_certificates.employee_work_address_postal_code, tax_certificates.employee_work_address_country_code, ' .
                    'tax_certificates.employee_residential_address_unit, tax_certificates.employee_residential_address_complex, ' .
                    'tax_certificates.employee_residential_address_street_number, tax_certificates.employee_residential_address_street_name, ' .
                    'tax_certificates.employee_residential_address_suburb, tax_certificates.employee_residential_address_city, ' .
                    'tax_certificates.employee_residential_address_postal_code, tax_certificates.employee_residential_address_country_code, ' .
                    'employee_country.name AS employee_country_name, ' .
                    'tax_certificates.employee_postal_address_line_1, tax_certificates.employee_postal_address_line_2, ' .
                    'tax_certificates.employee_postal_address_line_3, tax_certificates.employee_postal_address_line_4, ' .
                    'tax_certificates.employee_postal_address_code, tax_certificates.employee_postal_address_country_code, ' .
                    'tax_certificates.employee_home_number, tax_certificates.employee_work_number, tax_certificates.employee_cell_number, ' .
                    'tax_certificates.employee_fax_number, tax_certificates.employee_email_address, ' .
                    'tax_certificates.employee_financial_institution_code, tax_certificates.employee_financial_institution_name, ' .
                    'tax_certificates.employee_bank_account_type_code, tax_certificates.employee_account_number, ' .
                    'tax_certificates.employee_branch_code, tax_certificates.total_income, tax_certificates.total_taxable_income, ' .
                    'tax_certificates.total_non_taxable_income, tax_certificates.total_retirement_income, ' .
                    'tax_certificates.total_non_retirement_income, tax_certificates.total_deductions, ' .
                    'tax_certificates.total_paye_on_lump_sums, tax_certificates.total_medical_scheme_credit, ' .
                    'tax_certificates.total_medical_expenses, tax_certificates.total_standard_income_tax, ' .
                    'tax_certificates.total_paye, tax_certificates.total_tax, tax_certificates.total_uif, tax_certificates.total_sdl, ' .
                    'tax_reconciliations.sars_year, ' .
                    'tax_reconciliations.tax_reconciliation_period_code, ' .
                    'tax_reconciliations.employer_name, tax_reconciliations.employer_paye_number, ' .
                    'tax_reconciliations.employer_sdl_number, tax_reconciliations.employer_uif_number, ' .
                    'tax_reconciliations.employer_sic_code, tax_reconciliations.employer_eti_status_code, ' .
                    'tax_reconciliations.employer_special_economic_zone_code, ' .
                    'tax_reconciliations.employer_diplomatic_indemnity, ' .
                    'tax_reconciliations.employer_address_unit, tax_reconciliations.employer_address_complex, ' .
                    'tax_reconciliations.employer_address_street_number, tax_reconciliations.employer_address_street_name, ' .
                    'tax_reconciliations.employer_address_suburb, tax_reconciliations.employer_address_city, ' .
                    'tax_reconciliations.employer_address_postal_code, tax_reconciliations.employer_address_country_code, ' .
                    'employer_country.name AS employer_country_name, ' .
                    'tax_reconciliations.employer_contact_person_first_name, ' .
                    'tax_reconciliations.employer_contact_person_last_name, ' .
                    'tax_reconciliations.employer_contact_person_position, ' .
                    'tax_reconciliations.employer_contact_person_tel_number, ' .
                    'tax_reconciliations.employer_contact_person_fax_number, ' .
                    'tax_reconciliations.employer_contact_person_cell_number, ' .
                    'tax_reconciliations.employer_contact_person_email_address, ' .
                    'tax_reconciliations.note, tax_reconciliations.generated_on, ' .
                    'tax_certificate_types.name AS tax_certificate_type_name, ' .
                    'tax_reconciliation_periods.name AS period_name ' .
                'FROM ' .
                    'tax_certificates ' .
                'LEFT JOIN ' .
                    'tax_reconciliations ON tax_reconciliations.id = tax_certificates.tax_reconciliation_id ' .
                'LEFT JOIN ' .
                    'tax_reconciliation_periods ON tax_reconciliation_periods.code = tax_reconciliations.tax_reconciliation_period_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = tax_certificates.employee_id ' .
                'LEFT JOIN ' .
                    'countries AS employer_country ON employer_country.code = tax_reconciliations.employer_address_country_code ' .
                'LEFT JOIN ' .
                    'countries AS employee_country ON employee_country.code = tax_certificates.employee_residential_address_country_code ' .
                'LEFT JOIN ' .
                    'tax_certificate_types ON tax_certificate_types.code = tax_certificates.tax_certificate_type_code ' .
                'WHERE ' . 
                    'tax_certificates.employee_id = $1 AND ' .
                    'tax_certificates.id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $user['employeeId'],            // tax_certificates.employee_id
                $data['taxCertificateId']       // tax_certificates.id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the tax certificate details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $string = $sqlRow['employer_address_unit'] . ',' .
            $sqlRow['employer_address_complex'] . ',' .
            $sqlRow['employer_address_street_number'] . ',' .
            $sqlRow['employer_address_street_name'] . ',' .
            $sqlRow['employer_address_suburb'] . ',' .
            $sqlRow['employer_address_city'] . ',' .
            $sqlRow['employer_country_name'];
                        
            $addressList = explode(',', $string);
            
            $addressLine1 = '';
            $addressLine2 = '';
            $addressLine3 = '';
            $addressLine4 = '';
            
            $addressLine = '';
            $addressLineCounter = 0;
            for ($i=0; $i < count($addressList); $i++) {
                if ($addressList[$i] === '') {
                    continue;
                }
                else {
                    $addressLine = $addressLine . $addressList[$i] . ', ';
                    $addressLineCounter= $addressLineCounter+ 1;
                    if ($addressLineCounter === 2) {
                        $addressLine1 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 4) {
                        $addressLine2 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 6) {
                        $addressLine3 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 7) {
                        $addressLine4 = $addressLine;
                        $addressLine = '';
                    }
                }
            }
            
            if($addressLine2 === '') {
                $addressLine1 = rtrim($addressLine1, ', ');
            }
            else if($addressLine3 === '') {
                $addressLine2 = rtrim($addressLine2, ', ');
            }
            else if($addressLine4 === '') {
                $addressLine3 = rtrim($addressLine3, ', ');
            }
            else {
                $addressLine4 = rtrim($addressLine4, ', ');
            }
            $companyAddressLine1 = $addressLine1;
            $companyAddressLine2 = $addressLine2;
            $companyAddressLine3 = $addressLine3;
            $companyAddressLine4 = $addressLine4;
            $companyAddressPostalCode = $sqlRow['employer_address_postal_code'];
            
            
            $string = $sqlRow['employee_residential_address_unit'] . ',' .
            $sqlRow['employee_residential_address_complex'] . ',' .
            $sqlRow['employee_residential_address_street_number'] . ',' .
            $sqlRow['employee_residential_address_street_name'] . ',' .
            $sqlRow['employee_residential_address_suburb'] . ',' .
            $sqlRow['employee_residential_address_city'] . ',' .
            $sqlRow['employee_country_name'];
            
            $addressList = explode(',', $string);
            
            $addressLine1 = '';
            $addressLine2 = '';
            $addressLine3 = '';
            $addressLine4 = '';
            
            $addressLine = '';
            $addressLineCounter = 0;
            for ($i=0; $i < count($addressList); $i++) {
                if ($addressList[$i] === '') {
                    continue;
                }
                else {
                    $addressLine = $addressLine . $addressList[$i] . ', ';
                    $addressLineCounter= $addressLineCounter+ 1;
                    if ($addressLineCounter === 2) {
                        $addressLine1 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 4) {
                        $addressLine2 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 6) {
                        $addressLine3 = $addressLine;
                        $addressLine = '';
                    }
                    else if ($addressLineCounter === 7) {
                        $addressLine4 = $addressLine;
                        $addressLine = '';
                    }
                }
            }
            
            if($addressLine2 === '') {
                $addressLine1 = rtrim($addressLine1, ', ');
            }
            else if($addressLine3 === '') {
                $addressLine2 = rtrim($addressLine2, ', ');
            }
            else if($addressLine4 === '') {
                $addressLine3 = rtrim($addressLine3, ', ');
            }
            else {
                $addressLine4 = rtrim($addressLine4, ', ');
            }
            
            $employeeAddressLine1 = $addressLine1;
            $employeeAddressLine2 = $addressLine2;
            $employeeAddressLine3 = $addressLine3;
            $employeeAddressLine4 = $addressLine4;
            $employeeAddressPostalCode = $sqlRow['employee_residential_address_postal_code'];
            
            $taxCertificate = [
                'id' => $sqlRow['id'],
                'taxCertificateNumber' => $sqlRow['number'],
                'periodCode' => $sqlRow['tax_reconciliation_period_code'],
                'periodName' => $sqlRow['period_name'],
                'sarsYear' => $sqlRow['sars_year'],
                'payPeriods' => number_format($sqlRow['pay_periods'], 2, '.', ''),
                'payPeriodsWorked' => number_format($sqlRow['pay_periods_worked'], 2, '.', ''),
                'fixedRateIncome' => $sqlRow['employee_fixed_rate_income'],
                'reasonForNonDeduction' => $sqlRow['reason_for_non_deduction'],
                'voluntaryOverDeduction' => $sqlRow['employee_voluntary_over_deduction'],
                'taxCertificateType' => $sqlRow['tax_certificate_type_name'],
                'employer' => [
                    'name' => $sqlRow['employer_name'],
                    'payeNumber' => $sqlRow['employer_paye_number'],
                    'sdlNumber' => $sqlRow['employer_sdl_number'],
                    'uifNumber' => $sqlRow['employer_uif_number'],
                    'diplomaticIndemnity' => $sqlRow['employer_diplomatic_indemnity'],
                    'addressLine1' => $companyAddressLine1,
                    'addressLine2' => $companyAddressLine2,
                    'addressLine3' => $companyAddressLine3,
                    'addressLine4' => $companyAddressLine4,
                    'addressCode' => $companyAddressPostalCode
                ],
                'employee' => [
                    'nature' => $sqlRow['employee_nature'],
                    'surname' => $sqlRow['employee_surname'],
                    'initials' => $sqlRow['employee_initials'],
                    'firstNames' => $sqlRow['employee_first_names'],
                    'idNumber' => $sqlRow['employee_id_number'],
                    'passportNumber' => $sqlRow['employee_passport_number'],
                    'dateOfBirth' => $sqlRow['employee_date_of_birth'],
                    'incomeTaxNumber' => $sqlRow['employee_income_tax_number'],
                    'number' => $sqlRow['employee_number'],
                    'addressLine1' => $employeeAddressLine1,
                    'addressLine2' => $employeeAddressLine2,
                    'addressLine3' => $employeeAddressLine3,
                    'addressLine4' => $employeeAddressLine4,
                    'addressCode' => $employeeAddressPostalCode,
                    'employedFrom' => $sqlRow['employee_employed_from'],
                    'employedTo' => $sqlRow['employee_employed_to'],
                    'directive1' => $sqlRow['employee_directive_1'],
                    'directive2' => $sqlRow['employee_directive_2'],
                    'directive3' => $sqlRow['employee_directive_3']
                ],
                'grossRemuneration' => [
                    'totalTaxableIncome' => number_format($sqlRow['total_taxable_income'], 2, '.', ''),
                    'totalNonTaxableIncome' => number_format($sqlRow['total_non_taxable_income'], 2, '.', ''),
                    'totalIncome' => number_format($sqlRow['total_income'], 2, '.', ''),
                    'totalRetirementIncome' => number_format($sqlRow['total_retirement_income'], 2, '.', ''),
                    'totalNonRetirementIncome' => number_format($sqlRow['total_non_retirement_income'], 2, '.', '')
                ],
                'taxDeductions' => [
                    'totalDeductions' => number_format($sqlRow['total_deductions'], 2, '.', ''),
                    'totalStandardIncomeTax' => number_format($sqlRow['total_standard_income_tax'], 2, '.', ''),
                    'totalPaye' => number_format($sqlRow['total_paye'], 2, '.', ''),
                    'totalUif' => number_format($sqlRow['total_uif'], 2, '.', ''),
                    'totalSdl' => number_format($sqlRow['total_sdl'], 2, '.', ''),
                    'totalTax' => number_format($sqlRow['total_tax'], 2, '.', ''),
                    'totalPayeOnLumpSums' => number_format($sqlRow['total_paye_on_lump_sums'], 2, '.', ''),
                    'totalMedicalSchemeCredit' => number_format($sqlRow['total_medical_scheme_credit'], 2, '.', ''),
                    'totalMedicalExpenses' => number_format($sqlRow['total_medical_expenses'], 2, '.', '')
                ],
                'incomeItems' => null,
                'deductionItems' => null
            ];
            
            // Get the tax certificate items
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
            $sqlItemResult = $db->paramQuery($sqlItemQuery, [$data['taxCertificateId']]);
            if( !$sqlItemResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $incomeItems = [];
            $deductionItems = [];
            while( $sqlItemRow = $sqlItemResult->fetchAssociative() ) {
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
                        'description' => $description, 
                        'clearanceNumber' => '',
                        'amount' => number_format($sqlItemRow['amount'], 2, '.', '')
                    ];
                }
            }
            $taxCertificate['incomeItems'] = $incomeItems;
            $taxCertificate['deductionItems'] = $deductionItems;
            
            // Send result
            echo( json_encode(['ok' => true, 'taxCertificate' => $taxCertificate]) );
            return true;
        }
    }
?>