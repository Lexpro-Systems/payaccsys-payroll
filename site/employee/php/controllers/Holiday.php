<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // HOLIDAY CONTROLLER CLASS
    //
    
    class Holiday extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list public holidays
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'fromDate' => '',
                'toDate' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'holidayName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . ' WHERE ( ' .
                $whereClause = $whereClause . '( public_holidays.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . '( TO_CHAR(public_holidays.date, \'YYY-MM-DD\') ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
                $whereClause = $whereClause . ') ';
            }
            
            // Add filter for the from date, of any
            if( $data['fromDate'] !== '' ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                $sqlParams[] = $data['fromDate'];
                $whereClause = $whereClause . 'TO_CHAR(public_holidays.date, \'YYYY-MM-DD\') >= $' . count($sqlParams) . ' ';
            }
            
            // Add filter for the to date, of any
            if( $data['toDate'] !== '' ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                $sqlParams[] = $data['toDate'];
                $whereClause = $whereClause . 'TO_CHAR(public_holidays.date, \'YYYY-MM-DD\') <= $' . count($sqlParams) . ' ';
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
            
            // Load all holidays from the public_holidays table
            $sqlQuery = 
                'SELECT ' .
                    'public_holidays.id, ' . 
                    'public_holidays.date, ' . 
                    'public_holidays.name ' . 
                'FROM ' .
                    'public_holidays ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'public_holidays.date ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create holidays array
            $holidays = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $holidays[] = [
                    'id' => $sqlRow['id'],
                    'date' => $sqlRow['date'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'holidays' => $holidays]) );
            return true;
        }
    }
?>
