<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('tax_certificate_printing/TaxCertificatePrinterBase.php');
    
    // Create our PdfPrinter class
    class TaxCertificatePrinter extends TaxCertificatePrinterBase {
        
        //
        // MEMBER VARIABLES
        //
        
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get available config parameters for the irp5.
        //
        // NOTE: See irp5PrinterBase.getConfigParameters for more details.
        public function getConfigParameters() {
            return [
                ['name' => 'logoImage', 'description' => 'Logo Image', 'type' => 'image', 'default' => null],
                ['name' => 'logoX', 'description' => 'Logo X', 'type' => 'float', 'default' => 10],
                ['name' => 'logoY', 'description' => 'Logo Y', 'type' => 'float', 'default' => 10],
                ['name' => 'logoImageSize', 'description' => 'Logo Size (%)', 'type' => 'float', 'default' => 100],
                ['name' => 'headingColor', 'description' => 'Heading Color', 'type' => 'color', 'default' => '#1B2C64']
            ];  
        }
        
        // Function to print a irp5 in PDF format.
        public function printTaxCertificate() : bool {
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
            
            $marginX = 10;
            $marginY = 10;
            $textPadding = 1;
            $itemPadding = 10;
            $currentX = $marginX;
            $currentY = $marginY;
            $lineHeight = 3.5;
            $curveRad = 1;
            $headingTextSize = 8;
            $labelTextSize = 6;
            $valueTextSize = 10;
            $pageWidth = $this->pdf->GetPageWidth() - ($marginX * 2);
            $pageHeight = $this->pdf->GetPageHeight() - ($marginY * 2);
            $headingBackgroundColor = [200, 200, 200];
            $highlightColor = [232, 232, 232];
            
            // Draw the logo, if any
            if (isset($config['logoImage'])) {
                $this->pdf->Image($imageDir, $marginX, $marginY, $pageWidth, 12, 'PNG', '', '', false, 300, '', false, false, 0, 'C', false, false);
            }
            
            // Top right heading
            $this->pdf->RoundedRect( $marginX + $pageWidth - 25, $currentY, 25, 8, $curveRad, '1111', 'DF', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetTextColor(255, 255, 255);
            $this->pdf->SetFont('helvetica', 'B' , 16);
            $this->pdf->SetXY($marginX + $pageWidth - 25, $currentY + 4);
            $this->pdf->Cell(25, 8, $this->certificateType, 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + 16;
            
            // Set document heading
            $this->pdf->SetTextColor(0, 0, 0);
            $this->pdf->SetFont('helvetica', 'B' , 11);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'EMPLOYEES TAX CERTIFICATE / WERKNEMERSBELASTINGSERTIFIKAAT', 0, 0, 'C', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.5);
            
            // Set employer information heading
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'EMPLOYER INFORMATION / WERKGEWER INLIGTING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            
            // Display company name
            $this->pdf->RoundedRect( $currentX, $currentY, $pageWidth, $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell($pageWidth - ($textPadding * 2), $lineHeight * 2, $this->companyName, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell($pageWidth - ($textPadding * 2), $lineHeight * 0.5, 'TRADING OR OTHER NAME', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell($pageWidth - ($textPadding * 2), $lineHeight * 0.5, 'HANDELS- OF ANDER NAAM', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            $tempY = $currentY;
            
            // Display the IRP 5 number
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->irp5Number, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'IRP 5 NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'IRP 5 NOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the reference number
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->companyPayeReference, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'REFERENCE NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'VERWYSINGSNOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the tax year
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->taxYear, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'TAX YEAR', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'BELASTINGJAAR', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display whether the employee enjoys diplomatic indemnity
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->companyDiplomaticIndemnity, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EMPLOYER ENJOYS DIPLOMATIC INDEMNITY', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'WERKNEMER GENIET DIPLOMATIEKE VRYWARING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the employer business address
            $this->pdf->RoundedRect( $marginX + ($pageWidth / 2) + ($itemPadding / 2), $tempY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 9, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $currentX = $marginX + ($pageWidth / 2) + ($itemPadding / 2);
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EMPLOYER BUSINESS ADDRESS / WERKGEWER BESIGHEIDSADRES', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $tempY = $tempY + ($lineHeight * 1.375);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->companyAddress[0], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->companyAddress[1], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->companyAddress[2], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->companyAddress[3], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $currentX = $currentX + ((($pageWidth / 2) - ($itemPadding / 2)) / 2);
            $codeLabelWidth = ((($pageWidth / 2) - ($itemPadding / 2)) / 4);
            $this->pdf->SetXY($currentX + $codeLabelWidth + $textPadding, $tempY);
            $this->pdf->Cell(((($pageWidth / 2) - ($itemPadding / 2)) / 2) - ($textPadding * 2) - $codeLabelWidth, $lineHeight * 1.5, $this->companyAddress[4], 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.75) - $lineHeight;
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell($codeLabelWidth, $lineHeight * 0.5, 'POSTAL CODE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell($codeLabelWidth, $lineHeight * 0.5, 'POSKODE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Set employee information heading
            $currentY = $currentY + ($lineHeight * 1);
            $currentX = $marginX;
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'EMPLOYEE INFORMATION / WERKNEMER INLIGTING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            
            // Display the nature of the employee
            $customPadding = $itemPadding / 2;
            $tempY = $currentY;
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeNature, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'NATURE OF PERSON', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'AARD VAN PERSOON', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the employee surname
            $tempY = $currentY;
            $currentX = $marginX + ($pageWidth / 4) + ($customPadding / 2);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth * (3/4)) - ($customPadding  / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeSurname, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EMPLOYEE SURNAME OR TRADING NAME', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'WERKNEMER SE VAN OF HANDELSNAAM', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $tempY + ($lineHeight * 1);
            
            // Display the employee first names
            $customPadding = $itemPadding / 2;
            $tempY = $currentY;
            $currentX = $marginX;
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth * (3/4)) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeFullNames, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'FIRST TWO NAMES', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth * (3/4)) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EERSTE TWEE NAME', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1);
            
            // Display the employee initials
            $tempY = $currentY;
            $currentX = $marginX + ($pageWidth * (3/4)) + ($customPadding / 2);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeInitials, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding  / 2) - ($textPadding * 2), $lineHeight * 0.5, 'INITIALS', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'VOORLETTERS', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $tempY + ($lineHeight * 1);
            
            // Display the employee identity number
            $tempY = $currentY;
            $currentX = $marginX;
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeIdNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'IDENTITY NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'IDENTITEITSNOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the employee passport number
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeePassportNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PASSPORT NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PASPOORT NOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the employee date of birth
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeBirthDate, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'DATE OF BIRTH', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'GEBOORTEDATUM', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the employee company number
            $this->pdf->RoundedRect( $currentX, $currentY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $currentY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeCompanyNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $currentY = $currentY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'COMPANY / CC / TRUST NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $currentY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'MAATSKAPPY / CC / TRUST NOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the employee business address
            $this->pdf->RoundedRect( $marginX + ($pageWidth / 2) + ($itemPadding / 2), $tempY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 9, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $currentX = $marginX + ($pageWidth / 2) + ($itemPadding / 2);
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EMPLOYEES RESIDENTIAL ADDRESS / WERKNEMER SE RESIDENSIELE ADRES', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $tempY = $tempY + ($lineHeight * 1.375);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->employeeAddress[0], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->employeeAddress[1], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->employeeAddress[2], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 1.5, $this->employeeAddress[3], ['B' => array('width' => 0.25, 'color' => $highlightColor, 'cap' => 'butt')], 0, 'R', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1.5);
            $currentX = $currentX + ((($pageWidth / 2) - ($itemPadding / 2)) / 2);
            $codeLabelWidth = ((($pageWidth / 2) - ($itemPadding / 2)) / 4);
            $this->pdf->SetXY($currentX + $codeLabelWidth + $textPadding, $tempY);
            $this->pdf->Cell(((($pageWidth / 2) - ($itemPadding / 2)) / 2) - ($textPadding * 2) - $codeLabelWidth, $lineHeight * 1.5, $this->employeeAddress[4], 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.75) - $lineHeight;
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell($codeLabelWidth, $lineHeight * 0.5, 'POSTAL CODE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell($codeLabelWidth, $lineHeight * 0.5, 'POSKODE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the employee income tax number
            $tempY = $currentY;
            $currentX = $marginX;
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeIncomeTaxNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'INCOME TAX NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'INKOMSTEBELASTINGNOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 1);
            
            // Display the employee number
            $tempY = $currentY;
            $currentX = $marginX + ($pageWidth / 2) + ($itemPadding / 2);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 2) - ($itemPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'EMPLOYEE NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 2) - ($itemPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'WERKNEMERNOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $tempY + ($lineHeight * 1);
            
            // Set tax calculation information heading
            $currentY = $currentY + ($lineHeight * 1);
            $currentX = $marginX;
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'TAX CALCULATION INFORMATION / BELASTING BEREKENING INLIGTING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 0.75);
            
            // Display the period employed from
            $customPadding = $itemPadding / 3;
            $tempY = $currentY;
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 3) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeEmployedFromDate, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PERIOD EMPLOYED FROM', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'TYDPERK IN DIENS VANAF', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the period employed to
            $tempY = $currentY;
            $currentX = $marginX + ($pageWidth / 3) + ($customPadding / 3);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 3) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeEmployedToDate, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PERIOD EMPLOYED TO', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'TYDPERK IN DIENS TOT', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the voluntary over-deduction status
            $tempY = $currentY;
            $currentX = $currentX + ($pageWidth / 3) + ($customPadding / 3);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 3) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->employeeVoluntaryOverDeduction, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'VOLUNTARY OVER-DEDUCTION', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 3) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'VRYWILLIGE OOR-AFTREKKING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $tempY + ($lineHeight * 1);
            
            // Display the pay periods in the tax year
            $customPadding = $itemPadding / 4;
            $currentX = $marginX;
            $tempY = $currentY;
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->taxYearPayPeriods, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PAY PERIODS IN TAX YEAR', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'PERIODES IN BELASTINGJAAR', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the number of pay periods worked
            $tempY = $currentY;
            $currentX = $marginX + ($pageWidth / 4) + ($customPadding / 4);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->taxYearPayPeriodsWorked, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'NUMBER OF PAY PERIODS WORKED', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'AANTAL PERIODES GEWERK', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the fixed rate of income
            $tempY = $currentY;
            $currentX = $currentX + ($pageWidth / 4) + ($customPadding / 4);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->fixedRateIncome, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'FIXED RATE INCOME', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'VASTE KOERS INKOMSTE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            
            // Display the directive number
            $tempY = $currentY;
            $currentX = $currentX + ($pageWidth / 4) + ($customPadding / 4);
            $this->pdf->RoundedRect( $currentX, $tempY, ($pageWidth / 4) - ($customPadding / 2), $lineHeight * 2, $curveRad, '1111', '', ['width' => 0.1, 'color' => [$r, $g, $b]], [$r, $g, $b] );
            $this->pdf->SetFont('helvetica', '' , $valueTextSize);
            $this->pdf->SetXY($currentX + $textPadding, $tempY + ($lineHeight * 1));
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 2, $this->directiveNumber, 0, 0, 'R', false, '', 1, false, 'C', 'C');
            $this->pdf->SetFont('helvetica', '' , $labelTextSize);
            $tempY = $tempY + ($lineHeight * 0.625);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'DIRECTIVE NUMBER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $tempY = $tempY + ($lineHeight * 0.75);
            $this->pdf->SetXY($currentX + $textPadding, $tempY);
            $this->pdf->Cell(($pageWidth / 4) - ($customPadding / 2) - ($textPadding * 2), $lineHeight * 0.5, 'AANWYSINGNOMMER', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $tempY + ($lineHeight * 2);
            
            // Is there NOT enough space for the next section?
            if( ($currentY + $lineHeight * 2.5) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Set the income sources heading
            $currentX = $marginX;
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'INCOME SOURCES / INKOMSTEBRONNE', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Create the income sources table headings
            $col1Width = 12/100;
            $col2Width = 67/100;
            $col3Width = 0/100;
            $col4Width = 21/100;
            $borderStyle = [
                'T' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'R' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'B' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, 'CODE / KODE', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
            // Don't draw the left border for subsequent columns
            // $borderStyle['L']['width'] = 0.00;
            // if (($key = array_search('L', $borderStyle)) !== false) {
            //     unset($borderStyle[$key]);
            // }
            $currentX = $currentX + ($pageWidth * $col1Width);
            
            if( $col2Width > 0 ) {
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'DESCRIPTION / BESKRYWING', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
                $currentX = $currentX + ($pageWidth * $col2Width);
            }
            
            if( $col3Width > 0 ) {
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, 'RF IND / UFD IND', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
                $currentX = $currentX + ($pageWidth * $col3Width);
            }
            
            if( $col4Width > 0 ) {
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell(($pageWidth * $col4Width), $lineHeight * 1.25, 'AMOUNT / BEDRAG', $borderStyle, 0, 'R', true, '', 1, false, 'C', 'C');
                $currentY = $currentY + ($lineHeight * 1.25);
            }
            
            // Add all the income sources
            $this->pdf->SetFont('helvetica', '', $headingTextSize);
            $borderStyle = [
                'R' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt'],
                'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
            $fill = true;
            for( $i = 0; $i < count($this->incomeItems); $i++) {
                // Is there NOT enough space for another item?
                if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) {
                    // Add a new page and reset the coordinates
                    $this->pdf->AddPage();
                    $currentY = $marginY;
                }
                
                // Is it the last item?
                if( $i == (count($this->incomeItems) - 1) ) {
                    // Make the bottom border black
                    $borderStyle['B']['color'] = [0, 0, 0];
                }
                
                // Set alternating filling for lines
                $fill = !$fill;
                
                // Start at the beginning of the line
                $currentX = $marginX;
                
                // Set the first coumn value
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, $this->incomeItems[$i]['code'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                $currentX = $currentX + ($pageWidth * $col1Width);
                
                // Don't draw the left border for subsequent columns
                // $borderStyle['L']['width'] = 0.00;
                
                // Set the second column value
                if( $col2Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, $this->incomeItems[$i]['description'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                    $currentX = $currentX + ($pageWidth * $col2Width);
                }
                
                // Set the third column value
                if( $col3Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->incomeItems[$i]['rfiIndicator'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                    $currentX = $currentX + ($pageWidth * $col3Width);
                }
                
                // Set the fourth column value
                if( $col4Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col4Width), $lineHeight * 1.25, $this->incomeItems[$i]['amount'], $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
                }
                
                // Go to the next row
                $currentY = $currentY + ($lineHeight * 1.25);
            }
            $currentY = $currentY + ($lineHeight * 1);
            
            // Is there NOT enough space for the next section?
            if( ($currentY + $lineHeight * 2.5) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Set the total remuneration heading
            $currentX = $marginX;
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'GROSS REMUNERATION / BRUTO BESOLDIGING', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Create the total remuneration table headings
            $col1Width = 12/100;
            $col2Width = 67/100;
            $col3Width = 21/100;
            $borderStyle = [
                'T' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'R' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'B' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, 'CODE / KODE', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
            // Don't draw the left border for subsequent columns
            // $borderStyle['L']['width'] = 0.00;
            // if (($key = array_search('L', $borderStyle)) !== false) {
            //     unset($borderStyle[$key]);
            // }
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'DESCRIPTION / BESKRYWING', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, 'AMOUNT / BEDRAG', $borderStyle, 0, 'R', true, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Set font and border for total remuneration items
            $this->pdf->SetFont('helvetica', '', $headingTextSize);
            $borderStyle = [
                'R' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt'],
                'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
            $fill = true;
            
            // // Is there NOT enough space for the next row?
            // if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
            //     $this->pdf->AddPage(); 
            //     $currentY = $marginY; 
            // }
            
            // // Display the row details
            // $fill = !$fill;
            // $currentX = $marginX;
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '3695', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // // $borderStyle['L']['width'] = 0.00;
            // $currentX = $currentX + ($pageWidth * $col1Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'GROSS TAXABLE ANNUAL PAYMENTS / BRUTO BELASBARE JAARLIKSE BETALINGS', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $currentX = $currentX + ($pageWidth * $col2Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalTaxableIncome, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            // $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '3696', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'GROSS NON-TAXABLE INCOME', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalNonTaxableIncome, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // NOTE: 
            //
            // The following fields are only applicable to years of assessment prior to 2017
            
            // // Is there NOT enough space for the next row?
            // if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
            //     $this->pdf->AddPage(); 
            //     $currentY = $marginY; 
            // }
            
            // // Display the row details
            // $fill = !$fill;
            // $currentX = $marginX;
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '3697', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // // $borderStyle['L']['width'] = 0.00;
            // $currentX = $currentX + ($pageWidth * $col1Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'GROSS RETIREMENT FUNDING INCOME / BRUTO UITTREDINGSFUNDERINGSDIENS INKOMSTE', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $currentX = $currentX + ($pageWidth * $col2Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalRetirementFundingIncome, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            // $currentY = $currentY + ($lineHeight * 1.25);
            
            // // Is there NOT enough space for the next row?
            // if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
            //     $this->pdf->AddPage(); 
            //     $currentY = $marginY; 
            // }
            
            // // Display the row details
            // $fill = !$fill;
            // $currentX = $marginX;
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '3698', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // // $borderStyle['L']['width'] = 0.00;
            // $currentX = $currentX + ($pageWidth * $col1Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'GROSS NON-RETIREMENT FUNDING INCOME / BRUTO NIE-UITTREDINGSFUNDERINGSDIENS INKOMSTE', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $currentX = $currentX + ($pageWidth * $col2Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalNonRetirementFundingIncome, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            // $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $borderStyle['B']['color'] = [0, 0, 0];
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '3699', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'GROSS EMPLOYMENT INCOME', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalTaxableIncome, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 2);
            
            // Are there any deductions?
            if( count($this->deductionItems) > 0 ) {
                // Is there NOT enough space for the next section?
                if( ($currentY + $lineHeight * 2.5) > ($marginY + $pageHeight) ) { 
                    $this->pdf->AddPage(); 
                    $currentY = $marginY; 
                }
                
                // Set the deduction sources heading
                $currentX = $marginX;
                $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell($pageWidth, $lineHeight, 'DEDUCTIONS / AFTREKKINGS', 0, 0, 'L', false, '', 1, false, 'C', 'C');
                $currentY = $currentY + ($lineHeight * 1.25);
                
                // Create the deduction sources table headings
                $col1Width = 12/100;
                $col2Width = 67/100;
                $col3Width = 0/100;
                $col4Width = 21/100;
                $borderStyle = [
                    'T' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                    'R' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                    'B' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                    'L' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt']
                ];
                $this->pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
                $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
                
                $this->pdf->SetXY($currentX, $currentY);
                $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, 'CODE / KODE', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
                // Don't draw the left border for subsequent columns
                // $borderStyle['L']['width'] = 0.00;
                // if (($key = array_search('L', $borderStyle)) !== false) {
                //     unset($borderStyle[$key]);
                // }
                $currentX = $currentX + ($pageWidth * $col1Width);
                
                if( $col2Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'DESCRIPTION / BESKRYWING', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
                    $currentX = $currentX + ($pageWidth * $col2Width);
                }
                
                if( $col3Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, 'CLEARANCE NO', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
                    $currentX = $currentX + ($pageWidth * $col3Width);
                }
                
                if( $col4Width > 0 ) {
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col4Width), $lineHeight * 1.25, 'AMOUNT / BEDRAG', $borderStyle, 0, 'R', true, '', 1, false, 'C', 'C');
                }
                
                $currentY = $currentY + ($lineHeight * 1.25);
                
                // Add all the deduction sources
                $this->pdf->SetFont('helvetica', '', $headingTextSize);
                $borderStyle = [
                    'R' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt'],
                    'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                    'L' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt']
                ];
                $this->pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
                $fill = true;
                for( $i = 0; $i < count($this->deductionItems); $i++) {
                    // Is there NOT enough space for another item?
                    if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) {
                        // Add a new page and reset the coordinates
                        $this->pdf->AddPage();
                        $currentY = $marginY;
                    }
                    
                    // Is it the last item?
                    if( $i == (count($this->deductionItems) - 1) ) {
                        // Make the bottom border black
                        $borderStyle['B']['color'] = [0, 0, 0];
                    }
                    
                    // Set alternating filling for lines
                    $fill = !$fill;
                    
                    // Start at the beginning of the line
                    $currentX = $marginX;
                    
                    // Set the first coumn value
                    $this->pdf->SetXY($currentX, $currentY);
                    $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, $this->deductionItems[$i]['code'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                    $currentX = $currentX + ($pageWidth * $col1Width);
                    
                    // Don't draw the left border for subsequent columns
                    // $borderStyle['L']['width'] = 0.00;
                    
                    // Set the second column value
                    if( $col2Width > 0 ) {
                        $this->pdf->SetXY($currentX, $currentY);
                        $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, $this->deductionItems[$i]['description'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                        $currentX = $currentX + ($pageWidth * $col2Width);
                    }
                    
                    // Set the third column value
                    if( $col3Width > 0 ) {
                        $this->pdf->SetXY($currentX, $currentY);
                        $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->deductionItems[$i]['rfiIndicator'], $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
                        $currentX = $currentX + ($pageWidth * $col3Width);
                    }
                    
                    // Set the fourth column value
                    if( $col4Width > 0 ) {
                        $this->pdf->SetXY($currentX, $currentY);
                        $this->pdf->Cell(($pageWidth * $col4Width), $lineHeight * 1.25, $this->deductionItems[$i]['amount'], $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
                    }
                    
                    // Go to the next row
                    $currentY = $currentY + ($lineHeight * 1.25);
                }
                $currentY = $currentY + ($lineHeight * 1);
            }
            
            // Is there NOT enough space for the next section?
            if( ($currentY + $lineHeight * 2.5) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Set the employees tax deduction heading
            $currentX = $marginX;
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell($pageWidth, $lineHeight, 'EMPLOYEES TAX DEDUCTIONS / WERKNEMERSBELASTING AFGETREK', 0, 0, 'L', false, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Create the total remuneration table headings
            $col1Width = 12/100;
            $col2Width = 67/100;
            $col3Width = 21/100;
            $borderStyle = [
                'T' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'R' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'B' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0, 0, 0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
            $this->pdf->SetFont('helvetica', 'B', $headingTextSize);
            
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, 'CODE / KODE', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
            // Don't draw the left border for subsequent columns
            // $borderStyle['L']['width'] = 0.00;
            // if (($key = array_search('L', $borderStyle)) !== false) {
            //     unset($borderStyle[$key]);
            // }
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'DESCRIPTION / BESKRYWING', $borderStyle, 0, 'L', true, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, 'AMOUNT / BEDRAG', $borderStyle, 0, 'R', true, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Set font and border for total remuneration items
            $this->pdf->SetFont('helvetica', '', $headingTextSize);
            $borderStyle = [
                'R' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt'],
                'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => [0,0,0], 'cap' => 'butt']
            ];
            $this->pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
            $fill = true;
            
            // NOTE:
            //
            // THe following items are no longer applicable
            
            // // Is there NOT enough space for the next row?
            // if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
            //     $this->pdf->AddPage(); 
            //     $currentY = $marginY; 
            // }
            
            // // Display the row details
            // $fill = !$fill;
            // $currentX = $marginX;
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4497', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // // $borderStyle['L']['width'] = 0.00;
            // $currentX = $currentX + ($pageWidth * $col1Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'TOTAL DEDUCTIONS AND CONTRUBUTIONS / TOTALE AFTREKKINGS EN BYDRAES', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $currentX = $currentX + ($pageWidth * $col2Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalDeductions, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            // $currentY = $currentY + ($lineHeight * 1.25);
            
            // // Is there NOT enough space for the next row?
            // if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
            //     $this->pdf->AddPage(); 
            //     $currentY = $marginY; 
            // }
            
            // // Display the row details
            // $fill = !$fill;
            // $currentX = $marginX;
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4101', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // // $borderStyle['L']['width'] = 0.00;
            // $currentX = $currentX + ($pageWidth * $col1Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'STANDARD INCOME TAX ON EMPLOYEES -SITE / STANDAARD INKOMSTE BELASTING OP WERKNEMERS -SIBW', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $currentX = $currentX + ($pageWidth * $col2Width);
            // $this->pdf->SetXY($currentX, $currentY);
            // $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalSite, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            // $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4102', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'PAY AS YOU EARN - PAYE', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalPaye, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4115', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'PAYE ON LUMP SUMS', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalPayeOnLumpSums, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4116', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'MEDICAL SCHEME FEES TAX CREDIT', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalMedicalSchemeCredit, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4120', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'ADDITIONAL MEDICAL EXPENSES TAX CREDIT', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalMedicalExpensesCredit, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4141', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'EMPLOYER AND EMPLOYEE UIF CONTRIBUTION', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalUif, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4142', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'EMPLOYER SDL CONTRIBUTION', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, $this->totalSdl, $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Is there NOT enough space for the next row?
            if( ($currentY + $lineHeight * 1.25) > ($marginY + $pageHeight) ) { 
                $this->pdf->AddPage(); 
                $currentY = $marginY; 
            }
            
            // Display the row details
            $borderStyle['B']['color'] = [0, 0, 0];
            $fill = !$fill;
            $currentX = $marginX;
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col1Width), $lineHeight * 1.25, '4149', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            // $borderStyle['L']['width'] = 0.00;
            $currentX = $currentX + ($pageWidth * $col1Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col2Width), $lineHeight * 1.25, 'TOTAL TAX, SDL, AND UIF', $borderStyle, 0, 'L', $fill, '', 1, false, 'C', 'C');
            $currentX = $currentX + ($pageWidth * $col2Width);
            $this->pdf->SetXY($currentX, $currentY);
            $this->pdf->Cell(($pageWidth * $col3Width), $lineHeight * 1.25, ($this->totalTax + $this->totalSdl + $this->totalUif), $borderStyle, 0, 'R', $fill, '', 1, false, 'C', 'C');
            $currentY = $currentY + ($lineHeight * 1.25);
            
            return true;
        }
        
        //
        // PRIVATE FUNCTIONS
        //
        
    }
    
?>