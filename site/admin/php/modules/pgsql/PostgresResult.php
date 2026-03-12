<?php
	
	namespace Pgsql;	
	
	//Make sure that this file was not accessed directly
	\System::denyDirectAccess();
	
	class PostgresResult
	{
        //
		// PRIVATE MEMBER VARIABLES
		//
		
		private $result;		    // The result resource id.
        private $errorStr;		    // The error message associated with this result.
        private $typeConversions;   // An array specifying earch column that needs its type converted.
        
        
        //
        // PRIVATE CLASS FUNCTIONS
        //
        
        // Function to convert types such as boolean, int and float from string to native PHP types.
        //
        // row              The row to convert.  Passed by reference.
        // rules            An array of rules to use when doing the conversion.
        // ruleIndex        The index in the rule to use when converting.
        //
        // return           True on success and false otherwise.
        private static function castRowTypes(&$row, $rules, $ruleIndex) {
            if( array_key_exists('bool', $rules) ) {
                foreach($rules['bool'] as $rule ) {
                    if( $row[$rule[$ruleIndex]] !== null ) $row[$rule[$ruleIndex]] = ($row[$rule[$ruleIndex]] === 't');
                }
            }
            if( array_key_exists('int', $rules) ) {
                foreach($rules['int'] as $rule ) {
                    if( $row[$rule[$ruleIndex]] !== null ) $row[$rule[$ruleIndex]] = intval($row[$rule[$ruleIndex]]);
                }
            }
            if( array_key_exists('float', $rules) ) {
                foreach($rules['float'] as $rule ) {
                    if( $row[$rule[$ruleIndex]] !== null ) $row[$rule[$ruleIndex]] = floatval($row[$rule[$ruleIndex]]);
                }
            }
            if( array_key_exists('double', $rules) ) {
                foreach($rules['double'] as $rule ) {
                    if( $row[$rule[$ruleIndex]] !== null ) $row[$rule[$ruleIndex]] = doubleval($row[$rule[$ruleIndex]]);
                }
            }
            
            return true;
        }
		
		
        //
		// PUBLIC MEMBER FUNCTIONS
		//
        
		// Class constructor
		public function __construct($dbResultObject = null, $error = '') {
			$this->result = $dbResultObject;
			$this->errorStr = $error;
            
            // Check for type conversions
            $this->typeConversions = [];
            if( $this->result !== null ) {
                for( $i = 0; $i < pg_num_fields($this->result); $i++ ) {
                    $fieldType = pg_field_type($this->result, $i);
                    
                    if( $fieldType === 'bool' ) $this->typeConversions['bool'][] = [$i, pg_field_name($this->result, $i)];
                    else if( $fieldType === 'int2' ) $this->typeConversions['int'][] = [$i, pg_field_name($this->result, $i)];
                    else if( $fieldType === 'int4' ) $this->typeConversions['int'][] = [$i, pg_field_name($this->result, $i)];
                    else if( $fieldType === 'int8' ) $this->typeConversions['int'][] = [$i, pg_field_name($this->result, $i)];
                    else if( $fieldType === 'float4' ) $this->typeConversions['float'][] = [$i, pg_field_name($this->result, $i)];
                    else if( $fieldType === 'float8' ) $this->typeConversions['double'][] = [$i, pg_field_name($this->result, $i)];
                }
            }
		}
		
		// Class destructor
		public function __destruct() {
			if( $this->result != null ) {
				pg_free_result( $this->result );
				$this->result = null;
			}
		}
        
        // Function to check if the result is valid or not.
        public function isValid() {
            return ($this->result != null);
        }
        
        // Function to get the error message associated with this result
        public function getError() {
            return $this->errorStr;
        }
		
		// Function to fetch a row from the result
        //
		// return           If the resultset is not empty then return the next row
		//                  On error return false
		public function fetchRow() {
			if( $this->result == null )
			{
				$this->lastError = 'Could not fetch row. Result is null.';
				return false;
			}
			
			$row = pg_fetch_row($this->result);
            if( $row === false ) return false;
            
            self::castRowTypes($row, $this->typeConversions, 0);
            
            return $row;
		}
		
		// Function to fetch a row as an array wich can be accessed both by
		// the numeric index of the column (first row starts at 0) and by the column name
        //
		// return           If the resultset is not empty then return the next row
		//                  On error return false
		public function fetchArray() {
			if( $this->result == null )
			{
				$this->lastError = 'Could not fetch row as array. Result is NULL.';
				return false;
			}
            
			$row = pg_fetch_array($this->result);
            if( $row === false ) return false;
            
            self::castRowTypes($row, $this->typeConversions, 0);
            
            return $row;
		}
		
		// Funtion to fetch the results as an associative array that can only be accessed by the column name
		// and not by the index aswell.
        //
		// return           If the resultset is not empty then return the next row
		//                  On error return false
		public function fetchAssociative() {
			if( $this->result == null )
			{
				$this->lastError = 'Could not fetch row as associative array. Result is null.';
				return false;
			}
            
			$row = pg_fetch_assoc($this->result);
            if( $row === false ) return false;
            
            self::castRowTypes($row, $this->typeConversions, 1);
            
            return $row;
		}
		
		// Function to check wether the result is empty. An empty result is the result of a query that
		// does not return any data from the server such as an UPDATE statement.
        //
		//return            If the result is empty true is returned if it is not empty then false is returned
		public function isEmpty() {
			if( pg_result_status($this->result) == PGSQL_EMPTY_QUERY ) return true;
			
			return false;
		}
		
		// Function to check wether the result is NULL
		public function isNull() {
			if( $this->result == null ) return true;
			
			return false;
		}
		
		// Function to find the ammount of rows in the result set.
        //
		// return           Returns the amount of items int the resultset
		public function getRowCount() {
			return pg_num_rows($this->result);
		}
        
        // Function to find the amount of fields in the result set.
        public function getFieldCount() {
            return pg_num_fields($this->result);
        }
        
        // Function to move to a specific index in the result
        //
        // index            The index in the result to move to.
        // return           True on success and false on failure.
        public function seek( $index ) {
            return pg_result_seek($this->result, $index);
        }
		
		// Function to clear the result
		public function free() {
			if( $this->result != null ) {
				pg_free_result( $this->result );
				$this->result = null;
			}
		}
	}
	
?>