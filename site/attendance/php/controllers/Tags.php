<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // CONSULTANT CONTROLLER CLASS
    //
    
    class Tags extends Controller {

        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];


        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list tags
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
                'tagsName' => '',
                'limitGroups' => true
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'tagName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limitTags' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            $whereClause = '';
            
            // Was the limitTags filter specified
            if( array_key_exists('limitTags', $data) && !is_null($data['limitTags']) ) {
                if( $data['limitTags'] ) {
                    // Make certain only the groups are listed that the user has access to
                    $sqlParams[] = $user['id'];
                    $whereClause = 
                        'WHERE tags.id IN ( ' . 
                            'SELECT DISTINCT ' . 
                                'tag_employee.tags_id ' . 
                            'FROM ' . 
                                'tag_employee ' . 
                            'WHERE ' . 
                                'tag_employee.employee_id = $' . count($sqlParams) . ' ' .
                        ') ';
                }
            }
                
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $whereClause = $whereClause . ' ( ';
                $whereClause = $whereClause . ' ( tags.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ' ) ';
            }
            
            
            // Was a sort list specified?
            $sortClause = '';
            if( isset($data['sortList']) ) {
                // For every item in the sort list
                foreach( $data['sortList'] AS $sortItem ) {
                    // Was a valid sort order specified?
                    if( $sortItem['order'] !== 'ASC' && $sortItem['order'] !== 'DESC' ) {
                        return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
                    }
                    
                    // Setup the column to sort by
                    $column = '';
                    switch( $sortItem['dataIndex'] ) {
                        case 'name':
                            $column = 'tags.name';
                            break;
                        default:
                            return( ['ok' => false, 'error' => 'Invalid sort column specified'] );
                    }
                    
                    // Build the sort clause
                    if( $sortClause === '' ) {
                        $sortClause = 'ORDER BY ';
                    }
                    else {
                        $sortClause = $sortClause . ', ';
                    }
                    $sortClause = $sortClause . $column . ' ' . $sortItem['order'];
                }
            }
            
            // // Check that sort order given is valid
            // if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
            //     echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
            //     return false;
            // }
            
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
            
            // Load all groups from the groups table
            $sqlQuery = 
                'SELECT ' .
                    'tags.id, ' .
                    'tags.name ' .
                'FROM ' .
                    'tags ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'tags.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create tags array
            $tags = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $tags[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'tags' => $tags ]) );
            return true;
        }
        
        // Function to add an group
        //
        // Required Parameters
        //  name                The name of the group to add
        //
        // Optional Parameters
        // users                A list of user ids
        //                          users :[
        //                              'id' =>  // user id
        //                          ]
        //
        // companies            A list of company ids
        //                          companies :[
        //                              'id' =>  // company id
        //                          ]
        public function add($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'employees' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Make certain there isn't already a tag with the specified name
            $sqlQuery = 'SELECT id FROM tags WHERE name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['name']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() >= 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'A tag with the name \'' . $data['name'] . '\' already exists.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE tag_employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE tags IN EXCLUSIVE MODE;');
            
            // Build the query to insert the item.
            $sqlQuery = 'INSERT INTO tags ( name ) VALUES (  $1 ) RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['name']   // name
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $tagsId = $sqlRow['id'];
            
            // Are there employees to add?
            if (count($data['employees']) > 0) {
                foreach( $data['employees'] as $employee ) {
                    $sqlQuery = 
                        'INSERT INTO tag_employees ( ' .
                            'tags_id,' .
                            'employee_id' .
                        ') ' .
                        'VALUES( ' . 
                            '$1, $2 ' .
                        ');';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $tagsId,       // admin_group_id
                        $employee['id']     // employee_id
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'id' => $tagsId]) );
            
            return true;
        }

        // Function to remove the specified group
        //
        // Required Parameters
        //  id              The id of the group to delete
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
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE tag_employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE tags IN EXCLUSIVE MODE;');
            
            // Remove the specified tag from the tag_employees table
            $sqlQuery = 'DELETE FROM tag_employees WHERE tags_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the specified tag
            $sqlQuery = 'DELETE FROM tags WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            return true;
        }

        // Function to get all the details of the specified tag
        //
        // Required Parameters
        //  id              The id of the tag whose details to get
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
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the tag from the tags table
            $sqlQuery = 
                'SELECT ' .
                    'tags.id, ' .
                    'tags.name ' .
                'FROM ' .
                    'tags ' .
                'WHERE ' .
                    'tags.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the tag was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Tags \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Create tags details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $tags = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'employees' => []
            ];
            
            // Get all the employees for the tag
            $sqlQuery = 
                'SELECT ' .
                    'employees.id, ' .
                    'employees.alias, ' .
                    'employees.email_address, ' .
                    'employees.cell_number ' .
                'FROM ' .
                    'tag_employees ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = tag_employees.employee_id ' .
                'WHERE ' . 
                    'tag_employees.tags_id = $1 ' .
                'ORDER BY ' .
                    'employees.alias ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $employees = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $employees[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['alias'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number']
                ];
            }
            $tags['employees'] = $employees;
 
            // Send result
            echo( json_encode([
                'ok' => true,
                'tags' => $tags
            ]) );
            
            return true;
        }

        // Function to to update the specified tag's details
        //
        // Required Parameters
        //  id                  The id of the tag whose details to update
        //
        // Optional Parameters
        // name                 The tag's name
        // employees            A list of employee ids
        //                      employees :[
        //                          'id' =>  // employees id
        //                      ]


        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'employees' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE tag_employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE tags IN EXCLUSIVE MODE;');
            
            // Build the query to update the group
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE tags SET ';
            
            if( isset($data['name']) ) {
                // Make certain there isn't already a tag with the specified name
                $sqlQuery = 
                    'SELECT id FROM tags WHERE name = $1 AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['name'], $data['id']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'A tag with the name \'' . $data['name'] . '\' already exists.']) );
                    return false;
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['name'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['id'];
            
            $updateResult = $db->paramQuery($updateQuery, $updateValues);
            if( !$updateResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Are there any employees to add or remove?
            if( isset($data['employees']) ) {
                // Remove all the employees linked to the tag
                $query = 'DELETE FROM tag_employees WHERE tags_id = $1;';
                $result = $db->paramQuery($query, [$data['id']]);
                if( !$result->isValid() ) die(json_encode(['ok' => false, 'error' => 'Database error']));
                
                // Add the new employee, if any
                if (count($data['employees']) > 0) {
                    foreach( $data['employees'] as $employee ) {
                        $sqlQuery = 
                            'INSERT INTO tag_employees ( ' .
                                'tags_id,' .
                                'employee_id' .
                            ') ' .
                            'VALUES( ' . 
                                '$1, $2 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $data['id'],    // tags_id
                            $employee['id']     // employee_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
    }

?>