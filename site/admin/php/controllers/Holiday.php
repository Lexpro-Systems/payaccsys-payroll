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
                $whereClause = $whereClause . '( TO_CHAR(public_holidays.date, \'YYYY-MM-DD\') ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
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
                $whereClause = $whereClause . 'TO_CHAR(public_holidays.date, \'YYY-MM-DD\') <= $' . count($sqlParams) . ' ';
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
                    'public_holidays.name, ' . 
                    'public_holidays.added_on ' . 
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
                    'name' => $sqlRow['name'],
                    'addedOn' => $sqlRow['added_on']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'holidays' => $holidays]) );
            return true;
        }
        
        // Function to add an holiday
        //
        // Required Parameters
        //  date            The date of the holiday to add
        //  name            The name of the holiday to add
        //
        // Optional Parameters
        //  None
        public function add($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'date' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE public_holidays IN EXCLUSIVE MODE;');
            
            // Build the query to insert the item
            $sqlQuery =
                'INSERT INTO ' .
                    'public_holidays ( ' .
                        'date, name, added_by_user_id, added_on ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1, $2, $3, $4 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['date'],  // date
                $data['name'],  // name
                $user['id'],    // added_by_user_id
                date('Y-m-d')   // added_on
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $holidayId = $sqlRow['id'];
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Select all companies
            $companySqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, ' .
                    'companies.database_schema ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.is_active = true ' . 
                'ORDER BY ' .
                    'companies.database_schema ASC;';
            $companySqlResult = $db->paramQuery($companySqlQuery, []);
            if( !$companySqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to get a list of companies.']) );
                return false;
            }
            
            // For every company
            while( $companySqlRow = $companySqlResult->fetchAssociative() ) {
                // Set the maximum execution time for a loop iteration to 600 seconds
                set_time_limit(600);
                
                // Connect to the database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to company database.']) );
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $companySqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to set search path to company schema.']) );
                    return false;
                }
                
                // Build the query to insert the item
                $sqlQuery =
                    'INSERT INTO ' .
                        'public_holidays ( ' .
                            'date, name ' .
                        ') ' .
                    'VALUES ( ' .
                            ' $1, $2 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['date'],  // date
                    $data['name']   // name
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true, 'id' => $holidayId]) );
            return true;
        }
        
        // Function to remove the specified holiday
        //
        // Required Parameters
        //  holidayId        The id of the holiday to delete
        //
        // Optional Parameters
        //  None
        public function remove($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'holidayId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the date of the holiday so that we know which holiday to edit for the companies
            $sqlQuery = 'SELECT public_holidays.date FROM public_holidays WHERE public_holidays.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['holidayId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the holiday was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Holiday \'' . $data['holidayId'] . '\' not found.']) );
                return false;
            }
            
            // Create holiday details
            $sqlRow = $sqlResult->fetchAssociative();
            $oldHolidayDate = $sqlRow['date'];
            
            // Delete the specified holiday
            $sqlQuery = 'DELETE FROM public_holidays WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['holidayId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Select all companies
            $companySqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, ' .
                    'companies.database_schema ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.is_active = true ' . 
                'ORDER BY ' .
                    'companies.database_schema ASC;';
            $companySqlResult = $db->paramQuery($companySqlQuery, []);
            if( !$companySqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to get a list of companies.']) );
                return false;
            }
            
            // For every company
            while( $companySqlRow = $companySqlResult->fetchAssociative() ) {
                // Set the maximum execution time for a loop iteration to 600 seconds
                set_time_limit(600);
                
                // Connect to the database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to company database.']) );
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $companySqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to set search path to company schema.']) );
                    return false;
                }
                
                // Get the id of the specified holiday
                $sqlQuery = 'SELECT public_holidays.id FROM public_holidays WHERE public_holidays.date = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$oldHolidayDate]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Check if the holiday was found
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Holiday not found in schema.']) );
                    return false;
                }
                
                // Create holiday details
                $sqlRow = $sqlResult->fetchAssociative();
                $holidayId = $sqlRow['id'];
                
                // Delete the specified holiday
                $sqlQuery = 'DELETE FROM public_holidays WHERE id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$holidayId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get all the details of the specified holiday
        //
        // Required Parameters
        //  holidayId              The id of the holiday whose details to get
        //
        // Optional Parameters
        //  None
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'holidayId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the holiday from the holidays table
            $sqlQuery = 
                'SELECT ' .
                    'public_holidays.id, ' . 
                    'public_holidays.date, ' . 
                    'public_holidays.name, ' . 
                    'public_holidays.added_on ' . 
                'FROM ' .
                    'public_holidays ' .
                'WHERE ' .
                    'public_holidays.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['holidayId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the holiday was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Holiday \'' . $data['holidayId'] . '\' not found.']) );
                return false;
            }
            
            // Create holiday details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $holiday = [
                'id' => $sqlRow['id'],
                'date' => $sqlRow['date'],
                'name' => $sqlRow['name'],
                'addedOn' => $sqlRow['added_on']
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'holiday' => $holiday]) );
            return true;
        }
        
        // Function to to update the specified holiday's details
        //
        // Required Parameters
        //  holidayId               The id of the holiday whose details to update
        //
        // Optional Parameters
        //  date                    The new date of the holiday
        //  name                    The new name of the holiday
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'holidayId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'date' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => false],
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the date of the holiday so that we know which holiday to edit for the companies
            $sqlQuery = 'SELECT public_holidays.date FROM public_holidays WHERE public_holidays.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['holidayId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the holiday was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Holiday \'' . $data['holidayId'] . '\' not found.']) );
                return false;
            }
            
            // Create holiday details
            $sqlRow = $sqlResult->fetchAssociative();
            $oldHolidayDate = $sqlRow['date'];
            
            // Build the query to update the holiday
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE public_holidays SET ';
            
            if( isset($data['name']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['name'];
            }
            
            if( isset($data['date']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'date = $' . $updateCount;
                $updateValues[] = $data['date'];
            }
            
            // Is there anything to update?
            if( $updateCount > 0 ) {
                // Add the user details
                $updateCount++;
                $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'updated_by_user_id = $' . $updateCount;
                $updateValues[] = $user['id'];
                $updateCount++;
                $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'updated_on = $' . $updateCount;
                $updateValues[] = date('Y-m-d');
                
                // Set where clause
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
                $updateValues[] = $data['holidayId'];
                
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Select all companies
                $companySqlQuery =
                    'SELECT ' .
                        'companies.id AS company_id, ' .
                        'companies.database_schema ' .
                    'FROM ' .
                        'companies ' .
                    'WHERE ' .
                        'companies.is_active = true ' . 
                    'ORDER BY ' .
                        'companies.database_schema ASC;';
                $companySqlResult = $db->paramQuery($companySqlQuery, []);
                if( !$companySqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to get a list of companies.']) );
                    return false;
                }
                
                // For every company
                while( $companySqlRow = $companySqlResult->fetchAssociative() ) {
                    // Set the maximum execution time for a loop iteration to 600 seconds
                    set_time_limit(600);
                    
                    // Connect to the database
                    $dbConnected = $db->connect(
                        "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                        "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                    );
                    if( $dbConnected !== true ) {
                        echo( json_encode(['ok' => false, 'error' => 'Failed to connect to company database.']) );
                        return false;
                    }
                    
                    // Set our search path to the relevant company
                    $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $companySqlRow['database_schema'] . ';', []);
                    if( !$searchPathSqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Failed to set search path to company schema.']) );
                        return false;
                    }
                    
                    // Get the id of the specified holiday
                    $sqlQuery = 'SELECT public_holidays.id FROM public_holidays WHERE public_holidays.date = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$oldHolidayDate]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Check if the holiday was found
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Holiday not found in schema.']) );
                        return false;
                    }
                    
                    // Create holiday details
                    $sqlRow = $sqlResult->fetchAssociative();
                    $holidayId = $sqlRow['id'];
                    
                    // Build the query to update the holiday
                    $updateCount = 0;
                    $updateValues = [];
                    $updateQuery = 'UPDATE public_holidays SET ';
                    
                    if( isset($data['name']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'name = $' . $updateCount;
                        $updateValues[] = $data['name'];
                    }
                    
                    if( isset($data['date']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'date = $' . $updateCount;
                        $updateValues[] = $data['date'];
                    }
                    
                    // Set where clause
                    $updateCount++;
                    $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
                    $updateValues[] = $holidayId;
                    
                    $updateResult = $db->paramQuery($updateQuery, $updateValues);
                    if( !$updateResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
    }
?>
