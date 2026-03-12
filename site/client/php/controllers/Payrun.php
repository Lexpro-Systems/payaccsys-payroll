<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('PayslipUtil.php');
    System::includeFile('LeaveUtil.php');
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    
    //
    // PAYRUN CONTROLLER CLASS
    //
    
    class Payrun extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to edit description of selected payrun
        //
        // Required Parameters
        //  payrunId            The id of the payrun whose description to get
        //
        //
        // Optional Parameters
        //  None
        //  
        public function getDescription($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            
            // Load the payrun from the payruns table
            $sqlQuery = 'SELECT description FROM payruns WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $data['payrunId'] . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunDescription = $sqlRow['description'];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payrunDescription' => $payrunDescription
            ]) );
            
            return true;
        }
        
        
        // Function to edit description of selected payrun
        //
        // Required Parameters
        //  payrunId            The id of the payrun whose description to edit
        //  payrunDescription   The description of the payrun to edit
        //
        // Optional Parameters
        //  None
        //  
        public function editDescription($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'payrunDescription' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true]
                
                // Optional parameters
                
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            $payrunDescription = $data['payrunDescription'];
            // Load the payrun from the payruns table
            $sqlQuery = 
                'UPDATE payruns SET ' .
                    'description = $1 ' .
                'WHERE ' .
                    'payruns.id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunDescription, $payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payrunDescription' => $payrunDescription
            ]) );
            
            return true;
        }
        
        // Function to gets the last payrun to_date to use as the default current payrun from date
        // and checks to see if dates overlap with any other payruns
        // 
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getDefaultDates($data, $user, $db) {
            // Query to get available to_date
            // $sqlQuery = 'SELECT to_date FROM payruns WHERE to_date < NOW() ORDER BY to_date DESC LIMIT 1';
            $sqlQuery = 'SELECT from_date, to_date FROM payruns ORDER BY to_date DESC LIMIT 1';
                
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the default dates to the first and last day of the current month
            $currentFromDate = date('Y-m-01'); // hard-coded '01' for first day
            $currentToDate = new DateTime($currentFromDate);
            $currentToDate = $currentToDate->format('Y-m-t');
            
            // Was a result returned
            if( $sqlResult->getRowCount() == 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                
                // Was a date found?
                if( $sqlRow['to_date'] !== null ) {
                    // Get the number of months between the from and to dates
                    $datetime1 = date_create($sqlRow['from_date']);
                    $datetime2 = date_create($sqlRow['to_date']);
                    $interval = date_diff($datetime1, $datetime2);
                    $monthDiff = $interval->format('%m');
                    
                    // Set the from date to one day after the last to date
                    $currentFromDate = $sqlRow['to_date'];
                    // $currentFromDate = str_replace('-', '/', $currentFromDate);
                    $currentFromDate = date('Y-m-d', strtotime($currentFromDate . "+1 days"));
                    
                    // $currentToDate = date(substr($currentFromDate, 0, 4). '-' . substr($currentFromDate, 5, 2) . '-t');
                    $currentToDate = new DateTime($currentFromDate);
                    $currentToDate->modify('+' . $monthDiff . ' months');
                    $currentToDate = $currentToDate->format('Y-m-t');
                }
            }
            
            // // Query to check if dates overlaps with any payruns
            // $sqlQuery = 'SELECT id FROM payruns WHERE (from_date <= $1 AND to_date >= $1) OR (to_date > $2 AND from_date <= $2) ORDER BY to_date ASC';
            // $sqlResult = $db->paramQuery($sqlQuery, [$currentFromDate, $currentToDate]);
            // if( $sqlResult->getRowCount() > 0 ) {
            //     $currentFromDate = null;
            //     $currentToDate = null;
            // }
            
            echo( json_encode([
                'ok' => true,
                'fromDate' => $currentFromDate,
                'toDate' => $currentToDate
            ]) );
            return true;
        }
        
        // Function to generate a payrun for a given period
        //
        // Required Parameters
        //  departmentId        The department for which the payrun should be generated
        //  startDate           Start date of the payrun.
        //  endDate             End date of the payrun.
        //  description         A description of the payrun.
        //
        // Optional Parameters
        //  None
        public function generate($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'startDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'endDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $departmentId = $data['departmentId'];
            $startDate = new DateTime($data['startDate']);
            $endDate = new DateTime($data['endDate']);
            
            // Check that the start date is before the end date
            if( $endDate < $startDate ) {
                echo( json_encode(['ok' => false, 'error' => 'The payrun\'s end date can\'t be before it\'s start date.']) );
                return false;
            }
            
            // Get the user data
            $userData = System::getUserData();
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // // Check that we do not have any overlapping payruns
            // $sqlQuery =
            //     'SELECT ' .
            //         'id ' .
            //     'FROM ' .
            //         'payruns ' .
            //     'WHERE ' .
            //         '($1 >= from_date AND $1 <= to_date) OR ' .
            //         '($2 >= from_date AND $2 <= to_date)';
            // $sqlResult = $db->paramQuery($sqlQuery, [$data['startDate'], $data['endDate']]);
            // if( !$sqlResult->isValid() ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //     return false;
            // }
            
            // // If the result has any rows then this payrun overlaps with an existing one.
            // if( $sqlResult->getRowCount() > 0 ) {
            //     echo( json_encode(['ok' => false, 'error' => 'There is another payrun that overlaps with the provided period.']) );
            //     return false;
            // }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE loan_payments IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payruns IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payslip_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payslips IN ACCESS EXCLUSIVE MODE', []);
            
            // Add the payrun to the database
            $sqlQuery =
                'INSERT INTO ' .
                    'payruns ( ' .
                        'description, ' .
                        'from_date, ' .
                        'to_date, ' .
                        'department_id, ' .
                        'created_on, ' .
                        'processed_on, ' .
                        'created_by_user_id ' .
                    ') ' .
                'VALUES ( ' .
                        '$1, $2, $3, $4, $5, $6, $7 ' .
                    ') ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['description'],   // description
                $data['startDate'],     // from_date
                $data['endDate'],       // to_date
                $data['departmentId'],  // department_id
                date('Y-m-d', time()),  // created_on
                null,                   // processed_on
                $userData['id']         // created_by_user_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payrunId = $sqlRow['id'];
            $startDate = new DateTime($data['startDate']);
            $endDate = new DateTime($data['endDate']);
            
            // Get the payslips for the payrun
            $result = $this->generatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $startDate, $endDate, $departmentId);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Add the payslips (and their items) to the database
            $payslips = $result['payslips'];
            for( $j = 0; $j < count($payslips); $j++ ) {
                // Add the payslip to the database
                $sqlQuery =
                    'INSERT INTO ' .
                        'payslips ( ' .
                            'payrun_id, ' .
                            'employee_id, ' .
                            'period, ' .
                            'sars_year, ' .
                            'from_date, ' .
                            'to_date, ' .
                            'status_code, ' .
                            'payment_period_code, ' .
                            'payment_period_end_day, ' .
                            'paye_calculation_type_code, ' .
                            'paye_bonus_calculation_type_code ' .
                        ') ' .
                    'VALUES ( ' .
                            '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $payrunId,                              // payrun_id
                    $payslips[$j]['employee']['id'],        // employee_id
                    $payslips[$j]['taxPeriod']['number'],   // period
                    $payslips[$j]['taxPeriod']['taxYear'],  // sars_year
                    $payslips[$j]['fromDate'],              // from_date
                    $payslips[$j]['toDate'],                // to_date
                    'ACTI',                                 // status_code
                    $payslips[$j]['taxPeriod']['type'],     // payment_period_code
                    $payslips[$j]['employee']['paymentPeriodEndDay'], // payment_period_end_day
                    $payeCalculationTypeCode,               // paye_calculation_type_code
                    $payeBonusCalculationTypeCode           // paye_bonus_calculation_type_code
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $payslipId = $sqlRow['id'];
                
                // Add the payslip items to the database
                for( $k = 0; $k < count($payslips[$j]['items']); $k++ ) {
                    // Set the accrual date, if any
                    $accrualDate = null;
                    if( isset($payslips[$j]['items'][$k]['accrualDate']) ) {
                        $accrualDate = $payslips[$j]['items'][$k]['accrualDate'];
                    }
                    
                    // Calculate the payslip item total
                    $total = null;
                    if( $payslips[$j]['items'][$k]['rate'] !== null ) {
                        if( $payslips[$j]['items'][$k]['units'] !== null ) {
                            $total = $payslips[$j]['items'][$k]['rate'] * 
                            $payslips[$j]['items'][$k]['units'];
                        }
                    }
                    else if( $payslips[$j]['items'][$k]['amount'] !== null ) {
                        $total = $payslips[$j]['items'][$k]['amount'];
                    }
                    
                    $sqlQuery =
                        'INSERT INTO ' .
                            'payslip_items ( ' .
                                'payslip_id, ' .
                                'payslip_item_type_code, ' .
                                'description, ' .
                                'accrual_date, ' .
                                'auto_calculate, ' .
                                'units, ' .
                                'rate, ' .
                                'total, ' .
                                'provident_fund_id, ' .
                                'include_in_nett_pay ' .
                            ') ' .
                        'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                            ') ' . 
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $payslipId,                                         // payslip_id
                        $payslips[$j]['items'][$k]['type']['code'],         // payslip_item_type_code
                        $payslips[$j]['items'][$k]['description'],          // description
                        $accrualDate,                                       // accrual_date
                        $payslips[$j]['items'][$k]['autoCalculate'],        // auto_calculate
                        $payslips[$j]['items'][$k]['units'],                // units
                        $payslips[$j]['items'][$k]['rate'],                 // rate
                        $total,                                             // total
                        $payslips[$j]['items'][$k]['providentFund']['id'],  // provident_fund_id
                        $payslips[$j]['items'][$k]['includeInNettPay']      // include_in_nett_pay
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $payslipItemId = $sqlRow['id'];
                    
                    // Add loan payments, if any
                    if( ($payslips[$j]['items'][$k]['type']['code'] === '2008') && ($payslips[$j]['items'][$k]['loan']['id'] !== null) ) {
                        // Add the loan payment to the table
                        $sqlQuery =
                            'INSERT INTO ' .
                                'loan_payments ( ' .
                                    'loan_id, ' .
                                    'interest_rate, ' .
                                    'interest_amount, ' .
                                    'paid_amount, ' .
                                    'paid_on, ' .
                                    'payslip_item_id, ' .
                                    'added_by_user_id ' .
                                ') ' .
                            'VALUES ( ' .
                                    '$1, $2, $3, $4, $5, $6, $7 ' .
                                ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $payslips[$j]['items'][$k]['loan']['id'],               // loan_id
                            $payslips[$j]['items'][$k]['loan']['interestRate'],     // interest_rate
                            $payslips[$j]['items'][$k]['loan']['interestAmount'],   // interest_amount
                            $total,                                                 // paid_amount
                            $payslips[$j]['toDate'],                                // paid_on
                            $payslipItemId,                                         // payslip_item_id
                            null                                                    // added_by_user_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'startDate' => $startDate->format('Y-m-d H:i:s'),
                'endDate' => $endDate->format('Y-m-d H:i:s')
            ]) );
            
            return true;
        }
        
        // Function to refresh the specified payrun by generating all missing payslips, if any
        //
        // Required Parameters
        //  payrunId        The id of the payrun whose details to get
        //
        // Optional Parameters
        //  None
        function refresh($data, $user, $db) {
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
            
            $payrunId = $data['payrunId'];
            
            // Load the payrun from the payruns table
            $sqlQuery = 
                'SELECT ' .
                    'payruns.description, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date, ' .
                    'payruns.department_id, ' .
                    'payruns.created_on, ' .
                    'payruns.processed_on ' .
                'FROM ' .
                    'payruns ' .
                'WHERE ' .
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode( ['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.'] ) );
                return false;
            }
            
            // Remember the payrun details
            $sqlRow = $sqlResult->fetchAssociative();
            $departmentId = $sqlRow['department_id'];
            $startDate = new DateTime($sqlRow['from_date']);
            $endDate = new DateTime($sqlRow['to_date']);
            
            // Was the payrun processed?
            if( $sqlRow['processed_on'] != null ) {
                // echo( json_encode( ['ok' => false, 'error' => 'The specified payrun cannot be altered because it has already been processed.'] ) );
                echo( json_encode(['ok' => true]) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Get the payslips for the payrun
            $result = $this->generatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $startDate, $endDate, $departmentId);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $generatedPayslips = $result['payslips'];
            
            // Get the current payslips for the payrun
            $sqlQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.employee_id ' .
                'FROM ' .
                    'payslips ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 ' .
                'ORDER BY ' . 
                    'payslips.employee_id ASC, payslips.id ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $payrunId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Eliminate the payslips that are already in the database
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // For every generated payslip
                for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                    // Is the generated payslip for the same employee as the payslip in the database?
                    if( $generatedPayslips[$i]['employee']['id'] == $sqlRow['employee_id'] ) {
                        // Is the generated payslip for the same period or tax period as the payslip in the database?
                        if( ( ( $generatedPayslips[$i]['taxPeriod']['type'] == $sqlRow['payment_period_code'] ) && 
                              ( $generatedPayslips[$i]['employee']['paymentPeriodEndDay'] == $sqlRow['payment_period_end_day'] ) &&
                              ( $generatedPayslips[$i]['taxPeriod']['taxYear'] == $sqlRow['sars_year'] ) &&
                              ( $generatedPayslips[$i]['taxPeriod']['number'] == $sqlRow['period'] ) ) || 
                            ( ( $generatedPayslips[$i]['fromDate'] == $sqlRow['from_date'] ) && 
                              ( $generatedPayslips[$i]['toDate'] == $sqlRow['to_date'] ) ) ) {
                            // Remove the payslip from the array
                            array_splice($generatedPayslips, $i, 1);
                            break;
                        }
                    }
                }
            }
            
            // Are there no new payslips to add?
            if( count($generatedPayslips) < 1 ) {
                // Nothing to do, the payslip is up-to-date
                echo( json_encode( ['ok' => true] ) );
                return true;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE payslip_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payslips IN ACCESS EXCLUSIVE MODE', []);
            
            // Add the new payslips to the database
            for( $j = 0; $j < count($generatedPayslips); $j++ ) {
                // Add the payslip to the database
                $sqlQuery =
                    'INSERT INTO ' .
                        'payslips ( ' .
                            'payrun_id, ' .
                            'employee_id, ' .
                            'period, ' .
                            'sars_year, ' .
                            'from_date, ' .
                            'to_date, ' .
                            'status_code, ' .
                            'payment_period_code, ' .
                            'payment_period_end_day, ' .
                            'paye_calculation_type_code, ' .
                            'paye_bonus_calculation_type_code ' .
                        ') ' .
                    'VALUES ( ' .
                            '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                        ') ' .
                    'RETURNING id;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $payrunId,                                          // payrun_id
                    $generatedPayslips[$j]['employee']['id'],           // employee_id
                    $generatedPayslips[$j]['taxPeriod']['number'],      // period
                    $generatedPayslips[$j]['taxPeriod']['taxYear'],     // sars_year
                    $generatedPayslips[$j]['fromDate'],                 // from_date
                    $generatedPayslips[$j]['toDate'],                   // to_date
                    'NEWX',                                             // status_code
                    $generatedPayslips[$j]['taxPeriod']['type'],        // payment_period_code
                    $generatedPayslips[$j]['employee']['paymentPeriodEndDay'], // payment_period_end_day
                    $payeCalculationTypeCode,
                    $payeBonusCalculationTypeCode
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                $payslipId = $sqlRow['id'];
                
                // Add the payslip items to the database
                for( $k = 0; $k < count($generatedPayslips[$j]['items']); $k++ ) {
                    // Set the accrual date, if any
                    $accrualDate = null;
                    if( isset($payslips[$j]['items'][$k]['accrualDate']) ) {
                        $accrualDate = $payslips[$j]['items'][$k]['accrualDate'];
                    }
                    
                    // Calculate the payslip item total
                    $total = null;
                    if( $generatedPayslips[$j]['items'][$k]['rate'] !== null ) {
                        if( $generatedPayslips[$j]['items'][$k]['units'] !== null ) {
                            $total = $generatedPayslips[$j]['items'][$k]['rate'] * 
                            $generatedPayslips[$j]['items'][$k]['units'];
                        }
                    }
                    else if( $generatedPayslips[$j]['items'][$k]['amount'] !== null ) {
                        $total = $generatedPayslips[$j]['items'][$k]['amount'];
                    }
                    
                    $sqlQuery =
                        'INSERT INTO ' .
                            'payslip_items ( ' .
                                'payslip_id, ' .
                                'payslip_item_type_code, ' .
                                'description, ' .
                                'accrual_date, ' .
                                'auto_calculate, ' .
                                'units, ' .
                                'rate, ' .
                                'total, ' .
                                'provident_fund_id, ' .
                                'include_in_nett_pay ' .
                            ') ' .
                        'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                            ') ' . 
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $payslipId,                                                 // payslip_id
                        $generatedPayslips[$j]['items'][$k]['type']['code'],        // payslip_item_type_code
                        $generatedPayslips[$j]['items'][$k]['description'],         // description
                        $accrualDate,                                               // accrual_date
                        $generatedPayslips[$j]['items'][$k]['autoCalculate'],       // auto_calculate
                        $generatedPayslips[$j]['items'][$k]['units'],               // units
                        $generatedPayslips[$j]['items'][$k]['rate'],                // rate
                        $total,                                                     // total
                        $generatedPayslips[$j]['items'][$k]['providentFund']['id'], // provident_fund_id
                        $generatedPayslips[$j]['items'][$k]['includeInNettPay']     // include_in_nett_pay
                    ]);
                    
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
        
        // Function to get all the details of the specified payrun
        //
        // Required Parameters
        //  payrunId        The id of the payrun whose details to get
        //
        // Optional Parameters
        //  payslipStatusCode       Get only the payslips with the specified status code
        //
        // Returns
        //  [
        //      'id',                           // The payrun id
        //      'fromDate',                     // The payrun from date
        //      'toDate',                       // The payrun to date
        //      'createdOn',                    // The date the payrun was created
        //      'processedOn',                  // The date the payrun was processed
        //      'payslips' => [
        //          'id',                       // The payslip id
        //          'employee' => [
        //              'id',                   // The employee's id
        //              'name',                 // The employee's name
        //              'age',                  // The employee's age in years
        //              'paymentPeriod',        // The payment period code
        //              'paymentPeriodEndDay',           // The payment day
        //              'employmentStart',      // The employment start date
        //              'employmentEnd'         // The employment end date
        //          ],
        //          'taxPeriod' => [
        //              'type',                 // The payslip tax period type
        //              'number',               // The payslip tax period number
        //              'taxYear'               // The payslip tax period year
        //          ],
        //          'fromDate',                 // The payslip from date
        //          'toDate',                   // The payslip to date
        //          'items' => [
        //              'id',                   // The payslip item id
        //              'type' => [
        //                  'code',             // The payslip item type code
        //                  'unitCode'          // The payslip item type unit code
        //              ],
        //              'category' => [
        //                  'code'              // The payslip item category code
        //              ],
        //              'description',          // The payslip item description
        //              'accrualDate',          // The payslip item accrual date
        //              'autoCalculate',        // Whether the payslip item should be calculated automatically
        //              'units',                // The payslip item units
        //              'rate',                 // The payslip item rate
        //              'amount',               // The payslip item amount
        //              'includeInNettPay'      // Whether the amount should be included in nett pay
        //          ]
        //      ]
        //  ]
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'payslipStatusCode' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'payslipStatusCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payslipSqlParams = [];
            
            // Build where clause if a search string was given
            $payslipSqlParams[] = $data['payrunId'];
            $payslipsWhereClause = 'WHERE payslips.payrun_id = $' . count($payslipSqlParams) . ' ';
            
            // Was a payslip status code specified?
            if( $data['payslipStatusCode'] !== null ) {
                $payslipSqlParams[] = $data['payslipStatusCode'];
                $payslipsWhereClause = $payslipsWhereClause . ' AND payslips.status_code = $' . count($payslipSqlParams) . ' ';
            }
            
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
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $data['payrunId'] . '\' not found.']) );
                return false;
            }
            
            // Create payrun details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $payrun = [
                'id' => $data['payrunId'],
                'description' => $sqlRow['description'],
                'fromDate' => $sqlRow['from_date'],
                'toDate' => $sqlRow['to_date'],
                'createdOn' => $sqlRow['created_on'],
                'processedOn' => $sqlRow['processed_on'],
                'payslips' => []
            ];
            
            // Get all the payslips for the payrun
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslip_status_codes.name AS status_name, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'payslips.employee_id, ' .
                    'employees.first_name AS employee_first_name, ' .
                    'employees.last_name AS employee_last_name, ' .
                    'employees.alias AS employee_alias, ' .
                    'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.email_address ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                $payslipsWhereClause .
                'ORDER BY employees.alias ASC, payslips.employee_id ASC, payslips.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, $payslipSqlParams);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the payslip details
            $payslips = [];
            while( $payslipRow = $payslipResult->fetchAssociative() ) {
                $payslips[] = [
                    'id' => $payslipRow['id'],
                    'statusCode' => $payslipRow['status_code'],
                    'statusName' => $payslipRow['status_name'],
                    'employee' => [
                        'id' => $payslipRow['employee_id'],
                        'name' => $payslipRow['employee_alias'],
                        'age' => $payslipRow['employee_age'],
                        'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                        'emailAddress' => $payslipRow['email_address']
                    ],
                    'taxPeriod' => [
                        'type' => $payslipRow['payment_period_code'],
                        'number' => $payslipRow['period'],
                        'taxYear' => $payslipRow['sars_year']
                    ],
                    'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                    'fromDate' => $payslipRow['from_date'],
                    'toDate' => $payslipRow['to_date'],
                    'items' => []
                ];
                
                $employeeId = $payslipRow['employee_id'];
                
                // Get all the items for the specified payslip
                $itemQuery = 
                    'SELECT DISTINCT ' .
                        'payslip_items.id, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.payslip_item_unit_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_items.description, ' .
                        'payslip_items.accrual_date, ' .
                        'payslip_items.auto_calculate, ' .
                        'payslip_items.units, ' .
                        'payslip_items.rate, ' .
                        'payslip_items.total, ' .
                        'payslip_items.provident_fund_id, ' .
                        'payslip_items.include_in_nett_pay, ' .
                        'payslip_categories AS payslip_category_name, ' .
                        'payslip_categories.code, ' .
                        'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                    'WHERE ' .
                        'payslip_items.payslip_id = $1 ' .
                    'ORDER BY custom_sort, payslip_items.payslip_item_type_code ASC, payslip_items.description ASC;';
                $itemResult = $db->paramQuery($itemQuery, [
                    $payslipRow['id']
                ]);
                if( !$itemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Set the payslip item details
                $items = [];
                while( $itemRow = $itemResult->fetchAssociative() ) {
                    $units = $itemRow['units'];
                    if( $units !== null ) $units = doubleval($units);
                    
                    $rate = $itemRow['rate'];
                    if( $rate !== null ) $rate = doubleval($rate);
                    
                    $amount = $itemRow['total'];
                    if( $amount !== null ) $amount = doubleval($amount);
                    
                    $providentFundId = $itemRow['provident_fund_id'];
                    $employeeAmount = null;
                    $employerAmount = null;
                    $rfiItems = [];
                    
                    // Is it a provident fund item?
                    if( $providentFundId !== null ) {
                        // Load the provident fund details
                        $providentFundQuery = 
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
                            'WHERE ' . 
                                'provident_funds.is_active IS TRUE AND ' .
                                'provident_funds.id = $1 ' .
                            'ORDER BY ' . 
                                'provident_funds.name ASC;';
                        $providentResult = $db->paramQuery($providentFundQuery, [$providentFundId]);
                        if( !$providentResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        $providentFundRow = $providentResult->fetchAssociative();
                        $employeeAmount = doubleval( $providentFundRow['employee_amount'] );
                        $employerAmount = doubleval( $providentFundRow['employer_amount'] );
                        
                        // Is the provident fund calculation based on retirement fund income items?
                        if( $providentFundRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
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
                            $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $employeeId]);
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
                    }
                    
                    $items[] = [
                        'id' => $itemRow['id'],
                        'type' => [
                            'code' => $itemRow['payslip_item_type_code'],
                            'unitCode' => $itemRow['payslip_item_unit_code'],
                        ],
                        'category' => [
                            'code' => $itemRow['payslip_category_code'],
                            'name' => $itemRow['payslip_category_name']
                        ],
                        'providentFund' => [
                            'id' => $providentFundId,
                            'employeeAmount' => $employeeAmount,
                            'employerAmount' => $employerAmount,
                            'rfiItems' => $rfiItems
                        ],
                        'loan' => [
                            'id' => null
                        ],
                        'description' => $itemRow['description'],
                        'accrualDate' => $itemRow['accrual_date'],
                        'autoCalculate' => $itemRow['auto_calculate'],
                        'units' => $units,
                        'rate' => $rate,
                        'amount' => $amount,
                        'includeInNettPay' => $itemRow['include_in_nett_pay']
                    ];
                }
                
                // Add the payslip items to the payslip
                $payslips[count($payslips)-1]['items'] = $items;
            }
            
            // // Is the payrun not processed?
            // if( $payrun['processedOn'] == null ) {
            //     // Get the PAYE Calculation method for the company
            //     $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            //     $sqlResult = $db->paramQuery($sqlQuery, []);
            //     if( !$sqlResult->isValid() ) {
            //         echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //         return false;
            //     }
                
            //     if( $sqlResult->getRowCount() !== 1 ) {
            //         echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
            //         return false;
            //     }
                
            //     $sqlRow = $sqlResult->fetchAssociative();
            //     $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            //     $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
                
            //     // Re-calculate the payslips
            //     $result = $this->recalculatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $payslips);
            //     if( $result['ok'] !== true ) {
            //         echo( json_encode(['ok' => false, 'error' => $result['error']]) );
            //         return false;
            //     }
            //     $payslips = $result['payslips'];
            // }
            
            // Add the payslips to the payrun
            $payrun['payslips'] = $payslips;
            
            // Send result
            echo( json_encode(['ok' => true, 'payrun' => $payrun]) );
            return true;
        }

        public function getPayeOverDeductionCredit($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'payslipStatusCode' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'payslipStatusCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payslipSqlParams = [];
            
            // Build where clause if a search string was given
            $payslipSqlParams[] = $data['payrunId'];
            $payslipsWhereClause = 'WHERE payslips.payrun_id = $' . count($payslipSqlParams) . ' ';
            
            // Was a payslip status code specified?
            if( $data['payslipStatusCode'] !== null ) {
                $payslipSqlParams[] = $data['payslipStatusCode'];
                $payslipsWhereClause = $payslipsWhereClause . ' AND payslips.status_code = $' . count($payslipSqlParams) . ' ';
            }
            
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
            $sqlResult = $db->paramQuery($sqlQuery, [$data['payrunId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $data['payrunId'] . '\' not found.']) );
                return false;
            }
            
            // Create payrun details
            $sqlRow = $sqlResult->fetchAssociative();
            
            $payrun = [
                'id' => $data['payrunId'],
                'description' => $sqlRow['description'],
                'fromDate' => $sqlRow['from_date'],
                'toDate' => $sqlRow['to_date'],
                'createdOn' => $sqlRow['created_on'],
                'processedOn' => $sqlRow['processed_on'],
                'payslips' => []
            ];
            
            // Get all the payslips for the payrun
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslip_status_codes.name AS status_name, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'payslips.employee_id, ' .
                    'employees.first_name AS employee_first_name, ' .
                    'employees.last_name AS employee_last_name, ' .
                    'employees.alias AS employee_alias, ' .
                    'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.email_address ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                $payslipsWhereClause .
                'ORDER BY employees.alias ASC, payslips.employee_id ASC, payslips.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, $payslipSqlParams);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the payslip details
            $payslips = [];
            while( $payslipRow = $payslipResult->fetchAssociative() ) {
                $payslips[] = [
                    'id' => $payslipRow['id'],
                    'statusCode' => $payslipRow['status_code'],
                    'statusName' => $payslipRow['status_name'],
                    'employee' => [
                        'id' => $payslipRow['employee_id'],
                        'name' => $payslipRow['employee_alias'],
                        'age' => $payslipRow['employee_age'],
                        'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                        'emailAddress' => $payslipRow['email_address']
                    ],
                    'taxPeriod' => [
                        'type' => $payslipRow['payment_period_code'],
                        'number' => $payslipRow['period'],
                        'taxYear' => $payslipRow['sars_year']
                    ],
                    'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                    'fromDate' => $payslipRow['from_date'],
                    'toDate' => $payslipRow['to_date'],
                    'items' => []
                ];
    
                //$employeeId = $payslipRow['employee_id'];
                
                // Get all the items for the specified payslip
                $itemQuery = 
                    'SELECT DISTINCT ' .
                        'payslip_items.id, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.payslip_item_unit_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_items.description, ' .
                        'payslip_items.accrual_date, ' .
                        'payslip_items.auto_calculate, ' .
                        'payslip_items.units, ' .
                        'payslip_items.rate, ' .
                        'payslip_items.total, ' .
                        'payslip_items.provident_fund_id, ' .
                        'payslip_items.include_in_nett_pay, ' .
                        'payslip_categories AS payslip_category_name, ' .
                        'payslip_categories.code, ' .
                        'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                    'WHERE ' .
                        'payslip_items.payslip_id = $1 ' .
                    'ORDER BY custom_sort, payslip_items.payslip_item_type_code ASC, payslip_items.description ASC;';
                $itemResult = $db->paramQuery($itemQuery, [
                    $payslipRow['id']
                ]);
                if( !$itemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Set the payslip item details
                $items = [];
                while( $itemRow = $itemResult->fetchAssociative() ) {
                    $units = $itemRow['units'];
                    if( $units !== null ) $units = doubleval($units);
                    
                    $rate = $itemRow['rate'];
                    if( $rate !== null ) $rate = doubleval($rate);
                    
                    $amount = $itemRow['total'];
                    if( $amount !== null ) $amount = doubleval($amount);
                    
                    $providentFundId = $itemRow['provident_fund_id'];
                    $employeeAmount = null;
                    $employerAmount = null;
                    $rfiItems = [];
                    
                    // Is it a provident fund item?
                    if( $providentFundId !== null ) {
                        // Load the provident fund details
                        $providentFundQuery = 
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
                            'WHERE ' . 
                                'provident_funds.is_active IS TRUE AND ' .
                                'provident_funds.id = $1 ' .
                            'ORDER BY ' . 
                                'provident_funds.name ASC;';
                        $providentResult = $db->paramQuery($providentFundQuery, [$providentFundId]);
                        if( !$providentResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        $providentFundRow = $providentResult->fetchAssociative();
                        $employeeAmount = doubleval( $providentFundRow['employee_amount'] );
                        $employerAmount = doubleval( $providentFundRow['employer_amount'] );
                        
                        // Is the provident fund calculation based on retirement fund income items?
                        if( $providentFundRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
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
                            $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $employeeId]);
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
                    }
                    
                    $items[] = [
                        'id' => $itemRow['id'],
                        'type' => [
                            'code' => $itemRow['payslip_item_type_code'],
                            'unitCode' => $itemRow['payslip_item_unit_code'],
                        ],
                        'category' => [
                            'code' => $itemRow['payslip_category_code'],
                            'name' => $itemRow['payslip_category_name']
                        ],
                        'providentFund' => [
                            'id' => $providentFundId,
                            'employeeAmount' => $employeeAmount,
                            'employerAmount' => $employerAmount,
                            'rfiItems' => $rfiItems
                        ],
                        'loan' => [
                            'id' => null
                        ],
                        'description' => $itemRow['description'],
                        'accrualDate' => $itemRow['accrual_date'],
                        'autoCalculate' => $itemRow['auto_calculate'],
                        'units' => $units,
                        'rate' => $rate,
                        'amount' => $amount,
                        'includeInNettPay' => $itemRow['include_in_nett_pay']
                    ];
                }
                
                // Add the payslip items to the payslip
                $payslips[count($payslips)-1]['items'] = $items;

                // Call the calculateTaxCorrection method to get the total tax correction
                $employeeId = $payslipRow['employee_id'];
                $sarsYear = $payslipRow['sars_year'];
                $generatedPayslips = $payslips;
                $payeBonusCalculationTypeCode = $payslipRow['paye_bonus_calculation_type_code'];

                $taxCorrectionResult = $this->calculatePayeOverDeductionCorrection($db, $employeeId, $sarsYear, $generatedPayslips);

                if ($taxCorrectionResult['ok'] === true) {

                    // Add the calculated tax over deduction to the payslip
                    $payslips[count($payslips) - 1]['taxOverDeduction'] = $taxCorrectionResult['overDeductionAmount'];
        
                    // Add the calculated tax correction to the payslip
                    $payslips[count($payslips) - 1]['taxCorrection'] = $taxCorrectionResult['taxCorrectionAmount'];

                } else {
                    echo json_encode(['ok' => false, 'error' => $taxCorrectionResult['error']]);
                    return false;
                }

            }
            
            // Add the payslips to the payrun
            $payrun['payslips'] = $payslips;
            
            // Send result
            echo( json_encode(['ok' => true, 'payrun' => $payrun]) );
            return true;
        }
        
        // Function to list payruns
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
                'departmentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true]
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
                $whereClause = $whereClause . ' WHERE (CAST(payruns.from_date AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ';
                $whereClause = $whereClause . ' OR CAST(payruns.to_date AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ';
                $whereClause = $whereClause . ' OR departments.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ';
                $whereClause = $whereClause . ' OR payruns.description ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
                        case 'description':
                            $column = 'payruns.description';
                            break;
                        case 'departmentName':
                            $column = 'departments.name';
                            break;
                        case 'fromDate':
                            $column = 'payruns.from_date';
                            break;
                        case 'toDate':
                            $column = 'payruns.to_date';
                            break;
                        case 'createdOn':
                            $column = 'payruns.created_on';
                            break;
                        case 'isProcessed':
                            $column = 'CASE WHEN payruns.processed_on IS NULL THEN \'N\' ELSE \'Y\' END';
                            break;
                        case 'processedOn':
                            $column = 'payruns.processed_on';
                            break;
                        case 'exportedOn':
                            $column = 'export_history.exported_on::timestamp::date';
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
                'WITH export_history AS ( ' . 
                    'SELECT ' . 
                        'payrun_id, MAX(exported_on) AS exported_on ' . 
                    'FROM ' . 
                        'accounting_export_history ' . 
                    'GROUP BY ' . 
                        'payrun_id ' .
                ') ' .
                'SELECT DISTINCT ' .
                    'payruns.id, ' .
                    'payruns.description, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date, ' .
                    'payruns.department_id, ' .
                    'departments.name AS department_name, ' .
                    'payruns.created_on, ' .
                    'CASE WHEN payruns.processed_on IS NULL THEN \'N\' ELSE \'Y\' END, ' .
                    'payruns.processed_on, ' .
                    'export_history.exported_on::timestamp::date AS exported_on ' .
                'FROM ' .
                    'payruns ' .
                'LEFT JOIN ' .
                    'departments ON departments.id = payruns.department_id ' .
                'LEFT JOIN ' .
                    'export_history ON export_history.payrun_id = payruns.id ' .
                $whereClause . ' ' .
                $sortClause . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payruns array
            $payruns = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $isProcessed = false;
                if( $sqlRow['processed_on'] !== null ) $isProcessed = true;
                
                $payruns[] = [
                    'id' => $sqlRow['id'],
                    'description' => $sqlRow['description'],
                    'fromDate' => $sqlRow['from_date'],
                    'toDate' => $sqlRow['to_date'],
                    'departmentId' => $sqlRow['department_id'],
                    'departmentName' => $sqlRow['department_name'],
                    'createdOn' => $sqlRow['created_on'],
                    'isProcessed' => $isProcessed,
                    'processedOn' => $sqlRow['processed_on'],
                    'exportedOn' => $sqlRow['exported_on']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'payruns' => $payruns
            ]) );
            
            return true;
        }
        
        // Function to to update the specified payrun's details
        //
        // Required Parameters
        //  payrun                An array describing the payrun
        //
        //  payrun = [
        //      'id',                       // The payrun id
        //      'payslips' => [
        //          'id',                   // The id of the payslip to edit
        //          'delete',               // Whether the payslip should be deleted (true or false) [optional]
        //          'employee' => [
        //              'id',               // The id of the payslip employee
        //          ],
        //          'taxPeriod' => [
        //              'number',           // The payslip tax period number
        //              'taxYear'           // The payslip tax period year
        //          ],
        //          'fromDate',             // The payslip from date
        //          'toDate',               // The payslip to date
        //          'items' => [
        //              'id',               // The id of the item to edit (null indicates a new item)
        //              'delete',           // Whether the item should be deleted (true or false) [optional]
        //              'type' => [
        //                  'code'          // The payslip item type code
        //              ],
        //              'description',      // The payslip item description
        //              'accrualDate',      // The payslip item accrual date
        //              'autoCalculate',    // Should the payslip item be calculated automatically (true or false)
        //              'units',            // The payslip item units
        //              'rate',             // The payslip item rate
        //              'amount',           // The payslip item amount
        //              'includeInNettPay'  // Whether the amount should be included in nett pay
        //          ]
        //      ]
        //  ]
        //
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payrun' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                    'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                    'delete' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                    'payslips' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                        ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                            'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                            'delete' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                            'statusCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                            'fromDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                            'toDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                            'employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                            ]],
                            'taxPeriod' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'number' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                                'taxYear' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                            ]],
                            'items' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                                ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                    'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                    'delete' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                                    'type' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                        'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                                    ]],
                                    'providentFund' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                        'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                        'employeeAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                        'employerAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                        'rfiItems' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                                            ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                                'payslipItemTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                                                'percentage' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
                                            ]]
                                        ]]
                                    ]],
                                    'loan' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                        'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
                                    ]],
                                    'accrualDate' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => true],
                                    'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                                    'autoCalculate' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                                    'units' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                    'rate' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                    'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                    'includeInNettPay' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
                                ]]
                            ]]
                        ]]
                    ]]
                ]]
            ]);
        
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrun = $data['payrun'];
            $payrunId = $payrun['id'];
            
            // Try to find the specified payrun
            $sqlQuery = 'SELECT processed_on FROM payruns WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() != 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] !== null ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' cannot be updated because it has already been processed.']) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the payslips and payslip_items tables
            $db->paramQuery('LOCK TABLE payslip_items IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payslips IN ACCESS EXCLUSIVE MODE', []);
            
            // Sort the payslips by employee id and date
            array_multisort(array_column($payrun['payslips'], 'employee'),  SORT_ASC,
                array_column($payrun['payslips'], 'toDate'), SORT_ASC,
                $payrun['payslips']);
                
