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
        // @: Any alphabet character.
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
        
        // Function to check company access for a given user and company
        //  companyId               The id of the company to check
        //  userId                  The id of the user to check
        //  db                      A PostgresConnection object connected to the database to do the check in
        public static function checkCompanyAccess(int $companyId, int $userId, Pgsql\PostgresConnection $db) : bool {
            // Make sure the user's group has access to the company
            $sqlQuery = 
                'SELECT DISTINCT ' . 
                    'admin_group_companies.company_id ' . 
                'FROM ' . 
                    'admin_group_companies ' . 
                'LEFT JOIN ' . 
                    'admin_groups ON admin_groups.id = admin_group_companies.admin_group_id ' . 
                'LEFT JOIN ' . 
                    'admin_group_users ON admin_group_users.admin_group_id = admin_groups.id ' . 
                'WHERE ' . 
                'admin_group_companies.company_id = $1 AND ' .
                'admin_group_users.user_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $companyId,
                $userId
            ]);
            if( !$sqlResult->isValid() ) {
                return false;
            }
            
            if( $sqlResult->getRowCount() < 1 ) {
                return false;
            }
            
            return true;
        }
    }
?>
