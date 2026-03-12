<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // CONSULTANT CONTROLLER CLASS
    //
    
    class Group extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list group
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
                'groupName' => '',
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
                'groupName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limitGroups' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            $whereClause = '';
            
            // Was the limitGroups filter specified
            if( array_key_exists('limitGroups', $data) && !is_null($data['limitGroups']) ) {
                if( $data['limitGroups'] ) {
                    // Make certain only the groups are listed that the user has access to
                    $sqlParams[] = $user['id'];
                    $whereClause = 
                        'WHERE admin_groups.id IN ( ' . 
                            'SELECT DISTINCT ' . 
                                'admin_group_users.admin_group_id ' . 
                            'FROM ' . 
                                'admin_group_users ' . 
                            'WHERE ' . 
                                'admin_group_users.user_id = $' . count($sqlParams) . ' ' .
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
                $whereClause = $whereClause . ' ( admin_groups.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
                            $column = 'admin_groups.name';
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
                    'admin_groups.id, ' .
                    'admin_groups.name ' .
                'FROM ' .
                    'admin_groups ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'admin_groups.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create groups array
            $groups = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $groups[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'groups' => $groups ]) );
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
                'users' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]],
                'companies' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Make certain there isn't already a group with the specified name
            $sqlQuery = 'SELECT id FROM admin_groups WHERE name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['name']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() >= 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'A group with the name \'' . $data['name'] . '\' already exists.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE admin_group_companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_group_users IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_groups IN EXCLUSIVE MODE;');
            
            // Build the query to insert the item.
            $sqlQuery = 'INSERT INTO admin_groups ( name ) VALUES (  $1 ) RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['name']   // name
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $groupId = $sqlRow['id'];
            
            // Are there users to add?
            if (count($data['users']) > 0) {
                foreach( $data['users'] as $user ) {
                    $sqlQuery = 
                        'INSERT INTO admin_group_users ( ' .
                            'admin_group_id,' .
                            'user_id' .
                        ') ' .
                        'VALUES( ' . 
                            '$1, $2 ' .
                        ');';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $groupId,       // admin_group_id
                        $user['id']     // user_id
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Are there companies to add?
            if (count($data['companies']) > 0) {
                foreach( $data['companies'] as $company ) {
                    $sqlQuery = 
                        'INSERT INTO admin_group_companies ( ' .
                            'admin_group_id,' .
                            'company_id' .
                        ') ' .
                        'VALUES( ' . 
                            '$1, $2 ' .
                        ');';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $groupId,       // admin_group_id
                        $company['id']  // company_id
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'id' => $groupId]) );
            
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
            $db->query('LOCK TABLE admin_group_companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_group_users IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_groups IN EXCLUSIVE MODE;');
            
            // Remove the specified group from the admin_group_companies table
            $sqlQuery = 'DELETE FROM admin_group_companies WHERE admin_group_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove the specified group from the admin_group_users table
            $sqlQuery = 'DELETE FROM admin_group_users WHERE admin_group_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the specified group
            $sqlQuery = 'DELETE FROM admin_groups WHERE id = $1;';
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
        
        // Function to get all the details of the specified group
        //
        // Required Parameters
        //  id              The id of the group whose details to get
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
            
            // Load the group from the groups table
            $sqlQuery = 
                'SELECT ' .
                    'admin_groups.id, ' .
                    'admin_groups.name ' .
                'FROM ' .
                    'admin_groups ' .
                'WHERE ' .
                    'admin_groups.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the group was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Group \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Create group details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $group = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'users' => [],
                'companies' => []
            ];
            
            // Get all the users for the group
            $sqlQuery = 
                'SELECT ' .
                    'users.id, ' .
                    'users.name, ' .
                    'users.email_address, ' .
                    'users.cell_number, ' .
                    'users.is_admin, ' .
                    'users.is_active ' .
                'FROM ' .
                    'admin_group_users ' .
                'LEFT JOIN ' .
                    'users ON users.id = admin_group_users.user_id ' .
                'WHERE ' . 
                    'admin_group_users.admin_group_id = $1 ' .
                'ORDER BY ' .
                    'users.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create users array
            $users = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $users[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'isAdmin' => $sqlRow['is_admin'],
                    'isActive' => $sqlRow['is_active']
                ];
            }
            $group['users'] = $users;
            
            // Get all the companies for the group
            $sqlQuery = 
                'SELECT ' .
                    'companies.id, ' .
                    'companies.name, ' .
                    'companies.alias, ' .
                    'companies.database_schema, ' .
                    'companies.is_active ' .
                'FROM ' .
                    'admin_group_companies ' .
                'LEFT JOIN ' .
                    'companies ON companies.id = admin_group_companies.company_id ' .
                'WHERE ' . 
                    'admin_group_companies.admin_group_id = $1 ' .
                'ORDER BY ' .
                    'companies.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create companies array
            $companies = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $companies[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'alias' => $sqlRow['alias'],
                    'databaseSchema' => $sqlRow['database_schema'],
                    'isActive' => $sqlRow['is_active']
                ];
            }
            $group['companies'] = $companies;
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'group' => $group
            ]) );
            
            return true;
        }
        
        // Function to to update the specified group's details
        //
        // Required Parameters
        //  id                  The id of the group whose details to update
        //
        // Optional Parameters
        // name                 The group's name
        // users                A list of user ids
        //                          users :[
        //                              'id' =>  // user id
        //                          ]
        //
        // companies            A list of company ids
        //                          companies :[
        //                              'id' =>  // company id
        //                          ]

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
                'users' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]],
                'companies' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
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
            $db->query('LOCK TABLE admin_group_companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_group_users IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE admin_groups IN EXCLUSIVE MODE;');
            
            // Build the query to update the group
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE admin_groups SET ';
            
            if( isset($data['name']) ) {
                // Make certain there isn't already a group with the specified name
                $sqlQuery = 
                    'SELECT id FROM admin_groups WHERE name = $1 AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['name'], $data['id']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'A group with the name \'' . $data['name'] . '\' already exists.']) );
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
            
            // Are there any users to add or remove?
            if( isset($data['users']) ) {
                // Remove all the users linked to the group
                $query = 'DELETE FROM admin_group_users WHERE admin_group_id = $1;';
                $result = $db->paramQuery($query, [$data['id']]);
                if( !$result->isValid() ) die(json_encode(['ok' => false, 'error' => 'Database error']));
                
                // Add the new users, if any
                if (count($data['users']) > 0) {
                    foreach( $data['users'] as $user ) {
                        $sqlQuery = 
                            'INSERT INTO admin_group_users ( ' .
                                'admin_group_id,' .
                                'user_id' .
                            ') ' .
                            'VALUES( ' . 
                                '$1, $2 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $data['id'],    // admin_group_id
                            $user['id']     // user_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Are there any companies to add or remove?
            if( isset($data['companies']) ) {
                // Remove all the users linked to the group
                $query = 'DELETE FROM admin_group_companies WHERE admin_group_id = $1;';
                $result = $db->paramQuery($query, [$data['id']]);
                if( !$result->isValid() ) die(json_encode(['ok' => false, 'error' => 'Database error']));
                
                // Add the new users, if any
                if (count($data['companies']) > 0) {
                    foreach( $data['companies'] as $company ) {
                        $sqlQuery = 
                            'INSERT INTO admin_group_companies ( ' .
                                'admin_group_id,' .
                                'company_id' .
                            ') ' .
                            'VALUES( ' . 
                                '$1, $2 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $data['id'],    // admin_group_id
                            $company['id']  // company_id
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
