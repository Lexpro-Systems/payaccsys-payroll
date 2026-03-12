<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use tcpdf module
    System::useModule('tcpdf');
    
    //
    // BASE PAYSLIP PRINTER CLASS
    //
    
    abstract class PayslipPrinterBase {
        
        //
        // MEMBER VARIABLES
        //
        
        protected $pdf;
        protected $config;
        
        protected $companyName;
        protected $companyAddress;
        protected $companyTel;
        protected $companyEmail;
        protected $companyLogo;
        protected $companyFaxNumber;
        protected $companyCellNumber;
        protected $companyWebsite;
        
        protected $toDate;
        protected $fromDate;
        
        protected $employeeFullName;
        protected $employeeFirstName;
        protected $employeeLastName;
        protected $employeeDepartment;
        protected $employeePosition;
        protected $employeeEmploymentStart;
        protected $employeeAddress;
        protected $employeeEmail;
        protected $employeeCell;
        protected $employeeAlias;
        protected $employeeIncomeTaxNumber;
        protected $employeeIdNumber;
        protected $employeePassportNumber;
        protected $employeeBankName;
        protected $employeeAccountNumber;
        protected $employeeBankCode;
        protected $employeeCode;
        protected $employeePeriod;
        
        protected $payslipFromDate;
        protected $payslipToDate;
        protected $payslipItems;
        
        protected $leaveItems;
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Class constructor
        //
        // config           An array containing user config values for the payslip.
        public function __construct(array $config = []) {
            $this->pdf = null;
            $this->config = $config;
            
            $this->companyName = '';
            $this->companyAddress = [];
            $this->companyTel = '';
            $this->companyEmail = '';
            $this->companyLogo = null;
            $this->companyFaxNumber = '';
            $this->companyCellNumber = '';
            $this->companyWebsite = '';
            
            $this->employeeFullName = '';
            $this->employeeFirstName = '';
            $this->employeeLastName = '';
            $this->employeeDepartment = '';
            $this->employeePosition = '';
            $this->employeeEmploymentStart = '';
            $this->employeeAddress = [];
            $this->employeeEmail = '';
            $this->employeeCell = '';
            $this->employeeAlias = '';
            $this->employeeIncomeTaxNumber = '';
            $this->employeeIdNumber = '';
            $this->employeePassportNumber = '';
            $this->employeeBankName = '';
            $this->employeeAccountNumber = '';
            $this->employeeCode = '';
            $this->employeePeriod = '';
            
            $this->payslipFromDate = '';
            $this->payslipToDate = '';
            $this->payslipItems = [];
            
            $this->leaveItems = [];
        }
        
        // Function to get available config parameters for the payslip.
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
        // config              Array containing user config values for the payslip.
        public function setConfig(array $config) {
            $this->config = $config;
        }
        
        // Function to set the company name
        //
        // companyName              The name of the company
        public function setCompanyName(string $companyName) {
            $this->companyName = $companyName;
        }
        
        // Function to set the company address
        //
        // line1                    Company address line 1
        // line2                    Company address line 2
        // line3                    Company address line 3
        // line4                    Company address line 4
        public function setCompanyAddress(string $line1, string $line2, string $line3, string $line4) {
            $this->companyAddress = [$line1, $line2, $line3, $line4];
        }
        
        // Function to set the company tel
        //
        // companyTel              The tel number of the company
        public function setCompanyTel(string $companyTel) {
            $this->companyTel = $companyTel;
        }
        
        // Function to set the company email
        //
        // companyEmail              The email of the company
        public function setCompanyEmail(string $companyEmail) {
            $this->companyEmail = $companyEmail;
        }
        
        // Function to set the cell number website
        //
        // companyCellNumber              The cell number of the company
        public function setCompanyCellNumber(string $companyCellNumber) {
            $this->companyCellNumber = $companyCellNumber;
        }
        
        // Function to set the employee bank number
        //
        // employeeAccountNumber              The bank number of the employee
        public function setEmployeeAccountNumber(string $employeeAccountNumber) {
            $this->employeeAccountNumber = $employeeAccountNumber;
        }
        
        // Function to set the company logo
        //
        // companyLogo              The logo of the company
        public function setCompanyLogo(string $companyLogo) {
            $this->companyLogo = $companyLogo;
        }
        
        // Function to set the company fax number
        //
        // companyFaxNumber              The logo of the company
        public function setCompanyFaxNumber(string $companyFaxNumber) {
            $this->companyFaxNumber = $companyFaxNumber;
        }
        
        // Function to set the employee name
        //
        // employeeFullName              The name of the employee
        public function setEmployeeFullName(string $employeeFullName) {
            $this->employeeFullName = $employeeFullName;
        }
        
        // Function to set the employee name
        //
        // employeeFirstName              The name of the employee
        public function setEmployeeFirstName(string $employeeFirstName) {
            $this->employeeFirstName = $employeeFirstName;
        }
        
        // Function to set the employee name
        //
        // employeeLastName              The name of the employee
        public function setEmployeeLastName(string $employeeLastName) {
            $this->employeeLastName = $employeeLastName;
        }
        // Function to set the website
        //
        // companyWebsite              The website of the company
        public function setCompanyWebsite(string $companyWebsite) {
            $this->companyWebsite = $companyWebsite;
        }
        
        // Function to set the employee department
        //
        // employeeDepartment              The department of the employee
        public function setEmployeeDepartment(string $employeeDepartment) {
            $this->employeeDepartment = $employeeDepartment;
        }
        
        // Function to set the employee alias
        //
        // employeeAlias              The alias of the employee
        public function setEmployeeAlias(string $employeeAlias) {
            $this->employeeAlias = $employeeAlias;
        }
        
        // Function to set the employee position
        //
        // employeePosition              The position of the employee
        public function setEmployeePosition(string $employeePosition) {
            $this->employeePosition = $employeePosition;
        }
        
        // Function to set the employee employment start
        //
        // employeeEmploymentStart              The employment start of the employee
        public function setEmployeeEmploymentStart(string $employeeEmploymentStart) {
            $this->employeeEmploymentStart = $employeeEmploymentStart;
        }
        
        // Function to set the employee bank number
        //
        // employeeBankName              The bank number of the employee
        public function setEmployeeBankName(string $employeeBankName) {
            $this->employeeBankName = $employeeBankName;
        }
        
        // Function to set the employee id number
        //
        // employeeIdNumber              The id number of the employee
        public function setEmployeeIdNumber(string $employeeIdNumber) {
            $this->employeeIdNumber = $employeeIdNumber;
        }
        
        // Function to set the employee passport number
        //
        // employeePassportNumber       The passport number of the employee
        public function setEmployeePassportNumber(string $employeePassportNumber) {
            $this->employeePassportNumber = $employeePassportNumber;
        }
        
        // Function to set the employee email
        //
        // employeeEmail              The email of the employee
        public function setEmployeeEmail(string $employeeEmail) {
            $this->employeeEmail = $employeeEmail;
        }
        
        // Function to set the employee income tax number
        //
        // employeeIncomeTaxNumber      The income tax number of the employee
        public function setEmployeeIncomeTaxNumber(string $employeeIncomeTaxNumber) {
            $this->employeeIncomeTaxNumber = $employeeIncomeTaxNumber;
        }
        
        // Function to set the employee bank number
        //
        // employeeBankCode              The bank code of the employee
        public function setEmployeeBankCode(string $employeeBankCode) {
            $this->employeeBankCode = $employeeBankCode;
        }
        
        // Function to set the employee cell
        //
        // employeeCell              The cell of the employee
        public function setEmployeeCell(string $employeeCell) {
            $this->employeeCell = $employeeCell;
        }
        
        // Function to set the employee code
        //
        // employeeCode              The code of the employee
        public function setEmployeeCode(string $employeeCode) {
            $this->employeeCode = $employeeCode;
        }
        
        // Function to set the period
        //
        // employeePeriod              The period of the employee
        public function setEmployeePeriod(string $employeePeriod) {
            $this->employeePeriod = $employeePeriod;
        }
        
        
        // Function to set the company address
        //
        // line1            The line1 of the employee
        // line2            The line2 of the employee
        // line3            The line3 of the employee
        // line4            The line4 of the employee
        public function setEmployeeAddress(string $line1, string $line2, string $line3, string $line4) {
            $this->employeeAddress = [$line1, $line2, $line3, $line4];
        }
        
        // Function to add a payslip item
        //
        // type                     The payslip item's type.
        // description              The payslip item's description.
        // amount                   The payslip item's amount
        // includeInNettPay         Whether the amount should be included in nett pay
        public function addPayslipItem(string $type, string $description, string $amount, string $includeInNettPay) {
            $this->payslipItems[] = ['type' => $type, 'description' => $description, 'amount' => $amount, 'includeInNettPay' => $includeInNettPay];
        }
        
        // Function to set the payslip from date
        //
        // fromDate              The from date of the payslip
        public function setPayslipFromDate(string $fromDate) {
            $this->fromDate = $fromDate;
        }
        
        // Function to set the payslip to date
        //
        // toDate              The to date of the payslip
        public function setPayslipToDate(string $toDate) {
            $this->toDate = $toDate;
        }
        
        // Function to add a leave item
        //
        // name                     The leave item's name
        // adjustment               Amount of leave adjusted/reset
        // accrued              The amount of leave recieved
        // taken              The amount of leave taken
        // balance          The amount of leave available
        // unit                     Whether the leave is in hour or days
        public function addLeaveItem(string $name, string $adjustment, string $accrued, string $taken, string $balance, string $unit) {
            $this->leaveItems[] = [
                'name' => $name, 
                'adjustment' => $adjustment,
                'accrued' => $accrued,
                'taken' => $taken, 
                'balance' => $balance, 
                'unit' => $unit
            ];
        }
        
        // Function to print a payslip in PDF format.
        //
        // return               True if the payslip was printed and false otherwise.
        abstract public function printPayslip() : bool;
        
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
            
            $this->companyName = '';
            $this->companyAddress = [];
            $this->companyTel = '';
            $this->companyEmail = '';
            $this->companyLogo = null;
            $this->companyFaxNumber = '';
            $this->companyCellNumber = '';
            $this->companyWebsite = '';
            
            $this->employeeFullName = '';
            $this->employeeFirstName = '';
            $this->employeeLastName = '';
            $this->employeeDepartment = '';
            $this->employeePosition = '';
            $this->employeeEmploymentStart = '';
            $this->employeeAddress = [];
            $this->employeeEmail = '';
            $this->employeeAlias = '';
            $this->employeeIdNumber = '';
            $this->employeePassportNumber = '';
            $this->employeeBankName = '';
            $this->employeeAccountNumber = '';
            $this->employeeBankCode = '';
            $this->employeeCode = '';
            $this->employeePeriod = '';
            
            $this->payslipFromDate = '';
            $this->payslipToDate = '';
            $this->payslipItems = [];
            
            $this->leaveItems = [];
        }
        
        // Class destructor
        public function __destruct() {
            
        }
    }
?>