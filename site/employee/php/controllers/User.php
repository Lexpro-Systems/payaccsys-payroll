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
            'register',
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
        
        // Function to register a new account.
        //
        // Required Parameters
        //  firstName           The first name of the person who is registering
        //  lastName            The last name of the person who is registering
        //  emailAddress        The email address for the employee account
        //  password            The password for the employee account
        //
        // Optional Parameters
        //  None
        public function register($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'firstName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'lastName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'password' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
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
            
            // Make certain the given email address is unique
            $sqlQuery = 
                'SELECT ' . 
                    'employee_accounts.id ' .
                'FROM ' . 
                    'employee_accounts ' . 
                'WHERE ' . 
                    'LOWER(email_address) = LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['emailAddress']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the email addres already used?
            if( $sqlResult->getRowCount() > 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'An account with the specified details already exists.']) );
                return false;
            }
            
            // Create the employee account
            $password = password_hash($data['password'], PASSWORD_DEFAULT);
            $sqlQuery = 
                'INSERT INTO employee_accounts ( ' . 
                    'first_name, ' .
                    'last_name, ' .
                    'email_address, ' .
                    'password, ' .
                    'created_on ' . 
                ') ' .
                'VALUES ( ' . 
                    '$1, $2, $3, $4, $5 ' . 
                ');';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['firstName'],     // first_name
                $data['lastName'],      // last_name
                $data['emailAddress'],  // email_address
                $password,              // password
                date('Y-m-d H:i:s')     // created_on
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send the email
            System::useModule('phpmailer');
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            // Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->charSet = 'UTF-8';
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
            
            // Load the template to send
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/new_registration_notification.html' );
            $mailText = str_replace('$RECIPIENT_NAME', $data['firstName'], $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys');
            $mail->addAddress($data['emailAddress'], '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll: Welcome!';
            $mail->Body    = $mailText;
            $mail->AltBody = $mailText;
            
            $mail->send();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
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
            $sqlQuery = 'SELECT id, first_name, last_name, password FROM employee_accounts WHERE LOWER(email_address) = LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['username']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Verify username
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => false,
                    'passwordValid' => null,
                    'userActive' => true,
                    'mustLinkProfile' => null,
                    'mustSelectCompany' => null
                ]) );
                return true;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $accountId = $sqlRow['id'];
            $userName = $sqlRow['first_name'];
            
            // Verify password
            if( password_verify($data['password'], $sqlRow['password']) !== true ) {
                echo( json_encode([
                    'ok' => true,
                    'loginSuccess' => false,
                    'usernameValid' => true,
                    'passwordValid' => false,
                    'userActive' => null,
                    'mustLinkProfile' => null,
                    'mustSelectCompany' => null
                ]) );
                return false;
            }
            
            // NOTE:
            
            // At the moment we there is no field in the db for checking if the user is active, but
            // it may have to be added later.
            
            // Check if the user is active
            // if( $sqlRow['is_active'] !== true ) {
            //     echo( json_encode([
            //         'ok' => true,
            //         'loginSuccess' => false,
            //         'usernameValid' => true,
            //         'passwordValid' => true,
            //         'userActive' => false,
            //         'mustLinkProfile' => null,
            //         'mustSelectCompany' => null
            //     ]) );
            //     return true;
            // }
            
            // Destroy the current session and start a new one.
            Session::destroy();
            Session::start();
            Session::regenerate();
            
            // If the login was successful generate a refresh token
            $refreshToken = Security::generateRandomString(32);
            Session::setRefreshToken( $refreshToken );
            
            // If the user has access to more than one profile they must choose the profile to log
            // into. If the user doesn't have access to any profiles, a profile must be linked
            $mustLinkProfile = false;
            $mustSelectCompany = true;
            
            $sqlQuery =
                'SELECT ' .
                    'employee_account_employee_profile_access.id, ' .
                    'employee_account_employee_profile_access.employee_account_id, ' .
                    'employee_account_employee_profile_access.employee_profile_id, ' .
                    'employee_account_employee_profile_access.revoked, ' . 
                    'employee_profiles.company_id, ' .
                    'employee_profiles.employee_id, ' .
                    'companies.is_active, ' . 
                    'companies.database_name, ' . 
                    'companies.database_schema, ' . 
                    'companies.database_host, ' . 
                    'companies.alias ' . 
                'FROM ' .
                    'employee_account_employee_profile_access ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_account_employee_profile_access.employee_profile_id ' . 
                'LEFT JOIN ' .
                    'companies ON companies.id = employee_profiles.company_id ' . 
                'WHERE ' .
                    'employee_account_employee_profile_access.employee_account_id = $1 AND ' . 
                    'employee_account_employee_profile_access.revoked = FALSE AND ' . 
                    'companies.is_active = TRUE ;';
            $sqlResult = $db->paramQuery($sqlQuery, [$accountId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set company details
            $companyId = null;
            $employeeId = null;
            if( $sqlResult->getRowCount() < 1 ) {
                $mustLinkProfile = true;
                $mustSelectCompany = false;
            }
            else if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $companyId = $sqlRow['company_id'];
                $employeeId = $sqlRow['employee_id'];
                $mustLinkProfile = false;
                $mustSelectCompany = false;
                
                // Cache the database settings
                $_SESSION['dbCache'] = [
                    'host' => $sqlRow['database_host'],
                    'database' => $sqlRow['database_name'],
                    'schema' => $sqlRow['database_schema']
                ];
            }
            
            // If login was successful store user details in session
            System::login([
                'id' => $accountId,
                'name' => $userName,
                'hasProfile' => !($mustLinkProfile),
                'employeeId' => $employeeId,
                'companyId' => $companyId
            ]);
            
            // Add an entry in the employee_account_sessions table.
            $sqlQuery = 
                'INSERT INTO employee_account_sessions ( ' . 
                    'employee_account_id, ' .
                    'company_id, ' .
                    'platform_type_code, ' .
                    'device_name, ' .
                    'refresh_token, ' .
                    'lifetime, ' .
                    'last_accessed_on, ' .
                    'created_on ' .
                ') ' .
                'VALUES ( ' . 
                    '$1, $2, $3, $4, $5, $6, $7, $8 ' . 
                ');';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $accountId,             // employee_account_id
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
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'loginSuccess' => true,
                'usernameValid' => true,
                'passwordValid' => true,
                'userActive' => true,
                'mustLinkProfile' => $mustLinkProfile,
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
            $mustLinkProfile = true;
            $mustSelectCompany = true;
            
            // If we are logged in check if a company was set for the user.
            if( $loggedIn === true ) {
                if( isset($user['hasProfile']) && $user['hasProfile'] === true ) $mustLinkProfile = false;
                if( isset($user['companyId']) && $user['companyId'] !== null ) $mustSelectCompany = false;
            }
            
            echo( json_encode([
                'ok' => true,
                'isLoggedIn' => $loggedIn,
                'mustLinkProfile' => $mustLinkProfile,
                'mustSelectCompany' => $mustSelectCompany
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
                    'employee_account_employee_profile_access ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_account_employee_profile_access.employee_profile_id ' . 
                'LEFT JOIN ' .
                    'companies ON employee_profiles.company_id = companies.id ' . 
                'WHERE ' .
                    'employee_account_id = $1 AND companies.is_active = TRUE AND employee_account_employee_profile_access.revoked = FALSE;';
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
            
            // // Check if the user has the right to access the payroll portal
            // $sqlQuery = 'SELECT user_right_code FROM user_company_rights WHERE user_right_code = \'APPO\' AND user_id = $1 AND company_id = $2 LIMIT 1;';
            // $sqlResult = $db->paramQuery($sqlQuery, [
            //     $user['id'], 
            //     $data['companyId']
            // ]);
            // if( !$sqlResult->isValid() ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //     return false;
            // }
            
            // // Was the right to access the company payroll not found?
            // if( $sqlResult->getRowCount() !== 1 ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Company payroll access denied.']) );
            //     return false;
            // }
            
            // Check if the user is allowed access to the selected database
            $sqlQuery =
                'SELECT ' .
                    'company_id, ' . 
                    'revoked, ' . 
                    'companies.is_active, ' . 
                    'companies.database_name, ' . 
                    'companies.database_schema, ' . 
                    'companies.database_host, ' . 
                    'companies.alias, ' . 
                    'employee_profiles.employee_id, ' .
                    'employee_profiles.company_id ' .
                'FROM ' .
                    'employee_account_employee_profile_access ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_account_employee_profile_access.employee_profile_id ' . 
                'LEFT JOIN ' .
                    'companies ON employee_profiles.company_id = companies.id ' . 
                'WHERE ' .
                    'employee_account_id = $1 AND company_id = $2 AND revoked IS FALSE;';
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
            $companyId = $sqlRow['company_id'];
            $employeeId = $sqlRow['employee_id'];
            
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
            
            // Cache the database settings
            $_SESSION['dbCache'] = [
                'host' => $sqlRow['database_host'],
                'database' => $sqlRow['database_name'],
                'schema' => $sqlRow['database_schema']
            ];
            
            // Update user details to reflect changed company
            $userDetails = system::getUserData();
            $userDetails['employeeId'] = $employeeId;
            $userDetails['companyId'] = $companyId;
            System::setUserData( $userDetails );
            
            // Update company ID of the user's user_sessions entry
            $refreshToken = Session::getRefreshToken();
            $sqlQuery = 'UPDATE employee_account_sessions SET company_id = $1 WHERE refresh_token = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId, $refreshToken]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
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
            $sqlQuery = 'SELECT id, first_name, last_name, email_address FROM employee_accounts WHERE id = $1;';
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
            $profile['firstName'] = $sqlRow['first_name'];
            $profile['lastName'] = $sqlRow['last_name'];
            $profile['emailAddress'] = $sqlRow['email_address'];
            
            // Load user companies
            $sqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, companies.alias AS company_alias ' .
                'FROM ' .
                    'employee_account_employee_profile_access ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_account_employee_profile_access.employee_profile_id ' .
                'LEFT JOIN ' .
                    'companies ON companies.id = employee_profiles.company_id ' .
                'WHERE ' .
                    'employee_account_employee_profile_access.employee_account_id = $1 AND ' . 
                    'employee_account_employee_profile_access.revoked = FALSE AND ' .
                    'companies.is_active = TRUE ' .
                'ORDER BY ' .
                    'companies.alias ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $profile['companies'] = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $isLoggedIn = false;
                if( $sqlRow['company_id'] == $user['companyId'] ) {
                    $isLoggedIn = true;
                }
                $profile['companies'][] = [
                    'id' => $sqlRow['company_id'],
                    'name' => $sqlRow['company_alias'],
                    'isLoggedIn' => $isLoggedIn
                ];
            }
            
            echo( json_encode(['ok' => true, 'profile' => $profile]) );
            
            return true;
        }
        
        // Function to update user
        //
        // Required Parameters
        //  none
        //
        // Optional Parameters
        //  firstName               The first name of user to update
        //  lastName                The last name name of user to update
        //  email                   The email address of user to update
        public function updateProfile($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
                
                // Optional parameters
                'firstName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'lastName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'email' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'changePassword' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'oldPassword' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'newPassword' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database']) );
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
            $db->query('LOCK TABLE employee_accounts IN EXCLUSIVE MODE;');
            
            // Build the query to update the user
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE employee_accounts SET ';
            
            if( array_key_exists('firstName', $data) && isset($data['firstName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'first_name = $' . $updateCount;
                $updateValues[] = $data['firstName'];
            }
            
            if( array_key_exists('lastName', $data) && isset($data['lastName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'last_name = $' . $updateCount;
                $updateValues[] = $data['lastName'];
            }
            
            if( array_key_exists('email', $data) && isset($data['email']) ) {
                // Check if email address has already been used
                $checkQuery = 'SELECT id FROM employee_accounts WHERE LOWER(email_address) = LOWER($1) AND id != $2;';
                $checkResult = $db->paramQuery($checkQuery, [
                    $data['email'],
                    $user['id']
                ]);
                if( !$checkResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                if( $checkResult->getRowCount() > 0 ) {
                    echo(json_encode(['ok' => false, 'error' => 'The email address is not available']));
                    return false;
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['email'];
            }
            
            // Should the password be updated?
            if( array_key_exists('changePassword', $data) && ($data['changePassword'] === true) ) {
                // Get the old password for the password check
                $checkQuery = 'SELECT password FROM employee_accounts WHERE id = $1';
                $checkResult = $db->paramQuery($checkQuery, [$user['id']]);
                if( !$checkResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                if( $checkResult->getRowCount() < 1 ) {
                    echo(json_encode(['ok' => false, 'error' => 'The user was not found']));
                    return false;
                }
                $checkRow = $checkResult->fetchAssociative();
                $oldPassword = $checkRow['password'];
                
                // Was the old password entered incorrectly?
                if(!password_verify($data['oldPassword'], $oldPassword)) {
                    echo(json_encode(['ok' => false,'error' =>  'Old password was entered incorrectly']));
                    return false;
                }
                
                // Make sure the new password has a value
                if( $data['newPassword'] === '' ) {
                    echo(json_encode(['ok' => false,'error' =>  'New password cannot be empty']));
                    return false;
                }
                
                // Hash the new password
                $newPassword = password_hash($data['newPassword'], PASSWORD_DEFAULT);
                
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'password = $' . $updateCount;
                $updateValues[] = $newPassword;
            }
            
            // Should any values be updated?
            if( $updateCount > 0 ) {
                // Set where clause
                $updateCount++;
                $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
                $updateValues[] = $user['id'];
                
                // Execute the query and return the result
                $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode(['ok' => true]) );
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
            
            $db->query('LOCK TABLE employee_account_reset_passwords IN EXCLUSIVE MODE;');
            
            // Check if a details matches the details entered.
            $sqlQuery =
                'SELECT ' .
                    'id, employee_account_id, email_address ' .
                'FROM ' . 
                    'employee_account_reset_passwords ' .
                'WHERE ' .
                    'LOWER(email_address) = LOWER($1) AND verification_code = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['email'], $data['verificationCode']]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            if( $sqlResult->getRowCount() !== 1 ) {
                echo(json_encode(['ok' => false, 'error' => 'The verification code is invalid.']));
                return false;
            }
            
            // If the verification succeeded, update the password
            $sqlRow = $sqlResult->fetchAssociative();
            $resetId = $sqlRow['id'];
            $employeeAccountId = $sqlRow['employee_account_id'];
            
            $sqlQuery = 'UPDATE employee_accounts SET password = $1 WHERE id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$password, $employeeAccountId]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Delete the verification entry
            $sqlQuery = 'DELETE FROM employee_account_reset_passwords WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$resetId]);
            if( !$sqlResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Invalidate all user sessions
            $sqlQuery = 'UPDATE employee_account_sessions SET lifetime = 0 WHERE employee_account_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeAccountId]);
            if( !$sqlResult->isValid() ) {
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
            
            $db->query('LOCK TABLE employee_account_reset_passwords IN EXCLUSIVE MODE;');
            
            // Make sure the specified user exists.
            $sqlQuery = 'SELECT id, first_name, email_address FROM employee_accounts WHERE LOWER(email_address) = LOWER($1);';
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
            $employeeAccountId = $sqlRow['id'];
            $emailAddress = $sqlRow['email_address'];
            $firstName = $sqlRow['first_name'];
            
            // Delete all previous reset password attempts.
            $sqlQuery = 'DELETE FROM employee_account_reset_passwords WHERE LOWER(email_address) = $1;';
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
                'INSERT INTO employee_account_reset_passwords ' .
                    '(employee_account_id, email_address, verification_code, created_on)' .
                'VALUES ' .
                    '($1, LOWER($2), $3, $4);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeAccountId,
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
        
        // Function to link companies to the employee profile
        //
        // Required Parameters
        //  $data['idNumber']          The email of the user. Required
        public function linkCompanies($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'idNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
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
            
            // Remove all non-numeric characters from the id number
            // $idNumber = preg_replace('/[^0-9]+/', '', $data['idNumber']);
            $idNumber = $data['idNumber'];
            
            // Get the relevant employee profiles
            $sqlProfileQuery = 
                'SELECT ' . 
                    'employee_profiles.id, ' .
                    'employee_profiles.company_id, ' .
                    'companies.alias AS company_name, ' .
                    'employee_profiles.employee_id, ' .
                    'employee_profiles.alias, ' .
                    'employee_profiles.id_number, ' .
                    'employee_profiles.passport_number, ' .
                    'employee_profiles.email_address, ' .
                    'employee_account_employee_profile_access.employee_account_id ' .
                'FROM ' . 
                    'employee_profiles ' . 
                'LEFT JOIN ' . 
                    'companies ON companies.id = employee_profiles.company_id ' . 
                'LEFT JOIN ' . 
                    'employee_account_employee_profile_access ON employee_account_employee_profile_access.employee_profile_id = employee_profiles.id ' . 
                'WHERE ' . 
                    'employee_account_id IS NULL AND (' .
                        'LOWER(REPLACE(passport_number, \' \', \'\')) = LOWER(REPLACE($1, \' \', \'\')) OR ' .
                        'LOWER(REPLACE(id_number, \' \', \'\')) = LOWER(REPLACE($1, \' \', \'\')) ' . 
                    ');';
            $sqlProfileResult = $db->paramQuery($sqlProfileQuery, [$idNumber]);
            if( !$sqlProfileResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // Were no profiles found?
            if( $sqlProfileResult->getRowCount() < 1 ) {
                echo(json_encode([
                    'ok' => false,
                    'error' => 'The specified ID or passport number was not found.'
                ]));
                return false;
            }
            
            // Start an sql transaction
            $db->startTransaction();
            $db->query('LOCK TABLE employee_profile_verification_codes IN EXCLUSIVE MODE;');
            
            // Delete all previous link attempts
            $sqlDeleteQuery = 'DELETE FROM employee_profile_verification_codes WHERE employee_account_id = $1;';
            $sqlDeleteResult = $db->paramQuery($sqlDeleteQuery, [$user['id']]);
            if( !$sqlDeleteResult->isValid() ) {
                echo(json_encode(['ok' => false, 'error' => 'Database error']));
                return false;
            }
            
            // For every profile found
            System::useModule('phpmailer');
            $emailAddresses = [];
            while( $sqlProfileRow = $sqlProfileResult->fetchAssociative() ) {
                // Build random 6 digit number
                $verificationCode = '';
                for( $i = 0; $i < 6; $i++ ) $verificationCode = $verificationCode . strval( rand(0, 9) );
                
                // Insert the new employee profile verification code
                $sqlQuery =
                    'INSERT INTO employee_profile_verification_codes ( ' . 
                        'employee_account_id, employee_profile_id, code ' . 
                    ')' .
                    'VALUES ' .
                        '($1, $2, $3);';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $user['id'],
                    $sqlProfileRow['id'],
                    $verificationCode
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                
                // Skip sending or saving the email if no email address was specified
                if( trim( $sqlProfileRow['email_address'] ) === '' ) {
                    continue;
                }
                
                // Save the email address
                $emailAddresses[] = Util::obfuscateEmail($sqlProfileRow['email_address']);
                
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
                $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/link_profile_verification.html' );
                $mailText = str_replace('$COMPANY_NAME', $sqlProfileRow['company_name'], $mailText);
                $mailText = str_replace('$EMPLOYEE_NAME', $sqlProfileRow['alias'], $mailText);
                $mailText = str_replace('$VERIFICATION_CODE', $verificationCode, $mailText);
                
                //Recipients
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->addAddress($sqlProfileRow['email_address'], '');
                $mail->isHTML(true);                                  // Set email format to HTML
                $mail->Subject = 'Payaccsys Payroll Link Company Request';
                $mail->Body = $mailText;
                
                $mail->send();
            }
            
            // Was no email addresses found?
            if( count($emailAddresses) < 1 ) {
                echo(json_encode(['ok' => false, 'error' => 'No verification code could be sent because no email address was found in the company payroll.']));
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            echo(json_encode(['ok' => true, 'emailAddresses' => $emailAddresses]));
            return true;
        }
        
        // Function to verify if companies should be linked
        //
        // Required Parameters
        //  $data['verification']       An array of verification codes of the user. Required
        public function verifyLinkCompanies($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'verification' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]]
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
            
            // Start the transaction
            $db->startTransaction();
            $db->query('LOCK TABLE employee_account_reset_passwords IN EXCLUSIVE MODE;');
            
            // For each verification code
            $employeeAccountId = null;
            $employeeProfileId = null;
            $numVerified = 0;
            foreach( $data['verification'] AS $verification ) {
                // Check if a details matches the details entered.
                $sqlQuery =
                    'SELECT ' .
                        'id, employee_account_id, employee_profile_id ' .
                    'FROM ' . 
                        'employee_profile_verification_codes ' .
                    'WHERE ' .
                        'employee_account_id = $1 AND code = $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $user['id'], 
                    $verification['code']
                ]);
                if( !$sqlResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo(json_encode(['ok' => false, 'error' => 'The verification code is invalid.']));
                    return false;
                }
                
                // If the verification succeeded, give the user access to the specified profile
                $sqlRow = $sqlResult->fetchAssociative();
                $verificationId = $sqlRow['id'];
                $employeeAccountId = $sqlRow['employee_account_id'];
                $employeeProfileId = $sqlRow['employee_profile_id'];
                
                $sqlQuery = 
                    'INSERT INTO employee_account_employee_profile_access ( ' . 
                        'employee_account_id, employee_profile_id, granted_on, revoked, revoked_on ' . 
                    ')' .
                    'VALUES ( ' . 
                        '$1, $2, $3, $4, $5 ' . 
                    ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $employeeAccountId,     // employee_account_id
                    $employeeProfileId,     // employee_profile_id
                    date('Y-m-d H:i:s'),    // granted_on
                    false,                  // revoked
                    null                    // revoked_on
                ]);
                if( !$sqlResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                
                // Delete the verification entry
                $sqlQuery = 'DELETE FROM employee_profile_verification_codes WHERE id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$verificationId]);
                if( !$sqlResult->isValid() ) {
                    echo(json_encode(['ok' => false, 'error' => 'Database error']));
                    return false;
                }
                
                // Remember how many has been verified
                $numVerified = $numVerified + 1;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            // Was only one profile linked?
            if( $numVerified === 1 ) {
                // Get the company connected to the given profile
                $sqlQuery = 
                    'SELECT '. 
                        'employee_profiles.company_id, ' . 
                        'employee_profiles.employee_id, ' . 
                        'companies.is_active, ' . 
                        'companies.database_name, ' . 
                        'companies.database_schema, ' . 
                        'companies.database_host, ' . 
                        'companies.alias ' . 
                    'FROM ' . 
                        'employee_profiles ' . 
                    'LEFT JOIN ' .
                        'companies ON employee_profiles.company_id = companies.id ' . 
                    'WHERE ' . 
                        'employee_profiles.id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $employeeProfileId
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // If no rows are returned then the employee profile could not be found
                if( $sqlResult->getRowCount() > 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Profile not found.']) );
                    return false;
                }
                // If there is only one company, automatically select it and continue
                else if( $sqlResult->getRowCount() == 1 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $companyId = $sqlRow['company_id'];
                    $employeeId = $sqlRow['employee_id'];
                    
                    // Check that the company is active
                    if( $sqlRow['is_active'] !== true ) {
                        echo( json_encode(['ok' => false, 'error' => 'Company is inactive.']) );
                        return false;
                    }
                    
                    // Cache the database settings
                    $_SESSION['dbCache'] = [
                        'host' => $sqlRow['database_host'],
                        'database' => $sqlRow['database_name'],
                        'schema' => $sqlRow['database_schema']
                    ];
                    
                    // Update user details to reflect changed company
                    $userDetails = system::getUserData();
                    $userDetails['hasProfile'] = true;
                    $userDetails['employeeId'] = $employeeId;
                    $userDetails['companyId'] = $companyId;
                    System::setUserData( $userDetails );
                    
                    // Update company ID of the user's employee_account_sessions entry
                    $refreshToken = Session::getRefreshToken();
                    $sqlQuery = 'UPDATE employee_account_sessions SET company_id = $1 WHERE refresh_token = $2;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$companyId, $refreshToken]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Update user details
            $userDetails = system::getUserData();
            $userDetails['hasProfile'] = true;
            System::setUserData( $userDetails );
            
            echo(json_encode(['ok' => true, 'numLinked' => $numVerified]));
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
    }
?>
