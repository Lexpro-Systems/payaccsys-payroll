<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    System::useModule('tcpdf');
    
    // Includes
    System::includeFile('Util.php');
    // System::includeFile('LeaveUtil.php');
    // System::includeFile('NumberMask.php');
    
    
    //
    // EMPLOYEE CONTROLLER CLASS
    //
    
    class Attendance extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get a specified attendance
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  attendanceId                The id of the attendance to get
        //  isEmployee                  Bool value if the owner of the attendance is an employee or not
        // 
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'attendanceId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false],
                'isEmployee' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            if ($data['isEmployee']) {
                $sqlQuery =
                    'SELECT ' . 
                        'time_in, ' .
                        'time_out, ' .
                        'alias AS name, ' .
                        'email_address, ' .
                        'cell_number, ' .
                        'age(time_out, time_in) AS time, ' .
                        'temperature, ' .
                        'note ' .
                    'FROM ' .
                        'employee_attendance ' .
                    'LEFT JOIN ' .
                        'employees ON employee_id = employees.id ' .
                    'WHERE ' .
                        'employee_attendance.id = $1 ';
            }
            else {
                $sqlQuery =
                    'SELECT ' . 
                        'time_in, ' .
                        'time_out, ' .
                        'reason_for_visit, ' .
                        'name, ' .
                        'email_address, ' .
                        'cell_number, ' .
                        'age(time_out, time_in) AS time, ' .
                        'vehicle_registration, ' .
                        'id_number, ' .
                        'temperature, ' .
                        'note ' .
                    'FROM ' .
                        'visitor_attendance ' .
                    'LEFT JOIN ' .
                        'visitors ON visitor_id = visitors.id ' .
                    'WHERE visitor_attendance.id = $1 ';
            }
            
            $sqlResult = $db->paramQuery($sqlQuery, [$data['attendanceId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $person = [];
            $sqlRow = $sqlResult->fetchAssociative();
            
            $reasonForVisit = '';
            if (!$data['isEmployee']) {
                $reasonForVisit = $sqlRow['reason_for_visit'];
            }
            
            $vehicleRegistration = '';
            if (!$data['isEmployee']) {
                $vehicleRegistration = $sqlRow['vehicle_registration'];
            }
            
            $idNumber = '';
            if (!$data['isEmployee']) {
                $idNumber = $sqlRow['id_number'];
            }
            
            $time = '';
            if( $sqlRow['time'] !== null ) {
                $time = substr($sqlRow['time'], 0, -3);
            }
            
            $attendance = [
                'name' => $sqlRow['name'],
                'timeIn' => $sqlRow['time_in'],
                'timeOut' => $sqlRow['time_out'],
                'reasonForVisit' => $reasonForVisit,
                'emailAddress' => $sqlRow['email_address'],
                'cellNumber' => $sqlRow['cell_number'],
                'registration' => $vehicleRegistration,
                'idNumber' => $idNumber,
                'temperature' => $sqlRow['temperature'],
                'note' => $sqlRow['note'],
                'time' => $time
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'attendance' => $attendance
            ]) );
            
            return true;
        }
        
        // Function to update attendance
        //
        // Required Parameters
        //  attendanceId            The id of the attendance to update
        //  isEmployee              Whether the attendance is for an employee (true) or vistor (false)
        //  signInDate              The sign in date (CCYY-MM-DD)
        //  signInTime              The sign in date (HH:MM)
        //  signOutDate             The sign out date (CCYY-MM-DD)
        //  signOutTime             The sign out date (HH:MM)
        //  reasonForVisit          The reason for visit (only applicable to vistors)
        //  temperature             The temperature of the employee / visitor
        //  note                    An attendance note
        //
        // Optional Parameters
        //  None
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'attendanceId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'isEmployee' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'signInDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signInTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                'signOutDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signOutTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                'reasonForVisit' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'temperature' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Check the sign-in time
            if(strlen(substr($data['signInTime'], strpos($data['signInTime'], ':') + 1)) !== 2){
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            else if((int)(substr($data['signInTime'], 0, strpos($data['signInTime'], ':'))) >= 24) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            else if((int)(substr($data['signInTime'], strpos($data['signInTime'], ':') * -1 )) >= 60 ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            $signInTimeStamp = date($data['signInDate'] . ' ' . $data['signInTime']);
            
            // Check the sign-out time
            if(strlen(substr($data['signOutTime'], strpos($data['signOutTime'], ':') + 1)) !== 2){
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            else if((int)(substr($data['signOutTime'], 0, strpos($data['signOutTime'], ':'))) >= 24) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            else if((int)(substr($data['signOutTime'], strpos($data['signOutTime'], ':') * -1 )) >= 60 ) {
                echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                return false;
            }
            $signOutTimeStamp = date($data['signOutDate'] . ' ' . $data['signOutTime']);
            
            // Verify that the sign-in date is not after the sign-out date
            if( $data['signInDate'] > $data['signOutDate'] ) {
                echo( json_encode(['ok' => false, 'error' => 'The sign-in date cannot be after the sign-out date.']) );
                return false;
            }
            
            // Is the sign-in and sign-out on the same day
            if( $data['signOutDate'] == $data['signInDate'] ) {
                // Verify that the sign-in date is not later than the sign-out date
                if( $data['signInTime'] > $data['signOutTime'] ) {
                    echo( json_encode(['ok' => false, 'error' => 'The sign-in time cannot be later than the sign-out time.']) );
                    return false;
                }
            }
            
            // Is the sign-in date in the future?
            if( $signInTimeStamp > date("Y-m-d H:i:s") ) {
                echo( json_encode(['ok' => false, 'error' => 'The sign-in date cannot be in the future.']) );
                return false;
            }
            
            // Is the sign-out date in the future?
            if( $signOutTimeStamp > date("Y-m-d H:i:s") ) {
                echo( json_encode(['ok' => false, 'error' => 'The sign-out date cannot be in the future.']) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE visitor_attendance SET ';
            
            // Is it an employee
            if( $data['isEmployee'] ) {
                $updateQuery = 'UPDATE employee_attendance SET ';
            }
            
            if( $signInTimeStamp !== null ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'time_in = $' . $updateCount;
                $updateValues[] = $signInTimeStamp;
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'in_logged_by_user_id = $' . $updateCount;
                $updateValues[] = $user['id'];
            }
            
            if( $signOutTimeStamp !== null ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'time_out = $' . $updateCount;
                $updateValues[] = $signOutTimeStamp;
                
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'out_logged_by_user_id = $' . $updateCount;
                $updateValues[] = $user['id'];
            }
            
            if( isset($data['reasonForVisit']) && !$data['isEmployee'] ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'reason_for_visit = $' . $updateCount;
                $updateValues[] = $data['reasonForVisit'];
            }
            
            if( isset($data['temperature']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'temperature = $' . $updateCount;
                $updateValues[] = $data['temperature'];
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
            $updateValues[] = $data['attendanceId'];
            $updateResult = $db->paramQuery($updateQuery, $updateValues);
            if( !$updateResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to mark attendance as deleted
        //
        // Required Parameters
        //  id                          The id of the attendance item to remove
        //  isEmployee                  Whether the item is for an employee or not (true/false)
        //
        // Optional Parameters
        //  None
        // 
        public function removeAttendance($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false],
                'isEmployee' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            if ($data['isEmployee']) {
                $sqlQuery =
                    'UPDATE employee_attendance SET is_deleted = TRUE WHERE id = $1';
            }
            else {
                $sqlQuery =
                    'UPDATE visitor_attendance SET is_deleted = TRUE WHERE id = $1';
            }
            
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to get details about the specified visitor
        //
        // Required Parameters
        //  visitorId                   The id of the visitor whose details to get
        //
        // Optional Parameters
        //  None
        // 
        public function getVisitor($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'visitorId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the employee from the employees table
            $sqlQuery = 
                'SELECT  ' .
                    'visitors.id, ' .
                    'visitors.name, ' .
                    'visitors.email_address, ' .
                    'visitors.cell_number, ' .
                    'visitors.vehicle_registration, ' .
                    'visitors.id_number, ' .
                    'visitors.is_regular ' .
                'FROM  ' .
                    'visitors  ' .
                'WHERE id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['visitorId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $visitor = [];
            $sqlRow = $sqlResult->fetchAssociative();
            
            $visitor = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'emailAddress' => $sqlRow['email_address'],
                'cellNumber' => $sqlRow['cell_number'],
                'vehicleRegistration' => $sqlRow['vehicle_registration'],
                'idNumber' => $sqlRow['id_number'],
                'isRegular' => $sqlRow['is_regular']
            ];
            
            echo( json_encode([
                'ok' => true,
                'visitor' => $visitor
            ]) );
            
            return true;
        }
        
        // Function to update a visitor's details
        //
        public function updateVisitorDetails($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'name' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'registration' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'idNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'isRegular' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            
            $sqlQuery = 
                'UPDATE visitors ' .
                'SET ' .
                    'name = $1, ' .
                    'email_address = $2, ' .
                    'cell_number = $3, ' .
                    'vehicle_registration = $4, ' .
                    'id_number = $5, ' .
                    'is_regular = $6 ' .
                'WHERE id = $7';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['name'],
                $data['emailAddress'],
                $data['cellNumber'],
                $data['registration'],
                $data['idNumber'],
                $data['isRegular'],
                $data['id']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to get a specified person
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  id                          A string value that is used to filter the result 
        //  isEmployee                  The maximum number of rows to return
        // 
        public function getPerson($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'id' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false],
                'isEmployee' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            if ($data['isEmployee']) {
                $sqlQuery =
                    'SELECT ' .
                        'employees.id, ' . 
                        'employees.alias, ' .
                        'employee_attendance.employee_id, ' .
                        'time_in, ' .
                        'time_out, ' .
                        'time_in::date AS time_in_date ' .
                    'FROM ' .
                        'employees ' .
                    'LEFT JOIN ' .
                        'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                    'WHERE ' .
                        'employee_attendance.is_deleted = FALSE AND ' .
                        'employees.id = $1 ' .
                    'ORDER BY ' .
                        'time_in DESC, time_in_logged_at DESC ' .
                    'LIMIT 1';
            }
            else {
                $sqlQuery =
                    'SELECT ' .
                        'visitors.id, ' . 
                        'visitors.name AS alias, ' . 
                        'visitors.email_address, ' . 
                        'visitors.cell_number, ' .
                        'visitors.vehicle_registration, ' . 
                        'visitors.id_number, ' . 
                        'visitors.is_regular, ' .
                        'visitor_attendance.visitor_id, ' .
                        'time_in, ' .
                        'time_out, ' .
                        'time_in::date AS time_in_date ' .
                    'FROM ' .
                        'visitors ' .
                    'LEFT JOIN ' .
                        'visitor_attendance ON visitor_attendance.visitor_id = visitors.id ' .
                    'WHERE ' .
                        'visitor_attendance.is_deleted = FALSE AND ' .
                        'visitors.id = $1 ' .
                    'ORDER BY ' .
                        'time_in DESC, time_in_logged_at DESC ' .
                    'LIMIT 1';
            }
            $sqlResult = $db->paramQuery($sqlQuery, [$data['id']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $person = [];
            $sqlRow = $sqlResult->fetchAssociative();
            
            $timeInDate = null;
            $timeOutDate = null;
            
            $timeIn = null;
            if ($sqlRow['time_in'] !== null) {
                $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                $timeInDate = date("Y-m-d", strtotime($sqlRow['time_in']));
            }
            
            $timeOut = null;
            if ($sqlRow['time_out'] !== null) {
                $timeOut = date("H:i", strtotime($sqlRow['time_out']));
                $timeOutDate = date("Y-m-d", strtotime($sqlRow['time_out']));
            }
            
            $alias = $sqlRow['alias'];
            $emailAddress = '';
            $cellNumber = '';
            $vehicleRegistration = '';
            $idNumber = '';
            $isRegular = false;
            if (!$data['isEmployee']) {
                $alias = $sqlRow['alias'];
                $emailAddress = $sqlRow['email_address'];
                $cellNumber = $sqlRow['cell_number'];
                $vehicleRegistration = $sqlRow['vehicle_registration'];
                $idNumber = $sqlRow['id_number'];
                $isRegular = $sqlRow['is_regular'];
            }
            
            $person = [
                'id' => $sqlRow['id'],
                'alias' => $alias,
                'emailAddress' => $emailAddress,
                'cellNumber' => $cellNumber,
                'vehicleRegistration' => $vehicleRegistration,
                'idNumber' => $idNumber,
                'isRegular' => $isRegular,
                'timeIn' => $timeIn,
                'timeOut' => $timeOut,
                'timeInDate' => $timeInDate,
                'timeOutDate' => $timeOutDate
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'person' => $person
            ]) );
            
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
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getVisitorAttendance($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentName' => '',
                'employeeStatus' => ''
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
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = 
                    ' WHERE (' . 
                    'visitors.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ' OR visitors.id_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.vehicle_registration ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            if ($whereClause === '') {
                $whereClause = 'WHERE (time_in = max_time_in OR time_in IS NULL) AND (time_in::Date = NOW()::Date OR (time_in IS NOT NULL AND time_out IS NULL)) ';
            }
            else {
                $whereClause = $whereClause . ' AND (time_in = max_time_in OR time_in IS NULL) AND (time_in::Date = NOW()::Date OR (time_in IS NOT NULL AND time_out IS NULL)) ';
            }
            
            // Load all employees from the employees table
            $sqlQuery =
                'WITH max_in_times AS ( '.
                    'SELECT visitor_id, MAX(time_in) AS max_time_in FROM visitor_attendance GROUP BY visitor_id ' .
                ') ' .
                'SELECT ' .
                    'visitors.id, visitors.name AS alias, visitor_attendance.id AS visitor_attendances_id, ' .
                    'visitor_attendance.visitor_id, time_in, time_out, time_in::date AS time_in_date ' .
                'FROM ' .
                    'visitors ' .
                'LEFT JOIN ' .
                    'visitor_attendance ON visitor_attendance.visitor_id = visitors.id ' .
                'LEFT JOIN ' .
                    'max_in_times ON visitors.id = max_in_times.visitor_id ' .
                $whereClause . ' ' .
                ' ORDER BY ' .
                'visitors.name ' . $data['sortOrder'] . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $visitors = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $timeInDate = null;
                $timeOutDate = null;
                
                $timeIn = null;
                if ($sqlRow['time_in'] !== null) {
                    $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                    $timeInDate = date("Y-m-d", strtotime($sqlRow['time_in']));
                }
                
                $timeOut = null;
                if ($sqlRow['time_out'] !== null) {
                    $timeOut = date("H:i", strtotime($sqlRow['time_out']));
                    $timeOutDate = date("Y-m-d", strtotime($sqlRow['time_out']));
                }
                
                // Make certain a new day starts without the time of the previous day, 
                // but only if the person signed out
                if(($timeOut !== null) && (date("Y-m-d") !== $sqlRow['time_in_date'])) {
                    $timeIn = null;
                    $timeOut = null;
                    $timeInDate = null;
                    $timeOutDate = null;
                }
                
                $visitors[] = [
                    'id' => $sqlRow['id'],
                    'alias' => $sqlRow['alias'],
                    'timeIn' => $timeIn,
                    'timeOut' => $timeOut,
                    'timeInDate' => $timeInDate,
                    'timeOutDate' => $timeOutDate
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'visitors' => $visitors
            ]) );
            
            return true;
        }
        
        // Function to update or create an visitor attendance index
        //
        // Required Parameters
        //  visitor              The id of the visitor whose details to update
        //
        // Optional Parameters
        //  None
        public function updateVisitorAttendance($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'visitorId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'reasonForVisit' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'temperature' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'signInDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signInTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                'signOutDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signOutTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            if ($data['signInTime'] !== null) {
                $signInTimeStamp = date($data['signInDate'] . ' ' . $data['signInTime']);
                
                if(strlen(substr($data['signInTime'], strpos($data['signInTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signInTime'], 0, strpos($data['signInTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signInTime'], strpos($data['signInTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
            }
            
            $signOutTimeStamp = null;
            if ($data['signOutTime'] !== null) {
                $signOutTimeStamp = date($data['signOutDate'] . ' ' . $data['signOutTime']);
                
                if(strlen(substr($data['signOutTime'], strpos($data['signOutTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signOutTime'], 0, strpos($data['signOutTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signOutTime'], strpos($data['signOutTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
            }
            
            // Load the visitor details
            $sqlQuery = 
                'SELECT  ' .
                    'visitor_attendance.id, visitors.name, time_in, time_out ' .
                'FROM  ' .
                    'visitor_attendance  ' .
                'LEFT JOIN ' .
                    'visitors ON visitors.id = visitor_attendance.visitor_id ' .
                'WHERE ' .
                    'visitor_attendance.is_deleted = FALSE AND ' .
                    'visitor_id = $1 ' .
                'ORDER BY time_in_logged_at DESC LIMIT 1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['visitorId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $alias = '';
            $timeIn = null;
            $timeOut = null;
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $attendanceId = $sqlRow['id'];
                $alias = $sqlRow['name'];
                
                if ($sqlRow['time_in'] !== null) {
                    $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                }
                
                if ($sqlRow['time_out'] !== null) {
                    $timeOut = date("H:i", strtotime($sqlRow['time_out']));
                }
            }
            
            if( $timeIn === null || $timeOut !== null) {
                $sqlQuery = 
                    'INSERT INTO visitor_attendance (' .
                        'visitor_id, ' .
                        'time_in, ' .
                        'in_logged_by_user_id, ' .
                        'time_out, ' .
                        'out_logged_by_user_id, ' .
                        'reason_for_visit, ' .
                        'temperature, ' .
                        'note, ' .
                        'time_in_logged_at, ' .
                        'time_out_logged_at, ' .
                        'is_deleted ' .
                    ') ' .
                    'VALUES ( ' .
                        '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                    ') RETURNING time_in; ';
                $sqlResult = $db->paramQuery($sqlQuery, [
                        $data['visitorId'],
                        $signInTimeStamp,
                        $user['id'],
                        null,
                        null,
                        $data['reasonForVisit'],
                        $data['temperature'],
                        $data['note'],
                        date("Y-m-d H:i:s"),
                        null,
                        false
                    ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                $timeOut = null;
            }
            else if ($timeOut === null) {
                $sqlQuery = 
                    'UPDATE ' .
                        'visitor_attendance ' .
                    'SET ' .
                        'time_out = $1, ' .
                        'out_logged_by_user_id = $2, ' .
                        'time_out_logged_at = $3 ' .
                    'WHERE ' .
                        'id = $4 ' .
                    'RETURNING time_out';
                $sqlResult = $db->paramQuery($sqlQuery, [
                        $signOutTimeStamp,
                        $user['id'],
                        date("Y-m-d H:i:s"),
                        $attendanceId
                    ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                $timeOut = ($sqlRow['time_out'] !== null ? date("H:i", strtotime($sqlRow['time_out'])) : null);
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'alias' => $alias,
                'timeIn' => $timeIn,
                'timeOut' => $timeOut
            ]) );
            
            return true;
        }
        
        // Function to add visitors
        //
        public function addVisitor($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'name' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'cellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'registration' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'idNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'regular' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            $sqlQuery = 
                'INSERT INTO visitors (name, email_address, cell_number, vehicle_registration, id_number, is_regular) ' .
                'VALUES ( ' .
                    '$1, $2, $3, $4, $5, $6 ' .
                ') RETURNING id; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['name'],
                    $data['emailAddress'],
                    $data['cellNumber'],
                    $data['registration'],
                    $data['idNumber'],
                    $data['regular']
                ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $visitorId = $sqlRow['id'];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'visitorId' => $visitorId
            ]) );
            
            return true;
        }
        
        // Function to get visitors list
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getVisitorsList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentName' => '',
                'employeeStatus' => ''
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
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = 
                    ' WHERE (' . 
                    'visitors.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ' OR visitors.id_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.vehicle_registration ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            if ($whereClause === '') {
                $whereClause = 'WHERE is_regular IS TRUE ';
            }
            else {
                $whereClause = $whereClause . ' AND is_regular IS TRUE';
            }
            
            // Load all visitor from the visitor table
            $sqlQuery =
                'SELECT ' .
                    'id, is_regular, name, email_address, cell_number, vehicle_registration, id_number ' .
                'FROM ' .
                    'visitors ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'name ' . $data['sortOrder'] . ' ' . $limitOffset;
            
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create visitor array
            $visitor = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $visitor[] = [
                    'id' => $sqlRow['id'],
                    'isRegular' => $sqlRow['is_regular'],
                    'name' => $sqlRow['name'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'vehicleRegistration' => $sqlRow['vehicle_registration'],
                    'idNumber' => $sqlRow['vehicle_registration']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'visitor' => $visitor
            ]) );
            
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
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'DESC',
                'sortList' => null,
                'startDate' => null,
                'endDate' => null,
                'type' => null,
                'departmentId' => null,
                'employeeId' => null
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
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
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
                    ' WHERE (  ' . 
                        '(united_attendance.alias ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') OR ' .
                        '(united_attendance.temperature ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') OR ' .
                        '(united_attendance.note ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') ' .
                    ') ';
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
                        case 'alias':
                            $column = 'alias';
                            break;
                        case 'emailAddress':
                            $column = 'email_address';
                            break;
                        case 'cellNumber':
                            $column = 'cell_number';
                            break;
                        case 'timeIn':
                            $column = 'time_in';
                            break;
                        case 'timeOut':
                            $column = 'time_out';
                            break;
                        case 'time':
                            $column = 'time';
                            break;
                        case 'temperature':
                            $column = 'temperature';
                            break;
                        case 'note':
                            $column = 'note';
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
            
            // Add a filter for the department, if any
            if( isset($data['departmentId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['departmentId'];
                $whereClause = $whereClause . ' united_attendance.department_id = $' . count($sqlParams) . ' ';
            }
            
            // Add a filter for the employee, if any
            if( isset($data['employeeId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['employeeId'];
                $whereClause = $whereClause . ' united_attendance.id = $' . count($sqlParams) . ' ';
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
            
            // Add filters for start and end date, if any
            if( ($data['startDate'] !== null) || ($data['endDate'] !== null) ) {
                // Is there already a where clause?
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . ' AND ';
                }
                
                // Depending on which dates were given
                if( $data['endDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date >= \'' . $data['startDate'] . ' 00:00:00\') OR (time_out::Date >= \'' . $data['startDate'] . ' 00:00:00\'))';
                }
                else if( $data['startDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date <= \'' . $data['endDate'] . ' 23:59:59\') OR (time_out::Date <= \'' . $data['endDate'] . ' 00:00:00\')';
                }
                else {
                    $whereClause = $whereClause . 
                        '(' .
                            '(time_in::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_in::Date <=  \''. $data['endDate'] . ' 23:59:59\') OR ' .
                            '(time_out::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_out::Date <=  \''. $data['endDate'] . ' 23:59:59\')' .
                        ')';
                }
            }
            
            // Add a filter for the attendee type
            if( isset($data['type']) && $data['type'] !== null ) {
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                
                if( $data['type'] === 'VISI' ) {
                    $whereClause = $whereClause . 'is_employee = false ';
                }
                else if( $data['type'] === 'EMPL' ) {
                    $whereClause = $whereClause . 'is_employee = true ';
                }
            }
            
            // Get the attendance history
            $sqlQuery =
                'WITH united_attendance AS ( ' .
                    'SELECT  ' .
                        'visitor_attendance.id AS attendance_id, ' . 
                        'visitors.id, ' . 
                        'name AS alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, ' . 
                        'false AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'NULL as department_id, ' .
                        'temperature, ' .
                        'visitor_attendance.note ' .
                    'FROM ' . 
                        'visitors ' .
                    'LEFT JOIN ' .
                        'visitor_attendance ON visitor_attendance.visitor_id = visitors.id ' .
                    'WHERE ' . 
                        'visitor_attendance.is_deleted = FALSE ' .
                'UNION ALL ' .
                    'SELECT  ' .
                        'employee_attendance.id AS attendance_id, ' . 
                        'employees.id, ' . 
                        'alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, ' . 
                        'true AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'department_id, ' .
                        'temperature, ' .
                        'employee_attendance.note ' .
                    'FROM ' . 
                        'employees ' .
                    'LEFT JOIN  ' .
                        'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                    'WHERE ' . 
                        'employee_attendance.is_deleted = FALSE AND ( ' .
                            '(employment_end_date IS NULL OR employment_end_date > NOW()::Date) ' .
                        ') ' .
                ') ' .
                'SELECT  ' .
                    'attendance_id, ' . 
                    'id, ' . 
                    'alias, ' . 
                    'time_in, ' . 
                    'time_out, ' . 
                    'time, ' . 
                    'is_employee, ' . 
                    'email_address, ' . 
                    'cell_number, ' . 
                    'department_id, ' . 
                    'temperature, ' . 
                    'note ' . 
                'FROM ' . 
                    'united_attendance ' .
                $whereClause . ' ' .
                $sortClause . ' ' .
                $limitOffset;
            
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $persons = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $time = '';
                if( $sqlRow['time'] !== null ) {
                    $time = substr($sqlRow['time'], 0, -3);
                }
                
                $persons[] = [
                    'id' => $sqlRow['id'],
                    'attendanceId' => $sqlRow['attendance_id'],
                    'alias' => $sqlRow['alias'],
                    'time' => $time,
                    'timeIn' => $sqlRow['time_in'],
                    'timeOut' => $sqlRow['time_out'],
                    'isEmployee' => $sqlRow['is_employee'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'temperature' => $sqlRow['temperature'],
                    'note' => $sqlRow['note']
                ];
            }
            
            // Send result
            echo( json_encode([ 'ok' => true, 'persons' => $persons ]) );
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
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getAttendance($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'departmentId' => null,
                'employeeStatus' => '',
                'tagsId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'tagsId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // GET EMPLOYEE ATTENDANCE
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
                    ' OR employees.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            // Add a filter for the department, if any
            if( isset($data['departmentId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['departmentId'];
                $whereClause = $whereClause . ' employees.department_id = $' . count($sqlParams) . ' ';
            }

            // Add a filter for the tags, if any
            if( isset($data['tagsId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['tagsId'];
                $whereClause = $whereClause . ' tag_employees.tags_id = $' . count($sqlParams) . ' ';
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
            
            if ($whereClause === '') {
                $whereClause = 'WHERE (employment_end_date IS NULL OR employment_end_date > CAST(NOW() AS Date)) ';
            }
            else {
                $whereClause = $whereClause . ' AND (employment_end_date IS NULL OR employment_end_date > CAST(NOW() AS Date)) ';
            }
            
            // Load all employees from the employees table
            $sqlQuery =
                'WITH attendances AS ( ' .
                    'SELECT DISTINCT ON (employee_id) ' .
                        'employee_attendance.id AS employee_attendances_id, ' .
                        'employee_attendance.employee_id, ' .
                        'employee_attendance.time_in, ' .
                        'employee_attendance.time_out, ' .
                        'employee_attendance.time_in::date AS time_in_date ' .
                    'FROM ' .
                        'employee_attendance ' .
                    'WHERE ' .
                        // 'employee_attendance.is_deleted = FALSE AND ( ' .
                        //     '(time_in::Date = NOW()::Date) OR (time_in IS NOT NULL AND time_out IS NULL) ' .
                        // ') ' .
                        'employee_attendance.is_deleted = FALSE AND ( ' .
                            '(time_in::Date = NOW()::Date) OR (time_out::Date = NOW()::Date) OR (time_in IS NOT NULL AND time_out IS NULL) ' .
                        ') ' .
                    'ORDER BY ' .
                        'employee_id ASC, COALESCE(time_out, TO_TIMESTAMP(\'2099-12-31 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')) DESC ' .
                        // 'employee_id ASC, time_in DESC ' .
                ') ' .
                'SELECT ' .
                    'employees.id, ' .
                    'employees.alias, ' .
                    'employees.code, ' .
                    'attendances.employee_attendances_id, ' .
                    'attendances.time_in, ' .
                    'attendances.time_out, ' .
                    'attendances.time_in_date, ' .
                    'tag_employees.employee_id, ' .
                    'tag_employees.tags_id ' .
                'FROM ' .
                    'employees ' .
                'LEFT JOIN ' .
                    'attendances ON attendances.employee_id = employees.id ' .
                'LEFT JOIN ' .
                    'tag_employees ON employees.id = tag_employees.employee_id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'employees.alias ' . $data['sortOrder'] . ' ' .
                $limitOffset;
           
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $employees = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $timeInDate = null;
                $timeOutDate = null;
                
                $timeIn = null;
                if ($sqlRow['time_in'] !== null) {
                    $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                    $timeInDate = date("Y-m-d", strtotime($sqlRow['time_in']));
                }
                
                $timeOut = null;
                if ($sqlRow['time_out'] !== null) {
                    $timeOut = date("H:i", strtotime($sqlRow['time_out']));
                    $timeOutDate = date("Y-m-d", strtotime($sqlRow['time_out']));
                }
                
                $employeeAttendancesId = $sqlRow['employee_attendances_id'];

                $employeeTagsId = $sqlRow['id'];
                
                // Make certain a new day starts without the time of the previous day, 
                // but only if the person signed out
                if(($timeOut !== null) && (date("Y-m-d") !== $timeOutDate) && (date("Y-m-d") !== $sqlRow['time_in_date'])) {
                    $employeeAttendancesId = null;
                    $employeeTagsId = null;
                    $timeIn = null;
                    $timeOut = null;
                    $timeInDate = null;
                    $timeOutDate = null;
                }
                
                $employees[] = [
                    'id' => $sqlRow['id'],
                    'employeeAttendancesId' => $employeeAttendancesId,
                    'employeeTagsId' => $employeeTagsId,
                    'code' => $sqlRow['code'],
                    'alias' => $sqlRow['alias'],
                    'timeIn' => $timeIn,
                    'timeOut' => $timeOut,
                    'timeInDate' => $timeInDate,
                    'timeOutDate' => $timeOutDate
                ];
            }
            
            
            //
            // GET VISITOR ATTENDANCE
            //

            // Was a department filter specified?
            if( isset($data['departmentId']) ) {
                // Return only employees
                $attendance = [];
                $attendance = [
                    'employees' => $employees,
                    'visitors' => []
                ];
                
                // Send result
                echo( json_encode(['ok' => true, 'attendance' => $attendance]) );
                return true;
            }

            // Was a department filter specified?
            if( isset($data['tagsId']) ) {
                // Return only employees
                $attendance = [];
                $attendance = [
                    'employees' => $employees,
                    'visitors' => []
                ];
                
                // Send result
                echo( json_encode(['ok' => true, 'attendance' => $attendance]) );
                return true;
            }
            
            // Build where clause if a search string was given
            $sqlParams = [];
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = 
                    ' WHERE (' . 
                    'visitors.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                    ' OR visitors.id_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.vehicle_registration ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.email_address ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                    ' OR visitors.cell_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            if ($whereClause === '') {
                $whereClause = 'WHERE ((attendances.time_in IS NOT NULL) AND (attendances.time_out IS NULL)) ';
            }
            else {
                $whereClause = $whereClause . ' AND ((attendances.time_in IS NOT NULL) AND (attendances.time_out IS NULL)) ';
            }
            
            // Load all visitors that have signed in, but not yet signed out
            $sqlQuery =
                'WITH attendances AS ( ' .
                    'SELECT DISTINCT ON (visitor_id) ' .
                        'visitor_attendance.id AS visitor_attendances_id, ' .
                        'visitor_attendance.visitor_id, ' .
                        'visitor_attendance.time_in, ' .
                        'visitor_attendance.time_out, ' .
                        'visitor_attendance.time_in::date AS time_in_date ' .
                    'FROM ' .
                        'visitor_attendance ' .
                    'WHERE ' .
                        // 'visitor_attendance.is_deleted = FALSE AND ( ' .
                        //     '(time_in::Date = NOW()::Date) OR (time_in IS NOT NULL AND time_out IS NULL) ' .
                        // ') ' .
                        'visitor_attendance.is_deleted = FALSE AND ( ' .
                            '(time_in::Date = NOW()::Date) OR (time_out::Date = NOW()::Date) OR (time_in IS NOT NULL AND time_out IS NULL) ' .
                        ') ' .
                    'ORDER BY ' .
                        'visitor_id ASC, COALESCE(time_out, TO_TIMESTAMP(\'2099-12-31 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')) DESC ' .
                        // 'visitor_id ASC, time_in DESC ' .
                ') ' .
                'SELECT ' .
                    'visitors.id, visitors.name AS alias, visitors.is_regular, attendances.visitor_attendances_id, ' .
                    'attendances.visitor_id, attendances.time_in, attendances.time_out, attendances.time_in_date ' .
                'FROM ' .
                    'visitors ' .
                'LEFT JOIN ' .
                    'attendances ON attendances.visitor_id = visitors.id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'visitors.name ' . $data['sortOrder'] . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create vistors array
            $visitors = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $timeInDate = null;
                $timeOutDate = null;
                
                $timeIn = null;
                if ($sqlRow['time_in'] !== null) {
                    $timeIn = date("H:i", strtotime($sqlRow['time_in']));
                    $timeInDate = date("Y-m-d", strtotime($sqlRow['time_in']));
                }
                
                $timeOut = null;
                if ($sqlRow['time_out'] !== null) {
                    $timeOut = date("H:i", strtotime($sqlRow['time_out']));
                    $timeOutDate = date("Y-m-d", strtotime($sqlRow['time_out']));
                }
                
                // Make certain a new day starts without the time of the previous day, 
                // but only if the person signed out
                if(($timeOut !== null) && (date("Y-m-d") !== $timeOutDate) && (date("Y-m-d") !== $sqlRow['time_in_date'])) {
                    $timeIn = null;
                    $timeOut = null;
                    $timeInDate = null;
                    $timeOutDate = null;
                }
                
                $visitors[] = [
                    'id' => $sqlRow['id'],
                    'alias' => $sqlRow['alias'],
                    'timeIn' => $timeIn,
                    'timeOut' => $timeOut,
                    'timeInDate' => $timeInDate,
                    'timeOutDate' => $timeOutDate
                ];
            }
            
            // Combine the attendance results
            $attendance = [];
            $attendance = [
                'employees' => $employees,
                'visitors' => $visitors
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'attendance' => $attendance]) );
            return true;
        }
        
        // Function to update the attendance of the specified employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose attencance to update
        //  temperature             The employee's temperature
        //  note                   Notes regarding the employee's attendance
        //
        // Optional Parameters
        //  None
        public function signOutEmployee($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'temperature' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'signOutDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signOutTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $signOutTimeStamp = null;
            if ($data['signOutTime'] !== null) {
                $signOutTimeStamp = date($data['signOutDate'] . ' ' . $data['signOutTime']);
                
                if(strlen(substr($data['signOutTime'], strpos($data['signOutTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signOutTime'], 0, strpos($data['signOutTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signOutTime'], strpos($data['signOutTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
            }
            
            // Load the employee from the employees table
            $sqlQuery = 
                'SELECT  ' .
                    'id, time_in, time_out ' .
                'FROM  ' .
                    'employee_attendance  ' .
                'WHERE ' .
                    'employee_attendance.is_deleted = FALSE AND ' .
                    'employee_id = $1 ' .
                'ORDER BY time_in_logged_at DESC LIMIT 1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $attendanceId = $sqlRow['id'];
            $timeIn = date("H:i", strtotime($sqlRow['time_in']));
            
            if ($sqlRow['time_out'] !== null) {
                echo( json_encode(['ok' => false, 'error' => 'This employee was already signed out.']) );
                return false;
            }
            
            $sqlQuery = 
                'UPDATE ' .
                    'employee_attendance ' .
                'SET ' .
                    'time_out = $1, ' .
                    'out_logged_by_user_id = $2, ' .
                    'time_out_logged_at = $3 ' .
                'WHERE ' .
                    'id = $4 ' .
                'RETURNING time_out';
                    
            $sqlResult = $db->paramQuery($sqlQuery, [
                    $signOutTimeStamp,
                    $user['id'],
                    date("Y-m-d H:i:s"),
                    $attendanceId
                ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $timeOut = date("H:i", strtotime($sqlRow['time_out']));
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'timeIn' => $timeIn,
                'timeOut' => $timeOut
            ]) );
            
            return true;
        }
        
        // Function to update the attendance of the specified employee
        //
        // Required Parameters
        //  employeeId              The id of the employee whose attencance to update
        //  temperature             The employee's temperature
        //  note                   Notes regarding the employee's attendance
        //
        // Optional Parameters
        //  None
        public function signInEmployee($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'temperature' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'signInDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'signInTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            if ($data['signInTime'] !== null) {
                $signInTimeStamp = date($data['signInDate'] . ' ' . $data['signInTime']);
                
                if(strlen(substr($data['signInTime'], strpos($data['signInTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signInTime'], 0, strpos($data['signInTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
                else if((int)(substr($data['signInTime'], strpos($data['signInTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid time format.']) );
                    return false;
                }
            }
            
            // Load the employee from the employees table
            $sqlQuery = 
                'SELECT  ' .
                    'id, time_in, time_out ' .
                'FROM  ' .
                    'employee_attendance  ' .
                'WHERE ' .
                    'employee_attendance.is_deleted = FALSE AND ' .
                    'employee_id = $1 ' .
                'ORDER BY time_in_logged_at DESC LIMIT 1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() > 0 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $attendanceId = $sqlRow['id'];
                
                if ($sqlRow['time_out'] === null) {
                    if ($sqlRow['time_in'] !== null) {
                        echo( json_encode(['ok' => false, 'error' => 'This employee was already signed in.']) );
                        return false;
                    }
                }
            }
            
            $sqlQuery = 
                'INSERT INTO employee_attendance ( '.
                    'employee_id, ' .
                    'time_in, ' .
                    'in_logged_by_user_id, ' .
                    'time_out, ' .
                    'out_logged_by_user_id, ' .
                    'temperature, ' .
                    'note, ' .
                    'time_in_logged_at, ' .
                    'time_out_logged_at, ' .
                    'is_deleted ' .
                ') ' .
                'VALUES ( ' .
                    '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                ') RETURNING time_in; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['employeeId'],
                    $signInTimeStamp,
                    $user['id'],
                    null,
                    null,
                    $data['temperature'],
                    $data['note'],
                    date("Y-m-d H:i:s"),
                    null,
                    false
                ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $timeIn = date("H:i", strtotime($sqlRow['time_in']));
            $timeOut = null;
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'timeIn' => $timeIn,
                'timeOut' => $timeOut
            ]) );
            
            return true;
        }
        
        // Function to allocate attendance for multiple employees at once
        //
        // Required Parameters
        //  allocations                 An array containing the details of the attendance to be allocated
        //
        // Optional Parameters
        //  None
        public function bulkAllocate($data, $user, $db) {
            
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
                        'employeeAttendancesId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                        'inDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'inTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'outDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'outTime' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'temperature' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                        'note' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Do sanity checks for every allocation
            foreach( $data['allocations'] AS $allocation ) {
                // Make certain in date is a valid date
                if( !Util::isDateValid($allocation['inDate']) ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-in date.']) );
                    return false;
                }
                
                // Make certain in time is a valid time
                if(strlen(substr($allocation['inTime'], strpos($allocation['inTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-in time format.']) );
                    return false;
                }
                else if((int)(substr($allocation['inTime'], 0, strpos($allocation['inTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-in time format.']) );
                    return false;
                }
                else if((int)(substr($allocation['inTime'], strpos($allocation['inTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-in time format.']) );
                    return false;
                }
                
                // Make certain out date is a valid date
                if( !Util::isDateValid($allocation['outDate']) ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-out date.']) );
                    return false;
                }
                
                // Make certain out time is a valid time
                if(strlen(substr($allocation['outTime'], strpos($allocation['outTime'], ':') + 1)) !== 2){
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-out time format.']) );
                    return false;
                }
                else if((int)(substr($allocation['outTime'], 0, strpos($allocation['outTime'], ':'))) >= 24) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-out time format.']) );
                    return false;
                }
                else if((int)(substr($allocation['outTime'], strpos($allocation['outTime'], ':') * -1 )) >= 60 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Invalid sign-out time format.']) );
                    return false;
                }
                
                // Make certain out date/time is after in date/time
                $inTimeStamp = ($allocation['inDate'] . ' ' . $allocation['inTime']);
                $outTimeStamp = ($allocation['outDate'] . ' ' . $allocation['outTime']);
                $signInDate = new DateTime( $inTimeStamp );
                $signOutDate = new DateTime( $outTimeStamp );
                if( $signOutDate <= $signInDate ) {
                    echo( json_encode(['ok' => false, 'error' => 'The sign-out date should be after the sign-in date.']) );
                    return false;
                }
                
                // // Make certain in date/time is not in the future
                // $now = new DateTime( "now", new DateTimeZone("UTC") );
                // if( $signInDate > $now ) {
                //     echo( json_encode(['ok' => false, 'error' => 'The sign-in date cannot be in the future.']) );
                //     return false;
                // }
                
                // // Make certain out date/time is not in the future
                // if( $signOutDate > $now ) {
                //     echo( json_encode(['ok' => false, 'error' => 'The sign-out date cannot be in the future.']) );
                //     return false;
                // }
                
                // Make certain the period does not overlap an exiting period
                $sqlQuery = 
                    'SELECT ' .
                        'employees.code AS employee_code, ' .
                        'employees.alias AS employee_alias, ' .
                        'employee_attendance.id, ' . 
                        'employee_attendance.time_in, ' . 
                        'employee_attendance.time_out ' .
                    'FROM  ' .
                        'employee_attendance  ' .
                    'LEFT JOIN ' . 
                            'employees ON employees.id = employee_attendance.employee_id ' .
                    'WHERE ' .
                        'employee_attendance.is_deleted = FALSE AND ' .
                        'employee_attendance.employee_id = $1 AND ' .
                        '( ' .
                            '( employee_attendance.time_in >= $2 AND employee_attendance.time_in <= $3 AND time_out IS NOT NULL ) OR ' .
                            '( employee_attendance.time_out >= $2 AND employee_attendance.time_out <= $3 ) ' .
                        ') ' .
                    'ORDER BY time_in_logged_at;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $allocation['employeeId'],
                    $inTimeStamp,
                    $outTimeStamp
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Was a result found?
                if( $sqlResult->getRowCount() > 0 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    echo( json_encode(['ok' => false, 'error' => (
                        'The attendance for ' . $sqlRow['employee_alias'] . ' (' . $sqlRow['employee_code'] . 
                        ') overlaps an existing attendance period:<br><br>' . 
                        $sqlRow['time_in'] . ' to ' . $sqlRow['time_out']
                    )]) );
                    return false;
                }
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE employee_attendance IN EXCLUSIVE MODE;');
            
            // For every allocation
            foreach( $data['allocations'] AS $allocation ) {
                // Check if the employee as already been signed out
                $sqlQuery = 
                    'SELECT  ' .
                        'employees.code AS employee_code, ' .
                        'employees.alias AS employee_alias, ' .
                        'employee_attendance.id, ' . 
                        'employee_attendance.time_in, ' . 
                        'employee_attendance.time_out ' .
                    'FROM  ' .
                        'employee_attendance  ' .
                    'LEFT JOIN ' . 
                        'employees ON employees.id = employee_attendance.employee_id ' .
                    'WHERE ' .
                        'employee_attendance.is_deleted = FALSE AND ' .
                        'employee_attendance.employee_id = $1 ' .
                    'ORDER BY ' . 
                        'time_in_logged_at DESC ' . 
                    'LIMIT 1 ';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $allocation['employeeId']
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Was a result found?
                $attendanceId = null;
                $isSignedOut = false;
                if( $sqlResult->getRowCount() > 0 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $attendanceId = $sqlRow['id'];
                    
                    // Was the employee already signed out?
                    if ($sqlRow['time_out'] !== null) {
                        // echo( json_encode(['ok' => false, 'error' => ($sqlRow['employee_alias'] . ' (' . $sqlRow['employee_code'] . ') was already signed out.')]) );
                        // return false;
                        
                        // Remember that the employee is signed out
                        $isSignedOut = true;
                    }
                    
                    // // Was an outdated attendance id given?
                    // if( ($allocation['employeeAttendancesId'] !== null) && ($allocation['employeeAttendancesId'] != $attendanceId) ) {
                    //     echo( json_encode(['ok' => false, 'error' => ('The attendance for ' . $sqlRow['employee_alias'] . ' (' . $sqlRow['employee_code'] . ') is out of date.')]) );
                    //     return false;
                    // }
                }
                // else {
                //     echo( json_encode(['ok' => false, 'error' => ('Attendance not found.')]) );
                //     return false;
                // }
            
                
                // Is the employee signed in but not signed out?
                if( (!$isSignedOut) && ($attendanceId !== null) ) {
                    // Create a timestamp for the sign-out date and time
                    $signOutTimeStamp = date($allocation['outDate'] . ' ' . $allocation['outTime']);
                    
                    // Sign out the specified employee
                    $sqlQuery = 
                        'UPDATE ' .
                            'employee_attendance ' .
                        'SET ' .
                            'time_out = $1, ' .
                            'out_logged_by_user_id = $2, ' .
                            'time_out_logged_at = $3 ' .
                        'WHERE ' .
                            'id = $4;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $signOutTimeStamp,
                        $user['id'],
                        date("Y-m-d H:i:s"),
                        $attendanceId
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
                else {
                    // Create a timestamps for the sign-in and sign-out date and time
                    $signInTimeStamp = date($allocation['inDate'] . ' ' . $allocation['inTime']);
                    $signOutTimeStamp = date($allocation['outDate'] . ' ' . $allocation['outTime']);
                    
                    // Allocate the employee attendance
                    $sqlQuery = 
                        'INSERT INTO employee_attendance ( '.
                            'employee_id, ' .
                            'time_in, ' .
                            'in_logged_by_user_id, ' .
                            'time_out, ' .
                            'out_logged_by_user_id, ' .
                            'temperature, ' .
                            'note, ' .
                            'time_in_logged_at, ' .
                            'time_out_logged_at, ' .
                            'is_deleted ' .
                        ') ' .
                        'VALUES ( ' .
                            '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                        ');';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $allocation['employeeId'],
                        $signInTimeStamp,
                        $user['id'],
                        $signOutTimeStamp,
                        $user['id'],
                        $allocation['temperature'],
                        $allocation['note'],
                        date("Y-m-d H:i:s"),
                        date("Y-m-d H:i:s"),
                        false
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode([ 'ok' => true ]) );
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
        public function exportHistory($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'sortOrder' => 'DESC',
                'sortList' => null,
                'searchString' => '',
                'type' => null,
                'departmentId' => null,
                'employeeId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set the filters, if any
            $whereClause = '';
            $sqlParams = [];
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 
                    ' WHERE (  ' . 
                        '(united_attendance.alias ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') OR ' .
                        '(united_attendance.temperature ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') OR ' .
                        '(united_attendance.note ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') ' .
                    ') ';
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
                        case 'alias':
                            $column = 'alias';
                            break;
                        case 'emailAddress':
                            $column = 'email_address';
                            break;
                        case 'cellNumber':
                            $column = 'cell_number';
                            break;
                        case 'timeIn':
                            $column = 'time_in';
                            break;
                        case 'timeOut':
                            $column = 'time_out';
                            break;
                        case 'time':
                            $column = 'time';
                            break;
                        case 'temperature':
                            $column = 'temperature';
                            break;
                        case 'note':
                            $column = 'note';
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
            
            // Add filters for start and end date, if any
            if( ($data['startDate'] !== null) || ($data['endDate'] !== null) ) {
                // Is there already a where clause?
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . ' AND ';
                }
                
                // Depending on which dates were given
                if( $data['endDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date >= \'' . $data['startDate'] . ' 00:00:00\') OR (time_out::Date >= \'' . $data['startDate'] . ' 00:00:00\'))';
                }
                else if( $data['startDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date <= \'' . $data['endDate'] . ' 23:59:59\') OR (time_out::Date <= \'' . $data['endDate'] . ' 00:00:00\')';
                }
                else {
                    $whereClause = $whereClause . 
                        '(' .
                            '(time_in::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_in::Date <=  \''. $data['endDate'] . ' 23:59:59\') OR ' .
                            '(time_out::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_out::Date <=  \''. $data['endDate'] . ' 23:59:59\')' .
                        ')';
                }
            }
            
            // Add a filter for the attendee type
            if( isset($data['type']) && $data['type'] !== null ) {
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                
                if( $data['type'] === 'VISI' ) {
                    $whereClause = $whereClause . 'is_employee = false ';
                }
                else if( $data['type'] === 'EMPL' ) {
                    $whereClause = $whereClause . 'is_employee = true ';
                }
            }
            
            // Add a filter for the department, if any
            if( isset($data['departmentId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['departmentId'];
                $whereClause = $whereClause . ' united_attendance.department_id = $' . count($sqlParams) . ' ';
            }
            
            // Add a filter for the employee, if any
            if( isset($data['employeeId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['employeeId'];
                $whereClause = $whereClause . ' united_attendance.id = $' . count($sqlParams) . ' ';
            }
            
            // Get the attendance history from the database
            $sqlQuery =
                'WITH united_attendance AS ( ' .
                    'SELECT  ' .
                        'visitor_attendance.id AS attendance_id, ' . 
                        'visitors.id, ' . 
                        '\'\' AS employee_number, ' .
                        'name AS alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, ' . 
                        'false AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'NULL as department_id, ' .
                        'temperature, ' .
                        'visitor_attendance.note ' .
                    'FROM ' . 
                        'visitors ' .
                    'LEFT JOIN ' .
                        'visitor_attendance ON visitor_attendance.visitor_id = visitors.id ' .
                    'WHERE ' . 
                        'visitor_attendance.is_deleted = FALSE ' .
                'UNION ALL ' .
                    'SELECT  ' .
                        'employee_attendance.id AS attendance_id, ' . 
                        'employees.id, ' . 
                        'employees.code AS employee_number, ' . 
                        'alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, '  . 
                        'true AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'department_id, ' .
                        'temperature, ' .
                        'employee_attendance.note ' .
                    'FROM ' . 
                        'employees ' .
                    'LEFT JOIN  ' .
                        'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                    'WHERE  ' .
                        'employee_attendance.is_deleted = FALSE AND ( ' .
                            '(employment_end_date IS NULL OR employment_end_date > NOW()::Date) ' .
                        ') '. 
                ') ' .
                'SELECT  ' .
                    'attendance_id, ' . 
                    'id, ' . 
                    'employee_number, ' .
                    'alias, ' . 
                    'time_in, ' . 
                    'time_out, ' . 
                    'time, ' . 
                    'is_employee, ' . 
                    'email_address, ' . 
                    'cell_number, ' . 
                    'department_id, ' . 
                    'temperature, ' . 
                    'note ' . 
                'FROM ' . 
                    'united_attendance ' .
                $whereClause . ' ' .
                $sortClause . ';';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $history = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $time = '';
                if( $sqlRow['time'] !== null ) {
                    $time = substr($sqlRow['time'], 0, -3);
                }
                
                $history[] = [
                    'id' => $sqlRow['id'],
                    'attendanceId' => $sqlRow['attendance_id'],
                    'employeeNumber' => $sqlRow['employee_number'],
                    'alias' => $sqlRow['alias'],
                    'time' => $time,
                    'timeIn' => $sqlRow['time_in'],
                    'timeOut' => $sqlRow['time_out'],
                    'isEmployee' => $sqlRow['is_employee'],
                    'emailAddress' => $sqlRow['email_address'],
                    'cellNumber' => $sqlRow['cell_number'],
                    'temperature' => $sqlRow['temperature'],
                    'note' => $sqlRow['note']
                ];
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "TYPE",
                "EMPLOYEE NUMBER",
                "ALIAS",
                "EMAIL ADDRESS",
                "CELL NUMBER",
                "TIME IN",
                "TIME OUT",
                "TIME",
                "TEMPERATURE",
                "NOTE"
            ];
            
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
                
            $writer = $this->writeReport($data, 'attendance_history_' . $suffix, $headers);
            
            // Write out the content
            for ($i=0; $i < count($history); $i++) { 
                $type = 'EMPLOYEE';
                if( !$history[$i]['isEmployee'] ) {
                    $type = 'VISITOR';
                }
                
                $content = [
                    $type,
                    $history[$i]['employeeNumber'],
                    $history[$i]['alias'],
                    $history[$i]['emailAddress'],
                    $history[$i]['cellNumber'],
                    $history[$i]['timeIn'],
                    $history[$i]['timeOut'],
                    $history[$i]['time'],
                    $history[$i]['temperature'],
                    $history[$i]['note']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
        }
        
        // Function to export the attendance history to pdf
        //
        // Required Parameters
        //  startDate               The start date of the history to export
        //  endDate                 The end date of the history to export
        //
        // Optional Parameters
        //  searchString            A search string to limit the results of the export
        public function exportHistoryPdf($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'sortOrder' => 'DESC',
                'sortList' => null,
                'searchString' => '',
                'type' => null,
                'departmentId' => null,
                'employeeId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true],
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set the filters, if any
            $whereClause = '';
            $sqlParams = [];
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 
                    ' WHERE (  ' . 
                        '(united_attendance.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\') OR ' .
                        '(united_attendance.temperature ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\') OR ' .
                        '(united_attendance.note ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\') ' .
                    ') ';
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
                        case 'alias':
                            $column = 'alias';
                            break;
                        case 'emailAddress':
                            $column = 'email_address';
                            break;
                        case 'cellNumber':
                            $column = 'cell_number';
                            break;
                        case 'timeIn':
                            $column = 'time_in';
                            break;
                        case 'timeOut':
                            $column = 'time_out';
                            break;
                        case 'time':
                            $column = 'time';
                            break;
                        case 'temperature':
                            $column = 'temperature';
                            break;
                        case 'note':
                            $column = 'note';
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
            
            // Add filters for start and end date, if any
            if( ($data['startDate'] !== null) || ($data['endDate'] !== null) ) {
                // Is there already a where clause?
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . ' AND ';
                }
                
                // Depending on which dates were given
                if( $data['endDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date >= \'' . $data['startDate'] . ' 00:00:00\') OR (time_out::Date >= \'' . $data['startDate'] . ' 00:00:00\'))';
                }
                else if( $data['startDate'] === null ) {
                    $whereClause = $whereClause . '((time_in::Date <= \'' . $data['endDate'] . ' 23:59:59\') OR (time_out::Date <= \'' . $data['endDate'] . ' 00:00:00\')';
                }
                else {
                    $whereClause = $whereClause . 
                        '(' .
                            '(time_in::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_in::Date <=  \''. $data['endDate'] . ' 23:59:59\') OR ' .
                            '(time_out::Date >= \''. $data['startDate'] . ' 00:00:00\' AND time_out::Date <=  \''. $data['endDate'] . ' 23:59:59\')' .
                        ')';
                }
            }
            
            // Add a filter for the attendee type
            if( isset($data['type']) && $data['type'] !== null ) {
                if( $whereClause === '' ) {
                    $whereClause = 'WHERE ';
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                
                if( $data['type'] === 'VISI' ) {
                    $whereClause = $whereClause . 'is_employee = false ';
                }
                else if( $data['type'] === 'EMPL' ) {
                    $whereClause = $whereClause . 'is_employee = true ';
                }
            }
            
            // Add a filter for the department, if any
            if( isset($data['departmentId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['departmentId'];
                $whereClause = $whereClause . ' united_attendance.department_id = $' . count($sqlParams) . ' ';
            }
            
            // Add a filter for the employee, if any
            if( isset($data['employeeId']) ) {
                if( $whereClause !== '' ) {
                    $whereClause = $whereClause . ' AND ';
                }
                else {
                    $whereClause = 'WHERE ';
                }
                
                $sqlParams[] = $data['employeeId'];
                $whereClause = $whereClause . ' united_attendance.id = $' . count($sqlParams) . ' ';
            }
            
            // Get the attendance history from the database
            $sqlQuery =
                'WITH united_attendance AS ( ' .
                    'SELECT  ' .
                        'visitor_attendance.id AS attendance_id, ' . 
                        'visitors.id, ' . 
                        '\'\' AS employee_number, ' .
                        'name AS alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, ' . 
                        'false AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'NULL as department_id, ' .
                        'temperature, ' .
                        'visitor_attendance.note ' .
                    'FROM ' . 
                        'visitors ' .
                    'LEFT JOIN ' .
                        'visitor_attendance ON visitor_attendance.visitor_id = visitors.id ' .
                    'WHERE ' . 
                        'visitor_attendance.is_deleted = FALSE ' .
                'UNION ALL ' .
                    'SELECT  ' .
                        'employee_attendance.id AS attendance_id, ' . 
                        'employees.id, ' . 
                        'employees.code AS employee_number, ' . 
                        'alias, ' . 
                        'time_in, ' . 
                        'time_out, ' . 
                        'age(time_out, time_in) AS time, '  . 
                        'true AS is_employee, ' . 
                        'email_address, ' .
                        'cell_number, ' .
                        'department_id, ' .
                        'temperature, ' .
                        'employee_attendance.note ' .
                    'FROM ' . 
                        'employees ' .
                    'LEFT JOIN  ' .
                        'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                    'WHERE ' .
                        'employee_attendance.is_deleted = FALSE AND ( ' .
                            '(employment_end_date IS NULL OR employment_end_date > NOW()::Date) ' .
                        ') '. 
                ') ' .
                'SELECT  ' .
                    'attendance_id, ' . 
                    'id, ' . 
                    'employee_number, ' .
                    'alias, ' . 
                    'time_in, ' . 
                    'time_out, ' . 
                    'time, ' . 
                    'is_employee, ' . 
                    'email_address, ' . 
                    'cell_number, ' . 
                    'department_id, ' . 
                    'temperature, ' . 
                    'note ' . 
                'FROM ' . 
                    'united_attendance ' .
                $whereClause . ' ' .
                $sortClause . ';';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $history = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $time = '';
                if( $sqlRow['time'] !== null ) {
                    $time = substr($sqlRow['time'], 0, -3);
                }
                
                $history[] = [
                    'id' => $sqlRow['id'],
                    'attendanceId' => $sqlRow['attendance_id'],
                    'employeeNumber' => $sqlRow['employee_number'],
                    'alias' => $sqlRow['alias'],
                    'time' => $time,
                    'timeIn' => $sqlRow['time_in'],
                    'timeOut' => $sqlRow['time_out'],
                    'isEmployee' => $sqlRow['is_employee'],
                    'cellNumber' => $sqlRow['cell_number']
                ];
            }
            
            // Setup the report rows
            $reportRows = [];
            for( $i=0; $i < count($history); $i++ ) { 
                $type = 'EMPLOYEE';
                if( !$history[$i]['isEmployee'] ) {
                    $type = 'VISITOR';
                }
                
                $reportRows[] = [
                    $type,
                    $history[$i]['employeeNumber'],
                    $history[$i]['alias'],
                    $history[$i]['cellNumber'],
                    $history[$i]['timeIn'],
                    $history[$i]['timeOut'],
                    $history[$i]['time']
                ];
            }
            
            // Set report name
            $dateDescription = '';
            if( ($data['startDate'] !== NULL) && ($data['startDate'] !== '') ) {
                $dateDescription = $data['startDate'];
            }
            if( ($data['endDate'] !== NULL) && ($data['endDate'] !== '') ) {
                if( $dateDescription !== '' ) {
                    $dateDescription = $dateDescription . ' to ' . $data['endDate'];
                }
                else {
                    $dateDescription = $data['endDate'];
                }
            }
            if( $dateDescription === '' ) {
                $dateDescription = date('Y-m-d');
            }
            $reportName = 'Attendance History (' . $dateDescription . ')';
            
            // Add columns (widths are percentages). Note that the number of columns should correspond to
            // the number of elements in each row.
            $reportCols = [];
            $reportCols [] = [ 'name' => 'Type',            'width' => 10/100, 'alignment' => 'C' ];
            $reportCols [] = [ 'name' => 'Code',            'width' =>  7/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Employee Name',   'width' => 35/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Cell Number',     'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Time In',         'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Time Out',        'width' => 12/100, 'alignment' => 'L' ];
            $reportCols [] = [ 'name' => 'Time',            'width' => 12/100, 'alignment' => 'L' ];
            
            // Create the PDF document
            $pdfPageOrientation = 'L'; // 'P' for portrait, 'L' for landscape
            $pdfPageFormat = 'A4';
            $pdf = new TCPDF($pdfPageOrientation, PDF_UNIT, $pdfPageFormat, true, 'UTF-8', false);
            
            // Set the report style
            $reportStyle = [
                'marginX' => 10,
                'marginY' => 5,
                'lineHeight' => 6,
                'textSize' => 8,
                'textColor' => [16, 16, 16],
                'backgroundColor' => [255, 255, 255],
                'headingTextSize' => 8,
                'headingTextColor' => [255, 255, 255],
                'headingBackgroundColor' => [239, 78, 69],
                'highlightColor' => [232, 232, 232],
                'borderColor' => [16, 16, 16]
            ];
            
            // Write the PDF report data
            $result = $this->writePdfReport($pdf, $reportName, $reportCols, $reportRows, $reportStyle);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Create the file name for the report
            $fileName = 'attendance_history_' . date('Ymd') . '.pdf';
            
            // Close and output PDF document
            $pdf->Output($fileName, 'I');
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
        
        // @param $pdf              The PDF document to write to
        // @param $reportName       The name of the report
        // @param $columns          An array containing details of the report columns
        // @param $rows             An array with the data for the report
        // @param $style            An containing style details for the report
        private function writePdfReport($pdf, $reportName, $columns, $rows, $style = null) {
            // The number of elements in each row should correspond to the number of elements
            // in the columns array
            foreach($rows AS $row) {
                if( count($row) !== count($columns) ) {
                    return( ['ok' => false, 'error' => 'PDF report columns and rows do not match up'] );
                }
            }
            
            // Set the header and footer styles
            $pageNum = 1;
            $numPages = 1;
            $headerHeight = 8;
            $headerTextSize = 12;
            $footerHeight = 6;
            $footerTextSize = 8;
            
            // Set report default style
            $marginX = 10;
            $marginY = 5;
            $lineHeight = 6;
            $textSize = 8;
            $textColor = [16, 16, 16];
            $backgroundColor = [255, 255, 255];
            $headingTextSize = 8;
            $headingTextColor = [255, 255, 255];
            $headingBackgroundColor = [239, 78, 69];
            $highlightColor = [232, 232, 232];
            $borderColor = [16, 16, 16];
            
            // Update the style based on the parameters
            if( $style !== null ) {
                if( array_key_exists('marginX', $style) && ($style['marginX'] !== null) ) {
                    $marginX = $style['marginX'];
                }
                if( array_key_exists('marginY', $style) && ($style['marginY'] !== null) ) {
                    $marginY = $style['marginY'];
                }
                if( array_key_exists('lineHeight', $style) && ($style['lineHeight'] !== null) ) {
                    $lineHeight = $style['lineHeight'];
                }
                if( array_key_exists('textSize', $style) && ($style['textSize'] !== null) ) {
                    $textSize = $style['textSize'];
                }
                if( array_key_exists('textColor', $style) && ($style['textColor'] !== null) ) {
                    $textColor = $style['textColor'];
                }
                if( array_key_exists('backgroundColor', $style) && ($style['backgroundColor'] !== null) ) {
                    $backgroundColor = $style['backgroundColor'];
                }
                if( array_key_exists('headingTextSize', $style) && ($style['headingTextSize'] !== null) ) {
                    $headingTextSize = $style['headingTextSize'];
                }
                if( array_key_exists('headingTextColor', $style) && ($style['headingTextColor'] !== null) ) {
                    $headingTextColor = $style['headingTextColor'];
                }
                if( array_key_exists('headingBackgroundColor', $style) && ($style['headingBackgroundColor'] !== null) ) {
                    $headingBackgroundColor = $style['headingBackgroundColor'];
                }
                if( array_key_exists('highlightColor', $style) && ($style['highlightColor'] !== null) ) {
                    $highlightColor = $style['highlightColor'];
                }
                if( array_key_exists('borderColor', $style) && ($style['borderColor'] !== null) ) {
                    $borderColor = $style['borderColor'];
                }
            }
            
            // Set document information
            $pdf->SetCreator(PDF_CREATOR);
            $pdf->SetAuthor('Lexpro Payroll');
            $pdf->SetTitle('Lexpro Payroll - ' . $reportName);
            $pdf->SetSubject('');
            $pdf->SetKeywords('');
            
            // Remove default header/footer
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);
            
            // Set default monospaced font
            $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
            
            // Set margins
            $pdf->SetMargins(0, 0, 0, 0);
            
            // Set some language-dependent strings (optional)
            if (@file_exists(dirname(__FILE__).'/lang/eng.php')) {
                require_once(dirname(__FILE__).'/lang/eng.php');
                $pdf->setLanguageArray($l);
            }
            
            // Set font
            $pdf->SetFont('helvetica', 'BI', 20);
            
            // Set auto page breaks
            $pdf->SetAutoPageBreak(FALSE, 0);
            
            // Add a page
            $pdf->AddPage();
            
            // Get the page with and height
            $pageWidth = $pdf->GetPageWidth() - ($marginX * 2);
            $pageHeight = $pdf->GetPageHeight() - ($marginY * 2);
            
            // Calculate the number of pages
            $currentX = $marginX;
            $currentY = $marginY;
            
            // Add the height of the report header and headings
            $currentY = $currentY + ($headerHeight * 1);
            $currentY = $currentY + ($lineHeight * 1);
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // For every row of the document
            for( $i=0; $i < count($rows); $i++ ) { 
                // Is there NOT enough space for another item?
                if( ($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight) ) {
                    // Add a page and reset the y coordinate
                    $numPages = $numPages + 1;
                    $currentY = $marginY;
                    
                    // Add the height of the report header and headings
                    $currentY = $currentY + ($headerHeight * 1);
                    $currentY = $currentY + ($lineHeight * 1);
                    $currentY = $currentY + ($lineHeight * 1.25);
                }
                
                // Add the height of each row
                $currentY = $currentY + $lineHeight;
            }
            
            // Reset the starting text coordinates
            $currentX = $marginX;
            $currentY = $marginY;
            
            // Set the page background color
            $pdf->Rect(0, 0, $pdf->getPageWidth(),  $pdf->getPageHeight(), 'DF', "", $backgroundColor);
            
            // Display the document header
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
            $pdf->SetFont('helvetica', 'B', $headerTextSize);
            $pdf->SetXY($currentX, $currentY);
            $pdf->Cell($pageWidth / 2, ($headerHeight * 1), $reportName, null, 0, 'L', true, '', 1, false, 'T', 'B');
            $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
            $pdf->Cell($pageWidth / 2, ($headerHeight * 1), 'Lexpro Payroll', null, 0, 'R', true, '', 1, false, 'T', 'B');
            $currentY = $currentY + ($headerHeight * 1);
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
            $currentY = $currentY + ($lineHeight * 1);
            
            // Display the headings for the data
            $pdf->SetTextColor($headingTextColor[0], $headingTextColor[1], $headingTextColor[2]);
            $pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
            $pdf->SetFont('helvetica', 'B', $headingTextSize);
            $borderStyle = [
                'T' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'B' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
            ];
            foreach( $columns AS $col ) {
                $pdf->SetXY($currentX, $currentY);
                $pdf->Cell(($pageWidth * $col['width']), $lineHeight * 1.25, $col['name'], $borderStyle, 0, $col['alignment'], true, '', 1, false, 'T', 'C');
                $currentX = $currentX + ($pageWidth * $col['width']);
            }
            $currentY = $currentY + ($lineHeight * 1.25);
            
            // Display all the data in a table
            $pdf->SetFont('helvetica', '', $textSize);
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $borderStyle = [
                'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
            ];
            $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
            $fill = true;
            
            // Display the data of all the rows
            for( $i=0; $i < count($rows); $i++ ) { 
                // Is there NOT enough space for another item?
                if( ($currentY + ($lineHeight * 2) + $footerHeight) > ($marginY + $pageHeight) ) {
                    // Draw a line after the final item
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
                    
                    // Display the document footer
                    $currentX = $marginX;
                    $currentY = $marginY + $pageHeight - $footerHeight;
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $textColor, 'cap' => 'butt']);
                    $currentY = $currentY + 1;
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
                    $pdf->SetFont('helvetica', '', $footerTextSize);
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell($pageWidth / 2, ($footerHeight * 1), date('Y-m-d'), null, 0, 'L', true, '', 1, false, 'T', 'T');
                    $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
                    $pdf->Cell($pageWidth / 2, ($footerHeight * 1), 'Page ' . $pageNum . ' of ' . $numPages, null, 0, 'R', true, '', 1, false, 'T', 'T');
                            
                    // Add a new page and reset the coordinates
                    $pdf->AddPage();
                    $currentY = $marginY;
                    $currentX = $marginX;
                    
                    // Add the page number
                    $pageNum = $pageNum + 1;
                    
                    // Set the page background color
                    $pdf->Rect(0, 0, $pdf->getPageWidth(),  $pdf->getPageHeight(), 'DF', "", $backgroundColor);
                    
                    // Display the document header
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
                    $pdf->SetFont('helvetica', 'B', $headerTextSize);
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell($pageWidth / 2, ($headerHeight * 1), $reportName, null, 0, 'L', true, '', 1, false, 'T', 'B');
                    $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
                    $pdf->Cell($pageWidth / 2, ($headerHeight * 1), 'Lexpro Payroll', null, 0, 'R', true, '', 1, false, 'T', 'B');
                    $currentY = $currentY + ($headerHeight * 1);
                    $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
                    $currentY = $currentY + ($lineHeight * 1);
                    
                    // Display the headings
                    $pdf->SetTextColor($headingTextColor[0], $headingTextColor[1], $headingTextColor[2]);
                    $pdf->SetFillColor($headingBackgroundColor[0], $headingBackgroundColor[1], $headingBackgroundColor[2]);
                    $pdf->SetFont('helvetica', 'B', $headingTextSize);
                    $borderStyle = [
                        'T' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'B' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
                    ];
                    foreach( $columns AS $col ) {
                        $pdf->SetXY($currentX, $currentY);
                        $pdf->Cell(($pageWidth * $col['width']), $lineHeight * 1.25, $col['name'], $borderStyle, 0, $col['alignment'], true, '', 1, false, 'T', 'C');
                        $currentX = $currentX + ($pageWidth * $col['width']);
                    }
                    $currentY = $currentY + ($lineHeight * 1.25);
                    
                    // Reset the values for displaying the data
                    $pdf->SetFont('helvetica', '', $textSize);
                    $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
                    $borderStyle = [
                        'R' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt'],
                        'B' => ['width' => 0.00, 'color' => $highlightColor, 'cap' => 'butt'],
                        'L' => ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']
                    ];
                    $pdf->SetFillColor($highlightColor[0], $highlightColor[1], $highlightColor[2]);
                    $fill = true;
                }
            
                // Start at the beginning of the line
                $currentX = $marginX;
                
                // Alternate the fill
                $fill = !$fill;
                
                // Set each of the column values
                for( $j=0; $j < count($columns); $j++ ) {
                    $pdf->SetXY($currentX, $currentY);
                    $pdf->Cell(($pageWidth * $columns[$j]['width']), $lineHeight, $rows[$i][$j], $borderStyle, 0, $columns[$j]['alignment'], $fill, '', 1, false, 'T', 'C');
                    $currentX = $currentX + ($pageWidth * $columns[$j]['width']);
                }
                
                // Go to the next row
                $currentY = $currentY + $lineHeight;
            }
            
            // Draw a line after the final item
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $borderColor, 'cap' => 'butt']);
            
            // Display the document footer
            $currentX = $marginX;
            $currentY = $marginY + $pageHeight - $footerHeight;
            $pdf->SetXY($currentX, $currentY);
            $pdf->Line($marginX, $currentY, $pageWidth + $marginX, $currentY, ['width' => 0.25, 'color' => $textColor, 'cap' => 'butt']);
            $currentY = $currentY + 1;
            $pdf->SetTextColor($textColor[0], $textColor[1], $textColor[2]);
            $pdf->SetFillColor($backgroundColor[0], $backgroundColor[1], $backgroundColor[2]);
            $pdf->SetFont('helvetica', '', $footerTextSize);
            $pdf->SetXY($currentX, $currentY);
            $pdf->Cell($pageWidth / 2, ($footerHeight * 1), date('Y-m-d'), null, 0, 'L', true, '', 1, false, 'T', 'T');
            $pdf->SetXY($currentX + ($pageWidth / 2), $currentY);
            $pdf->Cell($pageWidth / 2, ($footerHeight * 1), 'Page ' . $pageNum . ' of ' . $numPages, null, 0, 'R', true, '', 1, false, 'T', 'T');
            
            return(['ok' => true]);
        }
    }
?>
