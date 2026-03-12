<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // CONSULTANT CONTROLLER CLASS
    //
    
    class Consultant extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list consultant consultants
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
                'consultantName' => ''
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
                'consultantName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' ( consultants.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( consultants.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
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
                            $column = 'consultants.name';
                            break;
                        case 'emailAddress':
                            $column = 'consultants.email_address';
                            break;
                        case 'cellNumber':
                            $column = 'consultants.cell_number';
                            break;
                        case 'telNumber':
                            $column = 'consultants.tel_number';
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
            
            // Load all consultants from the consultants table
            $sqlQuery = 
                'SELECT ' .
                    'consultants.id, ' .
                    'consultants.name, ' .
                    'consultants.email_address, ' .
                    'consultants.tel_number, ' .
                    'consultants.cell_number ' .
                'FROM ' .
                    'consultants ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'consultants.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create consultants array
            $consultants = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $consultants[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'telNumber' => $sqlRow['tel_number'],
                    'cellNumber' => $sqlRow['cell_number']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'consultants' => $consultants
            ]) );
            
            return true;
        }
        
        // Function to add an consultant
        //
        // Required Parameters
        //  consultantName          The name of the consultant to add
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
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'telNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
                
                // Optional parameters
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE consultants IN EXCLUSIVE MODE;');
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO ' .
                    'consultants ( ' .
                        'name, email_address, tel_number, cell_number ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1, $2, $3, $4 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['name'],          // name
                $data['emailAddress'],  // email_address
                $data['telNumber'],     // tel_number
                $data['cellNumber']     // cell_number
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $consultantId = $sqlRow['id'];
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'id' => $consultantId]) );
            
            return true;
        }
        
        // Function to remove the specified consultant
        //
        // Required Parameters
        //  consultantId        The id of the consultant to delete
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
            
            // Remove the specified consultant from the companies table
            $sqlQuery = 'UPDATE companies SET consultant_id = NULL WHERE consultant_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the specified consultant
            $sqlQuery = 'DELETE FROM consultants WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get all the details of the specified consultant
        //
        // Required Parameters
        //  consultantId              The id of the consultant whose details to get
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
                'consultantId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the consultant from the consultants table
            $sqlQuery = 
                'SELECT ' .
                    'consultants.id, ' .
                    'consultants.name, ' .
                    'consultants.email_address, ' .
                    'consultants.tel_number, ' .
                    'consultants.cell_number ' .
                'FROM ' .
                    'consultants ' .
                'WHERE ' .
                    'consultants.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['consultantId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the consultant was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Consultant \'' . $data['consultantId'] . '\' not found.']) );
                return false;
            }
            
            // Create consultant details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $consultant = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'emailAddress' => $sqlRow['email_address'],
                'telNumber' => $sqlRow['tel_number'],
                'cellNumber' => $sqlRow['cell_number']
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'consultant' => $consultant
            ]) );
            
            return true;
        }
        
        // Function to to update the specified consultant's details
        //
        // Required Parameters
        //  consultantId                The id of the consultant whose details to update
        //
        // Optional Parameters
        //  consultantName              The consultant's name
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
                'emailAddress' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'telNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE consultants SET ';
            
            if( isset($data['name']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['name'];
            }
            
            if( isset($data['emailAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['emailAddress'];
            }
            
            if( isset($data['telNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'tel_number = $' . $updateCount;
                $updateValues[] = $data['telNumber'];
            }
            
            if( isset($data['cellNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'cell_number = $' . $updateCount;
                $updateValues[] = $data['cellNumber'];
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
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
    }
?>
