<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    System::includeFile('NumberMask.php');
    
    
    //
    // EMPLOYEE CONTROLLER CLASS
    //
    
    class LexproAccounting extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to disconnect from the lexpro accounting api
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function listBankAccounts($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE accounting_vendor_id = $1 AND name = \'access_token\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                    $accountingVendorId
                ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accessToken = $sqlRow['value'];
            if ($accessToken === null) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to connect to Lexpro Accounting']) );
                return false;
            }
            
            System::useModule('lexproapi');
            $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
            $apiConnection->setAccessToken($accessToken);
            $result = $apiConnection->checkAccessToken();
            
            $connected = false;
            if (isset($result['valid'])) {
                if ($result['valid']) {
                    if (!$result['error']) {
                        $connected = true;
                    }
                    else {
                        echo (json_encode(['ok' => false, 'error' => $result['error']]));
                        return false;
                    }
                }
            }
            
            if (!$connected) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid access token']) );
                return false;
            }
            
            $result = $apiConnection->listBankAccounts( $apiConnection::BANK_ACCOUNT_BUSINESS );
            
            echo( json_encode(['ok' => true, 'bankList' => $result['bankAccounts']]) );
        }
        
        // Function to disconnect from the lexpro accounting api
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function disconnect($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            
            $sqlQuery =
                'DELETE FROM accounting_vendor_config WHERE name = \'access_token\' AND accounting_vendor_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$accountingVendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
        }
        
        // Function to save the lexpro accounting config
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getLexproAccountingConfig($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Get the accounting vendor id, if any
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'No accounting vendor found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            
            // Get the accounting configuration
            $sqlQuery =
                'SELECT ' .
                    'accounting_vendor_config.id, ' . 
                    'accounting_vendor_config.value, ' . 
                    'accounting_vendor_config.name, ' .
                    'accounting_vendor_config.employee_id ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' . 
                    'accounting_vendor_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$accountingVendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $savedConfigItems = [];
            $accessToken = null;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                if ($sqlRow['name'] === 'access_token') {
                    $accessToken = $sqlRow['value'];
                    continue;
                }
                
                if ($sqlRow['name'] === 'bank') {
                    $savedConfigItems[] = [
                        'name' => 'Bank',
                        'value' => $sqlRow['value'],
                        'employeeId' => null
                    ];
                    continue;
                }
                
                $savedConfigItems[] = [
                    'name' => $sqlRow['name'],
                    'value' => $sqlRow['value'],
                    'employeeId' => $sqlRow['employee_id']
                ];
            }
            
            // Setup default values for item types
            $itemTypes = [];
            $itemTypes[] = [
                'name' => 'includeEmployeeName',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'useSingleSalaryAccount',
                'value' => true,
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'Salary',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'UIF',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'PAYE',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'SDL',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'Fringe Benefits',
                'value' => '',
                'employeeId' => null
            ];
            $itemTypes[] = [
                'name' => 'Bank',
                'value' => '',
                'employeeId' => null
            ];
            
            // Add salary account for each employee to item types
            $sqlQuery = 
                'SELECT ' .
                    'employees.id, ' . 
                    'employees.code, ' . 
                    'employees.last_name, ' . 
                    'employees.alias ' . 
                'FROM ' .
                    'employees ' . 
                'WHERE ' . 
                    'employment_end_date IS NULL OR employment_end_date >= NOW() - INTERVAL \'60 DAYS\' ' .
                'ORDER BY ' . 
                    'COALESCE(employment_end_date, \'1900-01-01\') ASC, ' . 
                    'alias ASC, ' . 
                    'code ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add the employee items
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $itemTypes[] = [
                    'name' => ($sqlRow['alias'] . ' (' . $sqlRow['code'] . ')'),
                    'value' => '',
                    'employeeId' => $sqlRow['id']
                ];
            }
            
            // Connect to the API
            System::useModule('lexproapi');
            $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
            $apiConnection->setAccessToken($accessToken);
            $result = $apiConnection->checkAccessToken();
            $firm = $result['firm'];
            
            // Set the connection status
            $connected = false;
            if( isset($result['valid']) ) {
                if( $result['valid'] ) {
                    if( !$result['error'] ) {
                        $connected = true;
                    }
                    else {
                        echo (json_encode(['ok' => false, 'error' => $result['error']]));
                        return false;
                    }
                }
            }
            
            // Are we not connected?
            if (!$connected) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid access token']) );
                return false;
            }
            
            // Get the account details from the API
            $result = $apiConnection->listAccounts( 'Z', null, $apiConnection::ACCOUNT_ACTIVE);
            $accountList = $result['accounts'];
            
// echo( json_encode(['ok' => false, 'error' => json_encode($result['accounts'])]) );
// return false;
        
