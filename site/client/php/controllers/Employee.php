<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    System::includeFile('NumberMask.php');
    System::includeFile('employee_import/EmployeeImportData.php');
    System::includeFile('employee_import/EmployeeImportValidator.php');
    System::includeFile('employee_import/AssignEmployeeImportData.php');
    System::includeFile('employee_import/TransformEmployeeImportData.php');
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    //
    // EMPLOYEE CONTROLLER CLASS
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
        
        
        // Function to to update the specified employee's details
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to update
        //
        // Optional parameters
        //  enableLeave             Should this schedule be used with leave
        //  monday                  The hours for monday
        //  tuesday                 The hours for tuesday
        //  wednesday               The hours for wednesday
        //  thursday                The hours for thursday
        //  friday                  The hours for friday
        //  saturday                The hours for saturday
        //  sunday                  The hours for sunday
        //
        public function updateEmployeeWorkSchedule($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                
                // Optional parameters
                'enableLeave' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'monday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'tuesday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'wednesday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'thursday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'friday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'saturday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'sunday' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->query('LOCK TABLE work_schedules IN EXCLUSIVE MODE;');
            
            // Load the workshedule details
            $sqlQuery = 
                'SELECT ' .
                    'id ' .
                'FROM ' .
                    'work_schedules ' .
                'WHERE ' .
                    'employee_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
                
            if( $sqlResult->getRowCount() === 0 ) {
                $enableLeave = false;
                $monday = null;
                $tuesday = null;
                $wednesday = null;
                $thursday = null;
                $friday = null;
                $saturday = null;
                $sunday = null;
                
                if( array_key_exists('enableLeave', $data) ) {
                    $enableLeave = $data['enableLeave'];
                }
                if( array_key_exists('monday', $data) ) {
                    $monday = $data['monday'];
                }
                if( array_key_exists('tuesday', $data) ) {
                    $tuesday = $data['tuesday'];
                }
                if( array_key_exists('wednesday', $data) ) {
                    $wednesday = $data['wednesday'];
                }
                if( array_key_exists('thursday', $data) ) {
                    $thursday = $data['thursday'];
                }
                if( array_key_exists('friday', $data) ) {
                    $friday = $data['friday'];
                }
                if( array_key_exists('saturday', $data) ) {
                    $saturday = $data['saturday'];
                }
                if( array_key_exists('sunday', $data) ) {
                    $sunday = $data['sunday'];
                }
                    
                // Build the query to insert the item.
                $sqlQuery =
                    'INSERT INTO work_schedules( ' .
                        'employee_id, enable_leave, monday_hours, tuesday_hours, wednesday_hours,  ' .
                        'thursday_hours, friday_hours, saturday_hours, sunday_hours) ' .
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); ';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeId'],        // employee_id
                    $enableLeave,               // enable_leave
                    $monday,                    // monday hours
                    $tuesday,                   // tuesday hours
                    $wednesday,                 // wednesday hours
                    $thursday,                  // thursday hours
                    $friday,                    // friday hours
                    $saturday,                  // saturday hours
                    $sunday                     // sunday hours
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            else {
                // Build the query to update the client
                $updateCount = 0;
                $updateValues = [];
                $updateQuery = 'UPDATE work_schedules SET ';
                
                if( array_key_exists('enableLeave', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'enable_leave = $' . $updateCount;
                    $updateValues[] = $data['enableLeave'];
                }
                
                if( array_key_exists('monday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'monday_hours = $' . $updateCount;
                    $updateValues[] = $data['monday'];
                }
                
                if( array_key_exists('tuesday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'tuesday_hours = $' . $updateCount;
                    $updateValues[] = $data['tuesday'];
                }
                
                if( array_key_exists('wednesday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'wednesday_hours = $' . $updateCount;
                    $updateValues[] = $data['wednesday'];
                }
                
                if( array_key_exists('thursday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'thursday_hours = $' . $updateCount;
                    $updateValues[] = $data['thursday'];
                }
                
                if( array_key_exists('friday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'friday_hours = $' . $updateCount;
                    $updateValues[] = $data['friday'];
                }
                
                if( array_key_exists('saturday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'saturday_hours = $' . $updateCount;
                    $updateValues[] = $data['saturday'];
                }
                
                if( array_key_exists('sunday', $data) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'sunday_hours = $' . $updateCount;
                    $updateValues[] = $data['sunday'];
                }
                
                // Set where clause
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE employee_id = $' . $updateCount . ';';
                $updateValues[] = $data['employeeId'];
                
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
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
        
        // Function to get work schedule of the specified employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
        //
        // Optional Parameters
        //  None
        public function getWorkSchedule($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            // Load the employee from the employees table
            $sqlQuery = 
                'SELECT ' .
                    'id, employee_id, enable_leave, monday_hours, tuesday_hours, wednesday_hours, ' .
                    'thursday_hours, friday_hours, saturday_hours, sunday_hours ' .
                'FROM work_schedules ' .
                'WHERE ' .
                    'employee_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create workschedule details
            $workSchedule = [];
            
            // Add work schedule if available
            if( $sqlResult->getRowCount() > 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                
                $workSchedule = [
                    'enableLeave' => $sqlRow['enable_leave'],
                    'monday' => $sqlRow['monday_hours'],
                    'tuesday' => $sqlRow['tuesday_hours'],
                    'wednesday' => $sqlRow['wednesday_hours'],
                    'thursday' => $sqlRow['thursday_hours'],
                    'friday' => $sqlRow['friday_hours'],
                    'saturday' => $sqlRow['saturday_hours'],
                    'sunday' => $sqlRow['sunday_hours']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'workSchedule' => $workSchedule
            ]) );
            
            return true;
        }
        
        // Function to reset leave
        //
        // Required Parameters
        //  employeeId              The id of the employee
        //  leaveTypeId             The id of the leave type
        //
        // Optional Parameters
        //  None
        public function resetLeave($data, $user, $db) {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE leave IN EXCLUSIVE MODE;');
            
            $sqlQuery = 
                'SELECT ' .
                    'SUM(hours) AS hours, SUM(days) AS days ' .
                'FROM ' .
                    'leave ' .
                'WHERE leave_type_id = $1 AND employee_id = $2 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId'], $data['employeeId']]);
            if( !$sqlResult->isValid() ) {
              echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
              return false;
            }
            
            $row = $sqlResult->fetchAssociative();
            $hours = $row['hours'];
            $days = $row['days'];
            
            $hours = 0 - floatval($hours);
            $days = 0 - floatval($days);
            $sqlQuery =
                'INSERT INTO leave( ' .
                    'leave_action_code, description, hours, days, date, employee_id, leave_type_id,  ' .
                    'leave_source_type_code, process_time, added_by_user_id ' .
                    ') ' .
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                'RESE',                         // leave_action_code,
                'Reset',                        // description
                $hours,                         // hours
                $days,                          // days
                date("Y-m-d"),                  // date
                $data['employeeId'],            // employee_id
                $data['leaveTypeId'],           // leave_type_id
                'MANU',                         // leave_source_type_code
                date("Y-m-d H:i:s"),            // process_time
                $_SESSION['userData']['id'],    // added_by_user_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([ 'ok' => true ]) );
            return true;
        }
        
        // Function to allocate leave
        //
        // Required Parameters
        //  employeeId              The id of the employee
        //  leaveTypeId             The id of the leave type
        //  action                  The action type
        //  amount                  The amount of leave
        //
        // Optional Parameters
        //  None
        public function allocateLeave($data, $user, $db) {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'action' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'date' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE leave IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE leave_types IN EXCLUSIVE MODE;');
            
            $sqlQuery = 
                'SELECT leave_unit_code ' .
                'FROM leave_types ' .
                'WHERE id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
              echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
              return false;
            }
            
            $row = $sqlResult->fetchAssociative();
            $leaveUnitType = $row['leave_unit_code'];
            
            $amount = floatval($data['amount']);
            if ($data['action'] === 'LEAR') {
                if ($amount < 0) {
                    echo( json_encode(['ok' => false, 'error' => 'Leave earned should be more than 0.']) );
                    return false;
                }
            }
            else if($data['action'] === 'LTAK') {
                if ( $amount < 0 ) {
                    $amount = floatval($data['amount']);
                }
                else {
                    $amount = 0 - floatval($data['amount']);
                }
            }
            
            $hours = $amount;
            $days = 0;
            if ($leaveUnitType === 'DAYS') {
                $hours = 0;
                $days = $amount;
            }
            
            $sqlQuery =
                'INSERT INTO leave( ' .
                    'leave_action_code, hours, days, date, employee_id, leave_type_id,  ' .
                    'leave_source_type_code, process_time, added_by_user_id, description ' .
                    ') ' .
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10); ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['action'],                     // leave_action_code
                $hours,                              // hours
                $days,                               // days
                $data['date'],                       // date
                $data['employeeId'],                 // employee_id
                $data['leaveTypeId'],                // leave_type_id
                'MANU',                              // leave_source_type_code
                date("Y-m-d H:i:s"),                 // process_time
                $_SESSION['userData']['id'],         // added_by_user_id
                $data['description']                 // description
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode([ 'ok' => true ]) );
            return true;
        }
        
        // Function to add leave type to employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
        //
        // Optional Parameters
        //  None
        public function subscribeLeave($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'unsubscribe' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            if (!$data['unsubscribe']) {
                
                $sqlQuery =
                    'INSERT INTO ' .
                        'leave_config_items ( ' .
                            'employee_id, ' .
                            'leave_type_id ' .
                        ') ' .
                    'VALUES ( ' .
                            ' $1,  $2 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeId'],                     // employee_id
                    $data['leaveTypeId']                     // leave_type_id
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            else {
                $sqlQuery =
                    'DELETE FROM leave_config_items WHERE employee_id = $1 AND leave_type_id = $2';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeId'],                     // employee_id
                    $data['leaveTypeId']                     // leave_type_id
                ]);
                
                if( !$sqlResult->isValid() ) {
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
        
        // Function to get employee leave types.
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
        //
        // Optional Parameters
        //  None
        public function getLeaveTypeList($data, $user, $db) {
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
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $startDate = $data['startDate'];
            if( $startDate === null ) $startDate = '1900-01-01';
            $endDate = $data['endDate'];
            if( $endDate === null ) $endDate = date('Y-m-d');
            
            // Load all available types
            $sqlQuery = 
                'SELECT ' .
                    'id, leave_types.name, leave_unit_code, leave_units.name AS leave_unit_name '.
                'FROM ' . 
                    'leave_types '.
                'LEFT JOIN ' .
                    'leave_units ON leave_units.code = leave_unit_code ' .
                'WHERE ' . 
                    'leave_types.is_deleted IS NOT TRUE ' .
                'ORDER BY ' . 
                    'leave_types.name;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $leaveTypes = [];
            
            while( $row = $sqlResult->fetchAssociative() ) {
                $startingBalance = 0.0;
                
                // Check if the employee is subscribed to the leave type
                $leaveConfigQuery = 'SELECT id FROM leave_config_items WHERE employee_id = $1 AND leave_type_id = $2;';
                $leaveConfigResult = $db->paramQuery($leaveConfigQuery, [
                    $data['employeeId'], 
                    $row['id']
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
                    if ($row['leave_unit_code'] === 'DAYS') {
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
                            $data['employeeId'], 
                            $row['id'],
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
                    else if ($row['leave_unit_code'] === 'HOUR') {
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
                            $data['employeeId'], 
                            $row['id'],
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
                
                $leaveTypes[] = [
                    'id' => $row['id'],
                    'isSubscribed' => $isSubscribed,
                    'name' => $row['name'],
                    'leaveUnitCode' => $row['leave_unit_code'],
                    'leaveUnitName' => $row['leave_unit_name'],
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
                    $row['id'], 
                    $data['employeeId'],
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
                    
                    $leaveTypes[$leaveTypeIndex]['leave'][] = [
                        'id' => $sqlRow['id'],
                        'leaveActionName'  => $sqlRow['leave_actions_name'],
                        'leaveActionCode' => $sqlRow['leave_action_code'],
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
                    $leaveTypes[count($leaveTypes)-1]['leave'][] = [
                        'id' => null,
                        'leaveActionName'  => null,
                        'leaveActionCode' => null,
                        'hours' => 0,
                        'days' => 0,
                        'balance' => $startingBalance,
                        'date' => $startDate,
                        'leaveSourceTypeCode' => null,
                        'leaveSourceTypesName' => null,
                        'description' => 'Balance Brought Forward'
                    ];
                }
            }
            
            
            // Send result
            echo( json_encode(['ok' => true,'leaveTypes' => $leaveTypes]) );
            
            return true;
        }
        
        // Function to get all employee leave balances for a given leave type
        //
        // Required Parameters
        //  leaveTypeId              The id of the leave type for which to get balances
        //
        // Optional Parameters
        //  None
        public function getLeaveBalanceList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'balanceDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Was no balance date provided?
            $balanceDate = $data['balanceDate'];
            if( $balanceDate == null ) {
                $balanceDate = date('Y-m-d');
            }
            
            // Get all the employees subscribed to the specified leav type
            $sqlQuery = 
                'WITH employee_leave_balance AS ( ' .
                    'SELECT ' .
                        'leave.employee_id, ' .
                        'leave.leave_type_id, ' .
                        'SUM(leave.hours) AS hours, ' .
                        'SUM(leave.days) AS days ' .
                    'FROM ' .
                        'leave ' .
                    'WHERE ' .
                        'leave.leave_type_id = $1 AND ' .
                        'leave.date <= $2 ' .
                    'GROUP BY ' .
                        'leave.employee_id, ' .
                        'leave.leave_type_id ' .
                    'ORDER BY ' .
                        'leave.employee_id ASC ' .
                ') ' .
                'SELECT DISTINCT ' .
                    'leave_config_items.employee_id, ' .
                    'employees.code AS employee_code, ' .
                    'employees.alias AS employee_alias, ' .
                    'leave_types.name AS leave_type_name, ' .
                    'leave_types.leave_unit_code AS leave_type_unit_code, ' .
                    'leave_types.start_date AS leave_type_start_date, ' .
                    // 'employee_leave_balance.hours AS hour_balance, ' .
                    // 'employee_leave_balance.days AS day_balance, ' .
                    '( COALESCE(employee_leave_balance.hours, 0) + COALESCE(employee_leave_balance.days, 0) ) AS leave_balance ' .
                'FROM ' .
                    'leave_config_items ' .
                'LEFT JOIN ' .
                    'leave_types ON leave_types.id = leave_config_items.leave_type_id ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = leave_config_items.employee_id ' .
                'LEFT JOIN ' .
                    'employee_leave_balance ON employee_leave_balance.employee_id = employees.id ' .
                'WHERE ' .
                    '( ' .
                        'employees.employment_end_date >= $2 OR ' .
                        'employees.employment_end_date IS NULL ' .
                    ') AND ' .
                    'leave_types.id = $1 ' .
                'ORDER BY ' .
                    'employees.alias;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['leaveTypeId'],       // leave_types.id
                $balanceDate                // leave.date
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $employees = [];
            while( $row = $sqlResult->fetchAssociative() ) {
                $employees[] = [
                    'employeeId' => $row['employee_id'],
                    'employeeCode' => $row['employee_code'],
                    'employeeAlias' => $row['employee_alias'],
                    'leaveTypeName' => $row['leave_type_name'],
                    'leaveTypeUnitCode' => $row['leave_type_unit_code'],
                    'leaveTypeStartDate' => $row['leave_type_start_date'],
                    'leaveBalance' => $row['leave_balance']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true,'employees' => $employees]) );
            return true;
        }
        
        // Function to allocate leave
        //
        // Required Parameters
        //  employeeId              The id of the employee
        //  leaveTypeId             The id of the leave type
        //  action                  The action type
        //  amount                  The amount of leave
        //
        // Optional Parameters
        //  None
        public function bulkAllocateLeave($data, $user, $db) {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'allocations' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'action' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                        'date' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Do sanity checks for every allocation
            foreach( $data['allocations'] AS $allocation ) {
                // Check amount depending on action type
                $amount = floatval($allocation['amount']);
                if( $allocation['action'] === 'LEAR' ) {
                    if( !($amount > -0.009) ) {
                        echo( json_encode(['ok' => false, 'error' => 'Leave earned should be a positive amount.']) );
                        return false;
                    }
                }
                else if( $allocation['action'] === 'LTAK' ) {
                    if( !($amount < 0.001) ) {
                        echo( json_encode(['ok' => false, 'error' => 'Leave taken should be a negative amount.']) );
                        return false;
                    }
                }
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE leave IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE leave_types IN EXCLUSIVE MODE;');
            
            // For every allocation
            foreach( $data['allocations'] AS $allocation ) {
                // Get the leave unit type
                $sqlQuery = 'SELECT leave_unit_code FROM leave_types WHERE id = $1 ';
                $sqlResult = $db->paramQuery($sqlQuery, [$allocation['leaveTypeId']]);
                if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
                }
                
                $row = $sqlResult->fetchAssociative();
                $leaveUnitType = $row['leave_unit_code'];
                
                // Format the amount depending on the leave action
                $amount = floatval($allocation['amount']);
                
                // Set the amount of units depending on the unit type
                $hours = $amount;
                $days = 0;
                if ($leaveUnitType === 'DAYS') {
                    $hours = 0;
                    $days = $amount;
                }
                
                // Is the leave being reset?
                if( $allocation['action'] === 'RESE' ) {
                    // Replace the amount of units with updated amounts
                    $sqlQuery = 
                        'SELECT ' .
                            'SUM(hours) AS hours, ' . 
                            'SUM(days) AS days ' .
                        'FROM ' .
                            'leave ' .
                        'WHERE ' . 
                            'leave_type_id = $1 AND ' . 
                            'employee_id = $2;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $allocation['leaveTypeId'],     // leave_type_id
                        $allocation['employeeId']       // employee_id
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    $row = $sqlResult->fetchAssociative();
                    $hours = $row['hours'];
                    $days = $row['days'];
                    
                    $hours = 0 - floatval($hours);
                    $days = 0 - floatval($days);
                }
                
                // Skip if no hours or days was specified
                if( ( ($hours < 0.001) && ($hours > -0.009) ) &&
                    ( ($days < 0.001) && ($days > -0.009) ) ) {
                    continue;
                }
                
                // Insert the leave allocation
                $sqlQuery =
                    'INSERT INTO leave( ' .
                        'leave_action_code, ' . 
                        'hours, ' . 
                        'days, ' . 
                        'date, ' . 
                        'employee_id, ' . 
                        'leave_type_id, ' . 
                        'leave_source_type_code, ' . 
                        'process_time, ' . 
                        'added_by_user_id, ' . 
                        'description ' .
                    ') ' .
                    'VALUES (' . 
                        '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10' .
                    '); ';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $allocation['action'],              // leave_action_code
                    $hours,                             // hours
                    $days,                              // days
                    $allocation['date'],                // date
                    $allocation['employeeId'],          // employee_id
                    $allocation['leaveTypeId'],         // leave_type_id
                    'MANU',                             // leave_source_type_code
                    date("Y-m-d H:i:s"),                // process_time
                    $_SESSION['userData']['id'],        // added_by_user_id
                    $allocation['description']          // description
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode([ 'ok' => true ]) );
            return true;
        }
        
        // Function to list employees
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortList                An array of items indicating the order the list should be sorted
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortList' => null,
                'departmentName' => '',
                'employeeStatus' => '',
                'departmentId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'departmentName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employeeStatus' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
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
                $whereClause = 
                    ' WHERE (' . 
                    'employees.code ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ' OR employees.full_names || \' \' || employees.last_name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR employees.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR employees.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR employees.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR departments.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            // Was a sort list specified?
            $sortClause = '';
            if( isset($data['sortList']) ) {
                // For every item in the sort list
                foreach( $data['sortList'] AS $sortItem ) {
                    // Was a valid sort order specified?
                    if( $sortItem['order'] !== 'ASC' && $sortItem['order'] !== 'DESC' ) {
                        echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
                        return false;
                    }
                    
                    // Setup the column to sort by
                    $column = '';
                    switch( $sortItem['dataIndex'] ) {
                        case 'code':
                            $column = 'employees.code';
                            break;
                        case 'name':
                            $column = 'employees.alias';
                            break;
                        case 'email':
                            $column = 'employees.email_address';
                            break;
                        case 'cellphone':
                            $column = 'employees.cell_number';
                            break;
                        case 'department':
                            $column = 'departments.name';
                            break;
                        case 'employmentStatus':
                            $column = '(CASE WHEN employment_end_date IS NOT NULL THEN \'E\' ELSE \'D\' END)';
                            break;
                        case 'employmentDate':
                            $column = 'employment_start_date';
                            break;
                        default:
                            echo(json_encode(['ok' => false, 'error' => 'Invalid sort column specified']));
                            return false;
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
            
            // Should a departmentId filter be added?
            if( isset($data['departmentId']) && $data['departmentId'] !== '' ) {
                if( $whereClause === '') 
                    $whereClause = 'WHERE ' ;
                else 
                    $whereClause = $whereClause . 'AND ';
                $sqlParams[] = $data['departmentId'];
                $whereClause = $whereClause . ' departments.id = $' . count($sqlParams);
            }
            
            // Should a departmentName filter be added?
            if( isset($data['departmentName']) && $data['departmentName'] !== '' ) {
                if( $whereClause === '') 
                    $whereClause = 'WHERE ' ;
                else 
                    $whereClause = $whereClause . 'AND ';
                $sqlParams[] = $data['departmentName'];
                $whereClause = $whereClause . ' departments.name = $' . count($sqlParams);
            }
            
            // Should a employment status filter be added?
            if( isset($data['employeeStatus']) && $data['employeeStatus'] !== '' ) {
                if ($data['employeeStatus'] !== 'all') {
                    if( $whereClause === '') {
                        $whereClause = 'WHERE ' ;
                    }
                    else {
                        $whereClause = $whereClause . 'AND ';
                    }
                    
                    if ($data['employeeStatus'] === 'employed') {
                        $whereClause = $whereClause . ' employment_end_date IS NULL ';
                    }
                    else if ($data['employeeStatus'] === 'dismissed') {
                        $whereClause = $whereClause . 'employment_end_date IS NOT NULL AND employment_end_date <= NOW()::Date ';
                    }
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
            
            // Load all employees from the employees table
            $sqlQuery = 
                'WITH dismissal_reasons AS ( ' .
                    'SELECT DISTINCT ON( employee_id ) ' .
                        'employee_id, ' .
                        'dismissal_date, ' .
                        'dismissal_reason AS code, ' .
                        'employee_dismissal_reasons.name AS name ' .
                    'FROM ' .
                        'employment_history ' .
                    'LEFT JOIN ' .
                        'employee_dismissal_reasons ON employee_dismissal_reasons.code = employment_history.dismissal_reason ' .
                    'WHERE ' .
                        'dismissal_date IS NOT NULL ' .
                    'ORDER BY ' .
                        'employee_id ASC, ' .
                        'dismissal_date DESC ' .
                ') ' .
                'SELECT ' .
                    'employees.id, ' . 
                    'employees.code, ' . 
                    'employees.last_name, ' . 
                    'employees.alias, ' .
                    'employees.email_address, ' . 
                    'employees.cell_number, ' . 
                    'employment_start_date, ' . 
                    'employment_end_date, ' . 
                    'employees.department_id, ' .
                    'departments.name AS department_name, ' .
                    'dismissal_reasons.code AS dismissal_reasons_code, ' .
                    'dismissal_reasons.name AS dismissal_reasons_name ' .
                'FROM ' .
                    'employees ' .
                'LEFT JOIN ' .
                    'departments ON employees.department_id = departments.id ' .
                'LEFT JOIN ' .
                    'dismissal_reasons ON dismissal_reasons.employee_id = employees.id ' .
                $whereClause . ' ' .
                $sortClause . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $employees = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $employmentEndDate = ($sqlRow['employment_end_date'] !== null ? new DateTime($sqlRow['employment_end_date']) : null);
                $employmentStartDate = new DateTime($sqlRow['employment_start_date']);
                $currentDate = new DateTime();
                $employmentStatus = 'Employed';
                if ($sqlRow['employment_end_date'] !== null) {
                    if ($employmentEndDate <= $currentDate) {
                        if( $sqlRow['dismissal_reasons_code'] !== null ) {
                            $employmentStatus = $sqlRow['dismissal_reasons_name'];
                        }
                        else {
                            $employmentStatus = 'Dismissed';
                        }
                    }
                }
                
                if ($employmentStartDate > $currentDate) {
                    $employmentStatus = 'Pending';
                }
                
                $employees[] = [
                    'id' => $sqlRow['id'],
                    'code' => $sqlRow['code'],
                    'alias' => $sqlRow['alias'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'departmentId' => $sqlRow['department_id'],
                    'departmentName' => $sqlRow['department_name'],
                    'employmentStartDate' => $sqlRow['employment_start_date'],
                    'employmentEndDate' => $sqlRow['employment_end_date'],
                    'employmentStatus' => $employmentStatus,
                    'dismissalReasonsCode' => $sqlRow['dismissal_reasons_code'],
                    'dismissalReasonsName' => $sqlRow['dismissal_reasons_name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'employees' => $employees
            ]) );
            
            return true;
        }
        
        // Function to add an employee
        //
        // Required Parameters
        //  code                        The employee's code.
        //  titleCode                   The employee's title code
        //  initials                    The employee's initials
        //  fullNames                   The employee's full names
        //  lastName                    The employee's last name
        //  alias                       The employee's nickname
        //  dateOfBirth                 The employee's date of birth
        //  isAsylumSeeker              Whether the employee is an asylum seeker (true or false)
        //  isRefugee                   Whether the employee is a refugee (true or false)
        //  isRetired                   Whether the employee is retired (true or false)
        //  cellNumber                  The employee's cell number
        //  emailAddress                The employee's email address
        //  employmentStartDate         The the date on which the employee was employed
        //  employmentPosition          The employee's position
        //  paymentMethodCode           The payment method code for the employee
        //  paymentPeriodCode           The payment period code for the employee
        //  paymentPeriodEndDay         The day of the month on which the employee gets paid
        //  incomeTaxNumber             The employee's income tax number
        //  enablePayeCorrection        Whether to enable PAYE corrections or not
        //  sicCode                     The employee's standard industrial classification code
        //
        // Optional Parameters
        //  idNumber                    The employee's id number
        //  passportNumber              The employee's passport number
        //  passportCountry             The employee's passport country
        //  bankDetails => [
        //      financialInstitution => [
        //          code                The code of the financial institution.
        //      ],
        //      accountType => [
        //          code                The account type code.
        //      ],
        //      accountNumber,          The account number.
        //      branchCode              The employee's bank branch code.
        //  ]
        //  physicalAddressUnit         The employee's physical address details
        //  physicalAddressComplex
        //  physicalAddressStreet
        //  physicalAddressSuburb
        //  physicalAddressCity
        //  physicalAddressPostalCode
        //  physicalAddressCountryCode
        //  postalAddressLine1          The employee's postal address details
        //  postalAddressLine2
        //  postalAddressLine3
        //  postalAddressCode
        //  postalAddressCountryCode
        //  useCompanyWorkAddress       Whether to use the company work address (true or false)
        //  workAddressUnit             The employee's work address details
        //  workAddressComplex
        //  workAddressStreet
        //  workAddressSuburb
        //  workAddressCity
        //  workAddressPostalCode
        //  workAddressCountryCode
        //  homeNumber                  The employee's home phone number
        //  workNumber                  The employee's work phone number
        //  faxNumber                   The employee's fax number
        //  emergencyContactPerson      The employee's emergency contact person
        //  emergencyContactNumber      The employee's emergency contact number
        //  employmentEndDate           The the date on which the employee was terminated
        //  departmentId                The id of the employee's department
        //  sendPayslipByEmail          Should payslips be emailed to employee.
        //  incomeTaxDirective1         The first income tax directive for the employee
        //  incomeTaxDirective2         The second income tax directive for the employee
        //  incomeTaxDirective3         The third income tax directive for the employee
        public function add($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'idNumber' => '',
                'passportNumber' => '',
                'passportCountry' => null,
                'bankDetails' => null,
                'physicalAddressUnit' => '',
                'physicalAddressComplex' => '',
                'physicalAddressStreet' => '',
                'physicalAddressSuburb' => '',
                'physicalAddressCity' => '',
                'physicalAddressPostalCode' => '',
                'physicalAddressCountryCode' => null,
                'postalAddressLine1' => '',
                'postalAddressLine2' => '',
                'postalAddressLine3' => '',
                'postalAddressCode' => '',
                'postalAddressCountryCode' => null,
                'useCompanyWorkAddress' => false,
                'workAddressUnit' => '',
                'workAddressComplex' => '',
                'workAddressStreet' => '',
                'workAddressSuburb' => '',
                'workAddressCity' => '',
                'workAddressPostalCode' => '',
                'workAddressCountryCode' => null,
                'homeNumber' => '',
                'workNumber' => '',
                'faxNumber' => '',
                'emergencyContactPerson' => '',
                'emergencyContactNumber' => '',
                'employmentEndDate' => null,
                'departmentId' => null,
                'sendPayslipByEmail' => false,
                'incomeTaxDirective1' => '',
                'incomeTaxDirective1IssuedOn' => null,
                'incomeTaxDirective1SourceCode' => '',
                'incomeTaxDirective1Amount' => null,
                'incomeTaxDirective2' => '',
                'incomeTaxDirective2IssuedOn' => null,
                'incomeTaxDirective2SourceCode' => '',
                'incomeTaxDirective2Amount' => null,
                'incomeTaxDirective3' => '',
                'incomeTaxDirective3IssuedOn' => null,
                'incomeTaxDirective3SourceCode' => '',
                'incomeTaxDirective3Amount' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'titleCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'initials' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'fullNames' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'lastName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'alias' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'dateOfBirth' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'isAsylumSeeker' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'isRefugee' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'isRetired' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'employmentStartDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'paymentMethodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'paymentPeriodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'paymentPeriodEndDay' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'paymentDay' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'incomeTaxNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'enablePayeCorrection' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'sicCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'postalSameAsPhysical' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'idNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_EMAIL, 'required' => false, 'nullable' => false],
                'passportNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'passportCountry' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'bankDetails' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => true, 'rules' => [
                    'financialInstitution' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                    ]],
                    'accountType' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                    ]],
                    'accountNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                    'branchCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
                ]],
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
                'postalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'useCompanyWorkAddress' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'workAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'homeNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'faxNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emergencyContactPerson' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emergencyContactNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employmentEndDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'employmentPosition' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sendPayslipByEmail' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective1SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'incomeTaxDirective2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective2IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective2SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective2Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'incomeTaxDirective3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective3IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective3SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective3Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'payslipItems' => [
                    'type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                        ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                            'code' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                            'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                            'autoCalculate' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => true],
                            'unitSourceCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                            'includeInNettPay' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                            'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                            'isOnceOff' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => true]
                            ]
                        ]
                    ]
                ],
                'leave' => [
                    'type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                        ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                            'leaveTypeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                'leaveItems' => [
                                    'type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                                        ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                                            'date' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'action' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'source' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                            ]
                                        ]
                                    ]
                                ],
                            ]
                        ]
                    ]
                ],
                'retirmentFundItems' => [
                    'type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                        ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                            'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                'rfiItems' => [
                                    'type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                                        ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                                            'payslipItemTypesCode' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'percentage' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                                            'uniqueId' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                                            ]
                                        ]
                                    ]
                                ],
                            ]
                        ]
                    ]
                ],
                'workSchedule' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => true, 'rules' => [
                    'enableLeave' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                    'mondayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'tuesdayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'wednesdayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'thursdayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'fridayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'saturdayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                    'sundayHours' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
                ]]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Check that either id number or passport number is given
            if( ( !isset( $data['idNumber'] ) && !isset( $data['passportNumber'] ) ) ||
                ( ( $data['idNumber'] == '' ) && ( $data['passportNumber'] == '' ) ) )  {
                echo( json_encode(['ok' => false, 'error' => 'Either an id number or passport number is required']) );
                return false;
            }
            // if id number is given check its validity
            if (isset($data['idNumber']) && trim($data['idNumber']) != '') {
                $result = Util::validateSouthAfricanId($data['idNumber']);
                if ($result['error'] != null) {
                    echo(json_encode(['ok' => false, 'error' => $result['errorMessage']]));
                    return false;
                }
            }
            // If passport number is given, passport country is also required
            if( isset( $data['passportNumber'] ) &&  ( $data['passportNumber'] != '' ) ) {
                if( !isset( $data['passportCountry'] ) ||  ( $data['passportCountry'] == '' ) ) {
                    echo( json_encode(['ok' => false, 'error' => 'Passport country is required']) );
                    return false;
                }
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
            $numberMask = new NumberMask( $config['employee_code_mask'] );
            
            // Check that the employee code provided is valid
            if( $numberMask->validate($data['code']) !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee code (\'' . $data['code'] . '\') is not in the correct format (\'' . $config['employee_code_mask'] . '\').']) );
                return false;
            }
            
            // Connect to the database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the employee limit for the relevant company
            $sqlQuery =
                'SELECT ' .
                    'companies.employee_limit ' . 
                'FROM ' . 
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $_SESSION['userData']['companyId']      // company_id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to get company employee limit.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company not found.' 
                ]) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeLimit = $sqlRow['employee_limit'];
            
            // Set search path to the schema
            $dbSettings = $_SESSION['dbCache'];
            $sqlResult = $db->paramQuery('SET search_path TO '. $dbSettings['schema'] . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to schema.']) );
                return false;
            }
            
            // Is there an employment limit?
            if( $employeeLimit !== null ) {
                // Get the number of employees for the company
                $sqlQuery =
                    'SELECT ' .
                        'COUNT( id ) AS employee_count ' . 
                    'FROM ' . 
                        'employees ' .
                    'WHERE ' .
                        'employment_end_date IS NULL;';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Unable to get number of employees.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                if( $sqlRow['employee_count'] >= $employeeLimit ) {
                    echo( json_encode(['ok' => false, 'error' => 'Unable to add another employee. Your company is limited to ' . $employeeLimit. ' employees.']) );
                    return false;
                }
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE employment_history IN EXCLUSIVE MODE;');
            
            // Check that the employee code has not already been used.
            $sqlQuery = 'SELECT id, alias FROM employees WHERE lower(code) = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['code']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() > 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                echo( json_encode([
                    'ok' => false, 
                    'error' => 'Code \'' . strtoupper($data['code']) . '\' has already been assigned to \'' . 
                        $sqlRow['alias'] . '\'.' 
                ]) );
                return false;
            }
            
            // Set default values for work address
            $workAddressUnit = $data['workAddressUnit'];
            $workAddressComplex = $data['workAddressComplex'];
            $workAddressStreet = $data['workAddressStreet'];
            $workAddressSuburb = $data['workAddressSuburb'];
            $workAddressCity = $data['workAddressCity'];
            $workAddressPostalCode = $data['workAddressPostalCode'];
            $workAddressCountryCode = $data['workAddressCountryCode'];
            
            // Should we use the company work address?
            if( isset( $data['useCompanyWorkAddress'] ) &&  ( $data['useCompanyWorkAddress'] === true ) ) {
                // Load the company physical address from the company_details table
                $sqlQuery = 
                    'SELECT ' .
                        'company_details.physical_address_unit, ' .
                        'company_details.physical_address_complex, ' .
                        'company_details.physical_address_street, ' .
                        'company_details.physical_address_suburb, ' .
                        'company_details.physical_address_city, ' .
                        'company_details.physical_address_postal_code, ' .
                        'company_details.physical_address_country_code ' .
                    'FROM ' .
                        'company_details ' .
                    'LIMIT 1;';
                $sqlResult = $db->paramQuery($sqlQuery, []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Company address not found']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $workAddressUnit = $sqlRow['physical_address_unit'];
                $workAddressComplex = $sqlRow['physical_address_complex'];
                $workAddressStreet = $sqlRow['physical_address_street'];
                $workAddressSuburb = $sqlRow['physical_address_suburb'];
                $workAddressCity = $sqlRow['physical_address_city'];
                $workAddressPostalCode = $sqlRow['physical_address_postal_code'];
                $workAddressCountryCode = $sqlRow['physical_address_country_code'];
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO ' .
                    'employees ( ' .
                        'code, ' . 
                        'title_code, ' . 
                        'initials, ' . 
                        'full_names, ' . 
                        'first_name, ' . 
                        'last_name, ' . 
                        'alias, ' .
                        'id_number, ' . 
                        'passport_number, ' . 
                        'passport_country, ' . 
                        'date_of_birth, ' .
                        'is_asylum_seeker, ' . 
                        'is_refugee, ' . 
                        'is_retired, ' .
                        'physical_address_unit, ' . 
                        'physical_address_complex, ' . 
                        'physical_address_street, ' . 
                        'physical_address_suburb, ' .
                        'physical_address_city, ' . 
                        'physical_address_postal_code, ' . 
                        'physical_address_country_code, ' .
                        'postal_same_as_physical_address, ' . 
                        'postal_address_line_1, ' . 
                        'postal_address_line_2, ' . 
                        'postal_address_line_3, ' . 
                        'postal_address_code, ' .
                        'postal_address_country_code, ' .
                        'work_same_as_company_address, ' . 
                        'work_address_unit, ' . 
                        'work_address_complex, ' . 
                        'work_address_street, ' . 
                        'work_address_suburb, ' .
                        'work_address_city, ' . 
                        'work_address_postal_code, ' . 
                        'work_address_country_code, ' .
                        'home_number, ' . 
                        'work_number, ' . 
                        'cell_number, ' . 
                        'fax_number, ' . 
                        'email_address, ' .
                        'emergency_contact_person, ' . 
                        'emergency_contact_number, ' .
                        'employment_start_date, ' . 
                        'employment_end_date, ' . 
                        'employment_position, ' .
                        'department_id, ' .
                        'send_payslip_by_email, ' . 
                        'payment_method_code, ' . 
                        'payment_period_code, ' .
                        'payment_period_end_day, ' . 
                        'payment_day, ' . 
                        'income_tax_number, ' .
                        'enable_paye_correction, ' .
                        'income_tax_directive_1, ' . 
                        'income_tax_directive_1_issued_date, ' . 
                        'income_tax_directive_1_source_code, ' . 
                        'income_tax_directive_1_amount, ' . 
                        'income_tax_directive_2, ' . 
                        'income_tax_directive_2_issued_date, ' . 
                        'income_tax_directive_2_source_code, ' . 
                        'income_tax_directive_2_amount, ' . 
                        'income_tax_directive_3, ' . 
                        'income_tax_directive_3_issued_date, ' . 
                        'income_tax_directive_3_source_code, ' . 
                        'income_tax_directive_3_amount, ' . 
                        'sic_code, ' .
                        'created_on, ' . 
                        'created_by_user_id ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' .
                        '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' .
                        '$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, ' .
                        '$31, $32, $33, $34, $35, $36, $37, $38, $39, $40, ' .
                        '$41, $42, $43, $44, $45, $46, $47, $48, $49, $50, ' .
                        '$51, $52, $53, $54, $55, $56, $57, $58, $59, $60, ' .
                        '$61, $62, $63, $64, $65, $66, $67, $68 ' .
                    ') ' .
                'RETURNING id, employment_position, employment_start_date;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                strtoupper($data['code']),              // code
                $data['titleCode'],                     // title_code
                $data['initials'],                      // initials
                $data['fullNames'],                     // full_names
                explode($data['fullNames'], ' ')[0],    // first_name
                $data['lastName'],                      // last_name
                $data['alias'],                         // alias
                $data['idNumber'],                      // id_number
                $data['passportNumber'],                // passport_number
                $data['passportCountry'],               // passport_country
                $data['dateOfBirth'],                   // date_of_birth
                $data['isAsylumSeeker'],                // is_asylum_seeker
                $data['isRefugee'],                     // is_refugee
                $data['isRetired'],                     // is_retired
                $data['physicalAddressUnit'],           // physical_address_unit
                $data['physicalAddressComplex'],        // physical_address_complex
                $data['physicalAddressStreet'],         // physical_address_street
                $data['physicalAddressSuburb'],         // physical_address_suburb
                $data['physicalAddressCity'],           // physical_address_city
                $data['physicalAddressPostalCode'],     // physical_address_postal_code
                $data['physicalAddressCountryCode'],    // physical_address_country_code
                $data['postalSameAsPhysical'],          // postal_same_as_physical_address
                $data['postalAddressLine1'],            // postal_address_line_1
                $data['postalAddressLine2'],            // postal_address_line_2
                $data['postalAddressLine3'],            // postal_address_line_3
                $data['postalAddressCode'],             // postal_address_code
                $data['postalAddressCountryCode'],      // postal_address_country_code
                $data['useCompanyWorkAddress'],         // work_same_as_company_address
                $workAddressUnit,                       // work_address_unit
                $workAddressComplex,                    // work_address_complex
                $workAddressStreet,                     // work_address_street
                $workAddressSuburb,                     // work_address_suburb
                $workAddressCity,                       // work_address_city
                $workAddressPostalCode,                 // work_address_postal_code
                $workAddressCountryCode,                // work_address_country_code
                $data['homeNumber'],                    // home_number
                $data['workNumber'],                    // work_number
                $data['cellNumber'],                    // cell_number
                $data['faxNumber'],                     // fax_number
                $data['emailAddress'],                  // email_address
                $data['emergencyContactPerson'],        // emergency_contact_person
                $data['emergencyContactNumber'],        // emergency_contact_number
                $data['employmentStartDate'],           // employment_start_date
                $data['employmentEndDate'],             // employment_end_date
                $data['employmentPosition'],            // employment_position
                $data['departmentId'],                  // department_id
                $data['sendPayslipByEmail'],            // send_payslip_by_email
                $data['paymentMethodCode'],             // payment_method_code
                $data['paymentPeriodCode'],             // payment_period_code
                $data['paymentPeriodEndDay'],           // payment_period_end_day
                $data['paymentDay'],                    // payment_day
                $data['incomeTaxNumber'],               // income_tax_number
                $data['enablePayeCorrection'],          // enable_paye_correction
                $data['incomeTaxDirective1'],           // income_tax_directive_1
                $data['incomeTaxDirective1IssuedOn'],   // income_tax_directive_1_issued_date
                $data['incomeTaxDirective1SourceCode'], // income_tax_directive_1_source_code
                $data['incomeTaxDirective1Amount'],     // income_tax_directive_1_amount
                $data['incomeTaxDirective2'],           // income_tax_directive_2
                $data['incomeTaxDirective2IssuedOn'],   // income_tax_directive_2_issued_date
                $data['incomeTaxDirective2SourceCode'], // income_tax_directive_2_source_code
                $data['incomeTaxDirective2Amount'],     // income_tax_directive_2_amount
                $data['incomeTaxDirective3'],           // income_tax_directive_3
                $data['incomeTaxDirective3IssuedOn'],   // income_tax_directive_3_issued_date
                $data['incomeTaxDirective3SourceCode'], // income_tax_directive_3_source_code
                $data['incomeTaxDirective3Amount'],     // income_tax_directive_3_amount
                $data['sicCode'],                       // sic_code
                date("Y-m-d"),
                $user['id']
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeId = $sqlRow['id'];
            $employmentPosition = $sqlRow['employment_position'];
            $employmentStartDate = $sqlRow['employment_start_date'];
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO ' .
                    'employment_history ( ' .
                        'employee_id, ' .
                        'employed_by_user_id, ' .
                        'employed_on, ' .
                        'employment_position, ' .
                        'employment_date, ' .
                        'dismissed_by_user_id, ' .
                        'dismissed_on, ' .
                        'dismissal_position, ' .
                        'dismissal_date ' .
                    ') ' .
                'VALUES ( ' .
                        ' $1,  $2,  $3,  $4,  $5,  $6, $7, $8, $9 '.
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId,             // employee_id
                $user['id'],             // employed_by_user_id
                date("Y-m-d H:i:s"),     // employed_on
                $employmentPosition,     // employment_position
                $employmentStartDate,    // employment_date
                null,                    // dismissed_by_user_id
                null,                    // dismissed_on
                null,                    // dismissal_position
                null                     // dismissal_date
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( isset($data['postalSameAsPhysical'])) {
                if ($data['postalSameAsPhysical']) {
                    
                    $sqlQuery =
                        'SELECT ' .
                            'physical_address_unit, ' .
                            'physical_address_complex, ' .
                            'physical_address_street ' .
                        'FROM employees ' .
                        'WHERE employees.id = $1';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $employeeId              // employee_id
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $physicalAddressUnit = $sqlRow['physical_address_unit'];
                    $physicalAddressComplex = $sqlRow['physical_address_complex'];
                    $physicalAddressStreet = $sqlRow['physical_address_street'];
                    
                    $line1 = '';
                    if($physicalAddressUnit !== '') {
                        $line1 = $physicalAddressUnit;
                    }
                    if ($physicalAddressComplex !== '') {
                        if ($line1 !== '') {
                            $line1 = $line1 . ', ' . $physicalAddressComplex;
                        }
                        else{
                            $line1 = $physicalAddressComplex;
                        }
                        
                    }
                    if ($physicalAddressStreet !== '') {
                        if ($line1 !== '') {
                            $line1 = $line1 . ', ' . $physicalAddressStreet;
                        }
                        else {
                            $line1 = $physicalAddressStreet;
                        }
                        
                    }
                    
                    $sqlQuery =
                        'UPDATE employees ' .
                        'SET ' .
                            'postal_address_line_1 = $1, ' .
                            'postal_address_line_2 = physical_address_suburb, ' .
                            'postal_address_line_3 = physical_address_city, ' .
                            'postal_address_code = physical_address_postal_code, ' .
                            'postal_address_country_code = physical_address_country_code ' .
                        'WHERE employees.id = $2';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $line1,
                        $employeeId              // employee_id
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Add banking details if provided
            if( $data['bankDetails'] !== null ) {
                $bankDetails = $data['bankDetails'];
                
                // Load banking details
                $institutionCode = null;
                if( array_key_exists('financialInstitution', $bankDetails) ) $institutionCode = $bankDetails['financialInstitution']['code'];
                $accountType = null;
                if( array_key_exists('accountType', $bankDetails) ) $accountType = $bankDetails['accountType']['code'];
                $accountNumber = '';
                if( array_key_exists('accountNumber', $bankDetails) ) $accountNumber = $bankDetails['accountNumber'];
                $branchCode = '';
                if( array_key_exists('branchCode', $bankDetails) ) $branchCode = $bankDetails['branchCode'];
                
                // Only add an entry if the banking details are not empty.
                if( $institutionCode !== null || $accountType !== null || $accountNumber !== '' || $branchCode !== '' ) {
                    $sqlQuery = 
                        'INSERT INTO ' . 
                            'employee_bank_details (employee_id, financial_institution_code, bank_account_type_code, ' . 
                            'account_number, branch_code) ' . 
                        'VALUES ' . 
                            '($1, $2, $3, $4, $5);';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $employeeId,                // employee_id
                        $institutionCode,           // financial_institution_code
                        $accountType,               // bank_account_type_code
                        $accountNumber,             // account_number
                        $branchCode                 // branch_code
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            $payslipItemsList = [];
            // Add payslip items if any was provided
            if (isset($data['payslipItems'])) {
                $db->query('LOCK TABLE payslip_config_items IN EXCLUSIVE MODE;');
                $db->query('LOCK TABLE payslip_item_types IN EXCLUSIVE MODE;');
                
                for ($i=0; $i < count($data['payslipItems']); $i++) {
                    
                    $code = $data['payslipItems'][$i]['code'];
                    $description = $data['payslipItems'][$i]['description'];
                    $autoCalculate = $data['payslipItems'][$i]['autoCalculate'];
                    $unitSourceCode = $data['payslipItems'][$i]['unitSourceCode'];
                    $includeInNettPay = $data['payslipItems'][$i]['includeInNettPay'];
                    $amount = $data['payslipItems'][$i]['amount'];
                    $isOnceOff = $data['payslipItems'][$i]['isOnceOff'];
                    $categoryCode = $data['payslipItems'][$i]['categoryCode'];
                    $uniqueId = $data['payslipItems'][$i]['uniqueId'];
                    
                    // Load the type from the database
                    $sqlQuery = 'SELECT code, is_once_off, auto_calculate, default_amount, is_enabled FROM payslip_item_types WHERE code = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$code]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Check if the type was found
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $code . '\' not found.']) );
                        return false;
                    }
                    
                    // Get the row from the result.
                    $sqlRow = $sqlResult->fetchAssociative();
                    
                    // Check if the type is enabled
                    if( $sqlRow['is_enabled'] !== true ) {
                        echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $code . '\' is disabled.']) );
                        return false;
                    }
                    
                    // If auto calculate is set, check that the item supports it.
                    if( $autoCalculate === true && $sqlRow['auto_calculate'] !== true ) {
                        echo( json_encode(['ok' => false, 'error' => 'This item can not be set to auto calculate.']) );
                        return false;
                    }
                    
                    // Build the query to insert the item.
                    $sqlQuery =
                        'INSERT INTO payslip_config_items ( ' . 
                            'payslip_item_type_code, ' . 
                            'employee_id, ' . 
                            'description, ' . 
                            'accrual_date, ' . 
                            'auto_calculate, ' . 
                            'unit_source_code, ' . 
                            'include_in_nett_pay, ' . 
                            'amount ' . 
                        ') ' .
                        'VALUES ( ' . 
                            '$1, $2, $3, $4, $5, $6, $7, $8 ' . 
                        ') ' . 
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $code,              // payslip_item_type_code
                        $employeeId,        // employee_id
                        $description,       // description
                        null,               // accrual_date
                        $autoCalculate,     // auto_calculate
                        $unitSourceCode,    // unit_source_code
                        $includeInNettPay,  // include_in_nett_pay
                        $amount             // amount
                    ]);
                    
                    if ($categoryCode === 'INCO') {
                        $row = $sqlResult->fetchAssociative();
                        $payslipConfigItemId = $row['id'];
                        $payslipItemsList[] = [
                            'payslipConfigItemId' => $payslipConfigItemId,
                            'uniqueId' => $uniqueId,
                        ];
                    }
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Add leave if any was provided
            if (isset($data['leave'])) {
                // Lock the relevant table(s)
                $db->query('LOCK TABLE leave IN EXCLUSIVE MODE;');
                $db->query('LOCK TABLE leave_types IN EXCLUSIVE MODE;');
                $db->query('LOCK TABLE leave_config_items IN EXCLUSIVE MODE;');
                
                // Add leave
                for ($i=0; $i < count($data['leave']); $i++) {
                    $leaveTypeId = $data['leave'][$i]['leaveTypeId'];
                    $leaveItems = $data['leave'][$i]['leaveItems'];
                    
                    $sqlQuery =
                        'INSERT INTO ' .
                            'leave_config_items ( ' .
                                'employee_id, ' .
                                'leave_type_id ' .
                            ') ' .
                        'VALUES ( ' .
                                ' $1,  $2 ' .
                            ') ' .
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $employeeId,                         // employee_id
                        $leaveTypeId                         // leave_type_id
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Add leave items
                    for ($x=0; $x < count($leaveItems); $x++) {
                        
                        $date = $leaveItems[$x]['date'];
                        $action = $leaveItems[$x]['action'];
                        $source = $leaveItems[$x]['source'];
                        $amount = $leaveItems[$x]['amount'];
                        
                        $sqlQuery = 
                            'SELECT leave_unit_code ' .
                            'FROM leave_types ' .
                            'WHERE id = $1 ';
                        $sqlResult = $db->paramQuery($sqlQuery, [$leaveTypeId]);
                        if( !$sqlResult->isValid() ) {
                          echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                          return false;
                        }
                        
                        $row = $sqlResult->fetchAssociative();
                        $leaveUnitType = $row['leave_unit_code'];
                        
                        $amount = floatval($amount);
                        if ($action === 'LEAR') {
                            if ($amount < 0) {
                                echo( json_encode(['ok' => false, 'error' => 'Leave earned should be more than 0.']) );
                                return false;
                            }
                        }
                        else if($action === 'LTAK') {
                            if ( $amount < 0 ) {
                                $amount = floatval($amount);
                            }
                            else {
                                $amount = 0 - floatval($amount);
                            }
                        }
                        
                        $hours = $amount;
                        $days = 0;
                        if ($leaveUnitType === 'DAYS') {
                            $hours = 0;
                            $days = $amount;
                        }
                        
                        $sqlQuery =
                            'INSERT INTO leave( ' .
                                'leave_action_code, hours, days, date, employee_id, leave_type_id,  ' .
                                'leave_source_type_code, process_time, added_by_user_id, description ' .
                                ') ' .
                            'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10); ';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $action,                             // leave_action_code
                            $hours,                              // hours
                            $days,                               // days
                            date("Y-m-d"),                       // date
                            $employeeId,                         // employee_id
                            $leaveTypeId,                        // leave_type_id
                            'MANU',                              // leave_source_type_code
                            date("Y-m-d H:i:s"),                 // process_time
                            $_SESSION['userData']['id'],         // added_by_user_id
                            $description                         // description
                        ]);
                        
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                    
                }
            }
            
            // Add retirement fund if any was provided
            if (isset($data['retirmentFundItems'])) {
                // Lock the relevant table(s)
                $db->paramQuery('LOCK TABLE employee_rfi_items IN ACCESS EXCLUSIVE MODE', []);
                $db->paramQuery('LOCK TABLE provident_fund_members IN ACCESS EXCLUSIVE MODE', []);
                
                // Add retirement fund items
                for ($i=0; $i < count($data['retirmentFundItems']); $i++) {
                    $providentFundId = $data['retirmentFundItems'][$i]['providentFundId'];
                    
                    // Get the provident fund details
                    $sqlQuery = 
                        'SELECT ' . 
                            'provident_funds.provident_fund_calculation_type_code ' .
                        'FROM ' . 
                            'provident_funds ' .
                        'WHERE ' . 
                            'provident_funds.is_active IS TRUE AND ' .
                            'provident_funds.id = $1';
                    $sqlResult = $db->paramQuery($sqlQuery, [$providentFundId]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Provident fund not found']) );
                        return false;
                    }
                    
                    $row = $sqlResult->fetchAssociative();
                    $providentFundCalculationTypeCode = $row['provident_fund_calculation_type_code'];
                    
                    // Add the member to the provident fund
                    $sqlQuery = 
                        'INSERT INTO ' .
                            'provident_fund_members ( ' .
                                'provident_fund_id, ' .
                                'employee_id, ' .
                                'joined_on ' .
                            ') ' .
                        'VALUES ( ' .
                                '$1, $2, $3 ' .
                            ') ' .
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $data['retirmentFundItems'][$i]['providentFundId'],               // provident_fund_id
                        $employeeId,                    // employee_id
                        date('Y-m-d H:i:s', time())     // joined_on
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Is the provident fund calculation based on retirement fund income items?
                    if( $providentFundCalculationTypeCode === 'PRFI' ) {
                        for ($y=0; $y < count($data['retirmentFundItems'][$i]['rfiItems']); $y++) {
                            for ($x=0; $x < count($payslipItemsList); $x++) {
                                if($payslipItemsList[$x]['uniqueId'] === $data['retirmentFundItems'][$i]['rfiItems'][$y]['uniqueId']) {
                                    $sqlQuery = 
                                        'INSERT INTO ' . 
                                            'employee_rfi_items (provident_fund_id, payslip_config_item_id, percentage) ' . 
                                        'VALUES ' . 
                                            '($1, $2, $3);';
                                    $sqlResult = $db->paramQuery($sqlQuery, [
                                        $data['retirmentFundItems'][$i]['providentFundId'],                 // provident_fund_id
                                        $payslipItemsList[$x]['payslipConfigItemId'],                       // payslip_config_item_id
                                        $data['retirmentFundItems'][$i]['rfiItems'][$y]['percentage']       // percentage
                                    ]);
                                    
                                    if( !$sqlResult->isValid() ) {
                                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Add retirement fund if any was provided
            if (isset($data['workSchedule'])) {
                $workSchedule = $data['workSchedule'];
                
                // Lock the relevant table(s)
                $db->paramQuery('LOCK TABLE work_schedules IN ACCESS EXCLUSIVE MODE', []);
                
                // Load banking details
                $enableLeave = false;
                $mondayHours = null;
                $tuesdayHours = null;
                $wednesdayHours = null;
                $thursdayHours = null;
                $fridayHours = null;
                $saturdayHours = null;
                $sundayHours = null;
                
                if( array_key_exists('enableLeave', $workSchedule) ) $enableLeave = $workSchedule['enableLeave'];
                if( array_key_exists('mondayHours', $workSchedule) ) $mondayHours = $workSchedule['mondayHours'];
                if( array_key_exists('tuesdayHours', $workSchedule) ) $tuesdayHours = $workSchedule['tuesdayHours'];
                if( array_key_exists('wednesdayHours', $workSchedule) ) $wednesdayHours = $workSchedule['wednesdayHours'];
                if( array_key_exists('thursdayHours', $workSchedule) ) $thursdayHours = $workSchedule['thursdayHours'];
                if( array_key_exists('fridayHours', $workSchedule) ) $fridayHours = $workSchedule['fridayHours'];
                if( array_key_exists('saturdayHours', $workSchedule) ) $saturdayHours = $workSchedule['saturdayHours'];
                if( array_key_exists('sundayHours', $workSchedule) ) $sundayHours = $workSchedule['sundayHours'];
                    
                // Build the query to insert the item.
                $sqlQuery =
                    'INSERT INTO work_schedules( ' .
                        'employee_id, ' . 
                        'enable_leave, ' . 
                        'monday_hours, ' . 
                        'tuesday_hours, ' . 
                        'wednesday_hours,  ' .
                        'thursday_hours, ' . 
                        'friday_hours, ' . 
                        'saturday_hours, ' . 
                        'sunday_hours ' . 
                    ') ' .
                    'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9); ';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $employeeId,        // employee_id
                    $enableLeave,       // enable_leave
                    $mondayHours,       // monday hours
                    $tuesdayHours,      // tuesday hours
                    $wednesdayHours,    // wednesday hours
                    $thursdayHours,     // thursday hours
                    $fridayHours,       // friday hours
                    $saturdayHours,     // saturday hours
                    $sundayHours        // sunday hours
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            // Connect to the database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to system database.']) );
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to system.']) );
                return false;
            }
            
            // Add the employee profile to the system database
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
                $_SESSION['userData']['companyId'],     // company_id
                $employeeId,                            // employee_id
                $data['alias'],                         // alias
                $data['idNumber'],                      // id_number
                $data['passportNumber'],                // passport_number
                $data['emailAddress']                   // email_address
            ]);
            if( !$profileInsertSqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to insert employee profile.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true, 'employeeId' => $employeeId]) );
            return true;
        }
        
        // Function to get all the details of the specified employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
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
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the employee from the employees table
            $sqlQuery = 
                'WITH dismissal_details AS ( ' .
                    'SELECT ' . 
                        'employment_history.employee_id, ' . 
                        'employment_history.dismissal_reason AS dismissal_reason_code, ' . 
                        'employee_dismissal_reasons.name AS dismissal_reason_name ' . 
                    'FROM ' . 
                        'employment_history ' . 
                    'LEFT JOIN ' . 
                        'employee_dismissal_reasons ON employee_dismissal_reasons.code = employment_history.dismissal_reason ' .
                    'WHERE ' . 
                        'employment_history.employee_id = $1 ' . 
                    'ORDER BY ' . 
                        'GREATEST(employment_history.dismissed_on, employment_history.employed_on) DESC ' .
                    'LIMIT 1 ' .
                ') ' .
                'SELECT ' .
                    'employees.code, ' .
                    'employees.title_code, ' .
                    'title_types.name AS title_name, ' .
                    'employees.initials, ' .
                    'employees.full_names, ' . 
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.passport_country AS passport_country_code, ' .
                    'passport_country.name AS passport_country_name, ' .
                    'employees.date_of_birth, ' .
                    'employees.is_asylum_seeker, ' .
                    'employees.is_refugee, ' .
                    'employees.is_retired, ' .
                    'employees.physical_address_unit, ' .
                    'employees.physical_address_complex, ' .
                    'employees.physical_address_street, ' .
                    'employees.physical_address_suburb, ' .
                    'employees.physical_address_city, ' .
                    'employees.physical_address_postal_code, ' .
                    'employees.physical_address_country_code, ' .
                    'physical_address_country.name AS physical_address_country_name, ' .
                    'employees.postal_same_as_physical_address, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.postal_address_country_code, ' .
                    'postal_address_country.name AS postal_address_country_name, ' .
                    'work_same_as_company_address, ' .
                    'employees.work_address_unit, ' .
                    'employees.work_address_complex, ' .
                    'employees.work_address_street, ' .
                    'employees.work_address_suburb, ' .
                    'employees.work_address_city, ' .
                    'employees.work_address_postal_code, ' .
                    'employees.work_address_country_code, ' .
                    'work_address_country.name AS work_address_country_name, ' .
                    'employees.home_number, ' .
                    'employees.work_number, ' .
                    'employees.cell_number, ' .
                    'employees.fax_number, ' .
                    'employees.email_address, ' .
                    'employees.emergency_contact_person, ' .
                    'employees.emergency_contact_number, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'dismissal_details.dismissal_reason_code, ' .
                    'dismissal_details.dismissal_reason_name, ' .
                    'employees.employment_position, ' .
                    'employees.department_id AS department_id, ' .
                    'departments.name AS department_name, ' .
                    'employees.payment_method_code, ' .
                    'payment_methods.name AS payment_method_name, ' .
                    'employees.payment_period_code, ' .
                    'payment_period_types.name AS payment_period_name, ' .
                    'employees.payment_period_end_day, ' .
                    'employees.payment_day, ' .
                    'employees.income_tax_number, ' .
                    'employees.enable_paye_correction, ' . 
                    'employees.income_tax_directive_1, ' .
                    'employees.income_tax_directive_1_issued_date, ' .
                    'employees.income_tax_directive_1_source_code, ' .
                    'employees.income_tax_directive_1_amount, ' .
                    'employees.income_tax_directive_2, ' .
                    'employees.income_tax_directive_2_issued_date, ' .
                    'employees.income_tax_directive_2_source_code, ' .
                    'employees.income_tax_directive_2_amount, ' .
                    'employees.income_tax_directive_3, ' .
                    'employees.income_tax_directive_3_issued_date, ' .
                    'employees.income_tax_directive_3_source_code, ' .
                    'employees.income_tax_directive_3_amount, ' .
                    'employees.sic_code, ' .
                    'sic_codes.name AS sic_name, ' .
                    'work_schedules.id AS work_schedule_id, ' . 
                    'work_schedules.enable_leave, ' .
                    'work_schedules.monday_hours, ' .
                    'work_schedules.tuesday_hours, ' .
                    'work_schedules.wednesday_hours, ' .
                    'work_schedules.thursday_hours, ' .
                    'work_schedules.friday_hours, ' .
                    'work_schedules.saturday_hours, ' .
                    'work_schedules.sunday_hours, ' . 
                    'postal_address_country_code, ' .
                    'employee_bank_details.financial_institution_code, financial_institutions.name AS financial_institution_name, ' . 
                    'employee_bank_details.bank_account_type_code, bank_account_types.name AS bank_account_type_name, ' .
                    'employee_bank_details.account_number, employee_bank_details.branch_code ' .  
                'FROM ' .
                    'employees ' .
                'LEFT JOIN ' .
                    'dismissal_details ON dismissal_details.employee_id = employees.id ' .
                'LEFT JOIN ' .
                    'title_types ON title_types.code = employees.title_code ' .
                'LEFT JOIN ' .
                    'countries AS passport_country ON passport_country.code = employees.passport_country ' .
                'LEFT JOIN ' .
                    'countries AS physical_address_country ON physical_address_country.code = employees.physical_address_country_code ' .
                'LEFT JOIN ' .
                    'countries AS work_address_country ON work_address_country.code = employees.work_address_country_code ' .
                'LEFT JOIN ' .
                    'countries AS postal_address_country ON postal_address_country.code = employees.postal_address_country_code ' .
                'LEFT JOIN ' .
                    'departments ON employees.department_id = departments.id ' .
                'LEFT JOIN ' .
                    'payment_methods ON payment_methods.code = employees.payment_method_code ' .
                'LEFT JOIN ' .
                    'payment_period_types ON payment_period_types.code = employees.payment_period_code ' .
                'LEFT JOIN ' .
                    'sic_codes ON sic_codes.code = employees.sic_code ' .
                'LEFT JOIN ' .
                    'work_schedules ON employees.id = work_schedules.employee_id ' . 
                'LEFT JOIN ' . 
                    'employee_bank_details ON employees.id = employee_bank_details.employee_id ' . 
                'LEFT JOIN ' . 
                    'financial_institutions ON employee_bank_details.financial_institution_code = financial_institutions.code ' . 
                'LEFT JOIN ' .
                    'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' . 
                'WHERE ' .
                    'employees.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the employee was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']) );
                return false;
            }
            
            // Create employee details
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Calculate employment duration
            $employmentStart = new DateTime($sqlRow['employment_start_date']);
            $employmentEnd = new DateTime();
            if( $sqlRow['employment_end_date'] !== null ) $employmentEnd = new DateTime($sqlRow['employment_end_date']);
            $employmentDuration = $employmentEnd->diff($employmentStart);
            
            // Load bank details
            $bankDetails = [
                'financialInstitution' => null,
                'accountType' => null,
                'accountNumber' => '',
                'branchCode' => ''
            ];
            if( $sqlRow['financial_institution_code'] !== null ) {
                $bankDetails['financialInstitution'] = [
                    'code' => $sqlRow['financial_institution_code'],
                    'name' => $sqlRow['financial_institution_name']
                ];
            }
            if( $sqlRow['bank_account_type_code'] !== null ) {
                $bankDetails['accountType'] = [
                    'code' => $sqlRow['bank_account_type_code'],
                    'name' => $sqlRow['bank_account_type_name']
                ];
            }
            if( $sqlRow['account_number'] !== null ) $bankDetails['accountNumber'] = $sqlRow['account_number'];
            if( $sqlRow['branch_code'] !== null ) $bankDetails['branchCode'] = $sqlRow['branch_code'];
            
            $employee = [
                'titleCode' => $sqlRow['title_code'],
                'titleName' => $sqlRow['title_name'],
                'initials' => $sqlRow['initials'],
                'fullNames' => $sqlRow['full_names'],
                'lastName' => $sqlRow['last_name'],
                'alias' => $sqlRow['alias'],
                'idNumber' => $sqlRow['id_number'],
                'passportNumber' => $sqlRow['passport_number'],
                'passportCountryCode' => $sqlRow['passport_country_code'],
                'passportCountryName' => $sqlRow['passport_country_name'],
                'dateOfBirth' => $sqlRow['date_of_birth'],
                'isAsylumSeeker' => $sqlRow['is_asylum_seeker'],
                'isRefugee' => $sqlRow['is_refugee'],
                'isRetired' => $sqlRow['is_retired'],
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
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'postalSameAsPhysicalAddress' => $sqlRow['postal_same_as_physical_address'],
                'postalAddressCountryCode' => $sqlRow['postal_address_country_code'],
                'postalAddressCountryName' => $sqlRow['postal_address_country_name'],
                'workSameAsCompanyAddress' => $sqlRow['work_same_as_company_address'],
                'workAddressUnit' => $sqlRow['work_address_unit'],
                'workAddressComplex' => $sqlRow['work_address_complex'],
                'workAddressStreet' => $sqlRow['work_address_street'],
                'workAddressSuburb' => $sqlRow['work_address_suburb'],
                'workAddressCity' => $sqlRow['work_address_city'],
                'workAddressPostalCode' => $sqlRow['work_address_postal_code'],
                'workAddressCountryCode' => $sqlRow['work_address_country_code'],
                'workAddressCountryName' => $sqlRow['work_address_country_name'],
                'homeNumber' => $sqlRow['home_number'],
                'workNumber' => $sqlRow['work_number'],
                'cellNumber' => $sqlRow['cell_number'],
                'faxNumber' => $sqlRow['fax_number'],
                'emailAddress' => $sqlRow['email_address'],
                'emergencyContactPerson' => $sqlRow['emergency_contact_person'],
                'emergencyContactNumber' => $sqlRow['emergency_contact_number'],
                'employmentStartDate' => $sqlRow['employment_start_date'],
                'employmentEndDate' => $sqlRow['employment_end_date'],
                'employmentDuration' => [
                    'years' => $employmentDuration->y,
                    'months' => $employmentDuration->m,
                    'days' => $employmentDuration->d
                ],
                'dismissalReasonCode' => $sqlRow['dismissal_reason_code'],
                'dismissalReasonName' => $sqlRow['dismissal_reason_name'],
                'employmentPosition' => $sqlRow['employment_position'],
                'departmentId' => $sqlRow['department_id'],
                'departmentName' => $sqlRow['department_name'],
                'paymentMethodCode' => $sqlRow['payment_method_code'],
                'paymentMethodName' => $sqlRow['payment_method_name'],
                'paymentPeriodCode' => $sqlRow['payment_period_code'],
                'paymentPeriodName' => $sqlRow['payment_period_name'],
                'paymentPeriodEndDay' => $sqlRow['payment_period_end_day'],
                'paymentDay' => $sqlRow['payment_day'],
                'incomeTaxNumber' => $sqlRow['income_tax_number'],
                'enablePayeCorrection' => $sqlRow['enable_paye_correction'],
                'incomeTaxDirective1' => $sqlRow['income_tax_directive_1'],
                'incomeTaxDirective1IssuedOn' => $sqlRow['income_tax_directive_1_issued_date'],
                'incomeTaxDirective1SourceCode' => $sqlRow['income_tax_directive_1_source_code'],
                'incomeTaxDirective1Amount' => $sqlRow['income_tax_directive_1_amount'],
                'incomeTaxDirective2' => $sqlRow['income_tax_directive_2'],
                'incomeTaxDirective2IssuedOn' => $sqlRow['income_tax_directive_2_issued_date'],
                'incomeTaxDirective2SourceCode' => $sqlRow['income_tax_directive_2_source_code'],
                'incomeTaxDirective2Amount' => $sqlRow['income_tax_directive_2_amount'],
                'incomeTaxDirective3' => $sqlRow['income_tax_directive_3'],
                'incomeTaxDirective3IssuedOn' => $sqlRow['income_tax_directive_3_issued_date'],
                'incomeTaxDirective3SourceCode' => $sqlRow['income_tax_directive_3_source_code'],
                'incomeTaxDirective3Amount' => $sqlRow['income_tax_directive_3_amount'],
                'sicCode' => $sqlRow['sic_code'],
                'sicName' => $sqlRow['sic_name'],
                'workSchedule' => null,
                'bankDetails' => $bankDetails
            ];
            
            // Add work schedule if available
            if( $sqlRow['work_schedule_id'] !== null ) {
                $employee['workSchedule'] = [
                    'enableLeave' => $sqlRow['enable_leave'],
                    'monday' => $sqlRow['monday_hours'],
                    'tuesday' => $sqlRow['tuesday_hours'],
                    'wednesday' => $sqlRow['wednesday_hours'],
                    'thursday' => $sqlRow['thursday_hours'],
                    'friday' => $sqlRow['friday_hours'],
                    'saturday' => $sqlRow['saturday_hours'],
                    'sunday' => $sqlRow['sunday_hours']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'employee' => $employee
            ]) );
            
            return true;
        }
        
        // Function to to update the specified employee's details
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to update
        //
        // Optional Parameters
        //  titleCode                   The employee's title code
        //  initials                    The employee's initials
        //  firstName                   The employee's first name
        //  lastName                    The employee's last name
        //  alias                       The employee's nickname
        //  dateOfBirth                 The employee's date of birth
        //  isAsylumSeeker              Whether the employee is an asylum seeker (true or false)
        //  isRefugee                   Whether the employee is a refugee (true or false)
        //  isRetired                   Whether the employee is retired (true or false)
        //  cellNumber                  The employee's cell number
        //  emailAddress                The employee's email address
        //  employmentStartDate         The the date on which the employee was employed
        //  employmentEndDate           The the date on which the employee was terminated
        //  employmentPosition          The employee's position
        //  department                  The id of the employee's department
        //  paymentMethodCode           The payment method code for the employee
        //  paymentPeriodCode           The payment period code for the employee
        //  paymentPeriodEndDay                  The day of the month on which the employee gets paid
        //  incomeTaxNumber             The employee's income tax number
        //  sicCode                     The employee's standard industrial classification code
        //  secondName                  The employee's second code
        //  idNumber                    The employee's id number
        //  passportNumber              The employee's passport number
        //  passportCountry             The employee's passport country
        //  bankDetails => [
        //      financialInstitution => [
        //          code                The code of the financial institution.
        //      ],
        //      accountType => [
        //          code                The account type code.
        //      ],
        //      accountNumber,          The account number.
        //      branchCode              The employee's bank branch code.
        //  ]
        //  physicalAddressUnit         The employee's physical address details
        //  physicalAddressComplex
        //  physicalAddressStreet
        //  physicalAddressSuburb
        //  physicalAddressCity
        //  physicalAddressPostalCode
        //  physicalAddressCountryCode
        //  postalAddressLine1          The employee's postal address details
        //  postalAddressLine2
        //  postalAddressLine3
        //  postalAddressCode
        //  postalAddressCountryCode
        //  useCompanyWorkAddress       Whether to use the company work address (true or false)
        //  workAddressUnit             The employee's work address details
        //  workAddressComplex
        //  workAddressStreet
        //  workAddressSuburb
        //  workAddressCity
        //  workAddressPostalCode
        //  workAddressCountryCode
        //  homeNumber                  The employee's home phone number
        //  workNumber                  The employee's work phone number
        //  faxNumber                   The employee's fax number
        //  emergencyContactPerson      The employee's emergency contact person
        //  emergencyContactNumber      The employee's emergency contact number
        //  incomeTaxDirective1         The first income tax directive for the employee
        //  incomeTaxDirective2         The second income tax directive for the employee
        //  incomeTaxDirective3         The third income tax directive for the employee
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'titleCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'initials' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'fullNames' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'lastName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'alias' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'idNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'passportNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'passportCountry' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'dateOfBirth' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => false],
                'isAsylumSeeker' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'isRefugee' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'isRetired' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_EMAIL, 'required' => false, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'homeNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'faxNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emergencyContactPerson' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emergencyContactNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'bankDetails' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => true, 'rules' => [
                    'financialInstitution' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                    ]],
                    'accountType' => ['type' => Json::TYPE_OBJECT, 'required' => false, 'nullable' => false, 'rules' => [
                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                    ]],
                    'accountNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                    'branchCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
                ]],
                'physicalAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'postalSameAsPhysical' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'postalAddressLine1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'useCompanyWorkAddress' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'workAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'workAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'employmentStartDate' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'employmentEndDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'dismissalReasonCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true],
                'employmentPosition' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'paymentMethodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'paymentPeriodCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'paymentPeriodEndDay' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'paymentDay' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'incomeTaxNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sicCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective1SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective1Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'incomeTaxDirective2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective2IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective2SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective2Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'incomeTaxDirective3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective3IssuedOn' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'incomeTaxDirective3SourceCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'incomeTaxDirective3Amount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the company physical address from the company_details table
            $sqlQuery = 
                'SELECT ' .
                    'id_number, ' .
                    'passport_number, ' .
                    'passport_country ' .
                'FROM ' .
                    'employees ' .
                'WHERE ' .
                    'id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
                
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee not found']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $idNumber = $sqlRow['id_number'];
            $passportNumber = $sqlRow['passport_number'];
            $passportCountry = $sqlRow['passport_country'];
            $updateProfile = false;
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->paramQuery('LOCK TABLE employees IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE employment_history IN ACCESS EXCLUSIVE MODE', []);
            
            // Build the query to update the employee and employee history
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE employees SET ';
            
            if( isset($data['titleCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'title_code = $' . $updateCount;
                $updateValues[] = $data['titleCode'];
            }
            
            if( isset($data['initials']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'initials = $' . $updateCount;
                $updateValues[] = $data['initials'];
            }
            
            if( isset($data['fullNames']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'full_names = $' . $updateCount;
                $updateValues[] = $data['fullNames'];
            }
            
            if( isset($data['lastName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'last_name = $' . $updateCount;
                $updateValues[] = $data['lastName'];
            }
            
            if( isset($data['alias']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'alias = $' . $updateCount;
                $updateValues[] = $data['alias'];
                
                // Profile should be updated
                $updateProfile = true;
            }
            
            if( isset($data['idNumber']) ) {
                // Is the id number empty?
                if( $data['idNumber'] === '' ) {
                    // Was the passport number given?
                    if( isset($data['passportNumber']) ) {
                        // Is the given passport number empty?
                        if( $data['passportNumber'] == '' ) {
                            echo( json_encode(['ok' => false, 'error' => 'Either the ID or passport number is required']) );
                            return false;
                        }
                    }
                    else {
                        // Is there no passport number in the DB?
                        if( $passportNumber == '' ) {
                            echo( json_encode(['ok' => false, 'error' => 'Either the ID or passport number is required']) );
                            return false;
                        }
                    }
                }
                else {
                    // Check if it's a valid South African id number
                    $result = Util::validateSouthAfricanId($data['idNumber']);
                    if ($result['error'] != null) {
                        echo(json_encode(['ok' => false, 'error' => $result['errorMessage']]));
                        return false;
                    }
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'id_number = $' . $updateCount;
                $updateValues[] = $data['idNumber'];
                
                // Profile should be updated
                $updateProfile = true;
            }
            
            if( isset($data['passportNumber']) ) {
                // Is the passport number empty?
                if( $data['passportNumber'] === '' ) {
                    // Was the ID number given?
                    if( isset($data['idNumber']) ) {
                        // Is the given ID number empty?
                        if( $data['idNumber'] == '' ) {
                            echo( json_encode(['ok' => false, 'error' => 'Either the ID or passport number is required']) );
                            return false;
                        }
                    }
                    else {
                        // Is there no ID number in the DB?
                        if( $idNumber == '' ) {
                            echo( json_encode(['ok' => false, 'error' => 'Either the ID or passport number is required']) );
                            return false;
                        }
                    }
                }
                else {
                    // Was the passport country given?
                    if( isset($data['passportCountry']) ) {
                        // Is the given passport country empty?
                        if( $data['passportCountry'] == null ) {
                            echo( json_encode(['ok' => false, 'error' => 'Passport country is required']) );
                            return false;
                        }
                    }
                    else {
                        // Is there no passport country in the DB?
                        if( $passportCountry == null ) {
                            echo( json_encode(['ok' => false, 'error' => 'Passport country is required']) );
                            return false;
                        }
                    }
                }
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'passport_number = $' . $updateCount;
                $updateValues[] = $data['passportNumber'];
                
                // Profile should be updated
                $updateProfile = true;
            }
            
            if( isset($data['passportCountry']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'passport_country = $' . $updateCount;
                $updateValues[] = $data['passportCountry'];
            }
            
            if( isset($data['dateOfBirth']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'date_of_birth = $' . $updateCount;
                $updateValues[] = $data['dateOfBirth'];
            }
            
            if( isset($data['isAsylumSeeker']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_asylum_seeker = $' . $updateCount;
                $updateValues[] = $data['isAsylumSeeker'];
            }
            
            if( isset($data['isRefugee']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_refugee = $' . $updateCount;
                $updateValues[] = $data['isRefugee'];
            }
            
            if( isset($data['isRetired']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'is_retired = $' . $updateCount;
                $updateValues[] = $data['isRetired'];
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
            
            if( isset($data['physicalAddressPostalCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_postal_code = $' . $updateCount;
                $updateValues[] = $data['physicalAddressPostalCode'];
            }
            
            if( isset($data['physicalAddressCountryCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'physical_address_country_code = $' . $updateCount;
                $updateValues[] = $data['physicalAddressCountryCode'];
            }
            
            if( isset($data['postalSameAsPhysical']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_same_as_physical_address = $' . $updateCount;
                $updateValues[] = $data['postalSameAsPhysical'];
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
            
            if( isset($data['postalAddressCountryCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'postal_address_country_code = $' . $updateCount;
                $updateValues[] = $data['postalAddressCountryCode'];
            }
            
            if( isset($data['useCompanyWorkAddress']) ) {
                // Should company address be used as the work address?
                if( $data['useCompanyWorkAddress'] ) {
                    // Load the company physical address from the company_details table
                    $sqlQuery = 
                        'SELECT ' .
                            'company_details.physical_address_unit, ' .
                            'company_details.physical_address_complex, ' .
                            'company_details.physical_address_street, ' .
                            'company_details.physical_address_suburb, ' .
                            'company_details.physical_address_city, ' .
                            'company_details.physical_address_postal_code, ' .
                            'company_details.physical_address_country_code ' .
                        'FROM ' .
                            'company_details ' .
                        'LIMIT 1;';
                    $sqlResult = $db->paramQuery($sqlQuery, []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Company address not found']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_unit = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_unit'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_complex = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_complex'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_street = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_street'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_suburb = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_suburb'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_city = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_city'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_postal_code = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_postal_code'];
                    
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_country_code = $' . $updateCount;
                    $updateValues[] = $sqlRow['physical_address_country_code'];
                }
                else {
                    if( isset($data['workAddressUnit']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_unit = $' . $updateCount;
                        $updateValues[] = $data['workAddressUnit'];
                    }
                    
                    if( isset($data['workAddressComplex']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_complex = $' . $updateCount;
                        $updateValues[] = $data['workAddressComplex'];
                    }
                    
                    if( isset($data['workAddressStreet']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_street = $' . $updateCount;
                        $updateValues[] = $data['workAddressStreet'];
                    }
                    
                    if( isset($data['workAddressSuburb']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_suburb = $' . $updateCount;
                        $updateValues[] = $data['workAddressSuburb'];
                    }
                    
                    if( isset($data['workAddressCity']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_city = $' . $updateCount;
                        $updateValues[] = $data['workAddressCity'];
                    }
                    
                    if( isset($data['workAddressPostalCode']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_postal_code = $' . $updateCount;
                        $updateValues[] = $data['workAddressPostalCode'];
                    }
                    
                    if( isset($data['workAddressCountryCode']) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'work_address_country_code = $' . $updateCount;
                        $updateValues[] = $data['workAddressCountryCode'];
                    }
                }
            }
            else {
                if( isset($data['workAddressUnit']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_unit = $' . $updateCount;
                    $updateValues[] = $data['workAddressUnit'];
                }
                
                if( isset($data['workAddressComplex']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_complex = $' . $updateCount;
                    $updateValues[] = $data['workAddressComplex'];
                }
                
                if( isset($data['workAddressStreet']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_street = $' . $updateCount;
                    $updateValues[] = $data['workAddressStreet'];
                }
                
                if( isset($data['workAddressSuburb']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_suburb = $' . $updateCount;
                    $updateValues[] = $data['workAddressSuburb'];
                }
                
                if( isset($data['workAddressCity']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_city = $' . $updateCount;
                    $updateValues[] = $data['workAddressCity'];
                }
                
                if( isset($data['workAddressPostalCode']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_postal_code = $' . $updateCount;
                    $updateValues[] = $data['workAddressPostalCode'];
                }
                
                if( isset($data['workAddressCountryCode']) ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'work_address_country_code = $' . $updateCount;
                    $updateValues[] = $data['workAddressCountryCode'];
                }
            }
            
            if( isset($data['useCompanyWorkAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'work_same_as_company_address = $' . $updateCount;
                $updateValues[] = $data['useCompanyWorkAddress'];
            }
            
            if( isset($data['homeNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'home_number = $' . $updateCount;
                $updateValues[] = $data['homeNumber'];
            }
            
            if( isset($data['workNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'work_number = $' . $updateCount;
                $updateValues[] = $data['workNumber'];
            }
            
            if( isset($data['cellNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'cell_number = $' . $updateCount;
                $updateValues[] = $data['cellNumber'];
            }
            
            if( isset($data['faxNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'fax_number = $' . $updateCount;
                $updateValues[] = $data['faxNumber'];
            }
            
            if( isset($data['emailAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['emailAddress'];
                
                // Profile should be updated
                $updateProfile = true;
            }
            
            if( isset($data['emergencyContactPerson']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'emergency_contact_person = $' . $updateCount;
                $updateValues[] = $data['emergencyContactPerson'];
            }
            
            if( isset($data['emergencyContactNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'emergency_contact_number = $' . $updateCount;
                $updateValues[] = $data['emergencyContactNumber'];
            }
            
            if( isset($data['employmentStartDate']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_start_date = $' . $updateCount;
                $updateValues[] = $data['employmentStartDate'];
            }
            
            if( array_key_exists('employmentEndDate', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_end_date = $' . $updateCount;
                $updateValues[] = $data['employmentEndDate'];
            }
            
            if( isset($data['employmentPosition']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_position = $' . $updateCount;
                $updateValues[] = $data['employmentPosition'];
            }
            
            if( isset($data['departmentId']) ) {
                $department = $data['departmentId'];
                if( $department < 1 ) $department = null;
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'department_id = $' . $updateCount;
                $updateValues[] = $department;
            }
            
            if( isset($data['paymentMethodCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'payment_method_code = $' . $updateCount;
                $updateValues[] = $data['paymentMethodCode'];
            }
            
            if( isset($data['paymentPeriodCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'payment_period_code = $' . $updateCount;
                $updateValues[] = $data['paymentPeriodCode'];
            }
            
            if( isset($data['paymentPeriodEndDay']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'payment_period_end_day = $' . $updateCount;
                $updateValues[] = $data['paymentPeriodEndDay'];
            }
            
            if( isset($data['paymentDay']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'payment_day = $' . $updateCount;
                $updateValues[] = $data['paymentDay'];
            }
            
            if( isset($data['incomeTaxNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_number = $' . $updateCount;
                $updateValues[] = $data['incomeTaxNumber'];
            }
            
            if( isset($data['enablePayeCorrection']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'enable_paye_correction = $' . $updateCount;
                $updateValues[] = $data['enablePayeCorrection'];
            }
            
            if( isset($data['incomeTaxDirective1']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_1 = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective1'];
            }
            
            if( array_key_exists('incomeTaxDirective1IssuedOn', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_1_issued_date = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective1IssuedOn'];
            }
            
            if( isset($data['incomeTaxDirective1SourceCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_1_source_code = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective1SourceCode'];
            }
            
            if( array_key_exists('incomeTaxDirective1Amount', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_1_amount = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective1Amount'];
            }
            
            if( isset($data['incomeTaxDirective2']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_2 = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective2'];
            }
            
            if( array_key_exists('incomeTaxDirective2IssuedOn', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_2_issued_date = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective2IssuedOn'];
            }
            
            if( isset($data['incomeTaxDirective2SourceCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_2_source_code = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective2SourceCode'];
            }
            
            if( array_key_exists('incomeTaxDirective2Amount', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_2_amount = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective2Amount'];
            }
            
            if( isset($data['incomeTaxDirective3']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_3 = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective3'];
            }
            
            if( array_key_exists('incomeTaxDirective3IssuedOn', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_3_issued_date = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective3IssuedOn'];
            }
            
            if( isset($data['incomeTaxDirective3SourceCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_3_source_code = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective3SourceCode'];
            }
            
            if( array_key_exists('incomeTaxDirective3Amount', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'income_tax_directive_3_amount = $' . $updateCount;
                $updateValues[] = $data['incomeTaxDirective3Amount'];
            }
            
            if( isset($data['sicCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'sic_code = $' . $updateCount;
                $updateValues[] = $data['sicCode'];
            }
            
            // Update if at least one parameter was updated
            if( $updateCount > 0 ) {
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
                $updateValues[] = $data['employeeId'];
                
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            if( isset($data['postalSameAsPhysical'])) {
                if ($data['postalSameAsPhysical']) {
                    
                    $sqlQuery =
                        'SELECT ' .
                            'physical_address_unit, ' .
                            'physical_address_complex, ' .
                            'physical_address_street ' .
                        'FROM employees ' .
                        'WHERE employees.id = $1';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $data['employeeId']              // employee_id
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $physicalAddressUnit = $sqlRow['physical_address_unit'];
                    $physicalAddressComplex = $sqlRow['physical_address_complex'];
                    $physicalAddressStreet = $sqlRow['physical_address_street'];
                    
                    $line1 = '';
                    if($physicalAddressUnit !== '') {
                        $line1 = $physicalAddressUnit;
                    }
                    if ($physicalAddressComplex !== '') {
                        if ($line1 !== '') {
                            $line1 = $line1 . ', ' . $physicalAddressComplex;
                        }
                        else{
                            $line1 = $physicalAddressComplex;
                        }
                        
                    }
                    if ($physicalAddressStreet !== '') {
                        if ($line1 !== '') {
                            $line1 = $line1 . ', ' . $physicalAddressStreet;
                        }
                        else {
                            $line1 = $physicalAddressStreet;
                        }
                        
                    }
                    
                    $sqlQuery =
                        'UPDATE employees ' .
                        'SET ' .
                            'postal_address_line_1 = $1, ' .
                            'postal_address_line_2 = physical_address_suburb, ' .
                            'postal_address_line_3 = physical_address_city, ' .
                            'postal_address_code = physical_address_postal_code ' .
                            // postal_address_country_code = physical_address_country_code
                        'WHERE employees.id = $2';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $line1,
                        $data['employeeId']              // employee_id
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Check if banking details were given
            if( array_key_exists('bankDetails', $data) ) {
                $bankDetails = $data['bankDetails'];
                
                // Check if there is already an entry in the employee_banking_details
                $bankDetailsId = null;
                $sqlResult = $db->paramQuery('SELECT id FROM employee_bank_details WHERE employee_id = $1;', [$data['employeeId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                if( $sqlResult->getRowCount() === 1 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $bankDetailsId = $sqlRow['id'];
                }
                
                if( $bankDetails === null && $bankDetailsId !== null ) {
                    $sqlResult = $db->paramQuery('DELETE FROM employee_bank_details WHERE employee_id = $1;', [$data['employeeId']]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                else if( $bankDetails !== null && $bankDetailsId === null ) {
                    // Load banking details
                    $institutionCode = null;
                    if( array_key_exists('financialInstitution', $bankDetails) ) $institutionCode = $bankDetails['financialInstitution']['code'];
                    $accountType = null;
                    if( array_key_exists('accountType', $bankDetails) ) $accountType = $bankDetails['accountType']['code'];
                    $accountNumber = '';
                    if( array_key_exists('accountNumber', $bankDetails) ) $accountNumber = $bankDetails['accountNumber'];
                    $branchCode = '';
                    if( array_key_exists('branchCode', $bankDetails) ) $branchCode = $bankDetails['branchCode'];
                    
                    $sqlQuery = 
                        'INSERT INTO ' . 
                            'employee_bank_details (employee_id, financial_institution_code, bank_account_type_code, ' . 
                            'account_number, branch_code) ' . 
                        'VALUES ' . 
                            '($1, $2, $3, $4, $5);';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $data['employeeId'],        // employee_id
                        $institutionCode,           // financial_institution_code
                        $accountType,               // bank_account_type_code
                        $accountNumber,             // account_number
                        $branchCode                 // branch_code
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                else if( $bankDetails !== null && $bankDetailsId !== null ) {
                    $updateQuery = 'UPDATE employee_bank_details SET ';
                    
                    $updateCount = 0;
                    $updateValues = [];
                    
                    if( array_key_exists('financialInstitution', $bankDetails) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'financial_institution_code = $' . $updateCount;
                        $updateValues[] = $bankDetails['financialInstitution']['code'];
                    }
                    
                    if( array_key_exists('accountType', $bankDetails) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'bank_account_type_code = $' . $updateCount;
                        $updateValues[] = $bankDetails['accountType']['code'];
                    }
                    
                    if( array_key_exists('accountNumber', $bankDetails) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'account_number = $' . $updateCount;
                        $updateValues[] = $bankDetails['accountNumber'];
                    }
                    
                    if( array_key_exists('branchCode', $bankDetails) ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'branch_code = $' . $updateCount;
                        $updateValues[] = $bankDetails['branchCode'];
                    }
                    
                    // Only update if at least one value was set
                    if( $updateCount > 0 ) {
                        $updateCount++;
                        $updateValues[] = $data['employeeId'];
                        $updateQuery = $updateQuery . ' WHERE employee_id = $' . $updateCount;
                        
                        $sqlResult = $db->paramQuery($updateQuery, $updateValues);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Build the query to update the employee history
            $historyUpdateCount = 0;
            $historyUpdateValues = [];
            $historyUpdateQuery = 'UPDATE employment_history SET ';
            
            if( array_key_exists('employmentEndDate', $data) && ($data['dismissalReasonCode'] !== '') ) {
                $historyUpdateCount++;
                if( $historyUpdateCount > 1 ) $historyUpdateQuery = $historyUpdateQuery . ', ';
                $historyUpdateQuery = $historyUpdateQuery . 'dismissal_date = $' . $historyUpdateCount;
                $historyUpdateValues[] = $data['employmentEndDate'];
            }
            
            if( isset($data['dismissalReasonCode']) ) {
                $historyUpdateCount++;
                if( $historyUpdateCount > 1 ) $historyUpdateQuery = $historyUpdateQuery . ', ';
                $historyUpdateQuery = $historyUpdateQuery . 'dismissal_reason = $' . $historyUpdateCount;
                $historyUpdateValues[] = $data['dismissalReasonCode'];
            }
            
            // Only update if at least one value was set
            if( $historyUpdateCount > 0 ) {
                // Get the id of last entry in the employment history table
                $historyId = null;
                $sqlQuery = 
                    'SELECT ' . 
                        'employment_history.id ' . 
                    'FROM ' . 
                        'employment_history ' . 
                    'WHERE ' . 
                        'employment_history.employee_id = $1 ' . 
                    'ORDER BY ' . 
                        'GREATEST(employment_history.dismissed_on, employment_history.employed_on) DESC ' .
                    'LIMIT 1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Check if the employee was found
                if( $sqlResult->getRowCount() > 0 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $historyId = $sqlRow['id'];
                }
                
                // Add the where clause
                $historyUpdateCount++;
                $historyUpdateValues[] = $historyId;
                $historyUpdateQuery = $historyUpdateQuery . ' WHERE id = $' . $historyUpdateCount;
                
                // Run the query to update the employement history
                $sqlResult = $db->paramQuery($historyUpdateQuery, $historyUpdateValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit transaction
            $db->commitTransaction();
            
            // Should the profile be updated
            if( $updateProfile ) {
                // Connect to the database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to system database.']) );
                    return false;
                }
                
                // Set search path to system
                $sqlResult = $db->paramQuery('SET search_path TO system;', []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to system.']) );
                    return false;
                }
                
                $alias = null;
                if( array_key_exists('alias', $data) ) {
                    $alias = $data['alias'];
                }
                
                $idNumber = null;
                if( array_key_exists('idNumber', $data) ) {
                    $idNumber = $data['idNumber'];
                }
                
                $passportNumber = null;
                if( array_key_exists('passportNumber', $data) ) {
                    $passportNumber = $data['passportNumber'];
                }
                
                $emailAddress = null;
                if( array_key_exists('emailAddress', $data) ) {
                    $emailAddress = $data['emailAddress'];
                }
                
                // Update the employee profile with the new information
                $profileUpdateSqlQuery =
                    'UPDATE employee_profiles SET ' .
                        'alias = COALESCE($1, alias), ' .
                        'id_number = COALESCE($2, id_number), ' .
                        'passport_number = COALESCE($3, passport_number), ' .
                        'email_address = COALESCE($4, email_address) ' .
                    'WHERE ' .
                        'company_id = $5 AND ' . 
                        'employee_id = $6;';
                $profileUpdateSqlResult = $db->paramQuery($profileUpdateSqlQuery, [
                    $alias,                                 // alias
                    $idNumber,                              // id_number
                    $passportNumber,                        // passport_number
                    $emailAddress,                          // email_address
                    $_SESSION['userData']['companyId'],     // company_id
                    $data['employeeId']                     // employee_id
                ]);
                if( !$profileUpdateSqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to list employee titles
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getTitleList($data, $user, $db) {
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
            
            // Load all titles from the title_types table
            $sqlQuery = 'SELECT code, name FROM title_types ORDER BY name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create titles array
            $titles = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $titles[] = [
                    'code' => $sqlRow['code'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'titles' => $titles
            ]) );
            
            return true;
        }
        
        // Function to list employee payment methods
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getPaymentMethodList($data, $user, $db) {
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
            
            // Load all payment methods from the payment_methods table
            $sqlQuery = 'SELECT code, name FROM payment_methods ORDER BY name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payment methods array
            $paymentMethods = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $paymentMethods[] = [
                    'code' => $sqlRow['code'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'paymentMethods' => $paymentMethods
            ]) );
            
            return true;
        }
        
        // Function to list employee payment periods
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getPaymentPeriodList($data, $user, $db) {
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
            
            // Load all payment periods from the payment_period_types table
            $sqlQuery = 'SELECT code, name FROM payment_period_types ORDER BY name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payment periods array
            $paymentPeriods = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $paymentPeriods[] = [
                    'code' => $sqlRow['code'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'paymentPeriods' => $paymentPeriods
            ]) );
            
            return true;
        }
        
        // Function get a list of payslip items for a given employee
        //
        // Required Parameters
        //  employeeId              The ID of the employee who's items will be retreived
        //
        // Optional Parameters
        //  categories              An array of category codes to include in the list.  If not provided all categories will be included.
        public function getPayslipItemList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                'categories' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_NON_EMPTY_STRING, 'nullable' => false]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Initialize query parameters
            $sqlParams = [
                $data['employeeId']
            ];
            
            $employeeId = $data['employeeId'];
            
            // Initialize where clause
            $whereClause = 'WHERE employee_id = $' . count($sqlParams);
            
            // Check if categories were provided.
            if( array_key_exists('categories', $data) ) {
                $validCategories = ['INCO', 'DEDU', 'CONT', 'FBEN', 'ALLO'];
                $inClause = '';
                
                foreach( $data['categories'] as $category ) {
                    // Check that the provided category is correct.
                    if( !in_array($category, $validCategories) ) {
                        echo( json_encode(['ok' => false, 'error' => 'Invalid category \'' . $category . '\' provided.']) );
                        return false;
                    }
                    
                    // Add the category to the sqlParams array
                    $sqlParams[] = $category;
                    
                    // Add a $n for each given category
                    if( strlen($inClause) === 0 ) $inClause = $inClause . '$' . count($sqlParams);
                    else $inClause = $inClause . ', $' . count($sqlParams);
                }
                
                // Create IN clause
                $whereClause = $whereClause . ' AND payslip_category_code IN (' . $inClause . ')';
            }
            
            // Load all earning types from database
            $sqlQuery =
                'SELECT ' .
                    'payslip_config_items.id, ' . 
                    'payslip_config_items.description, ' . 
                    'payslip_config_items.accrual_date, ' . 
                    'payslip_config_items.amount, ' .
                    'payslip_config_items.auto_calculate, ' . 
                    'payslip_config_items.unit_source_code, ' . 
                    'payslip_item_unit_sources.name AS unit_source_name, ' . 
                    'payslip_config_items.include_in_nett_pay, ' . 
                    'payslip_item_types.code AS payslip_item_type_code, ' .
                    'payslip_item_types.name AS payslip_item_type_name, ' . 
                    'payslip_item_types.payslip_category_code, ' . 
                    'payslip_item_types.payslip_item_unit_code, ' .
                    'payslip_item_types.is_once_off ' . 
                'FROM ' .
                    'payslip_config_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_config_items.payslip_item_type_code = payslip_item_types.code ' . 
                'LEFT JOIN ' .
                    'payslip_item_unit_sources ON payslip_item_unit_sources.code = payslip_config_items.unit_source_code ' . 
                $whereClause . ' ' . 
                'ORDER BY ' .
                    'description ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $items = [];
            
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $isOnceOff = false;
                if ($sqlRow['accrual_date'] !== null) {
                    $isOnceOff = true;
                }
                $items[] = [
                    'id' => $sqlRow['id'],
                    'description' => $sqlRow['description'],
                    'itemType' => [
                        'code' => $sqlRow['payslip_item_type_code'],
                        'name' => $sqlRow['payslip_item_type_name'],
                        'category' => [
                            'code' => $sqlRow['payslip_category_code']
                        ],
                        'unit' => [
                            'code' => $sqlRow['payslip_item_unit_code']
                        ],
                        'isOnceOff' => $isOnceOff
                    ],
                    'autoCalculate' => $sqlRow['auto_calculate'],
                    'unitSourceCode' => $sqlRow['unit_source_code'],
                    'unitSourceName' => $sqlRow['unit_source_name'],
                    'includeInNettPay' => $sqlRow['include_in_nett_pay'],
                    'accrualDate' => $sqlRow['accrual_date'],
                    'amount' => $sqlRow['amount']
                ];
            }
            
            //===============================================================
            $providentFundItems = [];
            // Load all the provident fund items, if any
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE AND ' .
                    'provident_fund_members.employee_id = $1 ' .
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // For every provident fund the employee is a member of
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $autoCalculate = false;
                $employeeAmount = null;
                $employerAmount = null;
                $rfiItems = [];
                $providentFundName = $sqlRow['name'];
                // Is the provident fund calculation based on retirement fund income items?
                if( $sqlRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
                    $autoCalculate = true;
                    
                    // Get all the relevant retirement fund income items
                    $rfiItemSqlQuery =
                        'SELECT ' . 
                            'payslip_config_items.payslip_item_type_code, ' .
                            'employee_rfi_items.percentage ' .
                        'FROM ' . 
                            'payslip_config_items ' .
                        'LEFT JOIN ' .
                            'employee_rfi_items ON employee_rfi_items.payslip_config_item_id = payslip_config_items.id AND ' .
                                'employee_rfi_items.provident_fund_id = $1 ' .
                        'WHERE ' . 
                            'employee_rfi_items.id IS NOT NULL AND ' .
                            'payslip_config_items.employee_id = $2;';
                    $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$sqlRow['id'], $employeeId]);
                    if( !$rfiItemSqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                        $rfiItems[] = [
                            'payslipItemTypeCode'  => $rfiItemSqlRow['payslip_item_type_code'],
                            'percentage' => $rfiItemSqlRow['percentage']
                        ];
                    }
                }
                else {
                    $employeeAmount = doubleval( $sqlRow['employee_amount'] );
                    $employerAmount = doubleval( $sqlRow['employer_amount'] );
                }
                
                // Add payslip item for employee provident fund deduction, if any
                if( doubleval( $sqlRow['employee_amount'] ) > 0.009 ) {
                    
                    $items[] = [
                        'id' => null,
                        'description' => $providentFundName . ' Employee Contribution',
                        'itemType' => [
                            'code' => '2006',
                            'name' => 'retirementFund',
                            'category' => [
                                'code' => 'DEDU'
                            ],
                            'unit' => [
                                'code' => 'FIXE'
                            ],
                            'isOnceOff' => null
                        ],
                        'providentFund' => [
                            'id' => $sqlRow['id'],
                            'employeeAmount' => doubleval( $sqlRow['employee_amount'] ),
                            'employerAmount' => doubleval( $sqlRow['employer_amount'] ),
                            'rfiItems' => $rfiItems
                        ],
                        'autoCalculate' => $autoCalculate,
                        'accrualDate' => null,
                        'amount' => $employeeAmount
                    ];
                }
                
                // Add payslip item for employer provident fund contribution, if any
                if( doubleval( $sqlRow['employer_amount'] ) > 0.009 ) {
                    $items[] = [
                        'id' => null,
                        'description' => $providentFundName . ' Employer Contribution',
                        'itemType' => [
                            'code' => '4002',
                            'name' => 'retirementFund',
                            'category' => [
                                'code' => 'FBEN'
                            ],
                            'unit' => [
                                'code' => 'FIXE'
                            ],
                            'isOnceOff' => null
                        ],
                        'providentFund' => [
                            'id' => $sqlRow['id'],
                            'employeeAmount' => doubleval( $sqlRow['employee_amount'] ),
                            'employerAmount' => doubleval( $sqlRow['employer_amount'] ),
                            'rfiItems' => $rfiItems
                        ],
                        'autoCalculate' => $autoCalculate,
                        'accrualDate' => null,
                        'amount' => $employerAmount
                    ];
                }
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payslipItems' => $items
            ]) );
            
            return true;
        }
        
        
        // Function to add a payslip item
        //
        // Required Parameters
        //  employeeId              The ID of the employee this item is for.
        //  typeCode                The code of the item type to add.
        //  description             A description for the item
        //  accrualDate             The date the item will accrue.  If the type is once off then this value can not be null.  If it is a recurring type
        //                          the value must be null.
        //  autoCalculate           Should this item be auto calculated.
        //  amount                  The amount for the item.  Can be null.
        //
        // Optional Parameters
        //  None
        public function addPayslipItem($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'typeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accrualDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'autoCalculate' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'unitSourceCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                'includeInNettPay' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payslip_config_items IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payslip_item_types IN EXCLUSIVE MODE;');
            
            // Check that the employee exists
            $sqlResult = $db->paramQuery('SELECT id FROM employees WHERE id = $1;', [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']) );
                return false;
            }
            
            // Load the type from the database
            $sqlQuery = 'SELECT code, is_once_off, auto_calculate, default_amount, allow_unit_source, is_enabled FROM payslip_item_types WHERE code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['typeCode']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' not found.']) );
                return false;
            }
            
            // Get the row from the result.
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Check if the type is enabled
            if( $sqlRow['is_enabled'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' is disabled.']) );
                return false;
            }
            
            // If auto calculate is set, check that the item supports it.
            if( $data['autoCalculate'] === true && $sqlRow['auto_calculate'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'This item can not be set to auto calculate.']) );
                return false;
            }
            
            // If auto calculate is set, check that the item supports it.
            if(strlen( $data['unitSourceCode'] !== null ? $data['unitSourceCode'] : '' ) > 0 && $sqlRow['allow_unit_source'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'This item does not allow a unit source.']) );
                return false;
            }
            
            // If the item is once off then check that an accrual date was provided.
            if( $sqlRow['is_once_off'] === true ) {
                if( $data['accrualDate'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Accrual date is required for once off items.']) );
                    return false;
                }
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO payslip_config_items ( ' .
                    'payslip_item_type_code, ' . 
                    'employee_id, ' . 
                    'description, ' . 
                    'accrual_date, ' . 
                    'auto_calculate, ' . 
                    'unit_source_code, ' .
                    'include_in_nett_pay, ' .
                    'amount ' . 
                ') ' .
                'VALUES ( ' . 
                    '$1, $2, $3, $4, $5, $6, $7, $8 ' .
                ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                $data['typeCode'],          // payslip_item_type_code
                $data['employeeId'],        // employee_id
                $data['description'],       // description
                $data['accrualDate'],       // accrual_date
                $data['autoCalculate'],     // auto_calculate
                $data['unitSourceCode'],    // unit_source_code
                $data['includeInNettPay'],  // include_in_nett_pay
                $data['amount']             // amount
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            
            return true;
        }
        
        
        // Function to edit a payslip item
        //
        // Required Parameters
        //  employeeId              The ID of the employee this item is for.
        //  typeCode                The code of the item type to edit.
        //  description             A description for the item
        //  accrualDate             The date the item will accrue.  If the type is once off then this value can not be null.  If it is a recurring type
        //                          the value must be null.
        //  amount                  The amount for the item.  Can be null.
        //
        // Optional Parameters
        //  None
        public function editPayslipItem($data, $user, $db) {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payslipItemId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'typeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accrualDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
                'autoCalculate' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'unitSourceCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                'includeInNettPay' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE payslip_config_items IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payslip_item_types IN EXCLUSIVE MODE;');
            
            // Load the type from the database
            $sqlQuery = 'SELECT code, is_once_off, default_amount, allow_unit_source, is_enabled FROM payslip_item_types WHERE code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['typeCode']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the type was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' not found.']) );
                return false;
            }
            
            // Get the row from the result.
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Check if the type is enabled
            if( $sqlRow['is_enabled'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' is disabled.']) );
                return false;
            }
            
            // If the item is once off then check that an accrual date was provided.
            if( $sqlRow['is_once_off'] === true ) {
                if( $data['accrualDate'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Accrual date is required for once off items.']) );
                    return false;
                }
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE payslip_config_items SET ';
            
            if( isset($data['typeCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'payslip_item_type_code = $' . $updateCount;
                $updateValues[] = $data['typeCode'];
            }
            if( isset($data['description']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'description = $' . $updateCount;
                $updateValues[] = $data['description'];
            }
            if( isset($data['accrualDate']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'accrual_date = $' . $updateCount;
                $updateValues[] = $data['accrualDate'];
            }
            if( isset($data['autoCalculate']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'auto_calculate = $' . $updateCount;
                $updateValues[] = $data['autoCalculate'];
            }
            if( array_key_exists('unitSourceCode', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'unit_source_code = $' . $updateCount;
                $updateValues[] = $data['unitSourceCode'];
            }
            if( array_key_exists('includeInNettPay', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'include_in_nett_pay = $' . $updateCount;
                $updateValues[] = $data['includeInNettPay'];
            }
            if( isset($data['amount']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'amount = $' . $updateCount;
                $updateValues[] = $data['amount'];
            }
            
            // Set where clause
            $updateCount++;
            $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $data['payslipItemId'];
            
            $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            
            return true;
        }
        
        // Function to get the employment details of a employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
        //
        // Optional Parameters
        //  None
        public function getEmploymentStatus($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlQuery = 
                'SELECT ' .
                    'employment_end_date ' .
                'FROM ' .
                    'employees ' .
                'WHERE ' .
                    'id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $data['employeeId'] . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $employeeStatus = 'DISM';
            if ($sqlRow['employment_end_date'] === null) {
                $employeeStatus = 'EMPL';
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'employeeStatus' => $employeeStatus
            ]) );
            
            return true;
        }
        
        // Function to hire or fire an employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose details to get
        //
        // Optional Parameters
        //  None
        public function updateEmployeeStatus($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'status' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'date' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'reason' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Will the employee be employed
            if( $data['status'] === 'EMPL' ) {
                // Connect to the database
                $dbConnected = $db->connect(
                    "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                    "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
                );
                if( $dbConnected !== true ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to system database.']) );
                    return false;
                }
                
                // Set our search path to system
                $sqlResult = $db->paramQuery('SET search_path TO system;', []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Get the employee limit for the relevant company
                $sqlQuery =
                    'SELECT ' .
                        'companies.employee_limit ' . 
                    'FROM ' . 
                        'companies ' .
                    'WHERE ' .
                        'companies.id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $_SESSION['userData']['companyId']      // company_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Unable to get company employee limit.']) );
                    return false;
                }
                
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Company not found.' 
                    ]) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                $employeeLimit = $sqlRow['employee_limit'];
                
                // Set search path to the schema
                $dbSettings = $_SESSION['dbCache'];
                $sqlResult = $db->paramQuery('SET search_path TO '. $dbSettings['schema'] . ';', []);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to schema.']) );
                    return false;
                }
                
                // Is there an employment limit?
                if( $employeeLimit !== null ) {
                    // Get the number of employees for the company
                    $sqlQuery =
                        'SELECT ' .
                            'COUNT( id ) AS employee_count ' . 
                        'FROM ' . 
                            'employees ' .
                        'WHERE ' .
                            'employment_end_date IS NULL;';
                    $sqlResult = $db->paramQuery($sqlQuery, []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Unable to get number of employees.']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    if( $sqlRow['employee_count'] >= $employeeLimit ) {
                        echo( json_encode(['ok' => false, 'error' => 'Unable to employee the specified employee. Your company is limited to ' . $employeeLimit. ' employees.']) );
                        return false;
                    }
                }
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE employment_history IN EXCLUSIVE MODE;');
            
            // Set the date, or use today's date
            $date = $data['date'];
            if ($data['date'] === '') {
                $date = date("Y-m-d");
            }
            
            // Should the employee be dismissed?
            if ($data['status'] === 'DISM') {
                // Make certain a valid reason was given
                if( !isset($data['reason']) || ($data['reason'] === '') ) {
                    echo( json_encode(['ok' => false, 'error' => 'No reason for termination of employment given']) );
                    return false;
                }
                
                // Build the query to update the employee
                $updateCount = 0;
                $updateValues = [];
                $updateQuery = 'UPDATE employees SET ';
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_end_date = $' . $updateCount;
                $updateValues[] = $date;
                
                // Set where clause
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ' RETURNING employment_position, employment_end_date ;';
                $updateValues[] = $data['employeeId'];
                
                // Run the query and get the result
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $updateResult->fetchAssociative();
                $employmentPosition = $sqlRow['employment_position'];
                $employmentEndDate = $sqlRow['employment_end_date'];
                
                // Build the query to insert the item.
                $sqlQuery =
                    'UPDATE employment_history SET ' .
                        'dismissed_by_user_id = $1, ' .
                        'dismissed_on = $2, ' .
                        'dismissal_position = $3, ' .
                        'dismissal_date = $4, ' .
                        'dismissal_reason = $5 ' .
                    'WHERE ' . 
                        'id IN (SELECT id FROM employment_history WHERE employee_id = $6 ORDER BY id DESC LIMIT 1 );';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $user['id'],                  // dismissed_by_user_id
                    date("Y-m-d H:i:s"),          // dismissed_on
                    $employmentPosition,          // dismissal_position
                    $employmentEndDate,           // dismissal_date
                    $data['reason'],              // dismissal_reason in where clause
                    $data['employeeId']           // employee_id in where clause
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            else if ($data['status'] === 'EMPL') {
                $updateCount = 0;
                $updateValues = [];
                $updateQuery = 'UPDATE employees SET ';
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_start_date = $' . $updateCount;
                $updateValues[] = $date;
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'employment_end_date = $' . $updateCount;
                $updateValues[] = null;
                
                // Set where clause
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . 
                ' RETURNING employment_position, employment_start_date ;';
                $updateValues[] = $data['employeeId'];
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $updateResult->fetchAssociative();
                $employmentPosition = $sqlRow['employment_position'];
                $employmentStartDate = $sqlRow['employment_start_date'];
                
                // Build the query to insert the item.
                $sqlQuery =
                    'INSERT INTO ' .
                        'employment_history ( ' .
                            'employee_id, ' .
                            'employed_by_user_id, ' .
                            'employed_on, ' .
                            'employment_position, ' .
                            'employment_date, ' .
                            'dismissed_by_user_id, ' .
                            'dismissed_on, ' .
                            'dismissal_position, ' .
                            'dismissal_date ' .
                        ') ' .
                    'VALUES ( ' .
                            ' $1,  $2,  $3,  $4,  $5,  $6, $7, $8, $9 '.
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeId'],     // employee_id
                    $user['id'],             // employed_by_user_id
                    date("Y-m-d H:i:s"),     // employed_on
                    $employmentPosition,     // employment_position
                    $employmentStartDate,    // employment_date
                    null,                    // dismissed_by_user_id
                    null,                    // dismissed_on
                    null,                    // dismissal_position
                    null                     // dismissal_date
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode([
                'ok' => true
            ]) );
            return true;
        }
        
        // Function to get the next available employee code.
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  startCode:              The code to start from.  If set to null the function will try to generate a code
        //                          from the beginning of the series.  Default to null.
        public function getNextAvailableCode($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'startCode' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'startCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
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
            $numberMask = new NumberMask( $config['employee_code_mask'] );
            
            // Set startCode to the second number in the series.
            $numberMask->next();
            $startCode = $numberMask->getValue();
            
            // Check if a start code was provided.
            if( $data['startCode'] !== null ) {
                // Check that the start code provided is valid
                if( $numberMask->validate($data['startCode']) !== true ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid startCode provided.']) );
                    return false;
                }
                
                $startCode = $data['startCode'];
            }
            
            // Get basic details of current account numbers
            $sqlQuery =
                'SELECT ' .
                    'MAX(code) AS max_code, MIN(code) AS min_code, COUNT(*) AS total_employees ' .
                'FROM ' .
                    'employees ' .
                'WHERE ' .
                    'LOWER(code) >= LOWER($1);';
            $sqlResult = $db->paramQuery($sqlQuery, [$startCode]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // We should have at least one row
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to calculate total employees.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $minCode = $sqlRow['min_code'];
            $maxCode = $sqlRow['max_code'];
            $totalEmployees = $sqlRow['total_employees'];
            
            // Calculate the total amount of available codes in the searchSpace
            $searchSize = 0;
            if( $maxCode !== null ) $searchSize = $numberMask->getValueIndex($maxCode) - $numberMask->getValueIndex($startCode) + 1;
            
            // Initialize calculation method
            $searchMethod = null;
            
            // If our minimum code is null or larger than the start code then we can return the start code.
            // If the total amount of employees are equal to our search space then all the codes has been used and we have to return the max code + 1.
            // If none of the above are the case then we have to search for a gap in the search space.
            $nextCode = null;
            $searchCost = 1;
            if( $minCode === null || $minCode > $startCode ) {
                $searchMethod = 'Start code';
                $nextCode = $startCode;
            }
            else if( $searchSize === $totalEmployees ) {
                $searchMethod = 'End code + 1';
                
                $numberMask->seek( $maxCode );
                $numberMask->next();
                
                $nextCode = $numberMask->getValue();
            }
            else {
                $searchMethod = 'Binary search';
                
                $searchStart = $startCode;
                $searchEnd = $maxCode;
                $searchMid = null;
                $searchEmployeeTotal = $totalEmployees;
                $leftSize = 0;
                $leftCount = 0;
                $rightSize = 0;
                $rightCount = 0;
                while( $searchSize > 1 ) {
                    // Increase our search cost.
                    $searchCost++;
                    
                    // Calculate the mid of the search space.  searchStartIndex + ((searchEndIndex - searchEndIndex) / 2)
                    $searchMid = $numberMask->getIndexValue($numberMask->getValueIndex($searchStart) +
                        floor(($numberMask->getValueIndex($searchEnd) - $numberMask->getValueIndex($searchStart)) / 2));
                        
                    // Get the amount of codes from searchStart to searchMid including searchMid
                    $sqlQuery =
                        'SELECT COUNT(*) AS left_total FROM employees WHERE LOWER(code) >= LOWER($1) AND LOWER(code) <= LOWER($2);';
                    $sqlResult = $db->paramQuery($sqlQuery, [$searchStart, $searchMid]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // We should have precisely one row
                    if( $sqlResult->getRowCount() !== 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Unable to calculate left search space.']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    $leftCount = $sqlRow['left_total'];
                    $rightCount = $searchEmployeeTotal - $leftCount;
                    
                    // Calculate the total amount of available account numbers to the left
                    $leftSize = $numberMask->getValueIndex($searchMid) - $numberMask->getValueIndex($searchStart) + 1;
                    $rightSize = $searchSize - $leftSize;
                    
                    // Check if we found a free code
                    if( $leftSize === 1 && $leftCount === 0 ) {
                        $nextCode = $searchStart;
                    }
                    else if( $rightSize === 1 && $rightCount === 0 ) {
                        $nextCode = $searchEnd;
                    }
                    
                    // If no number was found yet.  Go to the next search position
                    if( $leftCount < $leftSize ) {
                        $searchEnd = $searchMid;
                        $searchSize = $leftSize;
                        $searchEmployeeTotal = $leftCount;
                    }
                    else {
                        $numberMask->seek( $searchMid );
                        $numberMask->next();
                        
                        $searchStart = $numberMask->getValue();
                        $searchSize = $rightSize;
                        $searchEmployeeTotal = $rightCount;
                    }
                }
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'nextEmployeeCode' => $nextCode,
                'employeeCodeMask' => $config['employee_code_mask'],
                'searchMethod' => $searchMethod,
                'cost' => $searchCost
            ]) );
        }
        
        // Function to get a list of all provident funds for an employee.
        //
        // Required Parameters
        //  employeeId              The id of the employee whose provident fund details to get
        //
        // Optional Parameters
        //  None
        public function getProvidentFundList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $employeeId = $data['employeeId'];
            
            // Load all available provident funds
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id AS provident_fund_id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active, ' .
                    'provident_funds.created_on, ' .
                    'provident_fund_members.joined_on ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id AND ' .
                        'provident_fund_members.employee_id = $1 ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE ' .
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $providentFunds = [];
            $providentFundIndex = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Set the provident funds details
                $providentFunds[] = [
                    'id' => $sqlRow['provident_fund_id'],
                    'name' => $sqlRow['name'],
                    'typeCode' => $sqlRow['provident_fund_calculation_type_code'],
                    'typeName' => $sqlRow['provident_fund_calculation_type_name'],
                    'employeeAmount' => $sqlRow['employee_amount'],
                    'employerAmount' => $sqlRow['employer_amount'],
                    'categoryFactor' => $sqlRow['category_factor'],
                    'createdOn' => $sqlRow['created_on'],
                    'joinedOn' => $sqlRow['joined_on'],
                    'rfiItems' => []
                ];
                
                // Is the provident fund calculation based on retirement fund income items?
                if( $sqlRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
                    // Get all the relevant retirement fund income items
                    $rfiItemSqlQuery =
                        'SELECT ' . 
                            'employee_rfi_items.id AS employee_rfi_item_id, ' .
                            'payslip_config_items.id AS payslip_config_item_id, ' .
                            'employee_rfi_items.percentage, ' .
                            'payslip_config_items.description ' .
                        'FROM ' . 
                            'payslip_config_items ' .
                        'LEFT JOIN ' .
                            'payslip_item_types ON payslip_item_types.code = payslip_config_items.payslip_item_type_code ' .
                        'LEFT JOIN ' .
                            'employee_rfi_items ON employee_rfi_items.payslip_config_item_id = payslip_config_items.id AND ' .
                            'employee_rfi_items.provident_fund_id = $1 ' .
                        'WHERE ' . 
                            'payslip_item_types.payslip_category_code = \'INCO\' AND ' .
                            'payslip_config_items.employee_id = $2 ' .
                        'ORDER BY ' . 
                            'payslip_config_items.description ASC;';
                    $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$sqlRow['provident_fund_id'], $employeeId]);
                    if( !$rfiItemSqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                        $providentFunds[$providentFundIndex]['rfiItems'][] = [
                            'id' => $rfiItemSqlRow['employee_rfi_item_id'],
                            'payslipConfigItemId'  => $rfiItemSqlRow['payslip_config_item_id'],
                            'percentage' => $rfiItemSqlRow['percentage'],
                            'description' => $rfiItemSqlRow['description']
                        ];
                    }
                }
                
                // Next provident fund
                $providentFundIndex = $providentFundIndex + 1;
            }
            
            // Send result
            echo( json_encode(['ok' => true,'providentFunds' => $providentFunds]) );
            return true;
        }
        
        // Function to get employee provident fund details.
        //
        // Required Parameters
        //  employeeId              The id of the employee whose provident fund details to get
        //  providentFundId         The id of the provident fund which details to get
        //
        // Optional Parameters
        //  None
        public function getProvidentFund($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $employeeId = $data['employeeId'];
            $providentFundId = $data['providentFundId'];
            
            // Load the selected provident fund
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id AS provident_fund_id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active, ' .
                    'provident_funds.created_on, ' .
                    'provident_fund_members.joined_on ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id AND ' .
                        'provident_fund_members.employee_id = $1 ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE AND ' .
                    'provident_funds.id = $2 ' . 
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId, $providentFundId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Provident fund not found']) );
                return false;
            }
            
            // Set the provident funds details
            $sqlRow = $sqlResult->fetchAssociative();
            $providentFund = [
                'id' => $sqlRow['provident_fund_id'],
                'name' => $sqlRow['name'],
                'typeCode' => $sqlRow['provident_fund_calculation_type_code'],
                'typeName' => $sqlRow['provident_fund_calculation_type_name'],
                'employeeAmount' => $sqlRow['employee_amount'],
                'employerAmount' => $sqlRow['employer_amount'],
                'categoryFactor' => $sqlRow['category_factor'],
                'createdOn' => $sqlRow['created_on'],
                'joinedOn' => $sqlRow['joined_on'],
                'rfiItems' => []
            ];
            
            // Is the provident fund calculation based on retirement fund income items?
            if( $sqlRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
                // Get all the relevant retirement fund income items
                $rfiItemSqlQuery =
                    'SELECT ' . 
                        'employee_rfi_items.id AS employee_rfi_item_id, ' .
                        'payslip_config_items.id AS payslip_config_item_id, ' .
                        'employee_rfi_items.percentage, ' .
                        'payslip_config_items.description ' .
                    'FROM ' . 
                        'payslip_config_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_config_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'employee_rfi_items ON employee_rfi_items.payslip_config_item_id = payslip_config_items.id AND ' .
                            'employee_rfi_items.provident_fund_id = $1 ' .
                    'WHERE ' . 
                        'payslip_item_types.payslip_category_code = \'INCO\' AND ' .
                        'payslip_config_items.employee_id = $2 ' .
                    'ORDER BY ' . 
                        'payslip_config_items.description ASC;';
                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $employeeId]);
                if( !$rfiItemSqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                    $providentFund['rfiItems'][] = [
                        'id' => $rfiItemSqlRow['employee_rfi_item_id'],
                        'payslipConfigItemId'  => $rfiItemSqlRow['payslip_config_item_id'],
                        'percentage' => $rfiItemSqlRow['percentage'],
                        'description' => $rfiItemSqlRow['description']
                    ];
                }
            }
            
            // Send result
            echo( json_encode(['ok' => true,'providentFund' => $providentFund]) );
            return true;
        }
        
        // Function to subscribe an employee to a provident fund
        //
        // Required Parameters
        //  employeeId              The id of the employee to subscribe
        //  providentFundId         The id of the provident fund to be sunscribed to
        //
        // Optional Parameters
        //  rfiItems                An array describing the retirement fund income items
        // 
        //  rfiItems = [
        //      'payslipConfigItemId',      // The payslip configuration item id
        //      'percentage'                // A percentage of the income from which to contribute
        //  ]
        public function subscribeProvidentFund($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'rfiItems' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'payslipConfigItemId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'percentage' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $providentFundId = $data['providentFundId'];
            $employeeId = $data['employeeId'];
            
            // Get the provident fund details
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id AS provident_fund_id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active, ' .
                    'provident_funds.created_on, ' .
                    'provident_fund_members.joined_on ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id AND ' .
                        'provident_fund_members.employee_id = $1 ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE AND ' .
                    'provident_funds.id = $2 ' . 
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId, $providentFundId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Provident fund not found']) );
                return false;
            }
            
            $row = $sqlResult->fetchAssociative();
            $providentFundCalculationTypeCode = $row['provident_fund_calculation_type_code'];
            
            // Is the employee already a member?
            if( $row['joined_on'] !== null ) {
                echo( json_encode(['ok' => false, 'error' => 'The employee is already a member of the specified provident fund.']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE employee_rfi_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE provident_fund_members IN ACCESS EXCLUSIVE MODE', []);
            
            // Add the member to the provident fund
            $sqlQuery = 
                'INSERT INTO ' .
                    'provident_fund_members ( ' .
                        'provident_fund_id, ' .
                        'employee_id, ' .
                        'joined_on ' .
                    ') ' .
                'VALUES ( ' .
                        '$1, $2, $3 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $providentFundId,               // provident_fund_id
                $employeeId,                    // employee_id
                date('Y-m-d H:i:s', time())     // joined_on
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Is the provident fund calculation based on retirement fund income items?
            if( $providentFundCalculationTypeCode === 'PRFI' ) {
                // Clear any existig employee rfi items
                $sqlQuery = 
                    'DELETE FROM ' . 
                        'employee_rfi_items ' . 
                    'WHERE ' . 
                        'provident_fund_id = $1 AND ' . 
                        'payslip_config_item_id IN ( ' . 
                            'SELECT id FROM payslip_config_items WHERE employee_id = $2 ' . 
                        ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $providentFundId,   // provident_fund_id
                    $employeeId         // employee_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Add all the payslip configiration income items as rfi items by default
                $sqlQuery =
                    'SELECT DISTINCT ' . 
                        'payslip_config_items.id, ' .
                        'payslip_config_items.description ' .
                    'FROM ' . 
                        'payslip_config_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_config_items.payslip_item_type_code ' .
                    'WHERE ' . 
                        'payslip_item_types.payslip_category_code = \'INCO\' AND ' .
                        'payslip_config_items.employee_id = $1 ' .
                    'ORDER BY ' . 
                        'payslip_config_items.description ASC;';
                $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Create the query to insert the employee retirement fund income items, if any
                $insertCount = 0;
                $insertValues = [];
                $insertQuery = 'INSERT INTO employee_rfi_items (provident_fund_id, payslip_config_item_id, percentage) VALUES ';
                
                // Add the provident fund id
                $insertCount++;
                $insertValues[] = $providentFundId;
                
                // Add all the income items at 100%
                while( $sqlRow = $sqlResult->fetchAssociative() ) {
                    if( $insertCount > 1 ) $insertQuery = $insertQuery . ',';
                    $insertCount++;
                    $insertValues[] = $sqlRow['id'];
                    $insertQuery = $insertQuery . '( $1, $' . $insertCount;
                    $insertCount++;
                    $insertValues[] = '100.00';
                    $insertQuery = $insertQuery . ', $' . $insertCount . ' )';
                }
                
                // Are there any rif items to add?
                if( $insertCount > 1 ) {
                    // Insert the items into the database
                    $sqlResult = $db->paramQuery($insertQuery, $insertValues);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                
                // // Create the query to insert the employee retirement fund income items, if any
                // $insertCount = 0;
                // $insertValues = [];
                // $insertQuery = 'INSERT INTO employee_rfi_items (provident_fund_id, payslip_config_item_id, percentage) VALUES ';
                
                // // Add the provident fund id
                // $insertCount++;
                // $insertValues[] = $providentFundId;
                
                // // Add the new rfi items, if any
                // foreach( $data['rfiItems'] AS $rfiItem ) {
                //     if( $insertCount > 1 ) $insertQuery = $insertQuery . ',';
                //     $insertCount++;
                //     $insertValues[] = $rfiItem['payslipConfigItemId'];
                //     $insertQuery = $insertQuery . '( $1, $' . $insertCount;
                //     $insertCount++;
                //     $insertValues[] = $rfiItem['percentage'];
                //     $insertQuery = $insertQuery . ', $' . $insertCount . ' )';
                // }
                
                // // Are there any rif items to add?
                // if( $insertCount > 1 ) {
                //     // Insert the items into the database
                //     $sqlResult = $db->paramQuery($insertQuery, $insertValues);
                //     if( !$sqlResult->isValid() ) {
                //         echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                //         return false;
                //     }
                // }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to unsubscribe an employee from a provident fund
        //
        // Required Parameters
        //  employeeId              The id of the employee to subscribe
        //  providentFundId         The id of the provident fund to be sunscribed to
        //
        // Optional Parameters
        //  None
        public function unsubscribeProvidentFund($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $providentFundId = $data['providentFundId'];
            $employeeId = $data['employeeId'];
            
            // Get the provident fund details
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id AS provident_fund_id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active, ' .
                    'provident_funds.created_on, ' .
                    'provident_fund_members.joined_on ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id AND ' .
                        'provident_fund_members.employee_id = $1 ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE AND ' .
                    'provident_funds.id = $2 ' . 
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId, $providentFundId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Provident fund not found']) );
                return false;
            }
            
            $row = $sqlResult->fetchAssociative();
            $providentFundCalculationTypeCode = $row['provident_fund_calculation_type_code'];
            
            // Is the employee already a member?
            if( $row['joined_on'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'The employee is not a member of the specified provident fund.']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE employee_rfi_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE provident_fund_members IN ACCESS EXCLUSIVE MODE', []);
            
            // Remove the member form the provident fund
            $sqlQuery = 
                'DELETE FROM ' . 
                    'provident_fund_members ' . 
                'WHERE ' . 
                    'provident_fund_id = $1 AND ' . 
                    'employee_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $providentFundId,   // provident_fund_id
                $employeeId         // employee_id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Is the provident fund calculation based on retirement fund income items?
            if( $providentFundCalculationTypeCode === 'PRFI' ) {
                // Clear any existig employee rfi items
                $sqlQuery = 
                    'DELETE FROM ' . 
                        'employee_rfi_items ' . 
                    'WHERE ' . 
                        'provident_fund_id = $1 AND ' . 
                        'payslip_config_item_id IN ( ' . 
                            'SELECT id FROM payslip_config_items WHERE employee_id = $2 ' . 
                        ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $providentFundId,   // provident_fund_id
                    $employeeId         // employee_id
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
        
        // Function to subscribe an employee to a provident fund
        //
        // Required Parameters
        //  employeeId              The id of the employee to subscribe
        //  providentFundId         The id of the provident fund to be sunscribed to
        //
        // Optional Parameters
        //  rfiItems                An array describing the retirement fund income items
        // 
        //  rfiItems = [
        //      'payslipConfigItemId',      // The payslip configuration item id
        //      'percentage'                // A percentage of the income from which to contribute
        //  ]
        public function updateProvidentFundRfiItems($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'providentFundId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'rfiItems' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'payslipConfigItemId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'percentage' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $providentFundId = $data['providentFundId'];
            $employeeId = $data['employeeId'];
            
            // Get the provident fund details
            $sqlQuery = 
                'SELECT ' . 
                    'provident_funds.id AS provident_fund_id, ' .
                    'provident_funds.name, ' .
                    'provident_funds.provident_fund_calculation_type_code, ' .
                    'provident_fund_calculation_types.name AS provident_fund_calculation_type_name, ' .
                    'provident_funds.employee_amount, ' .
                    'provident_funds.employer_amount, ' .
                    'provident_funds.category_factor, ' .
                    'provident_funds.is_active, ' .
                    'provident_funds.created_on, ' .
                    'provident_fund_members.joined_on ' .
                'FROM ' . 
                    'provident_funds ' .
                'LEFT JOIN ' .
                    'provident_fund_calculation_types ON provident_fund_calculation_types.code = provident_funds.provident_fund_calculation_type_code ' .
                'LEFT JOIN ' .
                    'provident_fund_members ON provident_fund_members.provident_fund_id = provident_funds.id AND ' .
                        'provident_fund_members.employee_id = $1 ' .
                'WHERE ' . 
                    'provident_funds.is_active IS TRUE AND ' .
                    'provident_funds.id = $2 ' . 
                'ORDER BY ' . 
                    'provident_funds.name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId, $providentFundId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Provident fund not found']) );
                return false;
            }
            
            $row = $sqlResult->fetchAssociative();
            $providentFundCalculationTypeCode = $row['provident_fund_calculation_type_code'];
            
            // Is the employee NOT a member?
            if( $row['joined_on'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'The employee is not a member of the specified provident fund.']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE employee_rfi_items IN ACCESS EXCLUSIVE MODE', []);
            
            // Is the provident fund calculation based on retirement fund income items?
            if( $providentFundCalculationTypeCode === 'PRFI' ) {
                // Clear any existig employee rfi items
                $sqlQuery = 
                    'DELETE FROM ' . 
                        'employee_rfi_items ' . 
                    'WHERE ' . 
                        'provident_fund_id = $1 AND ' . 
                        'payslip_config_item_id IN ( ' . 
                            'SELECT id FROM payslip_config_items WHERE employee_id = $2 ' . 
                        ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $providentFundId,   // provident_fund_id
                    $employeeId         // employee_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Create the query to insert the employee retirement fund income items, if any
                $insertCount = 0;
                $insertValues = [];
                $insertQuery = 'INSERT INTO employee_rfi_items (provident_fund_id, payslip_config_item_id, percentage) VALUES ';
                
                // Add the provident fund id
                $insertCount++;
                $insertValues[] = $providentFundId;
                
                // Add the new rfi items, if any
                foreach( $data['rfiItems'] AS $rfiItem ) {
                    if( $insertCount > 1 ) $insertQuery = $insertQuery . ',';
                    $insertCount++;
                    $insertValues[] = $rfiItem['payslipConfigItemId'];
                    $insertQuery = $insertQuery . '( $1, $' . $insertCount;
                    $insertCount++;
                    $insertValues[] = $rfiItem['percentage'];
                    $insertQuery = $insertQuery . ', $' . $insertCount . ' )';
                }
                
                // Are there any rif items to add?
                if( $insertCount > 1 ) {
                    // Insert the items into the database
                    $sqlResult = $db->paramQuery($insertQuery, $insertValues);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to check whether the maximum number of employees has been reached
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getLimit($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Get the employee limit for the relevant company
            $sqlQuery =
                'SELECT ' .
                    'companies.employee_limit ' . 
                'FROM ' . 
                    'companies ' .
                'WHERE ' .
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $_SESSION['userData']['companyId']      // company_id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to get company employee limit.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company not found.' 
                ]) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeLimit = $sqlRow['employee_limit'];
            
            // Set search path to the schema
            $dbSettings = $_SESSION['dbCache'];
            $sqlResult = $db->paramQuery('SET search_path TO '. $dbSettings['schema'] . ';', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to schema.']) );
                return false;
            }
            
            // Get the number of employees for the company
            $sqlQuery =
                'SELECT ' .
                    'COUNT( id ) AS employee_count ' . 
                'FROM ' . 
                    'employees ' .
                'WHERE ' .
                    'employment_end_date IS NULL;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to get number of employees.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeCount = $sqlRow['employee_count'];
            
            $limit = [
                'employeeLimit' => $employeeLimit,
                'employeeCount' => $employeeCount
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'limit' => $limit]) );
            return true;
        }
        
        // Function to list employee dismissal reasons
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getDismissalReasonList($data, $user, $db) {
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
            
            // Load data from the employee_dismissal_reasons table
            $sqlQuery = 'SELECT code, name FROM employee_dismissal_reasons ORDER BY name ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payment periods array
            $reasons = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $reasons[] = [
                    'code' => $sqlRow['code'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'reasons' => $reasons]) );
            return true;
        }
        
        
        // Function to download the import template
        //
        // Required Parameters
        //  format      The format of the template to download (CSVX or XLSX)
        //
        // Optional Parameters
        //  none
        public function downloadImportTemplate($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set csv by default
            $filename = 'employees_import_template.csv';
            $realFileName =  'employees_import_template.csv';
            $mimeType = 'text/csv';
            
            // Set xlsx format if specified
            if( $data['format'] === 'XLSX' ) {
                $filename = 'employees_import_template.xlsx';
                $realFileName =  'employees_import_template.xlsx';
                $mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
            
            // Check if media data folder exists
            if (!file_exists(CONF_MEDIA_DIR)) {
                echo( json_encode(['ok' => false, 'error' => 'No media directory found. Please contact support.']) );
                return false;
            }
            
            // Check if templates folder exists
            if (!file_exists(CONF_CLIENT_DOWNLOAD_DIR)) {
                echo( json_encode(['ok' => false, 'error' => 'File does not exist. Please contact support']) );
                return false;
            }
            
            $resourcePath = realpath(CONF_CLIENT_DOWNLOAD_DIR . $realFileName);
            header('Content-Length: ' . filesize($resourcePath));
            header('Content-Type: ' . $mimeType);
            header('Cache-Control: cache, max-age=31536000');
            header('Content-Disposition: attachment; filename="' . $filename . '";');
            ob_clean();   // discard any data in the output buffer (if possible)
            flush();      // flush headers (if possible)
            readfile( $resourcePath );
            return true;
        }
        
        // Function to list exceptions for a given employee import file
        //
        // Required Parameters
        //  None
        //
        public function getImportExceptionList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Have we not received a file?
            if( !isset($_FILES['document']) ) {
                die( json_encode(['ok' => false, 'error' => 'No import file received']) );
            }
            
            // Get the file extension
            $extensionCheck = strtolower( pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION) );
            if( $extensionCheck !== 'csv' && $extensionCheck !== 'xlsx' ) {
                echo( json_encode(['ok' => false, 'error' => 'Files of this type (' . pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION) . ') cannot be imported.']) );
                return false;
            }
            
            // Do various checks to ensure the file integrity
            if($_FILES['document']['error'] === 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the maximum upload file size.']));
                return false;
            }
            else if($_FILES['document']['error'] === 2 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the max file size directive that was specified in the HTML form.']));
                return false;
            }
            else if($_FILES['document']['error'] === 3 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file was only partially uploaded.']));
                return false;
            }
            else if($_FILES['document']['error'] === 4 ) {
                echo( json_encode(['ok' => false, 'error' => 'No file was uploaded.']));
                return false;
            }
            else if($_FILES['document']['error'] === 6 ) {
                echo( json_encode(['ok' => false, 'error' => 'Missing a temporary folder.']));
                return false;
            }
            else if($_FILES['document']['error'] === 7 ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to write file to disk.']));
                return false;
            }
            else if($_FILES['document']['error'] === 8 ) {
                echo( json_encode(['ok' => false, 'error' => 'PHP extension stopped the file upload.']));
                return false;
            }
            
            // Set the headings for csv file
            $headings = array(
                'CODE','TITLE','INITIALS','FULL NAME','LAST NAME','ALIAS','ID NUMBER','PASSPORT NUMBER','PASSPORT COUNTRY','DATE OF BIRTH',
                'IS ASYLUM SEEKER','IS REFUGEE','IS RETIRED','PHYSICAL ADDRESS UNIT','PHYSICAL ADDRESS COMPLEX','PHYSICAL ADDRESS STREET','PHYSICAL ADDRESS SUBURB',
                'PHYSICAL ADDRESS CITY','PHYSICAL ADDRESS POSTAL CODE','PHYSICAL ADDRESS COUNTRY','POSTAL SAME AS PHYSICAL ADDRESS','POSTAL ADDRESS LINE 1',
                'POSTAL ADDRESS LINE 2','POSTAL ADDRESS LINE 3','POSTAL ADDRESS CODE','POSTAL ADDRESS COUNTRY','WORK SAME AS COMPANY ADDRESS','WORK ADDRESS UNIT',
                'WORK ADDRESS COMPLEX','WORK ADDRESS STREET','WORK ADDRESS SUBURB','WORK ADDRESS CITY','WORK ADDRESS POSTAL CODE','WORK ADDRESS COUNTRY','HOME NUMBER',
                'WORK NUMBER','CELL NUMBER','FAX NUMBER','EMAIL ADDRESS','EMERGENCY CONTACT PERSON','EMERGENCY CONTACT NUMBER','EMPLOYMENT START DATE','EMPLOYMENT END DATE',
                'EMPLOYMENT POSITION','EMPLOYMENT STATUS','DEPARTMENT NAME','PAYMENT METHOD','PAYMENT PERIOD','PAYMENT DAY','PAYMENT PERIOD END DAY','FINANCIAL INSTITUTION','BANK ACCOUNT TYPE',
                'ACCOUNT NUMBER','BRANCH CODE','INCOME TAX NUMBER','SIC CODE','SEND PAYSLIP BY EMAIL',
                'INCOME TAX DIRECTIVE 1','INCOME TAX DIRECTIVE 1 ISSUED DATE','INCOME TAX DIRECTIVE 1 SOURCE CODE','INCOME TAX DIRECTIVE 1 AMOUNT',
                'INCOME TAX DIRECTIVE 2','INCOME TAX DIRECTIVE 2 ISSUED DATE','INCOME TAX DIRECTIVE 2 SOURCE CODE','INCOME TAX DIRECTIVE 2 AMOUNT',
                'INCOME TAX DIRECTIVE 3','INCOME TAX DIRECTIVE 3 ISSUED DATE','INCOME TAX DIRECTIVE 3 SOURCE CODE','INCOME TAX DIRECTIVE 3 AMOUNT','ENABLE PAYE CORRECTION'
            );
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir;
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Save file to disk
            $localFile = $destDir . '/import_employees.' . $extensionCheck;
            $result = move_uploaded_file($_FILES['document']['tmp_name'], $localFile);
            if( $result !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to move uploaded file.']) );
                return false;
            }
            error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
            $exceptions = [];
            $importCount = 0;
            $updateCount = 0;
            $handler = fopen($localFile,"r");
            $line = fgets($handler, 2048);
            // Detect line seperator
            $lineSperator = ";";
            if (str_contains($line,",")) {
                $lineSperator = ",";
            }

            $maxColNum = count(explode($lineSperator,$line));
            // Is there a different amount of columns than the expected amount?
            if( $maxColNum !== count($headings) ) {
                // Add an exception
                $exceptions[] = [
                    'isCritical' => true,
                    'column' => null,
                    'row' => null,
                    'value' => $maxColNum . '',
                    'expectedValue' => count($headings) . '',
                    'description' => 'Invalid number of columns in import file',
                    'fullDescription' => 
                        'The number of columns in the import file (' . $maxColNum . ') ' .
                        'does not match the number of columns required (' . count($headings) . ')'
                ];
            }
            rewind($handler);
            $headingColumns = explode($lineSperator, fgets($handler,2048));
            // For every column in the spreadsheet
            for ($col = 0; $col <= $maxColNum-1; $col++ ) {
                // Don't check more headings than there should be
                if( $col > count($headings) ) {
                    break;
                }
                // Get the heading of the specified column                
                // Is the column 
                $headingColumn = $headingColumns[$col];
                // This is remove uncessary utf chars and replacing quotation marks on the heading
                if (isset($headingColumn)) {
                    $headingColumn = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $headingColumn);
                    $headingColumn = str_replace("\"","",$headingColumn);
                }

                if ($headingColumn !== $headings[$col]) {
                    // Add an exception
                    $exceptions[] = [
                        'isCritical' => true,
                        'column' => ($col +  1),
                        'row' => 1,
                        'value' => $headingColumn,
                        'expectedValue' => $headings[$col],
                        'description' => 'Unexpected column heading',
                        'fullDescription' => 
                            'The heading of column ' . ($col + 1) . ' (\'' . $headingColumn . '\') ' .
                            'does not match the required heading (\'' . $headings[$col] . '\')'
                    ];
                }
            }
            $row = 0;
            rewind($handler);
            $employees = [];
           // $countCriticalWarnings = 0;
            while(($rowData = fgetcsv($handler, 2048, $lineSperator)) !== FALSE) {
                Util::checkCompanyEmployeeLimit($db);
                // skip headers
                if ($row == 0) {
                    $row++;
                    continue;
                }
                $row++;
                // /// If critical warnings are more than 20 pause processing of files 
                // if ($countCriticalWarnings > 20) {                 
                //     break;
                // }
                // for ($i = 0; $i < count($exceptions); $i++) {
                //     if ($exceptions[$i]['isCritical']) {
                //         $countCriticalWarnings++;
                //     }
                // }
                $employeeImportData = new EmployeeImportData();
                $employees[] = $employeeImportData; 
                AssignEmployeeImportData::load($employeeImportData, $rowData);
                $employeeImportValidator = new EmployeeImportValidator($db, $employeeImportData, $user);
                $employeeImportValidator->validate($row, $exceptions); 
                $employeeImportValidator->checkDuplicates($row, $employees, $exceptions);
                if ($employeeImportValidator->doesEmployeeExists()) {
                    $updateCount += 1; 
                } else {
                    $importCount += 1;
                }
            }
            fclose($handler); // close file handler
            array_multisort(
                array_column($exceptions, 'isCritical'), SORT_DESC, SORT_NATURAL | SORT_FLAG_CASE,
                array_column($exceptions, 'row'), SORT_ASC, SORT_NUMERIC,
                array_column($exceptions, 'column'), SORT_ASC, SORT_NUMERIC,
                $exceptions
            );
            // Remove the file used for importing spend
            unlink($localFile);
            // Delete the temp folder
            rmdir($destDir);
            unset($employees);
            echo( json_encode(['ok' => true, 'exceptions' => $exceptions, 'updateCount' => $updateCount, 'importCount' => $importCount]) );
            return true;
        }
        
        // Function to import employees from csv file
        //
        // Required Parameters
        //  updateemployees             Wether to update or ignore existing employees
        //
        public function import($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'updateEmployees' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Have we not received a file?
            if( !isset($_FILES['document']) ) {
                die( json_encode(['ok' => false, 'error' => 'No import file received']) );
            }
            
            // Get the file extension
            $extensionCheck = strtolower( pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION) );
            if( $extensionCheck !== 'csv' && $extensionCheck !== 'xlsx' ) {
                echo( json_encode(['ok' => false, 'error' => 'Files of this type (' . pathinfo($_FILES['document']['name'], PATHINFO_EXTENSION) . ') cannot be imported.']) );
                return false;
            }
            
            // Do various checks to ensure the file integrity
            if($_FILES['document']['error'] === 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the maximum upload file size.']));
                return false;
            }
            else if($_FILES['document']['error'] === 2 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the max file size directive that was specified in the HTML form.']));
                return false;
            }
            else if($_FILES['document']['error'] === 3 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file was only partially uploaded.']));
                return false;
            }
            else if($_FILES['document']['error'] === 4 ) {
                echo( json_encode(['ok' => false, 'error' => 'No file was uploaded.']));
                return false;
            }
            else if($_FILES['document']['error'] === 6 ) {
                echo( json_encode(['ok' => false, 'error' => 'Missing a temporary folder.']));
                return false;
            }
            else if($_FILES['document']['error'] === 7 ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to write file to disk.']));
                return false;
            }
            else if($_FILES['document']['error'] === 8 ) {
                echo( json_encode(['ok' => false, 'error' => 'PHP extension stopped the file upload.']));
                return false;
            }
            
            // Set the headings for csv file
            $headings = array(
                'CODE','TITLE','INITIALS','FULL NAME','LAST NAME','ALIAS','ID NUMBER','PASSPORT NUMBER','PASSPORT COUNTRY','DATE OF BIRTH',
                'IS ASYLUM SEEKER','IS REFUGEE','IS RETIRED','PHYSICAL ADDRESS UNIT','PHYSICAL ADDRESS COMPLEX','PHYSICAL ADDRESS STREET','PHYSICAL ADDRESS SUBURB',
                'PHYSICAL ADDRESS CITY','PHYSICAL ADDRESS POSTAL CODE','PHYSICAL ADDRESS COUNTRY','POSTAL SAME AS PHYSICAL ADDRESS','POSTAL ADDRESS LINE 1',
                'POSTAL ADDRESS LINE 2','POSTAL ADDRESS LINE 3','POSTAL ADDRESS CODE','POSTAL ADDRESS COUNTRY','WORK SAME AS COMPANY ADDRESS','WORK ADDRESS UNIT',
                'WORK ADDRESS COMPLEX','WORK ADDRESS STREET','WORK ADDRESS SUBURB','WORK ADDRESS CITY','WORK ADDRESS POSTAL CODE','WORK ADDRESS COUNTRY','HOME NUMBER',
                'WORK NUMBER','CELL NUMBER','FAX NUMBER','EMAIL ADDRESS','EMERGENCY CONTACT PERSON','EMERGENCY CONTACT NUMBER','EMPLOYMENT START DATE','EMPLOYMENT END DATE',
                'EMPLOYMENT POSITION','EMPLOYMENT STATUS','DEPARTMENT NAME','PAYMENT METHOD','PAYMENT PERIOD','PAYMENT DAY','PAYMENT PERIOD END DAY','FINANCIAL INSTITUTION','BANK ACCOUNT TYPE',
                'ACCOUNT NUMBER','BRANCH CODE','INCOME TAX NUMBER','SIC CODE','SEND PAYSLIP BY EMAIL',
                'INCOME TAX DIRECTIVE 1','INCOME TAX DIRECTIVE 1 ISSUED DATE','INCOME TAX DIRECTIVE 1 SOURCE CODE','INCOME TAX DIRECTIVE 1 AMOUNT',
                'INCOME TAX DIRECTIVE 2','INCOME TAX DIRECTIVE 2 ISSUED DATE','INCOME TAX DIRECTIVE 2 SOURCE CODE','INCOME TAX DIRECTIVE 2 AMOUNT',
                'INCOME TAX DIRECTIVE 3','INCOME TAX DIRECTIVE 3 ISSUED DATE','INCOME TAX DIRECTIVE 3 SOURCE CODE','INCOME TAX DIRECTIVE 3 AMOUNT','ENABLE PAYE CORRECTION'
            );
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir;
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Save file to disk
            $localFile = $destDir . '/import_employees.' . $extensionCheck;
            $result = move_uploaded_file($_FILES['document']['tmp_name'], $localFile);
            if( $result !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'Unable to move uploaded file.']) );
                return false;
            }
            
            error_reporting(E_ALL & ~E_WARNING & ~E_NOTICE);
            $exceptions = [];
          
            $handler = fopen($localFile,"r");
            $line = fgets($handler, 2048);

            // Detect line seperator
            $lineSperator = ";";
            if (str_contains($line, ",")) {
                $lineSperator = ",";
            }
            $maxColNum = count(explode($lineSperator,$line)); 
            // Is there a different amount of columns than the expected amount?
            if( $maxColNum !== count($headings) ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid number of columns in import file.']) );
                return false;
            }
            // Start SQL transaction
            $db->startTransaction();
            // Lock the relevant table(s)
            $db->query('LOCK TABLE employees IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE departments IN EXCLUSIVE MODE;');
            $row = 0;
            $employees = [];
            rewind($handler);
            // For every entry in the import file
            while(($rowData = fgetcsv($handler, 2048, $lineSperator)) !== FALSE) {
                Util::checkCompanyEmployeeLimit($db);
                  // skip headers
                if ($row == 0) {
                    $row++;
                    continue;
                }
                $row++;
                set_time_limit(600);
                $employeeImportData = new EmployeeImportData();
                $employees[] = $employeeImportData; 
                AssignEmployeeImportData::load($employeeImportData, $rowData);
                $employeeImportValidator = new EmployeeImportValidator($db, $employeeImportData, $user);
                $employeeImportValidator->validate($row, $exceptions); 
                $employeeImportValidator->checkDuplicates($row, $employees, $exceptions);
                if ((count($exceptions) > 0) && ($exceptions['0']['isCritical'] == true)) {
                    echo (json_encode(['ok' => false, 'error' => $exceptions[0]['description'] .' Row '.$exceptions[0]['row'] . ', Column  ' .$exceptions[0]['column']]));
                    return false;
                }
                // Clean the data before persisting to the database 
                $transformData = new TransformEmployeeImportData($employeeImportData, $db);
                $transformData->apply();
                $departmentId = null;       
                // Check if deparment exists if not create new one 
                $sqlQuery = 'SELECT id FROM departments WHERE name = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$employeeImportData->department]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                if ($sqlResult->getRowCount() >= 1) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $departmentId = $sqlRow['id'];

                } else if ($employeeImportData->department != '' && $departmentId == null) {
                    // Build the query to insert the item.
                    $sqlQuery =
                         'INSERT INTO ' .
                            'departments ( ' .
                            'name ' .
                            ') ' .
                         'VALUES ( ' .
                            ' $1 ' .
                             ') ' .
                            'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$employeeImportData->department]);
                    if (!$sqlResult->isValid()) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    } else {
                        $sqlRow = $sqlResult->fetchAssociative();
                        $departmentId = $sqlRow['id'];
                    }
                }
                // Only Update if employee exists or insert if employee is new 
                if (($data['updateEmployees']  && $employeeImportValidator->doesEmployeeExists())) {
                    $updateQuery = 'UPDATE employees SET '.
                        'initials = $1,' . 
                        'title_code = $2,'.
                        'full_names = $3,' .
                        'last_name = $4,' .
                        'alias = $5,' .
                        'id_number = $6,'.
                        'passport_number = $7,'.
                        'passport_country = $8,'.
                        'date_of_birth = $9,'. 
                        'is_asylum_seeker = $10,'.
                        'is_refugee = $11 ,'.
                        'is_retired = $12,'.
                        'physical_address_unit = $13,'.
                        'physical_address_complex = $14,'. 
                        'physical_address_street = $15,'. 
                        'physical_address_suburb = $16,'. 
                        'physical_address_city = $17,'.
                        'physical_address_postal_code = $18,'.
                        'physical_address_country_code = $19,'.
                        'postal_same_as_physical_address = $20,'. 
                        'postal_address_line_1 = $21,'. 
                        'postal_address_line_2 = $22,'. 
                        'postal_address_line_3 = $23,'. 
                        'postal_address_code = $24,'. 
                        'postal_address_country_code = $25,'.
                        'work_same_as_company_address = $26,'. 
                        'work_address_unit = $27 ,'.
                        'work_address_complex = $28,'. 
                        'work_address_street = $29,'. 
                        'work_address_suburb = $30,'. 
                        'work_address_city = $31,'.
                        'work_address_postal_code = $32,'.
                        'work_address_country_code = $33,'.
                        'home_number = $34,'. 
                        'work_number = $35,'. 
                        'cell_number = $36,'. 
                        'fax_number =  $37,'.
                        'email_address = $38,'.
                        'emergency_contact_person = $39,'.
                        'emergency_contact_number = $40,'.
                        'employment_start_date = $41,'. 
                        'employment_end_date = $42,'.
                        'employment_position = $43,'. 
                        'department_id = $44,'.
                        'payment_method_code = $45 ,'.
                        'payment_period_code = $46,'.
                        'payment_day = $47 ,'.
                        'payment_period_end_day = $48, '.
                        'send_payslip_by_email = $49,'.
                        'income_tax_number = $50 ,'.
                        'income_tax_directive_1 = $51 ,'.
                        'income_tax_directive_2 = $52 ,'.
                        'income_tax_directive_3 = $53,'.
                        'income_tax_directive_1_issued_date = $54,'.
                        'income_tax_directive_1_source_code = $55,'.
                        'income_tax_directive_1_amount =  $56,'.
                        'income_tax_directive_2_issued_date = $57,'.
                        'income_tax_directive_2_source_code = $58,'.
                        'income_tax_directive_2_amount = $59,'.
                        'income_tax_directive_3_issued_date = $60,'.
                        'income_tax_directive_3_source_code = $61,'.
                        'income_tax_directive_3_amount = $62, '.
                        'enable_paye_correction = $63 ,'.
                        'sic_code = $64  '.
                        'WHERE code =  $65  RETURNING  id ';

                    $sqlResult = $db->paramQuery($updateQuery, [
                            $employeeImportData->initials,              // initials
                            $employeeImportData->titleCode,               // title_code
                            $employeeImportData->fullName,              // full_names
                            $employeeImportData->lastName,                // last_name
                            $employeeImportData->alias,                   // alias
                            $employeeImportData->idNumber,                // id_number
                            $employeeImportData->passportNumber,      // passport_number
                            $employeeImportData->passportCountry,   // passport_country
                            $employeeImportData->dateOfBirth,       // date_of_birth
                            $employeeImportData->isAsylumSeeker,    // is_asylum_seeker
                            $employeeImportData->isRefugee,            // is_refugee
                            $employeeImportData->isRetired,                              // is_retired
                            $employeeImportData->physicalAddressUnit,        // physical_address_unit
                            $employeeImportData->physicalAddressComplex,      // physical_address_complex
                            $employeeImportData->physicalAddressStreet,       // physical_address_street
                            $employeeImportData->physicalAddressSuburb,         // physical_address_suburb
                            $employeeImportData->physicalAddressCity,           // physical_address_city
                            $employeeImportData->physicalAddressPostalCode,     // physical_address_postal_code
                            $employeeImportData->physicalAddressCountry,    // physical_address_country_code
                            $employeeImportData->postalAddressSameAsPhysical,                      // postal_same_as_physical_address
                            $employeeImportData->postalAddressLine1,            // postal_address_line_1
                            $employeeImportData->postalAddressLine2,            // postal_address_line_2
                            $employeeImportData->postalAddressLine3,            // postal_address_line_3
                            $employeeImportData->postalAddressCode,             // postal_address_code
                            $employeeImportData->postalAddressCountry,      // postal_address_country_code
                            $employeeImportData->workAddressSameAsCompanyAddress,                   // work_same_as_company_address
                            $employeeImportData->workAddressUnit,                                   // work_address_unit
                            $employeeImportData->workAddressComplex,                                // work_address_complex
                            $employeeImportData->workAddressStreet,                                 // work_address_street
                            $employeeImportData->workAddressSuburb,                                  // work_address_suburb
                            $employeeImportData->workAddressCity,                                    // work_address_city
                            $employeeImportData->workAddressPostalCode,                              // work_address_postal_code
                            $employeeImportData->workAddressCountry,                             // work_address_country_code
                            $employeeImportData->homeNumber,                     // home_number
                            $employeeImportData->workNumber,                    // work_number
                            $employeeImportData->cellNumber,                    // cell_number
                            $employeeImportData->faxNumber,                     // fax_number
                            $employeeImportData->emailAddress,                  // email_address
                            $employeeImportData->emergencyContactPerson,        // emergency_contact_person
                            $employeeImportData->emergencyContactNumber,        // emergency_contact_number
                            $employeeImportData->employmentStartDate,           // employment_start_date
                            $employeeImportData->employmentEndDate,             // employment_end_date
                            $employeeImportData->employmentPosition,            // employment_position
                            $departmentId,                                     // department_id
                            $employeeImportData->paymentMethod,       // payment_method_code
                            $employeeImportData->paymentPeriod,         // payment_period_code
                            $employeeImportData->paymentDay,                    // payment_day
                            $employeeImportData->paymentPeriodEndDay,           // payment_period_end_day
                            true,                                               // send_payslip_by_email
                            $employeeImportData->incomeTaxNumber,               // income_tax_number
                            $employeeImportData->incomeTaxDirective1,           // income_tax_directive_1
                            $employeeImportData->incomeTaxDirective2,           // income_tax_directive_2
                            $employeeImportData->incomeTaxDirective3,           // income_tax_directive_3
                            $employeeImportData->incomeTaxDirective1IssuedDate,   // income_tax_directive_1_issued_date
                            $employeeImportData->incomeTaxDirective1SourceCode, // income_tax_directive_1_source_code
                            $employeeImportData->incomeTaxDirective1Amount,     // income_tax_directive_1_amount
                            $employeeImportData->incomeTaxDirective2IssuedDate,   //  income_tax_directive_2_issued_date
                            $employeeImportData->incomeTaxDirective2SourceCode, // income_tax_directive_2_source_code
                            $employeeImportData->incomeTaxDirective2Amount,     // income_tax_directive_2_amount
                            $employeeImportData->incomeTaxDirective3IssuedDate,   // income_tax_directive_3_issued_date
                            $employeeImportData->incomeTaxDirective3SourceCode, // income_tax_directive_3_source_code
                            $employeeImportData->incomeTaxDirective3Amount,     // income_tax_directive_3_amount
                            $employeeImportData->enablePayeCorrection,    // enable_paye_correction
                            $employeeImportData->sicCode,                       // sic_code
                            $employeeImportData->code,

                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $employeeId = $sqlRow['id'];
                    $bankDetailsId = null;
                    $sqlResult = $db->paramQuery('SELECT id FROM employee_bank_details WHERE employee_id = $1 ;', [$employeeId]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    if( $sqlResult->getRowCount() === 1 ) {
                        $sqlRow = $sqlResult->fetchAssociative();
                        $bankDetailsId = $sqlRow['id'];
                    }
                    if (($bankDetailsId == null) && ($employeeImportData->financialInstitution != '') && ($employeeImportData->bankAccountType != '')) {
                        $sqlQuery = 
                            'INSERT INTO ' . 
                                'employee_bank_details (employee_id, financial_institution_code, bank_account_type_code, ' . 
                                'account_number, branch_code) ' . 
                            'VALUES ' . 
                                '($1, $2, $3, $4, $5);';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $employeeId,        // employee_id
                            $employeeImportData->financialInstitution,           // financial_institution_code
                            $employeeImportData->bankAccountType,               // bank_account_type_code
                            $employeeImportData->accountNumber,             // account_number
                            $employeeImportData->branchCode                 // branch_code
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                    else if (($bankDetailsId !== null) && ($employeeImportData->financialInstitution != '') && ($employeeImportData->bankAccountType != '')) {
                        $updateQuery = 'UPDATE employee_bank_details SET '.
                            'financial_institution_code = $1 ,bank_account_type_code = $2, '.
                            ' account_number = $3, branch_code = $4 '.
                            'WHERE '.
                                ' employee_id = $5 AND id = $6 ';
                        $sqlResult = $db->paramQuery($updateQuery, [
                            $employeeImportData->financialInstitution,
                            $employeeImportData->bankAccountType,
                            $employeeImportData->accountNumber,
                            $employeeImportData->branchCode,
                            $employeeId,
                            $bankDetailsId

                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }

                    }
                    // Set search path to system
                    $sqlResult = $db->paramQuery('SET search_path TO system;', []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to system.']) );
                        return false;
                    }
                    // Update the employee profile with the new information
                    $profileUpdateSqlQuery =
                        'UPDATE employee_profiles SET ' .
                            'alias = COALESCE($1, alias), ' .
                            'id_number = COALESCE($2, id_number), ' .
                            'passport_number = COALESCE($3, passport_number), ' .
                            'email_address = COALESCE($4, email_address) ' .
                        'WHERE ' .
                            'company_id = $5 AND ' . 
                            'employee_id = $6;';
                    $profileUpdateSqlResult = $db->paramQuery($profileUpdateSqlQuery, [
                        $employeeImportData->alias,                                 // alias
                        $employeeImportData->idNumber,                              // id_number
                        $employeeImportData->passportNumber,                        // passport_number
                        $employeeImportData->emailAddress,                          // email_address
                        $_SESSION['userData']['companyId'],     // company_id
                        $employeeId                     // employee_id
                    ]);
                    if( !$profileUpdateSqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }   
                else if (!$employeeImportValidator->doesEmployeeExists()) {
                    $insertQuery = 
                    'INSERT INTO employees ( ' .
                        'code,'.
                        'title_code,'.
                        'initials,'.
                        'full_names,'.
                        'first_name,'.
                        'last_name,'.
                        'alias,'.
                        'id_number,'.
                        'passport_number,'.
                        'passport_country,'.
                        'date_of_birth,'.
                        'is_asylum_seeker,'.
                        'is_refugee,'.
                        'is_retired,'.
                        'physical_address_unit,'.
                        'physical_address_complex,'.
                        'physical_address_street,'.
                        'physical_address_suburb,'.
                        'physical_address_city,'.
                        'physical_address_postal_code,'.
                        'physical_address_country_code,'.
                        'postal_same_as_physical_address,'.
                        'postal_address_line_1,'.
                        'postal_address_line_2,'.
                        'postal_address_line_3,'.
                        'postal_address_code,'.
                        'postal_address_country_code,'.
                        'work_same_as_company_address,'.
                        'work_address_unit,'.
                        'work_address_complex,'.
                        'work_address_street,'.
                        'work_address_suburb,'.
                        'work_address_city,'.
                        'work_address_postal_code,'.
                        'work_address_country_code,'.
                        'home_number,'.
                        'work_number,'.
                        'cell_number,'.
                        'fax_number,'.
                        'email_address,'.
                        'emergency_contact_person,'.
                        'emergency_contact_number,'.
                        'employment_start_date,'.
                        'employment_end_date,'.
                        'employment_position,'.
                        'department_id,'.
                        'payment_method_code,'.
                        'payment_period_code,'.
                        'payment_day,'.
                        'payment_period_end_day,'.
                        'send_payslip_by_email,'.
                        'income_tax_number,'.
                        'enable_paye_correction,'.
                        'income_tax_directive_1,'.
                        'income_tax_directive_2,'.
                        'income_tax_directive_3,'.
                        'income_tax_directive_1_issued_date,'.
                        'income_tax_directive_1_source_code,'.
                        'income_tax_directive_1_amount,'.
                        'income_tax_directive_2_issued_date,'.
                        'income_tax_directive_2_source_code,'.
                        'income_tax_directive_2_amount,'.
                        'income_tax_directive_3_issued_date,'.
                        'income_tax_directive_3_source_code,'.
                        'income_tax_directive_3_amount,'.
                        'sic_code,'.
                        'created_by_user_id, '.
                        'created_on '.
                    ') '.
                    'VALUES ( ' .
                        '$1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9, $10, ' .
                        '$11, $12, $13, $14, $15, $16, $17, $18, $19, $20, ' .
                        '$21, $22, $23, $24, $25, $26, $27, $28, $29, $30, ' .
                        '$31, $32, $33, $34, $35, $36, $37, $38, $39, $40, ' .
                        '$41, $42, $43, $44, $45, $46, $47, $48, $49, $50, ' .
                        '$51, $52, $53, $54, $55, $56, $57, $58, $59, $60, ' .
                        '$61, $62, $63, $64, $65, $66, $67, NOW()) RETURNING id  ';
        
                    $sqlResult = $db->paramQuery($insertQuery, [
                        $employeeImportData->code,                    // code
                        $employeeImportData->titleCode,               // title_code
                        $employeeImportData->initials,              // initials
                        $employeeImportData->fullName,              // full_names
                        '',                                           // first_name
                        $employeeImportData->lastName,                // last_name
                        $employeeImportData->alias,                   // alias
                        $employeeImportData->idNumber,                // id_number
                        $employeeImportData->passportNumber,      // passport_number
                        $employeeImportData->passportCountry,   // passport_country
                        $employeeImportData->dateOfBirth,       // date_of_birth
                        $employeeImportData->isAsylumSeeker,    // is_asylum_seeker
                        $employeeImportData->isRefugee,            // is_refugee
                        $employeeImportData->isRetired,                              // is_retired
                        $employeeImportData->physicalAddressUnit,        // physical_address_unit
                        $employeeImportData->physicalAddressComplex,      // physical_address_complex
                        $employeeImportData->physicalAddressStreet,       // physical_address_street
                        $employeeImportData->physicalAddressSuburb,         // physical_address_suburb
                        $employeeImportData->physicalAddressCity,           // physical_address_city
                        $employeeImportData->physicalAddressPostalCode,     // physical_address_postal_code
                        $employeeImportData->physicalAddressCountry,    // physical_address_country_code
                        $employeeImportData->postalAddressSameAsPhysical,                      // postal_same_as_physical_address
                        $employeeImportData->postalAddressLine1,            // postal_address_line_1
                        $employeeImportData->postalAddressLine2,            // postal_address_line_2
                        $employeeImportData->postalAddressLine3,            // postal_address_line_3
                        $employeeImportData->postalAddressCode,             // postal_address_code
                        $employeeImportData->postalAddressCountry,      // postal_address_country_code
                        $employeeImportData->workAddressSameAsCompanyAddress,                   // work_same_as_company_address
                        $employeeImportData->workAddressUnit,                                   // work_address_unit
                        $employeeImportData->workAddressComplex,                                // work_address_complex
                        $employeeImportData->workAddressStreet,                                 // work_address_street
                        $employeeImportData->workAddressSuburb,                                  // work_address_suburb
                        $employeeImportData->workAddressCity,                                    // work_address_city
                        $employeeImportData->workAddressPostalCode,                              // work_address_postal_code
                        $employeeImportData->workAddressCountry,                             // work_address_country_code
                        $employeeImportData->homeNumber,                     // home_number
                        $employeeImportData->workNumber,                    // work_number
                        $employeeImportData->cellNumber,                    // cell_number
                        $employeeImportData->faxNumber,                     // fax_number
                        $employeeImportData->emailAddress,                  // email_address
                        $employeeImportData->emergencyContactPerson,        // emergency_contact_person
                        $employeeImportData->emergencyContactNumber,        // emergency_contact_number
                        $employeeImportData->employmentStartDate,           // employment_start_date
                        $employeeImportData->employmentEndDate,             // employment_end_date
                        $employeeImportData->employmentPosition,            // employment_position
                        $departmentId,                                     // department_id
                        $employeeImportData->paymentMethod,       // payment_method_code
                        $employeeImportData->paymentPeriod,         // payment_period_code
                        $employeeImportData->paymentDay,                    // payment_day
                        $employeeImportData->paymentPeriodEndDay,           // payment_period_end_day
                        true,                                               // send_payslip_by_email
                        $employeeImportData->incomeTaxNumber,               // income_tax_number
                        $employeeImportData->enablePayeCorrection,    // enable_paye_correction
                        $employeeImportData->incomeTaxDirective1,           // income_tax_directive_1
                        $employeeImportData->incomeTaxDirective2,           // income_tax_directive_2
                        $employeeImportData->incomeTaxDirective3,           // income_tax_directive_3
                        $employeeImportData->incomeTaxDirective1IssuedDate,   // income_tax_directive_1_issued_date
                        $employeeImportData->incomeTaxDirective1SourceCode, // income_tax_directive_1_source_code
                        $employeeImportData->incomeTaxDirective1Amount,     // income_tax_directive_1_amount
                        $employeeImportData->incomeTaxDirective2IssuedDate,   //  income_tax_directive_2_issued_date
                        $employeeImportData->incomeTaxDirective2SourceCode, // income_tax_directive_2_source_code
                        $employeeImportData->incomeTaxDirective2Amount,     // income_tax_directive_2_amount
                        $employeeImportData->incomeTaxDirective3IssuedDate,   // income_tax_directive_3_issued_date
                        $employeeImportData->incomeTaxDirective3SourceCode, // income_tax_directive_3_source_code
                        $employeeImportData->incomeTaxDirective3Amount,     // income_tax_directive_3_amount
                        $employeeImportData->sicCode,                       // sic_code
                        $user['id']
                    ]);

                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();  
                    $employeeId = $sqlRow['id'];
                    // Build the query to insert the item.
                    $sqlQuery =
                        'INSERT INTO ' .
                            'employment_history ( ' .
                            'employee_id, ' .
                            'employed_by_user_id, ' .
                            'employed_on, ' .
                            'employment_position, ' .
                            'employment_date, ' .
                            'dismissed_by_user_id, ' .
                            'dismissed_on, ' .
                            'dismissal_position, ' .
                            'dismissal_date ' .
                        ') ' .
                        'VALUES ( ' .
                            ' $1,  $2,  $3,  $4,  $5,  $6, $7, $8, $9 '.
                        ') ' .
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                            $employeeId,             // employee_id
                            $user['id'],             // employed_by_user_id
                            date("Y-m-d H:i:s"),     // employed_on
                            $employeeImportData->employmentPosition,     // employment_position
                            $employeeImportData->employmentStartDate,    // employment_date
                            null,                    // dismissed_by_user_id
                            null,                    // dismissed_on
                            null,                    // dismissal_position
                            null                     // dismissal_date
                    ]);
            
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }

                    // Add Banking details
                    // Only add an entry if the banking details are not empty.
                    if ($employeeImportData->financialInstitution !== '' && $employeeImportData->bankAccountType !==  '' ) {
                        $sqlQuery = 
                            'INSERT INTO ' . 
                                'employee_bank_details (employee_id, financial_institution_code, bank_account_type_code, ' . 
                                'account_number, branch_code) ' . 
                            'VALUES ' . 
                                '($1, $2, $3, $4, $5);';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                                    $employeeId,                // employee_id
                                    $employeeImportData->financialInstitution,           // financial_institution_code
                                    $employeeImportData->bankAccountType,               // bank_account_type_code
                                    $employeeImportData->accountNumber,             // account_number
                                    $employeeImportData->branchCode                 // branch_code
                        ]);
                    
                        if ( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                    // Set search path to system
                    $sqlResult = $db->paramQuery('SET search_path TO system;', []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Failed to connect to set search path to system.']) );
                        return false;
                    }
            
                    // Add the employee profile to the system database
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
                            $_SESSION['userData']['companyId'],     // company_id
                            $employeeId,                            // employee_id
                            $employeeImportData->alias,                         // alias
                            $employeeImportData->idNumber,                      // id_number
                            $employeeImportData->passportNumber,                // passport_number
                            $employeeImportData->emailAddress                   // email_address
                    ]);
                    if( !$profileInsertSqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Unable to insert employee profile.']) );
                        return false;
                    }
                }
            }
            // Commit SQL transaction
            $db->commitTransaction();

            fclose($handler);
            // Remove the file used for importing spend
            unlink($localFile);
            // Delete the temp folder
            rmdir($destDir);
            unset($employees);
            echo( json_encode(['ok' => true]) );
            return true;
        }

        // Function to export employee import exceptions
        //
        // Required Parameters
        //  exceptions               An array containing the exceptions to export
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  none
        public function exportImportExceptionList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'exceptions' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'isCritical' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                        'column' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'row' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'value' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'expectedValue' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'fullDescription' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "CRITICAL",
                "DESCRIPTION",
                "VALUE",
                "EXPECTED VALUE",
                "ROW",
                "COLUMN",
                // "DETAILS"
            ];
            
            $writer = $this->writeReport($data, 'payroll_import_employees_exception_list_' . date('Y-m-d'), $headers);
            
            // For each exception
            foreach( $data['exceptions'] AS $exception ) {
                $isCritical = 'No';
                if( $exception['isCritical'] ) {
                    $isCritical = 'Yes';
                }
                
                // Add the data
                $content = [
                    $isCritical,
                    $exception['description'],
                    $exception['value'],
                    $exception['expectedValue'],
                    $exception['row'],
                    $exception['column'],
                    // str_replace('<br>', ' ', $exception['fullDescription'])
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content));
            }
            
            $writer->close();
            return true;
        }
        
        // Function to send emailData
        //
        // Required Parameters
        //  employees                   An array describing the employees to receive invites
        // 
        //  employees = [
        //      'id',                   // The id of the employee to send the invite to
        //      'emailAddress'          // The email address to send the invite to
        //  ]
        //
        public function sendSelfServiceInvites($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'employees' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'emailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Use the mailer module
            System::useModule('phpmailer');
            
            // For very invite to send
            foreach( $data['employees'] as $employee ) {
                // Load the employee from the employees table
                $sqlQuery = 
                    'SELECT ' .
                        'employees.alias ' .
                    'FROM ' .
                        'employees ' .
                    'WHERE ' .
                        'employees.id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [$employee['id']]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Check if the employee was found
                if( $sqlResult->getRowCount() !== 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $employee['id'] . '\' not found.']) );
                    return false;
                }
                
                // Create employee details
                $sqlRow = $sqlResult->fetchAssociative();
                
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
                $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/self_service_invite.html' );
                $mailText = str_replace('$EMPLOYEE_ALIAS', $sqlRow['alias'], $mailText);
                $mailText = str_replace('$COMPANY_NAME', $user['companyAlias'], $mailText);
                $mailText = str_replace('$EMPLOYEE_PORTAL_LINK', CONF_EMPLOYEE_ROOT_URL, $mailText);
                
                // Set the email details
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = 'Payaccsys Payroll: Self-Service Invitation';
                $mail->Body = $mailText;
                
                // Set the email address and send the email immediately
                $mail->addAddress($employee['emailAddress'], '');
                $mail->send();
                
                // Clear the recipients
                $mail->clearAddresses();
                
                // // Reset the email details
                // $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Lexpro Payroll');
                // $mail->isHTML(true);    // Set email format to HTML
                // $mail->Subject = 'Lexpro Payroll: Self-Service Invitation';
                // $mail->Body = $mailText;
            }
            
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
            $fileName = $reportName .'_'. date('Ymd') . '.'.$formatType;
            
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
