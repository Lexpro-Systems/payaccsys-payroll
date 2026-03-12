<?php
System::includeFile('employee_import/EmployeeImportData.php');
System::includeFile('NumberMask.php');

/**
 * Transformer class cleans up the data and makes sure its apporiate for the employee table
 */
class TransformEmployeeImportData {

    private EmployeeImportData  $employee;
    private $db;
    public function __construct(EmployeeImportData &$employee , $db) {
        $this->employee = $employee;
        $this->db = $db;
    }

    private function getCountry(string $countryCode) : ?string  {
        $countryCodeUpper = strtoupper($countryCode);
        $result = null;
        $sqlQuery = 'SELECT code FROM countries WHERE UPPER(name) = $1;';
        $sqlResult = $this->db->paramQuery($sqlQuery, [$countryCodeUpper]);
        if (!$sqlResult->isValid()) {
            die(json_encode(['ok' => false, 'error' => 'Database error.']) );
        }
        if ($sqlResult->getRowCount() >= 1) {
            $sqlRow = $sqlResult->fetchAssociative();
            return $sqlRow['code'];
        }
        // Defaults to South african code if not found 
        if ($result == null) {
            $result = "ZAF";
        }
        return $result;
    }

    private function convertPaymentPeriod () : void {
        switch (strtoupper($this->employee->paymentPeriod)) {
            case 'MONTHLY':
                $this->employee->paymentPeriod = 'MONT';
                break;
            case 'WEEKLY':
                $this->employee->paymentPeriod = 'WEEK';
                break;
            case 'EVERY TWO WEEKS':
                $this->employee->paymentPeriod = 'BWEE';
                break;
            default:
               break;
        }
    }

    private function convertWeeklyDayToInt(string $day) : ?int {
        switch (ucfirst(strtolower($day))) {
            case "Sunday":
                return 0;
            case "Monday":
                return 1;
            case "Tuesday":
                return 2;
            case "Wednesday":
                return 3;
            case "Thursday":
                return 4;
            case "Friday":
                return 5;
            case "Saturday":
                return 6;
            default:
            return 0;
        }
    
    }

    private function convertBiWeeklyDayToInt(string $day) : ?int {
        switch (ucfirst(strtolower($day))) {
            case "Sunday":
                return 0;
            case "Monday":
                return 1;
            case "Tuesday":
                return 2;
            case "Wednesday":
                return 3;
            case "Thursday":
                return 4;
            case "Friday":
                return 5;
            case "Saturday":
                return 6;
            default:
            return 0;
        // switch (strtolower($day)) {
        //     case "week 1: sunday":
        //         return 0;
        //     case "week 1: monday":
        //         return 1;
        //     case "week 1: tuesday":
        //         return 2;
        //     case "week 1: wednesday":
        //         return 3;
        //     case "week 1: thursday":
        //         return 4;
        //     case "week 1: friday":
        //         return 5;
        //     case "week 1: saturday":
        //         return 6;
        //     case "week 2: sunday":
        //         return 7;
        //     case "week 2: monday":
        //         return 8;
        //     case "week 2: tuesday":
        //         return 9;
        //     case "week 2: wednesday":
        //         return 10;
        //     case "week 2: thursday":
        //         return 11;
        //     case "week 2: friday":
        //         return 12;
        //     case "week 2: saturday":
        //         return 13;
        //     default:
        //         return 0;
        }
    }

    private function convertPaymentMethod() : void {
        switch (strtoupper($this->employee->paymentMethod)) {
            case 'CASH':
                $this->employee->paymentMethod = 'CASH';
                break;
            case 'CHEQUE':
                $this->employee->paymentMethod = 'CHEQ';
                break;
            case 'EFT':
                $this->employee->paymentMethod = 'EFTR';
                break;
            default:
                break;
        }
    }

