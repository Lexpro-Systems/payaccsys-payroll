<?php
System::denyDirectAccess();
System::includeFile('payrun_import/PayrunImportData.php');

/**
 * Transformer class - cleans up payrun import data and makes sure it's appropriate
 * for further processing / storage.
 *
 * NOTE: the totals fallback formula in calculateTotalsIfMissing() is a reasonable
 * placeholder built from the fields available on PayrunImportData. Please confirm it
 * against your actual payroll calculation rules (e.g. how paid/sick leave and leave
 * paid out should factor into earnings) before relying on it.
 */
class TransformPayrunImportData
{
    private PayrunImportData $payrun;
    private $db;

    private const NUMERIC_FIELDS = [
        'hourlyRate',
        'basicSalary',
        'normalHoursWorked',
        'overtime15Hours',
        'overtime20Hours',
        'paidLeave',
        'sickLeave',
        'leavePaidOut',
        'advanceDeductions',
        'otherDeductions',
        'equipment',
        'transport',
        'adminFee',
        'paye',
        'uifContributions',
        'totalEarnings',
        'totalDeductions',
        'netPay',
    ];

    private const TEXT_FIELDS = [
        'employeeNumber',
        'employeeName',
        'idNumber',
        'jobTitle',
        'department',
        'paymentPeriodFrom',
        'paymentPeriodTo',
        'bankAccount',
    ];

    public function __construct(PayrunImportData &$payrun, $db)
    {
        $this->payrun = $payrun;
        $this->db = $db;
    }

    private function trimTextFields(): void
    {
        foreach (self::TEXT_FIELDS as $field) {
            $this->payrun->$field = trim((string) $this->payrun->$field);
        }
    }

    /**
     * Blank numeric cells are coerced to 0 in AssignPayrunImportData already, but this
     * also normalises any stray whitespace/formatting (e.g. "1,000.00") coming from CSV.
     */
    private function normaliseNumericFields(): void
    {
        foreach (self::NUMERIC_FIELDS as $field) {
            $value = $this->payrun->$field;
            if (is_string($value)) {
                $value = str_replace(',', '', trim($value));
            }
            $this->payrun->$field = ($value === '' || $value === null) ? 0.0 : (float) $value;
        }
    }

    /**
     * Strips anything that isn't alphanumeric from the bank account number
     * (e.g. spaces, hyphens sometimes used to make account numbers readable).
     */
    private function normaliseBankAccount(): void
    {
        if ($this->payrun->bankAccount !== '') {
            $this->payrun->bankAccount = preg_replace('/[^A-Za-z0-9]/', '', $this->payrun->bankAccount);
        }
    }

    /**
     * If the earnings/deductions/net pay totals weren't supplied on the import, calculate
     * them from the individual line items so downstream processing always has a value.
     */
    private function calculateTotalsIfMissing(): void
    {
        if ($this->payrun->totalEarnings == 0.0) {
            $overtime15Rate = $this->payrun->hourlyRate * 1.5;
            $overtime20Rate = $this->payrun->hourlyRate * 2.0;

            $this->payrun->totalEarnings = round(
                $this->payrun->basicSalary +
                    ($this->payrun->hourlyRate * $this->payrun->normalHoursWorked) +
                    ($overtime15Rate * $this->payrun->overtime15Hours) +
                    ($overtime20Rate * $this->payrun->overtime20Hours) +
                    $this->payrun->paidLeave +
                    $this->payrun->sickLeave +
                    $this->payrun->leavePaidOut +
                    $this->payrun->transport +
                    $this->payrun->equipment,
                2
            );
        }

        if ($this->payrun->totalDeductions == 0.0) {
            $this->payrun->totalDeductions = round(
                $this->payrun->advanceDeductions +
                    $this->payrun->otherDeductions +
                    $this->payrun->adminFee +
                    $this->payrun->paye +
                    $this->payrun->uifContributions,
                2
            );
        }

        if ($this->payrun->netPay == 0.0) {
            $this->payrun->netPay = round($this->payrun->totalEarnings - $this->payrun->totalDeductions, 2);
        }
    }

    public function apply(): void
    {
        $this->trimTextFields();
        $this->normaliseNumericFields();
        $this->normaliseBankAccount();
        $this->calculateTotalsIfMissing();
    }
}
