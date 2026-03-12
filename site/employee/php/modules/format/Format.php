<?php
    
	//Make sure that this file was not accessed directly
	System::denyDirectAccess();
    
    // Create the Email class
    class Format
    {
        //
        // PUBLIC CLASS FUNCTIONS
        //
        
        // Function to check if a string is a valid date in the 'yyyy-mm-dd' format.
        //
        // $dateString          The string to check
        // return               True if the date is in the correct format
        public static function isDate( $dateString )
        {
            if( strlen($dateString) !== 10 ) return false;
            
            for( $i = 0; $i < strlen($dateString); $i++ ) {
                $char = $dateString[$i];
                if( ($char < '0' || $char > '9') && $char !== '-' ) return false;
            }
            
            $year = intval(substr($dateString, 0, 4));
            $month = intval(substr($dateString, 5, 2));
            $day = intval(substr($dateString, 8, 2));
            
            return checkdate($month, $day, $year);
        }
        
        // Function to check if a string is a valid float number
        //
        // $floatString         The string to check
        // return               True if the string is a valid float value and false otherwise.
        public static function isFloat( $floatString ) {
            if( $floatString === '' ) return false;
            $dotCount = 0;
            
            for( $i = 0; $i < strlen($floatString); $i++ ) {
                $char = $floatString[$i];
                $invalidCharacter = false;
                
                if( ($char === '+' || $char === '-') ) {
                    if( $i !== 0 ) return false;
                }
                else if( $char === '.' ) {
                    $dotCount++;
                    if( $dotCount === 1 ) $invalidCharacter = false;
                }
                else if( $char < '0' || $char > '9' ) {
                    return false;
                }
            }
            
            return true;
        }
        
        // Function to check if a string is a valid integer number
        //
        // $intString       The string to check
        // return           True if the string is a valid integer value and false otherwise.
        public static function isInteger( $intString ) {
            if( $intString === '' ) return false;
            
            for( $i = 0; $i < strlen($intString); $i++ ) {
                $char = $intString[$i];
                
                if( $char < '0' || $char > '9' ) return false;
            }
            
            return true;
        }
    }
?>