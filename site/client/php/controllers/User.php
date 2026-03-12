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
        
        protected $csrfWhitelist = [
            'quickAccessLogin'
        ];
        protected $authenticationWhitelist = [
            'isLoggedIn',
            'login',
            'quickAccessLogin',
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
            $sqlQuery = 'SELECT id, name, password, is_active FROM users WHERE LOWER(email_address) = LOWER($1);';
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
                    'mustSelectCompany' => null,
                    'isTrial' => null,
                    'setupComplete' => null,
                    'payrollAccess' => null
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
                    'mustSelectCompany' => null,
                    'isTrial' => null,
                    'setupComplete' => null,
                    'payrollAccess' => null
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
                    'mustSelectCompany' => null,
                    'isTrial' => null,
                    'setupComplete' => null,
                    'payrollAccess' => null
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
            
            // If the user has access to more than one company they must choose the company to log into.
            $mustSelectCompany = true;
            $isTrial = false;
            $trialExpired = false;
            $setupComplete = false;
            
            $sqlQuery =
                'SELECT ' .
                    'user_id, ' . 
                    'company_id, ' . 
                    'is_default, ' .
                    'companies.alias AS company_alias, ' . 
                    'companies.database_name, ' . 
                    'companies.database_schema, ' . 
                    'companies.database_host, ' . 
                    'companies.is_trial AS company_is_trial, ' .
                    '((companies.is_trial) AND (companies.trial_expires_on < now()::date)) AS trial_expired, ' .
                    'companies.is_setup_complete ' .
                'FROM ' .
                    'user_company_access ' .
                'LEFT JOIN ' .
                    'companies ON user_company_access.company_id = companies.id ' . 
                'WHERE ' .
                    'user_id = $1 AND companies.is_active = TRUE AND user_company_access.revoked = FALSE;';
            $sqlResult = $db->paramQuery($sqlQuery, [$userId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Were no companies found?
            if( $sqlResult->getRowCount() < 1 ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => true,
                    'passwordValid' => true,
                    'userActive' => true,
                    'mustSelectCompany' => false,
                    'isTrial' => null,
                    'setupComplete' => null,
                    'payrollAccess' => false
                ]) );
                return true;
            }
            
            // Depending on whether one or more companies were found
            $companyId = null;
            $companyAlias = '';
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $companyId = $sqlRow['company_id'];
                $companyAlias = $sqlRow['company_alias'];
                $mustSelectCompany = false;
                $isTrial = $sqlRow['company_is_trial'];
                $trialExpired = $sqlRow['trial_expired'];
                $setupComplete = $sqlRow['is_setup_complete'];
                
                // Cache the database settings
                $_SESSION['dbCache'] = [
                    'host' => $sqlRow['database_host'],
                    'database' => $sqlRow['database_name'],
                    'schema' => $sqlRow['database_schema']
                ];
            }
            else {
                // Check if a default was set
                while( $sqlRow = $sqlResult->fetchAssociative() ) {
                    // Is the company the default company?
                    if( $sqlRow['is_default'] === true ) {
                        $companyId = $sqlRow['company_id'];
                        $companyAlias = $sqlRow['company_alias'];
                        $isTrial = $sqlRow['company_is_trial'];
                        $trialExpired = $sqlRow['trial_expired'];
                        $setupComplete = $sqlRow['is_setup_complete'];
                        
                        // Cache the database settings
                        $_SESSION['dbCache'] = [
                            'host' => $sqlRow['database_host'],
                            'database' => $sqlRow['database_name'],
                            'schema' => $sqlRow['database_schema']
                        ];
                        
                        $mustSelectCompany = false;
                        break;
                    }
                }
            }
            
            // Does the user have acces to the payroll portal?
            $payrollAccess = null;
            
            // Was a company selected?
            if( $companyId !== null ) {
                // Check if the user has the right to access the payroll portal
                $sqlQuery = 'SELECT user_right_code FROM user_company_rights WHERE user_right_code = \'APPO\' AND user_id = $1 AND company_id = $2 LIMIT 1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $userId,
                    $companyId
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Was the right to access the company payroll not found?
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode([
                        'ok' => true,
                        'loginSuccess' => false,
                        'usernameValid' => true,
                        'passwordValid' => true,
                        'userActive' => true,
                        'mustSelectCompany' => false,
                        'isTrial' => null,
                        'setupComplete' => null,
                        'payrollAccess' => false
                    ]) );
                    return true;
                }
                
                $payrollAccess = true;
            }
                
            // If login was successful store user details in session
            System::login([
                'id' => $userId,
                'name' => $userName,
                'companyId' => $companyId,
                'companyAlias' => $companyAlias,
                'trialExpired' => $trialExpired,
                'setupComplete' => $setupComplete
            ]);
            
            // Add an entry in the user_sessions table.
            $sqlQuery = 
                'INSERT INTO ' . 
                    'user_sessions ( ' . 
                        'user_id, ' . 
                        'company_id, ' . 
                        'platform_type_code, ' . 
                        'device_name, ' . 
                        'refresh_token, ' . 
                        'lifetime, ' . 
                        'last_accessed_on, ' . 
                        'created_on ' . 
                    ') ' .
                'VALUES ' . 
                    '($1, $2, $3, $4, $5, $6, $7, $8);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $userId,                // user_id
                $companyId,             // company_id
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
            
            // Load unread messages
            $sqlQuery = 
                'SELECT ' . 
                    'number ' .
                'FROM ' . 
                    'user_messages ' . 
                'LEFT JOIN ' .
                    'user_messages_read ON user_messages.id = user_messages_read.user_message_id AND user_messages_read.user_id = $1 ' . 
                'WHERE ' . 
                    'user_messages_read.user_message_id IS NULL;';
            $sqlResult = $db->paramQuery($sqlQuery, [$userId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $messages = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $messages[] = $sqlRow['number'];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'loginSuccess' => true,
                'usernameValid' => true,
                'passwordValid' => true,
                'userActive' => true,
                'mustSelectCompany' => $mustSelectCompany,
                'isTrial' => $isTrial,
                'setupComplete' => $setupComplete,
                'unreadMessages' => $messages,
                'payrollAccess' => null
            ]) );
            
            return true;
        }
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  quickAccessToken            The access token to use for the quick login.
        //
        // Optional Parameters
        //  None
        public function quickAccessLogin($data, $user, $db) : bool {
            // Sleep for 1 second to limit the amount of login attempts should someone try to brute force username and passwords
            sleep(1);
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'quickAccessToken' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
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
            
            // Check if the quick access token exists, is not used and has not expired.
            $sqlQuery = 
                'SELECT ' . 
                    'user_quickaccess_tokens.id, user_quickaccess_tokens.company_id, user_quickaccess_tokens.user_id, ' . 
                    'users.name AS user_name, users.is_active AS user_is_active, users.email_address AS user_email_address, ' . 
                    'companies.name AS company_name, companies.alias AS company_alias, ' . 
                    'companies.database_name AS company_database_name, companies.database_schema AS company_database_schema, ' . 
                    'companies.database_host AS company_database_host ' .  
                'FROM ' . 
                    'user_quickaccess_tokens ' . 
                'LEFT JOIN ' . 
                    'users ON user_quickaccess_tokens.user_id = users.id ' .
                'LEFT JOIN ' . 
                    'companies ON user_quickaccess_tokens.company_id = companies.id ' .
                'WHERE ' . 
                    'token = $1 AND used = FALSE AND expires_on > $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['quickAccessToken'],
                date('Y-m-d H:i:s')
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check that the quick access token was found.
            if( $sqlResult->getRowCount() !== 1 ) {
                echo('Quick access token not found or has expired.');
                return false;
            }
            
            // Load quick access token details.
            $sqlRow = $sqlResult->fetchAssociative();
            $quickAccessTokenId = $sqlRow['id'];
            $companyId = $sqlRow['company_id'];
            $companyAlias = $sqlRow['company_alias'];
            $userId = $sqlRow['user_id'];
            $userName = $sqlRow['user_name'];
            $userActive = $sqlRow['user_is_active'];
            $userEmailAddress = $sqlRow['user_email_address'];
            $companyName = $sqlRow['company_name'];
            $companyDbHost = $sqlRow['company_database_host'];
            $companyDbName = $sqlRow['company_database_name'];
            $companyDbSchema = $sqlRow['company_database_schema'];
            
            // Mark the quick access token as used.
            $sqlQuery = 'UPDATE user_quickaccess_tokens SET used = TRUE WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$quickAccessTokenId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the user is active
            if( $userActive !== true ) {
                echo('The user is no longer active');
                return false;
            }
            
            
            // Send an email to the user to notify them of the quick access login.
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
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/quick_access_notification.html' );
            $mailText = str_replace('$USER_NAME', $userName, $mailText);
            $mailText = str_replace('$COMPANY_NAME', $companyName, $mailText);
            $mailText = str_replace('$LOGIN_TIMESTAMP', date('Y-m-d H:i:s'), $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            $mail->addAddress($userEmailAddress, '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll Quick Login: ' . $companyName;
            $mail->Body = $mailText;
            
            $mail->send();
            
            // Destroy the current session and start a new one.
            Session::destroy();
            Session::start();
            Session::regenerate();
            
            // If the login was successful generate a refresh token
            $refreshToken = Security::generateRandomString(32);
            Session::setRefreshToken( $refreshToken );
            
            // Set the database cache setting for the user.
            $_SESSION['dbCache'] = [
                'host' => $companyDbHost,
                'database' => $companyDbName,
                'schema' => $companyDbSchema
            ];
             
            // If login was successful store user details in session
            System::login([
                'id' => $userId,
                'name' => $userName,
                'companyId' => $companyId,
                'companyAlias' => $companyAlias,
                'trialExpired' => false,
                'setupComplete' => true
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
                $companyId,             // company_id
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
            
            // Forward to the home page
            header('Location: ' . CONF_ROOT_URL);
            
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
            $mustSelectCompany = true;
            $trialExpired = false;
            $setupComplete = false;
            
            // If we are logged in check if a company was set for the user.
            if( $loggedIn === true ) {
                if( isset($user['companyId']) && $user['companyId'] !== null ) $mustSelectCompany = false;
                if( array_key_exists('trialExpired', $user) && $user['trialExpired'] !== null ) $trialExpired = $user['trialExpired'];
                if( array_key_exists('setupComplete', $user) && $user['setupComplete'] !== null ) $setupComplete = $user['setupComplete'];
            }
            
            echo( json_encode([
                'ok' => true,
                'isLoggedIn' => $loggedIn,
                'mustSelectCompany' => $mustSelectCompany,
                'trialExpired' => $trialExpired,
                'setupComplete' => $setupComplete
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
                if( isset($user['companyId']) ) {
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
                    $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
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
        
        // Function to get a list of companies the user has access to
        //
        // Required Parameters
        //  companyId               The ID of the company to switch to.
        //
        // Optional Parameters
        //  None
        //
        public function switchCompany($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
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
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the user has the right to access the payroll portal
            $sqlQuery = 'SELECT user_right_code FROM user_company_rights WHERE user_right_code = \'APPO\' AND user_id = $1 AND company_id = $2 LIMIT 1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $user['id'], 
                $data['companyId']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the right to access the company payroll not found?
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company payroll access denied.']) );
                return false;
            }
            
            // Check if the user is allowed access to the selected database
            $sqlQuery =
                'SELECT ' .
                    'company_id, ' . 
                    'user_id, ' . 
                    'revoked, ' .
                    'companies.is_active, ' . 
                    'companies.database_name, ' . 
                    'companies.database_schema, ' . 
                    'companies.database_host, ' . 
                    'companies.alias AS company_alias, ' . 
                    'companies.is_trial, ' . 
                    '((companies.is_trial) AND (companies.trial_expires_on < now()::date)) AS trial_expired, ' .
                    'companies.is_setup_complete ' . 
                'FROM ' .
                    'user_company_access ' .
                'LEFT JOIN ' .
                    'companies ON user_company_access.company_id = companies.id ' . 
                'WHERE ' .
                    'user_id = $1 AND company_id = $2 AND revoked IS FALSE;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $data['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // If no rows are returned then the user does not have access to the given company
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Access denied.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Check that access is not revoked
            if( $sqlRow['revoked'] !== false ) {
                echo( json_encode(['ok' => false, 'error' => 'Your access to \'' . $sqlRow['alias'] . '\' has been revoked.' ]) );
                return false;
            }
            
            // Check that the company is active
            if( $sqlRow['is_active'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Company is inactive.']) );
                return false;
            }
            
            // Load the ID of the company we switched to.
            $companyId = $sqlRow['company_id'];
            $companyAlias = $sqlRow['company_alias'];
            $isTrial = $sqlRow['is_trial'];
            $trialExpired = $sqlRow['trial_expired'];
            $setupComplete = $sqlRow['is_setup_complete'];
            
            // Cache the database settings
            $_SESSION['dbCache'] = [
                'host' => $sqlRow['database_host'],
                'database' => $sqlRow['database_name'],
                'schema' => $sqlRow['database_schema']
            ];
            
            // Load the ID of the company we switched to.
            // $sqlRow = $sqlResult->fetchAssociative();
            // $companyId = $data['companyId'];
            
            // Update user details to reflect changed company
            $userDetails = System::getUserData();
            $userDetails['companyId'] = $companyId;
            $userDetails['companyAlias'] = $companyAlias;
            $userDetails['trialExpired'] = $trialExpired;
            $userDetails['setupComplete'] = $setupComplete;
            System::setUserData( $userDetails );
            
            // Update company ID of the user's user_sessions entry
            $refreshToken = Session::getRefreshToken();
            $sqlQuery = 'UPDATE user_sessions SET company_id = $1 WHERE refresh_token = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId, $refreshToken]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true, 'isTrial' => $isTrial, 'setupComplete' => $setupComplete]) );
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
            
            // Load company owner user id
            $sqlQuery = 'SELECT owner_user_id FROM companies WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
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
            $ownerUserId = $sqlRow['owner_user_id'];
            
            // Is the current user not the owner and trying to edit the owner details?
            if( ($user['id'] != $ownerUserId) && ($data['userId'] == $ownerUserId) ) {
                echo( json_encode(['ok' => false, 'error' => 'You do not have permission to edit the details of the specified user.']) );
                return false;
            }
            
            // Is the user trying to revoke the owner's access to the payroll?
            if( array_key_exists('payrollAccessRight', $data) ) {
                if( ($data['userId'] == $ownerUserId) && ($data['payrollAccessRight'] != true) ) {
                    echo( json_encode(['ok' => false, 'error' => 'The specified user\'s right to access the Payroll cannot be revoked.']) );
                    return false;
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
                // Start a transaction
                $db->startTransaction();
                $db->query('LOCK TABLE user_company_rights IN EXCLUSIVE MODE;');
                
                // Remove all the exiting rights
                $sqlQuery = 'DELETE FROM user_company_rights WHERE company_id = $1 AND user_id = $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $user['companyId'],
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
                    $insertValues[] = $user['companyId'];
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
                    $insertValues[] = $user['companyId'];
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
                'userId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
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
            
            // Load user rights from id
            $sqlQuery = 
                'SELECT ' .
                    'user_company_rights.user_right_code, ' .
                    'user_right_types.name AS user_right_name ' .
                'FROM ' .
                    'user_company_rights ' .
                'LEFT JOIN ' .
                    'user_right_types ON user_right_types.code = user_company_rights.user_right_code ' .
                'WHERE ' .
                    'company_id = $1 AND ' .
                    'user_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $user['companyId'],
                $data['userId']
            ]);
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
                'SELECT id, name, email_address, cell_number, is_active FROM users WHERE id = $1;';
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
            $user = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'email' => $sqlRow['email_address'],
                'cellNumber' => $sqlRow['cell_number'],
                'isActive' => $sqlRow['is_active'],
                'rights' => $rights
            ];
            
            echo( json_encode(['ok' => true, 'user' => $user]) );
            
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
        
        // Function to mark a user message as read for the currently logged in user.
        //
        // Required Parameters
        //  number      The number of user message to mark as read.
        //
        // Optional Parameters
        //  None
        public function readUserMessage($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'number' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
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
            
            // Check that the message number exists and get it's id
            $sqlResult = $db->paramQuery('SELECT id FROM user_messages WHERE number = $1;', [$data['number']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'User Message number \'' . $data['number'] . '\' does not exist.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $userMessageId = $sqlRow['id'];
            
            // Check if the message is already marked as read
            $sqlQuery = 'SELECT user_message_id FROM user_messages_read WHERE user_id = $1 AND user_message_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $userMessageId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => true]) );
                return true;
            }
            
            // If the message is not already marked as read, mark it as read.
            $sqlQuery = 'INSERT INTO user_messages_read (user_id, user_message_id) VALUES ($1, $2);';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $userMessageId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to mark that the first-time setup has been completed
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function completeFirstTimeSetup($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Mark that the setup has been completed in the database
            $sqlQuery = 'UPDATE companies SET is_setup_complete = TRUE WHERE companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $user['companyId']      // companies.id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Mark that the setup has been completed in the session
            $user['setupComplete'] = true;
            
            // Restore the user's session and log him in.
            System::login([
                'id' => $user['id'],
                'name' => $user['name'],
                'companyId' => $user['companyId'],
                'companyAlias' => $user['companyAlias'],
                'trialExpired' => $user['trialExpired'],
                'setupComplete' => $user['setupComplete']
            ]);
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
    }
?>