// echo( json_encode(['ok' => false, 'error' => print_r($payrun['payslips'])]) );
// return false;
                
            // For every payslip
            foreach( $payrun['payslips'] as $payslip ) {
                $payslipId = $payslip['id'];
                
                // Was no payslip id specified?
                if( $payslipId == null ) {
                    // Add the payslip to the database
                    $sqlQuery =
                        'INSERT INTO ' .
                            'payslips ( ' .
                                'payrun_id, ' .
                                'employee_id, ' .
                                'period, ' .
                                'sars_year, ' .
                                'from_date, ' .
                                'to_date, ' .
                                'status_code, ' .
                                'payment_period_code, ' .
                                'payment_period_end_day, ' .
                                'paye_calculation_type_code, ' .
                                'paye_bonus_calculation_type_code ' .
                            ') ' .
                        'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            ') ' .
                        'RETURNING id;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $payrunId,                          // payrun_id
                        $payslip['employee']['id'],         // employee_id
                        $payslip['taxPeriod']['number'],    // period
                        $payslip['taxPeriod']['taxYear'],   // sars_year
                        $payslip['fromDate'],               // from_date
                        $payslip['toDate'],                 // to_date
                        $payslip['statusCode'],             // status_code
                        $payslip['taxPeriod']['type'],      // payment_period_code
                        $payslip['employee']['paymentPeriodEndDay'],  // payment_period_end_day
                        $payeCalculationTypeCode,
                        $payeBonusCalculationTypeCode
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    $payslipId = $sqlRow['id'];
                    
                    // Were no items specified?
                    if( !array_key_exists('items', $payslip) ) {
                        // Go to next payslip, if any
                        continue;
                    }
                    
                    // Add the payslip items to the database
                    foreach( $payslip['items'] as $item ) {
                        // Set the accrual date, if any
                        $accrualDate = null;
                        if( isset($item['accrualDate']) ) {
                            $accrualDate = $item['accrualDate'];
                        }
                        
                        // Calculate the payslip item total
                        $total = null;
                        if( $item['rate'] !== null ) {
                            if( $item['units'] !== null ) {
                                $total = $item['rate'] * $item['units'];
                            }
                        }
                        else if( $item['amount'] !== null ) {
                            $total = $item['amount'];
                        }
                        
                        $sqlQuery =
                            'INSERT INTO ' .
                                'payslip_items ( ' .
                                    'payslip_id, ' .
                                    'payslip_item_type_code, ' .
                                    'description, ' .
                                    'accrual_date, ' .
                                    'auto_calculate, ' .
                                    'units, ' .
                                    'rate, ' .
                                    'total, ' .
                                    'provident_fund_id, ' .
                                    'include_in_nett_pay ' .
                                ') ' .
                            'VALUES ( ' .
                                    '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                                ') ' .
                            'RETURNING id;';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $payslipId,                     // payslip_id
                            $item['type']['code'],          // payslip_item_type_code
                            $item['description'],           // description
                            $accrualDate,                   // accrual_date
                            $item['autoCalculate'],         // auto_calculate
                            $item['units'],                 // units
                            $item['rate'],                  // rate
                            $total,                         // total
                            $item['providentFund']['id'],   // provident_fund_id
                            $item['includeInNettPay']       // include_in_nett_pay
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        $sqlRow = $sqlResult->fetchAssociative();
                        $payslipItemId = $sqlRow['id'];
                        
                        // Add loan payments, if any
                        if( ($item['type']['code'] === '2008') && ($item['loan']['id'] !== null) ) {
                            $loanCapitalPaidAdjustment = 0.00;
                            $loanNumPaymentsAdjustment = 0;
                            
                            if( !array_key_exists('loanCapitalPaidAdjustment', $item['loan']) ) {
                                $item['loan'] = [
                                    'id' => $item['loan']['id'],
                                    'loanCapitalPaidAdjustment' => 0.00,
                                    'loanNumPaymentsAdjustment' => 0
                                ];
                            }
                            else {
                                $loanCapitalPaidAdjustment = $item['loan']['loanCapitalPaidAdjustment'];
                                $loanNumPaymentsAdjustment = $item['loan']['loanNumPaymentsAdjustment'];
                            }
                            
                            // Calculate the loan payment amount
                            $result = $this->calculateLoanPayment( 
                                $db, 
                                $item['loan']['id'], 
                                $payslip['taxPeriod']['type'], 
                                $payslip['toDate'], 
                                $loanCapitalPaidAdjustment, 
                                $loanNumPaymentsAdjustment 
                            );
                            if( $result['ok'] !== true ) {
                                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                                return false;
                            }
                            $payment = $result['payment'];
                            
                            $item['loan']['loanCapitalPaidAdjustment'] = $loanCapitalPaidAdjustment + $payment['capitalAmount'];
                            $item['loan']['loanNumPaymentsAdjustment'] = $loanNumPaymentsAdjustment  + 1;
                            
                            // Add the loan payment to the table
                            $sqlQuery =
                                'INSERT INTO ' .
                                    'loan_payments ( ' .
                                        'loan_id, ' .
                                        'interest_rate, ' .
                                        'interest_amount, ' .
                                        'paid_amount, ' .
                                        'paid_on, ' .
                                        'payslip_item_id, ' .
                                        'added_by_user_id ' .
                                    ') ' .
                                'VALUES ( ' .
                                        '$1, $2, $3, $4, $5, $6, $7 ' .
                                    ');';
                            $sqlResult = $db->paramQuery($sqlQuery, [
                                $item['loan']['id'],            // loan_id
                                $payment['interestRate'],       // interest_rate
                                $payment['interestAmount'],     // interest_amount
                                $payment['instalmentAmount'],   // paid_amount
                                $payslip['toDate'],             // paid_on
                                $payslipItemId,                 // payslip_item_id
                                null                            // added_by_user_id
                            ]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                        }
                    }
                    
                    // Go to next payslip, if any
                    continue;
                }
                
                // Try to find the specified payslip in the specified payrun
                $sqlQuery = 'SELECT id FROM payslips WHERE id = $1 AND payrun_id = $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [$payslipId, $payrunId]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                if( $sqlResult->getRowCount() != 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'Payslip \'' . $payslipId . '\' of payrun \'' . $payrunId . '\' not found.']) );
                    return false;
                }
                
                // Was the delete key specified?
                if( array_key_exists('delete', $payslip) ) {
                    // Should the payslip be deleted?
                    if( $payslip['delete'] === true ) {
                        // Mark the specified payslip as deleted
                        $sqlQuery = 'UPDATE payslips SET status_code = \'DELE\' WHERE id = $1;';
                        $sqlResult = $db->paramQuery($sqlQuery, [$payslipId]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        // Go to next payslip, if any
                        continue;
                    }
                }
                
                // Are we activating a payslip?
                if( $payslip['statusCode'] === 'ACTI' ) {
                    // Make certain that the pasylip period does not overlap with an existing active
                    // payslip
                    // ...
                }
                
                // Update the payslip details
                $sqlQuery =
                    'UPDATE payslips SET ' .
                        'payrun_id = $1, ' .
                        'employee_id = $2, ' .
                        'period = $3, ' .
                        'sars_year = $4, ' .
                        'from_date = $5, ' .
                        'to_date = $6, ' .
                        'status_code = $7, ' .
                        'payment_period_code = $8, ' .
                        'payment_period_end_day = $9, ' .
                        'paye_calculation_type_code = $10, ' .
                        'paye_bonus_calculation_type_code = $11 ' .
                    'WHERE ' . 
                        'id = $12;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $payrunId,                          // payrun_id
                    $payslip['employee']['id'],         // employee_id
                    $payslip['taxPeriod']['number'],    // period
                    $payslip['taxPeriod']['taxYear'],   // sars_year
                    $payslip['fromDate'],               // from_date
                    $payslip['toDate'],                 // to_date
                    $payslip['statusCode'],             // status_code
                    $payslip['taxPeriod']['type'],      // payment_period_code
                    $payslip['employee']['paymentPeriodEndDay'], // payment_period_end_day
                    $payeCalculationTypeCode,           // paye_calculation_type_code
                    $payeBonusCalculationTypeCode,      // paye_bonus_calculation_type_code
                    $payslipId                          // id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Were no items specified?
                if( !array_key_exists('items', $payslip) ) {
                    // Go to next payslip, if any
                    continue;
                }
                
                // For every payslip item 
                foreach( $payslip['items'] as $item ) {
                    $itemId = $item['id'];
                    
                    // Add the item if no item id was specified
                    if( $itemId == null ) {
                        // Set the accrual date, if any
                        $accrualDate = null;
                        if( isset($item['accrualDate']) ) {
                            $accrualDate = $item['accrualDate'];
                        }
                        
                        // Calculate the payslip item total
                        $total = null;
                        if( $item['rate'] !== null ) {
                            if( $item['units'] !== null ) {
                                $total = $item['rate'] * $item['units'];
                            }
                        }
                        else if( $item['amount'] !== null ) {
                            $total = $item['amount'];
                        }
                        
                        $sqlQuery =
                            'INSERT INTO ' .
                                'payslip_items ( ' .
                                    'payslip_id, ' .
                                    'payslip_item_type_code, ' .
                                    'description, ' .
                                    'accrual_date, ' .
                                    'auto_calculate, ' .
                                    'units, ' .
                                    'rate, ' .
                                    'total, ' .
                                    'provident_fund_id, ' .
                                    'include_in_nett_pay ' .
                                ') ' .
                            'VALUES ( ' .
                                    '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ' .
                                ') ' . 
                            'RETURNING id;';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $payslipId,                     // payslip_id
                            $item['type']['code'],          // payslip_item_type_code
                            $item['description'],           // description
                            $accrualDate,                   // accrual_date
                            $item['autoCalculate'],         // auto_calculate
                            $item['units'],                 // units
                            $item['rate'],                  // rate
                            $total,                         // total
                            $item['providentFund']['id'],   // provident_fund_id
                            $item['includeInNettPay'],      // include_in_nett_pay
                        ]);
                        
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        $sqlRow = $sqlResult->fetchAssociative();
                        $itemId = $sqlRow['id'];
                        
                        // Add loan payments, if any
                        if( ($item['type']['code'] === '2008') && ($item['loan']['id'] !== null) ) {
                            $loanCapitalPaidAdjustment = 0.00;
                            $loanNumPaymentsAdjustment = 0;
                            
                            if( !array_key_exists('loanCapitalPaidAdjustment', $item['loan']) ) {
                                $item['loan'] = [
                                    'id' => $item['loan']['id'],
                                    'loanCapitalPaidAdjustment' => 0.00,
                                    'loanNumPaymentsAdjustment' => 0
                                ];
                            }
                            else {
                                $loanCapitalPaidAdjustment = $item['loan']['loanCapitalPaidAdjustment'];
                                $loanNumPaymentsAdjustment = $item['loan']['loanNumPaymentsAdjustment'];
                            }
                            
                            // Calculate the loan payment amount
                            $result = $this->calculateLoanPayment( 
                                $db, 
                                $item['loan']['id'], 
                                $payslip['taxPeriod']['type'], 
                                $payslip['toDate'], 
                                $loanCapitalPaidAdjustment, 
                                $loanNumPaymentsAdjustment 
                            );
                            if( $result['ok'] !== true ) {
                                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                                return false;
                            }
                            $payment = $result['payment'];
                            
                            $item['loan']['loanCapitalPaidAdjustment'] = $loanCapitalPaidAdjustment + $payment['capitalAmount'];
                            $item['loan']['loanNumPaymentsAdjustment'] = $loanNumPaymentsAdjustment  + 1;
                            
                            // Add the loan payment to the table
                            $sqlQuery =
                                'INSERT INTO ' .
                                    'loan_payments ( ' .
                                        'loan_id, ' .
                                        'interest_rate, ' .
                                        'interest_amount, ' .
                                        'paid_amount, ' .
                                        'paid_on, ' .
                                        'payslip_item_id, ' .
                                        'added_by_user_id ' .
                                    ') ' .
                                'VALUES ( ' .
                                        '$1, $2, $3, $4, $5, $6, $7 ' .
                                    ');';
                            $sqlResult = $db->paramQuery($sqlQuery, [
                                $item['loan']['id'],            // loan_id
                                $payment['interestRate'],       // interest_rate
                                $payment['interestAmount'],     // interest_amount
                                $payment['instalmentAmount'],   // paid_amount
                                $payslip['toDate'],             // paid_on
                                $itemId,                        // payslip_item_id
                                null                            // added_by_user_id
                            ]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                        }
                        
                        // Go to next item, if any
                        continue;
                    }
                    
                    // Try to find the specified item in the specified payslip
                    $sqlQuery = 'SELECT id FROM payslip_items WHERE id = $1 AND payslip_id = $2;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$itemId, $payslipId]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    if( $sqlResult->getRowCount() != 1 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Payslip item \'' . $itemId . '\' of payslip \'' . $payslipId . '\' not found.']) );
                        return false;
                    }
                    
                    // Was the delete key specified?
                    if( array_key_exists('delete', $item) ) {
                        // Should the item be deleted?
                        if( $item['delete'] === true ) {
                            // Delete loan payments, if any
                            $sqlQuery = 'DELETE FROM loan_payments WHERE payslip_item_id = $1;';
                            $sqlResult = $db->paramQuery($sqlQuery, [$itemId]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            
                            // Delete the payslip item
                            $sqlQuery = 'DELETE FROM payslip_items WHERE id = $1;';
                            $sqlResult = $db->paramQuery($sqlQuery, [$itemId]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            
                            // Go to next item, if any
                            continue;
                        }
                    }
                    
                    // Update the specified payslip item
                    
                    // Set the accrual date, if any
                    $accrualDate = null;
                    if( isset($item['accrualDate']) ) {
                        $accrualDate = $item['accrualDate'];
                    }
                    
                    // Calculate the payslip item total
                    $total = null;
                    if( $item['rate'] !== null ) {
                        if( $item['units'] !== null ) {
                            $total = $item['rate'] * $item['units'];
                        }
                    }
                    else if( $item['amount'] !== null ) {
                        $total = $item['amount'];
                    }
                    
                    $sqlQuery =
                        'UPDATE ' .
                            'payslip_items ' .
                        'SET ' .
                            'payslip_id = $2, ' .
                            'payslip_item_type_code = $3, ' .
                            'description = $4, ' .
                            'accrual_date = $5, ' .
                            'auto_calculate = $6, ' .
                            'units = $7, ' .
                            'rate = $8, ' .
                            'total = $9, ' .
                            'include_in_nett_pay = $10 ' .
                        'WHERE ' .
                            'id = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $itemId,                  // id
                        $payslipId,               // payslip_id
                        $item['type']['code'],    // payslip_item_type_code
                        $item['description'],     // description
                        $accrualDate,             // accrual_date
                        $item['autoCalculate'],   // auto_calculate
                        $item['units'],           // units
                        $item['rate'],            // rate
                        $total,                   // total
                        $item['includeInNettPay'] // auto_calculate
                    ]);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Update loan payments, if any
                    if( ($item['type']['code'] === '2008') && ($item['loan']['id'] !== null) ) {
                        $loanCapitalPaidAdjustment = 0.00;
                        $loanNumPaymentsAdjustment = 0;
                        
                        if( !array_key_exists('loanCapitalPaidAdjustment', $item['loan']) ) {
                            $item['loan'] = [
                                'id' => $item['loan']['id'],
                                'loanCapitalPaidAdjustment' => 0.00,
                                'loanNumPaymentsAdjustment' => 0
                            ];
                        }
                        else {
                            $loanCapitalPaidAdjustment = $item['loan']['loanCapitalPaidAdjustment'];
                            $loanNumPaymentsAdjustment = $item['loan']['loanNumPaymentsAdjustment'];
                        }
                        
                        // Calculate the loan payment amount
                        $result = $this->calculateLoanPayment( 
                            $db, 
                            $item['loan']['id'], 
                            $payslip['taxPeriod']['type'], 
                            $payslip['toDate'], 
                            $loanCapitalPaidAdjustment, 
                            $loanNumPaymentsAdjustment 
                        );
                        if( $result['ok'] !== true ) {
                            echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                            return false;
                        }
                        $payment = $result['payment'];
                        
                        $item['loan']['loanCapitalPaidAdjustment'] = $loanCapitalPaidAdjustment + $payment['capitalAmount'];
                        $item['loan']['loanNumPaymentsAdjustment'] = $loanNumPaymentsAdjustment  + 1;
                        
                        // Add the loan payment to the table
                        $sqlQuery =
                            'UPDATE ' .
                                'loan_payments ' . 
                            'SET ' . 
                                'interest_rate = $1, ' .
                                'interest_amount = $2, ' .
                                'paid_amount = $3, ' .
                                'paid_on = $4, ' .
                                'added_by_user_id = $5 ' .
                            'WHERE ' .
                                 'loan_id = $6 AND ' .
                                 'payslip_item_id = $7;';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $payment['interestRate'],       // interest_rate
                            $payment['interestAmount'],     // interest_amount
                            $payment['instalmentAmount'],   // paid_amount
                            $payslip['toDate'],             // paid_on
                            null,                           // added_by_user_id
                            $item['loan']['id'],            // loan_id
                            $itemId                         // payslip_item_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to remove the specified payrun
        //
        // Required Parameters
        //  payrunId        The id of the payrun to delete
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
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE accounting_export_history IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE accounting_export_transaction_history IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE loan_payments IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payruns IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payslip_items IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE payslips IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE uif_electronic_declartion_history IN EXCLUSIVE MODE;');
            
            // Check if the specified payrun already been processed.
            $sqlQuery = 'SELECT processed_on FROM payruns WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() != 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] !== null ) {
                echo( json_encode(['ok' => false, 'error' => 'The payrun cannot be removed because it has already been processed.']) );
                return false;
            }
            
            // Delete the accounting export history
            $sqlQuery = 'DELETE FROM accounting_export_transaction_history WHERE accounting_export_history_id IN( ' . 
                'SELECT id FROM accounting_export_history WHERE payrun_id = $1 ' . 
            ');';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the accounting export history
            $sqlQuery = 'DELETE FROM accounting_export_history WHERE payrun_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove reference to the payrun form uif declarations
            $sqlQuery = 'UPDATE uif_electronic_declartion_history SET payrun_id = NULL WHERE payrun_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the loan payments
            $sqlQuery = 'DELETE FROM loan_payments WHERE payslip_item_id IN( SELECT id FROM payslip_items WHERE payslip_id IN( SELECT id FROM payslips WHERE payrun_id = $1 ) );';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the payrun payslip items
            $sqlQuery = 'DELETE FROM payslip_items WHERE payslip_id IN( SELECT id FROM payslips WHERE payrun_id = $1 );';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the payrun payslips
            $sqlQuery = 'DELETE FROM payslips WHERE payrun_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Delete the specified payrun
            $sqlQuery = 'DELETE FROM payruns WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to process the specified payrun
        //
        // Required Parameters
        //  payrunId        The id of the payrun to process
        //
        // Optional Parameters
        //  None
        public function process($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'emailPayslips' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            $emailPayslips = $data['emailPayslips'];
            
            // Check if the specified payrun already been processed.
            $sqlQuery = 'SELECT processed_on FROM payruns WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() != 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] !== null ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' has already been processed.']) );
                return false;
            }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE loans IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payruns IN ACCESS EXCLUSIVE MODE', []);
            
            // Get all the payslips for the payrun to do sanity checks 
            $sqlQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'payslips.employee_id, ' .
                    'employees.alias AS employee_name ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 AND ' .
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY ' . 
                    'payslips.employee_id ASC, payslips.id ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $payrunId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $payslips = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $payslips[] = [
                    'id' => $sqlRow['id'],
                    'employee' => [
                        'id' => $sqlRow['employee_id'],
                        'name' => $sqlRow['employee_name']
                    ],
                    'taxPeriod' => [
                        'type' => $sqlRow['payment_period_code'],
                        'number' => $sqlRow['period'],
                        'taxYear' => $sqlRow['sars_year']
                    ],
                    'payeBonusCalculationTypeCode' => $sqlRow['paye_bonus_calculation_type_code'],
                    'fromDate' => $sqlRow['from_date'],
                    'toDate' => $sqlRow['to_date']
                ];
            }
            
            // Are there no payslips
            if( count( $payslips ) <= 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'The payrun cannot be processed because there are no payslips in the payrun.']) );
                return false;
            }
            
            // For every payslip in the payrun
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Check that the payslip isn't in conflict with any payslips from other payruns
                $sqlQuery = 
                    'SELECT DISTINCT ' .
                        'payslips.id ' .
                    'FROM ' .
                        'payslips ' .
                    'LEFT JOIN ' .
                        'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payruns.processed_on IS NOT NULL AND ' .
                        'payslips.payrun_id != $1 AND ' .
                        'payslips.employee_id = $2 AND ' .
                        'payslips.status_code = \'ACTI\' AND ' .
                        '( ' . 
                            '( ' . 
                                'payslips.sars_year = $3 AND ' .
                                'payslips.payment_period_code = $4 AND ' .
                                'payslips.period = $5 ' .
                            ') OR ' .
                            '( ' . 
                                '( ' . 
                                    'payslips.from_date >= $6 AND ' .
                                    'payslips.from_date <= $7 ' .
                                ') OR ' .
                                '( ' . 
                                    'payslips.to_date >= $6 AND ' .
                                    'payslips.to_date <= $7 ' .
                                ') ' .
                            ') ' .
                        ');';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $payrunId,
                    $payslips[$i]['employee']['id'],
                    $payslips[$i]['taxPeriod']['taxYear'],
                    $payslips[$i]['taxPeriod']['type'],
                    $payslips[$i]['taxPeriod']['number'],
                    $payslips[$i]['fromDate'],
                    $payslips[$i]['toDate']
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // If we have a row then that payslip is in conflict
                if( $sqlResult->getRowCount() >= 1 ) {
                    echo( json_encode(['ok' => false, 'error' => 'The payrun cannot be processed because the payslip for \'' . $payslips[$i]['employee']['name'] . '\' for the period \'' . $payslips[$i]['fromDate'] . ' to ' . $payslips[$i]['toDate'] . '\' is in conflict with one or more payslips from another payrun.']) );
                    return false;
                }
                
                // For every other payslip in the payrun
                for( $j = 0; $j < count($payslips); $j++ ) {
                    // Don't check the same payslip
                    if( $i == $j ) continue;
                    
                    // Is the payslip for the same employee?
                    if( $payslips[$i]['employee']['id'] == $payslips[$j]['employee']['id'] ) {
                        // Is the payslip for the same tax period and year?
                        if( ( $payslips[$i]['taxPeriod']['type'] ==  $payslips[$j]['taxPeriod']['type'] ) &&
                            ( $payslips[$i]['taxPeriod']['taxYear'] ==  $payslips[$j]['taxPeriod']['taxYear'] ) &&
                            ( $payslips[$i]['taxPeriod']['number'] == $payslips[$j]['taxPeriod']['number'] ) ) {
                            echo( json_encode(['ok' => false, 'error' => 'The payrun cannot be processed because the payslip for \'' . $payslips[$i]['employee']['name'] . '\' for the period \'' . $payslips[$i]['fromDate'] . ' to ' . $payslips[$i]['toDate'] . '\' has for the same tax year and period as one or more other payslips in the payrun.']) );
                            return false;
                        }
                        // Does the payslip overlap with the period of another payslip?
                        else if( ( ( $payslips[$i]['fromDate'] >= $payslips[$j]['fromDate'] ) &&
                                    ( $payslips[$i]['fromDate'] <= $payslips[$j]['toDate'] ) 
                                    ) ||
                                    ( ( $payslips[$i]['toDate'] >= $payslips[$j]['fromDate'] ) &&
                                    ( $payslips[$i]['toDate'] <= $payslips[$j]['toDate'] ) 
                                    ) 
                                ) {
                            echo( json_encode(['ok' => false, 'error' => 'The payrun cannot be processed because the payslip for \'' . $payslips[$i]['employee']['name'] . '\' for the period \'' . $payslips[$i]['fromDate'] . ' to ' . $payslips[$i]['toDate'] . '\' has an overlapping period with one or more other payslips in the payrun.']) );
                            return false;
                        }
                    }
                }
                
                // Get the loan details of every loan, if any
                $sqlLoanQuery = 
                    'SELECT ' .
                        'loans.id, ' .
                        'loans.description, ' .
                        'loans.loan_status_type_code, ' .
                        'loans.loan_interest_type_code, ' .
                        'loans.principal_amount, ' .
                        'loans.adjust_loan_amount, ' .
                        'loans.start_date ' .
                    'FROM ' .
                        'loans ' .
                    'LEFT JOIN ' .
                        'loan_payments ON loan_payments.loan_id = loans.id ' .
                    'LEFT JOIN ' .
                        'payslip_items ON payslip_items.id = loan_payments.payslip_item_id ' .
                    'LEFT JOIN ' .
                        'payslips ON payslips.id = payslip_items.payslip_id ' .
                    'WHERE ' .
                        'payslips.id = $1;';
                $sqlLoanResult = $db->paramQuery($sqlLoanQuery, [
                    $payslips[$i]['id']
                ]);
                if( !$sqlLoanResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // For every loan on the payslip
                while( $sqlLoanRow = $sqlLoanResult->fetchAssociative() ) {
                    // Get the loan history
                    $sqlLoanHistoryQuery = 
                        'SELECT ' . 
                            'loan_history.total_payments, ' .
                            'loan_history.interest_rate, ' .
                            'loan_history.loan_capitalization_period_type_code, ' .
                            'loan_history.capitalization_day ' .
                        'FROM ' . 
                            'loan_history ' .
                        'WHERE ' . 
                            'loan_history.loan_id = $1 ' .
                        'ORDER BY ' . 
                            'loan_history.added_on DESC, loan_history.id DESC ' .
                        'LIMIT 1;';
                    $sqlLoanHistoryResult = $db->paramQuery($sqlLoanHistoryQuery, [$sqlLoanRow['id']]);
                    if( !$sqlLoanHistoryResult->isValid() ) {
                        return ['ok' => false, 'error' => 'Database error.'];
                    }
                    $sqlLoanHistoryRow = $sqlLoanHistoryResult->fetchAssociative();
                    
                    // Get the loan payments for all processed payruns as well as the current payrun and any manual payments
                    $outstandingAmount = $sqlLoanRow['principal_amount'];
                    $outstandingPayments = $sqlLoanHistoryRow['total_payments'];
                    $sqlLoanPaymentsQuery = 
                        'SELECT ' .
                            'COUNT(CASE WHEN loan_payments.payslip_item_id IS NOT NULL THEN loan_payments.id ELSE NULL END) AS num_payments, ' .
                            'SUM(loan_payments.interest_amount) AS total_interest, ' .
                            'SUM(loan_payments.paid_amount) AS total_paid, ' .
                            'MAX(loan_payments.paid_on) AS last_payment_date ' .
                        'FROM ' .
                            'loan_payments ' .
                        'LEFT JOIN ' .
                            'payslip_items ON payslip_items.id = loan_payments.payslip_item_id ' .
                        'LEFT JOIN ' .
                            'payslips ON payslips.id = payslip_items.payslip_id ' .
                        'LEFT JOIN ' .
                            'payruns ON payruns.id = payslips.payrun_id ' .
                        'WHERE ' .
                            '(payruns.processed_on IS NOT NULL OR payruns.id = $1 OR loan_payments.payslip_item_id IS NULL) AND ' .
                            'loan_payments.loan_id = $2;';
                    $sqlLoanPaymentsResult = $db->paramQuery($sqlLoanPaymentsQuery, [
                        $payrunId,          // payruns.id
                        $sqlLoanRow['id']   // loan_id
                    ]);
                    if( !$sqlLoanPaymentsResult->isValid() ) {
                        return ['ok' => false, 'error' => 'Database error.'];
                    }
                    
                    // Are there any payments on the loan?
                    if( $sqlLoanPaymentsResult->getRowCount() > 0 ) { 
                        // Re-calculate the oustanding loan amount and number of payments
                        $sqlLoanPaymentsRow = $sqlLoanPaymentsResult->fetchAssociative();
                        $outstandingAmount = $outstandingAmount - ($sqlLoanPaymentsRow['total_paid'] - $sqlLoanPaymentsRow['total_interest']);
                        $outstandingPayments = $outstandingPayments - $sqlLoanPaymentsRow['num_payments'];
                    }
                    
                    // Are there NO payments left or has the loan been paid in full?
                    if( ($outstandingPayments <= 0) || ($outstandingAmount < 0.01) ) {
                        // Mark the specified loan as fully paid
                        $sqlQuery = 'UPDATE loans SET loan_status_type_code = \'PAID\', fully_paid_on = $1 WHERE id = $2;';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            date('Y-m-d', time()),  // fully_paid_on
                            $sqlLoanRow['id']       // id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
            }
            
            // Mark the specified payrun as processed
            $sqlQuery = 'UPDATE payruns SET processed_on = $1 WHERE id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                date('Y-m-d', time()),  // processed_on
                $payrunId               // id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            
            //
            // PROCESS PAYSLIP LEAVE
            //
            
            // Get details about every active payslip
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.to_date, ' .
                    'payslips.employee_id ' .
                'FROM ' .
                    'payslips ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 AND ' .
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY payslips.employee_id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $payrunId
            ]);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Calculate leave and email the payslip to the employees where possible
            while( $payslipRow = $payslipResult->fetchAssociative() ) {
                // Set time limit to 10 minutes
                set_time_limit(600);
                
                // Get all the items for the specified payslip
                $itemQuery = 
                    'SELECT DISTINCT ' .
                        'payslip_items.id, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.name AS type_name, ' .
                        'payslip_item_types.payslip_item_unit_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_categories.name AS payslip_category_name, ' .
                        'payslip_items.description, ' .
                        'payslip_items.accrual_date, ' .
                        'payslip_items.units, ' .
                        'payslip_items.rate, ' .
                        'payslip_items.total ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                    'WHERE ' .
                        'payslip_items.payslip_id = $1 ' .
                    'ORDER BY ' .
                        'payslip_categories.name DESC;';
                $itemResult = $db->paramQuery($itemQuery, [
                    $payslipRow['id']
                ]);
                if( !$itemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Set the payslip item details
                $hoursWorked = null;
                $daysWorked = null;
                while( $itemRow = $itemResult->fetchAssociative() ) {
                    // Remember hours or days worked, if any
                    if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                        $hoursWorked = $itemRow['units'];
                    }
                    else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                        $daysWorked = $itemRow['units'];
                    }
                    
                    // Calculate the amount
                    $amount = $itemRow['total'];
                    if( $itemRow['units'] !== null && $itemRow['rate'] !== null ) {
                        $amount = doubleval($itemRow['units']) * doubleval($itemRow['rate']);
                    }
                }
                
                // Set employee details for calculating leave
                $leaveDetails = [
                    'employeeId' => $payslipRow['employee_id'],
                    'payslipId' => $payslipRow['id'],
                    'hoursWorked' => $hoursWorked,
                    'daysWorked' => $daysWorked,
                    'leaveSourceType' => 'PAYS',
                    'leaveDate' => $payslipRow['to_date']
                ];
                
                // Calculate employee leave
                $leaveResult = \LeaveUtil\processEmployeeLeave( $leaveDetails, $user, $db );
            }
            
            
            //
            // PRINT AND EMAIL THE PAYSLIPS
            //
            
            // Should payslips NOT be emailed?
            if( $emailPayslips !== true ) {
                echo( json_encode(['ok' => true]) );
                return true;
            }
            
            // Use the mailer module to send payslips
            System::useModule('phpmailer');
            
            // Load the payslip template
            System::includeFile('payslip_printing/PayslipPrinterDefault.php');
            
            // Create a new payslip printer
            $printer = new PayslipPrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create payslip template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] . '/payslip_images/';
            
            // Get saved config details
            $sqlQuery =
            'SELECT ' .
                'payslip_templates.id, payslip_template_config.name, payslip_template_config.value ' .
            'FROM ' .
                'payslip_templates ' .
            'LEFT JOIN ' .
                'payslip_template_config ON payslip_template_id = payslip_templates.id ' .
            'WHERE ' . 
                'payslip_templates.name = \'default\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }
            
            $config = [];
            
            // Create config array
            while ($sqlRow = $sqlResult->fetchAssociative()) {
                $skip = false;
                for ($i = 0; $i < count($templateConfig); $i++) {
                    if ($sqlRow['name'] === $templateConfig[$i]['name']) {
                        if ($templateConfig[$i]['type'] === 'image') {
                            if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                                $config[$sqlRow['name']] = $imageDir . $sqlRow['value'] . '.png';
                            }
                            $skip = true;
                            break;
                        }
                    }
                }
                if (!$skip) {
                    $config[$sqlRow['name']] = $sqlRow['value'];
                }
            }
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir . '/';
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Get the company details required to print payslips
            $sqlQuery =
                'SELECT ' . 
                    'company_details.id, ' .
                    'company_details.name, ' .
                    'company_details.alias, ' .
                    'company_details.registration_number, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.postal_address_line_1, ' .
                    'company_details.postal_address_line_2, ' .
                    'company_details.postal_address_line_3, ' .
                    'company_details.postal_address_code, ' .
                    'company_details.tel_number, ' .
                    'company_details.fax_number, ' .
                    'company_details.email_address, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.uif_registration_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.sars_contact_email_address, ' .
                    'company_details.uif_contact_person, ' .
                    'company_details.uif_contact_email_address, ' .
                    'company_details.uif_contact_number, ' .
                    'countries.name AS physical_address_country_name ' .
                'FROM ' .
                    'company_details ' .
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'ORDER BY id DESC LIMIT 1; ';
                
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $companyName = $sqlRow['name'];
            $companyAddressLine1 = $sqlRow['postal_address_line_1'];
            $companyAddressLine2 = $sqlRow['postal_address_line_2'];
            $companyAddressLine3 = $sqlRow['postal_address_line_3'];
            $companyAddressLine4 = $sqlRow['postal_address_code'];
            $companyTel = $sqlRow['tel_number'];
            $companyFax = $sqlRow['fax_number'];
            $companyEmail = $sqlRow['email_address'];
            $companyLogo = '';
            
            // Get details about every active payslip
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.employee_id, ' .
                    'employees.id AS employee_id, ' .
                    'employees.full_names, ' .
                    'employees.first_name, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.passport_number, ' .
                    'employees.income_tax_number, ' .
                    'employees.cell_number, ' .
                    'employees.email_address, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_period_end_day, ' .
                    'departments.name AS department_name, ' .
                    'employees.employment_position, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.postal_address_line_1, ' .
                    'employees.postal_address_line_2, ' .
                    'employees.postal_address_line_3, ' .
                    'employees.postal_address_code, ' .
                    'employees.code, ' .
                    'employees.send_payslip_by_email, ' . 
                    'employee_bank_details.account_number, ' .
                    'employee_bank_details.branch_code, ' .
                    'bank_account_types.name AS bank_account_type_name ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'departments ON departments.id = employees.department_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = employees.id ' .
                'LEFT JOIN ' .
                    'bank_account_types ON employee_bank_details.bank_account_type_code = bank_account_types.code ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 AND ' .
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY employees.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $payrunId
            ]);
            if( !$payslipResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Calculate leave and email the payslip to the employees where possible
            while( $payslipRow = $payslipResult->fetchAssociative() ) {
                // Set time limit to 10 minutes
                set_time_limit(600);
                
                // Clear previous payslip printer details, if any
                $printer->clear();
                
                // Set config of the pdf
                $printer->setConfig($config);
                
                // Add the company, employee, and payslip details to the payslip printer
                $printer->setCompanyName($companyName);
                $printer->setCompanyAddress($companyAddressLine1, $companyAddressLine2, $companyAddressLine3, $companyAddressLine4);
                $printer->setCompanyTel($companyTel);
                $printer->setCompanyFaxNumber($companyFax);
                $printer->setCompanyEmail($companyEmail);
                $printer->setCompanyLogo($companyLogo);
                
                $department = $payslipRow['department_name'];
                if( $department === null ) $department = '';
                
                $printer->setEmployeeFullName($payslipRow['full_names'] . ' ' . $payslipRow['last_name']);
                $printer->setEmployeeAlias($payslipRow['alias']);
                $printer->setEmployeeCode($payslipRow['code']);
                $printer->setEmployeeDepartment($department);
                $printer->setEmployeePosition($payslipRow['employment_position']);
                $printer->setEmployeeEmploymentStart($payslipRow['employment_start_date']);
                $printer->setEmployeeEmail($payslipRow['email_address']);
                $printer->setEmployeeAddress($payslipRow['postal_address_line_1'], $payslipRow['postal_address_line_2'], $payslipRow['postal_address_line_3'], $payslipRow['postal_address_code']);
                $printer->setEmployeeCell($payslipRow['cell_number']);
                $printer->setEmployeeIdNumber($payslipRow['id_number']);
                $printer->setEmployeePassportNumber($payslipRow['passport_number']);
                $printer->setEmployeeIncomeTaxNumber($payslipRow['income_tax_number']);
                
                $bankAccountTypeName = $payslipRow['bank_account_type_name'];
                if( $bankAccountTypeName === null ) $bankAccountTypeName = '';
                $printer->setEmployeeBankName($bankAccountTypeName);
                
                $accountNumber = $payslipRow['account_number'];
                if( $accountNumber === null ) $accountNumber = '';
                $printer->setEmployeeAccountNumber($accountNumber);
                
                $branchCode = $payslipRow['branch_code'];
                if( $branchCode === null ) $branchCode = '';
                $printer->setEmployeeBankCode($branchCode);
                
                $printer->setEmployeePeriod($payslipRow['from_date'] . ' - ' . $payslipRow['to_date']);
                $printer->setPayslipToDate($payslipRow['to_date']);
                
                // Get all the items for the specified payslip
                $itemQuery = 
                    'SELECT DISTINCT ' .
                        'payslip_items.id, ' .
                        'payslip_items.payslip_item_type_code, ' .
                        'payslip_item_types.name AS type_name, ' .
                        'payslip_item_types.payslip_item_unit_code, ' .
                        'payslip_item_types.payslip_category_code, ' .
                        'payslip_categories.name AS payslip_category_name, ' .
                        'payslip_items.description, ' .
                        'payslip_items.accrual_date, ' .
                        'payslip_items.units, ' .
                        'payslip_items.rate, ' .
                        'payslip_items.total, ' .
                        'payslip_items.include_in_nett_pay ' .
                    'FROM ' .
                        'payslip_items ' .
                    'LEFT JOIN ' .
                        'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                    'LEFT JOIN ' .
                        'payslip_categories ON payslip_categories.code = payslip_item_types.payslip_category_code ' .
                    'WHERE ' .
                        'payslip_items.payslip_id = $1 ' .
                    'ORDER BY ' .
                        'payslip_categories.name DESC;';
                $itemResult = $db->paramQuery($itemQuery, [
                    $payslipRow['id']
                ]);
                if( !$itemResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Set the payslip item details
                $hoursWorked = null;
                $daysWorked = null;
                while( $itemRow = $itemResult->fetchAssociative() ) {
                    // Remember hours or days worked, if any
                    if( $itemRow['payslip_item_unit_code'] === 'PHOU' ) {
                        $hoursWorked = $itemRow['units'];
                    }
                    else if( $itemRow['payslip_item_unit_code'] === 'PDAY' ) {
                        $daysWorked = $itemRow['units'];
                    }
                    
                    // Calculate the amount
                    $amount = $itemRow['total'];
                    if( $itemRow['units'] !== null && $itemRow['rate'] !== null ) {
                        $amount = doubleval($itemRow['units']) * doubleval($itemRow['rate']);
                    }
                    
                    // Set the description
                    $description = $itemRow['description'];
                    
                    // Is it an overtime item?
                    if( $itemRow['payslip_item_type_code'] == '1005' ) {
                        // Add the number of hours worked to the payslip item description
                        $description = $description . ' (' . $hoursWorked . ' hours)';
                    }
                    
                    // Add the specified item details to the payslip printer
                    $printer->addPayslipItem($itemRow['payslip_category_name'], $description, $amount, $itemRow['include_in_nett_pay']);
                }
                
                // $leaveData = \LeaveUtil\getLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
                $leaveData = \LeaveUtil\calculateLeaveBalances( $payslipRow['employee_id'], $payslipRow['from_date'], $payslipRow['to_date'], $user, $db );
                
                foreach ($leaveData as $key => $value) {
                    $printer->addLeaveItem(
                        $key,
                        $leaveData[$key]['adjustment'],
                        $leaveData[$key]['accrued'],
                        $leaveData[$key]['taken'],
                        $leaveData[$key]['balance'],
                        $leaveData[$key]['unit']
                    );
                }
                
                // Skip employees that have payslip emails disabled.
                if( $payslipRow['send_payslip_by_email'] !== true ) continue;
                
                // Does the specified employee not have a valid email address?
                if( $payslipRow['email_address'] === null || $payslipRow['email_address'] === '' ) {
                    // Go to the next payslip
                    continue;
                }
                
                // Print the payslip
                $printer->printPayslip();
                
                // Create a random filename for the payslip
                $filename = '';
                for ($i = 0; $i < 32; $i++) {
                    $filename = $filename . $characters[rand(0, $charactersLength - 1)];
                }
                $filename = $destDir . $filename . '.pdf';
                
                // Save the file
                $printer->saveToFile($filename);
                
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
                
                // Recipients
                $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
                $mail->addAddress($payslipRow['email_address'], $payslipRow['alias']);
            
                // Add the pasylip as an attachment
                $mail->addAttachment($filename, 'payslip_' . str_replace('-', '', $payslipRow['to_date']) . '.pdf');
                
                // Set the email text
                $htmlBody = 
                    'Dear ' . $payslipRow['alias'] . ',<br><br>' .
                    'Please find the attached payslip for <b>' . $payslipRow['full_names'] . ' ' . $payslipRow['last_name'] . '</b> for the period <b>' . $payslipRow['from_date'] . ' to ' . $payslipRow['to_date'] . '</b>.<br><br>' .
                    'If you have any queries, please don\'t hesitate to contact us.<br><br>' .
                    'Regards,<br><br>' .
                    'HR Department,<br><br>' .
                    $companyName;
                
                $plainTexBody = 
                    "Dear " . $payslipRow['alias'] . ",\r\n\r\n" .
                    "Please find the attached payslip for " . $payslipRow['full_names'] . " " . $payslipRow['last_name'] . " for the period " . $payslipRow['from_date'] . " to " . $payslipRow['to_date'] . ".\r\n\r\n" .
                    "If you have any queries, please don\'t hesitate to contact us.\r\n\r\n" .
                    "Regards,\r\n\r\n" .
                    "HR Department,\r\n\r\n" .
                    $companyName;
                
                // Set the email content
                $mail->isHTML(true);    // Set email format to HTML
                $mail->Subject = $companyName . ' payslip for period ending ' . $payslipRow['to_date'];
                $mail->Body    = $htmlBody;
                $mail->AltBody = $plainTexBody;
                
                // Send the email
                $mail->send();
                
                // Delete the PDF
                unlink($filename);
            }
            
            // Delete the temp folder
            rmdir($destDir);
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to process the specified payrun
        //
        // Required Parameters
        //  payrunId        The id of the payrun to process
        //
        // Optional Parameters
        //  None
        public function undoProcess($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            
            // Check if the specified payrun already been processed.
            $sqlQuery = 'SELECT processed_on FROM payruns WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() != 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['processed_on'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' has not yet been processed.']) );
                return false;
            }
            
            // // Check if transactions has been posted to accounting
            // $sqlQuery = 'SELECT id FROM accounting_export_history WHERE payrun_id = $1 LIMIT 1;';
            // $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            // if( !$sqlResult->isValid() ) {
            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            //     return false;
            // }
            
            // if( $sqlResult->getRowCount() > 0 ) {
            //     echo( json_encode(['ok' => false, 'error' => 'One or more transactions from the payrun has already been posted to Lexpro Accounting.']) );
            //     return false;
            // }
            
            // Start transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->paramQuery('LOCK TABLE leave IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE loans IN ACCESS EXCLUSIVE MODE', []);
            $db->paramQuery('LOCK TABLE payruns IN ACCESS EXCLUSIVE MODE', []);
            
            // Get all the payslips for the payrun
            $sqlQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.employee_id, ' .
                    'employees.alias AS employee_name ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 AND ' .
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY ' . 
                    'payslips.employee_id ASC, payslips.id ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $payrunId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $payslips = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $payslips[] = [
                    'id' => $sqlRow['id'],
                    'fromDate' => $sqlRow['from_date'],
                    'toDate' => $sqlRow['to_date']
                ];
            }
            
            // For every payslip in the payrun
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Remove all leave generated by the payslip
                $sqlQuery = 'DELETE FROM leave WHERE payslip_id = $1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $payslips[$i]['id']     // payslip_id
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // Get the loan details of every loan, if any
                $sqlLoanQuery = 
                    'SELECT ' .
                        'loans.id, ' .
                        'loans.description, ' .
                        'loans.loan_status_type_code, ' .
                        'loans.loan_interest_type_code, ' .
                        'loans.principal_amount, ' .
                        'loans.adjust_loan_amount, ' .
                        'loans.start_date ' .
                    'FROM ' .
                        'loans ' .
                    'LEFT JOIN ' .
                        'loan_payments ON loan_payments.loan_id = loans.id ' .
                    'LEFT JOIN ' .
                        'payslip_items ON payslip_items.id = loan_payments.payslip_item_id ' .
                    'LEFT JOIN ' .
                        'payslips ON payslips.id = payslip_items.payslip_id ' .
                    'WHERE ' .
                        'payslips.id = $1;';
                $sqlLoanResult = $db->paramQuery($sqlLoanQuery, [
                    $payslips[$i]['id']
                ]);
                if( !$sqlLoanResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                // For every loan on the payslip
                while( $sqlLoanRow = $sqlLoanResult->fetchAssociative() ) {
                    // Get all the loan payments
                    $sqlLoanPaymentsQuery = 
                        'SELECT ' .
                            'COUNT(CASE WHEN loan_payments.payslip_item_id IS NOT NULL THEN loan_payments.id ELSE NULL END) AS num_payments, ' .
                            'SUM(loan_payments.interest_amount) AS total_interest, ' .
                            'SUM(loan_payments.paid_amount) AS total_paid, ' .
                            'MAX(loan_payments.paid_on) AS last_payment_date ' .
                        'FROM ' .
                            'loan_payments ' .
                        'WHERE ' . 
                            'loan_payments.loan_id = $1 AND ' .
                            'loan_payments.paid_on <= $2;';
                    $sqlLoanPaymentsResult = $db->paramQuery($sqlLoanPaymentsQuery, [
                        $sqlLoanRow['id'],          // loan_id
                        $payslips[$i]['toDate']     // paid_on
                    ]);
                    if( !$sqlLoanPaymentsResult->isValid() ) {
                        return ['ok' => false, 'error' => 'Database error.'];
                    }
                    
                    // Are there any payments on the loan?
                    if( $sqlLoanPaymentsResult->getRowCount() > 0 ) { 
                        // Was the loan marked as fully paid?
                        if( $sqlLoanRow['loan_status_type_code'] === 'PAID' ) {
                            // Reset the loan status to active
                            $sqlQuery = 'UPDATE loans SET loan_status_type_code = \'ACTI\', fully_paid_on = $1 WHERE id = $2;';
                            $sqlResult = $db->paramQuery($sqlQuery, [
                                null,               // fully_paid_on
                                $sqlLoanRow['id']   // id
                            ]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                        }
                    }
                }
            }
            
            // Mark the specified payrun as processed
            $sqlQuery = 'UPDATE payruns SET processed_on = $1 WHERE id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                null,       // processed_on
                $payrunId   // id
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit the sql transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to recreate a specified payslip
        //
        // Required Parameters
        //  payslipId           The id of the payslip for which to create items
        //
        // Optional Parameters
        //  None
        public function recreatePayslip($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Get the payslip details
            $sqlQuery =
                'SELECT ' .
                    'payslips.payrun_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.sars_year, ' .
                    'payslips.period AS payslip_perdiod, ' .
                    'payslips.employee_id, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date ' .
                'FROM ' .
                    'payslips ' . 
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' . 
                'WHERE ' . 
                    'payslips.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['payslipId']  // id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $startDate = new DateTime( $sqlRow['from_date'] );
            $endDate = new DateTime( $sqlRow['to_date'] );
            $employeeId = $sqlRow['employee_id'];
            $sarsYear = $sqlRow['sars_year'];
            $payslipPeriod = $sqlRow['payslip_perdiod'];
            $payslipPeriodCode = $sqlRow['payment_period_code'];
            $payslipPaymentDay = $sqlRow['payment_period_end_day'];
            $payslips = [];
            
            // Get the payslips for the payrun
            $result = $this->generatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $startDate, $endDate, null);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            // Find the specified payslip in the list of generated ones
            for( $i = 0; $i < count($result['payslips']); $i++ ) {
                // Is it not the right employee?
                if( $result['payslips'][$i]['employee']['id'] !== $employeeId ) continue;
                
                // Was the employee's payment period changed?
                if( $result['payslips'][$i]['taxPeriod']['type'] != $payslipPeriodCode ) {
                    // Calculate the start and end dates of the period of the original payslip
                    $paymentPeriodStartDate = null;
                    $paymentPeriodEndDate = null;
                    if( $payslipPeriodCode == 'MONT' ) {
                        $paymentPeriodStartDate = new DateTime( ($startDate->format('Y') . '-' . $payslipPeriod . '-01') );
                        $daysInMonth = $startDate->format('t');
                        $paymentPeriodEndDate = new DateTime( ($startDate->format('Y') . '-' . $payslipPeriod . '-' . $daysInMonth) );
                        
                        // Does the new payslip fall inside the specified period?
                        if( ( ( new DateTime( $result['payslips'][$i]['fromDate'] ) >= $paymentPeriodStartDate ) &&
                              ( new DateTime( $result['payslips'][$i]['fromDate'] ) <= $paymentPeriodEndDate ) ) ||
                            ( ( new DateTime( $result['payslips'][$i]['toDate'] ) >= $paymentPeriodStartDate ) &&
                              ( new DateTime( $result['payslips'][$i]['toDate'] ) <= $paymentPeriodEndDate ) ) ) {
                            // Add the payslip to the array (we do this beacuse, if the employees payment period was 
                            // changed, one payslip may be replaced by multiple ones)
                            $payslips[] = $result['payslips'][$i];
                        }
                    }
                    else if( $payslipPeriodCode == 'WEEK' ) {
                        $paymentPeriodStartDate = new DateTime();
                        $paymentPeriodStartDate->setISODate($startDate->format('Y'), $payslipPeriod);
                        $paymentPeriodEndDate = new DateTime( $paymentPeriodStartDate->format('Y-m-d') );
                        $paymentPeriodEndDate->modify('+6 days');
                        
                        // Does the new payslip fall inside the specified period?
                        if( ( ( $paymentPeriodStartDate >= new DateTime( $result['payslips'][$i]['fromDate'] ) ) &&
                              ( $paymentPeriodStartDate <= new DateTime( $result['payslips'][$i]['toDate'] ) ) ) ||
                            ( ( $paymentPeriodEndDate >= new DateTime( $result['payslips'][$i]['fromDate'] ) ) &&
                              ( $paymentPeriodEndDate <= new DateTime( $result['payslips'][$i]['toDate'] ) ) ) ) {
                            // Add the payslip to the array (we do this beacuse, if the employees payment period was 
                            // changed, one payslip may be replaced by multiple ones)
                            $payslips[] = $result['payslips'][$i];
                        }
                    }
                    else if( $payslipPeriodCode == 'BWEE' ) {
                        $paymentPeriodStartDate = new DateTime();
                        $paymentPeriodStartDate->setISODate($startDate->format('Y'), $payslipPeriod);
                        $paymentPeriodEndDate = new DateTime( $paymentPeriodStartDate->format('Y-m-d') );
                        $paymentPeriodEndDate->modify('+13 days');
                        
                        // Does the new payslip fall inside the specified period?
                        if( ( ( $paymentPeriodStartDate >= new DateTime( $result['payslips'][$i]['fromDate'] ) ) &&
                              ( $paymentPeriodStartDate <= new DateTime( $result['payslips'][$i]['toDate'] ) ) ) ||
                            ( ( $paymentPeriodEndDate >= new DateTime( $result['payslips'][$i]['fromDate'] ) ) &&
                              ( $paymentPeriodEndDate <= new DateTime( $result['payslips'][$i]['toDate'] ) ) ) ) {
                            // Add the payslip to the array (we do this beacuse, if the employees payment period was 
                            // changed, one payslip may be replaced by multiple ones)
                            $payslips[] = $result['payslips'][$i];
                        }
                    }
                    
                }
                else {
                    // Was the specified payslip found?
                    if( (  $result['payslips'][$i]['taxPeriod']['taxYear'] == $sarsYear ) &&
                        (  $result['payslips'][$i]['taxPeriod']['number'] == $payslipPeriod ) ) {
                        // Add the payslip to the array (we do this beacuse, if the employees payment period was 
                        // changed, one payslip may be replaced by multiple ones)
                        $payslips[] = $result['payslips'][$i];
                        break;
                    }
                }
            }
            
            echo( json_encode(['ok' => true, 'payslips' => $payslips]) );
            return true;
        }
        
        // Function to recreate the payslip items for a given payslip
        //
        // Required Parameters
        //  payslipId           The id of the payslip for which to create items
        //
        // Optional Parameters
        //  None
        public function recreatePayslipItems($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Get the payslip details
            $sqlQuery =
                'SELECT ' .
                    'payslips.payrun_id, ' .
                    'payslips.employee_id, ' .
                    'payslips.sars_year, ' .
                    'payslips.period AS payslip_perdiod, ' .
                    'payslips.employee_id, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'employees.id AS employee_id, ' .
                    'EXTRACT(YEAR FROM age(payruns.to_date, employees.date_of_birth)) AS employee_age, ' .
                    'employees.payment_period_end_day AS employee_payment_period_end_day, ' .
                    'employees.payment_period_code AS employee_payment_period ' .
                'FROM ' .
                    'payslips ' . 
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' . 
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' . 
                'WHERE ' . 
                    'payslips.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['payslipId']  // id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Set the payslip details
            $sqlRow = $sqlResult->fetchAssociative();
            $payslip = [
                'employee' => [
                    'id' => $sqlRow['employee_id'],
                    'age' => $sqlRow['employee_age'],
                    'paymentPeriodEndDay' => $sqlRow['employee_payment_period_end_day']
                ],
                'taxPeriod' => [
                    'type' => $sqlRow['employee_payment_period'],
                    'number' => $sqlRow['payslip_perdiod'],
                    'taxYear' => $sqlRow['sars_year']
                ],
                'payeBonusCalculationTypeCode' => $sqlRow['paye_bonus_calculation_type_code'],
                'fromDate' => $sqlRow['from_date'],
                'toDate' =>   $sqlRow['to_date'],
                'items' => []
            ];
            
            // NOTE: 
            //
            // The loan calculation section is simply to help fascilitate loan calculations where
            // an employee has more than one loan payment per payrun, these values will be discarded
            // when the payslip is stored
            $payslip['loanCalculation'] = [ 
                'loanId' => null,
                'numLoanPaymentsMade' => 0,
                'totalLoanCapitalPaid' => 0.00
            ];
            
            // Generate the payslip items for the specified payslip and get the result
            $result = $this->generatePayslipItems($db, $payslip, $payeBonusCalculationTypeCode);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            
            echo( json_encode(['ok' => true, 'payslipItems' => $result['payslipItems']]) );
            return true;
        }
        
        // Function to calculate PAYE, UIF and SDL items for a payslip
        //
        // Required Parameters
        //  payslips                An array of payslips
        //
        //                          payslip = [
        //                              fromDate => '2019-01-01',
        //                              toDate => '2019-01-31',
        //                              employee => [
        //                                  age => 21
        //                              ],
        //                              taxPeriod => [
        //                                  type => 'MONT',
        //                                  number => 11,
        //                                  taxYear => 2018
        //                              ],
        //                              items => [
        //                                  category => [
        //                                      code => 'INCO'
        //                                  ],
        //                                  type => [
        //                                      code => '1001',
        //                                      unitCode => 'PHOU'
        //                                  ],
        //                                  accrualDate => '2019-01-01',
        //                                  description => 'Hourly Wage',
        //                                  units => 10.00,
        //                                  rate => 100.00,
        //                                  amount => 1000.00
        //                              ]
        //                          ]
        //
        // Optional Parameters
        //  None
        public function calculatePayslips($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payslips' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'fromDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'toDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                        'employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                            'age' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                            'paymentPeriodEndDay' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        ]],
                        'taxPeriod' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                            'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                            'number' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                            'taxYear' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                        ]],
                        'items' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                            ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'category' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                    'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                                ]],
                                'type' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                    'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                                    'unitCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                                ]],
                                'providentFund' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                    'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                    'employeeAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                    'employerAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                    'rfiItems' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                                        ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                            'payslipItemTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                                            'percentage' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
                                        ]]
                                    ]]
                                ]],
                                'loan' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                    'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
                                ]],
                                'accrualDate' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => true],
                                'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                                'units' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                'rate' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                            ]]
                        ]]
                    ]]
                ]]
            ]);
        
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Re-calculate the payslips
            $result = $this->recalculatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $data['payslips']);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $payslips = $result['payslips'];
            
            // Return the result
            echo( json_encode(['ok' => true, 'payslips' => $payslips]) );
            return true;
        }
        
        // Function to calculate PAYE, UIF and SDL items for a payslip
        //
        // Required Parameters
        //  payslip                 An array describing the payslip
        //
        //                          payslip = [
        //                              fromDate => '2019-01-01',
        //                              toDate => '2019-01-31',
        //                              employee => [
        //                                  age => 21
        //                              ],
        //                              taxPeriod => [
        //                                  type => 'MONT',
        //                                  number => 11,
        //                                  taxYear => 2018
        //                              ],
        //                              items => [
        //                                  category => [
        //                                      code => 'INCO'
        //                                  ],
        //                                  type => [
        //                                      code => '1001',
        //                                      unitCode => 'PHOU'
        //                                  ],
        //                                  accrualDate => '2019-01-01',
        //                                  description => 'Hourly Wage',
        //                                  units => 10.00,
        //                                  rate => 100.00,
        //                                  amount => 1000.00
        //                              ]
        //                          ]
        //
        // Optional Parameters
        //  None
        public function calculatePayslipItems($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'payslip' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                    'fromDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                    'toDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                    'employee' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'age' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                        'paymentPeriodEndDay' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                    ]],
                    'taxPeriod' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'type' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                        'number' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'taxYear' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                    ]],
                    'items' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                        ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                            'category' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                            ]],
                            'type' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'code' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                                'unitCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                            ]],
                            'providentFund' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                                'employeeAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                'employerAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                                'rfiItems' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                        'payslipItemTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                                        'percentage' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
                                    ]]
                                ]]
                            ]],
                            'loan' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                                'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
                            ]],
                            'accrualDate' => ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => true],
                            'description' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => false],
                            'units' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                            'rate' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true],
                            'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
                        ]]
                    ]]
                ]]
            ]);
        
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // Re-calculate the payslips
            $result = $this->recalculatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, [$data['payslip']]);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $payslips = $result['payslips'];
            
            // Return the result
            echo( json_encode(['ok' => true, 'payslips' => $payslips]) );
            return true;
        }
        
        // Function to get payrun exceptions, if any
        //
        // Required Parameters
        //  payrunId        The id of the payrun whose payslips to email
        //
        // Optional Parameters
        //  None
        //
        // Returns
        //  [
        //      'description',              // A description of the exception
        //      'payslip' => [
        //          'id',                   // The id of the payslip that caused the exception, if any
        //          'fromDate',             // The from date of the payslip that caused the exception
        //          'toDate'                // The to date of the payslip that caused the exception
        //      ],
        //      'employee' => [
        //          'id',                   // The id of the employee that caused the exception
        //          'name'                  // The name of the employee that caused the exception
        //      ]
        //  ]
        public function getExceptions($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            $exceptions = [];
            
            // Load the payrun from the payruns table
            $sqlQuery = 
                'SELECT ' .
                    'payruns.description, ' .
                    'payruns.from_date, ' .
                    'payruns.to_date, ' .
                    'payruns.department_id, ' .
                    'payruns.created_on, ' .
                    'payruns.processed_on ' .
                'FROM ' .
                    'payruns ' .
                'WHERE ' .
                    'payruns.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if the payrun was found
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode( ['ok' => false, 'error' => 'Payrun \'' . $payrunId . '\' not found.'] ) );
                return false;
            }
            
            // Remember the payrun details
            $sqlRow = $sqlResult->fetchAssociative();
            $startDate = new DateTime($sqlRow['from_date']);
            $endDate = new DateTime($sqlRow['to_date']);
            $departmentId = $sqlRow['department_id'];
            
            // Get the PAYE Calculation method for the company
            $sqlQuery = 'SELECT paye_calculation_type_code, paye_bonus_calculation_type_code FROM company_details ORDER BY id DESC LIMIT 1; ';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company details not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $payeCalculationTypeCode = $sqlRow['paye_calculation_type_code'];
            $payeBonusCalculationTypeCode = $sqlRow['paye_bonus_calculation_type_code'];
            
            // NOTE:
            //
            // We need to check if the payslip items have changed. However, since we allow payslips to be 
            // modified after being generated, we won't be able to do so unless we distinguish between 
            // generated items and user added items (which we don't do at the moment). Once we do, we'll be 
            // able to check if the generated items have changed, meaning that changes were made to the 
            // employees income or deductions, and give an exception accordingly.
            
            // Generate a full set of payslips for the payrun from scratch
            $result = $this->generatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $startDate, $endDate, $departmentId);
            if( $result['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $result['error']]) );
                return false;
            }
            $generatedPayslips = $result['payslips'];
            
            $payslips = [];
            $oldEmployeeId = null;
            
            // Get the actual payslips for the payrun from the database
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslip_status_codes.name AS status_name, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'payslips.employee_id, ' .
                    'employees.alias AS employee_name, ' .
                    'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.email_address ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.payrun_id = $1 ' .
                'ORDER BY ' . 
                    'payslips.employee_id ASC, payslips.id ASC;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $payrunId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check every payslip for exceptions and eliminate the payslips that are already in the database
            while( $payslipRow = $payslipResult->fetchAssociative() ) {
                // Is it a new employee?
                if( $oldEmployeeId != $payslipRow['employee_id'] ) {
                    // Reset the payslips
                    $payslips = [];
                }
                
                // Set the payslip details
                $payslip = [
                    'id' => $payslipRow['id'],
                    'statusCode' => $payslipRow['status_code'],
                    'statusName' => $payslipRow['status_name'],
                    'employee' => [
                        'id' => $payslipRow['employee_id'],
                        'name' => $payslipRow['employee_name'],
                        'age' => $payslipRow['employee_age'],
                        'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                        'emailAddress' => $payslipRow['email_address']
                    ],
                    'taxPeriod' => [
                        'type' => $payslipRow['payment_period_code'],
                        'number' => $payslipRow['period'],
                        'taxYear' => $payslipRow['sars_year']
                    ],
                    'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                    'fromDate' => $payslipRow['from_date'],
                    'toDate' => $payslipRow['to_date'],
                    'items' => []
                ];
                
                // Is it an active payslip?
                if( $payslipRow['status_code'] === 'ACTI' ) {
                    // Was the specified employee dismissed before the payrun?
                    if( ($payslipRow['employment_end_date'] != null) && ($payslipRow['employment_end_date'] < $startDate->format('Y-m-d')) ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Employee dismissed prior to payrun',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Was the specified employee employeed before the payrun?
                    if( $payslipRow['employment_start_date'] > $endDate->format('Y-m-d') ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Employee employed after payrun',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Get all the items for the specified payslip
                    $itemQuery = 
                        'SELECT DISTINCT ' .
                            'payslip_items.id, ' .
                            'payslip_items.payslip_item_type_code, ' .
                            'payslip_item_types.payslip_item_unit_code, ' .
                            'payslip_item_types.payslip_category_code, ' .
                            'payslip_items.description, ' .
                            'payslip_items.accrual_date, ' .
                            'payslip_items.auto_calculate, ' .
                            'payslip_items.units, ' .
                            'payslip_items.rate, ' .
                            'payslip_items.total, ' .
                            'payslip_items.include_in_nett_pay, ' .
                            'payslip_items.provident_fund_id, ' .
                            'payslip_categories AS payslip_category_name, ' .
                            'payslip_categories.code, ' .
                            'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                        'FROM ' .
                            'payslip_items ' .
                        'LEFT JOIN ' .
                            'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                        'LEFT JOIN ' .
                            'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                        'WHERE ' .
                            'payslip_items.payslip_id = $1 ' .
                        'ORDER BY ' . 
                            'custom_sort, payslip_items.payslip_item_type_code ASC, payslip_items.description ASC;';
                    $itemResult = $db->paramQuery($itemQuery, [
                        $payslipRow['id']
                    ]);
                    if( !$itemResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // Check the required payslip items
                    $items = [];
                    $numItems = 0;
                    $numPayeItems = 0;
                    $numEmployeeUifItems = 0;
                    $numEmployerUifItems = 0;
                    $numSdlItems = false;
                    $numEmployeeProvidentFundItems = 0;
                    $numEmployerProvidentFundItems = 0;
                    // $overtimeHoursWorked = 0.0;
                    $totalIncome = 0.0;
                    $totalPaye = 0.0;
                    $totalDeductions = 0.0;
                    $rfiItemExceptionProvidentFundId = null;
                    
                    while( $itemRow = $itemResult->fetchAssociative() ) {
                        $providentFundId = $itemRow['provident_fund_id'];
                        $employeeAmount = null;
                        $employerAmount = null;
                        $rfiItems = [];
                        
                        // Get the provident fund details
                        if( $providentFundId !== null ) {
                            // Load the provident fund details
                            $providentFundSqlQuery = 
                                'SELECT ' . 
                                    'provident_funds.name, ' .
                                    'provident_funds.provident_fund_calculation_type_code, ' .
                                    'provident_funds.employee_amount, ' .
                                    'provident_funds.employer_amount, ' .
                                    'provident_funds.category_factor, ' .
                                    'provident_funds.is_active ' .
                                'FROM ' . 
                                    'provident_funds ' .
                                'WHERE ' . 
                                    'provident_funds.id = $1 ' .
                                'ORDER BY ' . 
                                    'provident_funds.name ASC;';
                            $providentFundSqlResult = $db->paramQuery($providentFundSqlQuery, [$providentFundId]);
                            if( !$providentFundSqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            
                            $providentFundSqlRow = $providentFundSqlResult->fetchAssociative();
                            
                            // Is the provident fund not active?
                            if( $providentFundSqlRow['is_active'] !== true ) {
                                // Add an exception
                                $exceptions[] = [
                                    'description' => 'Provident fund \'' . $providentFundSqlRow['name'] . '\' is not active',
                                    'payslip' => [
                                        'id' =>  $payslipRow['id'],
                                        'fromDate' =>  $payslipRow['from_date'],
                                        'toDate' =>  $payslipRow['to_date']
                                    ],
                                    'employee' => [
                                        'id' =>  $payslipRow['employee_id'],
                                        'name' =>  $payslipRow['employee_name']
                                    ]
                                ];
                            }
                            
                            $employeeAmount = doubleval( $providentFundSqlRow['employee_amount'] );
                            $employerAmount = doubleval( $providentFundSqlRow['employer_amount'] );
                            
                            // Is the provident fund calculation based on retirement fund income items?
                            if( $providentFundSqlRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
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
                                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $payslipRow['employee_id']]);
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
                        }
                        
                        // Add the payslip items
                        $units = $itemRow['units'];
                        if( $units !== null ) $units = doubleval($units);
                        
                        $rate = $itemRow['rate'];
                        if( $rate !== null ) $rate = doubleval($rate);
                        
                        $amount = $itemRow['total'];
                        if( $amount !== null ) $amount = doubleval($amount);
                        
                        $items[] = [
                            'id' => $itemRow['id'],
                            'type' => [
                                'code' => $itemRow['payslip_item_type_code'],
                                'unitCode' => $itemRow['payslip_item_unit_code'],
                            ],
                            'category' => [
                                'code' => $itemRow['payslip_category_code'],
                                'name' => $itemRow['payslip_category_name']
                            ],
                            'providentFund' => [
                                'id' => $itemRow['provident_fund_id'],
                                'employeeAmount' => $employeeAmount,
                                'employerAmount' => $employerAmount,
                                'rfiItems' => $rfiItems
                            ],
                            'loan' => [
                                'id' => null
                            ],
                            'description' => $itemRow['description'],
                            'accrualDate' => $itemRow['accrual_date'],
                            'autoCalculate' => $itemRow['auto_calculate'],
                            'units' => $units,
                            'rate' => $rate,
                            'amount' => $amount,
                            'includeInNettPay' => $itemRow['include_in_nett_pay']
                        ];
                        
                        // Count number of payslip items
                        $numItems = $numItems + 1;
                        
                        // Calculate total income and deductions
                        if( ($itemRow['payslip_category_code'] === 'INCO') || ($itemRow['payslip_category_code'] === 'ALLO') ) {
                            $totalIncome = $totalIncome + $itemRow['total'];
                        }
                        else if( $itemRow['payslip_category_code'] === 'DEDU' ) {
                            $totalDeductions = $totalDeductions + $itemRow['total'];
                        }
                        
                        // // Does the payslip have overtime?
                        // if( $itemRow['payslip_item_type_code'] === '1005' ) {
                        //     $overtimeHoursWorked = $units;
                        // }
                        
                        // Does the payslip have PAYE?
                        if( $itemRow['payslip_item_type_code'] === '2000' ) {
                            $numPayeItems = $numPayeItems + 1;
                            $totalPaye = $totalPaye + $itemRow['total'];
                        }
                        
                        // Does the payslip have employee UIF?
                        if( $itemRow['payslip_item_type_code'] === '2002' ) {
                            $numEmployeeUifItems = $numEmployeeUifItems + 1;
                        }
                        
                        // Does the payslip have employer UIF?
                        if( $itemRow['payslip_item_type_code'] === '3001' ) {
                            $numEmployerUifItems = $numEmployerUifItems + 1;
                        }
                        
                        // Does the payslip have SDL?
                        if( $itemRow['payslip_item_type_code'] === '3002' ) {
                            $numSdlItems = $numSdlItems + 1;
                        }
                        
                        // Does the payslip have employee provident fund?
                        if( $itemRow['payslip_item_type_code'] === '2006' ) {
                            $numEmployeeProvidentFundItems = $numEmployeeProvidentFundItems + 1;
                        }
                        
                        // Does the payslip have employer provident fund?
                        if( $itemRow['payslip_item_type_code'] === '4002' ) {
                            $numEmployerProvidentFundItems = $numEmployerProvidentFundItems + 1;
                        }
                        
                        // Is it a provident fund item?
                        if( ( $itemRow['payslip_item_type_code'] === '2006') || ($itemRow['payslip_item_type_code'] === '4002') ) {
                            // Should the item be auto calculated but no income items were specified?
                            if( ($itemRow['auto_calculate'] === true) && (count($rfiItems) < 1) && ($rfiItemExceptionProvidentFundId !== $providentFundId) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'description' => 'No RFI items for \'' . $providentFundSqlRow['name'] . '\'',
                                    'payslip' => [
                                        'id' => $payslipRow['id'],
                                        'fromDate' => $payslipRow['from_date'],
                                        'toDate' => $payslipRow['to_date']
                                    ],
                                    'employee' => [
                                        'id' => $payslipRow['employee_id'],
                                        'name' => $payslipRow['employee_name']
                                    ]
                                ];
                                
                                // Don't add the same exception twice for a payslip
                                $rfiItemExceptionProvidentFundId = $providentFundId;
                            }
                        }
                    }
                    
                    // Add the payslip items to the payslip
                    $payslip['items'] = $items;
                    
                    // Add the payslip to the aray of payslips
                    $payslips[] = $payslip;
                        
                    // Are there no payslip items?
                    if( $numItems < 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'No payslip items',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }

                    // Was the specified employee employed before the payrun?
                    if ($payslipRow['employment_start_date'] > $startDate->format('Y-m-d') && $payslipRow['employment_start_date'] <= $endDate->format('Y-m-d')) {
                        // Add a warning for employees who started in the middle of the month
                        $exceptions[] = [
                            'description' => 'Employee did not work the full month',
                            'payslip' => [
                            'id' => $payslipRow['id'],
                            'fromDate' => $payslipRow['from_date'],
                            'toDate' => $payslipRow['to_date']
                            ],
                            'employee' => [
                            'id' => $payslipRow['employee_id'],
                            'name' => $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // // Were too many overtime hours worked (maximum of three hours per day or 10 hours per week)?
                    // if( ($overtimeHoursWorked != NULL) && ($overtimeHoursWorked > 10.0) ) {
                    //     // Add an exception
                    //     $exceptions[] = [
                    //         'description' => 'Too many overtime hours worked (',
                    //         'payslip' => [
                    //             'id' =>  $payslipRow['id'],
                    //             'fromDate' =>  $payslipRow['from_date'],
                    //             'toDate' =>  $payslipRow['to_date']
                    //         ],
                    //         'employee' => [
                    //             'id' =>  $payslipRow['employee_id'],
                    //             'name' =>  $payslipRow['employee_name']
                    //         ]
                    //     ];
                    // }
                    
                    // Is there no income?
                    if( $totalIncome < 0.01 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'No income',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    else {
                        // Check if income is in proportion to previous income
                        $incomeQuery = 
                            'SELECT ' . 
                                'SUM(payslip_items.total) AS income_total ' . 
                            'FROM ' . 
                                'payslips ' . 
                            'LEFT JOIN ' . 
                                'payruns ON payruns.id = payslips.payrun_id ' . 
                            'LEFT JOIN ' . 
                                'payslip_items ON payslip_items.payslip_id = payslips.id ' . 
                            'LEFT JOIN ' . 
                                'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' . 
                            'WHERE ' . 
                                '(payslip_item_types.payslip_category_code = \'INCO\' OR ' . 
                                'payslip_item_types.payslip_category_code = \'ALLO\') AND ' . 
                                'payruns.id != $1 AND ' . 
                                'payslips.employee_id = $2 AND ' . 
                                'payslips.to_date < $3 ' . 
                            'GROUP BY ' . 
                                'payslips.to_date ' . 
                            'ORDER BY ' . 
                                'payslips.to_date DESC ' . 
                            'LIMIT 1;';
                        $incomeResult = $db->paramQuery($incomeQuery, [
                            $payrunId,
                            $payslipRow['employee_id'],
                            $payslipRow['from_date']
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        
                        // Was previous income found?
                        if( $incomeResult->getRowCount() > 0 ) {
                            $incomeRow = $incomeResult->fetchAssociative();
                            $previousTotalIncome = (float)$incomeRow['income_total'];
                            
                            // Is income much less than previous income?
                            if( (float)$totalIncome < ($previousTotalIncome - ($previousTotalIncome * 50 / 100)) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'description' => ('Nett income less than 50% of previous'),
                                    'payslip' => [
                                        'id' =>  $payslipRow['id'],
                                        'fromDate' =>  $payslipRow['from_date'],
                                        'toDate' =>  $payslipRow['to_date']
                                    ],
                                    'employee' => [
                                        'id' =>  $payslipRow['employee_id'],
                                        'name' =>  $payslipRow['employee_name']
                                    ]
                                ];
                            }
                            // Is income much more than previous income?
                            else if( (float)$totalIncome > ($previousTotalIncome + ($previousTotalIncome * 50 / 100)) ) {
                                // Add an exception
                                $exceptions[] = [
                                    'description' => ('Nett income more than 50% of previous'),
                                    'payslip' => [
                                        'id' =>  $payslipRow['id'],
                                        'fromDate' =>  $payslipRow['from_date'],
                                        'toDate' =>  $payslipRow['to_date']
                                    ],
                                    'employee' => [
                                        'id' =>  $payslipRow['employee_id'],
                                        'name' =>  $payslipRow['employee_name']
                                    ]
                                ];
                            }
                        }
                    }
                    
                    // Are there more deductions than income?
                    if( $totalDeductions > $totalIncome ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => ('Deductions > income (' . $totalDeductions . ' > ' . $totalIncome . ')'),
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Was the tax averaging method be used?
                    $payeAmount = 0;
                    if( $payeCalculationTypeCode === 'AVER' ) {
                        // Calculate the average tax payment for the given month
                        $result = $this->calculateAverageTaxPayment($db, $payslipRow['employee_id'], $payslipRow['to_date'], $payslips, $payeBonusCalculationTypeCode);
                        if( $result['ok'] !== true ) {
                            return ['ok' => false, 'error' => $result['error']];
                        }
                        
                        $payeAmount = null;
                        if( $result['payment'] !== null ) {
                            $payeAmount = doubleval($result['payment']);
                        } 
                    }
                    else {
                        // Get the amount of PAYE payable
                        $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslip );
                        $payeAmount = $payslipTotals['paye'];
                    }
                    
                    // Is PAYE payable?
                    if( $payeAmount > 0.009 ) {
                        // Was there no PAYE for the specified payslip?
                        if( $numPayeItems < 1 ) {
                            // Add an exception
                            $exceptions[] = [
                                'description' => 'No PAYE (' . $payeAmount . ' estimated)',
                                'payslip' => [
                                    'id' =>  $payslipRow['id'],
                                    'fromDate' =>  $payslipRow['from_date'],
                                    'toDate' =>  $payslipRow['to_date']
                                ],
                                'employee' => [
                                    'id' =>  $payslipRow['employee_id'],
                                    'name' =>  $payslipRow['employee_name']
                                ]
                            ];
                        }
                        // Is the PAYE amount incorrect?
                        else if( $payeAmount != $totalPaye ) {
                            // Add an exception
                            $exceptions[] = [
                                'description' => 'Incorrect PAYE (' . $totalPaye . ' vs ' . $payeAmount . ' estimate)',
                                'payslip' => [
                                    'id' =>  $payslipRow['id'],
                                    'fromDate' =>  $payslipRow['from_date'],
                                    'toDate' =>  $payslipRow['to_date']
                                ],
                                'employee' => [
                                    'id' =>  $payslipRow['employee_id'],
                                    'name' =>  $payslipRow['employee_name']
                                ]
                            ];
                        }
                        else {
                            // Is there a bonus payable
                            for( $k = 0; $k < count($payslip['items']); $k++ ) {
                                // Is there an annual payment?
                                if( $payslip['items'][$k]['type']['code'] == '1004' ) {
                                    // Remove the annual payment from the payslip
                                    $tmpPayslip = $payslip;
                                    array_splice($tmpPayslip['items'], $k, 1);
                                    
                                    // Get the amount of PAYE payable without the bonus payment included
                                    $tmpPayslipTotals = \PayslipUtil\calculatePayslipTotals( $tmpPayslip );
                                    
                                    // Is there no tax payable?
                                    if( $tmpPayslipTotals['paye'] <= 0.00 ) {
                                        // Add an exception
                                        $exceptions[] = [
                                            'description' => 'Employee over tax threshold due to annual payment',  // '\'' . $payslip['items'][$k]['description'] . '\' puts the employee over the tax threshold',
                                            'payslip' => [
                                                'id' =>  $payslipRow['id'],
                                                'fromDate' =>  $payslipRow['from_date'],
                                                'toDate' =>  $payslipRow['to_date']
                                            ],
                                            'employee' => [
                                                'id' =>  $payslipRow['employee_id'],
                                                'name' =>  $payslipRow['employee_name']
                                            ]
                                        ];
                                    }
                                }
                                break;
                            }
                        }
                    }
                    
                    // Was there more than one PAYE items for the specified payslip?
                    if( $numPayeItems > 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Possible duplicate PAYE item',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Was there no employee UIF for the specified payslip?
                    if( $numEmployeeUifItems < 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'No employee UIF',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    // Was there more than one employee UIF for the specified payslip?
                    else if( $numEmployeeUifItems > 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Possible duplicate employee UIF',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Was there no employeer UIF for the specified payslip?
                    if( $numEmployerUifItems < 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'No employer UIF contribution',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    // Was there more than one employer UIF for the specified payslip?
                    else if( $numEmployerUifItems > 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Possible duplicate employer UIF',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Was there no SDL for the specified payslip?
                    if( $numSdlItems < 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'No SDL',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    else if( $numSdlItems > 1 ) {
                        // Add an exception
                        $exceptions[] = [
                            'description' => 'Possible duplicate SDL',
                            'payslip' => [
                                'id' =>  $payslipRow['id'],
                                'fromDate' =>  $payslipRow['from_date'],
                                'toDate' =>  $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' =>  $payslipRow['employee_id'],
                                'name' =>  $payslipRow['employee_name']
                            ]
                        ];
                    }
                    
                    // Check provdent fund items
                    
                    // NOTE:
                    // 
                    // The following is already checked when the payslip is processed and doesn't
                    // constitute an exception as much as an error. In other words, the user
                    // should NEVER be able to process a payrun where payslip periods overlap
                    //
                    
                    /*
                    // Check that the payslip isn't in conflict with any payslips from other payruns
                    $periodQuery = 
                        'SELECT DISTINCT ' .
                            'payruns.description AS payrun_description ' .
                        'FROM ' .
                            'payslips ' .
                        'LEFT JOIN ' .
                            'payruns ON payruns.id = payslips.payrun_id ' .
                        'WHERE ' .
                            'payruns.processed_on IS NOT NULL AND ' .
                            'payslips.payrun_id != $1 AND ' .
                            'payslips.employee_id = $2 AND ' .
                            'payslips.status_code = \'ACTI\' AND ' .
                            '( ' . 
                                '( ' . 
                                    'payslips.sars_year = $3 AND ' .
                                    'payslips.period = $4 ' .
                                ') OR ' .
                                '( ' . 
                                    '( ' . 
                                        'payslips.from_date >= $5 AND ' .
                                        'payslips.from_date <= $6 ' .
                                    ') OR ' .
                                    '( ' . 
                                        'payslips.to_date >= $5 AND ' .
                                        'payslips.to_date <= $6 ' .
                                    ') ' .
                                ') ' .
                            ');';
                    $periodResult = $db->paramQuery($periodQuery, [
                        $payrunId,
                        $payslipRow['employee_id'],
                        $payslipRow['sars_year'],
                        $payslipRow['period'],
                        $payslipRow['from_date'],
                        $payslipRow['to_date']
                    ]);
                    if( !$periodResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    // If we have a row then that payslip is in conflict
                    if( $periodResult->getRowCount() >= 1 ) {
                        $periodRow = $periodResult->fetchAssociative();
                        $exceptions[] = [
                            'description' => 'Payslip period conflict with payslip from \'' . $periodRow['payrun_description'] . '\' payrun',
                            'payslip' => [
                                'id' =>  null,
                                'fromDate' => $payslipRow['from_date'],
                                'toDate' => $payslipRow['to_date']
                            ],
                            'employee' => [
                                'id' => $payslipRow['employee_id'],
                                'name' => $payslipRow['employee_name']
                            ]
                        ];
                    }
                    */
                }
                
                // For every generated payslip
                for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                    // Is the generated payslip for the same employee as an active payslip in the payrun?
                    if( $generatedPayslips[$i]['employee']['id'] == $payslipRow['employee_id'] && $payslipRow['status_code'] === 'ACTI' ) {
                        // Is the generated payslip for the same period or tax period as a payslip in the payrun?
                        if( ( ( $generatedPayslips[$i]['taxPeriod']['type'] == $payslipRow['payment_period_code'] ) && 
                              ( $generatedPayslips[$i]['employee']['paymentPeriodEndDay'] == $payslipRow['payment_period_end_day'] ) &&
                              ( $generatedPayslips[$i]['taxPeriod']['taxYear'] == $payslipRow['sars_year'] ) &&
                              ( $generatedPayslips[$i]['taxPeriod']['number'] == $payslipRow['period'] ) ) || 
                            ( ( $generatedPayslips[$i]['fromDate'] == $payslipRow['from_date'] ) && 
                              ( $generatedPayslips[$i]['toDate'] == $payslipRow['to_date'] ) ) ) {
                            // The payslip is accounted for, remove it from the array
                            array_splice($generatedPayslips, $i, 1);
                            break;
                        }
                    }
                }
            }
            
            // Add an exception for every required payslip not currently in the payrun
            for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                $exceptions[] = [
                    'description' => 'Missing payslip',
                    'payslip' => [
                        'id' =>  null,
                        'fromDate' => $generatedPayslips[$i]['fromDate'],
                        'toDate' => $generatedPayslips[$i]['toDate']
                    ],
                    'employee' => [
                        'id' => $generatedPayslips[$i]['employee']['id'],
                        'name' => $generatedPayslips[$i]['employee']['name']
                    ]
                ];
            }
            
            echo( json_encode(['ok' => true, 'exceptions' => $exceptions]) );
            return true;
        }
        
        // Function to list payruns
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getTaxYearList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
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
            $whereClause = 'WHERE (payruns.processed_on IS NOT NULL) ';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 'AND (CAST(tax_year AS VARCHAR) ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
            
            // Get the tax years for all the available payruns
            $sqlQuery =
                'SELECT DISTINCT ' .
                    'CASE WHEN ' . 
                        'EXTRACT(MONTH FROM payslips.to_date) > 2 ' . 
                    'THEN ' . 
                        'EXTRACT(YEAR FROM payslips.to_date) + 1 ' .
                    'ELSE ' . 
                        'EXTRACT(YEAR FROM payslips.to_date) ' .
                    'END AS tax_year ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                $whereClause .
                'ORDER BY ' .
                    'tax_year ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create years array
            $taxYears = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $taxYears[] = [
                    'year' => $sqlRow['tax_year']
                ];
            }
            
            // Are there no tax years to list?
            if( count($taxYears) <= 0 ) {
                // Get the current year
                $today = new DateTime( date("Y-m-d") );
                $year = $today->format('Y');
                
                // Are we in the next tax year?
                if( $today->format('m') > 2 ) {
                    $year = $year + 1;
                }
                
                // Add the tax year
                $taxYears[] = [
                    'year' => $year
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'taxYears' => $taxYears]) );
            return true;
        }
        
        
        // Function to list of payments for a given payrun
        //
        // Required Parameters
        //  payrunId                The id of the payrun whose payments to get
        //
        // Optional Parameters
        //  None
        public function getPaymentList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            
            // Get the payments for the specified payrun
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
                        'payslip_category_code = \'FBEN\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'included_fringe_benefit_details AS ( ' .
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
                    'employees.cell_number, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS total_income, ' .
                    'CAST(COALESCE(deduction_details.total, 0) AS FLOAT) AS total_deductions, ' .
                    'CAST(COALESCE(contribution_details.total, 0) AS FLOAT) AS total_contributions, ' .
                    'CAST(COALESCE(fringe_benefit_details.total, 0) AS FLOAT) AS total_fringe_benefits, ' .
                    'CAST(COALESCE(allowance_details.total, 0) AS FLOAT) AS total_allowances, ' .
                    'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                    'CAST(COALESCE(employee_uif_details.total, 0) AS FLOAT) AS total_employee_uif, ' .
                    'CAST(COALESCE(employer_uif_details.total, 0) AS FLOAT) AS total_employer_uif, ' .
                    'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl, ' .
                    'CAST(COALESCE(income_details.total, 0) - 
                        COALESCE(deduction_details.total, 0) + 
                        COALESCE(allowance_details.total, 0) + 
                        COALESCE(included_fringe_benefit_details.total, 0) 
                        AS FLOAT) AS nett_income ' .
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
                    'included_fringe_benefit_details ON included_fringe_benefit_details.payslip_id = payslips.id AND ' .
                        'included_fringe_benefit_details.employee_id = payslips.employee_id ' .
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
            $payments = [];
            $uifTotal = 0.00;
            $payeTotal = 0.00;
            $sdlTotal = 0.00;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Is there nett income to post?
                if( (float)$sqlRow['nett_income'] > 0.009 ) {
                    $payments[] = [
                        'payslipId' => $sqlRow['payslip_id'],
                        'employeeId' => $sqlRow['employee_id'],
                        'employeeAlias' => $sqlRow['alias'],
                        'employeeEmailAddress' => $sqlRow['email_address'],
                        'employeeCellNumber' => $sqlRow['cell_number'],
                        'amount' => $sqlRow['nett_income']
                    ];
                }
                
                // Add UIF, PAYE, and SDL totals
                $uifTotal = $uifTotal + (float)$sqlRow['total_employer_uif'] + (float)$sqlRow['total_employee_uif'];
                $payeTotal = $payeTotal + (float)$sqlRow['total_paye'];
                $sdlTotal = $sdlTotal + (float)$sqlRow['total_sdl'];
            }
            
            /*
            // NOTE:
            
            // We may want to add the totals at a later time
            
            // Add transactions for UIF total, if any
            if( $uifTotal > 0.009 ) {
                $payments[] = [
                    'amount' => $uifTotal
                ];
            }
                
            // Add transactions for PAYE total
            if( $payeTotal > 0.009 ) {
                $payments[] = [
                    'amount' => $payeTotal
                ];
            }
            
            // Add transactions for SDL total, if any
            if( $sdlTotal > 0.009 ) {
                $payments[] = [
                    'amount' => $sdlTotal
                ];
            }
            */
            
            // Send result
            echo( json_encode(['ok' => true, 'payments' => $payments]) );
            return true;
        }
        
        // Function to check payments export
        //
        // Required Parameters
        //  payrunId                The id of the payrun whose payments to get
        //  paymentDate             The date of the payment(s)
        //  bankCode                The code of the bank for which the payments should be exported
        //  accountNumber           The account number for the account for which the payments should be exported
        //  branchCode              The branch code of the bank for which the payments should be exported
        //  employeeReference       The reference for the emplpoyee payment
        //  format                  The format of the export CSVF, ACBF, or PAIN
        //  employees               An array of employees whose payments should be exported
        //
        //  employees = [
        //      id,                     The id of the employee
        //      payslipId,              The id of the employee payslip
        //      emailNotify,            Whether a notification should be sent via email (true or false)
        //      notifyEmailAddress,     The email address for email notification
        //      smsNotify,              Whether a notification should be sent via SMS (true or false)
        //      notifyCellNumber        The cell number for SMS notification
        //  ]
        //
        // Optional Parameters
        //  None
        public function checkPaymentsExport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'paymentDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'bankCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accountNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'branchCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employeeReference' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employees' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'emailNotify' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                        'notifyEmailAddress' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                        'smsNotify' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => true],
                        'notifyCellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            
            // Check the following:
            // - paymentDate: Not earlier than today, no more than 356 days into future
            // - accountNumber: Check the account number
            // - format: Is the format supported by the given bank account
            // - For every employee:
            //   - Is the employee part of the specified payrun?
            //   - Does the employee have valid bank account details?
            //   - If email notification should be sent, is the notify email address valid?
            //   - If SMS notification should be sent, is the notify cell number valid?
            
            // Is the payment date in the past?
            $today = new DateTime(date('Y-m-d'));
            $paymentDate = new DateTime($data['paymentDate']);
            if( $paymentDate < $today ) {
                echo( json_encode(['ok' => false, 'error' => 'Payments cannot be dated in the past.']) );
                return false;
            }
            
            // Is the payment date more than 365 days in the future?
            $today->add(new DateInterval('P365D'));
            if( $paymentDate > $today ) {
                echo( json_encode(['ok' => false, 'error' => 'Payments cannot be dated more than 365 days in advance.']) );
                return false;
            }
            
            // Load the bank account details
            $sqlQuery = 
                'SELECT ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name ' .
                'FROM ' .
                    'financial_institutions ' .
                'WHERE ' .
                    'financial_institutions.code = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['bankCode']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Was the bank account not found?
            if( $sqlResult->getRowCount() != 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The specified bank could not be found.']) );
                return false;
            }
            
            // Check the account number
            $accountNumber = preg_replace('/[^0-9.]+/', '', $data['accountNumber']);
            if( $accountNumber === '' ) {
                echo( json_encode(['ok' => false, 'error' => 'No valid account number was specified.']) );
                return false;
            }
            
            // Check the branch code
            $branchCode = preg_replace('/[^0-9.]+/', '', $data['branchCode']);
            if( strlen( $branchCode ) !== 6 ) {
                echo( json_encode(['ok' => false, 'error' => 'No valid branch code was specified.']) );
                return false;
            }
            
            // Is the format not supported for the specified financial institution?
            $sqlRow = $sqlResult->fetchAssociative();
            if( $data['format'] === 'CSV' ) {
                if( $sqlRow['financial_institution_code'] !== 'FNBA' ) {
                    echo( json_encode(['ok' => false, 'error' => 'The specified export format is not currently supported.']) );
                    return false;
                }
            }
            
            // Get the employee details for the specified payrun
            $sqlQuery =
                'SELECT DISTINCT ' .
                    'payslips.employee_id, ' .
                    'employees.full_names, ' .
                    'employees.last_name, ' .
                    'employees.alias, ' .
                    'employees.id_number, ' .
                    'employees.email_address, ' .
                    'employees.cell_number, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'employee_bank_details.id AS employee_bank_details_id, ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name, ' .
                    'bank_account_types.code AS bank_account_type_code, ' .
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'employee_bank_details.account_number, ' .
                    'employee_bank_details.branch_code ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'financial_institutions ON financial_institutions.code = employee_bank_details.financial_institution_code ' .
                'LEFT JOIN ' .
                    'bank_account_types ON bank_account_types.code = employee_bank_details.bank_account_type_code ' .
                'WHERE ' .
                    'payslips.status_code = \'ACTI\' AND ' . 
                    'payslips.payrun_id = $1 ' .
                'ORDER BY ' .
                    'payslips.employee_id ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$payrunId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // For every employee in the payrun
            $numEmployeesFound = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // For every employee for whom payment should be made
                $employeeFound = false;
                foreach( $data['employees'] as $employee ) {
                    // For every employee in the payrun
                    if( $sqlRow['employee_id'] == $employee['id'] ) {
                        $employeeFound = true;
                        $numEmployeesFound++;
                        // break;
                    }
                }
                
                // Was the employee NOT found?
                if( !$employeeFound ) {
                    // Check the next employee
                    continue;
                }
                
                // Check that employee bank details are valid
                if( $sqlRow['employee_bank_details_id'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has no bank details.']) );
                    return false;
                }
                
                if( $sqlRow['financial_institution_code'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has no valid bank.']) );
                    return false;
                }
                
                if( $sqlRow['bank_account_type_code'] === null ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has no valid account type.']) );
                    return false;
                }
                
                if( ($sqlRow['account_number'] === null) || (trim($sqlRow['account_number']) == '') ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has no valid account number.']) );
                    return false;
                }
                else {
                    if( strlen(preg_replace('/[^0-9.]+/', '', $sqlRow['account_number'])) > 20 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has an invalid account number.']) );
                        return false;
                    }
                }
                
                if( ($sqlRow['branch_code'] === null) || (trim($sqlRow['branch_code']) == '') ) {
                    echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has no valid branch code.']) );
                    return false;
                }
                else {
                    if( strlen(preg_replace('/[^0-9.]+/', '', $sqlRow['branch_code'])) !== 6 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' has an invalid branch code.']) );
                        return false;
                    }
                }
                
                // Should a notification email be sent?
                if( $employee['emailNotify'] ) {
                    // Check that the given email address is valid
                    if( strlen( $employee['notifyEmailAddress'] ) < 3 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' should be notified via email, but no valid email address was specified.']) );
                        return false;
                    }
                }
                
                // Should a notification SMS be sent?
                if( $employee['smsNotify'] ) {
                    // Check that the given cell number is valid
                    $cellNumber = str_replace('+27', '0', $employee['notifyCellNumber']);
                    $cellNumber = preg_replace('/[^0-9.]+/', '', $cellNumber);
                    if( strlen( $cellNumber ) !== 10 ) {
                        echo( json_encode(['ok' => false, 'error' => 'Employee \'' . $sqlRow['alias'] . '\' should be notified via SMS, but no valid cell number was specified.']) );
                        return false;
                    }
                }
            }
            
            // Was the employee NOT found?
            if( $numEmployeesFound !== count($data['employees']) ) {
                echo( json_encode(['ok' => false, 'error' => 'One or more of the specified employees are not part of the payrun.']) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to export payments
        //
        // Required Parameters
        //  payrunId                The id of the payrun whose payments to get
        //  paymentDate             The date of the payment(s)
        //  bankCode                The code of the bank for which the payments should be exported
        //  accountNumber           The account number for the account for which the payments should be exported
        //  branchCode              The branch code of the bank for which the payments should be exported
        //  employeeReference       The reference for the emplpoyee payment
        //  format                  The format of the export CSVF, ACBF, or PAIN
        //  employees               An array of employees whose payments should be exported
        //
        //  employees = [
        //      id,                     The id of the employee
        //      payslipToDate,          The to date of the paylsip for the employee
        //      emailNotify,            Whether a notification should be sent via email (true or false)
        //      notifyEmailAddress,     The email address for email notification
        //      smsNotify,              Whether a notification should be sent via SMS (true or false)
        //      notifyCellNumber        The cell number for SMS notification
        //  ]
        //
        // Optional Parameters
        //  None
        public function exportPayments($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'payrunId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'paymentDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => false],
                'bankCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accountNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'branchCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employeeReference' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'employees' => ['type' => Json::TYPE_ARRAY, 'required' => true, 'nullable' => false, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'id' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'payslipId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                        'emailNotify' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                        'notifyEmailAddress' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true],
                        'smsNotify' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => true],
                        'notifyCellNumber' => ['type' => Json::TYPE_STRING, 'required' => true, 'nullable' => true]
                    ]]
                ]]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $payrunId = $data['payrunId'];
            $companyFinancialInstitutionCode = $data['bankCode'];
            $companyAccountNumber = preg_replace('/[^0-9.]+/', '', $data['accountNumber']);
            if( strlen($companyAccountNumber) < 11 ) {
                $companyAccountNumber = str_pad($companyAccountNumber, 11, '0', STR_PAD_LEFT);
            }
            else {
                $companyAccountNumber = substr($companyAccountNumber, 0, 11);
            }
            $companyBranchCode = preg_replace('/[^0-9.]+/', '', $data['branchCode']);
            $employeeReference = $data['employeeReference'];
            $hashTotal = 0;
            
            // Get the payments for the specified payrun
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
                        'payslip_category_code = \'FBEN\' ' .
                    'GROUP BY ' .
                        'payslip_id, employee_id ' .
                '), ' . 
                'included_fringe_benefit_details AS ( ' .
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
                    'employees.cell_number, ' .
                    'employees.payment_period_code, ' .
                    'employees.payment_day, ' .
                    'employee_bank_details.id AS employee_bank_details_id, ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name, ' .
                    'bank_account_types.code AS bank_account_type_code, ' .
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'employee_bank_details.account_number, ' .
                    'employee_bank_details.branch_code, ' .
                    'CAST(COALESCE(income_details.total, 0) AS FLOAT) AS total_income, ' .
                    'CAST(COALESCE(deduction_details.total, 0) AS FLOAT) AS total_deductions, ' .
                    'CAST(COALESCE(contribution_details.total, 0) AS FLOAT) AS total_contributions, ' .
                    'CAST(COALESCE(fringe_benefit_details.total, 0) AS FLOAT) AS total_fringe_benefits, ' .
                    'CAST(COALESCE(allowance_details.total, 0) AS FLOAT) AS total_allowances, ' .
                    'CAST(COALESCE(paye_details.total, 0) AS FLOAT) AS total_paye, ' .
                    'CAST(COALESCE(employee_uif_details.total, 0) AS FLOAT) AS total_employee_uif, ' .
                    'CAST(COALESCE(employer_uif_details.total, 0) AS FLOAT) AS total_employer_uif, ' .
                    'CAST(COALESCE(sdl_details.total, 0) AS FLOAT) AS total_sdl, ' .
                    'CAST(COALESCE(income_details.total, 0) - 
                        COALESCE(deduction_details.total, 0) + 
                        COALESCE(allowance_details.total, 0) + 
                        COALESCE(included_fringe_benefit_details.total, 0) 
                        AS FLOAT) AS nett_income ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'employee_bank_details ON employee_bank_details.employee_id = payslips.employee_id ' .
                'LEFT JOIN ' .
                    'financial_institutions ON financial_institutions.code = employee_bank_details.financial_institution_code ' .
                'LEFT JOIN ' .
                    'bank_account_types ON bank_account_types.code = employee_bank_details.bank_account_type_code ' .
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
                    'included_fringe_benefit_details ON included_fringe_benefit_details.payslip_id = payslips.id AND ' .
                        'included_fringe_benefit_details.employee_id = payslips.employee_id ' .
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
            
            // Create the file contents
            $contents = [];
            $sequenceNumber = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // For every employee for whom payment should be made
                $exportedEmployeeIds = [];
                foreach( $data['employees'] as $employee ) {
                    // Was the employee found?
                    if( $sqlRow['employee_id'] == $employee['id'] ) {
                        // // Make certain the employee data has not already been exported
                        // $hasEmployeeBeenExported = false;
                        // for( $i = 0; $i < count($exportedEmployeeIds); $i++ ) {
                        //     if( $exportedEmployeeIds[$i] == $employee['id'] ) {
                        //         $hasEmployeeBeenExported = true;
                        //         break;
                        //     }
                        // }
                        
                        // Skip the employee if it has already been exported
                        if( $sqlRow['payslip_id'] !== $employee['payslipId'] ) continue;
                        
                        // Remember the id of the employee to be exported
                        $exportedEmployeeIds[] = $employee['id'];
                        
                        // Format the employee account number
                        $employeeAccountNumber =  preg_replace('/[^0-9.]+/', '', $sqlRow['account_number']);
                        
                        // Calculate the hash total
                        $hashTotal = $hashTotal + $employeeAccountNumber;
                        
                        // Set the payment details
                        $recipientName = $sqlRow['alias'];
                        if( strlen($recipientName) > 20 ) {
                            $recipientName = substr($recipientName, 0, 20);
                        }
                        $recipientAccount = preg_replace('/[^0-9.]+/', '', $sqlRow['account_number']);
                        $recipientAccountType = '0';
                        if( $sqlRow['bank_account_type_code'] === 'CACC' ) {
                            $recipientAccountType = '1';
                        }
                        else if( $sqlRow['bank_account_type_code'] === 'SACC' ) {
                            $recipientAccountType = '2';
                        }
                        $recipientBranchCode = preg_replace('/[^0-9.]+/', '', $sqlRow['branch_code']);
                        $amount = $sqlRow['nett_income'];
                        $ownReference = 'Salary ' . $sqlRow['alias'];
                        if( strlen($ownReference) > 20 ) {
                            $ownReference = substr($ownReference, 0, 20);
                        }
                        
                        // Should a notification email be sent?
                        $emailNotify = '';
                        $notifyEmailAddress = '';
                        $notifyEmailSubject = '';
                        if( $employee['emailNotify'] ) {
                            $notifyEmailAddress = $employee['notifyEmailAddress'];
                            $notifyEmailSubject = $employeeReference;
                            $emailNotify = 'Yes';
                        }
                        
                        // Should a notification SMS be sent?
                        $smsNotify = '';
                        $notifyCellNumber = '';
                        $notifyCellNumberCode = '';
                        if( $employee['smsNotify'] ) {
                            $notifyCellNumber = str_replace('+27', '0', $employee['notifyCellNumber']);
                            $notifyCellNumber = preg_replace('/[^0-9.]+/', '', $notifyCellNumber);
                            $notifyCellNumberCode = substr($notifyCellNumber, 0, 3);
                            $notifyCellNumber = substr($notifyCellNumber, -7);
                            $smsNotify = 'Yes';
                        }
                        
                        // Set the contents depending on the bank and export format
                        if( ($companyFinancialInstitutionCode === 'FNBA') && ($data['format'] === 'CSVF') ) {
                            // Set the CSV contents
                            $contents[] = [
                                $recipientName,
                                $recipientAccount,
                                $recipientAccountType,
                                $recipientBranchCode,
                                $amount,
                                $ownReference,
                                $employeeReference,
                                $emailNotify,
                                $notifyEmailAddress, 
                                $notifyEmailSubject,
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                '',
                                $smsNotify,
                                $notifyCellNumberCode,
                                $notifyCellNumber,
                                '',
                                '',
                                ''
                            ];
                            break;
                        }
                        else if( $data['format'] === 'ACBF' ) {
                            // Update the sequence number
                            $sequenceNumber = $sequenceNumber + 1;
                            
                            // Is it a non-standard account number
                            $nonStandardRecipientAccount = '00000000000000000000';
                            if( strlen( $recipientAccount ) > 11 ) {
                                $nonStandardRecipientAccount = str_pad($recipientAccount, 20, '0', STR_PAD_LEFT);
                                $recipientAccount = '00000000000';
                            }
                            else {
                                $recipientAccount = str_pad($recipientAccount, 11, '0', STR_PAD_LEFT);
                            }
                            
                            // Format the amount
                            $amount = (int)($amount * 100);
                            $amount = str_pad($amount, 11, '0', STR_PAD_LEFT);
                            
                            // Format the action date
                            $actionDate = substr(preg_replace('/[^0-9.]+/', '', $data['paymentDate']), -6);
                            
                            // Format the employee reference
                            if( strlen($employeeReference) < 20 ) {
                                $employeeReference = str_pad($employeeReference, 20, ' ', STR_PAD_RIGHT);
                            }
                            else {
                                $employeeReference = substr($employeeReference, 0, 20);
                            }
                            
                            // Format the recipient name
                            if( strlen($recipientName) < 15 ) {
                                $recipientName = str_pad($recipientName, 15, ' ', STR_PAD_RIGHT);
                            }
                            else {
                                $recipientName = substr($recipientName, 0, 15);
                            }
                            
                            // Create the ACB record
                            $record = '' .
                                '10' .                                              // Record Identifier (2)
                                $companyBranchCode .                                // User Branch (6)
                                $companyAccountNumber .                             // User Nominated Account Number (11)
                                '0000' .                                            // User Code (4)
                                str_pad($sequenceNumber, 6, '0', STR_PAD_LEFT) .    // User Sequence Number (6)
                                $recipientBranchCode .                              // Homing (Recipient) Branch (6)
                                $recipientAccount .                                 // Homing (Recipient) Account Number (11)
                                $recipientAccountType .                             // Type of Account (1)
                                $amount .                                           // Amount (11)
                                $actionDate .                                       // Action Date [YYMMDD] (6)
                                '00' .                                              // Entry Class (2)
                                '0' .                                               // Tax Code (1)
                                '00' .                                              // Filler (2)
                                '0' .                                               // Filler (1)
                                $employeeReference .                                // To Account Reference (20)
                                str_pad('', 10, '0', STR_PAD_RIGHT) .               // Filler (10)
                                $recipientName .                                    // Homing (Recipient) Account Name (15)
                                str_pad('', 15, '0', STR_PAD_RIGHT) .               // Filler (15)
                                $nonStandardRecipientAccount .                      // Non-Standard Account Number (20)
                                str_pad('', 16, '0', STR_PAD_RIGHT) .               // Filler (16)
                                '00' .                                              // Homing Institution (2)
                                str_pad('', 12, '0', STR_PAD_RIGHT);                // Filler (12)
                                
                            // Save the record
                            $contents[] = $record;
                        }
                    }
                }
            }
            
            // Finalize the hash total
            $hashTotal = str_pad(sprintf("%.0f", ($hashTotal + $companyAccountNumber)), 12, '0', STR_PAD_LEFT);
            $hashTotal = substr($hashTotal, -12);
            
            // Write the file depending on the bank and export format
            if( ($companyFinancialInstitutionCode === 'FNBA') && ($data['format'] === 'CSVF') ) {
                // Write out headers 
                $headers = [];
                $headers [] = [ "BInSol - U ver 1.00" ];
                $headers [] = [ $data['paymentDate'] ];
                $headers [] = [ $companyAccountNumber, $hashTotal ];
                $headers [] = [
                    "RECIPIENT NAME", "RECIPIENT ACCOUNT", "RECIPIENT ACCOUNT TYPE", "BRANCHCODE", "AMOUNT", 
                    "OWN REFERENCE", "RECIPIENT REFERENCE", "EMAIL 1 NOTIFY", "EMAIL 1 ADDRESS", 
                    "EMAIL 1 SUBJECT", "EMAIL 2 NOTIFY", "EMAIL 2 ADDRESS", "EMAIL 2 SUBJECT", "EMAIL 3 NOTIFY", 
                    "EMAIL 3 ADDRESS", "EMAIL 3 SUBJECT", "EMAIL 4 NOTIFY", "EMAIL 4 ADDRESS", "EMAIL 4 SUBJECT", 
                    "EMAIL 5 NOTIFY", "EMAIL 5 ADDRESS", "EMAIL 5 SUBJECT", "FAX 1 NOTIFY", "FAX 1 CODE", 
                    "FAX 1 NUMBER", "FAX 1 SUBJECT", "FAX 2 NOTIFY", "FAX 2 CODE", "FAX 2 NUMBER", 
                    "FAX 2 SUBJECT", "SMS 1 NOTIFY", "SMS 1 CODE", "SMS 1 NUMBER", "SMS 2 NOTIFY", 
                    "SMS 2 CODE", "SMS 2 NUMBER"
                ];
                
                // Create the writer
                $writer = $this->writeReport(['format' => 'csv'], 'payment_export', $headers);
                
                // Write the contents
                foreach($contents as $content) {
                    $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
                }
                $writer->close();
            }
            else if( $data['format'] === 'ACBF' ) {
                // Create a random folder in the temp directory
                $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                $charactersLength = strlen($characters);
                
                $destDir = '';
                for ($i = 0; $i < 32; $i++) {
                    $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
                }
                $destDir = CONF_TEMP_DIR . $destDir . '/';
                
                // Does the destination folder not exist?
                if (!file_exists($destDir)) {
                    mkdir($destDir, 0777, true);
                }
                
                // Create a random filename for the bankserv file
                $filename = '';
                for ($i = 0; $i < 32; $i++) {
                    $filename = $filename . $characters[rand(0, $charactersLength - 1)];
                }
                $filename = $destDir . $filename . '.ACB';
                
                $fp = fopen($filename, "w");
                
                // Write the headers
                fwrite($fp, '02' . str_pad('', 178, '0', STR_PAD_RIGHT) . "\r\n");
                fwrite($fp, '04' . str_pad('', 178, '0', STR_PAD_RIGHT) . "\r\n");
                
                // Write the records
                for ($i = 0; $i < count($contents); $i++) {
                    // Write the byte to the file
                    fwrite($fp, $contents[$i] . "\r\n");
                }
                
                // Create the contra record
                $actionDate = substr(preg_replace('/[^0-9.]+/', '', $data['paymentDate']), -6);
                $contraRecord = '' .
                    '12' .                                              // Record Identifier (2)
                    $companyBranchCode .                                // User Branch (6)
                    $companyAccountNumber .                             // User Nominated Account Number (11)
                    str_pad('', 39, '0', STR_PAD_RIGHT) .               // Filler (39)
                    $actionDate .                                       // Action Date [YYMMDD] (6)
                    str_pad('', 116, '0', STR_PAD_RIGHT);               // Filler (116)
                    
                // Write the contra record
                fwrite($fp, $contraRecord . "\r\n");
                
                // Create the user trailer
                $trailer =  '' .
                    '92' .                                              // Record Identifier (2)
                    str_pad('', 70, '0', STR_PAD_RIGHT) .               // Filler (70)
                    $hashTotal .                                        // Hash Total (12)
                    str_pad('', 96, '0', STR_PAD_RIGHT);                // Filler (96)
                
                // Write the user trailer
                fwrite($fp, $trailer . "\r\n");
                
                // Create the trailer
                $trailer =  '' .
                    '94' .                                              // Record Identifier (2)
                    str_pad('', 178, '0', STR_PAD_RIGHT);               // Filler (178)
                    
                // Write the trailer
                fwrite($fp, $trailer . "\r\n");
                fclose($fp);
                clearstatcache();
                
                // Send the file back to the client
                header('Content-Length: ' . filesize($filename));
                header('Content-Type: text/plain');
                header('Cache-Control: cache, max-age=31536000');
                header('Content-Disposition: attachment; filename=' . 'PAYMENTS_'. date('Ymd') . '.ACB');
                header('Expires: ' . date('D, d M Y H:i:s \G\M\T', time() + 31536000));
                header('Pragma: cache');
                header('Last-Modified: ' . date('D, d M Y H:i:s \G\M\T', filemtime($filename)));
                readfile( $filename );
                
                // Delete the file
                unlink($filename);
                
                // Delete the temp folder
                rmdir($destDir);
            }
            
            return true;
        }
        
        // Function to get the compensation fund earnings cap
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getCompensationFundEarningCap($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'taxYear' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'taxYear' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
                
                // Optional parameters
                // ...
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the compensation fund earnings cap (per employee per year)
            $earningsCap = \PayslipUtil\getCompensationFundEarningCap( new DateTime(($data['taxYear'] - 1) . '-03-01')  );
            
            echo( json_encode(['ok' => true, 'earningsCap' => $earningsCap]) );
            return true;
        }
        
        
        //
        // PRIVATE FUNTIONS
        //
        
        // Function to load a payslip form the database and convert it to an object
        //
        // @param $payslipId                The id of the payslip to convert to an object
        //
        // Returns
        //  [
        //      'fromDate',                 // The payslip from date
        //      'toDate',                   // The payslip to date
        //      'employee' => [
        //          'id',                   // The employee id
        //          'age',                  // The employee age
        //          'paymentPeriodEndDay'   // The employee payment day
        //      ],
        //      'taxPeriod' => [
        //          'type',                 // The tax period type
        //          'number',               // The tax period number
        //          'taxYear'               // The tax period year
        //      ],
        //      'items' => [
        //          'id',                   // The payslip item id
        //          'type' => [
        //              'code',             // The payslip item type code
        //              'unitCode'          // The payslip item type unit code
        //          ],
        //          'category' => [
        //              'code'              // The payslip item category code
        //          ],
        //          'description',          // The payslip item description
        //          'accrualDate',          // The payslip item accrual date
        //          'autoCalculate',        // Whether the payslip item should be calculated automatically
        //          'units',                // The payslip item units
        //          'rate',                 // The payslip item rate
        //          'amount',               // The payslip item amount
        //          'includeInNettPay'      // Whether the amount should be included in nett pay
        //      ]
        //  ]
        private function payslipToObject( $db, $payslipId ) {
            // Get the payslip details
            $payslipQuery = 
                'SELECT DISTINCT ' .
                    'payslips.id, ' .
                    'payslips.period, ' .
                    'payslips.sars_year, ' .
                    'payslips.from_date, ' .
                    'payslips.to_date, ' .
                    'payslips.status_code, ' .
                    'payslip_status_codes.name AS status_name, ' .
                    'payslips.payment_period_code, ' .
                    'payslips.payment_period_end_day, ' .
                    'payslips.paye_bonus_calculation_type_code, ' .
                    'payslips.employee_id, ' .
                    'employees.alias AS employee_name, ' .
                    'EXTRACT(YEAR FROM age(payslips.to_date, employees.date_of_birth)) AS employee_age, ' .
                    'employees.employment_start_date, ' .
                    'employees.employment_end_date, ' .
                    'employees.email_address ' .
                'FROM ' .
                    'payslips ' .
                'LEFT JOIN ' .
                    'payslip_status_codes ON payslip_status_codes.code = payslips.status_code ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = payslips.employee_id ' .
                'WHERE ' .
                    'payslips.id = $1;';
            $payslipResult = $db->paramQuery($payslipQuery, [
                $payslipId
            ]);
            if( !$payslipResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            if( $payslipResult->getRowCount() !== 1 ) {
                return ['ok' => false, 'error' => 'Payslip not found.'];
            }
            
            $payslipRow = $payslipResult->fetchAssociative();
            
            // Set the payslip details
            $payslip = [
                'id' => $payslipRow['id'],
                'statusCode' => $payslipRow['status_code'],
                'statusName' => $payslipRow['status_name'],
                'employee' => [
                    'id' => $payslipRow['employee_id'],
                    'name' => $payslipRow['employee_name'],
                    'age' => $payslipRow['employee_age'],
                    'paymentPeriodEndDay' => $payslipRow['payment_period_end_day'],
                    'emailAddress' => $payslipRow['email_address']
                ],
                'taxPeriod' => [
                    'type' => $payslipRow['payment_period_code'],
                    'number' => $payslipRow['period'],
                    'taxYear' => $payslipRow['sars_year']
                ],
                'payeBonusCalculationTypeCode' => $payslipRow['paye_bonus_calculation_type_code'],
                'fromDate' => $payslipRow['from_date'],
                'toDate' => $payslipRow['to_date'],
                'items' => []
            ];
            
            // Get all the items for the specified payslip
            $itemQuery = 
                'SELECT DISTINCT ' .
                    'payslip_items.id, ' .
                    'payslip_items.payslip_item_type_code, ' .
                    'payslip_item_types.payslip_item_unit_code, ' .
                    'payslip_item_types.payslip_category_code, ' .
                    'payslip_items.description, ' .
                    'payslip_items.accrual_date, ' .
                    'payslip_items.auto_calculate, ' .
                    'payslip_items.units, ' .
                    'payslip_items.rate, ' .
                    'payslip_items.total, ' .
                    'payslip_items.include_in_nett_pay, ' .
                    'payslip_items.provident_fund_id, ' .
                    'payslip_categories AS payslip_category_name, ' .
                    'payslip_categories.code, ' .
                    'array_position(ARRAY[\'INCO\',\'DEDU\',\'CONT\',\'FBEN\',\'ALLO\'], payslip_categories.code::text) AS custom_sort ' .
                'FROM ' .
                    'payslip_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_item_types.code = payslip_items.payslip_item_type_code ' .
                'LEFT JOIN ' .
                    'payslip_categories ON payslip_item_types.payslip_category_code = payslip_categories.code ' .
                'WHERE ' .
                    'payslip_items.payslip_id = $1 ' .
                'ORDER BY ' . 
                    'custom_sort, payslip_items.payslip_item_type_code ASC, payslip_items.description ASC;';
            $itemResult = $db->paramQuery($itemQuery, [
                $payslipRow['id']
            ]);
            if( !$itemResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            $items = [];
            while( $itemRow = $itemResult->fetchAssociative() ) {
                $providentFundId = $itemRow['provident_fund_id'];
                $employeeAmount = null;
                $employerAmount = null;
                $rfiItems = [];
                
                // Get the provident fund details
                if( $providentFundId !== null ) {
                    // Load the provident fund details
                    $providentFundSqlQuery = 
                        'SELECT ' . 
                            'provident_funds.name, ' .
                            'provident_funds.provident_fund_calculation_type_code, ' .
                            'provident_funds.employee_amount, ' .
                            'provident_funds.employer_amount, ' .
                            'provident_funds.category_factor, ' .
                            'provident_funds.is_active ' .
                        'FROM ' . 
                            'provident_funds ' .
                        'WHERE ' . 
                            'provident_funds.id = $1 ' .
                        'ORDER BY ' . 
                            'provident_funds.name ASC;';
                    $providentFundSqlResult = $db->paramQuery($providentFundSqlQuery, [$providentFundId]);
                    if( !$providentFundSqlResult->isValid() ) {
                        return ['ok' => false, 'error' => 'Database error.'];
                    }
                    
                    $providentFundSqlRow = $providentFundSqlResult->fetchAssociative();
                    
                    $employeeAmount = doubleval( $providentFundSqlRow['employee_amount'] );
                    $employerAmount = doubleval( $providentFundSqlRow['employer_amount'] );
                    
                    // Is the provident fund calculation based on retirement fund income items?
                    if( $providentFundSqlRow['provident_fund_calculation_type_code'] === 'PRFI' ) {
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
                        $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$providentFundId, $payslipRow['employee_id']]);
                        if( !$rfiItemSqlResult->isValid() ) {
                            return ['ok' => false, 'error' => 'Database error.'];
                        }
                        
                        while( $rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative() ) {
                            $rfiItems[] = [
                                'payslipItemTypeCode'  => $rfiItemSqlRow['payslip_item_type_code'],
                                'percentage' => $rfiItemSqlRow['percentage']
                            ];
                        }
                    }
                }
                
                // Add the payslip items
                $units = $itemRow['units'];
                if( $units !== null ) $units = doubleval($units);
                
                $rate = $itemRow['rate'];
                if( $rate !== null ) $rate = doubleval($rate);
                
                $amount = $itemRow['total'];
                if( $amount !== null ) $amount = doubleval($amount);
                
                $items[] = [
                    'id' => $itemRow['id'],
                    'type' => [
                        'code' => $itemRow['payslip_item_type_code'],
                        'unitCode' => $itemRow['payslip_item_unit_code'],
                    ],
                    'category' => [
                        'code' => $itemRow['payslip_category_code'],
                        'name' => $itemRow['payslip_category_name']
                    ],
                    'providentFund' => [
                        'id' => $itemRow['provident_fund_id'],
                        'employeeAmount' => $employeeAmount,
                        'employerAmount' => $employerAmount,
                        'rfiItems' => $rfiItems
                    ],
                    'loan' => [
                        'id' => null
                    ],
                    'description' => $itemRow['description'],
                    'accrualDate' => $itemRow['accrual_date'],
                    'autoCalculate' => $itemRow['auto_calculate'],
                    'units' => $units,
                    'rate' => $rate,
                    'amount' => $amount,
                    'includeInNettPay' => $itemRow['include_in_nett_pay']
                ];
            }
            
            // Add the payslip items to the payslip
            $payslip['items'] = $items;
            
            // Resturn the result
            return( ['ok' => true, 'payslip' => $payslip] );
        }
        
        // Required Parameters
        //  payeCalculationTypeCode         The PAYE calculation method ('PERI' for periodic, 'AVER' for tax averaging)
        //  payeBonusCalculationTypeCode    The PAYE bonus calculation method ('ACCU' for accurate, 'STAN' for standard)
        //  payslips                        An array of payslips
        //
        //  [
        //      'fromDate',                 // The payslip from date
        //      'toDate',                   // The payslip to date
        //      'employee' => [
        //          'id',                   // The employee id
        //          'age',                  // The employee age
        //          'paymentPeriodEndDay'   // The employee payment day
        //      ],
        //      'taxPeriod' => [
        //          'type',                 // The tax period type
        //          'number',               // The tax period number
        //          'taxYear'               // The tax period year
        //      ],
        //      'items' => [
        //          'id',                   // The payslip item id
        //          'type' => [
        //              'code',             // The payslip item type code
        //              'unitCode'          // The payslip item type unit code
        //          ],
        //          'category' => [
        //              'code'              // The payslip item category code
        //          ],
        //          'description',          // The payslip item description
        //          'accrualDate',          // The payslip item accrual date
        //          'autoCalculate',        // Whether the payslip item should be calculated automatically
        //          'units',                // The payslip item units
        //          'rate',                 // The payslip item rate
        //          'amount',               // The payslip item amount
        //          'includeInNettPay'      // Whether the amount should be included in nett pay
        //      ]
        //  ]
        //
        // Optional Parameters
        //  None
        private function recalculatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $payslips) {
            // Make certain all payslips are sorted by to date
            array_multisort(
                array_column($payslips, 'toDate'), SORT_ASC, SORT_STRING | SORT_FLAG_CASE,
                $payslips
            );
            
            // Calculate financial year seperately
            // ...
            
            // For every payslip
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Set the PAYE bonus calculation type code
                $payslips[$i]['payeBonusCalculationTypeCode'] = $payeBonusCalculationTypeCode;
                
                // Calculate the payslip values
                \PayslipUtil\calculatePayslipItems( $payslips[$i] );
                
                // Should the tax averaging method be used?
                if( $payeCalculationTypeCode === 'AVER' ) {
                    // Calculate the average tax payment for the given month
                    $result = $this->calculateAverageTaxPayment($db, $payslips[$i]['employee']['id'], $payslips[$i]['toDate'], $payslips, $payeBonusCalculationTypeCode);
                    if( $result['ok'] !== true ) {
                        return ['ok' => false, 'error' => $result['error']];
                    }
                    
                    $payeAmount = null;
                    if( $result['payment'] !== null ) {
                        $payeAmount = doubleval($result['payment']);
                    }
                    
                    // Was the final tax payment found?
                    // if( (doubleval($result['payment']) > 0.999) || (doubleval($result['payment']) < -0.999) ) {
                    if( $payeAmount !== null ) {
                        // Get the payslip index
                        // $payslipIndex = count($payslips) - 1;
                        
                        // Find the index of the PAYE correction item
                        $payeIndex = null;
                        for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                            if( ($payslips[$i]['items'][$j]['type']['code'] === '2000') && ($payslips[$i]['items'][$j]['autoCalculate'] == true) ) {
                                $payeIndex = $j;
                                break;
                            }
                        }
                        
                        // Was the PAYE correction index found?
                        if( $payeIndex !== null ) {
                            // Replace the value of the PAYE item
                            $payslips[$i]['items'][$payeIndex]['amount'] = $payeAmount;
                        }
                    }
                }
                
                // Calculate the number of pay periods in the tax year
                $numPeriods = 0;
                if( $payslips[$i]['taxPeriod']['type'] === 'MONT' ) {
                    $numPeriods = 12;
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'WEEK' ) {
                    // Get the payslip end date
                    $taxYearEnd = new DateTime($payslips[$i]['toDate']);
                    
                    // Is the payslip end date after the close of the tax year?
                    if( intval($taxYearEnd->format('n')) >= 3 ) { 
                        $taxYearEnd->modify('+1 year');
                    }
                    
                    // Set the end of the tax year
                    $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 3, 1); 
                    $taxYearEnd->modify('-1 day');
                    
                    // Get the number of payment periods in the specified tax year
                    $numPeriods = \PayslipUtil\getWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslips[$i]['toDate']), $payslips[$i]['employee']['paymentPeriodEndDay']);
                    // $numPeriods = 52;
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'BWEE' ) {
                    // Get the payslip end date
                    $taxYearEnd = new DateTime($payslips[$i]['toDate']);
                    
                    // Is the payslip end date after the close of the tax year?
                    if( intval($taxYearEnd->format('n')) >= 3 ) { 
                        $taxYearEnd->modify('+1 year');
                    }
                    
                    // Set the end of the tax year
                    $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 3, 1); 
                    $taxYearEnd->modify('-1 day');
                    
                    // // Get the number of payment periods in the specified tax year
                    $numPeriods = \PayslipUtil\getBiWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslips[$i]['toDate']), $payslips[$i]['employee']['paymentPeriodEndDay']);
                    // $numPeriods = 26;
                }
                
                // Is it the final payment period of the tax year?
                if( $payslips[$i]['taxPeriod']['number'] == $numPeriods ) {
                    // Calculate the final tax payment
                    $result = $this->calculateTaxCorrection($db, $payslips[$i]['employee']['id'], $payslips[$i]['taxPeriod']['taxYear'], $payslips, $payeBonusCalculationTypeCode);
                    if( $result['ok'] !== true ) {
                        return ['ok' => false, 'error' => $result['error']];
                    }
                    
                    $correctionAmount = null;
                    if( $result['payment'] !== null ) {
                        $correctionAmount = doubleval($result['payment']);
                    }
                    
                    // Was the final tax payment found?
                    if( ($correctionAmount !== null) /* && ((doubleval($result['payment']) > 0.999) || (doubleval($result['payment']) < -0.999)) */ ) {
                        // Get the payslip index
                        // $payslipIndex = count($payslips) - 1;
                        
                        // Find the index of the PAYE item
                        $payeIndex = null;
                        for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                            if( ($payslips[$i]['items'][$j]['type']['code'] === '2000') && ($payslips[$i]['items'][$j]['autoCalculate'] == true) ) {
                                $payeIndex = $j;
                                break;
                            }
                        }
                        
                        // Was the PAYE index found?
                        if( $payeIndex !== null ) {
                            // Adjust the value of the correction, if necesarry
                            $payeAmount = doubleval($payslips[$i]['items'][$payeIndex]['amount']);
                            if( ($payeAmount + $correctionAmount) <= 0.00 ) {
                                $correctionAmount = (0.00 - $payeAmount);
                            }
                        }
                        
                        // Find the index of the PAYE correction item
                        $payeIndex = null;
                        for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                            if( ($payslips[$i]['items'][$j]['type']['code'] === '2001') && ($payslips[$i]['items'][$j]['autoCalculate'] == true) ) {
                                $payeIndex = $j;
                                break;
                            }
                        }
                        
                        // Was the PAYE correction index found?
                        if( $payeIndex !== null ) {
                            // Replace the value of the PAYE Correction item
                            $payslips[$i]['items'][$payeIndex]['amount'] = $correctionAmount;
                        }
                        else {
                            // Add the PAYE Correction item
                            $payslips[$i]['items'][] = [
                                'id' => null,
                                'type' => [
                                    'code' => '2001',
                                    'unitCode' => 'FIXE'
                                ],
                                'category' => [
                                    'code' => 'DEDU'
                                ],
                                'providentFund' => [
                                    'id' => null,
                                    'employeeAmount' => null,
                                    'employerAmount' => null,
                                    'rfiItems' => []
                                ],
                                'loan' => [
                                    'id' => null
                                ],
                                'description' => 'PAYE Correction',
                                'autoCalculate' => true,
                                'units' => null,
                                'rate' => null,
                                'amount' => $correctionAmount,
                                'includeInNettPay' => false
                            ];
                        }
                    }
                }
            }
            
            return( ['ok' => true, 'payslips' => $payslips] );
        }
        
        // Function to generate all the payslips for a specified payrun
        // 
        //  payrunId                        The id of the payrun to generate payslips for
        //  payeCalculationTypeCode         The PAYE calculation method ('PERI' for periodic, 'AVER' for tax averaging)
        //  payeBonusCalculationTypeCode    The PAYE bonus calculation method ('ACCU' for accurate, 'STAN' for standard)
        //  startDate                       A DateTime object detailing the start date of the payrun
        //  endDate                         A DateTime object detailing the end date of the payrun
        // 
        // Returns
        //  [
        //      'fromDate',                 // The payslip from date
        //      'toDate',                   // The payslip to date
        //      'employee' => [
        //          'id',                   // The employee id
        //          'age',                  // The employee age
        //          'paymentPeriodEndDay'            // The employee payment day
        //      ],
        //      'taxPeriod' => [
        //          'type',                 // The tax period type
        //          'number',               // The tax period number
        //          'taxYear'               // The tax period year
        //      ],
        //      'items' => [
        //          'id',                   // The payslip item id
        //          'type' => [
        //              'code',             // The payslip item type code
        //              'unitCode'          // The payslip item type unit code
        //          ],
        //          'category' => [
        //              'code'              // The payslip item category code
        //          ],
        //          'description',          // The payslip item description
        //          'accrualDate',          // The payslip item accrual date
        //          'autoCalculate',        // Whether the payslip item should be calculated automatically
        //          'units',                // The payslip item units
        //          'rate',                 // The payslip item rate
        //          'amount',               // The payslip item amount
        //          'includeInNettPay'      // Whether the amount should be included in nett pay
        //      ]
        //  ]
        private function generatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $startDate, $endDate, $departmentId) {
            $payslips = [];
            
            // Setup the sql parameters
            $sqlParams = [];
            $sqlParams[] = $startDate->format('Y-m-d');
            $sqlParams[] = $endDate->format('Y-m-d');
            
            // Was a department specified?
            $departmentFilter = '';
            if( $departmentId !== null ) {
                // Add a filter for the department
                $sqlParams[] = $departmentId;
                $departmentFilter = ' AND (employees.department_id = $3) ';
            }
            
            // Load all active employees for the period
            $sqlQuery =
                'SELECT ' .
                    'id, ' .
                    'alias, ' .
                    'EXTRACT(YEAR FROM age($2, employees.date_of_birth)) AS employee_age, ' .
                    'payment_period_code, ' .
                    'payment_period_end_day, ' .
                    'employment_start_date, ' .
                    'employment_end_date ' .
                'FROM ' .
                    'employees ' . 
                'WHERE ' .
                    '( (employment_end_date >= $1 OR employment_end_date IS NULL) AND employment_start_date <= $2 ) ' .
                    $departmentFilter .
                'ORDER BY ' .
                    'alias ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                return( ['ok' => false, 'error' => 'Database error.'] );
            }
            
            // Are there no employees?
            if( $sqlResult->getRowCount() == 0 ) {
                return( ['ok' => true, 'payslips' => $payslips] );
            }
            
            $employees = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $employees[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['alias'],
                    'age' => $sqlRow['employee_age'],
                    'paymentPeriod' => $sqlRow['payment_period_code'],
                    'paymentPeriodEndDay' => $sqlRow['payment_period_end_day'],
                    'employmentStart' => $sqlRow['employment_start_date'],
                    'employmentEnd' => $sqlRow['employment_end_date'],
                    'payslips' => []
                ];
            }
            
            // Add payslips for each employee
            for( $i = 0; $i < count($employees); $i++ ) {
                $loanId = null;
                $numLoanPaymentsMade = 0;
                $totalLoanCapitalPaid = 0.00;
                
                // Get employment start and end date
                $employmentStartDate = new DateTime($employees[$i]['employmentStart']);
                $employmentEndDate = null;
                if( $employees[$i]['employmentEnd'] !== null ) $employmentEndDate = new DateTime($employees[$i]['employmentEnd']);
                
                // Get the end date of the last active payslip for the employee from previous payruns
                $sqlQuery =
                    'SELECT ' .
                        'payslips.period, payslips.from_date, payslips.to_date ' .
                    'FROM ' .
                        'payslips ' .
                    'LEFT JOIN ' .
                        'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'employee_id = $1 AND ' . 
                        'payruns.to_date < $2 AND ' . 
                        // 'payment_period_code = $3 AND ' . 
                        // 'payment_period_end_day = $4 AND ' . 
                        'status_code = \'ACTI\' ' . 
                    'ORDER BY ' . 
                        'to_date DESC ' . 
                    'LIMIT 1;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $employees[$i]['id'],
                    $startDate->format('Y-m-d')
                    // $employees[$i]['paymentPeriod']
                    // $employees[$i]['paymentPeriodEndDay']
                ]);
                if( !$sqlResult->isValid() ) {
                    return( ['ok' => false, 'error' => 'Database error.'] );
                }
                
                // Set the last payslip to date
                $lastPayslipToDate = null;
                if( $sqlResult->getRowCount() > 0 ) {
                    $sqlRow = $sqlResult->fetchAssociative();
                    $lastPayslipToDate = new DateTime($sqlRow['to_date']);
                }
                
                // Set payslip end date
                if( $lastPayslipToDate !== null ) {
                    $payslipEndDate = new DateTime($lastPayslipToDate->format('Y-m-d'));
                    $payslipEndDate->modify('+1 day');
                }
                else {
                    $payslipEndDate = new DateTime($employmentStartDate->format('Y-m-d'));
                }
                
