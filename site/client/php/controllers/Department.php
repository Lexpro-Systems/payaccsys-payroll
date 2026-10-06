<?php

//Make sure that this file was not accessed directly
System::denyDirectAccess();

// Includes
System::includeFile('Util.php');


//
// DEPARTMENT CONTROLLER CLASS
//

class Department extends Controller
{

    //
    // PROTECTED MEMBER VARIABLES
    //

    protected $csrfWhitelist = [];
    protected $authenticationWhitelist = [];


    //
    // PUBLIC FUNCTIONS
    //


    // Function to list department departments
    //
    // Required Parameters
    //  None
    //
    // Optional Parameters
    //  searchString            A string value that is used to filter the result 
    //  limit                   The maximum number of rows to return
    //  offset                  The offeset value of the result
    //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
    public function getList($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [
            'searchString' => '',
            'limit' => null,
            'offset' => null,
            'sortOrder' => 'ASC',
            'departmentName' => ''
        ];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Optional parameters
            'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
            'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
            'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
            'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
            'departmentName' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }


        //
        // BUILD QUERY
        //

        $sqlParams = [];

        // Build where clause if a search string was given
        $whereClause = '';
        if (isset($data['searchString']) && $data['searchString'] !== '') {
            $sqlParams[] = $data['searchString'];
            $whereClause = $whereClause . ' WHERE (departments.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
        }

        // Check that sort order given is valid
        if ($data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC') {
            echo (json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
            return false;
        }

        // Process limit offset
        $limitOffset = '';
        if ($data['limit'] !== null) {
            $sqlParams[] = $data['limit'];
            $limitOffset = $limitOffset . 'LIMIT $' . count($sqlParams) . ' ';
        }

        // Add offset if given
        if ($data['offset'] !== null) {
            $sqlParams[] = $data['offset'];
            $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
        }

        // Load all departments from the departments table
        $sqlQuery =
            'SELECT ' .
            'departments.id, ' .
            'departments.name ' .
            'FROM ' .
            'departments ' .
            $whereClause . ' ' .
            'ORDER BY ' .
            'departments.name ' . $data['sortOrder'] . ' ' .
            $limitOffset;
        $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Create departments array
        $departments = [];
        while ($sqlRow = $sqlResult->fetchAssociative()) {
            $departments[] = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name']
            ];
        }

        // Send result
        echo (json_encode([
            'ok' => true,
            'departments' => $departments
        ]));

