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
    
    class Payslip extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to send payslip to self via email
        //
        // Required Parameters
        //  emailData            An array describing the emailData to send
        // 
        //  emailData = [
        //      'id',                   // The payslip id
        //      'emailAddress'          // The email address to send the payslip to
        //  ]
        //
        public function sendPayslips($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            foreach( $data['emailData'] as $payslip ) {
                $validationResult = Json::validate($payslip, [
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
            
            // Load the payslip template
            System::includeFile('payslip_printing/PayslipPrinterDefault.php');
            
            // Create a new payslip printer
            $printer = new PayslipPrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create payslip template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] . '/payslip_images/';
            
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
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }
            
            $config = [];
            
            // Create config array
            while ($sqlRow = $sqlResult->fetchAssociative()) {
                $skip = false;
                for ($i = 0; $i < count($templateConfig); $i++) {
                    if ($sqlRow['name'] === $templateConfig[$i]['name']) {
                        if ($templateConfig[$i]['type'] === 'image') {
                            if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                                $config[$sqlRow['name']] = $imageDir . $sqlRow['value'] . '.png';
                            }
                            $skip = true;
                            break;
                        }
                    }
                }
                if (!$skip) {
                    $config[$sqlRow['name']] = $sqlRow['value'];
                }
            }
            
            // Use the mailer module to send payslips
            System::useModule('phpmailer');
            
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
            
            // For every payslip in the array
            foreach( $data['emailData'] as $payslip ) {
                $payslipId = $payslip['id'];
                
                // Get the company details required to print payslips
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
                        'company_details.tel_number, ' .
                        'company_details.fax_number, ' .
                        'company_details.email_address, ' .
                        'company_details.paye_reference_number, ' .
                        'company_details.sdl_payment_reference_number, ' .
                        'company_details.uif_payment_reference_number, ' .
                        'company_details.uif_registration_number, ' .
                        'company_details.sic_code, ' .
                        'company_details.eti_status_code, ' .
                        'company_details.special_economic_zone_code, ' .
                        'company_details.diplomatic_indemnity, ' .
                        'company_details.sars_contact_email_address, ' .
                        'company_details.uif_contact_person, ' .
                        'company_details.uif_contact_email_address, ' .
                        'company_details.uif_contact_number, ' .
                        'countries.name AS physical_address_country_name ' .
                    'FROM ' .
                        'company_details ' .
                    'LEFT JOIN ' .
                        'countries ON countries.code = company_details.physical_address_country_code ' .
                    'ORDER BY id DESC LIMIT 1; ';
                    
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $companyName = $sqlRow['name'];
                $companyAddressLine1 = $sqlRow['postal_address_line_1'];
                $companyAddressLine2 = $sqlRow['postal_address_line_2'];
                $companyAddressLine3 = $sqlRow['postal_address_line_3'];
                $companyAddressLine4 = $sqlRow['postal_address_code'];
                $companyTel = $sqlRow['tel_number'];
                $companyFax = $sqlRow['fax_number'];
                $companyEmail = $sqlRow['email_address'];
                $companyLogo = '';
                
                // Get details about every payslip
                $payslipQuery = 
                    'SELECT DISTINCT ' .
                        'payslips.id, ' .
                        'payslips.period, ' .
                        'payslips.sars_year, ' .
                        'payslips.from_date, ' .
                        'payslips.to_date, ' .
                        'payslips.employee_id, ' .
                        'employees.id AS employee_id, ' .
                        'employees.full_names, ' .
                        'employees.first_name, ' .
                        'employees.last_name, ' .
                        'employees.alias, ' .
                        'employees.id_number, ' .
                        'employees.passport_number, ' .
                        'employees.income_tax_number, ' .
                        'employees.cell_number, ' .
                        'employees.email_address, ' .
                        'employees.payment_period_code, ' .
                        'employees.payment_period_end_day, ' .
                        'departments.name AS department_name, ' .
                        'employees.employment_position, ' .
                        'employees.employment_start_date, ' .
                        'employees.employment_end_date, ' .
                        'employees.postal_address_line_1, ' .
                        'employees.postal_address_line_2, ' .
                        'employees.postal_address_line_3, ' .
                        'employees.postal_address_code, ' .
                        'employees.code, ' .
                        'employees.send_payslip_by_email, ' .
                        'employee_bank_details.account_number, ' .
                        'employee_bank_details.branch_code, ' .
                        'bank_account_types.name AS bank_account_type_name ' .
                    'FROM ' .
                        'payslips ' .
                    'LEFT JOIN ' .
                        'employees ON employees.id = payslips.employee_id ' .
                    'LEFT JOIN ' .
                        'departments ON departments.id = employees.department_id ' .
                    'LEFT JOIN ' .
                        'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
                    'LEFT JOIN ' .
                        'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' .
                    'WHERE ' .
                        'payslips.id = $1 AND ' .
                        'employees.id = $2 ' .
                    'ORDER BY employees.id ASC;';
                $payslipResult = $db->paramQuery($payslipQuery, [
                    $payslipId,
                    $user['employeeId']
                ]);
                if( !$payslipResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $payslipResult->getRowCount() < 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Payslip not found.']) );
                    return false;
                }
                
                $payslipRow = $payslipResult->fetchAssociative();
                
                // Clear previous payslip printer details, if any
                $printer->clear();
                
                // Set config of the pdf
                $printer->setConfig($config);
                
                // Add the company, employee, and payslip details to the payslip printer
                $printer->setCompanyName($companyName);
                $printer->setCompanyAddress($companyAddressLine1, $companyAddressLine2, $companyAddressLine3, $companyAddressLine4);
                $printer->setCompanyTel($companyTel);
                $printer->setCompanyFaxNumber($companyFax);
                $printer->setCompanyEmail($companyEmail);
                $printer->setCompanyLogo($companyLogo);
                
                $department = $payslipRow['department_name'];
                if( $department === null ) $department = '';
                
                $printer->setEmployeeFullName($payslipRow['full_names'] . ' ' . $payslipRow['last_name']);
                $printer->setEmployeeAlias($payslipRow['alias']);
                $printer->setEmployeeCode($payslipRow['code']);
                $printer->setEmployeeDepartment($department);
                $printer->setEmployeePosition($payslipRow['employment_position']);
                $printer->setEmployeeEmploymentStart($payslipRow['employment_start_date']);
                $printer->setEmployeeEmail($payslipRow['email_address']);
                $printer->setEmployeeAddress($payslipRow['postal_address_line_1'], $payslipRow['postal_address_line_2'], $payslipRow['postal_address_line_3'], $payslipRow['postal_address_code']);
                $printer->setEmployeeCell($payslipRow['cell_number']);
                $printer->setEmployeeIdNumber($payslipRow['id_number']);
                $printer->setEmployeePassportNumber($payslipRow['passport_number']);
                $printer->setEmployeeIncomeTaxNumber($payslipRow['income_tax_number']);
                
                $bankAccountTypeName = $payslipRow['bank_account_type_name'];
                if( $bankAccountTypeName === null ) $bankAccountTypeName = '';
                $printer->setEmployeeBankName($bankAccountTypeName);
                
                $accountNumber = $payslipRow['account_number'];
                if( $accountNumber === null ) $accountNumber = '';
                $printer->setEmployeeAccountNumber($accountNumber);
                
                $branchCode = $payslipRow['branch_code'];
                if( $branchCode === null ) $branchCode = '';
                $printer->setEmployeeBankCode($branchCode);
                
                $printer->setEmployeePeriod($payslipRow['from_date'] . ' - ' . $payslipRow['to_date']);
                $printer->setPayslipToDate($payslipRow['to_date']);
                
                // Get all the items for the specified payslip
                $itemQuery = 
                    'SELECT DISTINCT ' .
                        'payslip_items.id, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.name AS type_name, ' .
                        'payslip_item_types.payslip_item_unit_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_categories.name AS payslip_category_name, ' .
                        'payslip_items.description, ' .
                        'payslip_items.accrual_date, ' .
                        'payslip_items.units, ' .
                        'payslip_items.rate, ' .
                        'payslip_items.total, ' .
                        'payslip_items.include_in_nett_pay ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                    'WHERE ' .
                        'payslip_items.payslip_id = $1 ' .
                    'ORDER BY ' .
                        'payslip_categories.name DESC;';
                $itemResult = $db->paramQuery($itemQuery, [
                    $payslipRow['id']
                ]);
                if( !$itemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Set the payslip item details
                $hoursWorked = null;
                $daysWorked = null;
                while( $itemRow = $itemResult->fetchAssociative() ) {
                    // Remember hours or days worked, if any
                    if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                        $hoursWorked = $itemRow['units'];
                    }
                    else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                        $daysWorked = $itemRow['units'];
                    }
                    
                    // Calculate the amount
                    $amount = $itemRow['total'];
                    if( $itemRow['units'] !== null && $itemRow['rate'] !== null ) {
                        $amount = doubleval($itemRow['units']) * doubleval($itemRow['rate']);
                    }
                    
                    // Set the description
                    $description = $itemRow['description'];
                    
                    // Is it an overtime item?
                    if( $itemRow['payslip_item_type_code'] == '1005' ) {
                        // Add the number of hours worked to the payslip item description
                        $description = $description . ' (' . $hoursWorked . ' hours)';
                    }
                    
                    // Add the specified item details to the payslip printer
                    $printer->addPayslipItem($itemRow['payslip_category_name'], $description, $amount, $itemRow['include_in_nett_pay']);
                }
                
                // $leaveData = \LeaveUtil\getLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
                $leaveData = \LeaveUtil\calculateLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
                
                foreach ($leaveData as $key => $value) {
                    $printer->addLeaveItem(
                        $key,
                        $leaveData[$key]['adjustment'],
                        $leaveData[$key]['accrued'],
                        $leaveData[$key]['taken'],
                        $leaveData[$key]['balance'],
                        $leaveData[$key]['unit']
                    );
                }
                
                // Print the payslip
                $printer->printPayslip();
                
                // Create a random filename for the payslip
                $filename = '';
                for ($i = 0; $i < 32; $i++) {
                    $filename = $filename . $characters[rand(0, $charactersLength - 1)];
                }
                $filename = $destDir . $filename . '.pdf';
                
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
                $mail->addAddress($emailAddress, $payslipRow['alias']);
                
                // Add the pasylip as an attachment
                $mail->addAttachment($filename, 'payslip_' . str_replace('-', '', $payslipRow['to_date']) . '.pdf');
                
                // Set the email text
                $htmlBody = 
                    'Dear ' . $payslipRow['alias'] . ',<br><br>' .
                    'Please find the attached payslip for <b>' . $payslipRow['full_names'] . ' ' . $payslipRow['last_name'] . '</b> for the period <b>' . $payslipRow['from_date'] . ' to ' . $payslipRow['to_date'] . '</b>.<br><br>' .
                    'If you have any queries, please don\'t hesitate to contact us.<br><br>' .
                    'Regards,<br><br>' .
                    'HR Department,<br><br>' .
                    $companyName;
                
                $plainTexBody = 
                    "Dear " . $payslipRow['alias'] . ",\r\n\r\n" .
                    "Please find the attached payslip for " . $payslipRow['first_name'] . " " . $payslipRow['last_name'] . " for the period " . $payslipRow['from_date'] . " to " . $payslipRow['to_date'] . ".\r\n\r\n" .
                    "If you have any queries, please don\'t hesitate to contact us.\r\n\r\n" .
                    "Regards,\r\n\r\n" .
                    "HR Department,\r\n\r\n" .
                    $companyName;
                
                // Set the email content
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = $companyName . ' payslip for period ending ' . $payslipRow['to_date'];
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
        
        // Function to list payslip items
        //
        // Required Parameters
        //  payslipId               The id of the payslip to download
        //
        public function getPayslipItems($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get details about every payslip
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.employee_id, ' .
                    'employees.id AS employee_id, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.cell_number, ' .
                    'employees.email_address, ' .
                    'departments.name AS department_name, ' .
                    'employees.employment_position, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.code, ' .
                    'employees.send_payslip_by_email, ' . 
                    'payruns.description ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'departments ON departments.id = employees.department_id ' .
                'LEFT JOIN ' .
                    'payruns ON payruns.id  = payslips.payrun_id ' .
                'WHERE ' .
                    'payslips.id = $1 AND ' .
                    'employees.id = $2 ' .
                'ORDER BY employees.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $data['payslipId'],
                $user['employeeId']
            ]);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $payslipRow = $payslipResult->fetchAssociative();
            
            $payslipDetails = [
                'fromDate' => $payslipRow['from_date'],
                'toDate' => $payslipRow['to_date'],
                'sarsYear' => $payslipRow['sars_year'],
                'description' => $payslipRow['description']
            ];
            
            $itemQuery = 
                'SELECT DISTINCT ' .
                    'payslip_items.id, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.name AS type_name, ' .
                    'payslip_item_types.payslip_item_unit_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_categories.name AS payslip_category_name, ' .
                    'payslip_items.description, ' .
                    'payslip_items.accrual_date, ' .
                    'payslip_items.units, ' .
                    'payslip_items.rate, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslip_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'LEFT JOIN ' .
                    'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                'WHERE ' .
                    'payslip_items.payslip_id = $1 ' .
                'ORDER BY ' .
                    'payslip_categories.name DESC;';
            $itemResult = $db->paramQuery($itemQuery, [
                $payslipRow['id']
            ]);
            if( !$itemResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the payslip item details
            $hoursWorked = null;
            $daysWorked = null;
            $payslipItems = [];
            $earningsTotal = 0;
            $deductionsTotal = 0;
            while( $itemRow = $itemResult->fetchAssociative() ) {
                // Remember hours or days worked, if any
                if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                    $hoursWorked = $itemRow['units'];
                }
                else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                    $daysWorked = $itemRow['units'];
                }
                
                // Calculate the amount
                $amount = $itemRow['total'];
                if( $itemRow['units'] !== null && $itemRow['rate'] !== null ) {
                    $amount = doubleval($itemRow['units']) * doubleval($itemRow['rate']);
                }
                
                if ($itemRow['payslip_category_code'] === 'INCO') {
                    $earningsTotal = $earningsTotal + (float)$itemRow['total'];
                }
                else if ($itemRow['payslip_category_code'] === 'ALLO') {
                    $earningsTotal = $earningsTotal + (float)$itemRow['total'];
                }
                else if ( ($itemRow['payslip_category_code'] === 'FBEN') && ($itemRow['include_in_nett_pay']) ) {
                    $earningsTotal = $earningsTotal + (float)$itemRow['total'];
                }
                
                if ($itemRow['payslip_category_code'] === 'DEDU') {
                    $deductionsTotal = $deductionsTotal + (float)$itemRow['total'];
                }
                
                $payslipItems[] = [
                    'id' => $itemRow['id'],
                    'payslipItemTypeCode' => $itemRow['payslip_item_type_code'],
                    'typeName' => $itemRow['type_name'],
                    'payslipItemUnitCode' => $itemRow['payslip_item_unit_code'],
                    'payslipCategoryCode' => $itemRow['payslip_category_code'],
                    'payslipCategoryName' => $itemRow['payslip_category_name'],
                    'description' => $itemRow['description'],
                    'accrualDate' => $itemRow['accrual_date'],
                    'units' => $itemRow['units'],
                    'rate' => $amount,
                    'total' => $itemRow['total'],
                    'includeInNettPay' => $itemRow['include_in_nett_pay']
                ];
            }
            
            $netSalaryTotal = (float)$earningsTotal - (float)$deductionsTotal;
            $netSalaryTotal = $netSalaryTotal;
            
            $payslip = [
                'payslipDetails' => $payslipDetails,
                'payslipItems' => $payslipItems,
                'netSalaryTotal' => $netSalaryTotal
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payslip' => $payslip
            ]) );
            
            return true;
            
        }
        
        // Function to list payslips
        //
        // Required Parameters
        //  payslipId               The id of the payslip to download
        //
        public function downloadPayslip($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the payslip template
            System::includeFile('payslip_printing/PayslipPrinterDefault.php');
            
            // Create a new payslip printer
            $printer = new PayslipPrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create payslip template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] .'/payslip_images/';
            
            // Get saved config details
            $sqlQuery = 
                'SELECT ' .
                    'payslip_templates.id, payslip_template_config.name, payslip_template_config.value ' .
                'FROM ' .
                    'payslip_templates ' .
                'LEFT JOIN ' .
                    'payslip_template_config ON payslip_template_id = payslip_templates.id ' .
                'WHERE payslip_templates.name = \'default\'';
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
            $destDir = CONF_TEMP_DIR . $destDir . '/';
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Get the company details required to print payslips
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
                    'company_details.tel_number, ' .
                    'company_details.fax_number, ' .
                    'company_details.email_address, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.uif_registration_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.sars_contact_email_address, ' .
                    'company_details.uif_contact_person, ' .
                    'company_details.uif_contact_email_address, ' .
                    'company_details.uif_contact_number, ' .
                    'countries.name AS physical_address_country_name ' .
                'FROM ' .
                    'company_details ' .
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $companyName = $sqlRow['name'];
            $companyAddressLine1 = $sqlRow['postal_address_line_1'];
            $companyAddressLine2 = $sqlRow['postal_address_line_2'];
            $companyAddressLine3 = $sqlRow['postal_address_line_3'];
            $companyAddressLine4 = $sqlRow['postal_address_code'];
            $companyTel = $sqlRow['tel_number'];
            $companyFax = $sqlRow['fax_number'];
            $companyEmail = $sqlRow['email_address'];
            $companyLogo = '';
            
            // Get details about every payslip
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.employee_id, ' .
                    'employees.id AS employee_id, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.income_tax_number, ' .
                    'employees.cell_number, ' .
                    'employees.email_address, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_period_end_day, ' .
                    'departments.name AS department_name, ' .
                    'employees.employment_position, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.code, ' .
                    'employees.send_payslip_by_email, ' .
                    'employee_bank_details.account_number, ' .
                    'employee_bank_details.branch_code, ' .
                    'bank_account_types.name AS bank_account_type_name ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'departments ON departments.id = employees.department_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
                'LEFT JOIN ' .
                    'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' .
                'WHERE ' .
                    'payslips.id = $1 AND ' .
                    'employees.id = $2 ' .
                'ORDER BY employees.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $data['payslipId'],
                $user['employeeId']
            ]);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $payslipResult->getRowCount() < 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payslip not found.']) );
                return false;
            }
            
            $payslipRow = $payslipResult->fetchAssociative();
            
            // Clear previous payslip printer details, if any
            $printer->clear();
            
            // Set config of the pdf
            $printer->setConfig($config);
            
            // Add the company, employee, and payslip details to the payslip printer
            $printer->setCompanyName($companyName);
            $printer->setCompanyAddress($companyAddressLine1, $companyAddressLine2, $companyAddressLine3, $companyAddressLine4);
            $printer->setCompanyTel($companyTel);
            $printer->setCompanyFaxNumber($companyFax);
            $printer->setCompanyEmail($companyEmail);
            $printer->setCompanyLogo($companyLogo);
            
            $department = $payslipRow['department_name'];
            if( $department === null ) $department = '';
            
            $printer->setEmployeeFullName($payslipRow['full_names'] . ' ' . $payslipRow['last_name']);
            $printer->setEmployeeAlias($payslipRow['alias']);
            $printer->setEmployeeCode($payslipRow['code']);
            $printer->setEmployeeDepartment($department);
            $printer->setEmployeePosition($payslipRow['employment_position']);
            $printer->setEmployeeEmploymentStart($payslipRow['employment_start_date']);
            $printer->setEmployeeEmail($payslipRow['email_address']);
            $printer->setEmployeeAddress($payslipRow['postal_address_line_1'], $payslipRow['postal_address_line_2'], $payslipRow['postal_address_line_3'], $payslipRow['postal_address_code']);
            $printer->setEmployeeCell($payslipRow['cell_number']);
            $printer->setEmployeeIdNumber($payslipRow['id_number']);
            $printer->setEmployeePassportNumber($payslipRow['passport_number']);
            $printer->setEmployeeIncomeTaxNumber($payslipRow['income_tax_number']);
            
            $bankAccountTypeName = $payslipRow['bank_account_type_name'];
            if( $bankAccountTypeName === null ) $bankAccountTypeName = '';
            $printer->setEmployeeBankName($bankAccountTypeName);
            
            $accountNumber = $payslipRow['account_number'];
            if( $accountNumber === null ) $accountNumber = '';
            $printer->setEmployeeAccountNumber($accountNumber);
            
            $branchCode = $payslipRow['branch_code'];
            if( $branchCode === null ) $branchCode = '';
            $printer->setEmployeeBankCode($branchCode);
            
            $printer->setEmployeePeriod($payslipRow['from_date'] . ' - ' . $payslipRow['to_date']);
            $printer->setPayslipToDate($payslipRow['to_date']);
            
            // Get all the items for the specified payslip
            $itemQuery = 
                'SELECT DISTINCT ' .
                    'payslip_items.id, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.name AS type_name, ' .
                    'payslip_item_types.payslip_item_unit_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_categories.name AS payslip_category_name, ' .
                    'payslip_items.description, ' .
                    'payslip_items.accrual_date, ' .
                    'payslip_items.units, ' .
                    'payslip_items.rate, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslip_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'LEFT JOIN ' .
                    'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                'WHERE ' .
                    'payslip_items.payslip_id = $1 ' .
                'ORDER BY ' .
                    'payslip_categories.name DESC;';
            $itemResult = $db->paramQuery($itemQuery, [
                $payslipRow['id']
            ]);
            if( !$itemResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the payslip item details
            $hoursWorked = null;
            $daysWorked = null;
            while( $itemRow = $itemResult->fetchAssociative() ) {
                // Remember hours or days worked, if any
                if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                    $hoursWorked = $itemRow['units'];
                }
                else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                    $daysWorked = $itemRow['units'];
                }
                
                // Calculate the amount
                $amount = $itemRow['total'];
                if( $itemRow['units'] !== null && $itemRow['rate'] !== null ) {
                    $amount = doubleval($itemRow['units']) * doubleval($itemRow['rate']);
                }
                
                // Set the description
                $description = $itemRow['description'];
                
                // Is it an overtime item?
                if( $itemRow['payslip_item_type_code'] == '1005' ) {
                    // Add the number of hours worked to the payslip item description
                    $description = $description . ' (' . $hoursWorked . ' hours)';
                }
                
                // Add the specified item details to the payslip printer
                $printer->addPayslipItem($itemRow['payslip_category_name'], $description, $amount, $itemRow['include_in_nett_pay']);
            }
            
            // $leaveData = \LeaveUtil\getLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
            $leaveData = \LeaveUtil\calculateLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
            
            foreach ($leaveData as $key => $value) {
                $printer->addLeaveItem(
                    $key,
                    $leaveData[$key]['adjustment'],
                    $leaveData[$key]['accrued'],
                    $leaveData[$key]['taken'],
                    $leaveData[$key]['balance'],
                    $leaveData[$key]['unit']
                );
            }
            
            // Print the payslip
            $printer->printPayslip();
            
            // Create a random filename for the payslip
            $filename = '';
            for ($i = 0; $i < 32; $i++) {
                $filename = $filename . $characters[rand(0, $charactersLength - 1)];
            }
            $filename = $filename . '.pdf';
            
            ob_end_clean();
            
            // Download the file
            $printer->output($filename);
            
            unset($printer);
        }
        
        // Function to list payslips
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'fromYear' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'fromYear' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // List only the payslips for the specified user
            $sqlParams[] = $user['employeeId'];
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 
                    ' AND (' . 
                    'payruns.description ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ' OR to_char(payslips.from_date, \'YYYY-MM-DD\') ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR to_char(payslips.to_date, \'YYYY-MM-DD\') ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR CAST(sars_year AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            // Add the year filter, if any
            if( array_key_exists('fromYear', $data) && isset($data['fromYear']) ) {
                $sqlParams[] = $data['fromYear'];
                $whereClause = $whereClause . ' AND ( DATE_PART(\'year\', payslips.from_date) = $' . count($sqlParams) . ' ) ';
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
            
            $sqlQuery = 
            'SELECT  ' .
                'payslips.id, ' . 
                'payslips.from_date, ' . 
                'payslips.to_date, ' . 
                'sars_year, ' . 
                'description, ' . 
                'employees.full_names, ' .
                'employees.last_name, ' .
                'employees.alias, ' .
                'employees.email_address, ' .
                '( ' .
                    'SELECT ' .
                        'SUM(payslip_items.total) ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'WHERE ' .
                        'payslip_item_types.payslip_category_code = \'INCO\' AND ' .
                        'payslip_items.payslip_id = payslips.id ' .
                ') AS total_earnings, ' .
                '( ' .
                    'SELECT ' .
                        'SUM(payslip_items.total) ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'WHERE ' .
                        'payslip_item_types.payslip_category_code = \'ALLO\' AND ' .
                        'payslip_items.payslip_id = payslips.id ' .
                ') AS total_allowances, ' .
                '( ' .
                    'SELECT ' .
                        'SUM(payslip_items.total) ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'WHERE ' .
                        'payslip_item_types.payslip_category_code = \'FBEN\' AND ' .
                        'payslip_items.include_in_nett_pay = true AND ' .
                        'payslip_items.payslip_id = payslips.id ' .
                ') AS total_included_fringe_benefits, ' .
                '( ' .
                    'SELECT ' .
                        'SUM(payslip_items.total) ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'WHERE ' .
                        'payslip_item_types.payslip_category_code = \'DEDU\' AND ' .
                        'payslip_items.payslip_id = payslips.id ' .
                ') AS total_deductions ' .
            'FROM ' . 
                'payslips ' .
            'LEFT JOIN ' .
                'payruns ON payruns.id  = payslips.payrun_id ' .
            'LEFT JOIN ' .
                'employees ON employees.id  = payslips.employee_id ' .
            'WHERE ' . 
                'employee_id = $1 AND ' . 
                'status_code = \'ACTI\' AND ' . 
                'payruns.processed_on IS NOT NULL ' . 
                $whereClause .
            'ORDER BY ' .
                'payslips.from_date ' . $data['sortOrder'] . ' ' . $limitOffset;
                
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payslips array
            $payslips = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Calculate the SARS year
                $sarsYear = (int)$sqlRow['sars_year'];
                $sarsEndYear = $sarsYear + 1;
                $sarsYear = $sarsYear . ' - ' . $sarsEndYear;
                
                // Calculate the nett pay
                $nettPay = 0;
                if( (float) $sqlRow['total_earnings'] > 0.009 ) { 
                    $nettPay = (float) $sqlRow['total_earnings'];
                }
                if( (float) $sqlRow['total_allowances'] > 0.009 ) { 
                    $nettPay = $nettPay + (float) $sqlRow['total_allowances'];
                }
                if( (float) $sqlRow['total_included_fringe_benefits'] > 0.009 ) { 
                    $nettPay = $nettPay + (float) $sqlRow['total_included_fringe_benefits'];
                }
                if( (float) $sqlRow['total_deductions'] > 0.009 ) { 
                    $nettPay = $nettPay - (float) $sqlRow['total_deductions'];
                }
                
                $payslips[] = [
                    'id' => $sqlRow['id'],
                    'alias' => $sqlRow['alias'],
                    'fullNames' => $sqlRow['full_names'],
                    'lastName' => $sqlRow['last_name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'fromDate' => $sqlRow['from_date'],
                    'toDate' => $sqlRow['to_date'],
                    'sarsYear' => $sarsYear,
                    'description' => $sqlRow['description'],
                    'nettPay' => $nettPay
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payslips' => $payslips
            ]) );
            
            return true;
        }
        
        
        // Function to get all the details of the specified payslip
        //
        // Required Parameters
        //  payslipItemId              The id of the payslip whose details to get
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
                'payslipItemId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the payslip detail
            $sqlQuery = 
                'SELECT ' .
                    'id, ' . 
                    'payslip_item_type_code, ' . 
                    'employee_id, ' . 
                    'description, ' . 
                    'accrual_date, ' . 
                    'amount, ' .
                    'payslip_item_types.name AS payslip_item_type_name, ' .
                    'payslip_categories.name AS payslip_category_name, ' . 
                    'payslip_category_code, ' . 
                    'payslip_config_items.auto_calculate, ' .
                    'payslip_config_items.unit_source_code, ' . 
                    'payslip_item_unit_sources.name AS unit_source_name, ' . 
                    'payslip_item_unit_code ' .
                'FROM ' .
                    'payslip_config_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_config_items.payslip_item_type_code ' .
                'LEFT JOIN ' .
                    'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                'LEFT JOIN ' .
                    'payslip_item_unit_sources ON payslip_item_unit_sources.code = payslip_config_items.unit_source_code ' . 
                'WHERE ' .
                    'payslip_config_items.id = $1 AND ' . 
                    'employee_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['payslipItemId'],
                $user['employeeId']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payslip was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payslip was not found.']) );
                return false;
            }
            
            // Create employee details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $payslip = [
                'id' => $sqlRow['id'],
                'payslipItemTypeCode' => $sqlRow['payslip_item_type_code'],
                'employeeId' => $sqlRow['employee_id'],
                'description' => $sqlRow['description'],
                'accrualDate' => $sqlRow['accrual_date'],
                'autoCalculate' => $sqlRow['auto_calculate'],
                'unitSourceCode' => $sqlRow['unit_source_code'],
                'unitSourceName' => $sqlRow['unit_source_name'],
                'amount' => $sqlRow['amount'],
                'payslipItemTypeName' => $sqlRow['payslip_item_type_name'],
                'payslipCategoryName' => $sqlRow['payslip_category_name'],
                'payslipCategoryCode' => $sqlRow['payslip_category_code'],
                'payslipItemUnitCode' => $sqlRow['payslip_item_unit_code']
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payslip' => $payslip
            ]) );
            
            return true;
        }
        
    }
?>