// $oldPayslipEndDate = new DateTime($payslipEndDate->format('Y-m-d'));
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     return( ['ok' => false, 'error' => $payslipEndDate->format('Y-m-d')] );
//     // return( ['ok' => false, 'error' => $lastPayslipToDate->format('Y-m-d')] );
// }
                
                // Calculate the payslip end date depending on the payment period
                if( $employees[$i]['paymentPeriod'] === 'MONT' ) {
                    // If the employees paymentPeriodEndDay is lower than 1 work from last day - paymentPeriodEndDay
                    if( $employees[$i]['paymentPeriodEndDay'] < 1 ) {
                        $payslipEndDate->setDate($payslipEndDate->format('Y'), intval($payslipEndDate->format('m')) + 1, $employees[$i]['paymentPeriodEndDay']);
                    }
                    else {
                        $payslipEndDate->setDate($payslipEndDate->format('Y'), $payslipEndDate->format('m'), $employees[$i]['paymentPeriodEndDay']);
                    }
                }
                else if( $employees[$i]['paymentPeriod'] === 'WEEK' ) {
                    $payslipEndDate->modify('-1 day');
                    $payslipEndDate = \PayslipUtil\getNextWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                }
                else if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
                    $payslipEndDate->modify('-1 day');
                    $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                }
                
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     return( ['ok' => false, 'error' => $oldPayslipEndDate->format('Y-m-d') . ' vs ' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] . ')' ]);
//     // return( ['ok' => false, 'error' => $lastPayslipToDate->format('Y-m-d')] );
// }
                
                // Make sure the date is on or past the period start date as well as employment date.
                while( $payslipEndDate < $startDate || $payslipEndDate < $employmentStartDate ) {
                    if( $employees[$i]['paymentPeriod'] === 'MONT' ) {
                        $payslipEndDate = \PayslipUtil\getNextMonthlyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
                    else if( $employees[$i]['paymentPeriod'] === 'WEEK' ) {
                        $payslipEndDate = \PayslipUtil\getNextWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
                    else if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
                        $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     file_put_contents('php://stderr', print_r(("\n" . $employees[$i]['id'] . ': ' . $oldPayslipEndDate->format('Y-m-d') . ' vs ' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] . ')'), TRUE));
//     // return( ['ok' => false, 'error' => $oldPayslipEndDate->format('Y-m-d') . ' vs ' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] . ')' ]);
//     // return( ['ok' => false, 'error' => $lastPayslipToDate->format('Y-m-d')] );
// }
                }
                
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     file_put_contents('php://stderr', print_r(("\n" . $employees[$i]['id'] . ': ' . $oldPayslipEndDate->format('Y-m-d') . ' vs ' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] . ')'), TRUE));
//     // return( ['ok' => false, 'error' => $oldPayslipEndDate->format('Y-m-d') . ' vs ' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] . ')' ]);
//     // return( ['ok' => false, 'error' => $lastPayslipToDate->format('Y-m-d')] );
// }
                
                // Make sure the end date is not after employment end date
                if( $employmentEndDate !== null && $payslipEndDate > $employmentEndDate ) {
                    $payslipEndDate = new DateTime($employmentEndDate->format('Y-m-d'));
                }
                
                // Loop till we have all payslips for the given period
                while( $payslipEndDate <= $endDate ) {
                    $addPayslip = true;
                    
                    // Get the payslip start date
                    $payslipStartDate = null;
                    if( $employees[$i]['paymentPeriod'] === 'MONT' ) $payslipStartDate = \PayslipUtil\getMonthlyPayslipStartDate($payslipEndDate);
                    else if( $employees[$i]['paymentPeriod'] === 'WEEK' ) $payslipStartDate = \PayslipUtil\getWeeklyPayslipStartDate($payslipEndDate);
                    else if( $employees[$i]['paymentPeriod'] === 'BWEE' ) $payslipStartDate = \PayslipUtil\getBiWeeklyPayslipStartDate($payslipEndDate);
                    if( $payslipStartDate < $employmentStartDate ) $payslipStartDate = new DateTime($employmentStartDate->format('Y-m-d'));
                    
                    // Does the payslip's start date overlap with an existing payslip?
                    if( ($lastPayslipToDate !== null) && ($payslipStartDate <= $lastPayslipToDate) && ($lastPayslipToDate <= $payslipEndDate) ) {
                        $payslipStartDate = $lastPayslipToDate->add(new DateInterval('P1D'));
                    }
                    
                    // Get the payslip sars year
                    $sarsYear = intval($payslipEndDate->format('Y'));
                    if( intval($payslipEndDate->format('n')) >= 3 && intval($payslipEndDate->format('n')) <= 12 ) $sarsYear++;
                    
                    // Get the payslip period
                    $payslipPeriod = null;
                    if( $employees[$i]['paymentPeriod'] === 'MONT' ) $payslipPeriod = \PayslipUtil\getMonthlyPayslipPeriod( $payslipEndDate );
                    else if( $employees[$i]['paymentPeriod'] === 'WEEK' ) $payslipPeriod = \PayslipUtil\getWeeklyPayslipPeriod( $payslipEndDate, $payslipEndDate, $employees[$i]['paymentPeriodEndDay'] );
                    else if( $employees[$i]['paymentPeriod'] === 'BWEE' ) $payslipPeriod = \PayslipUtil\getBiWeeklyPayslipPeriod( $payslipEndDate, $payslipEndDate, $employees[$i]['paymentPeriodEndDay'] );
                    
                    // Check if there is an existing payslip
                    $sqlQuery =
                        'SELECT ' .
                            'period, from_date, to_date ' .
                        'FROM ' .
                            'payslips ' .
                        'WHERE ' .
                            'employee_id = $1 AND ' . 
                            'sars_year = $2 AND ' . 
                            'period = $3 AND ' . 
                            'payment_period_code = $4 AND ' . 
                            'status_code = \'ACTI\';';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $employees[$i]['id'], 
                        $sarsYear, 
                        $payslipPeriod,
                        $employees[$i]['paymentPeriod']
                    ]);
                    if( !$sqlResult->isValid() ) {
                        return( ['ok' => false, 'error' => 'Database error.'] );
                    }
                    
                    // If we have a row then that payslip already exists
                    if( $sqlResult->getRowCount() >= 1 ) $addPayslip = false;
                    
                    // Store payslip
                    if( $addPayslip === true ) {
                        $employees[$i]['payslips'][] = [
                            'employee' => [
                                'id' => $employees[$i]['id'],
                                'name' => $employees[$i]['name'],
                                'age' => $employees[$i]['age'],
                                'paymentPeriodEndDay' => $employees[$i]['paymentPeriodEndDay']
                            ],
                            'taxPeriod' => [
                                'type' => $employees[$i]['paymentPeriod'],
                                'number' => $payslipPeriod,
                                'taxYear' => $sarsYear
                            ],
                            'payeBonusCalculationTypeCode' => $payeBonusCalculationTypeCode,
                            'fromDate' => $payslipStartDate->format('Y-m-d'),
                            'toDate' => $payslipEndDate->format('Y-m-d'),
                            'items' => []
                        ];
                    }
                    
                    // If our payslipEndDate is equal to our employmentEndDate then we can't do any more payslips
                    if( $employmentEndDate !== null && $payslipEndDate == $employmentEndDate ) break;
                    
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     return( ['ok' => false, 'error' => $payslipStartDate->format('Y-m-d') . ' to ' . $payslipEndDate->format('Y-m-d')] );
// }
                    
