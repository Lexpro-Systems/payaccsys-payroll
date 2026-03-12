<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // PROVIDENT FUND CONTROLLER CLASS
    //
    
    class ProvidentFund extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to list provident funds
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
                'providentFundName' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'providentFundName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' WHERE (provident_funds.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            // Load all provident_funds from the provident_funds table
            $sqlQuery = 
                'SELECT ' .
                    'provident_funds.id, provident_funds.name AS provident_fund_name, provident_fund_calculation_type_code, employee_amount, ' .
                    'employer_amount, category_factor, is_active, created_on, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'COUNT(provident_fund_members.employee_id) AS enrolled_employees ' .
                'FROM ' .
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_funds.id = provident_fund_members.provident_fund_id ' .
                $whereClause . ' ' .
                'GROUP BY ' .
                    'provident_funds.id, provident_funds.name, provident_fund_calculation_type_code, employee_amount, ' .
                    'employer_amount, category_factor, is_active, created_on, ' .
                    'provident_fund_calculation_types.name ' .
                'ORDER BY ' .
                    'provident_funds.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create provident_funds array
            $providentFunds = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $providentFunds[] = [
                    'id' => $sqlRow['id'],
                    'providentFundName' => $sqlRow['provident_fund_name'],
                    'providentFundCalculationTypeCode' => $sqlRow['provident_fund_calculation_type_code'],
                    'providentFundCalculationTypeName' => $sqlRow['provident_fund_calculation_type_name'],
                    'employeeAmount' => $sqlRow['employee_amount'],
                    'employerAmount' => $sqlRow['employer_amount'],
                    'categoryFactor' => $sqlRow['category_factor'],
                    'isActive' => $sqlRow['is_active'],
                    'createdOn' => $sqlRow['created_on'],
                    'enrolledEmployees' => $sqlRow['enrolled_employees']
                    
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'providentFunds' => $providentFunds]) );
            return true;
        }
        
        // Function to add a provident fund
        //
        // Required Parameters
        //  providentFundName          The name of the provident fund to add
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
                'providentFundName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'providentFundCalculationType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employeeAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'employerAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
                // Optional parameters
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE provident_funds IN EXCLUSIVE MODE;');
            
            // Make certain there isn't already a provident fund with the specified name
            $sqlQuery = 'SELECT id FROM provident_funds WHERE name = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundName']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() >= 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'A provident fund with the name \'' . $data['providentFundName'] . '\' already exists.']) );
                return false;
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO ' .
                    'provident_funds ( ' .
                        'name, ' .
                        'provident_fund_calculation_type_code, ' .
                        'employee_amount, ' .
                        'employer_amount, ' .
                        'category_factor, ' .
                        'is_active, ' .
                        'created_on ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1, $2, $3, $4, $5, $6, $7 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['providentFundName'],                     // name
                $data['providentFundCalculationType'],          // provident_fund_calculation_type_code
                $data['employeeAmount'],                        // employee_amount
                $data['employerAmount'],                        // employer_amount
                0,                                              // category_factor
                true,                                           // is_active
                date("Y-m-d")                                   // created_on
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $providentFundId = $sqlRow['id'];
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'providentFundId' => $providentFundId]) );
            return true;
        }
        
        // Function to check if a provident fund could be removed
        //
        // Required Parameters
        //  providentFundId        The id of the provident fund to delete
        //
        // Optional Parameters
        //  None
        public function checkRemove($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Check employees on provident funds
            $sqlQuery = 'SELECT id FROM provident_fund_members WHERE provident_fund_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'This retirement fund is in use and cannot be removed.']) );
                return false;
            }
            
            // Check if there are any payslips with the provident fund
            $sqlQuery = 'SELECT id FROM payslip_items WHERE provident_fund_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'There are one or more payslip items for the specified retirement fund.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
        }
        
        // Function to remove the specified provident fund
        //
        // Required Parameters
        //  providentFundId        The id of the provident fund to delete
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
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Check if there are any members for the provident fund
            $sqlQuery = 'SELECT id FROM provident_fund_members WHERE provident_fund_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'Members are using the retirement fund.']) );
                return false;
            }
            
            // Check if there are any payslips with the provident fund
            $sqlQuery = 'SELECT id FROM payslip_items WHERE provident_fund_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'There are one or more payslip items for the specified retirement fund.']) );
                return false;
            }
            
            // Delete the specified provident fund
            $sqlQuery = 'DELETE FROM provident_funds WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get all the details of the specified provident fund
        //
        // Required Parameters
        //  providentFundId              The id of the provident fund whose details to get
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
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the provident fund from the provident_funds table
            $sqlQuery = 
                'SELECT ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount ' .
                'FROM ' .
                    'provident_funds ' .
                'WHERE ' .
                    'provident_funds.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the provident fund was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Provident fund \'' . $data['providentFundId'] . '\' not found.']) );
                return false;
            }
            
            // Create provident fund details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $providentFund = [
                'name' => $sqlRow['name'],
                'providentFundCalculationTypeCode' => $sqlRow['provident_fund_calculation_type_code'],
                'employeeAmount' => $sqlRow['employee_amount'],
                'employerAmount' => $sqlRow['employer_amount']
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'providentFund' => $providentFund]) );
            return true;
        }
        
        // Function to to update the specified provident fund's details
        //
        // Required Parameters
        //  providentFundId                The id of the provident fund whose details to update
        //
        // Optional Parameters
        //  providentFundName              The provident fund's name
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'providentFundName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'providentFundCalculationType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'employeeAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => false],
                'employerAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE provident_funds SET ';
            
            if( isset($data['providentFundName']) ) {
                // Make certain there isn't already an apartment with the specified name
                $sqlQuery = 
                    'SELECT id FROM provident_funds WHERE name = $1 AND id != $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['providentFundName'], $data['providentFundId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'A provident fund with the name \'' . $data['providentFundName'] . '\' already exists.']) );
                    return false;
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['providentFundName'];
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'provident_fund_calculation_type_code = $' . $updateCount;
                $updateValues[] = $data['providentFundCalculationType'];
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employee_amount = $' . $updateCount;
                $updateValues[] = $data['employeeAmount'];
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employer_amount = $' . $updateCount;
                $updateValues[] = $data['employerAmount'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['providentFundId'];
            
            // Run the query and get the result
            $updateResult = $db->paramQuery($updateQuery, $updateValues);
            if( !$updateResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
    }
?>
