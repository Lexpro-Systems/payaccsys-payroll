<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // TYPES CONTROLLER CLASS
    //
    
    class Types extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list sic codes
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getSicCodeList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC'
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . ' WHERE (sic_codes.code ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ';
                $whereClause = $whereClause . ' OR sic_codes.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            // Check that sort order given is valid
            if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
                echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
                return false;
            }
            
            // Process limit offset
            $limitOffset = '';
            if( $data['limit'] !== null ) {
                $sqlParams[] = $data['limit'];
                $limitOffset = $limitOffset . 'LIMIT $' . count($sqlParams) . ' ';
            }
            
            // Add offset if given
            if( $data['offset'] !== null ) {
                $sqlParams[] = $data['offset'];
                $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
            }
            
            // Load all sic codes from the sic_codes table
            $sqlQuery = 
                'SELECT ' .
                    'sic_codes.code, ' .
                    'sic_codes.name, ' .
                    'sic_codes.sic_division_code, ' .
                    'sic_divisions.name AS sic_division_name, ' .
                    'sic_codes.excluded_from_eti ' .
                'FROM ' .
                    'sic_codes ' .
                'LEFT JOIN ' .
                    'sic_divisions ON sic_divisions.code = sic_codes.sic_division_code ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'sic_codes.code ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create sic codes array
            $sicCodes = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $sicCodes[] = [
                    'code' => $sqlRow['code'],
                    'name' => $sqlRow['name'],
                    'sicDivisionCode' => $sqlRow['sic_division_code'],
                    'sicDivisionName' => $sqlRow['sic_division_name'],
                    'excludedFromEti' => $sqlRow['excluded_from_eti']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'sicCodes' => $sicCodes
            ]) );
            
            return true;
        }
    }
?>
