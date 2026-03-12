<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('payslip_printing/PayslipPrinterBase.php');
    
    // Create our PdfPrinter class
    class PayslipPrinter extends PayslipPrinterBase {
        
        //
        // MEMBER VARIABLES
        //
        
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get available config parameters for the payslip.
        //
        // NOTE: See payslipPrinterBase.getConfigParameters for more details.
        public function getConfigParameters() {
            return [
                ['name' => 'logoImage', 'description' => 'Logo Image', 'type' => 'image', 'default' => null],
                ['name' => 'logoX', 'description' => 'Logo X', 'type' => 'float', 'default' => 10],
                ['name' => 'logoY', 'description' => 'Logo Y', 'type' => 'float', 'default' => 10],
                ['name' => 'logoImageSize', 'description' => 'Logo Size (%)', 'type' => 'float', 'default' => 100],
                ['name' => 'headingColor', 'description' => 'Heading Color', 'type' => 'color', 'default' => '#1B2C64'],
                // ['name' => 'signatureImage', 'description' => 'Signature Image', 'type' => 'image'],
                // ['name' => 'signatureX', 'description' => 'Logo X', 'type' => 'float'],
                // ['name' => 'signatureY', 'description' => 'Logo Y', 'type' => 'float'],
                // ['name' => 'signatureImageSize', 'description' => 'Logo Size (%)', 'type' => 'float']
            ];  
        }
        
        // Function to print a payslip in PDF format.
        public function printPayslip() : bool {
            // Delete any existing PDF data
            if( $this->pdf !== null ) unset($this->pdf);
            
            // Create a new PDF object
            $this->pdf = $this->pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
            
            // set document information
            $this->pdf->SetCreator(PDF_CREATOR);
            $this->pdf->SetAuthor('Lexpro Payroll');
            $this->pdf->SetTitle($this->companyName);
            $this->pdf->SetSubject('');
            $this->pdf->SetKeywords('');
            
            // remove default header/footer
            $this->pdf->setPrintHeader(false);
            $this->pdf->setPrintFooter(false);
            
            // set default monospaced font
            $this->pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
            
            // set margins
            $this->pdf->SetMargins(0,0,0,0);
            
            // set some language-dependent strings (optional)
            if (@file_exists(dirname(__FILE__).'/lang/eng.php')) {
                require_once(dirname(__FILE__).'/lang/eng.php');
                $this->pdf->setLanguageArray($l);
            }
            
            // set font
            $this->pdf->SetFont('helvetica', 'BI', 20);
            
            // set auto page breaks
            $this->pdf->SetAutoPageBreak(FALSE, 0);
            
            // add a page
            $this->pdf->AddPage();
            
            $horizontal_alignments = array('L', 'C', 'R');
            $vertical_alignments = array('T', 'M', 'B');
            
            $logoX = 10;
            $logoY = 10;
            $logoImageSize = 100;
            $imageDir = null;
            $imageHeight = 0;
            $imageWidth = 0;
            
            $config = $this->config;
            if(isset($config['logoX'])) {
                $logoX = (float)$config['logoX'];
            }
            
            if(isset($config['logoY'])) {
                $logoY = (float)$config['logoY'];
            }
            
            if(isset($config['logoImageSize'])) {
                $logoImageSize = (float)$config['logoImageSize'];
            }
            
            if (isset($config['logoImage'])) {
                $imageDir = $config['logoImage'];
                $imageDetails = getimagesize($imageDir);
                $imageWidth = $imageDetails[0];
                $imageHeight = $imageDetails[1];
                
                // The number 0.283 is a made up number 
                $imageHeight = ($imageHeight * 0.283 / 100) * $logoImageSize;
                $imageWidth = ($imageWidth * 0.283 / 100) * $logoImageSize;
                
                $this->pdf->Image($imageDir, $logoX, $logoY, $imageWidth, $imageHeight , 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
            }
            
            // NOTE: Uncomment this block to print out config data for testing
            // print_r('=========================================================================================');
            // print_r($this->config);
            // print_r('=========================================================================================');
            // $this->pdf->Cell(50, 10, [], 0, 1, 'T', 0, 'L', 1);
            
            // Heading color rgb
            $r = 27;
            $g = 44;
            $b = 100;
            
            // Overwrite the default color with the config color, if any
            if(isset($config['headingColor'])) {
                list($r, $g, $b) = sscanf($config['headingColor'], "#%02x%02x%02x");
            }
            
            // Top right heading
            $this->pdf->SetFont('helvetica', '' , 15);
            $this->pdf->SetXY(150, 10);
            $this->pdf->Cell(50, 10, $this->companyName, 0, 1, 'T', 0, 'L', 1);
            
            // Top right details
            $this->pdf->SetXY(150, 20);
            $this->pdf->SetFont('helvetica', '' , 10);
            $this->pdf->Write(5, $this->companyAddress[0], '');
            $this->pdf->SetXY(150, 25);
            $this->pdf->Write(5, $this->companyAddress[1], '');
            $this->pdf->SetXY(150, 30);
            $this->pdf->Write(5, $this->companyAddress[2], '');
            $this->pdf->SetXY(150, 35);
            $this->pdf->Write(5, $this->companyAddress[3], '');
            $this->pdf->SetXY(150, 40);
            $this->pdf->Write(5, $this->companyTel, '');
            $this->pdf->SetXY(150, 45);
            $this->pdf->Write(5, $this->companyCellNumber, '');
            $this->pdf->SetXY(150, 50);
            $this->pdf->Write(5, $this->companyWebsite, '');
            $this->pdf->SetXY(150, 55);
            $this->pdf->Write(5, $this->companyEmail, '');
            
            $this->pdf->Rect(10, 65, 190, 10, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(90, 65);
            $this->pdf->SetTextColor(255, 255, 255);
            $this->pdf->SetFontSize(13);
            $this->pdf->Cell(30, 10, 'PAYSLIP - ' . strtoupper(date('F Y', strtotime($this->toDate))), 0, 1, 'C', 0, 1);
            // $this->pdf->Cell(0, 5, strtoupper(date('F Y', strtotime($this->toDate))), 0, 1, 'C', 0, 1);
            // $r, $g, $b
            // Personal Details
            
            $this->pdf->Rect(10, 79, 190, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(90, 79);
            $this->pdf->SetTextColor(255, 255, 255);
            $this->pdf->SetFontSize(10);
            $this->pdf->SetXY(13, 77.6);
            $this->pdf->Cell(31, 10, 'PERSONAL DETAILS', 0, 1, 'C', 0, 1);
            
            $earnings = [];
            $deductions = [];
            $netSalary = [];
            $companyContributions = [];
            $fringeBenefits = [];
            $allowances = [];
            
            $earningsTotal = '';
            $deductionsTotal = '';
            $netSalaryTotal = '';
            $companyContributionsTotal = '';
            $fringeBenefitsTotal = '';
            $fringeBenefitsNettPayTotal = 0;
            $allowancesTotal = '';
            
            for ($i=0; $i < count($this->payslipItems); $i++) {
                $this->payslipItems[$i]['type'];
                if ($this->payslipItems[$i]['type'] === 'Income') {
                    $earnings[] = [
                        'name' => $this->payslipItems[$i]['description'],
                        'value' => $this->payslipItems[$i]['amount']
                    ];
                    $earningsTotal = (float)$earningsTotal + (float)$this->payslipItems[$i]['amount'];
                }
                else if ($this->payslipItems[$i]['type'] === 'Deductions') {
                    $deductions[] = [
                        'name' => $this->payslipItems[$i]['description'],
                        'value' => $this->payslipItems[$i]['amount']
                    ];
                    $deductionsTotal = (float)$deductionsTotal + (float)$this->payslipItems[$i]['amount'];
                }
                else if ($this->payslipItems[$i]['type'] === 'Company Contributions') {
                    $companyContributions[] = [
                        'name' => $this->payslipItems[$i]['description'],
                        'value' => $this->payslipItems[$i]['amount']
                    ];
                    $companyContributionsTotal = (float)$companyContributionsTotal + (float)$this->payslipItems[$i]['amount'];
                }
                else if ($this->payslipItems[$i]['type'] === 'Fringe Benefits') {
                    $fringeBenefits[] = [
                        'name' => $this->payslipItems[$i]['description'],
                        'value' => $this->payslipItems[$i]['amount']
                    ];
                    $fringeBenefitsTotal = (float)$fringeBenefitsTotal + (float)$this->payslipItems[$i]['amount'];
                    
                    if( $this->payslipItems[$i]['includeInNettPay'] ) {
                        $fringeBenefitsNettPayTotal = (float)$fringeBenefitsNettPayTotal + (float)$this->payslipItems[$i]['amount'];
                    }
                }
                else if ($this->payslipItems[$i]['type'] === 'Allowances') {
                    $allowances[] = [
                        'name' => $this->payslipItems[$i]['description'],
                        'value' => $this->payslipItems[$i]['amount']
                    ];
                    $allowancesTotal = (float)$allowancesTotal + (float)$this->payslipItems[$i]['amount'];
                    
                }
                else {
                    continue;
                }
            }
            $netSalary[] = [
                'name' => 'Earnings',
                'value' => (string)$earningsTotal
            ];
            $netSalary[] = [
                'name' => 'Allowances',
                'value' => (string)$allowancesTotal
            ];
            if( $fringeBenefitsNettPayTotal > 0 ) {
                $netSalary[] = [
                    'name' => 'Fringe Benefits',
                    'value' => (string)$fringeBenefitsNettPayTotal
                ];
            }
            $netSalary[] = [
                'name' => 'Deductions',
                'value' => (string)$deductionsTotal
            ];
            
            $netSalaryTotal = (float)$earningsTotal - (float)$deductionsTotal;
            $netSalaryTotal = $netSalaryTotal + (float)$allowancesTotal + (float)$fringeBenefitsNettPayTotal;
            
            $this->pdf->SetFontSize(9);
            $this->pdf->SetTextColor(0,0,0);
            $this->pdf->SetXY(10, 86);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->MultiCell(63.2, 34, 
                'EMP ALIAS: ' . $this->employeeAlias . "\n" .
                'ADDRESS: ' . "\n" .
                $this->employeeAddress[0] . "\n" .
                $this->employeeAddress[1] . "\n" .
                $this->employeeAddress[2] . "\n" .
                $this->employeeAddress[3] . "\n" .
                'EMAIL: ' . $this->employeeEmail . "\n"
            , 'LBTR', 'L', 1, 0, '', '', true);
            
            if( $this->employeeIdNumber !== '' ) {
                $this->pdf->MultiCell(63.3, 34, 
                    'EMP NAME: ' . $this->employeeFullName . "\n" .
                    'ID NUMBER: ' . $this->employeeIdNumber . "\n" .
                    'INCOME TAX NO: ' . ($this->employeeIncomeTaxNumber !== '' ? $this->employeeIncomeTaxNumber : '-') . "\n" .
                    'BANK NAME: ' . ($this->employeeBankName !== '' ? $this->employeeBankName : '-') . "\n" .
                    'ACCOUNT NO: ' . ($this->employeeAccountNumber !== '' ? $this->employeeAccountNumber : '-') . "\n" .
                    'BANK CODE: ' . ($this->employeeBankCode !== '' ? $this->employeeBankCode : '-') . "\n"
                , 'LBTR', 'L', 1, 0, '', '', true);
            }
            else {
                $this->pdf->MultiCell(63.3, 34, 
                    'EMP NAME: ' . $this->employeeFullName . "\n" .
                    'PASSPORT NO: ' . $this->employeePassportNumber . "\n" .
                    'INCOME TAX NO: ' . ($this->employeeIncomeTaxNumber !== '' ? $this->employeeIncomeTaxNumber : '-') . "\n" .
                    'BANK NAME: ' . ($this->employeeBankName !== '' ? $this->employeeBankName : '-') . "\n" .
                    'ACCOUNT NO: ' . ($this->employeeAccountNumber !== '' ? $this->employeeAccountNumber : '-') . "\n" .
                    'BANK CODE: ' . ($this->employeeBankCode !== '' ? $this->employeeBankCode : '-') . "\n"
                , 'LBTR', 'L', 1, 0, '', '', true);
            }
            
            $this->pdf->MultiCell(63.5, 34, 
                'EMP. CODE: ' . $this->employeeCode . "\n" .
                'DEPT: ' . $this->employeeDepartment . "\n" .
                'JOB TITLE: ' . $this->employeePosition . "\n" .
                'DATE EMPLOYED: ' . $this->employeeEmploymentStart . "\n" .
                'PERIOD: ' . $this->employeePeriod . "\n"
            , 'LBTR', 'L', 1, 0, '', '', true);
            
            
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(10, 124, 95, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(10, 122.6);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(21, 10, 'EARNINGS', 0, 1, 'C', 0, 1);
            
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(105, 124, 95, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(105, 122.6);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(25, 10, 'DEDUCTIONS', 0, 1, 'C', 0, 1);
            
            $this->pdf->SetFont('helvetica', '', 8.5);
            $earningsLineStart = 131;
            
            $earningsDeductionsSize = count($earnings);
            if (count($earnings) < count($deductions)) {
                $earningsDeductionsSize = count($deductions);
            }
            for ($i=0; $i < $earningsDeductionsSize; $i++) {
                
                if (!isset($earnings[$i]['value'])) {
                    $this->pdf->SetXY(10, $earningsLineStart);
                    $this->pdf->SetTextColor(60,60,60);
                    $this->pdf->Cell(74.5, 5, '', 'RLB', 1, 'L', 0, 1);
                    $this->pdf->SetXY(84.5, $earningsLineStart);
                    $this->pdf->SetFillColor(255,255,255);
                    $this->pdf->Cell(20.5, 5, '', 'BR', 1, 'R', 0, 1);
                    
                    $earningsLineStart = $earningsLineStart + 5;
                    continue;
                }
                
                $formattedEarnings = '';
                if ($earnings[$i]['value'] !== '') {
                    $formattedEarnings = number_format($earnings[$i]['value'], 2, '.', ' ');
                }
                
                $this->pdf->SetXY(10, $earningsLineStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(74.5, 5, $earnings[$i]['name'], 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
                $this->pdf->SetXY(84.5, $earningsLineStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(20.5, 5, $formattedEarnings, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $earningsLineStart = $earningsLineStart + 5;
            }
            
            $formattedEarningsTotal = '';
            if ($earningsTotal !== '') {
                $formattedEarningsTotal = number_format($earningsTotal, 2, '.', ' ');
            }
            else {
                $formattedEarningsTotal = '0';
            }
            
            $this->pdf->SetXY(10, $earningsLineStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(74.5, 5, 'TOTAL', 'TRLB', 1, 'L', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetXY(84.5, $earningsLineStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(20.5, 5, $formattedEarningsTotal, 'TBR', 1, 'R', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetFont('helvetica', 8.5);
            
            $DeductionsLineStart = 131;
            $this->pdf->SetFont('helvetica', 8.5);
            for ($i=0; $i < $earningsDeductionsSize; $i++) {
                
                if (!isset($deductions[$i]['value'])) {
                    $this->pdf->SetXY(105, $DeductionsLineStart);
                    $this->pdf->SetTextColor(60,60,60);
                    $this->pdf->Cell(74.5, 5, '', 'RB', 1, 'L', 0, 1);
                    $this->pdf->SetXY(179.5, $DeductionsLineStart);
                    $this->pdf->SetFillColor(255,255,255);
                    $this->pdf->Cell(20.5, 5, '', 'BR', 1, 'R', 0, 1);
                    
                    $DeductionsLineStart = $DeductionsLineStart + 5;
                    continue;
                }
                
                $formattedDeductions = '';
                if ($deductions[$i]['value'] !== '') {
                    $formattedDeductions = number_format($deductions[$i]['value'], 2, '.', ' ');
                }
                
                $this->pdf->SetXY(105, $DeductionsLineStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(74.5, 5, $deductions[$i]['name'], 'RB', 1, 'L', 0, '', 1, false, 'T', 'C');
                
                $this->pdf->SetXY(179.5, $DeductionsLineStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(20.5, 5, $formattedDeductions, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $DeductionsLineStart = $DeductionsLineStart + 5;
            }
            
            $formattedDeductionsTotal = '';
            if ($deductionsTotal !== '') {
                $formattedDeductionsTotal = number_format($deductionsTotal, 2, '.', ' ');
            }
            else {
                $formattedDeductionsTotal = '0';
            }
            
            $this->pdf->SetXY(105, $DeductionsLineStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(74.5, 5, 'TOTAL', 'TRB', 1, 'L', 0, 1);
            $this->pdf->SetXY(179.5, $DeductionsLineStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(20.5, 5, $formattedDeductionsTotal, 'TBR', 1, 'R', 0, 1);
            $this->pdf->SetFont('helvetica', 8.5);
            
            //===================================================
            // Company Contributions
            $allowancesStart = $earningsLineStart + 9;
            if ($DeductionsLineStart > $earningsLineStart) {
                $allowancesStart = $DeductionsLineStart + 9;
            }
            
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(10, $allowancesStart, 190, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(10, $allowancesStart - 1.5);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(27, 10, 'ALLOWANCES', 0, 1, 'C', 0, 1 );
            $this->pdf->SetFont('helvetica', 8.5);
            
            $allowancesStart = $allowancesStart + 7;
            $this->pdf->SetFontSize(9);
            for ($i=0; $i < count($allowances); $i++) {
                
                if ($allowancesStart >= (int)$this->pdf->getPageHeight() - 10) {
                    $this->pdf->AddPage();
                    $allowancesStart = 10;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->Rect(10, $allowancesStart, 190, 7, 'DF', array(), array($r, $g, $b));
                    $this->pdf->SetXY(10, $allowancesStart - 1.5);
                    $this->pdf->SetTextColor(255,255,255);
                    $this->pdf->Cell(27, 10, 'ALLOWANCES', 0, 1, 'C', 0, 1 );
                    $this->pdf->SetFont('helvetica', 8.5);
                    
                    $allowancesStart = $allowancesStart + 7;
                }
                
                $formattedAllowances = '';
                if ($allowances[$i]['value'] !== '') {
                    $formattedAllowances = number_format($allowances[$i]['value'], 2, '.', ' ');
                }
                
                $this->pdf->SetXY(10, $allowancesStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(130, 5, $allowances[$i]['name'], 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
                $this->pdf->SetXY(140, $allowancesStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(60, 5, $formattedAllowances, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $allowancesStart = $allowancesStart + 5;
            }
            
            $formattedAllowancesTotal = '';
            if ($allowancesTotal !== '') {
                $formattedAllowancesTotal = number_format($allowancesTotal, 2, '.', ' ');
            }
            else {
                $formattedAllowancesTotal = 0;
            }
            
            if ($allowancesStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $allowancesStart = 10;
            }
            
            $this->pdf->SetXY(10, $allowancesStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(130, 5, 'TOTAL', 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetXY(140, $allowancesStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(60, 5, $formattedAllowancesTotal, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetFont('helvetica', 8.5);
            
            
            // ==================================================
            $nettSalaryStart  = $allowancesStart + 9;
            if ($nettSalaryStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $nettSalaryStart = 10;
            }
            
            // Net Salary
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(10, $nettSalaryStart, 190, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(10, $nettSalaryStart - 1.5);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(20, 10, 'NETT PAY', 0, 1, 'C', 0, 1 );
            $this->pdf->SetFont('helvetica', 8.5);
            
            $nettSalaryStart = $nettSalaryStart + 7;
            $this->pdf->SetFontSize(9);
            for ($i=0; $i < count($netSalary); $i++) {
                
                if ($nettSalaryStart >= (int)$this->pdf->getPageHeight() - 10) {
                    $this->pdf->AddPage();
                    $nettSalaryStart = 10;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->Rect(10, $nettSalaryStart, 190, 7, 'DF', array(), array($r, $g, $b));
                    $this->pdf->SetXY(10, $nettSalaryStart - 1.5);
                    $this->pdf->SetTextColor(255,255,255);
                    $this->pdf->Cell(27, 10, 'NETT SALARY', 0, 1, 'C', 0, 1 );
                    $this->pdf->SetFont('helvetica', 8.5);
                    
                    $nettSalaryStart = $nettSalaryStart + 7;
                }
                
                $formattedNetSalary = '';
                if ($netSalary[$i]['value'] !== '') {
                    $formattedNetSalary = number_format($netSalary[$i]['value'], 2, '.', ' ');
                }
                
                $netSalaryValue = $formattedNetSalary;
                if ($netSalary[$i]['name'] === 'Deductions') {
                    if ($netSalary[$i]['value'] !== '') {
                        $netSalaryValue = '- ' . $formattedNetSalary;
                    }
                    else {
                        $netSalaryValue = '0';
                    }
                    
                }
                else {
                    if ($netSalary[$i]['value'] !== '') {
                        $netSalaryValue = $formattedNetSalary;
                    }
                    else {
                        $netSalaryValue = '0';
                    }
                }
                
                $this->pdf->SetXY(10, $nettSalaryStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(130, 5, $netSalary[$i]['name'], 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
                $this->pdf->SetXY(140, $nettSalaryStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(60, 5, $netSalaryValue, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $nettSalaryStart = $nettSalaryStart + 5;
            }
            
            $formattedNetSalaryTotal = '';
            if ($netSalaryTotal !== '') {
                $formattedNetSalaryTotal = number_format($netSalaryTotal, 2, '.', ' ');
            }
            
            if ($nettSalaryStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $nettSalaryStart = 10;
            }
            
            $this->pdf->SetXY(10, $nettSalaryStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(130, 5, 'TOTAL', 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetXY(140, $nettSalaryStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(60, 5, $formattedNetSalaryTotal, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetFont('helvetica', 8.5);
            
            // Company Contributions
            $companyContributionsStart  = $nettSalaryStart + 9;
            if ($companyContributionsStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $companyContributionsStart = 10;
            }
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(10, $companyContributionsStart, 190, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(10, $companyContributionsStart - 1.5);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(50, 10, 'COMPANY CONTRIBUTIONS', 0, 1, 'C', 0, 1 );
            $this->pdf->SetFont('helvetica', 8.5);
            
            $companyContributionsStart = $companyContributionsStart + 7;
            $this->pdf->SetFontSize(9);
            for ($i=0; $i < count($companyContributions); $i++) {
                
                if ($companyContributionsStart >= (int)$this->pdf->getPageHeight() - 10) {
                    $this->pdf->AddPage();
                    $companyContributionsStart = 10;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->Rect(10, $companyContributionsStart, 190, 7, 'DF', array(), array($r, $g, $b));
                    $this->pdf->SetXY(10, $companyContributionsStart - 1.5);
                    $this->pdf->SetTextColor(255,255,255);
                    $this->pdf->Cell(50, 10, 'COMPANY CONTRIBUTIONS', 0, 1, 'C', 0, 1 );
                    $this->pdf->SetFont('helvetica', 8.5);
                    
                    $companyContributionsStart = $companyContributionsStart + 7;
                }
                
                $formattedCompanyContributions = '';
                if ($companyContributions[$i]['value'] !== '') {
                    $formattedCompanyContributions = number_format($companyContributions[$i]['value'], 2, '.', ' ');
                }
                
                $this->pdf->SetXY(10, $companyContributionsStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(130, 5, $companyContributions[$i]['name'], 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
                $this->pdf->SetXY(140, $companyContributionsStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(60, 5, $formattedCompanyContributions, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $companyContributionsStart = $companyContributionsStart + 5;
            }
            
            $formattedCompanyContributionsTotal = '';
            if ($companyContributionsTotal !== '') {
                $formattedCompanyContributionsTotal = number_format($companyContributionsTotal, 2, '.', ' ');
            }
            else {
                $formattedCompanyContributionsTotal = 0;
            }
            
            if ($companyContributionsStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $companyContributionsStart = 10;
            }
            
            $this->pdf->SetXY(10, $companyContributionsStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(130, 5, 'TOTAL', 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetXY(140, $companyContributionsStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(60, 5, $formattedCompanyContributionsTotal, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetFont('helvetica', 8.5);
            
            // Fringe benefits
            $fringeBenefitsStart = $companyContributionsStart + 9;
            if ($fringeBenefitsStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $fringeBenefitsStart = 10;
            }
            $this->pdf->SetFontSize(10);
            $this->pdf->Rect(10, $fringeBenefitsStart, 190, 7, 'DF', array(), array($r, $g, $b));
            $this->pdf->SetXY(10, $fringeBenefitsStart - 1.5);
            $this->pdf->SetTextColor(255,255,255);
            $this->pdf->Cell(34, 10, 'FRINGE BENEFITS', 0, 1, 'C', 0, 1 );
            $this->pdf->SetFont('helvetica', 8.5);
            
            $fringeBenefitsStart = $fringeBenefitsStart + 7;
            $this->pdf->SetFontSize(9);
            for ($i=0; $i < count($fringeBenefits); $i++) {
                
                if ($fringeBenefitsStart >= (int)$this->pdf->getPageHeight() - 10) {
                    $this->pdf->AddPage();
                    $fringeBenefitsStart = 10;
                    $this->pdf->SetFontSize(10);
                    $this->pdf->Rect(10, $fringeBenefitsStart, 190, 7, 'DF', array(), array($r, $g, $b));
                    $this->pdf->SetXY(10, $fringeBenefitsStart - 1.5);
                    $this->pdf->SetTextColor(255,255,255);
                    $this->pdf->Cell(34, 10, 'FRINGE BENEFITS', 0, 1, 'C', 0, 1 );
                    $this->pdf->SetFont('helvetica', 8.5);
                    
                    $fringeBenefitsStart = $fringeBenefitsStart + 7;
                }
                
                $formattedFringeBenefits = '';
                if ($fringeBenefits[$i]['value'] !== '') {
                    $formattedFringeBenefits = number_format($fringeBenefits[$i]['value'], 2, '.', ' ');
                }
                
                $this->pdf->SetXY(10, $fringeBenefitsStart);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->Cell(130, 5, $fringeBenefits[$i]['name'], 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
                $this->pdf->SetXY(140, $fringeBenefitsStart);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(60, 5, $formattedFringeBenefits, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                
                $fringeBenefitsStart = $fringeBenefitsStart + 5;
            }
            
            $formattedFringeBenefitsTotal = '';
            if ($fringeBenefitsTotal !== '') {
                $formattedFringeBenefitsTotal = number_format($fringeBenefitsTotal, 2, '.', ' ');
            }
            else {
                $formattedFringeBenefitsTotal = 0;
            }
            
            if ($fringeBenefitsStart >= (int)$this->pdf->getPageHeight() - 10) {
                $this->pdf->AddPage();
                $fringeBenefitsStart = 10;
            }
            
            $this->pdf->SetXY(10, $fringeBenefitsStart);
            $this->pdf->SetTextColor(60,60,60);
            $this->pdf->SetFont('helvetica', 'B', 8.5);
            $this->pdf->Cell(130, 5, 'TOTAL', 'RLB', 1, 'L', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetXY(140, $fringeBenefitsStart);
            $this->pdf->SetFillColor(255,255,255);
            $this->pdf->Cell(60, 5, $formattedFringeBenefitsTotal, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
            $this->pdf->SetFont('helvetica', 8.5);
            
            // Leave
            if( count($this->leaveItems) > 0 ) {
                $leave = $fringeBenefitsStart + 9;
                
                if (($leave + 7) >= (int)$this->pdf->getPageHeight() - 10) {
                    
                    $this->pdf->AddPage();
                    $leave = 10;
                }
                $this->pdf->SetFontSize(10);
                $this->pdf->Rect(10, $leave, 190, 7, 'DF', array(), array($r, $g, $b));
                $this->pdf->SetXY(10, $leave - 1.5);
                $this->pdf->SetTextColor(255,255,255);
                $this->pdf->Cell(14, 10, 'LEAVE', 0, 1, 'C', 0, 1 );
                $this->pdf->SetFont('helvetica', 8.5);
                
                $leave = $leave + 7;
                $this->pdf->SetFontSize(9);
                
                $this->pdf->SetXY(10, $leave);
                $this->pdf->SetTextColor(60,60,60);
                $this->pdf->SetFillColor(255,255,255);
                $this->pdf->Cell(90, 5, 'Leave Type', 'LBR', 1, 'L', 0, 1);
                $this->pdf->SetXY(95, $leave);
                $this->pdf->Cell(30, 5, 'Adjustment', 'BR', 1, 'R', 0, 1);
                $this->pdf->SetXY(120, $leave);
                $this->pdf->Cell(30, 5, 'Leave Taken', 'BR', 1, 'R', 0, 1);
                $this->pdf->SetXY(145, $leave);
                $this->pdf->Cell(30, 5, 'Leave Accrued ', 'BR', 1, 'R', 0, 1);
                $this->pdf->SetXY(170, $leave);
                $this->pdf->Cell(30, 5, 'Balance ', 'BR', 1, 'R', 0, 1);
                
                $leave = $leave + 5;
                
                for ($i=0; $i < count($this->leaveItems); $i++) {
                    
                    if (($leave + 7) >= (int)$this->pdf->getPageHeight() - 10) {
                        
                        $this->pdf->AddPage();
                        $leave = 10;
                        $this->pdf->SetFontSize(10);
                        $this->pdf->Rect(10, $leave, 190, 7, 'DF', array(), array($r, $g, $b));
                        $this->pdf->SetXY(10, $leave - 1.5);
                        $this->pdf->SetTextColor(255,255,255);
                        $this->pdf->Cell(14, 10, 'LEAVE', 0, 1, 'C', 0, 1 );
                        $this->pdf->SetFont('helvetica', 8.5);
                        $this->pdf->SetFontSize(9);
                        $leave = $leave + 7;
                    }
                    
                    $formattedTaken = '';
                    if ($this->leaveItems[$i]['taken'] !== '') {
                        $formattedTaken = number_format($this->leaveItems[$i]['taken'], 2, '.', ' ');
                    }
                    
                    $formattedBalance= '';
                    if ($this->leaveItems[$i]['balance'] !== '') {
                        $formattedBalance = number_format($this->leaveItems[$i]['balance'], 2, '.', ' ');
                    }
                    
                    $formattedAccrued= '';
                    if ($this->leaveItems[$i]['accrued'] !== '') {
                        $formattedAccrued = number_format($this->leaveItems[$i]['accrued'], 2, '.', ' ');
                    }
                    
                    $formattedAdjustment= '';
                    if ($this->leaveItems[$i]['adjustment'] !== '') {
                        $formattedAdjustment = number_format($this->leaveItems[$i]['adjustment'], 2, '.', ' ');
                    }
                    
                    $unit = '';
                    if ($this->leaveItems[$i]['unit'] !== '') {
                        if (strtolower($this->leaveItems[$i]['unit']) === 'days') {
                            $unit= ' d';
                        }
                        else if (strtolower($this->leaveItems[$i]['unit']) === 'hours') {
                            $unit= ' h';
                        }
                    }
                    
                    $this->pdf->SetXY(10, $leave);
                    $this->pdf->SetTextColor(60,60,60);
                    $this->pdf->SetFillColor(255,255,255);
                    $this->pdf->Cell(90, 5, $this->leaveItems[$i]['name'], 'LBR', 1, 'L', 0, '', 1, false, 'T', 'C');
                    $this->pdf->SetXY(95, $leave);
                    $this->pdf->Cell(30, 5, $formattedAdjustment . $unit, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                    $this->pdf->SetXY(120, $leave);
                    $this->pdf->Cell(30, 5, $formattedTaken . $unit, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                    $this->pdf->SetXY(145, $leave);
                    $this->pdf->Cell(30, 5, $formattedAccrued . $unit, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                    $this->pdf->SetXY(170, $leave);
                    $this->pdf->Cell(30, 5, $formattedBalance . $unit, 'BR', 1, 'R', 0, '', 1, false, 'T', 'C');
                    
                    $leave = $leave + 5;
                }
            }
            
            return true;
        }
        
        //
        // PRIVATE FUNCTIONS
        //
        
    }
    
?>