// $tempPayslipEndDate = new DateTime($payslipEndDate->format('Y-m-d'));
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
//     return( ['ok' => false, 'error' => $payslipStartDate->format('Y-m-d') . ' to ' . $tempPayslipEndDate->format('Y-m-d') . '/' . $payslipEndDate->format('Y-m-d') . ' (' . $employees[$i]['paymentPeriodEndDay'] .')'] );
// }
                    
                    // Move to the next payment date
                    if( $employees[$i]['paymentPeriod'] === 'MONT' ) {
                        $payslipEndDate = \PayslipUtil\getNextMonthlyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
                    else if( $employees[$i]['paymentPeriod'] === 'WEEK' ) {
                        $payslipEndDate = \PayslipUtil\getNextWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
                    else if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
                        $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $employees[$i]['paymentPeriodEndDay']);
                    }
                    
// if( $employees[$i]['paymentPeriod'] === 'BWEE' ) {
//     return( ['ok' => false, 'error' => $tempPayslipEndDate->format('Y-m-d') . ' to ' . $payslipEndDate->format('Y-m-d')] );
//     // return( ['ok' => false, 'error' => $payslipStartDate->format('Y-m-d')] );
//     // return( ['ok' => false, 'error' => $payslipEndDate->format('Y-m-d')] );
// }
                }
                
                // Generate the payslip items for the specified payslips and get the result
                for( $j = 0; $j < count($employees[$i]['payslips']); $j++ ) {
                    // NOTE: 
                    //
                    // The loan calculation section is simply to help fascilitate loan calculations where
                    // an employee has more than one loan payment per payrun, these values will be discarded
                    // when the payslip is stored
                    $employees[$i]['payslips'][$j]['loanCalculation'] = [ 
                        'loanId' => $loanId,
                        'numLoanPaymentsMade' => $numLoanPaymentsMade,
                        'totalLoanCapitalPaid' => $totalLoanCapitalPaid
                    ];
                    
                    $result = $this->generatePayslipItems($db, $employees[$i]['payslips'][$j], $payeBonusCalculationTypeCode);
                    if( $result['ok'] !== true ) {
                        return( ['ok' => false, 'error' => $result['error']] );
                    }
                    
                    // Save the payslip items
                    $employees[$i]['payslips'][$j]['items'] = $result['payslipItems'];
                    
                    // // Add the payslip to the array
                    // $payslips[] = $employees[$i]['payslips'][$j];
                    
                    // Update the loan calculations, if any
                    foreach($result['payslipItems'] as $payslipItem) {
                        // Is it an employee loan item?
                        if( ($payslipItem['type']['code'] === '2008') && ($payslipItem['loan']['id'] !== null) ) {
                            $loanId = $payslipItem['loan']['id'];
                            $numLoanPaymentsMade = $numLoanPaymentsMade + 1;
                            $totalLoanCapitalPaid = $totalLoanCapitalPaid + $payslipItem['amount'] - $payslipItem['loan']['interestAmount'];
                        }
                    }
                }
                
                // Re-calculate the payslips
                $result = $this->recalculatePayslips($db, $payeCalculationTypeCode, $payeBonusCalculationTypeCode, $employees[$i]['payslips']);
                if( $result['ok'] !== true ) {
                    return( ['ok' => false, 'error' => $result['error']] );;
                }
                $payslips = array_merge($payslips, $result['payslips']);
            }
            
            return( ['ok' => true, 'payslips' => $payslips] );
        }
        
        // Function to generate and return the payslip items for a given payslip
        // 
        //  payslip                 An array describing the payslip
        // 
        //  payslip = [
        //      'fromDate',                 // The payslip from date
        //      'toDate',                   // The payslip to date
        //      'employee' => [
        //          'id',                   // The employee id
        //          'name',                 // The employee name
        //          'age',                  // The employee age
        //          'paymentPeriodEndDay'   // The employee payment day
        //      ],
        //      'taxPeriod' => [
        //          'type',                 // The tax period type
        //          'number',               // The tax period number
        //          'taxYear'               // The tax period year
        //      ],
        //      'items' => []
        //  ]
        // 
        // Returns
        //  [
        //      'id',                   // The payslip item id
        //      'type' => [
        //          'code',             // The payslip item type code
        //          'unitCode'          // The payslip item type unit code
        //      ],
        //      'category' => [
        //          'code'              // The payslip item category code
        //      ],
        //      'providentFund' => [
        //          'id',
        //          'employeeAmount',
        //          'employerAmount',
        //          'rfiItems' => [
        //              'payslipItemTypeCode',
        //              'percentage'
        //           ]
        //      ],
        //      'loan' => [
        //          'id' => null
        //      ],
        //      'description',          // The payslip item description
        //      'accrualDate',          // The payslip item accrual date
        //      'autoCalculate',        // Whether the payslip item should be calculated automatically
        //      'units',                // The payslip item units
        //      'rate',                 // The payslip item rate
        //      'amount'                // The payslip item amount
        //      'includeInNettPay'      // Whether the amount should be included in nett pay
        //  ]
        private function generatePayslipItems($db, $payslip, $payeBonusCalculationTypeCode) {
            // Clear the payslip items, if any
            $payslip['items'] = [];
            
            $employeeId = $payslip['employee']['id'];
            // $employeeName = $payslip['employee']['name'];
            $fromDate = $payslip['fromDate'];
            $toDate = $payslip['toDate'];
            
            // Load all payslip config items that are not once off items
            $sqlQuery =
                'SELECT ' .
                    'payslip_item_type_code, ' .
                    'payslip_category_code, ' .
                    'payslip_item_unit_code, ' .
                    'payslip_config_items.unit_source_code, ' .
                    'description, ' .
                    'payslip_config_items.auto_calculate, ' .
                    'amount, ' .
                    'payslip_config_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslip_config_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_config_items.payslip_item_type_code = payslip_item_types.code ' . 
                'WHERE ' .
                    'employee_id = $1 AND accrual_date IS NULL;';
            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Add the non-once off items to the payslip
            $unitValue = null;
            $rateValue = null;
            $amount = null;
            $includeInNettPay = false;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $unitValue = null;
                $rateValue = null;
                $amount = null;
                
                // Does the payslip item require a rate or unit value?
                if( $sqlRow['payslip_item_unit_code'] === 'PHOU' || $sqlRow['payslip_item_unit_code'] === 'PDAY' || $sqlRow['payslip_item_unit_code'] === 'PKIL' ) {
                    // Set the rate value 
                    $rateValue = doubleval($sqlRow['amount']);
                    
                    // Should the unit value be determined from the attendance register?
                    if( ($sqlRow['payslip_item_unit_code'] === 'PHOU') && ($sqlRow['unit_source_code'] === 'ATTE') ) {
                        // Get the hours worked from the attenance register
                        $sqlAttendanceQuery = 
                            'WITH attendance AS ( ' .
                                'SELECT ' . 
                                    '(EXTRACT(EPOCH FROM ' . 
                                        'LEAST(time_out, TO_TIMESTAMP($2 || \' 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')) - ' . 
                                        'GREATEST(time_in, TO_TIMESTAMP($1 || \' 00:00:00\', \'YYYY-MM-DD HH24:MI:SS\')) ' . 
                                    ') / 3600) AS hours_worked ' . 
                                'FROM ' . 
                                    'employee_attendance ' . 
                                'WHERE ' . 
                                    'time_out IS NOT NULL AND ( ' . 
                                        '(time_out >= TO_TIMESTAMP($1 || \' 00:00:00\', \'YYYY-MM-DD HH24:MI:SS\')) AND ' . 
                                        '(time_in <= TO_TIMESTAMP($2 || \' 23:59:59\', \'YYYY-MM-DD HH24:MI:SS\')) ' . 
                                    ') AND ' . 
                                    'employee_id = $3 ' . 
                            ') ' . 
                            'SELECT SUM(hours_worked) AS hours_worked FROM attendance;';
                        $sqlAttendanceResult = $db->paramQuery($sqlAttendanceQuery, [
                            $fromDate,
                            $toDate,
                            $employeeId
                        ]);
                        if( !$sqlAttendanceResult->isValid() ) {
                            return ['ok' => false, 'error' => 'Database error.'];
                        }
                        $sqlAttendanceRow = $sqlAttendanceResult->fetchAssociative();
                        if( $sqlAttendanceRow['hours_worked'] !== null ) {
                            $unitValue = round($sqlAttendanceRow['hours_worked'], 2);
                            $amount = $rateValue * $unitValue;
                        }
                    }
                }
                else {
                    if( $sqlRow['amount'] !== null ) $amount = doubleval($sqlRow['amount']);
                }
                
                $includeInNettPay = $sqlRow['include_in_nett_pay'];
                $payslip['items'][] = [
                    'id' => null,
                    'type' => [
                        'code' => $sqlRow['payslip_item_type_code'],
                        'unitCode' => $sqlRow['payslip_item_unit_code']
                    ],
                    'category' => [
                        'code' => $sqlRow['payslip_category_code']
                    ],
                    'providentFund' => [
                        'id' => null,
                        'employeeAmount' => null,
                        'employerAmount' => null,
                        'rfiItems' => []
                    ],
                    'loan' => [
                        'id' => null
                    ],
                    'description' => $sqlRow['description'],
                    'autoCalculate' => $sqlRow['auto_calculate'],
                    'units' => $unitValue,
                    'rate' => $rateValue,
                    'amount' => $amount,
                    'includeInNettPay' => $includeInNettPay
                ];
            }
            
            // Load all payslip config items that are once off items
            $sqlQuery =
                'SELECT ' .
                    'payslip_item_type_code, ' .
                    'payslip_category_code, ' .
                    'payslip_item_unit_code, ' .
                    'description, ' .
                    'payslip_config_items.auto_calculate, ' .
                    'amount, ' .
                    'payslip_config_items.include_in_nett_pay ' .
                'FROM ' .
                    'payslip_config_items ' .
                'LEFT JOIN ' .
                    'payslip_item_types ON payslip_config_items.payslip_item_type_code = payslip_item_types.code ' . 
                'WHERE ' .
                    'employee_id = $1 AND accrual_date IS NOT NULL AND (accrual_date >= $2 AND accrual_date <= $3);';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId,   // employee_id
                $fromDate,     // accrual_date
                $toDate        // accrual_date
            ]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Add the once off items to the payslip
            $unitValue = null;
            $rateValue = null;
            $amount = null;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $unitValue = null;
                $rateValue = null;
                $amount = null;
                
                if( $sqlRow['payslip_item_unit_code'] === 'PHOU' || $sqlRow['payslip_item_unit_code'] === 'PDAY' || $sqlRow['payslip_item_unit_code'] === 'PKIL' ) {
                    $rateValue = doubleval($sqlRow['amount']);
                }
                else {
                    if( $sqlRow['amount'] !== null ) $amount = doubleval($sqlRow['amount']);
                }
                
                $includeInNettPay = $sqlRow['include_in_nett_pay'];
                $payslip['items'][] = [
                    'id' => null,
                    'type' => [
                        'code' => $sqlRow['payslip_item_type_code'],
                        'unitCode' => $sqlRow['payslip_item_unit_code']
                    ],
                    'category' => [
                        'code' => $sqlRow['payslip_category_code']
                    ],
                    'providentFund' => [
                        'id' => null,
                        'employeeAmount' => null,
                        'employerAmount' => null,
                        'rfiItems' => []
                    ],
                    'loan' => [
                        'id' => null
                    ],
                    'description' => $sqlRow['description'],
                    'autoCalculate' => $sqlRow['auto_calculate'],
                    'units' => $unitValue,
                    'rate' => $rateValue,
                    'amount' => $amount,
                    'includeInNettPay' => $includeInNettPay
                ];
            }
            
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
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // For every provident fund the employee is a member of
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $autoCalculate = false;
                $employeeAmount = null;
                $employerAmount = null;
                $rfiItems = [];
                
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
                        return ['ok' => false, 'error' => 'Database error.'];
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
                    $payslip['items'][] = [
                        'id' => null,
                        'type' => [
                            'code' => '2006',
                            'unitCode' => 'FIXE'
                        ],
                        'category' => [
                            'code' => 'DEDU'
                        ],
                        'providentFund' => [
                            'id' => $sqlRow['id'],
                            'employeeAmount' => doubleval( $sqlRow['employee_amount'] ),
                            'employerAmount' => doubleval( $sqlRow['employer_amount'] ),
                            'rfiItems' => $rfiItems
                        ],
                        'loan' => [
                            'id' => null
                        ],
                        'description' => '\'' . $sqlRow['name'] . '\' Employee Contribution',
                        'autoCalculate' => $autoCalculate,
                        'units' => null,
                        'rate' => null,
                        'amount' => $employeeAmount,
                        'includeInNettPay' => false
                    ];
                }
                
                // Add payslip item for employer provident fund contribution, if any
                if( doubleval( $sqlRow['employer_amount'] ) > 0.009 ) {
                    $payslip['items'][] = [
                        'id' => null,
                        'type' => [
                            'code' => '4002',
                            'unitCode' => 'FIXE'
                        ],
                        'category' => [
                            'code' => 'FBEN'
                        ],
                        'providentFund' => [
                            'id' => $sqlRow['id'],
                            'employeeAmount' => doubleval( $sqlRow['employee_amount'] ),
                            'employerAmount' => doubleval( $sqlRow['employer_amount'] ),
                            'rfiItems' => $rfiItems
                        ],
                        'loan' => [
                            'id' => null
                        ],
                        'description' => '\'' . $sqlRow['name'] . '\' Employer Contribution',
                        'autoCalculate' => $autoCalculate,
                        'units' => null,
                        'rate' => null,
                        'amount' => $employerAmount,
                        'includeInNettPay' => false
                    ];
                }
            }
            
            // Load all loans for the employee, if any
            $sqlLoanQuery = 
                'SELECT ' . 
                    'loans.id, ' .
                    'description, ' .
                    'loan_status_type_code, ' .
                    'loan_interest_type_code, ' .
                    'principal_amount, ' .
                    'adjust_loan_amount, ' .
                    'start_date, ' .
                    'calculate_taxable_benefit ' .
                'FROM ' . 
                    'loans ' .
                'WHERE ' . 
                    'loans.loan_status_type_code = \'ACTI\' AND ' .
                    'loans.start_date <= $1 AND ' .
                    'loans.employee_id = $2 ' .
                'ORDER BY ' . 
                    'loans.start_date ASC, loans.id ASC;';
            $sqlLoanResult = $db->paramQuery($sqlLoanQuery, [
                $payslip['toDate'],
                $employeeId
            ]);
            if( !$sqlLoanResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // For every employee loan
            while( $sqlLoanRow = $sqlLoanResult->fetchAssociative() ) {
                // Get the loan history
                $sqlLoanHistoryQuery = 
                    'SELECT ' . 
                        'loan_history.total_payments, ' .
                        'loan_history.interest_rate, ' .
                        'loan_history.loan_capitalization_period_type_code, ' .
                        'loan_history.capitalization_day ' .
                    'FROM ' . 
                        'loan_history ' .
                    'WHERE ' . 
                        'loan_history.loan_id = $1 ' .
                    'ORDER BY ' . 
                        'loan_history.added_on DESC, loan_history.id DESC ' .
                    'LIMIT 1;';
                $sqlLoanHistoryResult = $db->paramQuery($sqlLoanHistoryQuery, [$sqlLoanRow['id']]);
                if( !$sqlLoanHistoryResult->isValid() ) {
                    return ['ok' => false, 'error' => 'Database error.'];
                }
                $sqlLoanHistoryRow = $sqlLoanHistoryResult->fetchAssociative();
                
                // Get the loan payments
                $outstandingAmount = $sqlLoanRow['principal_amount'];
                $outstandingPayments = $sqlLoanHistoryRow['total_payments'];
                // $startDate = $sqlLoanRow['start_date'];
                $sqlLoanPaymentsQuery = 
                    'SELECT ' .
                        'COUNT(CASE WHEN loan_payments.payslip_item_id IS NOT NULL THEN loan_payments.id ELSE NULL END) AS num_payments, ' .
                        'SUM(loan_payments.interest_amount) AS total_interest, ' .
                        'SUM(loan_payments.paid_amount) AS total_paid, ' .
                        'MAX(loan_payments.paid_on) AS last_payment_date ' .
                    'FROM ' .
                        'loan_payments ' .
                    'WHERE ' . 
                        'loan_payments.loan_id = $1 AND ' .
                        'loan_payments.paid_on < $2;';
                $sqlLoanPaymentsResult = $db->paramQuery($sqlLoanPaymentsQuery, [
                    $sqlLoanRow['id'],      // loan_id
                    $payslip['toDate']      // paid_on
                ]);
                if( !$sqlLoanPaymentsResult->isValid() ) {
                    return ['ok' => false, 'error' => 'Database error.'];
                }
                
                // Re-calculate the oustanding loan amount and number of payments
                if( $sqlLoanPaymentsResult->getRowCount() > 0 ) { 
                    $sqlLoanPaymentsRow = $sqlLoanPaymentsResult->fetchAssociative();
                    
                    $outstandingAmount = $outstandingAmount - ($sqlLoanPaymentsRow['total_paid'] - $sqlLoanPaymentsRow['total_interest']);
                    $outstandingPayments = $outstandingPayments - $sqlLoanPaymentsRow['num_payments'];
                    // $startDate = $sqlLoanPaymentsRow['last_payment_date'];
                }
                
                // Adjust the outstanding amounts and payments by the amounts already paid in the payrun, if any
                if( $sqlLoanRow['id'] == $payslip['loanCalculation']['loanId'] ) {
                    $outstandingAmount = $outstandingAmount - $payslip['loanCalculation']['totalLoanCapitalPaid'];
                    $outstandingPayments = $outstandingPayments - $payslip['loanCalculation']['numLoanPaymentsMade'];
                };
                
                // Are there payments left?
                if( ($outstandingPayments > 0) && ($outstandingAmount > 0.009) ) {
                    // Adjust the interest rates if it is a simple interest loan
                    $officialInterestRate =  \PayslipUtil\getOfficialInterestRate(new DateTime( $payslip['toDate'] ));
                    $interestRate = $sqlLoanHistoryRow['interest_rate'];
                    if( $sqlLoanRow['loan_interest_type_code'] === 'SIMP' ) {
                        $officialInterestRate = $officialInterestRate * ($sqlLoanHistoryRow['total_payments'] / $outstandingPayments);
                        $interestRate = $interestRate * ($sqlLoanHistoryRow['total_payments'] / $outstandingPayments);
                    }
                    
                    // Calculate the official instalment amount
                    $officialInstalmentAmount = \PayslipUtil\calculateLoanInstalment( 
                        $sqlLoanRow['loan_interest_type_code'], 
                        $payslip['taxPeriod']['type'], 
                        $sqlLoanHistoryRow['loan_capitalization_period_type_code'], 
                        $outstandingAmount, 
                        $outstandingPayments, 
                        $officialInterestRate
                    );
                    
                    // Get the loan payment amortization details (we use the first payment number since we are 
                    // recalculating the loan with the outstanding amount and number of payments)
                    $loanAmortization = \PayslipUtil\getLoanPaymentAmortization( 
                        1,
                        $sqlLoanRow['loan_interest_type_code'], 
                        $payslip['taxPeriod']['type'], 
                        $sqlLoanHistoryRow['loan_capitalization_period_type_code'], 
                        $outstandingAmount, 
                        $outstandingPayments, 
                        $interestRate
                    );
                    $instalmentAmount = $loanAmortization['interest'] + $loanAmortization['capital'];
                    
                    // Add the employee loan item
                    $payslip['items'][] = [
                        'id' => null,
                        'type' => [
                            'code' => '2008',
                            'unitCode' => 'FIXE'
                        ],
                        'category' => [
                            'code' => 'DEDU'
                        ],
                        'providentFund' => [
                            'id' => null,
                            'employeeAmount' => null,
                            'employerAmount' => null,
                            'rfiItems' => []
                        ],
                        'loan' => [
                            'id' => $sqlLoanRow['id'],
                            'paymentNum' => $outstandingPayments - 1,
                            'interestRate' => $sqlLoanHistoryRow['interest_rate'],
                            'interestAmount' => $loanAmortization['interest']
                        ],
                        'description' =>  '\'' . $sqlLoanRow['description'] . '\' Loan',
                        'autoCalculate' => true,
                        'units' => null,
                        'rate' => null,
                        'amount' => $instalmentAmount,
                        'includeInNettPay' => false
                    ];
                    
                    // Add the fringe benefit item, if any
                    if( ((doubleval( $officialInstalmentAmount ) - doubleval( $instalmentAmount )) > 0.009) && 
                        ($sqlLoanRow['calculate_taxable_benefit']) ) {
                        $payslip['items'][] = [
                            'id' => null,
                            'type' => [
                                'code' => '4004',
                                'unitCode' => 'FIXE'
                            ],
                            'category' => [
                                'code' => 'FBEN'
                            ],
                            'providentFund' => [
                                'id' => null,
                                'employeeAmount' => null,
                                'employerAmount' => null,
                                'rfiItems' => []
                            ],
                            'loan' => [
                                'id' => $sqlLoanRow['id']
                            ],
                            'description' => 'Low Interest or Interest Free Loan Taxable Benefit',
                            'autoCalculate' => true,
                            'units' => null,
                            'rate' => null,
                            'amount' => (doubleval( $officialInstalmentAmount ) - doubleval( $instalmentAmount )),
                            'includeInNettPay' => false
                        ];
                    }
                }
            }
            
            // Calculate the number of pay periods in the tax year
            $numPeriods = 0;
            if( $payslip['taxPeriod']['type'] === 'MONT' ) {
                $numPeriods = 12;
            }
            else if( $payslip['taxPeriod']['type'] === 'WEEK' ) {
                // Get the payslip end date
                $taxYearEnd = new DateTime($payslip['toDate']);
                
                // Is the payslip end date after the close of the tax year?
                if( intval($taxYearEnd->format('n')) >= 3 ) { 
                    $taxYearEnd->modify('+1 year');
                }
                
                // Set the end of the tax year
                $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 3, 1); 
                $taxYearEnd->modify('-1 day');
                
                // Get the number of payment periods in the specified tax year
                $numPeriods = \PayslipUtil\getWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
                // $numPeriods = 52;
            }
            else if( $payslip['taxPeriod']['type'] === 'BWEE' ) {
                // Get the payslip end date
                $taxYearEnd = new DateTime($payslip['toDate']);
                
                // Is the payslip end date after the close of the tax year?
                if( intval($taxYearEnd->format('n')) >= 3 ) { 
                    $taxYearEnd->modify('+1 year');
                }
                
                // Set the end of the tax year
                $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 3, 1); 
                $taxYearEnd->modify('-1 day');
                
                // Get the number of payment periods in the specified tax year
                $numPeriods = \PayslipUtil\getBiWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
                // $numPeriods = 26;
            }
            
            // Is it the final payment period of the tax year?
            if( $payslip['taxPeriod']['number'] == $numPeriods ) {
                // Add a payslip item for the tax corrrection
                $payslip['items'][] = [
                    'id' => null,
                    'type' => [
                        'code' => '2001',
                        'unitCode' => 'FIXE'
                    ],
                    'category' => [
                        'code' => 'DEDU'
                    ],
                    'providentFund' => [
                        'id' => null,
                        'employeeAmount' => null,
                        'employerAmount' => null,
                        'rfiItems' => []
                    ],
                    'loan' => [
                        'id' => null
                    ],
                    'description' => 'PAYE Correction',
                    'autoCalculate' => true,
                    'units' => null,
                    'rate' => null,
                    'amount' => 0.00,
                    'includeInNettPay' => false
                ];
            }
            
            // Set the PAYE bonus calculation type code
            $payslip['payeBonusCalculationTypeCode'] = $payeBonusCalculationTypeCode;
            
            // Calculate the payslip items
            \PayslipUtil\calculatePayslipItems( $payslip );
            
            return ['ok' => true, 'payslipItems' => $payslip['items']];
        }
        
        // @param $loanId                   The id of the loan for which to calculate the payment
        // @param $paymentPeriod            The payment period of the loan (WEEK or MONT)
        // @param $paymentDate              The date on which the loan payment will be made
        // @param $capitalPaidAdjustment    The amount with which the capital paid should be adjusted
        // @param $numPaymentsAdjustment    The amount with which the number of payments made should be adjusted
        private function calculateLoanPayment( $db, $loanId, $paymentPeriod, $paymentDate, $capitalPaidAdjustment, $numPaymentsAdjustment ) {
            // Get the loan details
            $sqlLoanQuery = 
                'SELECT ' . 
                    'loans.id, ' .
                    'description, ' .
                    'loan_status_type_code, ' .
                    'loan_interest_type_code, ' .
                    'principal_amount, ' .
                    'adjust_loan_amount, ' .
                    'start_date ' .
                'FROM ' . 
                    'loans ' .
                'WHERE ' . 
                    'loans.id = $1 ' .
                'ORDER BY ' . 
                    'loans.start_date ASC, loans.id ASC;';
            $sqlLoanResult = $db->paramQuery($sqlLoanQuery, [
                $loanId
            ]);
            if( !$sqlLoanResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            if( $sqlLoanResult->getRowCount() !== 1 ) {
                return ['ok' => false, 'error' => 'Loan not found.'];
            }
            
            $sqlLoanRow = $sqlLoanResult->fetchAssociative();
            
            // Get the loan history
            $sqlLoanHistoryQuery = 
                'SELECT ' . 
                    'loan_history.total_payments, ' .
                    'loan_history.interest_rate, ' .
                    'loan_history.loan_capitalization_period_type_code, ' .
                    'loan_history.capitalization_day ' .
                'FROM ' . 
                    'loan_history ' .
                'WHERE ' . 
                    'loan_history.loan_id = $1 ' .
                'ORDER BY ' . 
                    'loan_history.added_on DESC, loan_history.id DESC ' .
                'LIMIT 1;';
            $sqlLoanHistoryResult = $db->paramQuery($sqlLoanHistoryQuery, [$sqlLoanRow['id']]);
            if( !$sqlLoanHistoryResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            $sqlLoanHistoryRow = $sqlLoanHistoryResult->fetchAssociative();
            
            // Get the loan payments
            $outstandingAmount = $sqlLoanRow['principal_amount'];
            $outstandingPayments = $sqlLoanHistoryRow['total_payments'];
            // $startDate = $sqlLoanRow['start_date'];
            $sqlLoanPaymentsQuery = 
                'SELECT ' .
                    'COUNT(CASE WHEN loan_payments.payslip_item_id IS NOT NULL THEN loan_payments.id ELSE NULL END) AS num_payments, ' .
                    'SUM(loan_payments.interest_amount) AS total_interest, ' .
                    'SUM(loan_payments.paid_amount) AS total_paid, ' .
                    'MAX(loan_payments.paid_on) AS last_payment_date ' .
                'FROM ' .
                    'loan_payments ' .
                'WHERE ' . 
                    'loan_payments.loan_id = $1;'; // AND ' .
                    // 'loan_payments.paid_on < $2;';
            $sqlLoanPaymentsResult = $db->paramQuery($sqlLoanPaymentsQuery, [
                $sqlLoanRow['id'],      // loan_id
                // $paymentDate            // paid_on
            ]);
            if( !$sqlLoanPaymentsResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Re-calculate the oustanding loan amount and number of payments
            if( $sqlLoanPaymentsResult->getRowCount() > 0 ) { 
                $sqlLoanPaymentsRow = $sqlLoanPaymentsResult->fetchAssociative();
                
                $outstandingAmount = $outstandingAmount - ($sqlLoanPaymentsRow['total_paid'] - $sqlLoanPaymentsRow['total_interest']);
                $outstandingPayments = $outstandingPayments - $sqlLoanPaymentsRow['num_payments'];
                // $startDate = $sqlLoanPaymentsRow['last_payment_date'];
            }
            
            // Adjust the outstanding amounts and payments by the amounts already paid in the payrun, if any
            $outstandingAmount = $outstandingAmount - $capitalPaidAdjustment;
            $outstandingPayments = $outstandingPayments - $numPaymentsAdjustment;
            
            // Are there payments left?
            if( ($outstandingPayments > 0) && ($outstandingAmount > 0.009) ) {
                // Adjust the interest rates if it is a simple interest loan
                $officialInterestRate =  \PayslipUtil\getOfficialInterestRate(new DateTime( $paymentDate ));
                $interestRate = $sqlLoanHistoryRow['interest_rate'];
                if( $sqlLoanRow['loan_interest_type_code'] === 'SIMP' ) {
                    $officialInterestRate = $officialInterestRate * ($sqlLoanHistoryRow['total_payments'] / $outstandingPayments);
                    $interestRate = $interestRate * ($sqlLoanHistoryRow['total_payments'] / $outstandingPayments);
                }
                
                // Calculate the official instalment amount
                $officialInstalmentAmount = \PayslipUtil\calculateLoanInstalment( 
                    $sqlLoanRow['loan_interest_type_code'], 
                    $paymentPeriod, 
                    $sqlLoanHistoryRow['loan_capitalization_period_type_code'], 
                    $outstandingAmount, 
                    $outstandingPayments, 
                    $officialInterestRate
                );
                
                // Get the loan payment amortization details (we use the first payment number since we are 
                // recalculating the loan with the outstanding amount and number of payments)
                $loanAmortization = \PayslipUtil\getLoanPaymentAmortization( 
                    1,
                    $sqlLoanRow['loan_interest_type_code'], 
                    $paymentPeriod, 
                    $sqlLoanHistoryRow['loan_capitalization_period_type_code'], 
                    $outstandingAmount, 
                    $outstandingPayments, 
                    $interestRate
                );
                
                // Add the employee loan item
                $payment = [
                    'id' => $sqlLoanRow['id'],
                    'paymentNum' => $outstandingPayments - 1,
                    'interestRate' => $sqlLoanHistoryRow['interest_rate'],
                    'interestAmount' => $loanAmortization['interest'],
                    'capitalAmount' => $loanAmortization['capital'],
                    'instalmentAmount' => $loanAmortization['interest'] + $loanAmortization['capital'],
                    'officialInstalmentAmount' =>  $officialInstalmentAmount
                ];
            }
            
            return ['ok' => true, 'payment' => $payment];
        }
        
        // Function to calculate the tax correction at the end of the financial year. 
        //
        // @param $employeeId               The id of the employee to calculate the payment for
        // @param $sarsYear                 The tax year for the final payment
        private function calculateTaxCorrection( $db, $employeeId, $sarsYear, $generatedPayslips, $payeBonusCalculationTypeCode ) {
            // Should tax corrections be calculated for the specified employee?
            $sqlQuery = 'SELECT enable_paye_correction FROM employees WHERE id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId
            ]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                return ['ok' => false, 'error' => 'Unable to calculate year end tax payment. Employee not found.'];
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['enable_paye_correction'] !== true ) {
                return ['ok' => true, 'payment' => null];
            }
            
            // Use the generated payslips in the calculations
            $payslips = []; // $generatedPayslips;
            
            // Calculate the start and end date of the tax year
            $endDate = new DateTime( $sarsYear . '-03-01' );
            $endDate->setTime(23, 59, 59);
            $startDate = new DateTime( $endDate->format('Y-m-d') );
            $startDate->modify('-1 year');
            $startDate->setTime(0, 0, 0);
            $endDate->modify('-1 day');
            
            // Calculate the payslip totals for the tax year
            $sqlQuery = 
                'SELECT ' . 
                    'payslips.id AS payslip_id ' . 
                'FROM ' . 
                    'payslips ' . 
                'LEFT JOIN ' . 
                    'payruns ON payruns.id = payslips.payrun_id ' . 
                'WHERE ' . 
                    // 'payruns.processed_on IS NOT NULL AND ' . 
                    'payslips.employee_id = $1 AND ' . 
                    'payslips.to_date >= $2 AND ' .
                    'payslips.to_date <= $3 AND ' . 
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY ' . 
                    'payslips.to_date ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId,
                $startDate->format('Y-m-d'),
                $endDate->format('Y-m-d')
            ]);
            
