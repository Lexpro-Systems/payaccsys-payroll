<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    
    //
    // LEAVE CONTROLLER CLASS
    //
    
    class Leave extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [
            'getSentRequest',
            'updateSentRequestStatus'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get a leave balances
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getBalances($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $fromDate = date("Y-m-d", strtotime("-1 months"));
            $toDate = date('Y-m-d');
            
            // Get the leave data
            $leaveData = \LeaveUtil\getLeaveBalances( 
                $user['employeeId'], 
                $fromDate, 
                $toDate, 
                null, 
                $db 
            );
            
            // Set the leave balances
            $balances = [];
            foreach($leaveData as $key => $value) {
                $balances[] = [
                    'leaveType' => $key,
                    'leaveTypeId' => $leaveData[$key]['id'],
                    'balance' => $leaveData[$key]['balance'],
                    'unit' => $leaveData[$key]['unit']
                ];
            }
            
            // Sort the balances array
            array_multisort(array_column($balances, 'leaveType'),  SORT_ASC,
                array_column($balances, 'balance'), SORT_ASC,
                $balances);
                
            // Send result
            echo( json_encode(['ok' => true,'balances' => $balances]) );
            return true;
        }
        
        // Function to get a leave type from its ID.
        //
        // Required Parameters
        //  leaveTypeId             The ID of the leave type to get.
        //
        // Optional Parameters
        //  None
        public function getType($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the leave type details
            $sqlQuery = 
                'SELECT ' . 
                    'id, leave_types.name, leave_unit_code, leave_units.name AS leave_unit_name, start_date '.
                'FROM ' . 
                    'leave_types '.
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_unit_code ' .
                'WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the leave type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave type with id ' . $data['leaveTypeId'] . ' not found.']) );
                return false;
            }
            
            // Store leave type details
            $sqlRow = $sqlResult->fetchAssociative();
            $leaveTypeName = $sqlRow['name'];
            $leaveUnitCode = $sqlRow['leave_unit_code'];
            $leaveUnitName = $sqlRow['leave_unit_name'];
            $leaveStartDate = $sqlRow['start_date'];
            
            // Load all rules for the leave type.
            $sqlQuery =
                'SELECT ' .
                    'id, leave_type_id, start_month, accrual_interval, ' .
                    'leave_accrual_type_code, amount, ' .
                    'reset_accrued, reset_taken ' .
                'FROM ' .
                    'leave_type_rules ' .
                'WHERE ' .
                    'leave_type_id = $1 ' .
                'ORDER BY ' .
                    'start_month ASC;';
                
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $leaveTypeRules = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Add the rule to the leaveType
                $leaveTypeRules[] = [
                    'id' => $sqlRow['id'],
                    'startMonth' => $sqlRow['start_month'],
                    'accrualInterval' => $sqlRow['accrual_interval'],
                    'accrualType' => [
                        'code' => $sqlRow['leave_accrual_type_code']
                    ],
                    'amount' => $sqlRow['amount'],
                    'resetAccrued' => $sqlRow['reset_accrued'],
                    'resetTaken' => $sqlRow['reset_taken']
                ];
            }
            
            $leaveType = [
                'id' => $data['leaveTypeId'],
                'name' => $leaveTypeName,
                'leaveUnitCode' => $leaveUnitCode,
                'leaveUnitName' => $leaveUnitName,
                'startDate' => $leaveStartDate,
                'rules' => $leaveTypeRules
            ];
            
            // Send result
            echo( json_encode(['ok' => true,'leaveType' => $leaveType]) );
            return true;
        }
        
        // Function to get leave types.
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getTypeList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, []);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load all available types
            $sqlQuery = 'SELECT id, name, leave_unit_code FROM leave_types WHERE leave_types.is_deleted IS FALSE ORDER BY name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $leaveTypes = [];
            while( $row = $sqlResult->fetchAssociative() ) {
                $leaveTypes[] = [
                    'id' => $data['leaveTypeId'],
                    'name' => $row['name'],
                    'leaveUnitCode' => $row['leave_unit_code'],
                    'rules' => []
                ];
            }
            
            // Load all employees
            $sqlQuery =
                'SELECT ' .
                    'id, leave_type_id, start_month, accrual_interval, ' .
                    'leave_accrual_type_code, amount, ' .
                    'reset_accrued, reset_taken ' .
                'FROM ' .
                    'leave_type_rules ' .
                'ORDER BY ' .
                    'leave_type_id ASC, start_month ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $leaveTypeIndex = null;
                for( $i = 0; $i < count($leaveTypes); $i++ ) {
                    if( $leaveTypes[$i]['id'] === $sqlRow['leave_type_id'] ) {
                        $leaveTypeIndex = $i;
                        break;
                    }
                }
                
                // If leaveTypeIndex is null then the rule was not in the leaveTypes array.
                if( $leaveTypeIndex === null ) continue;
                
                // Add the rule to the leaveType
                $leaveTypes[$leaveTypeIndex]['rules'][] = [
                    'id' => $sqlRow['id'],
                    'startMonth' => $sqlRow['start_month'],
                    'accrualInterval' => $sqlRow['accrual_interval'],
                    'accrualType' => [
                        'code' => $sqlRow['leave_accrual_type_code']
                    ],
                    'amount' => $sqlRow['amount'],
                    'resetAccrued' => $sqlRow['reset_accrued'],
                    'resetTaken' => $sqlRow['reset_taken']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true,'leaveTypes' => $leaveTypes]) );
            return true;
        }
        
        // Function to the leave history of a given leave type
        //
        // Required Parameters
        //  leaveTypeId             The ID of the leave type to get.
        //
        // Optional Parameters
        //  None
        public function getTypeHistory($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'startDate' => null,
                'endDate' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set default start and end date
            $startDate = $data['startDate'];
            if( $startDate === null ) $startDate = '1900-01-01';
            $endDate = $data['endDate'];
            if( $endDate === null ) $endDate = date('Y-m-d');
            
            // Load the leave type details
            $sqlQuery = 
                'SELECT ' . 
                    'id, leave_types.name, leave_unit_code, leave_units.name AS leave_unit_name, start_date '.
                'FROM ' . 
                    'leave_types '.
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_unit_code ' .
                'WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the leave type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave type with id ' . $data['leaveTypeId'] . ' not found.']) );
                return false;
            }
            
            // Store leave type details
            $sqlRow = $sqlResult->fetchAssociative();
            $leaveTypeName = $sqlRow['name'];
            $leaveUnitCode = $sqlRow['leave_unit_code'];
            $leaveUnitName = $sqlRow['leave_unit_name'];
            $leaveStartDate = $sqlRow['start_date'];
            $startingBalance = 0.0;
                    
            // Check if the employee is subscribed to the leave type
            $leaveConfigQuery = 'SELECT id FROM leave_config_items WHERE employee_id = $1 AND leave_type_id = $2;';
            $leaveConfigResult = $db->paramQuery($leaveConfigQuery, [
                $user['employeeId'], 
                $data['leaveTypeId']
            ]);
            if( !$leaveConfigResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $isSubscribed = false;
            if( $leaveConfigResult->getRowCount() > 0 ) {
                $isSubscribed = true;
            }
            
            // if( $balanceResult->getRowCount() > 10 ) {
                if ($leaveUnitCode === 'DAYS') {
                    $balanceQuery = 
                        'SELECT ' . 
                            'SUM(days) AS days '.
                        'FROM ' . 
                            'leave '.
                        'WHERE ' . 
                            'id NOT IN ( ' . 
                                'SELECT id FROM leave WHERE employee_id = $1 AND leave_type_id = $2 AND date >= $3 AND date <= $4 ORDER BY id DESC ' . 
                            ') AND '.
                            'employee_id = $1 AND ' . 
                            'leave_type_id = $2 AND ' . 
                            'date < $3';
                    $balanceResult = $db->paramQuery($balanceQuery, [
                        $user['employeeId'], 
                        $data['leaveTypeId'],
                        $startDate,
                        $endDate
                    ]);
                    if( !$balanceResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $startingBalance = $balanceResult->fetchAssociative();
                    $startingBalance = $startingBalance['days'];
                }
                else if ($leaveUnitCode === 'HOUR') {
                    $balanceQuery =
                        'SELECT ' .
                            'SUM(hours) AS hours ' .
                        'FROM ' .
                            'leave ' .
                        'WHERE ' .
                            'id NOT IN ( ' . 
                                'SELECT id FROM leave WHERE employee_id = $1 AND leave_type_id = $2 AND date >= $3 AND date <= $4 ORDER BY id DESC ' . 
                            ') AND ' .
                            'employee_id = $1 AND ' . 
                            'leave_type_id = $2 AND ' . 
                            'date < $3';
                    $balanceResult = $db->paramQuery($balanceQuery, [
                        $user['employeeId'], 
                        $data['leaveTypeId'],
                        $startDate,
                        $endDate
                    ]);
                    if( !$balanceResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $startingBalance = $balanceResult->fetchAssociative();
                    $startingBalance = $startingBalance['hours'];
                }
            // }
            // else {
            //     $startingBalance = 0.0;
            // }
            
            if( $startingBalance === null ) $startingBalance = 0.00;
            
            $leave = [];
            $leaveTypes[] = [
                'id' => $data['leaveTypeId'],
                'isSubscribed' => $isSubscribed,
                'name' => $leaveTypeName,
                'leaveUnitCode' => $leaveUnitCode,
                'leaveUnitName' => $leaveUnitName,
                'startingBalance' => $startingBalance,
                'leave' => []
            ];
            
            $lastRowSqlQuery =
                'WITH last_rows AS ( ' .
                    'SELECT ' .
                        'leave.id AS last_rows_leave_id, leave_config_items.id, leave_config_items.leave_type_id, ' .
                        'leave_action_code, hours, days, date, leave_source_type_code, leave.description, ' .
                        'leave_actions.name AS leave_actions_name, leave_source_types.name AS leave_source_types_name ' .
                    'FROM ' .
                        'leave_config_items ' .
                    'LEFT JOIN ' .
                        'leave ON leave.leave_type_id = leave_config_items.leave_type_id AND '.
                            'leave.employee_id = leave_config_items.employee_id ' .
                    'LEFT JOIN ' .
                        'leave_actions ON leave_action_code = leave_actions.code ' .
                    'LEFT JOIN ' .
                        'leave_source_types ON leave_source_type_code = leave_source_types.code ' .
                    'WHERE ' .
                        'leave_config_items.leave_type_id = $1 AND ' . 
                        'leave_config_items.employee_id = $2 AND ' .
                        'date >= $3 AND ' .
                        'date <= $4 ' .
                    'ORDER BY ' .
                        'leave.id DESC ' .
                        // 'LIMIT 10 ' .
                ')' .
                'SELECT * FROM last_rows ORDER BY date ASC, last_rows_leave_id ASC ';
            $lastRowSqlResult = $db->paramQuery($lastRowSqlQuery, [
                $data['leaveTypeId'], 
                $user['employeeId'],
                $startDate,
                $endDate
            ]);
            if( !$lastRowSqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $balance = 0.0;
            $firstRun = true;
            while( $sqlRow = $lastRowSqlResult->fetchAssociative() ) {
                $leaveTypeIndex = null;
                for( $i = 0; $i < count($leaveTypes); $i++ ) {
                    if( $leaveTypes[$i]['id'] === $sqlRow['leave_type_id'] ) {
                        $leaveTypeIndex = $i;
                        break;
                    }
                }
                
                // If leaveTypeIndex is null then the rule was not in the leaveTypes array.
                if( $leaveTypeIndex === null ) continue;
                
                if ($leaveTypes[$leaveTypeIndex]['leaveUnitCode'] === 'DAYS') {
                    $unit = $sqlRow['days'];
                }
                else if ($leaveTypes[$leaveTypeIndex]['leaveUnitCode'] === 'HOUR') {
                    $unit = $sqlRow['hours'];
                }
                
                if ($firstRun) {
                    $balance = $leaveTypes[$leaveTypeIndex]['startingBalance'];
                    $firstRun = false;
                }
                
                $balance = floatval($balance) + floatval($unit);
                
                $leave[] = [
                    'id' => $sqlRow['id'],
                    'leaveActionName'  => $sqlRow['leave_actions_name'],
                    'leaveActionCode' => $sqlRow['leave_action_code'],
                    'leaveUnitCode' => $leaveUnitCode,
                    'hours' => floatval($sqlRow['hours']),
                    'days' => floatval($sqlRow['days']),
                    'balance' => floatval($balance),
                    'date' => $sqlRow['date'],
                    'leaveSourceTypeCode' => $sqlRow['leave_source_type_code'],
                    'leaveSourceTypesName' => $sqlRow['leave_source_types_name'],
                    'description' => $sqlRow['description']
                ];
            }
            
            // Is the employee subscribed, but there is no leave to display?
            if( $isSubscribed && ($lastRowSqlResult->getRowCount() <= 0) ) {
                // Display the balance
                $leave[] = [
                    'id' => null,
                    'leaveActionName'  => null,
                    'leaveActionCode' => null,
                    'leaveUnitCode' => $leaveUnitCode,
                    'hours' => 0,
                    'days' => 0,
                    'balance' => $startingBalance,
                    'date' => $startDate,
                    'leaveSourceTypeCode' => null,
                    'leaveSourceTypesName' => null,
                    'description' => 'Balance'
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true,'leave' => $leave]) );
            return true;
        }
        
        
        // Function to export the attendance history to file
        //
        // Required Parameters
        //  format                  The format in which the file should be exported (xls or csv)
        //  startDate               The start date of the history to export
        //  endDate                 The end date of the history to export
        //
        // Optional Parameters
        //  searchString            A search string to limit the results of the export
        public function exportTypeHistory($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'startDate' => null,
                'endDate' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set default start and end date
            $startDate = $data['startDate'];
            if( $startDate === null ) $startDate = '1900-01-01';
            $endDate = $data['endDate'];
            if( $endDate === null ) $endDate = date('Y-m-d');
            
            // Load the leave type details
            $sqlQuery = 
                'SELECT ' . 
                    'id, leave_types.name, leave_unit_code, leave_units.name AS leave_unit_name, start_date '.
                'FROM ' . 
                    'leave_types '.
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_unit_code ' .
                'WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the leave type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave type with id ' . $data['leaveTypeId'] . ' not found.']) );
                return false;
            }
            
            // Store leave type details
            $sqlRow = $sqlResult->fetchAssociative();
            $leaveTypeName = $sqlRow['name'];
            $leaveUnitCode = $sqlRow['leave_unit_code'];
            $leaveUnitName = $sqlRow['leave_unit_name'];
            $leaveStartDate = $sqlRow['start_date'];
            $startingBalance = 0.0;
                    
            // Check if the employee is subscribed to the leave type
            $leaveConfigQuery = 'SELECT id FROM leave_config_items WHERE employee_id = $1 AND leave_type_id = $2;';
            $leaveConfigResult = $db->paramQuery($leaveConfigQuery, [
                $user['employeeId'], 
                $data['leaveTypeId']
            ]);
            if( !$leaveConfigResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $isSubscribed = false;
            if( $leaveConfigResult->getRowCount() > 0 ) {
                $isSubscribed = true;
            }
            
            // if( $balanceResult->getRowCount() > 10 ) {
                if ($leaveUnitCode === 'DAYS') {
                    $balanceQuery = 
                        'SELECT ' . 
                            'SUM(days) AS days '.
                        'FROM ' . 
                            'leave '.
                        'WHERE ' . 
                            'id NOT IN ( ' . 
                                'SELECT id FROM leave WHERE employee_id = $1 AND leave_type_id = $2 AND date >= $3 AND date <= $4 ORDER BY id DESC ' . 
                            ') AND '.
                            'employee_id = $1 AND ' . 
                            'leave_type_id = $2 AND ' . 
                            'date < $3';
                    $balanceResult = $db->paramQuery($balanceQuery, [
                        $user['employeeId'], 
                        $data['leaveTypeId'],
                        $startDate,
                        $endDate
                    ]);
                    if( !$balanceResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $startingBalance = $balanceResult->fetchAssociative();
                    $startingBalance = $startingBalance['days'];
                }
                else if ($leaveUnitCode === 'HOUR') {
                    $balanceQuery =
                        'SELECT ' .
                            'SUM(hours) AS hours ' .
                        'FROM ' .
                            'leave ' .
                        'WHERE ' .
                            'id NOT IN ( ' . 
                                'SELECT id FROM leave WHERE employee_id = $1 AND leave_type_id = $2 AND date >= $3 AND date <= $4 ORDER BY id DESC ' . 
                            ') AND ' .
                            'employee_id = $1 AND ' . 
                            'leave_type_id = $2 AND ' . 
                            'date < $3';
                    $balanceResult = $db->paramQuery($balanceQuery, [
                        $user['employeeId'], 
                        $data['leaveTypeId'],
                        $startDate,
                        $endDate
                    ]);
                    if( !$balanceResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $startingBalance = $balanceResult->fetchAssociative();
                    $startingBalance = $startingBalance['hours'];
                }
            // }
            // else {
            //     $startingBalance = 0.0;
            // }
            
            if( $startingBalance === null ) $startingBalance = 0.00;
            
            $leave = [];
            $leaveTypes[] = [
                'id' => $data['leaveTypeId'],
                'isSubscribed' => $isSubscribed,
                'name' => $leaveTypeName,
                'leaveUnitCode' => $leaveUnitCode,
                'leaveUnitName' => $leaveUnitName,
                'startingBalance' => $startingBalance,
                'leave' => []
            ];
            
            $lastRowSqlQuery =
                'WITH last_rows AS ( ' .
                    'SELECT ' .
                        'leave.id AS last_rows_leave_id, leave_config_items.id, leave_config_items.leave_type_id, ' .
                        'leave_action_code, hours, days, date, leave_source_type_code, leave.description, ' .
                        'leave_actions.name AS leave_actions_name, leave_source_types.name AS leave_source_types_name ' .
                    'FROM ' .
                        'leave_config_items ' .
                    'LEFT JOIN ' .
                        'leave ON leave.leave_type_id = leave_config_items.leave_type_id AND '.
                            'leave.employee_id = leave_config_items.employee_id ' .
                    'LEFT JOIN ' .
                        'leave_actions ON leave_action_code = leave_actions.code ' .
                    'LEFT JOIN ' .
                        'leave_source_types ON leave_source_type_code = leave_source_types.code ' .
                    'WHERE ' .
                        'leave_config_items.leave_type_id = $1 AND ' . 
                        'leave_config_items.employee_id = $2 AND ' .
                        'date >= $3 AND ' .
                        'date <= $4 ' .
                    'ORDER BY ' .
                        'leave.id DESC ' .
                        // 'LIMIT 10 ' .
                ')' .
                'SELECT * FROM last_rows ORDER BY date ASC, last_rows_leave_id ASC ';
            $lastRowSqlResult = $db->paramQuery($lastRowSqlQuery, [
                $data['leaveTypeId'], 
                $user['employeeId'],
                $startDate,
                $endDate
            ]);
            if( !$lastRowSqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $balance = 0.0;
            $firstRun = true;
            while( $sqlRow = $lastRowSqlResult->fetchAssociative() ) {
                $leaveTypeIndex = null;
                for( $i = 0; $i < count($leaveTypes); $i++ ) {
                    if( $leaveTypes[$i]['id'] === $sqlRow['leave_type_id'] ) {
                        $leaveTypeIndex = $i;
                        break;
                    }
                }
                
                // If leaveTypeIndex is null then the rule was not in the leaveTypes array.
                if( $leaveTypeIndex === null ) continue;
                
                if ($leaveTypes[$leaveTypeIndex]['leaveUnitCode'] === 'DAYS') {
                    $unit = $sqlRow['days'];
                }
                else if ($leaveTypes[$leaveTypeIndex]['leaveUnitCode'] === 'HOUR') {
                    $unit = $sqlRow['hours'];
                }
                
                if ($firstRun) {
                    $balance = $leaveTypes[$leaveTypeIndex]['startingBalance'];
                    $firstRun = false;
                }
                
                $balance = floatval($balance) + floatval($unit);
                
                $leave[] = [
                    'id' => $sqlRow['id'],
                    'leaveActionName'  => $sqlRow['leave_actions_name'],
                    'leaveActionCode' => $sqlRow['leave_action_code'],
                    'leaveUnitCode' => $leaveUnitCode,
                    'hours' => floatval($sqlRow['hours']),
                    'days' => floatval($sqlRow['days']),
                    'balance' => floatval($balance),
                    'date' => $sqlRow['date'],
                    'leaveSourceTypeCode' => $sqlRow['leave_source_type_code'],
                    'leaveSourceTypesName' => $sqlRow['leave_source_types_name'],
                    'description' => $sqlRow['description']
                ];
            }
            
            // Is the employee subscribed, but there is no leave to display?
            if( $isSubscribed && ($lastRowSqlResult->getRowCount() <= 0) ) {
                // Display the balance
                $leave[] = [
                    'id' => null,
                    'leaveActionName'  => null,
                    'leaveActionCode' => null,
                    'leaveUnitCode' => $leaveUnitCode,
                    'hours' => 0,
                    'days' => 0,
                    'balance' => $startingBalance,
                    'date' => $startDate,
                    'leaveSourceTypeCode' => null,
                    'leaveSourceTypesName' => null,
                    'description' => 'Balance'
                ];
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "DATE",
                "DESCRIPTION",
                "AMOUNT",
                "BALANCE"
            ];
            
            // Set the export file name
            $suffix = '';
            if( ($data['startDate'] !== NULL) && ($data['startDate'] !== '') ) {
                $suffix = str_replace('-', '', $data['startDate']);
            }
            if( ($data['endDate'] !== NULL) && ($data['endDate'] !== '') ) {
                if( $suffix !== '' ) {
                    $suffix = $suffix . '_to_' . str_replace('-', '', $data['endDate']);
                }
                else {
                    $suffix = str_replace('-', '', $data['endDate']);
                }
            }
            if( $suffix === '' ) {
                $suffix = date('Ymd');
            }
            $writer = $this->writeReport($data, 'leave_history_' . $suffix, $headers);
            
            // Write out the content
            for ($i=0; $i < count($leave); $i++) { 
                // Format the leave amount for export
                $unitType = '';
                $units = '';
                if($leave[$i]['leaveUnitCode'] === 'DAYS') {
                    $unitType = 'd';
                    $units = number_format($leave[$i]['days'], 2, '.', ' ') . ' ' . $unitType;
                }
                else if ($leave[$i]['leaveUnitCode'] === 'HOUR') {
                    $unitType = 'h';
                    $units = number_format($leave[$i]['hours'], 2, '.', ' ') . ' ' . $unitType;
                }
                
                // Format the leave balance for export
                $balance = number_format($leave[$i]['balance'], 2, '.', ' ') . ' ' . $unitType;
                if($leave[$i]['date'] === null) {
                    $balance = '';
                }
                
                $content = [
                    $leave[$i]['date'],
                    $leave[$i]['description'],
                    $units,
                    $balance 
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
        }
        
        // Function to list leave requests
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
                'sortOrder' => 'ASC'
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
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // Load only leave requests for the give employee that are in the future or pending
            $sqlParams[] = $user['employeeId'];
            $whereClause = 'WHERE leave_requests.employee_id = $' . count($sqlParams) . ' ';
            $sqlParams[] = date('Y-m-d', time());
            $whereClause = $whereClause . 
                'AND ( ' . 
                    'leave_request_stats.end_date >= $' . count($sqlParams) . ' OR ' . 
                    'leave_requests.leave_request_status_code = \'PEND\' ' . 
                ') ';
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 'AND (leave_types.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            // Load all leave requests
            $sqlQuery = 
                'WITH leave_request_stats AS( ' .
                    'SELECT ' .
                        'leave_request_id, ' .
                        'COUNT(leave_date) * AVG(day_fraction) AS num_days, ' .
                        'AVG(day_fraction) AS day_fraction, ' .
                        'SUM(leave_hours) AS num_hours, ' .
                        'MIN(leave_date) AS start_date, ' .
                        'MAX(leave_date) AS end_date ' .
                    'FROM ' .
                        'leave_request_items ' .
                    'GROUP BY ' .
                        'leave_request_items.leave_request_id ' .
                ') ' .
                'SELECT ' .
                    'leave_requests.id, ' .
                    'leave_requests.employee_id, ' .
                    'leave_requests.leave_type_id, ' .
                    'leave_types.name AS leave_type_name, ' .
                    'leave_types.leave_unit_code, ' .
                    'leave_units.name AS leave_unit_name, ' .
                    'leave_requests.note, ' .
                    'leave_requests.leave_request_status_code, ' .
                    'leave_request_status.name AS leave_request_status_name, ' .
                    'leave_requests.status_updated_on, ' .
                    'leave_requests.status_updated_by_user_id, ' .
                    'leave_requests.added_on, ' .
                    'leave_requests.added_by_user_type_code, ' .
                    'leave_requests.added_by_user_id, ' .
                    'leave_request_stats.num_days, ' .
                    'leave_request_stats.day_fraction, ' .
                    'leave_request_stats.num_hours, ' .
                    'leave_request_stats.start_date, ' .
                    'leave_request_stats.end_date ' .
                'FROM ' .
                    'leave_requests ' .
                'LEFT JOIN ' .
                    'leave_request_stats ON leave_request_stats.leave_request_id = leave_requests.id ' .
                'LEFT JOIN ' .
                    'leave_request_status ON leave_request_status.code = leave_requests.leave_request_status_code ' .
                'LEFT JOIN ' .
                    'leave_types ON leave_types.id = leave_requests.leave_type_id ' .
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_types.leave_unit_code ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'leave_request_stats.start_date ' . $data['sortOrder'] . ', ' . 
                    'leave_requests.added_on ' . $data['sortOrder'] . ' ' . 
                    $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the requests array
            $requests = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $requests[] = [
                    'id' => $sqlRow['id'],
                    // 'employee_id' => $sqlRow['employee_id'],
                    'leaveTypeId' => $sqlRow['leave_type_id'],
                    'leaveTypeName' => $sqlRow['leave_type_name'],
                    'unitCode' => $sqlRow['leave_unit_code'],
                    'unitName' => $sqlRow['leave_unit_name'],
                    'note' => $sqlRow['note'],
                    'statusCode' => $sqlRow['leave_request_status_code'],
                    'statusName' => $sqlRow['leave_request_status_name'],
                    'statusUpdatedOn' => $sqlRow['status_updated_on'],
                    'addedOn' => $sqlRow['added_on'],
                    'totalDays' => number_format(floatval($sqlRow['num_days']), 2, '.', ''),
                    'dayFraction' => number_format(floatval($sqlRow['day_fraction']), 2, '.', ''),
                    'totalHours' => $sqlRow['num_hours'],
                    'fromDate' => $sqlRow['start_date'],
                    'toDate' => $sqlRow['end_date']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'requests' => $requests]) );
            return true;
        }
        
        // Function to add a leave request
        //
        // Required Parameters
        //  'leaveTypeId',              // The leave type id
        //  'note',                     // A note on the leave
        //  'items' => [
        //      'leaveDate',            // A date on which leave is requested
        //      'leaveHours'            // The number of hours of leave requested
        //  ]
        //
        // Optional Parameters
        //  None
        public function addRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data
            $validationResult = Json::validate($data, [
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'items' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'leaveDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'dayFraction' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                        'leaveHours' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Sort the items array by the leave date
            array_multisort(
                array_column($data['items'], 'leaveDate'),  SORT_ASC,
                array_column($data['items'], 'leaveHours'), SORT_ASC,
                $data['items']
            );
            
            // Make certain all the specified leave days are available (i.e., they haven't already 
            // been submitted in a request that is pending or have been approved)
            $sqlParams = [];
            
            $sqlParams[] = $user['employeeId'];
            $whereClause = 
                'WHERE ' . 
                    'leave_requests.leave_request_status_code != \'DECL\' AND ' .
                    'leave_requests.employee_id = $'. count($sqlParams) . ' AND ' .
                    'leave_request_items.leave_date IN(';
            
            $leaveDateCount = 0;
            foreach( $data['items'] AS $item ) {
                $leaveDateCount++;
                if( $leaveDateCount > 1 ) $whereClause = $whereClause . ', ';
                $sqlParams[] = ('\'' . $item['leaveDate'] . '\'');
                $whereClause = $whereClause . '$' . count($sqlParams);
            }
            $whereClause = $whereClause . ');';
            
            $sqlQuery =
                'SELECT ' .
                    'leave_request_items.id ' .
                'FROM ' .
                    'leave_request_items ' .
                'LEFT JOIN ' .
                    'leave_requests ON leave_requests.id = leave_request_items.leave_request_id ' .
                $whereClause;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() > 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'You have already requested leave for one or more of the selected days']) );
                return false;
            }
            
            // Split the leave days into multiple requests if leave days are seperated by more than 4 days
            $leaveRequests = [];
            $leaveRequests[] = [
                'id' => null,
                'employeeAlias' => '',
                'description' => '',
                'leaveTypeId' => $data['leaveTypeId'],
                'note' => $data['note'],
                'items' => []
            ];
            $index = 0;
            $previousLeaveDate = null;
            foreach( $data['items'] AS $item ) {
                // Is it not the first day?
                if( $previousLeaveDate !== null ) {
                    // Calculate the difference between the current and previous leave dates in days
                    $daysDifference = round((strtotime($item['leaveDate']) - strtotime($previousLeaveDate)) / (60 * 60 * 24));
                    
                    // Has more than 4 days past since the previous date?
                    if( $daysDifference > 4 ) {
                        // Add a new request
                        $leaveRequests[] = [
                            'id' => null,
                            'employeeAlias' => '',
                            'description' => '',
                            'leaveTypeId' => $data['leaveTypeId'],
                            'note' => $data['note'],
                            'items' => []
                        ];
                        
                        // Set the index to the new request
                        $index = $index + 1;
                    }
                }
                
                // Add the leave request item to the appropriate request
                $leaveRequests[$index]['items'][] = $item;
                
                // Remember the leave date added
                $previousLeaveDate = $item['leaveDate'];
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE leave_request_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE leave_requests IN ACCESS EXCLUSIVE MODE', []);
            
            // For every leave request
            for( $i = 0; $i < count($leaveRequests);  $i++ ) {
                // Add the leave request to the database
                $sqlQuery =
                    'INSERT INTO ' .
                        'leave_requests ( ' .
                            'employee_id, ' .
                            'leave_type_id, ' .
                            'note, ' .
                            'leave_request_status_code, ' .
                            'status_updated_on, ' .
                            'status_updated_by_user_id, ' .
                            'added_on, ' .
                            'added_by_user_type_code, ' .
                            'added_by_user_id ' .
                        ') ' .
                    'VALUES ( ' .
                            '$1, $2, $3, $4, $5, $6, $7, $8, $9 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $user['employeeId'],                // employee_id
                    $leaveRequests[$i]['leaveTypeId'],  // leave_type_id
                    $leaveRequests[$i]['note'],         // note
                    'PEND',                             // leave_request_status_code
                    null,                               // status_updated_on
                    null,                               // status_updated_by_user_id
                    date('Y-m-d', time()),              // added_on
                    'EMPL',                             // added_by_user_type_code
                    $user['id']                         // added_by_user_id
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $leaveRequests[$i]['id'] = $sqlRow['id'];
                
                // Add the leave request items
                foreach( $leaveRequests[$i]['items'] AS $item ) {
                    $sqlQuery =
                        'INSERT INTO leave_request_items ( ' .
                            'leave_request_id, ' .
                            'leave_date, ' .
                            'day_fraction, ' .
                            'leave_hours ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2, $3, $4 ' .
                        ');';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $leaveRequests[$i]['id'],   // leave_request_id
                        $item['leaveDate'],         // leave_date
                        $item['dayFraction'],       // day_fraction
                        $item['leaveHours']         // leave_hours
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Get the administrator email address
            $sqlQuery = 
                'SELECT ' . 
                    'config.name, ' . 
                    'config.value ' . 
                'FROM ' . 
                    'config ' . 
                'WHERE ' . 
                    'config.name = \'leave_request_admin_email_address\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave request administrator settings not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $adminEmailAddress = $sqlRow['value'];
            
            // Send emails to administrator to approve / decline the request
            if( strlen($adminEmailAddress) > 0 ) {
                // Create a description for every leave request
                for( $i = 0; $i < count($leaveRequests);  $i++ ) {
                    $leaveRequestId = $leaveRequests[$i]['id'];
                    
                    // Get the leave request details
                    $sqlQuery = 
                        'WITH leave_request_stats AS( ' .
                            'SELECT ' .
                                'leave_request_id, ' .
                                'COUNT(leave_date) * AVG(day_fraction) AS num_days, ' .
                                'AVG(day_fraction) AS day_fraction, ' .
                                'SUM(leave_hours) AS num_hours, ' .
                                'MIN(leave_date) AS start_date, ' .
                                'MAX(leave_date) AS end_date ' .
                            'FROM ' .
                                'leave_request_items ' .
                            'GROUP BY ' .
                                'leave_request_items.leave_request_id ' .
                        ') ' .
                        'SELECT ' .
                            'leave_requests.id, ' .
                            'leave_requests.employee_id, ' .
                            'employees.alias AS employee_alias, ' .
                            'employees.code AS employee_code, ' .
                            'employees.email_address AS employee_email_address, ' .
                            'leave_requests.leave_type_id, ' .
                            'leave_types.name AS leave_type_name, ' .
                            'leave_types.leave_unit_code, ' .
                            'leave_requests.leave_request_status_code, ' .
                            'leave_request_stats.num_days, ' .
                            'leave_request_stats.day_fraction, ' .
                            'leave_request_stats.num_hours, ' .
                            'leave_request_stats.start_date, ' .
                            'leave_request_stats.end_date ' .
                        'FROM ' .
                            'leave_requests ' .
                        'LEFT JOIN ' .
                            'employees ON employees.id = leave_requests.employee_id ' .
                        'LEFT JOIN ' .
                            'leave_request_stats ON leave_request_stats.leave_request_id = leave_requests.id ' .
                        'LEFT JOIN ' .
                            'leave_types ON leave_types.id = leave_requests.leave_type_id ' .
                        'LEFT JOIN ' .
                            'leave_units ON leave_units.code = leave_types.leave_unit_code ' .
                        'WHERE ' .
                            'leave_requests.id = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$leaveRequestId]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                        return false;
                    }
                    
                    // Get leave request details
                    $sqlRow = $sqlResult->fetchAssociative();
                    $employeeAlias = $sqlRow['employee_alias'] . ' (' . $sqlRow['employee_code'] . ')';
                    $leaveUnitCode = $sqlRow['leave_unit_code'];
                    $days = $sqlRow['num_days'];
                    $dayFraction = $sqlRow['day_fraction'];
                    $hours = $sqlRow['num_hours'];
                    
                    $leaveDescription = '';
                    $leaveDescription = $leaveDescription . number_format(floatval($days / $dayFraction), 2, '.', '');
                    if( $dayFraction == 0.25 ) {
                        $leaveDescription = $leaveDescription . ' quarter-day(s) ';
                    }
                    else if( $dayFraction == 0.5 ) {
                        $leaveDescription = $leaveDescription . ' half-day(s) ';
                    }
                    else {
                        $leaveDescription = $leaveDescription . ' day(s) ';
                    }
                    
                    if( $leaveUnitCode === 'HOUR' ) {
                        $leaveDescription = $leaveDescription . '(' . number_format(floatval($hours), 2, '.', '') . ' hours) ';
                    }
                    $leaveDescription = $leaveDescription . 'of \'' . $sqlRow['leave_type_name'] . '\' ';
                    if( ($days / $dayFraction) > 1 ) {
                        $leaveDescription = $leaveDescription . 'from ' . $sqlRow['start_date'] . ' ';
                        $leaveDescription = $leaveDescription . 'to ' . $sqlRow['end_date'];
                    }
                    else {
                        $leaveDescription = $leaveDescription . 'on ' . $sqlRow['start_date'];
                    }
                    
                    // Save the leave request employee alaias and description
                    $leaveRequests[$i]['employeeAlias'] = $employeeAlias;
                    $leaveRequests[$i]['description'] = $leaveDescription;
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
                
                // Send an emails to the administrator
                System::useModule('phpmailer');
                
                // For each leave request
                foreach( $leaveRequests AS $request ) {
                    $leaveRequestId = $request['id'];
                    
                    // Generate a secure random code for the invitation
                    $code = Security::generateRandomString(64);
                    
                    // Add a link for viewing the leave request
                    $leaveRequestLink = CONF_ROOT_URL . '/index.html?updateLeaveRequestStatus=' . $code;
                    
                    // Start SQL transaction
                    $db->startTransaction();
                    
                    // Lock the relevant table(s)
                    $db->query('LOCK TABLE employee_leave_requests IN EXCLUSIVE MODE;');
                    
                    // Remove all existing requests
                    $sqlQuery =
                        'DELETE FROM ' . 
                            'employee_leave_requests ' . 
                        'WHERE ' . 
                            'company_id = $1 AND ' . 
                            'leave_request_id = $2 AND ' . 
                            'sent_by_employee_account_id = $3;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $user['companyId'], 
                        $leaveRequestId,
                        $user['id']]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Add the employee leave request
                    $sqlQuery =
                        'INSERT INTO employee_leave_requests ( ' . 
                            'code, ' . 
                            'company_id, ' . 
                            'leave_request_id, ' . 
                            'sent_by_employee_account_id, ' . 
                            'sent_on, ' . 
                            'expires_on, ' . 
                            'status_code ' . 
                        ') ' .
                        'VALUES (' .
                            '$1, $2, $3, $4, $5, $6, $7' . 
                        ') ' .
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $code,                                  // code
                        $user['companyId'],                     // company_id
                        $leaveRequestId,                         // invitee_name
                        $user['id'],                            // sent_by_user_id
                        date('Y-m-d H:i:s'),                    // sent_on
                        date('Y-m-d H:i:s', time() + 604800),   // expires_on
                        'PEND'                                  // status code
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Commit the sql transaction
                    $db->commitTransaction();
                    
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
                    $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/leave_request.html' );
                    $mailText = str_replace('$EMPLOYEE_ALIAS', $request['employeeAlias'], $mailText);
                    $mailText = str_replace('$LEAVE_REQUEST_DESCRIPTION', $request['description'], $mailText);
                    $mailText = str_replace('$LEAVE_REQUEST_LINK', $leaveRequestLink, $mailText);
                    
                    //Recipients
                    $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                    $mail->addAddress($adminEmailAddress, '');
                    $mail->isHTML(true);                                  // Set email format to HTML
                    $mail->Subject = 'Payaccsys Payroll: Leave Request';
                    $mail->Body = $mailText;
                    
                    $mail->send();
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to remove a leave request
        //
        // Required Parameters
        //  requestId               The id of the request to remove
        //
        // Optional Parameters
        //  None
        public function removeRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'requestId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // We can only remove pending requests
            $sqlQuery = 'SELECT leave_request_status_code FROM leave_requests WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['leave_request_status_code'] !== 'PEND' ) {
                echo( json_encode(['ok' => false, 'error' => 'Only pending leave requests can be removed.']) );
                return false;
            }
            
            // Remove all the leave request items
            $sqlQuery = 'DELETE FROM leave_request_items WHERE leave_request_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove the specified leave request
            $sqlQuery = 'DELETE FROM leave_requests WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get full details about a leave request
        //
        // Required Parameters
        //  requestId               The id of the request to get
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
                'requestId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get all the leave request items
            $sqlQuery = 
                'SELECT ' .
                    'leave_request_items.id, ' .
                    'leave_request_items.leave_date, ' .
                    'leave_request_items.day_fraction, ' .
                    'leave_request_items.leave_hours ' .
                'FROM ' .
                    'leave_request_items ' .
                'WHERE ' .
                    'leave_request_items.leave_request_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the items array
            $items = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $items[] = [
                    'id' => $sqlRow['id'],
                    'leaveDate' => $sqlRow['leave_date'],
                    'dayFraction' => $sqlRow['day_fraction'],
                    'leaveHours' => $sqlRow['leave_hours']
                ];
            }
            
            // Load the specified leave request
            $sqlQuery = 
                'WITH leave_request_stats AS( ' .
                    'SELECT ' .
                        'leave_request_id, ' .
                        'COUNT(leave_date) * AVG(day_fraction) AS num_days, ' .
                        'AVG(day_fraction) AS day_fraction, ' .
                        'SUM(leave_hours) AS num_hours, ' .
                        'MIN(leave_date) AS start_date, ' .
                        'MAX(leave_date) AS end_date ' .
                    'FROM ' .
                        'leave_request_items ' .
                    'GROUP BY ' .
                        'leave_request_items.leave_request_id ' .
                ') ' .
                'SELECT ' .
                    'leave_requests.id, ' .
                    'leave_requests.employee_id, ' .
                    'leave_requests.leave_type_id, ' .
                    'leave_types.name AS leave_type_name, ' .
                    'leave_types.leave_unit_code, ' .
                    'leave_units.name AS leave_unit_name, ' .
                    'leave_requests.note, ' .
                    'leave_requests.leave_request_status_code, ' .
                    'leave_request_status.name AS leave_request_status_name, ' .
                    'leave_requests.status_updated_on, ' .
                    'leave_requests.status_updated_by_user_id, ' .
                    'leave_requests.status_update_message, ' .
                    'leave_requests.added_on, ' .
                    'leave_requests.added_by_user_type_code, ' .
                    'leave_requests.added_by_user_id, ' .
                    'leave_request_stats.num_days, ' .
                    'leave_request_stats.day_fraction, ' .
                    'leave_request_stats.num_hours, ' .
                    'leave_request_stats.start_date, ' .
                    'leave_request_stats.end_date ' .
                'FROM ' .
                    'leave_requests ' .
                'LEFT JOIN ' .
                    'leave_request_stats ON leave_request_stats.leave_request_id = leave_requests.id ' .
                'LEFT JOIN ' .
                    'leave_request_status ON leave_request_status.code = leave_requests.leave_request_status_code ' .
                'LEFT JOIN ' .
                    'leave_types ON leave_types.id = leave_requests.leave_type_id ' .
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_types.leave_unit_code ' .
                'WHERE ' .
                    'leave_requests.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                return false;
            }
            
            // Create the requests array
            $sqlRow = $sqlResult->fetchAssociative();
            $request = [
                'id' => $sqlRow['id'],
                // 'employee_id' => $sqlRow['employee_id'],
                'leaveTypeId' => $sqlRow['leave_type_id'],
                'leaveTypeName' => $sqlRow['leave_type_name'],
                'unitCode' => $sqlRow['leave_unit_code'],
                'unitName' => $sqlRow['leave_unit_name'],
                'note' => $sqlRow['note'],
                'statusCode' => $sqlRow['leave_request_status_code'],
                'statusName' => $sqlRow['leave_request_status_name'],
                'statusUpdatedOn' => $sqlRow['status_updated_on'],
                'statusUpdateMessage' => $sqlRow['status_update_message'],
                'addedOn' => $sqlRow['added_on'],
                'totalDays' => number_format(floatval($sqlRow['num_days']), 2, '.', ''),
                'dayFraction' => number_format(floatval($sqlRow['day_fraction']), 2, '.', ''),
                'totalHours' => $sqlRow['num_hours'],
                'fromDate' => $sqlRow['start_date'],
                'toDate' => $sqlRow['end_date'],
                'items' => $items
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'request' => $request]) );
            return true;
        }
        
        // Function to update a leave request
        //
        // Required Parameters
        //  'requestId',                // The id of the leave request to update
        //  'leaveTypeId',              // The leave type id
        //  'note',                     // A note on the leave
        //  'items' => [
        //      'leaveDate',            // A date on which leave is requested
        //      'leaveHours'            // The number of hours of leave requested
        //  ]
        //
        // Optional Parameters
        //  None
        public function updateRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data
            $validationResult = Json::validate($data, [
                // Required parameters
                'requestId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'items' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'leaveDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'dayFraction' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                        'leaveHours' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                    ]]
                ]]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // We can only update pending requests
            $sqlQuery = 'SELECT leave_request_status_code FROM leave_requests WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['leave_request_status_code'] !== 'PEND' ) {
                echo( json_encode(['ok' => false, 'error' => 'Only pending leave requests can be edited.']) );
                return false;
            }
            
            // Split the leave days into multiple requests if leave days are seperated by more than 4 days
            $leaveRequests = [];
            $leaveRequests[] = [
                'id' => null,
                'employeeAlias' => '',
                'description' => '',
                'leaveTypeId' => $data['leaveTypeId'],
                'note' => $data['note'],
                'items' => []
            ];
            $index = 0;
            $previousLeaveDate = null;
            foreach( $data['items'] AS $item ) {
                // Is it not the first day?
                if( $previousLeaveDate !== null ) {
                    // Calculate the difference between the current and previous leave dates in days
                    $daysDifference = round((strtotime($item['leaveDate']) - strtotime($previousLeaveDate)) / (60 * 60 * 24));
                    
                    // Has more than 4 days past since the previous date?
                    if( $daysDifference > 4 ) {
                        // Add a new request
                        $leaveRequests[] = [
                            'id' => null,
                            'employeeAlias' => '',
                            'description' => '',
                            'leaveTypeId' => $data['leaveTypeId'],
                            'note' => $data['note'],
                            'items' => []
                        ];
                        
                        // Set the index to the new request
                        $index = $index + 1;
                    }
                }
                
                // Add the leave request item to the appropriate request
                $leaveRequests[$index]['items'][] = $item;
                
                // Remember the leave date added
                $previousLeaveDate = $item['leaveDate'];
            }
            
            // Are there multiple requests?
            if( count($leaveRequests) > 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The requested leave days should be within four (4) days of each other. Please add an additional leave request for leave days seperated by more than four days.']) );
                return false;
            }
            
            // Make certain all the specified leave days are available (i.e., they haven't already 
            // been submitted in a request that is pending or have been approved)
            $sqlParams = [];
            
            $sqlParams[] = $data['requestId'];
            $whereClause = 
                'WHERE ' . 
                    'leave_requests.id != $'. count($sqlParams) . ' AND ';
            
            $sqlParams[] = $user['employeeId'];
            $whereClause = $whereClause .
                'leave_requests.leave_request_status_code != \'DECL\' AND ' .
                'leave_requests.employee_id = $'. count($sqlParams) . ' AND ' .
                'leave_request_items.leave_date IN(';
            
            $leaveDateCount = 0;
            foreach( $data['items'] AS $item ) {
                $leaveDateCount++;
                if( $leaveDateCount > 1 ) $whereClause = $whereClause . ', ';
                $sqlParams[] = ('\'' . $item['leaveDate'] . '\'');
                $whereClause = $whereClause . '$' . count($sqlParams);
            }
            $whereClause = $whereClause . ');';
            
            $sqlQuery =
                'SELECT ' .
                    'leave_request_items.id ' .
                'FROM ' .
                    'leave_request_items ' .
                'LEFT JOIN ' .
                    'leave_requests ON leave_requests.id = leave_request_items.leave_request_id ' .
                $whereClause;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() > 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'You have already requested leave for one or more of the selected days']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE leave_request_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE leave_requests IN ACCESS EXCLUSIVE MODE', []);
            
            // Build the query to update the leave request
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE leave_requests SET ';
            
            if( isset($data['leaveTypeId']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'leave_type_id = $' . $updateCount;
                $updateValues[] = $data['leaveTypeId'];
            }
            
            if( isset($data['note']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'note = $' . $updateCount;
                $updateValues[] = $data['note'];
            }
            
            // Set where clause
            $updateCount++;
            $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['requestId'];
            
            $updateResult = $db->paramQuery($updateQuery, $updateValues);
            if( !$updateResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove all the leave request items
            $sqlQuery = 'DELETE FROM leave_request_items WHERE leave_request_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['requestId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add the new leave request items
            foreach( $data['items'] AS $item ) {
                $sqlQuery =
                    'INSERT INTO leave_request_items ( ' .
                        'leave_request_id, ' .
                        'leave_date, ' .
                        'day_fraction, ' .
                        'leave_hours ' .
                    ') ' .
                    'VALUES ( ' .
                        '$1, $2, $3, $4 ' .
                    ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['requestId'],         // leave_request_id
                    $item['leaveDate'],         // leave_date
                    $item['dayFraction'],       // day_fraction
                    $item['leaveHours']         // leave_hours
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get details about a sent leave request
        //
        // Required Parameters
        //  code            A unique code identifying the leave request in the system schema
        //
        // Optional Parameters
        //  None
        public function getSentRequest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
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
            
            // Get the leave request details from the code
            $sqlQuery = 'SELECT company_id, leave_request_id FROM employee_leave_requests WHERE code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the request not found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave request not found']) );
                return false;
            }
            
            // Load the request details
            $sqlRow = $sqlResult->fetchAssociative();
            $requestId = $sqlRow['leave_request_id'];
            $companyId = $sqlRow['company_id'];
            
            // Load company details from id
            $sqlQuery = 'SELECT id, name, alias, database_name, database_schema, database_host FROM companies WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId]);
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
            $databaseSchema = $sqlRow['database_schema'];
            $companyAlias = $sqlRow['alias'];
            
            // Set our search path to the company
            $sqlResult = $db->paramQuery('SET search_path TO ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get all the leave request items
            $sqlQuery = 
                'SELECT ' .
                    'leave_request_items.id, ' .
                    'leave_request_items.leave_date, ' .
                    'leave_request_items.day_fraction, ' .
                    'leave_request_items.leave_hours ' .
                'FROM ' .
                    'leave_request_items ' .
                'WHERE ' .
                    'leave_request_items.leave_request_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$requestId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create the items array
            $items = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $items[] = [
                    'id' => $sqlRow['id'],
                    'leaveDate' => $sqlRow['leave_date'],
                    'dayFraction' => $sqlRow['day_fraction'],
                    'leaveHours' => $sqlRow['leave_hours']
                ];
            }
            
            // Load the specified leave request
            $sqlQuery = 
                'WITH leave_request_stats AS( ' .
                    'SELECT ' .
                        'leave_request_id, ' .
                        'COUNT(leave_date) * AVG(day_fraction) AS num_days, ' .
                        'AVG(day_fraction) AS day_fraction, ' .
                        'SUM(leave_hours) AS num_hours, ' .
                        'MIN(leave_date) AS start_date, ' .
                        'MAX(leave_date) AS end_date ' .
                    'FROM ' .
                        'leave_request_items ' .
                    'GROUP BY ' .
                        'leave_request_items.leave_request_id ' .
                ') ' .
                'SELECT ' .
                    'leave_requests.id, ' .
                    'leave_requests.employee_id, ' .
                    'employees.code AS employee_code, ' .
                    'employees.alias AS employee_alias, ' .
                    'leave_requests.leave_type_id, ' .
                    'leave_types.name AS leave_type_name, ' .
                    'leave_types.leave_unit_code, ' .
                    'leave_units.name AS leave_unit_name, ' .
                    'leave_requests.note, ' .
                    'leave_requests.leave_request_status_code, ' .
                    'leave_request_status.name AS leave_request_status_name, ' .
                    'leave_requests.status_updated_on, ' .
                    'leave_requests.status_updated_by_user_id, ' .
                    'leave_requests.added_on, ' .
                    'leave_requests.added_by_user_type_code, ' .
                    'leave_requests.added_by_user_id, ' .
                    'leave_request_stats.num_days, ' .
                    'leave_request_stats.day_fraction, ' .
                    'leave_request_stats.num_hours, ' .
                    'leave_request_stats.start_date, ' .
                    'leave_request_stats.end_date ' .
                'FROM ' .
                    'leave_requests ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = leave_requests.employee_id ' .
                'LEFT JOIN ' .
                    'leave_request_stats ON leave_request_stats.leave_request_id = leave_requests.id ' .
                'LEFT JOIN ' .
                    'leave_request_status ON leave_request_status.code = leave_requests.leave_request_status_code ' .
                'LEFT JOIN ' .
                    'leave_types ON leave_types.id = leave_requests.leave_type_id ' .
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_types.leave_unit_code ' .
                'WHERE ' .
                    'leave_requests.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$requestId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                return false;
            }
            
            // Create the requests array
            $sqlRow = $sqlResult->fetchAssociative();
            $request = [
                'id' => $sqlRow['id'],
                'companyAlias' => $companyAlias,
                // 'employeeId' => $sqlRow['employee_id'],
                'employeeCode' => $sqlRow['employee_code'],
                'employeeAlias' => $sqlRow['employee_alias'],
                'leaveTypeId' => $sqlRow['leave_type_id'],
                'leaveTypeName' => $sqlRow['leave_type_name'],
                'leaveAvailable' => '',
                'unitCode' => $sqlRow['leave_unit_code'],
                'unitName' => $sqlRow['leave_unit_name'],
                'note' => $sqlRow['note'],
                'statusCode' => $sqlRow['leave_request_status_code'],
                'statusName' => $sqlRow['leave_request_status_name'],
                'statusUpdatedOn' => $sqlRow['status_updated_on'],
                'addedOn' => $sqlRow['added_on'],
                'totalDays' => $sqlRow['num_days'],
                'dayFraction' => $sqlRow['day_fraction'],
                'totalHours' => $sqlRow['num_hours'],
                'fromDate' => $sqlRow['start_date'],
                'toDate' => $sqlRow['end_date'],
                'items' => $items
            ];
            
            // Get the leave data
            $leaveData = \LeaveUtil\getLeaveBalances( 
                $sqlRow['employee_id'], 
                date("Y-m-d", strtotime("-1 months")), 
                date('Y-m-d'), 
                null, 
                $db 
            );
            
            // Get the leave available
            foreach($leaveData as $key => $value) {
                if( $request['leaveTypeId'] === $leaveData[$key]['id'] ) {
                    $request['leaveAvailable'] = $leaveData[$key]['balance'];
                    break;
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'request' => $request]) );
            return true;
        }
        
        // Function to update the status of a leave request
        //
        // Required Parameters
        //  code                    A unique code identifying the leave request in the system schema
        //  statusCode              The status code to be updated to
        //  statusUpdateMessage     The status update message
        //
        // Optional Parameters
        //  None
        public function updateSentRequestStatus($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'statusCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'statusUpdateMessage' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
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
            
            // Get the leave request details from the code
            $sqlQuery = 'SELECT company_id, leave_request_id FROM employee_leave_requests WHERE code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the request not found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Leave request not found']) );
                return false;
            }
            
            // Load the request details
            $sqlRow = $sqlResult->fetchAssociative();
            $requestId = $sqlRow['leave_request_id'];
            $companyId = $sqlRow['company_id'];
            
            // Load company details from id
            $sqlQuery = 'SELECT id, name, alias, database_name, database_schema, database_host FROM companies WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$companyId]);
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
            $databaseSchema = $sqlRow['database_schema'];
            $companyAlias = $sqlRow['alias'];
            
            // Set our search path to the company
            $sqlResult = $db->paramQuery('SET search_path TO ' . $databaseSchema . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the current leave request status
            $sqlQuery = 
                'WITH leave_request_stats AS( ' .
                    'SELECT ' .
                        'leave_request_id, ' .
                        'COUNT(leave_date) * AVG(day_fraction) AS num_days, ' .
                        'AVG(day_fraction) AS day_fraction, ' .
                        'SUM(leave_hours) AS num_hours, ' .
                        'MIN(leave_date) AS start_date, ' .
                        'MAX(leave_date) AS end_date ' .
                    'FROM ' .
                        'leave_request_items ' .
                    'GROUP BY ' .
                        'leave_request_items.leave_request_id ' .
                ') ' .
                'SELECT ' .
                    'leave_requests.id, ' .
                    'leave_requests.employee_id, ' .
                    'employees.alias AS employee_alias, ' .
                    'employees.email_address AS employee_email_address, ' .
                    'leave_requests.leave_type_id, ' .
                    'leave_types.name AS leave_type_name, ' .
                    'leave_types.leave_unit_code, ' .
                    'leave_requests.leave_request_status_code, ' .
                    'leave_request_stats.num_days, ' .
                    'leave_request_stats.day_fraction, ' .
                    'leave_request_stats.num_hours, ' .
                    'leave_request_stats.start_date, ' .
                    'leave_request_stats.end_date ' .
                'FROM ' .
                    'leave_requests ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = leave_requests.employee_id ' .
                'LEFT JOIN ' .
                    'leave_request_stats ON leave_request_stats.leave_request_id = leave_requests.id ' .
                'LEFT JOIN ' .
                    'leave_types ON leave_types.id = leave_requests.leave_type_id ' .
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_types.leave_unit_code ' .
                'WHERE ' .
                    'leave_requests.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$requestId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified leave request could not be found.']) );
                return false;
            }
            
            // Save leave request details
            $sqlRow = $sqlResult->fetchAssociative();
            $oldStatusCode = $sqlRow['leave_request_status_code'];
            $employeeId =  $sqlRow['employee_id'];
            $employeeAlias = $sqlRow['employee_alias'];
            $employeeEmailAddress = $sqlRow['employee_email_address'];
            $leaveTypeId = $sqlRow['leave_type_id'];
            $leaveUnitCode = $sqlRow['leave_unit_code'];
            $days = $sqlRow['num_days'];
            $dayFraction = $sqlRow['day_fraction'];
            $hours = $sqlRow['num_hours'];
            
            $leaveDescription = '';
            $leaveDescription = $leaveDescription . number_format(floatval($days / $dayFraction), 2, '.', '');
            if( $dayFraction == 0.25 ) {
                $leaveDescription = $leaveDescription . ' quarter-day(s) ';
            }
            else if( $dayFraction == 0.5 ) {
                $leaveDescription = $leaveDescription . ' half-day(s) ';
            }
            else {
                $leaveDescription = $leaveDescription . ' day(s) ';
            }
            
            if( $leaveUnitCode === 'HOUR' ) {
                $leaveDescription = $leaveDescription . '(' . number_format(floatval($hours), 2, '.', '') . ' hours) ';
            }
            $leaveDescription = $leaveDescription . 'of \'' . $sqlRow['leave_type_name'] . '\' ';
            if( ($days / $dayFraction) > 1 ) {
                $leaveDescription = $leaveDescription . 'from ' . $sqlRow['start_date'] . ' ';
                $leaveDescription = $leaveDescription . 'to ' . $sqlRow['end_date'];
            }
            else {
                $leaveDescription = $leaveDescription . 'on ' . $sqlRow['start_date'];
            }
            
            if( $leaveUnitCode === 'DAYS' ) {
                $hours = 0;
            }
            else {
                $days = 0;
            }
            
            $leaveRequestStatus = 'RESET';
            if( $data['statusCode'] === 'DECL' ) {
                $leaveRequestStatus = 'DECLINED';
            }
            else if( $data['statusCode'] === 'APPR' ) {
                $leaveRequestStatus = 'APPROVED';
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE leave IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE leave_requests IN ACCESS EXCLUSIVE MODE', []);
            
            // Update the status of the specified leave request
            $sqlQuery =
                'UPDATE leave_requests SET ' .
                    'leave_request_status_code = $1, ' .
                    'status_updated_on = $2, ' .
                    'status_updated_by_user_id = $3, ' .
                    'status_update_message = $4 ' .
                'WHERE ' .
                    'leave_requests.id = $5;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['statusCode'],            // leave_request_status_code
                date('Y-m-d'),                  // status_updated_on
                null,                           // status_updated_by_user_id
                $data['statusUpdateMessage'],   // status_update_message
                $requestId                      // id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Has the leave status changed?
            if( $oldStatusCode !== $data['statusCode'] ) {
                // Was the leave approved?
                if( $oldStatusCode === 'APPR' ) {
                    $action = 'ADJU';
                    $description = 'Leave Request Reset';
                    if( $data['statusCode'] === 'DECL' ) {
                        $description = 'Leave Request Declined';
                    }
                    
                    // Reverse the leave adjustment
                    $sqlQuery =
                        'INSERT INTO leave( ' .
                            'leave_action_code, hours, days, date, employee_id, leave_type_id,  ' .
                            'leave_source_type_code, process_time, added_by_user_id, description ' .
                        ') ' .
                        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10); ';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $action,                            // leave_action_code
                        $hours,                             // hours
                        $days,                              // days
                        date('Y-m-d'),                      // date
                        $employeeId,                        // employee_id
                        $leaveTypeId,                       // leave_type_id
                        'MANU',                             // leave_source_type_code
                        date("Y-m-d H:i:s"),                // process_time
                        null,                               // added_by_user_id
                        $description                        // description
                    ]);
                }
                // Has the leave been approved?
                else if( $data['statusCode'] === 'APPR' ) {
                    $action = 'LTAK';
                    $hours = $hours * -1;
                    $days = $days * -1;
                    
                    // Add the leave adjustment
                    $sqlQuery =
                        'INSERT INTO leave( ' .
                            'leave_action_code, hours, days, date, employee_id, leave_type_id,  ' .
                            'leave_source_type_code, process_time, added_by_user_id, description ' .
                        ') ' .
                        'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10); ';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $action,                            // leave_action_code
                        $hours,                             // hours
                        $days,                              // days
                        date('Y-m-d'),                      // date
                        $employeeId,                        // employee_id
                        $leaveTypeId,                       // leave_type_id
                        'MANU',                             // leave_source_type_code
                        date("Y-m-d H:i:s"),                // process_time
                        null,                               // added_by_user_id
                        'Leave Request Approved'            // description
                    ]);
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
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
            
            // Update the sent request status code in the system schema
            $sqlQuery = 'UPDATE employee_leave_requests SET status_code = $1 WHERE code = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['statusCode'],
                $data['code']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Has the leave status changed?
            if( ($oldStatusCode !== $data['statusCode']) && (strlen($employeeEmailAddress) > 0) ) {
                // Send an email to the employee that his/her leave request status has been updated
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
                $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/leave_request_status_update_notification.html' );
                $mailText = str_replace('$EMPLOYEE_ALIAS', $employeeAlias, $mailText);
                $mailText = str_replace('$LEAVE_REQUEST_DESCRIPTION', $leaveDescription, $mailText);
                $mailText = str_replace('$LEAVE_REQUEST_STATUS', $leaveRequestStatus, $mailText);
                
                //Recipients
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->addAddress($employeeEmailAddress, '');
                $mail->isHTML(true);                                  // Set email format to HTML
                $mail->Subject = 'Payaccsys Payroll: Leave Request Updated';
                $mail->Body = $mailText;
                
                $mail->send();
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // @param $data             The request data
        // @param $report           Name The name of the report
        // @param $headers          The report fieldnames
        private function writeReport($data, $reportName, $headers) {
            //set format
            $formatType = 'xls';
            
            if(isset($data['format']) && $data['format'] !== '') {
                if(in_array($data['format'], array('xls','csv','xlsx'))) {
                   $formatType = trim($data['format']);
                }
                if($formatType == 'xlsx' || $formatType == 'xls'){
                    $formatType = 'xlsx';
                }
            }
            
            // Create the file name for the report
            $fileName = $reportName . '.'.$formatType;
            
            $writer = null;
            if($formatType == 'xlsx') {
               $writer = WriterEntityFactory::createXLSXWriter();
            }
            else {
                $writer = WriterEntityFactory::createCSVWriter();
            }
            $writer->openToBrowser($fileName); 
            
            //wirte headers
            foreach($headers as $header ) {
                $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
            }
            
            return $writer;
        }
    }
?>
