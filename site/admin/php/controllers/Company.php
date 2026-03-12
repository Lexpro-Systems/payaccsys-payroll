<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    
    
    //
    // BOOKSET CONTROLLER CLASS
    //
    
    class Company extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list company companies
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
                'companyName' => '',
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
                'companyName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limitGroups' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'isEnabled' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isTrial' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
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
                        'WHERE companies.id IN ( ' . 
                            'SELECT DISTINCT ' . 
                                'admin_group_companies.company_id ' . 
                            'FROM ' . 
                                'admin_group_companies ' . 
                            'LEFT JOIN ' . 
                                'admin_groups ON admin_groups.id = admin_group_companies.admin_group_id ' . 
                            'LEFT JOIN ' . 
                                'admin_group_users ON admin_group_users.admin_group_id = admin_groups.id ' . 
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
                $whereClause = $whereClause . ' (companies.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.contact_person ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.contact_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.contact_email ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.database_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.database_schema ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (companies.database_host ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (users.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (consultants.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ' ) ';
            }
            
            // Add a filter for is enabled
            if( isset($data['isEnabled']) && ($data['isEnabled'] !== null) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['isEnabled'];
                $whereClause = $whereClause . ' companies.is_active = $'. count($sqlParams) . ' ';
            }
            
            // Was a trial filter specified?
            if( isset($data['isTrial']) && ($data['isTrial'] !== null) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                // Should only companies currently on trial be returned
                if( $data['isTrial'] ) {
                    $whereClause = $whereClause . ' (';
                    $whereClause = $whereClause . ' companies.is_trial = TRUE AND ';
                    $whereClause = $whereClause . ' companies.trial_expires_on >= NOW() ';
                    $whereClause = $whereClause . ') ';
                }
                else {
                    $whereClause = $whereClause . ' (';
                    $whereClause = $whereClause . ' companies.is_trial = TRUE AND ';
                    $whereClause = $whereClause . ' companies.trial_expires_on < NOW() ';
                    $whereClause = $whereClause . ') ';
                }
            }
            
            // // Check that sort order given is valid
            // if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
            //     echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
            //     return false;
            // }
            
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
                        case 'companyAlias':
                            $column = 'companies.alias';
                            break;
                        case 'companyName':
                            $column = 'companies.name';
                            break;
                        case 'contactPerson':
                            $column = 'companies.contact_person';
                            break;
                        case 'contactNumber':
                            $column = 'companies.contact_number';
                            break;
                        case 'contactEmail':
                            $column = 'companies.contact_email';
                            break;
                        case 'consultantName':
                            $column = 'consultants.name';
                            break;
                        case 'isEnabled':
                            $column = 'companies.is_active';
                            break;
                        // case 'totalPayruns':
                        //     $column = 'company_payrun_statistics.total_payruns';
                        //     break;
                        // case 'lastPayrun':
                        //     $column = 'COALESCE(company_payrun_statistics.last_payrun, \'1900-01-01\')';
                        //     break;
                        case 'trialExpiresOn':
                            $column = 'companies.trial_expires_on';
                            break;
                        case 'createdOn':
                            $column = 'companies.created_on';
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
            
            // Load all companies from the companies table
            $sqlQuery = 
                'SELECT ' .
                    'companies.id, ' .
                    'companies.name, ' .
                    'companies.alias, ' .
                    'companies.contact_person, ' .
                    'companies.contact_number, ' .
                    'companies.contact_email, ' .
                    'companies.database_name, ' .
                    'companies.database_schema, ' .
                    'companies.database_host, ' .
                    'companies.is_active, ' .
                    'companies.employee_limit, ' .
                    'companies.is_trial, ' .
                    'companies.trial_starts_on, ' .
                    'companies.trial_expires_on, ' .
                    'companies.trial_updated_on, ' .
                    'companies.trial_updated_by_user_id, ' .
                    'companies.is_setup_complete, ' .
                    'companies.owner_user_id, ' .
                    'users.name AS owner_user_name, ' .
                    'companies.consultant_id, ' .
                    'consultants.name AS consultant_name, ' .
                    'companies.created_on ' .
                'FROM ' .
                    'companies ' .
                'LEFT JOIN ' .
                    'users ON users.id = companies.owner_user_id ' .
                'LEFT JOIN ' .
                    'consultants ON consultants.id = companies.consultant_id ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'companies.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
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
                    'contactPerson' => $sqlRow['contact_person'],
                    'contactNumber' => $sqlRow['contact_number'],
                    'contactEmail' => $sqlRow['contact_email'],
                    'databaseName' => $sqlRow['database_name'],
                    'databaseSchema' => $sqlRow['database_schema'],
                    'databaseHost' => $sqlRow['database_host'],
                    'isActive' => $sqlRow['is_active'],
                    'employeeLimit' => $sqlRow['employee_limit'],
                    'isTrail' => $sqlRow['is_trial'],
                    'trailStartsOn' => $sqlRow['trial_starts_on'],
                    'trialExpiresOn' => $sqlRow['trial_expires_on'],
                    'isSetupComplete' => $sqlRow['is_setup_complete'],
                    'ownerUserId' => $sqlRow['owner_user_id'],
                    'ownerUserName' => $sqlRow['owner_user_name'],
                    'consultantId' => $sqlRow['consultant_id'],
                    'consultantName' => $sqlRow['consultant_name'],
                    'createdOn' => $sqlRow['created_on']
                ];
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'companies' => $companies ]) );
            return true;
        }
        
        // Function to add a company
        //
        // Required Parameters
        //  companyName                     The name of the company for which to add a company
        //  companyAlias                    The alias of the company for which to add a company
        //  companyContactPerson            The company contact person
        //  companyContactNumber            The company contact number
        //  companyContactEmail             The company contact email adress
        //  payeCalculationTypeCode         The PAYE calculation method ('PERI' for periodic, 'AVER' for tax averaging)
        //  payeBonusCalculationTypeCode    The PAYE bonus calculation method ('STAN' for standard, 'ACCU' for accurate)
        //  companyIsActive                 Whether the company is active (true / false)
        //  employeeLimit                   The amximum number of employees allowed in the company (null = unlimited)
        //  employeeCodeMask                The mask specified for employee codes
        //  isTrial                         Whether the company is a trial (true /f alse)
        //  trialStartsOn                   The date on which the trial starts
        //  trialExpiresOn                  The date on which the trial expires
        //  ownerId                         The id of the user who is the owner of the company
        //  ownerName                       The name of the owner
        //  ownerEmailAddress               The email address of the owner
        //  ownerCellNumber                 The cell number of the owner
        //  databaseSchema                  The name of the database schema to create
        //  databaseName                    The database name, if any
        //  databaseHost                    The database host, if any
        //  databasePort                    The database port, if any
        //  annualLeave                     Whether annual leave should be setup (true / false)
        //  sickLeave                       Whether sick leave should be setup (true / false)
        //  familyResponsibilityLeave       Whether family responsibility leave should be setup (true / false)
        //  maternityLeave                  Whether maternity leave should be setup (true / false)
        //  consultantId                    The consulatnt linked to the company (if any)
        //  groups                          A list of admin group ids that have access to the company
        //                                      groups :[
        //                                          'id' =>  // admin group id
        //                                      ]
        
        //
        // Optional Parameters
        // None
        public function add($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'companyName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'companyAlias' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'companyContactPerson' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'companyContactNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'companyContactEmail' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'payeCalculationTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'payeBonusCalculationTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'companyIsActive' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'employeeLimit' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'employeeCodeMask' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'isTrial' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'trialStartsOn' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'trialExpiresOn' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'ownerId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'ownerName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'ownerEmailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'ownerCellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'databaseSchema' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'databaseServerId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'hourlyLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'dailyLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'monthlyLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'annualLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'sickLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'familyResponsibilityLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'maternityLeave' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'consultantId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'groups' => ['type' => JSON::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]],
                
                // Optional parameters
                'physicalAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Make certain there isn't already a company with the specified name
            $sqlQuery = 'SELECT id FROM companies WHERE name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['companyName']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() >= 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'A company with the name \'' . $data['companyName'] . '\' already exists.']) );
                return false;
            }
            
            // Check that the schema name starts with an alphabetic character, contains only alpha numeric
            // lowercase characters, and is not longer than 24 characters
            if ( !preg_match('/^[a-z][a-z0-9_]{1,23}$/', $data['databaseSchema']) ) {
                echo( json_encode(['ok' => false, 'error' => 'The database schema must start with a lowercase alphabetic character, may not contain spaces, and cannot be longer than 24 characters.']) );
                return false;
            }
            
            // Make certain there isn't already a user with the specified name
            if( $data['ownerId'] == null ) {
                $sqlQuery = 'SELECT id FROM users WHERE email_address = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['ownerEmailAddress']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'A user with the email address \'' . $data['ownerEmailAddress'] . '\' already exists.']) );
                    return false;
                }
            }
            
            // Check that the schema name does not contain the word 'public'
            if(strpos($data['databaseSchema'], 'public') !== false){
                echo( json_encode(['ok' => false, 'error' => 'The database schema may not contain the word \'public\'.']) );
                return false;
            }
            
            // Get the database details, depending on the selected server
            $sqlQuery = 'SELECT database_name, database_host FROM sql_servers WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['databaseServerId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $databaseName = $sqlRow['database_name'];
            $databaseHost = $sqlRow['database_host'];
            
            // Set default value for database port, if none specified
            $databasePort = CONF_DB_PORT;
            
            // Set default value for database user, if none specified
            $databaseUser = CONF_DB_USER;
            
            // Set default value for database password, if none specified
            $databasePassword = CONF_DB_PASSWORD;
            
            // Try to connect to the database to see if it exists
            $dbConnected = $db->connect(
                "host='" . $databaseHost . "' port='" . $databasePort . "' dbname='" . $databaseName .
                "' user='" . $databaseUser . "' password='" . $databasePassword . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to \'' . $databaseName . '\' database.']) );
                return false;
            }
            
            // Check if the schema exists
            $sqlQuery = 'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['databaseSchema']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() > 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'A company with the schema \'' . $data['databaseSchema'] . '\' already exists.']) );
                return false;
            }
            
            // NOTE:
            //
            // The following queries are open to SQL injection. They should ideally be run as parametized
            // queries but that doesn't seem to work :-(
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Create the new schema
            $databaseSchema = $data['databaseSchema'];
            $sqlResult = $db->paramQuery('CREATE SCHEMA IF NOT EXISTS ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set our search path to schema
            $sqlResult = $db->paramQuery('SET search_path TO ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the directories where the sql queries are stored for creating the company
            $sqlDirs = array_filter(glob(CONF_SQL_DIR . '*' , GLOB_ONLYDIR), 'is_dir');
            sort($sqlDirs);
            
            // For every SQL directory
            foreach( $sqlDirs AS $sqlDir ) {
                // Get a list of all the files in the folder
                $fileList = scandir($sqlDir);
                
                if( $fileList === false ) {
                    echo( json_encode(['ok' => false, 'error' => 'Unable to open the SQL directory specified in the configuration.']) );
                    return false;
                }
                
                // For every file in the list (excluding '.' and '..')
                for( $i = 2; $i < (count($fileList)); $i++ ) {
                    // Skip file if not an sql file
                    if( substr( $fileList[$i], -4) != '.sql') continue;
                    
                    // Get file size
                    $fileSize = filesize( $sqlDir . '/' . $fileList[$i] );
                    
                    // Check for BOM
                    $bomOffset = 0;
                    if( $fileSize >= 3 ) {
                        $fp = fopen($sqlDir . '/' . $fileList[$i], 'rb');
                        $fileData = bin2hex ( fread($fp, 3) );
                        fclose( $fp );
                        
                        if( strtolower($fileData) === 'efbbbf' ) $bomOffset = 3;
                    }
                    
                    // Get the contents of the sql file
                    $sqlQuery = file_get_contents($sqlDir . '/' . $fileList[$i], false, NULL, $bomOffset);
                    
                    // Run the specified query
                    $sqlResult = $db->query($sqlQuery);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Update the employee code mask
            $sqlQuery = 'UPDATE config SET value = $1 WHERE name = \'employee_code_mask\';';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['employeeCodeMask']   // value
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Should hourly leave be setup?
            if( $data['hourlyLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Hourly Leave',     // name
                    'HOUR',             // leave_unit_code
                    false               // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(  $1, $2, $3, $4, $5, $6, $7 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,   // leave_type_id
                    1,              // start_month
                    17,             // accrual_interval
                    'HWOR',         // leave_accrual_type_code
                    1,              // amount
                    false,          // reset_accrued
                    false           // reset_taken
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should daily leave be setup?
            if( $data['dailyLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Daily Leave',      // name
                    'DAYS',             // leave_unit_code
                    false               // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(  $1, $2, $3, $4, $5, $6, $7 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,   // leave_type_id
                    1,              // start_month
                    17,             // accrual_interval
                    'DWOR',         // leave_accrual_type_code
                    1,              // amount
                    false,          // reset_accrued
                    false           // reset_taken
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should monthly leave be setup?
            if( $data['monthlyLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Monthly Leave',    // name
                    'DAYS',             // leave_unit_code
                    false               // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(  $1, $2, $3, $4, $5, $6, $7 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,   // leave_type_id
                    1,              // start_month
                    1,              // accrual_interval
                    'MCEN',         // leave_accrual_type_code
                    1.25,           // amount
                    false,          // reset_accrued
                    false           // reset_taken
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should annual leave be setup?
            if( $data['annualLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Annual Leave',     // name
                    'DAYS',             // leave_unit_code
                    false               // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(  $1, $2, $3, $4, $5, $6, $7 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,   // leave_type_id
                    1,              // start_month
                    1,              // accrual_interval
                    'YCST',         // leave_accrual_type_code
                    15,             // amount
                    false,          // reset_accrued
                    false           // reset_taken
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should sick leave be setup?
            if( $data['sickLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Sick Leave',   // name
                    'DAYS',         // leave_unit_code
                    false           // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(   $1,  $2,  $3,  $4,  $5,  $6,  $7 ), ' .
                        '(   $8,  $9, $10, $11, $12, $13, $14 ), ' .
                        '(  $15, $16, $17, $18, $19, $20, $21 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,  1, 26, 'DWOR',  1, false, false,
                    $leaveTypeId,  7,  3, 'YCST', 30, true, false,
                    $leaveTypeId, 37,  3, 'YCST', 30, true, true
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should family responsibility leave be setup?
            if( $data['familyResponsibilityLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 ) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Family Responsibility Leave',  // name
                    'DAYS',                         // leave_unit_code
                    false                           // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveTypeId = $sqlRow['id'];
                
                // Insert the leave type rule(s)
                $sqlQuery =
                    'INSERT INTO leave_type_rules ( ' .
                        'leave_type_id, ' .
                        'start_month, ' .
                        'accrual_interval, ' .
                        'leave_accrual_type_code, ' .
                        'amount, ' .
                        'reset_accrued, ' .
                        'reset_taken ' .
                    ') ' .
                    'VALUES ' .
                        '(  $1, $2, $3, $4, $5, $6, $7 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveTypeId,   // leave_type_id
                    1,              // start_month
                    1,              // accrual_interval
                    'YCST',         // leave_accrual_type_code
                    3,              // amount
                    true,           // reset_accrued
                    true            // reset_taken
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Should maternity leave be setup?
            if( $data['maternityLeave'] ) {
                // Insert the leave type
                $sqlQuery =
                    'INSERT INTO leave_types ( name, leave_unit_code, is_deleted ) ' .
                    'VALUES (  $1, $2, $3 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    'Maternity Leave',  // name
                    'DAYS',             // leave_unit_code
                    false               // is_deleted
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Add a directory for the company and store it in the config
            if( file_exists(CONF_CLIENT_DIR) && is_dir(CONF_CLIENT_DIR) ) {
                $clientDataDir = $databaseSchema . '_' . Security::generateRandomString(6);
                while( file_exists(CONF_CLIENT_DIR . $clientDataDir) ) $clientDataDir = $databaseSchema . '_' . Security::generateRandomString(6);
                mkdir( CONF_CLIENT_DIR . $clientDataDir );
                $sqlResult = $db->paramQuery('UPDATE config SET value = $1 WHERE name = \'client_data_dir\'', [$clientDataDir]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
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
            
            // Set the owner user's id
            $ownerId = $data['ownerId'];
            $isNewOnwer = false;
            
            // Should a new user be created for the owner?
            if( $ownerId == null ) {
                // Add the new user as the owner
                $sqlQuery =
                    'INSERT INTO ' .
                        'users (name, email_address, password, cell_number, is_admin, is_active, last_login, created_on) ' .
                    'VALUES ' .
                        '($1, $2, $3, $4, $5, $6, $7, $8) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['ownerName'],             // name
                    $data['ownerEmailAddress'],     // email_address
                    '',                             // password
                    $data['ownerCellNumber'],       // cell_number
                    false,                          // is_admin
                    true,                           // is_active
                    null,                           // last_login
                    date('Y-m-d H:i:s')             // created_on
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                $ownerId = $sqlRow['id'];
                $isNewOnwer = true;
            }
            
            // Add an entry into the companies table
            $sqlQuery =
                'INSERT INTO ' .
                    'companies ( ' .
                        'name, ' .
                        'alias, ' .
                        'contact_person, ' .
                        'contact_number, ' .
                        'contact_email, ' .
                        'database_name, ' .
                        'database_schema, ' .
                        'database_host, ' .
                        'employee_limit, ' .
                        'is_trial, ' .
                        'trial_starts_on, ' .
                        'trial_expires_on, ' .
                        'is_setup_complete, ' .
                        'is_active, ' .
                        'owner_user_id, ' .
                        'created_on, ' .
                        'consultant_id ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' . 
                        '$11, $12, $13, $14, $15, $16, $17 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['companyName'],           // name
                $data['companyAlias'],          // alias
                $data['companyContactPerson'],  // contact_person
                $data['companyContactNumber'],  // contact_number
                $data['companyContactEmail'],   // contact_email
                $databaseName,                  // database_name
                $databaseSchema,                // database_schema
                $databaseHost,                  // database_host
                $data['employeeLimit'],         // employee_limit
                $data['isTrial'],               // is_trial
                $data['trialStartsOn'],         // trial_starts_on
                $data['trialExpiresOn'],        // trial_expires_on
                false,                          // is_setup_complete
                $data['companyIsActive'],       // is_active
                $ownerId,                       // owner_user_id
                date('Y-m-d H:i:s'),            // created_on
                $data['consultantId']           // consultant_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $companyId = $sqlRow['id'];
            
            // Set up user access for the company owner
            $sqlQuery = 
                'INSERT INTO ' . 
                    'user_company_access (' .
                        'user_id, ' .
                        'company_id, ' .
                        'is_default, ' .
                        'granted_on, ' .
                        'granted_by_user_id, ' .
                        'revoked, ' .
                        'revoked_on ' .
                    ') '. 
                'VALUES ' . 
                    '($1, $2, $3, $4, $5, $6, $7);';
            $sqlResult= $db->paramQuery($sqlQuery, [
                $ownerId,               // user_id,
                $companyId,             // company_id
                false,                  // is_default
                date('Y-m-d H:i:s'),    // granted_on
                $user['id'],            // granted_by_user_id
                false,                  // revoked
                null                    // revoked_on
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the user company access rights for the company owner
            $sqlQuery = 
                'INSERT INTO ' . 
                    'user_company_rights (user_id, company_id, user_right_code ) '. 
                'VALUES ' . 
                    '($1, $2, $3), ' .
                    '($4, $5, $6);';
            $sqlResult= $db->paramQuery($sqlQuery, [
                $ownerId,       // user_id,
                $companyId,     // company_id
                'APPO',         // user_right_code
                $ownerId,       // user_id,
                $companyId,     // company_id
                'AAPO'          // user_right_code
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the admin group access for the company
            foreach( $data['groups'] as $group ) {
                $sqlQuery = 
                    'INSERT INTO ' . 
                        'admin_group_companies (admin_group_id, company_id) '. 
                    'VALUES ' . 
                        '($1, $2);';
                $sqlResult= $db->paramQuery($sqlQuery, [
                    $group['id'],   // admin_group_id,
                    $companyId      // company_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            // Send an invitation to the new owner, if any
            if( $isNewOnwer ) {
                // Generate a secure random code for the invitation
                $code = Security::generateRandomString(64);
                
                // Start SQL transaction
                $db->startTransaction();
                
                // Lock the relevant table(s)
                $db->query('LOCK TABLE user_company_access IN EXCLUSIVE MODE;');
                $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            
                // Add an invitation for the user
                $sqlQuery =
                    'INSERT INTO ' .
                        'user_company_invitations (code, company_id, invitee_name, invitee_email_address, sent_by_user_id, sent_on, expires_on, status_code) ' .
                    'VALUES ' .
                        '($1, $2, $3, $4, $5, $6, $7, $8) ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $code,                                  // code
                    $companyId,                             // company_id
                    $data['ownerName'],                     // invitee_name
                    $data['ownerEmailAddress'],             // invitee_email_address
                    $user['id'],                            // sent_by_user_id
                    date('Y-m-d H:i:s'),                    // sent_on
                    date('Y-m-d H:i:s', time() + 604800),   // expires_on
                    'PEND'                                  // status code
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                $userCompanyInvitationId = $sqlRow['id']; 
                
                // Add the relevant rights
                $insertCount = 0;
                $insertValues = [];
                $sqlQuery = 'INSERT INTO user_company_invitation_rights(user_company_invitation_id, user_right_code) VALUES ';
                
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId ;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                $insertCount++;
                $insertValues[] = 'AAPO';
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
                
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                $insertCount++;
                $insertValues[] = 'APPO';
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
                
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
                
                // Load company and consultant details from database
                $companyName = '';
                $consultantName = '';
                $sqlQuery = 
                    'SELECT ' .
                        'companies.name AS company_name, ' .
                        'consultants.name AS consultant_name ' .
                    'FROM ' .
                        'companies ' .
                    'LEFT JOIN ' .
                        'consultants ON consultants.id = companies.consultant_id ' .
                    'WHERE ' .
                        'companies.id = $1';
                $sqlResult = $db->paramQuery($sqlQuery, [$companyId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlRow = $sqlResult->fetchAssociative() ) {
                    $companyName = $sqlRow['company_name'];
                    $consultantName = $sqlRow['consultant_name'];
                }
                
                System::useModule('phpmailer');
                
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
                
                // Set sender name
                $senderName = $user['name'];
                if( $consultantName != null ) {
                    $senderName = $consultantName;
                }
                
                // Load the template to send
                $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/user_company_invitation.html' );
                $mailText = str_replace('$SENDER_NAME', $senderName, $mailText);
                $mailText = str_replace('$RECIPIENT_NAME', $data['ownerName'], $mailText);
                $mailText = str_replace('$COMPANY_NAME', $companyName, $mailText);
                $mailText = str_replace('$INVITATION_LINK', CONF_CLIENT_URL . '/index.html?invitation=' . $code, $mailText);
                
                //Recipients
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys');
                $mail->addAddress($data['ownerEmailAddress'], '');
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = 'Payaccsys Payroll: Invitation to join ' . $companyName;
                $mail->Body    = $mailText;
                $mail->AltBody = $mailText;
                
                $mail->send();
            }
            
            // Get the company schema name
            $sqlQuery = 
                'SELECT ' .
                    'companies.database_schema ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the company was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Set the company details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $databaseSchema = $sqlRow['database_schema'];
            
            $dbConnected = $db->connect(
                "host='" . $databaseHost . "' port='" . $databasePort . "' dbname='" . $databaseName .
                "' user='" . $databaseUser . "' password='" . $databasePassword . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to \'' . $databaseName . '\' database.']) );
                return false;
            }
            
            $sqlQuery = 'SET search_path TO ' . $databaseSchema;
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlQuery =
                'INSERT INTO company_details( ' .
                    'name, ' . 
                    'alias, ' . 
                    'registration_number, ' . 
                    'physical_address_unit, ' . 
                    'physical_address_complex, ' .
                    'physical_address_street, ' . 
                    'physical_address_suburb, ' . 
                    'physical_address_city, ' .
                    'physical_address_postal_code, ' . 
                    'physical_address_country_code, ' . 
                    'postal_address_line_1, ' .
                    'postal_address_line_2, ' . 
                    'postal_address_line_3, ' . 
                    'postal_address_code, ' . 
                    'tel_number, ' .
                    'fax_number, ' . 
                    'email_address, ' . 
                    'paye_reference_number, ' . 
                    'sdl_payment_reference_number, ' .
                    'uif_payment_reference_number, ' . 
                    'uif_registration_number, ' . 
                    'sic_code, ' . 
                    'eti_status_code, ' .
                    'special_economic_zone_code, ' . 
                    'diplomatic_indemnity, ' . 
                    'sars_contact_first_name, ' . 
                    'sars_contact_last_name, ' .
                    'sars_contact_email_address, ' . 
                    'sars_contact_business_number, ' . 
                    'sars_contact_cell_number, ' .
                    'uif_contact_person, ' . 
                    'uif_contact_email_address, ' . 
                    'uif_contact_number, ' . 
                    'paye_calculation_type_code, ' .
                    'paye_bonus_calculation_type_code ' .
                ') ' .
                'VALUES ( ' .
                        ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' . 
                        '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' .
                        '$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, ' . 
                        '$31, $32, $33, $34, $35 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['companyName'],                                  // name
                $data['companyAlias'],                                 // alias
                '',                                                    // registration_number
                $data['physicalAddressUnit'],                          // physical_address_unit
                $data['physicalAddressComplex'],                       // physical_address_complex
                $data['physicalAddressStreet'],                        // physical_address_street
                $data['physicalAddressSuburb'],                        // physical_address_suburb
                $data['physicalAddressCity'],                          // physical_address_city
                $data['physicalAddressPostalCode'],                    // physical_address_postal_code
                $data['physicalAddressCountryCode'],                   // physical_address_country_code
                $data['postalAddressLine1'],                           // postal_address_line_1
                $data['postalAddressLine2'],                           // postal_address_line_2
                $data['postalAddressLine3'],                           // postal_address_line_3
                $data['postalAddressCode'],                            // postal_address_code
                '',                                                    // tel_number
                '',                                                    // fax_number
                '',                                                    // email_address
                '',                                                    // paye_reference_number
                '',                                                    // sdl_payment_reference_number
                '',                                                    // uif_payment_reference_number
                '',                                                    // uif_registration_number
                null,                                                  // sic_code
                null,                                                  // eti_status_code
                null,                                                  // special_economic_zone_code
                false,                                                 // diplomatic_indemnity
                '',                                                    // sars_contact_first_name
                '',                                                    // sars_contact_last_name
                '',                                                    // sars_contact_email_address
                '',                                                    // sars_contact_business_number
                '',                                                    // sars_contact_cell_number
                '',                                                    // uif_contact_person
                '',                                                    // uif_contact_email_address
                '',                                                    // uif_contact_number
                $data['payeCalculationTypeCode'],                      // paye_calculation_type_code
                $data['payeBonusCalculationTypeCode']                  // paye_bonus_calculation_type_code
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            echo( json_encode(['ok' => true, 'companyId' => $companyId]) );
            return true;
        }
        
        // Function to remove the specified company
        //
        // Required Parameters
        //  id          The id of the company to delete
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
            
            // Make sure the user's group has access to the company
            if( Util::checkCompanyAccess($data['id'], $user['id'], $db) !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You do not have access to the specified company.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            $db->query('LOCK TABLE admin_group_companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_access IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_invitation_rights IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_rights IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_sessions IN EXCLUSIVE MODE;');
           
            // Delete the admin groups access
            $sqlQuery = 'DELETE FROM admin_group_companies WHERE company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company access
            $sqlQuery = 'DELETE FROM user_company_access WHERE company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company invitation rights
            $sqlQuery = 'DELETE FROM user_company_invitation_rights WHERE user_company_invitation_id IN( SELECT id FROM user_company_invitations WHERE company_id = $1 );';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company invitations
            $sqlQuery = 'DELETE FROM user_company_invitations WHERE company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company rights
            $sqlQuery = 'DELETE FROM user_company_rights WHERE company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the user company sessions
            $sqlQuery = 'DELETE FROM user_sessions WHERE company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the specified company
            $sqlQuery = 'DELETE FROM companies WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get all the details of the specified company
        //
        // Required Parameters
        //  id              The id of the company whose details to get
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
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Make sure the user's group has access to the company
            if( Util::checkCompanyAccess($data['id'], $user['id'], $db) !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You do not have access to the specified company.']) );
                return false;
            }
            
            // Load the company from the companies table
            $sqlQuery = 
                'SELECT ' .
                    'companies.id, ' .
                    'companies.name, ' .
                    'companies.alias, ' .
                    'companies.contact_person, ' .
                    'companies.contact_number, ' .
                    'companies.contact_email, ' .
                    'companies.database_name, ' .
                    'companies.database_schema, ' .
                    'companies.database_host, ' .
                    'companies.is_active, ' .
                    'companies.employee_limit, ' .
                    'companies.is_trial, ' .
                    'companies.trial_starts_on, ' .
                    'companies.trial_expires_on, ' .
                    'companies.trial_updated_on, ' .
                    'companies.trial_updated_by_user_id, ' .
                    'companies.is_setup_complete, ' .
                    'companies.owner_user_id, ' .
                    'users.name AS owner_user_name, ' .
                    'companies.consultant_id, ' .
                    'consultants.name AS consultant_name, ' .
                    'companies.created_on ' .
                'FROM ' .
                    'companies ' .
                'LEFT JOIN ' .
                    'users ON users.id = companies.owner_user_id ' .
                'LEFT JOIN ' .
                    'consultants ON consultants.id = companies.consultant_id ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the company was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Set the company details
            $systemCompany = $sqlResult->fetchAssociative();
            
            // Get the groups that have access to the company
            $sqlQuery = 
                'SELECT ' .
                    'admin_groups.id, ' .
                    'admin_groups.name ' .
                'FROM ' .
                    'admin_group_companies ' .
                'LEFT JOIN ' .
                    'admin_groups ON admin_groups.id = admin_group_companies.admin_group_id ' .
                'WHERE ' .
                    'admin_group_companies.company_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $groups = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $groups[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name']
                ];
            }
            
            $sqlQuery = 'SET search_path TO ' . $systemCompany['database_schema'];
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the schema exists
            $sqlQuery = 'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$systemCompany['database_schema']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() === 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'Could not find the schema \'' . $systemCompany['database_schema'] . '\'.']) );
                return false;
            }
            
            // Load employee code from config
            $config = [
                'employee_code_mask' => null
            ];
            $configItemsLoaded = Util::loadConfigValues($db, $config);
            if( $configItemsLoaded !== count($config) ) {
                echo( json_encode(['ok' => false, 'error' => 'Loading config failed.']) );
                return false;
            }
            
            // Create a NumberMask object to handle the configured mask.
            $employeeCodeMask = $config['employee_code_mask'];
            
            // Get the company details
            $sqlQuery = 
                'SELECT  ' .
                    'company_details.id, ' .
                    'company_details.paye_calculation_type_code, ' .
                    'paye_calculation_types.name AS paye_calculation_type_name, ' .
                    'company_details.paye_bonus_calculation_type_code, ' .
                    'paye_bonus_calculation_types.name AS paye_bonus_calculation_type_name, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'countries.name AS physical_address_country_name, ' .
                    'company_details.postal_address_line_1, ' .
                    'company_details.postal_address_line_2, ' .
                    'company_details.postal_address_line_3, ' .
                    'company_details.postal_address_code ' .
                'FROM '. 
                    'company_details ' .
                'LEFT JOIN ' .
                    'paye_calculation_types ON paye_calculation_types.code = company_details.paye_calculation_type_code ' .
                'LEFT JOIN ' .
                    'paye_bonus_calculation_types ON paye_bonus_calculation_types.code = company_details.paye_bonus_calculation_type_code ' .
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'ORDER BY id DESC LIMIT 1 ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlResult->getRowCount() !== 1 ) {
                $sqlQuery =
                    'INSERT INTO company_details( ' .
                        'name, ' . 
                        'alias, ' . 
                        'registration_number, ' . 
                        'physical_address_unit, ' . 
                        'physical_address_complex, ' .
                        'physical_address_street, ' . 
                        'physical_address_suburb, ' . 
                        'physical_address_city, ' .
                        'physical_address_postal_code, ' . 
                        'physical_address_country_code, ' . 
                        'postal_address_line_1, ' .
                        'postal_address_line_2, ' . 
                        'postal_address_line_3, ' . 
                        'postal_address_code, ' . 
                        'tel_number, ' .
                        'fax_number, ' . 
                        'email_address, ' . 
                        'paye_reference_number, ' . 
                        'sdl_payment_reference_number, ' .
                        'uif_payment_reference_number, ' . 
                        'uif_registration_number, ' . 
                        'sic_code, ' . 
                        'eti_status_code, ' .
                        'special_economic_zone_code, ' . 
                        'diplomatic_indemnity, ' . 
                        'sars_contact_first_name, ' . 
                        'sars_contact_last_name, ' .
                        'sars_contact_email_address, ' . 
                        'sars_contact_business_number, ' . 
                        'sars_contact_cell_number, ' .
                        'uif_contact_person, ' . 
                        'uif_contact_email_address, ' . 
                        'uif_contact_number, ' . 
                        'paye_calculation_type_code, ' .
                        'paye_bonus_calculation_type_code ' .
                    ') ' .
                    'VALUES ( ' .
                            ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' . 
                            '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' . 
                            '$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, ' . 
                            '$31, $32, $33, $34, $35 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $systemCompany['name'],                                // name
                    $systemCompany['alias'],                               // alias
                    '',                                                    // registration_number
                    '',                                                    // physical_address_unit
                    '',                                                    // physical_address_complex
                    '',                                                    // physical_address_street
                    '',                                                    // physical_address_suburb
                    '',                                                    // physical_address_city
                    '',                                                    // physical_address_postal_code
                    null,                                                  // physical_address_country_code
                    '',                                                    // postal_address_line_1
                    '',                                                    // postal_address_line_2
                    '',                                                    // postal_address_line_3
                    '',                                                    // postal_address_code
                    '',                                                    // tel_number
                    '',                                                    // fax_number
                    '',                                                    // email_address
                    '',                                                    // paye_reference_number
                    '',                                                    // sdl_payment_reference_number
                    '',                                                    // uif_payment_reference_number
                    '',                                                    // uif_registration_number
                    null,                                                  // sic_code
                    null,                                                  // eti_status_code
                    null,                                                  // special_economic_zone_code
                    false,                                                 // diplomatic_indemnity
                    '',                                                    // sars_contact_first_name
                    '',                                                    // sars_contact_last_name
                    '',                                                    // sars_contact_email_address
                    '',                                                    // sars_contact_business_number
                    '',                                                    // sars_contact_cell_number
                    '',                                                    // uif_contact_person
                    '',                                                    // uif_contact_email_address
                    '',                                                    // uif_contact_number
                    'AVER',                                                // paye_calculation_type_code
                    'ACCU'                                                 // paye_bonus_calculation_type_code
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlQuery = 
                    'SELECT  ' .
                        'company_details.id, ' .
                        'company_details.paye_calculation_type_code, ' .
                        'paye_calculation_types.name AS paye_calculation_type_name, ' .
                        'company_details.paye_bonus_calculation_type_code, ' .
                        'paye_bonus_calculation_types.name AS paye_bonus_calculation_type_name, ' .
                        'company_details.physical_address_unit, ' .
                        'company_details.physical_address_complex, ' .
                        'company_details.physical_address_street, ' .
                        'company_details.physical_address_suburb, ' .
                        'company_details.physical_address_city, ' .
                        'company_details.physical_address_postal_code, ' .
                        'company_details.physical_address_country_code, ' .
                        'countries.name AS physical_address_country_name, ' .
                        'company_details.postal_address_line_1, ' .
                        'company_details.postal_address_line_2, ' .
                        'company_details.postal_address_line_3, ' .
                        'company_details.postal_address_code ' .
                    'FROM ' . 
                        'company_details ' .
                    'LEFT JOIN ' .
                        'paye_calculation_types ON paye_calculation_types.code = company_details.paye_calculation_type_code ' .
                    'LEFT JOIN ' .
                        'paye_bonus_calculation_types ON paye_bonus_calculation_types.code = company_details.paye_bonus_calculation_type_code ' .
                    'LEFT JOIN ' .
                        'countries ON countries.code = company_details.physical_address_country_code ' .
                    'ORDER BY id DESC LIMIT 1 ';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
            }
            
            $company = [
                'id' => $systemCompany['id'],
                'name' => $systemCompany['name'],
                'alias' => $systemCompany['alias'],
                'contactPerson' => $systemCompany['contact_person'],
                'contactNumber' => $systemCompany['contact_number'],
                'contactEmail' => $systemCompany['contact_email'],
                'databaseName' => $systemCompany['database_name'],
                'databaseSchema' => $systemCompany['database_schema'],
                'databaseHost' => $systemCompany['database_host'],
                'isActive' => $systemCompany['is_active'],
                'payeCalculationTypeCode' => $sqlRow['paye_calculation_type_code'],
                'payeCalculationTypeName' => $sqlRow['paye_calculation_type_name'],
                'payeBonusCalculationTypeCode' => $sqlRow['paye_bonus_calculation_type_code'],
                'payeBonusCalculationTypeName' => $sqlRow['paye_bonus_calculation_type_name'],
                'employeeLimit' => $systemCompany['employee_limit'],
                'isTrial' => $systemCompany['is_trial'],
                'trialStartsOn' => $systemCompany['trial_starts_on'],
                'trialExpiresOn' => $systemCompany['trial_expires_on'],
                'trialUpdatedOn' => $systemCompany['trial_updated_on'],
                'trialUpdatedByUserId' => $systemCompany['trial_updated_by_user_id'],
                'isSetupComplete' => $systemCompany['is_setup_complete'],
                'employeeCodeMask' => $employeeCodeMask,
                'ownerUserId' => $systemCompany['owner_user_id'],
                'ownerUserName' => $systemCompany['owner_user_name'],
                'consultantId' => $systemCompany['consultant_id'],
                'consultantName' => $systemCompany['consultant_name'],
                'createdOn' => $systemCompany['created_on'],
                'groups' => $groups,
                'companyDetailsId' => $sqlRow['id'],
                'physicalAddressUnit' => $sqlRow['physical_address_unit'],
                'physicalAddressComplex' => $sqlRow['physical_address_complex'],
                'physicalAddressStreet' => $sqlRow['physical_address_street'],
                'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                'physicalAddressCity' => $sqlRow['physical_address_city'],
                'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                'physicalAddressCountryCode' => $sqlRow['physical_address_country_code'],
                'physicalAddressCountryName' => $sqlRow['physical_address_country_name'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code']
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'company' => $company]) );
            return true;
        }
        
        // Function to to update the specified company's details
        //
        // Required Parameters
        //  id                The id of the company whose details to update
        //
        // Optional Parameters
        //  companyName                     The name of the company for which to add a company
        //  companyAlias                    The alias of the company for which to add a company
        //  companyContactPerson            The company contact person
        //  companyContactNumber            The company contact number
        //  companyContactEmail             The company contact email adress
        //  payeCalculationTypeCode         The PAYE calculation method ('PERI' for periodic, 'AVER' for tax averaging)
        //  payeBonusCalculationTypeCode    The PAYE bonus calculation method ('STAN' for standard, 'ACCU' for accurate)
        //  companyIsActive                 Whether the company is active (true / false)
        //  employeeLimit                   The maximum number of employees allowed in the company (null = unlimited)
        //  isTrial                         Whether the company is a trial (true /f alse)
        //  trialStartsOn                   The date on which the trial starts
        //  trialExpiresOn                  The date on which the trial expires
        //  employeeCodeMask                The mask specified for employee codes
        //  databaseSchema                  The name of the database schema to create
        //  databaseName                    The database name, if any
        //  databaseHost                    The database host, if any
        //  consultantId                    The consulatnt linked to the company (if any)
        //  groups                          A list of admin group ids that have access to the company
        //                                      groups :[
        //                                          'id' =>  // admin group id
        //                                      ]
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
                'companyName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'companyAlias' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'companyContactPerson' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'companyContactNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'companyContactEmail' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'payeCalculationTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'payeBonusCalculationTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'companyIsActive' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'employeeLimit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employeeCodeMask' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'isTrial' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'trialStartsOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'trialExpiresOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'isSetupComplete' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'physicalAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'postalAddressLine1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
                // NOTE:
                //
                // We may need to enable editing the database details in the future
                //
                // 'databaseSchema' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                // 'databaseName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                // 'databaseHost' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                
                'consultantId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'groups' => ['type' => JSON::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['id' => ['type' => JSON::TYPE_STRING,'required' => true ,'nullable' => false],
                ]]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Make sure the user's group has access to the company
            if( Util::checkCompanyAccess($data['id'], $user['id'], $db) !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You do not have access to the specified company.']) );
                return false;
            }
            
            // Get the company details
            $sqlQuery =
                'SELECT ' . 
                    'companies.is_trial, ' . 
                    'companies.trial_starts_on, ' . 
                    'companies.trial_expires_on ' . 
                'FROM ' . 
                    'companies ' .
                'WHERE ' . 
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified company could not be found']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $isTrial = $sqlRow['is_trial'];
            $trialStartsOn = $sqlRow['trial_starts_on'];
            $trialExpiresOn = $sqlRow['trial_expires_on'];
            $trialUpdated = false;
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE admin_group_companies IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE companies IN EXCLUSIVE MODE;');
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE companies SET ';
            
            if( isset($data['companyName']) ) {
                // Make certain there isn't already a company with the specified name
                $sqlQuery = 
                    'SELECT id FROM companies WHERE name = $1 AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['companyName'], $data['id']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'A company with the name \'' . $data['companyName'] . '\' already exists.']) );
                    return false;
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['companyName'];
            }
            
            if( isset($data['companyAlias']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'alias = $' . $updateCount;
                $updateValues[] = $data['companyAlias'];
            }
            
            if( isset($data['companyContactPerson']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'contact_person = $' . $updateCount;
                $updateValues[] = $data['companyContactPerson'];
            }
            
            if( isset($data['companyContactNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'contact_number = $' . $updateCount;
                $updateValues[] = $data['companyContactNumber'];
            }
            
            if( isset($data['companyContactEmail']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'contact_email = $' . $updateCount;
                $updateValues[] = $data['companyContactEmail'];
            }
            
            if( array_key_exists('companyIsActive', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_active = $' . $updateCount;
                $updateValues[] = $data['companyIsActive'];
            }
            
            // Was the value specified and changed from the existing value?
            if( array_key_exists('isTrial', $data) && ($data['isTrial'] != $isTrial) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_trial = $' . $updateCount;
                $updateValues[] = $data['isTrial'];
                
                // Remember that the trial details was updated
                $trialUpdated = true;
            }
            
            // Was the value specified and changed from the existing value?
            if( array_key_exists('trialStartsOn', $data) && ($data['trialStartsOn'] != $trialStartsOn) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'trial_starts_on = $' . $updateCount;
                $updateValues[] = $data['trialStartsOn'];
                
                // Remember that the trial details was updated
                $trialUpdated = true;
            }
            
            // Was the value specified and changed from the existing value?
            if( array_key_exists('trialExpiresOn', $data) && ($data['trialExpiresOn'] != $trialExpiresOn) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'trial_expires_on = $' . $updateCount;
                $updateValues[] = $data['trialExpiresOn'];
                
                // Remember that the trial details was updated
                $trialUpdated = true;
            }
            
            // Was the trial details updated?
            if( $trialUpdated ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'trial_updated_on = $' . $updateCount;
                $updateValues[] = date('Y-m-d H:i:s');
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'trial_updated_by_user_id = $' . $updateCount;
                $updateValues[] = $user['id'];
            }
            
            if( array_key_exists('isSetupComplete', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_setup_complete = $' . $updateCount;
                $updateValues[] = $data['isSetupComplete'];
            }
            
            if( array_key_exists('employeeLimit', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employee_limit = $' . $updateCount;
                $updateValues[] = $data['employeeLimit'];
            }
            
            // NOTE:
            //
            // We may need to enable editing the database details in the future
            
            // if( isset($data['databaseSchema']) ) {
            //     $updateCount++;
            //     if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
            //     $updateQuery = $updateQuery . 'database_schema = $' . $updateCount;
            //     $updateValues[] = $data['databaseSchema'];
            // }
            
            // if( isset($data['databaseName']) ) {
            //     $updateCount++;
            //     if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
            //     $updateQuery = $updateQuery . 'database_name = $' . $updateCount;
            //     $updateValues[] = $data['databaseName'];
            // }
            
            // if( isset($data['databaseHost']) ) {
            //     $updateCount++;
            //     if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
            //     $updateQuery = $updateQuery . 'database_host = $' . $updateCount;
            //     $updateValues[] = $data['databaseHost'];
            // }
            
            if( array_key_exists('consultantId', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'consultant_id = $' . $updateCount;
                $updateValues[] = $data['consultantId'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['id'];
            
            if( $updateCount > 1 ) {
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Are there any groups to add or remove?
            if( isset($data['groups']) ) {
                // Remove all group access for the company
                $query = 'DELETE FROM admin_group_companies WHERE company_id = $1;';
                $result = $db->paramQuery($query, [$data['id']]);
                if( !$result->isValid() ) die(json_encode(['ok' => false, 'error' => 'Database error']));
                
                // Add the new groups, if any
                if (count($data['groups']) > 0) {
                    foreach( $data['groups'] as $group ) {
                        $sqlQuery = 
                            'INSERT INTO admin_group_companies ( ' .
                                'admin_group_id,' .
                                'company_id' .
                            ') ' .
                            'VALUES( ' . 
                                '$1, $2 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $group['id'],   // admin_group_id
                            $data['id']     // company_id
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
            
            $sqlQuery = 
                'SELECT ' .
                    'companies.database_schema, companies.database_name, companies.database_host ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the company was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Set the company details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $databaseSchema = $sqlRow['database_schema'];
            $databaseName = $sqlRow['database_name'];
            $databaseHost = $sqlRow['database_host'];
            
            $dbConnected = $db->connect(
                "host='" . $databaseHost . "' port='" . CONF_DB_PORT . "' dbname='" . $databaseName .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to \'' . $databaseName . '\' database.']) );
                return false;
            }
            
            $sqlQuery = 'SET search_path TO ' . $databaseSchema;
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlQuery = 'SELECT company_details.id FROM company_details ORDER BY id DESC LIMIT 1 ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            $companyId = $sqlResult->fetchAssociative();
            $companyId = $companyId['id'];
            
            if( isset($data['employeeCodeMask']) ) {
                // Update the employee code mask
                $sqlQuery = 'UPDATE config SET value = $1 WHERE name = \'employee_code_mask\';';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeCodeMask']   // value
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE company_details SET ';
            
            if( isset($data['payeCalculationTypeCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'paye_calculation_type_code = $' . $updateCount;
                $updateValues[] = $data['payeCalculationTypeCode'];
            }
            
            if( isset($data['payeBonusCalculationTypeCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'paye_bonus_calculation_type_code = $' . $updateCount;
                $updateValues[] = $data['payeBonusCalculationTypeCode'];
            }
            
            if( isset($data['companyName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['companyName'];
            }
            
            if( isset($data['companyAlias']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'alias = $' . $updateCount;
                $updateValues[] = $data['companyAlias'];
            }
            
            if( isset($data['physicalAddressUnit']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_unit = $' . $updateCount;
                $updateValues[] = $data['physicalAddressUnit'];
            }
            
            if( isset($data['physicalAddressComplex']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_complex = $' . $updateCount;
                $updateValues[] = $data['physicalAddressComplex'];
            }
            
            if( isset($data['physicalAddressStreet']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_street = $' . $updateCount;
                $updateValues[] = $data['physicalAddressStreet'];
            }
            
            if( isset($data['physicalAddressSuburb']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_suburb = $' . $updateCount;
                $updateValues[] = $data['physicalAddressSuburb'];
            }
            
            if( isset($data['physicalAddressCity']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_city = $' . $updateCount;
                $updateValues[] = $data['physicalAddressCity'];
            }
            
            if( isset($data['postalAddressCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_postal_code = $' . $updateCount;
                $updateValues[] = $data['postalAddressCode'];
            }
            
            if( isset($data['physicalAddressCountryCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_country_code = $' . $updateCount;
                $updateValues[] = $data['physicalAddressCountryCode'];
            }
            
            if( isset($data['postalAddressLine1']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_address_line_1 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine1'];
            }
            
            if( isset($data['postalAddressLine2']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_address_line_2 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine2'];
            }
            
            if( isset($data['postalAddressLine3']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_address_line_3 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine3'];
            }
            
            if( isset($data['postalAddressCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_address_code = $' . $updateCount;
                $updateValues[] = $data['postalAddressCode'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $companyId;
            
            if( $updateCount > 1 ) {
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to get a list of users
        //
        // Required Parameters
        //  companyId               The id of the company whose users to get
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  companyIdFilter         Get only users for a certain company
        public function getUserList($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'companyIdFilter' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'companyIdFilter' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            
            $sqlParams[] = $data['companyId'];
            $whereClause = 
                'WHERE ( ' .
                    'user_company_access.company_id = $' . count($sqlParams) . ' AND ' .
                    'user_company_access.revoked IS FALSE ' .
                ') ';

            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . ' AND ( ';
                $whereClause = $whereClause . ' ( users.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( users.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
                $whereClause = $whereClause . ' ) ';
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
            
            // Load all users from the users table
            $sqlQuery = 
                'SELECT ' .
                    'users.id, ' .
                    'users.name, ' .
                    'users.email_address, ' .
                    'users.cell_number, ' .
                    'users.is_admin, ' .
                    'users.is_active, ' .
                    'users.last_login, ' .
                    'users.created_on ' .
                'FROM ' .
                    'users ' .
                'LEFT JOIN ' .
                    'user_company_access ON user_company_access.user_id = users.id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'users.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
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
                    'isActive' => $sqlRow['is_active'],
                    'lastLogin' => $sqlRow['last_login'],
                    'createdOn' => $sqlRow['created_on']
                ];
            }
            
            // Load all users invited to the company
            $sqlQuery =
                'SELECT ' .
                    'user_company_invitations.id AS invitation_id, ' .
                    'user_company_invitations.invitee_email_address, ' .
                    'user_company_invitations.invitee_name, ' .
                    'user_company_invitations.status_code, ' .
                    'user_company_invitation_status_types.name AS status_name ' . 
                'FROM ' .
                    'user_company_invitations ' .
                'LEFT JOIN ' .
                    'user_company_invitation_status_types ON user_company_invitations.status_code = user_company_invitation_status_types.code ' . 
                'LEFT JOIN ' .
                    'users ON LOWER(user_company_invitations.invitee_email_address) = LOWER(users.email_address) ' .
                'LEFT JOIN ' .
                    'user_company_access ON  ' .
                        'user_company_access.company_id = user_company_invitations.company_id AND ' .
                        'user_company_access.user_id = users.id ' .
                'WHERE ' .
                    'user_company_invitations.company_id = $1 AND ' .
                    'user_company_access.id IS NULL ' .
                'ORDER BY ' .
                    'user_company_invitations.invitee_name;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add users to the company array
            $invitations = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $invitations[] = [
                    'id' => $sqlRow['invitation_id'],
                    'name' => $sqlRow['invitee_name'],
                    'emailAddress' => $sqlRow['invitee_email_address'],
                    'status' => [
                        'code' => $sqlRow['status_code'],
                        'name' => $sqlRow['status_name']
                    ]
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'users' => $users,
                'invitations' => $invitations
            ]) );
            
            return true;
        }
        
        // Function to add a new user to the company
        //
        // Required Parameters
        //  companyId                   The id of the company to add a user too
        //  name                        The name of the person being invited
        //  emailAddress                The email address of the user to add
        //
        // Optional Parameters
        //  None
        public function addUser($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $companyId = $data['companyId'];
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE user_company_access IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE users IN EXCLUSIVE MODE;');
            
            // Check if invite was already sent
            $sqlQuery =
                'SELECT ' . 
                    'id ' . 
                'FROM ' . 
                    'user_company_invitations ' . 
                'WHERE ' . 
                    'company_id = $1 AND LOWER(invitee_email_address) = LOWER($2) ';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId, $data['emailAddress']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'You have already invited a user with the email address ' . $data['emailAddress'] . '.']) );
                return false;
            }
            
            // Check if user was already accepted
            $sqlQuery =
                'SELECT user_company_access.id FROM user_company_access ' .
                'LEFT JOIN ' .
                    'users ON user_company_access.user_id = users.id ' .
                'WHERE user_company_access.company_id = $1 AND LOWER(users.email_address) = LOWER($2) ';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId, $data['emailAddress']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'This user is already part of the company']) );
                return false;
            }
            
            // Generate a secure random code for the invitation
            $code = Security::generateRandomString(64);
            
            // Add an invitation for the user
            $sqlQuery =
                'INSERT INTO ' .
                    'user_company_invitations (code, company_id, invitee_name, invitee_email_address, sent_by_user_id, sent_on, expires_on, status_code) ' .
                'VALUES ' .
                    '($1, $2, $3, $4, $5, $6, $7, $8) ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $code,                                  // code
                $companyId,                             // company_id
                $data['name'],                          // invitee_name
                $data['emailAddress'],                  // invitee_email_address
                $user['id'],                            // sent_by_user_id
                date('Y-m-d H:i:s'),                    // sent_on
                date('Y-m-d H:i:s', time() + 604800),   // expires_on
                'PEND'                                  // status code
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $userCompanyInvitationId = $sqlRow['id']; 
            
            // Add the relevant rights
            $insertCount = 0;
            $insertValues = [];
            $sqlQuery = 'INSERT INTO user_company_invitation_rights(user_company_invitation_id, user_right_code) VALUES ';
            
            // Should the attendance portal access right be added?
            $invitationLink = CONF_ATTENDANCE_URL . '/index.html?invitation=' . $code;
            if( array_key_exists('attendanceAccessRight', $data) && ($data['attendanceAccessRight'] == true) ) {
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId ;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                
                $insertCount++;
                $insertValues[] = 'AAPO';
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
            }
            
            // Should the payroll portal access right be added?
            if( array_key_exists('payrollAccessRight', $data) && ($data['payrollAccessRight'] == true) ) {
                $invitationLink = CONF_CLIENT_URL . '/index.html?invitation=' . $code;
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId;
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
            
            // Load company details from database
            $companyName = '';
            $consultantName = '';
            $sqlQuery = 
                'SELECT ' .
                    'companies.name AS company_name, ' .
                    'consultants.name AS consultant_name ' .
                'FROM ' .
                    'companies ' .
                'LEFT JOIN ' .
                    'consultants ON consultants.id = companies.consultant_id ' .
                'WHERE ' .
                    'companies.id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlRow = $sqlResult->fetchAssociative() ) {
                $companyName = $sqlRow['company_name'];
                $consultantName = $sqlRow['consultant_name'];
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            System::useModule('phpmailer');
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
            
            // Set sender name
            $senderName = $user['name'];
            if( $consultantName != null ) {
                $senderName = $consultantName;
            }
            
            // Load the template to send
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/user_company_invitation.html' );
            $mailText = str_replace('$SENDER_NAME', $senderName, $mailText);
            $mailText = str_replace('$RECIPIENT_NAME', $data['name'], $mailText);
            $mailText = str_replace('$COMPANY_NAME', $companyName, $mailText);
            $mailText = str_replace('$INVITATION_LINK', $invitationLink, $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys');
            $mail->addAddress($data['emailAddress'], '');
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
        
        // Function to remove user from company
        //
        // Required Parameters
        //  companyId                   The id of the company to remove the user from
        //  userId                      The id of the user to be removed from the company
        //
        // Optional Parameters
        //  None
        public function removeUser($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'userId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $companyId = $data['companyId'];
            
            // Make sure the user's group has access to the company
            if( Util::checkCompanyAccess($companyId, $user['id'], $db) !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You do not have access to the specified company.']) );
                return false;
            }
            
            // Check that the user revoking the access is still active and has access to the company
            $sqlQuery = 
                'SELECT ' . 
                    'user_company_access.user_id, user_company_access.company_id, user_company_access.revoked, ' . 
                    'users.is_active ' . 
                'FROM ' . 
                    'user_company_access ' . 
                'LEFT JOIN ' . 
                    'users ON user_company_access.user_id = users.id ' . 
                'WHERE ' . 
                    'user_company_access.user_id = $1 AND user_company_access.company_id = $2 AND user_company_access.revoked = FALSE;'; 
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $companyId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // If we did not find precisely on row then there was an error
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'You no longer have access to this company and cannot remove it\'s users.']) );
                return false;
            }
            
            // Check that the user is active
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['is_active'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You cannot remove users from this company because your account is no longer active.']) );
                return false;
            }
            
            // Start an SQL transaction
            $db->startTransaction();
            
            // Set the revoked flag to true and store the time the access was revoked.
            $sqlQuery = 
                'UPDATE user_company_access SET ' .
                    'revoked = true, ' .
                    'revoked_on = $1 ' .
                'WHERE ' . 
                    'user_id = $2 AND company_id = $3 ';
            $sqlResult = $db->paramQuery($sqlQuery, [date('Y-m-d H:i:s'), $data['userId'], $companyId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Invalidate all user sessions for this company
            $sqlQuery = 'UPDATE user_sessions SET lifetime = 0 WHERE user_id = $1 AND company_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['userId'], $companyId]);
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
        
        // Function to list servers
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getServerList($data, $user, $db) {
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
                $whereClause = $whereClause . ' ( sql_servers.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( sql_servers.database_host ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( sql_servers.database_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
                $whereClause = $whereClause . ' ) ';
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
            
            // Load all consultants from the consultants table
            $sqlQuery = 
                'SELECT ' .
                    'sql_servers.id, ' .
                    'sql_servers.name, ' .
                    'sql_servers.database_host, ' .
                    'sql_servers.database_name, ' .
                    'sql_servers.enabled, ' .
                    'sql_servers.is_default ' .
                'FROM ' .
                    'sql_servers ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'sql_servers.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create consultants array
            $servers = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $servers[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'databaseHost' => $sqlRow['database_host'],
                    'databaseName' => $sqlRow['database_name'],
                    'enabled' => $sqlRow['enabled'],
                    'isDefault' => $sqlRow['is_default']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'servers' => $servers
            ]) );
            
            return true;
        }
        
        
        // Function to update a company's schema to the latest database version
        //
        // Required Parameters
        //  id              The id of the company whose schema to update
        //
        // Optional Parameters
        //  None
        public function updateSchema($data, $user, $db) {
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
            
            // Load the company from the companies table
            $sqlQuery = 
                'SELECT ' .
                    'companies.database_name, ' .
                    'companies.database_schema, ' .
                    'companies.database_host ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the company was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Set the company details
            $sqlRow = $sqlResult->fetchAssociative();
            $databaseName = $sqlRow['database_name'];
            $databaseSchema = $sqlRow['database_schema'];
            $databaseHost = $sqlRow['database_host'];
            
            // Set default value for database port, if none specified
            $databasePort = CONF_DB_PORT;
            
            // Set default value for database user, if none specified
            $databaseUser = CONF_DB_USER;
            
            // Set default value for database password, if none specified
            $databasePassword = CONF_DB_PASSWORD;
            
            // Try to connect to the database to see if it exists
            $dbConnected = $db->connect(
                "host='" . $databaseHost . "' port='" . $databasePort . "' dbname='" . $databaseName .
                "' user='" . $databaseUser . "' password='" . $databasePassword . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to \'' . $databaseName . '\' database.']) );
                return false;
            }
            
            // Check if the specified schema exists
            $sqlResult = $db->paramQuery('SELECT schema_name FROM information_schema.schemata WHERE schema_name = \'' . $databaseSchema . '\';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the schema NOT found?
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Schema \'' . $databaseSchema . '\' not found.']) );
                return false;
            }
            
            // Set our search path to schema
            $sqlResult = $db->paramQuery('SET search_path TO ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the current database version of the schema
            $sqlQuery = 
                'SELECT ' .
                    'minor_version, ' .
                    'major_version, ' .
                    'timestamp ' .
                'FROM ' .
                    'database_updates ' . 
                'ORDER BY ' . 
                    'major_version DESC, minor_version DESC ' . 
                'LIMIT 1;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set database version details
            $currentMajorVersion = 0;
            $currentMinorVersion = 0;
            $lastUpdated = '';
            
            if( $sqlResult->getRowCount() > 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $currentMajorVersion = (int) $sqlRow['major_version'];
                $currentMinorVersion = (int) $sqlRow['minor_version'];
                $lastUpdated = $sqlRow['timestamp'];
            }
            
            $updatedMajorVersion = $currentMajorVersion;
            $updatedMinorVersion = $currentMinorVersion;
            
            // Get the directories where the sql queries are stored for creating the company
            $sqlDirs = array_filter(glob(CONF_SQL_DIR . '*' , GLOB_ONLYDIR), 'is_dir');
            sort($sqlDirs);
            
            $isOk = true;
            $sqlError = '';
            
            // For every SQL directory
            $fileMajorVersion = 0;
            foreach( $sqlDirs AS $sqlDir ) {
                // Get a list of all the files in the folder
                $fileList = scandir($sqlDir);
                
                if( $fileList === false ) {
                    echo( json_encode(['ok' => false, 'error' => 'Unable to open the SQL directory specified in the configuration.']) );
                    return false;
                }
                
                // Set the major version of the files in the current directory (directories are returned sorted
                // in ascneding order and should be numbered 'v001', 'v002', etc.,
                $fileMajorVersion = $fileMajorVersion + 1;
                
                // Has the database been updated past this major version?
                if( $fileMajorVersion < $currentMajorVersion ) {
                    // Skip all sql files in the directory
                    continue;
                }
                
                // For every file in the list (excluding '.' and '..')
                for( $i = 2; $i < (count($fileList)); $i++ ) {
                    // Skip file if not an sql file
                    if( substr( $fileList[$i], -4) != '.sql') continue;
                    
                    // Set time limit to 10 minutes
                    set_time_limit(600);
                    
                    // Get the file number (files should be numbered 01.sql, 02.sql, etc.,)
                    $fileMinorVersion = (int) substr( $fileList[$i], 0, 2 );
                    
                    // Has the database been updated past this minor version?
                    if( ($fileMajorVersion <= $currentMajorVersion) && ($fileMinorVersion <= $currentMinorVersion) ) {
                        // Skip the current sql file
                        continue;
                    }
                    
                    // Get file size
                    $fileSize = filesize( $sqlDir . '/' . $fileList[$i] );
                    
                    // Check for BOM
                    $bomOffset = 0;
                    if( $fileSize >= 3 ) {
                        $fp = fopen($sqlDir . '/' . $fileList[$i], 'rb');
                        $fileData = bin2hex ( fread($fp, 3) );
                        fclose( $fp );
                        
                        if( strtolower($fileData) === 'efbbbf' ) $bomOffset = 3;
                    }
                    
                    // Start SQL transaction
                    $db->startTransaction();
                    
                    // Get the contents of the sql file
                    $sqlQuery = file_get_contents($sqlDir . '/' . $fileList[$i], false, NULL, $bomOffset);
                    
                    // Run the specified query
                    $sqlResult = $db->query($sqlQuery);
                    $sqlError = 'Update database error: ' . $db->getError();
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => $sqlError]) );
                        return false;
                    }
                    
                    // Commit the transaction
                    $db->commitTransaction();
                    
                    // Set the updated version details
                    $updatedMajorVersion = $fileMajorVersion;
                    $updatedMinorVersion = $fileMinorVersion;
                    $lastUpdated = date('Y-m-d H:i:s');
                }
            }
            
            $updateResult = [
                'previousVersion' => $currentMajorVersion . '.' . $currentMinorVersion,
                'currentVersion' => $updatedMajorVersion . '.' . $updatedMinorVersion,
                'lastUpdated' => $lastUpdated
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'updateResult' => $updateResult
            ]) );
            
            return true;
        }
        
        // Function to process leave for a company for a certain period
        //
        // Required Parameters
        //  id                      The id of the company to process leave for
        //  startDate               Start processing leave form this date
        //  endDate                 Leave should be calculated to this date
        //
        // Optional Parameters
        //  None
        public function processLeave($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the company from the companies table
            $sqlQuery = 
                'SELECT ' .
                    'companies.database_name, ' .
                    'companies.database_schema, ' .
                    'companies.database_host ' .
                'FROM ' .
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the company was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company \'' . $data['id'] . '\' not found.']) );
                return false;
            }
            
            // Set the company details
            $sqlRow = $sqlResult->fetchAssociative();
            $databaseName = $sqlRow['database_name'];
            $databaseSchema = $sqlRow['database_schema'];
            $databaseHost = $sqlRow['database_host'];
            
            // Set default value for database port, if none specified
            $databasePort = CONF_DB_PORT;
            
            // Set default value for database user, if none specified
            $databaseUser = CONF_DB_USER;
            
            // Set default value for database password, if none specified
            $databasePassword = CONF_DB_PASSWORD;
            
            // Try to connect to the database to see if it exists
            $dbConnected = $db->connect(
                "host='" . $databaseHost . "' port='" . $databasePort . "' dbname='" . $databaseName .
                "' user='" . $databaseUser . "' password='" . $databasePassword . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to \'' . $databaseName . '\' database.']) );
                return false;
            }
            
            // Set our search path to schema
            $sqlResult = $db->paramQuery('SET search_path TO ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check that the start and end dates are valid
            $today = date('Y-m-d');
            if( $data['startDate'] > $today || $data['endDate'] > $today ) {
                echo( json_encode(['ok' => false, 'error' => 'Cannot calculate leave for future dates.']) );
                return false;
            }
            if( $data['startDate'] > $data['endDate'] ) {
                echo( json_encode(['ok' => false, 'error' => 'The start date cannot be after the end date.']) );
                return false;
            }
            
            // For every day in the period
            $calculateDate = $data['startDate'];
            $numDaysProcessed = 0;
            while( $calculateDate <=  $data['endDate'] ) {
                // Set the maximum execution time for a loop iteration to 10 minutes
                set_time_limit(600);
                
                // Check if leave has already been processed for the date
                $sqlQuery = 'SELECT id FROM leave_maintenance_log WHERE CAST(leave_maintenance_log.date AS VARCHAR) = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$calculateDate]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Don't process leave if it was already processed for the specified date
                if( $sqlResult->getRowCount() > 0 ) {
                    $calculateDate = date('Y-m-d', strtotime($calculateDate . ' +1 day'));
                    continue;
                }
                
                // Process the leave for the specified date and get the result
                $leaveResult = \LeaveUtil\processCompanyLeave( $calculateDate, $user, $db );
                if( $leaveResult === false ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to calculate leave.']) );
                    return false;
                }
                
                // Set the process date to the next daty
                $calculateDate = date('Y-m-d', strtotime($calculateDate . ' +1 day'));
                $numDaysProcessed = $numDaysProcessed + 1;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'numDaysProcessed' => $numDaysProcessed]) );
            return true;
        }
        
        // Function to list company requests
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getRequestList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'DESC',
                'processedFilter' => null
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
                'processedFilter' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' ( new_company_requests.company_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( new_company_requests.company_alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( new_company_requests.company_contact_person ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( new_company_requests.company_email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( new_company_requests.user_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( new_company_requests.user_email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ' .
                $whereClause = $whereClause . ' ( CAST(new_company_requests.created_on AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ' .
                $whereClause = $whereClause . ' ) ';
            }
            
            // Add a filter to show or hide processed transactions
            if( array_key_exists('processedFilter', $data) && ($data['processedFilter'] !== 'show_all') ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                if( $data['processedFilter'] === 'processed_only' ) {
                    $whereClause = $whereClause . ' new_company_requests.processed_on IS NOT NULL ';
                }
                else if( $data['processedFilter'] === 'unprocessed_only' ) {
                    $whereClause = $whereClause . ' new_company_requests.processed_on IS NULL ';
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
                        case 'createdOn':
                            $column = 'new_company_requests.created_on';
                            break;
                        case 'companyAlias':
                            $column = 'new_company_requests.company_alias';
                            break;
                        case 'userName':
                            $column = 'new_company_requests.user_name';
                            break;
                        case 'userPhoneNumber':
                            $column = 'new_company_requests.user_phone_number';
                            break;
                        case 'userEmailAddress':
                            $column = 'new_company_requests.user_email_address';
                            break;
                        case 'processed':
                            $column = 'new_company_requests.processed_on';
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
            
            // Load all requests from the new_company_requests table
            $sqlQuery = 
                'SELECT ' .
                    'new_company_requests.id, ' . 
                    'new_company_requests.company_name, ' . 
                    'new_company_requests.company_alias, ' . 
                    'new_company_requests.physical_address_line_1, ' . 
                    'new_company_requests.physical_address_line_2, ' . 
                    'new_company_requests.physical_address_line_3, ' . 
                    'new_company_requests.physical_address_code, ' . 
                    'new_company_requests.postal_address_line_1, ' . 
                    'new_company_requests.postal_address_line_2, ' . 
                    'new_company_requests.postal_address_line_3, ' . 
                    'new_company_requests.postal_address_code, ' . 
                    'new_company_requests.company_contact_person, ' . 
                    'new_company_requests.company_phone_number, ' . 
                    'new_company_requests.company_email_address, ' . 
                    'new_company_requests.user_name, ' . 
                    'new_company_requests.user_phone_number, ' . 
                    'new_company_requests.user_email_address, ' . 
                    'new_company_requests.created_on, ' . 
                    'new_company_requests.processed_on ' .
                'FROM ' .
                    'new_company_requests ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'new_company_requests.created_on ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create requests array
            $requests = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $requests[] = [
                    'id' => $sqlRow['id'],
                    'companyName' => $sqlRow['company_name'],
                    'companyAlias' => $sqlRow['company_alias'],
                    'physicalAddressLine1' => $sqlRow['physical_address_line_1'],
                    'physicalAddressLine2' => $sqlRow['physical_address_line_2'],
                    'physicalAddressLine3' => $sqlRow['physical_address_line_3'],
                    'physicalAddressCode' => $sqlRow['physical_address_code'],
                    'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                    'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                    'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                    'postalAddressCode' => $sqlRow['postal_address_code'],
                    'companyContactPerson' => $sqlRow['company_contact_person'],
                    'companyPhoneNumber' => $sqlRow['company_phone_number'],
                    'companyEmailAddress' => $sqlRow['company_email_address'],
                    'userName' => $sqlRow['user_name'],
                    'userPhoneNumber' => $sqlRow['user_phone_number'],
                    'userEmailAddress' => $sqlRow['user_email_address'],
                    'createdOn' => $sqlRow['created_on'],
                    'processedOn' => $sqlRow['processed_on']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'requests' => $requests]) );
            return true;
        }
        
        // Function to get all the details of the specified company
        //
        // Required Parameters
        //  requestId           The id of the company request whose details to get
        //
        // Optional Parameters
        //  None
        public function getRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'requestId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            // Load all requests from the new_company_requests table
            $sqlQuery = 
                'SELECT ' .
                    'new_company_requests.id, ' . 
                    'new_company_requests.company_name, ' . 
                    'new_company_requests.company_alias, ' . 
                    'new_company_requests.number_of_employees, ' . 
                    'new_company_requests.physical_address_line_1, ' . 
                    'new_company_requests.physical_address_line_2, ' . 
                    'new_company_requests.physical_address_line_3, ' . 
                    'new_company_requests.physical_address_code, ' . 
                    'new_company_requests.postal_address_line_1, ' . 
                    'new_company_requests.postal_address_line_2, ' . 
                    'new_company_requests.postal_address_line_3, ' . 
                    'new_company_requests.postal_address_code, ' . 
                    'new_company_requests.company_contact_person, ' . 
                    'new_company_requests.company_phone_number, ' . 
                    'new_company_requests.company_email_address, ' . 
                    'new_company_requests.user_name, ' . 
                    'new_company_requests.user_phone_number, ' . 
                    'new_company_requests.user_email_address, ' . 
                    'new_company_requests.created_on, ' . 
                    'new_company_requests.processed_on ' .
                'FROM ' .
                    'new_company_requests ' .
                'WHERE ' . 
                    'new_company_requests.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $request = [
                'id' => $sqlRow['id'],
                'companyName' => $sqlRow['company_name'],
                'companyAlias' => $sqlRow['company_alias'],
                'numberOfEmployees' => $sqlRow['number_of_employees'],
                'physicalAddressLine1' => $sqlRow['physical_address_line_1'],
                'physicalAddressLine2' => $sqlRow['physical_address_line_2'],
                'physicalAddressLine3' => $sqlRow['physical_address_line_3'],
                'physicalAddressCode' => $sqlRow['physical_address_code'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'companyContactPerson' => $sqlRow['company_contact_person'],
                'companyPhoneNumber' => $sqlRow['company_phone_number'],
                'companyEmailAddress' => $sqlRow['company_email_address'],
                'userName' => $sqlRow['user_name'],
                'userPhoneNumber' => $sqlRow['user_phone_number'],
                'userEmailAddress' => $sqlRow['user_email_address'],
                'createdOn' => $sqlRow['created_on'],
                'processedOn' => $sqlRow['processed_on']
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'request' => $request]) );
            return true;
        }
        
        // Function to to update the specified request's details
        //
        // Required Parameters
        //  requestId               The id of the request whose details to update
        //
        // Optional Parameters
        //  process                 Whether to process the request or not
        public function updateRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'requestId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'process' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to update the request
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE new_company_requests SET ';
            
            // Should the request's processed status be updated?
            if( array_key_exists('process', $data) ) {
                // Should the request be processed?
                if( $data['process'] ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'processed_on = $' . $updateCount;
                    $updateValues[] = date('Y-m-d H:i:s');
                }
                else {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'processed_on = $' . $updateCount;
                    $updateValues[] = null;
                }
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['requestId'];
            
            // Run the update query if there are any values to update
            if( $updateCount > 1 ) {
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
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