// return ['ok' => false, 'error' => Util::parseParamQuery(
//         $sqlQuery, [
//             $employeeId,
//             $startDate->format('Y-m-d'),
//             $endDate->format('Y-m-d')
//         ]
//     )
// ];
            
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // For every payslip found
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Get the specified payslip
                $result = $this->payslipToObject($db, $sqlRow['payslip_id']);
                if( $result['ok'] !== true ) {
                    return ['ok' => false, 'error' => $result['error']];
                }
                $payslip = $result['payslip'];
                
                // Has the payslip already been generated?
                $isGeneratedPayslip = false;
                for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                    // Was the payslip found?
                    if( ($generatedPayslips[$i]['employee']['id'] == $employeeId) && ($generatedPayslips[$i]['toDate'] == $payslip['toDate']) ) {
                        // The payslip is one of the generated ones
                        $payslips[] = $generatedPayslips[$i];
                        $isGeneratedPayslip = true;
                        break;
                    }
                }
                
                // Add the payslip to the array only if not already there and it's within the tax year
                if( $isGeneratedPayslip === false ) {
                    $payslips[] = $payslip;
                }
            }
            
            // Calculate the total PAYE and taxable income for all payslips
            $taxableIncomeTotal = 0.00;
            $payeTotal = 0.00;
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Exclude all payslips outside the tax year period
                if( ($payslips[$i]['toDate'] < $startDate->format('Y-m-d')) || ($payslips[$i]['toDate'] > $endDate->format('Y-m-d')) ) continue;
                
                // Calculate PAYE total, if any
                for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                    if( ($payslips[$i]['items'][$j]['type']['code'] === '2000') /* && ($payslips[$i]['items'][$j]['autoCalculate'] == true) */ ) {
                        $payeTotal = $payeTotal + $payslips[$i]['items'][$j]['amount'];
                    }
                }
                
                // Calculate the taxable income
                $payslips[$i]['payeBonusCalculationTypeCode'] = $payeBonusCalculationTypeCode;
                $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslips[$i] );
                $taxableIncomeTotal = $taxableIncomeTotal + $payslipTotals['payeIncome'];
            }
            
            // Set the year end date to the last day of the last month of the tax year
            $yearEndDate = new DateTime($sarsYear . '-03-01');
            $yearEndDate->modify('-1 day');
            
