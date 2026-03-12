<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    
    
    //
    // BOOKSET CONTROLLER CLASS
    //
    
    class Employee extends Controller {
        
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
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'hasPassword' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlParams = [];
            $whereClause = '';
            
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
                $whereClause = $whereClause . ' (employee_accounts.first_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (employee_accounts.last_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . ' (employee_accounts.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
                $whereClause = $whereClause . ' ) ';
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
                    $whereClause = $whereClause . '(LENGTH(employee_accounts.password) > 0 AND employee_accounts.password IS NOT NULL) ';
                }
                else {
                    $whereClause = $whereClause . '(LENGTH(employee_accounts.password) <= 0 OR employee_accounts.password IS NULL) ';
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
                            $column = 'employee_accounts.created_on';
                            break;
                        case 'name':
                            $column = '(employee_accounts.first_name || employee_accounts.last_name)';
                            break;
                        case 'emailAddress':
                            $column = 'employee_accounts.email_address';
                            break;
                        case 'hasPassword':
                            $column = '(CASE WHEN (LENGTH(employee_accounts.password) > 0 AND employee_accounts.password IS NOT NULL) THEN 1 ELSE 0 END)';
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
            
            // Load all companies from the companies table
            $sqlQuery = 
                'SELECT ' .
                    'employee_accounts.id, ' .
                    'employee_accounts.first_name, ' .
                    'employee_accounts.last_name, ' .
                    'employee_accounts.email_address, ' .
                    'employee_accounts.password, ' .
                    'employee_accounts.created_on ' .
                'FROM ' .
                    'employee_accounts ' .
                $whereClause . ' ' .
                $sortClause . ' ' . 
                // 'ORDER BY ' .
                //     'employee_accounts.first_name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employeeAccounts array
            $employeeAccounts = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $hasPassword = 'Yes';
                if ($sqlRow['password'] === '' || $sqlRow['password'] === null) {
                    $hasPassword = 'No';
                }
                
                $employeeAccounts[] = [
                    'id' => $sqlRow['id'],
                    'firstName' => $sqlRow['first_name'],
                    'lastName' => $sqlRow['last_name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'hasPassword' => $hasPassword,
                    'createdOn' => substr($sqlRow['created_on'], 0, 10) 
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'employeeAccounts' => $employeeAccounts
            ]) );
            
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
                'employeeAccountId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlQuery = 
                'SELECT ' .
                    'employee_account_id, ' .
                    'employee_profile_id, ' .
                    'granted_on, ' .
                    'revoked, ' .
                    'revoked_on, ' .
                    'companies.name AS company_name, ' .
                    'employee_profiles.id_number, ' .
                    'employee_profiles.passport_number ' .
                'FROM ' .
                    'employee_account_employee_profile_access ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_account_employee_profile_access.employee_profile_id ' .
                'LEFT JOIN ' .
                    'companies ON companies.id = employee_profiles.company_id ' .
                'WHERE ' .
                    'employee_account_employee_profile_access.employee_account_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeAccountId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $profileAccess = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $profileAccess[] = [
                    'employeeAccountId' => $sqlRow['employee_account_id'],
                    'employeeProfileId' => $sqlRow['employee_profile_id'],
                    'grantedOn' => substr($sqlRow['granted_on'], 0, 10),
                    'revoked' => $sqlRow['revoked'],
                    'revokedOn' => $sqlRow['revoked_on'],
                    'companyName' => $sqlRow['company_name'],
                    'idNumber' => $sqlRow['id_number'],
                    'passportNumber' => $sqlRow['passport_number']
                ];
            }
            
            $sqlQuery = 
                'SELECT ' .
                    'employee_profile_verification_codes.id, employee_account_id, employee_profile_id, code, ' .
                    'id_number, passport_number, email_address ' .
                'FROM ' .
                    'employee_profile_verification_codes ' .
                'LEFT JOIN ' .
                    'employee_profiles ON employee_profiles.id = employee_profile_verification_codes.employee_profile_id ' .
                'WHERE ' .
                    'employee_profile_verification_codes.employee_account_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeAccountId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $verification = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $verification[] = [
                    'id' => $sqlRow['id'],
                    'employeeAccountId' => $sqlRow['employee_account_id'],
                    'employeeProfileId' => $sqlRow['employee_profile_id'],
                    'code' => $sqlRow['code'],
                    'idNumber' => $sqlRow['id_number'],
                    'passportNumber' => $sqlRow['passport_number'],
                    'emailAddress' => $sqlRow['email_address']
                ];
            }
            
            $sqlQuery = 
                'SELECT ' .
                    'employee_accounts.id, ' .
                    'employee_accounts.first_name, ' .
                    'employee_accounts.last_name, ' .
                    'employee_accounts.email_address, ' .
                    'employee_accounts.password, ' .
                    'employee_accounts.created_on ' .
                'FROM ' .
                    'employee_accounts ' .
                'WHERE ' .
                    'employee_accounts.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeAccountId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $employeeAccount = [
                'id' => $sqlRow['id'],
                'firstName' => $sqlRow['first_name'],
                'lastName' => $sqlRow['last_name'],
                'emailAddress' => $sqlRow['email_address'],
                'password' => $sqlRow['password'],
                'createdOn' => $sqlRow['created_on'],
                'profileAccess' => $profileAccess,
                'verification' => $verification
                
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'employeeAccount' => $employeeAccount
            ]) );
            
            return true;
        }
        
        // Function to to update the specified company's details
        //
        // Required Parameters
        //  id                The id of the company whose details to update
        //
        // Optional Parameters
        //  companyName                 The name of the company for which to add a company
        //  companyAlias                The alias of the company for which to add a company
        //  companyContactPerson        The company contact person
        //  companyContactNumber        The company contact number
        //  companyContactEmail         The company contact email adress
        //  companyIsActive             Whether the company is active (true / false)
        //  databaseSchema              The name of the database schema to create
        //  databaseName                The database name, if any
        //  databaseHost                The database host, if any
        //  consultantId                The consulatnt linked to the company (if any)
        //  groups                      A list of admin group ids that have access to the company
        //                                  groups :[
        //                                      'id' =>  // admin group id
        //                                  ]
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeAccountId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'firstName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'lastName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'email' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE employee_accounts SET ';
            
            if( isset($data['firstName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'first_name = $' . $updateCount;
                $updateValues[] = $data['firstName'];
            }
            
            if( isset($data['lastName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'last_name = $' . $updateCount;
                $updateValues[] = $data['lastName'];
            }
            
            if( isset($data['email']) ) {
                // Check if an account with the email address already exists
                $sqlQuery = 'SELECT id FROM employee_accounts WHERE LOWER(email_address) = LOWER($1) AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['email'], $data['employeeAccountId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // If the rowcount is not null then the account already exists
                if( $sqlResult->getRowCount() !== 0 ) {
                    echo( json_encode(['ok' => false, 'error' => 'There is another account with the specified email address.']) );
                    return false;
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['email'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['employeeAccountId'];
            
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
    }
?>
