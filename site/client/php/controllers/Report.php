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

class Report extends Controller
{

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
    public function runBirthdayReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
            "CODE",
            "ALIAS",
            "EMAIL ADDRESS",
            "CELL NUMBER",
            "BIRTHDAY"
        ];

        $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_birthday_report_' . date('Y-m-d'), $headers);

        // Add the rows
        foreach ($reportData['employees'] as $employee) {
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
    public function runBirthdayPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Create employees array
        $reportRows = [];
        foreach ($reportData['employees'] as $employee) {
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
        $reportCols[] = ['name' => 'Code',            'width' =>  5 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',   'width' => 35 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Email Address',   'width' => 40 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Cell Number',     'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Birthday',        'width' => 12 / 100, 'alignment' => 'L'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getBirthdayList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getBirthdayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees']]));
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
    public function runEmployeesDetailsReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
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
        foreach ($reportData['employees'] as $employee) {
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
            $weekDays = array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
            $biWeekDays = array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
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
            if ($employee['paymentPeriodCode'] == "WEEK") {
                if (($employee['paymentDay'] >= 0 && $employee['paymentDay'] <= 6) && ($employee['paymentPeriodEndDay'] >= 0 && $employee['paymentPeriodEndDay'] <= 6)) {
                    $paymentDay = $weekDays[$employee['paymentDay']];
                    $paymentPeriodEndDay = $weekDays[$employee['paymentPeriodEndDay']];
                }
            } else if ($employee['paymentPeriodCode'] == "BWEE") {
                if (($employee['paymentDay'] >= 0 && $employee['paymentDay'] <= 13) && ($employee['paymentPeriodEndDay'] >= 0 && $employee['paymentPeriodEndDay'] <= 13)) {
                    $paymentDay = $biWeekDays[$employee['paymentDay']];
                    $paymentPeriodEndDay = $biWeekDays[$employee['paymentPeriodEndDay']];
                }
            } else {
                if ($employee['paymentDay'] == 0) {
                    $paymentDay = 'Last Day';
                } else {
                    $paymentDay = $employee['paymentDay'];
                }

                if ($employee['paymentPeriodEndDay'] == 0) {
                    $paymentPeriodEndDay = 'Last Day';
                } else {
                    $paymentPeriodEndDay = $employee['paymentPeriodEndDay'];
                }
            }

            $employeeBankAccountTypeName = '';
            if ($employee['employeeBankAccountTypeCode'] == 'SACC') {
                $employeeBankAccountTypeName = 'Savings';
            } elseif ($employee['employeeBankAccountTypeCode'] == 'CACC') {
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
                // $employee['grossSalary'],
                null,
            ];
            $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
        }
        file_put_contents("./data_content_employees.txt", $employee);
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
    public function runEmployeesDetailsPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Create employees array
        $reportRows = [];
        foreach ($reportData['employees'] as $employee) {
            // Set employment period and status
            $employmentEndDate = ($employee['employmentEndDate'] !== null ? new DateTime($employee['employmentEndDate']) : null);
            $currentDate = new DateTime();
            $employmentPeriod = $employee['employmentStartDate'];
            if ($employee['employmentEndDate'] !== null) {
                if ($employmentEndDate <= $currentDate) {
                    $employmentPeriod = $employmentPeriod . ' to ' . $employee['employmentStartDate'];
                }
            } else {
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
        $reportCols[] = ['name' => 'Code',              'width' =>  5 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',     'width' => 15 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Email Address',     'width' => 26 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Cell Number',       'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Department',        'width' => 26 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Status',            'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employment Period', 'width' => 12 / 100, 'alignment' => 'L'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getEmployeeDetailsList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeDetailsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees']]));
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
    public function runLeaveSummaryReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get leave type details
        $sqlQuery = 'SELECT name, leave_unit_code FROM leave_types WHERE id = $1';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }
        $sqlRow = $sqlResult->fetchAssociative();
        $leaveTypeName = $sqlRow['name'];

        // Get the data for the specified report
        $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
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

        for ($i = 0; $i < count($reportData['leaveSummary']); $i++) {

            for ($b = 0; $b < count($reportData['leaveSummary'][$i]['leave']); $b++) {
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
    public function runLeaveSummaryPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get leave type details
        $sqlQuery = 'SELECT name, leave_unit_code FROM leave_types WHERE id = $1';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }
        $sqlRow = $sqlResult->fetchAssociative();
        $leaveTypeName = $sqlRow['name'];

        // Get the data for the specified report
        $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        $reportRows = [];
        for ($i = 0; $i < count($reportData['leaveSummary']); $i++) {
            $accruedAmount = 0;
            $adjustmentAmount = 0;
            $leaveTakenAmount = 0;

            for ($j = 0; $j < count($reportData['leaveSummary'][$i]['leave']); $j++) {
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
        $reportCols[] = ['name' => 'Code',             'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',    'width' => 40 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Starting Balance', 'width' => 10 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Leave Accrued',    'width' => 10 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Adjustment',       'width' => 10 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Leave Taken',      'width' => 10 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Closing Balance',  'width' => 10 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getLeaveSummaryList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getLeaveSummaryData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'leaveSummary' => $reportData['leaveSummary']]));
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
    public function runEmployeeLeaveReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get employee details
        $sqlQuery = 'SELECT code, alias FROM employees WHERE id = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']));
            return false;
        }

        $sqlRow = $sqlResult->fetchAssociative();
        // $employeeCode = preg_replace("/[^a-zA-Z0-9]+/", "", $sqlRow['code']);
        $employeeAlias = preg_replace("/[^a-zA-Z0-9]+/", "", $sqlRow['alias']);

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
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

        for ($i = 0; $i < count($reportData['employeeLeave']); $i++) {
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
    public function runEmployeeLeaveSummaryReport($data, $user, $db)
    {
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
            'details' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get employee details
        $employeeAlias = $data['employee'][0]['Name'];


        $writer = $this->writeELSReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . strtolower(preg_replace('/\s+/', '_', $employeeAlias)) . '_leave_report');
        $writer->close();
    }

    public function runYtdReport($data, $user, $db)
    {
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
            'details' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'financialYear' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get employee details
        $employeeAlias = $data['employee'][0]['Name'];

        $writer = $this->writeYtdReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . strtolower(preg_replace('/\s+/', '_', $employeeAlias)) . '_ytd_report');
        $writer->close();
    }


    // Function to run the company leave summary report (Excel and CSV format)
    //

    public function runCompanyLeaveSummaryReport($data, $user, $db)
    {
        // Validate data
        $validationResult = Json::validate($data, [
            // Required parameters
            'format' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            'leaveTypeName' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'leaveCalendarItems' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        //Set default values
        $leaveTypeId = (int)$data['leaveTypeId'];
        $leaveTypeName = $data['leaveTypeName'];
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $leaveCalendarItemsJson = $data['leaveCalendarItems'];

        //Date validation
        if (strtotime($startDate) === false || strtotime($endDate) === false) {
            echo json_encode([
                'ok' => false,
                'error' => 'Invalid start date or end date.'
            ]);
            return false;
        }

        //Decode calendar items
        $leaveCalendarItems = json_decode($leaveCalendarItemsJson, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($leaveCalendarItems)) {
            echo json_encode([
                'ok' => false,
                'error' => 'Invalid leave calendar data.'
            ]);
            return false;
        }

        $reportData = [
            'format' => $data['format'],
            'leaveTypeId' => $leaveTypeId,
            'leaveTypeName' => $leaveTypeName,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'leaveCalendarItems' => $leaveCalendarItems
        ];

        $startMonth = date('F Y', strtotime($startDate));
        $endMonth = date('F Y', strtotime($endDate));

        // Set report name
        if ($startMonth === $endMonth) {
            $reportName = $user['companyAlias'] . ' - Company Leave Summary (' . $startMonth . ')';
        } else {
            $reportName = $user['companyAlias'] . ' - Company Leave Summary (' . $startMonth . ' - ' . $endMonth . ')';
        }


        //$reportName = $user['companyAlias'] . ' - Company Leave Summary: ' . ' (' . $startMonth . ' - ' . $endMonth . ')';

        // Write the PDF report data
        $writer = $this->writeCompanyLeaveSummaryReport($reportData, $reportName);
        $writer->close();

        return true;
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
    public function runEmployeeLeavePdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Load the employee details
        $sqlQuery = 'SELECT employees.alias FROM employees WHERE employees.id = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']));
            return false;
        }

        $sqlRow = $sqlResult->fetchAssociative();
        $employeeAlias = $sqlRow['alias'];

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Set the leave balances
        $reportRows = [];
        foreach ($reportData['employeeLeave'] as $employeeLeave) {
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
        $reportCols[] = ['name' => 'Leave Type',       'width' => 40 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Starting Balance', 'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Leave Accrued',    'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Adjustment',       'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Leave Taken',      'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Closing Balance',  'width' => 12 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_leave_' . date('Ymd') . '.pdf';

        // Close and output PDF document
        $pdf->Output($fileName, 'I');
        return true;
    }
    public function runEmployeeLeaveSummaryPdfReport($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'Pdfdetails' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'Employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }
        // Set report name
        $employeeAlias = $data['Employee'][0]['Name'];
        $reportName = $user['companyAlias'] . ' - Employee Leave: ' . $employeeAlias . ' (' . $data['startDate'] . ' - ' . $data['endDate'] . ')';
        // Create the PDF document
        $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
        $pdfPageFormat = 'A4';
        $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);

        // // Set the report style
        // $reportStyle = [
        //     'marginX' => 10,
        //     'marginY' => 5,
        //     'lineHeight' => 6,
        //     'textSize' => 8,
        //     'textColor' => [16, 16, 16],
        //     'backgroundColor' => [255, 255, 255],
        //     'headingTextSize' => 8,
        //     'headingTextColor' => [255, 255, 255],
        //     'headingBackgroundColor' => [239, 78, 69],
        //     'highlightColor' => [232, 232, 232],
        //     'borderColor' => [16, 16, 16]
        // ];
        // foreach ($data['Pdfdetails'] as $item) {
        //    error_log(json_encode($item, JSON_PRETTY_PRINT));
        // }
        //error_log(json_encode($data['Employee'], JSON_PRETTY_PRINT));
        // Write the PDF report data
        $result = $this->writeELSPdfReport($pdf, $data, $reportName);
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_leave_' . date('Ymd') . '.pdf';

        // Close and output PDF document
        $pdf->Output($fileName, 'I');
        return true;
    }

    public function runYtdPdfReport($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'Pdfdetails' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'Employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false],
            'financialYear' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }
        // Set report name
        $employeeAlias = $data['Employee'][0]['Name'];
        $reportName = $user['companyAlias'] . ' - YTD Report: ' . $employeeAlias . ' (' . $data['financialYear'] . ')';
        // Create the PDF document
        $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
        $pdfPageFormat = 'A4';
        $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);

        // Write the PDF report data
        $result = $this->writeYtdPdfReport($pdf, $data, $reportName);
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_ytd_report_' . date('Ymd') . '.pdf';

        // Close and output PDF document
        $pdf->Output($fileName, 'I');
        return true;
    }


    // Function to run the company leave summary report (PDF format)
    //
    public function runCompanyLeaveSummaryPdfReport($data, $user, $db)
    {
        // Validate data
        $validationResult = Json::validate($data, [
            // Required parameters
            'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            'leaveTypeName' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            'leaveCalendarItems' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        //Set default values
        $leaveTypeId = $data['leaveTypeId'];
        $leaveTypeName = $data['leaveTypeName'];
        $startDate = $data['startDate'];
        $endDate = $data['endDate'];
        $leaveCalendarItemsJson = $data['leaveCalendarItems'];

        //Date validation
        if (strtotime($data['startDate']) === false || strtotime($data['endDate']) === false) {
            echo json_encode([
                'ok' => false,
                'error' => 'Invalid start date or end date.'
            ]);
            return false;
        }

        //Decode calendar items
        $leaveCalendarItems = json_decode($leaveCalendarItemsJson, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($leaveCalendarItems)) {
            echo json_encode([
                'ok' => false,
                'error' => 'Invalid leave calendar data.'
            ]);
            return false;
        }

        $reportData = [
            'leaveTypeId' => $leaveTypeId,
            'leaveTypeName' => $leaveTypeName,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'leaveCalendarItems' => $leaveCalendarItems
        ];

        $startMonth = date('F Y', strtotime($startDate));
        $endMonth = date('F Y', strtotime($endDate));

        // Set report name
        if ($startMonth === $endMonth) {
            $reportName = $user['companyAlias'] . ' - Company Leave Summary (' . $startMonth . ')';
        } else {
            $reportName = $user['companyAlias'] . ' - Company Leave Summary (' . $startMonth . ' - ' . $endMonth . ')';
        }

        // $reportName = $user['companyAlias'] . ' - Company Leave Summary: ' . ' (' . $data['startDate'] . ' - ' . $data['endDate'] . ')';

        // Create the PDF document
        $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
        $pdfPageFormat = 'A4';

        $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);


        //error_log(json_encode($data['leaveTypeId'], JSON_PRETTY_PRINT));


        // Write the PDF report data
        $result = $this->writeCompanyLeaveSummaryPdfReport($pdf, $reportData, $reportName);
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_company_leave_summary_' . date('Ymd') . '.pdf';

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
    public function getEmployeeLeaveList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmployeeLeaveData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'employeeLeave' => $reportData['employeeLeave']]));
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
    public function runUifReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getUifData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
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
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
                ($reportData['employees'][$i]['dateOfBirth'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['dateOfBirth']) : ''),
                ($reportData['employees'][$i]['employmentStartDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentStartDate']) : ''),
                ($reportData['employees'][$i]['employmentEndDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentEndDate']) : ''),
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
        if ($data['detail'] === 'SUMM') {
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
    public function runUifPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getUifData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
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
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
                ($reportData['employees'][$i]['employmentStartDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentStartDate']) : ''),
                ($reportData['employees'][$i]['employmentEndDate'] !== null ? str_replace('-', '/', $reportData['employees'][$i]['employmentEndDate']) : ''),
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
        $reportCols[] = ['name' => 'Code',                    'width' =>  5 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',           'width' => 15 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'UIF Number',              'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'ID Number',               'width' =>  9 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Pasport Number',          'width' =>  9 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employment Start Date',   'width' =>  9 / 100, 'alignment' => 'C'];
        $reportCols[] = ['name' => 'Employment End Date',     'width' =>  9 / 100, 'alignment' => 'C'];
        $reportCols[] = ['name' => 'Hours Worked',            'width' =>  9 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Taxable Remuneration',    'width' =>  9 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'UIF Remuneration',        'width' =>  9 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'UIF Contribution',        'width' =>  9 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getUifList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }


        // Get the data for the specified report
        $reportData = \ReportUtil\getUifData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'totals' => $reportData['totals']]));
        return true;
    }



    public function getEtiData($data, $user, $db)
    {
        $reportData = $this->getEtiReportData($data, $user, $db);

        if ($reportData['ok'] !== true) {
            echo json_encode([
                'ok' => false,
                'error' => $reportData['error']
            ]);
            return false;
        }

        echo json_encode([
            'ok' => true,
            'employees' => $reportData['employees'],
            'totals' => $reportData['totals']
        ]);

    return true;
}

public function runEtiReport($data, $user, $db)
{
    $validationResult = Json::validate($data, [
        'format' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
        'taxPeriod' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
        'month' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
    ]);

    if ($validationResult !== true) {
        echo json_encode(['ok' => false, 'error' => $validationResult]);
        return false;
    }

    $reportData = $this->getEtiReportData($data, $user, $db);

    if ($reportData['ok'] !== true) {
        echo json_encode(['ok' => false, 'error' => $reportData['error']]);
        return false;
    }

    $calendarMonth = (int)$reportData['month'];
    $taxMonthNumber = ($calendarMonth >= 3)
    ? ($calendarMonth - 2)
    : ($calendarMonth + 10);

    $headers = [[
        'Code',
        'Name',
        'Surname',
        'Age',
        'Emp Start Date',
        'ETI Y/N',
        '2nd Year',
        'Hours',
        'Effective Hourly Rate',
        'Basic Wage',
        'Actual',
        'Monthly Equivalent',
        'ETI Amount',
        'Completed'
    ]];

    $reportMonth = date('Y_m', strtotime($reportData['monthEndDate']));

    $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_eti_report_' . $reportMonth;

    $writer = $this->writeReport($data, $fileName, $headers);

    $reportName = $user['companyAlias'] . ' - Employment Tax Incentive Report';


    $writer->addRow(WriterEntityFactory::createRowFromArray([
        $reportName
    ], null));

    $writer->addRow(WriterEntityFactory::createRowFromArray([
        'ETI Details:',
        'Month ' . $taxMonthNumber . ' - ' . $reportData['monthEndDate']
    ], null));

    $writer->addRow(WriterEntityFactory::createRowFromArray([
        'Generated on:',
        date('Y-m-d H:i:s')
    ], null));

    $writer->addRow(WriterEntityFactory::createRowFromArray([''], null));

    foreach ($reportData['employees'] as $employee) {
        $writer->addRow(WriterEntityFactory::createRowFromArray([
            $employee['code'],
            $employee['name'],
            $employee['surname'],
            $employee['age'],
            $employee['employmentStartDate'],
            $this->formatYesNo($employee['etiEligible']),
            $this->formatYesNo($employee['secondYear']),
            $employee['totalHoursWorked'],
            $employee['effectiveHourlyRate'],
            $employee['basicWage'],
            $employee['actual'],
            $employee['monthlyEquivalent'],
            $employee['etiAmount'],
            $this->formatYesNo($employee['completed'])
        ], null));
    }

    $writer->addRow(WriterEntityFactory::createRowFromArray([
        'Total', '', '', '', '', '', '', '', '', '', '', '',
        $reportData['totals']['etiAmountTotal'],
        ''
    ], null));

    $writer->close();
    return true;
}

public function runEtiPdfReport($data, $user, $db)
{
    $validationResult = Json::validate($data, [
        'taxPeriod' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
        'month' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
    ]);

    if ($validationResult !== true) {
        echo json_encode(['ok' => false, 'error' => $validationResult]);
        return false;
    }

    $reportData = $this->getEtiReportData($data, $user, $db);

    if ($reportData['ok'] !== true) {
        echo json_encode(['ok' => false, 'error' => $reportData['error']]);
        return false;
    }

    $reportName = $user['companyAlias'] . ' - Employment Tax Incentive Report';


    $pdf = new TCPDF('L', PDF_UNIT, 'A4', true, 'UTF-8', false);

    $result = $this->writeEtiPdfReport($pdf, $reportData, $reportName);

    if ($result['ok'] !== true) {
        echo json_encode(['ok' => false, 'error' => $result['error']]);
        return false;
    }

    $reportMonth = date('Y_m', strtotime($reportData['monthEndDate']));

    $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_eti_report_' . $reportMonth . '_' . date('Ymd') . '.pdf';

    $pdf->Output($fileName, 'I');
    return true;
}

//
//Helper functions for report generation
//

private function formatYesNo($value) {
        return $value === true ? 'Y' : 'N';
}

//
//Helper functions for ETI report generation
//