//             $firm = $result['firm'];
            
            $configComplete = true;
            $configItems = [];
            
            // Add a config item for the firm details
            $configItems[] = [
                'name' => 'Firm',
                'value' => $firm
            ];
            
            // Determine whether a singe employee account should be used
            $useSingleSalaryAccount = true;
            for( $i=0; $i < count($savedConfigItems); $i++ ) {
                if( $savedConfigItems[$i]['name'] === 'useSingleSalaryAccount' ) {
                    if( $savedConfigItems[$i]['value'] === 'true' ) {
                        $useSingleSalaryAccount = true;
                    }
                    else {
                        $useSingleSalaryAccount = false;
                    }
                    break;
                }
            }
            
            // For every item type
            for ($i=0; $i < count($itemTypes); $i++) {
                // Set the default values
                $value = $itemTypes[$i]['value'];
                $employeeId = $itemTypes[$i]['employeeId'];
                $bankName = '';
                
                // For every config item
                for ($x=0; $x < count($savedConfigItems); $x++) {
                    // Was the correct config item found?
                    if ($savedConfigItems[$x]['name'] === $itemTypes[$i]['name'] ) {
                        // Get the config item value
                        $value = $savedConfigItems[$x]['value'];
                        
                        // Is the value empty?
                        if( $value === '' ) {
                            // Is it an employee account
                            if( $savedConfigItems[$x]['employeeId'] !== null ) {
                                // Should employee accounts be used?
                                if( !$useSingleSalaryAccount ) {
                                    $configComplete = false;
                                }
                            }
                            else {
                                $configComplete = false;
                            }
                        }
                        
                        // Convert certain values to the correct format
                        if ($itemTypes[$i]['name'] === 'includeEmployeeName') {
                            if ($savedConfigItems[$x]['value'] === 'true') {
                                $value = true;
                            }
                            else {
                                $value = false;
                            }
                        }
                        else if ($itemTypes[$i]['name'] === 'useSingleSalaryAccount') {
                            if ($savedConfigItems[$x]['value'] === 'true') {
                                $value = true;
                            }
                            else {
                                $value = false;
                            }
                        }
                        else if ($itemTypes[$i]['name'] === 'Bank') {
                            $result = $apiConnection->getBankAccount((int)$savedConfigItems[$x]['value']);
                            if (!$result['ok']) {
                                $bankName = '';
                                $value = '';
                                continue;
                            }
                            $bankName = $result['bankAccount']['name'];
                        }
                    }
                }
                
                // Is it the bank item?
                if ($itemTypes[$i]['name'] === 'Bank') {
                    // Save the configuration item
                    $configItems[] = [
                        'name' => 'Bank',
                        'value' => $value,
                        'bankName' => $bankName,
                        'employeeId' => $employeeId
                    ];
                }
                else {
                    // Save the configuration item
                    $configItems[] = [
                        'name' => $itemTypes[$i]['name'],
                        'value' => $value,
                        'employeeId' => $employeeId
                    ];
                }
            }
            
            // Return the results
            echo( json_encode([
                'ok' => true,
                'configItems' => $configItems,
                'accountNumbers' => $accountList,
                'configComplete' => $configComplete
            ]) );
        }
        
        // Function to save the lexpro accounting config
        //
        // Required Parameters
        //  data
        
        //
        // Optional Parameters
        //  None
        public function saveLexproAccountingConfig($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Check whether a bank was supplied
            $hasBank = false;
            for($i=0; $i < count($data['configData']); $i++) {
                if( strtolower($data['configData'][$i]['name']) === strtolower('bank') ) {
                    if( $data['configData'][$i]['value'] !== null ) {
                        $hasBank = true;
                    }
                    break;
                }
            }
            
            if( !$hasBank ) {
                echo( json_encode(['ok' => false, 'error' => 'No bank specified.']) );
                return false;
            }
            
            // Get accounting vendor details
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            
            for ($i=0; $i < count($data['configData']); $i++) {
                // Delete the specified item, if it exists
                $sqlQuery =
                    'DELETE FROM accounting_vendor_config WHERE ((name = $1) OR (employee_id IS NOT NULL AND employee_id = $2)) AND accounting_vendor_id = $3;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['configData'][$i]['name'], 
                    $data['configData'][$i]['employeeId'],
                    $accountingVendorId
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Make certain the values are formatted correctly
                $value = $data['configData'][$i]['value'];
                if( ($data['configData'][$i]['name'] === 'includeEmployeeName') || ($data['configData'][$i]['name'] === 'useSingleSalaryAccount') ) {
                    if ($data['configData'][$i]['value']) {
                        $value = 'true';
                    }
                    else {
                        $value = 'false';
                    }
                }
                
                // Save the config item
                $sqlQuery =
                    'INSERT INTO accounting_vendor_config ( ' .
                        'accounting_vendor_id, name, value, employee_id, data ' .
                    ') ' .
                    'VALUES ( ' .
                        ' $1, $2, $3, $4, $5 ' .
                    ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $accountingVendorId,
                    $data['configData'][$i]['name'],
                    $value,
                    $data['configData'][$i]['employeeId'],
                    null
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true]) );
        }
        
        
        // Function to check connect to the lexpro accounting api
        //
        // Required Parameters
        //  bookset
        //  username
        //  password
        //
        // Optional Parameters
        //  None
        public function checkConnection($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Get accounting vendo details
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            $connected = false;
            
            // Get the accounting vendor access token
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE accounting_vendor_id = $1 AND name = \'access_token\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $accountingVendorId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the access toekn found?
            if( $sqlResult->getRowCount() !== 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $accessToken = $sqlRow['value'];
                
                // Use the access token to check the API connection
                System::useModule('lexproapi');
                $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
                $apiConnection->setAccessToken($accessToken);
                $result = $apiConnection->checkAccessToken();
                
                if (isset($result['valid'])) {
                    if ($result['valid']) {
                        if (!$result['error']) {
                            $connected = true;
                        } 
                        else {
                            echo (json_encode(['ok' => false, 'error' => $result['error']]));
                            return false;
                        }
                    }
                }
            }
            
            // Check wether we are using a single salary account
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' . 
                    'accounting_vendor_id = $1 AND ' . 
                    'name = \'useSingleSalaryAccount\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $accountingVendorId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was a result found?
            $useSingleSalaryAccount = false;
            if( $sqlResult->getRowCount() !== 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['value'] == 'true' ) {
                    $useSingleSalaryAccount = true;
                };
            }
            else {
                // Return the result
                echo( json_encode(['ok' => true, 'connected' => $connected, 'configComplete' => false]) );
                return false;
            }
            
            // Get all the configuration values
            $sqlQuery = 'SELECT id, value, name, employee_id FROM accounting_vendor_config WHERE accounting_vendor_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$accountingVendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check whether the config is complete
            $configComplete = true;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Skip the check if it's an employee account and we're using a single salary account
                if( ($useSingleSalaryAccount === true) && ($sqlRow['employee_id'] !== null) ) continue;
                
                // Was no value specified?
                if ($sqlRow['value'] === null || $sqlRow['value'] === '') {
                    // The configuration is incomplete
                    $configComplete = false;
                    break;
                }
            }
            
            // Return the result
            echo( json_encode(['ok' => true, 'connected' => $connected, 'configComplete' => $configComplete]) );
            return true;
        }
        
        // Function to connect to the lexpro accounting api
        //
        // Required Parameters
        //  bookset
        //  username
        //  password
        //
        // Optional Parameters
        //  None
        public function connect($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required Parameters
                'bookset' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'username' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'password' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $accountingVendorId = $sqlRow['id'];
            
            System::useModule('lexproapi');
            $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
            $result = $apiConnection->getAccessToken(
                CONF_LEXPRO_API_ACCESS_KEY,
                $data['bookset'],
                $data['username'],
                $data['password'],
                true
            );
            
            if (!isset($result['accessToken']['token'])) {
                if (isset($result['error'])) {
                    echo (json_encode(['ok' => false, 'error' => $result['error']]));
                    return false;
                }
                else {
                    echo (json_encode(['ok' => false, 'error' => 'Unable to connect to Lexpro Accounting']));
                    return false;
                }
            }
            
            $sqlQuery =
                'DELETE FROM accounting_vendor_config WHERE name = \'access_token\' AND accounting_vendor_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$accountingVendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO ' .
                    'accounting_vendor_config ( ' .
                        'accounting_vendor_id, name, value, data ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1, $2, $3, $4 ' .
                    ') ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $accountingVendorId,
                'access_token',
                $result['accessToken']['token'],
                null
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
        }
        
        // Function to list the accounting export history
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        //  payrunId                The id of the payrun for which to list the export history
        public function getExportHistory($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'payrunId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' WHERE (CAST(accounting_export_history.exported_on AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\'  ) ';
            }
            
            // Was a payrun id filter specified?
            if( $data['payrunId'] !== null ) {
                $sqlParams[] = $data['payrunId'];
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND accounting_export_history.payrun_id = $' . count($sqlParams) . ' ';
                }
                else {
                    $whereClause = ' WHERE accounting_export_history.payrun_id = $' . count($sqlParams) . ' ';
                }
            }
            
            // Get the vendor id for Lexpro Accounting
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $vendorId = $sqlRow['id'];
            
            // Was a vendor id filter specified?
            if( $vendorId !== null ) {
                $sqlParams[] = $vendorId;
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND accounting_export_history.accounting_vendor_id = $' . count($sqlParams) . ' ';
                }
                else {
                    $whereClause = ' WHERE accounting_export_history.accounting_vendor_id = $' . count($sqlParams) . ' ';
                }
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
            
            // Get the export history from the DB
            $sqlQuery = 
                'SELECT ' .
                    'accounting_export_history.id, ' .
                    'accounting_export_history.accounting_vendor_id, ' .
                    'accounting_export_history.payrun_id, ' .
                    'accounting_export_history.exported_on ' .
                'FROM ' .
                    'accounting_export_history ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'accounting_export_history.exported_on ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create export history array
            $exports = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $exports[] = [
                    'id' => $sqlRow['id'],
                    'vendorId' => $sqlRow['accounting_vendor_id'],
                    'payrunId' => $sqlRow['payrun_id'],
                    'exportedOn' => $sqlRow['exported_on'],
                    'transactions' => []
                ];
                
                // Get the export history transaction from the DB
                $sqlTransactionQuery = 
                    'SELECT ' .
                        'accounting_export_transaction_history.id, ' .
                        'accounting_export_transaction_history.accounting_export_history_id, ' .
                        'accounting_export_transaction_history.payslip_id, ' .
                        'accounting_export_transaction_history.type, ' .
                        'accounting_export_transaction_history.account_number, ' .
                        'accounting_export_transaction_history.date, ' .
                        'accounting_export_transaction_history.description, ' .
                        'accounting_export_transaction_history.vat, ' .
                        'accounting_export_transaction_history.bank_account_id, ' .
                        'accounting_export_transaction_history.amount ' .
                    'FROM ' .
                        'accounting_export_transaction_history ' .
                    'WHERE ' . 
                        'accounting_export_history_id = $1 ' .
                    'ORDER BY ' .
                        'accounting_export_transaction_history.id ASC;';
                $sqlTransactionResult = $db->paramQuery($sqlTransactionQuery, [
                    $sqlRow['id']
                ]);
                if( !$sqlTransactionResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                while( $sqlTransactionRow = $sqlTransactionResult->fetchAssociative() ) {
                    $exports[count($exports) - 1]['transactions'][] = [
                        'id' => $sqlTransactionRow['id'],
                        'exportId' => $sqlTransactionRow['accounting_export_history_id'],
                        'payslipId' => $sqlTransactionRow['payslip_id'],
                        'type' => $sqlTransactionRow['type'],
                        'accountNumber' => $sqlTransactionRow['account_number'],
                        'date' => $sqlTransactionRow['date'],
                        'description' => $sqlTransactionRow['description'],
                        'vat' => $sqlTransactionRow['vat'],
                        'bankAccountId' => $sqlTransactionRow['bank_account_id'],
                        'amount' => $sqlTransactionRow['amount']
                    ];
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true,'exports' => $exports]) );
            return true;
        }
        
        // Function to list payrun transactions for lexpro accounting
        //
        // Required Parameters
        //  payrunId        The id of the payrun whose transactions to list
        //
        // Optional Parameters
        //  None
        //
        // Returns
        //  $transactions[] = [
        //      'accountNumber',
        //      'accountName',
        //      'date',
        //      'description',
        //      'reference',
        //      'type',
        //      'bankAccount' => [
        //          'id',
        //          'name'
        //      ],
        //      'vat',
        //      'businessDebit',
        //      'businessCredit',
        //      'trustDebit',
        //      'trustCredit'
        //  ];
        function getTransactionList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the accounting vendor id
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $vendorId = $sqlRow['id'];
            
            // Check wether we are using a single salary account
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' . 
                    'accounting_vendor_id = $1 AND ' . 
                    'name = \'useSingleSalaryAccount\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $vendorId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was a result found?
            $useSingleSalaryAccount = false;
            if( $sqlResult->getRowCount() !== 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['value'] == 'true' ) {
                    $useSingleSalaryAccount = true;
                };
            }
            else {
                // Return the result
                echo( json_encode(['ok' => false, 'error' => 'Lexpro Accounting configuration incomplete.']) );
                return false;
            }
            
            // Get the lexpro accounting API access token
            $sqlQuery =
                'SELECT ' .
                    'accounting_vendor_config.name, ' .
                    'accounting_vendor_config.value, ' .
                    'accounting_vendor_config.employee_id ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' .
                    'accounting_vendor_config.accounting_vendor_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$vendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get access token and check that the configuration is complete
            $accessToken = '';
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Is the config not complete?
                if( $sqlRow['value'] == '' || $sqlRow['value'] === null ) {
                    // Are we using a single salary account and is it an employee account?
                    if( !(($useSingleSalaryAccount === true) && ($sqlRow['employee_id'] !== null)) ) {
                        echo( json_encode(['ok' => false, 'error' => 'Lexpro Accounting configuration incomplete.']) );
                        return false;
                    }
                }
                
                // Set the config values
                if( $sqlRow['name'] === 'access_token' ) {
                    $accessToken = $sqlRow['value'];
                    // break;
                }
            }
            
            // Was no access token found?
            if( $accessToken === '' || $accessToken === null ) {
                echo( json_encode(['ok' => false, 'error' => 'Not connected to Lexpro Accounting. Please connect to Lexpro Accounting in the \'Accounting Setup\' tab of the \'Setup\' section.']) );
                return false;
            }
            
            // Initialise the lexpro API
            System::useModule('lexproapi');
            $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
            $apiConnection->setAccessToken( $accessToken );
            $result = $apiConnection->checkAccessToken();
            if( $result['ok'] != true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Check if the access token is valid
            if( $result['valid'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid access token.']) );
                return false;
            }
            
            // Get a list of Lexpro bank accounts
            $result = $apiConnection->listBankAccounts( $apiConnection::BANK_ACCOUNT_BUSINESS );
            if( $result['ok'] != true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $bankAccounts = $result['bankAccounts'];
            
            // Get a list of Lexpro accounts
            $result = $apiConnection->listAccounts('Z', null, $apiConnection::ACCOUNT_ACTIVE);
            if( $result['ok'] != true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $accounts = $result['accounts'];
            
            // Generate the relevant transactions
            $result = $this->generateLexproTransactions($db, $data['payrunId']);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $transactions = $result['transactions'];
            
            // For every generated transaction
            for( $i = 0; $i < count($transactions); $i++) {
                $transactions[$i]['accountName'] = '';
                $transactions[$i]['bankAccount']['name'] = '';
                
                // Add the account name to the transaction
                for( $j = 0; $j < count($accounts); $j++ ) {
                    if( $transactions[$i]['accountNumber'] === $accounts[$j]['accountNumber'] ) {
                        $transactions[$i]['accountName'] = $accounts[$j]['name'];
                        break;
                    }
                }
                
                // Add the bank account name to the transaction
                for( $j = 0; $j < count($bankAccounts); $j++ ) {
                    if( $transactions[$i]['bankAccount']['id'] === $bankAccounts[$j]['id'] ) {
                        $transactions[$i]['bankAccount']['name'] = $bankAccounts[$j]['name'];
                        break;
                    }
                }
            }
            
            // Return the transactions
            echo( json_encode(['ok' => true, 'transactions' => $transactions]) );
            return true;
        }
        
        // Function to post payrun transactions to lexpro accounting
        //
        // Required Parameters
        //  payrunId        The id of the payrun whose transactions to post
        //  "transactions": [
        //      {
        //          "type":"BUSINESS_CHEQUE",
        //          "accountNumber":"ZF0000",
        //          "date":"2020-01-01",
        //          "description":"Test Transaction",
        //          "vat":"15%",
        //          "bankAccount":{
        //              "id":1
        //          },
        //          "amount":500.0
        //      },
        //  ]
        //
        // Optional Parameters
        //  None
        function post($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'transactions' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                        'accountNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                        'date' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'vat' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'bankAccount' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                            'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        ]],
                        'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            $transactions = $data['transactions'];
            
            // Load the payrun from the payruns table
            $sqlQuery = 
                'SELECT ' .
                    'payruns.description, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date, ' .
                    'payruns.created_on, ' .
                    'payruns.processed_on ' .
                'FROM ' .
                    'payruns ' .
                'WHERE ' .
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                return( ['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.'] );
            }
            
            // Was the payrun NOT processed?
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] == null ) {
                return( ['ok' => false, 'error' => 'The transactions cannot be posted because the specified payrun has not been processed.'] );
            }
            
            // NOTE:
            //
            // Transactions can no longer be generated automatically since the user can change
            // the transaction dates
            //
            // Generate the relevant transactions
            // $result = $this->generateLexproTransactions($db, $data['payrunId']);
            // if( $result['ok'] !== true ) {
            //     echo( json_encode(['ok' => false, 'error' => $result['error']]) );
            //     return false;
            // }
            // $transactions = $result['transactions'];
            
            // Check the dates for all the transactions
            $today = new DateTime();
            foreach( $transactions AS $transaction ) {
                // Convert the current date and transaction date to time values
                $currentTime = strtotime($today->format('Y-m-d'));
                $transactionTime = strtotime($transaction['date']);
                
                // Divide the difference into total number of seconds to get number of days 
                $daysDifference = abs(($transactionTime - $currentTime) / 60 / 60 / 24);
                
                // Is the transaction not within 60 days of the current date?
                if( $daysDifference > 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'The transactions cannot be posted because the post date of one or more of the transactions are not within 60 days of the current date.']) );
                    return false;
                }
            }
            
            // Get the accounting vendor id
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $vendorId = $sqlRow['id'];
            
            // Get the lexpro accounting API access token
            $sqlQuery =
                'SELECT ' .
                    'accounting_vendor_config.name, ' .
                    'accounting_vendor_config.value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' .
                    'accounting_vendor_config.accounting_vendor_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$vendorId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $accessToken = '';
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Is the config not complete?
                if( $sqlRow['value'] == '' || $sqlRow['value'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Lexpro Accounting configuration incomplete.']) );
                    return false;
                }
                
                // Set the config values
                if( $sqlRow['name'] === 'access_token' ) {
                    $accessToken = $sqlRow['value'];
                    break;
                }
            }
            
            // Was no access token found?
            if( $accessToken === '' || $accessToken === null ) {
                echo( json_encode(['ok' => false, 'error' => 'Not connected to Lexpro Accounting. Please connect to Lexpro Accounting in the \'Accounting Setup\' tab of the \'Setup\' section.']) );
                return false;
            }
            
            // Initialise the Lexpro API
            System::useModule('lexproapi');
            $apiConnection = new \LexproApi\Connection(CONF_LEXPRO_API_URL);
            $apiConnection->setAccessToken( $accessToken );
            $result = $apiConnection->checkAccessToken();
            if( $result['ok'] != true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Check if the access token is valid
            if( $result['valid'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid access token.']) );
                return false;
            }
            
            // Post the API transactions
            $result = $apiConnection->postTransaction( $transactions );
            if( $result['ok'] != true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Add entry to the accounting export history
            $sqlQuery = 
                'INSERT INTO accounting_export_history ( ' .
                    'accounting_vendor_id, ' .
                    'payrun_id, ' .
                    'exported_on, ' .
                    'exported_by_user_id ' .
                ') ' .
                'VALUES ( ' .
                    '$1, $2, $3, $4 ' .
                ') ' . 
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $vendorId,                      // accounting_vendor_id
                $payrunId,                      // payrun_id
                date('Y-m-d H:i:s', time()),    // exported_on
                $user['id']                     // exported_by_user_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $exportHistoryId = $sqlRow['id'];
            
            // Save the transaction history
            foreach( $transactions AS $transaction ) {
                $sqlQuery = 
                    'INSERT INTO accounting_export_transaction_history ( ' .
                        'accounting_export_history_id, ' .
                        'payslip_id, ' .
                        'type, ' .
                        'account_number, ' .
                        'date, ' .
                        'description, ' .
                        'vat, ' .
                        'bank_account_id, ' .
                        'amount ' .
                    ') ' .
                    'VALUES ( ' .
                        '$1, $2, $3, $4, $5, $6, $7, $8, $9 ' .
                    ') ' . 
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $exportHistoryId,                   // accounting_export_history_id
                    $transaction['payslipId'],          // payslip_id
                    $transaction['type'],               // type
                    $transaction['accountNumber'],      // account_number
                    $transaction['date'],               // date
                    $transaction['description'],        // description
                    $transaction['vat'],                // vat
                    $transaction['bankAccount']['id'],  // bank_account_id
                    $transaction['amount']              // amount
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        
        //
        // PRIVATE FUNTIONS
        //
        
        // Function to generate all the Lexpro Accounting transactions for a specified payrun
        // 
        //  payrunId            The id of the payrun to generate tranactions for
        // 
        // Returns
        //  $transactions[] = [
        //      'accountNumber',
        //      'date',
        //      'description',
        //      'type',
        //      'bankAccount' => [
        //          'id',
        //      ],
        //      'vat',
        //      'amount'
        //  ];
        private function generateLexproTransactions($db, $payrunId) {
            $postingDate = date('Y-m-d');
            
            // Load the payrun from the payruns table
            $sqlQuery = 
                'SELECT ' .
                    'payruns.description, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date, ' .
                    'payruns.created_on, ' .
                    'payruns.processed_on ' .
                'FROM ' .
                    'payruns ' .
                'WHERE ' .
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                return( ['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.'] );
            }
            
            // Was the payrun NOT processed?
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] == null ) {
                return( ['ok' => false, 'error' => 'The transactions cannot be posted because the specified payrun has not been processed.'] );
            }
            
            // Get the accounting vendor id
            $sqlQuery = 'SELECT id FROM accounting_vendors WHERE name = \'lexpro_accounting\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                return(['ok' => false, 'error' => 'Database error.']);
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $vendorId = $sqlRow['id'];
            
            // Check wether we are using a single salary account
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' . 
                    'accounting_vendor_id = $1 AND ' . 
                    'name = \'useSingleSalaryAccount\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $vendorId
            ]);
            if( !$sqlResult->isValid() ) {
                return(['ok' => false, 'error' => 'Database error.']);
            }
            
            // Was a result found?
            $useSingleSalaryAccount = false;
            if( $sqlResult->getRowCount() !== 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['value'] == 'true' ) {
                    $useSingleSalaryAccount = true;
                };
            }
            else {
                return(['ok' => false, 'error' => 'Lexpro Accounting configuration incomplete.']);
            }
            
            // Get the salary account
            $sqlQuery = 
                'SELECT ' .
                    'value ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' . 
                    'accounting_vendor_id = $1 AND ' . 
                    'name = \'Salary\'';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $vendorId
            ]);
            if( !$sqlResult->isValid() ) {
                return(['ok' => false, 'error' => 'Database error.']);
            }
            
            // Was a result found?
            $lexproSalaryAccount = '';
            if( $sqlResult->getRowCount() !== 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $lexproSalaryAccount = $sqlRow['value'];
            }
            
            // Get the lexpro accounting API config values
            $sqlQuery =
                'SELECT ' .
                    'accounting_vendor_config.name, ' .
                    'accounting_vendor_config.value, ' .
                    'accounting_vendor_config.employee_id ' .
                'FROM ' .
                    'accounting_vendor_config ' .
                'WHERE ' .
                    'accounting_vendor_config.accounting_vendor_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$vendorId]);
            if( !$sqlResult->isValid() ) {
                return(['ok' => false, 'error' => 'Database error.']);
            }
            
            // Generate the transactions
            $lexproBankAccountId = '';
            $lexproUifAccount = '';
            $lexproPayeAccount = '';
            $lexproSdlAccount = '';
            $lexproFringeBenefitAccount = '';
            $includeEmployeeName = false;
            // $useSingleSalaryAccount = true;
            $employeeAccounts = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Is the config not complete?
                if( $sqlRow['value'] == '' || $sqlRow['value'] === null ) {
                    // Are we using a single salary account and is it an employee account?
                    if( !(($useSingleSalaryAccount === true) && ($sqlRow['employee_id'] !== null)) ) {
                        return(['ok' => false, 'error' => 'Lexpro Accounting configuration incomplete.']);
                    }
                }
                
                // Set the config values
                if( $sqlRow['name'] === 'bank' ) {
                    $lexproBankAccountId = (int) $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'Salary' ) {
                    $lexproSalaryAccount = $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'UIF' ) {
                    $lexproUifAccount = $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'PAYE' ) {
                    $lexproPayeAccount = $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'SDL' ) {
                    $lexproSdlAccount = $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'Fringe Benefits' ) {
                    $lexproFringeBenefitAccount = $sqlRow['value'];
                }
                else if( $sqlRow['name'] === 'includeEmployeeName' ) {
                    if( $sqlRow['value'] === 'true' ) {
                        $includeEmployeeName = true;
                    }
                    else {
                        $includeEmployeeName = false;
                    }
                }
                else if( $sqlRow['name'] === 'useSingleSalaryAccount' ) {
                    if( $sqlRow['value'] === 'true' ) {
                        $useSingleSalaryAccount = true;
                    }
                    else {
                        $useSingleSalaryAccount = false;
                    }
                }
                else if( $sqlRow['name'] === 'access_token' ) {
                    continue;
                }
                else if( $sqlRow['employee_id'] !== null ) {
                    $employeeAccounts[] = [
                        'employeeId' => $sqlRow['employee_id'],
                        'accountNumber' => (!$useSingleSalaryAccount ? $sqlRow['value'] : $lexproSalaryAccount)
                    ];
                    continue;
                }
                else {
                    return(['ok' => false, 'error' => 'Unknown Lexpro Accounting configuration value.']);
                }
            }
            
            // Check that all the necesarry accounts are available
            // ...
            
            // Get all the payslips for the payrun
            $sqlQuery =
                'WITH payslip_details AS ( ' .
                    'SELECT ' .
                        'payslips.id AS payslip_id, ' .
                        'payslips.employee_id, ' .
                        'payslips.from_date, ' .
                        'payslips.to_date, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_items.total, ' .
                        'payslip_items.include_in_nett_pay ' .
                    'FROM  ' .
                        'payslips ' .
                    'LEFT JOIN  ' .
                        'payslip_items ON payslip_items.payslip_id = payslips.id ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'WHERE ' .
                        'payslips.status_code = \'ACTI\' AND ' . 
                        'payslips.payrun_id = $1 ' .
                '), ' . 
                'income_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'INCO\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'deduction_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'DEDU\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'contribution_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'CONT\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'fringe_benefit_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'FBEN\' AND ' .
                        'include_in_nett_pay = false ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'nett_pay_fringe_benefit_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'FBEN\' AND ' .
                        'include_in_nett_pay = true ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'allowance_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_category_code = \'ALLO\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'paye_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_item_type_code = \'2000\' OR  ' .
                        'payslip_item_type_code = \'2001\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'employee_uif_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_item_type_code = \'2002\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'employer_uif_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_item_type_code = \'3001\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'sdl_details AS ( ' .
                    'SELECT ' .
                        'payslip_id, ' .
                        'employee_id, ' .
                        'SUM(total) AS total ' .
                    'FROM ' .
                        'payslip_details ' .
                    'WHERE ' .
                        'payslip_item_type_code = \'3002\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                ') ' .
                'SELECT ' .
                    'payslips.id AS payslip_id, ' .
                    'payslips.to_date AS payslip_end_date, ' .
                    'payslips.employee_id, ' .
                    'employees.full_names, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.email_address, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS total_income, ' .
                    'CAST(COALESCE(deduction_details.total, 0) AS FLOAT) AS total_deductions, ' .
                    'CAST(COALESCE(contribution_details.total, 0) AS FLOAT) AS total_contributions, ' .
                    'CAST(COALESCE(fringe_benefit_details.total, 0) AS FLOAT) AS total_fringe_benefits, ' .
                    'CAST(COALESCE(nett_pay_fringe_benefit_details.total, 0) AS FLOAT) AS total_nett_pay_fringe_benefits, ' .
                    'CAST(COALESCE(allowance_details.total, 0) AS FLOAT) AS total_allowances, ' .
                    'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                    'CAST(COALESCE(employee_uif_details.total, 0) AS FLOAT) AS total_employee_uif, ' .
                    'CAST(COALESCE(employer_uif_details.total, 0) AS FLOAT) AS total_employer_uif, ' .
                    'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl, ' .
                    'CAST(COALESCE(income_details.total, 0) - COALESCE(deduction_details.total,0) + COALESCE(allowance_details.total,0) + COALESCE(nett_pay_fringe_benefit_details.total,0) AS FLOAT) AS nett_income ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'income_details ON income_details.payslip_id = payslips.id AND ' .
                        'income_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'deduction_details ON deduction_details.payslip_id = payslips.id AND ' .
                        'deduction_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'contribution_details ON contribution_details.payslip_id = payslips.id AND ' .
                        'contribution_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'fringe_benefit_details ON fringe_benefit_details.payslip_id = payslips.id AND ' .
                        'fringe_benefit_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'nett_pay_fringe_benefit_details ON nett_pay_fringe_benefit_details.payslip_id = payslips.id AND ' .
                        'nett_pay_fringe_benefit_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'allowance_details ON allowance_details.payslip_id = payslips.id AND ' .
                        'allowance_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'paye_details ON paye_details.payslip_id = payslips.id AND ' .
                        'paye_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employee_uif_details ON employee_uif_details.payslip_id = payslips.id AND ' .
                        'employee_uif_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employer_uif_details ON employer_uif_details.payslip_id = payslips.id AND ' .
                        'employer_uif_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'sdl_details ON sdl_details.payslip_id = payslips.id AND ' .
                        'sdl_details.employee_id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' . 
                    'payslips.payrun_id = $1 ' .
                'ORDER BY ' .
                    ' employees.alias ASC, payslips.to_date ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                return(['ok' => false, 'error' => 'Database error.']);
            }
            
            // For every employee in the payrun
            $transactions = [];
            $uifTotal = 0.00;
            $payeTotal = 0.00;
            $sdlTotal = 0.00;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Set the description for salaries
                $salaryDescription = 'Salary';
                if( $includeEmployeeName ) {
                    $salaryDescription = $salaryDescription . ': ' . $sqlRow['alias'];
                }
                
                // Calculate the payment date
                $paymentDate = new DateTime( $sqlRow['payslip_end_date'] );
                $paymentDay = $sqlRow['payment_day'];
                
                // Is the payment period monthly?
                if( $sqlRow['payment_period_code'] === 'MONT' ) {
                    // Is payment day NOT the last day of the month?
                    if( intval($paymentDay) >= 1 && intval($paymentDay) <= 28 ) {
                        // Payslips runs to the given day (1 - 28)
                        $paymentDate->setDate(intval($paymentDate->format('Y')), intval($paymentDate->format('m')), $paymentDay);
                    }
                    else {
                        // Payslips are running from the first day of the month to the last day of the month
                        $paymentDate->setDate(intval($paymentDate->format('Y')), intval($paymentDate->format('m')), 1);
                        $paymentDate->setDate(intval($paymentDate->format('Y')), intval($paymentDate->format('m')), intval($paymentDate->format('t')));
                    }
                    
                    // Is the payment date before the payslip end date?
                    if( $paymentDate->format('Y-m-d') < $sqlRow['payslip_end_date'] ) {
                        // Payment happens in following month
                        $paymentDate->setDate(intval($paymentDate->format('Y')), intval($paymentDate->format('m')) + 1, intval($paymentDate->format('d')));
                    }
                }
                // Is the payment period weekly?
                else if( $sqlRow['payment_period_code'] === 'WEEK' ) {
                    // ...
                }
                // Is the payment period bi-weekly?
                else if( $sqlRow['payment_period_code'] === 'BWEE' ) {
                    // ...
                }
                
                // Are we not using a single salary account?
                $employeeSalaryAccount = $lexproSalaryAccount;
                if( !$useSingleSalaryAccount ) {
                    // Try to find the appropriate account
                    for( $i = 0; $i < count($employeeAccounts); $i++ ) {
                        if( $sqlRow['employee_id'] == $employeeAccounts[$i]['employeeId'] ) {
                            $employeeSalaryAccount = $employeeAccounts[$i]['accountNumber'];
                            break;
                        }
                    }
                }
                
                // Is there nett income to post?
                if( (float)$sqlRow['nett_income'] > 0.009 ) {
                    $transactions[] = [
                        'payslipId' => $sqlRow['payslip_id'],
                        'accountNumber' => $employeeSalaryAccount,
                        'date' => $paymentDate->format('Y-m-d'),
                        'description' => $salaryDescription,
                        'type' => 'BUSINESS_CHEQUE',
                        'bankAccount' => [
                            'id' => $lexproBankAccountId
                        ],
                        'vat' => '0%',
                        'amount' => $sqlRow['nett_income']
                    ];
                }
                
                // NOTE:
                //
                // Don't post fringe benefits for the moment until we can figure out which fringe benefits
                // to post, if any.
                //
                
                // $fringeBenefitDescription = 'Fringe Benefits';
                // if( $includeEmployeeName ) {
                //     $fringeBenefitDescription = $fringeBenefitDescription . ': ' . $sqlRow['alias'];
                // }
                
                // Are there fringe benefits to post?
                // if( (float)$sqlRow['total_fringe_benefits'] > 0.009 ) {
                //     $transactions[] = [
                //         'accountNumber' => $lexproFringeBenefitAccount,
                //         'date' => $postingDate,
                //         'description' => $fringeBenefitDescription,
                //         'reference' => 'Lexpro Payroll',
                //         'type' => 'BUSINESS_CHEQUE',
                //         'bankAccount' => [
                //             'id' => $lexproBankAccountId
                //         ],
                //         'businessDebit' => $sqlRow['total_fringe_benefits'],
                //         'businessCredit' => 0.0,
                //         'trustDebit' => 0.0,
                //         'trustCredit' => 0.0
                //     ];
                // }
                
                // Add UIF, PAYE, and SDL totals
                $uifTotal = $uifTotal + (float)$sqlRow['total_employer_uif'] + (float)$sqlRow['total_employee_uif'];
                $payeTotal = $payeTotal + (float)$sqlRow['total_paye'];
                $sdlTotal = $sdlTotal + (float)$sqlRow['total_sdl'];
            }
            
            // Add transactions for UIF total, if any
            if( $uifTotal > 0.009 ) {
                $transactions[] = [
                    'payslipId' => null,
                    'accountNumber' => $lexproUifAccount,
                    'date' => $postingDate,
                    'description' => 'UIF',
                    'type' => 'BUSINESS_CHEQUE',
                    'bankAccount' => [
                        'id' => $lexproBankAccountId
                    ],
                    'vat' => '0%',
                    'amount' => $uifTotal
                ];
            }
                
            // Add transactions for PAYE total
            if( $payeTotal > 0.009 ) {
                $transactions[] = [
                    'payslipId' => null,
                    'accountNumber' => $lexproPayeAccount,
                    'date' => $postingDate,
                    'description' => 'PAYE',
                    'type' => 'BUSINESS_CHEQUE',
                    'bankAccount' => [
                        'id' => $lexproBankAccountId
                    ],
                    'vat' => '0%',
                    'amount' => $payeTotal
                ];
            }
            
            // Add transactions for SDL total, if any
            if( $sdlTotal > 0.009 ) {
                $transactions[] = [
                    'payslipId' => null,
                    'accountNumber' => $lexproSdlAccount,
                    'date' => $postingDate,
                    'description' => 'SDL',
                    'type' => 'BUSINESS_CHEQUE',
                    'bankAccount' => [
                        'id' => $lexproBankAccountId
                    ],
                    'vat' => '0%',
                    'amount' => $sdlTotal
                ];
            }
            
            return( ['ok' => true, 'transactions' => $transactions] );
        }
    }
?>