        return true;
    }

    // Function to add an department
    //
    // Required Parameters
    //  departmentName          The name of the department to add
    //
    // Optional Parameters
    //  None
    public function add($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'departmentName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]

            // Optional parameters
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Start SQL transaction
        $db->startTransaction();

        // Lock the relevant table(s)
        $db->query('LOCK TABLE departments IN EXCLUSIVE MODE;');

        // Make certain there isn't already a department with the specified name
        $sqlQuery = 'SELECT id FROM departments WHERE name = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['departmentName']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        if ($sqlResult->getRowCount() >= 1) {
            echo (json_encode(['ok' => false, 'error' => 'A department with the name \'' . $data['departmentName'] . '\' already exists.']));
            return false;
        }

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
        $sqlResult = $db->paramQuery($sqlQuery, [
            $data['departmentName']     // name
        ]);

        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        $sqlRow = $sqlResult->fetchAssociative();
        $departmentId = $sqlRow['id'];

        // Commit SQL transaction
        $db->commitTransaction();

        echo (json_encode(['ok' => true, 'departmentId' => $departmentId]));

        return true;
    }

    // Function to remove the specified department
    //
    // Required Parameters
    //  departmentId        The id of the department to delete
    //
    // Optional Parameters
    //  None
    public function remove($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Remove the specified department from the departments table
        $sqlQuery = 'UPDATE employees SET department_id = NULL WHERE department_id = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['departmentId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Delete the specified department
        $sqlQuery = 'DELETE FROM departments WHERE id = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['departmentId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        echo (json_encode(['ok' => true]));
        return true;
    }

    // Function to get all the details of the specified department
    //
    // Required Parameters
    //  departmentId              The id of the department whose details to get
    //
    // Optional Parameters
    //  None
    public function get($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }
        // Load the department from the departments table
        $sqlQuery =
            'SELECT ' .
            'departments.name, ' .
            'work_schedules.id AS work_schedule_id, ' .
            'work_schedules.enable_leave, ' .
            'work_schedules.monday_hours, ' .
            'work_schedules.tuesday_hours, ' .
            'work_schedules.wednesday_hours, ' .
            'work_schedules.thursday_hours, ' .
            'work_schedules.friday_hours, ' .
            'work_schedules.saturday_hours, ' .
            'work_schedules.sunday_hours, ' .
            'work_schedules.wd_enable_leave, ' .
            'work_schedules.monday_wd, ' .
            'work_schedules.tuesday_wd, ' .
            'work_schedules.wednesday_wd, ' .
            'work_schedules.thursday_wd, ' .
            'work_schedules.friday_wd, ' .
            'work_schedules.saturday_wd, ' .
            'work_schedules.sunday_wd ' .
            'FROM ' .
            'departments ' .
            'LEFT JOIN work_schedules ON departments.id = work_schedules.department_id ' .
            'WHERE ' .
            'departments.id = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['departmentId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Check if the department was found
        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Department \'' . $data['departmentId'] . '\' not found.']));
            return false;
        }

        // Create department details
        $sqlRow = $sqlResult->fetchAssociative();

        $department = [
            'name' => $sqlRow['name'],
            'workSchedule' => null,
        ];
        // Add work schedule if available
        if ($sqlRow['work_schedule_id'] !== null) {
            $department['workSchedule'] = [
                'enableLeave' => $sqlRow['enable_leave'],
                'monday' => $sqlRow['monday_hours'],
                'tuesday' => $sqlRow['tuesday_hours'],
                'wednesday' => $sqlRow['wednesday_hours'],
                'thursday' => $sqlRow['thursday_hours'],
                'friday' => $sqlRow['friday_hours'],
                'saturday' => $sqlRow['saturday_hours'],
                'sunday' => $sqlRow['sunday_hours'],
                'wdEnableLeave' => $sqlRow['wd_enable_leave'],
                'mondaywd' => $sqlRow['monday_wd'],
                'tuesdaywd' => $sqlRow['tuesday_wd'],
                'wednesdaywd' => $sqlRow['wednesday_wd'],
                'thursdaywd' => $sqlRow['thursday_wd'],
                'fridaywd' => $sqlRow['friday_wd'],
                'saturdaywd' => $sqlRow['saturday_wd'],
                'sundaywd' => $sqlRow['sunday_wd']
            ];
        }

        // Send result
        echo (json_encode([
            'ok' => true,
            'department' => $department
        ]));

        return true;
    }

    // Function to to update the specified department's details
    //
    // Required Parameters
    //  departmentId                The id of the department whose details to update
    //
    // Optional Parameters
    //  departmentName              The department's name
    public function update($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            // Required parameters
            'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],

            // Optional parameters
            'departmentName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Build the query to update the client
        $updateCount = 0;
        $updateValues = [];
        $updateQuery = 'UPDATE departments SET ';

        if (isset($data['departmentName'])) {

            // Make certain there isn't already an apartment with the specified name
            $sqlQuery =
                'SELECT id FROM departments WHERE name = $1 AND id != $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['departmentName'], $data['departmentId']]);
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }

            if ($sqlResult->getRowCount() >= 1) {
                echo (json_encode(['ok' => false, 'error' => 'A department with the name \'' . $data['departmentName'] . '\' already exists.']));
                return false;
            }

            $updateCount++;
            if ($updateCount > 1) $updateQuery = $updateQuery . ', ';
            $updateQuery = $updateQuery . 'name = $' . $updateCount;
            $updateValues[] = $data['departmentName'];
        }

        // Set where clause
        $updateCount++;
        $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
        $updateValues[] = $data['departmentId'];

        $updateResult = $db->paramQuery($updateQuery, $updateValues);
        if (!$updateResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Send result
        echo (json_encode([
            'ok' => true
        ]));

        return true;
    }

    // Function get a list of default payslip items for a given department.
    //
    // Required Parameters
    //  departmentId              The ID of the department who's items will be retreived
    //
    // Optional Parameters
    //  categories              An array of category codes to include in the list.  If not provided all categories will be included.
    public function getDepartmentDefaultPayslipItemList($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],

            'categories' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => false, 'rules' => [
                ['type' => Json::TYPE_NON_EMPTY_STRING, 'nullable' => false]
            ]]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Initialize query parameters
        $sqlParams = [
            $data['departmentId']
        ];

        $departmentId = $data['departmentId'];

        // Initialize where clause
        $whereClause = 'WHERE payslip_config_items.department_id = $' . count($sqlParams) .
        ' AND payslip_config_items.employee_id IS NULL';

        // Check if categories were provided.
        if (array_key_exists('categories', $data)) {
            $validCategories = ['INCO', 'DEDU', 'CONT', 'FBEN', 'ALLO'];
            $inClause = '';

            foreach ($data['categories'] as $category) {
                // Check that the provided category is correct.
                if (!in_array($category, $validCategories)) {
                    echo (json_encode(['ok' => false, 'error' => 'Invalid category \'' . $category . '\' provided.']));
                    return false;
                }

                // Add the category to the sqlParams array
                $sqlParams[] = $category;

                // Add a $n for each given category
                if (strlen($inClause) === 0) $inClause = $inClause . '$' . count($sqlParams);
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
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Create employees array
        $items = [];

        while ($sqlRow = $sqlResult->fetchAssociative()) {
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
        $sqlResult = $db->paramQuery($sqlQuery, [$departmentId]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // For every provident fund the employee is a member of
        while ($sqlRow = $sqlResult->fetchAssociative()) {
            $autoCalculate = false;
            $employeeAmount = null;
            $employerAmount = null;
            $rfiItems = [];
            $providentFundName = $sqlRow['name'];
            // Is the provident fund calculation based on retirement fund income items?
            if ($sqlRow['provident_fund_calculation_type_code'] === 'PRFI') {
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
                $rfiItemSqlResult = $db->paramQuery($rfiItemSqlQuery, [$sqlRow['id'], $departmentId]);
                if (!$rfiItemSqlResult->isValid()) {
                    echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                    return false;
                }

                while ($rfiItemSqlRow = $rfiItemSqlResult->fetchAssociative()) {
                    $rfiItems[] = [
                        'payslipItemTypeCode'  => $rfiItemSqlRow['payslip_item_type_code'],
                        'percentage' => $rfiItemSqlRow['percentage']
                    ];
                }
            } else {
                $employeeAmount = doubleval($sqlRow['employee_amount']);
                $employerAmount = doubleval($sqlRow['employer_amount']);
            }

            // Add payslip item for employee provident fund deduction, if any
            if (doubleval($sqlRow['employee_amount']) > 0.009) {

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
                        'employeeAmount' => doubleval($sqlRow['employee_amount']),
                        'employerAmount' => doubleval($sqlRow['employer_amount']),
                        'rfiItems' => $rfiItems
                    ],
                    'autoCalculate' => $autoCalculate,
                    'accrualDate' => null,
                    'amount' => $employeeAmount
                ];
            }

            // Add payslip item for employer provident fund contribution, if any
            if (doubleval($sqlRow['employer_amount']) > 0.009) {
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
                        'employeeAmount' => doubleval($sqlRow['employee_amount']),
                        'employerAmount' => doubleval($sqlRow['employer_amount']),
                        'rfiItems' => $rfiItems
                    ],
                    'autoCalculate' => $autoCalculate,
                    'accrualDate' => null,
                    'amount' => $employerAmount
                ];
            }
        }

        // Send result
        echo (json_encode([
            'ok' => true,
            'payslipItems' => $items
        ]));

        return true;
    }

        // Function to add a department default payslip item
    //
    // Required Parameters
    //  departmentId            The ID of the department this item is for.
    //  typeCode                The code of the item type to add.
    //  description             A description for the item
    //  accrualDate             The date the item will accrue.  If the type is once off then this value cannot be null.  If it is a recurring type
    //                          the value must be null.
    //  autoCalculate           Should this item be auto calculated.
    //  amount                  The amount for the item.  Can be null.
    //
    // Optional Parameters
    //  None
    public function addDepartmentDefaultPayslipItem($data, $user, $db)
    {
        // Set content type header
        header('Content-Type: application/json');

        // Set default parameter values
        $defaults = [];
        Json::copy($defaults, $data);

        // Validate data.
        $validationResult = Json::validate($data, [
            'departmentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
            'typeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
            'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
            'accrualDate' => ['type' => Json::TYPE_DATE, 'required' => true, 'nullable' => true],
            'autoCalculate' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
            'unitSourceCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
            'includeInNettPay' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
            'amount' => ['type' => Json::TYPE_NUMERIC, 'required' => true, 'nullable' => true]
        ]);
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
            return false;
        }

        // Start SQL transaction
        $db->startTransaction();

        // Lock the relevant table(s)
        $db->query('LOCK TABLE employees IN EXCLUSIVE MODE;');
        $db->query('LOCK TABLE payslip_config_items IN EXCLUSIVE MODE;');
        $db->query('LOCK TABLE payslip_item_types IN EXCLUSIVE MODE;');

        // Check that the department exists
        $sqlResult = $db->paramQuery('SELECT id FROM departments WHERE id = $1;', [$data['departmentId']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Check if the type was found
        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Department \'' . $data['departmentId'] . '\' not found.']));
            return false;
        }

        // Load the type from the database
        $sqlQuery = 'SELECT code, is_once_off, auto_calculate, default_amount, allow_unit_source, is_enabled FROM payslip_item_types WHERE code = $1;';
        $sqlResult = $db->paramQuery($sqlQuery, [$data['typeCode']]);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Check if the type was found
        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' not found.']));
            return false;
        }

        // Get the row from the result.
        $sqlRow = $sqlResult->fetchAssociative();

        // Check if the type is enabled
        if ($sqlRow['is_enabled'] !== true) {
            echo (json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' is disabled.']));
            return false;
        }

        // If auto calculate is set, check that the item supports it.
        if ($data['autoCalculate'] === true && $sqlRow['auto_calculate'] !== true) {
            echo (json_encode(['ok' => false, 'error' => 'This item cannot be set to auto calculate.']));
            return false;
        }

        // If auto calculate is set, check that the item supports it.
        if (strlen($data['unitSourceCode'] !== null ? $data['unitSourceCode'] : '') > 0 && $sqlRow['allow_unit_source'] !== true) {
            echo (json_encode(['ok' => false, 'error' => 'This item does not allow a unit source.']));
            return false;
        }

        // If the item is once off then check that an accrual date was provided.
        if ($sqlRow['is_once_off'] === true) {
            if ($data['accrualDate'] === null) {
                echo (json_encode(['ok' => false, 'error' => 'Accrual date is required for once off items.']));
                return false;
            }
        }

        // Check whether department already has this payslip item type
        $sqlQuery =
            'SELECT id ' .
            'FROM payslip_config_items ' .
            'WHERE department_id = $1 ' .
            'AND employee_id IS NULL ' .
            'AND payslip_item_type_code = $2 ' .
            'AND accrual_date IS NULL ' .
            'LIMIT 1;';

        $sqlResult = $db->paramQuery($sqlQuery, [
            $data['departmentId'],
            $data['typeCode']
        ]);

        if (!$sqlResult->isValid()) {
            echo(json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        if ($sqlResult->getRowCount() > 0) {
            echo(json_encode([
                'ok' => false,
                'error' => 'This payslip item type has already been added to the department.']));
            return false;
        }

        // Build the query to insert the department item (only if not already inserted for the department).
        $sqlQuery =
            'INSERT INTO payslip_config_items ( ' .
            'payslip_item_type_code, ' .
            'employee_id, ' .
            'department_id, ' .
            'description, ' .
            'accrual_date, ' .
            'auto_calculate, ' .
            'unit_source_code, ' .
            'include_in_nett_pay, ' .
            'amount ' .
            ') ' . 
            'VALUES ( ' .
            '$1, NULL, $2, $3, $4, $5, $6, $7, $8 ' .
            ');';

        $sqlResult = $db->paramQuery($sqlQuery, [
            $data['typeCode'],          // payslip_item_type_code
            $data['departmentId'],      // department_id
            $data['description'],       // description
            $data['accrualDate'],       // accrual_date
            $data['autoCalculate'],     // auto_calculate
            $data['unitSourceCode'],    // unit_source_code
            $data['includeInNettPay'],  // include_in_nett_pay
            $data['amount']             // amount
        ]);

        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        //Insert copies for employees who do not have the item already, else skip employee.
        $sqlQuery =
            'INSERT INTO payslip_config_items ( ' .
            'payslip_item_type_code, ' .
            'employee_id, ' .
            'department_id, ' .
            'description, ' .
            'accrual_date, ' .
            'auto_calculate, ' .
            'unit_source_code, ' .
            'include_in_nett_pay, ' .
            'amount ' .
            ') ' .
            'SELECT ' .
            '$1, employees.id, NULL, $3, $4, $5, $6, $7, $8 ' .
            'FROM employees ' .
            'WHERE employees.department_id = $2 ' .
            'AND NOT EXISTS ( ' .
            'SELECT 1 ' .
            'FROM payslip_config_items AS existing_items ' .
            'WHERE existing_items.employee_id = employees.id ' .
            'AND existing_items.payslip_item_type_code = $1 ' .
            'AND existing_items.accrual_date IS NULL ' .
            ');';

        $sqlResult = $db->paramQuery($sqlQuery, [
            $data['typeCode'],          // $1
            $data['departmentId'],      // $2
            $data['description'],       // $3
            $data['accrualDate'],       // $4
            $data['autoCalculate'],     // $5
            $data['unitSourceCode'],    // $6
            $data['includeInNettPay'],  // $7
            $data['amount']             // $8
        ]);

        if (!$sqlResult->isValid()) {
            echo(json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Commit SQL transaction (if both inserts were successful)
        $db->commitTransaction();

        echo (json_encode(['ok' => true]));

        return true;
    }

    // Function to edit a payslip item
    //
    // Required Parameters
    //  payslipItemId           The ID of the payslip item to edit.
    //  typeCode                The code of the item type to edit.
    //  description             A description for the item
    //  accrualDate             The date the item will accrue.  If the type is once off then this value cannot be null.  If it is a recurring type
    //                          the value must be null.
    //  amount                  The amount for the item.  Can be null.
    //
    // Optional Parameters
    //  None
    public function editDepartmentDefaultPayslipItem($data, $user, $db)
    {

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
        if ($validationResult !== true) {
            echo (json_encode(['ok' => false, 'error' => $validationResult]));
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
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Check if the type was found
        if ($sqlResult->getRowCount() !== 1) {
            echo (json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' not found.']));
            return false;
        }

        // Get the row from the result.
        $sqlRow = $sqlResult->fetchAssociative();

        // Check if the type is enabled
        if ($sqlRow['is_enabled'] !== true) {
            echo (json_encode(['ok' => false, 'error' => 'Item type \'' . $data['typeCode'] . '\' is disabled.']));
            return false;
        }

        // If the item is once off then check that an accrual date was provided.
        if ($sqlRow['is_once_off'] === true) {
            if ($data['accrualDate'] === null) {
                echo (json_encode(['ok' => false, 'error' => 'Accrual date is required for once off items.']));
                return false;
            }
        }

        // Build the query to update the client
        $updateCount = 0;
        $updateValues = [];
        $sqlQuery = 'UPDATE payslip_config_items SET ';

        if (isset($data['typeCode'])) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'payslip_item_type_code = $' . $updateCount;
            $updateValues[] = $data['typeCode'];
        }
        if (isset($data['description'])) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'description = $' . $updateCount;
            $updateValues[] = $data['description'];
        }
        if (isset($data['accrualDate'])) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'accrual_date = $' . $updateCount;
            $updateValues[] = $data['accrualDate'];
        }
        if (isset($data['autoCalculate'])) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'auto_calculate = $' . $updateCount;
            $updateValues[] = $data['autoCalculate'];
        }
        if (array_key_exists('unitSourceCode', $data)) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'unit_source_code = $' . $updateCount;
            $updateValues[] = $data['unitSourceCode'];
        }
        if (array_key_exists('includeInNettPay', $data)) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'include_in_nett_pay = $' . $updateCount;
            $updateValues[] = $data['includeInNettPay'];
        }
        if (isset($data['amount'])) {
            $updateCount++;
            if ($updateCount > 1) $sqlQuery = $sqlQuery . ', ';
            $sqlQuery = $sqlQuery . 'amount = $' . $updateCount;
            $updateValues[] = $data['amount'];
        }

        // Set where clause
        $updateCount++;
        $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
        $updateValues[] = $data['payslipItemId'];

        $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
        if (!$sqlResult->isValid()) {
            echo (json_encode(['ok' => false, 'error' => 'Database error.']));
            return false;
        }

        // Commit SQL transaction
        $db->commitTransaction();

        echo (json_encode(['ok' => true]));

        return true;
    }

}
