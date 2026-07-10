<?php
System::denyDirectAccess();
// Data from csv is automatically injected into this class 
// The attributes should be in order  according to the csv headings 
class PayrunImportData
{
    public string $employeeNumber;
    public string $employeeName;
    public string $idNumber;
    public string $jobTitle;
    public string $department;
    public string $paymentPeriodFrom;
    public string $paymentPeriodTo;
    public string $bankAccount;
    public float $hourlyRate;
    public float $basicSalary;
    public float $normalHoursWorked;
    public float $overtime15Hours;
    public float $overtime20Hours;
    public float $paidLeave;
    public float $sickLeave;
    public float $leavePaidOut;
    public float $advanceDeductions;
    public float $otherDeductions;
    public float $equipment;
    public float $transport;
    public float $adminFee;
    public float $paye;
    public float $uifContributions;
    public float $totalEarnings;
    public float $totalDeductions;
    public float $netPay;
}