// return ['ok' => false, 'error' => ('# payslips: ' . count($payslips) . ', payeTotal: ' . $payeTotal)];
// // return ['ok' => false, 'error' => json_encode($payslips)];
            
            // Get employee age for tax calculations of final payslip
            $sqlQuery = 
                'SELECT ' . 
                    'EXTRACT(YEAR FROM age($1, employees.date_of_birth)) AS employee_age ' . 
                'FROM ' . 
                    'employees ' . 
                'WHERE ' . 
                    'employees.id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $yearEndDate->format('Y-m-d'),
                $employeeId
            ]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Was a result found?
            $payment = 0.00;
            if( $sqlResult->getRowCount() === 1 ) {
                // Get the employee age
                $sqlRow = $sqlResult->fetchAssociative();
                $employeeAge = $sqlRow['employee_age'];
                
                // Calculate the total PAYE for the year
                $paye = \PayslipUtil\calculatePaye($yearEndDate, $employeeAge, $taxableIncomeTotal);
                
                // Subtract the amount of PAYE already paid
                $payment = $paye - $payeTotal;
            }
            
            // Do not allow cent corrections
            if( ($payment >= -0.99) && ($payment <= 0.99) ) $payment = 0.00;
            
            // Fix -0.00 issue
            if( ($payment > -0.01) && ($payment < 0.01) ) $payment = 0.00;
            
            // Return the result
            return ['ok' => true, 'payment' => $payment];
        }

        private function calculatePayeOverDeductionCorrection( $db, $employeeId, $sarsYear, $generatedPayslips ) {

               // Use the generated payslips in the calculations
            $payslips = []; // $generatedPayslips;
            
            // Calculate the start and end date of the tax year
            $endDate = new DateTime( $sarsYear . '-03-01' );
            $endDate->setTime(23, 59, 59);
            $startDate = new DateTime( $endDate->format('Y-m-d') );
            $startDate->modify('-1 year');
            $startDate->setTime(0, 0, 0);
            $endDate->modify('-1 day');
            
            // Calculate the payslip totals for the tax year
            $sqlQuery = 
                'SELECT ' . 
                    'payslips.id AS payslip_id ' . 
                'FROM ' . 
                    'payslips ' . 
                'LEFT JOIN ' . 
                    'payruns ON payruns.id = payslips.payrun_id ' . 
                'WHERE ' . 
                    // 'payruns.processed_on IS NOT NULL AND ' . 
                    'payslips.employee_id = $1 AND ' . 
                    'payslips.to_date >= $2 AND ' .
                    'payslips.to_date <= $3 AND ' . 
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY ' . 
                    'payslips.to_date ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId,
                $startDate->format('Y-m-d'),
                $endDate->format('Y-m-d')
            ]);
            
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // For every payslip found
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Get the specified payslip
                $result = $this->payslipToObject($db, $sqlRow['payslip_id']);
                if( $result['ok'] !== true ) {
                    return ['ok' => false, 'error' => $result['error']];
                }
                $payslip = $result['payslip'];
                
                // Has the payslip already been generated?
                $isGeneratedPayslip = false;
                for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                    // Was the payslip found?
                    if( ($generatedPayslips[$i]['employee']['id'] == $employeeId) && ($generatedPayslips[$i]['toDate'] == $payslip['toDate']) ) {
                        // The payslip is one of the generated ones
                        $payslips[] = $generatedPayslips[$i];
                        $isGeneratedPayslip = true;
                        break;
                    }
                }
                
                // Add the payslip to the array only if not already there and it's within the tax year
                if( $isGeneratedPayslip === false ) {
                    $payslips[] = $payslip;
                }
            }
            
            // Calculate the total PAYE and taxable income for all payslips
            $overDeductionTotal = 0.00;
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Exclude all payslips outside the tax year period
                if( ($payslips[$i]['toDate'] < $startDate->format('Y-m-d')) || ($payslips[$i]['toDate'] > $endDate->format('Y-m-d')) ) continue;
                
                // Calculate PAYE total, if any
                for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                    if( ($payslips[$i]['items'][$j]['type']['code'] === '2001' && $payslips[$i]['items'][$j]['description'] !== 'PAYE Correction') /* && ($payslips[$i]['items'][$j]['autoCalculate'] == true) */ ) {
                        $overDeductionTotal = $overDeductionTotal + $payslips[$i]['items'][$j]['amount'];
                    }
                }
            }
            
            // Set the year end date to the last day of the last month of the tax year
            $yearEndDate = new DateTime($sarsYear . '-03-01');
            $yearEndDate->modify('-1 day');
  
            // Get employee age for tax calculations of final payslip
            $sqlQuery = 
                'SELECT ' . 
                    'EXTRACT(YEAR FROM age($1, employees.date_of_birth)) AS employee_age ' . 
                'FROM ' . 
                    'employees ' . 
                'WHERE ' . 
                    'employees.id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $yearEndDate->format('Y-m-d'),
                $employeeId
            ]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Was a result found?
            $overDeductionAmount = 0.00;
            $taxCorrectionAmount = 0.00;
            if( $sqlResult->getRowCount() === 1 ) {
                // Get the employee age
                $sqlRow = $sqlResult->fetchAssociative();

                // Subtract the amount of PAYE already paid
                $overDeductionAmount = $overDeductionTotal;
                $taxCorrectionAmount = $overDeductionTotal;
            }
 
            // Do not allow cent corrections
            if( ($overDeductionAmount >= -0.99) && ($overDeductionAmount <= 0.99) ) $overDeductionAmount = 0.00;
            if( ($taxCorrectionAmount >= -0.99) && ($taxCorrectionAmount <= 0.99) ) $taxCorrectionAmount = 0.00;
            
            // Fix -0.00 issue
            if( ($overDeductionAmount > -0.01) && ($overDeductionAmount < 0.01) ) $overDeductionAmount = 0.00;
            if( ($taxCorrectionAmount > -0.01) && ($taxCorrectionAmount < 0.01) ) $taxCorrectionAmount = 0.00;
            
            // Return the result
            return ['ok' => true, 'overDeductionAmount' => $overDeductionAmount, 'taxCorrectionAmount' => $taxCorrectionAmount];
          
        }
        
        // Function to calculate the PAYE using the tax averaging method.
        //
        // @param $employeeId                       The id of the employee to calculate the payment for
        // @param $endDate                          The the end date for the tax payment (text string in format 'CCYY-MM-DD')
        // @param $generatedPayslips                Payslips that have been generated, but not yet saved 
        // @param $payeBonusCalculationTypeCode     The PAYE bonus calculation method ('ACCU' for accurate, 'STAN' for standard)
        private function calculateAverageTaxPayment( $db, $employeeId, $endDate, $generatedPayslips, $payeBonusCalculationTypeCode ) {
            // Reset the tax liability for all generated payslips
            for( $i = 0; $i < count($generatedPayslips); $i++ ) {
                // Find the tax liability
                $payeIndex = null;
                for( $j = 0; $j < count($generatedPayslips[$i]['items']); $j++ ) {
                    if( ($generatedPayslips[$i]['items'][$j]['type']['code'] === '2000') && ($generatedPayslips[$i]['items'][$j]['autoCalculate'] == true) ) {
                        $payeIndex = $j;
                        break;
                    }
                }
                
                // Was the tax liability found
                if( $payeIndex !== null ) {
                    // Reset the PAYE amount so that it can be recalculated
                    $generatedPayslips[$i]['items'][$payeIndex]['amount'] = null;
                }
            }
            
            // Use the generated payslips in the calculations
            $payslips = $generatedPayslips;
            
            // Set the start date to the beginning of the SARS tax year
            $calculationDate = new DateTime( $endDate );
            $calculationDate->setTime(23, 59, 59);
            $startDate = new DateTime($calculationDate->format('Y') . '-03-01');
            
            // Make sure we remain in the current tax year
            if( intval($calculationDate->format('n')) < 3 ) { 
                $startDate->modify('-1 year');
            }
            $startDate->setTime(0, 0, 0);
            $taxYear = $calculationDate->format('Y');
            
            // Get all the payslips for the current tax year
            $sqlQuery = 
                'SELECT ' . 
                    'payslips.id AS payslip_id, ' . 
                    'payruns.processed_on AS payrun_processed_on ' .
                'FROM ' . 
                    'payslips ' . 
                'LEFT JOIN ' . 
                    'payruns ON payruns.id = payslips.payrun_id ' . 
                'WHERE ' . 
                    // 'payruns.processed_on IS NOT NULL AND ' . 
                    'payslips.employee_id = $1 AND ' . 
                    'payslips.to_date >= $2 AND ' . 
                    'payslips.to_date <= $3 AND ' . 
                    'payslips.status_code = \'ACTI\' ' .
                'ORDER BY ' . 
                    'payslips.to_date;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $employeeId,
                $startDate->format('Y-m-d'),
                $endDate
            ]);
            
