<?php
    
    // Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('PayslipUtil.php');
    
    //
    // LOAN CONTROLLER CLASS
    //
    
    class Loan extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to get Instalment
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getInstalment($data, $user, $db) {
            
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
                'loanInterestType' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'capitilizationPeriodTypeCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'principalAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'numPayments' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true],
                'annualInterestRate' => ['type' => Json::TYPE_NUMERIC, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            //
            // BUILD QUERY
            //
            
            // Get the employee payment period
            $sqlQuery = 'SELECT employees.payment_period_code FROM employees WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $paymentPeriodCode = $sqlRow['payment_period_code'];
            $interestTypeCode = $data['loanInterestType'];
            $paymentPeriodTypeCode = $sqlRow['payment_period_code'];
            $capitilizationPeriodTypeCode = $data['capitilizationPeriodTypeCode'];
            $principalAmount = $data['principalAmount'];
            $numPayments = $data['numPayments'];
            $annualInterestRate = $data['annualInterestRate'];
            
            // Calculate the loan instalment
            $instalment = \PayslipUtil\calculateLoanInstalment(
                $interestTypeCode,
                $paymentPeriodTypeCode,
                $capitilizationPeriodTypeCode,
                $principalAmount,
                $numPayments,
                $annualInterestRate
            );
            
            // Send result
            echo( json_encode(['ok' => true, 'instalment' => $instalment]) );
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
                'employeeId' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
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
                    ' OR loans.description ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
            }
            
            if (isset($data['employeeId'])) {
                if ($data['employeeId'] !== null) {
                    if ($whereClause === '') {
                        $sqlParams[] = $data['employeeId'];
                        $whereClause = 'WHERE employees.id = $'. count($sqlParams);
                    }
                    else {
                        $sqlParams[] = $data['employeeId'];
                        $whereClause = $whereClause . 'AND employees.id = $'. count($sqlParams);
                    }
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
            
            // Load all loans
            $sqlQuery = 
                'WITH payment_details AS ( ' .
                    'SELECT DISTINCT ' .
                        'loan_payments.loan_id, ' .
                        'SUM(loan_payments.paid_amount - loan_payments.interest_amount) AS total_paid ' .
                    'FROM ' .
                        'loan_payments ' .
                    'LEFT JOIN ' .
                        'payslip_items ON payslip_items.id = loan_payments.payslip_item_id ' .
                    'LEFT JOIN ' .
                        'payslips ON payslips.id = payslip_items.payslip_id ' .
                    'LEFT JOIN ' .
                        'payruns ON payruns.id = payslips.payrun_id ' .
                    'WHERE ' .
                        'payruns.processed_on IS NOT NULL OR loan_payments.payslip_item_id IS NULL ' .
                    'GROUP BY loan_payments.loan_id ' . 
                ') ' .
                'SELECT ' .
                    'loans.id, ' . 
                    'loans.employee_id, ' . 
                    'loans.description, ' .
                    'loans.principal_amount, ' . 
                    'loans.adjust_loan_amount, ' .
                    'loans.start_date, ' . 
                    'loans.fully_paid_on, ' . 
                    'loans.cancelled_on, ' .
                    'loans.cancelled_by_user_id, ' . 
                    'loans.created_on, ' .
                    'loans.created_by_user_id, ' .
                    'loans.loan_status_type_code, ' . 
                    'loan_status_types.name AS loan_status_name, ' .
                    'loan_interest_type_code, ' . 
                    'loan_interest_types.name AS loan_interest_type_name, ' .
                    'loans.calculate_taxable_benefit, ' . 
                    'employees.alias, ' . 
                    'employees.last_name, ' . 
                    'employees.code AS employee_code, ' .
                    'employees.email_address, ' .
                    'loan_history.interest_rate, ' .
                    'COALESCE((loans.principal_amount - payment_details.total_paid), loans.principal_amount) AS balance ' .
                'FROM ' .
                    'loans ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = loans.employee_id ' .
                'LEFT JOIN ' .
                    'loan_status_types ON loan_status_types.code = loans.loan_status_type_code ' .
                'LEFT JOIN ' .
                    'loan_history ON loan_history.loan_id = loans.id AND loan_history.id IN ' .
                    '(SELECT id FROM loan_history WHERE loan_id = loans.id ORDER BY id DESC LIMIT 1)' .
                'LEFT JOIN ' .
                    'loan_interest_types ON loan_interest_types.code = loans.loan_interest_type_code ' .
                'LEFT JOIN ' .
                    'payment_details ON payment_details.loan_id = loans.id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'employees.alias ' . $data['sortOrder'] . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create loans array
            $loans = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $loans[] = [
                    'id' => $sqlRow['id'],
                    'employeeId' => $sqlRow['employee_id'],
                    'description' => $sqlRow['description'],
                    'principalAmount' => $sqlRow['principal_amount'],
                    'adjustLoanAmount' => $sqlRow['adjust_loan_amount'],
                    'startDate' => $sqlRow['start_date'],
                    'fullyPaidOn' => $sqlRow['fully_paid_on'],
                    'cancelledOn' => $sqlRow['cancelled_on'],
                    'cancelledByUserId' => $sqlRow['cancelled_by_user_id'],
                    'createdOn' => $sqlRow['created_on'],
                    'createdByUserId' => $sqlRow['created_by_user_id'],
                    'loanStatusCode' => $sqlRow['loan_status_type_code'],
                    'loanStatusName' => $sqlRow['loan_status_name'],
                    'loanInterestTypeCode' => $sqlRow['loan_interest_type_code'],
                    'loanInterestTypeName' => $sqlRow['loan_interest_type_name'],
                    'calculateTaxableBenefit' => $sqlRow['calculate_taxable_benefit'],
                    'alias' => $sqlRow['alias'],
                    'lastName' => $sqlRow['last_name'],
                    'employeeCode' => $sqlRow['employee_code'],
                    'emailAddress' => $sqlRow['email_address'],
                    'interestRate' => $sqlRow['interest_rate'],
                    'balance' => $sqlRow['balance']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'loans' => $loans ]) );
            return true;
        }
        
        // Function to get all the details of the specified loan
        //
        // Required Parameters
        //  loanId              The id of the loan whose details to get
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
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get only the loan payments from processed payruns (or manula payments)
            $sqlQuery = 
                'SELECT DISTINCT ' .
                    'loan_payments.id, ' . 
                    'loan_payments.loan_id, ' . 
                    'loan_payments.interest_rate, ' . 
                    'loan_payments.interest_amount, ' . 
                    'loan_payments.paid_amount, ' . 
                    'loan_payments.paid_on, ' . 
                    'loan_payments.payslip_item_id, ' . 
                    'loan_payments.added_by_user_id ' .
                'FROM ' .
                    'loan_payments ' .
                'LEFT JOIN ' .
                    'payslip_items ON payslip_items.id = loan_payments.payslip_item_id ' .
                'LEFT JOIN ' .
                    'payslips ON payslips.id = payslip_items.payslip_id ' .
                'LEFT JOIN ' .
                    'payruns ON payruns.id = payslips.payrun_id ' .
                'WHERE ' .
                    '(payruns.processed_on IS NOT NULL OR loan_payments.payslip_item_id IS NULL) AND ' .
                    'loan_id = $1 ' .
                'ORDER BY id ASC ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create payments array
            $payments = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $payments[] = [
                    'id' => $sqlRow['id'],
                    'loanId' => $sqlRow['loan_id'],
                    'interestRate' => $sqlRow['interest_rate'],
                    'interestAmount' => $sqlRow['interest_amount'],
                    'paidAmount' => $sqlRow['paid_amount'],
                    'paidOn' => $sqlRow['paid_on'],
                    'payslipItemId' => $sqlRow['payslip_item_id'],
                    'addedByUserId' => $sqlRow['added_by_user_id']
                ];
            }
            
            // Get loan details
            $sqlQuery = 
                'SELECT ' .
                    'loans.id, ' . 
                    'loans.employee_id, ' . 
                    'loans.description, ' .
                    'loans.principal_amount, ' . 
                    'loans.adjust_loan_amount, ' .
                    'loans.start_date, ' . 
                    'loans.fully_paid_on, ' . 
                    'loans.cancelled_on, ' .
                    'loans.cancelled_by_user_id, ' . 
                    'loans.created_on, ' .
                    'loans.created_by_user_id, ' .
                    'loans.loan_status_type_code, ' . 
                    'loan_status_types.name AS loan_status_name, ' .
                    'loan_interest_type_code, ' . 
                    'loan_interest_types.name AS loan_interest_type_name, ' .
                    'loans.calculate_taxable_benefit, ' . 
                    'employees.alias, ' . 
                    'employees.last_name, ' . 
                    'employees.code AS employee_code, ' .
                    'employees.email_address, ' .
                    'loan_history.instalment_amount, ' . 
                    'loan_history.interest_rate, ' . 
                    'loan_history.total_payments, ' .
                    'loan_capitalization_period_type_code, ' .
                    'loan_capitalization_period_types.name AS loan_capitalization_period_type_name, ' .
                    'capitalization_day ' .
                'FROM ' .
                    'loans ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = loans.employee_id ' .
                'LEFT JOIN ' .
                    'loan_status_types ON loan_status_types.code = loans.loan_status_type_code ' .
                'LEFT JOIN ' .
                    'loan_history ON loan_history.loan_id = loans.id AND loan_history.id IN (SELECT id FROM loan_history WHERE loan_id = loans.id ORDER BY id DESC LIMIT 1)' .
                'LEFT JOIN ' .
                    'loan_interest_types ON loan_interest_types.code = loans.loan_interest_type_code ' .
                'LEFT JOIN ' .
                    'loan_capitalization_period_types ON loan_capitalization_period_type_code = loan_capitalization_period_types.code ' .
                'WHERE loans.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['loanId']
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) { 
                echo( json_encode(['ok' => false, 'error' => 'The specified loan could not be found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $loan = [
                'id' => $sqlRow['id'],
                'employeeId' => $sqlRow['employee_id'],
                'description' => $sqlRow['description'],
                'principalAmount' => $sqlRow['principal_amount'],
                'instalmentAmount' => $sqlRow['instalment_amount'],
                'adjustLoanAmount' => $sqlRow['adjust_loan_amount'],
                'startDate' => $sqlRow['start_date'],
                'fullyPaidOn' => $sqlRow['fully_paid_on'],
                'cancelledOn' => $sqlRow['cancelled_on'],
                'cancelledByUserId' => $sqlRow['cancelled_by_user_id'],
                'createdOn' => $sqlRow['created_on'],
                'createdByUserId' => $sqlRow['created_by_user_id'],
                'loanStatusCode' => $sqlRow['loan_status_type_code'],
                'loanStatusName' => $sqlRow['loan_status_name'],
                'loanInterestTypeCode' => $sqlRow['loan_interest_type_code'],
                'loanInterestTypeName' => $sqlRow['loan_interest_type_name'],
                'calculateTaxableBenefit' => $sqlRow['calculate_taxable_benefit'],
                'alias' => $sqlRow['alias'],
                'lastName' => $sqlRow['last_name'],
                'employeeCode' => $sqlRow['employee_code'],
                'emailAddress' => $sqlRow['email_address'],
                'interestRate' => $sqlRow['interest_rate'],
                'totalPayments' => $sqlRow['total_payments'],
                'outstandingAamount' => null,
                'outstandingPayments' => null,
                'loanAmortizationInterest' => null,
                'loanAmortizationCapital' => null,
                'loanCapitalizationPeriodTypeCode' => $sqlRow['loan_capitalization_period_type_code'],
                'loanCapitalizationPeriodTypeName' => $sqlRow['loan_capitalization_period_type_name'],
                'capitalizationDay' => $sqlRow['capitalization_day'],
                'payments' => $payments
            ];
            
            // Get the loan payments for all processed payruns as well as the current payrun and any manual payments
            $outstandingAmount = $sqlRow['principal_amount'];
            $outstandingPayments = $sqlRow['total_payments'];
            $sqlQuery = 
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
                    '(payruns.processed_on IS NOT NULL OR loan_payments.payslip_item_id IS NULL) AND ' .
                    'loan_payments.loan_id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['loanId']         // loan_id
            ]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            // Are there any payments on the loan?
            if( $sqlResult->getRowCount() > 0 ) { 
                // Re-calculate the oustanding loan amount and number of payments
                $sqlRow = $sqlResult->fetchAssociative();
                $outstandingAmount = $outstandingAmount - ($sqlRow['total_paid'] - $sqlRow['total_interest']);
                $outstandingPayments = $outstandingPayments - $sqlRow['num_payments'];
            }
            
            // Set the outstanding amount and payments
            $loan['outstandingAmount'] = $outstandingAmount;
            $loan['outstandingPayments'] = $outstandingPayments;
            
            // Get the loan payment amortization details (we use the first payment number since we are 
            // recalculating the loan with the outstanding amount and number of payments)
            $loanAmortization = \PayslipUtil\getLoanPaymentAmortization( 
                1,
                $loan['loanInterestTypeCode'], 
                'MONT', 
                $loan['loanCapitalizationPeriodTypeCode'], 
                $outstandingAmount, 
                1, // $outstandingPayments, 
                $loan['interestRate']
            );
            // $instalmentAmount = $loanAmortization['interest'] + $loanAmortization['capital'];
            $loan['loanAmortizationInterest'] = $loanAmortization['interest'];
            $loan['loanAmortizationCapital'] = $loanAmortization['capital'];
            
            // Send result
            echo( json_encode(['ok' => true, 'loan' => $loan]) );
            return true;
        }
        
        
        // Function to add a payment to a loan
        //
        // Required Parameters
        //  loanId                               Id of the loan
        //  interestRate                         Interest rate of the payment
        //  interestAmount                       Amount of interest
        //  paidAmount                           Amount paid
        //  paidOn                               Date amount was paid on 
        //
        public function addPayment($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                // 'interestRate' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                // 'interestAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'paidOn' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'paidAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO  ' .
                    'loan_payments( ' .
                            'loan_id, interest_rate, interest_amount, paid_amount, paid_on, ' .
                            'payslip_item_id, added_by_user_id ' .
                        ') ' .
                    'VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['loanId'],                             // loan_id
                0, // $data['interestRate'],                       // interest_rate
                0, // $data['interestAmount'],                     // interest_amount
                $data['paidAmount'],                         // paid_amount
                $data['paidOn'],                             // paid_on
                null,                                        // payslip_item_id
                $user['id']                                  // added_by_user_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $loanId = $sqlRow['id'];
            
            /*
                    // Get the loan payments for all processed payruns as well as the current payrun and any manual payments
                    $outstandingAmount = $sqlLoanRow['principal_amount'];
                    $outstandingPayments = $sqlLoanHistoryRow['total_payments'];
                    $sqlLoanPaymentsQuery = 
                        'SELECT ' .
                            'COUNT(CASE WHEN loan_payments.payslip_item_id IS NOT NULL loan_payments.id ELSE NULL END) AS num_payments, ' .
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
            */
            
            echo( json_encode(['ok' => true, 'loanId' => $loanId]) );
            return true;
        }
        
        
        // Function to update an loan
        //
        // Required Parameters
        //  loanId                      The id of the loan.
        //
        // Optional Parameters
        //  description                 The description of the loan
        //  loanStatusCode              The status code of the loan (ACTI, CANC, or PAID)
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                // 'description' => null,
                // 'loanStatusCode' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'calculateTaxableBenefit' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'loanStatusCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE loans SET ';
            
            if( isset($data['description']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'description = $' . $updateCount;
                $updateValues[] = $data['description'];
            }
            
            if( array_key_exists('calculateTaxableBenefit', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'calculate_taxable_benefit = $' . $updateCount;
                $updateValues[] = $data['calculateTaxableBenefit'];
            }
            
            if( isset($data['loanStatusCode']) ) {
                if( ($data['loanStatusCode'] === 'ACTI') || ($data['loanStatusCode'] === 'CANC') ) {
                    $updateCount++;
                    if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                    $updateQuery = $updateQuery . 'loan_status_type_code = $' . $updateCount;
                    $updateValues[] = $data['loanStatusCode'];
                    
                    if( $data['loanStatusCode'] === 'CANC' ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'cancelled_on = $' . $updateCount;
                        $updateValues[] = date("Y-m-d H:i:s");
                        
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'cancelled_by_user_id = $' . $updateCount;
                        $updateValues[] = $user['id'];
                    }
                    else if( $data['loanStatusCode'] === 'ACTI' ) {
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'cancelled_on = $' . $updateCount;
                        $updateValues[] = null;
                        
                        $updateCount++;
                        if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                        $updateQuery = $updateQuery . 'cancelled_by_user_id = $' . $updateCount;
                        $updateValues[] = null;
                    }
                }
            }
            
            // Only update if at least one value was set
            if( $updateCount > 0 ) {
                $updateCount++;
                $updateValues[] = $data['loanId'];
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount;
                
                $sqlResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        
        // Function to add a loan for a specified employee
        //
        // Required Parameters
        //  employeeId                              The employee that is making the loan
        //  description                             The description of the loan
        //  loanInterestTypeCode                    The interest type
        //  totalPayments                           The total payments to be made
        //  loanCapitalizationPeriodTypeCode        The 
        //  interestRate                            The interest rate of the loan
        //  amount                                  The amount that was borrowed
        //  adjustLoanAmount                        Should the payments or time period be adjusted
        //  startDate                               The start date of the loan
         
        public function add($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'capitalizationDay' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true],
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'loanInterestType' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'interestRate' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'totalPayments' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'principalAmount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => false],
                'startDate' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'capitalizationPeriod' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'calculateTaxableBenefit' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                
                // Optional Parameters
                'capitalizationDay' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant tables
            $db->query('LOCK TABLE loans IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE loan_history IN EXCLUSIVE MODE;');
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO loans( ' .
                    'employee_id, ' .
                    'description, ' .
                    'loan_status_type_code, ' .
                    'loan_interest_type_code,  ' .
                    'principal_amount, ' .
                    'adjust_loan_amount, ' .
                    'start_date, ' .
                    'fully_paid_on, ' .
                    'cancelled_on, ' .
                    'cancelled_by_user_id, ' .
                    'created_on, ' .
                    'created_by_user_id, ' .
                    'calculate_taxable_benefit ' .
                ') ' .
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['employeeId'],                                // employee_id
                $data['description'],                               // description
                'ACTI',                                             // loan_status_type_code
                $data['loanInterestType'],                          // loan_interest_type_code
                $data['principalAmount'],                           // principal_amount
                true,                                               // adjust_loan_amount
                $data['startDate'],                                 // start_date
                null,                                               // fully_paid_on
                null,                                               // cancelled_on
                null,                                               // cancelled_by_user_id
                date("Y-m-d H:i:s"),                                // created_on
                $user['id'],                                        // created_by_user_id
                $data['calculateTaxableBenefit']                    // calculate_taxable_benefit
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $loanId = $sqlRow['id'];
            
            // Load all loans
            $sqlQuery = 
                'SELECT employees.payment_period_code FROM employees WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $paymentPeriodCode = $sqlRow['payment_period_code'];
            
            $interestTypeCode = $data['loanInterestType'];
            $paymentPeriodTypeCode = $sqlRow['payment_period_code'];
            $capitilizationPeriodTypeCode = $data['capitalizationPeriod'];
            $principalAmount = $data['principalAmount'];
            $numPayments = $data['totalPayments'];
            $annualInterestRate = $data['interestRate'];
            
            $instalment = \PayslipUtil\calculateLoanInstalment(
                    $interestTypeCode,
                    $paymentPeriodTypeCode,
                    $capitilizationPeriodTypeCode,
                    $principalAmount,
                    $numPayments,
                    $annualInterestRate
                );
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO loan_history( ' .
                    'loan_id, ' .
                    'total_payments, ' .
                    'interest_rate, ' .
                    'loan_capitalization_period_type_code, ' .
                    'capitalization_day, ' .
                    'added_on, ' .
                    'added_by_user_id, ' .
                    'instalment_amount ' .
                ') ' .
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8); ';
                
            $sqlResult = $db->paramQuery($sqlQuery, [
                $loanId,                                            // loan_id
                $data['totalPayments'],                             // total_payments
                $data['interestRate'],                              // interest_rate
                $data['capitalizationPeriod'],                      // loan_capitalization_period_type_code
                $data['capitalizationDay'],                         // capitalization_day
                date("Y-m-d H:i:s"),                                // added_on
                $user['id'],                                        // added_by_user_id
                $instalment                                         // instalment_amount
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            echo( json_encode(['ok' => true, 'loanId' => $loanId]) );
            return true;
        }
        
        // Function to remove loan
        //
        // Required Parameters
        //  loanId                              The id of the loan to remove
         
        public function checkLoanRemoval($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Remove loans history
            $sqlQuery =
                'SELECT ' .
                    'loan_payments.id AS loan_payment_id, payruns.processed_on ' .
                'FROM ' .
                    'loans ' .
                'LEFT JOIN ' .
                    'loan_payments ON loans.id = loan_payments.loan_id ' .
                'LEFT JOIN ' .
                    'payslip_items ON loan_payments.payslip_item_id = payslip_items.id ' .
                'LEFT JOIN ' .
                    'payslips ON payslip_items.payslip_id = payslips.id ' .
                'LEFT JOIN ' .
                    'payruns ON payslips.payrun_id = payruns.id ' .
                'WHERE loans.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $hasPayments = false;
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                if ($sqlRow['processed_on'] !== null) {
                    echo( json_encode(['ok' => false, 'error' => 'The loan cannot be removed because loan payments have already been processed.']) );
                    return false;
                }
                if($sqlRow['loan_payment_id'] !== null) {
                    $hasPayments = true;
                }
            }
            
            echo( json_encode(['ok' => true, 'hasPayments' => $hasPayments]) );
            return true;
        }
        
        // Function to remove loan
        //
        // Required Parameters
        //  loanId                              The id of the loan to remove
         
        public function removeLoan($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Remove loans payments
            $sqlQuery = 'DELETE FROM loan_payments WHERE loan_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove loans history
            $sqlQuery = 'DELETE FROM loan_history WHERE loan_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Remove loans
            $sqlQuery = 'DELETE FROM loans WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to remove payment
        //
        // Required Parameters
        //  paymentId                              The employee that is making the loan
         
        public function removePayment($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'paymentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => true]
            ]);
            
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to insert the item.
            $sqlQuery = 'DELETE FROM loan_payments WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['paymentId']]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to download a loan agreement in pdf format
        //
        // Required Parameters
        //  loanId                  The id of the loan which agreement to download
        //
        public function downloadAgreement($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the irp5 template
            System::includeFile('loan_agreement_printing/LoanAgreementPrinterDefault.php');
            
            // Create a new loan agreement printer
            $printer = new LoanAgreementPrinter([]);
            $templateConfig = $printer->getConfigParameters();
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create loan agreement template image directory
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] .'/loan_agreement_images/';
            
            // Get saved config details
            $sqlQuery = 
                'SELECT ' .
                    'loan_agreement_templates.id, loan_agreement_template_config.name, loan_agreement_template_config.value ' .
                'FROM ' .
                    'loan_agreement_templates ' .
                'LEFT JOIN ' .
                    'loan_agreement_template_config ON loan_agreement_template_id = loan_agreement_templates.id ' .
                'WHERE ' . 
                    'loan_agreement_templates.name = \'default\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $config = [];
            
            // Create config array
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $skip = false;
                for ($i=0; $i < count($templateConfig); $i++) {
                    if ($sqlRow['name'] === $templateConfig[$i]['name']) {
                        if($templateConfig[$i]['type'] === 'image') {
                            if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                                $config[$sqlRow['name']] = $imageDir . $sqlRow['value'] . '.png';
                            }
                            $skip = true;
                            break;
                        }
                    }
                }
                if(!$skip){
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
            $destDir = CONF_TEMP_DIR . $destDir;
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Get the company details
            $sqlQuery =
                'SELECT ' .
                    'company_details.name, ' .
                    'company_details.registration_number ' .
                'FROM ' .
                    'company_details;';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Were the company details found?
            $companyName = '';
            $companyRegistrationNumber = '';
            $companyRepresentative = '';
            $companyRepresentativeIdNumber = '';
            if( $sqlResult->getRowCount() === 1 ) {
                $sqlRow = $sqlResult->fetchAssociative();
                $companyName = $sqlRow['name'];
                $companyRegistrationNumber = $sqlRow['registration_number'];
            }
            
            // Get the loan agreement details
            $sqlQuery =
                'SELECT ' .
                    'employees.full_names, ' .
                    'employees.last_name, ' .
                    'employees.id_number, ' .
                    'employees.payment_period_code, ' .
                    'payment_period_types.name AS payment_period_name, ' .
                    'loans.loan_interest_type_code, ' .
                    'loans.principal_amount ' .
                'FROM ' .
                    'loans ' .
                'LEFT JOIN ' .
                    'employees ON employees.id = loans.employee_id ' .
                'LEFT JOIN ' .
                    'payment_period_types ON payment_period_types.code = employees.payment_period_code ' .
                'WHERE ' . 
                    'loans.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Loan not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $employeeFullNames = $sqlRow['full_names'] . ' ' . $sqlRow['last_name'];
            $employeeIdNumber = $sqlRow['id_number'];
            $loanPrincipalAmount = $sqlRow['principal_amount'];
            $loanInstalmentPeriod = strtolower($sqlRow['payment_period_name']);
            
            // Get the loan history
            $sqlQuery = 
                'SELECT ' . 
                    'loan_history.total_payments, ' .
                    'loan_history.interest_rate, ' .
                    'loan_history.instalment_amount, ' .
                    'loan_history.loan_capitalization_period_type_code, ' .
                    'loan_history.capitalization_day ' .
                'FROM ' . 
                    'loan_history ' .
                'WHERE ' . 
                    'loan_history.loan_id = $1 ' .
                'ORDER BY ' . 
                    'loan_history.added_on DESC, loan_history.id DESC ' .
                'LIMIT 1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanId']]);
            if( !$sqlResult->isValid() ) {
                return ['ok' => false, 'error' => 'Database error.'];
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Loan history not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $loanInstalmentAmount = $sqlRow['instalment_amount'];
            
            // Clear previous printer details, if any
            $printer->clear();
            
            // Set config of the pdf
            $printer->setConfig($config);
            
            // Add the all the relevant details to the loan agreement printer
            $printer->setCompanyLogo('');
            $printer->setCompanyName($companyName);
            $printer->setCompanyRegistrationNumber($companyRegistrationNumber);
            $printer->setCompanyRepresentative($companyRepresentative);
            $printer->setCompanyRepresentativeIdNumber($companyRepresentativeIdNumber);
            $printer->setEmployeeFullNames($employeeFullNames);
            $printer->setEmployeeIdNumber($employeeIdNumber);
            $printer->setLoanPrincipalAmount($loanPrincipalAmount);
            $printer->setLoanPaidOverDate('');
            $printer->setLoanInstalmentAmount($loanInstalmentAmount);
            $printer->setLoanInstalmentPeriod($loanInstalmentPeriod);
            
            // Print the loan agreement
            $printer->printLoanAgreement();
            
            // Create a random filename for the irp5
            $filename = '';
            for ($i = 0; $i < 32; $i++) {
                $filename = $filename . $characters[rand(0, $charactersLength - 1)];
            }
            $filename = $filename . '.pdf';
            
            // Erase the output buffer and turn off output buffering
            ob_end_clean();
            
            // Download the file
            $printer->output($filename);
            
            unset($printer);
            
            // Delete the temp folder
            rmdir($destDir);
        }
    }
?>