private function getEtiReportData($data, $user, $db)
{
    // Validate data
    $validationResult = Json::validate($data, [
        'taxPeriod' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
        'month' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
    ]);

    if ($validationResult !== true) {
        return ['ok' => false, 'error' => $validationResult];
    }

    $taxPeriod = $data['taxPeriod'] ?? null;
    $monthValue = $data['month'] ?? null;

    if ($taxPeriod === null || $taxPeriod === '' || $monthValue === null || $monthValue === '') {
        return ['ok' => false, 'error' => 'Tax period and month are required.'];
    }

    $taxYear = (int)$taxPeriod;
    $month = (int)$monthValue;

    if ($taxYear <= 0) {
        return ['ok' => false, 'error' => 'Invalid tax period specified.'];
    }

    if ($month < 1 || $month > 12) {
        return ['ok' => false, 'error' => 'Invalid month specified.'];
    }

    if ($month >= 3) {
        $calendarYear = $taxYear - 1;
    } else {
        $calendarYear = $taxYear;
    }

    $monthStartDate = date('Y-m-d', strtotime($calendarYear . '-' . $month . '-01'));
    $monthEndDate = date('Y-m-t', strtotime($monthStartDate));

    $sqlParams = [
        $monthStartDate,
        $monthEndDate,
        $taxYear
    ];

    //Select employees with payslips ending in the selected report month
    $sqlQuery =
        'SELECT DISTINCT ' .
        'employees.id AS employee_id, ' .
        'employees.code AS employee_code, ' .
        'employees.alias AS name, ' .
        'employees.last_name AS surname, ' .
        'employees.date_of_birth AS dob, ' .
        'employees.employment_start_date AS start_date, ' .
        'employees.employment_end_date AS end_date, ' .
        'employees.employment_position AS position ' .

        'FROM ' .
        'payslips ' .
        'INNER JOIN employees ON employees.id = payslips.employee_id ' .

        'WHERE payslips.to_date >= $1 ' .
            'AND payslips.to_date <= $2 ' .
            'AND payslips.sars_year = $3 ' .

            //Only include a payslip if it has at least one item in category ALLO, FBEN, or INCO.
            'AND EXISTS ( ' .
                'SELECT 1 ' .
                'FROM payslip_items ' .
                'LEFT JOIN payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'WHERE payslip_items.payslip_id = payslips.id ' .
                'AND payslip_item_types.payslip_category_code IN (\'ALLO\', \'FBEN\', \'INCO\') ' .
            ') ' .

    'ORDER BY employee_code ASC, surname ASC';

    $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);

    if (!$sqlResult->isValid()) {
        return ['ok' => false, 'error' => 'Database error.'];
    }

    $employees = [];

    $totals = [
        'etiAmountTotal' => 0
    ];

   while ($sqlRow = $sqlResult->fetchAssociative()) {

        $age = $this->calculateAge($sqlRow['dob'] ?? null, $monthEndDate);

        $employee = [
            'employeeId' => $sqlRow['employee_id'] ?? null,
            'code' => $sqlRow['employee_code'] ?? '',
            'name' => $sqlRow['name'] ?? '',
            'surname' => $sqlRow['surname'] ?? '',
            'dateOfBirth' => $sqlRow['dob'] ?? null,
            'age' => $age,
            'employmentStartDate' => $sqlRow['start_date'] ?? null,
            'employmentEndDate' => $sqlRow['end_date'] ?? null,
            'position' => $sqlRow['position'] ?? '',

            'totalHoursWorked' => 0,
            'effectiveHourlyRate' => 0,
            'basicWage' => 0,
            'actual' => 0,
            'etiEligible' => false,
            'etiYear' => null,
            'secondYear' => false,
            'monthlyEquivalent' => 0,
            'etiAmount' => 0,
            'completed' => false
        ];

        $employees[] = $employee;
    }

    $etiMonthlyData = $this->getEtiMonthlyData(
        $employees,
        new DateTime($monthEndDate),
        $db
    );
    
    foreach ($employees as &$employee) {

        $qualifyingMonthCount = $this->getEtiQualifyingMonthCountFromData(
            $employee,
            $taxPeriod,
            $month,
            $etiMonthlyData,
            $db
        );

        $selectedMonthKey = (new DateTime($monthStartDate))->format('Y-m');
        $selectedMonthData = $etiMonthlyData[$employee['employeeId']][$selectedMonthKey] ?? null;

        $employee['basicWage'] = (float)($selectedMonthData['basicWage'] ?? 0);
        $employee['totalHoursWorked'] = (float)($selectedMonthData['totalHoursWorked'] ?? 0);
        $employee['actual'] = (float)($selectedMonthData['actualRemuneration'] ?? 0);
        $employee['effectiveHourlyRate'] = $employee['totalHoursWorked'] > 0
            ? $employee['basicWage'] / $employee['totalHoursWorked']
            : 0;

        $employee['monthlyEquivalent'] = $this->calculateMonthlyEquivalent($employee);
        $employee['etiYear'] = $this->getEtiYear($qualifyingMonthCount);
        $employee['completed'] = $this->isEtiCompleted($qualifyingMonthCount);
        $employee['etiEligible'] = $employee['completed'] === true
            ? false : $this->isEtiEligible($employee, $taxPeriod, $month);
        $employee['secondYear'] = ($employee['etiEligible'] === true && $employee['etiYear'] === 2);
        
        $employee['etiAmount'] = $this->calculateEtiAmount($employee, $taxPeriod, $month);

        if ((float)$employee['totalHoursWorked'] > 0 && (float)$employee['totalHoursWorked'] < 160) {
            $ratio = 160 / (float)$employee['totalHoursWorked'];
            $employee['etiAmount'] = $employee['etiAmount'] / $ratio;
        }

        $totals['etiAmountTotal'] += $employee['etiAmount'];

    }
    unset($employee);

    return [
        'ok' => true,
        'employees' => $employees,
        'totals' => $totals,
        'taxPeriod' => $taxPeriod,
        'month' => $month,
        'monthStartDate' => $monthStartDate,
        'monthEndDate' => $monthEndDate
    ];
}

//Function to get historical monthly data for ETI calculations
private function getEtiMonthlyData($employees, $selectedMonthEnd, $db)
{
    $employeeIds = [];
    $earliestStartDate = null;
    //$etiEffectiveDate = new DateTime('2014-01-01');
    $supportedEtiStartDate = new DateTime('2019-08-01');

    foreach ($employees as $employee) {
        if (empty($employee['employeeId']) || empty($employee['employmentStartDate'])) {
            continue;
        }

        $employeeIds[] = $employee['employeeId'];

        $startDate = new DateTime($employee['employmentStartDate']);
        $startDate->modify('first day of this month');

        if ($earliestStartDate === null || $startDate < $earliestStartDate) {
            $earliestStartDate = $startDate;
        }
    }

    $employeeIds = array_values(array_unique($employeeIds));

    if (count($employeeIds) <= 0 || $earliestStartDate === null) {
        return [];
    }

    if ($earliestStartDate < $supportedEtiStartDate) {
        $earliestStartDate = $supportedEtiStartDate;
    }

    $sqlParams = [];
    $employeePlaceholders = [];

    foreach ($employeeIds as $employeeId) {
        $sqlParams[] = $employeeId;
        $employeePlaceholders[] = '$' . count($sqlParams);
    }

    $sqlParams[] = $selectedMonthEnd->format('Y-m-d');
    $selectedMonthEndPlaceholder = '$' . count($sqlParams);

    //Obtained from earliest employment start date of all employees, to limit range
    $sqlParams[] = $earliestStartDate->format('Y-m-d');
    $earliestStartPlaceholder = '$' . count($sqlParams);

    $sqlQuery =
    'SELECT ' .
    'payslips.id AS payslip_id, ' .
    'payslips.employee_id, ' .
    'payslips.from_date, ' .
    'payslips.to_date, ' .
    'DATE_TRUNC(\'month\', payslips.to_date)::date AS month_start, ' .

    'SUM(CASE 
        WHEN payslip_items.description IN (\'Salary\', \'Daily Wage\', \'Hourly Wage\')
        THEN COALESCE(payslip_items.total, 0)
        ELSE 0
    END) AS basic_wage, ' .

    'SUM(CASE 
        WHEN payslip_items.description IN (\'Salary\')
        THEN 1
        ELSE 0
    END) AS salary_item, ' .

    'SUM(CASE 
        WHEN payslip_items.description IN (\'Daily Wage\')
        THEN COALESCE(payslip_items.units, 0)
        ELSE 0
    END) AS daily_units, ' .

    'SUM(CASE 
        WHEN payslip_items.description = \'Hourly Wage\'
        THEN COALESCE(payslip_items.units, 0)
        ELSE 0
    END) AS hourly_units, ' .

    'SUM(COALESCE(payslip_items.total, 0)) AS actual_remuneration ' .

    'FROM payslips ' .
    'LEFT JOIN payslip_items ON payslip_items.payslip_id = payslips.id ' .
    'LEFT JOIN payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
    
    'WHERE payslips.employee_id IN (' . implode(', ', $employeePlaceholders) . ') ' .
    'AND payslips.to_date <= ' . $selectedMonthEndPlaceholder . ' ' .
    'AND payslips.to_date >= ' . $earliestStartPlaceholder . ' ' .
    'AND payslip_item_types.payslip_category_code IN (\'ALLO\', \'FBEN\', \'INCO\') ' .
    'AND payslips.sars_year = CASE ' .
        'WHEN EXTRACT(MONTH FROM payslips.to_date) >= 3 ' .
        'THEN EXTRACT(YEAR FROM payslips.to_date)::int + 1 ' .
        'ELSE EXTRACT(YEAR FROM payslips.to_date)::int ' .
        'END ' .
    'GROUP BY payslips.id, payslips.employee_id, payslips.from_date, payslips.to_date, DATE_TRUNC(\'month\', payslips.to_date) ' .
    'ORDER BY payslips.employee_id, month_start, payslips.to_date';

    $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);

    if (!$sqlResult->isValid()) {
        return [];
    }

    $historicalData = [];

    while ($sqlRow = $sqlResult->fetchAssociative()) {
        $employeeId = $sqlRow['employee_id'];
        $monthKey = (new DateTime($sqlRow['month_start']))->format('Y-m');

       if (!isset($historicalData[$employeeId][$monthKey])) {
        $historicalData[$employeeId][$monthKey] = [
            'basicWage' => 0,
            'totalHoursWorked' => 0,
            'actualRemuneration' => 0
        ];
    }

    $historicalData[$employeeId][$monthKey]['basicWage'] += (float)($sqlRow['basic_wage'] ?? 0);
    $historicalData[$employeeId][$monthKey]['actualRemuneration'] += (float)($sqlRow['actual_remuneration'] ?? 0);

    $payslipHours = (float)($sqlRow['hourly_units'] ?? 0);
    $dailyUnits = (float)($sqlRow['daily_units'] ?? 0);
    $hasSalaryItem = (int)($sqlRow['salary_item'] ?? 0) > 0;    

    $salaryHours = 0;
    $dailyHours = 0;

    if ($hasSalaryItem) {
        $salaryHours = $this->calculateEtiFallbackHoursWorked(
            $employeeId,
            $sqlRow['from_date'],
            $sqlRow['to_date'],
            $db
        );
    }

    if ($dailyUnits > 0) {
        $dailyHours = $this->calculateEtiFallbackHoursWorked(
            $employeeId,
            $sqlRow['from_date'],
            $sqlRow['to_date'],
            $db,
            $dailyUnits
        );
    }

        $historicalData[$employeeId][$monthKey]['totalHoursWorked'] += $salaryHours + $dailyHours + $payslipHours;
}

    return $historicalData;

}


//Calculate the age of an employee at the time of the ETI Report generation
private function calculateAge($dateOfBirth, $calculationDate = null) {
    if (empty($dateOfBirth)) {
        return null;
    }

    try {
        $dob = new DateTime($dateOfBirth);
        $date = ($calculationDate !== null ? new DateTime($calculationDate) : new DateTime(date('Y-m-d')));

        if ($dob > $date) {
            return null;
        }

        return $date->diff($dob)->y;
    } catch (Exception $e) {
        return null;
    }

}

 // Function to calculate the monthly equivalent remuneration based on employee's hours worked
private function calculateMonthlyEquivalent($employee) {
    $hoursWorked = (float)($employee['totalHoursWorked'] ?? 0);
    $basicWage = (float)($employee['basicWage'] ?? 0);

    if ($hoursWorked <= 0) {
        return 0;
    }

    if ($hoursWorked >= 160) {
        return $basicWage;
    }

    return $basicWage * (160 / $hoursWorked);

   }

//Function to check ETI eligibility
private function isEtiEligible($employee, $taxPeriod, $month) {

    $selectedMonthStart = $this->getCalendarDateFromTaxPeriodMonth($taxPeriod, $month);
    $selectedMonthEnd = new DateTime($selectedMonthStart->format('Y-m-t'));

    // Only employees employed on or after 1 October 2013 are eligible for ETI
    //ETI incentive was introduced in 2013, but the first effective date for ETI was 1 January 2014. 
    $etiEffectiveDate = new DateTime('2014-01-01');

    //ETI calculation rules are different before 1 August 2019, so our system can't reliably calculate ETI for employees employed before that date. 
    //Therefore, we only consider employees employed on or after 1 August 2019.
    $supportedEtiStartDate = new DateTime('2019-08-01');

    //Checks to ensure that the employee's employment dates overlap with the selected month.
    $employmentStartDate = !empty($employee['employmentStartDate'])
    ? new DateTime($employee['employmentStartDate'])
    : null;

    $employmentEndDate = !empty($employee['employmentEndDate'])
        ? new DateTime($employee['employmentEndDate'])
        : null;

    if ($employmentStartDate === null || $employmentStartDate < $supportedEtiStartDate) {
        return false;
    }

    if ($selectedMonthStart < $etiEffectiveDate) {
        return false;
    }

    if($employmentStartDate > $selectedMonthEnd) {
        return false;
    }

    if ($employmentEndDate !== null && $employmentEndDate < $selectedMonthStart) {
        return false;
    }
    
    //Check if the employee's age is between 18 and 29 (inclusive)
    $age = isset($employee['age']) ? (int)$employee['age'] : null;

    if ($age === null || $age < 18 || $age > 29) {
        return false;
    }

    //Check that the employee is not a "domestic worker"
    $position = strtolower(trim($employee['position'] ?? ''));

    if ($position === 'domestic worker') {
        return false;
    }

    //Check that the minimum wage/rate/salary is met
    $minimumHourlyWage = $this->getEtiMinHourlyWage($selectedMonthStart);

    if ($minimumHourlyWage === null) {
        return false;
    }

    $effectiveHourlyRate = (float)($employee['effectiveHourlyRate'] ?? 0);
    $monthlyEquivalent = (float)($employee['monthlyEquivalent'] ?? 0);
    $remunerationForEti = $monthlyEquivalent > 0
    ? $monthlyEquivalent
    : (float)($employee['basicWage'] ?? 0);

   if ($effectiveHourlyRate > 0 && $effectiveHourlyRate < $minimumHourlyWage) {
    return false;
    }

    $etiBracketConfig = $this->getEtiBracketConfig($selectedMonthStart);

    if ($etiBracketConfig === null) {
        return false;
    }

    if ($remunerationForEti <= 0 || $remunerationForEti >= $etiBracketConfig['upperLimit']) {
        return false;
    }

    // $newEtiBracketsEffectiveDate = new DateTime('2025-04-01');

    // if ($selectedMonthStart < $newEtiBracketsEffectiveDate) {
    //     if ($remunerationForEti < 2000 || $remunerationForEti >= 6500) {
    //         return false;
    //     }
    // }

    // if ($selectedMonthStart >= $newEtiBracketsEffectiveDate) {
    //     if ($remunerationForEti < 2500 || $remunerationForEti >= 7500) {
    //         return false;
    //     }
    // }

        return true;
    }

//Function to return correct minimum hourly wage for selected tax year and month
private function getEtiMinHourlyWage($selectedDate)
{

    $minimumWages = [
        [
            'effectiveFrom' => '2019-08-01',
            'hourlyRate' => 20.00
        ],
        [
            'effectiveFrom' => '2020-03-01',
            'hourlyRate' => 20.76
        ],
        [
            'effectiveFrom' => '2021-03-01',
            'hourlyRate' => 21.69
        ],
        [
            'effectiveFrom' => '2022-03-01',
            'hourlyRate' => 23.19
        ],
        [
            'effectiveFrom' => '2023-03-01',
            'hourlyRate' => 25.42
        ],
        [
            'effectiveFrom' => '2024-03-01',
            'hourlyRate' => 27.58
        ],
        [
            'effectiveFrom' => '2025-03-01',
            'hourlyRate' => 28.79
        ],
        [
            'effectiveFrom' => '2026-03-01',
            'hourlyRate' => 30.23
        ]
    ];

    $minimumHourlyWage = null;

    foreach ($minimumWages as $minimumWage) {
        $effectiveFrom = new DateTime($minimumWage['effectiveFrom']);

        if ($selectedDate >= $effectiveFrom) {
            $minimumHourlyWage = $minimumWage['hourlyRate'];
        }
    }

    return $minimumHourlyWage;
}

private function getEtiBracketConfig($selectedDate)
{
    $configs = [
        [
            'effectiveFrom' => '2019-08-01',
            'lowBandEnd' => 2000,
            'flatBandEnd' => 4500,
            'upperLimit' => 6500,
            'firstYearMax' => 1000,
            'secondYearMax' => 500
        ],
        [
            'effectiveFrom' => '2022-03-01',
            'lowBandEnd' => 2000,
            'flatBandEnd' => 4500,
            'upperLimit' => 6500,
            'firstYearMax' => 1500,
            'secondYearMax' => 750
        ],
        [
            'effectiveFrom' => '2025-04-01',
            'lowBandEnd' => 2500,
            'flatBandEnd' => 5500,
            'upperLimit' => 7500,
            'firstYearMax' => 1500,
            'secondYearMax' => 750
        ]
    ];

    $selectedConfig = null;

    foreach ($configs as $config) {
        if ($selectedDate >= new DateTime($config['effectiveFrom'])) {
            $selectedConfig = $config;
        }
    }

    return $selectedConfig;
}

// Function to calculate the ETI amount based on the employee's details
private function calculateEtiAmount($employee, $taxPeriod, $month) {
    //Does not calculate ETI for qualifying employees, if two ETI years have been completed
    if (!empty($employee['completed'])) {
        return 0;
    }

    //Check which eti year employee falls in and only calculates ETI if in first/second year
    if (!in_array((int)($employee['etiYear'] ?? 0), [1, 2], true)) {
        return 0;
    }

    if (!$this->isEtiEligible($employee, $taxPeriod, $month)) {
        return 0;
    }

    $monthlyEquivalent = (float)($employee['monthlyEquivalent'] ?? 0);

    $basicWage = $monthlyEquivalent > 0
    ? $monthlyEquivalent
    : (float)($employee['basicWage'] ?? 0);

    $isSecondYear = (
        isset($employee['etiYear']) &&
        (int)$employee['etiYear'] === 2
    );

    $reportDate = $this->getCalendarDateFromTaxPeriodMonth($taxPeriod, $month);
    $etiBracketConfig = $this->getEtiBracketConfig($reportDate);

    if ($etiBracketConfig === null) {
        return 0;
    }

    $lowBandEnd = $etiBracketConfig['lowBandEnd'];
    $flatBandEnd = $etiBracketConfig['flatBandEnd'];
    $upperLimit = $etiBracketConfig['upperLimit'];
    $maxAmount = $isSecondYear
        ? $etiBracketConfig['secondYearMax']
        : $etiBracketConfig['firstYearMax'];

    if ($basicWage < $lowBandEnd) {
        return ($maxAmount / $lowBandEnd) * $basicWage;
    }

    if ($basicWage < $flatBandEnd) {
        return $maxAmount;
    }

    if ($basicWage < $upperLimit) {
        $phaseOutRate = $maxAmount / ($upperLimit - $flatBandEnd);

        return max(
            0,
            min(
                $maxAmount,
                $maxAmount - ($phaseOutRate * ($basicWage - $flatBandEnd))
            )
        );
    }

    return 0;

    // $reportDate = $this->getCalendarDateFromTaxPeriodMonth($taxPeriod, $month);
    // $newEtiBracketsEffectiveDate = new DateTime('2025-04-01');

    // //ETI brackets for before and including 31 March 2025 (implemented in March 2022)

    // if($reportDate < $newEtiBracketsEffectiveDate) {
         
    //         if ($basicWage < 2000) {
    //         if ($isSecondYear) {
    //             return 0.375 * $basicWage;
    //         }

    //         return 0.75 * $basicWage;
    //     }

    //     if ($basicWage < 4500) {
    //         if ($isSecondYear) {
    //             return 750;
    //         }

    //         return 1500;
    //     }

    //     if ($basicWage < 6500) {
    //         if ($isSecondYear) {
    //             return max(0, min(750, 750 - (0.375 * ($basicWage - 4500))));
    //         }

    //         return max(0, min(1500, 1500 - (0.75 * ($basicWage - 4500))));
    //     }

    // return 0;
            
    //}

    //ETI brackets from 1 April 2025

    // if($reportDate >= $newEtiBracketsEffectiveDate) {

    //     if ($basicWage < 2500) {
    //             return $isSecondYear ? ($basicWage * 0.30) : ($basicWage * 0.60);
    //         }

    //         if ($basicWage < 5500) {
    //             return $isSecondYear ? 750 : 1500;
    //         }

    //         if ($basicWage < 7500) {
    //             if ($isSecondYear) {
    //                 return max(0, min(750, 750 - (0.375 * ($basicWage - 5500))));
    //             }

    //             return max(0, min(1500, 1500 - (0.75 * ($basicWage - 5500))));
    //         }

    //     return 0;
    // }

    // return 0;
}

//Function to calculate the number of qualifying months for ETI based on historical data
private function getEtiQualifyingMonthCountFromData($employee, $taxPeriod, $month, $etiMonthlyData, $db) {
    if (empty($employee['employeeId']) || empty($employee['employmentStartDate'])) {
        return 0;
    }

    try {
        $selectedMonthStart = $this->getCalendarDateFromTaxPeriodMonth($taxPeriod, $month);

        $monthStart = new DateTime($employee['employmentStartDate']);
        $monthStart->modify('first day of this month');

        $qualifyingMonthCount = 0;

        while ($monthStart <= $selectedMonthStart) {
            $monthEnd = new DateTime($monthStart->format('Y-m-t'));
            $monthTaxPeriod = ((int)$monthStart->format('m') >= 3)
                ? (int)$monthStart->format('Y') + 1
                : (int)$monthStart->format('Y');

            $monthKey = $monthStart->format('Y-m');
            $monthData = $etiMonthlyData[$employee['employeeId']][$monthKey] ?? null;

            if ($monthData === null) {
                $monthStart->modify('+1 month');
                continue;
            }

            $basicWage = (float)($monthData['basicWage'] ?? 0);
            $actualRemuneration = (float)($monthData['actualRemuneration'] ?? 0);

            $totalHoursWorked =(float)($monthData['totalHoursWorked'] ?? 0);

            $effectiveHourlyRate = $totalHoursWorked > 0 ? $basicWage/$totalHoursWorked : 0;
            
            //Temporary employee instance for each month up to the current report date
            $employeeForMonth = $employee;
            $employeeForMonth['age'] = $this->calculateAge($employee['dateOfBirth'] ?? null, $monthEnd->format('Y-m-d'));
            $employeeForMonth['basicWage'] = $basicWage;
            $employeeForMonth['totalHoursWorked'] = $totalHoursWorked;

            $employeeForMonth['effectiveHourlyRate'] = $effectiveHourlyRate;
            $employeeForMonth['actual'] = $actualRemuneration;
            $employeeForMonth['monthlyEquivalent'] = $this->calculateMonthlyEquivalent($employeeForMonth);

            if ($this->isEtiEligible($employeeForMonth, $monthTaxPeriod, (int)$monthStart->format('m'))) {
                $qualifyingMonthCount++;
            }

            if ($qualifyingMonthCount > 24) {
                return $qualifyingMonthCount;
            }

            $monthStart->modify('+1 month');
        }

        return $qualifyingMonthCount;

    } catch (Exception $e) {
        return 0;
    }
}


