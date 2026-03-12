<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use tcpdf module
    System::useModule('tcpdf');
    
    //
    // BASE IRP5 PRINTER CLASS
    //
    
    abstract class TaxCertificatePrinterBase {
        
        //
        // MEMBER VARIABLES
        //
        
        protected $pdf;
        protected $config;
        
        protected $certificateType;
        protected $companyName;
        protected $companyPayeReference;
        protected $companySdlReference;
        protected $companyUifReference;
        protected $companyDiplomaticIndemnity;
        protected $companyAddress;
        protected $companyLogo;
        
        protected $employeeNature;
        protected $employeeSurname;
        protected $employeeInitials;
        protected $employeeFullNames;
        protected $employeeIdNumber;
        protected $employeePassportNumber;
        protected $employeeBirthDate;
        protected $employeeCompanyNumber;
        protected $employeeIncomeTaxNumber;
        protected $employeeNumber;
        protected $employeeAddress;
        protected $employeeEmployedFromDate;
        protected $employeeEmployedToDate;
        protected $employeeVoluntaryOverDeduction;
        
        protected $irp5Number;
        protected $taxYear;
        protected $taxYearPayPeriods;
        protected $taxYearPayPeriodsWorked;
        protected $fixedRateIncome;
        protected $directiveNumber;
        protected $directive1;
        protected $directive2;
        protected $directive3;
        
        protected $incomeItems;
        protected $totalTaxableIncome;
        protected $totalNonTaxableIncome;
        protected $totalRetirementFundingIncome;
        protected $totalNonRetirementFundingIncome;
        protected $totalIncome;
        
        protected $deductionItems;
        protected $totalDeductions;
        protected $totalSite;
        protected $totalPaye;
        protected $totalUif;
        protected $totalSdl;
        protected $totalTax;
        protected $totalPayeOnLumpSums;
        protected $totalMedicalSchemeCredit;
        protected $totalMedicalExpensesCredit;
        protected $reasonForNonDeduction;
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Class constructor
        //
        // config           An array containing user config values for the irp5.
        public function __construct(array $config = []) {
            $this->pdf = null;
            $this->config = $config;
            
            $this->certificateType = '';
            $this->companyName = '';
            $this->companyPayeReference = '';
            $this->companySdlReference = '';
            $this->companyUifReference = '';
            $this->companyDiplomaticIndemnity = '';
            $this->companyAddress = [];
            $this->companyLogo = null;
            
            $this->employeeNature = '';
            $this->employeeSurname = '';
            $this->employeeInitials = '';
            $this->employeeFullNames = '';
            $this->employeeIdNumber = '';
            $this->employeePassportNumber = '';
            $this->employeeBirthDate = '';
            $this->employeeCompanyNumber = '';
            $this->employeeIncomeTaxNumber = '';
            $this->employeeNumber = '';
            $this->employeeAddress = [];
            $this->employeeEmployedFromDate = '';
            $this->employeeEmployedToDate = '';
            $this->employeeVoluntaryOverDeduction = '';
            
            $this->irp5Number = '';
            $this->taxYear = '';
            $this->taxYearPayPeriods = '';
            $this->taxYearPayPeriodsWorked = '';
            $this->fixedRateIncome = '';
            $this->directiveNumber = '';
            $this->directive1 = '';
            $this->directive2 = '';
            $this->directive3 = '';
            
            $this->incomeItems = [];
            $this->totalTaxableIncome = '';
            $this->totalNonTaxableIncome = '';
            $this->totalRetirementFundingIncome = '';
            $this->totalNonRetirementFundingIncome = '';
            $this->totalIncome = '';
                
            $this->deductionItems = [];
            $this->deductionItems = '';
            $this->totalSite = '';
            $this->totalPaye = '';
            $this->totalSdl = '';
            $this->totalUif = '';
            $this->totalTax = '';
            $this->totalPayeOnLumpSums = '';
            $this->totalMedicalSchemeCredit = '';
            $this->totalMedicalExpensesCredit = '';
            $this->reasonForNonDeduction = '';
        }
        
        // Function to get available config parameters for the irp5.
        //
        // return           Returns an array of config parameters.  The array can be empty.
        //
        //                  configParameters = [
        //                      ['name' => 'param 1', type => 'float'],
        //                      ['name' => 'param 2', type => 'string'],
        //                      ['name' => 'param 3', type => 'color'],
        //                      .
        //                      .
        //                      .
        //                  ];
        public function getConfigParameters() {
            return [];
        }
        
        // Function to set the config array
        //
        // config              Array containing user config values for the irp5.
        public function setConfig(array $config) {
            $this->config = $config;
        }
        
        // Function to set the certificate type
        //
        // certificateType              The type of the certificate
        public function setCertificateType(string $certificateType) {
            $this->certificateType = strtoupper(substr($certificateType, 0, 70));
        }
        
        // Function to set the company name
        //
        // companyName              The name of the company
        public function setCompanyName(string $companyName) {
            $this->companyName = strtoupper(substr($companyName, 0, 70));
        }
        
        // Function to set the company PAYE reference
        //
        // companyPayeReference     The PAYE reference of the company
        public function setCompanyPayeReference(string $companyPayeReference) {
            $companyPayeReference = str_replace(' ', '', $companyPayeReference);
            $companyPayeReference = str_replace('/', '', $companyPayeReference);
            $this->companyPayeReference = strtoupper(substr($companyPayeReference, 0, 10));
        }
        
        // Function to set the company SDL reference
        //
        // companySdlReference      The SDL reference of the company
        public function setCompanySdlReference(string $companySdlReference) {
            $this->companySdlReference = strtoupper(substr($companySdlReference, 0, 10));
        }
        
        // Function to set the company UIF reference
        //
        // companyUifReference      The UIF reference of the company
        public function setCompanyUifReference(string $companyUifReference) {
            $this->companyUifReference = strtoupper(substr($companyUifReference, 0, 10));
        }
        
        // Function to set the company diplomatic indemnity status
        //
        // companyDiplomaticIndemnity   The company diplomatic indemnity status (Y, J, or N)
        public function setCompanyDiplomaticIndemnity(string $companyDiplomaticIndemnity) {
            $this->companyDiplomaticIndemnity = $companyDiplomaticIndemnity;
        }
        
        // Function to set the company address
        //
        // line1                    Company address line 1
        // line2                    Company address line 2
        // line3                    Company address line 3
        // line4                    Company address line 4
        // code                     Company postal code
        public function setCompanyAddress(string $line1, string $line2, string $line3, string $line4, string $code) {
            // $line1 = strtoupper(substr($line1, 0 , 35));
            // $line2 = strtoupper(substr($line2, 0 , 35));
            // $line3 = strtoupper(substr($line3, 0 , 35));
            // $line4 = strtoupper(substr($line4, 0 , 35));
            // $code = strtoupper(substr($code, 0 , 4));
            $line1 = strtoupper($line1);
            $line2 = strtoupper($line2);
            $line3 = strtoupper($line3);
            $line4 = strtoupper($line4);
            $code = strtoupper($code);
            
            $this->companyAddress = [$line1, $line2, $line3, $line4, $code];
        }
        
        // Function to set the company logo
        //
        // companyLogo              The logo of the company
        public function setCompanyLogo(string $companyLogo) {
            $this->companyLogo = $companyLogo;
        }
        
        // Function to set the employee nature
        //
        // employeeNature           The nature of the employee (A, B, C, D, E, F, G, H, or K)
        public function setEmployeeNature(string $employeeNature) {
            $this->employeeNature = $employeeNature;
        }
        
        // Function to set the employee surname
        //
        // employeeSurname          The surname of the employee
        public function setEmployeeSurname(string $employeeSurname) {
            $this->employeeSurname = strtoupper(substr($employeeSurname, 0, 70));
        }
        
        // Function to set the employee initials
        //
        // employeeInitials         The initials of the employee
        public function setEmployeeInitials(string $employeeInitials) {
            $this->employeeInitials = strtoupper($employeeInitials);
        }
        
        // Function to set the employee full names
        //
        // employeeFullNames         The full names of the employee
        public function setEmployeeFullNames(string $employeeFullNames) {
            $this->employeeFullNames = strtoupper(substr($employeeFullNames, 0, 70));
        }
        
        // Function to set the employee ID number
        //
        // employeeIdNumber         The ID number of the employee
        public function setEmployeeIdNumber(string $employeeIdNumber) {
            $this->employeeIdNumber = strtoupper(str_replace(' ', '', $employeeIdNumber));
        }
        
        // Function to set the employee passport number
        //
        // employeePassportNumber   The passport number of the employee
        public function setEmployeePassportNumber(string $employeePassportNumber) {
            $this->employeePassportNumber = strtoupper($employeePassportNumber);
        }
        
        // Function to set the employee birth date
        //
        // employeeBirthDate        The birth date of the employee
        public function setEmployeeBirthDate(string $employeeBirthDate) {
            $this->employeeBirthDate = $employeeBirthDate;
        }
        
        // Function to set the employee company number
        //
        // employeeCompanyNumber    The company number of the employee
        public function setEmployeeCompanyNumber(string $employeeCompanyNumber) {
            $this->employeeCompanyNumber = $employeeCompanyNumber;
        }
        
        // Function to set the employee income tax number
        //
        // employeeIncomeTaxNumber  The income tax number of the employee
        public function setEmployeeIncomeTaxNumber(string $employeeIncomeTaxNumber) {
            $this->employeeIncomeTaxNumber = $employeeIncomeTaxNumber;
        }
        
        // Function to set the employee number
        //
        // employeeNumber           The number of the employee
        public function setEmployeeNumber(string $employeeNumber) {
            $this->employeeNumber = $employeeNumber;
        }
        
        // Function to set the employee address
        //
        // line1                    Company address line 1
        // line2                    Company address line 2
        // line3                    Company address line 3
        // line4                    Company address line 4
        // code                     Company postal code
        public function setEmployeeAddress(string $line1, string $line2, string $line3, string $line4, string $code) {
            // $line1 = strtoupper(substr($line1, 0 , 35));
            // $line2 = strtoupper(substr($line2, 0 , 35));
            // $line3 = strtoupper(substr($line3, 0 , 35));
            // $line4 = strtoupper(substr($line4, 0 , 35));
            // $code = strtoupper(substr($code, 0 , 4));
            $line1 = strtoupper($line1);
            $line2 = strtoupper($line2);
            $line3 = strtoupper($line3);
            $line4 = strtoupper($line4);
            $code = strtoupper($code);
            
            $this->employeeAddress = [$line1, $line2, $line3, $line4, $code];
        }
        
        // Function to set the employee employed from date
        //
        // employeeEmployedFromDate     The employed from date of the employee
        public function setEmployeeEmployedFromDate(string $employeeEmployedFromDate) {
            $this->employeeEmployedFromDate = $employeeEmployedFromDate;
        }
        
        // Function to set the employee employed to date
        //
        // employeeEmployedToDate       The employed from date of the employee
        public function setEmployeeEmployedToDate(string $employeeEmployedToDate) {
            $this->employeeEmployedToDate = $employeeEmployedToDate;
        }
        
        // Function to set the employee voluntary over deducation status
        //
        // employeeVoluntaryOverDeduction   The employee voluntary over deducation status (Y, J, or N)
        public function setEmployeeVoluntaryOverDeduction(string $employeeVoluntaryOverDeduction) {
            $this->employeeVoluntaryOverDeduction = $employeeVoluntaryOverDeduction;
        }
        
        // Function to set the IRP5 number
        //
        // irp5Number               The IRP5 number
        public function setIrp5Number(string $irp5Number) {
            $this->irp5Number = $irp5Number;
        }
        
        // Function to set the tax year
        //
        // taxYear              The tax year
        public function setTaxYear(string $taxYear) {
            $this->taxYear = $taxYear;
        }
        
        // Function to set the tax year pay periods
        //
        // taxYearPayPeriods    The tax year pay periods
        public function setTaxYearPayPeriods(string $taxYearPayPeriods) {
            $this->taxYearPayPeriods = $taxYearPayPeriods;
        }
        
        // Function to set the tax year pay periods worked
        //
        // taxYearPayPeriodsWorked      The tax year pay periods worked
        public function setTaxYearPayPeriodsWorked(string $taxYearPayPeriodsWorked) {
            $this->taxYearPayPeriodsWorked = $taxYearPayPeriodsWorked;
        }
        
        // Function to set the fixed rate income
        //
        // fixedRateIncome          The fixed rate income
        public function setFixedRateIncome(string $fixedRateIncome) {
            $this->fixedRateIncome = $fixedRateIncome;
        }
        
        // Function to set the directive number
        //
        // directiveNumber          The directive number
        public function setDirectiveNumber(string $directiveNumber) {
            $this->directiveNumber = $directiveNumber;
        }
        
        // Function to set the #1 directive
        //
        // directive1               The directive
        public function setDirective1(string $directive1) {
            $this->directive1 = $directive1;
        }
        
        // Function to set the #2 directive
        //
        // directive2               The directive
        public function setDirective2(string $directive2) {
            $this->directive2 = $directive2;
        }
        
        // Function to set the #3 directive
        //
        // directive3               The directive
        public function setDirective3(string $directive3) {
            $this->directive3 = $directive3;
        }
        
        // Function to add an income item
        //
        // code                     The income item's code
        // description              The income item's description
        // rfiIndicator             The income item's rf indicator (Y, J, or N)
        // amount                   The income item's amount
        public function addIncomeItem(string $code, string $description, string $rfiIndicator, string $amount) {
            $this->incomeItems[] = ['code' => $code, 'description' => $description, 'rfiIndicator' => $rfiIndicator, 'amount' => $amount];
        }
        
        // Function to set the total taxable income
        //
        // totalTaxableIncome       The total taxable income
        public function setTotalTaxableIncome(string $totalTaxableIncome) {
            $this->totalTaxableIncome = $totalTaxableIncome;
        }
        
        // Function to set the total non-taxable income
        //
        // totalNonTaxableIncome            The total non-taxable income
        public function setTotalNonTaxableIncome(string $totalNonTaxableIncome) {
            $this->totalNonTaxableIncome = $totalNonTaxableIncome;
        }
        
        // Function to set the total retirement funding income
        //
        // totalRetirementFundingIncome     The total retirement funding income
        public function setTotalRetirementFundingIncome(string $totalRetirementFundingIncome) {
            $this->totalRetirementFundingIncome = $totalRetirementFundingIncome;
        }
        
        // Function to set the total non-retirement funding income
        //
        // totalNonRetirementFundingIncome      The total non-retirement funding income
        public function setTotalNonRetirementFundingIncome(string $totalNonRetirementFundingIncome) {
            $this->totalNonRetirementFundingIncome = $totalNonRetirementFundingIncome;
        }
        
        // Function to set the total income
        //
        // totalIncome          The total income
        public function setTotalIncome(string $totalIncome) {
            $this->totalIncome = $totalIncome;
        }
        
        // Function to add a deduction item
        //
        // code                     The deduction item's code
        // description              The deduction item's description
        // clearanceNumber          The deduction item's clearance number
        // amount                   The deduction item's amount
        public function addDeductionItem(string $code, string $description, string $clearanceNumber, string $amount) {
            $this->deductionItems[] = ['code' => $code, 'description' => $description, 'clearanceNumber' => $clearanceNumber, 'amount' => $amount];
        }
        
        // Function to set the total deductions
        //
        // totalDeductions          The SITE deduction
        public function setTotalDeductions(string $totalDeductions) {
            $this->totalDeductions = $totalDeductions;
        }
        
        // Function to set the total SITE deduction
        //
        // totalSite        The total SITE deduction
        public function setTotalSite(string $totalSite) {
            $this->totalSite = $totalSite;
        }
        
        // Function to set the total PAYE deduction
        //
        // totalPaye        The total PAYE deduction
        public function setTotalPaye(string $totalPaye) {
            $this->totalPaye = $totalPaye;
        }
        
        // Function to set the total SDL deduction
        //
        // totalSdl         The total SDL deduction
        public function setTotalSdl(string $totalSdl) {
            $this->totalSdl = $totalSdl;
        }
        
        // Function to set the total UIF deduction
        //
        // totalUif         The total UIF deduction
        public function setTotalUif(string $totalUif) {
            $this->totalUif = $totalUif;
        }
        
        // Function to set the total tax deduction
        //
        // totalTax    The total tax deduction
        public function setTotalTax(string $totalTax) {
            $this->totalTax = $totalTax;
        }
        
        // Function to set the total PAYE on lump sums deduction
        //
        // totalPayeOnLumpSums  The total PAYE on lump sums deduction
        public function setTotalPayeOnLumpSums(string $totalPayeOnLumpSums) {
            $this->totalPayeOnLumpSums = $totalPayeOnLumpSums;
        }
        
        // Function to set the total medical scheme credit
        //
        // totalMedicalSchemeCredit     The total medical scheme credit
        public function setTotalMedicalSchemeCredit(string $totalMedicalSchemeCredit) {
            $this->totalMedicalSchemeCredit = $totalMedicalSchemeCredit;
        }
        
        // Function to set the total medical expenses credit
        //
        // totalMedicalExpensesCredit   The total medical expenses credit
        public function setTotalMedicalExpensesCredit(string $totalMedicalExpensesCredit) {
            $this->totalMedicalExpensesCredit = $totalMedicalExpensesCredit;
        }
        
        // Function to set the reason for non-deduction
        //
        // reasonForNonDeduction        The reason for employee tax non-deduction
        public function setReasonForNonDeduction(string $reasonForNonDeduction) {
            $this->reasonForNonDeduction = $reasonForNonDeduction;
        }
        
        // Function to print a irp5 in PDF format.
        //
        // return               True if the irp5 was printed and false otherwise.
        abstract public function printTaxCertificate() : bool;
        
        // Output the document
        //
        // fileName             The name of the PDF file
        // return               True if the file was successfully sent to output and false otherwise.
        public function output( string $fileName ) : bool {
            if( $this->pdf === null ) return false;
            
            //Close and output PDF document
            $this->pdf->Output($fileName, 'I');
            
            return true;
        }
        
        // Save the document to a file
        //
        // fileName             The name of the PDF file
        // return               True if the file was saved and false otherwise.
        public function saveToFile( string $fileName ) : bool {
            if( $this->pdf === null ) return false;
            
            //Close and output PDF document
            $this->pdf->Output($fileName, 'F');
            
            return true;
        }
        
        // Function to clear all variables
        public function clear() {
            $this->config = [];
            
            $this->certificateType = '';
            $this->companyName = '';
            $this->companyPayeReference = '';
            $this->companySdlReference = '';
            $this->companyUifReference = '';
            $this->companyDiplomaticIndemnity = '';
            $this->companyAddress = [];
            $this->companyLogo = null;
            
            $this->employeeNature = '';
            $this->employeeSurname = '';
            $this->employeeInitials = '';
            $this->employeeFullNames = '';
            $this->employeeIdNumber = '';
            $this->employeePassportNumber = '';
            $this->employeeBirthDate = '';
            $this->employeeCompanyNumber = '';
            $this->employeeIncomeTaxNumber = '';
            $this->employeeNumber = '';
            $this->employeeAddress = [];
            $this->employeeEmployedFromDate = '';
            $this->employeeEmployedToDate = '';
            $this->employeeVoluntaryOverDeduction = '';
            
            $this->irp5Number = '';
            $this->taxYear = '';
            $this->taxYearPayPeriods = '';
            $this->taxYearPayPeriodsWorked = '';
            $this->fixedRateIncome = '';
            $this->directiveNumber = '';
            $this->directive1 = '';
            $this->directive2 = '';
            $this->directive3 = '';
            
            $this->incomeItems = [];
            $this->totalTaxableIncome = '';
            $this->totalNonTaxableIncome = '';
            $this->totalRetirementFundingIncome = '';
            $this->totalNonRetirementFundingIncome = '';
            $this->totalIncome = '';
                
            $this->deductionItems = [];
            $this->totalDeductions = '';
            $this->totalSite = '';
            $this->totalPaye = '';
            $this->totalSdl = '';
            $this->totalUif = '';
            $this->totalTax = '';
            $this->totalPayeOnLumpSums = '';
            $this->totalMedicalSchemeCredit = '';
            $this->totalMedicalExpensesCredit = '';
            $this->reasonForNonDeduction = '';
        }
        
        // Class destructor
        public function __destruct() {
            
        }
    }
?>