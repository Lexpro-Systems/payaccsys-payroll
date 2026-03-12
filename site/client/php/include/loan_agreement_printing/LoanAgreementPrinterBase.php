<?php
    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use tcpdf module
    System::useModule('tcpdf');
    
    //
    // BASE LOAN AGREEMENT PRINTER CLASS
    //
    
    abstract class LoanAgreementPrinterBase {
        
        //
        // MEMBER VARIABLES
        //
        
        protected $pdf;
        protected $config;
        
        protected $companyLogo;
        protected $companyName;
        protected $companyRegistrationNumber;
        protected $companyRepresentative;
        protected $companyRepresentativeIdNumber;
        protected $employeeFullNames;
        protected $employeeIdNumber;
        protected $loanPrincipalAmount;
        protected $loanPaidOverDate;
        protected $loanInstalmentAmount;
        protected $loanInstalmentPeriod;
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Class constructor
        //
        // config           An array containing user config values for the irp5.
        public function __construct(array $config = []) {
            $this->pdf = null;
            $this->config = $config;
            
            $this->companyLogo = null;
            $this->companyName = '';
            $this->companyRegistrationNumber = '';
            $this->companyRepresentative = '';
            $this->companyRepresentativeIdNumber = '';
            $this->employeeFullNames = '';
            $this->employeeIdNumber = '';
            $this->loanPrincipalAmount = '';
            $this->loanPaidOverDate = '';
            $this->loanInstalmentAmount = '';
            $this->loanInstalmentPeriod = '';
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
        
        // Function to set the company logo
        //
        // companyLogo              The logo of the company
        public function setCompanyLogo(string $companyLogo) {
            $this->companyLogo = $companyLogo;
        }
        
        // Function to set the company name
        //
        // companyName                      The name of the company
        public function setCompanyName(string $companyName) {
            $this->companyName = $companyName;
        }
        
        // Function to set the company registration number
        //
        // companyRegistrationNumber        The registration number of the company
        public function setCompanyRegistrationNumber(string $companyRegistrationNumber) {
            $this->companyRegistrationNumber = $companyRegistrationNumber;
        }
        
        // Function to set the company representative
        //
        // companyRepresentative            The full names of the company representative
        public function setCompanyRepresentative(string $companyRepresentative) {
            $this->companyRepresentative = $companyRepresentative;
        }
        
        // Function to set the company representative identity number
        //
        // companyRepresentativeIdNumber    The identity number of the company representative
        public function setCompanyRepresentativeIdNumber(string $companyRepresentativeIdNumber) {
            $this->companyRepresentativeIdNumber = $companyRepresentativeIdNumber;
        }
        
        // Function to set the employee full names
        //
        // employeeFullNames                The full names of the employee
        public function setEmployeeFullNames(string $employeeFullNames) {
            $this->employeeFullNames = $employeeFullNames;
        }
        
        // Function to set the employee identity number
        //
        // employeeIdNumber                 The identity number of the employee
        public function setEmployeeIdNumber(string $employeeIdNumber) {
            $this->employeeIdNumber = $employeeIdNumber;
        }
        
        // Function to set the total loan amount
        //
        // loanPrincipalAmount              The principal amount of the loan
        public function setLoanPrincipalAmount(string $loanPrincipalAmount) {
            $this->loanPrincipalAmount = $loanPrincipalAmount;
        }
        
        // Function to set the date the loan amount was paid over to the employee
        //
        // loanPaidOverDate                 The date the loan amount was paid over to the employee
        public function setLoanPaidOverDate(string $loanPaidOverDate) {
            $this->loanPaidOverDate = $loanPaidOverDate;
        }
        
        // Function to set the loan instalment amount
        //
        // loanInstalmentAmount            The loan instalment amount
        public function setLoanInstalmentAmount(string $loanInstalmentAmount) {
            $this->loanInstalmentAmount = $loanInstalmentAmount;
        }
        
        // Function to set the loan instalment period
        //
        // loanInstalmentPeriod            The loan instalment period
        public function setLoanInstalmentPeriod(string $loanInstalmentPeriod) {
            $this->loanInstalmentPeriod = $loanInstalmentPeriod;
        }
        
        // Function to print a loan agreement in PDF format.
        //
        // return               True if the loan agreement was printed and false otherwise.
        abstract public function printLoanAgreement() : bool;
        
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
            
            $this->companyLogo = null;
            $this->companyName = '';
            $this->companyRegistrationNumber = '';
            $this->companyRepresentative = '';
            $this->companyRepresentativeIdNumber = '';
            $this->employeeFullNames = '';
            $this->employeeIdNumber = '';
            $this->loanPrincipalAmount = '';
            $this->loanPaidOverDate = '';
            $this->loanInstalmentAmount = '';
            $this->loanInstalmentPeriod = '';
        }
        
        // Class destructor
        public function __destruct() {
            
        }
    }
?>