// return ['ok' => false, 'error' => Util::parseParamQuery(
//         $sqlQuery, [
//             $employeeId,
//             $startDate->format('Y-m-d'),
//             $endDate
//         ]
//     )
// ];
            
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            $numPeriodsWorked = 0;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                // Determine if the payslip's payrun has already been processed
                $payrunIsProcessed = true;
                if( $sqlRow['payrun_processed_on'] === null ) {
                    $payrunIsProcessed = false;
                }
                
                // Count the number of paylsips for the given tax year
                $numPeriodsWorked = $numPeriodsWorked + 1;
                
                // Get the specified payslip
                $result = $this->payslipToObject($db, $sqlRow['payslip_id']);
                if( $result['ok'] !== true ) {
                    return ['ok' => false, 'error' => $result['error']];
                }
                $payslip = $result['payslip'];
                
                // Has the payslip already been generated?
                $generatedPayslipIndex = null;
                for( $i = 0; $i < count($payslips); $i++ ) {
                    // Was the payslip found?
                    if( ($payslips[$i]['employee']['id'] == $employeeId) && ($payslips[$i]['toDate'] == $payslip['toDate']) ) {
                        // The payslip is one of the generated ones
                        $generatedPayslipIndex = $i;
                        break;
                    }
                }
                
                // Was the payrun not processed?
                if( $payrunIsProcessed !== true ) {
                    // Find the tax liability
                    $payeItemIndex = null;
                    for( $j = 0; $j < count($payslip['items']); $j++ ) {
                        if( ($payslip['items'][$j]['type']['code'] === '2000') && ($payslip['items'][$j]['autoCalculate'] == true) ) {
                            $payeItemIndex = $j;
                            break;
                        }
                    }
                    
                    // Was the tax liability found
                    if( $payeItemIndex !== null ) {
                        // Reset the PAYE amount so that it can be recalculated
                        $payslip['items'][$payeItemIndex]['amount'] = null;
                    }
                }
                else {
                    // Replace the generated payslip with the processed one
                    if( $generatedPayslipIndex !== null ) {
                        $payslips[$generatedPayslipIndex] = $payslip;
                    }
                }
                
                // Add the payslip to the array only if not already there
                if( $generatedPayslipIndex === null ) {
                    $payslips[] = $payslip;
                }
            }
            
            // Make certain all payslips are sorted by to date
            array_multisort(
                array_column($payslips, 'toDate'), SORT_ASC, SORT_STRING | SORT_FLAG_CASE,
                $payslips
            );
            
            // For every given payslip
            $taxableIncomeTotal = 0.00;
            $onceOffIncomeTotal = 0.00;
            $ytdTaxLiability = 0.00;
            $periodMultiplier = 0;
            $taxLiability = 0.00;
            $payslipPeriod = 0;
            for( $i = 0; $i < count($payslips); $i++ ) {
                // Caclulate only until the specified date
                if( $payslips[$i]['toDate'] > $endDate ) break;
                
                // Skip payslips outside of the tax year
                if( ($payslips[$i]['toDate'] < $startDate->format('Y-m-d')) || ($payslips[$i]['toDate'] > $endDate) ) continue;
                
                // Get the payslip end date
                $taxYearEnd = new DateTime($payslips[$i]['toDate']);
                
                // Is the payslip end date after the close of the tax year?
                if( intval($taxYearEnd->format('n')) >= 3 ) { 
                    $taxYearEnd->modify('+1 year');
                }
                
                // Set the end of the tax year
                $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 3, 1); 
                $taxYearEnd->modify('-1 day');
                
                // Are we in a diffrent tax year?
                if( $taxYear != $taxYearEnd->format('Y') ) {
                    // Reset the totals
                    $taxableIncomeTotal = 0.00;
                    $onceOffIncomeTotal = 0.00;
                    $ytdTaxLiability = 0.00;
                    $periodMultiplier = 0;
                    $taxLiability = 0.00;
                    
                    // Reset the paylsip period
                    $payslipPeriod = 0;
                    
                    // Remember the current tax year
                    $taxYear = $taxYearEnd->format('Y');
                }
                
                // NOTE: 
                
                // Any irregular income (i.e., once-off or annual payments should be excluded from the taxable income). 
                // Tax on irregular income should be calculated separately and added to the total of the tax
                // for regular income. Modify the calculatePayslipTotals to get separate totals for regular and
                // irregular income.
                
                // Get the taxable income total
                $payslips[$i]['payeBonusCalculationTypeCode'] = $payeBonusCalculationTypeCode;
                $payslipTotals = \PayslipUtil\calculatePayslipTotals( $payslips[$i] );
                $taxableIncomeTotal = $taxableIncomeTotal + $payslipTotals['payeIncome'];
                $onceOffIncome = $payslipTotals['totalOnceOffIncome'];
                $onceOffIncomeTotal = $onceOffIncomeTotal + $onceOffIncome;
                
                // Calculate the number of pay periods in the tax year
                $periodMultiplier = 0;
                if( $payslips[$i]['taxPeriod']['type'] === 'MONT' ) {
                    $periodMultiplier = 12;
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'WEEK' ) {
                    // Get the number of payment periods in the specified tax year
                    $periodMultiplier = \PayslipUtil\getWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslips[$i]['toDate'] ), $payslips[$i]['employee']['paymentPeriodEndDay']);
                    // $periodMultiplier = 52;
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'BWEE' ) {
                    // Get the number of payment periods in the specified tax year
                    $periodMultiplier = \PayslipUtil\getBiWeeklyPayslipPeriod($taxYearEnd, new DateTime( $payslips[$i]['toDate'] ), $payslips[$i]['employee']['paymentPeriodEndDay']);
                    // $periodMultiplier = 26;
                }
                
                // Get the payslip period
                $payslipPeriod = null;
                if( $payslips[$i]['taxPeriod']['type'] === 'MONT' ) {
                    // Get employee employment_start_date from employees
                    $empQuery = 
                        'SELECT ' . 
                            'employees.employment_start_date ' .
                        'FROM ' . 
                            'employees ' . 
                        'WHERE ' . 
                            'employees.id = $1;';
                    $empResult = $db->paramQuery($empQuery, [
                        $employeeId
                    ]);
                    if( !$empResult->isValid() ) {
                        return ['ok' => false, 'error' => 'Database error.'];
                    }

                    $empRow = $empResult->fetchAssociative();
                    
                    $employmentDate = new DateTime( $empRow['employment_start_date'] );
                    
                    if ($employmentDate > $startDate){
                        $payslipPeriod = \PayslipUtil\getMonthlyPayslipPeriodNewEmployee(new DateTime($payslips[$i]['toDate']), new DateTime($empRow['employment_start_date']));
                    }else{
                        $payslipPeriod = \PayslipUtil\getMonthlyPayslipPeriod( new DateTime( $payslips[$i]['toDate'] ) );
                    }
// file_put_contents('php://stderr', print_r(("\n" . '$payslipPeriod: ' . $payslipPeriod), TRUE));
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'WEEK' ) {
                    $payslipPeriod = \PayslipUtil\getWeeklyPayslipPeriod( new DateTime( $payslips[$i]['toDate'] ), new DateTime( $payslips[$i]['toDate'] ), $payslips[$i]['employee']['paymentPeriodEndDay'] );
// file_put_contents('php://stderr', print_r(("\n" . '$payslipPeriod: ' . $payslipPeriod), TRUE));
                }
                else if( $payslips[$i]['taxPeriod']['type'] === 'BWEE' ) {
                    $payslipPeriod = \PayslipUtil\getBiWeeklyPayslipPeriod( new DateTime( $payslips[$i]['toDate'] ), new DateTime( $payslips[$i]['toDate'] ), $payslips[$i]['employee']['paymentPeriodEndDay'] );
// file_put_contents('php://stderr', print_r(("\n" . '$payslipPeriod: ' . $payslipPeriod), TRUE));
                }

                // Find the tax liability
                $payeIndex = null;
                for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                    if( ($payslips[$i]['items'][$j]['type']['code'] === '2000') && ($payslips[$i]['items'][$j]['autoCalculate'] == false) ) {
                        $payeIndex = $j;
                        break;
                    }
                }
                
                // Check if there is no tax liability
                $hasTaxLiability = ($payeIndex == null ? false : true);
                if( $payeIndex == null ) {
                    for( $j = 0; $j < count($payslips[$i]['items']); $j++ ) {
                        if( $payslips[$i]['items'][$j]['type']['code'] === '2000' ) {
                            $hasTaxLiability = true;
                            break;
                        }
                    }
                }
                
                // Is there a tax liability?
                // $onceOffTaxLiability = 0;
                $taxLiability = 0;
                if( $hasTaxLiability ) {
                    // Calculate the tax liablility
                    if( ($payeIndex !== null) && ($payslips[$i]['items'][$payeIndex]['amount'] !== null) ) {
                        $taxLiability = $payslips[$i]['items'][$payeIndex]['amount'];
                    }
                    else {
                        // Should once-off amounts be calculated accurately?
                        if( $payeBonusCalculationTypeCode === 'ACCU' ) {
                            // 
                            // NOTE: 
                            //
                            // The following code is used to calculate annual payments separate from other income but 
                            // it produces results differing from Simple Pay's calculations for the periods following
                            // the annual payment. If you do not treat annual payments seperately it produces a result
                            // different than Simply Pay for the period in which the annual payment is made, but the 
                            // following months are consistent with the tax averaging method results in general.
                            
                            // Calculate PAYE using the averaging method
                            $taxLiability = \PayslipUtil\calculateAveragePaye(
                                new DateTime($payslips[$i]['toDate']), 
                                $payslips[$i]['employee']['age'], 
                                $payslipPeriod, // $i + 1 // Number of periods worked
                                $periodMultiplier,
                                ($taxableIncomeTotal - $onceOffIncome),
                                $ytdTaxLiability
                            );
                            
                            // Was there once-off income on the particular payslip?
                            if( $onceOffIncome > 0.009 ) {
                                // Add PAYE for irregular (once-off income)
                                $projectedYearlyIncome = (($taxableIncomeTotal - $onceOffIncome) / ($payslipPeriod)) * $periodMultiplier;
                                
                                // Calculate the projected tax
                                $projectedTax = \PayslipUtil\calculatePaye(
                                    new DateTime($payslips[$i]['toDate']), 
                                    $payslips[$i]['employee']['age'], 
                                    $projectedYearlyIncome
                                );
                                
                                // Calculate the once-off tax
                                $onceOffTax = \PayslipUtil\calculatePaye(
                                    new DateTime($payslips[$i]['toDate']), 
                                    $payslips[$i]['employee']['age'], 
                                    ($projectedYearlyIncome + $onceOffIncome)
                                );
                                
                                // Add the tax liability
                                $onceOffTaxLiability = ($onceOffTax - $projectedTax);
                                $taxLiability = $taxLiability + $onceOffTaxLiability;
                            }
                        }
                        else {
                            // Calculate PAYE using the averaging method
                            $taxLiability = \PayslipUtil\calculateAveragePaye(
                                new DateTime($payslips[$i]['toDate']), 
                                $payslips[$i]['employee']['age'], 
                                $payslipPeriod, // $i + 1 // Number of periods worked
                                $periodMultiplier,
                                $taxableIncomeTotal,
                                $ytdTaxLiability
                            );
                        }
                    }
                }
                
// if( $payslipPeriod == 3 ) {
//     return ['ok' => false, 'error' => (
//         'taxLiability: ' . ($taxLiability /*+ $onceOfftaxLonceOffTaxLiabilityiability*/) . ' |<br> ' .
//         'ytdTaxLiability: ' . $ytdTaxLiability . ' |<br> ' .
//         'taxableIncomeTotal: ' . $taxableIncomeTotal . ' |<br> ' .
//         'onceOffIncome: ' . $onceOffIncome
//     )];
// }
                
                // Calculate the total tax liability thus far
                if( $taxLiability > 0.009 ) {
                    $ytdTaxLiability = $ytdTaxLiability + $taxLiability;
                }
                else {
                    $taxLiability = 0;
                }
            }
            
            // Return the result
            return ['ok' => true, 'payment' => ($taxLiability)];
        }
        
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
