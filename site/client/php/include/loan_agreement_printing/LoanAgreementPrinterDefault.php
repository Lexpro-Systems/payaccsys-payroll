<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('loan_agreement_printing/LoanAgreementPrinterBase.php');
    
    // Create our PdfPrinter class
    class LoanAgreementPrinter extends LoanAgreementPrinterBase {
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get available config parameters for the irp5.
        //
        // NOTE: See irp5PrinterBase.getConfigParameters for more details.
        public function getConfigParameters() {
            return [
                ['name' => 'logoImage', 'description' => 'Logo Image', 'type' => 'image', 'default' => null],
                ['name' => 'logoImageSize', 'description' => 'Logo Size (%)', 'type' => 'float', 'default' => 100]
            ];  
        }
        
        // Function to print a irp5 in PDF format.
        public function printLoanAgreement() : bool {
            // Delete any existing PDF data
            if( $this->pdf !== null ) unset($this->pdf);
            
            // Create a new PDF object
            $this->pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
            
            // Set document information
            $this->pdf->SetCreator(PDF_CREATOR);
            $this->pdf->SetAuthor('Lexpro Payroll');
            $this->pdf->SetTitle($this->companyName);
            $this->pdf->SetSubject('');
            $this->pdf->SetKeywords('');
            
            // Remove default header/footer
            $this->pdf->setPrintHeader(false);
            $this->pdf->setPrintFooter(false);
            
            // Set default monospaced font
            $this->pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
            
            // Set margins
            $this->pdf->SetMargins(0,0,0,0);
            
            // Set some language-dependent strings (optional)
            if (@file_exists(dirname(__FILE__).'/lang/eng.php')) {
                require_once(dirname(__FILE__).'/lang/eng.php');
                $this->pdf->setLanguageArray($l);
            }
            
            // Set font
            $this->pdf->SetFont('helvetica', 'BI', 20);
            
            // Set auto page breaks
            $this->pdf->SetAutoPageBreak(FALSE, 0);
            
            // Add a page
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
            }
            
            // NOTE: Uncomment this block to print out config data for testing
            // print_r('=========================================================================================');
            // print_r($this->config);
            // print_r('=========================================================================================');
            // $this->pdf->Cell(50, 10, [], 0, 1, 'T', 0, 'L', 1);
            
            // Heading color rgb
            $r = 0;
            $g = 0;
            $b = 0;
            
            // Overwrite the default color with the config color, if any
            // if(isset($config['headingColor'])) {
            //     list($r, $g, $b) = sscanf($config['headingColor'], "#%02x%02x%02x");
            // }
            
            $marginX = 20;
            $marginY = 15;
            $numberSpacing = 10;
            $currentX = $marginX;
            $currentY = $marginY;
            $lineHeight = 4;
            $headingTextSize = 16;
            $subHeadingTextSize = 14;
            $defaultTextSize = 12;
            $pageWidth = $this->pdf->GetPageWidth() - ($marginX * 2);
            $pageHeight = $this->pdf->GetPageHeight() - ($marginY * 2);
            $headingBackgroundColor = [200, 200, 200];
            $highlightColor = [232, 232, 232];
            $emptyField = '_________________________';
            
            // Draw the logo, if any
            if (isset($config['logoImage'])) {
                $this->pdf->Image($imageDir, $marginX + $pageWidth - $imageWidth, $marginY, $imageWidth, $imageHeight, 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
                // $this->pdf->Image($imageDir, $logoX, $logoY, $imageWidth, $imageHeight , 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
            }
            
            // Set the document heading
            $this->pdf->SetTextColor(0, 0, 0);
            $this->pdf->SetFont('helvetica', 'B' , $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'Memorandum of agreement', 0, 0, 'L', false, '', 1, false, 'T', 'C');
            $currentY = $currentY + ($lineHeight * 2.5);
            
            $linestyle = array('width' => 0.5, 'cap' => 'butt', 'join' => 'miter', 'dash' => 0, 'color' => array(0, 0, 0));
            $this->pdf->Line($marginX, $currentY, 110, $currentY, $linestyle);
            $currentY = $currentY + ($lineHeight * 3);
           
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'Agreed on between:', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 3);
            
            // Set the company (lender) details
            $textValue = $emptyField;
            if( $this->companyName !== '' ) {
                $textValue = $this->companyName;
            }
            
            if( $this->companyRegistrationNumber !== '' ) {
                $textValue = $textValue . '  –  REG NR. ' . $this->companyRegistrationNumber;
            }
            else {
                $textValue = $textValue . '  –  REG NR. ' . $emptyField;
            }
            
            $this->pdf->SetFont('helvetica', 'B' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, $textValue, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, '(“The Lender”)', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Set the company representative
            $textValue = 'Herein represented by  –  ';
            if( $this->companyRepresentative !== '' ) {
                $textValue = $this->companyRepresentative;
            }
            else {
                $textValue = $textValue . $emptyField;
            }
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, $textValue, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            $textValue = 'ID NR:  ';
            if( $this->companyRepresentativeIdNumber !== '' ) {
                $textValue = $this->companyRepresentativeIdNumber;
            }
            else {
                $textValue = $textValue . $emptyField;
            }
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, $textValue, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'And', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Set the employee (borrower) details
            $textValue = $emptyField;
            if( $this->companyName !== '' ) {
                $textValue = $this->employeeFullNames;
            }
            
            if( $this->employeeIdNumber !== '' ) {
                $textValue = $textValue . '  –  ID NR: ' . $this->employeeIdNumber;
            }
            else {
                $textValue = $textValue . '  –  ID NR: ' . $emptyField;
            }
            
            $this->pdf->SetFont('helvetica', 'B' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, $textValue, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, '(“The Borrower”)', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 4);
            
            // Set the first paragraph heading
            $this->pdf->SetFont('helvetica', 'B' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($numberSpacing, $lineHeight, '1', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', 'BU' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            $this->pdf->Cell($pageWidth - $numberSpacing, $lineHeight, 'Amount of loan', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Set the first paragraph text
            $textValue = 'The Lender loans The Borrower the amount of R';
            if( $this->loanPrincipalAmount !== '' ) {
                $textValue = $textValue . number_format($this->loanPrincipalAmount, 2, '.', ',');
            }
            else {
                $textValue = $textValue . $emptyField;
            }
            $textValue = $textValue . ' on the terms set forth in this agreement. This amount was paid ';
            $textValue = $textValue . 'by The Lender to the Borrower on ';
            if( $this->loanPaidOverDate !== '' ) {
                $textValue = $textValue . $this->loanPaidOverDate;
            }
            else {
                $textValue = $textValue . $emptyField;
            }
            $textValue = $textValue . '.     ';
             
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            // MultiCell($w, $h, $txt, $border=0, $align='J', $fill=0, $ln=1, $x='', $y='', $reseth=true, $stretch=0, $ishtml=false, $autopadding=true, $maxh=0)
            $this->pdf->MultiCell($pageWidth - $numberSpacing, $lineHeight * 3, $textValue, 0, 'J', 0, 1, '', '', true);
            $currentY = $currentY + ($lineHeight * 8);
            
            // Set the second paragraph heading
            $this->pdf->SetFont('helvetica', 'B' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($numberSpacing, $lineHeight, '2', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', 'BU' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            $this->pdf->Cell($pageWidth - $numberSpacing, $lineHeight, 'Period of loan', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Set the second paragraph text
            $textValue = 'The Borrower undertakes to repay the full amount in ';
            if( $this->loanInstalmentPeriod !== '' ) {
                $textValue = $textValue .$this->loanInstalmentPeriod;
            }
            else {
                $textValue = $textValue . 'monthly';
            }
            $textValue = $textValue . ' payments of R';
            if( $this->loanInstalmentAmount !== '' ) {
                $textValue = $textValue . number_format($this->loanInstalmentAmount, 2, '.', ',');
            }
            else {
                $textValue = $textValue . $emptyField;
            }
            $textValue = $textValue . '. These payments will be deducted directly from the salary of The Borrower.   ';
             
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            // MultiCell($w, $h, $txt, $border=0, $align='J', $fill=0, $ln=1, $x='', $y='', $reseth=true, $stretch=0, $ishtml=false, $autopadding=true, $maxh=0)
            $this->pdf->MultiCell($pageWidth - $numberSpacing, $lineHeight * 3, $textValue, 0, 'J', 0, 1, '', '', true);
            $currentY = $currentY + ($lineHeight * 7);
            
            // Set the third paragraph heading
            $this->pdf->SetFont('helvetica', 'B' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($numberSpacing, $lineHeight, '3', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', 'BU' , $subHeadingTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            $this->pdf->Cell($pageWidth - $numberSpacing, $lineHeight, 'The entirety of the agreement', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Set the third paragraph text
            $textValue = 'The parties confirm that this constitutes the entirety of the agreement and that no ';
            $textValue = $textValue . 'amendment or addition to the agreement will by valid unless done so in ';
            $textValue = $textValue . 'writing and signed by both parties.                                ';
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX + $numberSpacing, $currentY);
            // MultiCell($w, $h, $txt, $border=0, $align='J', $fill=0, $ln=1, $x='', $y='', $reseth=true, $stretch=0, $ishtml=false, $autopadding=true, $maxh=0)
            $this->pdf->MultiCell($pageWidth - $numberSpacing, $lineHeight * 4, $textValue, 0, 'J', 0, 1, '', '', true);
            $currentY = $currentY + ($lineHeight * 8);
            
            // Create the footer
            $textValue = 'SIGNED at ____________________ on this, the _____ day of ____________________ 20_____.';
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, $textValue, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 8);
            
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(50, $lineHeight, '______________________________', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $this->pdf->SetXY($marginX + $pageWidth - 50, $currentY);
            $this->pdf->Cell(50, $lineHeight, '______________________________', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            $this->pdf->SetFont('helvetica', '' , $defaultTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(50, $lineHeight, 'Lender Signature', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $this->pdf->SetXY($marginX + $pageWidth - 50, $currentY);
            $this->pdf->Cell(50, $lineHeight, 'Borrower Signature', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            
            return true;
        }
        
        //
        // PRIVATE FUNCTIONS
        //
        
    }
    
?>