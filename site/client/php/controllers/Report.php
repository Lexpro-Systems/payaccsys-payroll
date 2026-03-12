<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    System::useModule('tcpdf');
    
    // Includes
    System::includeFile('ReportUtil.php');
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    System::includeFile('PayslipUtil.php');
    
    
    //
    // REPORT CONTROLLER CLASS
    //
    
    class Report extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        // Function to download an Excel or CSV document containing a list employee birthdays
        //
        // Required Parameters
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  searchString             A string value that is used to filter the result 
        //  limit                    The maximum number of rows to return
        //  offset                   The offeset value of the result
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        // 
        public function runBirthdayReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'month' => null,
                'day' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'month' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'day' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "CODE",
                "ALIAS",
                "EMAIL ADDRESS",
                "CELL NUMBER",
                "BIRTHDAY"
            ];
            
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_birthday_report_' . date('Y-m-d'), $headers);
            
            // Add the rows
            foreach( $reportData['employees'] AS $employee ) {
                $content = [
                    $employee['code'],
                    $employee['alias'],
                    $employee['emailAddress'],
                    $employee['cellNumber'],
                    $employee['birthday']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
            return true;
        }
        
        // Function to download a PDF document containing a list employee birthdays
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function runBirthdayPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'month' => null,
                'day' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'month' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'day' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Create employees array
            $reportRows = [];
            foreach( $reportData['employees'] AS $employee ) {
                $reportRows[] = [
                    $employee['code'],                  // Code
                    $employee['alias'],                 // Employee Name
                    $employee['emailAddress'],          // EMail Address
                    $employee['cellNumber'],            // Cell Number
                    $employee['birthday']               // Birthday
                ];
            }
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Employee Birthdays';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',            'width' =>  5/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',   'width' => 35/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Email Address',   'width' => 40/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cell Number',     'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Birthday',        'width' => 12/100, 'alignment' => 'L' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_birthdays_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to list employee birthdays
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function getBirthdayList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'month' => null,
                'day' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'month' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'day' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'employees' => $reportData['employees'] ]) );
            return true;
        }
        
        // Function to run employees details report
        //
        // Required Parameters
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  searchString             A string value that is used to filter the result 
        //  limit                    The maximum number of rows to return
        //  offset                   The offeset value of the result
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function runEmployeesDetailsReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentName' => '',
                'employeeStatus' => '',
                'departmentId' => null,
                'employmentStartDate' => '',
                'employmentEndDate' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employmentStartDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employmentEndDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "CODE",
                "TITLE",
                "INITIALS",
                "FULL NAME",
                "LAST NAME",
                "ALIAS",
                "ID NUMBER",
                "PASSPORT NUMBER",
                "PASSPORT COUNTRY",
                "DATE OF BIRTH",
                "IS ASYLUM SEEKER",
                "IS REFUGEE",
                "IS RETIRED",
                "PHYSICAL ADDRESS UNIT",
                "PHYSICAL ADDRESS COMPLEX",
                "PHYSICAL ADDRESS STREET",
                "PHYSICAL ADDRESS SUBURB",
                "PHYSICAL ADDRESS CITY",
                "PHYSICAL ADDRESS POSTAL CODE",
                "PHYSICAL ADDRESS COUNTRY",
                "POSTAL SAME AS PHYSICAL ADDRESS",
                "POSTAL ADDRESS LINE 1",
                "POSTAL ADDRESS LINE 2",
                "POSTAL ADDRESS LINE 3",
                "POSTAL ADDRESS CODE",
                "POSTAL ADDRESS COUNTRY",
                "WORK SAME AS COMPANY ADDRESS",
                "WORK ADDRESS UNIT",
                "WORK ADDRESS COMPLEX",
                "WORK ADDRESS STREET",
                "WORK ADDRESS SUBURB",
                "WORK ADDRESS CITY",
                "WORK ADDRESS POSTAL CODE",
                "WORK ADDRESS COUNTRY",
                "HOME NUMBER",
                "WORK NUMBER",
                "CELL NUMBER",
                "FAX NUMBER",
                "EMAIL ADDRESS",
                "EMERGENCY CONTACT PERSON",
                "EMERGENCY CONTACT NUMBER",
                "EMPLOYMENT START DATE",
                "EMPLOYMENT END DATE",
                "EMPLOYMENT POSITION",
                "EMPLOYMENT STATUS",
                "DEPARTMENT NAME",
                "PAYMENT METHOD",
                "PAYMENT PERIOD",
                "PAYMENT DAY",
                "PAYMENT PERIOD END DAY",
                "FINANCIAL INSTITUTION",
                "BANK ACCOUNT TYPE",
                "ACCOUNT NUMBER",
                "BRANCH CODE",
                "INCOME TAX NUMBER",
                "SIC CODE",
                "SEND PAYSLIP BY EMAIL",
                "INCOME TAX DIRECTIVE 1",
                "INCOME TAX DIRECTIVE 1 ISSUED DATE",
                "INCOME TAX DIRECTIVE 1 SOURCE CODE",
                "INCOME TAX DIRECTIVE 1 AMOUNT",
                "INCOME TAX DIRECTIVE 2",
                "INCOME TAX DIRECTIVE 2 ISSUED DATE",
                "INCOME TAX DIRECTIVE 2 SOURCE CODE",
                "INCOME TAX DIRECTIVE 2 AMOUNT",
                "INCOME TAX DIRECTIVE 3",
                "INCOME TAX DIRECTIVE 3 ISSUED DATE",
                "INCOME TAX DIRECTIVE 3 SOURCE CODE",
                "INCOME TAX DIRECTIVE 3 AMOUNT",
                "ENABLE PAYE CORRECTION",
               // "GROSS SALARY",
            ];
            
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_details_report', $headers);
            
            // Create employees array
            $content = [];
            foreach( $reportData['employees'] AS $employee ) {
                $isAsylumSeeker = 'No';
                if ($employee['isAsylumSeeker']) {
                    $isAsylumSeeker = 'Yes';
                }
                
                $isRefugee = 'No';
                if ($employee['isRefugee']) {
                    $isRefugee = 'Yes';
                }
                
                $isRetired = 'No';
                if ($employee['isRefugee']) {
                    $isRetired = 'Yes';
                }
                
                $postalSameAsPhysicalAddress = 'No';
                if ($employee['postalSameAsPhysicalAddress']) {
                    $postalSameAsPhysicalAddress = 'Yes';
                }
                
                $workSameAsCompanyAddress = 'No';
                if ($employee['workSameAsCompanyAddress']) {
                    $workSameAsCompanyAddress = 'Yes';
                }
                
                $sendPayslipByEmail = 'No';
                if ($employee['sendPayslipByEmail']) {
                    $sendPayslipByEmail = 'Yes';
                }
                
                $enablePayeCorrection = 'No';
                if ($employee['enablePayeCorrection']) {
                    $enablePayeCorrection = 'Yes';
                }
                
                $paymentDay = null;
                $paymentPeriodEndDay = null;
                $weekDays = array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
                $biWeekDays = array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
                // array(
                //     "Week 1: Sunday",
                //     "Week 1: Monday",
                //     "Week 1: Tuesday",
                //     "Week 1: Wednesday",
                //     "Week 1: Thursday",
                //     "Week 1: Friday",
                //     "Week 1: Saturday",
                //     "Week 2: Sunday",
                //     "Week 2: Monday",
                //     "Week 2: Tuesday",
                //     "Week 2: Wednesday",
                //     "Week 2: Thursday",
                //     "Week 2: Friday",
                //     "Week 2: Saturday"
                // );
                if( $employee['paymentPeriodCode'] == "WEEK" ) {
                    if (($employee['paymentDay'] >=0 && $employee['paymentDay'] <= 6) && ($employee['paymentPeriodEndDay'] >=0 && $employee['paymentPeriodEndDay'] <= 6) ) {
                        $paymentDay = $weekDays[$employee['paymentDay']];
                        $paymentPeriodEndDay = $weekDays[$employee['paymentPeriodEndDay']];
                    }
                } 
                else if( $employee['paymentPeriodCode'] == "BWEE" ) {
                    if (($employee['paymentDay'] >=0 && $employee['paymentDay'] <= 13) && ($employee['paymentPeriodEndDay'] >=0 && $employee['paymentPeriodEndDay'] <= 13) ) {
                        $paymentDay = $biWeekDays[$employee['paymentDay']];
                        $paymentPeriodEndDay = $biWeekDays[$employee['paymentPeriodEndDay']];
                    }
                }
                else {
                    if( $employee['paymentDay'] == 0)  {
                        $paymentDay = 'Last Day';
                    } 
                    else {
                        $paymentDay = $employee['paymentDay'];
                    }
                    
                    if ($employee['paymentPeriodEndDay'] == 0) {
                        $paymentPeriodEndDay = 'Last Day';
                    } 
                    else {
                        $paymentPeriodEndDay = $employee['paymentPeriodEndDay'];
                    }
                }
                
                $employeeBankAccountTypeName = '';
                if ($employee['employeeBankAccountTypeCode'] == 'SACC') {
                    $employeeBankAccountTypeName = 'Savings';
                }
                elseif ($employee['employeeBankAccountTypeCode'] == 'CACC') {
                    $employeeBankAccountTypeName = 'Cheque';
                }
                
                $content = [
                    $employee['code'],
                    $employee['titleName'],
                    $employee['initials'],
                    $employee['fullNames'],
                    $employee['lastName'],
                    $employee['alias'],
                    $employee['idNumber'],
                    $employee['passportNumber'],
                    $employee['passportCountryName'],
                    $employee['dateOfBirth'],
                    $isAsylumSeeker,
                    $isRefugee,
                    $isRetired,
                    $employee['physicalAddressUnit'],
                    $employee['physicalAddressComplex'],
                    $employee['physicalAddressStreet'],
                    $employee['physicalAddressSuburb'],
                    $employee['physicalAddressCity'],
                    $employee['physicalAddressPostalCode'],
                    $employee['physicalAddressCountryName'],
                    $postalSameAsPhysicalAddress,
                    $employee['postalAddressLine1'],
                    $employee['postalAddressLine2'],
                    $employee['postalAddressLine3'],
                    $employee['postalAddressCode'],
                    $employee['postalAddressCountryName'],
                    $workSameAsCompanyAddress,
                    $employee['workAddressUnit'],
                    $employee['workAddressComplex'],
                    $employee['workAddressStreet'],
                    $employee['workAddressSuburb'],
                    $employee['workAddressCity'],
                    $employee['workAddressPostalCode'],
                    $employee['workAddressCountryName'],
                    $employee['homeNumber'],
                    $employee['workNumber'],
                    $employee['cellNumber'],
                    $employee['faxNumber'],
                    $employee['emailAddress'],
                    $employee['emergencyContactPerson'],
                    $employee['emergencyContactNumber'],
                    $employee['employmentStartDate'],
                    $employee['employmentEndDate'],
                    $employee['employmentPosition'],
                    $employee['employmentStatus'],
                    $employee['departmentName'],
                    $employee['paymentMethodName'],
                    $employee['paymentPeriodTypeName'],
                    $paymentDay,
                    $paymentPeriodEndDay,
                    $employee['employeeFinancialInstitutionName'],
                    $employeeBankAccountTypeName,
                    $employee['employeeAccountNumber'],
                    $employee['employeeBranchCode'],
                    $employee['incomeTaxNumber'],
                    $employee['sicCode'],
                    $sendPayslipByEmail,
                    $employee['incomeTaxDirective1'],
                    $employee['incomeTaxDirective1IssuedDate'],
                    $employee['incomeTaxDirective1SourceCode'],
                    $employee['incomeTaxDirective1Amount'],
                    $employee['incomeTaxDirective2'],
                    $employee['incomeTaxDirective2IssuedDate'],
                    $employee['incomeTaxDirective2SourceCode'],
                    $employee['incomeTaxDirective2Amount'],
                    $employee['incomeTaxDirective3'],
                    $employee['incomeTaxDirective3IssuedDate'],
                    $employee['incomeTaxDirective3SourceCode'],
                    $employee['incomeTaxDirective3Amount'],
                    $enablePayeCorrection,
                    null,
                    // $employee['grossSalary'],
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
            return true;
        }
        
        // Function to list employees
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function runEmployeesDetailsPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentName' => '',
                'employeeStatus' => '',
                'departmentId' => null,
                'employmentStartDate' => '',
                'employmentEndDate' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employmentStartDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employmentEndDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Create employees array
            $reportRows = [];
            foreach( $reportData['employees'] AS $employee ) {
                // Set employment period and status
                $employmentEndDate = ($employee['employmentEndDate'] !== null ? new DateTime($employee['employmentEndDate']) : null);
                $currentDate = new DateTime();
                $employmentPeriod = $employee['employmentStartDate'];
                if ($employee['employmentEndDate'] !== null) {
                    if ($employmentEndDate <= $currentDate) {
                        $employmentPeriod = $employmentPeriod . ' to ' . $employee['employmentStartDate'];
                    }
                }
                else {
                    $employmentPeriod = $employmentPeriod . ' to present';
                }
                
                $reportRows[] = [
                    $employee['code'],                  // Employee Code
                    $employee['alias'],                 // Name
                    $employee['emailAddress'],          // Email Address
                    $employee['cellNumber'],            // Cell Number
                    $employee['departmentName'],        // Department
                    $employee['employmentStatus'],      // Status
                    $employmentPeriod                   // Employment Period
                ];
            }
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Employee Details';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',              'width' =>  5/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',     'width' => 15/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Email Address',     'width' => 26/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cell Number',       'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Department',        'width' => 26/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Status',            'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employment Period', 'width' => 12/100, 'alignment' => 'L' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_details_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to list employees
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function getEmployeeDetailsList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentName' => '',
                'employeeStatus' => '',
                'departmentId' => null,
                'employmentStartDate' => '',
                'employmentEndDate' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employmentStartDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employmentEndDate' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees']]) );
            return true;
        }
        
        // Function to run the leave summary report
        //
        // Required Parameters
        //  format                     Format of the file to download
        //  leaveTypeId                The id of the leave type
        //  startDate                  The start date of the leave to get
        //  endDate                    The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function runLeaveSummaryReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get leave type details
            $sqlQuery = 'SELECT name, leave_unit_code FROM leave_types WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $leaveTypeName = $sqlRow['name'];
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "CODE",
                "ALIAS",
                "STARTING BALANCE",
                "UNIT",
                "LEAVE ACCRUED",
                "UNIT",
                "ADJUSTMENT",
                "UNIT",
                "LEAVE TAKEN",
                "UNIT",
                "CLOSING BALANCE",
                "UNIT"
            ];
            
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . strtolower(preg_replace('/\s+/', '_', $leaveTypeName)) . '_leave_summary_report', $headers);
            
            for ($i=0; $i < count($reportData['leaveSummary']); $i++) { 
                
                for ($b=0; $b < count($reportData['leaveSummary'][$i]['leave']); $b++) {
                    if ($reportData['leaveSummary'][$i]['leave'][$b]['code'] === 'LEAR') {
                        $accruedAmount = $reportData['leaveSummary'][$i]['leave'][$b]['amount'];
                    }
                    if ($reportData['leaveSummary'][$i]['leave'][$b]['code'] === 'ADJU') {
                        $adjustmentAmount = $reportData['leaveSummary'][$i]['leave'][$b]['amount'];
                    }
                    if ($reportData['leaveSummary'][$i]['leave'][$b]['code'] === 'LTAK') {
                        $leaveTakenAmount = $reportData['leaveSummary'][$i]['leave'][$b]['amount'];
                    }
                }
                
                $startingBalanceAmount = $reportData['leaveSummary'][$i]['startingBalanceAmount'];
                if ($reportData['leaveSummary'][$i]['startingBalanceAmount'] === null) {
                    $startingBalanceAmount = 0;
                }
                
                $closingBalanceAmount = $reportData['leaveSummary'][$i]['closingBalanceAmount'];
                if ($reportData['leaveSummary'][$i]['closingBalanceAmount'] === null) {
                    $closingBalanceAmount = 0;
                }
                
                $content = [
                    $reportData['leaveSummary'][$i]['code'],
                    $reportData['leaveSummary'][$i]['alias'],
                    number_format(floatval($startingBalanceAmount), 2, '.', ''),
                    $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($accruedAmount), 2, '.', ''),
                    $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($adjustmentAmount), 2, '.', ''),
                    $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($leaveTakenAmount), 2, '.', ''),
                    $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($closingBalanceAmount), 2, '.', ''),
                    $reportData['leaveSummary'][$i]['leaveTypeUnit']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
        }
        
        // Function to run the leave summary pdf report
        //
        // Required Parameters
        //  leaveTypeId                The id of the leave type
        //  startDate                  The start date of the leave to get
        //  endDate                    The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function runLeaveSummaryPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get leave type details
            $sqlQuery = 'SELECT name, leave_unit_code FROM leave_types WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $leaveTypeName = $sqlRow['name'];
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            $reportRows = [];
            for( $i=0; $i < count($reportData['leaveSummary']); $i++ ) { 
                $accruedAmount = 0;
                $adjustmentAmount = 0;
                $leaveTakenAmount = 0;
                
                for ($j=0; $j < count($reportData['leaveSummary'][$i]['leave']); $j++) {
                    if ($reportData['leaveSummary'][$i]['leave'][$j]['code'] === 'LEAR') {
                        $accruedAmount = $reportData['leaveSummary'][$i]['leave'][$j]['amount'];
                    }
                    if ($reportData['leaveSummary'][$i]['leave'][$j]['code'] === 'ADJU') {
                        $adjustmentAmount = $reportData['leaveSummary'][$i]['leave'][$j]['amount'];
                    }
                    if ($reportData['leaveSummary'][$i]['leave'][$j]['code'] === 'LTAK') {
                        $leaveTakenAmount = $reportData['leaveSummary'][$i]['leave'][$j]['amount'];
                    }
                }
                
                $startingBalanceAmount = $reportData['leaveSummary'][$i]['startingBalanceAmount'];
                if ($reportData['leaveSummary'][$i]['startingBalanceAmount'] === null) {
                    $startingBalanceAmount = 0;
                }
                
                $closingBalanceAmount = $reportData['leaveSummary'][$i]['closingBalanceAmount'];
                if ($reportData['leaveSummary'][$i]['closingBalanceAmount'] === null) {
                    $closingBalanceAmount = 0;
                }
                
                $reportRows[] = [
                    $reportData['leaveSummary'][$i]['code'],
                    $reportData['leaveSummary'][$i]['alias'],
                    number_format(floatval($startingBalanceAmount), 2) . ' ' . $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($accruedAmount), 2) . ' ' . $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($adjustmentAmount), 2) . ' ' . $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($leaveTakenAmount), 2) . ' ' . $reportData['leaveSummary'][$i]['leaveTypeUnit'],
                    number_format(floatval($closingBalanceAmount), 2) . ' ' . $reportData['leaveSummary'][$i]['leaveTypeUnit']
                ];
            }
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Leave Summary: ' . $leaveTypeName . ' (' . $data['startDate'] . ' - ' . $data['endDate'] . ')';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',             'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',    'width' => 40/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Starting Balance', 'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Leave Accrued',    'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Adjustment',       'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Leave Taken',      'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Closing Balance',  'width' => 10/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_leave_summary_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the leave summary list
        //
        // Required Parameters
        //  leaveTypeId                The id of the leave type
        //  startDate                  The start date of the leave to get
        //  endDate                    The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function getLeaveSummaryList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'leaveSummary' => $reportData['leaveSummary'] ]) );
            return true;
        }
        
        // Function to run the emplyee leave report
        //
        // Required Parameters
        //  employeeId                  The id of the employee
        //  startDate                   The start date of the leave to get
        //  endDate                     The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function runEmployeeLeaveReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get employee details
            $sqlQuery = 'SELECT code, alias FROM employees WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            // $employeeCode = preg_replace("/[^a-zA-Z0-9]+/", "", $sqlRow['code']);
            $employeeAlias = preg_replace("/[^a-zA-Z0-9]+/", "", $sqlRow['alias']);
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "LEAVE TYPE",
                "BALANCE ON " . $data['startDate'],
                "UNIT",
                "LEAVE ACCRUED",
                "UNIT",
                "ADJUSTMENT",
                "UNIT",
                "LEAVE TAKEN",
                "UNIT",
                "BALANCE ON " . $data['endDate'],
                "UNIT"
            ];
            
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . strtolower(preg_replace('/\s+/', '_', $employeeAlias)) . '_leave_report', $headers);
            
            for ($i=0; $i < count($reportData['employeeLeave']); $i++) { 
                $accruedAmount = $reportData['employeeLeave'][$i]['accrued'];
                if ($reportData['employeeLeave'][$i]['accrued'] === null) {
                    $accruedAmount = 0;
                }
                
                $adjustmentAmount = $reportData['employeeLeave'][$i]['adjustment'];
                if ($reportData['employeeLeave'][$i]['adjustment'] === null) {
                    $adjustmentAmount = 0;
                }
                
                $leaveTakenAmount = $reportData['employeeLeave'][$i]['leaveTaken'];
                if ($reportData['employeeLeave'][$i]['leaveTaken'] === null) {
                    $leaveTakenAmount = 0;
                }
                
                $startingBalanceAmount = $reportData['employeeLeave'][$i]['startingBalance'];
                if ($reportData['employeeLeave'][$i]['startingBalance'] === null) {
                    $startingBalanceAmount = 0;
                }
                
                $closingBalanceAmount = $reportData['employeeLeave'][$i]['closingBalance'];
                if ($reportData['employeeLeave'][$i]['closingBalance'] === null) {
                    $closingBalanceAmount = 0;
                }
                
                $content = [
                    $reportData['employeeLeave'][$i]['leaveType'],
                    floatval($startingBalanceAmount),
                    $reportData['employeeLeave'][$i]['leaveTypeUnit'],
                    number_format(floatval($accruedAmount), 2, '.', ''),
                    $reportData['employeeLeave'][$i]['leaveTypeUnit'],
                    number_format(floatval($adjustmentAmount), 2, '.', ''),
                    $reportData['employeeLeave'][$i]['leaveTypeUnit'],
                    number_format(floatval($leaveTakenAmount), 2, '.', ''),
                    $reportData['employeeLeave'][$i]['leaveTypeUnit'],
                    number_format(floatval($closingBalanceAmount), 2, '.', ''),
                    $reportData['employeeLeave'][$i]['leaveTypeUnit']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
        }
        
        // Function to run the employee leave pdf report
        //
        // Required Parameters
        //  employeeId                  The id of the employee
        //  startDate                   The start date of the leave to get
        //  endDate                     The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function runEmployeeLeavePdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the employee details
            $sqlQuery = 'SELECT employees.alias FROM employees WHERE employees.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeAlias = $sqlRow['alias'];
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Set the leave balances
            $reportRows = [];
            foreach($reportData['employeeLeave'] AS $employeeLeave) {
                $leaveTypeUnit = ($employeeLeave['leaveTypeUnit'] === 'days' ? 'd' : 'h');
                $startingBalanceAmount = number_format(floatval($employeeLeave['startingBalance']), 2) . ' ' . $leaveTypeUnit;
                $accruedAmount = number_format(floatval($employeeLeave['accrued']), 2) . ' ' . $leaveTypeUnit;
                $adjustmentAmount = number_format(floatval($employeeLeave['adjustment']), 2) . ' ' . $leaveTypeUnit;
                $leaveTakenAmount = number_format(floatval($employeeLeave['leaveTaken']), 2) . ' ' . $leaveTypeUnit;
                $closingBalanceAmount = number_format(floatval($employeeLeave['closingBalance']), 2) . ' ' . $leaveTypeUnit;
                
                $reportRows[] = [
                    $employeeLeave['leaveType'],    // Leave Type
                    $startingBalanceAmount,         // Starting Balance
                    $accruedAmount,                 // Accrued
                    $adjustmentAmount,              // Adjustment
                    $leaveTakenAmount,              // Leave Taken
                    $closingBalanceAmount           // Closing Balance
                ];
            }
            
            // Sort the balances array
            array_multisort($reportRows, 0, SORT_ASC);
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Employee Leave: ' . $employeeAlias . ' (' . $data['startDate'] . ' - ' . $data['endDate'] . ')';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Leave Type',       'width' => 40/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Starting Balance', 'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Leave Accrued',    'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Adjustment',       'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Leave Taken',      'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Closing Balance',  'width' => 12/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_leave_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the emplyee leave list
        //
        // Required Parameters
        //  employeeId                  The id of the employee
        //  startDate                   The start date of the leave to get
        //  endDate                     The end date of the leave to get
        //
        // Optional Parameters
        //  None
        public function getEmployeeLeaveList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employeeLeave' => $reportData['employeeLeave']]) );
            return true;
        }
        
        // Function to run employees details report
        //
        // Required Parameters
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  searchString             A string value that is used to filter the result 
        //  limit                    The maximum number of rows to return
        //  offset                   The offeset value of the result
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        // 
        public function runUifReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getUifData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "UIF Reference Number",
                "Title",
                "Initial",
                "Names",
                "Surname",
                "ID Type",
                "Identity Number",
                "Passport Number",
                "Physical Address Line 1",
                "Physical Address Line 2",
                "Physical Address Line 3",
                "Suburb",
                "City",
                "Postal Code",
                "Postal Address Line 1",
                "Postal Address Line 2",
                "Postal Address Line 3",
                "Suburb",
                "City",
                "Postal Code",
                "Country of Issue",
                "Date of Birth",
                "Commencement date of Employment",
                "Date Employed To",
                "Total Hours Worked per Month",
                "Employment Status (Termination Reason)",
                "Reason for Non Contribution",
                "Gross Taxable Remuneration",
                "Remuneration subject to UIF",
                "UIF Contribution"
            ];
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_uif_report', $headers);
            
            // Write the report
            for( $i = 0; $i < count( $reportData['employees'] ); $i++ ) {
                // Set the row content
                $content = [
                    // $reportData['employees'][$i]['code'],
                    $reportData['employees'][$i]['uifReferenceNumber'],
                    // $reportData['employees'][$i]['id'],
                    // $reportData['employees'][$i]['code'],
                    // $reportData['employees'][$i]['titleCode'],
                    $reportData['employees'][$i]['titleNumber'],
                    // $reportData['employees'][$i]['initials'],
                    $reportData['employees'][$i]['initial'],
                    $reportData['employees'][$i]['fullNames'],
                    $reportData['employees'][$i]['lastName'],
                    // $reportData['employees'][$i]['alias'],
                    $reportData['employees'][$i]['idType'],
                    $reportData['employees'][$i]['idNumber'],
                    $reportData['employees'][$i]['passportNumber'],
                    $reportData['employees'][$i]['physicalAddressLine1'],
                    $reportData['employees'][$i]['physicalAddressLine2'],
                    $reportData['employees'][$i]['physicalAddressLine3'],
                    $reportData['employees'][$i]['physicalAddressSuburb'],
                    $reportData['employees'][$i]['physicalAddressCity'],
                    $reportData['employees'][$i]['physicalAddressPostalCode'],
                    $reportData['employees'][$i]['postalAddressLine1'],
                    $reportData['employees'][$i]['postalAddressLine2'],
                    $reportData['employees'][$i]['postalAddressLine3'],
                    $reportData['employees'][$i]['postalAddressSuburb'],
                    $reportData['employees'][$i]['postalAddressCity'],
                    $reportData['employees'][$i]['postalAddressCode'],
                    // $reportData['employees'][$i]['passportCountryCode'],
                    $reportData['employees'][$i]['passportCountryAlpha2Code'],
                    ( $reportData['employees'][$i]['dateOfBirth'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['dateOfBirth']) : ''),
                    ( $reportData['employees'][$i]['employmentStartDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentStartDate']) : ''),
                    ( $reportData['employees'][$i]['employmentEndDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentEndDate']) : ''),
                    $reportData['employees'][$i]['totalHoursWorked'],
                    $reportData['employees'][$i]['employmentStatus'],
                    $reportData['employees'][$i]['nonContributionReason'],
                    $reportData['employees'][$i]['taxableRemuneration'],
                    $reportData['employees'][$i]['uifRemuneration'],
                    $reportData['employees'][$i]['uifContribution']
                ];
                
                // Write the row
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            // Is it a summary report?
            if( $data['detail'] === 'SUMM' ) {
                // Set the row content
                $content = [
                    'Totals',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    $reportData['totals']['hoursWorkedTotal'],
                    '-',
                    '-',
                    $reportData['totals']['taxableRemunerationTotal'],
                    $reportData['totals']['uifRemunerationTotal'],
                    $reportData['totals']['uifContributionTotal']
                ];
                
                // Write the row
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
            return true;
        }
        
        // Function to list employees
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        //  departmentName           The department name of the employee
        //  employeeStatus           The employee status of the employee
        //  departmentId             The department id of the employee
        //  employmentStartDate      The employmentstartdate of the employee
        //  employmentEndDate        The employmentenddate of the employee
        public function runUifPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getUifData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "UIF Reference Number",
                "Title",
                "Initial",
                "Names",
                "Surname",
                "ID Type",
                "Identity Number",
                "Passport Number",
                "Physical Address Line 1",
                "Physical Address Line 2",
                "Physical Address Line 3",
                "Suburb",
                "City",
                "Postal Code",
                "Postal Address Line 1",
                "Postal Address Line 2",
                "Postal Address Line 3",
                "Suburb",
                "City",
                "Postal Code",
                "Country of Issue",
                "Date of Birth",
                "Commencement date of Employment",
                "Date Employed To",
                "Total Hours Worked per Month",
                "Employment Status (Termination Reason)",
                "Reason for Non Contribution",
                "Gross Taxable Remuneration",
                "Remuneration subject to UIF",
                "UIF Contribution"
            ];
            
            // Write the report
            $reportRows = [];
            for( $i = 0; $i < count( $reportData['employees'] ); $i++ ) {
                // Set the row content
                $reportRows[] = [
                    $reportData['employees'][$i]['code'],
                    // $reportData['employees'][$i]['id'],
                    // $reportData['employees'][$i]['code'],
                    // $reportData['employees'][$i]['titleCode'],
                    // $reportData['employees'][$i]['titleNumber'],
                    // $reportData['employees'][$i]['initials'],
                    // $reportData['employees'][$i]['initial'],
                    // $reportData['employees'][$i]['fullNames'],
                    // $reportData['employees'][$i]['lastName'],
                    $reportData['employees'][$i]['alias'],
                    $reportData['employees'][$i]['uifReferenceNumber'],
                    // $reportData['employees'][$i]['idType'],
                    $reportData['employees'][$i]['idNumber'],
                    $reportData['employees'][$i]['passportNumber'],
                    // $reportData['employees'][$i]['physicalAddressLine1'],
                    // $reportData['employees'][$i]['physicalAddressLine2'],
                    // $reportData['employees'][$i]['physicalAddressLine3'],
                    // $reportData['employees'][$i]['physicalAddressSuburb'],
                    // $reportData['employees'][$i]['physicalAddressCity'],
                    // $reportData['employees'][$i]['physicalAddressPostalCode'],
                    // $reportData['employees'][$i]['postalAddressLine1'],
                    // $reportData['employees'][$i]['postalAddressLine2'],
                    // $reportData['employees'][$i]['postalAddressLine3'],
                    // $reportData['employees'][$i]['postalAddressSuburb'],
                    // $reportData['employees'][$i]['postalAddressCity'],
                    // $reportData['employees'][$i]['postalAddressCode'],
                    // $reportData['employees'][$i]['passportCountryCode'],
                    // $reportData['employees'][$i]['passportCountryAlpha2Code'],
                    // str_replace('-', '/', $reportData['employees'][$i]['dateOfBirth']),
                    ( $reportData['employees'][$i]['employmentStartDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentStartDate']) : ''),
                    ( $reportData['employees'][$i]['employmentEndDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentEndDate']) : ''),
                    number_format((float)$reportData['employees'][$i]['totalHoursWorked'], 0, '.', ' '),
                    // $reportData['employees'][$i]['employmentStatus'],
                    // $reportData['employees'][$i]['nonContributionReason'],
                    number_format((float)$reportData['employees'][$i]['taxableRemuneration'], 2, '.', ' '),
                    number_format((float)$reportData['employees'][$i]['uifRemuneration'], 2, '.', ' '),
                    number_format((float)$reportData['employees'][$i]['uifContribution'], 2, '.', ' ')
                ];
            }
            
            // Add the totals
            $reportRows[] = [
                'Totals',
                '',
                '',
                '',
                '',
                '',
                '',
                number_format((float)$reportData['totals']['hoursWorkedTotal'], 0, '.', ' '),
                number_format((float)$reportData['totals']['taxableRemunerationTotal'], 2, '.', ' '),
                number_format((float)$reportData['totals']['uifRemunerationTotal'], 2, '.', ' '),
                number_format((float)$reportData['totals']['uifContributionTotal'], 2, '.', ' ')
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - UIF Report';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                    'width' =>  5/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',           'width' => 15/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'UIF Number',              'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'ID Number',               'width' =>  9/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Pasport Number',          'width' =>  9/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employment Start Date',   'width' =>  9/100, 'alignment' => 'C' ];
            $reportCols [] = [ 'name' => 'Employment End Date',     'width' =>  9/100, 'alignment' => 'C' ];
            $reportCols [] = [ 'name' => 'Hours Worked',            'width' =>  9/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Taxable Remuneration',    'width' =>  9/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'UIF Remuneration',        'width' =>  9/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'UIF Contribution',        'width' =>  9/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_details_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to list employees
        //
        // Required Parameters
        //  payrunId                The id of the payrun for which to get UIF details
        //  detail                  The detail level of the report (DETA for detailed, SUMM for summary)
        //
        // Optional Parameters
        //  None
        public function getUifList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getUifData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'totals' => $reportData['totals']]) );
            return true;
        }
        
        // Function to run the nett pay report
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //  format                  The format in which the report should be exported (csv or xls)
        //
        // Optional Parameters
        //  None
        public function runNettPayReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getNettPayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Is it a detailed report?
            if ($data['detail'] === 'detailed') {
                // Load all payslip items from database
                
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "", "CODE", "NAME", "PAYMENT METHOD", "BANK", "BRANCH", "ACCOUNT TYPE", "ACCOUNT NUMBER", "NETT PAY"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_nett_pay_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                for ($i=0; $i < count($reportData['employees']); $i++) { 
                    if ($data['format'] === 'csv') {
                        $reportData['employees'][$i]['employeeCode'] = $reportData['employees'][$i]['employeeCode'];
                        $reportData['employees'][$i]['employeeAlias'] = $reportData['employees'][$i]['employeeAlias'];
                        $reportData['employees'][$i]['paymentMethodName'] = $reportData['employees'][$i]['paymentMethodName'];
                        $reportData['employees'][$i]['financialInstitutionName'] = $reportData['employees'][$i]['financialInstitutionName'];
                        $reportData['employees'][$i]['branchCode'] = $reportData['employees'][$i]['branchCode'];
                        $reportData['employees'][$i]['bankAccountTypeName'] = $reportData['employees'][$i]['bankAccountTypeName'];
                        $reportData['employees'][$i]['accountNumber'] = $reportData['employees'][$i]['accountNumber'];
                        $reportData['employees'][$i]['nettPay'] = Util::currencyFormat($reportData['employees'][$i]['nettPay']);
                    }
                    $contents = [];
                    $contents[] = [
                        '',
                        $reportData['employees'][$i]['employeeCode'],
                        $reportData['employees'][$i]['employeeAlias'],
                        $reportData['employees'][$i]['paymentMethodName'],
                        $reportData['employees'][$i]['financialInstitutionName'],
                        $reportData['employees'][$i]['branchCode'],
                        $reportData['employees'][$i]['bankAccountTypeName'],
                        $reportData['employees'][$i]['accountNumber'],
                        $reportData['employees'][$i]['nettPay']
                    ];
                    
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                if ($data['format'] === 'csv') {
                    $nettPayTotal = Util::currencyFormat($reportData['nettPayTotal']);
                }
                else {
                    $nettPayTotal = $reportData['nettPayTotal'];
                }
                $content = [
                    'Total',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    $nettPayTotal
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "", "CODE", "NAME", "PAYMENT METHOD", "NETT PAY"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_nett_pay_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                if ($data['format'] === 'csv') {
                    $nettPayTotal = Util::currencyFormat($reportData['nettPayTotal']);
                }
                $content = [
                    'Total',
                    '-',
                    '-',
                    '-',
                    $nettPayTotal
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }
        
        // Function to run the nett pay pdf report
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function runNettPayPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getNettPayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['employees']); $i++ ) { 
                $reportRows[] = [
                    $reportData['employees'][$i]['employeeCode'],
                    $reportData['employees'][$i]['employeeAlias'],
                    $reportData['employees'][$i]['paymentMethodName'],
                    $reportData['employees'][$i]['financialInstitutionName'],
                    $reportData['employees'][$i]['branchCode'],
                    $reportData['employees'][$i]['bankAccountTypeName'],
                    $reportData['employees'][$i]['accountNumber'],
                    number_format($reportData['employees'][$i]['nettPay'], 2),
                ];
            }
            
            // Is it a summary report?
            if ($data['detail'] === 'summary') {
                // Display only the report totals
                $reportRows = [];
            }
            
            // // Format the report values for printing
            // for( $i = 0; $i < count($reportRows); $i++ ) {
            //     $reportRows[$i][3] = number_format($reportRows[$i][3], 2);
            // }
            
            // Add the report totals
            $reportRows[] = [
                'Total:',
                '',
                '',
                '',
                '',
                '',
                '',
                number_format($reportData['nettPayTotal'], 2)
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Nett Pay: ' . str_replace('_', ' ', $reportData['payrunName']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',            'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',   'width' => 25/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Payment Method',  'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Bank Name',       'width' => 15/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Branch Code',     'width' =>  8/100, 'alignment' => 'C' ];
            $reportCols [] = [ 'name' => 'Account Type',    'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Account Number',  'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Nett Pay',        'width' => 12/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_nett_pay_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the nett pay list
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function getNettPayList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getNettPayData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Save the employee details
            $employees = $reportData['employees'];
            $nettPayTotal = $reportData['nettPayTotal'];
            
            // Clear details if it's a summary report
            if ($data['detail'] === 'summary') {
                $employees = [];
            }
            
            // Add the totals
            $total = [
                'nettPayTotal' => $nettPayTotal
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $employees, 'total' => $total]) );
            return true;
        }
        
        // Function to run the EMP 201 report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  monthNumber             The number of the month (1-12) for the report
        //  detail                  Whether a full or summary report should be returned
        //  format                  The format in which the report should be exported
        //
        // Optional Parameters
        //  None
        public function runEmp201Report($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'monthNumber' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Save the employee details
            $employees = $reportData['employees'];
            
            // Clear the employees if the report is a summary
            if ($data['detail'] === 'summary') {
                $employees = [];
            }
            
            // Depending on the report detail
            if ($data['detail'] === 'detailed') {
                // Setup the headers
                $headers = [];
                $headers [] = [
                    "CODE", "NAME", "PAYE", "UIF", "SDL"
                ];
                
                // Inistialize the writer
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_' . $data['monthNumber'] . '_emp501', $headers);
                
                // For every employee
                for ($i=0; $i < count($employees); $i++) { 
                    // Format data for CSV
                    // if ($data['format'] === 'csv') {
                    //     $employees[$i]['employeeCode'] = '"' . $employees[$i]['employeeCode'] . '"';
                    // }
                    
                    // Set the content for the employee
                    $contents = [];
                    $contents[] = [
                        $employees[$i]['employeeCode'],
                        $employees[$i]['employeeAlias'],
                        (float)$employees[$i]['paye'],
                        (float)$employees[$i]['uif'],
                        (float)$employees[$i]['sdl']
                    ];
                    
                    // Write the employee content
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                // Set the content for the totals
                $content = [
                    'Totals',
                    '',
                    number_format((float)$reportData['totals']['payeTotal'], 2, '.', ''),
                    number_format((float)$reportData['totals']['uifTotal'], 2, '.', ''),
                    number_format((float)$reportData['totals']['sdlTotal'], 2, '.', '')
                ];
                
                // Write the content
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Setup the headers
                $headers = [];
                $headers [] = [
                    "", "PAYE", "UIF", "SDL"
                ];
                
                // Inistialize the writer
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_' . $data['monthNumber'] . '_emp501', $headers);
                
                // Set the content for the totals
                $content = [
                    'Totals',
                    number_format((float)$reportData['totals']['payeTotal'], 2, '.', ''),
                    number_format((float)$reportData['totals']['uifTotal'], 2, '.', ''),
                    number_format((float)$reportData['totals']['sdlTotal'], 2, '.', '')
                ];
                
                // Write the content
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }
        
        // Function to get the EMP 201 list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  monthNumber             The number of the month (1-12) for the report
        //  detail                  Whether a full or summary report should be returned
        //
        // Optional Parameters
        //  None
        public function runEmp201PdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'monthNumber' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set the tax month
            $taxMonth = $data['monthNumber'];
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Save the report rows
            $reportRows = [];
            foreach( $reportData['employees'] AS $employee ) {
                $reportRows[] = [
                    $employee['employeeCode'],
                    $employee['employeeAlias'],
                    number_format((float)$employee['paye'], 2, '.', ''),
                    number_format((float)$employee['uif'], 2, '.', ''),
                    number_format((float)$employee['sdl'], 2, '.', '')
                ];
            }
            
            // Is it a summary report?
            if ($data['detail'] === 'summary') {
                // Display only the report totals
                $reportRows = [];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                number_format($reportData['totals']['payeTotal'], 2),
                number_format($reportData['totals']['uifTotal'], 2),
                number_format($reportData['totals']['sdlTotal'], 2)
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - EMP 201: ' . $data['taxYear'] . '/' . (($taxMonth < 10) ? ('0' . $taxMonth) : $taxMonth);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',            'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',   'width' => 45/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'PAYE Total',      'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'UIF Total',       'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'SDL Total',       'width' => 15/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_emp_201_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the EMP 201 list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  monthNumber             The number of the month (1-12) for the report
        //  detail                  Whether a full or summary report should be returned
        //
        // Optional Parameters
        //  None
        public function getEmp201List($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'monthNumber' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Is it a summary report?
            if ($data['detail'] === 'summary') {
                // Clear the employee data
                $reportData['employees'] = [];
            }
            
            // Format the totals
            $total = [
                'payeTotal' => number_format((float)$reportData['totals']['payeTotal'], 2, '.', ''),
                'uifTotal' => number_format((float)$reportData['totals']['uifTotal'], 2, '.', ''),
                'sdlTotal' => number_format((float)$reportData['totals']['sdlTotal'], 2, '.', '')
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $total]) );
            return true;
        }
        
        // Function to run the EMP 501 report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  reconciliationType      The reconcilaition type 'ANNU' (annual) or 'INTE' (interim)
        //  format                  The format in which the report should be exported
        //
        // Optional Parameters
        //  None
        public function runEmp501Report($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'reconciliationType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp501Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Set the headers headers 
            $headers = [];
            $headers [] = ["MONTH", "PAYE", "UIF", "SDL", "TOTAL LIABILITY" ];
            
            // Initialize the writer
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_emp501', $headers);
            
            // For every result
            for( $i=0; $i < count($reportData['results']); $i++ ) {
                // Convert the month number to text
                $dateObject = DateTime::createFromFormat('!m', $reportData['results'][$i]['month']);
                $monthName = $dateObject->format('F');
                
                $contents = [];
                $contents[] = [
                    $monthName,
                    $reportData['results'][$i]['payeAmount'],
                    $reportData['results'][$i]['uifAmount'],
                    $reportData['results'][$i]['sdlAmount'],
                    $reportData['results'][$i]['liabilityAmount']
                ];
                
                foreach($contents as $content) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                }
            }
            
            // Add the totals
            $content = [
                'Total',
                (int) $reportData['totals']['payeTotal'],
                (int) $reportData['totals']['uifTotal'],
                (int) $reportData['totals']['sdlTotal'],
                (int) $reportData['totals']['liabilityTotal']
            ];
            $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            
            // Close the writer
            $writer->close();
        }
        
        // Function to get the EMP 501 list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  reconciliationType      The reconcilaition type 'ANNU' (annual) or 'INTE' (interim)
        //
        // Optional Parameters
        //  None
        public function runEmp501PdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'reconciliationType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // // Set the number of months to process depending on the reconciliation type
            // $numMonths = 12;
            // if( $data['reconciliationType'] === 'INTE' ) {
            //     $numMonths = 6;
            // }
            
            // $reportRows = [];
            // $payeTotal = 0;
            // $uifTotal = 0;
            // $sdlTotal = 0;
            // $liabilityTotal = 0;
            
            // // For every month of the tax year (starting in March of the previous year)
            // $taxMonth = 3;
            // $actualYear = $data['taxYear'] - 1;
            // for( $i = 0; $i < $numMonths; $i++ ) {
            //     // Get the payrun totals for payruns in the given period
            //     $sqlQuery =
            //         'SELECT ' .
            //             'payslip_items.payslip_item_type_code, ' .
            //             'SUM( payslip_items.total ) AS total ' .
            //         'FROM ' .
            //             'payslips ' .
            //         'LEFT JOIN ' .
            //             'payruns ON payruns.id = payslips.payrun_id ' .
            //         'LEFT JOIN ' .
            //             'payslip_items ON payslip_items.payslip_id = payslips.id ' .
            //         'WHERE ' .
            //             'payslips.status_code = \'ACTI\' AND ' .
            //             'payruns.processed_on IS NOT NULL AND ' .
            //             'EXTRACT(MONTH FROM payslips.to_date) = $1 AND ' .
            //             'EXTRACT(YEAR FROM payslips.to_date) = $2 ' .
            //         'GROUP BY ' .
            //             'payslip_items.payslip_item_type_code;';
            //     $sqlResult = $db->paramQuery($sqlQuery, [$taxMonth, $actualYear]);
            //     if( !$sqlResult->isValid() ) {
            //         echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //         return false;
            //     }
                
            //     // Calculate the totals for the tax month
            //     $payeAmount = 0;
            //     $uifAmount = 0;
            //     $sdlAmount = 0;
            //     $liabilityAmount = 0;
            //     while( $sqlRow = $sqlResult->fetchAssociative() ) {
            //         // Add to the totals depending on the type
            //         if( ($sqlRow['payslip_item_type_code'] == '2000') || ($sqlRow['payslip_item_type_code'] == '2001') ) {
            //             $liabilityAmount = $liabilityAmount + $sqlRow['total'];
            //             $payeAmount = $payeAmount + $sqlRow['total'];
            //         }
            //         else if( ($sqlRow['payslip_item_type_code'] == '2002') || ($sqlRow['payslip_item_type_code'] == '3001') ) {
            //             $liabilityAmount = $liabilityAmount + $sqlRow['total'];
            //             $uifAmount = $uifAmount + $sqlRow['total'];
            //         }
            //         else if( $sqlRow['payslip_item_type_code'] == '3002' ) {
            //             $liabilityAmount = $liabilityAmount + $sqlRow['total'];
            //             $sdlAmount = $sdlAmount + $sqlRow['total'];
            //         }
            //     }
                
            //     // Convert the month to a date object so we can get the month name
            //     $taxMonthDate = DateTime::createFromFormat('!m', $taxMonth);
            //     // $monthName = $dateObj->format('F');
                
            //     // Add the amounts to the result
            //     $reportRows[] = [
            //         $taxMonthDate->format('F'),
            //         number_format((int)$payeAmount, 0, '.', ' '),
            //         number_format((int)$uifAmount, 0, '.', ' '),
            //         number_format((int)$sdlAmount, 0, '.', ' '),
            //         number_format((int)$liabilityAmount, 0, '.', ' ')
            //     ];
                
            //     // Add the amounts to the totals
            //     $payeTotal = $payeTotal + $payeAmount;
            //     $uifTotal = $uifTotal + $uifAmount;
            //     $sdlTotal = $sdlTotal + $sdlAmount;
            //     $liabilityTotal = $liabilityTotal + $liabilityAmount;
                
            //     // Go to the next month
            //     $taxMonth = $taxMonth + 1;
                
            //     // Reset the month, if greater than 12
            //     if($taxMonth > 12 ) $taxMonth = 1;
                
            //     // Are we in the given tax year?
            //     if( $taxMonth < 3 ) { 
            //         // Set the year to the given tax year
            //         $actualYear = $data['taxYear'];
            //     }
            // }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp501Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Add the report rows
            foreach( $reportData['results'] AS $result ) {
                $reportRows[] = [
                    $result['monthName'],
                    number_format((int)$result['payeAmount'], 0, '.', ' '),
                    number_format((int)$result['uifAmount'], 0, '.', ' '),
                    number_format((int)$result['sdlAmount'], 0, '.', ' '),
                    number_format((int)$result['liabilityAmount'], 0, '.', ' ')
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                number_format((int)$reportData['totals']['payeTotal'], 0, '.', ' '),
                number_format((int)$reportData['totals']['uifTotal'], 0, '.', ' '),
                number_format((int)$reportData['totals']['sdlTotal'], 0, '.', ' '),
                number_format((int)$reportData['totals']['liabilityTotal'], 0, '.', ' ')
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - EMP 501: ' . $data['taxYear'] . ' ' . (($data['reconciliationType'] === 'INTE') ? '(Interim)' : '(Annual)');
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Month',                   'width' => 40/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'PAYE',                    'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'UIF',                     'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'SDL',                     'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Total Monthly Liability', 'width' => 15/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_emp_501_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the EMP 501 list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  reconciliationType      The reconcilaition type 'ANNU' (annual) or 'INTE' (interim)
        //
        // Optional Parameters
        //  None
        public function getEmp501List($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'reconciliationType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEmp501Data($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'results' => $reportData['results'], 'totals' => $reportData['totals']]) );
            return true;
        }
        
        // Function to get the earnings and cost analysis 
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //  format                  The format in whic the report should be exported
        //
        // Optional Parameters
        //  None
        public function runEarningsCostAnalysisReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Is it a detailed report?
            $incomeTotal = 0;
            $deductionsTotal = 0;
            $companyContributionsTotal = 0;
            $fringeBenefitsTotal = 0;
            $allowancesTotal = 0;
            if ($data['detail'] === 'detailed') {
                // Load all payslip items from database
                
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "", "CODE", "NAME", "EARNINGS", "ALLOWANCES", "DEDUCTIONS", "COMPANY CONTRIBUTIONS", "FRINGE BENEFITS"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_earnings_cost_analysis_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                for ($i=0; $i < count($reportData['employees']); $i++) { 
                    if ($data['format'] === 'csv') {
                        $employees[$i]['employeeCode'] = $reportData['employees'][$i]['employeeCode'];
                        $employees[$i]['employeeAlias'] = $reportData['employees'][$i]['employeeAlias'];
                        $employees[$i]['income'] = Util::currencyFormat($reportData['employees'][$i]['income']);
                        $employees[$i]['allowances'] = Util::currencyFormat($reportData['employees'][$i]['allowances']);
                        $employees[$i]['deductions'] = Util::currencyFormat($reportData['employees'][$i]['deductions']);
                        $employees[$i]['companyContributions'] = Util::currencyFormat($reportData['employees'][$i]['companyContributions']);
                        $employees[$i]['fringeBenefits'] = Util::currencyFormat($reportData['employees'][$i]['fringeBenefits']);
                    }
                    else {
                        $employees[$i]['employeeCode'] = $reportData['employees'][$i]['employeeCode'];
                        $employees[$i]['employeeAlias'] = $reportData['employees'][$i]['employeeAlias'];
                        $employees[$i]['income'] = floatval($reportData['employees'][$i]['income']);
                        $employees[$i]['allowances'] = floatval($reportData['employees'][$i]['allowances']);
                        $employees[$i]['deductions'] = floatval($reportData['employees'][$i]['deductions']);
                        $employees[$i]['companyContributions'] = floatval($reportData['employees'][$i]['companyContributions']);
                        $employees[$i]['fringeBenefits'] = floatval($reportData['employees'][$i]['fringeBenefits']);
                    }
                    
                    $contents = [];
                    $contents[] = [
                        '',
                        $employees[$i]['employeeCode'],
                        $employees[$i]['employeeAlias'],
                        $employees[$i]['income'],
                        $employees[$i]['allowances'],
                        $employees[$i]['deductions'],
                        $employees[$i]['companyContributions'],
                        $employees[$i]['fringeBenefits']
                    ];
                    
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                if ($data['format'] === 'csv') {
                    $incomeTotal = Util::currencyFormat($reportData['totals']['incomeTotal']);
                    $allowancesTotal = Util::currencyFormat($reportData['totals']['allowancesTotal']);
                    $deductionsTotal = Util::currencyFormat($reportData['totals']['deductionsTotal']);
                    $companyContributionsTotal = Util::currencyFormat($reportData['totals']['companyContributionsTotal']);
                    $fringeBenefitsTotal = Util::currencyFormat($reportData['totals']['fringeBenefitsTotal']);
                }
                else {
                    $incomeTotal = floatval($reportData['totals']['incomeTotal']);
                    $allowancesTotal = floatval($reportData['totals']['allowancesTotal']);
                    $deductionsTotal = floatval($reportData['totals']['deductionsTotal']);
                    $companyContributionsTotal = floatval($reportData['totals']['companyContributionsTotal']);
                    $fringeBenefitsTotal = floatval($reportData['totals']['fringeBenefitsTotal']);
                }
                
                $content = [
                    'Total',
                    '',
                    '',
                    $incomeTotal,
                    $allowancesTotal,
                    $deductionsTotal,
                    $companyContributionsTotal,
                    $fringeBenefitsTotal
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "", "EARNINGS", "ALLOWANCES", "DEDUCTIONS", "COMPANY CONTRIBUTIONS", "FRINGE BENEFITS"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_earnings_cost_analysis_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                if ($data['format'] === 'csv') {
                    $incomeTotal = Util::currencyFormat($reportData['totals']['incomeTotal']);
                    $allowancesTotal = Util::currencyFormat($reportData['totals']['allowancesTotal']);
                    $deductionsTotal = Util::currencyFormat($reportData['totals']['deductionsTotal']);
                    $companyContributionsTotal = Util::currencyFormat($reportData['totals']['companyContributionsTotal']);
                    $fringeBenefitsTotal = Util::currencyFormat($reportData['totals']['fringeBenefitsTotal']);
                }
                else {
                    $incomeTotal = floatval($reportData['totals']['incomeTotal']);
                    $allowancesTotal = floatval($reportData['totals']['allowancesTotal']);
                    $deductionsTotal = floatval($reportData['totals']['deductionsTotal']);
                    $companyContributionsTotal = floatval($reportData['totals']['companyContributionsTotal']);
                    $fringeBenefitsTotal = floatval($reportData['totals']['fringeBenefitsTotal']);
                }
                $content = [
                    'Total',
                    $incomeTotal,
                    $allowancesTotal,
                    $deductionsTotal,
                    $companyContributionsTotal,
                    $fringeBenefitsTotal
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }
        
        // Function to create the earnings and cost analysis report in PDF format
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function runEarningsCostAnalysisPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['employees']); $i++ ) { 
                $reportRows[] = [
                    $reportData['employees'][$i]['employeeCode'],
                    $reportData['employees'][$i]['employeeAlias'],
                    $reportData['employees'][$i]['income'],
                    $reportData['employees'][$i]['allowances'],
                    $reportData['employees'][$i]['deductions'],
                    $reportData['employees'][$i]['companyContributions'],
                    $reportData['employees'][$i]['fringeBenefits']
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                number_format($reportData['totals']['incomeTotal'], 2),
                number_format($reportData['totals']['allowancesTotal'], 2),
                number_format($reportData['totals']['deductionsTotal'], 2),
                number_format($reportData['totals']['companyContributionsTotal'], 2),
                number_format($reportData['totals']['fringeBenefitsTotal'], 2)
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Earnings / Cost Analysis Report' . ': ' . str_replace('_', ' ', $reportData['payrunName']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                   'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',          'width' => 30/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Earnings',               'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Allowances',             'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Deductions',             'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Company Contributions',  'width' => 12/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Fringe Benefits',        'width' => 12/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_earnings_cost_analysis_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the earnings and cost analysis 
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function getEarningsCostAnalysisList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]) );
            return true;
        }
        
        // Function to run the payrun report
        //
        // Required Parameters
        //  payrunId                The id of the payrun for wich the report should be run
        //  format                  The format in which the report should be exported
        //
        // Optional Parameters
        //  None
        public function runPayslipReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Initialize company array
            $company = [];
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "DATE","CODE","ALIAS", "FULL NAMES", "LAST NAME", "ID NUMBER", "EMAIL ADDRESS", "EMPLOYER UIF", 
                "SDL","COMPANY CONTRIBUTIONS", "FRINGE BENEFITS", "EARNINGS", "ALLOWANCES", "GROSS PAY", 
                "PAYE","EMPLOYEE UIF", "OTHER DEDUCTIONS", "TOTAL DEDUCTIONS", "NET PAY"
            ];
            
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_payrun_report', $headers);
            
            foreach( $reportData['employees'] AS $employee ) {
                $contents = [];
                $contents[] = [
                    $employee['toDate'],
                    $employee['code'],
                    $employee['alias'],
                    $employee['fullNames'],
                    $employee['lastName'],
                    $employee['idNumber'],
                    $employee['emailAddress'],
                    $employee['totalEmployerUif'],
                    $employee['totalSdl'],
                    $employee['totalContributions'],
                    $employee['totalFringeBenefits'], 
                    $employee['totalIncome'],
                    $employee['totalAllowances'],
                    $employee['grossIncome'],
                    $employee['totalPaye'],
                    $employee['totalEmployeeUif'],
                    $employee['totalOtherDeductions'],
                    $employee['totalDeductions'],
                    $employee['netIncome']
                ];
                
                foreach($contents as $content) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
               }
            }
            $writer->close();
        }
        
        // Function to run the payrun pdf report
        //
        // Required Parameters
        //  payrunId                The id of the payrun for wich the report should be run
        //
        // Optional Parameters
        //  None
        public function runPayslipPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Initialize company array
            $company = [];
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the payrun details
            $sqlQuery = 
                'SELECT ' .
                    'payruns.description ' .
                'FROM ' .
                    'payruns ' .
                'WHERE ' .
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $data['payrunId'] . '\' not found.']) );
                return false;
            }
            
            // Create payrun details
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunDescription = $sqlRow['description'];
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            $reportRows = [];
            foreach( $reportData['employees'] AS $employee ) {
                $reportRows[] = [
                    $employee['code'],
                    $employee['alias'],
                    number_format($employee['totalEmployerUif'], 2),
                    number_format($employee['totalSdl'], 2),
                    number_format($employee['totalContributions'], 2),
                    number_format($employee['totalFringeBenefits'], 2), 
                    number_format($employee['totalIncome'], 2),
                    number_format($employee['totalAllowances'], 2),
                    number_format($employee['grossIncome'], 2),
                    number_format($employee['totalPaye'], 2),
                    number_format($employee['totalEmployeeUif'], 2),
                    number_format($employee['totalOtherDeductions'], 2),
                    number_format($employee['totalDeductions'], 2),
                    number_format($employee['netIncome'], 2)
                ];
            }
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Payslips: ' . $payrunDescription;
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                    'width' =>  4/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',           'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employer UIF',            'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'SDL',                     'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Company Contributions',   'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Fringe Benefits',         'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Earnings',                'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Allowances',              'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Gross Pay',               'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'PAYE',                    'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Employee UIF',            'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Other Deductions',        'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Total Deductions',        'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Net Pay',                 'width' =>  7/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 6,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 6,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_payrun_report_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the earnings and cost analysis 
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //  format                  The format in which the report should be exported (csv or xls)
        //
        // Optional Parameters
        //  None
        public function runPayslipItemsReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            $totalEmployerUif = $reportData['totals']['totalEmployerUif'];
            $totalSdl = $reportData['totals']['totalSdl'];
            $totalContributions = $reportData['totals']['totalContributions'];
            $totalFringeBenefits = $reportData['totals']['totalFringeBenefits'];
            $totalIncome = $reportData['totals']['totalIncome'];
            $totalAllowances = $reportData['totals']['totalAllowances'];
            $totalGrossIncome = $reportData['totals']['totalGrossIncome'];
            $totalPaye = $reportData['totals']['totalPaye'];
            $totalEmployeeUif = $reportData['totals']['totalEmployeeUif'];
            $totalOtherDeductions = $reportData['totals']['totalOtherDeductions'];
            $totalDeductions = $reportData['totals']['totalDeductions'];
            $totalNetIncome = $reportData['totals']['totalNetIncome'];
            
            // Is it a detailed report?
            if ($data['detail'] === 'detailed') {
                // Load all payslip items from database
                
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "","CODE","ALIAS", "FULL NAMES", "LAST NAME", "ID NUMBER", "EMAIL ADDRESS", "EMPLOYER UIF", 
                    "SDL","COMPANY CONTRIBUTIONS", "FRINGE BENEFITS", "EARNINGS", "ALLOWANCES", "GROSS PAY", 
                    "PAYE","EMPLOYEE UIF", "OTHER DEDUCTIONS", "TOTAL DEDUCTIONS", "NET PAY"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                for ($i=0; $i < count($reportData['employees']); $i++) { 
                    if ($data['format'] === 'csv') {
                        $reportData['employees'][$i]['totalEmployerUif'] = Util::currencyFormat($reportData['employees'][$i]['totalEmployerUif']);
                        $reportData['employees'][$i]['totalSdl'] = Util::currencyFormat($reportData['employees'][$i]['totalSdl']);
                        $reportData['employees'][$i]['totalContributions'] = Util::currencyFormat($reportData['employees'][$i]['totalContributions']);
                        $reportData['employees'][$i]['totalFringeBenefits'] = Util::currencyFormat($reportData['employees'][$i]['totalFringeBenefits']);
                        $reportData['employees'][$i]['totalIncome'] = Util::currencyFormat($reportData['employees'][$i]['totalIncome']);
                        $reportData['employees'][$i]['totalAllowances'] = Util::currencyFormat($reportData['employees'][$i]['totalAllowances']);
                        $reportData['employees'][$i]['grossIncome'] = Util::currencyFormat($reportData['employees'][$i]['grossIncome']);
                        $reportData['employees'][$i]['totalPaye'] = Util::currencyFormat($reportData['employees'][$i]['totalPaye']);
                        $reportData['employees'][$i]['totalEmployeeUif'] = Util::currencyFormat($reportData['employees'][$i]['totalEmployeeUif']);
                        $reportData['employees'][$i]['totalOtherDeductions'] = Util::currencyFormat($reportData['employees'][$i]['totalOtherDeductions']);
                        $reportData['employees'][$i]['totalDeductions'] = Util::currencyFormat($reportData['employees'][$i]['totalDeductions']);
                        $reportData['employees'][$i]['netIncome'] = Util::currencyFormat($reportData['employees'][$i]['netIncome']);
                    }
                    else {
                        $reportData['employees'][$i]['totalEmployerUif'] = floatval($reportData['employees'][$i]['totalEmployerUif']);
                        $reportData['employees'][$i]['totalSdl'] = floatval($reportData['employees'][$i]['totalSdl']);
                        $reportData['employees'][$i]['totalContributions'] = floatval($reportData['employees'][$i]['totalContributions']);
                        $reportData['employees'][$i]['totalFringeBenefits'] = floatval($reportData['employees'][$i]['totalFringeBenefits']);
                        $reportData['employees'][$i]['totalIncome'] = floatval($reportData['employees'][$i]['totalIncome']);
                        $reportData['employees'][$i]['totalAllowances'] = floatval($reportData['employees'][$i]['totalAllowances']);
                        $reportData['employees'][$i]['grossIncome'] = floatval($reportData['employees'][$i]['grossIncome']);
                        $reportData['employees'][$i]['totalPaye'] = floatval($reportData['employees'][$i]['totalPaye']);
                        $reportData['employees'][$i]['totalEmployeeUif'] = floatval($reportData['employees'][$i]['totalEmployeeUif']);
                        $reportData['employees'][$i]['totalOtherDeductions'] = floatval($reportData['employees'][$i]['totalOtherDeductions']);
                        $reportData['employees'][$i]['totalDeductions'] = floatval($reportData['employees'][$i]['totalDeductions']);
                        $reportData['employees'][$i]['netIncome'] = floatval($reportData['employees'][$i]['netIncome']);
                    }
                    
                    $contents = [];
                    $contents[] = [
                        '',
                        $reportData['employees'][$i]['employeeCode'],
                        $reportData['employees'][$i]['employeeAlias'],
                        // $reportData['employees'][$i]['employeeId'],
                        $reportData['employees'][$i]['employeeFullNames'],
                        $reportData['employees'][$i]['employeeLastName'],
                        $reportData['employees'][$i]['employeeIdNumber'],
                        $reportData['employees'][$i]['employeeEmailAddress'],
                        $reportData['employees'][$i]['totalEmployerUif'],
                        $reportData['employees'][$i]['totalSdl'],
                        $reportData['employees'][$i]['totalContributions'],
                        $reportData['employees'][$i]['totalFringeBenefits'],
                        $reportData['employees'][$i]['totalIncome'],
                        $reportData['employees'][$i]['totalAllowances'],
                        $reportData['employees'][$i]['grossIncome'],
                        $reportData['employees'][$i]['totalPaye'],
                        $reportData['employees'][$i]['totalEmployeeUif'],
                        $reportData['employees'][$i]['totalOtherDeductions'],
                        $reportData['employees'][$i]['totalDeductions'],
                        $reportData['employees'][$i]['netIncome']
                    ];
                    
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                if ($data['format'] === 'csv') {
                    $totalEmployerUif = Util::currencyFormat($totalEmployerUif);
                    $totalSdl = Util::currencyFormat($totalSdl);
                    $totalContributions = Util::currencyFormat($totalContributions);
                    $totalFringeBenefits = Util::currencyFormat($totalFringeBenefits);
                    $totalIncome = Util::currencyFormat($totalIncome);
                    $totalAllowances = Util::currencyFormat($totalAllowances);
                    $totalGrossIncome = Util::currencyFormat($totalGrossIncome);
                    $totalPaye = Util::currencyFormat($totalPaye);
                    $totalEmployeeUif = Util::currencyFormat($totalEmployeeUif);
                    $totalOtherDeductions = Util::currencyFormat($totalOtherDeductions);
                    $totalDeductions = Util::currencyFormat($totalDeductions);
                    $totalNetIncome = Util::currencyFormat($totalNetIncome);
                }
                else {
                    $totalEmployerUif = floatval($totalEmployerUif);
                    $totalSdl = floatval($totalSdl);
                    $totalContributions = floatval($totalContributions);
                    $totalFringeBenefits = floatval($totalFringeBenefits);
                    $totalIncome = floatval($totalIncome);
                    $totalAllowances = floatval($totalAllowances);
                    $totalGrossIncome = floatval($totalGrossIncome);
                    $totalPaye = floatval($totalPaye);
                    $totalEmployeeUif = floatval($totalEmployeeUif);
                    $totalOtherDeductions = floatval($totalOtherDeductions);
                    $totalDeductions = floatval($totalDeductions);
                    $totalNetIncome = floatval($totalNetIncome);
                }
                
                $content = [
                    'Total',
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    $totalEmployerUif,
                    $totalSdl,
                    $totalContributions,
                    $totalFringeBenefits,
                    $totalIncome,
                    $totalAllowances,
                    $totalGrossIncome,
                    $totalPaye,
                    $totalEmployeeUif,
                    $totalOtherDeductions,
                    $totalDeductions,
                    $totalNetIncome
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "", "EMPLOYER UIF", "SDL","COMPANY CONTRIBUTIONS", "FRINGE BENEFITS", "EARNINGS", "ALLOWANCES", 
                    "GROSS PAY", "PAYE","EMPLOYEE UIF", "OTHER DEDUCTIONS", "TOTAL DEDUCTIONS", "NET PAY"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                if ($data['format'] === 'csv') {
                    $totalEmployerUif = Util::currencyFormat($totalEmployerUif);
                    $totalSdl = Util::currencyFormat($totalSdl);
                    $totalContributions = Util::currencyFormat($totalContributions);
                    $totalFringeBenefits = Util::currencyFormat($totalFringeBenefits);
                    $totalIncome = Util::currencyFormat($totalIncome);
                    $totalAllowances = Util::currencyFormat($totalAllowances);
                    $totalGrossIncome = Util::currencyFormat($totalGrossIncome);
                    $totalPaye = Util::currencyFormat($totalPaye);
                    $totalEmployeeUif = Util::currencyFormat($totalEmployeeUif);
                    $totalOtherDeductions = Util::currencyFormat($totalOtherDeductions);
                    $totalDeductions = Util::currencyFormat($totalDeductions);
                    $totalNetIncome = Util::currencyFormat($totalNetIncome);
                }
                else {
                    $totalEmployerUif = floatval($totalEmployerUif);
                    $totalSdl = floatval($totalSdl);
                    $totalContributions = floatval($totalContributions);
                    $totalFringeBenefits = floatval($totalFringeBenefits);
                    $totalIncome = floatval($totalIncome);
                    $totalAllowances = floatval($totalAllowances);
                    $totalGrossIncome = floatval($totalGrossIncome);
                    $totalPaye = floatval($totalPaye);
                    $totalEmployeeUif = floatval($totalEmployeeUif);
                    $totalOtherDeductions = floatval($totalOtherDeductions);
                    $totalDeductions = floatval($totalDeductions);
                    $totalNetIncome = floatval($totalNetIncome);
                }
                
                $content = [
                    'Total',
                    $totalEmployerUif,
                    $totalSdl,
                    $totalContributions,
                    $totalFringeBenefits,
                    $totalIncome,
                    $totalAllowances,
                    $totalGrossIncome,
                    $totalPaye,
                    $totalEmployeeUif,
                    $totalOtherDeductions,
                    $totalDeductions,
                    $totalNetIncome
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }
        
        // Function to create the earnings and cost analysis report in PDF format
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function runPayslipItemsPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            $totalEmployerUif = $reportData['totals']['totalEmployerUif'];
            $totalSdl = $reportData['totals']['totalSdl'];
            $totalContributions = $reportData['totals']['totalContributions'];
            $totalFringeBenefits = $reportData['totals']['totalFringeBenefits'];
            $totalIncome = $reportData['totals']['totalIncome'];
            $totalAllowances = $reportData['totals']['totalAllowances'];
            $totalGrossIncome = $reportData['totals']['totalGrossIncome'];
            $totalPaye = $reportData['totals']['totalPaye'];
            $totalEmployeeUif = $reportData['totals']['totalEmployeeUif'];
            $totalOtherDeductions = $reportData['totals']['totalOtherDeductions'];
            $totalDeductions = $reportData['totals']['totalDeductions'];
            $totalNetIncome = $reportData['totals']['totalNetIncome'];
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['employees']); $i++ ) { 
                $reportRows[] = [
                    $reportData['employees'][$i]['employeeCode'],
                    $reportData['employees'][$i]['employeeAlias'],
                    number_format($reportData['employees'][$i]['totalEmployerUif'], 2),
                    number_format($reportData['employees'][$i]['totalSdl'], 2),
                    number_format($reportData['employees'][$i]['totalContributions'], 2),
                    number_format($reportData['employees'][$i]['totalFringeBenefits'], 2),
                    number_format($reportData['employees'][$i]['totalIncome'], 2),
                    number_format($reportData['employees'][$i]['totalAllowances'], 2),
                    number_format($reportData['employees'][$i]['grossIncome'], 2),
                    number_format($reportData['employees'][$i]['totalPaye'], 2),
                    number_format($reportData['employees'][$i]['totalEmployeeUif'], 2),
                    number_format($reportData['employees'][$i]['totalOtherDeductions'], 2),
                    number_format($reportData['employees'][$i]['totalDeductions'], 2),
                    number_format($reportData['employees'][$i]['netIncome'], 2)
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Total',
                '',
                number_format($totalEmployerUif, 2),
                number_format($totalSdl, 2),
                number_format($totalContributions, 2),
                number_format($totalFringeBenefits, 2),
                number_format($totalIncome, 2),
                number_format($totalAllowances, 2),
                number_format($totalGrossIncome, 2),
                number_format($totalPaye, 2),
                number_format($totalEmployeeUif, 2),
                number_format($totalOtherDeductions, 2),
                number_format($totalDeductions, 2),
                number_format($totalNetIncome, 2)
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Payslip Items Report: ' . str_replace('_', ' ', $reportData['payrunName']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                    'width' =>  4/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',           'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employer UIF',            'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'SDL',                     'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Company Contributions',   'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Fringe Benefits',         'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Earnings',                'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Allowances',              'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Gross Pay',               'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'PAYE',                    'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Employee UIF',            'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Other Deductions',        'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Total Deductions',        'width' =>  7/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Net Pay',                 'width' =>  7/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_payslip_items_report_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the payrun details
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function getPayslipItemsList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]) );
            return true;
        }
        
        // Function to run the return of earnings report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //  format                  The format in which the report should be exported
        //
        // Optional Parameters
        //  None
        public function runReturnOfEarningsReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['results']); $i++ ) { 
                // Convert the month to a date object so we can get the month name
                $taxMonthDate = DateTime::createFromFormat('!m', $reportData['results'][$i]['month']);
                
                // Add the amounts to the result
                $reportRows[] = [
                    $taxMonthDate->format('F'),
                    (int)$reportData['results'][$i]['employeeCount'], // number_format($results[$i]['employeeCount'], 0, '.', ''),
                    (int)$reportData['results'][$i]['grossIncomeAmount'], // number_format($results[$i]['grossIncomeAmount'], 0, '.', '')
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                (int)$reportData['totals']['grossIncomeTotal'], // number_format((int)$grossIncomeTotal, 0, '.', '')
            ];
            
            // Set the headers headers 
            $headers = [];
            $headers [] = ["MONTH", "NUMBER OF EMPLOYEES", "EARNINGS (RANDS ONLY)" ];
            
            // Initialize the writer
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear']-1) . '_return_of_earnings', $headers);
            
            // Add the report rows
            foreach($reportRows as $content) {
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            // Close the writer
            $writer->close();
        }
        
        // Function to run the return of earnings PDF report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //
        // Optional Parameters
        //  None
        public function runReturnOfEarningsPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['results']); $i++ ) { 
                // Convert the month to a date object so we can get the month name
                $taxMonthDate = DateTime::createFromFormat('!m', $reportData['results'][$i]['month']);
                
                // Add the amounts to the result
                $reportRows[] = [
                    $taxMonthDate->format('F'),
                    number_format($reportData['results'][$i]['employeeCount'], 0, '.', ' '),
                    number_format($reportData['results'][$i]['grossIncomeAmount'], 0, '.', ' ')
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                number_format((int)$reportData['totals']['grossIncomeTotal'], 0, '.', ' ')
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Return of Earnings (ROE): ' . ($data['taxYear']-1);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Month',                 'width' => 70/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Number of Employees',   'width' => 15/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Earnings (Rands Only)', 'width' => 15/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear']-1) . '_return_of_earnings_' . date('Ymd') . '.pdf';;
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the return of earnings list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //
        // Optional Parameters
        //  None
        public function getReturnOfEarningsList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'results' => $reportData['results'], 'totals' => $reportData['totals']]) );
            return true;
        }

        // Function to get the detailed payroll report (Coida) list
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //
        // Optional Parameters
        //  None
        public function getDetailedPayrollReportList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'results' => $reportData['results']]) );
            return true;
        }

        // Function to run the detailed payroll (COIDA) report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //  format                  The format in which the report should be exported
        //
        // Optional Parameters
        //  None
        public function runDetailedPayrollReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['results']); $i++ ) { 
                // Convert the month to a date object so we can get the month name
                $taxMonthDate = DateTime::createFromFormat('!m', $reportData['results'][$i]['month']);
                
                // Add the amounts to the result
                $reportRows[] = [
                    $reportData['results'][$i]['name'],
                    $reportData['results'][$i]['idno'],
                    $reportData['results'][$i]['email'],
                    $reportData['results'][$i]['cellphone'],
                    $reportData['results'][$i]['wage_types'],
                    $reportData['results'][$i]['gross_income'], // number_format($results[$i]['grossIncomeAmount'], 0, '.', '')
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                '',
                '',
                '',
                (int)$reportData['totals']['grossIncomeTotal'], // number_format((int)$grossIncomeTotal, 0, '.', '')
            ];
            
            // Set the headers headers 
            $headers = [];
            $headers [] = ["NAME", "ID NUMBER", "EMAIL ADDRESS", "CELLPHONE NUMBER", "WAGE TYPES", "GROSS INCOME" ];
            
            // Initialize the writer
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear']) . '_detailed_payroll_report', $headers);
            
            // Add the report rows
            foreach($reportRows as $content) {
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            // Close the writer
            $writer->close();
        }
        
        // Function to run the return of earnings PDF report
        //
        // Required Parameters
        //  taxYear                 The tax year (i.e., 2020 for the 2019/2020 tax period)
        //  departmentId            The the id of the department for the report
        //  disableEarningsCap      Whether the earnings cap should be disbale (true/false)
        //
        // Optional Parameters
        //  None
        public function runDetailedPayrollPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'disableEarningsCap' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['results']); $i++ ) { 
                
                
                // Add the amounts to the result
                $reportRows[] = [
                    $reportData['results'][$i]['name'],
                    $reportData['results'][$i]['idno'],
                    $reportData['results'][$i]['email'],
                    $reportData['results'][$i]['cellphone'],
                    $reportData['results'][$i]['wage_types'],
                    number_format($reportData['results'][$i]['gross_income'], 2, '.', ' ')
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals:',
                '',
                '',
                '',
                '',
                number_format($reportData['totals']['grossIncomeTotal'], 2, '.', ' ')
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Detailed Payroll Report (COIDA): ' . ($data['taxYear']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Name',                 'width' => 25/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'ID Number',            'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Email Address',        'width' => 20/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cellphone Number',     'width' => 10/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Wage Types',           'width' => 25/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Gross Income',         'width' => 10/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear']-1) . '_detailed_payroll_report_' . date('Ymd') . '.pdf';;
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to export the overtime report to csv or xls 
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //  format                  The format in which the report should be exported (csv or xls)
        //
        // Optional Parameters
        //  None
        public function runOvertimeReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            $totalOvertimeUnits = $reportData['totals']['totalOvertimeUnits'];
            $totalOvertimeAmount = $reportData['totals']['totalOvertimeAmount'];
            
            // Is it a detailed report?
            if ($data['detail'] === 'detailed') {
                // Load all payslip items from database
                
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "CODE", "ALIAS", "FULL NAMES", "LAST NAME", "ID/PASSPORT NUMBER", "CELL NUMBER", "EMAIL ADDRESS", 
                    "HOURS WORKED", "AMOUNT EARNED"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                for ($i=0; $i < count($reportData['employees']); $i++) { 
                    // if ($data['format'] === 'csv') {
                    //     $reportData['employees'][$i]['overtimeUnits'] = Util::currencyFormat($reportData['employees'][$i]['overtimeUnits']);
                    //     $reportData['employees'][$i]['overtimeAmount'] = Util::currencyFormat($reportData['employees'][$i]['overtimeAmount']);
                    // }
                    // else {
                        $reportData['employees'][$i]['overtimeUnits'] = floatval($reportData['employees'][$i]['overtimeUnits']);
                        $reportData['employees'][$i]['overtimeAmount'] = floatval($reportData['employees'][$i]['overtimeAmount']);
                    // }
                    
                    $contents = [];
                    $contents[] = [
                        $reportData['employees'][$i]['employeeCode'],
                        $reportData['employees'][$i]['employeeAlias'],
                        // $reportData['employees'][$i]['employeeId'],
                        $reportData['employees'][$i]['employeeFullNames'],
                        $reportData['employees'][$i]['employeeLastName'],
                        $reportData['employees'][$i]['employeeIdNumber'],
                        $reportData['employees'][$i]['employeeCellNumber'],
                        $reportData['employees'][$i]['employeeEmailAddress'],
                        $reportData['employees'][$i]['overtimeUnits'],
                        $reportData['employees'][$i]['overtimeAmount']
                    ];
                    
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                // if ($data['format'] === 'csv') {
                //     $totalOvertimeUnits = Util::currencyFormat($totalOvertimeUnits);
                //     $totalOvertimeAmount = Util::currencyFormat($totalOvertimeAmount);
                // }
                // else {
                    $totalOvertimeUnits = floatval($totalOvertimeUnits);
                    $totalOvertimeAmount = floatval($totalOvertimeAmount);
                // }
                
                $content = [
                    'Totals',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    $totalOvertimeUnits,
                    $totalOvertimeAmount
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "CODE", "ALIAS", "FULL NAMES", "LAST NAME", "ID/PASSPORT NUMBER", "CELL NUMBER", "EMAIL ADDRESS", 
                    "HOURS WORKED", "AMOUNT EARNED"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_overtime_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                // if ($data['format'] === 'csv') {
                //     $totalOvertimeUnits = Util::currencyFormat($totalOvertimeUnits);
                //     $totalOvertimeAmount = Util::currencyFormat($totalOvertimeAmount);
                // }
                // else {
                    $totalOvertimeUnits = floatval($totalOvertimeUnits);
                    $totalOvertimeAmount = floatval($totalOvertimeAmount);
                // }
                
                $content = [
                    'Totals',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    $totalOvertimeUnits,
                    $totalOvertimeAmount
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }
        
        // Function to export the overtime report in PDF format
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function runOvertimePdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            $totalOvertimeUnits = $reportData['totals']['totalOvertimeUnits'];
            $totalOvertimeAmount = $reportData['totals']['totalOvertimeAmount'];
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['employees']); $i++ ) { 
                $reportRows[] = [
                    $reportData['employees'][$i]['employeeCode'],
                    $reportData['employees'][$i]['employeeAlias'],
                    $reportData['employees'][$i]['employeeFullNames'],
                    $reportData['employees'][$i]['employeeLastName'],
                    $reportData['employees'][$i]['employeeIdNumber'],
                    $reportData['employees'][$i]['employeeCellNumber'],
                    $reportData['employees'][$i]['employeeEmailAddress'],
                    number_format($reportData['employees'][$i]['overtimeUnits'], 2),
                    number_format($reportData['employees'][$i]['overtimeAmount'], 2),
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                number_format($totalOvertimeUnits, 2),
                number_format($totalOvertimeAmount, 2),
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Overtime Report: ' . str_replace('_', ' ', $reportData['payrunName']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                    'width' =>  4/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Alias',          'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Full Names',              'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Last Name',               'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'ID / Passport Number',    'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cell Number',             'width' =>  8/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Email Address',           'width' => 20/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Hours Worked',            'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Amount Earned',           'width' => 10/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_overtime_report_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }
        
        // Function to get the overtime details
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function getOvertimeList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]) );
            return true;
        }

        // Function to export the overtime report to csv or xls 
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //  format                  The format in which the report should be exported (csv or xls)
        //
        // Optional Parameters
        //  None
        public function runPayslipItemsSpecifiedReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'payslipItem' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            //$totalOvertimeUnits = $reportData['totals']['totalOvertimeUnits'];
            $totalOvertimeAmount = $reportData['totals']['totalOvertimeAmount'];
            
            // Is it a detailed report?
            if ($data['detail'] === 'detailed') {
                // Load all payslip items from database
                
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "CODE", "ALIAS", "FULL NAMES", "LAST NAME", "ID/PASSPORT NUMBER", "CELL NUMBER", "EMAIL ADDRESS", 
                    "AMOUNT EARNED"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_specified_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                for ($i=0; $i < count($reportData['employees']); $i++) { 
                    // if ($data['format'] === 'csv') {
                    //     $reportData['employees'][$i]['overtimeUnits'] = Util::currencyFormat($reportData['employees'][$i]['overtimeUnits']);
                    //     $reportData['employees'][$i]['overtimeAmount'] = Util::currencyFormat($reportData['employees'][$i]['overtimeAmount']);
                    // }
                    // else {
                       // $reportData['employees'][$i]['overtimeUnits'] = floatval($reportData['employees'][$i]['overtimeUnits']);
                        $reportData['employees'][$i]['overtimeAmount'] = floatval($reportData['employees'][$i]['overtimeAmount']);
                    // }
                    
                    $contents = [];
                    $contents[] = [
                        $reportData['employees'][$i]['employeeCode'],
                        $reportData['employees'][$i]['employeeAlias'],
                        // $reportData['employees'][$i]['employeeId'],
                        $reportData['employees'][$i]['employeeFullNames'],
                        $reportData['employees'][$i]['employeeLastName'],
                        $reportData['employees'][$i]['employeeIdNumber'],
                        $reportData['employees'][$i]['employeeCellNumber'],
                        $reportData['employees'][$i]['employeeEmailAddress'],
                        // $reportData['employees'][$i]['overtimeUnits'],
                        $reportData['employees'][$i]['overtimeAmount']
                    ];
                    
                    foreach($contents as $content) {
                        $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                    }
                }
                
                // if ($data['format'] === 'csv') {
                //     $totalOvertimeUnits = Util::currencyFormat($totalOvertimeUnits);
                //     $totalOvertimeAmount = Util::currencyFormat($totalOvertimeAmount);
                // }
                // else {
                   // $totalOvertimeUnits = floatval($totalOvertimeUnits);
                    $totalOvertimeAmount = floatval($totalOvertimeAmount);
                // }
                
                $content = [
                    'Totals',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    // $totalOvertimeUnits,
                    $totalOvertimeAmount
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            else if ($data['detail'] === 'summary') {
                // Write out headers 
                $headers = [];
                $headers [] = [
                    "CODE", "ALIAS", "FULL NAMES", "LAST NAME", "ID/PASSPORT NUMBER", "CELL NUMBER", "EMAIL ADDRESS", 
                    "AMOUNT EARNED"
                ];
                
                $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_specified_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
                
                // if ($data['format'] === 'csv') {
                //     $totalOvertimeUnits = Util::currencyFormat($totalOvertimeUnits);
                //     $totalOvertimeAmount = Util::currencyFormat($totalOvertimeAmount);
                // }
                // else {
                   // $totalOvertimeUnits = floatval($totalOvertimeUnits);
                    $totalOvertimeAmount = floatval($totalOvertimeAmount);
                // }
                
                $content = [
                    'Totals',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    '-',
                    // $totalOvertimeUnits,
                    $totalOvertimeAmount
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            $writer->close();
        }

        // Function to export the overtime report in PDF format
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function runPayslipItemsSpecifiedPdfReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'payslipItem' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Save the totals
            // $totalOvertimeUnits = $reportData['totals']['totalOvertimeUnits'];
            $totalOvertimeAmount = $reportData['totals']['totalOvertimeAmount'];
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($reportData['employees']); $i++ ) { 
                $reportRows[] = [
                    $reportData['employees'][$i]['employeeCode'],
                    $reportData['employees'][$i]['employeeAlias'],
                    $reportData['employees'][$i]['employeeFullNames'],
                    $reportData['employees'][$i]['employeeLastName'],
                    $reportData['employees'][$i]['employeeIdNumber'],
                    $reportData['employees'][$i]['employeeCellNumber'],
                    $reportData['employees'][$i]['employeeEmailAddress'],
                    // number_format($reportData['employees'][$i]['overtimeUnits'], 2),
                    number_format($reportData['employees'][$i]['overtimeAmount'], 2),
                ];
            }
            
            // Add the report totals
            $reportRows[] = [
                'Totals',
                '-',
                '-',
                '-',
                '-',
                '-',
                '-',
                // number_format($totalOvertimeUnits, 2),
                number_format($totalOvertimeAmount, 2),
            ];
            
            // Set report name
            $reportName = $user['companyAlias'] . ' - Payslip Items Report (Specified): ' . str_replace('_', ' ', $reportData['payrunName']);
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Code',                    'width' =>  5/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Alias',          'width' => 13/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Full Names',              'width' => 15/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Last Name',               'width' => 15/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'ID / Passport Number',    'width' => 13/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cell Number',             'width' =>  9/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Email Address',           'width' => 20/100, 'alignment' => 'L' ];
            // $reportCols [] = [ 'name' => 'Hours Worked',            'width' => 10/100, 'alignment' => 'R' ];
            $reportCols [] = [ 'name' => 'Amount Earned',           'width' => 10/100, 'alignment' => 'R' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_payslip_items_report_specified_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
            return true;
        }

        // Function to get the overtime details
        //
        // Required Parameters
        //  detail                  Whether the report should be datailed or a summary (detailed/summary)
        //  filterType              Determines whether to filter by payrun id (PAYR) or period (PERI)
        //  payrunId                The id of the payrun if the filter type is 'PAYR'
        //  startDate               The start date if the filter type is 'PERI'
        //  endDate                 The end date if the filter type is 'PERI'
        //
        // Optional Parameters
        //  None
        public function getPayslipItemsSpecifiedList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'detail' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'filterType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'payslipItem' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
           
            // Get the data for the specified report
            $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Don't return employee data if on;y a summary should be displayed
            if ($data['detail'] === 'summary') {
                $reportData['employees'] = [];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]) );
            return true;
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
        
        // @param $pdf              The PDF document to write to
        // @param $reportName       The name of the report
        // @param $columns          An array containing details of the report columns
        // @param $rows             An array with the data for the report
        // @param $style            An containing style details for the report
        private function writePdfReport($pdf, $reportName, $columns, $rows, $style = null) {
            // The number of elements in each row should correspond to the number of elements
            // in the columns array
            foreach($rows AS $row) {
                if( count($row) !== count($columns) ) {
                    return( ['ok' => false, 'error' => 'PDF report columns and rows do not match up'] );
                }
            }
            
            // Set the header and footer styles
            $pageNum = 1;
            $numPages = 1;
            $headerHeight = 8;
            $headerTextSize = 12;
            $footerHeight = 6;
            $footerTextSize = 8;
            
            // Set report default style
            $marginX = 10;
            $marginY = 5;
            $lineHeight = 6;
            $textSize = 8;
            $textColor = [16, 16, 16];
            $backgroundColor = [255, 255, 255];
            $headingTextSize = 8;
            $headingTextColor = [255, 255, 255];
            $headingBackgroundColor = [239, 78, 69];
            $highlightColor = [232, 232, 232];
            $borderColor = [16, 16, 16];
            
            // Update the style based on the parameters
            if( $style !== null ) {
                if( array_key_exists('marginX', $style) && ($style['marginX'] !== null) ) {
                    $marginX = $style['marginX'];
                }
                if( array_key_exists('marginY', $style) && ($style['marginY'] !== null) ) {
                    $marginY = $style['marginY'];
                }
                if( array_key_exists('lineHeight', $style) && ($style['lineHeight'] !== null) ) {
                    $lineHeight = $style['lineHeight'];
                }
                if( array_key_exists('textSize', $style) && ($style['textSize'] !== null) ) {
                    $textSize = $style['textSize'];
                }
                if( array_key_exists('textColor', $style) && ($style['textColor'] !== null) ) {
                    $textColor = $style['textColor'];
                }
                if( array_key_exists('backgroundColor', $style) && ($style['backgroundColor'] !== null) ) {
                    $backgroundColor = $style['backgroundColor'];
                }
                if( array_key_exists('headingTextSize', $style) && ($style['headingTextSize'] !== null) ) {
                    $headingTextSize = $style['headingTextSize'];
                }
                if( array_key_exists('headingTextColor', $style) && ($style['headingTextColor'] !== null) ) {
                    $headingTextColor = $style['headingTextColor'];
                }
                if( array_key_exists('headingBackgroundColor', $style) && ($style['headingBackgroundColor'] !== null) ) {
                    $headingBackgroundColor = $style['headingBackgroundColor'];
                }
                if( array_key_exists('highlightColor', $style) && ($style['highlightColor'] !== null) ) {
                    $highlightColor = $style['highlightColor'];
                }
                if( array_key_exists('borderColor', $style) && ($style['borderColor'] !== null) ) {
                    $borderColor = $style['borderColor'];
                }
            }
            
            // Get logo details
            $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';
            $imageDetails = getimagesize($imageDir);
            $imageWidth = $imageDetails[0];
            $imageHeight = $imageDetails[1];
            $imageScale = 5;
            
            // The number 0.283 is a made up number 
            $imageHeight = ($imageHeight * 1 / 100) * $imageScale;
            $imageWidth = ($imageWidth * 1 / 100) * $imageScale;
            
            // Set document information
            $pdf->SetCreator(PDF_CREATOR);
            $pdf->SetAuthor('Payaccsys Payroll');
            $pdf->SetTitle('Payaccsys Payroll - ' . $reportName);
            $pdf->SetSubject('');
            $pdf->SetKeywords('');
            
            // Remove default header/footer
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            // Set default monospaced font
            $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
            
            // Set margins
            $pdf->SetMargins(0, 0, 0, 0);
            
            // Set some language-dependent strings (optional)
            if (@file_exists(dirname(__FILE__).'/lang/eng.php')) {
                require_once(dirname(__FILE__).'/lang/eng.php');
                $pdf->setLanguageArray($l);
            }
            
            // Set font
            $pdf->SetFont('helvetica', 'BI', 20);
            
            // Set auto page breaks
            $pdf->SetAutoPageBreak(FALSE, 0);
            
            // Add a page
            $pdf->AddPage();
            
            // Get the page with and height
            $pageWidth = $pdf->GetPageWidth() - ($marginX * 2);
            $pageHeight = $pdf->GetPageHeight() - ($marginY * 2);
            
            // Calculate the number of pages
            $currentX = $marginX;
            $currentY = $marginY;
            
            // Add the height of the report header and headings
            $currentY = $currentY + ($headerHeight * 1);
            $currentY = $currentY + ($lineHeight * 1);
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // For every row of the document
            for( $i=0; $i < count($rows); $i++ ) { 
                // Is there NOT enough space for another item?
                if( ($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight) ) {
                    // Add a page and reset the y coordinate
                    $numPages = $numPages + 1;
                    $currentY = $marginY;
                    
                    // Add the height of the report header and headings
                    $currentY = $currentY + ($headerHeight * 1);
                    $currentY = $currentY + ($lineHeight * 1);
                    $currentY = $currentY + ($lineHeight * 1.25);
                }
                
                // Add the height of each row
                $currentY = $currentY + $lineHeight;
            }
            
            // Reset the starting text coordinates
            $currentX = $marginX;
            $currentY = $marginY;
            
            // Set the page background color
            $pdf->Rect(0, 0, $pdf->getPageWidth(),  $pdf->getPageHeight(), 'DF', "", $backgroundColor);
            
            // Display the document header
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
            $pdf->SetFont('helvetica', 'B', $headerTextSize);
            $pdf->SetXY($currentX, $currentY);
            $pdf->Cell($pageWidth / 2, ($headerHeight * 1), $reportName, null, 0, 'L', true, '', 1, false, 'T', 'B');
            $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
            // $pdf->Cell($pageWidth / 2, ($headerHeight * 1), 'Lexpro Payroll', null, 0, 'R', true, '', 1, false, 'T', 'B');
            $pdf->Image($imageDir, $marginX + $pageWidth - $imageWidth, $marginY + ($headerHeight - $imageHeight - 1), $imageWidth, $imageHeight, 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
            $currentY = $currentY + ($headerHeight * 1);
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the headings for the data
            $pdf->SetTextColor($headingTextColor[0], $headingTextColor[1], $headingTextColor[2]);
            $pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
            $pdf->SetFont('helvetica', 'B', $headingTextSize);
            $borderStyle = [
                'T' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'B' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
            ];
            foreach( $columns AS $col ) {
                $pdf->SetXY($currentX, $currentY);
                $pdf->Cell(($pageWidth * $col['width']), $lineHeight * 1.25, $col['name'], $borderStyle, 0, $col['alignment'], true, '', 1, false, 'T', 'C');
                $currentX = $currentX + ($pageWidth * $col['width']);
            }
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Display all the data in a table
            $pdf->SetFont('helvetica', '', $textSize);
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $borderStyle = [
                'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
            ];
            $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
            $fill = true;
            
            // Display the data of all the rows
            for( $i=0; $i < count($rows); $i++ ) { 
                // Is there NOT enough space for another item?
                if( ($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight) ) {
                    // Draw a line after the final item
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
                    
                    // Display the document footer
                    $currentX = $marginX;
                    $currentY = $marginY + $pageHeight - $footerHeight;
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $textColor, 'cap' => 'butt']);
                    $currentY = $currentY + 1;
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
                    $pdf->SetFont('helvetica', '', $footerTextSize);
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell($pageWidth / 2, ($footerHeight * 1), date('Y-m-d'), null, 0, 'L', true, '', 1, false, 'T', 'T');
                    $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
                    $pdf->Cell($pageWidth / 2, ($footerHeight * 1), 'Page ' . $pageNum . ' of ' . $numPages, null, 0, 'R', true, '', 1, false, 'T', 'T');
                            
                    // Add a new page and reset the coordinates
                    $pdf->AddPage();
                    $currentY = $marginY;
                    $currentX = $marginX;
                    
                    // Add the page number
                    $pageNum = $pageNum + 1;
                    
                    // Set the page background color
                    $pdf->Rect(0, 0, $pdf->getPageWidth(),  $pdf->getPageHeight(), 'DF', "", $backgroundColor);
                    
                    // Display the document header
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
                    $pdf->SetFont('helvetica', 'B', $headerTextSize);
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell($pageWidth / 2, ($headerHeight * 1), $reportName, null, 0, 'L', true, '', 1, false, 'T', 'B');
                    $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
                    // $pdf->Cell($pageWidth / 2, ($headerHeight * 1), 'Lexpro Payroll', null, 0, 'R', true, '', 1, false, 'T', 'B');
                    $pdf->Image($imageDir, $marginX + $pageWidth - $imageWidth, $marginY + ($headerHeight - $imageHeight - 1), $imageWidth, $imageHeight, 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
                    $currentY = $currentY + ($headerHeight * 1);
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
                    $currentY = $currentY + ($lineHeight * 1);
                    
                    // Display the headings
                    $pdf->SetTextColor($headingTextColor[0], $headingTextColor[1], $headingTextColor[2]);
                    $pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
                    $pdf->SetFont('helvetica', 'B', $headingTextSize);
                    $borderStyle = [
                        'T' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'B' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
                    ];
                    foreach( $columns AS $col ) {
                        $pdf->SetXY($currentX, $currentY);
                        $pdf->Cell(($pageWidth * $col['width']), $lineHeight * 1.25, $col['name'], $borderStyle, 0, $col['alignment'], true, '', 1, false, 'T', 'C');
                        $currentX = $currentX + ($pageWidth * $col['width']);
                    }
                    $currentY = $currentY + ($lineHeight * 1.25);
                    
                    // Reset the values for displaying the data
                    $pdf->SetFont('helvetica', '', $textSize);
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $borderStyle = [
                        'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                        'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
                    ];
                    $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
                    $fill = true;
                }
            
                // Start at the beginning of the line
                $currentX = $marginX;
                
                // Alternate the fill
                $fill = !$fill;
                
                // Set each of the column values
                for( $j=0; $j < count($columns); $j++ ) {
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell(($pageWidth * $columns[$j]['width']), $lineHeight, $rows[$i][$j], $borderStyle, 0, $columns[$j]['alignment'], $fill, '', 1, false, 'T', 'C');
                    $currentX = $currentX + ($pageWidth * $columns[$j]['width']);
                }
                
                // Go to the next row
                $currentY = $currentY + $lineHeight;
            }
            
            // Draw a line after the final item
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
            
            // Display the document footer
            $currentX = $marginX;
            $currentY = $marginY + $pageHeight - $footerHeight;
            $pdf->SetXY($currentX, $currentY);
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $textColor, 'cap' => 'butt']);
            $currentY = $currentY + 1;
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
            $pdf->SetFont('helvetica', '', $footerTextSize);
            $pdf->SetXY($currentX, $currentY);
            $pdf->Cell($pageWidth / 2, ($footerHeight * 1), date('Y-m-d'), null, 0, 'L', true, '', 1, false, 'T', 'T');
            $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
            $pdf->Cell($pageWidth / 2, ($footerHeight * 1), 'Page ' . $pageNum . ' of ' . $numPages, null, 0, 'R', true, '', 1, false, 'T', 'T');
            
            return(['ok' => true]);
        }
    }
?>
