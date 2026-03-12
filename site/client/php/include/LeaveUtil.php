<?php
    // Set namespace
    namespace LeaveUtil;
    
    // Import namespaces
    use \DateTime as DateTime;
    
    // Function to earn leave for a specified employee
    //
    // Required Parameters
    //  leaveDetails                An array describing the leave details for a specified employee
    //
    //  leaveDetails = [
    //      'employeeId',           The employee id
    //      'hoursWorked',          How many hours the employee worked
    //      'daysWorked',           How many days the employee worked
    //      'leaveSourceType',      The leave source: MANU (manual), PAYS (payslip), or WSCH (work schedule)
    //      'leaveDate'             The date on which the leave should be calculated (today if null)
    //   ];
    //
    // Optional Parameters
    //  None
    function processEmployeeLeave( $leaveDetails, $user, $db ) {
        $employeeId = $leaveDetails['employeeId'];
        $payslipId = null;
        if( array_key_exists( 'payslipId', $leaveDetails ) ) {
            $payslipId = $leaveDetails['payslipId'];
        }
        $hoursWorked = $leaveDetails['hoursWorked'];
        $daysWorked = $leaveDetails['daysWorked'];
        $leaveSourceType = $leaveDetails['leaveSourceType'];
        $leaveDate = $leaveDetails['leaveDate'];
        if( $leaveDate == null ) $leaveDate = date('Y-m-d');
        
        $leaveResult = [];
        
        // Get the relevant employee details
        $sqlQuery = 
            'SELECT ' .
                'employees.employment_start_date, ' .
                'employees.employment_end_date, ' .
                'work_schedules.enable_leave AS enable_work_schedule_leave ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'work_schedules ON work_schedules.employee_id = employees.id ' .
            'WHERE ' .
                'employees.id = $1';
        $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        $row = $sqlResult->fetchAssociative();
        $employmentStartDate = $row['employment_start_date'];
        $employmentEndDate = $row['employment_end_date'];
        $workScheduleLeaveEnabled = $row['enable_work_schedule_leave'];
        
        // Get all the leave types for the specified employee
        $sqlQuery = 
            'SELECT ' .
                'leave_config_items.id AS leave_config_item_id, ' .
                'leave_config_items.leave_type_id, ' .
                'leave_config_items.employee_leave_start_date, ' .
                'leave_types.name AS leave_type_name, ' .
                'leave_types.leave_unit_code, ' .
                'leave_types.start_date AS leave_type_start_date ' .
            'FROM ' .
                'leave_config_items ' .
            'LEFT JOIN ' .
                'leave_types ON leave_types.id = leave_config_items.leave_type_id ' .
            'WHERE ' .
                'leave_config_items.employee_id = $1 AND ' . 
                'leave_types.is_deleted = FALSE;';
        $sqlLeaveConfigResult = $db->paramQuery($sqlQuery, [$employeeId]);
        if( !$sqlLeaveConfigResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        // For every leave config item for the specified employee
        while( $sqlLeaveConfigRow = $sqlLeaveConfigResult->fetchAssociative() ) {
            // The leave start date is calculated as follows: If no employee leave config start date is specified 
            // (this enables employees to have customised start dates for every leave type), use the leave type 
            // start date. If no leave type start date is specified, use the employee employment date.
            $leaveStartDate = $employmentStartDate;
            if( $sqlLeaveConfigRow['employee_leave_start_date'] !== null ) {
                if( $employmentStartDate <= $sqlLeaveConfigRow['employee_leave_start_date'] ) {
                    $leaveStartDate = $sqlLeaveConfigRow['employee_leave_start_date'];
                }
            }
            else if( $sqlLeaveConfigRow['leave_type_start_date'] !== null ) {
                if( $employmentStartDate <= $sqlLeaveConfigRow['leave_type_start_date'] ) {
                    $leaveStartDate = $sqlLeaveConfigRow['leave_type_start_date'];
                }
            }
            
            // Set the start date for accrual date calculations
            $startDate = new DateTime($leaveStartDate);
            $leaveStartDay = intval($startDate->format('d'));
            
            // Calculate how long the employee has been employed (in months)
            $startTime = strtotime($leaveStartDate);
            $endTime = strtotime($leaveDate);
            if( $employmentEndDate != null && ( $employmentEndDate < $leaveDate ) ) { 
                $endTime = strtotime($employmentEndDate);
            }
            
            $startYear = date('Y', $startTime);
            $endYear = date('Y', $endTime);
            
            $startMonth = date('m', $startTime);
            $endMonth = date('m', $endTime);
            
            $monthsEmployed = (($endYear - $startYear) * 12) + ($endMonth - $startMonth);
            
            // Get the number of days in the ending date
            $daysInEndMonth = date( 't', $endTime );
            
            // Is the start and end dates in different months?
            if( intval(date('m', $startTime)) != intval(date('m', $endTime)) ) {
                // Is the start day after the end day (i.e., a full month hasn't passed yet)?
                if( date('d', $startTime) > date('d', $endTime) ) {
                    $monthsEmployed = $monthsEmployed - 1;
                    // Is the end day on the last day of the ending month and the start day greater or
                    // equal to the ending day?
                    if ( (date('d', $endTime) == $daysInEndMonth) && (date('d', $startTime) >= $daysInEndMonth) ) {
                        $monthsEmployed = $monthsEmployed + 1;
                    }
                }
            }
            
            // Determine the current month of employment
            $employmentMonth = $monthsEmployed + 1;
            
            // Set the end date for accrual calculations to be either today or the day on which
            // employment ended
            $endDate = new DateTime($leaveDate);
            if( $employmentEndDate != null && ( $employmentEndDate < $leaveDate ) ) { 
                $endDate = new DateTime($employmentEndDate);
            }
            
            // Get details about the specified leave rules for the leave type
            $sqlQuery = 
                'SELECT ' .
                    'leave_type_rules.id AS leave_type_rule_id, ' .
                    'leave_type_rules.start_month, ' .
                    'leave_type_rules.accrual_interval, ' .
                    'leave_type_rules.leave_accrual_type_code, ' .
                    'leave_type_rules.amount, ' .
                    'leave_type_rules.reset_accrued, ' .
                    'leave_type_rules.reset_taken ' .
                'FROM ' .
                    'leave_type_rules ' .
                'WHERE ' .
                    'leave_type_rules.leave_type_id = $1 ' .
                'ORDER BY ' .
                    'leave_type_rules.start_month DESC;';
            $sqlLeaveTypeRuleResult = $db->paramQuery($sqlQuery, [$sqlLeaveConfigRow['leave_type_id']]);
            if( !$sqlLeaveTypeRuleResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // For every rule per leave type
            while( $sqlLeaveTypeRuleRow = $sqlLeaveTypeRuleResult->fetchAssociative() ) {
                // Skip calculations if the rule has not started yet
                if( $sqlLeaveTypeRuleRow['start_month'] > $employmentMonth ) continue;
                
                // Reset hours and days worked and leave earned
                $hoursWorked = $leaveDetails['hoursWorked'];
                $daysWorked = $leaveDetails['daysWorked'];
                $leaveEarned = 0;
                $earnLeave = false;
                
                // Calculations should start on the day on which the rule started (set the day to 1
                // since PHP doesn't handle month addition well if the day is above 28)
                $startDate->setDate(
                    intval($startDate->format('Y')), 
                    intval($startDate->format('m')) + ($sqlLeaveTypeRuleRow['start_month'] - 1), 
                    1
                );
                
                // Get the number of days in the month of the rule start date
                $daysInEndMonth = $startDate->format('t');
                
                // Did the leave start on a day greater than the number of days of the month on 
                // which the rule started?
                if( $leaveStartDay > $daysInEndMonth ) {
                    // Set the start date to the last day of the rule start month
                    $startDate->setDate(
                        intval($startDate->format('Y')), 
                        intval($startDate->format('m')), 
                        $daysInEndMonth
                    );
                }
                else {
                    // Set the start date to the leave start day
                    $startDate->setDate(
                        intval($startDate->format('Y')), 
                        intval($startDate->format('m')), 
                        $leaveStartDay
                    );
                }
                
                // Set the default accrual date to the rule start date
                $accrualDate = new DateTime($startDate->format('Y-m-d'));
                
                // Leave accrues on hours worked?
                if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'HWOR' ) {
                    
                    //
                    // NOTE:
                    //
                    // Currently leave cannot be earned on hours worked via the work schedule, since it takes
                    // too long
                    //
                    
                    // // Is leave being calculated according to the work schedule?
                    // if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                    //     // Get the days and hours worked according to the schedule
                    //     $timeWorked = getLeaveScheduleTimeWorked(
                    //         $employeeId, 
                    //         $sqlLeaveConfigRow['leave_type_id'], 
                    //         $leaveDate, 
                    //         $user, 
                    //         $db 
                    //     );
                    //     $hoursWorked = $timeWorked['hoursWorked'];
                    //     $daysWorked = $timeWorked['daysWorked'];
                        
                    //     // echo( 
                    //     //     'Employee ' . $employeeId . ' for ' .
                    //     //     'type ' . $sqlLeaveConfigRow['leave_type_id'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                    //     //     $daysWorked . ' % ' . 
                    //     //     $sqlLeaveTypeRuleRow['accrual_interval'] . ' = ' . 
                    //     //     $daysWorked % $sqlLeaveTypeRuleRow['accrual_interval'] . '<br>' . PHP_EOL
                    //     // );
                    // }
                    
                    // Calculate the leave amount
                    if( $hoursWorked !== null && $hoursWorked > 0.0000009 ) {
                        // Is leave being earned according to the work schedule?
                        if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                            // // Only earn leave if the days worked matches the interval
                            // if( ($sqlLeaveTypeRuleRow['accrual_interval'] > 0) && ($hoursWorked % $sqlLeaveTypeRuleRow['accrual_interval'] == 0) ) {
                            //     $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            //     $earnLeave = true;
                            // }
                        }
                        else {
                            // Calculate leave amount
                            if( $sqlLeaveTypeRuleRow['accrual_interval'] > 0 ) {
                                $leaveEarned = ($hoursWorked / $sqlLeaveTypeRuleRow['accrual_interval']) * $sqlLeaveTypeRuleRow['amount'];
                            }
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on days worked?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'DWOR' ) {
                    // Is leave being calculated according to the work schedule?
                    if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                        // Get the days and hours worked according to the schedule
                        $timeWorked = getLeaveScheduleTimeWorked(
                            $employeeId, 
                            $sqlLeaveConfigRow['leave_type_id'], 
                            $leaveDate, 
                            $user, 
                            $db 
                        );
                        $hoursWorked = $timeWorked['hoursWorked'];
                        $daysWorked = $timeWorked['daysWorked'];
                        $isWorkDay = $timeWorked['isWorkDay'];
                        
                        // echo( 
                        //     'Employee ' . $employeeId . ' for ' .
                        //     'type ' . $sqlLeaveConfigRow['leave_type_id'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                        //     $daysWorked . ' % ' . 
                        //     $sqlLeaveTypeRuleRow['accrual_interval'] . ' = ' . 
                        //     $daysWorked % $sqlLeaveTypeRuleRow['accrual_interval'] . '<br>' . PHP_EOL
                        // );
                    }
                    
                    // Calculate the leave amount
                    if( $daysWorked !== null && $daysWorked > 0.0000009 ) {
                        // Is leave being earned according to the work schedule?
                        if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                            // Only earn leave if the days worked matches the interval
                            if( ($sqlLeaveTypeRuleRow['accrual_interval'] > 0) && ($daysWorked % $sqlLeaveTypeRuleRow['accrual_interval'] == 0) ) {
                                // Leave can only be earned on work days, otherwise leave may be earned multiple times
                                // for the same amount of days worked
                                if( $isWorkDay ) {
                                    $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                                    $earnLeave = true;
                                }
                            }
                        }
                        else {
                            // Only calculate daily leave from a different source than the work
                            // schedule if the work shedule is not enabled for the specified 
                            // employee
                            if( !$workScheduleLeaveEnabled ) {
                                // Calculate leave amount
                                if( $sqlLeaveTypeRuleRow['accrual_interval'] > 0 ) {
                                    // Earn daily leave as a percentage of the interval
                                    $leaveEarned = ($daysWorked / $sqlLeaveTypeRuleRow['accrual_interval']) * $sqlLeaveTypeRuleRow['amount'];
                                }
                                $earnLeave = true;
                            }
                        }
                    }
                }
                // Leave accrues on payslip?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'PAYS' ) {
                    // Is the leave source a payslip?
                    if( $leaveSourceType === 'PAYS' ) {
                        // Get the number of payslips issued for the specified employee
                        $sqlQuery = 
                            'SELECT ' .
                                'COUNT(payslips.id) AS payslip_count ' .
                            'FROM ' .
                                'payruns ' .
                            'LEFT JOIN ' .
                                'payslips ON payslips.payrun_id = payruns.id ' .
                            'WHERE ' .
                                'payruns.processed_on IS NOT NULL AND ' .
                                'payslips.status_code = \'ACTI\' AND ' .
                                'payslips.employee_id = $1;';
                        $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        $sqlRow = $sqlResult->fetchAssociative();
                        $numPayslips = $sqlRow['payslip_count'];
                    
                        // Do the number of payslips correspond to the accrual interval (we are 
                        // assuming that the payrun of which the source payslip is part has already
                        // been processed)?
                        if( ($sqlLeaveTypeRuleRow['accrual_interval'] > 0) && ($numPayslips % $sqlLeaveTypeRuleRow['accrual_interval']) === 0 ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on day cycle start?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'DCST' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Set the start and end time for accrual date calculation
                        $startTime = strtotime($startDate->format('Y-m-d'));
                        $endTime = strtotime($endDate->format('Y-m-d'));
                        
                        // Divide the difference into total number of seconds to get number of days 
                        $daysDiff = ($endTime - $startTime) / 60 / 60 / 24;
                        
                        // Calculate the number of days for completed cycles
                        $numDays = floor( $daysDiff / $sqlLeaveTypeRuleRow['accrual_interval'] ) * $sqlLeaveTypeRuleRow['accrual_interval'];
                        
                        // Add the number of days for completed cycles to the rule start date to 
                        // calculate the accrual date
                        $accrualDate = date('Y-m-d', strtotime($startDate->format('Y-m-d') . ' + ' . $numDays . ' days'));
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on day cycle end?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'DCEN' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Set the start and end time for accrual date calculation
                        $startTime = strtotime($startDate->format('Y-m-d'));
                        $endTime = strtotime($endDate->format('Y-m-d'));
                        
                        // Divide the difference into total number of seconds to get number of days 
                        $daysDiff = ($endTime - $startTime) / 60 / 60 / 24;
                        
                        // Calculate the number of days for completed cycles
                        $numDays = floor( $daysDiff / $sqlLeaveTypeRuleRow['accrual_interval'] ) * $sqlLeaveTypeRuleRow['accrual_interval'];
                        
                        // Add another cycle of days and subtract one since accrual takes place on the 
                        // last day of the current cycle
                        $numDays = $numDays + $sqlLeaveTypeRuleRow['accrual_interval'] - 1;
                        
                        // Add the number of days for completed cycles to the rule start date to 
                        // calculate the accrual date
                        $accrualDate = date('Y-m-d', strtotime($startDate->format('Y-m-d') . ' + ' . $numDays . ' days'));
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on month cycle start?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'MCST' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Calculate the number of completed cycles since the rule started
                        $numCycles = floor( ($monthsEmployed - $sqlLeaveTypeRuleRow['start_month'] + 1) / $sqlLeaveTypeRuleRow['accrual_interval'] );
                        
                        // Set the accrual month to the first day of the month on the last completed cycle
                        // (we do this because PHP has trouble adding months after the 28th day)
                        $accrualDate = new DateTime($startDate->format('Y-m-d'));
                        $accrualDate->setDate(
                            intval($accrualDate->format('Y')), 
                            intval($accrualDate->format('m')) + ($numCycles * $sqlLeaveTypeRuleRow['accrual_interval']), 
                            1
                        );
                        
                        // Get the number of days in the ending month
                        $daysInEndMonth = $endDate->format('t');
                        
                        // Did leave start on a day greater than the number of days in the ending month?
                        if( $leaveStartDay > $daysInEndMonth ) {
                            // Set the accrual date to the last day of the ending month
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')), 
                                $daysInEndMonth
                            );
                        }
                        else {
                            // Set the accrual date to the relevant day of the starting month
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')), 
                                $leaveStartDay
                            );
                        }
                        
                        // echo( 
                            // 'Employee ' . $employeeId . ' for ' .
                            // 'type ' . $sqlLeaveConfigRow['leave_type_id'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                            // $leaveDate . ' == ' . $accrualDate->format('Y-m-d') . PHP_EOL
                        // );
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on month cycle end?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'MCEN' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Calculate the number of completed cycles since the rule date and add
                        // one because the leave accrues at the end of the cycle
                        $numCycles = floor( ($monthsEmployed - $sqlLeaveTypeRuleRow['start_month'] + 1) / $sqlLeaveTypeRuleRow['accrual_interval'] ) + 1;
                        
                        // Set the accrual month to the first day of the month on the last completed cycle
                        // (we do this because PHP has trouble adding months after the 28th day)
                        $accrualDate = new DateTime($startDate->format('Y-m-d'));
                        $accrualDate->setDate(
                            intval($accrualDate->format('Y')), 
                            intval($accrualDate->format('m')) + ($numCycles * $sqlLeaveTypeRuleRow['accrual_interval']), 
                            1
                        );
                        
                        // Get the number of days in the ending month
                        $daysInEndMonth = $endDate->format('t');
                        
                        // Did the leave start on a day greater than the number of days in the ending month?
                        if( $leaveStartDay > $daysInEndMonth ) {
                            // Set the accrual date to the day before the last day of the ending month
                            // (i.e., the last day of the previous cycle)
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')), 
                                $daysInEndMonth - 1
                            );
                        }
                        else {
                            // Set the accrual date to the day before the relevant day of the starting month
                            // (i.e., the last day of the previous cycle)
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')), 
                                $leaveStartDay - 1
                            );
                        }
                        
                        // echo( 
                            // 'Employee ' . $employeeId . ' for ' .
                            // 'type ' . $sqlLeaveConfigRow['leave_type_id'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                            // $leaveDate . ' == ' . $accrualDate->format('Y-m-d') . PHP_EOL
                        // );
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on year cycle start?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'YCST' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Calculate the difference between start date and end date
                        $interval = date_diff($startDate, $endDate); 
                        
                        // Calculate the number of years employed
                        $yearsEmployed = intval($interval->format('%y'));
                        
                        // Calculate the number of completed cycles since the rule date
                        $numCycles = floor( $yearsEmployed  / $sqlLeaveTypeRuleRow['accrual_interval'] );
                        
                        // Calculate the number of years for the completed cycles
                        $numYears = $numCycles * $sqlLeaveTypeRuleRow['accrual_interval'];
                        
                        // Set the accrual year to the rule start year plus the number of years
                        // of the completed cycles
                        $accrualDate = new DateTime($startDate->format('Y-m-d'));
                        $accrualDate->setDate(
                            intval($accrualDate->format('Y')) + $numYears, 
                            intval($accrualDate->format('m')), 
                            intval($accrualDate->format('d'))
                        );
                        
                        // echo( 
                            // 'Employee ' . $employeeId . ' for ' .
                            // 'type ' . $sqlLeaveConfigRow['leave_type_id'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                            // 'start_month: ' . $sqlLeaveTypeRuleRow['start_month'] . ' > ' . '$employmentMonth: ' . $employmentMonth . '? ' .
                            // 'startDate' . ' == ' . $startDate->format('Y-m-d') . ': ' . 
                            // $leaveDate . ' == ' . $accrualDate->format('Y-m-d') . PHP_EOL . '<br>'
                        // );
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                // Leave accrues on year cycle end?
                else if( $sqlLeaveTypeRuleRow['leave_accrual_type_code'] === 'YCEN' ) {
                    // Is the leave source NOT a payslip?
                    if( $leaveSourceType !== 'PAYS' ) {
                        // Calculate the difference between start date and end date
                        $interval = date_diff($startDate, $endDate); 
                        
                        // Calculate the number of years employed
                        $yearsEmployed = intval($interval->format('%y'));
                        
                        // Calculate the number of completed cycles since the rule date
                        $numCycles = floor( $yearsEmployed  / $sqlLeaveTypeRuleRow['accrual_interval'] );
                        
                        // Calculate the number of years for the completed cycles (add one because 
                        // accrual takes place on the last day of the cycle)
                        $numYears = ($numCycles + 1) * $sqlLeaveTypeRuleRow['accrual_interval'];
                        
                        // Set the accrual year to the rule start year plus the number of years
                        // of the completed cycles plus one, and adjust the day to fall on the last 
                        // day of the current cycle
                        $accrualDate = new DateTime($startDate->format('Y-m-d'));
                        $accrualDate->setDate(
                            intval($accrualDate->format('Y')) + $numYears, 
                            intval($accrualDate->format('m')), 
                            intval($accrualDate->format('d')) - 1
                        );
                        
                        // Should accrual occur?
                        if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                            $leaveEarned = $sqlLeaveTypeRuleRow['amount'];
                            $earnLeave = true;
                        }
                    }
                }
                else {
                    $leaveEarned = 0;
                    $earnLeave = false;
                }
                
                // Get the total of leave days and hours accrued
                $leaveAccrued = 0;
                $leaveHoursAccrued = 0;
                $leaveDaysAccrued = 0;
                $sqlQuery = 
                    'SELECT ' .
                        'SUM(leave.hours) AS hours_earned, ' .
                        'SUM(leave.days) AS days_earned ' .
                    'FROM ' .
                        'leave ' .
                    'WHERE ' .
                        'leave.leave_action_code != \'LTAK\' AND ' .
                        'leave.date <= $1 AND ' .
                        'leave.leave_type_id = $2 AND ' .
                        'leave.employee_id = $3;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveDate,
                    $sqlLeaveConfigRow['leave_type_id'],
                    $employeeId
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                
                $leaveDaysAccrued = $sqlRow['days_earned'];
                $leaveHoursAccrued = $sqlRow['hours_earned'];
                
                // Has leave been accrued in days or hours?
                if( $sqlLeaveConfigRow['leave_unit_code'] === 'DAYS' ) {
                    if( $sqlRow['days_earned'] !== null ) {
                        $leaveAccrued = $leaveDaysAccrued;
                    }
                }
                else {
                    if( $sqlRow['hours_earned'] !== null ) {
                        $leaveAccrued = $leaveHoursAccrued;
                    }
                }
                
                // Get the total of leave days and hours taken
                $leaveTaken = 0;
                $leaveHoursTaken = 0;
                $leaveDaysTaken = 0;
                $sqlQuery = 
                    'SELECT ' .
                        'SUM(leave.hours) AS hours_taken, ' .
                        'SUM(leave.days) AS days_taken ' .
                    'FROM ' .
                        'leave ' .
                    'WHERE ' .
                        'leave.leave_action_code = \'LTAK\' AND ' .
                        'leave.date <= $1 AND ' .
                        'leave.leave_type_id = $2 AND ' .
                        'leave.employee_id = $3;';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $leaveDate,
                    $sqlLeaveConfigRow['leave_type_id'],
                    $employeeId
                ]);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                $sqlRow = $sqlResult->fetchAssociative();
                
                $leaveDaysTaken = $sqlRow['days_taken'] * -1;
                $leaveHoursTaken = $sqlRow['hours_taken'] * -1;
                
                // Has leave been taken in days or hours?
                if( $sqlLeaveConfigRow['leave_unit_code'] === 'DAYS' ) {
                    if( $sqlRow['days_taken'] !== null ) {
                        $leaveTaken = $leaveDaysTaken;
                    }
                }
                else {
                    if( $sqlRow['hours_taken'] !== null ) {
                        $leaveTaken = $leaveHoursTaken;
                    }
                }
                
                // Should leave be earned or adjusted? 
                if( $earnLeave && $leaveSourceType !== null ) {
                    // Should leave accrued be reset?
                    if( $sqlLeaveTypeRuleRow['reset_accrued'] && $leaveAccrued > 0.0000009 ) {
                        // Reset accrued leave
                        $sqlQuery =
                            'INSERT INTO ' .
                                'leave ( ' .
                                    'leave_action_code, ' .
                                    'description, ' .
                                    'hours, ' .
                                    'days, ' .
                                    'date, ' .
                                    'leave_type_id, ' .
                                    'employee_id, ' .
                                    'leave_source_type_code, ' .
                                    'payslip_id, ' .
                                    'process_time, ' .
                                    'added_by_user_id ' .
                                ') ' .
                            'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            'RESE',                                     // leave_action_code
                            'Reset Leave Accrued',                      // description
                            $leaveHoursAccrued * -1,                    // hours
                            $leaveDaysAccrued * -1,                     // days
                            $leaveDate,                                 // date
                            $sqlLeaveConfigRow['leave_type_id'],        // leave_type_id
                            $employeeId,                                // employee_id
                            $leaveSourceType,                           // leave_source_type_code
                            $payslipId,                                 // payslip_id
                            date('Y-m-d H:i:s'),                        // process_time
                            (isset($user['id']) ? $user['id'] : null)   // added_by_user_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        $leaveAccrued = 0;
                    }
                    
                    // Should leave taken be reset?
                    if( $sqlLeaveTypeRuleRow['reset_taken'] && $leaveTaken > 0.0000009 ) {
                        // Reset leave taken
                        $sqlQuery =
                            'INSERT INTO ' .
                                'leave ( ' .
                                    'leave_action_code, ' .
                                    'description, ' .
                                    'hours, ' .
                                    'days, ' .
                                    'date, ' .
                                    'leave_type_id, ' .
                                    'employee_id, ' .
                                    'leave_source_type_code, ' .
                                    'payslip_id, ' .
                                    'process_time, ' .
                                    'added_by_user_id ' .
                                ') ' .
                            'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            'RESE',                                     // leave_action_code
                            'Reset Leave Taken',                        // description
                            $leaveHoursTaken,                           // hours
                            $leaveDaysTaken,                            // days
                            $leaveDate,                                 // date
                            $sqlLeaveConfigRow['leave_type_id'],        // leave_type_id
                            $employeeId,                                // employee_id
                            $leaveSourceType,                           // leave_source_type_code
                            $payslipId,                                 // payslip_id
                            date('Y-m-d H:i:s'),                        // process_time
                            $user['id']                                 // added_by_user_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                        $leaveTaken = 0;
                    }
                    
                    // Process leave if leave was earned
                    if( $leaveEarned > 0.0000009 ) {
                        // Save the amount of leave earned
                        $days = 0;
                        $hours = 0;
                        if( $sqlLeaveConfigRow['leave_unit_code'] === 'DAYS' ) {
                            $days = $leaveEarned;
                        }
                        else {
                            $hours = $leaveEarned;
                        }
                        
                        $sqlQuery =
                            'INSERT INTO ' .
                                'leave ( ' .
                                    'leave_action_code, ' .
                                    'description, ' .
                                    'hours, ' .
                                    'days, ' .
                                    'date, ' .
                                    'leave_type_id, ' .
                                    'employee_id, ' .
                                    'leave_source_type_code, ' .
                                    'payslip_id, ' .
                                    'process_time, ' .
                                    'added_by_user_id ' .
                                ') ' .
                            'VALUES ( ' .
                                '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            ');';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            'LEAR',                                     // leave_action_code
                            'Leave Earned',                             // description
                            $hours,                                     // hours
                            $days,                                      // days
                            $leaveDate,                                 // date
                            $sqlLeaveConfigRow['leave_type_id'],        // leave_type_id
                            $employeeId,                                // employee_id
                            $leaveSourceType,                           // leave_source_type_code
                            $payslipId,                                 // payslip_id
                            date('Y-m-d H:i:s'),                        // process_time
                            (isset($user['id']) ? $user['id'] : null)   // added_by_user_id
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
                else {
                    $leaveEarned = 0;
                }
                
                // Calculate the total amount of leave available
                $leaveAvailable = $leaveEarned + $leaveAccrued - $leaveTaken;
                
                // Save the leave type details
                $leaveResult[] = [
                    'name' => $sqlLeaveConfigRow['leave_type_name'],
                    'monthsEmployed' => $monthsEmployed,
                    'unit' => $sqlLeaveConfigRow['leave_unit_code'],
                    'leaveEarned' => $leaveEarned,
                    'leaveAccrued' => $leaveAccrued,
                    'leaveTaken' => $leaveTaken,
                    'leaveAvailable' => $leaveAvailable
                ];
                
                // Only one rule should be applied per leave type
                break;
            }
        }
        
        return $leaveResult;
    }
    
    // Function to calculate leave according to the work schedule
    //
    // Required Parameters
    //  $leaveDate          The date on which leave should be calculated
    //
    // Optional Parameters
    //  None
    function processCompanyLeave( $leaveDate, $user, $db ) {
        // Set the process date, if it wasn't set
        if( $leaveDate == null ) {
            $leaveDate = date('Y-m-d');
        }
        
        // Get all the employees
        $sqlQuery =
            'SELECT ' .
                'employees.id AS employee_id, ' .
                'work_schedules.enable_leave AS enable_work_schedule_leave ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'work_schedules ON work_schedules.employee_id = employees.id ' .
            'WHERE ' .
                'employees.employment_start_date <= $1 ' .
            'ORDER BY ' .
                'employees.id ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, [$leaveDate]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        $startTime = date('Y-m-d H:i:s');
        
        // Start SQL transaction
        $db->startTransaction();
        
        // For every employee
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set leave source type
            $leaveSourceType = 'CYCL';
            if( $sqlRow['enable_work_schedule_leave'] == true ) $leaveSourceType = 'WSCH';
            
            // Set the leave details
            $leaveDetails = [
                'employeeId' => $sqlRow['employee_id'],
                'hoursWorked' => null,
                'daysWorked' => null,
                'leaveSourceType' => $leaveSourceType,
                'leaveDate' => $leaveDate
            ];
            
            // Calculate and earn leave and return the result
            $leaveResult = processEmployeeLeave( $leaveDetails, $user, $db );
            if( $leaveResult === false ) return false;
        }
        
        // Save leave details in the log
        $sqlQuery =
            'INSERT INTO ' .
                'leave_maintenance_log ( ' .
                    'date, ' .
                    'start_time, ' .
                    'end_time ' .
                ') ' .
            'VALUES ( ' .
                '$1, $2, $3 ' .
            ');';
        $sqlResult = $db->paramQuery($sqlQuery, [
            $leaveDate,             // date
            $startTime,             // start_time
            date('Y-m-d H:i:s')     // end_time
        ]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        // Commit SQL transaction
        $db->commitTransaction();
        
        return true;
    }
    
    // Function to calculate leave time worked (hours and days) according to the work schedule
    //
    // Required Parameters
    //   $employeeId        The id of the employee whose leave time to calculate
    //   $leaveTypeId       The id of the leave type
    //   $leaveEndDate      The date up to which leave should be calculated
    //
    // Optional Parameters
    //  None
    function getLeaveScheduleTimeWorked( $employeeId, $leaveTypeId, $leaveEndDate, $user, $db ) {
        // Set the process date, if it wasn't set
        if( $leaveEndDate == null ) {
            $leaveEndDate = date('Y-m-d');
        }
        
        // Get all the employees whose leave should be calculated via the work schedule
        $sqlQuery =
            'SELECT ' .
                'employees.id AS employee_id, ' .
                'employees.employment_start_date, ' .
                'employees.employment_end_date, ' .
                'leave.date AS leave_date, ' .
                'work_schedules.monday_hours, ' .
                'work_schedules.tuesday_hours, ' .
                'work_schedules.wednesday_hours, ' .
                'work_schedules.thursday_hours, ' .
                'work_schedules.friday_hours, ' .
                'work_schedules.saturday_hours, ' .
                'work_schedules.sunday_hours ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'leave ON leave.employee_id = employees.id AND ' .
                '( ' .
                    'leave.leave_source_type_code = \'CYCL\' OR ' .
                    'leave.leave_source_type_code = \'WSCH\' ' .
                ') AND ' .
                'leave.leave_type_id = $1 ' .
            'LEFT JOIN ' .
                'work_schedules ON work_schedules.employee_id = employees.id ' .
            'WHERE ' .
                'employees.id = $2 AND ' .
                'work_schedules.enable_leave = true ' .
            'ORDER BY ' .
                'leave.date DESC LIMIT 1;';
        $sqlResult = $db->paramQuery($sqlQuery, [
            $leaveTypeId,
            $employeeId
        ]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        // For every employee
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // Set the start date for the calculation
            $startDate = $sqlRow['employment_start_date'];
            if( $sqlRow['leave_date'] != null ) {
                $startDate = $sqlRow['leave_date'];
                $startDate = date('Y-m-d', strtotime($startDate . ' +1 day'));
            }
            
            // Add one day to the start date
            // $startDate = date('Y-m-d', strtotime($startDate . ' +1 day'));
            
            // Set the end date for the calculation
            $endDate = $leaveEndDate;
            if( $sqlRow['employment_end_date'] != null && ( $sqlRow['employment_end_date'] < $leaveEndDate ) ) { 
                $endDate = $sqlRow['employment_end_date'] ;
            }
            
// echo( 
    // 'Employee ' . $employeeId . 
    // ' from ' . $startDate . 
    // ' to ' . $endDate . '<br>' . PHP_EOL 
// );

            // Calculate hours and days worked for every day since the start date up to the end date
            $hoursWorked = 0;
            $daysWorked = 0;
            $isWorkDay = false;
            while( $startDate <= $endDate) {
                // Get the day of the week 
                $dayOfWeek = date('w', strtotime($startDate));
                $isWorkDay = false;
                
                // Depending on the day of the week
                if( $dayOfWeek == 0 ) {
                    if( $sqlRow['sunday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['sunday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 1 ) {
                    if( $sqlRow['monday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['monday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 2 ) {
                    if( $sqlRow['tuesday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['tuesday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 3 ) {
                    if( $sqlRow['wednesday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['wednesday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 4 ) {
                    if( $sqlRow['thursday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['thursday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 5 ) {
                    if( $sqlRow['friday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['friday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
                else if( $dayOfWeek == 6 ) {
                    if( $sqlRow['saturday_hours'] != null ) {
                        $hoursWorked = $hoursWorked + (int)$sqlRow['saturday_hours'];
                        $daysWorked = $daysWorked + 1;
                        $isWorkDay = true;
                    }
                }
               
                // Add one day to the start date
                $startDate = date('Y-m-d', strtotime($startDate . ' +1 day'));
            }
            
            $leaveTimeWorked = [
                'hoursWorked' => $hoursWorked,
                'daysWorked' => $daysWorked,
                'isWorkDay' => $isWorkDay 
            ];
            
            return $leaveTimeWorked;
        }
    }
    
    // Function to get all leave balances for a specified employee (this includes only processed leave up to the current date)
    //
    // Required Parameters
    //   $employeeId        The id of the employee whose leave balance to get
    //   $fromDate          The date from which leave should be calculated
    //   $toDate            The date up to which leave should be calculated
    //
    // Optional Parameters
    //  None
    function getLeaveBalances( $employeeId, $fromDate, $toDate, $user, $db ) {
        // Check required values
        if($employeeId === null || $employeeId === '') {
            return false;
        }
        else if($fromDate === null || $fromDate === '') {
            return false;
        }
        else if($toDate === null || $toDate === '') {
            return false;
        }
        
        $leaveData = [];
        
        // Get leave types
        $leaveQuery = 
            'SELECT ' .
                'leave_type_id, leave_types.name, leave_unit_code ' .
            'FROM ' .
                'leave_config_items ' .
            'LEFT JOIN ' .
                'leave_types ON leave_config_items.leave_type_id = leave_types.id ' .
            'WHERE ' . 
                'leave_config_items.employee_id = $1 AND ' . 
                'leave_types.is_deleted = FALSE;';
        $leaveResult = $db->paramQuery($leaveQuery, [
            $employeeId
        ]);
        if( !$leaveResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        while( $leaveRow = $leaveResult->fetchAssociative() ) {
            // Get leave for each leave type
            $leaveValuesQuery = 
                'SELECT ' .
                    'leave_action_code, SUM(hours) AS hours, SUM(days) AS days ' .
                'FROM ' .
                    'leave ' .
                'WHERE ' .
                    'leave_type_id = $1 AND employee_id = $2 AND ' .
                    'leave.employee_id = $2 AND (date >= $3 AND date <= $4) ' .
                'GROUP BY leave_action_code ';
            $leaveValueResult = $db->paramQuery($leaveValuesQuery, [
                $leaveRow['leave_type_id'],
                $employeeId,
                $fromDate,
                $toDate
            ]);
            if( !$leaveValueResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $adjustment = 0;
            $taken = 0;
            $accrued = 0;
            
            while( $leaveValueRow = $leaveValueResult->fetchAssociative() ) {
                if ($leaveValueRow['leave_action_code'] === 'ADJU' || $leaveValueRow['leave_action_code'] === 'RESE') {
                    if ($leaveRow['leave_unit_code'] === 'DAYS') {
                        $adjustment = floatval($adjustment) + floatval($leaveValueRow['days']);
                    }
                    else {
                        $adjustment = floatval($adjustment) + floatval($leaveValueRow['hours']);
                    }
                }
                else if ($leaveValueRow['leave_action_code'] === 'LEAR') {
                    if ($leaveRow['leave_unit_code'] === 'DAYS') {
                        $accrued = $leaveValueRow['days'];
                    }
                    else {
                        $accrued = $leaveValueRow['hours'];
                    }
                }
                else if ($leaveValueRow['leave_action_code'] === 'LTAK') {
                    if ($leaveRow['leave_unit_code'] === 'DAYS') {
                        $taken = $leaveValueRow['days'];
                    }
                    else {
                        $taken = $leaveValueRow['hours'];
                    }
                }
            }
            
            $unit = 'hours';
            if ($leaveRow['leave_unit_code'] === 'DAYS') {
                $unit = 'days';
            }
            
            $leaveData[$leaveRow['name']] = [
                'id' => $leaveRow['leave_type_id'],
                'adjustment' => $adjustment,
                'accrued' => $accrued,
                'taken' => $taken,
                'balance' => 0,
                'unit' => $unit
            ];
        }
        
        // Get leave balances
        $leaveBalanceQuery = 
            'SELECT ' .
                'leave_types.id, leave_types.name, leave_unit_code, SUM(hours) AS hours, SUM(days) AS days ' .
            'FROM ' . 
                'leave ' .
            'LEFT JOIN ' .
                'leave_types ON leave_types.id = leave_type_id ' .
            'WHERE ' . 
                'leave_types.id IN ( SELECT leave_type_id FROM leave_config_items WHERE employee_id = $1 ) AND ' .
                'employee_id = $1 AND ' . 
                'date <= $2 AND ' .
                'leave_types.is_deleted = FALSE ' .
            'GROUP BY ' . 
                'leave_types.id, leave_types.name, leave_unit_code ' .
            'ORDER BY name; ';
        $leaveBalanceResult = $db->paramQuery($leaveBalanceQuery, [
            $employeeId,
            $toDate
        ]);
        if( !$leaveBalanceResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        while( $leaveRow = $leaveBalanceResult->fetchAssociative() ) {
            // Depending on the leave unit
            if ($leaveRow['leave_unit_code'] === 'DAYS') {
                if (isset($leaveData[$leaveRow['name']])) {
                    $leaveData[$leaveRow['name']] = [
                        'id' => $leaveData[$leaveRow['name']]['id'],
                        'adjustment' => $leaveData[$leaveRow['name']]['adjustment'],
                        'accrued' => $leaveData[$leaveRow['name']]['accrued'],
                        'taken' => $leaveData[$leaveRow['name']]['taken'],
                        'balance' => $leaveRow['days'],
                        'unit' => $leaveData[$leaveRow['name']]['unit']
                    ];
                }
                else {
                    $leaveData[$leaveRow['name']] = [
                        'id' => $leaveRow['id'],
                        'adjustment' => 0,
                        'accrued' => 0,
                        'taken' => 0,
                        'balance' => $leaveRow['days'],
                        'unit' => 'days'
                    ];
                }
            }
            else {
                if (isset($leaveData[$leaveRow['name']])) {
                    $leaveData[$leaveRow['name']] = [
                        'id' => $leaveData[$leaveRow['name']]['id'],
                        'adjustment' => $leaveData[$leaveRow['name']]['adjustment'],
                        'accrued' => $leaveData[$leaveRow['name']]['accrued'],
                        'taken' => $leaveData[$leaveRow['name']]['taken'],
                        'balance' => $leaveRow['hours'],
                        'unit' => $leaveData[$leaveRow['name']]['unit']
                    ];
                }
                else {
                    $leaveData[$leaveRow['name']] = [
                        'id' => $leaveRow['id'],
                        'adjustment' => 0,
                        'accrued' => 0,
                        'taken' => 0,
                        'balance' => $leaveRow['hours'],
                        'unit' => 'hours'
                    ];
                }
            }
        }
        
        // Send result
        return $leaveData;
    }
    
    // Function to get all leave balances for a specified employee, also calculating leave for future dates for which leave has
    // not been processed yet
    //
    // Required Parameters
    //   $employeeId        The id of the employee whose leave balances to get
    //   $fromDate          The date from which leave should be calculated
    //   $toDate            The date up to which leave should be calculated
    //
    // Optional Parameters
    //  None
    function calculateLeaveBalances( $employeeId, $fromDate, $toDate, $user, $db ) {
        // Check required values
        if($employeeId === null || $employeeId === '') {
            return false;
        }
        else if($fromDate === null || $fromDate === '') {
            return false;
        }
        else if($toDate === null || $toDate === '') {
            return false;
        }
        
        // Set the leave details
        $leaveDetails = [
            'employeeId' => $employeeId,
            'hoursWorked' => null,
            'daysWorked' => null,
            'fromDate' => $fromDate,
            'toDate' => $toDate
        ];
        
        // Calculate the leave for the remaining period
        $leaveResult = calculateEmployeeLeave( $leaveDetails, $user, $db );
        if( $leaveResult === false ) return false;
        
        $leaveData = [];
        foreach( $leaveResult AS $leaveType ) {
            $unit = 'hours';
            if ($leaveType['unit'] === 'DAYS') {
                $unit = 'days';
            }
            
            $leaveData[$leaveType['name']] = [
                'id' => $leaveType['id'],
                // 'name' => $leaveType['name'],
                'adjustment' => $leaveType['leaveAdjusted'],
                'accrued' => $leaveType['leaveEarned'],
                'taken' => ($leaveType['leaveTaken'] !== null ? $leaveType['leaveTaken'] * -1 : 0),
                'balance' => $leaveType['leaveAvailable'],
                'unit' => $unit
            ];
        }
        
        // Send result
        return $leaveData;
    }
    
    // Function to calculate leave for a specified employee, over a given period
    //
    //  leaveDetails                An array describing the leave details for a specified employee
    //
    //  leaveDetails = [
    //      'employeeId',           The employee id
    //      'hoursWorked',          How many hours the employee worked
    //      'daysWorked',           How many days the employee worked
    //      'fromDate'              The date from which the leave should be calculated (today if null)
    //      'toDate'                The date to which the leave should be calculated (today if null)
    //   ];
    function calculateEmployeeLeave($leaveDetails, $user, $db) {
        // Setup the details for the calculation
        $employeeId = $leaveDetails['employeeId'];
        $payslipId = null;
        if( array_key_exists( 'payslipId', $leaveDetails ) ) {
            $payslipId = $leaveDetails['payslipId'];
        }
        $hoursWorked = $leaveDetails['hoursWorked'];
        $daysWorked = $leaveDetails['daysWorked'];
        // $leaveSourceType = $leaveDetails['leaveSourceType'];
        
        // Get today's date
        $currentDate = date('Y-m-d');
        
        // Format start and ending date
        $fromDate = $leaveDetails['fromDate'];
        if( $fromDate == null ) {
            $leaveDetails['fromDate'] = $currentDate;
            $fromDate = $currentDate;
        }
        $toDate = $leaveDetails['toDate'];
        if( $toDate == null ) $toDate = $currentDate;
        
        // Set the maximum execution time for funtion to 10 minutes
        set_time_limit(600);
        
        // Get the last date for which leave was calculated
        $sqlQuery =  'SELECT date FROM leave_maintenance_log ORDER BY date DESC LIMIT 1;';
        $sqlResult = $db->paramQuery($sqlQuery, []);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        $leaveMaintenanceDate = '2000-01-01';
        if( $sqlResult->getRowCount() == 1) {
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['date'] != null ) {
                $leaveMaintenanceDate = date('Y-m-d', strtotime($sqlRow['date'] . ' +1 day'));
            }
        }
        
        // Make certain we calculate leave all the way from the last maintenance date
        if( $fromDate > $leaveMaintenanceDate ) {
            $fromDate = $leaveMaintenanceDate;
        }
        
        // Get the relevant employee details
        $sqlQuery = 
            'SELECT ' .
                'employees.employment_start_date, ' .
                'employees.employment_end_date, ' .
                'work_schedules.enable_leave AS enable_work_schedule_leave ' .
            'FROM ' .
                'employees ' .
            'LEFT JOIN ' .
                'work_schedules ON work_schedules.employee_id = employees.id ' .
            'WHERE ' .
                'employees.id = $1';
        $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        $sqlRow = $sqlResult->fetchAssociative();
        $employmentStartDate = $sqlRow['employment_start_date'];
        $employmentEndDate = $sqlRow['employment_end_date'];
        $workScheduleLeaveEnabled = $sqlRow['enable_work_schedule_leave'];
        
        // // Make certain we don't calculate leave from before the employee was employed
        // if( $fromDate < $employmentStartDate ) {
        //     $fromDate = $employmentStartDate;
        // }
        
        // Set leave source type
        $leaveSourceType = 'CYCL';
        if( $sqlRow['enable_work_schedule_leave'] == true ) $leaveSourceType = 'WSCH';
        
        // Get all the leave types for the specified employee
        $sqlQuery = 
            'SELECT ' .
                'leave_config_items.id AS leave_config_item_id, ' .
                'leave_config_items.leave_type_id, ' .
                'leave_config_items.employee_leave_start_date, ' .
                'leave_types.name AS leave_type_name, ' .
                'leave_types.leave_unit_code, ' .
                'leave_types.start_date AS leave_type_start_date ' .
            'FROM ' .
                'leave_config_items ' .
            'LEFT JOIN ' .
                'leave_types ON leave_types.id = leave_config_items.leave_type_id ' .
            'WHERE ' .
                'leave_config_items.employee_id = $1 AND ' . 
                'leave_types.is_deleted = FALSE ' . 
            'ORDER BY '. 
                'leave_types.name ASC;';
        $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        $leaveConfigItems = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            $leaveConfigItems[] = [
                'id' => $sqlRow['leave_config_item_id'],
                'leaveTypeId' => $sqlRow['leave_type_id'],
                'employeeLeaveStartDate' => $sqlRow['employee_leave_start_date'],
                'leaveTypeName' => $sqlRow['leave_type_name'],
                'leaveUnitCode' => $sqlRow['leave_unit_code'],
                'leaveTypeStartDate' => $sqlRow['leave_type_start_date'],
                'monthsEmployed' => null,
                'rules' => [],
                'leave' => []
            ];
        }
        
        // Get the rules for every leave config items
        for( $configIndex = 0; $configIndex < count($leaveConfigItems); $configIndex++ ) {
            // Get details about the specified leave rules for the leave type
            $sqlQuery = 
                'SELECT ' .
                    'leave_type_rules.id AS leave_type_rule_id, ' .
                    'leave_type_rules.start_month, ' .
                    'leave_type_rules.accrual_interval, ' .
                    'leave_type_rules.leave_accrual_type_code, ' .
                    'leave_type_rules.amount, ' .
                    'leave_type_rules.reset_accrued, ' .
                    'leave_type_rules.reset_taken ' .
                'FROM ' .
                    'leave_type_rules ' .
                'WHERE ' .
                    'leave_type_rules.leave_type_id = $1 ' .
                'ORDER BY ' .
                    'leave_type_rules.start_month DESC;';
            $sqlResult = $db->paramQuery($sqlQuery, [$leaveConfigItems[$configIndex]['leaveTypeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $leaveConfigItems[$configIndex]['rules'][] = [
                    'id' => $sqlRow['leave_type_rule_id'],
                    'startMonth' => $sqlRow['start_month'],
                    'accrualInterval' => $sqlRow['accrual_interval'],
                    'leaveAccrualTypeCode' => $sqlRow['leave_accrual_type_code'],
                    'amount' => $sqlRow['amount'],
                    'resetAccrued' => $sqlRow['reset_accrued'],
                    'resetTaken' => $sqlRow['reset_taken']
                ];
            }
        }
        
        // For each leave type
        for( $configIndex = 0; $configIndex < count($leaveConfigItems); $configIndex++ ) {
            // Get all the leave up to the paylsip end date
            $sqlQuery = 
                'SELECT ' .
                    'leave.date AS leave_date, ' .
                    'leave.leave_action_code, ' .
                    '(leave.days + leave.hours) AS leave_amount ' . 
                'FROM ' .
                    'leave ' .
                'WHERE ' .
                    'leave.date <= $1 AND ' .
                    'leave.leave_type_id = $2 AND ' .
                    'leave.employee_id = $3 ' . 
                'ORDER BY ' . 
                    'leave.date ASC, id ASC;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $toDate,
                $leaveConfigItems[$configIndex]['leaveTypeId'],
                $employeeId
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $leaveConfigItems[$configIndex]['leave'][] = [
                    'date' => $sqlRow['leave_date'],
                    'actionCode' => $sqlRow['leave_action_code'],
                    'amount' => $sqlRow['leave_amount'],
                ];
            }
        }
        
        
        // Skip calculating leave if the end date if before the maintenance date since all leave has already been calculated
        // by the maintenance function
        if( $toDate <= $leaveMaintenanceDate ) {
            // For every leave config item for the specified employee
            $leaveResult = [];
            for( $configIndex = 0; $configIndex < count($leaveConfigItems); $configIndex++ ) {
                // The leave start date is calculated as follows: If no employee leave config start date is specified 
                // (this enables employees to have customised start dates for every leave type), use the leave type 
                // start date. If no leave type start date is specified, use the employee employment date.
                $leaveStartDate = $employmentStartDate;
                if( $leaveConfigItems[$configIndex]['employeeLeaveStartDate'] !== null ) {
                    if( $employmentStartDate <= $leaveConfigItems[$configIndex]['employeeLeaveStartDate'] ) {
                        $leaveStartDate = $leaveConfigItems[$configIndex]['employeeLeaveStartDate'];
                    }
                }
                else if( $leaveConfigItems[$configIndex]['leaveTypeStartDate'] !== null ) {
                    if( $employmentStartDate <= $leaveConfigItems[$configIndex]['leaveTypeStartDate'] ) {
                        $leaveStartDate = $leaveConfigItems[$configIndex]['leaveTypeStartDate'];
                    }
                }
                
                // Set the start date for accrual date calculations
                $startDate = new DateTime($leaveStartDate);
                $leaveStartDay = intval($startDate->format('d'));
                
                // Calculate how long the employee has been employed (in months)
                $startTime = strtotime($leaveStartDate);
                $endTime = strtotime($toDate);
                if( $employmentEndDate != null && ( $employmentEndDate < $toDate ) ) { 
                    $endTime = strtotime($employmentEndDate);
                }
                
                $startYear = date('Y', $startTime);
                $endYear = date('Y', $endTime);
                $startMonth = date('m', $startTime);
                $endMonth = date('m', $endTime);
                
                $monthsEmployed = (($endYear - $startYear) * 12) + ($endMonth - $startMonth);
                
                // // Try to find the specified leave type in the results
                // $leaveTypeIndex = -1;
                // for( $resultIndex = 0; $resultIndex < count($leaveResult); $resultIndex++ ) {
                //     if( $leaveResult[$resultIndex]['id'] == $leaveConfigItems[$configIndex]['leaveTypeId'] ) {
                //         $leaveTypeIndex = $resultIndex;
                //         break;
                //     }
                // }
                
                // // Was no leave type found?
                // if( $leaveTypeIndex < 0 ) {
                    // Calculate the leave totals and balances
                    $leaveEarned = 0;
                    $leaveAdjusted = 0;
                    $leaveTaken = 0;
                    $leaveBalance = 0;
                    
                    foreach( $leaveConfigItems[$configIndex]['leave'] AS $leave ) {
                        // Exit if past the end date
                        if( $leave['date'] > $toDate ) break;
                        
                        // Is the leave in the payslip period
                        if( $leave['date'] >= $leaveDetails['fromDate'] ) {
                            if( $leave['actionCode'] === 'LEAR' ) {
                                $leaveEarned += ($leave['amount']);
                            }
                            else if( $leave['actionCode'] === 'LTAK' ) {
                                $leaveTaken += ($leave['amount'] * -1);
                            }
                            else if( $leave['actionCode'] === 'ADJU' ) {
                                $leaveAdjusted += ($leave['amount']);
                            }
                        }
                        
                        // Calculate the leave balance
                        $leaveBalance += ($leave['amount']);
                    }
                    
                    // Adjust the leave earned to make provision for resets in the same month as leave is earned
                    if( ($leaveEarned + $leaveAdjusted - $leaveTaken) > ($leaveBalance) ) {
                        $leaveEarned = ($leaveBalance + $leaveAdjusted - $leaveTaken);
                    }
                    
                    // Add the leave type details
                    $leaveResult[] = [
                        'id' => $leaveConfigItems[$configIndex]['leaveTypeId'],
                        'name' => $leaveConfigItems[$configIndex]['leaveTypeName'],
                        'monthsEmployed' => $monthsEmployed,
                        'unit' => $leaveConfigItems[$configIndex]['leaveUnitCode'],
                        'leaveAdjusted' => $leaveAdjusted, 
                        'leaveEarned' => $leaveEarned,
                        'leaveTaken' => $leaveTaken,
                        'leaveAvailable' => $leaveBalance
                    ];
                    // $leaveTypeIndex = count($leaveResult) - 1;
// file_put_contents('php://stderr', print_r(("\n" . 'Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveEarnedTotal: ' . $leaveConfigItems[$configIndex]['leaveEarnedTotal'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveEarned: ' . $leaveConfigItems[$configIndex]['leaveEarned'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveAdjustedTotal: ' . $leaveConfigItems[$configIndex]['leaveAdjustedTotal'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): '  . ' leaveAdjusted: ' . $leaveConfigItems[$configIndex]['leaveAdjusted'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveTakenTotal: ' . $leaveConfigItems[$configIndex]['leaveTakenTotal'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): '  . ' leaveTaken: ' . $leaveConfigItems[$configIndex]['leaveTaken'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): '  . ' leaveAvailable: ' . $leaveResult[$leaveTypeIndex]['leaveAvailable'] . "\n"), TRUE));
                // }
            }
            
            return $leaveResult;
        }
        
// file_put_contents('php://stderr', print_r(("\n" . 'Days: ' . $dayRange . "\n"), TRUE));
        
        // The total number of days between the two dates. We compute the no. of seconds and divide it to 60*60*24
        // We add one to inlude both dates in the interval.
        $dayRange = (int)((strtotime($toDate) - strtotime($fromDate)) / 86400 + 1);
        
        // Calculate leave for every day in the period (that was not already calculated by the maintenance function)
        $payslipLeaveAccrued = false;
        $leaveDate = $fromDate;
        
// file_put_contents('php://stderr', print_r(("\n" . 'Leave Date: ' . $leaveDate . "\n"), TRUE));
        
        $leaveResult = [];
        for( $numDays = 0; $numDays < $dayRange; $numDays++ ) {
            // Reset amounts
            $leaveAdjusted = 0;
            $leaveEarned = 0;
            $leaveTaken = 0;
            
            // Have we already calculated the first day?
            if( $numDays > 0 ) {
                // Adjust the leave date to the next day
                $leaveDate = date('Y-m-d', strtotime($leaveDate . ' +1 day'));
            }
            
            // Skip calculations if employee is not yet employed
            if( $leaveDate < $employmentStartDate ) continue;
            
// file_put_contents('php://stderr', print_r(("\n" . 'Leave Date: ' . $leaveDate), TRUE));
            
            // For every leave config item for the specified employee
            for( $configIndex = 0; $configIndex < count($leaveConfigItems); $configIndex++ ) {
                // The leave start date is calculated as follows: If no employee leave config start date is specified 
                // (this enables employees to have customised start dates for every leave type), use the leave type 
                // start date. If no leave type start date is specified, use the employee employment date.
                $leaveStartDate = $employmentStartDate;
                if( $leaveConfigItems[$configIndex]['employeeLeaveStartDate'] !== null ) {
                    if( $employmentStartDate <= $leaveConfigItems[$configIndex]['employeeLeaveStartDate'] ) {
                        $leaveStartDate = $leaveConfigItems[$configIndex]['employeeLeaveStartDate'];
                    }
                }
                else if( $leaveConfigItems[$configIndex]['leaveTypeStartDate'] !== null ) {
                    if( $employmentStartDate <= $leaveConfigItems[$configIndex]['leaveTypeStartDate'] ) {
                        $leaveStartDate = $leaveConfigItems[$configIndex]['leaveTypeStartDate'];
                    }
                }
                
                // Set the start date for accrual date calculations
                $startDate = new DateTime($leaveStartDate);
                $leaveStartDay = intval($startDate->format('d'));
                
                // Calculate how long the employee has been employed (in months)
                $startTime = strtotime($leaveStartDate);
                $endTime = strtotime($leaveDate);
                if( $employmentEndDate != null && ( $employmentEndDate < $leaveDate ) ) { 
                    $endTime = strtotime($employmentEndDate);
                }
                
                $startYear = date('Y', $startTime);
                $endYear = date('Y', $endTime);
                
                $startMonth = date('m', $startTime);
                $endMonth = date('m', $endTime);
                
                $monthsEmployed = (($endYear - $startYear) * 12) + ($endMonth - $startMonth);
                
                // Get the number of days in the ending date
                $daysInEndMonth = date( 't', $endTime );
                
                // Is the start and end dates in different months?
                if( intval(date('m', $startTime)) != intval(date('m', $endTime)) ) {
                    // Is the start day after the end day (i.e., a full month hasn't passed yet)?
                    if( date('d', $startTime) > date('d', $endTime) ) {
                        $monthsEmployed = $monthsEmployed - 1;
                        // Is the end day on the last day of the ending month and the start day greater or
                        // equal to the ending day?
                        if ( (date('d', $endTime) == $daysInEndMonth) && (date('d', $startTime) >= $daysInEndMonth) ) {
                            $monthsEmployed = $monthsEmployed + 1;
                        }
                    }
                }
                
                // Determine the current month of employment
                $employmentMonth = $monthsEmployed + 1;
                
                // Set the end date for accrual calculations to be either today or the day on which
                // employment ended
                $endDate = new DateTime($leaveDate);
                if( $employmentEndDate != null && ( $employmentEndDate < $leaveDate ) ) { 
                    $endDate = new DateTime($employmentEndDate);
                }
                
                // For every rule per leave type
                foreach( $leaveConfigItems[$configIndex]['rules'] AS $leaveConfigItemRule ) {
                    // Skip calculations if the rule has not started yet
                    if( $leaveConfigItemRule['startMonth'] > $employmentMonth ) continue;
                    
                    // Reset hours and days worked and leave earned
                    $hoursWorked = $leaveDetails['hoursWorked'];
                    $daysWorked = $leaveDetails['daysWorked'];
                    $leaveEarned = 0;
                    $earnLeave = false;
                    
                    // Calculations should start on the day on which the rule started (set the day to 1
                    // since PHP doesn't handle month addition well if the day is above 28)
                    $startDate->setDate(
                        intval($startDate->format('Y')), 
                        intval($startDate->format('m')) + ($leaveConfigItemRule['startMonth'] - 1), 
                        1
                    );
                    
                    // Get the number of days in the month of the rule start date
                    $daysInEndMonth = $startDate->format('t');
                    
                    // Did the leave start on a day greater than the number of days of the month on 
                    // which the rule started?
                    if( $leaveStartDay > $daysInEndMonth ) {
                        // Set the start date to the last day of the rule start month
                        $startDate->setDate(
                            intval($startDate->format('Y')), 
                            intval($startDate->format('m')), 
                            $daysInEndMonth
                        );
                    }
                    else {
                        // Set the start date to the leave start day
                        $startDate->setDate(
                            intval($startDate->format('Y')), 
                            intval($startDate->format('m')), 
                            $leaveStartDay
                        );
                    }
                    
                    // Set the default accrual date to the rule start date
                    $accrualDate = new DateTime($startDate->format('Y-m-d'));
                    
                    // Leave accrues on hours worked?
                    if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'HWOR' ) {
                        
                        //
                        // NOTE:
                        //
                        // Currently leave cannot be earned on hours worked via the work schedule, since it takes
                        // too long
                        //
                        
                        // // Is leave being calculated according to the work schedule?
                        // if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                        //     // Get the days and hours worked according to the schedule
                        //     $timeWorked = getLeaveScheduleTimeWorked(
                        //         $employeeId, 
                        //         $leaveConfigItem['leaveTypeId'], 
                        //         $leaveDate, 
                        //         $user, 
                        //         $db 
                        //     );
                        //     $hoursWorked = $timeWorked['hoursWorked'];
                        //     $daysWorked = $timeWorked['daysWorked'];
                            
                        //     // echo( 
                        //     //     'Employee ' . $employeeId . ' for ' .
                        //     //     'type ' . $leaveConfigItem['leaveTypeId'] . '-' . $sqlLeaveTypeRuleRow['leave_type_rule_id'] . ': ' .
                        //     //     $daysWorked . ' % ' . 
                        //     //     $leaveConfigItemRule['accrualInterval'] . ' = ' . 
                        //     //     $daysWorked % $leaveConfigItemRule['accrualInterval'] . '<br>' . PHP_EOL
                        //     // );
                        // }
                        
                        // Calculate the leave amount
                        if( $hoursWorked !== null && $hoursWorked > 0.0000009 ) {
                            // Is leave being earned according to the work schedule?
                            if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                                // // Only earn leave if the hours worked matches the interval
                                // if( ($leaveConfigItemRule['accrualInterval'] > 0) && ($hoursWorked % $leaveConfigItemRule['accrualInterval'] == 0) ) {
                                //     $leaveEarned = $leaveConfigItemRule['amount'];
                                //     $earnLeave = true;
                                // }
                            }
                            else {
                                // Calculate leave amount
                                if( $leaveConfigItemRule['accrualInterval'] > 0 ) {
                                    $leaveEarned = ($hoursWorked / $leaveConfigItemRule['accrualInterval']) * $leaveConfigItemRule['amount'];
                                }
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on days worked?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'DWOR' ) {
                        // Is leave being calculated according to the work schedule?
                        if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                            // Get the days and hours worked according to the schedule
                            $timeWorked = getLeaveScheduleTimeWorked(
                                $employeeId, 
                                $leaveConfigItems[$configIndex]['leaveTypeId'], 
                                $leaveDate, 
                                $user, 
                                $db 
                            );
                            $hoursWorked = $timeWorked['hoursWorked'];
                            $daysWorked = $timeWorked['daysWorked'];
                            $isWorkDay = $timeWorked['isWorkDay'];
                        }
                        
                        // Calculate the leave amount
                        if( $daysWorked !== null && $daysWorked > 0.0000009 ) {
                            // Is leave being earned according to the work schedule?
                            if( $leaveSourceType === 'WSCH' && $workScheduleLeaveEnabled ) {
                                // Only earn leave if the days worked matches the interval
                                if( ($leaveConfigItemRule['accrualInterval'] > 0) && ($daysWorked % $leaveConfigItemRule['accrualInterval'] == 0) ) {
                                    // Leave can only be earned on work days, otherwise leave may be earned multiple times
                                    // for the same amount of days worked
                                    if( $isWorkDay ) {
                                        $leaveEarned = $leaveConfigItemRule['amount'];
                                        $earnLeave = true;
                                    }
                                }
                            }
                            else {
                                // Only calculate daily leave from a different source than the work schedule if the work shedule is 
                                // not enabled for the specified employee
                                if( !$workScheduleLeaveEnabled ) {
                                    // Calculate leave amount
                                    if( $leaveConfigItemRule['accrualInterval'] > 0 ) {
                                        // Leave can only be earned on work days, otherwise leave may be earned multiple times
                                        // for the same amount of days worked
                                        if( $isWorkDay ) {
                                            // Earn daily leave as a percentage of the interval
                                            $leaveEarned = ($daysWorked / $leaveConfigItemRule['accrualInterval']) * $leaveConfigItemRule['amount'];
                                        }
                                    }
                                    $earnLeave = true;
                                }
                            }
                        }
                    }
                    // Leave accrues on payslip?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'PAYS' ) {
                        // Is the leave source a payslip and has it not been calculated yet?
                        if( ($leaveSourceType === 'PAYS') && (!$payslipLeaveAccrued) ) {
                            // Get the number of payslips issued for the specified employee
                            $sqlQuery = 
                                'SELECT ' .
                                    'COUNT(payslips.id) AS payslip_count ' .
                                'FROM ' .
                                    'payruns ' .
                                'LEFT JOIN ' .
                                    'payslips ON payslips.payrun_id = payruns.id ' .
                                'WHERE ' .
                                    'payruns.processed_on IS NOT NULL AND ' .
                                    'payslips.status_code = \'ACTI\' AND ' .
                                    'payslips.employee_id = $1;';
                            $sqlResult = $db->paramQuery($sqlQuery, [$employeeId]);
                            if( !$sqlResult->isValid() ) {
                                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                                return false;
                            }
                            $sqlRow = $sqlResult->fetchAssociative();
                            $numPayslips = $sqlRow['payslip_count'];
                            
                            // Do the number of payslips correspond to the accrual interval (we are assuming that the payrun of 
                            // which the source payslip is part has already been processed)?
                            if( ($leaveConfigItemRule['accrualInterval'] > 0) && ($numPayslips % $leaveConfigItemRule['accrualInterval']) === 0 ) {
                                $payslipLeaveAccrued = true;
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on day cycle start?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'DCST' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Set the start and end time for accrual date calculation
                            $startTime = strtotime($startDate->format('Y-m-d'));
                            $endTime = strtotime($endDate->format('Y-m-d'));
                            
                            // Divide the difference into total number of seconds to get number of days 
                            $daysDiff = ($endTime - $startTime) / 60 / 60 / 24;
                            
                            // Calculate the number of days for completed cycles
                            $numDays = floor( $daysDiff / $leaveConfigItemRule['accrualInterval'] ) * $leaveConfigItemRule['accrualInterval'];
                            
                            // Add the number of days for completed cycles to the rule start date to 
                            // calculate the accrual date
                            $accrualDate = date('Y-m-d', strtotime($startDate->format('Y-m-d') . ' + ' . $numDays . ' days'));
                            
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on day cycle end?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'DCEN' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Set the start and end time for accrual date calculation
                            $startTime = strtotime($startDate->format('Y-m-d'));
                            $endTime = strtotime($endDate->format('Y-m-d'));
                            
                            // Divide the difference into total number of seconds to get number of days 
                            $daysDiff = ($endTime - $startTime) / 60 / 60 / 24;
                            
                            // Calculate the number of days for completed cycles
                            $numDays = floor( $daysDiff / $leaveConfigItemRule['accrualInterval'] ) * $leaveConfigItemRule['accrualInterval'];
                            
                            // Add another cycle of days and subtract one since accrual takes place on the 
                            // last day of the current cycle
                            $numDays = $numDays + $leaveConfigItemRule['accrualInterval'] - 1;
                            
                            // Add the number of days for completed cycles to the rule start date to 
                            // calculate the accrual date
                            $accrualDate = date('Y-m-d', strtotime($startDate->format('Y-m-d') . ' + ' . $numDays . ' days'));
                            
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on month cycle start?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'MCST' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Calculate the number of completed cycles since the rule started
                            $numCycles = floor( ($monthsEmployed - $leaveConfigItemRule['startMonth'] + 1) / $leaveConfigItemRule['accrualInterval'] );
                            
                            // Set the accrual month to the first day of the month on the last completed cycle
                            // (we do this because PHP has trouble adding months after the 28th day)
                            $accrualDate = new DateTime($startDate->format('Y-m-d'));
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')) + ($numCycles * $leaveConfigItemRule['accrualInterval']), 
                                1
                            );
                            
                            // Get the number of days in the ending month
                            $daysInEndMonth = $endDate->format('t');
                            
                            // Did leave start on a day greater than the number of days in the ending month?
                            if( $leaveStartDay > $daysInEndMonth ) {
                                // Set the accrual date to the last day of the ending month
                                $accrualDate->setDate(
                                    intval($accrualDate->format('Y')), 
                                    intval($accrualDate->format('m')), 
                                    $daysInEndMonth
                                );
                            }
                            else {
                                // Set the accrual date to the relevant day of the starting month
                                $accrualDate->setDate(
                                    intval($accrualDate->format('Y')), 
                                    intval($accrualDate->format('m')), 
                                    $leaveStartDay
                                );
                            }
                            
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on month cycle end?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'MCEN' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Calculate the number of completed cycles since the rule date and add
                            // one because the leave accrues at the end of the cycle
                            $numCycles = floor( ($monthsEmployed - $leaveConfigItemRule['startMonth'] + 1) / $leaveConfigItemRule['accrualInterval'] ) + 1;
                            
                            // Set the accrual month to the first day of the month on the last completed cycle
                            // (we do this because PHP has trouble adding months after the 28th day)
                            $accrualDate = new DateTime($startDate->format('Y-m-d'));
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')), 
                                intval($accrualDate->format('m')) + ($numCycles * $leaveConfigItemRule['accrualInterval']), 
                                1
                            );
                            
                            // Get the number of days in the ending month
                            $daysInEndMonth = $endDate->format('t');
                            
                            // Did the leave start on a day greater than the number of days in the ending month?
                            if( $leaveStartDay > $daysInEndMonth ) {
                                // Set the accrual date to the day before the last day of the ending month
                                // (i.e., the last day of the previous cycle)
                                $accrualDate->setDate(
                                    intval($accrualDate->format('Y')), 
                                    intval($accrualDate->format('m')), 
                                    $daysInEndMonth - 1
                                );
                            }
                            else {
                                // Set the accrual date to the day before the relevant day of the starting month
                                // (i.e., the last day of the previous cycle)
                                $accrualDate->setDate(
                                    intval($accrualDate->format('Y')), 
                                    intval($accrualDate->format('m')), 
                                    $leaveStartDay - 1
                                );
                            }
                            
// file_put_contents('php://stderr', print_r(
//     'Employee ' . $employeeId . ' for ' .
//     'type ' . $leaveResult[$leaveTypeIndex]['id'] . '-' . $leaveResult[$leaveTypeIndex]['name'] . ': ' .
//     'start_month: ' . $leaveConfigItemRule['startMonth'] . ' > ' . '$employmentMonth: ' . $employmentMonth . '? ' .
//     'startDate' . ' == ' . $startDate->format('Y-m-d') . ': ' . 
//     $leaveDate . ' == ' . $accrualDate->format('Y-m-d') .
//     '? (' . $leaveConfigItemRule['amount'] . ')'. "\n",
//     TRUE)
// );
                            
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on year cycle start?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'YCST' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Calculate the difference between start date and end date
                            $interval = date_diff($startDate, $endDate); 
                            
                            // Calculate the number of years employed
                            $yearsEmployed = intval($interval->format('%y'));
                            
                            // Calculate the number of completed cycles since the rule date
                            $numCycles = floor( $yearsEmployed  / $leaveConfigItemRule['accrualInterval'] );
                            
                            // Calculate the number of years for the completed cycles
                            $numYears = $numCycles * $leaveConfigItemRule['accrualInterval'];
                            
                            // Set the accrual year to the rule start year plus the number of years
                            // of the completed cycles
                            $accrualDate = new DateTime($startDate->format('Y-m-d'));
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')) + $numYears, 
                                intval($accrualDate->format('m')), 
                                intval($accrualDate->format('d'))
                            );
                            
// file_put_contents('php://stderr', print_r(
//     'Employee ' . $employeeId . ' for ' .
//     'type ' . $leaveResult[$leaveTypeIndex]['id'] . '-' . $leaveResult[$leaveTypeIndex]['name'] . ': ' .
//     'start_month: ' . $leaveConfigItemRule['startMonth'] . ' > ' . '$employmentMonth: ' . $employmentMonth . '? ' .
//     'startDate' . ' == ' . $startDate->format('Y-m-d') . ': ' . 
//     $leaveDate . ' == ' . $accrualDate->format('Y-m-d') .
//     '? (' . $leaveConfigItemRule['amount'] . ')'. "\n",
//     TRUE)
// );
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    // Leave accrues on year cycle end?
                    else if( $leaveConfigItemRule['leaveAccrualTypeCode'] === 'YCEN' ) {
                        // Is the leave source NOT a payslip?
                        if( $leaveSourceType !== 'PAYS' ) {
                            // Calculate the difference between start date and end date
                            $interval = date_diff($startDate, $endDate); 
                            
                            // Calculate the number of years employed
                            $yearsEmployed = intval($interval->format('%y'));
                            
                            // Calculate the number of completed cycles since the rule date
                            $numCycles = floor( $yearsEmployed  / $leaveConfigItemRule['accrualInterval'] );
                            
                            // Calculate the number of years for the completed cycles (add one because accrual takes place on the 
                            // last day of the cycle)
                            $numYears = ($numCycles + 1) * $leaveConfigItemRule['accrualInterval'];
                            
                            // Set the accrual year to the rule start year plus the number of years of the completed cycles plus 
                            // one, and adjust the day to fall on the last day of the current cycle
                            $accrualDate = new DateTime($startDate->format('Y-m-d'));
                            $accrualDate->setDate(
                                intval($accrualDate->format('Y')) + $numYears, 
                                intval($accrualDate->format('m')), 
                                intval($accrualDate->format('d')) - 1
                            );
                            
                            // Should accrual occur?
                            if( $leaveDate == $accrualDate->format('Y-m-d') ) {
                                $leaveEarned = $leaveConfigItemRule['amount'];
                                $earnLeave = true;
                            }
                        }
                    }
                    else {
                        $leaveEarned = 0;
                        $earnLeave = false;
                    }
                    
                    // Should leave be earned or adjusted? 
                    if( $earnLeave && ($leaveSourceType !== null) ) {
                        // Should leave accrued be reset?
                        if( ($leaveConfigItemRule['resetAccrued']) && ($leaveConfigItemRule['resetTaken']) ) {
                            // Calculate the amount to be reset as well as the index
                            $resetAmount = 0;
                            for( $leaveIndex = 0; $leaveIndex < count($leaveConfigItems[$configIndex]['leave']);  $leaveIndex++ ) {
                                // Exit if past the end date
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['date'] > $leaveDate ) break;
                                
                                // Calculate the reset amount (balance at the time of reset)
                                $resetAmount += ($leaveConfigItems[$configIndex]['leave'][$leaveIndex]['amount']);
                            }
                            
                            // Was a reset amount found?
                            if( ($resetAmount > 0.0000009) || (($resetAmount * -1) > 0.0000009) ) {
                                // Insert the leave at the specified position
                                array_splice( $leaveConfigItems[$configIndex]['leave'], $leaveIndex, 0, [[
                                    'date' => $leaveDate,
                                    'actionCode' => 'RESE',
                                    'amount' => ($resetAmount * -1)
                                ]]);
                            }
                            
                            // // Reset accrued leave
                            // $sqlQuery =
                            //     'INSERT INTO ' .
                            //         'leave ( ' .
                            //             'leave_action_code, ' .
                            //             'description, ' .
                            //             'hours, ' .
                            //             'days, ' .
                            //             'date, ' .
                            //             'leave_type_id, ' .
                            //             'employee_id, ' .
                            //             'leave_source_type_code, ' .
                            //             'payslip_id, ' .
                            //             'process_time, ' .
                            //             'added_by_user_id ' .
                            //         ') ' .
                            //     'VALUES ( ' .
                            //         '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            //     ');';
                            // $sqlResult = $db->paramQuery($sqlQuery, [
                            //     'RESE',                                     // leave_action_code
                            //     'Reset Leave Accrued',                      // description
                            //     $leaveHoursAccrued * -1,                    // hours
                            //     $leaveDaysAccrued * -1,                     // days
                            //     $leaveDate,                                 // date
                            //     $leaveConfigItem['leaveTypeId'],        // leave_type_id
                            //     $employeeId,                                // employee_id
                            //     $leaveSourceType,                           // leave_source_type_code
                            //     $payslipId,                                 // payslip_id
                            //     date('Y-m-d H:i:s'),                        // process_time
                            //     (isset($user['id']) ? $user['id'] : null)   // added_by_user_id
                            // ]);
                            // if( !$sqlResult->isValid() ) {
                            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            //     return false;
                            // }
                            // $leaveEarned = 0;
                        }
                        else if( $leaveConfigItemRule['resetAccrued'] ) {
                            // Calculate the amount to be reset as well as the index
                            $resetAmount = 0;
                            for( $leaveIndex = 0; $leaveIndex < count($leaveConfigItems[$configIndex]['leave']);  $leaveIndex++ ) {
                                // Exit if past the end date
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['date'] > $leaveDate ) break;
                                
                                // Is leave not being taken?
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['actionCode'] !== 'LTAK' ) {
                                    // Calculate the reset amount (balance, excluding leave, at the time of reset)
                                    $resetAmount += ($leaveConfigItems[$configIndex]['leave'][$leaveIndex]['amount']);
                                }
                            }
                            
                            // Was a reset amount found?
                            if( ($resetAmount > 0.0000009) || (($resetAmount * -1) > 0.0000009) ) {
                                // Insert the leave at the specified position
                                array_splice( $leaveConfigItems[$configIndex]['leave'], $leaveIndex, 0, [[
                                    'date' => $leaveDate,
                                    'actionCode' => 'RESE',
                                    'amount' => ($resetAmount * -1)
                                ]]);
                            }
                            
                            // // Reset accrued leave
                            // $sqlQuery =
                            //     'INSERT INTO ' .
                            //         'leave ( ' .
                            //             'leave_action_code, ' .
                            //             'description, ' .
                            //             'hours, ' .
                            //             'days, ' .
                            //             'date, ' .
                            //             'leave_type_id, ' .
                            //             'employee_id, ' .
                            //             'leave_source_type_code, ' .
                            //             'payslip_id, ' .
                            //             'process_time, ' .
                            //             'added_by_user_id ' .
                            //         ') ' .
                            //     'VALUES ( ' .
                            //         '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            //     ');';
                            // $sqlResult = $db->paramQuery($sqlQuery, [
                            //     'RESE',                                     // leave_action_code
                            //     'Reset Leave Accrued',                      // description
                            //     $leaveHoursAccrued * -1,                    // hours
                            //     $leaveDaysAccrued * -1,                     // days
                            //     $leaveDate,                                 // date
                            //     $leaveConfigItem['leaveTypeId'],        // leave_type_id
                            //     $employeeId,                                // employee_id
                            //     $leaveSourceType,                           // leave_source_type_code
                            //     $payslipId,                                 // payslip_id
                            //     date('Y-m-d H:i:s'),                        // process_time
                            //     (isset($user['id']) ? $user['id'] : null)   // added_by_user_id
                            // ]);
                            // if( !$sqlResult->isValid() ) {
                            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            //     return false;
                            // }
                            // $leaveEarned = 0;
                        }
                        else if( $leaveConfigItemRule['resetTaken'] ) {
                            // Calculate the amount to be reset as well as the index
                            $resetAmount = 0;
                            for( $leaveIndex = 0; $leaveIndex < count($leaveConfigItems[$configIndex]['leave']);  $leaveIndex++ ) {
                                // Exit if past the end date
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['date'] > $leaveDate ) break;
                                
                                // Is leave being taken?
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['actionCode'] === 'LTAK' ) {
                                    // Calculate the reset amount (all leave at the time of reset)
                                    $resetAmount += ($leaveConfigItems[$configIndex]['leave'][$leaveIndex]['amount']);
                                }
                            }
                            
                            // Was a reset amount found?
                            if( ($resetAmount > 0.0000009) || (($resetAmount * -1) > 0.0000009) ) {
                                // Insert the leave at the specified position
                                array_splice( $leaveConfigItems[$configIndex]['leave'], $leaveIndex, 0, [[
                                    'date' => $leaveDate,
                                    'actionCode' => 'RESE',
                                    'amount' => ($resetAmount)
                                ]]);
                            }
                            
                            // Reset leave taken
                            // $sqlQuery =
                            //     'INSERT INTO ' .
                            //         'leave ( ' .
                            //             'leave_action_code, ' .
                            //             'description, ' .
                            //             'hours, ' .
                            //             'days, ' .
                            //             'date, ' .
                            //             'leave_type_id, ' .
                            //             'employee_id, ' .
                            //             'leave_source_type_code, ' .
                            //             'payslip_id, ' .
                            //             'process_time, ' .
                            //             'added_by_user_id ' .
                            //         ') ' .
                            //     'VALUES ( ' .
                            //         '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            //     ');';
                            // $sqlResult = $db->paramQuery($sqlQuery, [
                            //     'RESE',                                     // leave_action_code
                            //     'Reset Leave Taken',                        // description
                            //     $leaveHoursTaken,                           // hours
                            //     $leaveDaysTaken,                            // days
                            //     $leaveDate,                                 // date
                            //     $leaveConfigItem['leaveTypeId'],        // leave_type_id
                            //     $employeeId,                                // employee_id
                            //     $leaveSourceType,                           // leave_source_type_code
                            //     $payslipId,                                 // payslip_id
                            //     date('Y-m-d H:i:s'),                        // process_time
                            //     $user['id']                                 // added_by_user_id
                            // ]);
                            // if( !$sqlResult->isValid() ) {
                            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            //     return false;
                            // }
                            // $leaveTaken = 0;
                        }
                        
                        // Should leave taken be reset or leave accrued be reset?
                        if( $leaveConfigItemRule['resetAccrued'] || $leaveConfigItemRule['resetTaken'] ) {
                        }
                        
                        // Process leave if leave was earned
                        if( $earnLeave && $leaveEarned > 0.0000009 ) {
// file_put_contents('php://stderr', print_r(("\n" . 'Earn Leave for: ' . $leaveConfigItems[$configIndex]['leaveTypeName'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r($leaveConfigItems[$configIndex]['leave'], TRUE));
                            // Calculate the index
                            for( $leaveIndex = 0; $leaveIndex < count($leaveConfigItems[$configIndex]['leave']);  $leaveIndex++ ) {
// file_put_contents('php://stderr', print_r(("\n" . 'Earn Leave #' .  $leaveIndex . ': date: ' . $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['date'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Earn Leave #' .  $leaveIndex . ': actionCode: ' . $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['actionCode'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Earn Leave #' .  $leaveIndex . ': amount: ' . $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['amount'] . "\n"), TRUE));
                                // Exit if past the end date
                                if( $leaveConfigItems[$configIndex]['leave'][$leaveIndex]['date'] > $leaveDate ) break;
                            }
                            
                            // Insert the leave at the specified position
                            array_splice( $leaveConfigItems[$configIndex]['leave'], $leaveIndex, 0, [[
                                'date' => $leaveDate,
                                'actionCode' => 'LEAR',
                                'amount' => ($leaveEarned)
                            ]]);
                            
                            // // Save the amount of leave earned
                            // $days = 0;
                            // $hours = 0;
                            // if( $leaveConfigItems[$configIndex]['leaveUnitCode'] === 'DAYS' ) {
                            //     $days = $leaveEarned;
                            // }
                            // else {
                            //     $hours = $leaveEarned;
                            // }
                            
                            // $sqlQuery =
                            //     'INSERT INTO ' .
                            //         'leave ( ' .
                            //             'leave_action_code, ' .
                            //             'description, ' .
                            //             'hours, ' .
                            //             'days, ' .
                            //             'date, ' .
                            //             'leave_type_id, ' .
                            //             'employee_id, ' .
                            //             'leave_source_type_code, ' .
                            //             'payslip_id, ' .
                            //             'process_time, ' .
                            //             'added_by_user_id ' .
                            //         ') ' .
                            //     'VALUES ( ' .
                            //         '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 ' .
                            //     ');';
                            // $sqlResult = $db->paramQuery($sqlQuery, [
                            //     'LEAR',                                     // leave_action_code
                            //     'Leave Earned',                             // description
                            //     $hours,                                     // hours
                            //     $days,                                      // days
                            //     $leaveDate,                                 // date
                            //     $leaveConfigItem['leaveTypeId'],        // leave_type_id
                            //     $employeeId,                                // employee_id
                            //     $leaveSourceType,                           // leave_source_type_code
                            //     $payslipId,                                 // payslip_id
                            //     date('Y-m-d H:i:s'),                        // process_time
                            //     (isset($user['id']) ? $user['id'] : null)   // added_by_user_id
                            // ]);
                            // if( !$sqlResult->isValid() ) {
                            //     echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            //     return false;
                            // }
                        }
                        
                        
                        // Remember the months employed
                        $leaveConfigItems[$configIndex]['monthsEmployed'] = $monthsEmployed;
                        
                        // Reset all the calculated balances
                        $leaveEarned = $leaveAdjusted = $leaveTaken = 0;
                    }
                    
                    // Only one rule should be applied per leave type
                    break;
                }
            }
        }
        
        // For every leave config item for the specified employee
        $leaveResult = [];
        for( $configIndex = 0; $configIndex < count($leaveConfigItems); $configIndex++ ) {
// file_put_contents('php://stderr', print_r(("\n" . 'Final Leave for: ' . $leaveConfigItems[$configIndex]['leaveTypeName'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r($leaveConfigItems[$configIndex]['leave'], TRUE));
            // // Try to find the specified leave type in the results
            // $leaveTypeIndex = -1;
            // for( $resultIndex = 0; $resultIndex < count($leaveResult); $resultIndex++ ) {
            //     if( $leaveResult[$resultIndex]['id'] == $leaveConfigItems[$configIndex]['leaveTypeId'] ) {
            //         $leaveTypeIndex = $resultIndex;
            //         break;
            //     }
            // }
            
            // // Was no leave type found?
            // if( $leaveTypeIndex < 0 ) {
                // Calculate the leave totals and balances
                $leaveEarned = 0;
                $leaveAdjusted = 0;
                $leaveTaken = 0;
                $leaveBalance = 0;
                foreach( $leaveConfigItems[$configIndex]['leave'] AS $leave ) {
                    // Exit if past the end date
                    if( $leave['date'] > $toDate ) break;
                    
                    // Is the leave in the payslip period
                    if( $leave['date'] >= $leaveDetails['fromDate'] ) {
                        if( $leave['actionCode'] === 'LEAR' ) {
                            $leaveEarned += ($leave['amount']);
                        }
                        else if( $leave['actionCode'] === 'LTAK' ) {
                            $leaveTaken += ($leave['amount'] * -1);
                        }
                        else if( $leave['actionCode'] === 'ADJU' ) {
                            $leaveAdjusted += ($leave['amount']);
                        }
                    }
                    
                    // Calculate the leave balance
                    $leaveBalance += ($leave['amount']);
                }
                
                // Adjust the leave earned to make provision for resets in the same month as leave is earned
                if( ($leaveEarned + $leaveAdjusted - $leaveTaken) > ($leaveBalance) ) {
                    $leaveEarned = ($leaveBalance + $leaveAdjusted - $leaveTaken);
                }
                
                // Add the leave type details
                $leaveResult[] = [
                    'id' => $leaveConfigItems[$configIndex]['leaveTypeId'],
                    'name' => $leaveConfigItems[$configIndex]['leaveTypeName'],
                    'monthsEmployed' => $leaveConfigItems[$configIndex]['monthsEmployed'],
                    'unit' => $leaveConfigItems[$configIndex]['leaveUnitCode'],
                    'leaveAdjusted' => $leaveAdjusted, 
                    'leaveEarned' => $leaveEarned,
                    'leaveTaken' => $leaveTaken,
                    'leaveAvailable' => $leaveBalance
                ];
                // $leaveTypeIndex = count($leaveResult) - 1;
// file_put_contents('php://stderr', print_r(("\n" . 'Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveAdjusted: ' . $leaveConfigItems[$configIndex]['leaveAdjusted'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveEarned: ' . $leaveConfigItems[$configIndex]['leaveEarned'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): ' . ' leaveTaken: ' . $leaveConfigItems[$configIndex]['leaveTaken'] . "\n"), TRUE));
// file_put_contents('php://stderr', print_r(('Initial ' .  $leaveResult[$leaveTypeIndex]['name'] . ' (' . $leaveResult[$leaveTypeIndex]['id'] . '): '  . ' leaveAvailable: ' . $leaveResult[$leaveTypeIndex]['leaveAvailable'] . "\n"), TRUE));
            // }
        }
        
// file_put_contents('php://stderr', print_r($leaveResult, TRUE));
        return $leaveResult;
    }
    
    // Function to return the number of working days between two dates (excluding holidays)
    //
    // Required Parameters
    //   $startDate             The start date (Format: CCYY-MM-DD)
    //   $endDate               The end date (Format: CCYY-MM-DD)
    //   $holidays              An array of dates for holidays (Format: CCYY-MM-DD)
    //
    // Optional Parameters
    //  None
    function getWorkingDays($startDate, $endDate, $holidays) {
        // Convert the date strings to time
        $endDate = strtotime($endDate);
        $startDate = strtotime($startDate);
        
        // The total number of days between the two dates. We compute the no. of seconds and divide it to 60*60*24
        // We add one to inlude both dates in the interval.
        $days = ($endDate - $startDate) / 86400 + 1;
        
        $noFullWeeks = floor($days / 7);
        $noRemainingDays = fmod($days, 7);
        
        //It will return 1 if it's Monday,.. ,7 for Sunday
        $firstDayOfWeek = date("N", $startDate);
        $lastDayOfWeek = date("N", $endDate);
        
        // The two can be equal in leap years when february has 29 days, the equal sign is added here
        // In the first case the whole interval is within a week, in the second case the interval falls in two weeks.
        if ($firstDayOfWeek <= $lastDayOfWeek) {
            if ($firstDayOfWeek <= 6 && 6 <= $lastDayOfWeek) $noRemainingDays--;
            if ($firstDayOfWeek <= 7 && 7 <= $lastDayOfWeek) $noRemainingDays--;
        }
        else {
            // The day of the week for start is later than the day of the week for end
            if ($firstDayOfWeek == 7) {
                // If the start date is a Sunday, then we definitely subtract 1 day
                $noRemainingDays--;
                
                if ($lastDayOfWeek == 6) {
                    // If the end date is a Saturday, then we subtract another day
                    $noRemainingDays--;
                }
            }
            else {
                // The start date was a Saturday (or earlier), and the end date was (Mon..Fri)
                // so we skip an entire weekend and subtract 2 days
                $noRemainingDays -= 2;
            }
        }
        
        // The no. of business days is: (number of weeks between the two dates) * (5 working days) + the remainder
        // February in none leap years gave a remainder of 0 but still calculated weekends between first and last day, this is one way to fix it
        $workingDays = $noFullWeeks * 5;
        if ($noRemainingDays > 0 ) {
            $workingDays += $noRemainingDays;
        }
        
        // We subtract the holidays
        foreach($holidays as $holiday){
            $timeStamp = strtotime($holiday);
            //If the holiday doesn't fall in weekend
            if ($startDate <= $timeStamp && $timeStamp <= $endDate && date("N",$timeStamp) != 6 && date("N",$timeStamp) != 7)
                $workingDays--;
        }
        
        return $workingDays;
    }
?>