<?php
System::denyDirectAccess();
System::includeFile('Util.php');
System::includeFile('payrun_import/PayrunImportData.php');
System::includeFile('payrun_import/PayrunColumnIndex.php');

/**
 * Payrun Import validation class.
 * Responsible for checking the data that will be imported for a payrun.
 *
 * NOTE ON ASSUMPTIONS:
 * The exact business rules below (which fields are mandatory, how "total earnings" /
 * "total deductions" / "net pay" are meant to reconcile, whether department must match
 * a lookup table, etc.) were inferred from PayrunImportData's field list only - please
 * review and adjust the thresholds/rules to match your actual payroll requirements.
 */
class PayrunImportValidator
{
    // Hold Database Connection
    private $db;
    private PayrunImportData $payrun;
    private $user;
    private bool $doesEmployeeExist;
    private ?array $employeeRecord;

    public function __construct($db, PayrunImportData $payrun, $user)
    {
        $this->db = $db;
        $this->payrun = $payrun;
        $this->user = $user;
        $this->doesEmployeeExist = false;
        $this->employeeRecord = null;
    }

    /**
     * Helper - true if $value is a non-blank numeric string
     */
    private function isNumericValue($value): bool
    {
        return $value !== "" && is_numeric($value);
    }

    /**
     * Helper - true if $value is numeric and >= 0 (blank is treated as 0 and is valid)
     */
    private function isValidNonNegativeAmount($value): bool
    {
        if ($value === "" || $value === null) {
            return true;
        }
        return is_numeric($value) && (float) $value >= 0;
    }

    /**
     * Confirms the employee referenced by employeeNumber actually exists, and that
     * an id number supplied on the import (if any) matches the employee record on file.
     */
    private function validateEmployeeReference(int $row, array &$errors): void
    {
        if ($this->payrun->employeeNumber === "") {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::EMPLOYEE_NUMBER,
                'row' => $row,
                'value' => $this->payrun->employeeNumber,
                'expectedValue' => 'Existing Employee Number',
                'description' => 'Employee number is required',
                'fullDescription' => 'Employee number is required to link this payrun row to an employee'
            ];
            return;
        }

        $sqlQuery = 'SELECT id, id_number FROM employees WHERE code = $1;';
        $sqlResult = $this->db->paramQuery($sqlQuery, [$this->payrun->employeeNumber]);
        if (!$sqlResult->isValid()) {
            die(json_encode(['ok' => false, 'error' => 'Database error.']));
        }

