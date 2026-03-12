<?php
System::denyDirectAccess();
System::includeFile('Util.php');
System::includeFile('employee_import/EmployeeImportData.php');
System::includeFile('employee_import/EmployeeColumnIndex.php');
System::includeFile('NumberMask.php');

/**
 * Employee Import validation class
 * Responsible for checking the data that will be imported into the system
 */
class EmployeeImportValidator {
    // Hold Database Connection 
    private $db;
    private EmployeeImportData $employee;
    private $user;
    private bool $doesEmployeeExists;
    
    public function __construct($db, EmployeeImportData $employee, $user) {
        $this->db = $db;
        $this->employee = $employee;
        $this->user = $user;
        $this->doesEmployeeExists = false;
    }

    private function validatePersonalDetails(int $row, array &$errors) : void {
        
        if ($this->employee->code !== "") {
            // Load employee code from config
            $config = [
                'employee_code_mask' => null
            ];
            $configItemsLoaded = Util::loadConfigValues($this->db, $config);
            if( $configItemsLoaded !== count($config) ) {
                die(json_encode(['ok' => false, 'error' => 'Loading config failed.']));
            }
            // Create a NumberMask object to handle the configured mask.
            $numberMask = new NumberMask( $config['employee_code_mask'] ); 
            // Check that the employee code provided is valid
            if( $numberMask->validate($this->employee->code) !== true ) {
                $errors [] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::CODE,
                    'row' => $row,
                    'value' => $this->employee->code,
                    'expectedValue' => 'Number',
                    'description' => 'Invalid Employee code',
                    'fullDescription' => 'Employees code must be a unique code '
                ];
            }
        }
        
