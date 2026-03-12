<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // SETUP CONTROLLER CLASS
    //
    
    class Setup extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list setup
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
                'setupName' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'setupName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' WHERE (setups.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            // Load all setups from the setups table
            $sqlQuery = 
                'SELECT ' .
                    'setups.id, ' .
                    'setups.name ' .
                'FROM ' .
                    'setups ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'setups.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create setups array
            $setups = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $setups[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'setups' => $setups
            ]) );
            
            return true;
        }
        
        
        // Function to get all setup details
        //
        // Required Parameters
        //  None
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
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Create setup array
            $setup = [
                'sendBirthdayNotifications' => false,
                'emailPayslipsOnPayrunProcess' => false,
                'leaveRequestAdminEmailAddress' => '-'
            ];
            
            // Get the the requested values from the config
            $sqlQuery = 
                'SELECT ' . 
                    'config.name, ' . 
                    'config.value ' . 
                'FROM ' . 
                    'config ' . 
                'WHERE ' . 
                    'config.name = \'send_birthday_notifications\' OR ' . 
                    'config.name = \'email_payslips_on_payrun_process\' OR ' . 
                    'config.name = \'leave_request_admin_email_address\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Update the setup details
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                if( $sqlRow['name'] === 'send_birthday_notifications' ) {
                    if( strtolower($sqlRow['value']) === 'yes' ) {
                        $setup['sendBirthdayNotifications'] = true;
                    }
                }
                else if( $sqlRow['name'] === 'email_payslips_on_payrun_process' ) {
                    if( strtolower($sqlRow['value']) === 'yes' ) {
                        $setup['emailPayslipsOnPayrunProcess'] = true;
                    }
                }
                else if( $sqlRow['name'] === 'leave_request_admin_email_address' ) {
                    if( strtolower($sqlRow['value']) !== '' ) {
                        $setup['leaveRequestAdminEmailAddress'] = $sqlRow['value'];
                    }
                }
            }
           
            // Send result
            echo( json_encode(['ok' => true, 'setup' => $setup]) );
            return true;
        }
        
        // Function to to update the specified setup's details
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  sendBirthdayNotifications           // Whether to send employee birthday notifications (true or false)
        //  emailPayslipsOnPayrunProcess        // Whether to email payslips when a payrun is processed (true or false)
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
                
                // Optional parameters
                'sendBirthdayNotifications' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'emailPayslipsOnPayrunProcess' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'leaveRequestAdminEmailAddress'  => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            if( isset($data['sendBirthdayNotifications']) ) {
                $value = 'no';
                if( $data['sendBirthdayNotifications'] === true ) $value = 'yes';
                    
                $updateQuery = 'UPDATE config SET value = $1 WHERE name = \'send_birthday_notifications\';';
                $updateResult = $db->paramQuery($updateQuery, [$value]);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            if( isset($data['emailPayslipsOnPayrunProcess']) ) {
                $value = 'no';
                if( $data['emailPayslipsOnPayrunProcess'] === true ) $value = 'yes';
                
                $updateQuery = 'UPDATE config SET value = $1 WHERE name = \'email_payslips_on_payrun_process\';';
                $updateResult = $db->paramQuery($updateQuery, [$value]);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            if( isset($data['leaveRequestAdminEmailAddress']) ) {
                $updateQuery = 'UPDATE config SET value = $1 WHERE name = \'leave_request_admin_email_address\';';
                $updateResult = $db->paramQuery($updateQuery, [$data['leaveRequestAdminEmailAddress']]);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
    }
?>
