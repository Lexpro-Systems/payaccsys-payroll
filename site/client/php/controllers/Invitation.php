<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // USER CONTROLLER CLASS
    //
    
    class Invitation extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [
            'get',
            'decline',
            'accept'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  code                The code of the invitation to get.
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
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize invitation array
            $invitation = [
                'found' => false,
            ];
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the invitation exists
            $sqlQuery =
                'SELECT ' .
                    'user_company_invitations.id AS invitation_id, company_id, companies.name AS company_name, ' .
                    'invitee_email_address, invitee_name, sent_by_user_id, users.name AS sender_name, ' .
                    'sent_on, expires_on, status_code, user_company_invitation_status_types.name AS status_name, ' .
                    'invitee_users.id AS registered_id, invitee_users.password AS registered_password ' .
                'FROM ' .
                    'user_company_invitations ' .
                'LEFT JOIN ' .
                    'companies ON user_company_invitations.company_id = companies.id ' .
                'LEFT JOIN ' .
                    'users ON user_company_invitations.sent_by_user_id = users.id ' .
                'LEFT JOIN ' .
                    'users AS invitee_users ON user_company_invitations.invitee_email_address = invitee_users.email_address ' .
                'LEFT JOIN ' .
                    'user_company_invitation_status_types ON user_company_invitations.status_code = user_company_invitation_status_types.code ' .
                'WHERE ' .
                    'user_company_invitations.code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                
                // Get the invitation id
                $invitationId = $sqlRow['invitation_id'];
                
                // Check if the invitation expired
                $now = new DateTime();
                $expiryDate = new DateTime( $sqlRow['expires_on'] );
                $expired = ($expiryDate <= $now );
                
                // Check if the user exists
                $registeredUserId = null;
                $userHasPassword = false;
                if( $sqlRow['registered_id'] !== null ) {
                    if( $sqlRow['registered_password'] !== '' ) $userHasPassword = true;
                    $registeredUserId = $sqlRow['registered_id'];
                }
                
                // Check if the user already has 
                
                $invitation = [
                    'found' => true,
                    'company' => [
                        'name' => $sqlRow['company_name']
                    ],
                    'invitee' => [
                        'emailAddress' => $sqlRow['invitee_email_address'],
                        'name' => $sqlRow['invitee_name']
                    ],
                    'sender' => $sqlRow['sender_name'],
                    'sentOn' => $sqlRow['sent_on'],
                    'expired' => $expired,
                    'status' => [
                        'code' => $sqlRow['status_code'],
                        'name' => $sqlRow['status_name']
                    ],
                    'registeredUserId' => $registeredUserId,
                    'userHasPassword' => $userHasPassword,
                    'rights' => null
                ];
                
                // Load inivitation rights from id
                $sqlQuery = 
                    'SELECT ' .
                        'user_company_invitation_rights.id AS invitation_right_id, ' .
                        'user_company_invitation_rights.user_right_code, ' .
                        'user_right_types.name AS user_right_name ' .
                    'FROM ' .
                        'user_company_invitation_rights ' .
                    'LEFT JOIN ' .
                        'user_right_types ON user_right_types.code = user_company_invitation_rights.user_right_code ' .
                    'WHERE ' .
                        'user_company_invitation_rights.user_company_invitation_id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$invitationId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $rights = [];
                while( $sqlRow = $sqlResult->fetchAssociative() ) {
                    $rights[] = [
                        'id' => $sqlRow['invitation_right_id'],
                        'code' => $sqlRow['user_right_code'],
                        'name' => $sqlRow['user_right_name']
                    ];
                }
                
                // Set invitation rights
                $invitation['rights'] = $rights;
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'invitation' => $invitation
            ]) );
            
            return true;
        }
        
        // Function to decline an invitation
        //
        // Required Parameters
        //  code                The code of the invitation to get.
        //
        // Optional Parameters
        //  None
        public function decline($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            
            // Check if the invitation exists
            $sqlQuery = 'SELECT id FROM user_company_invitations WHERE user_company_invitations.code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Invitation not found.']) );
                return false;
            }
            
            // If the invitation was found mark it as declined
            $sqlQuery = 'UPDATE user_company_invitations SET status_code = \'DECL\' WHERE user_company_invitations.code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to accept an invitation
        //
        // Required Parameters
        //  code                The code of the invitation to get.
        //
        // Optional Parameters
        //  name                The name of the user if registering.
        //  cellNumber          The cellphone number of the user if registering.
        //  password            The user's password if registering.
        public function accept($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'name' => '',
                'cellNumber' => '',
                'password' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                'name' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'password' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Load invitation from database.
            $sqlQuery = 
                'SELECT ' . 
                    'id, company_id, invitee_email_address, status_code, expires_on, sent_by_user_id ' . 
                'FROM ' . 
                    'user_company_invitations ' . 
                'WHERE ' . 
                    'code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // If there is not exactly one row then an error occurred.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Invitation not found.']) );
                return false;
            }
            
            // Store invitation details
            $sqlRow = $sqlResult->fetchAssociative();
            $invitationId = $sqlRow['id'];
            $inviteeEmail = $sqlRow['invitee_email_address'];
            $invitationStatus = $sqlRow['status_code'];
            $invitationExpiryDate = new DateTime($sqlRow['expires_on']);
            $invitationCompanyId = $sqlRow['company_id'];
            $invitationGrantedByUserId = $sqlRow['sent_by_user_id'];
            
            // Make sure the invitation was not accepted or declined
            if( $invitationStatus === 'ACCE' ) {
                echo( json_encode(['ok' => false, 'error' => 'The invitation has already been accepted.']) );
                return false;
            }
            else if( $invitationStatus === 'DECL' ) {
                echo( json_encode(['ok' => false, 'error' => 'The invitation has already been declined.']) );
                return false;
            }
            
            // Load invitation rights from database.
            $sqlQuery = 
                'SELECT ' . 
                    'id, user_right_code ' . 
                'FROM ' . 
                    'user_company_invitation_rights ' . 
                'WHERE ' . 
                    'user_company_invitation_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$invitationId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Store user right details
            $userRights = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $userRights[] = [
                    'code' => $sqlRow['user_right_code']
                ];
            }
            
            // Make sure the invitation has not expired.
            $now = new DateTime();
            if( $now >= $invitationExpiryDate ) {
                echo( json_encode(['ok' => false, 'error' => 'The invitation has expired.']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock users table
            $db->paramQuery('LOCK TABLE users IN ACCESS EXCLUSIVE MODE;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if a user should be created
            $sqlQuery = 'SELECT id , password FROM users WHERE LOWER(email_address) = LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$inviteeEmail]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if a user was found.
            $userId = null;
            $userHasPassword = false;
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $userId = $sqlRow['id'];
                if( $sqlRow['password'] !== '' ) $userHasPassword = true;
            }
            
            // If a user was not found create a new one.
            if( $userId === null ) {
                $password = $data['password'];
                if( $password !== '' ) $password = password_hash($password, PASSWORD_DEFAULT, ['cost' => 15]);
                
                $sqlQuery =
                    'INSERT INTO ' .
                        'users (name, email_address, password, cell_number, is_admin, is_active, last_login, created_on) ' .
                    'VALUES ' .
                        '($1, $2, $3, $4, $5, $6, $7, $8) ' .
                    'RETURNING ' .
                        'id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['name'],          // name
                    $inviteeEmail,          // email_address
                    $password,              // password
                    $data['cellNumber'],    // cell_number
                    false,                  // is_admin
                    true,                   // is_active
                    null,                   // last_login
                    date('Y-m-d')           // created_on
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                
                $userId = $sqlRow['id'];
            }
            else if( !$userHasPassword ) {
                $password = $data['password'];
                if( $password !== '' ) $password = password_hash($password, PASSWORD_DEFAULT, ['cost' => 15]);
                
                $sqlQuery =
                    'UPDATE users ' .
                        'SET name = $1, password = $2, cell_number = $3 ' .
                    'WHERE ' .
                        'id = $4;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['name'],          // name
                    $password,              // password
                    $data['cellNumber'],    // cell_number
                    $userId                 // id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
            }
            
            // Lock user_company_access table
            $db->paramQuery('LOCK TABLE user_company_access IN ACCESS EXCLUSIVE MODE;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the user already has access to the company
            $sqlQuery = 'SELECT id FROM user_company_access WHERE company_id = $1 AND user_id = $2 AND revoked IS FALSE;';
            $sqlResult = $db->paramQuery($sqlQuery, [$invitationCompanyId, $userId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // If no rows are returned add a new row to allow the user access to the company
            if( $sqlResult->getRowCount() === 0 ) {
                $sqlQuery = 
                    'INSERT INTO ' . 
                        'user_company_access (user_id, company_id, is_default, granted_on, granted_by_user_id, revoked, revoked_on ) '. 
                    'VALUES ' . 
                        '($1, $2, $3, $4, $5, $6, $7);';
                $sqlResult= $db->paramQuery($sqlQuery, [
                    $userId,                    // user_id,
                    $invitationCompanyId,       // company_id
                    false,                      // is_default
                    date('Y-m-d H:i:s'),        // granted_on
                    $invitationGrantedByUserId, // granted_by_user_id
                    false,                      // revoked
                    null                        // revoked_on
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Change the invitation status to accepted
            $sqlQuery = 'UPDATE user_company_invitations SET status_code = \'ACCE\' WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$invitationId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the user rights
            $db->query('LOCK TABLE user_company_rights IN EXCLUSIVE MODE;');
            
            // Remove all the exiting rights
            $sqlQuery = 'DELETE FROM user_company_rights WHERE company_id = $1 AND user_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $invitationCompanyId,
                $userId,
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add the relevant rights
            $insertCount = 0;
            $insertValues = [];
            $sqlQuery = 'INSERT INTO user_company_rights(user_id, company_id, user_right_code) VALUES ';
            
            foreach( $userRights AS $right ) {
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userId;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                
                $insertCount++;
                $insertValues[] = $invitationCompanyId;
                $sqlQuery = $sqlQuery . ', $' . $insertCount;
                
                $insertCount++;
                $insertValues[] = $right['code'];
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
            }
            
            // Are there any values to insert?
            if( $insertCount > 0 ) {
                // Execute the query and return the result
                $sqlResult = $db->paramQuery($sqlQuery, $insertValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  invitationId        The id of the invitation to get.
        //
        // Optional Parameters
        //  None
        public function getInvitationById($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'invitationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize invitation array
            $invitation = [
                'found' => false,
            ];
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Load inivitation rights from id
            $sqlQuery = 
                'SELECT ' .
                    'user_company_invitation_rights.id AS invitation_right_id, ' .
                    'user_company_invitation_rights.user_right_code, ' .
                    'user_right_types.name AS user_right_name ' .
                'FROM ' .
                    'user_company_invitation_rights ' .
                'LEFT JOIN ' .
                    'user_right_types ON user_right_types.code = user_company_invitation_rights.user_right_code ' .
                'WHERE ' .
                    'user_company_invitation_rights.user_company_invitation_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['invitationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $rights = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $rights[] = [
                    'id' => $sqlRow['invitation_right_id'],
                    'code' => $sqlRow['user_right_code'],
                    'name' => $sqlRow['user_right_name']
                ];
            }
                
            // Check if the invitation exists
            $sqlQuery =
                'SELECT ' .
                    'company_id, companies.name AS company_name, invitee_email_address, invitee_name, sent_by_user_id, users.name AS sender_name, ' .
                    'sent_on, expires_on, status_code, user_company_invitation_status_types.name AS status_name, ' .
                    'invitee_users.email_address AS registered_email_address, user_company_invitations.code ' .
                'FROM ' .
                    'user_company_invitations ' .
                'LEFT JOIN ' .
                    'companies ON user_company_invitations.company_id = companies.id ' .
                'LEFT JOIN ' .
                    'users ON user_company_invitations.sent_by_user_id = users.id ' .
                'LEFT JOIN ' .
                    'users AS invitee_users ON user_company_invitations.invitee_email_address = invitee_users.email_address ' .
                'LEFT JOIN ' .
                    'user_company_invitation_status_types ON user_company_invitations.status_code = user_company_invitation_status_types.code ' .
                'WHERE ' .
                    'user_company_invitations.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['invitationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                
                // Check if the invitation expired
                $now = new DateTime();
                $expiryDate = new DateTime( $sqlRow['expires_on'] );
                $expired = ($expiryDate <= $now );
                
                // Check if the user exists
                $userRegistered = false;
                if( $sqlRow['registered_email_address'] !== null ) $userRegistered = true;
                
                $invitation = [
                    'found' => true,
                    'company' => [
                        'name' => $sqlRow['company_name']
                    ],
                    'invitee' => [
                        'emailAddress' => $sqlRow['invitee_email_address'],
                        'name' => $sqlRow['invitee_name']
                    ],
                    'sender' => $sqlRow['sender_name'],
                    'sentOn' => $sqlRow['sent_on'],
                    'expired' => $expired,
                    'expiryDate' => $sqlRow['expires_on'],
                    'url' => CONF_ROOT_URL . '/index.html?invitation=' . $sqlRow['code'],
                    'status' => [
                        'code' => $sqlRow['status_code'],
                        'name' => $sqlRow['status_name']
                    ],
                    'userExists' => $userRegistered,
                    'rights' => $rights
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'invitation' => $invitation
            ]) );
            
            return true;
        }
        
        // Function to resend invitation
        //
        // Required Parameters
        //  invitationId                The id of the invite to resend
        //  attendanceAccessRight       Whether the user has access to the attendance portal (true/ false)
        //  payrollAccessRight          Whether the user has access to the payroll portal (true/ false)
        //
        // Optional Parameters
        //  None
        public function resend($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'invitationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'attendanceAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'payrollAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize invitation array
            $invitation = [
                'found' => false,
            ];
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the invitation exists
            $sqlQuery =
                'SELECT ' .
                    'company_id, ' . 
                    'companies.name AS company_name, ' . 
                    'invitee_email_address, ' . 
                    'invitee_name, ' . 
                    'sent_by_user_id, ' . 
                    'users.name AS sender_name, ' . 
                    'user_company_invitations.code AS invite_code, ' .
                    'sent_on, ' . 
                    'expires_on, ' . 
                    'status_code, ' . 
                    'user_company_invitation_status_types.name AS status_name, ' .
                    'invitee_users.email_address AS registered_email_address ' .
                'FROM ' .
                    'user_company_invitations ' .
                'LEFT JOIN ' .
                    'companies ON user_company_invitations.company_id = companies.id ' .
                'LEFT JOIN ' .
                    'users ON user_company_invitations.sent_by_user_id = users.id ' .
                'LEFT JOIN ' .
                    'users AS invitee_users ON user_company_invitations.invitee_email_address = invitee_users.email_address ' .
                'LEFT JOIN ' .
                    'user_company_invitation_status_types ON user_company_invitations.status_code = user_company_invitation_status_types.code ' .
                'WHERE ' .
                    'user_company_invitations.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['invitationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                
                // Was the invitation accepted?
                if ($sqlRow['status_code'] !== 'ACCE') {
                    // Check if the invitation exists
                    $sqlUpdateQuery =
                        'UPDATE ' . 
                            'user_company_invitations ' .
                        'SET ' . 
                            'sent_on = $1, ' . 
                            'expires_on = $2, ' .
                            'status_code = \'PEND\' ' .
                        'WHERE ' .
                            'user_company_invitations.id = $3;';
                    $sqlUpdateResult = $db->paramQuery($sqlUpdateQuery, [
                            date('Y-m-d H:i:s'),                    // sent_on
                            date('Y-m-d H:i:s', time() + 604800),   // expires_on
                            $data['invitationId']                   // id
                        ]);
                    if( !$sqlUpdateResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                else {
                    // Send result
                    echo( json_encode(['ok' => true]) );
                    return true;
                }
                
                $companyName = $sqlRow['company_name'];
                $senderName = $sqlRow['sender_name'];
                $recipientName = $sqlRow['invitee_name'];
                $recipientEmail = $sqlRow['invitee_email_address'];
                $code = $sqlRow['invite_code'];
            }
            else {
                // Send result
                echo( json_encode(['ok' => false, 'error' => 'Invitation not found.']) );
                return true;
            }
            
            // Should the attendance portal access right be added?
            $invitationLink = CONF_ATTENDANCE_ROOT_URL . '/index.html?invitation=' . $code;
            
            // Should the payroll portal access right be added?
            if( array_key_exists('payrollAccessRight', $data) && ($data['payrollAccessRight'] == true) ) {
                $invitationLink = CONF_ROOT_URL . '/index.html?invitation=' . $code;
            }
            
            System::useModule('phpmailer');
            // Send the email
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->charSet = 'UTF-8';
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
            
            // Load the template to send.
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/user_company_invitation.html' );
            $mailText = str_replace('$SENDER_NAME', $senderName, $mailText);
            $mailText = str_replace('$RECIPIENT_NAME', $recipientName, $mailText);
            $mailText = str_replace('$COMPANY_NAME', $companyName, $mailText);
            $mailText = str_replace('$INVITATION_LINK', $invitationLink, $mailText);
            
            // Send email
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys');
            $mail->addAddress($recipientEmail, '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll: Invitation to join ' . $companyName;
            $mail->Body    = $mailText;
            $mail->AltBody = $mailText;
            
            $mail->send();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to remove invitation
        //
        // Required Parameters
        //  invitationId                The id of the invite to resend
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
                'invitationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize invitation array
            $invitation = [
                'found' => false,
            ];
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Start an SQL transaction
            $db->startTransaction();
            
            $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_invitation_rights IN EXCLUSIVE MODE;');
            
            // Delete the user company invitation rights
            $sqlQuery = 'DELETE FROM user_company_invitation_rights WHERE user_company_invitation_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['invitationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company invitations
            $sqlQuery = 'DELETE FROM user_company_invitations WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['invitationId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to update an invitation
        //
        // Required Parameters
        //  invitationId            The id of the invitation to update
        //
        // Optional Parameters
        //  attendanceAccessRight   Whether the user has access to the attendance portal (true/ false)
        //  payrollAccessRight      Whether the user has access to the payroll portal (true/ false)
        public function update($data, $user, $db) : bool {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'invitationId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'attendanceAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'payrollAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Should user rights be updated
            if( array_key_exists('attendanceAccessRight', $data) || array_key_exists('payrollAccessRight', $data) ) {
                // Start a transaction
                $db->startTransaction();
                $db->query('LOCK TABLE user_company_invitation_rights IN EXCLUSIVE MODE;');
                
                // Remove all the exiting rights
                $sqlQuery = 'DELETE FROM user_company_invitation_rights WHERE user_company_invitation_id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['invitationId']
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Add the relevant rights
                $insertCount = 0;
                $insertValues = [];
                $sqlQuery = 'INSERT INTO user_company_invitation_rights(user_company_invitation_id, user_right_code) VALUES ';
                
                // Should the attendance portal access right be added?
                if( array_key_exists('attendanceAccessRight', $data) && ($data['attendanceAccessRight'] == true) ) {
                    $insertCount++;
                    if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                    $insertValues[] = $data['invitationId'];
                    $sqlQuery = $sqlQuery . '($' . $insertCount;
                    
                    $insertCount++;
                    $insertValues[] = 'AAPO';
                    $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
                }
                
                // Should the payroll portal access right be added?
                if( array_key_exists('payrollAccessRight', $data) && ($data['payrollAccessRight'] == true) ) {
                    $insertCount++;
                    if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                    $insertValues[] = $data['invitationId'];
                    $sqlQuery = $sqlQuery . '($' . $insertCount;
                    
                    $insertCount++;
                    $insertValues[] = 'APPO';
                    $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
                }
                
                // Should any values be inserted?
                if( $insertCount > 0 ) {
                    // Execute the query and return the result
                    $sqlResult = $db->paramQuery($sqlQuery, $insertValues);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                
                // Commit the transaction
                $db->commitTransaction();
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
    }
?>
