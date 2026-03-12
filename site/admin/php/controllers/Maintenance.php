<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('LeaveUtil.php');
    
    //
    // MAINTENANCE CONTROLLER CLASS
    //
    
    class Maintenance extends Controller {
        
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [
            'runMaintenanceScript'
        ];
        protected $authenticationWhitelist = [
            'runMaintenanceScript'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Default function
        //
        // Takes no parameters
        public function defaultFunction() {
            
        }
        
        // Runs all the maintenance functions
        public function runMaintenanceScript($data, $user, $db) {
            // Check access key.  This key is used to ensure that the function is only executed by authorised hosts
            $providedKey = '';
            
            if( isset($_GET['accessKey']) ) $providedKey = $_GET['accessKey'];
            
            if( $providedKey !== 'MmR9AYu1RnWymheB3IiG0KAyZCfeoUG7' ) {
                echo ( json_encode(['ok' => false, 'error' => 'Access denied']) );
                echo( 'Maintenace Failed: Invalid access key');
                return false;
            }
            
            // Write message to log... starting maintenance
            echo('Starting Maintenance: ' . date('Y-m-d H:i:s') . '');
            
            // Process employee leave
            echo('<br /><br />Processing leave...');
            $this->processLeave($data, $user, $db);
            
            // Send employee birthday notifications
            echo('<br /><br />Sending birthday notifications...');
            $this->sendBirthdayNotifications($data, $user, $db);
            
            // Update employee profiles
            echo('<br /><br />Updating employee profiles...');
            $this->updateEmployeeProfiles($data, $user, $db);
            
            // Write message to log... maintenance completed
            echo('<br /><br />Maintenance Ended: ' . date('Y-m-d H:i:s') . '');
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // A function to process work schedule leave for all companies
        private function processLeave($data, $user, $db) {
            // NOTE:
            //
            // The maintenance functions run late at night, so add one day so that the leave will
            // display correctly for the next day
            $today = date('Y-m-d');
            $today = date('Y-m-d', strtotime($today . ' +1 day'));
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo('<br />processLeave(): Failed to connect to system database.<br />');
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo('<br />processLeave(): Failed to connect to set search path to system.');
                return false;
            }
            
            // Select all companies
            $sqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, ' .
                    'companies.database_schema ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.is_active = true ' . 
                'ORDER BY ' .
                    'companies.database_schema ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo('<br />processLeave(): Failed to get list of companies.');
                return false;
            }
            
            // For every company
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Set the maximum execution time for a loop iteration to 600 seconds
                set_time_limit(600);
                
                // Connect to the system database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo('<br />processLeave(): Failed to connect to system database.<br />');
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $sqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo('<br />processLeave(): Failed to set search path to \'' . $sqlRow['database_schema'] . '\'.');
                    return false;
                }
                
                $startTime = strtotime(date('Y-m-d H:i:s'));
                echo('<br />processLeave(): Calculating leave for  \'' . $sqlRow['database_schema'] . '\' on ' . $today . ' from ' . date('Y-m-d H:i:s'));
                
                // Calculate the leave and get the result
                $leaveResult = \LeaveUtil\processCompanyLeave( $today, $user, $db );
                if( $leaveResult === false ) {
                    echo('<br />processLeave(): Failed to calculate leave for \'' . $sqlRow['database_schema'] . '\' (' . $sqlRow['company_id'] . ') on ' . $today . '.');
                    // return false;
                }
                
                $endTime = strtotime(date('Y-m-d H:i:s'));
                echo(' to ' . date('Y-m-d H:i:s') . ' (' . ($endTime - $startTime) . ' seconds).');
            }
        }
        
        // A function to send birthday notifications for all companies
        private function sendBirthdayNotifications($data, $user, $db) {
            System::useModule('phpmailer');
            
            // NOTE:
            //
            // The maintenance functions run late at night, so add one day
            $today = date('Y-m-d');
            $today = date('Y-m-d', strtotime($today . ' +1 day'));
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo('<br />sendBirthdayNotifications(): Failed to connect to system database.<br />');
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo('<br />sendBirthdayNotifications(): Failed to connect to set search path to system.');
                return false;
            }
            
            // Select all companies
            $sqlQuery =
                'SELECT ' .
                    'companies.id AS company_id, ' .
                    'companies.database_schema ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.is_active = true ' . 
                'ORDER BY ' .
                    'companies.database_schema ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo('<br />sendBirthdayNotifications(): Failed to get list of companies.');
                return false;
            }
            
            // For every company
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Set the maximum execution time for a loop iteration to 600 seconds
                set_time_limit(600);
                
                // Connect to the system database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo('<br />sendBirthdayNotifications(): Failed to connect to system database.<br />');
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $sqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo('<br />sendBirthdayNotifications(): Failed to set search path to \'' . $sqlRow['database_schema'] . '\'.');
                    return false;
                }
                
                // Get the required values from the company config
                $sqlConfigQuery = 'SELECT value FROM config WHERE name = \'send_birthday_notifications\';';
                $sqlConfigResult = $db->paramQuery($sqlConfigQuery, []);
                if( !$sqlConfigResult->isValid() ) {
                    echo('<br />sendBirthdayNotifications(): Failed to get config values.');
                    return false;
                }
                
                // Don't send birthday notifications if not enabled in the config
                if( $sqlConfigResult->getRowCount() !== 1 ) {
                    // Go to the next company
                    continue;
                }
                
                $sqlConfigRow = $sqlConfigResult->fetchAssociative();
                if( strtolower($sqlConfigRow['value']) !== 'yes' ) {
                    // Go to the next company
                    continue;
                }
                
                // Find all employees and whether it's their birthdays
                $sqlBirthdayQuery =
                    'SELECT ' . 
                        'employees.id, ' . 
                        'employees.alias, ' . 
                        'employees.email_address, ' .
                        'DATE_PART(\'day\', employees.date_of_birth) = DATE_PART(\'day\', TO_DATE($1, \'YYYY-MM-DD\')) AND ' .
                        'DATE_PART(\'month\', employees.date_of_birth) = DATE_PART(\'month\', TO_DATE($1, \'YYYY-MM-DD\')) AS is_birthday ' . 
                    'FROM ' . 
                        'employees ' .
                    'WHERE ' .
                        'employment_end_date IS NULL OR ' .
                        'employment_end_date >= TO_DATE($1, \'YYYY-MM-DD\') ' .
                    'ORDER BY ' . 
                        'employees.alias ASC, employees.id ASC;';
                $sqlBirthdayResult = $db->paramQuery($sqlBirthdayQuery, [$today]);
                if( !$sqlBirthdayResult->isValid() ) {
                    echo('<br />sendBirthdayNotifications(): Failed to get list of employees and birthdays.');
                    return false;
                }
                
                // Make a list of all employees who have birthdays in HTML
                $birthdayList = [];
                $employeeList = [];
                $birthdayNames = '';
                while( $sqlBirthdayRow = $sqlBirthdayResult->fetchAssociative() ) {
                    // Make a list of all employees who have birthdays
                    if( $sqlBirthdayRow['is_birthday'] ) {
                        $birthdayList[] = [
                            'id' => $sqlBirthdayRow['id'],
                            'alias' => $sqlBirthdayRow['alias']
                        ];
                        
                        // Add the name of the employee whose birthday it is in HTML
                        if( $birthdayNames === '' ) {
                            $birthdayNames = $birthdayNames . $sqlBirthdayRow['alias'];
                        }
                        else {
                            $birthdayNames = $birthdayNames . '<br />' . $sqlBirthdayRow['alias'];
                        }
                    }
                    
                    // Make a list of all employees
                    $employeeList[] = [
                        'id' => $sqlBirthdayRow['id'],
                        'alias' => $sqlBirthdayRow['alias'],
                        'emailAddress' => $sqlBirthdayRow['email_address']
                    ];
                }
                
                // Were there no birthdays today?
                if( count($birthdayList ) < 1 ) {
                    // Go to the next company
                    continue;
                }
                
                $startTime = strtotime(date('Y-m-d H:i:s'));
                echo('<br />sendBirthdayNotifications(): Sending birthday notifications for  \'' . $sqlRow['database_schema'] . '\' for ' . $today . ' from ' . date('Y-m-d H:i:s'));
                
                // Send the email
                $mail = new PHPMailer\PHPMailer\PHPMailer();
                
                // Set SMPT settings
                $mail->isSMTP();
                $mail->Host = CONF_SMTP_HOST;
                $mail->Port = CONF_SMTP_PORT;
                $mail->charSet = 'UTF-8';
                $mail->SMTPAuth = true;
                $mail->Username = CONF_SMTP_USERNAME;
                $mail->Password = CONF_SMTP_PASSW;
                
                // Create template
                $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/birthday_notification.html' );
                $mailText = str_replace('$BIRTHDAY_DATE', $today, $mailText);
                $mailText = str_replace('$BIRTHDAY_NAMES', $birthdayNames, $mailText);
                
                // Set the email details
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = 'Payaccsys Payroll Birthday Notification';
                $mail->Body = $mailText;
                
                // For every employee who
                $recipientCount = 0;
                foreach( $employeeList AS $employee ) {
                    $isBirthday = false;
                    
                    // Skip th emeployee if no valid email address
                    if( trim($employee['emailAddress']) === '' ) {
                        continue;
                    }
                    
                    // Add the birthday names for this recipient
                    $birthdayNames = '';
                    foreach( $birthdayList AS $birthday ) {
                        // Don't send a birthday notification for the employee's own birthday
                        if( $employee['id'] !== $birthday['id'] ) {
                            // Add the name of the employee whose birthday it is
                            if( $birthdayNames === '' ) {
                                $birthdayNames = $birthdayNames . $birthday['alias'];
                            }
                            else {
                                $birthdayNames = $birthdayNames . '<br />' . $birthday['alias'];
                            }
                        }
                        else {
                            $isBirthday = true;
                        }
                    }
                    
                    // Skip sending the email if there are no birthday names (this will happen if
                    // there is only one employee with a birthday and the current employee being 
                    // processed is that employee)
                    if( $birthdayNames === '' ) {
                        continue;
                    }
                    
                    // Depending on whether it's the employee's birthday
                    if( $isBirthday ) {
                        // Are there emails left to be sent?
                        if( $recipientCount !== 0 ) {
                            // Send the email
                            $mail->send();
                        }
                        
                        // Clear the recipients
                        $mail->clearAddresses();
                        
                        // Reset the email details
                        $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                        $mail->isHTML(true);    // Set email format to HTML
                        $mail->Subject = 'Payaccsys Payroll Birthday Notification';
                        
                        // Set the email body with the birthday names excluding the current employee
                        $birthdayMailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/birthday_notification.html' );
                        $birthdayMailText = str_replace('$BIRTHDAY_DATE', $today, $birthdayMailText);
                        $birthdayMailText = str_replace('$BIRTHDAY_NAMES', $birthdayNames, $birthdayMailText);
                        $mail->Body = $birthdayMailText;
                        
                        // Set the email address and send the email immediately
                        $mail->addAddress($employee['emailAddress'], '');
                        $mail->send();
                        
                        // Clear the recipients
                        $mail->clearAddresses();
                        
                        // Reset the email details
                        $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                        $mail->isHTML(true);    // Set email format to HTML
                        $mail->Subject = 'Payaccsys Payroll Birthday Notification';
                        $mail->Body = $mailText;
                        
                        // Process the next employee
                        continue;
                    }
                    
                    // Add a mail recipient
                    $mail->addAddress($employee['emailAddress'], '');
                    $recipientCount = $recipientCount + 1;
                    
                    // Send a mail for every 10 recipients
                    if( $recipientCount >= 10 ) {
                        // Send the email
                        $mail->send();
                        
                        // Clear the recipients and start recounting
                        $mail->clearAddresses();
                        $recipientCount = 0;
                        
                        // Reset the email details
                        $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                        $mail->isHTML(true);    // Set email format to HTML
                        $mail->Subject = 'Payaccsys Payroll Birthday Notification';
                        $mail->Body = $mailText;
                    }
                }
                
                // Are there emails left to be sent?
                if( $recipientCount !== 0 ) {
                    // Send the email
                    $mail->send();
                }
                
                $endTime = strtotime(date('Y-m-d H:i:s'));
                echo(' to ' . date('Y-m-d H:i:s') . ' (' . ($endTime - $startTime) . ' seconds).');
            }
        }
        
        // A function to update employee profiles
        private function updateEmployeeProfiles($data, $user, $db) {
            // NOTE:
            //
            // The maintenance functions run late at night, so add one day
            $today = date('Y-m-d');
            $today = date('Y-m-d', strtotime($today . ' +1 day'));
            
            // Connect to the database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo('<br />updateEmployeeProfiles(): Failed to connect to system database.<br />');
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo('<br />updateEmployeeProfiles(): Failed to connect to set search path to system.');
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
                echo('<br />updateEmployeeProfiles(): Failed to get list of companies.');
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
                    echo('<br />updateEmployeeProfiles(): Failed to connect to system database.<br />');
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $companySqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo('<br />processLeupdateEmployeeProfilesave(): Failed to set search path to \'' . $companySqlRow['database_schema'] . '\'.');
                    return false;
                }
                
                $startTime = strtotime(date('Y-m-d H:i:s'));
                echo('<br />updateEmployeeProfiles(): Updating employee profiles for  \'' . $companySqlRow['database_schema'] . '\' on ' . $today . ' from ' . date('Y-m-d H:i:s'));
                
                // Get all the employees for the specified company
                $employeeSqlQuery =
                    'SELECT ' .
                        'employees.id AS employee_id, ' .
                        'employees.alias, ' .
                        'employees.id_number, ' .
                        'employees.passport_number, ' .
                        'employees.email_address ' .
                    'FROM ' .
                        'employees ' .
                    'ORDER BY ' .
                        'employees.id ASC;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, []);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeProfiles(): Failed to get list of employees.');
                    return false;
                }
                
                // Connect to the database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo('<br />updateEmployeeProfiles(): Failed to connect to system database.<br />');
                    return false;
                }
                
                // Set search path to system
                $sqlResult = $db->paramQuery('SET search_path TO system;', []);
                if( !$sqlResult->isValid() ) {
                    echo('<br />updateEmployeeProfiles(): Failed to connect to set search path to system.');
                    return false;
                }
                
                // For every employee
                while( $employeeSqlRow = $employeeSqlResult->fetchAssociative() ) {
                    // Get the details of the employee in the company profile
                    $profileSqlQuery =
                        'SELECT ' .
                            'employee_profiles.company_id, ' .
                            'employee_profiles.employee_id, ' .
                            'employee_profiles.alias, ' .
                            'employee_profiles.id_number, ' .
                            'employee_profiles.passport_number, ' .
                            'employee_profiles.email_address ' .
                        'FROM ' .
                            'employee_profiles ' .
                        'WHERE ' .
                            'employee_profiles.company_id = $1 AND ' . 
                            'employee_profiles.employee_id = $2;';
                    $profileSqlResult = $db->paramQuery($profileSqlQuery, [
                        $companySqlRow['company_id'],
                        $employeeSqlRow['employee_id']
                    ]);
                    if( !$profileSqlResult->isValid() ) {
                        echo('<br />updateEmployeeProfiles(): Failed to get the employee profile.');
                        return false;
                    }
                    
                    // Was the employee profile found?
                    if( $profileSqlResult->getRowCount() > 0 ) {
                        // Get the profile details
                        $profileSqlRow = $profileSqlResult->fetchAssociative();
                        
                        // Has the profile changed?
                        if( ($profileSqlRow['alias'] !== $employeeSqlRow['alias']) ||
                            ($profileSqlRow['id_number'] !== $employeeSqlRow['id_number']) ||
                            ($profileSqlRow['passport_number'] !== $employeeSqlRow['passport_number']) ||
                            ($profileSqlRow['email_address'] !== $employeeSqlRow['email_address']) ) {
                            // Update the employee profile with the new information
                            $profileUpdateSqlQuery =
                                'UPDATE employee_profiles SET ' .
                                    'alias = $1, ' .
                                    'id_number = $2, ' .
                                    'passport_number = $3, ' .
                                    'email_address = $4 ' .
                                'WHERE ' .
                                    'company_id = $5 AND ' . 
                                    'employee_id = $6;';
                            $profileUpdateSqlResult = $db->paramQuery($profileUpdateSqlQuery, [
                                $employeeSqlRow['alias'],
                                $employeeSqlRow['id_number'],
                                $employeeSqlRow['passport_number'],
                                $employeeSqlRow['email_address'],
                                $companySqlRow['company_id'],
                                $employeeSqlRow['employee_id']
                            ]);
                            if( !$profileUpdateSqlResult->isValid() ) {
                                echo('<br />updateEmployeeProfiles(): Unable to update employee profile.');
                                return false;
                            }
                        }
                    }
                    else {
                        // Add the employee profile
                        $profileInsertSqlQuery =
                            'INSERT INTO employee_profiles ( ' .
                                'company_id, ' . 
                                'employee_id, ' .
                                'alias, ' .
                                'id_number, ' .
                                'passport_number, ' .
                                'email_address ' .
                            ') ' .
                            'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6 ' . 
                            ');';
                        $profileInsertSqlResult = $db->paramQuery($profileInsertSqlQuery, [
                            $companySqlRow['company_id'],
                            $employeeSqlRow['employee_id'],
                            $employeeSqlRow['alias'],
                            $employeeSqlRow['id_number'],
                            $employeeSqlRow['passport_number'],
                            $employeeSqlRow['email_address']
                        ]);
                        if( !$profileInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeProfiles(): Unable to insert employee profile.');
                            return false;
                        }
                    }
                }
                
                $endTime = strtotime(date('Y-m-d H:i:s'));
                echo(' to ' . date('Y-m-d H:i:s') . ' (' . ($endTime - $startTime) . ' seconds).');
            }
        }

        // A function to update employee profiles
        private function updateEmployeeDismissalCodes($data, $user, $db) {
            // NOTE:
            //
            // The maintenance functions run late at night, so add one day
            $today = date('Y-m-d');
            $today = date('Y-m-d', strtotime($today . ' +1 day'));
            
            // Connect to the database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo('<br />updateEmployeeDismissalCodes(): Failed to connect to system database.<br />');
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo('<br />updateEmployeeDismissalCodes(): Failed to connect to set search path to system.');
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
                echo('<br />updateEmployeeDismissalCodes(): Failed to get list of companies.');
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
                    echo('<br />updateEmployeeDismissalCodes(): Failed to connect to system database.<br />');
                    return false;
                }
                
                // Set our search path to the relevant company
                $searchPathSqlResult = $db->paramQuery('SET search_path TO ' . $companySqlRow['database_schema'] . ';', []);
                if( !$searchPathSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to set search path to \'' . $companySqlRow['database_schema'] . '\'.');
                    return false;
                }
                
                $startTime = strtotime(date('Y-m-d H:i:s'));
                echo('<br />updateEmployeeDismissalCodes(): Updating employee dismissal codes for  \'' . $companySqlRow['database_schema'] . '\' on ' . $today . ' from ' . date('Y-m-d H:i:s'));
                
                // Check if dismissal code MATE (Maternity) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['MATE']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code MATE exists.');
                    // return false;
                } else {
                    // Was the MATE dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'MATE',
                            'Maternity'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code MATE.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code RETI (Retired) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['RETI']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code RETI exists.');
                    // return false;
                } else {
                    // Was the RETI dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'RETI',
                            'Retired'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code RETI.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code DOME (Death of Domestic Employer) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['DOME']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code DOME exists.');
                    // return false;
                } else {
                    // Was the DOME dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'DOME',
                            'Death of Domestic Employer'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code DOME.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code VOLU (Voluntary severance package) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['VOLU']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code VOLU exists.');
                    // return false;
                } else {
                    // Was the VOLU dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'VOLU',
                            'Voluntary severance package'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code VOLU.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code REDU (Reduced work time) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['REDU']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code REDU exists.');
                    // return false;
                } else {
                    // Was the REDU dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'REDU',
                            'Reduced work time'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code REDU.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code COMM (Commissioning Parental) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['COMM']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code COMM exists.');
                    // return false;
                } else {
                    // Was the COMM dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'COMM',
                            'Commissioning Parental'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code COMM.');
                            // return false;
                        }
                    }
                }                

                // Check if dismissal code PARE (Parental Leave) exists
                $employeeSqlQuery =
                    'SELECT ' .
                        'employee_dismissal_reasons.code ' .
                    'FROM ' .
                        'employee_dismissal_reasons ' .
                    'WHERE ' .
                        'employee_dismissal_reasons.code = $1;';
                $employeeSqlResult = $db->paramQuery($employeeSqlQuery, ['PARE']);
                if( !$employeeSqlResult->isValid() ) {
                    echo('<br />updateEmployeeDismissalCodes(): Failed to check if dismissal code PARE exists.');
                    // return false;
                } else {
                    // Was the PARE dismissal code found?
                    if( $employeeSqlResult->getRowCount() <= 0 ) {
                        // Add the employee profile
                        $codeInsertSqlQuery =
                        'INSERT INTO employee_dismissal_reasons ( ' .
                            'code, ' . 
                            'name ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2 ' . 
                        ');';
                        $codeInsertSqlResult = $db->paramQuery($codeInsertSqlQuery, [
                            'PARE',
                            'Parental Leave'
                        ]);
                        if( !$codeInsertSqlResult->isValid() ) {
                            echo('<br />updateEmployeeDismissalCodes(): Unable to insert employee dismissal code PARE.');
                            // return false;
                        }
                    }
                }                
                
                $endTime = strtotime(date('Y-m-d H:i:s'));
                echo(' to ' . date('Y-m-d H:i:s') . ' (' . ($endTime - $startTime) . ' seconds).');
            }
        }
    }
