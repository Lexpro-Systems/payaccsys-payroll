<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // USER CONTROLLER CLASS
    //
    
    class User extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [
            'isLoggedIn',
            'login',
            'logout',
            'resetPassword',
            'verifyResetPassword'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  username:           The username to log in with.
        //  password:           The password to log in with.
        //
        // Optional Parameters
        //  None
        public function login($data, $user, $db) : bool {
            // Sleep for 1 second to limit the amount of login attempts should someone try to brute force username and passwords
            sleep(1);
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'username' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'password' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the main database to check user's login
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
            
            // Check if the user exists
            $sqlQuery = 'SELECT id, name, password, is_active, is_admin FROM users WHERE LOWER(email_address) = LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['username']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Verify username
            $usernameValid = false;
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => false,
                    'passwordValid' => null,
                    'userActive' => null,
                    'mustSelectCompany' => null
                ]) );
                return true;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $userId = $sqlRow['id'];
            $userName = $sqlRow['name'];
            $userActive = $sqlRow['is_active'];
            
            // Verify password
            $passwordValid = false;
            if( password_verify($data['password'], $sqlRow['password']) !== true ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => true,
                    'passwordValid' => false,
                    'userActive' => null,
                    'userAdmin' => null,
                    'mustSelectCompany' => null
                ]) );
                return false;
            }
            
            // Check if the user is active
            if( $sqlRow['is_active'] !== true ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => true,
                    'passwordValid' => true,
                    'userActive' => false,
                    'userAdmin' => null,
                    'mustSelectCompany' => null
                ]) );
                return true;
            }
            
            // Check if the user is admin
            if( $sqlRow['is_admin'] !== true ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => true,
                    'passwordValid' => true,
                    'userActive' => true,
                    'userAdmin' => false,
                    'mustSelectCompany' => null
                ]) );
                return true;
            }
            
            // Destroy the current session and start a new one.
            Session::destroy();
            Session::start();
            Session::regenerate();
            
            // If the login was successful generate a refresh token
            $refreshToken = Security::generateRandomString(32);
            Session::setRefreshToken( $refreshToken );
            
            $mustSelectCompany = false;
            
            // Cache the database settings
            $_SESSION['dbCache'] = [
                'host' => CONF_DB_HOST,
                'database' => CONF_DB_NAME,
                'schema' => 'system'
            ];
            
            // If login was successful store user details in session
            System::login([
                'id' => $userId,
                'name' => $userName,
                'companyId' => null
            ]);
            
            // Add an entry in the user_sessions table.
            $sqlQuery = 
                'INSERT INTO ' . 
                    'user_sessions (user_id, company_id, platform_type_code, device_name, refresh_token, lifetime, last_accessed_on, ' . 
                    'created_on) ' .
                'VALUES ' . 
                    '($1, $2, $3, $4, $5, $6, $7, $8);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $userId,                // user_id
                null,                   // company_id
                'WEBX',                 // platform_type_code
                '',                     // device_name
                $refreshToken,          // refresh_token
                86400,                  // lifetime 86400 = 24 hours
                date('Y-m-d H:i:s'),    // last_accessed_on
                date('Y-m-d H:i:s')     // created_on
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'loginSuccess' => true,
                'usernameValid' => true,
                'passwordValid' => true,
                'userActive' => true,
                'mustSelectCompany' => $mustSelectCompany
            ]) );
            
            return true;
        }
        
        // Function to log a user out
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function logout($data, $user, $db) : bool {
            // Clear user data from system
            System::logout();
            
            // Connect to the main database
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
            
            // Remove the user's entry in user_sessions
            $sqlQuery = 'DELETE FROM user_sessions WHERE refresh_token = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [Session::getRefreshToken()]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Clear the session
            Session::destroy();
            
            echo( json_encode(['ok' => true]) );
            
            return true;
        }
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function isLoggedIn($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            $loggedIn = System::isLoggedIn();
            
            echo( json_encode([
                'ok' => true,
                'isLoggedIn' => $loggedIn,
                'mustSelectCompany' => false
            ]) );
            
            return true;
        }
        
        // Function to get details about the currently logged in user
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        //
        public function get($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            $userDetails = [
                'name' => null,
                'company' => null
            ];
            
            if( $user !== null ) {
                // Set user name
                $userDetails['name'] = $user['name'];
                
                // If a company is set load the details from the database.
                if( isset($data['companyId']) ) {
                    // Connect to the main database to get company name
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
                    
                    // Load company details from id
                    $sqlQuery = 'SELECT id, name, alias, database_name, database_schema, database_host FROM companies WHERE id = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$data['companyId']]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Check if we found the company
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Company not found.']) );
                        return false;
                    }
                    
                    // Load the company details
                    $sqlRow = $sqlResult->fetchAssociative();
                    $companyId = $sqlRow['id'];
                    $companyAlias = $sqlRow['alias'];
                    
                    $userDetails['company'] = [
                        'id' => $companyId,
                        'name' => $companyAlias
                    ];
                }
            }
            
            echo( json_encode(['ok' => true, 'user' => $userDetails]) );
            
            return true;
        }
        
        // Function to get a list of companies the user has access to
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        //
        public function getCompanyList($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Select all companies the user has access to.
            $sqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, companies.name AS company_name, companies.alias AS company_alias ' .
                'FROM ' .
                    'user_company_access ' .
                'LEFT JOIN ' .
                    'companies ON user_company_access.company_id = companies.id ' . 
                'WHERE ' .
                    'user_id = $1 AND companies.is_active = TRUE AND user_company_access.revoked = FALSE;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $companies = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $companies[] = [
                    'id' => $sqlRow['company_id'],
                    'name' => $sqlRow['company_alias']
                ];
            }
            
            echo( json_encode(['ok' => true, 'companies' => $companies]) );
            
            return true;
        }
        
        // Function to get the user's profile.
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        //
        public function getProfile($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Load the user's personal details
            $sqlQuery = 'SELECT id, name, email_address, cell_number FROM users WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check that a user was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User not found.']) );
                return false;
            }
            
            $profile = [];
            $sqlRow = $sqlResult->fetchAssociative();
            $profile['name'] = $sqlRow['name'];
            $profile['emailAddress'] = $sqlRow['email_address'];
            $profile['cellNumber'] = $sqlRow['cell_number'];
            
            // Load user companies
            $sqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, companies.alias AS company_alias, user_company_access.is_default ' .
                'FROM ' .
                    'user_company_access ' .
                'LEFT JOIN ' .
                    'companies ON user_company_access.company_id = companies.id ' .
                'WHERE ' .
                    'companies.is_active = TRUE AND user_id = $1 AND user_company_access.revoked = FALSE '.
                'ORDER BY ' .
                    'companies.alias ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $profile['companies'] = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $profile['companies'][] = [
                    'id' => $sqlRow['company_id'],
                    'name' => $sqlRow['company_alias'],
                    'isDefault' => $sqlRow['is_default']
                ];
            }
            
            echo( json_encode(['ok' => true, 'profile' => $profile]) );
            
            return true;
        }
        
        // Function to update user
        //
        // Required Parameters
        //  userId                  The id of user to update
        //  companyId               The id of the company whose user to update
        //
        // Optional Parameters
        //  name                    The name of user to update
        //  email                   The email of user to update
        //  cellNumber              The cell number of user to update
        //  isActive                Whether the user is active or not
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
                'userId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                
                // Optional parameters
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'email' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'isActive' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
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
            
            // NOTE: This code is used to get $ownerUserId.
            //       There are no comments for the commented code that used $ownerUserId.
            //       
            // // Load company owner user id
            // $sqlQuery = 'SELECT owner_user_id FROM companies WHERE id = $1;';
            // $sqlResult = $db->paramQuery($sqlQuery, [$data['companyId']]);
            // if( !$sqlResult->isValid() ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //     return false;
            // }
            
            // // Check if we found the company
            // if( $sqlResult->getRowCount() !== 1 ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Company not found.']) );
            //     return false;
            // }
            
            // // Load the company details
            // $sqlRow = $sqlResult->fetchAssociative();
            // $ownerUserId = $sqlRow['owner_user_id'];
            
            // NOTE: I dont know why this was commented out
            //
            // Is the current user not the owner and trying to edit the owner details?
            // if( ($user['id'] != $ownerUserId) && ($data['userId'] == $ownerUserId) ) {
                // echo( json_encode(['ok' => false, 'error' => 'You do not have permission to edit the details of the specified user.']) );
                // return false;
            // }
            
            // Is the user trying to revoke the owner's access to the payroll?
            // if( array_key_exists('payrollAccessRight', $data) ) {
                // if( ($data['userId'] == $ownerUserId) && ($data['payrollAccessRight'] != true) ) {
                    // echo( json_encode(['ok' => false, 'error' => 'The specified user\'s right to access the Payroll cannot be revoked.']) );
                    // return false;
                // }
            // }
            
            // Get the user's old email address
            if (isset($data['email'])) {
                // Check if a user with the email address already exists
                $sqlQuery = 'SELECT id FROM users WHERE LOWER(email_address) = LOWER($1) AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['email'], $data['userId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // If the rowcount is not null then the user already exists
                if( $sqlResult->getRowCount() !== 0 ) {
                    echo( json_encode(['ok' => false, 'error' => 'An account with this email address has already been registered.']) );
                    return false;
                }
                
                // Get old email
                $sqlQuery = 'SELECT email_address FROM users WHERE id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['userId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Check if we found the company
                if( $sqlResult->getRowCount() === 1 ) {
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    $emailAddress = $sqlRow['email_address'];
                    
                    // Update non expired invitation
                    $sqlQuery = 
                        'UPDATE ' .
                            'user_company_invitations ' .
                        'SET ' .
                            'invitee_email_address = $1 ' .
                        'WHERE invitee_email_address = $2 AND expires_on > NOW() ';
                    $sqlResult = $db->paramQuery($sqlQuery, [$data['email'], $emailAddress]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Build the query to update the user
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE users SET ';
            
            if( array_key_exists('name', $data) && isset($data['name']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['name'];
            }
            
            if( array_key_exists('email', $data) && isset($data['email']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['email'];
            }
            
            if( array_key_exists('cellNumber', $data) && isset($data['cellNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'cell_number = $' . $updateCount;
                $updateValues[] = $data['cellNumber'];
            }
            
            if( array_key_exists('isActive', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'is_active = $' . $updateCount;
                $updateValues[] = $data['isActive'];
            }
            
            // Should any values be updated?
            if( $updateCount > 0 ) {
                // Set where clause
                $updateCount++;
                $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
                $updateValues[] = $data['userId'];
                
                // Execute the query and return the result
                $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should user rights be updated
            if( array_key_exists('attendanceAccessRight', $data) || array_key_exists('payrollAccessRight', $data) ) {
                if ($data['companyId'] !== null) {
                    // Start a transaction
                    $db->startTransaction();
                    $db->query('LOCK TABLE user_company_rights IN EXCLUSIVE MODE;');
                    
                    // Remove all the exiting rights
                    $sqlQuery = 'DELETE FROM user_company_rights WHERE company_id = $1 AND user_id = $2;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $data['companyId'],
                        $data['userId'],
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Add the relevant rights
                    $insertCount = 0;
                    $insertValues = [];
                    $sqlQuery = 'INSERT INTO user_company_rights(user_id, company_id, user_right_code) VALUES ';
                    
                    // Should the attendance portal access right be added?
                    if( array_key_exists('attendanceAccessRight', $data) && ($data['attendanceAccessRight'] == true) ) {
                        $insertCount++;
                        if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                        $insertValues[] = $data['userId'];
                        $sqlQuery = $sqlQuery . '($' . $insertCount;
                        
                        $insertCount++;
                        $insertValues[] = $data['companyId'];
                        $sqlQuery = $sqlQuery . ', $' . $insertCount;
                        
                        $insertCount++;
                        $insertValues[] = 'AAPO';
                        $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
                    }
                    
                    // Should the payroll portal access right be added?
                    if( array_key_exists('payrollAccessRight', $data) && ($data['payrollAccessRight'] == true) ) {
                        $insertCount++;
                        if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                        $insertValues[] = $data['userId'];
                        $sqlQuery = $sqlQuery . '($' . $insertCount;
                        
                        $insertCount++;
                        $insertValues[] = $data['companyId'];
                        $sqlQuery = $sqlQuery . ', $' . $insertCount;
                        
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
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to get details about a user by id
        //
        // Required Parameters
        //  userId          The id of the user whose details to get
        //  companyId       The id of the company whose user to get
        //
        // Optional Parameters
        //  None
        //
        public function getUserById($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'userId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the main database to get company name
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
            
            $sqlParams = [];
            
            // Add the user id
            $sqlParams[] = $data['userId'];
            $whereClause = 'WHERE user_id = $' . count($sqlParams) . ' ';
            
            // Was a company id specified?
            if( $data['companyId'] !== null ) {
                $sqlParams[] = $data['companyId'];
                $whereClause = $whereClause . ' AND company_id = $' . count($sqlParams) . ' ';
            }
            
            // Load user rights from id
            $sqlQuery = 
                'SELECT ' .
                    'user_company_rights.user_right_code, ' .
                    'user_right_types.name AS user_right_name ' .
                'FROM ' .
                    'user_company_rights ' .
                'LEFT JOIN ' .
                    'user_right_types ON user_right_types.code = user_company_rights.user_right_code ' .
                $whereClause;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $rights = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $rights[] = [
                    'code' => $sqlRow['user_right_code'],
                    'name' => $sqlRow['user_right_name']
                ];
            }
            
            // Load user details from id
            $sqlQuery = 
                'SELECT id, name, email_address, password, cell_number, is_active, is_admin FROM users WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['userId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if we found the user
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User not found.']) );
                return false;
            }
           
            // Load the company details
            $sqlRow = $sqlResult->fetchAssociative();
            $user = [];
            
            $hasPassword = false;
            if( strlen($sqlRow['password']) > 0) {
                $hasPassword = true;
            }
            
            $user = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'email' => $sqlRow['email_address'],
                'cellNumber' => $sqlRow['cell_number'],
                'isActive' => $sqlRow['is_active'],
                'hasPassword' => $hasPassword,
                'isAdmin' => $sqlRow['is_admin'],
                'rights' => $rights
            ];
            
            echo( json_encode(['ok' => true, 'user' => $user]) );
            
            return true;
        }
        
        // Function to list users 
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
                'isActive' => null,
                'isAdmin' => null,
                'hasPassword' => null,
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
                'isActive' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isAdmin' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'hasPassword' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
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
                    $sqlParams[] = $user['id'];
                    $whereClause = 
                        'WHERE users.id IN ( ' . 
                            'SELECT DISTINCT ' . 
                                'admin_group_users.user_id ' . 
                            'FROM ' . 
                                'admin_group_users ' . 
                            'WHERE ' . 
                                'admin_group_users.admin_group_id IN( ' . 
                                    'SELECT DISTINCT ' . 
                                        'admin_group_users.admin_group_id ' . 
                                    'FROM ' . 
                                        'admin_group_users ' . 
                                    'WHERE ' . 
                                        'admin_group_users.user_id = $' . count($sqlParams) . 
                                ') ' . 
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
                $whereClause = $whereClause . '( ';
                $whereClause = $whereClause . ' (users.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (users.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (users.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ' ) ';
            }
            
            // Was the isActive filter specified
            if( array_key_exists('isActive', $data) && !is_null($data['isActive']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['isActive'];
                $whereClause = $whereClause . '(users.is_active = $' . count($sqlParams) . ') ';
            }
            
            // Was the isAdmin filter specified
            if( array_key_exists('isAdmin', $data) && !is_null($data['isAdmin']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['isAdmin'];
                $whereClause = $whereClause . '(users.is_admin = $' . count($sqlParams) . ') ';
            }
            
            // Was the hasPassword filter specified
            if( array_key_exists('hasPassword', $data) && !is_null($data['hasPassword']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                if( $data['hasPassword'] ) {
                    $whereClause = $whereClause . '(LENGTH(users.password) > 0 AND users.password IS NOT NULL) ';
                }
                else {
                    $whereClause = $whereClause . '(LENGTH(users.password) <= 0 OR users.password IS NULL) ';
                }
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
                            $column = 'users.name';
                            break;
                        case 'emailAddress':
                            $column = 'users.email_address';
                            break;
                        case 'cellNumber':
                            $column = 'users.cell_number';
                            break;
                        case 'isActive':
                            $column = 'users.is_active';
                            break;
                        case 'isAdmin':
                            $column = 'users.is_admin';
                            break;
                        case 'hasPassword':
                            $column = '(CASE WHEN (LENGTH(users.password) > 0 AND users.password IS NOT NULL) THEN 1 ELSE 0 END)';
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
            
            // Load all users from the users table
            $sqlQuery = 
                'SELECT ' .
                    'users.id, ' .
                    'users.name, ' .
                    'users.email_address, ' .
                    'users.password, ' .
                    'users.cell_number, ' .
                    'users.is_admin, ' .
                    'users.is_active ' .
                'FROM ' .
                    'users ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'users.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create users array
            $users = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $hasPassword = false;
                if( strlen($sqlRow['password']) > 0) {
                    $hasPassword = true;
                }
                
                $users[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'hasPassword' => $hasPassword,
                    'isAdmin' => $sqlRow['is_admin'],
                    'isActive' => $sqlRow['is_active']
                ];
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'users' => $users ]) );
            return true;
        }
        
        // Function to verify if a password should be reset
        //
        // Required Parameters
        //  $data['email']              The email of the user. Required
        //  $data['password']           The new password of the user. Required
        //  $data['verificationCode']   The verification code of the user. Required
        public function verifyResetPassword($data, $user, $db) : bool {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'email' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'password' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'verificationCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the main database to check user's login
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
            
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $db->startTransaction();
            
            $db->query('LOCK TABLE user_reset_passwords IN EXCLUSIVE MODE;');
            
            // Check if a details matches the details entered.
            $query =
                'SELECT ' .
                    'id, user_id, email_address ' .
                'FROM ' . 
                    'user_reset_passwords ' .
                'WHERE ' .
                    'LOWER(email_address) = LOWER($1) AND verification_code = $2;';
            $result = $db->paramQuery($query, [$data['email'], $data['verificationCode']]);
            if( !$result->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            if( $result->getRowCount() !== 1 ) {
                echo(json_encode(['ok' => false, 'error' => 'The verification code is invalid.']));
                return false;
            }
            
            // If the verification succeeded, update the password
            $row = $result->fetchAssociative();
            $resetId = $row['id'];
            $userId = $row['user_id'];
            
            $query = 'UPDATE users SET password = $1 WHERE id = $2;';
            $result = $db->paramQuery($query, [$password, $userId]);
            if( !$result->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Delete the verification entry
            $query = 'DELETE FROM user_reset_passwords WHERE id = $1;';
            $result = $db->paramQuery($query, [$resetId]);
            if( !$result->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Invalidate all user sessions
            $query = 'UPDATE user_sessions SET lifetime = 0 WHERE user_id = $1;';
            $result = $db->paramQuery($query, [$userId]);
            if( !$result->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            echo(json_encode(['ok' => true]));
            return true;
        }
        
        // Function to reset the password of an existing user
        //
        // Required Parameters
        //  $data['email']          The email of the user. Required
        public function resetPassword($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'email' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the main database to check user's login
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
            
            $emailAddress = $data['email'];
            
            $db->startTransaction();
            
            $db->query('LOCK TABLE user_reset_passwords IN EXCLUSIVE MODE;');
            
            // Make sure the specified user exists.
            $sqlQuery = 'SELECT id, name, email_address FROM users WHERE LOWER(email_address) = LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$emailAddress]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // If no rows are returned then the user does not exist
            if( $sqlResult->getRowCount() !== 1 ) {
                echo(json_encode([
                    'ok' => false,
                    'error' => 'No user with the email address \'' . $emailAddress . '\' could be found.'
                ]));
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $userId = $sqlRow['id'];
            $emailAddress = $sqlRow['email_address'];
            $firstName = $sqlRow['name'];
            
            // Delete all previous reset password attempts.
            $sqlQuery = 'DELETE FROM user_reset_passwords WHERE LOWER(email_address) = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$emailAddress]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Build random 6 digit number
            $verificationCode = '';
            for( $i = 0; $i < 6; $i++ ) $verificationCode = $verificationCode . strval( rand(0, 9) );
            
            // Insert the new reset password request
            $sqlQuery =
                'INSERT INTO ' .
                    'user_reset_passwords (user_id, email_address, verification_code, timestamp)' .
                'VALUES ' .
                    '($1, LOWER($2), $3, $4);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $userId,
                $emailAddress,
                $verificationCode,
                date('Y-m-d H:i:s', time())
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
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
            
            // Create template
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/reset_password_verification.html' );
            $mailText = str_replace('$VERIFICATION_CODE', $verificationCode, $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            $mail->addAddress($emailAddress, '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll Password Reset Request';
            $mail->Body = $mailText;
            
            $mail->send();
            
            echo(json_encode(['ok' => true]));
            return true;
        }
        
        // Function to change the currently logged in user's password
        //
        // Required Parameters
        //  currentPassword             The user's current password.
        //  newPassword                 The user's new password.
        //
        // Optional Parameters
        //  None
        public function changePassword($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'currentPassword' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'newPassword' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
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
            
            // Check that the user exists and load user details.
            $sqlQuery = 'SELECT id, name, email_address, password, is_active FROM users WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // If no rows are returned then we were unable to find the user.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User not found.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Check that the user's account is active
            if( $sqlRow['is_active'] === false ) {
                echo( json_encode(['ok' => false, 'error' => 'This account is no longer active and the password can not be changed.']) );
                return false;
            }
            
            // Check that the current password provided matches the one stored in the DB
            if( !password_verify($data['currentPassword'], $sqlRow['password']) ) {
                echo( json_encode([
                    'ok' => false, 
                    'error' => 'The current password provided is incorrect.  Please make sure you entered it correctly'
                ]) );
                return false;
            }

            $userId = $sqlRow['id'];
            $emailAddress = $sqlRow['email_address'];
            $currentPassword = $sqlRow['password'];
            $firstName = $sqlRow['name'];
            
            // Start an SQL transaction
            $db->startTransaction();
            
            // Update the user's password
            $hashedPassword = password_hash($data['newPassword'], PASSWORD_DEFAULT);
            $sqlQuery = 'UPDATE users SET password = $1 WHERE id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$hashedPassword, $userId]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Invalidate all other sessions
            $sqlQuery = 'UPDATE user_sessions SET lifetime = 0 WHERE user_id = $1 AND refresh_token != $2';
            $sqlResult = $db->paramQuery($sqlQuery, [$userId, Session::getRefreshToken()]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Commit the SQL transaction
            $db->commitTransaction();
            
            // Expire and regenerate the session
            Session::expire();
            Session::regenerate();
            
            // Send the email
            System::useModule('phpmailer');
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->charSet = 'UTF-8';
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
            
            // Create template
            $dateString = date('l d F Y');
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/change_password_notification.html' );
            $mailText = str_replace('$CHANGE_DATE', $dateString, $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            $mail->addAddress($emailAddress, '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll Password Change Notification';
            $mail->Body = $mailText;
            
            $mail->send();
            
            echo(json_encode(['ok' => true]));
            return true;
        }
        
        public function updateUserProfile($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'cellNumber' => '',
                'defaultCompanyId' => null,
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'email' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'defaultCompanyId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
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
            
            // Check if the email address already exists
            $sqlResult = $db->paramQuery('SELECT id FROM users WHERE email_address = LOWER($1) AND id != $2;', [
                $data['email'],
                $user['id']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() > 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified email address has already been used.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE user_company_access IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE users IN EXCLUSIVE MODE;');
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE users SET ';
            
            $updateCount++;
            if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'name = $' . $updateCount;
            $updateValues[] = $data['name'];
            
            $updateCount++;
            if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'email_address = $' . $updateCount;
            $updateValues[] = $data['email'];
            
            $updateCount++;
            if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'cell_number = $' . $updateCount;
            $updateValues[] = $data['cellNumber'];
            
            // Set where clause
            $updateCount++;
            $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $user['id'];
            
            $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE user_company_access SET ';
            
            $updateCount++;
            if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'is_default = $' . $updateCount;
            $updateValues[] = false;
            
            // Set where clause
            $updateCount++;
            $sqlQuery = $sqlQuery . ' WHERE user_id = $' . $updateCount . ';';
            $updateValues[] = $user['id'];
            
            $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if ($data['defaultCompanyId'] !== null) {
                
                // Build the query to update the client
                $updateCount = 0;
                $updateValues = [];
                $sqlQuery = 'UPDATE user_company_access SET ';
                
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'is_default = $' . $updateCount;
                $updateValues[] = true;
                
                // Set where clause
                $updateCount++;
                $sqlQuery = $sqlQuery . ' WHERE user_id = $' . $updateCount;
                $updateValues[] = $user['id'];
                
                $updateCount++;
                $sqlQuery = $sqlQuery . ' AND company_id = $' . $updateCount . ';';
                $updateValues[] = $data['defaultCompanyId'];
                
                $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
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
        
        // Function to reset the user read status of the 'What's New' message
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        //
        public function resetWhatsNewMessage($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Get the id of the 'What's New' message
            $sqlQuery = 'SELECT id FROM user_messages WHERE number = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [4]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // If no rows are returned then we were unable to find the message.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User message not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $messageId = $sqlRow['id'];
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE user_messages_read IN EXCLUSIVE MODE;');
            
            // Reset the messages read
            $sqlQuery = 'DELETE FROM user_messages_read WHERE user_message_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$messageId]);
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
        
        // Function to create a quick access token for the user for a given company.
        //
        // Required Parameters
        //  companyId           The ID of the company this quick access token is for.
        //  password            The password of the user creating the quick access token.
        //
        // Optional Parameters
        //  None
        //
        public function createQuickAccessToken($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'password' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Check that the password provided is valid.
            $sqlQuery = 'SELECT password FROM users WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // We must have one row.  If not then we were unable to find the user.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo(json_encode(['ok' => false, 'error' => 'User not found.']));
                return false;
            }
            
            // Check that the password provided matches the one in the database
            $sqlRow = $sqlResult->fetchAssociative();
            if( !password_verify($data['password'], $sqlRow['password']) ) {
                echo(json_encode(['ok' => false, 'error' => 'Invalid password']));
                return false;
            }
            
            // Check that the company with the given ID exists
            $sqlQuery = 'SELECT id, name FROM companies WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // We must have one row.  If not the company was not found.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo(json_encode(['ok' => false, 'error' => 'Company not found.']));
                return false;
            }
            
            // Load company details.
            $sqlRow = $sqlResult->fetchAssociative();
            $companyName = $sqlRow['name'];
            
            // Check that the user is allowed to access the given company
            $sqlQuery = 
                'SELECT company_id FROM admin_group_companies WHERE admin_group_id IN (' .
                    'SELECT admin_group_id FROM admin_group_users WHERE user_id = $1' . 
                ') AND company_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $data['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // If we have 0 rows then this user does not have access to the company.  There may be more than one row because a user
            // can be in more than one group that both have access to the company.
            if( $sqlResult->getRowCount() === 0 ) {
                echo(json_encode(['ok' => false, 'error' => 'You do not have access to the \'' . $companyName . '\' company.']));
                return false;
            }
            
            // Create a token
            $token = Security::generateRandomString(64);
            
            // If we passed all the checks create the quick access token
            $sqlQuery = 
                'INSERT INTO ' . 
                    'user_quickaccess_tokens (company_id, user_id, token, created_on, expires_on, used) ' . 
                'VALUES ' . 
                    '($1, $2, $3, $4, $5, $6);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['companyId'],         // company_id
                $user['id'],                // user_id
                $token,                     // token
                date('Y-m-d H:i:s'),        // created_on
                date('Y-m-d H:i:s', time() + 300),   // expires_on
                false                       // used
            ]);
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'quickAccessToken' => $token,
                'quickAccessUrl' => CONF_CLIENT_URL . '/exec.php?c=User&fn=quickAccessLogin'
            ]) );
            
            return true;
        }
    }
?>
