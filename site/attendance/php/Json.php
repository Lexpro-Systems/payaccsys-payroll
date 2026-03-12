<?php
    //Make sure that this file was not accessed directly
System::denyDirectAccess();

class Json {
    //
    // CLASS CONSTANTS
    //
    
    const TYPE_INT = 1;
    const TYPE_FLOAT = 2;
    const TYPE_NUMERIC = 3;
    const TYPE_BOOL = 4;
    const TYPE_STRING = 5;
    const TYPE_NON_EMPTY_STRING = 6;
    const TYPE_DATE = 7;
    const TYPE_OBJECT = 8;
    const TYPE_ARRAY = 9;
    const TYPE_EMAIL = 10;
    const TYPE_TIMESTAMP = 11;
    
    const OVERWRITE_DUPLICATES = 1;
    const IGNORE_DUPLICATES = 2;
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    // Function to check a associative array of parameters for invalid values.
    //
    // parameters           The associative array of parameters to check.
    // rules                An associative array giving rules to check the parameters against.
    //                      Two or more checks can be combined with the OR operator.
    //
    //                      $rules = [
    //                          'param1' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false, 'rules' => null],
    //                          'param2' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
    //                              'param2Name' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
    //                              'param2Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
    //                          ]],
    //                          'param3' => ['type' => Json::TYPE_ARRAY, 'itemType' => Json::TYPE_OBJECT, 'required' => true, 'rules' => [
    //                              'param2Name' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
    //                              'param2Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
    //                          ]]
    //                      ];
    public static function validate($params, $rules) {
        return self::checkJSONRequestObject($params, $rules, '');
    }
    
    // Function to copy one JSON object to another.
    //
    // src                  The source JSON object to copy from.
    // target               The target JSON object to copy to.
    // duplicatePolicy      What to do if there is a duplicate item.  Will ignore duplicates by default.
    //                      - OVERWITE_DUPLICATES:      Overwrite the value in 'src' with the value in 'target'.
    //                      - IGNORE_DUPLICATES:        Do not copy value from 'target' to 'src' if it there is already a value in 'target'.
    public static function copy(& $src, & $target, $duplicatePolicy = self::IGNORE_DUPLICATES) {
        
        if( $target === null ) $target = [];
        
        foreach( $src AS $itemKey => $itemValue ) {
            if( is_array($itemValue) ) {
                // If the target does not have the item, add it.
                if( !array_key_exists($itemKey, $target) ) $target[$itemKey] = [];
                
                // If the target item is not an array then skip it.
                if( !is_array($target[$itemKey]) ) continue;
                   
                self::copy($itemValue, $target[$itemKey]);
            }
            else {
                if( $duplicatePolicy === self::OVERWRITE_DUPLICATES ) {
                    $target[$itemKey] = $src[$itemKey];
                }
                else if( $duplicatePolicy === self::IGNORE_DUPLICATES ) {
                    if( !array_key_exists($itemKey, $target) ) $target[$itemKey] = $src[$itemKey];
                }
            }
        }
    }
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to check if a value is of a given JSON Request type.
    //
    // type             The type of the value.
    // value            The value to check.
    private static function checkJSONRequestType($type, $value) {
        if( $type === self::TYPE_INT ) {
            if( !is_int($value) ) return 'Integer value expected.';
        }
        else if( $type === self::TYPE_FLOAT ) {
            if( !is_float($value) ) return 'Float value expected.';
        }
        else if( $type === self::TYPE_NUMERIC ) {
            if( !is_numeric($value) ) return 'Numeric value expected.';
        }
        else if( $type === self::TYPE_BOOL ) {
            if( !is_bool($value) ) return 'Boolean value expected.';
        }
        else if( $type === self::TYPE_STRING ) {
            if( !is_string($value) ) return 'String value expected.';
        }
        else if( $type === self::TYPE_NON_EMPTY_STRING ) {
            if( !is_string($value) || strlen($value) === 0 ) return 'Non empty string expected.';
        }
        else if( $type === self::TYPE_DATE ) {
            if( strlen($value) !== 10 ) return 'Date value expected.';
            
            for( $i = 0; $i < strlen($value); $i++ ) {
                $char = $value[$i];
                if( ($char < '0' || $char > '9') && $char !== '-' ) return 'Date value expected.';
            }
            
            $year = intval(substr($value, 0, 4));
            $month = intval(substr($value, 5, 2));
            $day = intval(substr($value, 8, 2));
            
            if( !checkdate($month, $day, $year) ) return 'Value is not a valid date.';
        }
        else if( $type === self::TYPE_TIMESTAMP ) {
            if( strlen($value) !== 19 ) return 'Timestamp value expected.';
            
            // Check that all expected characters are numeric
            for( $i = 0; $i < strlen($value); $i++ ) {
                $char = $value[$i];
                
                // Skip space, '-' and ':' positions 2020-03-12 18:04:21
                if( $i === 4 || $i === 7 || $i === 10 || $i === 13 || $i === 16 ) continue;
                
                if( ($char < '0' || $char > '9') ) return 'Date value expected.';
            }
            
            // Check the date part.
            $year = intval(substr($value, 0, 4));
            $month = intval(substr($value, 5, 2));
            $day = intval(substr($value, 8, 2));
            
            if( !checkdate($month, $day, $year) ) return 'Provided date is not valid.';
            
            // Check the time part
            $hours = intval(substr($value, 11, 2));
            if( $hours > 24 ) return 'Invalid hours specified for timestamp';
            $minutes = intval(substr($value, 14, 2));
            if( $minutes > 59 ) return 'Invalid minutes specified for timestamp';
            $seconds = intval(substr($value, 17, 2));
            if( $seconds > 59 ) return 'Invalid seconds specified for timestamp';
            
        }
        else if( $type === self::TYPE_OBJECT ) {
            // The parameter must be an array
            if( !is_array($value) ) return 'Object expected.';
        }
        else if( $type === self::TYPE_ARRAY ) {
            // The parameter must be an array
            if( !is_array($value) ) return 'Array expected.';
        }
        else if( $type === self::TYPE_EMAIL ) {
            if( !is_string($value) && strlen($value) <= 0 ) return 'Email address expected.';
        }
        
        return true;
    }
    
