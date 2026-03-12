<?php

//Make sure that this file was not accessed directly
System::denyDirectAccess();

class Security {
    
    //
    // CLASS CONSTANTS
    //
    
    
    //
    // PUBLIC CLASS FUNCTIONS
    //
    
    // Function to generate a cryptographic secure random string.  By default it will return a string with characters in the sets
    // a-z, A-Z and 0-9.  Additional characters can be added with the $extendedCharacters parameter.
    //
    // length                   The length of the string to generate
    // extendedCharacters       An optional parameter to add additional characters to use when generating a string
    // return                   A string with 'lenght' amount of characters
    public static function generateRandomString($length, $extendedCharacters = '') {
        $dictionary = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' . $extendedCharacters;
        $randMax = strlen($dictionary) - 1;
        $string = '';
        
        if( function_exists('random_int') === true ) {
            for( $i = 0; $i < $length; $i++ ) $string = $string . $dictionary[random_int(0, $randMax)];
        }
        else if( function_exists('mt_rand') === true ) {
            for( $i = 0; $i < $length; $i++ ) $string = $string . $dictionary[mt_rand(0, $randMax)];
        }
        else {
            die('Security::generateRandomString : ERROR : No secure random number generator available');
        }
        
        return $string;
    }
};

?>