        if (!in_array(strtoupper($this->employee->titleCode) ,array("ADV","DR","MR","MISS","MRS","PROF","MS"))) {
            $errors [] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::TITLE_CODE,
                'row' => $row,
                'value' => $this->employee->titleCode,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid title',
                'fullDescription' => 'The title is required and must be  one of the following: <br> <br> Adv <br> Dr <br>  Miss <br> Mr <br> Mrs <br>Ms <br> Prof '
            ];
        }
        if ($this->employee->initials == "") {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INITIALS,
                'row' => $row,
                'value' => $this->employee->initials,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid Initials',
                'fullDescription' => 'Initials is required and must be text value'
            ];
        }

        if ($this->employee->fullName == "") {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::FULL_NAME,
                'row' => $row,
                'value' => $this->employee->fullName,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid full names',
                'fullDescription' => 'Full names are required must be text value '
            ];
        }
       

        if ($this->employee->lastName == "") {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::LAST_NAME,
                'row' => $row,
                'value' => $this->employee->lastName,
                'expectedValue' => "Any text value",
                'description' => 'Invalid last name ',
                'fullDescription' => 'Last names are required must be text value '
            ];
        }

        if ($this->employee->alias == "") {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::ALIAS,
                'row' => $row,
                'value' => $this->employee->alias,
                'expectedValue' => "Any text value",
                'description' => 'Invalid alias',
                'fullDescription' => 'Alias are required must be text value ',
            ];
        }
        if (($this->employee->idNumber == "" && $this->employee->passportNumber == "")) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::ID_NUMBER,
                'row' => $row,
                'value' => $this->employee->idNumber,
                'expectedValue' => 'Numeric for Id Number or Alphanumeric for Passport',
                'description' => 'Invalid Id number and passport number',
                'fullDescription' => 'Id number is required "numeric" or passport number is required "alphanumeric"'
            ];
        }

        if ($this->employee->idNumber != "" && (Util::ValidateSouthAfricanId($this->employee->idNumber)['error'])) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::ID_NUMBER,
                'row' => $row,
                'value' => $this->employee->idNumber,
                'expectedValue' => 'Numeric',
                'description' => 'Invalid South African ID',
                'fullDescription' => 'South African ID Must be numeric'
            ];
        }
       
        if ($this->employee->passportNumber != "") {
            if (!preg_match("/^[a-zA-Z0-9]+/",$this->employee->passportNumber)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::PASSPORT_NUMBER,
                    'row' => $row,
                    'value' => $this->employee->passportNumber,
                    'expectedValue' => 'Alpha Numeric or Numeric',
                    'description' => 'Invalid passport number',
                    'fullDescription' => 'Must be Alphanumeric or Numeric'
                ];
            }

            if (!Util::isCountryValid($this->employee->passportCountry, $this->db)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::PASSPORT_COUNTRY,
                    'row' => $row,
                    'value' => $this->employee->passportCountry,
                    'expectedValue' => 'Any text value',
                    'description' => 'Invalid passport country',
                    'fullDescription' => 'Must be text'
                ];
            }
        }
        
        if (!Util::isDateValid($this->employee->dateOfBirth)) {
            $errors[] = [
                'isCritical' => true,
                'column' =>  EmployeeColumnIndex::DATE_OF_BIRTH,
                'row' => $row,
                'value' => $this->employee->dateOfBirth,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid date of birth',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        if ($this->employee->idNumber != "" && !Util::isDateOfBirthSameAsID($this->employee->idNumber,$this->employee->dateOfBirth)) {
            $errors[] = [
                'isCritical' => true,
                'column' =>  EmployeeColumnIndex::DATE_OF_BIRTH,
                'row' => $row,
                'value' => $this->employee->dateOfBirth,
                'expectedValue' => 'Valid Date of Birth and it match the ID',
                'description' => 'Date of Birth does not match with ID ',
                'fullDescription' => 'Must be same date of Birth as what the ID says '
            ];
        }

        // if ($this->employee->cellNumber == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::CELL_NUMBER,
        //         'row' => $row,
        //         'value' => $this->employee->cellNumber,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid cell number',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->emailAddress == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::EMAIL_ADDRESS,
        //         'row' => $row,
        //         'value' => $this->employee->emailAddress,
        //         'expectedValue' => 'Any valid email address',
        //         'description' => 'Invalid email address',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }
        
    }
    /**
     * Function to validate Physical Address
     */
    private function validatePhysicalAddress(int $row, array &$errors) :  void {

        // if ($this->employee->physicalAddressUnit == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::PHYSICAL_ADDRESS_UNIT,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressUnit,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address unit',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->physicalAddressComplex == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::PHYSICAL_ADDRESS_COMPLEX,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressComplex,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address complex',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->physicalAddressCity == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::PHYSICAL_ADDRESS_CITY,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressCity,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address city',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->physicalAddressStreet == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' =>  EmployeeColumnIndex::PHYSCIAL_ADDRESS_STREET,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressStreet,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address street',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->physicalAddressSuburb == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' =>  EmployeeColumnIndex::PHYSICAL_ADDRESS_SUBURB,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressSuburb,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address suburb',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        if ($this->employee->physicalAddressCountry != "" && !Util::isCountryValid($this->employee->physicalAddressCountry,$this->db)) {
            $errors [] = [
                'isCritical' => true,
                'column' =>  EmployeeColumnIndex::PHYSICAL_ADDRESS_COUNTRY,
                'row' => $row,
                'value' => $this->employee->physicalAddressCountry,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid physical address country',
                'fullDescription' => 'Must be text'
            ];
        }
        
        // if ($this->employee->physicalAddressPostalCode == "") {
        //     $errors [] = [
        //         'isCritical' => false,
        //         'column' =>  EmployeeColumnIndex::PHYSICAL_ADDRESS_POSTAL_CODE,
        //         'row' => $row,
        //         'value' => $this->employee->physicalAddressPostalCode,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid physical address postal code',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }
    }

    private function validatePostalAddress(int $row, array &$errors) : void {

        if ($this->employee->postalAddressSameAsPhysical != "" && !Util::isYesOrNo($this->employee->postalAddressSameAsPhysical)) {
            $errors [] = [
                'isCritical' => false,
                'column' =>  EmployeeColumnIndex::POSTAL_ADDRESS_SAME_AS_PHYSICAL_ADDRESS,
                'row' => $row,
                'value' => $this->employee->postalAddressSameAsPhysical,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid postal address same as, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        } 

        // if ($this->employee->postalAddressLine1 == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::POSTAL_ADDRESS_LINE_1,
        //         'row' => $row,
        //         'value' => $this->employee->postalAddressLine1,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid address line 1',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->postalAddressLine2 == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::POSTAL_ADDRESS_LINE_2,
        //         'row' => $row,
        //         'value' => $this->employee->postalAddressLine2,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid address line 2',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->postalAddressLine3 == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::POSTAL_ADDRESS_LINE_3,
        //         'row' => $row,
        //         'value' => $this->employee->postalAddressLine3,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid address line 3',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->postalAddressCode == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::POSTAL_ADDRESS_CODE,
        //         'row' => $row,
        //         'value' => $this->employee->postalAddressCode,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid postal address code',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        if ($this->employee->postalAddressCountry != "" && !Util::isCountryValid($this->employee->postalAddressCountry,$this->db)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::POSTAL_ADDRESS_COUNTRY,
                'row' => $row,
                'value' => $this->employee->postalAddressCountry,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid postal address country',
                'fullDescription' => 'Must be text'
            ];
        }
    }

    private function validateWorkAddresses(int $row ,array &$errors) : void {

        if ($this->employee->workAddressSameAsCompanyAddress != "" && !Util::isYesOrNo($this->employee->workAddressSameAsCompanyAddress)) {
            $errors[] = [
                'isCritical' => false,
                'column' => EmployeeColumnIndex::WORK_ADDRESS_SAME_AS_COMPANY_ADDRESS,
                'row' => $row,
                'value' => $this->employee->workAddressSameAsCompanyAddress,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid work address same as, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        }

        // if ($this->employee->workAddressUnit == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_UNIT,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressUnit,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address unit',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->workAddressComplex == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_COMPLEX,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressComplex,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address complex',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->workAddressStreet == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_STREET,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressStreet,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address street',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }


        // if ($this->employee->workAddressSuburb == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_SUBURB,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressSuburb,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address suburb',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->workAddressCity == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_CITY,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressCity,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address city',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->workAddressPostalCode == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_ADDRESS_POSTAL_CODE ,
        //         'row' => $row,
        //         'value' => $this->employee->workAddressPostalCode,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work address postal code',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        if ($this->employee->workAddressCountry != "" && !Util::isCountryValid($this->employee->workAddressCountry,$this->db)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::WORK_ADDRESS_COUNTRY ,
                'row' => $row,
                'value' => $this->employee->workAddressCountry,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid work address country',
                'fullDescription' => 'Must be text'
            ];
        }

        // if ($this->employee->homeNumber == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::HOME_NUMBER ,
        //         'row' => $row,
        //         'value' => $this->employee->homeNumber,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid home number',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->workNumber == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::WORK_NUMBER ,
        //         'row' => $row,
        //         'value' => $this->employee->workNumber,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid work number',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }

        // if ($this->employee->faxNumber == "") {
        //     $errors[] = [
        //         'isCritical' => false,
        //         'column' => EmployeeColumnIndex::FAX_NUMBER ,
        //         'row' => $row,
        //         'value' => $this->employee->faxNumber,
        //         'expectedValue' => 'Any text value',
        //         'description' => 'Invalid fax number',
        //         'fullDescription' => 'Must be text'
        //     ];
        // }
    }


    private  function validateIncomeTaxDetails(int $row, array &$errors) : void {

        if (strlen($this->employee->incomeTaxNumber) != 10) {
            $errors[] = [
                'isCritical' => false,
                'column' =>  EmployeeColumnIndex::INCOME_TAX_NUMBER,
                'row' => $row,
                'value' => $this->employee->incomeTaxNumber,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid income tax number',
                'fullDescription' => 'The specified value does not appear to be a valid income tax number. '.
                    'The income tax reference number is a mandatory field on the tax certificate returns made by employers, '.
                   'therefore you will not be able to submit your tax reconciliations to SARS unless you obtain an income tax reference number for the employee '
            ];
        }

        if ($this->employee->incomeTaxDirective1IssuedDate != "" && !Util::isDateValid($this->employee->incomeTaxDirective1IssuedDate)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INCOME_TAX_DIRECTIVE_1_ISSUED_DATE,
                'row' => $row,
                'value' => $this->employee->incomeTaxDirective1IssuedDate,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid date for tax directive 1',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        if ($this->employee->incomeTaxDirective2IssuedDate != "" && !Util::isDateValid($this->employee->incomeTaxDirective2IssuedDate)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INCOME_TAX_DIRECTIVE_2_ISSUED_DATE,
                'row' => $row,
                'value' => $this->employee->incomeTaxDirective2IssuedDate,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid tax directive 2 issued date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        if ($this->employee->incomeTaxDirective2Amount != "" && !is_numeric($this->employee->incomeTaxDirective2Amount)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INCOME_TAX_DIRECTIVE_2_AMOUNT,
                'row' => $row,
                'value' => $this->employee->incomeTaxDirective2Amount,
                'expectedValue' => 'Numeric',
                'description' => 'Invalid Tax directive 2 Amount',
                'fullDescription' => 'Must be numeric'
            ];
        }

        if ($this->employee->incomeTaxDirective3IssuedDate != "" && !Util::isDateValid($this->employee->incomeTaxDirective3IssuedDate)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INCOME_TAX_DIRECTIVE_3_ISSUED_DATE,
                'row' => $row,
                'value' => $this->employee->incomeTaxDirective3IssuedDate,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid tax direcitive 3 issued date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }
        if ($this->employee->incomeTaxDirective3Amount != "" && !is_numeric($this->employee->incomeTaxDirective3Amount)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::INCOME_TAX_DIRECTIVE_3_AMOUNT,
                'row' => $row,
                'value' => $this->employee->incomeTaxDirective3SourceCode,
                'expectedValue' => 'Numeric',
                'description' => 'Invalid tax direcitive 3 amount',
                'fullDescription' => 'Must be numeric'
            ];
        }
    }

    private function validateOthers(int $row, array &$errors) : void {

        if ($this->employee->sicCode !== "") {
            $sqlQuery = 'SELECT code FROM sic_codes WHERE code = $1; ';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->sicCode]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() == 0) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::SIC_CODE,
                    'row' => $row,
                    'value' => $this->employee->sicCode,
                    'expectedValue' => 'Any text value',
                    'description' => 'Invalid SIC code',
                    'fullDescription' => 'Must be a valid sic code'
                ];
            }
        }

        if ($this->employee->sicCode == "") {
            $sqlQuery = 'SELECT sic_code FROM company_details  LIMIT 1; ';
            $sqlResult = $this->db->paramQuery($sqlQuery, []);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            if (is_null($sqlRow['sic_code'])) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::SIC_CODE,
                    'row' => $row,
                    'value' => $this->employee->sicCode,
                    'expectedValue' => 'Any text value',
                    'description' => 'Employee doesn\'t have a sic code',
                    'fullDescription' => 'Must be a valid sic code'
                ];
            }
        }

        if (!Util::isYesOrNo($this->employee->sendPaySlipByEmail)) {
            $errors[] = [
                'isCritical' => false,
                'column' => EmployeeColumnIndex::SEND_PAYSLIP_BY_EMAIL,
                'row' => $row,
                'value' => $this->employee->sendPaySlipByEmail,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid send payslip by email, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        }
   

        if (!Util::isYesOrNo($this->employee->enablePayeCorrection)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::ENABLE_PAYE_CORRECTION,
                'row' => $row,
                'value' => $this->employee->enablePayeCorrection,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid enable paye correction, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\' and not blank'
            ];
        }
    
    }

    private function validateEmploymentDetails(int $row, array &$errors) : void {

        if (!Util::isDateValid($this->employee->employmentStartDate)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::EMPLOYMENT_START_DATE,
                'row' => $row,
                'value' => $this->employee->employmentStartDate,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid date for employment start date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }
        if ($this->employee->employmentStatus != "" && !Util::isEmploymentStatusValid($this->employee->employmentStatus)){
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::EMPLOYMENT_STATUS,
                'row' => $row,
                'value' => $this->employee->employmentStatus,
                'expectedValue' => 'Any text value',
                'description' => 'Invalid employment status',
                'fullDescription' => 'Must be text'
            ];
        }

        if ($this->employee->employmentEndDate != "" && !Util::isDateValid($this->employee->employmentEndDate)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::EMPLOYMENT_END_DATE,
                'row' => $row,
                'value' => $this->employee->employmentEndDate,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid date for employment end date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        if (!Util::checkPaymentMethod($this->employee->paymentMethod)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_METHOD,
                'row' => $row,
                'value' => $this->employee->paymentMethod,
                'expectedValue' => 'Cash <br> Cheque <br> EFT',
                'description' => 'Invalid payment method',
                'fullDescription' => 'The payment method is required and must be one of the following:<br> <br> Cash<br>Cheque<br>EFT<br> '
            ];
        }

        if (!Util::checkPaymentPeriod($this->employee->paymentPeriod)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_PERIOD,
                'row' => $row,
                'value' => $this->employee->paymentPeriod,
                'expectedValue' => '<br> Monthly <br> Weekly <br> Every Two Weeks',
                'description' => 'Invalid payment period',
                'fullDescription' => 'The payment period is required and must be of the following:  <br><br> Monthly <br> Weekly <br> Every Two Weeks '
            ];
        }

        if (strtoupper($this->employee->paymentPeriod) == "MONTHLY"  && !Util::isPaymentDayValid($this->employee->paymentDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_DAY,
                'row' => $row,
                'value' => $this->employee->paymentDay,
                'expectedValue' => 'Value between 1 and 28 or "Last Day"',
                'description' => 'Invalid payment day',
                'fullDescription' => 'Please specify the day of month between (1 to 28) or Last Day '
            ];
        }

        if (strtoupper($this->employee->paymentPeriod) == "WEEKLY" && !Util::isWeekDayValid($this->employee->paymentDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_DAY,
                'row' => $row,
                'value' => $this->employee->paymentDay,
                'expectedValue' => 'Weekly Day',
                'description' => 'Invalid Weekly Day',
                'fullDescription' => 'Please specify the day of the week: <br> <br> Monday <br> Tuesday <br> Wednesday <br> Thursday <br> Friday <br> Saturday <br> Sunday '
            ];
        }

        if (strtoupper($this->employee->paymentPeriod) == "EVERY TWO WEEKS" && !Util::isBiWeekDayValid($this->employee->paymentDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_DAY,
                'row' => $row,
                'value' => $this->employee->paymentDay,
                'expectedValue' => 'Bi-Weekly Day',
                'description' => 'Invalid Bi-Weekly Day',
                'fullDescription' => 'Please specify the day of the week: <br> <br> Monday <br> Tuesday <br> Wednesday <br> Thursday <br> Friday <br> Saturday <br> Sunday '
                // 'fullDescription' => 'Please specify the week and day of the week: <br> <br> Week 1: Monday <br> Week 1: Tuesday <br> Week 1: Wednesday <br> Week 1: Thursday <br> Week 1: Friday <br> Week 1: Saturday <br> Week 1: Sunday <br> Week 2: Monday <br> Week 2: Tuesday <br> Week 2: Wednesday <br> Week 2: Thursday <br> Week 2: Friday <br> Week 2: Saturday <br> Week 2: Sunday '
            ];
        }

        if (strtoupper($this->employee->paymentPeriod) == "MONTHLY" && !Util::isPaymentDayValid($this->employee->paymentPeriodEndDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_PERIOD_END_DAY,
                'row' => $row,
                'value' => $this->employee->paymentPeriodEndDay,
                'expectedValue' => 'Value between 1 and 28 or "Last Day"',
                'description' => 'Invalid payment period end day',
                'fullDescription' => 'Please specify the day of month between (1 to 28) or Last Day'
            ];
        }

        if (strtoupper($this->employee->paymentPeriod) == "WEEKLY" && !Util::isWeekDayValid($this->employee->paymentPeriodEndDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_PERIOD_END_DAY,
                'row' => $row,
                'value' => $this->employee->paymentPeriodEndDay,
                'expectedValue' => 'Weekly Day',
                'description' => 'Invalid Weekly Day',
                'fullDescription' =>'Please specify the day of the week: <br> <br> Monday <br> Tuesday <br> Wednesday <br> Thursday <br> Friday <br> Saturday <br> Sunday '
            ];
        }
        
        if (strtoupper($this->employee->paymentPeriod) == "EVERY TWO WEEKS" && !Util::isBiWeekDayValid($this->employee->paymentPeriodEndDay)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::PAYMENT_PERIOD_END_DAY,
                'row' => $row,
                'value' => $this->employee->paymentPeriodEndDay,
                'expectedValue' => 'Bi-Weekly Day',
                'description' => 'Invalid Bi-Weekly Day',
                'fullDescription' =>'Please specify the day of the week: <br> <br> Monday <br> Tuesday <br> Wednesday <br> Thursday <br> Friday <br> Saturday <br> Sunday '
                // 'fullDescription' => 'Please specify the week and day of the week: <br> <br> Week 1: Monday <br> Week 1: Tuesday <br> Week 1: Wednesday <br> Week 1: Thursday <br> Week 1: Friday <br> Week 1: Saturday <br> Week 1: Sunday <br> Week 2: Monday <br> Week 2: Tuesday <br> Week 2: Wednesday <br> Week 2: Thursday <br> Week 2: Friday <br> Week 2: Saturday <br> Week 2: Sunday '
            ];
        }
        
        if (!Util::isYesOrNo($this->employee->isAsylumSeeker)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::IS_ASYLUM_SEEKER,
                'row' => $row,
                'value' => $this->employee->isAsylumSeeker,
                'expectedValue' =>'Yes or No',
                'description' => 'Invalid is asylum seeker, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        }


        if (!Util::isYesOrNo($this->employee->isRefugee)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::IS_REFUGEE,
                'row' => $row,
                'value' => $this->employee->isRefugee,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid is refugee, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        }

        if (!Util::isYesOrNo($this->employee->isRetired)) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::IS_RETIRED,
                'row' => $row,
                'value' => $this->employee->isRetired,
                'expectedValue' => 'Yes or No',
                'description' => 'Invalid is retired, expected  Yes or No',
                'fullDescription' => 'Valid values are \'Yes\' or \'No\''
            ];
        }
    }

    private function validateBankingDetails(int $row , array &$errors) : void {
        if ($this->employee->financialInstitution != "") {
            $sqlQuery = 'SELECT name FROM financial_institutions WHERE name  = $1; ';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->financialInstitution]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() == 0) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::FINANCIAL_INSTITUTION,
                    'row' => $row,
                    'value' => $this->employee->financialInstitution,
                    'expectedValue' => 'Valid Financial Institution',
                    'description' => 'Invalid Financial Institution',
                    'fullDescription' => 'Must be a valid Financial Institution'
                ];
            }
        }
       
        if (($this->employee->bankAccountType != "") && (!in_array($this->employee->bankAccountType ,array("Savings","Cheque")))) {
            $errors[] = [
                'isCritical' => true,
                'column' => EmployeeColumnIndex::BANK_ACCOUNT_TYPE,
                'row' => $row,
                'value' => $this->employee->bankAccountType,
                'expectedValue' => 'Savings or Cheque ',
                'description' => 'Invalid selection',
                'fullDescription' => 'Valid values are Cheque or Savings'
            ];
        }


    }
    /**
     * Function validate responsible for acummulating all the validation rules
     * @param {int} $row the current row of the error
     * @param {array} $errors A reference to another error object 
     * @return {void}
     */
    public function validate(int $row, array &$errors) : void {
        $this->validatePersonalDetails($row, $errors);
        $this->checkExistingEmployeeCode($row, $errors);
        $this->checkExistingEmployeeId($row, $errors);
        $this->checkExistingEmployeePassport($row,$errors);
        $this->validatePhysicalAddress($row, $errors);
        $this->validatePostalAddress($row, $errors);
        $this->validateWorkAddresses($row, $errors);
        $this->validateEmploymentDetails($row, $errors);
        $this->validateBankingDetails($row, $errors);
        $this->validateIncomeTaxDetails($row, $errors);
        $this->validateOthers($row, $errors);
    }

    private function checkExistingEmployeeId(int $row, array &$errors) : void {
        if ($this->employee->idNumber == "") {
            return;
        }
        if (!$this->doesEmployeeExists()) {
            $sqlQuery = 'SELECT id FROM employees WHERE id_number = $1 AND code != $2';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->idNumber, $this->employee->code]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() >= 1) {
                // Add an exception
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::ID_NUMBER,
                    'row' => $row,
                    'value' =>  $this->employee->idNumber,
                        'expectedValue' => 'Numeric',
                        'description' => 'Employee already exists',
                        'fullDescription' => 
                            'There is already a Employee with the specified Employee ID ' . 
                        'Number (\'' . $this->employee->idNumber . '\') '
                ];
            }
        }

        // Check if employee is trying to update
        if ($this->doesEmployeeExists()) {
            $sqlQuery = 'SELECT id FROM employees WHERE code = $1 AND id_number = $2';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->code, $this->employee->idNumber]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() == 0) {
                // Add an exception
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::ID_NUMBER,
                    'row' => $row,
                    'value' =>  $this->employee->idNumber,
                        'expectedValue' => 'Not Aplicable',
                        'description' => 'Unable to update employee ID Number',
                        'fullDescription' => 'Updating the employee ID Number is not allowed when importing '
                ];
            }
        }
       
    }

    private function checkExistingEmployeeCode(int $row, array &$errors) : void {
        if ($this->employee->code == "") {
            return;
        }
        $sqlQuery = 'SELECT id FROM employees WHERE code = $1;';
        $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->code]);
        if (!$sqlResult->isValid()) {
            die(json_encode(['ok' => false, 'error' => 'Database error.']) );
        }
        if ($sqlResult->getRowCount() >= 1) {
            // Count the number of existing Employees
            $this->doesEmployeeExists = true;
            // Add an exception
            $errors[] = [
                'isCritical' => false,
                'column' => EmployeeColumnIndex::CODE,
                'row' => $row,
                'value' =>  $this->employee->code,
                    'expectedValue' => 'Numeric',
                    'description' => 'Employee already exists',
                    'fullDescription' => 
                        'There is already a Employee with the specified Employee Code ' . 
                    'Number (\'' . $this->employee->code . '\') '
            ];
        }
    }

    private function checkExistingEmployeePassport(int $row, array &$errors) : void {
        if ($this->employee->passportNumber == "") {
            return;
        }
        if (!$this->doesEmployeeExists()) {
            $sqlQuery = 'SELECT id FROM employees WHERE passport_number = $1 AND code != $2 AND passport_country = (SELECT code FROM countries WHERE name = $3)';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->passportNumber, $this->employee->code, $this->employee->passportCountry]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() >= 1) {
                // Add an exception
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::PASSPORT_NUMBER,
                    'row' => $row,
                    'value' =>  $this->employee->passportNumber,
                        'expectedValue' => 'Alpha Numeric',
                        'description' => 'Employee already exists',
                        'fullDescription' => 
                            'There is already an Employee with the specified Employee Passport ' . 
                        'Number (\'' . $this->employee->passportNumber . '\') '
                ];
            }
        }
        if ($this->doesEmployeeExists()) {
            // Check and see if employee passport wants to update , prevent it 
            $sqlQuery = 'SELECT id FROM employees WHERE code = $1 AND passport_number = $2  AND passport_country = (SELECT code FROM countries WHERE name = $3)';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->code, $this->employee->passportNumber, $this->employee->passportCountry]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() == 0) {
                // Add an exception
                // Add an exception
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::PASSPORT_NUMBER,
                    'row' => $row,
                    'value' =>  $this->employee->passportNumber,
                    'expectedValue' => 'Not Aplicable ',
                    'description' => 'Unable to update employee Passport Number',
                    'fullDescription' => 'Updating the employee Passport Number is not allowed when importing '
                ];
            }

        }
    }
    /**
     * Function to check for duplicates Row
     * @param {int} $currentRow
     * @param {array} $employees
     * @param {array} $errors
     */
    public function checkDuplicates(int $currentRow ,array &$employees, array &$errors) : void  {
        $row = 2;
        foreach ($employees as $employee) {
            if ($row == $currentRow) {
                break;
            }
            $row++;
            if ($this->employee->code != "" && ($this->employee->code == $employee->code)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::CODE,
                    'row' => $row,
                    'value' => $employee->code,
                    'expectedValue' => 'Unique Code',
                    'description' => 'Employee is duplicated in the import file',
                    'fullDescription' => 'Unique Code '
                ];
            }
            // Check Id Number
            if  ($this->employee->idNumber != "" && ($this->employee->idNumber == $employee->idNumber)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::ID_NUMBER,
                    'row' => $row,
                    'value' => $employee->idNumber,
                    'expectedValue' => 'Numeric',
                    'description' => 'Id Number is duplicated in the import file',
                    'fullDescription' => 'Unique Id number '
                ];
            }
            // Check duplicate passport number
            if ($this->employee->passportNumber != "" && ($this->employee->passportNumber == $employee->passportNumber) && ($this->employee->passportCountry == $employee->passportCountry)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => EmployeeColumnIndex::PASSPORT_NUMBER,
                    'row' => $row,
                    'value' => $employee->passportNumber,
                    'expectedValue' => 'Alphanumeric',
                    'description' => 'Passport number is duplicated in the import file',
                    'fullDescription' => 'Unique Passport Number '
                ];
            }
        }

    }

    /**
     * Function to get if employeeExists
     * @return {bool}
     */
    public function doesEmployeeExists() : bool {
        return $this->doesEmployeeExists;
    }

}