    // Function to check if a JSON Request Array is valid.
    //
    // itemArray                The array to check.
    // rules                    The rules to use when checking the array.
    // path                     The path to prepend before any error results.
    private static function checkJSONRequestArray($itemArray, $rules, $path) {
        // If no rules are provided then we cant check the array.
        if( $rules === null ) return true;
        
        // Get the amount of rules provided.
        $ruleCount = count($rules);
        
        // Rules must have at least one item.
        if( count($rules) === 0 ) return true;
        
        for( $i = 0; $i < count($itemArray); $i++ ) {
            // Get the rule to use for checking the array item.
            $rule = $rules[($i % $ruleCount)];
            
            // If nullable was specified check that the item is not null
            if( array_key_exists('nullable', $rule) && $rule['nullable'] === false ) {
                if( $itemArray[$i] === null ) return 'Invalid value for ' . trim($path, '.') . '[' . $i . ']. Value can not be null.';
            }
            
            // If a type was specified check array item type.
            if( array_key_exists('type', $rule) && $itemArray[$i] !== null ) {
                $typeCheckResult = self::checkJSONRequestType($rule['type'], $itemArray[$i]);
                if( $typeCheckResult !== true ) return 'Invalid value for ' . trim($path, '.') . '[' . $i . ']' . '. ' . $typeCheckResult;
                
                // If the item is an object and there is a rule for it check the object against the rule.
                if( $rule['type'] === self::TYPE_OBJECT && array_key_exists('rules', $rule) ) {
                    $checkResult = self::checkJSONRequestObject($itemArray[$i], $rule['rules'], trim($path, '.') . '[' . $i . ']');
                    if( $checkResult !== true ) return $checkResult;
                }
                else if( $rule['type'] === self::TYPE_ARRAY && array_key_exists('rules', $rule) ) {
                    $checkResult = self::checkJSONRequestArray($itemArray[$i], $rule['rules'], trim($path, '.') . '[' . $i . ']');
                    if( $checkResult !== true ) return $checkResult;
                }
            }
        }
        
        return true;
    }
    
    // Function to check if a JSON Request Object (associative array in PHP) is valid.
    //
    // object                   The JSON object (associative array) to check.
    // rules                    The rules to use when checking the JSON object.
    // path                     The path to prepend before any error results.
    private static function checkJSONRequestObject($object, $rules, $path) {
        foreach( $rules as $ruleKey => $rule ) {
            // Check if the parameter is required
            if( array_key_exists('required', $rule) && $rule['required'] === true && (!is_array($object) || !array_key_exists($ruleKey, $object)) ) {
                return ltrim($path . '.', '.') . $ruleKey . ' is required.';
            }
            
            // If a parameter matching the rule does not exist do not do the other checks
            if( !is_array($object) || !array_key_exists($ruleKey, $object) ) continue;
            
            // Check the type of the parameter if it is not null.
            if( array_key_exists('type', $rule) && $object[$ruleKey] !== null ) {
                $typeCheckResult = self::checkJSONRequestType($rule['type'], $object[$ruleKey]);
                if( $typeCheckResult !== true ) return 'Invalid value for ' . ltrim($path . '.', '.') . $ruleKey . '. ' . $typeCheckResult;
                
                // If the item is an object and there is a rule for ite check the object against the rule.
                if( $rule['type'] === self::TYPE_OBJECT && array_key_exists('rules', $rule) ) {
                    $checkResult = self::checkJSONRequestObject($object[$ruleKey], $rule['rules'], ltrim($path . '.', '.') . $ruleKey);
                    
                    if( $checkResult !== true ) return $checkResult;
                }
                else if( $rule['type'] === self::TYPE_ARRAY ) {
                    if( array_key_exists('rules', $rule) ) {
                        $checkResult = self::checkJSONRequestArray($object[$ruleKey], $rule['rules'], ltrim($path . '.', '.') .$ruleKey);
                        if( $checkResult !== true ) return $checkResult;
                    }
                }
            }
            
            // Check if the value is allowed to be null
            if( array_key_exists('nullable', $rule) && $rule['nullable'] === false && $object[$ruleKey] === null ) {
                return 'Invalid value for ' . ltrim($path . '.', '.') . $ruleKey . '. Value can not be null.';
            }
        }
        
        // If all checks passed return true
        return true;
    }
}

?>