    private function generateEmployeeCode() : void {
        if ($this->employee->code == '') {
            // Load employee code from config
            $config = [
                'employee_code_mask' => null
            ];
            $configItemsLoaded = Util::loadConfigValues($this->db, $config);
            if( $configItemsLoaded !== count($config) ) {
                die( json_encode(['ok' => false, 'error' => 'Loading config failed.']) );
            }
            // Create a NumberMask object to handle the configured mask.
            $numberMask = new NumberMask( $config['employee_code_mask'] );
            // Set startCode to the second number in the series.
            $numberMask->next();
            $startCode = $numberMask->getValue();
            // Get basic details of current account numbers
            $sqlQuery =
                'SELECT ' .
                    'MAX(code) AS max_code, MIN(code) AS min_code, COUNT(*) AS total_employees ' .
                'FROM ' .
                    'employees ' .
                'WHERE ' .
                    'LOWER(code) >= LOWER($1);';
            $sqlResult = $this->db->paramQuery($sqlQuery, [$startCode]);
            if( !$sqlResult->isValid() ) {
                die( json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            
            // We should have at least one row
            if( $sqlResult->getRowCount() !== 1 ) {
                die(json_encode(['ok' => false, 'error' => 'Unable to calculate total employees.']));
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $minCode = $sqlRow['min_code'];
            $maxCode = $sqlRow['max_code'];
            $totalEmployees = $sqlRow['total_employees'];
            
            // Calculate the total amount of available codes in the searchSpace
            $searchSize = 0;
            if( $maxCode !== null ) $searchSize = $numberMask->getValueIndex($maxCode) - $numberMask->getValueIndex($startCode) + 1;

            // If our minimum code is null or larger than the start code then we can return the start code.
            // If the total amount of employees are equal to our search space then all the codes has been used and we have to return the max code + 1.
            // If none of the above are the case then we have to search for a gap in the search space.
            $nextCode = null;
            $searchCost = 1;
            if( $minCode === null || $minCode > $startCode ) {
                $nextCode = $startCode;
            }
            else if( $searchSize === $totalEmployees ) {
                $numberMask->seek( $maxCode );
                $numberMask->next();
                $nextCode = $numberMask->getValue();
            }
            else {
                $searchStart = $startCode;
                $searchEnd = $maxCode;
                $searchMid = null;
                $searchEmployeeTotal = $totalEmployees;
                $leftSize = 0;
                $leftCount = 0;
                $rightSize = 0;
                $rightCount = 0;
                while( $searchSize > 1 ) {
                    // Increase our search cost.
                    $searchCost++;
                    // Calculate the mid of the search space.  searchStartIndex + ((searchEndIndex - searchEndIndex) / 2)
                    $searchMid = $numberMask->getIndexValue($numberMask->getValueIndex($searchStart) +
                        floor(($numberMask->getValueIndex($searchEnd) - $numberMask->getValueIndex($searchStart)) / 2));
                        
                    // Get the amount of codes from searchStart to searchMid including searchMid
                    $sqlQuery =
                        'SELECT COUNT(*) AS left_total FROM employees WHERE LOWER(code) >= LOWER($1) AND LOWER(code) <= LOWER($2);';
                    $sqlResult = $this->db->paramQuery($sqlQuery, [$searchStart, $searchMid]);
                    if( !$sqlResult->isValid() ) {
                        die( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    }
                    // We should have precisely one row
                    if( $sqlResult->getRowCount() !== 1 ) {
                        die(json_encode(['ok' => false, 'error' => 'Unable to calculate left search space.']) );
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $leftCount = $sqlRow['left_total'];
                    $rightCount = $searchEmployeeTotal - $leftCount;
                    // Calculate the total amount of available account numbers to the left
                    $leftSize = $numberMask->getValueIndex($searchMid) - $numberMask->getValueIndex($searchStart) + 1;
                    $rightSize = $searchSize - $leftSize;
                    // Check if we found a free code
                    if( $leftSize === 1 && $leftCount === 0 ) {
                        $nextCode = $searchStart;
                    }
                    else if( $rightSize === 1 && $rightCount === 0 ) {
                        $nextCode = $searchEnd;
                    }
                    // If no number was found yet.  Go to the next search position
                    if( $leftCount < $leftSize ) {
                        $searchEnd = $searchMid;
                        $searchSize = $leftSize;
                        $searchEmployeeTotal = $leftCount;
                    }
                    else {
                        $numberMask->seek( $searchMid );
                        $numberMask->next();
                        $searchStart = $numberMask->getValue();
                        $searchSize = $rightSize;
                        $searchEmployeeTotal = $rightCount;
                    }
                }
            }
            $this->employee->code = $nextCode;
        }
    }

    private function convertBankNameToCode() : void {
        $sqlQuery = 'SELECT code FROM financial_institutions WHERE name  = $1; ';
        $sqlResult = $this->db->paramQuery($sqlQuery, [$this->employee->financialInstitution]);
        if (!$sqlResult->isValid()) {
            die(json_encode(['ok' => false, 'error' => 'Database error.']) );
        }
        if ($sqlResult->getRowCount() == 1) {
            $sqlRow = $sqlResult->fetchAssociative();
            $this->employee->financialInstitution = $sqlRow['code'];
        }
    }

    private function convertBankAccountTypeToCode() : void {

        switch (strtoupper($this->employee->bankAccountType)) {
            case 'SAVINGS':
                $this->employee->bankAccountType = 'SACC';
                break;
            case 'CHEQUE':
                $this->employee->bankAccountType = 'CACC';
                break;
            default:
                break;
        }
      
    }

    private function convertTitleCode() : void {

        switch (strtoupper(($this->employee->titleCode))) {
            case 'MR':
                $this->employee->titleCode = 'MIST';
            break;
            case 'MISS':
                $this->employee->titleCode = 'MISS';
            break;
            case 'MRS':
                $this->employee->titleCode = 'MISI';
            break;
            case 'MS':
                $this->employee->titleCode = 'MISX';
            break;
            case 'ADV':
                $this->employee->titleCode = 'ADVO';
            break;
            case 'DR':
                $this->employee->titleCode = 'DOCT';
            break;
            case 'PROF':
                $this->employee->titleCode = 'PROF';
            break;
            default :
            break;
        }
    }

    private function convertYesOrNoToBool() : void {
       
        if (strtoupper($this->employee->workAddressSameAsCompanyAddress) == "YES" ) {
            $this->employee->workAddressSameAsCompanyAddress = true;
        } else {
            $this->employee->workAddressSameAsCompanyAddress = false;
        }
        if (strtoupper($this->employee->sendPaySlipByEmail) == "YES" ) {
            $this->employee->sendPaySlipByEmail = true;
        }  else {
            $this->employee->sendPaySlipByEmail = false;
        }

        if (strtoupper($this->employee->postalAddressSameAsPhysical) == "YES" ) {
            $this->employee->postalAddressSameAsPhysical = true;
        } else {
            $this->employee->postalAddressSameAsPhysical = false;
        }

        if (strtoupper($this->employee->isRetired) == "YES" ) {
            $this->employee->isRetired = true;
        } else {
            $this->employee->isRetired = false;
        }
        if (strtoupper($this->employee->isAsylumSeeker) == "YES" ) {
            $this->employee->isAsylumSeeker = true;
        } else {
            $this->employee->isAsylumSeeker = false;
        }

        if (strtoupper($this->employee->isRefugee) == "YES" ) {
            $this->employee->isRefugee = true;
        } else {
            $this->employee->isRefugee = false;
        }

        if (strtoupper($this->employee->enablePayeCorrection) == "YES" ) {
            $this->employee->enablePayeCorrection = true;
        } else {
            $this->employee->enablePayeCorrection = false;
        }
    }
    private function convertPaymentDays() : void {
        if (strtoupper($this->employee->paymentDay) == "LAST DAY") {
            $this->employee->paymentDay  = 0;
        }
        if (strtoupper($this->employee->paymentPeriodEndDay) == "LAST DAY") {
            $this->employee->paymentPeriodEndDay  = 0;
        }
        
        if (strtoupper($this->employee->paymentPeriod) == "WEEKLY") {
            $this->employee->paymentDay = $this->convertWeeklyDayToInt($this->employee->paymentDay);
            $this->employee->paymentPeriodEndDay = $this->convertWeeklyDayToInt($this->employee->paymentPeriodEndDay);
        }
        
        if (strtoupper($this->employee->paymentPeriod) == "EVERY TWO WEEKS") {
            $this->employee->paymentDay = $this->convertBiWeeklyDayToInt($this->employee->paymentDay);
            $this->employee->paymentPeriodEndDay = $this->convertBiWeeklyDayToInt($this->employee->paymentPeriodEndDay);
        }
    }
    private function usePostalAddressAsPhysical() : void {
        if ($this->employee->postalAddressSameAsPhysical)  {
            
            $this->employee->postalAddressLine1 = '';
            if($this->employee->physicalAddressUnit !== '') {
                $this->employee->postalAddressLine1 = $this->employee->physicalAddressUnit;
            }
            if ($this->employee->physicalAddressComplex !== '') {
                if ($this->employee->postalAddressLine1 !== '') {
                    $this->employee->postalAddressLine1 .=  ', ' . $this->employee->physicalAddressComplex;
                }
                else{
                    $this->employee->postalAddressLineline1 = $this->employee->physicalAddressComplex;
                }
                
            }
            if ($this->employee->physicalAddressStreet !== '') {
                if ($this->employee->postalAddressLine1 !== '') {
                    $this->employee->postalAddressLine1 .=  ', ' . $this->employee->physicalAddressStreet;
                }
                else {
                    $this->employee->postalAddressLine1 = $this->employee->physicalAddressStreet;
                }
                
            }
            $this->employee->postalAddressLine2 = $this->employee->physicalAddressSuburb;
            $this->employee->postalAddressLine3 = $this->employee->physicalAddressCity;
            $this->employee->postalAddressCode = $this->employee->physicalAddressPostalCode;
            $this->employee->postalAddressCountry = $this->employee->physicalAddressCountry;
        }
      
    }
    private function useCompanyDetails(): void { // Load the company physical address from the company_details table
        $sqlQuery =
            'SELECT ' .
                'company_details.physical_address_unit, ' .
                'company_details.physical_address_complex, ' .
                'company_details.physical_address_street, ' .
                'company_details.physical_address_suburb, ' .
                'company_details.physical_address_city, ' .
                'company_details.physical_address_postal_code, ' .
                'company_details.physical_address_country_code, ' .
                'company_details.sic_code '.
            'FROM ' .
                'company_details ' .
            'LIMIT 1;';
        $sqlResult = $this->db->paramQuery($sqlQuery, []);
        if (!$sqlResult->isValid()) {
            die(json_encode(['ok' => false, 'error' => 'Database error.']) );
        }
        
        if ($sqlResult->getRowCount() !== 1) {
            die(json_encode(['ok' => false, 'error' => 'Company address not found']));
        }
        $sqlRow = $sqlResult->fetchAssociative();
        // Should we use the company work address?
        if ($this->employee->workAddressSameAsCompanyAddress) {
            $this->employee->workAddressUnit = $sqlRow['physical_address_unit'];
            $this->employee->workAddressComplex = $sqlRow['physical_address_complex'];
            $this->employee->workAddressStreet = $sqlRow['physical_address_street'];
            $this->employee->workAddressSuburb = $sqlRow['physical_address_suburb'];
            $this->employee->workAddressCity = $sqlRow['physical_address_city'];
            $this->employee->workAddressPostalCode = $sqlRow['physical_address_postal_code'];
            $this->employee->workAddressCountry = $sqlRow['physical_address_country_code'];
        }
        if ($this->employee->sicCode == "") {
            $this->employee->sicCode = $sqlRow['sic_code'];
        }
    }
    private function convertDateToNullIfBlank() : void {
        if ($this->employee->dateOfBirth == '') {
            $this->employee->dateOfBirth = null;
        }
        if ($this->employee->employmentStartDate == '') {
            $this->employee->employmentStartDate = null;
        }
        if ($this->employee->employmentEndDate == '') {
            $this->employee->employmentEndDate = null;
        }

        if ($this->employee->incomeTaxDirective1IssuedDate == '') {
            $this->employee->incomeTaxDirective1IssuedDate = null;
        }
        if ($this->employee->incomeTaxDirective2IssuedDate == '') {
            $this->employee->incomeTaxDirective2IssuedDate = null;
        }
        if ($this->employee->incomeTaxDirective3IssuedDate == '') {
            $this->employee->incomeTaxDirective3IssuedDate = null;
        }
    }
    private function convertNumericToNullIfBlank() : void { 
        if ($this->employee->incomeTaxDirective1Amount == '') {
            $this->employee->incomeTaxDirective1Amount = null;
        }
        if ($this->employee->incomeTaxDirective2Amount == '') {
            $this->employee->incomeTaxDirective2Amount = null;
        }
        if ($this->employee->incomeTaxDirective3Amount == '') {
            $this->employee->incomeTaxDirective3Amount = null;
        }
    }
    public function apply() : void {
        $this->generateEmployeeCode();
        $this->convertYesOrNoToBool();
        $this->employee->passportCountry = $this->getCountry($this->employee->passportCountry);
        $this->employee->physicalAddressCountry = $this->getCountry($this->employee->physicalAddressCountry);
        $this->employee->postalAddressCountry = $this->getCountry($this->employee->postalAddressCountry);
        $this->employee->workAddressCountry  = $this->getCountry($this->employee->workAddressCountry);
        $this->useCompanyDetails();
        $this->convertPaymentDays();
        $this->convertPaymentMethod();
        $this->convertPaymentPeriod();
        $this->convertBankAccountTypeToCode();
        $this->convertNumericToNullIfBlank();
        $this->convertBankNameToCode();
        $this->convertTitleCode();
        $this->convertDateToNullIfBlank();
        $this->usePostalAddressAsPhysical();
    
    }
}