        if ($sqlResult->getRowCount() === 0) {
            $this->doesEmployeeExist = false;
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::EMPLOYEE_NUMBER,
                'row' => $row,
                'value' => $this->payrun->employeeNumber,
                'expectedValue' => 'Existing Employee Number',
                'description' => 'Employee does not exist',
                'fullDescription' =>
                'There is no employee with the specified Employee Number (\'' . $this->payrun->employeeNumber . '\')'
            ];
            return;
        }

        $this->doesEmployeeExist = true;
        $this->employeeRecord = $sqlResult->fetchAssociative();

        if (
            $this->payrun->idNumber !== "" &&
            !empty($this->employeeRecord['id_number']) &&
            $this->payrun->idNumber !== $this->employeeRecord['id_number']
        ) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::ID_NUMBER,
                'row' => $row,
                'value' => $this->payrun->idNumber,
                'expectedValue' => $this->employeeRecord['id_number'],
                'description' => 'ID number does not match employee record',
                'fullDescription' => 'The ID number supplied does not match the ID number on file for this employee'
            ];
        }
    }

    /**
     * Basic descriptive fields - employee name, id number format, job title.
     */
    private function validatePersonalDetails(int $row, array &$errors): void
    {
        if ($this->payrun->employeeName === "") {
            $errors[] = [
                'isCritical' => false,
                'column' => PayrunColumnIndex::EMPLOYEE_NAME,
                'row' => $row,
                'value' => $this->payrun->employeeName,
                'expectedValue' => 'Any text value',
                'description' => 'Employee name is blank',
                'fullDescription' => 'Employee name is recommended for readability of the import but is not required'
            ];
        }

        if ($this->payrun->idNumber !== "" && Util::ValidateSouthAfricanId($this->payrun->idNumber)['error']) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::ID_NUMBER,
                'row' => $row,
                'value' => $this->payrun->idNumber,
                'expectedValue' => 'Numeric',
                'description' => 'Invalid South African ID',
                'fullDescription' => 'South African ID must be numeric and pass the checksum validation'
            ];
        }
    }

    /**
     * Job title / department - kept as soft (non-critical) checks since there's no
     * confirmed lookup table for either in this codebase. Wire up a real lookup here
     * (similar to the SIC code check in the employee importer) if one exists.
     */
    private function validateJobDetails(int $row, array &$errors): void
    {
        if ($this->payrun->jobTitle === "") {
            $errors[] = [
                'isCritical' => false,
                'column' => PayrunColumnIndex::JOB_TITLE,
                'row' => $row,
                'value' => $this->payrun->jobTitle,
                'expectedValue' => 'Any text value',
                'description' => 'Job title is blank',
                'fullDescription' => 'Job title is recommended but not required'
            ];
        }

        if ($this->payrun->department === "") {
            $errors[] = [
                'isCritical' => false,
                'column' => PayrunColumnIndex::DEPARTMENT,
                'row' => $row,
                'value' => $this->payrun->department,
                'expectedValue' => 'Any text value',
                'description' => 'Department is blank',
                'fullDescription' => 'Department is recommended but not required'
            ];
        }
    }

    /**
     * Payment period dates must be valid and the "from" date must not be after the "to" date.
     */
    private function validatePaymentPeriod(int $row, array &$errors): void
    {

        $this->payrun->paymentPeriodFrom = $this->normalizeDate($this->payrun->paymentPeriodFrom);
        $this->payrun->paymentPeriodTo = $this->normalizeDate($this->payrun->paymentPeriodTo);
        $fromValid = Util::isDateValid($this->payrun->paymentPeriodFrom);
        if (!$fromValid) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::PAYMENT_PERIOD_FROM,
                'row' => $row,
                'value' => $this->payrun->paymentPeriodFrom,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid payment period from date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        $toValid = Util::isDateValid($this->payrun->paymentPeriodTo);
        if (!$toValid) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::PAYMENT_PERIOD_TO,
                'row' => $row,
                'value' => $this->payrun->paymentPeriodTo,
                'expectedValue' => 'Date [CCYY-MM-DD]',
                'description' => 'Invalid payment period to date',
                'fullDescription' => 'Must be date [CCYY-MM-DD]'
            ];
        }

        if ($fromValid && $toValid && strtotime($this->payrun->paymentPeriodFrom) > strtotime($this->payrun->paymentPeriodTo)) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::PAYMENT_PERIOD_TO,
                'row' => $row,
                'value' => $this->payrun->paymentPeriodTo,
                'expectedValue' => 'Date on or after ' . $this->payrun->paymentPeriodFrom,
                'description' => 'Payment period end is before its start',
                'fullDescription' => 'Payment period "to" date cannot be before the "from" date'
            ];
        }
    }

    private function normalizeDate(?string $date): ?string
    {
        if (empty($date)) {
            return null;
        }

        $date = trim($date);

        // Already in Y-m-d format
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        // Try common formats
        $formats = [
            'd/m/Y',
            'd-m-Y',
            'd.m.Y',
            'Y/m/d',
            'Y-m-d',
            'Y.m.d',
            'm/d/Y',
            'm-d-Y',
            'j/n/Y',
            'j-n-Y',
            'd/m/y',
            'd-m-y',
        ];

        foreach ($formats as $format) {
            $dateTime = DateTime::createFromFormat($format, $date);

            if ($dateTime && $dateTime->format($format) === $date) {
                return $dateTime->format('Y-m-d');
            }
        }

        // Last attempt
        $timestamp = strtotime($date);

        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }

        return null;
    }

    /**
     * Bank account is optional here (it may already be on file for the employee), but if
     * supplied it should look like an account number.
     */
    private function validateBankingDetails(int $row, array &$errors): void
    {
        if ($this->payrun->bankAccount !== "" && !preg_match('/^[a-zA-Z0-9\- ]+$/', $this->payrun->bankAccount)) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::BANK_ACCOUNT,
                'row' => $row,
                'value' => $this->payrun->bankAccount,
                'expectedValue' => 'Alphanumeric account number',
                'description' => 'Invalid bank account',
                'fullDescription' => 'Bank account must only contain letters, numbers, spaces or hyphens'
            ];
        }
    }

    /**
     * Rates, worked hours and leave. At least one of hourlyRate/basicSalary must be
     * supplied since a payslip needs a basis for earnings.
     */
    private function validateHoursAndRates(int $row, array &$errors): void
    {
        $amountFields = [
            'hourlyRate' => PayrunColumnIndex::HOURLY_RATE,
            'basicSalary' => PayrunColumnIndex::BASIC_SALARY,
            'normalHoursWorked' => PayrunColumnIndex::NORMAL_HOURS_WORKED,
            'overtime15Hours' => PayrunColumnIndex::OVERTIME_1_5_HOURS,
            'overtime20Hours' => PayrunColumnIndex::OVERTIME_2_0_HOURS,
            'paidLeave' => PayrunColumnIndex::PAID_LEAVE,
            'sickLeave' => PayrunColumnIndex::SICK_LEAVE,
            'leavePaidOut' => PayrunColumnIndex::LEAVE_PAID_OUT,
        ];

        foreach ($amountFields as $property => $column) {
            $value = $this->payrun->$property;
            if (!$this->isValidNonNegativeAmount($value)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => $column,
                    'row' => $row,
                    'value' => $value,
                    'expectedValue' => 'Numeric value >= 0',
                    'description' => 'Invalid ' . $property,
                    'fullDescription' => 'Must be a numeric value that is zero or greater'
                ];
            }
        }

        if (
            (!$this->isNumericValue($this->payrun->hourlyRate) || (float) $this->payrun->hourlyRate == 0) &&
            (!$this->isNumericValue($this->payrun->basicSalary) || (float) $this->payrun->basicSalary == 0)
        ) {
            $errors[] = [
                'isCritical' => true,
                'column' => PayrunColumnIndex::BASIC_SALARY,
                'row' => $row,
                'value' => $this->payrun->basicSalary,
                'expectedValue' => 'A non-zero hourly rate or basic salary',
                'description' => 'No basis for earnings',
                'fullDescription' => 'Either an hourly rate or a basic salary greater than zero is required'
            ];
        }
    }

    /**
     * Deductions and allowances - all optional (default to 0) but must be non-negative numbers.
     */
    private function validateDeductionsAndAllowances(int $row, array &$errors): void
    {
        $amountFields = [
            'advanceDeductions' => PayrunColumnIndex::ADVANCE_DEDUCTIONS,
            'otherDeductions' => PayrunColumnIndex::OTHER_DEDUCTIONS,
            'equipment' => PayrunColumnIndex::EQUIPMENT,
            'transport' => PayrunColumnIndex::TRANSPORT,
            'adminFee' => PayrunColumnIndex::ADMIN_FEE,
            'paye' => PayrunColumnIndex::PAYE,
            'uifContributions' => PayrunColumnIndex::UIF_CONTRIBUTIONS,
        ];

        foreach ($amountFields as $property => $column) {
            $value = $this->payrun->$property;
            if (!$this->isValidNonNegativeAmount($value)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => $column,
                    'row' => $row,
                    'value' => $value,
                    'expectedValue' => 'Numeric value >= 0',
                    'description' => 'Invalid ' . $property,
                    'fullDescription' => 'Must be a numeric value that is zero or greater'
                ];
            }
        }
    }

    /**
     * Totals must be numeric, and net pay should reconcile with earnings minus deductions
     * (within a small rounding tolerance). This is flagged as non-critical since the import
     * may intentionally leave totals blank for the system to calculate - adjust as needed.
     */
    private function validateTotals(int $row, array &$errors): void
    {
        $totalFields = [
            'totalEarnings' => PayrunColumnIndex::TOTAL_EARNINGS,
            'totalDeductions' => PayrunColumnIndex::TOTAL_DEDUCTIONS,
            'netPay' => PayrunColumnIndex::NET_PAY,
        ];

        foreach ($totalFields as $property => $column) {
            $value = $this->payrun->$property;
            if (!$this->isValidNonNegativeAmount($value)) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => $column,
                    'row' => $row,
                    'value' => $value,
                    'expectedValue' => 'Numeric value >= 0',
                    'description' => 'Invalid ' . $property,
                    'fullDescription' => 'Must be a numeric value that is zero or greater'
                ];
            }
        }

        $totalEarnings = $this->isNumericValue($this->payrun->totalEarnings) ? (float) $this->payrun->totalEarnings : null;
        $totalDeductions = $this->isNumericValue($this->payrun->totalDeductions) ? (float) $this->payrun->totalDeductions : null;
        $netPay = $this->isNumericValue($this->payrun->netPay) ? (float) $this->payrun->netPay : null;

        if ($totalEarnings !== null && $totalDeductions !== null && $netPay !== null) {
            $expectedNetPay = round($totalEarnings - $totalDeductions, 2);
            if (abs($expectedNetPay - round($netPay, 2)) > 0.01) {
                $errors[] = [
                    'isCritical' => false,
                    'column' => PayrunColumnIndex::NET_PAY,
                    'row' => $row,
                    'value' => $netPay,
                    'expectedValue' => $expectedNetPay,
                    'description' => 'Net pay does not equal total earnings minus total deductions',
                    'fullDescription' => 'Net pay (' . $netPay . ') should equal total earnings (' . $totalEarnings .
                        ') minus total deductions (' . $totalDeductions . ')'
                ];
            }
        }
    }

    /**
     * Function validate responsible for accumulating all the validation rules
     * @param {int} $row the current row of the error
     * @param {array} $errors A reference to the errors array
     * @return {void}
     */
    public function validate(int $row, array &$errors): void
    {
        $this->validateEmployeeReference($row, $errors);
        $this->validatePersonalDetails($row, $errors);
        $this->validateJobDetails($row, $errors);
        $this->validatePaymentPeriod($row, $errors);
        $this->validateBankingDetails($row, $errors);
        $this->validateHoursAndRates($row, $errors);
        $this->validateDeductionsAndAllowances($row, $errors);
        $this->validateTotals($row, $errors);
    }

    /**
     * Function to check for duplicate rows - the same employee should not appear twice
     * for the same payment period within one import file.
     * @param {int} $currentRow
     * @param {array} $payruns
     * @param {array} $errors
     */
    public function checkDuplicates(int $currentRow, array &$payruns, array &$errors): void
    {
        $row = 2;
        foreach ($payruns as $payrun) {
            if ($row === $currentRow) {
                break;
            }
            $row++;

            if (
                $this->payrun->employeeNumber !== "" &&
                $this->payrun->employeeNumber === $payrun->employeeNumber &&
                $this->payrun->paymentPeriodFrom === $payrun->paymentPeriodFrom &&
                $this->payrun->paymentPeriodTo === $payrun->paymentPeriodTo
            ) {
                $errors[] = [
                    'isCritical' => true,
                    'column' => PayrunColumnIndex::EMPLOYEE_NUMBER,
                    'row' => $row,
                    'value' => $payrun->employeeNumber,
                    'expectedValue' => 'Unique Employee Number per payment period',
                    'description' => 'Employee is duplicated in the import file for the same payment period',
                    'fullDescription' => 'Each employee should only appear once per payment period in the import file'
                ];
            }
        }
    }

    /**
     * Function to get if the employee referenced by this row exists
     * @return {bool}
     */
    public function doesEmployeeExist(): bool
    {
        return $this->doesEmployeeExist;
    }
}
