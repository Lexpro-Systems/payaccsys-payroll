<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();

    //
    // NUMBER MASK CLASS
    //
    
    class NumberMask {
        
        //
        // PRIVATE CONSTANTS
        //
        
        private const MASK_CLASS_ANY = 0;           // Mask character $
        private const MASK_CLASS_ALPHANUMERIC = 1;  // Mask character ^
        private const MASK_CLASS_ALPHA = 2;         // Mask character @
        private const MASK_CLASS_NUMERIC = 3;       // Mask character #
        private const MASK_CLASS_LITERAL = 4;       // Any other mask character
        
        private const CLASS_MASK = 0;
        private const CLASS_LENGTH = 1;
        private const CLASS_TYPE = 2;
        private const CLASS_SIZE = 3;
        private const CLASS_VALUE = 4;
        private const CLASS_MIN = 5;
        private const CLASS_MAX = 6;
        
        
        //
        // PRIVATE VARIABLES
        //
        
        private $mask;
        private $classes;
        private $magnitudes;
        private $classCount;
        private $iterable;
        
        
        //
        // PUBLIC MEMBER FUNCTIONS
        //
        
        // Class constructor
        //
        // mask             The mask to use.
        public function __construct(string $mask) {
            $this->mask = $mask;
            $this->iterable = true;
            
            // Split the mask up into each of its parts
            $maskBuffer = '';
            $prevCharacter = '';
            for( $i = 0; $i < strlen($this->mask); $i++ ) {
                if( $this->mask[$i] !== $prevCharacter && strlen($maskBuffer) > 0 ) {
                    $this->classes[] = [self::CLASS_MASK => $maskBuffer];
                    $maskBuffer = '';
                }
                
                $maskBuffer = $maskBuffer . $this->mask[$i];
                $prevCharacter = $this->mask[$i];
            }
            
            // Add any remaining characters in the maskBuffer to classes
            if( strlen($maskBuffer) > 0 ) $this->classes[] = [self::CLASS_MASK => $maskBuffer];
            
            // Translate classes to classes and sizes and set initial value.
            for( $i = 0; $i < count($this->classes); $i++ ) {
                $this->classes[$i][self::CLASS_LENGTH] = strlen($this->classes[$i][self::CLASS_MASK]);
                
                if( $this->classes[$i][self::CLASS_MASK][0] === '$' ) {
                    $this->classes[$i][self::CLASS_TYPE] = self::MASK_CLASS_ANY;
                    $this->classes[$i][self::CLASS_SIZE] = 1;
                    $this->classes[$i][self::CLASS_VALUE] = $this->classes[$i][self::CLASS_MASK];
                    $this->classes[$i][self::CLASS_MIN] = $this->classes[$i][self::CLASS_MASK];
                    $this->classes[$i][self::CLASS_MAX] = $this->classes[$i][self::CLASS_MASK];
                    $this->iterable = false;
                }
                else if( $this->classes[$i][self::CLASS_MASK][0] === '^' ) {
                    $this->classes[$i][self::CLASS_TYPE] = self::MASK_CLASS_ALPHANUMERIC;
                    $this->classes[$i][self::CLASS_SIZE] = pow(36, $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_VALUE] = str_repeat('0', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MIN] = str_repeat('0', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MAX] = str_repeat('Z', $this->classes[$i][self::CLASS_LENGTH]);
                }
                else if( $this->classes[$i][self::CLASS_MASK][0] === '@' ) {
                    $this->classes[$i][self::CLASS_TYPE] = self::MASK_CLASS_ALPHA;
                    $this->classes[$i][self::CLASS_SIZE] = pow(26, $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_VALUE] = str_repeat('A', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MIN] = str_repeat('A', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MAX] = str_repeat('Z', $this->classes[$i][self::CLASS_LENGTH]);
                }
                else if( $this->classes[$i][self::CLASS_MASK][0] === '#' ) {
                    $this->classes[$i][self::CLASS_TYPE] = self::MASK_CLASS_NUMERIC;
                    $this->classes[$i][self::CLASS_SIZE] = pow(10, $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_VALUE] = str_repeat('0', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MIN] = str_repeat('0', $this->classes[$i][self::CLASS_LENGTH]);
                    $this->classes[$i][self::CLASS_MAX] = str_repeat('9', $this->classes[$i][self::CLASS_LENGTH]);
                }
                else {
                    $this->classes[$i][self::CLASS_TYPE] = self::MASK_CLASS_LITERAL;
                    $this->classes[$i][self::CLASS_SIZE] = 1;
                    $this->classes[$i][self::CLASS_VALUE] = $this->classes[$i][self::CLASS_MASK];
                    $this->classes[$i][self::CLASS_MIN] = $this->classes[$i][self::CLASS_MASK];
                    $this->classes[$i][self::CLASS_MAX] = $this->classes[$i][self::CLASS_MASK];
                }
            }
            
            $this->classCount = count($this->classes);
            
            // Calculate character magnitudes
            $curMagnitude = 1;
            for( $i = strlen($this->mask) - 1; $i >= 0; $i-- ) {
                if( $this->mask[$i] === '$' ) {
                    $this->magnitudes[$i] = null;
                }
                else if( $this->mask[$i] === '^' ) {
                    $this->magnitudes[$i] = $curMagnitude;
                    $curMagnitude = $curMagnitude * 36;
                }
                else if( $this->mask[$i] === '@' ) {
                    $this->magnitudes[$i] = $curMagnitude;
                    $curMagnitude = $curMagnitude * 26;
                }
                else if( $this->mask[$i] === '#' ) {
                    $this->magnitudes[$i] = $curMagnitude;
                    $curMagnitude = $curMagnitude * 10;
                }
                else {
                    $this->magnitudes[$i] = null;
                }
            }
        }
        
        // Function to move to a given value
        //
        // value            The value to 'seek' to.
        // return           True if the we were able if seek to the given value.  If the seek failed false is returned.
        public function seek(string $value) : bool {
            if( !$this->validate($value) ) return false;
            
            // If the value and mask match copy value to mask parts
            $valuePos = 0;
            for( $i = 0; $i < count($this->classes); $i++ ) {
                $this->classes[$i][self::CLASS_VALUE] = substr($value, $valuePos, $this->classes[$i][self::CLASS_LENGTH]);
                $valuePos = $valuePos + $this->classes[$i][self::CLASS_LENGTH];
            }
            return true;
        }
        
        // Function to get the current value
        //
        // return           The current value.
        public function getValue() : string {
            $value = '';
            for( $i = 0; $i < count($this->classes); $i++ ) $value = $value . $this->classes[$i][self::CLASS_VALUE];
            
            return $value;
        }
        
        // Function to go to the next value
        //
        // return           True if the series moved to the next value and false if no more values are avaialble.
        public function next() : bool {
            $incrementIndex = $this->classCount - 1;
            
            // Check if we should move up the position to increment
            if( $this->classes[$incrementIndex][self::CLASS_VALUE] >= $this->classes[$incrementIndex][self::CLASS_MAX] ) {
                while( $incrementIndex >= 0 ) {
                    // If the class is at its max reset it and move to the next one
                    if( $this->classes[$incrementIndex][self::CLASS_VALUE] >= $this->classes[$incrementIndex][self::CLASS_MAX] ) {
                        $this->classes[$incrementIndex][self::CLASS_VALUE] = $this->classes[$incrementIndex][self::CLASS_MIN];
                        
                        $incrementIndex--;
                        continue;
                    }
                    
                    // If the current class is not at its max then it is the one to increment.
                    break;
                }
                
                // Check that we have not run out of classes to increment
                if( $incrementIndex < 0 ) return false;
            }
            
            // Increment the class at incrementIndex
            $strPos = $this->classes[$incrementIndex][self::CLASS_LENGTH] - 1;
            while( $strPos >= 0 ) {
                // Check for overflow of 0 - 9.
                if( $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] === '9' ) {
                    if( $this->classes[$incrementIndex][self::CLASS_TYPE] === self::MASK_CLASS_ALPHANUMERIC ) {
                        $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] = 'A';
                        break;
                    }
                    else {
                        $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] = '0';
                        $strPos--;
                        continue;
                    }
                }
                
                // Check for overflow of A - Z.
                if( $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] === 'Z' ) {
                    if( $this->classes[$incrementIndex][self::CLASS_TYPE] === self::MASK_CLASS_ALPHANUMERIC ) {
                        $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] = '0';
                        $strPos--;
                        continue;
                    }
                    else if( $this->classes[$incrementIndex][self::CLASS_TYPE] === self::MASK_CLASS_ALPHA ) {
                        $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] = 'A';
                        $strPos--;
                        continue;
                    }
                }
                
                // Increment character at current position
                $this->classes[$incrementIndex][self::CLASS_VALUE][$strPos] = chr((ord($this->classes[$incrementIndex][self::CLASS_VALUE][$strPos]) + 1));
                break;
            }
            
            return true;
        }
        
        // Function to get the index of a value in the series
        //
        // value            The index for this value will be calculated.  If the value is not in the index then -1 is returned.
        // return           The value's index.
        public function getValueIndex(string $value) : int {
            // Check that the value matches the mask.
            if( !$this->validate($value) ) return false;
            
            // Make sure all characters are uppercase
            $value = strtoupper($value);
            
            $pos = strlen($value) - 1;
            $index = 0;
            while( $pos >= 0 ) {
                if( $this->mask[$pos] === '^' ) {
                    // It is an alphanumeric class. 55 is ordinal value of 'A'(65) minus 10 to adjust for the numeric values.
                    // 48 is ordinal value of '0'.
                    if( $value[$pos] >= 'A' && $value[$pos] <= 'Z' ) $index = $index + ((ord($value[$pos]) - 55) * $this->magnitudes[$pos]);
                    else $index = $index + ((ord($value[$pos]) - 48) * $this->magnitudes[$pos]);
                }
                else if( $this->mask[$pos] === '@' ) {
                    // It is an alpha class. 65 is ordinal value of 'A'.
                   $index = $index + ((ord($value[$pos]) - 65) * $this->magnitudes[$pos]);
                }
                else if( $this->mask[$pos] === '#' ) {
                    // It is an numeric class. 48 is ordinal value of '0'.
                    $index = $index + ((ord($value[$pos]) - 48) * $this->magnitudes[$pos]);
                }
                
                // Move to the next position
                $pos--;
            }
            
            return $index;
        }
        
        // Function to get an account number value from it's index
        //
        // index                The index of the account number.
        // return               The account number at given index or emtpy string if the index is out of bounds.
        public function getIndexValue(int $index) : string {
            $value = '';
            $indexLeft = $index;
            $posValue = 0;
            for( $i = 0; $i < strlen($this->mask); $i++ ) {
                // If the magnitude for this mask position is null then it is not taken into consideration for the index.
                if( $this->magnitudes[$i] === null ) {
                    $value = $value . $this->mask[$i];
                    continue;
                }
                    
                $posValue = (($indexLeft - ($indexLeft % $this->magnitudes[$i])) / $this->magnitudes[$i]);
                
                if( $this->mask[$i] === '^' ) {
                    if( $posValue >= 0 && $posValue <= 9 ) $value = $value . chr($posValue + 48);
                    else if( $posValue >= 10 && $posValue <= 35 ) $value = $value . chr($posValue + 55);
                    else return '';
                }
                else if( $this->mask[$i] === '@' ) {
                    if( $posValue >= 0 && $posValue <= 25 ) $value = $value . chr($posValue + 65);
                    else return '';
                }
                else if( $this->mask[$i] === '#' ) {
                    if( $posValue >= 0 && $posValue <= 9 ) $value = $value . chr($posValue + 48);
                    else return '';
                }
                
                $indexLeft = $indexLeft % $this->magnitudes[$i];
            }
            
            return $value;
        }
        
        // Function to format a value according to the mask
        //
        // Mask Format:
        //
        // $: Any printable character.
        // ^: Any alpha-numeric character.
        // @: Any alphabet character.
        // #: Any numeric character.  Consecutive numeric characters will be handled as a single number.  For example ### will format to 001, 002, 003, ..., 999.
        // Any other character will be interpreted as the character literal.
        //
        // value                The value to format.
        // return               The formatted value.
        public function format(string $value) : string {
            // If the account number is the same length or longer than the mask we cannot format it.
            if( strlen($value) >= strlen($this->mask) ) return $value;
            
            $formattedNumber = '';
            
            $maskLen = strlen($this->mask);
            $maskPos = $maskLen - 1;
            $upperValue = strtoupper($value);
            $valueLen = strlen($value);
            $valuePos = $valueLen - 1;
            $valueChar = $upperValue[$valuePos];
            
            while( $maskPos >= 0 ) {
                if( $this->mask[$maskPos] === '$' ) {
                    // It is any character.
                    if( $valuePos < 0 ) return $value;
                    $formattedNumber = $valueChar . $formattedNumber;
                    $valuePos--;
                    $valueChar = $upperValue[$valuePos];
                }
                else if( $this->mask[$maskPos] === '^' ) {
                    // It as an alphanumeric character
                    if( $valuePos >= 0 && ($valueChar >= 'A' && $valueChar <= 'Z') && ($valueChar >= '0' && $valueChar <= '9') ) {
                        $formattedNumber = $valueChar . $formattedNumber;
                        $valuePos--;
                        $valueChar = $upperValue[$valuePos];
                    }
                    else {
                        $formattedNumber = '0' . $formattedNumber;
                    }
                }
                else if( $this->mask[$maskPos] === '@' ) {
                    // It is an alpha character
                    if( $valuePos >= 0 && ($valueChar >= 'A' && $valueChar <= 'Z') ) {
                        $formattedNumber = $valueChar . $formattedNumber;
                        $valuePos--;
                        $valueChar = $upperValue[$valuePos];
                    }
                    else {
                        $formattedNumber = 'A' . $formattedNumber;
                    }
                }
                else if( $this->mask[$maskPos] === '#' ) {
                    // It is a numeric character
                    if( $valuePos >= 0 && ($valueChar >= '0' && $valueChar <= '9') ) {
                        $formattedNumber = $valueChar . $formattedNumber;
                        $valuePos--;
                        $valueChar = $upperValue[$valuePos];
                    }
                    else {
                        $formattedNumber = '0' . $formattedNumber;
                    }
                }
                else {
                    // It is a character literal
                    if( $valuePos >= 0 && $valueChar === $this->mask[$maskPos] ) {
                        $formattedNumber = $valueChar . $formattedNumber;
                        $valuePos--;
                        $valueChar = $upperValue[$valuePos];
                    }
                    else {
                        $formattedNumber = $this->mask[$maskPos] . $formattedNumber;
                    }
                }
                
                $maskPos--;
            }
            
            // If there are characters left in the value that was unused then the provided value was invalid
            if( $valuePos >= 0 ) return $value;
            
            return $formattedNumber;
        }
        
        // Function to check that a value matches the mask.
        //
        // value            The value to check.
        // return           True if the value is valid and false if not.
        public function validate(string $value) : bool {
            // Check that the mask and value is the same length
            if( strlen($value) !== strlen($this->mask) ) return false;
            
            // Make sure the value matches the mask.
            for( $i = 0; $i < strlen($this->mask); $i++ ) {
                if( $this->mask[$i] === '^' ) {
                    // Check that the accountNumber has an alpha numeric character at index i.
                    if( (strtoupper($value[$i]) < 'A' || strtoupper($value[$i]) > 'Z') && ($value[$i] < '0' || $value[$i] > '9')) return false;
                }
                else if( $this->mask[$i] === '@' ) {
                    // Check that the account number is an alphabet character at index i.
                    if( strtoupper($value[$i]) < 'A' || strtoupper($value[$i]) > 'Z' ) return false;
                }
                else if( $this->mask[$i] === '$' ) {
                    // Check that the accountNumber has any printable character at index i.
                    
                }
                else if( $this->mask[$i] === '#' ) {
                    // Check that the accountNumber has a digit at index i.
                    if( $value[$i] < '0' || $value[$i] > '9' ) return false;
                }
                else {
                    // If no special character was given check that the accountNumber has the same character as the mask at index i.
                    if( $value[$i] !== $this->mask[$i] ) return false;
                }
            }
            
            return true;
        }
    }
?>
