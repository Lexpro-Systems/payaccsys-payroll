<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    
    //
    // UTILITIES CLASS
    //
    
    class Util {
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to convert a parameterized query to plain text
        //
        // $sqlQuery            The text of the parameterized query
        // $sqlParams           An array containing the parameters of the query
        public static function parseParamQuery( $sqlQuery, $sqlParams ) {
            // Save the result
            $sqlResult = $sqlQuery;
            
            // For every paramater
            for( $i = count($sqlParams) - 1; $i >= 0; $i-- ) {
                // Get the value of the parameter
                $value = $sqlParams[$i];
                
                // Format the parameter values
                if( $value === '' ) {
                    $value = '\'\'';
                }
                else if ( is_bool($value) ) {
                    if( $value ) {
                        $value = 'TRUE';
                    }
                    else {
                        $value = 'FALSE';
                    }
                }
                else if( $value === null ) {
                    $value = 'NULL';
                }
                else if( is_int($value) ) {
                }
                else if( is_float($value) ) {
                }
                else {
                    $value = '\'' . $value . '\'';
                }
                
                // Replace the specifed parameter with the value
                $sqlResult = str_replace(('$' . ($i + 1)), $value, $sqlResult);
            }
            
            return $sqlResult;
        }
        
        // Function to format money
        //
        // sourceString         The string to format
        public static function currencyFormat($number) {
            // $number = 'R'.number_format($number, 2, '.', ',');
            $number = number_format((float)$number, 2, '.', ' ');
            return $number;
        }
        
        // Hide characters in email address
        //
        // email                The email address to obfuscate
        public static function obfuscateEmail($email) {
            // The lower the level the more characters will be obscured (must be > 0)
            $level = 2; 
            
            $domain = substr(strrchr($email, '@'), 1);
            $name = str_replace($domain, '', $email);
            $domainLen = strlen($domain);
            $nameLen = strlen($name);
            $start = '';
            $end = '';
            
            for( $i = 0; $i <= ($nameLen / $level - 1); $i++) {
                $start .= '*';
            }
            
            for( $i = 0; $i <= ($domainLen / $level - 1); $i++) {
                $end .= '*';
            }
            
            return substr_replace($name, $start, 2, $nameLen/$level).substr_replace($domain, $end, 2, $domainLen/$level);
        }
        
        // Function to format a value according to a provided mask.
        //
        // Mask Format:
        //
        // $: Any printable character.
        // ^: Any alpha-numeric character.
        // @: Any alphabet character.
        // #: Any numeric character.  Consecutive numeric characters will be handled as a single number.  For example ### will format to 001, 002, 003, ..., 999.
        // Any other character will be interpreted as the character literal.
        //
        // mask                 The mask to use when formatting.
        // value                The value to format.
        // return               The formatted value.
        public static function maskFormat(string $mask, string $value) : string {
            // If the number is the same length or longer than the mask we cannot format it.
            if( strlen($value) >= strlen($mask) ) return $value;
            
            $formattedNumber = '';
            
            // Split the mask into its parts
            $maskParts = [];
            for( $i = 0; $i < strlen($mask); $i++ ) {
                if( $mask[$i] === '$' ) {
                    $maskParts[] = ['type' => '$', 'value' => ''];
                    if( $i < strlen($value) ) $maskParts[count($maskParts) - 1]['value'] = strtoupper($value[$i]);
                    else return $value;
                }
                else if( $mask[$i] === '^' ) {
                    $maskParts[] = ['type' => '^', 'value' => ''];
                    if( $i < strlen($value) ) {
                        if( (strtoupper($value[$i]) < 'A' || strtoupper($value[$i]) > 'Z') && ($value[$i] < '0' || $value[$i] > '9')) {
                            return $value;
                        }
                        $maskParts[count($maskParts) - 1]['value'] = strtoupper($value[$i]);
                    }
                }
                else if( $mask[$i] === '@' ) {
                    $maskParts[] = ['type' => '@', 'value' => ''];
                    if( $i < strlen($value) ) {
                        if( strtoupper($value[$i]) < 'A' || strtoupper($value[$i]) > 'Z' ) return $value;
                        $maskParts[count($maskParts) - 1]['value'] = strtoupper($value[$i]);
                    }
                }
                else if( $mask[$i] === '#' ) {
                    if( count($maskParts) > 0 && $maskParts[count($maskParts) - 1]['type'] !== '#' ) {
                        $maskParts[] = ['type' => '#', 'value' => '', 'length' => 0];
                    }
                    $maskParts[count($maskParts) - 1]['length']++;
                    if( $i < strlen($value) ) {
                        if( $value[$i] < '0' || $value[$i] > '9' ) return $value;
                        $maskParts[count($maskParts) - 1]['value'] = $maskParts[count($maskParts) - 1]['value'] . $value[$i];
                    }
                }
                else {
                    $maskParts[] = ['type' => '', 'value' => $mask[$i]];
                    if( $i < strlen($value) && $mask[$i] !== $value[$i] ) return $value; 
                }
            }
            
            // Format the number according to the mask
            for( $i = 0; $i < count($maskParts); $i++ ) {
                if( $maskParts[$i]['type'] === '$' ) {
                    $formattedNumber = $formattedNumber . $maskParts[$i]['value'];
                }
                else if( $maskParts[$i]['type'] === '^' ) {
                    if( $maskParts[$i]['value'] === '' ) $formattedNumber = $formattedNumber . '0';
                    else $formattedNumber = $formattedNumber . $maskParts[$i]['value'];
                }
                else if( $maskParts[$i]['type'] === '@' ) {
                    if( $maskParts[$i]['value'] === '' ) $formattedNumber = $formattedNumber . 'A';
                    else $formattedNumber = $formattedNumber . $maskParts[$i]['value'];
                }
                else if( $maskParts[$i]['type'] === '#' ) {
                    if( $maskParts[$i]['value'] === '' ) $formattedNumber = $formattedNumber . str_pad('', $maskParts[$i]['length'], '0');
                    else $formattedNumber = $formattedNumber . str_pad($maskParts[$i]['value'], $maskParts[$i]['length'], '0');
                }
                else if( $maskParts[$i]['type'] === '' ) {
                    $formattedNumber = $formattedNumber . $maskParts[$i]['value'];
                }
            }
            
            return $formattedNumber;
        }
        
        // Function to check if a value conforms to a provided mask.
        //
        // Mask Format:
        //
        // $: Any printable character.
        // ^: Any alpha-numeric character.
        // @: Any alphabet character.lexpro.financial_institutions
        // #: Any numeric character.  Consecutive numeric characters will be handled as a single number.  For example ### will format to 001, 002, 003, ..., 999.
        // Any other character will be interpreted as the character literal.
        //
        // mask                 The mask to check the account number against.
        // accountNumber        The account to check.
        // return               True if the account number is valid and false if not.
        public static function checkAccountNumber(string $mask, string $accountNumber) : bool {
            // The account number cannot be valid if it is not the same length as the mask.
            if( strlen($mask) !== strlen($accountNumber) ) return false;
            
            for( $i = 0; $i < strlen($mask); $i++ ) {
                if( $mask[$i] === '^' ) {
                    // Check that the accountNumber has an alpha numeric character at index i.
                    if( (strtoupper($accountNumber[$i]) < 'A' || strtoupper($accountNumber[$i]) > 'Z') && ($accountNumber[$i] < '0' || $accountNumber[$i] > '9')) {
                        return false;
                    }
                }
                else if( $mask[$i] === '@' ) {
                    // Check that the account number is an alphabet character.
                    if( strtoupper($accountNumber[$i]) < 'A' || strtoupper($accountNumber[$i]) > 'Z' ) return false;
                }
                else if( $mask[$i] === '$' ) {
                    // Check that the accountNumber has any printable character at index i.
                    
                }
                else if( $mask[$i] === '#' ) {
                    // Check that the accountNumber has a digit at index i.
                    if( $accountNumber[$i] < '0' || $accountNumber[$i] > '9' ) return false;
                }
                else {
                    // If no special character was given check that the accountNumber has the same character as the mask at index i.
                    if( $accountNumber[$i] !== $mask[$i] ) return false;
                }
            }
            
            return true;
        }
        
        // Function to load array of config values from the config table
        //
        // db                       A PostgresConnection object connected to the database to load the config from.
        // valueArray               An associative array with config values as keys.
        //
        //                          $values = [
        //                              'config_item_1' => null,
        //                              'config_item_2' => null
        //                          ]
        //
        //                          The function will then set each array item's value to the config value if found.
        //
        // return                   The amount of config values found and loaded.
        public static function loadConfigValues(Pgsql\PostgresConnection $db, array &$values) : int {
            // Build query to load required config values
            $sqlQuery = 'SELECT name, value FROM config WHERE name = ANY($1);';
            $sqlResult = $db->paramQuery($sqlQuery, ['{' . implode(',', array_keys($values)) . '}']);
            if( $sqlResult->isValid() !== true ) return 0;
            
            // Update values array with values found.
            $valuesFound = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $values[$sqlRow['name']] = $sqlRow['value'];
                $valuesFound++;
            }
            
            return $valuesFound;
        }
        
        // Function to sanitize a file name.
        public static function sanitizeFileName(string $fileName) : string {
            return str_replace(["\0", '\\', '/', ':', '*', '"', '<', '>', '|'], ' ', $fileName);
        }
        
        // Function to validate a South African ID number and extract the birth date and gender
        // idNumber         Required
        public static function validateSouthAfricanId($idNumber)  {
            
            $correct = true;
            $result = null;
      
            if ( !is_numeric($idNumber) ) {
                $result = [
                    'error' => true,
                    'errorMessage' => 'ID number contains non numeric characters'
                ];
                return $result;
            }
            
            if (strlen($idNumber) !== 13 ) {
                $result = [
                    'error' => true,
                    'errorMessage' => 'ID number does not appear to be the correct length'
                ];
                return $result;
            }
            
            $year = substr($idNumber, 0,2);
            $currentYear = date('y') % 100;
            $prefix = '19';
            
            if ($year < $currentYear) {
                $prefix = '20';
            }
            
            $idYear = $prefix.$year;
            
            $idMonth = substr($idNumber, 2,2);
            $idDate = substr($idNumber, 4,2);
            
            $fullDate = $idDate. "-" . $idMonth. "-" . $idYear;
            
            if (!$idYear == substr($idNumber, 0,2) && $idMonth == substr($idNumber, 2,2) && $idDate == substr($idNumber, 4,2)) {
                $result = [
                    'error' => true,
                    'errorMessage' => 'ID number birth date does not appear to be valid'
                ];
                return $result;
            }
            
            $genderCode = substr($idNumber, 6,4);
            
            $gender = 'Male';
            if ((int)$genderCode < 5000) {
                $gender = 'Female';
            }
            
            $citzenship = 'Resident';
            if ((int)substr($idNumber, 10,1)  === 0) {
                $citzenship = 'Citizen';
            }
            
            $total = 0;
            $count = 0;
            for ($i = 0;$i < strlen($idNumber);++$i) {
                
                $multiplier = $count % 2 + 1;
                $count ++;
                $temp = $multiplier * (int)$idNumber[$i];
                $temp = floor($temp / 10) + ($temp % 10);
                $total += $temp;
            }
            $total = ($total * 9) % 10;
            
            if ($total % 10 != 0) {
                $result = [
                    'error' => true,
                    'errorMessage' => 'ID number citizen check number appears to be invalid'
                ];
                return $result;
            }
            
            if ($correct) {
                $result = [
                    'error' => false,
                    'errorMessage' => '',
                    'birthDate' => $fullDate,
                    'gender' => $gender,
                    'saCitizen' => $citzenship
                ];
                return $result;
            }
        }
        
        /**
         * Function to validate Date
         * @param {date} 
         * @return bool
         */
        public static function isDateValid(string $date) : bool {
            $format = 'Y-m-d';
            $d = DateTime::createFromFormat($format, $date);
            return $d && $d->format($format) == $date;
        }
        
        /**
         * Function to validate if is yes or no
         * @param {String} value
         * @return bool
         */
        public static function isYesOrNo($value) : bool {
            $value = strtoupper($value);
            if ($value == 'YES' || $value == 'NO') {
                return true;
            }
            return false;
        }
        
        /**
         * Function to check payment method 
         * @param {String} value
         * @return bool
         */
        public static function checkPaymentMethod($value) : bool {
            $value = strtoupper($value);
            switch ($value) {
                case "CASH":
                case "CHEQUE":
                case "EFT":
                    return true ;
                default:
                    return false;
            }
        }
        
        /**
         * 
         * Function to check payment method types
         * @param {String} $value
         * @return bool
         */
        public static function checkPaymentPeriod($value) : bool {
            $value = strtoupper($value);
            switch ($value) {
                case "WEEKLY":
                case "EVERY TWO WEEKS":
                case "MONTHLY":
                    return true ;
                default:
                    return false;
            }
        }
        
        /**
         * Function to check payment day is valid or not
         * @param {String} $day
         * @return bool 
         */
        public  static  function isPaymentDayValid($day) : bool {
            if (is_numeric($day)) {
                $day = intval($day);
                if ($day >= 1 && $day <= 28) {
                    return true;
                }
            } else {
                if (strtoupper($day) == "LAST DAY") {
                    return true;
                }
            }
            return false;
        }
        
        /**
         * Function to check employment status
         * @param {String} $day
         * @return bool 
         */
        public  static  function isEmploymentStatusValid($status) : bool {
            $value = strtoupper($status);
            if (($value) == "DISMISSED" || ($value) == "EMPLOYED") {
                    return true;
            } else {
                    return false;
            }
        }
        
        /**
         * Function to limit employees
         * @param {$db} Holds the database connection
         * @return void
         */
        public static function checkCompanyEmployeeLimit($db) : void {
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            // Get the employee limit for the relevant company
            $sqlQuery =
                'SELECT ' .
                    'companies.employee_limit ' . 
                'FROM ' . 
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $_SESSION['userData']['companyId']      // company_id
            ]);
            if( !$sqlResult->isValid() ) {
                die( json_encode(['ok' => false, 'error' => 'Unable to get company employee limit.']) );
            }
            if( $sqlResult->getRowCount() !== 1 ) {
                die(json_encode(['ok' => false, 'error' => 'Company not found.' 
                ]) );
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeLimit = $sqlRow['employee_limit'];
            // Set search path to the schema
            $dbSettings = $_SESSION['dbCache'];
            $sqlResult = $db->paramQuery('SET search_path TO '. $dbSettings['schema'] . ';', []);
            if( !$sqlResult->isValid() ) {
                die( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to schema.']) );
            }
            // Is there an employment limit?
            if( $employeeLimit !== null ) {
                // Get the number of employees for the company
                $sqlQuery =
                    'SELECT ' .
                        'COUNT( id ) AS employee_count ' . 
                    'FROM ' . 
                        'employees ' .
                    'WHERE ' .
                        'employment_end_date IS NULL;';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    die( json_encode(['ok' => false, 'error' => 'Unable to get number of employees.']) );
                }
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['employee_count'] >= $employeeLimit ) {
                    die( json_encode(['ok' => false, 'error' => 'Unable to add another employee. Your company is limited to ' . $employeeLimit. ' employees.']) );
                }
            }
            
        }
        
        /**
         * Function to check if country exists
         * @param {any} country
         * @return bool
         */
        public static function isCountryValid($country, $db) : bool {
            $countryUpper = strtoupper($country);
            $sqlQuery = 'SELECT name FROM countries WHERE UPPER(name) = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$countryUpper]);
            if (!$sqlResult->isValid()) {
                die(json_encode(['ok' => false, 'error' => 'Database error.']) );
            }
            if ($sqlResult->getRowCount() >= 1) {
                return true;
            }
            return false;
        }
        
        /**
         * Function to check if date of birth matches ID
         * @param {idNumber}
         * @param {dateOfBirth}
         * @return bool
         */
        public static function isDateOfBirthSameAsID($idNumber,$dateOfBirth) : bool {  
            return substr($idNumber, 0, 6) == substr(str_replace('-','',$dateOfBirth),2, 6);
        }
        
        /**
         * Function to check isWeekDayValid
         * @param {$day}
         * @return bool
         */
        public static function  isWeekDayValid($day) : bool {
            $daysOfWeek = array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
            return in_array(ucfirst(strtolower($day)),  $daysOfWeek);
        }
        
        /**
         * Function to check isBiWeekDayValid
         * @param {$day}
         * @return bool
         */
        public static function  isBiWeekDayValid($day) : bool {
            $daysOfWeek = array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
            return in_array(ucfirst(strtolower($day)),  $daysOfWeek);
            // $biWeekDays = array(
            //     "week 1: sunday",
            //     "week 1: monday",
            //     "week 1: tuesday",
            //     "week 1: wednesday",
            //     "week 1: thursday",
            //     "week 1: friday",
            //     "week 1: saturday",
            //     "week 2: sunday",
            //     "week 2: monday",
            //     "week 2: tuesday",
            //     "week 2: wednesday",
            //     "week 2: thursday",
            //     "week 2: friday",
            //     "week 2: saturday"
            // );
            // return in_array(strtolower($day), $biWeekDays);
        }
    }
?>
