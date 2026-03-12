<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    // Includes
    // System::includeFile('Util.php');
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
        //  attendanceId            The id of the attendance to get
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
                'attendanceId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlQuery =
                'SELECT ' . 
                    'employee_attendance.time_in, ' .
                    'employee_attendance.time_out, ' .
                    'employees.alias AS name, ' .
                    'employees.email_address, ' .
                    'employees.cell_number, ' .
                    'age(employee_attendance.time_out, employee_attendance.time_in) AS time, ' .
                    'employee_attendance.temperature, ' .
                    'employee_attendance.note ' .
                'FROM ' .
                    'employee_attendance ' .
                'LEFT JOIN ' .
                    'employees ON employee_id = employees.id ' .
                'WHERE ' .
                    'employee_attendance.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['attendanceId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the attendance details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $time = '';
            if( $sqlRow['time'] !== null ) {
                $time = substr($sqlRow['time'], 0, -3);
                if (!substr($sqlRow['time'], 0, -3)) {
                    $time = '';
                }
            }
            
            $attendance = [
                'name' => $sqlRow['name'],
                'timeIn' => $sqlRow['time_in'],
                'timeOut' => $sqlRow['time_out'],
                'emailAddress' => $sqlRow['email_address'],
                'cellNumber' => $sqlRow['cell_number'],
                'temperature' => $sqlRow['temperature'],
                'note' => $sqlRow['note'],
                'time' => $time
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'attendance' => $attendance]) );
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
                'sortOrder' => 'ASC',
                'startDate' => null,
                'endDate' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // Get only the attendance for the logged in employee
            $sqlParams[] = $user['employeeId'];
            $whereClause = 'WHERE (employees.id = $' . count($sqlParams) . ' AND employee_attendance.is_deleted = FALSE) ';
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = 
                    'AND (employees.alias ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\') ';
            }
            
            // Add a filter for the start date
            if( $data['startDate'] !== null ) {
                $sqlParams[] = $data['startDate'];
                $whereClause = $whereClause . 'AND time_in::Date >= $' . count($sqlParams) . ' ';
            }
            
            // Add a filter for the end date
            if( $data['endDate'] !== null ) {
                $sqlParams[] = $data['endDate'];
                $whereClause = $whereClause . 'AND time_in::Date <= $' . count($sqlParams) . ' ';
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
            
            // Get the attendance for the logged in employee
            $sqlQuery =
                'SELECT  ' .
                    'employee_attendance.id AS attendance_id, ' . 
                    'employees.id AS employee_id, ' . 
                    'employees.alias, ' . 
                    'employee_attendance.time_in, ' . 
                    'employee_attendance.time_out, ' . 
                    'EXTRACT(EPOCH FROM (employee_attendance.time_out - employee_attendance.time_in)) AS interval, ' .
                    'AGE(employee_attendance.time_out, employee_attendance.time_in) AS time ' .
                'FROM ' . 
                    'employees ' .
                'LEFT JOIN  ' .
                    'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                $whereClause . 
                'ORDER BY ' .
                    'time_in ' . $data['sortOrder'] . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $attendance = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $time = '';
                if( ($sqlRow['time'] !== null) && (substr($sqlRow['time'], 0, -3) !== false) ) {
                    $time = substr($sqlRow['time'], 0, -3);
                }
                
                $timeIn = '';
                if( ($sqlRow['time_in'] !== null) && (substr($sqlRow['time_in'], 0, -3) !== false) ) {
                    $timeIn = substr($sqlRow['time_in'], 0, -3);
                }
                
                $timeOut = '';
                if( ($sqlRow['time_out'] !== null) && (substr($sqlRow['time_out'], 0, -3) !== false) ) {
                    $timeOut = substr($sqlRow['time_out'], 0, -3);
                }
                
                $attendance[] = [
                    'attendanceId' => $sqlRow['attendance_id'],
                    'alias' => $sqlRow['alias'],
                    'timeIn' => $timeIn,
                    'timeOut' => $timeOut,
                    'interval' => $sqlRow['interval'],
                    'time' => $time
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'attendance' => $attendance]) );
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
                'searchString' => '',
                'sortOrder' => 'DESC',
                'startDate' => null,
                'endDate' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Set the filters, if any
            $sqlParams[] = $user['employeeId'];;
            $whereClause = 'WHERE (employees.id = $' . count($sqlParams) . ' AND employee_attendance.is_deleted = FALSE) ';
            
            // Build where clause if a search string was given
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . ' AND (united_attendance.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            // // Add the filter for the employee id
            // $sqlParams[] = $user['employeeId'];;
            // if( $whereClause !== '' ) {
            //     $whereClause = $whereClause . 'AND employee_id = $'. count($sqlParams) . ' ';
            // }
            // else {
            //     $whereClause = 'WHERE employee_id = $'. count($sqlParams) . ' ';
            // }
        
            // Add a filter for the start date
            if( $data['startDate'] !== null ) {
                $sqlParams[] = $data['startDate'];
                $whereClause = $whereClause . 'AND time_in::Date >= $' . count($sqlParams) . ' ';
            }
            
            // Add a filter for the end date
            if( $data['endDate'] !== null ) {
                $sqlParams[] = $data['endDate'];
                $whereClause = $whereClause . 'AND time_in::Date <= $' . count($sqlParams) . ' ';
            }
            
            // Get the attendance for the logged in employee
            $sqlQuery =
                'SELECT  ' .
                    'employee_attendance.id AS attendance_id, ' . 
                    'employees.id AS employee_id, ' . 
                    'employees.alias, ' . 
                    'employees.code AS employee_number, ' . 
                    'employees.cell_number, ' . 
                    'employee_attendance.time_in, ' . 
                    'employee_attendance.time_out, ' . 
                    'EXTRACT(EPOCH FROM (employee_attendance.time_out - employee_attendance.time_in)) AS interval, ' .
                    'AGE(employee_attendance.time_out, employee_attendance.time_in) AS time ' .
                'FROM ' . 
                    'employees ' .
                'LEFT JOIN  ' .
                    'employee_attendance ON employee_attendance.employee_id = employees.id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'time_in ' . $data['sortOrder'] . ', ' .
                    'alias ' . $data['sortOrder'];
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
                    if (!substr($sqlRow['time'], 0, -3)) {
                        $time = '';
                    }
                }
                
                $history[] = [
                    'attendanceId' => $sqlRow['attendance_id'],
                    'employeeNumber' => $sqlRow['employee_number'],
                    'alias' => $sqlRow['alias'],
                    'time' => $time,
                    'timeIn' => $sqlRow['time_in'],
                    'timeOut' => $sqlRow['time_out'],
                    'isEmployee' => true,
                    'cellNumber' => $sqlRow['cell_number']
                ];
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "TYPE",
                // "EMPLOYEE NUMBER",
                "ALIAS",
                // "CELL NUMBER",
                "TIME IN",
                "TIME OUT",
                "TIME"
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
                    // $history[$i]['employeeNumber'],
                    $history[$i]['alias'],
                    // $history[$i]['cellNumber'],
                    $history[$i]['timeIn'],
                    $history[$i]['timeOut'],
                    $history[$i]['time']
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
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