//Function to calculate the ETI year of qualifying employee (first/second)
private function getEtiYear($qualifyingMonthCount) {
    if ($qualifyingMonthCount >= 1 && $qualifyingMonthCount <= 12) {
        return 1;
    }

    if ($qualifyingMonthCount >= 13 && $qualifyingMonthCount <= 24) {
        return 2;
    }

    return null;
}


private function isEtiCompleted($qualifyingMonthCount) {
     return $qualifyingMonthCount > 24;
}

private function getCalendarDateFromTaxPeriodMonth($taxPeriod, $month)
{
    $taxYear = (int)$taxPeriod;
    $month = (int)$month;

    if ($month >= 3) {
        $calendarYear = $taxYear - 1;
    } else {
        $calendarYear = $taxYear;
    }

    return new DateTime($calendarYear . '-' . str_pad($month, 2, '0', STR_PAD_LEFT) . '-01');
}

//Function to calculate hours if no hours specified on payslip for eti hours display
private function calculateEtiFallbackHoursWorked($employeeId, $periodStartDate, $periodEndDate, $db, $dailyUnits = null) {
    if (empty($employeeId) || empty($periodStartDate) || empty($periodEndDate)) {
        return 0;
    }

    $sqlQuery =
        'SELECT ' .
        'employees.employment_start_date, ' .
        'employees.employment_end_date, ' .
        'work_schedules.monday_hours, ' .
        'work_schedules.tuesday_hours, ' .
        'work_schedules.wednesday_hours, ' .
        'work_schedules.thursday_hours, ' .
        'work_schedules.friday_hours, ' .
        'work_schedules.saturday_hours, ' .
        'work_schedules.sunday_hours, ' .
        'work_schedules.monday_wd, ' .
        'work_schedules.tuesday_wd, ' .
        'work_schedules.wednesday_wd, ' .
        'work_schedules.thursday_wd, ' .
        'work_schedules.friday_wd, ' .
        'work_schedules.saturday_wd, ' .
        'work_schedules.sunday_wd ' .
        'FROM employees ' .
        'LEFT JOIN work_schedules ON work_schedules.employee_id = employees.id ' .
        'WHERE employees.id = $1;';

    $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);

    if (!$sqlResult->isValid() || $sqlResult->getRowCount() <= 0) {
        return 0;
    }

    $sqlRow = $sqlResult->fetchAssociative();

    $startDate = new DateTime($periodStartDate);
    $endDate = new DateTime($periodEndDate);

    if (!empty($sqlRow['employment_start_date'])) {
        $employmentStartDate = new DateTime($sqlRow['employment_start_date']);

        if ($employmentStartDate > $startDate) {
            $startDate = $employmentStartDate;
        }
    }

    if (!empty($sqlRow['employment_end_date'])) {
        $employmentEndDate = new DateTime($sqlRow['employment_end_date']);

        if ($employmentEndDate < $endDate) {
            $endDate = $employmentEndDate;
        }
    }

    if ($startDate > $endDate) {
        return 0;
    }

    $hoursByDay = [
        1 => $sqlRow['monday_hours'],
        2 => $sqlRow['tuesday_hours'],
        3 => $sqlRow['wednesday_hours'],
        4 => $sqlRow['thursday_hours'],
        5 => $sqlRow['friday_hours'],
        6 => $sqlRow['saturday_hours'],
        0 => $sqlRow['sunday_hours'],
    ];

    $workDaysByDay = [
        1 => $sqlRow['monday_wd'],
        2 => $sqlRow['tuesday_wd'],
        3 => $sqlRow['wednesday_wd'],
        4 => $sqlRow['thursday_wd'],
        5 => $sqlRow['friday_wd'],
        6 => $sqlRow['saturday_wd'],
        0 => $sqlRow['sunday_wd'],
    ];

    $hasWorkScheduleHours = false;
    foreach ($hoursByDay as $hours) {
        if ((float)$hours > 0) {
            $hasWorkScheduleHours = true;
            break;
        }
    }

    $hasSelectedWorkDays = false;
    foreach ($workDaysByDay as $workDay) {
        if ($workDay === true || $workDay === 't' || $workDay === '1') {
            $hasSelectedWorkDays = true;
            break;
        }
    }

    if ($dailyUnits !== null) {
        $dailyUnits = (float)$dailyUnits;

        if ($dailyUnits <= 0) {
            return 0;
        }

        if ($hasWorkScheduleHours) {
            $scheduledHours = 0;
            $scheduledDays = 0;

            foreach ($hoursByDay as $hours) {
                if ((float)$hours > 0) {
                    $scheduledHours += (float)$hours;
                    $scheduledDays++;
                }
            }

            if ($scheduledDays > 0) {
                return ($scheduledHours / $scheduledDays) * $dailyUnits;
            }
        }

        return 8 * $dailyUnits;
    }

    $totalHours = 0;
    $currentDate = clone $startDate;

    while ($currentDate <= $endDate) {
        $dayOfWeek = (int)$currentDate->format('w');

        if ($hasWorkScheduleHours) {
            if ((float)$hoursByDay[$dayOfWeek] > 0) {
                $totalHours += (float)$hoursByDay[$dayOfWeek];
            }
        } else if ($hasSelectedWorkDays) {
            if ($workDaysByDay[$dayOfWeek] === true || $workDaysByDay[$dayOfWeek] === 't' || $workDaysByDay[$dayOfWeek] === '1') {
                $totalHours += 8;
            }
        } 
        //default to 8 hours per weekday if no work schedule or workdays selected 
        else {
            if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
                $totalHours += 8;
            }
        }

        $currentDate->modify('+1 day');
    }

        // error_log('ETI fallback hours debug: employee_id=8');
        // error_log('hasWorkScheduleHours=' . ($hasWorkScheduleHours ? 'true' : 'false'));
        // error_log('hasSelectedWorkDays=' . ($hasSelectedWorkDays ? 'true' : 'false'));
        // error_log('totalHours=' . $totalHours);

    return $totalHours;
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
    public function runNettPayReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getNettPayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Is it a detailed report?
        if ($data['detail'] === 'detailed') {
            // Load all payslip items from database

            // Write out headers 
            $headers = [];
            $headers[] = [
                "",
                "CODE",
                "NAME",
                "PAYMENT METHOD",
                "BANK",
                "BRANCH",
                "ACCOUNT TYPE",
                "ACCOUNT NUMBER",
                "NETT PAY"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_nett_pay_' . Util::sanitizeFileName($reportData['payrunName']), $headers);

            for ($i = 0; $i < count($reportData['employees']); $i++) {
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

                foreach ($contents as $content) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                }
            }

            if ($data['format'] === 'csv') {
                $nettPayTotal = Util::currencyFormat($reportData['nettPayTotal']);
            } else {
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
        } else if ($data['detail'] === 'summary') {
            // Write out headers 
            $headers = [];
            $headers[] = [
                "",
                "CODE",
                "NAME",
                "PAYMENT METHOD",
                "NETT PAY"
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
    public function runNettPayPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getNettPayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
        $reportCols[] = ['name' => 'Code',            'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',   'width' => 25 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Payment Method',  'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Bank Name',       'width' => 15 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Branch Code',     'width' =>  8 / 100, 'alignment' => 'C'];
        $reportCols[] = ['name' => 'Account Type',    'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Account Number',  'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Nett Pay',        'width' => 12 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getNettPayList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getNettPayData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        echo (json_encode(['ok' => true, 'employees' => $employees, 'total' => $total]));
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
    public function runEmp201Report($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
            $headers[] = [
                "CODE",
                "NAME",
                "PAYE",
                "UIF",
                "SDL"
            ];

            // Inistialize the writer
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_' . $data['monthNumber'] . '_emp201', $headers);

            // For every employee
            for ($i = 0; $i < count($employees); $i++) {
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
                foreach ($contents as $content) {
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
        } else if ($data['detail'] === 'summary') {
            // Setup the headers
            $headers = [];
            $headers[] = [
                "",
                "PAYE",
                "UIF",
                "SDL"
            ];

            // Inistialize the writer
            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_' . $data['monthNumber'] . '_emp201', $headers);

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
    public function runEmp201PdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Set the tax month
        $taxMonth = $data['monthNumber'];

        // Set the tax year
        if ($taxMonth < 3) {
            $taxYear = $data['taxYear'];
        } else {
            $taxYear = $data['taxYear'] - 1;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Save the report rows
        $reportRows = [];
        foreach ($reportData['employees'] as $employee) {
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
        if ($taxMonth === 1 ||  $taxMonth === 2) {
            $reportName = $user['companyAlias'] . ' - EMP 201: ' . $data['taxYear'] . '/' . (($taxMonth < 10) ? ('0' . $taxMonth) : $taxMonth);
        } else {
            $reportName = $user['companyAlias'] . ' - EMP 201: ' . ($data['taxYear'] - 1) . '/' . (($taxMonth < 10) ? ('0' . $taxMonth) : $taxMonth);
        }
        //$reportName = $user['companyAlias'] . ' - EMP 201: ' . $data['taxYear'] . '/' . (($taxMonth < 10) ? ('0' . $taxMonth) : $taxMonth);

        // Add columns (widths are percentages). Note that the number of columns should correspond to
        // the number of elements in each row.
        $reportCols = [];
        $reportCols[] = ['name' => 'Code',            'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',   'width' => 45 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'PAYE Total',      'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'UIF Total',       'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'SDL Total',       'width' => 15 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getEmp201List($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmp201Data($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $total]));
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
    public function runEmp501Report($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmp501Data($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Set the headers headers 
        $headers = [];
        $headers[] = ["MONTH", "PAYE", "UIF", "SDL", "TOTAL LIABILITY"];

        // Initialize the writer
        $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['taxYear'] . '_emp501', $headers);

        // For every result
        for ($i = 0; $i < count($reportData['results']); $i++) {
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

            foreach ($contents as $content) {
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
    public function runEmp501PdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
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
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Add the report rows
        foreach ($reportData['results'] as $result) {
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
        $reportCols[] = ['name' => 'Month',                   'width' => 40 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'PAYE',                    'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'UIF',                     'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'SDL',                     'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Total Monthly Liability', 'width' => 15 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getEmp501List($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEmp501Data($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'results' => $reportData['results'], 'totals' => $reportData['totals']]));
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
    public function runEarningsCostAnalysisReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
            $headers[] = [
                "",
                "CODE",
                "NAME",
                "EARNINGS",
                "ALLOWANCES",
                "DEDUCTIONS",
                "COMPANY CONTRIBUTIONS",
                "FRINGE BENEFITS"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_earnings_cost_analysis_' . Util::sanitizeFileName($reportData['payrunName']), $headers);

            for ($i = 0; $i < count($reportData['employees']); $i++) {
                if ($data['format'] === 'csv') {
                    $employees[$i]['employeeCode'] = $reportData['employees'][$i]['employeeCode'];
                    $employees[$i]['employeeAlias'] = $reportData['employees'][$i]['employeeAlias'];
                    $employees[$i]['income'] = Util::currencyFormat($reportData['employees'][$i]['income']);
                    $employees[$i]['allowances'] = Util::currencyFormat($reportData['employees'][$i]['allowances']);
                    $employees[$i]['deductions'] = Util::currencyFormat($reportData['employees'][$i]['deductions']);
                    $employees[$i]['companyContributions'] = Util::currencyFormat($reportData['employees'][$i]['companyContributions']);
                    $employees[$i]['fringeBenefits'] = Util::currencyFormat($reportData['employees'][$i]['fringeBenefits']);
                } else {
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

                foreach ($contents as $content) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                }
            }

            if ($data['format'] === 'csv') {
                $incomeTotal = Util::currencyFormat($reportData['totals']['incomeTotal']);
                $allowancesTotal = Util::currencyFormat($reportData['totals']['allowancesTotal']);
                $deductionsTotal = Util::currencyFormat($reportData['totals']['deductionsTotal']);
                $companyContributionsTotal = Util::currencyFormat($reportData['totals']['companyContributionsTotal']);
                $fringeBenefitsTotal = Util::currencyFormat($reportData['totals']['fringeBenefitsTotal']);
            } else {
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
        } else if ($data['detail'] === 'summary') {
            // Write out headers 
            $headers = [];
            $headers[] = [
                "",
                "EARNINGS",
                "ALLOWANCES",
                "DEDUCTIONS",
                "COMPANY CONTRIBUTIONS",
                "FRINGE BENEFITS"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_earnings_cost_analysis_' . Util::sanitizeFileName($reportData['payrunName']), $headers);
            if ($data['format'] === 'csv') {
                $incomeTotal = Util::currencyFormat($reportData['totals']['incomeTotal']);
                $allowancesTotal = Util::currencyFormat($reportData['totals']['allowancesTotal']);
                $deductionsTotal = Util::currencyFormat($reportData['totals']['deductionsTotal']);
                $companyContributionsTotal = Util::currencyFormat($reportData['totals']['companyContributionsTotal']);
                $fringeBenefitsTotal = Util::currencyFormat($reportData['totals']['fringeBenefitsTotal']);
            } else {
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
    public function runEarningsCostAnalysisPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Don't return employee data if on;y a summary should be displayed
        if ($data['detail'] === 'summary') {
            $reportData['employees'] = [];
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
        $reportCols[] = ['name' => 'Code',                   'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',          'width' => 30 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Earnings',               'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Allowances',             'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Deductions',             'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Company Contributions',  'width' => 12 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Fringe Benefits',        'width' => 12 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getEarningsCostAnalysisList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getEarningsCostAnalysisData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Don't return employee data if on;y a summary should be displayed
        if ($data['detail'] === 'summary') {
            $reportData['employees'] = [];
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]));
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
    public function runPayslipReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Write out headers 
        $headers = [];
        $headers[] = [
            "DATE",
            "CODE",
            "ALIAS",
            "FULL NAMES",
            "LAST NAME",
            "ID NUMBER",
            "EMAIL ADDRESS",
            "EMPLOYER UIF",
            "SDL",
            "COMPANY CONTRIBUTIONS",
            "FRINGE BENEFITS",
            "EARNINGS",
            "ALLOWANCES",
            "GROSS PAY",
            "PAYE",
            "EMPLOYEE UIF",
            "OTHER DEDUCTIONS",
            "TOTAL DEDUCTIONS",
            "NET PAY"
        ];

        $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_payrun_report', $headers);

        foreach ($reportData['employees'] as $employee) {
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

            foreach ($contents as $content) {
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
    public function runPayslipPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
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
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Check if the payrun was found
        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Payrun \'' . $data['payrunId'] . '\' not found.']));
            return false;
        }

        // Create payrun details
        $sqlRow = $sqlResult->fetchAssociative();
        $payrunDescription = $sqlRow['description'];

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        $reportRows = [];
        foreach ($reportData['employees'] as $employee) {
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
        $reportCols[] = ['name' => 'Code',                    'width' =>  4 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',           'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employer UIF',            'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'SDL',                     'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Company Contributions',   'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Fringe Benefits',         'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Earnings',                'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Allowances',              'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Gross Pay',               'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'PAYE',                    'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Employee UIF',            'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Other Deductions',        'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Total Deductions',        'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Net Pay',                 'width' =>  7 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function runPayslipItemsReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        $itemRows = [];


        // Is it a detailed report?
        if ($data['detail'] === 'detailed') {
            // Load all payslip items from database

            // Write out headers 
            $headers = [];
            $headers[] = [
                "",
                "CODE",
                "ALIAS",
                "FULL NAMES",
                "LAST NAME",
                "ID NUMBER",
                "EMAIL ADDRESS",
                "EMPLOYER UIF",
                "SDL",
                "COMPANY CONTRIBUTIONS",
                "FRINGE BENEFITS",
                "EARNINGS",
                "ALLOWANCES",
                "GROSS PAY",
                "PAYE",
                "EMPLOYEE UIF",
                "OTHER DEDUCTIONS",
                "TOTAL DEDUCTIONS",
                "NET PAY"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);

            for ($i = 0; $i < count($reportData['employees']); $i++) {
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
                } else {
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

                foreach ($contents as $content) {
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
            } else {
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
        } else if ($data['detail'] === 'summary') {
            // Write out headers 
            $headers = [];
            $headers[] = [
                "",
                "EMPLOYER UIF",
                "SDL",
                "COMPANY CONTRIBUTIONS",
                "FRINGE BENEFITS",
                "EARNINGS",
                "ALLOWANCES",
                "GROSS PAY",
                "PAYE",
                "EMPLOYEE UIF",
                "OTHER DEDUCTIONS",
                "TOTAL DEDUCTIONS",
                "NET PAY"
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
            } else {
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
        } else if ($data['detail'] === 'specific') {

            foreach ($reportData['employees'] as $employee) {

                $cleanItems = [];

                foreach ($employee['items'] as $key => $item) {
                    $cleanItems[] = [
                        'code' => $item['payslipCategoryCode'],
                        'description' => $item['description'],
                        'total' => (float) $item['total'],
                    ];
                }

                $itemRows[] = [
                    'employeeCode' => $employee['employeeCode'],
                    'employeeName' => $employee['employeeAlias'],
                    'items' => $cleanItems,
                ];
            };
            $writer = $this->writePayslipSpecReport($data, $itemRows, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']));
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
    public function runPayslipItemsPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        $itemRows = [];

        foreach ($reportData['employees'] as $employee) {

            $cleanItems = [];

            foreach ($employee['items'] as $key => $item) {
                $cleanItems[] = [
                    'code' => $item['payslipCategoryCode'],
                    'description' => $item['description'],
                    'total' => (float) $item['total'],
                ];
            }

            $itemRows[] = [
                'employeeCode' => $employee['employeeCode'],
                'employeeName' => $employee['employeeAlias'],
                'items' => $cleanItems,
            ];
        }

        //error_log(print_r($itemRows, true));
        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
        $reportCols[] = ['name' => 'Code',                    'width' =>  4 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Name',           'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employer UIF',            'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'SDL',                     'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Company Contributions',   'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Fringe Benefits',         'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Earnings',                'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Allowances',              'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Gross Pay',               'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'PAYE',                    'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Employee UIF',            'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Other Deductions',        'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Total Deductions',        'width' =>  7 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Net Pay',                 'width' =>  7 / 100, 'alignment' => 'R'];

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


        if ($data['detail'] == 'specific') {
            $result = $this->writePdfSpecReport($pdf, $itemRows, $reportName);
        } else {
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
        }
        // Write the PDF report data
        //$result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getPayslipItemsList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Don't return employee data if on;y a summary should be displayed
        if ($data['detail'] === 'summary') {
            $reportData['employees'] = [];
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]));
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
    public function runReturnOfEarningsReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['results']); $i++) {
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
        $headers[] = ["MONTH", "NUMBER OF EMPLOYEES", "EARNINGS (RANDS ONLY)"];

        // Initialize the writer
        $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear'] - 1) . '_return_of_earnings', $headers);

        // Add the report rows
        foreach ($reportRows as $content) {
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
    public function runReturnOfEarningsPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['results']); $i++) {
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
        $reportName = $user['companyAlias'] . ' - Return of Earnings (ROE): ' . ($data['taxYear'] - 1);

        // Add columns (widths are percentages). Note that the number of columns should correspond to
        // the number of elements in each row.
        $reportCols = [];
        $reportCols[] = ['name' => 'Month',                 'width' => 70 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Number of Employees',   'width' => 15 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Earnings (Rands Only)', 'width' => 15 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear'] - 1) . '_return_of_earnings_' . date('Ymd') . '.pdf';;

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
    public function getReturnOfEarningsList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getReturnOfEarningsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'results' => $reportData['results'], 'totals' => $reportData['totals']]));
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
    public function getDetailedPayrollReportList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Send result
        echo (json_encode(['ok' => true, 'results' => $reportData['results']]));
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
    public function runDetailedPayrollReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['results']); $i++) {
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
        $headers[] = ["NAME", "ID NUMBER", "EMAIL ADDRESS", "CELLPHONE NUMBER", "WAGE TYPES", "GROSS INCOME"];

        // Initialize the writer
        $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear']) . '_detailed_payroll_report', $headers);

        // Add the report rows
        foreach ($reportRows as $content) {
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
    public function runDetailedPayrollPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getDetailedPayrollData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Setup the report rows
        $reportRows = [];
        for ($i = 0; $i < count($reportData['results']); $i++) {


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
        $reportCols[] = ['name' => 'Name',                 'width' => 25 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'ID Number',            'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Email Address',        'width' => 20 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Cellphone Number',     'width' => 10 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Wage Types',           'width' => 25 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Gross Income',         'width' => 10 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . ($data['taxYear'] - 1) . '_detailed_payroll_report_' . date('Ymd') . '.pdf';;

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
    public function runOvertimeReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
            $headers[] = [
                "CODE",
                "ALIAS",
                "FULL NAMES",
                "LAST NAME",
                "ID/PASSPORT NUMBER",
                "CELL NUMBER",
                "EMAIL ADDRESS",
                "HOURS WORKED",
                "AMOUNT EARNED"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);

            for ($i = 0; $i < count($reportData['employees']); $i++) {
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

                foreach ($contents as $content) {
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
        } else if ($data['detail'] === 'summary') {
            // Write out headers 
            $headers = [];
            $headers[] = [
                "CODE",
                "ALIAS",
                "FULL NAMES",
                "LAST NAME",
                "ID/PASSPORT NUMBER",
                "CELL NUMBER",
                "EMAIL ADDRESS",
                "HOURS WORKED",
                "AMOUNT EARNED"
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
    public function runOvertimePdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
        $reportCols[] = ['name' => 'Code',                    'width' =>  4 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Alias',          'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Full Names',              'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Last Name',               'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'ID / Passport Number',    'width' => 12 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Cell Number',             'width' =>  8 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Email Address',           'width' => 20 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Hours Worked',            'width' => 10 / 100, 'alignment' => 'R'];
        $reportCols[] = ['name' => 'Amount Earned',           'width' => 10 / 100, 'alignment' => 'R'];

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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
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
    public function getOvertimeList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getOvertimeData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Don't return employee data if on;y a summary should be displayed
        if ($data['detail'] === 'summary') {
            $reportData['employees'] = [];
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]));
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
    public function runPayslipItemsSpecifiedReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
            $headers[] = [
                "CODE",
                "ALIAS",
                "FULL NAMES",
                "LAST NAME",
                "ID/PASSPORT NUMBER",
                "CELL NUMBER",
                "EMAIL ADDRESS",
                "AMOUNT EARNED"
            ];

            $writer = $this->writeReport($data, strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_' . $data['detail'] . '_payslip_items_specified_report_' . Util::sanitizeFileName($reportData['payrunName']), $headers);

            for ($i = 0; $i < count($reportData['employees']); $i++) {
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

                foreach ($contents as $content) {
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
        } else if ($data['detail'] === 'summary') {
            // Write out headers 
            $headers = [];
            $headers[] = [
                "CODE",
                "ALIAS",
                "FULL NAMES",
                "LAST NAME",
                "ID/PASSPORT NUMBER",
                "CELL NUMBER",
                "EMAIL ADDRESS",
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
    public function runPayslipItemsSpecifiedPdfReport($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
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
        for ($i = 0; $i < count($reportData['employees']); $i++) {
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
        $reportCols[] = ['name' => 'Code',                    'width' =>  5 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Employee Alias',          'width' => 13 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Full Names',              'width' => 15 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Last Name',               'width' => 15 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'ID / Passport Number',    'width' => 13 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Cell Number',             'width' =>  9 / 100, 'alignment' => 'L'];
        $reportCols[] = ['name' => 'Email Address',           'width' => 20 / 100, 'alignment' => 'L'];
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
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_ayslip_items_report_specified_' . date('Ymd') . '.pdf';

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
    public function getPayslipItemsSpecifiedList($data, $user, $db)
    {
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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getPayslipItemSpecifiedData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Don't return employee data if on;y a summary should be displayed
        if ($data['detail'] === 'summary') {
            $reportData['employees'] = [];
        }

        // Send result
        echo (json_encode(['ok' => true, 'employees' => $reportData['employees'], 'total' => $reportData['totals']]));
        return true;
    }


    //
    // PRIVATE FUNCTIONS
    //

    // @param $string               The string to format
    // @param $maxLength            The maximum length of the string or null
    private function formatSarsString($string, $maxLength)
    {
        if (strlen($string) === 0) {
            return '';
        }

        // Remove all whitespace characters from the start and end of the string
        $formattedString = trim($string);

        // Remove unallowed characters from the string
        $formattedString = str_replace(",", "", $formattedString);
        $formattedString = str_replace("|", "", $formattedString);

        // Is there a max length for the stirng?
        if ($maxLength !== null) {
            $formattedString = substr($formattedString, 0, $maxLength);
        }

        // Add the quotes for the string
        $formattedString = '"' . $formattedString . '"';

        return $formattedString;
    }

    // @param $data             The request data
    // @param $report           Name The name of the report
    // @param $headers          The report fieldnames
    private function writeReport($data, $reportName, $headers)
    {
        //set format
        $formatType = 'xls';

        if (isset($data['format']) && $data['format'] !== '') {
            if (in_array($data['format'], array('xls', 'csv', 'xlsx'))) {
                $formatType = trim($data['format']);
            }
            if ($formatType == 'xlsx' || $formatType == 'xls') {
                $formatType = 'xlsx';
            }
        }

        // Create the file name for the report
        $fileName = $reportName . '_' . date('Ymd') . '.' . $formatType;

        $writer = null;
        if ($formatType == 'xlsx') {
            $writer = WriterEntityFactory::createXLSXWriter();
        } else {
            $writer = WriterEntityFactory::createCSVWriter();
        }
        $writer->openToBrowser($fileName);

        //wirte headers
        foreach ($headers as $header) {
            $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
        }

        return $writer;
    }
    private function writeELSReport($data, $reportName)
    {
        //set format
        $formatType = 'xls';

        if (isset($data['format']) && $data['format'] !== '') {
            if (in_array($data['format'], array('xls', 'csv', 'xlsx'))) {
                $formatType = trim($data['format']);
            }
            if ($formatType == 'xlsx' || $formatType == 'xls') {
                $formatType = 'xlsx';
            }
        }

        // Create the file name for the report
        $fileName = $reportName . '_' . date('Ymd') . '.' . $formatType;

        $writer = null;
        if ($formatType == 'xlsx') {
            $writer = WriterEntityFactory::createXLSXWriter();
        } else {
            $writer = WriterEntityFactory::createCSVWriter();
        }
        $writer->openToBrowser($fileName);

        $EMPheaders = [["Leave For Employee:"]];
        foreach ($EMPheaders as $header) {
            $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
        }
        foreach ($data['employee'][0] as $key => $value) {
            if ($key == 'EmploymentDate') {
                $key = 'Date Appointed';
            }
            $EMPcontent = ["{$key}:", $value];
            $writer->addRow(WriterEntityFactory::createRowFromArray($EMPcontent, null));
        }

        foreach ($data['details'] as $leave) {
            $writer->addRow(WriterEntityFactory::createRowFromArray([''], null));
            $header = [strtoupper($leave['LeaveType']) . ":"];
            $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
            $subheaders = [];
            $displayHeaders = [];

            foreach ($leave['leaveDetails'][0] as $key => $value) {
                $subheaders[] = $key;
                $displayHeaders[] = ucwords(strtolower($key));
            }
            [$subheaders[0], $subheaders[1]] = [$subheaders[1], $subheaders[0]];
            [$displayHeaders[0], $displayHeaders[1]] = [$displayHeaders[1], $displayHeaders[0]];
            $writer->addRow(WriterEntityFactory::createRowFromArray($displayHeaders, null));
            foreach ($leave['leaveDetails'] as $item) {
                $details = [$item[$subheaders[0]], $item[$subheaders[1]], $item[$subheaders[2]], $item[$subheaders[3]], $item[$subheaders[4]]];

                $writer->addRow(WriterEntityFactory::createRowFromArray($details, null));
            }
        }


        return $writer;
    }
    private function writeYtdReport($data, $reportName)
    {
        //set format
        $formatType = 'xls';

        if (isset($data['format']) && $data['format'] !== '') {
            if (in_array($data['format'], array('xls', 'csv', 'xlsx'))) {
                $formatType = trim($data['format']);
            }
            if ($formatType == 'xlsx' || $formatType == 'xls') {
                $formatType = 'xlsx';
            }
        }

        // Create the file name for the report
        $fileName = $reportName . '_' . date('Ymd') . '.' . $formatType;

        $writer = null;
        if ($formatType == 'xlsx') {
            $writer = WriterEntityFactory::createXLSXWriter();
        } else {
            $writer = WriterEntityFactory::createCSVWriter();
        }
        $writer->openToBrowser($fileName);

        $EMPheaders = [["Year to Date Report - Employee Details:"]];
        foreach ($EMPheaders as $header) {
            $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
        }
        foreach ($data['employee'][0] as $key => $value) {
            if ($key == 'EmploymentDate') {
                $key = 'Date Appointed';
            }
            $EMPcontent = ["{$key}:", $value];
            $writer->addRow(WriterEntityFactory::createRowFromArray($EMPcontent, null));
        }

        $categoryTitles = [
            'INCO' => 'Earnings',
            'DEDU' => 'Deductions',
            'CONT' => 'Company Contributions',
            'FBEN' => 'Fringe Benefits',
            'ALLO' => 'Allowances',
            'NET' => 'Net Income'
        ];

        $months = [
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
            'January',
            'February'
        ];

        foreach ($data['details'] as $catData) {
            $category = $catData['category'];
            $categoryTitle = isset($categoryTitles[$category]) ? $categoryTitles[$category] : $category;

            $writer->addRow(WriterEntityFactory::createRowFromArray([''], null));
            $writer->addRow(WriterEntityFactory::createRowFromArray([strtoupper($categoryTitle) . ":"], null));

            // Subheaders
            $subheaders = ['Description'];
            foreach ($months as $m) {
                $subheaders[] = substr($m, 0, 3);
            }
            $subheaders[] = 'Total';
            $writer->addRow(WriterEntityFactory::createRowFromArray($subheaders, null));

            // Detail rows
            foreach ($catData['items'] as $item) {
                $row = [$item['description']];
                foreach ($months as $m) {
                    $row[] = isset($item[$m]) ? $item[$m] : '0.00';
                }
                $row[] = isset($item['TOTAL']) ? $item['TOTAL'] : '0.00';
                $writer->addRow(WriterEntityFactory::createRowFromArray($row, null));
            }
        }

        return $writer;
    }
    private function writePayslipSpecReport($data, $items, $reportName)
    {
        //set format
        $formatType = 'xls';

        if (isset($data['format']) && $data['format'] !== '') {
            if (in_array($data['format'], array('xls', 'csv', 'xlsx'))) {
                $formatType = trim($data['format']);
            }
            if ($formatType == 'xlsx' || $formatType == 'xls') {
                $formatType = 'xlsx';
            }
        }

        // Create the file name for the report
        $fileName = $reportName . '_' . date('Ymd') . '.' . $formatType;

        $writer = null;
        if ($formatType == 'xlsx') {
            $writer = WriterEntityFactory::createXLSXWriter();
        } else {
            $writer = WriterEntityFactory::createCSVWriter();
        }
        $writer->openToBrowser($fileName);

        foreach ($items as $employee) {

            // Employee row
            $writer->addRow(
                WriterEntityFactory::createRowFromArray([
                    $employee['employeeName'] . ' (' . $employee['employeeCode'] . ')'
                ])
            );

            // Column headers
            $writer->addRow(
                WriterEntityFactory::createRowFromArray([
                    'Code',
                    'Description',
                    'Total'
                ])
            );

            // Employee items
            foreach ($employee['items'] as $item) {

                $writer->addRow(
                    WriterEntityFactory::createRowFromArray([
                        $item['code'],
                        $item['description'],
                        number_format($item['total'], 2)
                    ])
                );
            }

            // Blank line between employees
            $writer->addRow(
                WriterEntityFactory::createRowFromArray([''])
            );
        }
        return $writer;
    }

    // @param $pdf              The PDF document to write to
    // @param $reportName       The name of the report
    // @param $columns          An array containing details of the report columns
    // @param $rows             An array with the data for the report
    // @param $style            An containing style details for the report
    private function writePdfReport($pdf, $reportName, $columns, $rows, $style = null)
    {
        // The number of elements in each row should correspond to the number of elements
        // in the columns array
        foreach ($rows as $row) {
            if (count($row) !== count($columns)) {
                return (['ok' => false, 'error' => 'PDF report columns and rows do not match up']);
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
        if ($style !== null) {
            if (array_key_exists('marginX', $style) && ($style['marginX'] !== null)) {
                $marginX = $style['marginX'];
            }
            if (array_key_exists('marginY', $style) && ($style['marginY'] !== null)) {
                $marginY = $style['marginY'];
            }
            if (array_key_exists('lineHeight', $style) && ($style['lineHeight'] !== null)) {
                $lineHeight = $style['lineHeight'];
            }
            if (array_key_exists('textSize', $style) && ($style['textSize'] !== null)) {
                $textSize = $style['textSize'];
            }
            if (array_key_exists('textColor', $style) && ($style['textColor'] !== null)) {
                $textColor = $style['textColor'];
            }
            if (array_key_exists('backgroundColor', $style) && ($style['backgroundColor'] !== null)) {
                $backgroundColor = $style['backgroundColor'];
            }
            if (array_key_exists('headingTextSize', $style) && ($style['headingTextSize'] !== null)) {
                $headingTextSize = $style['headingTextSize'];
            }
            if (array_key_exists('headingTextColor', $style) && ($style['headingTextColor'] !== null)) {
                $headingTextColor = $style['headingTextColor'];
            }
            if (array_key_exists('headingBackgroundColor', $style) && ($style['headingBackgroundColor'] !== null)) {
                $headingBackgroundColor = $style['headingBackgroundColor'];
            }
            if (array_key_exists('highlightColor', $style) && ($style['highlightColor'] !== null)) {
                $highlightColor = $style['highlightColor'];
            }
            if (array_key_exists('borderColor', $style) && ($style['borderColor'] !== null)) {
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
        if (@file_exists(dirname(__FILE__) . '/lang/eng.php')) {
            require_once(dirname(__FILE__) . '/lang/eng.php');
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
        for ($i = 0; $i < count($rows); $i++) {
            // Is there NOT enough space for another item?
            if (($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight)) {
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
        foreach ($columns as $col) {
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
        for ($i = 0; $i < count($rows); $i++) {
            // Is there NOT enough space for another item?
            if (($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight)) {
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
                foreach ($columns as $col) {
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
            for ($j = 0; $j < count($columns); $j++) {
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

        return (['ok' => true]);
    }
    private function writeELSPdfReport($pdf, $data, $reportName)
    {

        // -------------------------------------------------
        // PDF PAGE SETTINGS & MetaData
        // -------------------------------------------------

        $pdf->SetMargins(1, 1, 1, 1);
        $pdf->SetAutoPageBreak(false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->AddPage('P', 'A4');
        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';
        $imageDetails = getimagesize($imageDir);
        $imageWidth = $imageDetails[0];
        $imageHeight = $imageDetails[1];
        $imageScale = 5;
        $imageHeight = ($imageHeight * 1 / 100) * $imageScale;
        $imageWidth = ($imageWidth * 1 / 100) * $imageScale;
        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor('Payaccsys Payroll');
        $pdf->SetTitle('Payaccsys Payroll - ' . $reportName);
        $pdf->SetSubject('');
        $pdf->SetKeywords('');
        $pageWidth = $pdf->getPageWidth();

        // -----------------------------
        // LOGO and PAGE title
        // -----------------------------

        $logoWidth = 30;
        $logoX = $pageWidth - $logoWidth - 15;
        $logoY = 8;

        $pdf->Image($imageDir, $logoX, $logoY, $logoWidth);

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY(15, 5.5);
        $pdf->Cell(120, 10, $reportName, 0, 0, 'L');

        $pdf->Line(15, 15, $pageWidth - 15, 15);

        // -------------------
        // EMPLOYEE DETAILS TABLE 
        // -------------------

        $startX = 15;
        $startY = 20;
        $tableX = $startX;
        $tableY = $startY;
        $colWidth = 170;
        $col1 = 40;
        $col2 = 130;
        $rowHeight = 6;
        $headerHeight = 8;

        // ----------------------
        //        HEADER 
        // ----------------------

        $pdf->SetFillColor(239, 78, 69); //Payaccsys Coral Red
        $pdf->Rect($tableX, $tableY, $colWidth, $headerHeight, 'DF');
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->SetXY($tableX, $tableY + 2);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Cell($colWidth, 5, "Leave for Employee:", 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);

        // ----------------------
        //      BODY ROWS 
        // ----------------------

        $rowY = $tableY + $headerHeight;

        foreach ($data['Employee'][0] as $key => $value) {

            if ($key == 'EmploymentDate') {
                $key = 'Date Appointed';
            }

            // Column A (KEY)
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->Rect($tableX, $rowY, $col1, $rowHeight);
            $pdf->SetXY($tableX + 1, $rowY + 1);
            $pdf->Cell($col1 - 2, 0, "{$key} :", 0, 0, 'L');

            // Column B (VALUE)
            $pdf->SetFont('helvetica', '', 11);
            $pdf->Rect($tableX + $col1, $rowY, $col2, $rowHeight);
            $pdf->SetXY($tableX + $col1 + 1, $rowY + 1);
            $pdf->Cell($col2 - 2, 0, $value, 0, 0, 'L');

            $rowY += $rowHeight;
        }

        // ----------------------
        //      Leave Tables
        // ----------------------
        $rowY += 10;

        foreach ($data['Pdfdetails'] as $leaveTypeData) {

            $tableX = $startX;
            $col1 = 30; // Description
            $col2 = 60; // Date
            $col3 = 40;
            $col4 = 40; // Amount
            $tableWidth = $col1 + $col2 + $col3 + $col4;
            $headerHeight = 8;
            $subHeaderHeight = 6;
            $bodyHeight = 6;
            $pageHeight = $pdf->getPageHeight();
            $bottomMargin = 20;

            // if not enough space for full section header
            if ($rowY + $headerHeight + 30 > ($pageHeight - $bottomMargin)) {

                $pdf->AddPage('P', 'A4');

                $pdf->SetXY(15, 5.5);
                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->Cell(120, 10, $reportName, 0, 0, 'L');
                $pdf->Line(15, 15, $pageWidth - 15, 15);

                $rowY = 20;
            }

            // =================================================
            // MAIN HEADER ROW (Leave Type)
            // =================================================
            $pdf->SetFillColor(239, 78, 69); //Payaccsys Coral Red
            //$pdf->SetFillColor(213, 92, 3); //Lexpro orange
            $pdf->Rect($tableX, $rowY, $tableWidth, $headerHeight, 'DF');
            $pdf->SetFont('helvetica', 'B', 11);
            $pdf->SetXY($tableX, $rowY);
            $pdf->SetTextColor(255, 255, 255);

            $pdf->Cell(
                $tableWidth,
                $headerHeight,
                $leaveTypeData['LeaveType'],
                0,
                0,
                'C'
            );
            $pdf->SetTextColor(0, 0, 0);

            $rowY += $headerHeight;

            // =================================================
            // SUB HEADER ROW
            // =================================================

            $pdf->SetFillColor(240, 240, 240);
            $pdf->SetFont('helvetica', 'B', 10);

            // Description
            $pdf->Rect($tableX, $rowY, $col1, $subHeaderHeight, 'DF');
            $pdf->SetXY($tableX, $rowY);
            $pdf->Cell($col1, $subHeaderHeight, 'Date', 0, 0, 'C');

            // Date
            $pdf->Rect($tableX + $col1, $rowY, $col2, $subHeaderHeight, 'DF');
            $pdf->SetXY($tableX + $col1, $rowY);
            $pdf->Cell($col2, $subHeaderHeight, 'Description', 0, 0, 'C');

            // Amount
            $pdf->Rect($tableX + $col1 + $col2, $rowY, $col3, $subHeaderHeight, 'DF');
            $pdf->SetXY($tableX + $col1 + $col2, $rowY);
            $pdf->Cell($col3, $subHeaderHeight, 'Notes', 0, 0, 'C');

            // Amount
            $pdf->Rect($tableX + $col1 + $col2 + $col3, $rowY, $col4, $subHeaderHeight, 'DF');
            $pdf->SetXY($tableX + $col1 + $col2 + $col3, $rowY);
            $pdf->Cell($col4, $subHeaderHeight, 'Amount', 0, 0, 'C');

            $rowY += $subHeaderHeight;

            // =================================================
            // DETAIL ROWS
            // =================================================
            $pdf->SetFont('helvetica', '', 10);

            $lastBalance = '';

            foreach ($leaveTypeData['leaveDetails'] as $detail) {

                $lastBalance = $detail['balance'];
                $pageHeight = $pdf->getPageHeight();
                $bottomMargin = 10;

                // if not enough space for full section header
                if ($rowY + $headerHeight + 30 > ($pageHeight - $bottomMargin)) {

                    $pdf->AddPage('P', 'A4');
                    $rowY = 20;
                }
                // Description
                $pdf->Rect($tableX, $rowY, $col1, $bodyHeight);
                $pdf->SetXY($tableX + 1, $rowY);
                $pdf->Cell($col1 - 2, $bodyHeight, $detail['date'], 0, 0, 'L');

                // Date
                $pdf->Rect($tableX + $col1, $rowY, $col2, $bodyHeight);
                $pdf->SetXY($tableX + $col1, $rowY);
                $pdf->Cell($col2, $bodyHeight, $detail['description'], 0, 0, 'C');

                // Amount
                $pdf->Rect($tableX + $col1 + $col2, $rowY, $col3, $bodyHeight);
                $pdf->SetXY($tableX + $col1 + $col2, $rowY);
                $pdf->Cell($col3, $bodyHeight, $detail['note'], 0, 0, 'C');

                // Amount
                $pdf->Rect($tableX + $col1 + $col2 + $col3, $rowY, $col4, $bodyHeight);
                $pdf->SetXY($tableX + $col1 + $col2 + $col3, $rowY);
                $pdf->Cell($col4, $bodyHeight, $detail['unit'], 0, 0, 'C');

                $rowY += $bodyHeight;
            }

            // =================================================
            // TOTAL ROW
            // =================================================
            $pdf->SetFont('helvetica', 'B', 10);

            // Column 1 - Total
            $pdf->Rect($tableX, $rowY, $col1, $bodyHeight);
            $pdf->SetXY($tableX, $rowY);
            $pdf->Cell(
                $col1,
                $bodyHeight,
                'Total:',
                0,
                0,
                'C'
            );

            // Column 2 - Empty
            $pdf->Rect($tableX + $col1, $rowY, $col2, $bodyHeight);

            // Column 3 - Empty
            $pdf->Rect($tableX + $col1 + $col2, $rowY, $col3, $bodyHeight);

            // Column 4 - Balance
            $pdf->Rect($tableX + $col1 + $col2 + $col3, $rowY, $col4, $bodyHeight);
            $pdf->SetXY($tableX + $col1 + $col2 + $col3, $rowY);
            $pdf->Cell(
                $col4,
                $bodyHeight,
                $lastBalance,
                0,
                0,
                'C'
            );

            $rowY += $bodyHeight + 8;
        }


        return ['ok' => true];
    }
    private function writeYtdPdfReport($pdf, $data, $reportName)
    {
        // -------------------------------------------------
        // PDF PAGE SETTINGS & MetaData
        // -------------------------------------------------

        $pdf->SetMargins(1, 1, 1, 1);
        $pdf->SetAutoPageBreak(false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);
        $pdf->AddPage('L', 'A4');
        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';
        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor('Payaccsys Payroll');
        $pdf->SetTitle('Payaccsys Payroll - ' . $reportName);
        $pdf->SetSubject('');
        $pdf->SetKeywords('');
        $pageWidth = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        // -----------------------------
        // LOGO and PAGE title
        // -----------------------------

        $logoWidth = 30;
        $logoX = $pageWidth - $logoWidth - 15;
        $logoY = 8;

        $pdf->Image($imageDir, $logoX, $logoY, $logoWidth);

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY(15, 5.5);
        $pdf->Cell(120, 10, $reportName, 0, 0, 'L');

        $pdf->Line(15, 15, $pageWidth - 15, 15);

        // -------------------
        // EMPLOYEE DETAILS TABLE 
        // -------------------

        $startX = 15;
        $startY = 20;
        $tableX = $startX;
        $tableY = $startY;
        $colWidth = 170;
        $col1 = 50;
        $col2 = 120;
        $rowHeight = 5;
        $headerHeight = 5;

        // ----------------------
        //        HEADER 
        // ----------------------

        $pdf->SetFillColor(239, 78, 69); // PayAccsys Coral Red
        $pdf->Rect($tableX + 50, $tableY, $colWidth, $headerHeight, 'DF');
        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->SetXY($tableX + 50, $tableY + 0.3);
        $pdf->SetTextColor(255, 255, 255);
        $pdf->Cell($colWidth, 4, "Employee Details:", 0, 0, 'C');
        $pdf->SetTextColor(0, 0, 0);

        // ----------------------
        //      BODY ROWS
        // ----------------------

        $employee = $data['Employee'][0];

        $fullName = '(' . $employee['Code'] . ') ' .
            $employee['Name'] . ' ' .
            $employee['Surname'];

        $dateOfBirth = $employee['DateOfBirth'];

        $employmentPeriod =
            (!empty($employee['EmploymentDate']) ? $employee['EmploymentDate'] : '-') .
            ' - ' .
            (!empty($employee['EmploymentEndDate']) ? $employee['EmploymentEndDate'] : 'Current');

        $employmentStatus = !empty($employee['EmploymentStatus'])
            ? $employee['EmploymentStatus']
            : '-';

        // Calculate Age + DOB display
        $dobDisplay = '-';

        if (!empty($dateOfBirth)) {
            try {
                $dob = new DateTime($dateOfBirth);
                $today = new DateTime();
                $age = $today->diff($dob)->y;

                $dobDisplay = $age . ' (' . $dateOfBirth . ')';
            } catch (Exception $e) {
                $dobDisplay = $dateOfBirth;
            }
        }

        $rowY = $tableY + $headerHeight;

        $rowHeight = 5;

        // Column widths for Row 1
        $c1 = 20;   // Name label
        $c2 = 70;   // Full name
        $c3 = 20;   // Age label
        $c4 = 60;   // Age + DOB

        // =================================================
        // ROW 1
        // Name | (Code) Name Surname | Age | 35 (DOB)
        // =================================================

        // Column 1
        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->Rect($tableX + 50, $rowY, $c1, $rowHeight);
        $pdf->SetXY($tableX + 50 + 1, $rowY + 0.5);
        $pdf->Cell($c1 - 2, 0, 'Name :', 0, 0, 'L');

        // Column 2
        $pdf->SetFont('helvetica', '', 8);
        $pdf->Rect($tableX + 50 + $c1, $rowY, $c2, $rowHeight);
        $pdf->SetXY($tableX + 50 + $c1 + 1, $rowY + 0.5);
        $pdf->Cell($c2 - 2, 0, $fullName, 0, 0, 'L');

        // Column 3
        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->Rect($tableX + 50 + $c1 + $c2, $rowY, $c3, $rowHeight);
        $pdf->SetXY($tableX + 50 + $c1 + $c2 + 1, $rowY + 0.5);
        $pdf->Cell($c3 - 2, 0, 'Tax Age :', 0, 0, 'L');

        // Column 4
        $pdf->SetFont('helvetica', '', 8);
        $pdf->Rect($tableX + 50 + $c1 + $c2 + $c3, $rowY, $c4, $rowHeight);
        $pdf->SetXY($tableX + 50 + $c1 + $c2 + $c3 + 1, $rowY + 0.5);
        $pdf->Cell($c4 - 2, 0, $dobDisplay, 0, 0, 'L');

        $rowY += $rowHeight;

        // =================================================
        // ROW 2
        // Employment Period
        // =================================================

        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->Rect($tableX + 50, $rowY, $col1, $rowHeight);
        $pdf->SetXY($tableX + 50 + 1, $rowY + 0.5);
        $pdf->Cell($col1 - 2, 0, 'Employment Period :', 0, 0, 'L');

        $pdf->SetFont('helvetica', '', 8);
        $pdf->Rect($tableX + 50 + $col1, $rowY, $col2, $rowHeight);
        $pdf->SetXY($tableX + 50 + $col1 + 1, $rowY + 0.5);
        $pdf->Cell($col2 - 2, 0, $employmentPeriod, 0, 0, 'L');

        $rowY += $rowHeight;

        // =================================================
        // ROW 3
        // Employment Status
        // =================================================

        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->Rect($tableX + 50, $rowY, $col1, $rowHeight);
        $pdf->SetXY($tableX + 50 + 1, $rowY + 0.5);
        $pdf->Cell($col1 - 2, 0, 'Employment Status :', 0, 0, 'L');

        $pdf->SetFont('helvetica', '', 8);
        $pdf->Rect($tableX + 50 + $col1, $rowY, $col2, $rowHeight);
        $pdf->SetXY($tableX + 50 + $col1 + 1, $rowY + 0.5);
        $pdf->Cell($col2 - 2, 0, $employmentStatus, 0, 0, 'L');

        $rowY += $rowHeight;

        // // ----------------------
        // //      YTD Tables
        // // ----------------------
        $rowY += 5;

        $categoryTitles = [
            'INCO' => 'Earnings',
            'DEDU' => 'Deductions',
            'CONT' => 'Company Contributions',
            'FBEN' => 'Fringe Benefits',
            'ALLO' => 'Allowances',
            'NET' => 'Net Income'
        ];

        $months = [
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
            'January',
            'February'
        ];

        foreach ($data['Pdfdetails'] as $catData) {
            $category = $catData['category'];
            $categoryTitle = isset($categoryTitles[$category]) ? $categoryTitles[$category] : $category;

            $tableX = $startX;
            $descWidth = 57;
            $monthWidth = 16;
            $totalWidth = 28;
            $tableWidth = $descWidth + (12 * $monthWidth) + $totalWidth;
            $headerHeight = 5;
            $subHeaderHeight = 5;
            $bodyHeight = 5;
            $bottomMargin = 20;

            // Check if not enough space on current page
            if ($rowY + $headerHeight + $subHeaderHeight + (count($catData['items']) * $bodyHeight) + $bottomMargin > $pageHeight) {
                $pdf->AddPage('L', 'A4');
                $rowY = 20;

                $pdf->SetFont('helvetica', 'B', 12);
                $pdf->SetXY(15, 5.5);
                $pdf->Cell(120, 10, $reportName, 0, 0, 'L');
                $pdf->Line(15, 15, $pageWidth - 15, 15);
            }

            // =================================================
            // MAIN HEADER ROW (Category Title)
            // =================================================
            $pdf->SetFillColor(239, 78, 69); //PayAccsys Coral Red
            $pdf->Rect($tableX, $rowY, $tableWidth, $headerHeight, 'DF');
            $pdf->SetFont('helvetica', 'B', 8);
            $pdf->SetXY($tableX, $rowY + 0.3);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->Cell($tableWidth, 4, $categoryTitle, 0, 0, 'L');
            $pdf->SetTextColor(0, 0, 0);

            $rowY += $headerHeight;

            // =================================================
            // SUB HEADER ROW
            // =================================================
            $pdf->SetFillColor(240, 240, 240);
            $pdf->SetFont('helvetica', 'B', 8);

            $pdf->Rect($tableX, $rowY, $descWidth, $subHeaderHeight, 'DF');
            $pdf->SetXY($tableX, $rowY + 0.3);
            $pdf->Cell($descWidth, 4, $category === 'NET' ? 'NET INCOME' : 'Description', 0, 0, 'L');

            $currentX = $tableX + $descWidth;
            foreach ($months as $m) {
                $pdf->Rect($currentX, $rowY, $monthWidth, $subHeaderHeight, 'DF');
                $pdf->SetXY($currentX, $rowY + 0.3);
                $pdf->Cell($monthWidth, 4, substr($m, 0, 3), 0, 0, 'R');
                $currentX += $monthWidth;
            }

            $pdf->Rect($currentX, $rowY, $totalWidth, $subHeaderHeight, 'DF');
            $pdf->SetXY($currentX, $rowY + 0.3);
            $pdf->Cell($totalWidth, 4, 'Total', 0, 0, 'R');

            $rowY += $subHeaderHeight;

            // =================================================
            // DETAIL ROWS
            // =================================================
            foreach ($catData['items'] as $item) {
                $isTotalRow = ($item['description'] === 'TOTAL' || $item['description'] === 'Net-Pay');
                if ($isTotalRow) {
                    $pdf->SetFont('helvetica', 'B', 8);
                    $pdf->SetFillColor(245, 245, 245);
                    $drawMode = 'DF';
                } else {
                    $pdf->SetFont('helvetica', '', 8);
                    $drawMode = 'D';
                }

                if ($rowY + $bodyHeight + $bottomMargin > $pageHeight) {
                    $pdf->AddPage('L', 'A4');
                    $rowY = 20;

                    $pdf->SetFont('helvetica', 'B', 12);
                    $pdf->SetXY(15, 5.5);
                    $pdf->Cell(120, 10, $reportName, 0, 0, 'L');
                    $pdf->Line(15, 15, $pageWidth - 15, 15);

                    $pdf->SetFillColor(240, 240, 240);
                    $pdf->SetFont('helvetica', 'B', 8);

                    $pdf->Rect($tableX, $rowY, $descWidth, $subHeaderHeight, 'DF');
                    $pdf->SetXY($tableX, $rowY + 0.3);
                    $pdf->Cell($descWidth, 4, $category === 'NET' ? 'NET INCOME' : 'Description', 0, 0, 'L');

                    $currentX = $tableX + $descWidth;
                    foreach ($months as $m) {
                        $pdf->Rect($currentX, $rowY, $monthWidth, $subHeaderHeight, 'DF');
                        $pdf->SetXY($currentX, $rowY + 0.3);
                        $pdf->Cell($monthWidth, 4, substr($m, 0, 3), 0, 0, 'R');
                        $currentX += $monthWidth;
                    }

                    $pdf->Rect($currentX, $rowY, $totalWidth, $subHeaderHeight, 'DF');
                    $pdf->SetXY($currentX, $rowY + 0.3);
                    $pdf->Cell($totalWidth, 4, 'Total', 0, 0, 'R');

                    $rowY += $subHeaderHeight;

                    if ($isTotalRow) {
                        $pdf->SetFont('helvetica', 'B', 8);
                        $pdf->SetFillColor(245, 245, 245);
                        $drawMode = 'DF';
                    } else {
                        $pdf->SetFont('helvetica', '', 8);
                        $drawMode = 'D';
                    }
                }

                $pdf->Rect($tableX, $rowY, $descWidth, $bodyHeight, $drawMode);
                $pdf->SetXY($tableX + 1, $rowY + 0.5);
                $pdf->Cell($descWidth - 2, 4, $item['description'], 0, 0, 'L');

                $currentX = $tableX + $descWidth;
                foreach ($months as $m) {
                    $val = isset($item[$m]) ? $item[$m] : '0.00';
                    $pdf->Rect($currentX, $rowY, $monthWidth, $bodyHeight, $drawMode);
                    $pdf->SetXY($currentX + 1, $rowY + 0.5);
                    $pdf->Cell($monthWidth - 2, 4, $val, 0, 0, 'R');
                    $currentX += $monthWidth;
                }

                $totalVal = isset($item['TOTAL']) ? $item['TOTAL'] : '0.00';
                $pdf->Rect($currentX, $rowY, $totalWidth, $bodyHeight, $drawMode);
                $pdf->SetXY($currentX + 1, $rowY + 0.5);
                $pdf->Cell($totalWidth - 2, 4, $totalVal, 0, 0, 'R');

                $rowY += $bodyHeight;
            }
        }

        return ['ok' => true];
    }
    private function writePdfSpecReport($pdf, $data, $reportName)
    {
        $pdf->SetMargins(10, 10, 10);
        $pdf->SetAutoPageBreak(true, 15);
        $pdf->AddPage('P', 'A4');

        // -----------------------
        // PAGE HEADER
        // -----------------------

        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';
        $pageWidth = $pdf->getPageWidth();
        $leftMargin = 10;
        $rightMargin = 10;
        $logoWidth = 30;
        $logoHeight = 12;

        $headerY = 10;

        // Title
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY($leftMargin, $headerY);

        $titleWidth = $pageWidth - $leftMargin - $rightMargin - $logoWidth - 5;

        $pdf->Cell(
            $titleWidth,
            $logoHeight,
            $reportName,
            0,
            0,
            'L'
        );

        // Logo on same row
        $pdf->Image(
            $imageDir,
            $pageWidth - $rightMargin - $logoWidth,
            $headerY + 3.8,
            $logoWidth
        );

        // Underline beneath both title and logo
        $lineY = $headerY + $logoHeight + 2;

        $pdf->Line(
            $leftMargin,
            $lineY - 3,
            $pageWidth - $rightMargin,
            $lineY - 3
        );

        // Start tables below header
        $startY = $lineY + 8;
        $pdf->SetY($startY);

        // -----------------------
        // TABLE DIMENSIONS (CENTERED)
        // -----------------------
        $pageWidth = $pdf->getPageWidth();

        $col1 = 40;
        $col2 = 100;
        $col3 = 40;

        $tableWidth = $col1 + $col2 + $col3;
        $startX = ($pageWidth - $tableWidth) / 2;

        $rowHeight = 7;

        foreach ($data as $employee) {

            // =====================================================
            // EMPLOYEE ROW (FIRST ROW OF TABLE)
            // =====================================================
            $pdf->SetX($startX);
            $pdf->SetFillColor(239, 78, 69);
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('helvetica', 'B', 11);

            $pdf->Cell(
                $tableWidth,
                8,
                $employee['employeeName'] . ' (' . $employee['employeeCode'] . ')',
                1,
                1,
                'L',
                true
            );

            // =====================================================
            // COLUMN HEADERS
            // =====================================================
            $pdf->SetX($startX);
            $pdf->SetFillColor(240, 240, 240);
            $pdf->SetTextColor(0, 0, 0);
            $pdf->SetFont('helvetica', 'B', 10);

            $pdf->Cell($col1, $rowHeight, 'Code', 1, 0, 'C', true);
            $pdf->Cell($col2, $rowHeight, 'Description', 1, 0, 'C', true);
            $pdf->Cell($col3, $rowHeight, 'Total', 1, 1, 'C', true);

            // =====================================================
            // DETAIL ROWS
            // =====================================================
            $pdf->SetFont('helvetica', '', 10);

            foreach ($employee['items'] as $item) {

                $pdf->SetX($startX);

                $pdf->Cell(
                    $col1,
                    $rowHeight,
                    $item['code'],
                    1,
                    0,
                    'C'
                );

                $pdf->Cell(
                    $col2,
                    $rowHeight,
                    $item['description'],
                    1,
                    0,
                    'L'
                );

                $pdf->Cell(
                    $col3,
                    $rowHeight,
                    number_format($item['total'], 2),
                    1,
                    1,
                    'R'
                );
            }

            // Space between employee tables
            $pdf->Ln(5);
        }

        return ['ok' => true];
    }
    private function writeUI19PdfReport($pdf, $reportinfo)
    {

        // -------------------------------------------------
        // reusable functions
        // -------------------------------------------------
        function draw($pdf, $label, $labelX, $y, $lineStartX, $lineEndX, $labelWidth = 35)
        {
            $lineThickness = 0.3;
            // Label
            $pdf->SetXY($labelX, $y);
            $pdf->Cell($labelWidth, 5, $label, 0, 0, 'L');
            // Line
            $pdf->SetLineWidth($lineThickness);
            $pdf->Line($lineStartX, $y + 4.2, $lineEndX, $y + 4.2);
        }
        function drawField($pdf, $label, $value, $labelX, $y, $lineStartX, $lineEndX, $labelWidth = 35)
        {
            $lineThickness = 0.3;
            // Label
            $pdf->SetXY($labelX, $y);
            $pdf->SetFont('helvetica', '', 7);
            $pdf->Cell($labelWidth, 5, $label, 0, 0, 'L');
            // Line
            $pdf->SetLineWidth($lineThickness);
            $pdf->Line($lineStartX, $y + 4.2, $lineEndX, $y + 4.2);
            // Fill the field with value (above line)
            $fieldStartX = $lineStartX;
            $fieldWidth = $lineEndX - $lineStartX;
            $pdf->SetXY($fieldStartX + 1, $y + 0.5); // slight padding
            $pdf->Cell($fieldWidth - 2, 4, $value, 0, 0, 'L'); // 4 = height of value cell
        }

        // -------------------------------------------------
        // PDF PAGE SETTINGS
        // -------------------------------------------------

        $pdf->SetMargins(1, 1, 1, 1);
        $pdf->SetAutoPageBreak(false);
        $pdf->AddPage('L', 'A4');

        // -------------------------------------------------
        // HEADER AREA (OUTSIDE BORDER)
        // -------------------------------------------------

        $pdf->SetFont('helvetica', 'B', 18);
        // Left logo
        $pdf->Image($_SERVER['DOCUMENT_ROOT'] . 'lexpro_payroll/site/client/gfx/UIFL.jpg', 5, 2, 0, 10);
        // Right logo
        $pdf->Image($_SERVER['DOCUMENT_ROOT'] . 'lexpro_payroll/site/client/gfx/UIFlogo.jpg', 275, 2, 0, 10);
        // Main title (22px)
        $pdf->SetFont('helvetica', 'B', 22);
        $pdf->SetXY(0, 2);
        $pdf->Cell(297, 8, 'UI-19', 0, 1, 'C');

        // =====================================================
        // MAIN FORM BORDER
        // =====================================================

        $formTop = 13;
        $formHeight = 173;
        $pdf->Rect(5, $formTop, 287, $formHeight);

        // =====================================================
        // SUBTITLE (NOW INSIDE BORDER)
        // =====================================================

        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->SetXY(0, $formTop + 1);
        $pdf->Cell(297, 5, 'UNEMPLOYMENT INSURANCE ACT 63 OF 2001 as amended', 0, 1, 'C');

        // =====================================================
        // TOP RIGHT MONTH DECLARATION
        // =====================================================

        $pdf->SetFont('helvetica', 'B', 8);
        // Position
        $pdf->SetXY(135, $formTop + 6);
        // Force 2-line layout by widening cell
        $text = "Employers Declaration of Employees for the month\n" .
            "Information to be supplied in terms of Section 56(1&3) read with Regulation 13(1&2)";
        $pdf->MultiCell(115, 3.8, $text, 0, 'R', false);
        $pdf->Rect(250, $formTop + 7, 38, 6);

        // =====================================================
        // INSTRUCTION TEXT
        // =====================================================

        $pdf->SetFont('helvetica', '', 7);
        $pdf->SetXY(8, $formTop + 14);
        $text = "An employer must be the seventh day of each month inform the Commissioner with all the information during the previous month regarding the employer's contact details or employees’ remuneration details including new appointments and termination of service.The employer must forward this form to the Unemployment Insurance Fund at (012)337-1947/44 or 337-1580/81/82 or submit same at any branch of the UIF which is closest to the employer.The completed form can also be faxed to any of the following numbers: Pretoria (012) 309 5142/5286; Johannesburg (011) 497 3293; Durban (031) 366 2156; Polokwane (015)290 1670; Mmabatho (018) 384 2658; East London (043)701 3263; Bloemfontein (051)447 9353; Cape Town (021)441 8024; Witbank (013)656 0233; Port Elizabeth (041)506 5142; Germiston (011)873 2219; George (044)873 2568; Pietermaritzburg (033)394 5069 Or mail to: uif.declarations@labour.gov.za.";
        $pdf->MultiCell(279, 3.8, $text, 0, 'L');

        // =====================================================
        // SECTION 1 HEADER TEXT (no border)
        // =====================================================

        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->SetXY(8, $formTop + 26);
        $pdf->Cell(279, 6, '1. EMPLOYER DETAILS', 0, 1, 'L');

        // =====================================================
        // SECOND INNER BORDER (like main border)
        // everything below header must be inside this
        // =====================================================

        $innerTop = $formTop + 32;   // just below header text
        $innerHeight = 37;          // adjust as you build rest of form
        $pdf->Rect(8, $innerTop, 281, $innerHeight);

        // =====================================================
        // EMPLOYER DETAILS SECTION (inside second inner border)
        // =====================================================

        $pdf->SetFont('helvetica', '', 7);  // small font for form fields
        $startX = 10;             // left margin inside inner border
        $startY = $innerTop + 2;  // starting Y inside inner border
        $lineHeight = 6;          // height of each line

        // -------------------
        // 1.1 UIF Employer Reference No & Branch No
        // -------------------

        $pdf->SetXY($startX, $startY);
        $pdf->Cell(50, $lineHeight, '1.1 UIF Employer Reference No:', 0, 0, 'L');
        // Get the reference number and remove the slash
        $refNumber = str_replace('/', '', $reportinfo[0][28]); // e.g. '12345671'
        // Ensure we have exactly 8 digits
        $refNumber = str_pad($refNumber, 8, '0', STR_PAD_LEFT);
        // Split into 8 digits
        $digits = str_split($refNumber);
        // Draw 7 small boxes for UIF Number
        $boxX = $startX + 40;
        for ($i = 0; $i < 7; $i++) {
            $pdf->Rect($boxX + $i * 4.1, $startY + 1, 4, 4); // x, y, width, height
            $pdf->SetXY($boxX + $i * 4.1, $startY + 1);
            $pdf->Cell(4, 4, $digits[$i], 0, 0, 'C');
        }
        // Draw slash and Branch No boxes (4 boxes)
        $pdf->Text($boxX + 7 * 4 + 2, $startY + 2, '/');
        $branchX = $boxX + 7 * 4 + 6;
        for ($i = 0; $i < 1; $i++) {
            $pdf->Rect($branchX + $i * 4.1, $startY + 1, 4, 4);
            $pdf->SetXY($branchX, $startY + 1);
            $pdf->Cell(4, 4, $digits[7], 0, 0, 'C');
        }
        $pdf->SetXY($startX + 83, $startY);
        $pdf->Cell(50, $lineHeight, 'Branch No.', 0, 0, 'L');
        $boxX = $startX + 97;
        for ($i = 0; $i < 6; $i++) {
            $pdf->Rect($boxX + $i * 4.1, $startY + 1, 4, 4); // x, y, width, height
        }

        // -------------------
        // 1.2 PAYE Reference No (right side)
        // -------------------

        $payeRef = $reportinfo[0][12] ?? 'hell'; // PAYE number from array
        $pdf->SetXY(160, $startY);
        $pdf->Cell(50, $lineHeight, '1.2 PAYE Reference No (If registered with SARS):', 0, 0, 'L');
        $boxX = 218;
        for ($i = 0; $i < 10; $i++) {
            $pdf->Rect($boxX + $i * 4.1, $startY + 1, 4, 4);
            if (isset($payeRef[$i])) {
                $pdf->SetXY($boxX + $i * 4.1, $startY + 1);
                $pdf->Cell(4, 4, $payeRef[$i], 0, 0, 'C');
            }
        }

        // -------------------
        // 1.3 Trading Name & 1.4 Physical Address
        // -------------------

        $startY += $lineHeight + 1; // move to next line
        $tradingName = $reportinfo[0][13] ?? '';
        drawField($pdf, '1.3 Trading name of business:', $tradingName, $startX, $startY, $startX + 38, $startX + 130);
        $physicalAddress = trim(
            ($reportinfo[0][15] ?? '') . ' ' .
                ($reportinfo[0][16] ?? '') . ' ' .
                ($reportinfo[0][17] ?? '') . ', ' .
                ($reportinfo[0][18] ?? '') . ', ' .
                ($reportinfo[0][19] ?? '')
        );
        drawField($pdf, '1.4 Physical Address:', $physicalAddress, 160, $startY, $startX + 177, $startX + 270);

        // -------------------
        // 1.5 Address where employees listed & 1.6 Postal Address
        // -------------------

        $startY += $lineHeight + 1;
        $workAddress = trim(
            ($reportinfo[0][6] ?? '') . ' ' .
                ($reportinfo[0][7] ?? '') . ' ' .
                ($reportinfo[0][8] ?? '') . ', ' .
                ($reportinfo[0][9] ?? '') . ', ' .
                ($reportinfo[0][10] ?? '') . ', ' .
                ($reportinfo[0][11] ?? '')
        );
        drawField($pdf, '1.5 Address where employees listed in Item 2 work:', $workAddress, $startX, $startY, $startX + 60, $startX + 145, 60);
        $postalAddress = trim(
            ($reportinfo[0][20] ?? '') . ' ' .
                ($reportinfo[0][21] ?? '') . ' ' .
                ($reportinfo[0][22] ?? '') . ' ' .
                ($reportinfo[0][23] ?? '')
        );
        drawField($pdf, '1.6 Postal Address:', $postalAddress, 160, $startY, $startX + 177, $startX + 270);

        // -------------------
        // 1.8 Email address & 1.9 Fax No (left side under 1.5)
        // -------------------

        $startY += $lineHeight + 1;
        $email = $reportinfo[0][24] ?? '';
        $fax = $reportinfo[0][25] ?? '';
        drawField($pdf, '1.8 E-mail address:', $email, $startX, $startY, $startX + 25, $startX + 70, 35);
        drawField($pdf, '1.9 Fax No:', $fax, $startX + 75, $startY, $startX + 90, $startX + 130, 20);

        // -------------------
        // 1.7 Co. Reg. No (below 1.6)
        // -------------------

        $pdf->SetXY($startX + 150, $startY);
        $pdf->Cell(35, 5, '1.7 Co. Reg. No (CIPRO No):', 0, 0, 'L');
        $boxX = $startX + 185;
        for ($i = 0; $i < 13; $i++) {
            $pdf->Rect($boxX + $i * 4.1, $startY + 1, 4, 4);
        }
        // Insert registration number characters
        $regNumber = $reportinfo[0][26] ?? ''; // get registration number
        $regChars = str_split(substr($regNumber, 0, 13));   // max 13 chars
        for ($i = 0; $i < count($regChars); $i++) {
            $pdf->SetXY($boxX + $i * 4.1, $startY + 1);
            $pdf->Cell(4, 4, $regChars[$i], 0, 0, 'C');
        }

        // -------------------
        // 1.10 Phone No & 1.11 Authorised Person (below 1.7)
        // -------------------

        $startY += $lineHeight + 1;
        $phone = $reportinfo[0][27] ?? '';
        drawField($pdf, '1.10 Phone No:', $phone, 160, $startY, $startX + 170, $startX + 200, 20);
        drawField($pdf, '1.11 Authorised person**:', '', $startX + 210, $startY, $startX + 240, $startX + 270, 40);

        // -------------------
        // 2. EMPLOYEE DETAILS HEADING
        // -------------------

        $startY += $lineHeight + 2;  // leave some space after employer details border
        $pdf->SetFont('helvetica', 'B', 8);
        $pdf->SetXY($startX - 3, $startY);
        $pdf->Cell(279, 6, '2. EMPLOYEE DETAILS', 0, 1, 'L');

        // -------------------
        // EMPLOYEE DETAILS TABLE (5 rows)
        // -------------------

        $startY += $lineHeight;
        $pdf->SetFont('helvetica', '', 7);
        $tableX = $startX - 3;
        $tableY = $startY;
        $tableHeight = 5;
        $headerHeight = 17;
        $numRows = 5;

        // Column widths
        $colWidths = [
            25,  // A
            10,  // B
            60,  // C
            30,  // D
            20,  // E
            30,  // F
            30,  // G
            26,  // H
            26,  // I
            26   // J
        ];

        // Header text
        $headerText = [
            "A\nSurname",
            "B\nInitials",
            "C\nID Number\n(13 Digit bar-coded RSA ID No./Passport No)",
            "D*\nTotal (Gross) Remuneration paid to Employee Per Month",
            "E*\nTotal Hours Worked during Month",
            "F\nCommencement date of Employment",
            "G\nTermination Date",
            "H\nReason for Termination\n(Termination Codes at page Bottom)",
            "I\nIndicate whether contributor or non-contributor (YES OR NO)",
            "J***\nIf non-Contributor state reason\n(Codes at page bottom)"
        ];


        // -------------------
        // DRAW HEADER
        // -------------------
        $pdf->SetFillColor(230, 230, 230);
        $colX = $tableX;

        for ($i = 0; $i < count($colWidths); $i++) {

            // Main header box
            $pdf->Rect($colX, $tableY, $colWidths[$i], $headerHeight, 'DF');

            // Header text
            $pdf->SetXY($colX + 1, $tableY + 1);
            $pdf->MultiCell($colWidths[$i] - 2, 4, $headerText[$i], 0, 'C', false);

            // ---- MINI DATE HEADER CELLS FOR F AND G ----
            if ($i == 5 || $i == 6) {

                $miniLabels = ['D', 'D', 'M', 'M', 'Y', 'Y'];
                $miniWidth = $colWidths[$i] / 6;
                $miniHeight = 5;

                // position at bottom of header
                $miniY = $tableY + $headerHeight - $miniHeight;

                $pdf->SetFont('helvetica', 'B', 6);

                for ($m = 0; $m < 6; $m++) {

                    // mini cell box
                    $pdf->Rect(
                        $colX + ($m * $miniWidth),
                        $miniY,
                        $miniWidth,
                        $miniHeight
                    );

                    // label inside
                    $pdf->SetXY(
                        $colX + ($m * $miniWidth),
                        $miniY
                    );

                    $pdf->Cell(
                        $miniWidth,
                        $miniHeight,
                        $miniLabels[$m],
                        0,
                        0,
                        'C'
                    );
                }

                $pdf->SetFont('helvetica', '', 7);
            }

            $colX += $colWidths[$i];
        }


        // -------------------
        // DRAW BODY ROWS
        // -------------------
        $rowY = $tableY + $headerHeight;

        for ($r = 0; $r < $numRows; $r++) {

            // Column A
            $pdf->Rect($tableX, $rowY, $colWidths[0], $tableHeight);

            // Column B
            $pdf->Rect($tableX + $colWidths[0], $rowY, $colWidths[1], $tableHeight);

            // Column C (13 cells)
            $cellWidthC = $colWidths[2] / 13;
            $colCX = $tableX + $colWidths[0] + $colWidths[1];
            for ($i = 0; $i < 13; $i++) {
                $pdf->Rect($colCX + $i * $cellWidthC, $rowY, $cellWidthC, $tableHeight);
            }

            // Column D
            $colDX = $colCX + $colWidths[2];
            $pdf->Rect($colDX, $rowY, $colWidths[3], $tableHeight);

            // Column E
            $colEX = $colDX + $colWidths[3];
            $pdf->Rect($colEX, $rowY, $colWidths[4], $tableHeight);

            // Column F (6 cells)
            $cellWidthF = $colWidths[5] / 6;
            $colFX = $colEX + $colWidths[4];
            for ($i = 0; $i < 6; $i++) {
                $pdf->Rect($colFX + $i * $cellWidthF, $rowY, $cellWidthF, $tableHeight);
            }

            // Column G (6 cells)
            $colGX = $colFX + $colWidths[5];
            $cellWidthG = $colWidths[6] / 6;
            for ($i = 0; $i < 6; $i++) {
                $pdf->Rect($colGX + $i * $cellWidthG, $rowY, $cellWidthG, $tableHeight);
            }

            // Column H
            $colHX = $colGX + $colWidths[6];
            $pdf->Rect($colHX, $rowY, $colWidths[7], $tableHeight);

            // Column I
            $colIX = $colHX + $colWidths[7];
            $pdf->Rect($colIX, $rowY, $colWidths[8], $tableHeight);

            // Column J
            $colJX = $colIX + $colWidths[8];
            $pdf->Rect($colJX, $rowY, $colWidths[9], $tableHeight);

            // -------------------
            // INSERT EMPLOYEE DATA (if available)
            // -------------------
            if (isset($reportinfo[$r])) {
                $employee = $reportinfo[$r];

                // Column A - Surname (Lastname)
                $pdf->SetXY($tableX + 1, $rowY + 1);
                $pdf->Cell($colWidths[0] - 2, $tableHeight - 2, $employee[1], 0, 0, 'L');

                // Column B - Initials
                $pdf->SetXY($tableX + $colWidths[0] + 1, $rowY + 1);
                $pdf->Cell($colWidths[1] - 2, $tableHeight - 2, $employee[0], 0, 0, 'C');

                // Column C - ID Number (13 cells)
                $idChars = str_split($employee[2]); // split ID number into 13 digits
                for ($i = 0; $i < 13; $i++) {
                    if (isset($idChars[$i])) {
                        $pdf->SetXY($colCX + $i * $cellWidthC, $rowY + 1);
                        $pdf->Cell($cellWidthC, $tableHeight - 2, $idChars[$i], 0, 0, 'C');
                    }
                }
                // -------------------
                // Column D - Total Gross Remuneration
                // -------------------

                // Sum last 5 income values (Basic Salary, Bonus, Overtime, Commission, Allowance)
                $totalIncome = floatval($employee[29])
                    + floatval($employee[30])
                    + floatval($employee[31])
                    + floatval($employee[32])
                    + floatval($employee[33]);

                $totalIncome = number_format($totalIncome, 2, '.', '');

                // Insert sum into Column D
                $pdf->SetXY($colDX + 1, $rowY + 1);
                $pdf->Cell($colWidths[3] - 2, $tableHeight - 2, $totalIncome, 0, 0, 'C');

                // -------------------
                // Column E - Total Hours Worked
                // -------------------
                $startDateObj = DateTime::createFromFormat('Y-m-d', $employee[3]);
                $endDateObj   = DateTime::createFromFormat('Y-m-d', $employee[4]);

                // Check if dates are valid
                if ($startDateObj && $endDateObj) {
                    // Calculate working days (Mon-Fri)
                    $period = new DatePeriod(
                        $startDateObj,
                        new DateInterval('P1D'),
                        $endDateObj->modify('+1 day') // include end date
                    );

                    $workingDays = 0;
                    foreach ($period as $day) {
                        $weekday = $day->format('N'); // 1 = Mon, 7 = Sun
                        if ($weekday <= 5) $workingDays++;
                    }

                    $hoursWorked = $workingDays * 8;

                    // Column E - Hours Worked
                    $pdf->SetXY($colEX + 1, $rowY + 1);
                    $pdf->Cell($colWidths[4] - 2, $tableHeight - 2, $hoursWorked, 0, 0, 'C');


                    // Column F - Start Date (DDMMYY)
                    $startDigits = $startDateObj->format('dmy'); // 6 digits
                    for ($i = 0; $i < 6; $i++) {
                        $pdf->SetXY($colFX + $i * $cellWidthF, $rowY + 1);
                        $pdf->Cell($cellWidthF, $tableHeight - 2, $startDigits[$i], 0, 0, 'C');
                    }

                    // Column G - End Date (DDMMYY)
                    $endDigits = $endDateObj->format('dmy'); // 6 digits
                    for ($i = 0; $i < 6; $i++) {
                        $pdf->SetXY($colGX + $i * $cellWidthG, $rowY + 1);
                        $pdf->Cell($cellWidthG, $tableHeight - 2, $endDigits[$i], 0, 0, 'C');
                    }
                } else {
                    // Fallback if date is invalid
                    $pdf->SetXY($colEX + 1, $rowY + 1);
                    $pdf->Cell($colWidths[4] - 2, $tableHeight - 2, '-', 0, 0, 'C');

                    for ($i = 0; $i < 6; $i++) {
                        $pdf->SetXY($colFX + $i * $cellWidthF, $rowY + 1);
                        $pdf->Cell($cellWidthF, $tableHeight - 2, '-', 0, 0, 'C');
                        $pdf->SetXY($colGX + $i * $cellWidthG, $rowY + 1);
                        $pdf->Cell($cellWidthG, $tableHeight - 2, '-', 0, 0, 'C');
                    }
                }

                // -------------------
                // Column H - Dismissal Code Mapping
                // -------------------
                $dismissalReasons = [
                    'ABSC' => 13,
                    'BUCL' => 14,
                    'CODI' => 7,
                    'DECE' => 2,
                    'DISM' => 4,
                    'EMIN' => 8,
                    'ENCO' => 5,
                    'ILLN' => 10,
                    'RESI' => 6,
                    'RETR' => 11,
                    'TRAN' => 12,
                    'MATE' => 9,
                    'RETI' => 3,
                    'DOME' => 15,
                    'VOLU' => 16,
                    'REDU' => 17,
                    'COMM' => 18,
                    'PARE' => 19
                ];

                $code = strtoupper(trim($employee[5] ?? ''));
                $valueH = isset($dismissalReasons[$code]) ? $dismissalReasons[$code] : '-';

                // Insert value centered in Column H
                $pdf->SetXY($colHX + 1, $rowY + 1);
                $pdf->Cell($colWidths[7] - 2, $tableHeight - 2, $valueH, 0, 0, 'C');

                // -------------------
                // Column I - Contributor (YES / NO)
                // -------------------
                // $UIFcon = (floatval($employee[34] ?? 0) > 0) ? 'YES' : 'NO';
                if ($employee[34] === 1) {
                    $UIFcon = 'Yes';
                } else {
                    $UIFcon = 'No';
                }

                $pdf->SetXY($colIX + 1, $rowY + 1);
                $pdf->Cell($colWidths[8] - 2, $tableHeight - 2, $UIFcon, 0, 0, 'C');
            }

            // next row
            $rowY += $tableHeight;
        }

        //----------------------------
        // SIGN OF SECTION
        //---------------------------

        $startY = $rowY + 2; // spacing below table
        $pdf->SetFont('helvetica', '', 8);
        draw($pdf, 'I,', $startX - 3, $startY, $startX + 2, $startX + 30, 10);
        draw($pdf, '(Name of employer), ID No.', $startX + 30, $startY, $startX + 66, $startX + 90, 40);
        $pdf->SetXY($startX + 90, $startY);
        $pdf->Cell(35, 5, ', declare that the above information is true and correct. I understand that it is an offence to make a false statement.', 0, 0, 'L');
        $startY += 5;
        draw($pdf, "EMPLOYER’S SIGNATURE:", $startX - 3, $startY, $startX + 35, $startX + 70, 38);
        draw($pdf, ' DATE:', $startX + 90, $startY, $startX + 102, $startX + 140, 15);

        // =====================================================
        // TWO TABLES UNDER SIGNATURE SECTION
        // =====================================================

        // spacing below signature area
        $startY += 6;

        // common settings
        $pdf->SetFont('helvetica', '', 7);
        $tableHeight = 5;      // row height for both tables
        $headerHeight = 5;
        $padding = 1;           // small padding inside cells

        // -----------------------------------------------------
        // TABLE 1 (LEFT SIDE)
        // 1 column | 1 header | 1 body row
        // -----------------------------------------------------
        $table1X = $startX - 3;   // align with page content left
        $table1Y = $startY;
        $table1Width = 188;

        // Header
        $pdf->SetFont('helvetica', 'B', 7);
        $pdf->Rect($table1X, $table1Y, $table1Width, $headerHeight);
        $pdf->SetXY($table1X, $table1Y);
        $pdf->Cell($table1Width, $headerHeight, 'DESCRIPTION', 0, 0, 'L');

        // Body row content
        $pdf->SetFont('helvetica', '', 7);
        $table1BodyY = $table1Y + $headerHeight;

        // Determine height to fit all lines
        $table1BodyHeight = $tableHeight * 7; // 7 lines approx

        $pdf->Rect($table1X, $table1BodyY, $table1Width, $table1BodyHeight);

        // Text content (line breaks for readability)
        $table1Text = "** : If the employer is not a resident in the RSA, or is a body corporate not registered in the RSA, an authorised person must carry out the duties of the employer in terms of this Act.\n" .
            "D* : Remuneration means actual basic salary plus payment in kind (Declare actual gross salary).\n" .
            "If paid weekly, convert wages to monthly salary (weekly wages × 52 ÷ 12).\n" .
            "E* : Total hours worked, i.e. actual hours worked during the month.\n" .
            "Employers may also submit these details electronically from payrolls or on the UIF's website at www.labour.org.za.\n" .
            "(I) : Only applicable for commercial employers, Domestic employers – provide surname and initials.\n" .
            "Constructive dismissal can only be determined by the CCMA, Bargaining Council or Labour Court.";

        // Print text inside the body row
        $pdf->SetXY($table1X + $padding, $table1BodyY + $padding);
        $pdf->MultiCell(
            $table1Width - 2 * $padding, // width
            4,                           // line height
            $table1Text,
            0,
            'L',
            false
        );

        // -----------------------------------------------------
        // TABLE 2 (RIGHT SIDE, FIXED COLUMN 1 CENTERING)
        // 2 columns | 1 header | 9 body rows
        // -----------------------------------------------------
        $table2X = $table1X + $table1Width + 5; // space between tables
        $table2Y = $startY;
        $table2Width = 90;

        // column widths (2 columns)
        $col1 = 10;           // CODE column
        $col2 = $table2Width - $col1;  // REASON column
        $tableHeight = 4;      // row height
        $headerHeight = 4;
        $paddingCol2 = 1;      // padding for column 2 text

        // Header row
        $pdf->SetFont('helvetica', 'B', 6);
        $pdf->Rect($table2X, $table2Y, $col1, $headerHeight);
        $pdf->Rect($table2X + $col1, $table2Y, $col2, $headerHeight);

        $pdf->SetXY($table2X, $table2Y);
        $pdf->Cell($col1, $headerHeight, 'CODE', 0, 0, 'C');

        $pdf->SetXY($table2X + $col1, $table2Y);
        $pdf->Cell($col2, $headerHeight, 'REASONS FOR NON-CONTRIBUTION', 0, 0, 'L');

        // Body rows content
        $bodyRows = [
            ['1', 'Temporary employees (less than 24 hours per month)'],
            ['2', 'Learners in terms of the Skills Development Act'],
            ['3', 'Employees in the National and Provincial spheres of Government'],
            ['4', 'Employees who are repatriated at the end of their contract of service'],
            ['5', 'Employees who earn commission only'],
            ['6', 'No income paid for the payroll period'],
            ['7', 'Employees in receipt of an Old Age Pension from the state'],
            ['8', 'Employees who receive a pension payment from Employer'],
            ['9', 'Above the ceiling']
        ];

        $pdf->SetFont('helvetica', '', 7);
        $rowY = $table2Y + $headerHeight;

        foreach ($bodyRows as $row) {
            // Draw cells
            $pdf->Rect($table2X, $rowY, $col1, $tableHeight);
            $pdf->Rect($table2X + $col1, $rowY, $col2, $tableHeight);

            // ---------------------------
            // Column 1: center vertically and horizontally inside its own cell
            // ---------------------------
            $fontHeight = 2.5; // approximate height for 6pt font
            $centerY = $rowY + ($tableHeight / 2) - ($fontHeight / 2);
            $pdf->SetXY($table2X, $centerY);
            $pdf->Cell($col1, $fontHeight, $row[0], 0, 0, 'C');

            // ---------------------------
            // Column 2: left-aligned with padding
            // ---------------------------
            $pdf->SetXY($table2X + $col1 + $paddingCol2, $rowY + $paddingCol2);
            $pdf->MultiCell($col2 - 2 * $paddingCol2, $tableHeight, $row[1], 0, 'L', false);

            $rowY += $tableHeight;
        }

        // =====================================================
        // TABLE BELOW MAIN BORDER
        // 1 header row (single column)
        // 1 body row (9 columns)
        // =====================================================

        // Position below main border
        $tableX = 4;
        $tableY = $formTop + $formHeight + 2; // spacing below border
        $tableWidth = 290;

        $headerHeight = 5;
        $rowHeight = 12;

        // ---------------------
        // HEADER ROW (1 column)
        // ---------------------
        $pdf->SetFont('helvetica', 'B', 7);

        // full width header cell
        $pdf->Rect($tableX, $tableY, $tableWidth, $headerHeight);
        $pdf->SetXY($tableX, $tableY);
        $pdf->Cell($tableWidth, $headerHeight, 'TERMINATION CODE\'S', 0, 0, 'L');

        // ---------------------
        // BODY ROW (9 columns)
        // ---------------------
        $pdf->SetFont('helvetica', '', 7);

        $bodyY = $tableY + $headerHeight;

        // column sizing
        $col1Width = 20;   // column 1 smaller
        $col2Width = 20;   // column 2 smaller
        $remainingWidth = $tableWidth - ($col1Width + $col2Width);
        $otherColWidth = $remainingWidth / 7;

        // content
        $terminationData = [
            "2 Deceased\n3 Retired",
            "4 Dismissed\n5 Contract expired",
            "6 Resigned\n7 Constructive dismissal**",
            "8 Insolvency / Liquidation\n9 Maternity / Adoption",
            "10 Illness / Medical boarded\n11 Retrenched / Staff reduction",
            "12 Transfer to another Branch\n13 Absconded",
            "14 Business closed\n15 Death of Domestic Employer",
            "16 Voluntary severance package\n17 Reduced Work Time",
            "18 Commissioning Parental\n19 Parental Leave"
        ];

        $currentX = $tableX;

        for ($i = 0; $i < 9; $i++) {

            if ($i == 0) {
                $colWidth = $col1Width;
            } elseif ($i == 1) {
                $colWidth = $col2Width;
            } else {
                $colWidth = $otherColWidth;
            }

            // draw cell
            $pdf->Rect($currentX, $bodyY, $colWidth, $rowHeight);

            // text
            $pdf->SetXY($currentX + 1, $bodyY + 2);
            $pdf->MultiCell(
                $colWidth - 2,
                4,
                $terminationData[$i],
                0,
                'L',
                false
            );

            $currentX += $colWidth;
        }

        return ['ok' => true];
    }


    function runUI19Details($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        $mode = $data['mode'] ?? 'view';
        // Set default parameter values
        $defaults = [
            'searchString' => '',
            'limit' => null,
            'offset' => null,
            'employeeId' => '',
        ];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Optional parameters
            'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
            'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
            'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
            'employee' => ['type' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]],
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Get the data for the specified report
        $reportData = \ReportUtil\getUI19PdfDetailsData($data, $user, $db);
        if ($reportData['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $reportData['error']]));
            return false;
        }

        // Create employees array
        $reportinfo = [];
        foreach ($reportData['employees'] as $employee) {

            $reportinfo[] = [
                $employee['initials'],  //index  0           
                $employee['lastName'],   //index 1              
                $employee['idNumber'], //index   2
                $employee['startDate'], //index  3 
                $employee['endDate'], //index 4  
                $employee['disCode'], //index  5
                $employee['workUnit'], //index 6 
                $employee['workComplex'], //index  7 
                $employee['workStreet'], //index  8
                $employee['workSuburb'], //index  9 
                $employee['workCity'], //index   10
                $employee['workPostalCode'], //index   11
                // Company info (added)
                $employee['payeRefNumber'], //index  12
                $employee['companyName'], //index   13
                $employee['physicalUnit'], //index   14
                $employee['physicalComplex'], //index  15
                $employee['physicalStreet'], //index 16
                $employee['physicalSuburb'], //index   17
                $employee['physicalCity'], //index   18
                $employee['physicalPostalCode'], //index  19
                $employee['postalLine1'], //index   20
                $employee['postalLine2'], //index   21
                $employee['postalLine3'], //index   22
                $employee['postalCode'], //index   23
                $employee['companyEmail'], //index   24
                $employee['companyFax'], //index   25
                $employee['registrationNumber'], //index   26
                $employee['companyTel'], //index   27
                $employee['Refnumber'], //index   28
                // Payrun income values (added individually)
                $employee['Salary'] ?? '0.00', //index   29
                $employee['Commission']        ?? '0.00', //index   30
                $employee['Daily Wage']     ?? '0.00', //index   31
                $employee['Hourly Wage']   ?? '0.00', //index   32
                $employee['Overtime']    ?? '0.00', //index   33
                $employee['Employee UIF Contribution'],
            ];
        }

        // Create the PDF document
        $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
        $pdfPageFormat = 'A4';
        $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);

        // Write the PDF report data
        $result = $this->writeUI19PdfReport($pdf, $reportinfo);
        if ($result['ok'] !== true) {
            echo (json_encode(['ok' => false, 'error' => $result['error']]));
            return false;
        }

        // Create the file name for the report
        $fileName = strtolower(preg_replace('/[^A-Za-z0-9]/', '_', $user['companyAlias'])) . '_employee_details_' . date('Ymd') . '.pdf';

        if ($mode === 'download') {
            $pdf->Output($fileName, 'D'); // download
            return true;
        } else if ($mode === 'view') {
            $pdf->Output($fileName, 'I'); // browser
            return true;
        } else if ($mode === 'emailTo') {

            $emailAddress = $data['emailAddress'];
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);

            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir;


            if (!is_dir($destDir)) {
                mkdir($destDir, 0777, true);
            }

            System::useModule('phpmailer');
            // Create a random filename for the irp5
            $filename = $destDir . '/' . $fileName;

            //Close and output PDF document
            $pdf->Output($filename, 'F');

            // Send the email
            $mail = new PHPMailer\PHPMailer\PHPMailer();

            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->CharSet = 'UTF-8';

            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            //$mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Lexpro Payroll');
            // $empName = $reportinfo[0][0] . $reportinfo[0][1];
            $empName = trim($reportinfo[0][0] . ' ' . $reportinfo[0][1]);
            $mail->addAddress($emailAddress, $empName);

            // Add the tax certificate as an attachment
            $mail->addAttachment($filename, 'UI19_Employee:' . strtolower($empName) . '.pdf');

            // Set the email text
            $htmlBody =
                'Dear ' . $empName . ',<br><br>' .
                'Please find the attached the UI19 document. <br><br>' .
                'If you have any queries, please don\'t hesitate to contact us.<br><br>' .
                'Regards,<br><br>' .
                'HR Department,<br><br>' .
                $reportinfo[0][13];

            $plainTexBody =
                "Dear " . $empName . ",\r\n\r\n" .
                "Please find the attached the UI19 document.\r\n\r\n" .
                "If you have any queries, please don\'t hesitate to contact us.\r\n\r\n" .
                "Regards,\r\n\r\n" .
                "HR Department,\r\n\r\n" .
                $reportinfo[0][13];

            // Set the email content
            $mail->isHTML(true);    // Set email format to HTML
            $mail->Subject = 'UI19 document for ' . $empName;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $plainTexBody;

            // Send the email
            //$mail->send();
            if (!$mail->send()) {
                echo json_encode(['ok' => false, 'error' => $mail->ErrorInfo]);
                return false;
            }

            // Delete the PDF
            @unlink($filename);

            // Delete the temp folder
            @rmdir($destDir);

            echo (json_encode(['ok' => true]));
            return true;
        }
    }

    //Write XLSX/CSV reports
    private function writeCompanyLeaveSummaryReport($reportData, $reportName)
    {
        //set format
        $formatType = 'xls';

        if (isset($reportData['format']) && $reportData['format'] !== '') {
            if (in_array($reportData['format'], array('xls', 'csv', 'xlsx'))) {
                $formatType = trim($reportData['format']);
            }
            if ($formatType == 'xlsx' || $formatType == 'xls') {
                $formatType = 'xlsx';
            }
        }

        // Create the file name for the report
        $fileName = $reportName . '_' . date('Ymd') . '.' . $formatType;

        //Create writer
        $writer = null;
        if ($formatType == 'xlsx') {
            $writer = WriterEntityFactory::createXLSXWriter();
        } else {
            $writer = WriterEntityFactory::createCSVWriter();
        }
        $writer->openToBrowser($fileName);

        // Decide how leave items should be separated inside calendar cells (newLine in Excel and | in CSV)
        $lineSeparator = "\n";

        if ($formatType === 'csv') {
            $lineSeparator = ' | ';
        }

        //Report title
        $writer->addRow(WriterEntityFactory::createRowFromArray(array(
            $reportName
        ), null));

        $writer->addRow(WriterEntityFactory::createRowFromArray(array(
            'Generated Date:',
            date('Y-m-d')
        ), null));

        // Optional filter display
        if (isset($reportData['startDate']) || isset($reportData['endDate'])) {
            $writer->addRow(WriterEntityFactory::createRowFromArray(array(
                'Date Range:',
                ($reportData['startDate'] ?? '') . ' to ' . ($reportData['endDate'] ?? '')
            ), null));
        }

        if (isset($reportData['leaveTypeName']) && $reportData['leaveTypeName'] !== '') {
            $writer->addRow(WriterEntityFactory::createRowFromArray(array(
                'Leave Type:',
                $reportData['leaveTypeName']
            ), null));
        }

        // Blank row
        $writer->addRow(WriterEntityFactory::createRowFromArray(array(''), null));

        // -----------------------------
        // CALENDAR EXPORT
        // -----------------------------

        $monthNames = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December'
        ];

        $weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        if (
            isset($reportData['leaveCalendarItems']) &&
            is_array($reportData['leaveCalendarItems']) &&
            count($reportData['leaveCalendarItems']) > 0
        ) {
            $startDate = new DateTime($reportData['startDate']);
            $endDate = new DateTime($reportData['endDate']);

            $currentMonth = new DateTime($startDate->format('Y-m-01'));
            $lastMonth = new DateTime($endDate->format('Y-m-01'));

            while ($currentMonth <= $lastMonth) {
                $displayYear = (int)$currentMonth->format('Y');
                $displayMonth = (int)$currentMonth->format('m');

                // Month heading
                $writer->addRow(WriterEntityFactory::createRowFromArray(array(
                    $monthNames[$displayMonth] . ' ' . $displayYear,
                    '',
                    '',
                    '',
                    '',
                    '',
                    ''
                ), null));

                // Weekday headings
                $writer->addRow(WriterEntityFactory::createRowFromArray($weekDays, null));

                // Month calendar rows
                $calendarRows = $this->buildCompanyLeaveCalendarMonthRows(
                    $reportData,
                    $displayYear,
                    $displayMonth,
                    $lineSeparator
                );

                foreach ($calendarRows as $calendarRow) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($calendarRow, null));
                }

                // Blank row between months
                $writer->addRow(WriterEntityFactory::createRowFromArray(array('', '', '', '', '', '', ''), null));

                $currentMonth->modify('+1 month');
            }
        } else {
            $writer->addRow(WriterEntityFactory::createRowFromArray(array(
                'No leave records found for the selected filters.'
            ), null));
        }

        return $writer;
    }
    //Helper XLSX/CSV reports
    private function buildCompanyLeaveCalendarCellText($dayNumber, $leaveItems, $lineSeparator)
    {
        $cellLines = [];

        // First line is for displaying the day number
        $cellLines[] = $dayNumber;

        foreach ($leaveItems as $leaveItem) {
            $durationText = $this->getLeaveDurationText($leaveItem);
            $leaveText = '';

            if (!isset($leaveItem['employeeName']) || $leaveItem['employeeName'] === '') {
                $leaveText = $leaveItem['leaveTypeName'] ?? '';
            } else if (!isset($leaveItem['leaveTypeName']) || $leaveItem['leaveTypeName'] === '') {
                $leaveText = $leaveItem['employeeName'];
            } else {
                $leaveText = $leaveItem['employeeName'] . ' - ' . $leaveItem['leaveTypeName'];
            }

            if ($durationText !== '') {
                $leaveText .= ' (' . $durationText . ')';
            }

            if ($leaveText !== '') {
                $cellLines[] = $leaveText;
            }
        }

        return implode($lineSeparator, $cellLines);
        //return implode("\n", $cellLines);
    }

    //Helper XLSX/CSV reports
    private function buildCompanyLeaveCalendarMonthRows($reportData, $displayYear, $displayMonth, $lineSeparator)
    {
        $calendarRows = [];

        $groupedLeaveItems = [];

        if (isset($reportData['leaveCalendarItems']) && is_array($reportData['leaveCalendarItems'])) {
            $groupedLeaveItems = $this->groupCompanyLeaveItemsByDate($reportData['leaveCalendarItems']);
        }

        // Prepare dates for the calendar grid
        $firstDayOfMonth = new DateTime($displayYear . '-' . str_pad($displayMonth, 2, '0', STR_PAD_LEFT) . '-01');
        $lastDayOfMonth = clone $firstDayOfMonth;
        $lastDayOfMonth->modify('last day of this month');

        $firstWeekday = (int)$firstDayOfMonth->format('w'); // 0 = Sunday
        $totalDaysInMonth = (int)$lastDayOfMonth->format('j');

        $currentDayNumber = 1;

        for ($week = 0; $week < 6; $week++) {
            $row = array('', '', '', '', '', '', '');

            for ($dayOfWeek = 0; $dayOfWeek < 7; $dayOfWeek++) {
                $isBeforeFirstDay = ($week === 0 && $dayOfWeek < $firstWeekday);
                $isAfterLastDay = ($currentDayNumber > $totalDaysInMonth);

                if (!$isBeforeFirstDay && !$isAfterLastDay) {
                    $currentDateString = $displayYear
                        . '-'
                        . str_pad($displayMonth, 2, '0', STR_PAD_LEFT)
                        . '-'
                        . str_pad($currentDayNumber, 2, '0', STR_PAD_LEFT);

                    $leaveItemsForDate = [];

                    if (isset($groupedLeaveItems[$currentDateString])) {
                        $leaveItemsForDate = $groupedLeaveItems[$currentDateString];
                    }

                    $row[$dayOfWeek] = $this->buildCompanyLeaveCalendarCellText(
                        $currentDayNumber,
                        $leaveItemsForDate,
                        $lineSeparator
                    );

                    $currentDayNumber++;
                }
            }

            // Only add the row if it contains something
            if (implode('', $row) !== '') {
                $calendarRows[] = $row;
            }
        }

        return $calendarRows;
    }

    //Function for writing the Company Leave Summary PDF report (spacing, colours, heading, basic layout)
    private function writeCompanyLeaveSummaryPdfReport($pdf, $reportData, $reportName)
    {
        // -------------------------------------------------
        // PDF PAGE SETTINGS & MetaData
        // -------------------------------------------------

        $pdf->SetMargins(1, 1, 1, 1);
        $pdf->SetAutoPageBreak(false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        $pdf->SetCreator(PDF_CREATOR);
       $pdf->SetAuthor('Payaccsys Payroll');
        $pdf->SetTitle('Payaccsys Payroll - ' . $reportName);
        $pdf->SetSubject('');
        $pdf->SetKeywords('');

        // -----------------------------
        // LOOP THROUGH MONTHS IN DATE RANGE
        // -----------------------------

        $calendarStartDate = new DateTime($reportData['startDate']);
        $calendarEndDate = new DateTime($reportData['endDate']);

        // Start at the first day of the start month
        $currentMonth = new DateTime($calendarStartDate->format('Y-m-01'));

        // End at the first day of the end month
        $lastMonth = new DateTime($calendarEndDate->format('Y-m-01'));

        while ($currentMonth <= $lastMonth) {
            $pdf->AddPage('L', 'A4');

            $displayYear = (int)$currentMonth->format('Y');
            $displayMonth = (int)$currentMonth->format('m');


            $result = $this->writeCompanyLeaveSummaryCalendarMonthPdf(
                $pdf,
                $reportData,
                $reportName,
                $displayYear,
                $displayMonth
            );

            if ($result['ok'] !== true) {
                return $result;
            }

            if (
                isset($result['datesWithHiddenItems']) &&
                is_array($result['datesWithHiddenItems']) &&
                count($result['datesWithHiddenItems']) > 0
            ) {
                $this->writeCompanyLeaveSummaryPdfDetailPage(
                    $pdf,
                    $result['datesWithHiddenItems'],
                    $reportName,
                    $displayYear,
                    $displayMonth
                );
            }

            $currentMonth->modify('+1 month');
        }

        return ['ok' => true];
    }

    //Helper PDF report
    private function writeCompanyLeaveSummaryCalendarMonthPdf($pdf, $reportData, $reportName, $displayYear, $displayMonth)
    {
        $pageWidth = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        // -----------------------------
        // REPORT COLOURS
        // -----------------------------

        $darkHeaderColor = [48, 49, 60];       // Front-end dark heading colour: #30313C
        $coralRedColor = [239, 78, 69];           // Payaccsys Coral Red
        $borderColor = [180, 180, 180];        // Grey borders
        $blackBorderColor = [0, 0, 0];
        $lightGreyColor = [245, 245, 245];
        $whiteColor = [255, 255, 255];
        $textColor = [16, 16, 16];
        $mutedTextColor = [110, 110, 110];

        // -----------------------------
        // LOGO and PAGE TITLE
        // -----------------------------

        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';

        $logoWidth = 30;
        $logoX = $pageWidth - $logoWidth - 15;
        $logoY = 8;

        $pdf->Image($imageDir, $logoX, $logoY, $logoWidth);

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY(15, 5.5);
        $pdf->Cell(200, 10, $reportName, 0, 0, 'L');

        $pdf->Line(15, 15, $pageWidth - 15, 15);

        // -----------------------------
        // REPORT FILTER DETAILS
        // -----------------------------

        $pdf->SetFont('helvetica', '', 9);

        $pdf->SetXY(15, 18);
        $pdf->Cell(0, 6, 'Leave Type: ' . $reportData['leaveTypeName'], 0, 1, 'L');

        $pdf->SetXY(15, 24);
        $pdf->Cell(0, 6, 'Date Range: ' . $reportData['startDate'] . ' to ' . $reportData['endDate'], 0, 1, 'L');


        // -----------------------------
        // CALENDAR GRID PLACEHOLDERS
        // -----------------------------

        $monthNames = [
            1 => 'January',
            2 => 'February',
            3 => 'March',
            4 => 'April',
            5 => 'May',
            6 => 'June',
            7 => 'July',
            8 => 'August',
            9 => 'September',
            10 => 'October',
            11 => 'November',
            12 => 'December'
        ];

        $monthName = $monthNames[$displayMonth];

        // Calendar dimensions
        $calendarX = 15;
        $calendarY = 35;
        $calendarWidth = $pageWidth - 30;

        $monthHeadingHeight = 8;
        $weekdayHeadingHeight = 7;
        $dayCellHeight = 22;

        $dayCellWidth = $calendarWidth / 7;

        // TCPDF border style array
        $cellBorderStyle = [
            'T' => ['width' => 0.2, 'color' => $borderColor],
            'R' => ['width' => 0.2, 'color' => $borderColor],
            'B' => ['width' => 0.2, 'color' => $borderColor],
            'L' => ['width' => 0.2, 'color' => $borderColor]
        ];

        $weekdayHeadingBorderStyle = [
            'T' => ['width' => 0.2, 'color' => $blackBorderColor],
            'R' => ['width' => 0.2, 'color' => $blackBorderColor],
            'B' => ['width' => 0.2, 'color' => $blackBorderColor],
            'L' => ['width' => 0.2, 'color' => $blackBorderColor]
        ];

        // Month heading
        $pdf->SetFillColor($darkHeaderColor[0], $darkHeaderColor[1], $darkHeaderColor[2]);
        $pdf->SetTextColor($whiteColor[0], $whiteColor[1], $whiteColor[2]);
        $pdf->SetFont('helvetica', 'B', 11);

        $pdf->Rect($calendarX, $calendarY, $calendarWidth, $monthHeadingHeight, 'DF');
        $pdf->SetXY($calendarX, $calendarY + 1);
        $pdf->Cell($calendarWidth, 6, $monthName . ' ' . $displayYear, 0, 0, 'C');

        $calendarY += $monthHeadingHeight;


        // Weekday headings
        $weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        $pdf->SetFillColor($coralRedColor[0], $coralRedColor[1], $coralRedColor[2]);
        $pdf->SetTextColor($whiteColor[0], $whiteColor[1], $whiteColor[2]);
        $pdf->SetFont('helvetica', 'B', 8);

        for ($i = 0; $i < 7; $i++) {
            $x = $calendarX + ($i * $dayCellWidth);

            $pdf->Rect($x, $calendarY, $dayCellWidth, $weekdayHeadingHeight, 'DF', $weekdayHeadingBorderStyle);
            $pdf->SetXY($x, $calendarY + 1);
            $pdf->Cell($dayCellWidth, 5, $weekDays[$i], 0, 0, 'C');
        }

        $weekdayBottomY = $calendarY + $weekdayHeadingHeight;
        $calendarY += $weekdayHeadingHeight;

        // Prepare dates for the calendar grid
        $firstDayOfMonth = new DateTime($displayYear . '-' . str_pad($displayMonth, 2, '0', STR_PAD_LEFT) . '-01');
        $lastDayOfMonth = clone $firstDayOfMonth;
        $lastDayOfMonth->modify('last day of this month');

        $firstWeekday = (int)$firstDayOfMonth->format('w'); // 0 = Sunday
        $totalDaysInMonth = (int)$lastDayOfMonth->format('j');

        $currentDayNumber = 1;
        $datesWithHiddenItems = [];
        $groupedLeaveItems = [];

        if (isset($reportData['leaveCalendarItems']) && is_array($reportData['leaveCalendarItems'])) {
            $groupedLeaveItems = $this->groupCompanyLeaveItemsByDate($reportData['leaveCalendarItems']);
        }

        // Day cells
        $pdf->SetFont('helvetica', '', 8);
        $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);

        for ($week = 0; $week < 6; $week++) {
            for ($dayOfWeek = 0; $dayOfWeek < 7; $dayOfWeek++) {
                $x = $calendarX + ($dayOfWeek * $dayCellWidth);
                $y = $calendarY + ($week * $dayCellHeight);

                // Draw the cell background
                $pdf->SetFillColor($whiteColor[0], $whiteColor[1], $whiteColor[2]);

                // Light grey for weekend cells
                if ($dayOfWeek === 0 || $dayOfWeek === 6) {
                    $pdf->SetFillColor($lightGreyColor[0], $lightGreyColor[1], $lightGreyColor[2]);
                }

                $pdf->Rect($x, $y, $dayCellWidth, $dayCellHeight, 'DF', $cellBorderStyle);

                // Work out if this cell should contain a day number
                $isBeforeFirstDay = ($week === 0 && $dayOfWeek < $firstWeekday);
                $isAfterLastDay = ($currentDayNumber > $totalDaysInMonth);

                if (!$isBeforeFirstDay && !$isAfterLastDay) {
                    $currentDateString = $displayYear
                        . '-'
                        . str_pad($displayMonth, 2, '0', STR_PAD_LEFT)
                        . '-'
                        . str_pad($currentDayNumber, 2, '0', STR_PAD_LEFT);

                    // Print day number
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $pdf->SetFont('helvetica', 'B', 7);
                    $pdf->SetXY($x + 1.5, $y + 1);
                    $pdf->Cell(8, 4, $currentDayNumber, 0, 0, 'L');

                    // Print leave items inside this date cell
                    if (isset($groupedLeaveItems[$currentDateString])) {
                        $itemY = $y + 6;
                        $maxItemsToShow = 3;
                        $itemsShown = 0;

                        foreach ($groupedLeaveItems[$currentDateString] as $leaveItem) {
                            if ($itemsShown >= $maxItemsToShow) {
                                break;
                            }

                            $pdf->SetFont('helvetica', '', 6);
                            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);

                            $durationText = $this->getLeaveDurationText($leaveItem);
                            $leaveText = '';

                            if (!isset($leaveItem['employeeName']) || $leaveItem['employeeName'] === '') {
                                $leaveText = $leaveItem['leaveTypeName'] ?? '';
                            } else if (!isset($leaveItem['leaveTypeName']) || $leaveItem['leaveTypeName'] === '') {
                                $leaveText = $leaveItem['employeeName'];
                            } else {
                                $leaveText = $leaveItem['employeeName'] . ' - ' . $leaveItem['leaveTypeName'];
                            }

                            if ($durationText !== '') {
                                $leaveText .= ' (' . $durationText . ')';
                            }

                            $pdf->SetXY($x + 2, $itemY);
                            $pdf->Cell($dayCellWidth - 4, 3.5, $leaveText, 0, 0, 'L', false, '', 1);

                            $itemY += 4;
                            $itemsShown++;
                        }

                        $remainingItems = count($groupedLeaveItems[$currentDateString]) - $itemsShown;

                        if ($remainingItems > 0) {

                            $datesWithHiddenItems[$currentDateString] = $groupedLeaveItems[$currentDateString];

                            $pdf->SetFont('helvetica', 'I', 6);
                            $pdf->SetTextColor($mutedTextColor[0], $mutedTextColor[1], $mutedTextColor[2]);
                            $pdf->SetXY($x + 2, $itemY);
                            $pdf->Cell($dayCellWidth - 4, 3.5, '+' . $remainingItems . ' more', 0, 0, 'L', false, '', 1);
                        }
                    }

                    $currentDayNumber++;
                }
            }
        }

        // Bottom border of weekday headings
        $pdf->Line($calendarX, $weekdayBottomY, $calendarX + $calendarWidth, $weekdayBottomY, ['width' => 0.2, 'color' => [0, 0, 0]]);

        return [
            'ok' => true,
            'datesWithHiddenItems' => $datesWithHiddenItems
        ];
    }

    //Function to create a details page if there are more leave records than a pdf cell can contain
    private function writeCompanyLeaveSummaryPdfDetailPage($pdf, $datesWithHiddenItems, $reportName, $displayYear, $displayMonth)
    {
        $pageWidth = $pdf->getPageWidth();

        $pdf->AddPage('L', 'A4');

        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';

        $logoWidth = 30;
        $logoX = $pageWidth - $logoWidth - 15;
        $logoY = 8;

        $pdf->Image($imageDir, $logoX, $logoY, $logoWidth);

        $pdf->SetFont('helvetica', 'B', 12);

        $pdf->SetXY(15, 5.5);
        $pdf->Cell(200, 10, $reportName . ' - Detailed Leave Items', 0, 0, 'L');
        $pdf->Line(15, 15, $pageWidth - 15, 15);

        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetXY(15, 18);
        $pdf->Cell(0, 6, 'Month: ' . $displayYear . '-' . str_pad($displayMonth, 2, '0', STR_PAD_LEFT), 0, 1, 'L');

        $y = 30;

        foreach ($datesWithHiddenItems as $dateString => $leaveItems) {
            if ($y > 190) {
                $pdf->AddPage('L', 'A4');
                $y = 15;
            }

            $date = new DateTime($dateString);

            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetTextColor(16, 16, 16);
            $pdf->SetXY(15, $y);
            $pdf->Cell(0, 5, $date->format('Y-m-d'), 0, 1, 'L');

            $y += 6;

            foreach ($leaveItems as $leaveItem) {
                if ($y > 270) {
                    $pdf->AddPage('L', 'A4');
                    $y = 15;
                }

                $durationText = $this->getLeaveDurationText($leaveItem);
                $leaveText = '';

                if (!isset($leaveItem['employeeName']) || $leaveItem['employeeName'] === '') {
                    $leaveText = $leaveItem['leaveTypeName'] ?? '';
                } else if (!isset($leaveItem['leaveTypeName']) || $leaveItem['leaveTypeName'] === '') {
                    $leaveText = $leaveItem['employeeName'];
                } else {
                    $leaveText = $leaveItem['employeeName'] . ' - ' . $leaveItem['leaveTypeName'];
                }

                if ($durationText !== '') {
                    $leaveText .= ' (' . $durationText . ')';
                }

                $pdf->SetFont('helvetica', '', 8);
                $pdf->SetXY(20, $y);
                $pdf->Cell($pageWidth - 40, 5, '- ' . $leaveText, 0, 1, 'L');

                $y += 5;
            }

            $y += 3;
        }
    }

    //Helper function to group leave items by date to ensure correct display per calendar cell (Company Leave Summary Report PDF,CSV,XLSX reports)
    private function groupCompanyLeaveItemsByDate($leaveItems)
    {
        $groupedLeaveItems = [];

        foreach ($leaveItems as $leaveItem) {
            if (!isset($leaveItem['leaveDate'])) {
                continue;
            }

            $leaveDate = new DateTime($leaveItem['leaveDate']);
            $leaveDateString = $leaveDate->format('Y-m-d');

            if (!isset($groupedLeaveItems[$leaveDateString])) {
                $groupedLeaveItems[$leaveDateString] = [];
            }

            $groupedLeaveItems[$leaveDateString][] = $leaveItem;
        }

        ksort($groupedLeaveItems);

        return $groupedLeaveItems;
    }

    //Helper function to determine singular or plural for day and hour text (Company Leave Summary Report PDF, CSV, XLSX reports)
    private function getLeaveDurationText($leaveItem)
    {
        $hours = isset($leaveItem['hours']) ? floatval($leaveItem['hours']) : 0;
        $days = isset($leaveItem['days']) ? floatval($leaveItem['days']) : 0;

        if ($days > 0 && $days < 1) {
            return $days . ' day';
        }

        if ($days >= 1) {
            return $days == 1 ? '1 day' : $days . ' days';
        }

        if ($hours > 0) {
            return $hours == 1 ? '1 hour' : $hours . ' hours';
        }

        return '';
    }

    //begin hier volgende: subtitles vir xlsx/csv reports
    //If done this for the pdf generation. pleaese help me add the whole subtitle section to the excel/csv reports also

    //Helper function for etiPdfReport

    private function writeEtiPdfReport($pdf, $reportData, $reportName)
    {
        $pdf->SetMargins(1, 1, 1, 1);
        $pdf->SetAutoPageBreak(false);
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor('Payaccsys Payroll');
        $pdf->SetTitle('Payaccsys Payroll - ' . $reportName);
        $pdf->SetSubject('');
        $pdf->SetKeywords('');

        $pdf->AddPage('L', 'A4');

        $pageWidth = $pdf->getPageWidth();
        $pageHeight = $pdf->getPageHeight();

        $marginX = 8;
        $marginY = 8;
        $currentY = $marginY;

        $coralRedColor = [239, 78, 69];
        $whiteColor = [255, 255, 255];
        $textColor = [16, 16, 16];
        $borderColor = [16, 16, 16];
        $highlightColor = [232, 232, 232];

        $imageDir = CONF_ROOT_URL . '/gfx/payaccsys-icon1.png';
        $logoWidth = 28;
        $logoX = $pageWidth - $logoWidth - $marginX;
        $logoY = $currentY;

        $pdf->Image($imageDir, $logoX, $logoY, $logoWidth);

        $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->SetXY($marginX, $currentY);
        $pdf->Cell($pageWidth - ($marginX * 2) - $logoWidth - 5, 7, $reportName, 0, 0, 'L');

        $currentY += 8;

        $calendarMonth = (int)$reportData['month'];
        $etiMonthNumber = ($calendarMonth >= 3) ? ($calendarMonth - 2) : ($calendarMonth + 10);

        $pdf->SetFont('helvetica', '', 10);
        $pdf->SetXY($marginX, $currentY);
        $pdf->Cell(($pageWidth - ($marginX * 2)) / 2, 5, 'ETI Details for Month ' . $etiMonthNumber . ' - ' . $reportData['monthEndDate'], 0, 0, 'L');

        $pdf->SetXY($marginX + (($pageWidth - ($marginX * 2)) / 2), $currentY);
        $pdf->Cell(($pageWidth - ($marginX * 2)) / 2, 5, 'Generated on: ' . date('Y-m-d H:i:s'), 0, 0, 'R');

        $currentY += 7;

        $pdf->Line($marginX, $currentY, $pageWidth - $marginX, $currentY, [
            'width' => 0.25,
            'color' => $borderColor,
            'cap' => 'butt'
        ]);
        $currentY += 5;

        $columns = [
            ['name' => 'Code', 'width' => 16, 'alignment' => 'L'],
            ['name' => 'Name', 'width' => 24, 'alignment' => 'L'],
            ['name' => 'Surname', 'width' => 26, 'alignment' => 'L'],
            ['name' => 'Age', 'width' => 12, 'alignment' => 'C'],
            ['name' => 'Start Date', 'width' => 23, 'alignment' => 'C'],
            ['name' => 'ETI', 'width' => 13, 'alignment' => 'C'],
            ['name' => '2nd Year', 'width' => 15, 'alignment' => 'C'],
            ['name' => 'Hours', 'width' => 17, 'alignment' => 'R'],
            ['name' => 'Effective Hourly Rate', 'width' => 30, 'alignment' => 'R'],
            ['name' => 'Basic Wage', 'width' => 18, 'alignment' => 'R'],
            ['name' => 'Actual', 'width' => 19, 'alignment' => 'R'],
            ['name' => 'Monthly Equivalent', 'width' => 27, 'alignment' => 'R'],
            ['name' => 'ETI Amount', 'width' => 25, 'alignment' => 'R'],
            ['name' => 'Completed', 'width' => 16, 'alignment' => 'C']
        ];

        $rowHeight = 6;
        $headerHeight = 7;
        $footerHeight = 8;

        $headingBorderStyle = [
            'T' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
            'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
            'B' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
            'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
        ];

        $rowBorderStyle = [
            'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
            'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
            'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
        ];

        $drawHeader = function() use ($pdf, $columns, $marginX, &$currentY, $headerHeight, $coralRedColor, $whiteColor, $headingBorderStyle) {
            $currentX = $marginX;

            $pdf->SetFillColor($coralRedColor[0], $coralRedColor[1], $coralRedColor[2]);
            $pdf->SetTextColor($whiteColor[0], $whiteColor[1], $whiteColor[2]);
            $pdf->SetFont('helvetica', 'B', 7);

            foreach ($columns as $column) {
                $pdf->SetXY($currentX, $currentY);
                $pdf->Cell($column['width'], $headerHeight, $column['name'], $headingBorderStyle, 0, $column['alignment'], true, '', 1, false, 'T', 'C');
                $currentX += $column['width'];
            }

            $currentY += $headerHeight;
        };

        $drawFooter = function() use ($pdf, $pageWidth, $pageHeight, $marginX, $textColor) {
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFont('helvetica', '', 7);
            $pdf->SetXY($marginX, $pageHeight - 8);
            $pdf->Cell($pageWidth - ($marginX * 2), 5, 'Page ' . $pdf->getAliasNumPage(), 0, 0, 'R');
        };

        $drawHeader();

        $rowIndex = 0;

        foreach ($reportData['employees'] as $employee) {
            if (($currentY + $rowHeight + $footerHeight) > ($pageHeight - $marginY)) {
                $drawFooter();
                $pdf->AddPage('L', 'A4');
                $currentY = $marginY;
                $drawHeader();
            }

            $row = [
                $employee['code'],
                $employee['name'],
                $employee['surname'],
                $employee['age'],
                $employee['employmentStartDate'],
                $this->formatYesNo($employee['etiEligible']),
                $this->formatYesNo($employee['secondYear']),
                number_format((float)$employee['totalHoursWorked'], 2, '.', ' '),
                number_format((float)$employee['effectiveHourlyRate'], 2, '.', ' '),
                number_format((float)$employee['basicWage'], 2, '.', ' '),
                number_format((float)$employee['actual'], 2, '.', ' '),
                number_format((float)$employee['monthlyEquivalent'], 2, '.', ' '),
                number_format((float)$employee['etiAmount'], 2, '.', ' '),
                $this->formatYesNo($employee['completed'])
            ];

            $currentX = $marginX;

            if (($rowIndex % 2) === 1) {
                $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
                $fill = true;
            } else {
                $pdf->SetFillColor(255, 255, 255);
                $fill = true;
            }

            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFont('helvetica', '', 7);

            foreach ($columns as $columnIndex => $column) {
                $pdf->SetXY($currentX, $currentY);
                $pdf->Cell($column['width'], $rowHeight, $row[$columnIndex], $rowBorderStyle, 0, $column['alignment'], $fill, '', 1, false, 'T', 'C');
                $currentX += $column['width'];
            }

            $currentY += $rowHeight;
            $rowIndex++;
        }

        if (($currentY + $rowHeight + $footerHeight) > ($pageHeight - $marginY)) {
            $drawFooter();
            $pdf->AddPage('L', 'A4');
            $currentY = $marginY;
            $drawHeader();
        }

        $totalRow = [
            'Total', '', '', '', '', '', '', '', '', '', '', '',
            number_format((float)$reportData['totals']['etiAmountTotal'], 2, '.', ' '),
            ''
        ];

        $currentX = $marginX;

        if (($rowIndex % 2) === 1) {
            $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
        } else {
            $pdf->SetFillColor(255, 255, 255);
        }
        
        $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
        $pdf->SetFont('helvetica', 'B', 7);

        foreach ($columns as $columnIndex => $column) {
            $pdf->SetXY($currentX, $currentY);
            $pdf->Cell($column['width'], $rowHeight, $totalRow[$columnIndex], $rowBorderStyle, 0, $column['alignment'], true, '', 1, false, 'T', 'C');
            $currentX += $column['width'];
        }

        $currentY += $rowHeight;

        $pdf->Line($marginX, $currentY, $pageWidth - $marginX, $currentY, [
            'width' => 0.25,
            'color' => $borderColor,
            'cap' => 'butt'
        ]);

        $drawFooter();

        return ['ok' => true];
    }
}
