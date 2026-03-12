<?php
    // Set namespace
    namespace PayslipUtil;
    
    // Import namespaces
    use \DateTime as DateTime;
    use \DatePeriod as DatePeriod;
    use \DateInterval as DateInterval;
    
    // Create PAYE tax tables
    global $payeTable;
    $payeTable = [
        [
            'start' => new DateTime('2026-03-01'),
            'end' => new DateTime('2027-02-28'),
            'paye' => [
                ['max' =>  245100, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  383100, 'fixed' =>  44118, 'percentage' => 26, 'adjustment' =>  245100],
                ['max' =>  530200, 'fixed' =>  79998, 'percentage' => 31, 'adjustment' =>  383100],
                ['max' =>  695800, 'fixed' => 125599, 'percentage' => 36, 'adjustment' =>  530200],
                ['max' =>  887000, 'fixed' => 185215, 'percentage' => 39, 'adjustment' =>  695800],
                ['max' => 1878600, 'fixed' => 259783, 'percentage' => 41, 'adjustment' =>  887000],
                ['max' =>    null, 'fixed' => 666339, 'percentage' => 45, 'adjustment' => 1878600]
            ],
            'rebate' => ['primary' => 17820, 'secondary' => 9765, 'tertiary' => 3249]
        ],

        [
            'start' => new DateTime('2025-03-01'),
            'end' => new DateTime('2026-02-28'),
            'paye' => [
                ['max' =>  237100, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  370500, 'fixed' =>  42678, 'percentage' => 26, 'adjustment' =>  237100],
                ['max' =>  512800, 'fixed' =>  77362, 'percentage' => 31, 'adjustment' =>  370500],
                ['max' =>  673000, 'fixed' => 121475, 'percentage' => 36, 'adjustment' =>  512800],
                ['max' =>  857900, 'fixed' => 179147, 'percentage' => 39, 'adjustment' =>  673000],
                ['max' => 1817000, 'fixed' => 251258, 'percentage' => 41, 'adjustment' =>  857900],
                ['max' =>    null, 'fixed' => 644489, 'percentage' => 45, 'adjustment' => 1817000]
            ],
            'rebate' => ['primary' => 17235, 'secondary' => 9444, 'tertiary' => 3145]
        ],

        [
            'start' => new DateTime('2024-03-01'),
            'end' => new DateTime('2025-02-28'),
            'paye' => [
                ['max' =>  237100, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  370500, 'fixed' =>  42678, 'percentage' => 26, 'adjustment' =>  237100],
                ['max' =>  512800, 'fixed' =>  77362, 'percentage' => 31, 'adjustment' =>  370500],
                ['max' =>  673000, 'fixed' => 121475, 'percentage' => 36, 'adjustment' =>  512800],
                ['max' =>  857900, 'fixed' => 179147, 'percentage' => 39, 'adjustment' =>  673000],
                ['max' => 1817000, 'fixed' => 251258, 'percentage' => 41, 'adjustment' =>  857900],
                ['max' =>    null, 'fixed' => 644489, 'percentage' => 45, 'adjustment' => 1817000]
            ],
            'rebate' => ['primary' => 17235, 'secondary' => 9444, 'tertiary' => 3145]
        ],
        
        [
            'start' => new DateTime('2023-03-01'),
            'end' => new DateTime('2024-02-29'),
            'paye' => [
                ['max' =>  237100, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  370500, 'fixed' =>  42678, 'percentage' => 26, 'adjustment' =>  237100],
                ['max' =>  512800, 'fixed' =>  77362, 'percentage' => 31, 'adjustment' =>  370500],
                ['max' =>  673000, 'fixed' => 121475, 'percentage' => 36, 'adjustment' =>  512800],
                ['max' =>  857900, 'fixed' => 179147, 'percentage' => 39, 'adjustment' =>  673000],
                ['max' => 1817000, 'fixed' => 251258, 'percentage' => 41, 'adjustment' =>  857900],
                ['max' =>    null, 'fixed' => 644489, 'percentage' => 45, 'adjustment' => 1817000]
            ],
            'rebate' => ['primary' => 17235, 'secondary' => 9444, 'tertiary' => 3145]
        ],
        
        [
            'start' => new DateTime('2022-03-01'),
            'end' => new DateTime('2023-02-28'),
            'paye' => [
                ['max' =>  226000, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  353100, 'fixed' =>  40680, 'percentage' => 26, 'adjustment' =>  226000],
                ['max' =>  488700, 'fixed' =>  73726, 'percentage' => 31, 'adjustment' =>  353100],
                ['max' =>  641400, 'fixed' => 115762, 'percentage' => 36, 'adjustment' =>  488700],
                ['max' =>  817600, 'fixed' => 170734, 'percentage' => 39, 'adjustment' =>  641400],
                ['max' => 1731600, 'fixed' => 239452, 'percentage' => 41, 'adjustment' =>  817600],
                ['max' =>    null, 'fixed' => 614192, 'percentage' => 45, 'adjustment' => 1731600]
            ],
            'rebate' => ['primary' => 16425, 'secondary' => 9000, 'tertiary' => 2997]
        ],
        
        [
            'start' => new DateTime('2021-03-01'),
            'end' => new DateTime('2022-02-28'),
            'paye' => [
                ['max' =>  216200, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  337800, 'fixed' =>  38916, 'percentage' => 26, 'adjustment' =>  216200],
                ['max' =>  467500, 'fixed' =>  70532, 'percentage' => 31, 'adjustment' =>  337800],
                ['max' =>  613600, 'fixed' => 110739, 'percentage' => 36, 'adjustment' =>  467500],
                ['max' =>  782200, 'fixed' => 163335, 'percentage' => 39, 'adjustment' =>  613600],
                ['max' => 1656600, 'fixed' => 229089, 'percentage' => 41, 'adjustment' =>  782200],
                ['max' =>    null, 'fixed' => 587593, 'percentage' => 45, 'adjustment' => 1656600]
            ],
            'rebate' => ['primary' => 15714, 'secondary' => 8613, 'tertiary' => 2871]
        ],
        
        [
            'start' => new DateTime('2020-03-01'),
            'end' => new DateTime('2021-02-28'),
            'paye' => [
                ['max' =>  205900, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  321600, 'fixed' =>  37062, 'percentage' => 26, 'adjustment' =>  205900],
                ['max' =>  445100, 'fixed' =>  67144, 'percentage' => 31, 'adjustment' =>  321600],
                ['max' =>  584200, 'fixed' => 105429, 'percentage' => 36, 'adjustment' =>  445100],
                ['max' =>  744800, 'fixed' => 155505, 'percentage' => 39, 'adjustment' =>  584200],
                ['max' => 1577300, 'fixed' => 218139, 'percentage' => 41, 'adjustment' =>  744800],
                ['max' =>    null, 'fixed' => 559464, 'percentage' => 45, 'adjustment' => 1577300]
            ],
            'rebate' => ['primary' => 14958, 'secondary' => 8199, 'tertiary' => 2736]
        ],
        
        [
            'start' => new DateTime('2019-03-01'),
            'end' => new DateTime('2020-02-29'),
            'paye' => [
                ['max' =>  195850, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  305850, 'fixed' =>  35253, 'percentage' => 26, 'adjustment' =>  195850],
                ['max' =>  423300, 'fixed' =>  63853, 'percentage' => 31, 'adjustment' =>  305850],
                ['max' =>  555600, 'fixed' => 100263, 'percentage' => 36, 'adjustment' =>  423300],
                ['max' =>  708310, 'fixed' => 147891, 'percentage' => 39, 'adjustment' =>  555600],
                ['max' => 1500000, 'fixed' => 207448, 'percentage' => 41, 'adjustment' =>  708310],
                ['max' =>    null, 'fixed' => 532041, 'percentage' => 45, 'adjustment' => 1500000]
            ],
            'rebate' => ['primary' => 14220, 'secondary' => 7794, 'tertiary' => 2601]
        ],
        
        [
            'start' => new DateTime('2018-03-01'),
            'end' => new DateTime('2019-02-29'),
            'paye' => [
                ['max' =>  195850, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  305850, 'fixed' =>  35253, 'percentage' => 26, 'adjustment' =>  195850],
                ['max' =>  423300, 'fixed' =>  63853, 'percentage' => 31, 'adjustment' =>  305850],
                ['max' =>  555600, 'fixed' => 100263, 'percentage' => 36, 'adjustment' =>  423300],
                ['max' =>  708310, 'fixed' => 147891, 'percentage' => 39, 'adjustment' =>  555600],
                ['max' => 1500000, 'fixed' => 207448, 'percentage' => 41, 'adjustment' =>  708310],
                ['max' =>    null, 'fixed' => 532041, 'percentage' => 45, 'adjustment' => 1500000]
            ],
            'rebate' => ['primary' => 14067, 'secondary' => 7713, 'tertiary' => 2574]
        ],
        
        [
            'start' => new DateTime('2017-03-01'),
            'end' => new DateTime('2018-02-28'),
            'paye' => [
                ['max' =>  189880, 'fixed' =>      0, 'percentage' => 18, 'adjustment' =>       0],
                ['max' =>  296540, 'fixed' =>  34178, 'percentage' => 26, 'adjustment' =>  189880],
                ['max' =>  410460, 'fixed' =>  61910, 'percentage' => 31, 'adjustment' =>  296540],
                ['max' =>  555600, 'fixed' =>  97225, 'percentage' => 36, 'adjustment' =>  410460],
                ['max' =>  708310, 'fixed' => 149475, 'percentage' => 39, 'adjustment' =>  555600],
                ['max' => 1500000, 'fixed' => 209032, 'percentage' => 41, 'adjustment' =>  708310],
                ['max' =>    null, 'fixed' => 533625, 'percentage' => 45, 'adjustment' => 1500000]
            ],
            'rebate' => ['primary' => 13635, 'secondary' => 7479, 'tertiary' => 2493]
        ]
    ];
    
    // Create travel allowance tables
    //
    //  $travelAllowanceTable = [
    //      [startDate, endDate, prescribedRate]
    //  ]
    global $travelAllowanceTable;
    $travelAllowanceTable = [
        [new DateTime('2026-03-01'),                       null, 4.95],
        [new DateTime('2025-03-01'), new DateTime('2026-02-28'), 4.76],
        [new DateTime('2024-03-01'), new DateTime('2025-02-28'), 4.84],
        [new DateTime('2023-03-01'), new DateTime('2024-02-29'), 4.64],
        [new DateTime('2022-03-01'), new DateTime('2023-02-28'), 4.18],
        [new DateTime('2021-03-01'), new DateTime('2022-02-28'), 3.82],
        [new DateTime('2000-03-01'), new DateTime('2021-02-28'), 3.61]
    ];
    
    // Function to get the travel allowance prescribed rate according to a date
    function getTravelAllowancePrescribedRate(DateTime $date) : float {
        global $travelAllowanceTable;
        
        foreach( $travelAllowanceTable as $item ) {
            if( $item[0] !== null && $date < $item[0] ) continue;
            if( $item[1] !== null && $date > $item[1] ) continue;
            
            return $item[2];
        }
        
        return 0.0;
    }
    
    // Create official SARS interest rate tables
    //
    //  $officialInterestRateTable = [
    //      [startDate, endDate, interestRate]
    //  ]
    global $officialInterestRateTable;
    $officialInterestRateTable = [
        [new DateTime('2025-12-01'),                       null, 7.75],
        [new DateTime('2025-09-01'), new DateTime('2025-11-30'), 8.00],
        [new DateTime('2025-06-01'), new DateTime('2025-08-31'), 8.25],
        [new DateTime('2025-02-01'), new DateTime('2025-05-31'), 8.50],
        [new DateTime('2024-12-01'), new DateTime('2025-01-31'), 8.75],
        [new DateTime('2024-10-01'), new DateTime('2024-11-30'), 9.00],
        [new DateTime('2023-06-01'), new DateTime('2024-09-30'), 9.25],
        [new DateTime('2023-04-01'), new DateTime('2023-05-31'), 8.75],
        [new DateTime('2023-02-01'), new DateTime('2023-03-31'), 8.25],
        [new DateTime('2022-12-01'), new DateTime('2023-01-31'), 8.00],
        [new DateTime('2022-10-01'), new DateTime('2022-11-30'), 7.25],
        [new DateTime('2022-08-01'), new DateTime('2022-09-30'), 6.50],
        [new DateTime('2022-06-01'), new DateTime('2022-07-31'), 5.75],
        [new DateTime('2022-04-01'), new DateTime('2022-05-31'), 5.25],
        [new DateTime('2022-02-01'), new DateTime('2022-03-31'), 5.00],
        [new DateTime('2021-12-01'), new DateTime('2022-01-31'), 4.75],
        [new DateTime('2020-08-01'), new DateTime('2021-11-30'), 4.50],
        [new DateTime('2020-06-01'), new DateTime('2020-07-31'), 4.75],
        [new DateTime('2020-05-01'), new DateTime('2020-05-31'), 5.25],
        [new DateTime('2020-04-01'), new DateTime('2020-04-30'), 6.25],
        [new DateTime('2020-02-01'), new DateTime('2020-03-31'), 7.25],
        [new DateTime('2019-08-01'), new DateTime('2020-01-31'), 7.50],
        [new DateTime('2018-12-01'), new DateTime('2019-07-31'), 7.75],
        [new DateTime('2018-04-01'), new DateTime('2018-11-30'), 7.50],
        [new DateTime('2017-08-01'), new DateTime('2018-03-31'), 7.75],
        [new DateTime('2016-04-01'), new DateTime('2017-07-31'), 8.00],
        [new DateTime('2016-02-01'), new DateTime('2016-03-31'), 7.75]
    ];
    
    // Function to get the official SARS interest rate according to a date
    function getOfficialInterestRate(DateTime $date) : float {
        global $officialInterestRateTable;
        
        foreach( $officialInterestRateTable as $item ) {
            if( $item[0] !== null && $date < $item[0] ) continue;
            if( $item[1] !== null && $date > $item[1] ) continue;
            
            return $item[2];
        }
        
        return 0.0;
    }
    
    // Create UIF income cap tables
    //
    //  $uifTable = [
    //      [startDate, endDate, prescribedRate]
    //  ]
    global $uifIncomeCapTable;
    $uifIncomeCapTable = [
        [new DateTime('2021-06-01'),                       null, 212544],
        [                      null, new DateTime('2021-05-31'), 178464]
    ];
    
    // Function to get the uif income cap according to a date
    function getUifIncomeCap(DateTime $date) : float {
        global $uifIncomeCapTable;
        
        foreach( $uifIncomeCapTable as $item ) {
            if( $item[0] !== null && $date < $item[0] ) continue;
            if( $item[1] !== null && $date > $item[1] ) continue;
            
            return $item[2];
        }
        
        return 0.0;
    }
    
    // Create compensation fund earnings cap tables
    //
    //  $uifTable = [
    //      [startDate, endDate, prescribedRate]
    //  ]
    global $compensationFundEarningCapTable;
    $compensationFundEarningCapTable = [
        [new DateTime('2025-03-01'),                       null, 633168],
        [new DateTime('2024-03-01'), new DateTime('2025-02-28'), 597328],
        [new DateTime('2023-03-01'), new DateTime('2024-02-29'), 568959],
        [new DateTime('2022-03-01'), new DateTime('2023-02-28'), 529264],
        [new DateTime('2021-03-01'), new DateTime('2022-02-28'), 506473],
        [new DateTime('2020-03-01'), new DateTime('2021-02-28'), 484200],
        [new DateTime('2019-03-01'), new DateTime('2020-02-29'), 458520],
        [new DateTime('2018-03-01'), new DateTime('2019-02-28'), 430944],
        [null,                       new DateTime('2018-02-28'), 403500],
    ];
    
    // Function to get the uif income cap according to a date
    function getCompensationFundEarningCap(DateTime $date) : float {
        global $compensationFundEarningCapTable;
        
        foreach( $compensationFundEarningCapTable as $item ) {
            if( $item[0] !== null && $date < $item[0] ) continue;
            if( $item[1] !== null && $date > $item[1] ) continue;
            
            return $item[2];
        }
        
        return 0.0;
    }
    
    // Function to calculate a loan instalment
    //
    // paymentPeriodTypeCode            The employeee's payment period type code WEEK, BWEE, or MONT
    // capitilizationPeriodTypeCode     The capitilization period code period type code DAIL, WEEK, BWEE, MONT, or ANNU
    // principalAmount                  The amount of the loan
    // numPayments                      The total number of payments for the loan
    // annualInterestRate               The annual interest rate of the loan
    function calculateLoanInstalment($interestTypeCode, $paymentPeriodTypeCode, $capitilizationPeriodTypeCode, float $principalAmount, int $numPayments, float $annualInterestRate) : float {
        // Calculate the interest rate
        $interestRate = $annualInterestRate / 100 / 12;
        $numPaymentsPerYear = 12;
        $numCapitilizationsPerYear = 12;
        $instalmentAmount = null;
        $totalYears = 0;
        
        // Set the payments per year depending on the payment period
        if( $paymentPeriodTypeCode === 'WEEK' ) {
            $totalYears = $numPayments / 52;
            $numPaymentsPerYear = 52;
        }
        else if( $paymentPeriodTypeCode === 'BWEE' ) {
            $totalYears = $numPayments / 26;
            $numPaymentsPerYear = 26;
        }
        else if( $paymentPeriodTypeCode === 'MONT' ) {
            $totalYears = $numPayments / 12;
            $numPaymentsPerYear = 12;
        }
        
        // Set the capitilizations per year depending on the capitilization period
        if( $capitilizationPeriodTypeCode === 'DAIL' ) {
            $numCapitilizationsPerYear = 365;
        }
        else if( $capitilizationPeriodTypeCode === 'WEEK' ) {
            $numCapitilizationsPerYear = 52;
        }
        else if( $capitilizationPeriodTypeCode === 'BWEE' ) {
            $numCapitilizationsPerYear = 26;
        }
        else if( $capitilizationPeriodTypeCode === 'MONT' ) {
            $numCapitilizationsPerYear = 12;
        }
        else if( $capitilizationPeriodTypeCode === 'ANNU' ) {
            $numCapitilizationsPerYear = 1;
        }
        
        // Calculate the total number of monthly payments
        $totalMonthlyPayments = $numPayments;
        if( $paymentPeriodTypeCode !== 'MONT') {
            $totalMonthlyPayments = $numPayments / $numPaymentsPerYear * 12;
        }
        
        // Calculate the number of payments per month
        $paymentsPerMonth = ($numPaymentsPerYear / 12);
        
        // Is there interest to be calculated?
        if( $annualInterestRate > 0.009 ) {
            // Depending on the interest type
            if( $interestTypeCode === 'COMP' ) {
                // Does the number of payments per year not match up with the number of capitilizations per year?
                if( $numCapitilizationsPerYear !== $numPaymentsPerYear ) {
                    // Convert a nominal interest rate from one compounding frequency to another while keeping the effective interest rate constant. Formula:
                    // INTEREST RATE = NUMBER PAYMENTS P/Y * ( 1 + ANNUAL INTEREST RATE / NUMBER PAYMENTS P/Y ) ^ NUMBER CAPITILIZATIONS P/Y / NUMBER PAYMENTS P/Y - 1 )
                    $interestRate = $numPaymentsPerYear * (pow(1 + (($annualInterestRate / 100 ) / $numCapitilizationsPerYear), $numCapitilizationsPerYear / $numPaymentsPerYear ) - 1) / 12;
                }
                
                // The formula for calculating monthly loan instalments with annual compound interest on a monthly basis:
                //                                  INTEREST P/M * ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS)
                // INSTALMENT = PRINCIPAL AMOUNT * --------------------------------------------------------------
                //                                      ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS) - 1
                $value1 = ($interestRate / $paymentsPerMonth) * pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth));
                $value2 = pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth)) - 1;
                $instalmentAmount = $principalAmount * ($value1 / $value2);
            }
            else if( $interestTypeCode === 'SIMP' ) {
                // Calculate the simple interest instalment
                $instalmentAmount = ($principalAmount + ($principalAmount * ($annualInterestRate / 100) * $totalYears)) / $numPayments;
            }
        }
        else {
            // Calculate no interest instalment
            $instalmentAmount = ( $principalAmount / $numPayments );
        }
        
        return $instalmentAmount;
    }
    
    // Function to calculate a loan amortization
    //
    // paymentPeriodTypeCode            The employeee's payment period type code WEEK, BWEE, or MONT
    // capitilizationPeriodTypeCode     The capitilization period code period type code DAIL, WEEK, BWEE, MONT, or ANNU
    // principalAmount                  The amount of the loan
    // numPayments                      The total number of payments for the loan
    // annualInterestRate               The annual interest rate of the loan
    function getLoanAmortization($interestTypeCode, $paymentPeriodTypeCode, $capitilizationPeriodTypeCode, float $principalAmount, int $numPayments, float $annualInterestRate) {
        // Calculate the interest rate
        $interestRate = $annualInterestRate / 100 / 12;
        $numPaymentsPerYear = 12;
        $numCapitilizationsPerYear = 12;
        $instalmentAmount = null;
        $totalYears = 0;
        $amortizationTable = [];
        
        // Set the payments per year depending on the payment period
        if( $paymentPeriodTypeCode === 'WEEK' ) {
            $totalYears = $numPayments / 52;
            $numPaymentsPerYear = 52;
        }
        else if( $paymentPeriodTypeCode === 'BWEE' ) {
            $totalYears = $numPayments / 26;
            $numPaymentsPerYear = 26;
        }
        else if( $paymentPeriodTypeCode === 'MONT' ) {
            $totalYears = $numPayments / 12;
            $numPaymentsPerYear = 12;
        }
        
        // Set the capitilizations per year depending on the capitilization period
        if( $capitilizationPeriodTypeCode === 'DAIL' ) {
            $numCapitilizationsPerYear = 365;
        }
        else if( $capitilizationPeriodTypeCode === 'WEEK' ) {
            $numCapitilizationsPerYear = 52;
        }
        else if( $capitilizationPeriodTypeCode === 'BWEE' ) {
            $numCapitilizationsPerYear = 26;
        }
        else if( $capitilizationPeriodTypeCode === 'MONT' ) {
            $numCapitilizationsPerYear = 12;
        }
        else if( $capitilizationPeriodTypeCode === 'ANNU' ) {
            $numCapitilizationsPerYear = 1;
        }
                
        // Calculate the total number of monthly payments
        $totalMonthlyPayments = $numPayments;
        if( $paymentPeriodTypeCode !== 'MONT') {
            $totalMonthlyPayments = $numPayments / $numPaymentsPerYear * 12;
        }
        
        // Calculate the number of payments per month
        $paymentsPerMonth = ($numPaymentsPerYear / 12);
        
        // Is there interest to be calculated?
        if( $annualInterestRate > 0.009 ) {
            // Depending on the interest type
            if( $interestTypeCode === 'COMP' ) {
                // Does the number of payments per year not match up with the number of capitilizations per year?
                if( $numCapitilizationsPerYear !== $numPaymentsPerYear ) {
                    // Convert a nominal interest rate from one compounding frequency to another while keeping the effective interest rate constant. Formula:
                    // INTEREST RATE = NUMBER PAYMENTS P/Y * ( 1 + ANNUAL INTEREST RATE / NUMBER PAYMENTS P/Y ) ^ NUMBER CAPITILIZATIONS P/Y / NUMBER PAYMENTS P/Y - 1 )
                    $interestRate = $numPaymentsPerYear * (pow(1 + (($annualInterestRate / 100 ) / $numCapitilizationsPerYear), $numCapitilizationsPerYear / $numPaymentsPerYear ) - 1) / 12;
                }
                
                // The formula for calculating monthly loan instalments with annual compound interest on a monthly basis:
                //                                  INTEREST P/M * ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS)
                // INSTALMENT = PRINCIPAL AMOUNT * --------------------------------------------------------------
                //                                      ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS) - 1
                $value1 = ($interestRate / $paymentsPerMonth) * pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth));
                $value2 = pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth)) - 1;
                $instalmentAmount = $principalAmount * ($value1 / $value2);
                
                // Create the amortization table
                $balance = $principalAmount;
                for( $i = 0; $i < ($totalMonthlyPayments * $paymentsPerMonth); $i++ ) {
                    $interest = $balance * ($interestRate / $paymentsPerMonth);
                    
                    $amortizationTable[] = [
                        'openingBalance' => $balance,
                        'interest' => $interest,
                        'capital' => $instalmentAmount - $interest,
                        'closingBalance' => $balance + $interest - $instalmentAmount
                    ];
                    
                    $balance = $balance + $interest - $instalmentAmount;
                }
            }
            else if( $interestTypeCode === 'SIMP' ) {
                // Calculate the simple interest instalment
                $instalmentAmount = ($principalAmount + ($principalAmount * ($annualInterestRate / 100) * $totalYears)) / $numPayments;
                
                // Create the amortization table
                $balance = $principalAmount;
                for( $i = 0; $i < $numPayments; $i++ ) {
                    $interest = $principalAmount * (($annualInterestRate / 100) * $totalYears) / $numPayments;
                    
                    $amortizationTable[] = [
                        'openingBalance' => $balance,
                        'interest' => $interest,
                        'capital' => $instalmentAmount - $interest,
                        'closingBalance' => $balance + $interest - $instalmentAmount
                    ];
                    
                    $balance = $balance + $interest - $instalmentAmount;
                }
            }
        }
        else {
            // Calculate no interest instalment
            $instalmentAmount = ( $principalAmount / $numPayments );
            
            // Create the amortization table
            $balance = $principalAmount;
            for( $i = 0; $i < $numPayments; $i++ ) {
                $interest = 0.00;
                
                $amortizationTable[] = [
                    'openingBalance' => $balance,
                    'interest' => $interest,
                    'capital' => $instalmentAmount - $interest,
                    'closingBalance' => $balance + $interest - $instalmentAmount
                ];
                
                $balance = $balance + $interest - $instalmentAmount;
            }
        }
        
        return $amortizationTable;
    }
    
    // Function to calculate the loan amortization for a specified payment
    //
    // paymentNum                       The number of the payment for which the loan amortization should be calculated
    // paymentPeriodTypeCode            The employeee's payment period type code WEEK, BWEE, or MONT
    // capitilizationPeriodTypeCode     The capitilization period code period type code DAIL, WEEK, BWEE, MONT, or ANNU
    // principalAmount                  The amount of the loan
    // numPayments                      The total number of payments for the loan
    // annualInterestRate               The annual interest rate of the loan
    function getLoanPaymentAmortization($paymentNum, $interestTypeCode, $paymentPeriodTypeCode, $capitilizationPeriodTypeCode, float $principalAmount, int $numPayments, float $annualInterestRate) {
        // Calculate the interest rate
        $interestRate = $annualInterestRate / 100 / 12;
        $numPaymentsPerYear = 12;
        $numCapitilizationsPerYear = 12;
        $instalmentAmount = null;
        $totalYears = 0;
        $amortizationDetails = null;
        
        // Set the payments per year depending on the payment period
        if( $paymentPeriodTypeCode === 'WEEK' ) {
            $totalYears = $numPayments / 52;
            $numPaymentsPerYear = 52;
        }
        else if( $paymentPeriodTypeCode === 'BWEE' ) {
            $totalYears = $numPayments / 26;
            $numPaymentsPerYear = 26;
        }
        else if( $paymentPeriodTypeCode === 'MONT' ) {
            $totalYears = $numPayments / 12;
            $numPaymentsPerYear = 12;
        }
        
        // Set the capitilizations per year depending on the capitilization period
        if( $capitilizationPeriodTypeCode === 'DAIL' ) {
            $numCapitilizationsPerYear = 365;
        }
        else if( $capitilizationPeriodTypeCode === 'WEEK' ) {
            $numCapitilizationsPerYear = 52;
        }
        else if( $capitilizationPeriodTypeCode === 'BWEE' ) {
            $numCapitilizationsPerYear = 26;
        }
        else if( $capitilizationPeriodTypeCode === 'MONT' ) {
            $numCapitilizationsPerYear = 12;
        }
        else if( $capitilizationPeriodTypeCode === 'ANNU' ) {
            $numCapitilizationsPerYear = 1;
        }
                
        // Calculate the total number of monthly payments
        $totalMonthlyPayments = $numPayments;
        if( $paymentPeriodTypeCode !== 'MONT') {
            $totalMonthlyPayments = $numPayments / $numPaymentsPerYear * 12;
        }
        
        // Calculate the number of payments per month
        $paymentsPerMonth = ($numPaymentsPerYear / 12);
        
        // Is there interest to be calculated?
        if( $annualInterestRate > 0.009 ) {
            // Depending on the interest type
            if( $interestTypeCode === 'COMP' ) {
                // Does the number of payments per year not match up with the number of capitilizations per year?
                if( $numCapitilizationsPerYear !== $numPaymentsPerYear ) {
                    // Convert a nominal interest rate from one compounding frequency to another while keeping the effective interest rate constant. Formula:
                    // INTEREST RATE = NUMBER PAYMENTS P/Y * ( 1 + ANNUAL INTEREST RATE / NUMBER PAYMENTS P/Y ) ^ NUMBER CAPITILIZATIONS P/Y / NUMBER PAYMENTS P/Y - 1 )
                    $interestRate = $numPaymentsPerYear * (pow(1 + (($annualInterestRate / 100 ) / $numCapitilizationsPerYear), $numCapitilizationsPerYear / $numPaymentsPerYear ) - 1) / 12;
                }
                
                // The formula for calculating monthly loan instalments with annual compound interest on a monthly basis:
                //                                  INTEREST P/M * ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS)
                // INSTALMENT = PRINCIPAL AMOUNT * --------------------------------------------------------------
                //                                      ((1 + INTEREST P/M) ^ TOTAL MONTHLY PAYMENTS) - 1
                $value1 = ($interestRate / $paymentsPerMonth) * pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth));
                $value2 = pow((1 + ($interestRate / $paymentsPerMonth)), ($totalMonthlyPayments * $paymentsPerMonth)) - 1;
                $instalmentAmount = $principalAmount * ($value1 / $value2);
                
                // Create the amortization table
                $balance = $principalAmount;
                for( $i = 0; $i < ($totalMonthlyPayments * $paymentsPerMonth); $i++ ) {
                    $interest = $balance * ($interestRate / $paymentsPerMonth);
                    
                    // Is it the correct payment number?
                    if( ($i + 1) === $paymentNum ) {
                        $amortizationDetails = [
                            'openingBalance' => $balance,
                            'interest' => $interest,
                            'capital' => $instalmentAmount - $interest,
                            'closingBalance' => $balance + $interest - $instalmentAmount
                        ];
                        break;
                    }
                    
                    $balance = $balance + $interest - $instalmentAmount;
                }
            }
            else if( $interestTypeCode === 'SIMP' ) {
                // Calculate the simple interest instalment
                $instalmentAmount = ($principalAmount + ($principalAmount * ($annualInterestRate / 100) * $totalYears)) / $numPayments;
                
                // Create the amortization table
                $balance = $principalAmount;
                for( $i = 0; $i < $numPayments; $i++ ) {
                    $interest = $principalAmount * (($annualInterestRate / 100) * $totalYears) / $numPayments;
                    
                    // Is it the correct payment number?
                    if( ($i + 1) === $paymentNum ) {
                        $amortizationDetails = [
                            'openingBalance' => $balance,
                            'interest' => $interest,
                            'capital' => $instalmentAmount - $interest,
                            'closingBalance' => $balance + $interest - $instalmentAmount
                        ];
                        break;
                    }
                    
                    $balance = $balance + $interest - $instalmentAmount;
                }
            }
        }
        else {
            // Calculate no interest instalment
            $instalmentAmount = ( $principalAmount / $numPayments );
            
            // Create the amortization table
            $balance = $principalAmount;
            for( $i = 0; $i < $numPayments; $i++ ) {
                $interest = 0.00;
                
                // Is it the correct payment number?
                if( ($i + 1) === $paymentNum ) {
                    $amortizationDetails = [
                        'openingBalance' => $balance,
                        'interest' => $interest,
                        'capital' => $instalmentAmount - $interest,
                        'closingBalance' => $balance + $interest - $instalmentAmount
                    ];
                    break;
                }
                
                $balance = $balance + $interest - $instalmentAmount;
            }
        }
        
        return $amortizationDetails;
    }
    
    // Function to calculate PAYE for a given date and amount
    //
    // date             The date to use when doing the calculations.
    // age              The age of the employee.
    // amount           The taxable income of the employee.
    function calculatePaye(DateTime $date, int $age, float $amount) : float {
        global $payeTable;
        
        // Find the tables to use according to date
        $yearTable = null;
        for( $i = 0; $i < count($payeTable); $i++ ) {
            if( $date >= $payeTable[$i]['start'] && $date <= $payeTable[$i]['end'] ) {
                $yearTable = $payeTable[$i];
                break;
            }
        }
        if( $yearTable === null ) return 0.0;
        
        // Find the amount in the table at tableIndex and use it to calculate the tax
        $scale = null;
        for( $i = 0; $i < count($yearTable['paye']); $i++ ) {
            $scale = $yearTable['paye'][$i];
            if( $amount <= $scale['max'] ) break;
        }
        if( $scale === null ) return 0.0;
        
        // Calculate tax
        $paye = $scale['fixed'];
        $paye = $paye + (($amount - $scale['adjustment']) / 100.0 * $scale['percentage']);
        
        // Calculate rebate
        if( $age < 65 ) $paye = $paye - $yearTable['rebate']['primary'];
        else if( $age >= 65 && $age < 75 ) $paye = $paye - $yearTable['rebate']['primary'] - $yearTable['rebate']['secondary'];
        else if( $age >= 75 ) $paye = $paye - $yearTable['rebate']['primary'] - $yearTable['rebate']['secondary'] - $yearTable['rebate']['tertiary'];
        
        // Tax should not be less than 0
        if( $paye < 0.0 ) $paye = 0.0;
        
        return round($paye, 2);
    }
    
    // Function to calculate PAYE average given all the preceding payslips for a given tax year
    //
    // date                 The date to use when doing the calculations.
    // age                  The age of the employee.
    // ytdTaxableIncome     The taxable income of the employee for the entire tax year.
    // periodsWorked        The the number of periods worked in given tax year.
    // totalPeriods         The toal number of periods in the tax year.
    // ytdTaxLiability      The amount of the tax already paid
    function calculateAveragePaye(DateTime $date, int $age, int $periodsWorked, int $totalPeriods, float $ytdTaxableIncome, float $ytdTaxLiability) : float {
        // Calculate the annual equivalent income
        $annualEquivalentIncome = 0;
        if( $periodsWorked > 0 ) {
            $annualEquivalentIncome = $ytdTaxableIncome / $periodsWorked * $totalPeriods;
        }
        else {
            return 0.0;
        }
        
        // Calculate the the PAYE amount for the annual equivalent income
        $annualEquivalentTax = \PayslipUtil\calculatePaye($date, $age, $annualEquivalentIncome);
        
        // Calculate the tax liability
        $paye = (($annualEquivalentTax / $totalPeriods * $periodsWorked) - $ytdTaxLiability);
        
        return round($paye, 2);
    }
    
    // Function to get the next payment date for a monthly payment period.  If the day is larger than 28 the function will
    // calculate how many days before the end of the month the date is and return the next period so many days from the end of
    // next month.
    //
    // date             A DateTime object giving the date to use when calculating the next payment date.
    // return           The next payment date as a DateTime object  
    function getNextMonthlyPaymentDate(DateTime $date, int $paymentPeriodEndDay) : DateTime {
        $returnDate = new DateTime( $date->format('Y-m-d') );
        
        if( $paymentPeriodEndDay >= 1 && $paymentPeriodEndDay <= 28 ) {
            // Payslips runs to the given day (1 - 28)
            $returnDate->setDate(intval($returnDate->format('Y')), intval($returnDate->format('m')) + 1, $paymentPeriodEndDay);
        }
        else {
            // Payslips are running from the first day of the month to the last day of the month
            $returnDate->setDate(intval($returnDate->format('Y')), intval($returnDate->format('m')) + 1, 1);
            $returnDate->setDate(intval($returnDate->format('Y')), intval($returnDate->format('m')), intval($returnDate->format('t')));
        }
        
        return $returnDate;
    }
    
    // Function to get the payment start date from its payment date for a monthly payslip.
    //
    // date             A DateTime object giving the payment date to use when calculating the payslip start date.
    // return           The payslip start date.
    function getMonthlyPayslipStartDate(DateTime $date) : DateTime {
        // Get the payslip start date
        $startDate = new DateTime( $date->format('Y-m-d') );
        
        if( intval($startDate->format('d')) === intval($startDate->format('t')) ) {
            $startDate->setDate($startDate->format('Y'), intval($startDate->format('m')), 1);
        }
        else {
            $startDate->setDate($startDate->format('Y'), intval($startDate->format('m')) - 1, intval($startDate->format('d')) + 1);
        }
        
        return $startDate;
    }
    
    // Function to get the payslip period from its payment date for a monthly payslip.
    //
    // date             A DateTime object giving the payment date to use when calculating the payslip period.
    // return           The period this payslip is for.
    function getMonthlyPayslipPeriod(DateTime $date) : int {
        // Subtract two from the current month to align with SARS year (which starts in March)
        $period = intval($date->format('n')) - 2;
        if( $period <= 0 ) $period = $period + 12;
        
        return $period;
    }

    // Function to get the payslip period from its payment date for a monthly payslip for new employees.
    //
    // date             A DateTime object giving the payment date to use when calculating the payslip period.
    // return           The period this payslip is for.
    function getMonthlyPayslipPeriodNewEmployee(DateTime $date, DateTime $employmentDate) : int {
        // Subtract employment date from payment date
        // $date1 = strtotime($employmentDate->format('o-m-d'));
        // $date2 = strtotime($date->format('o-m-d'));;

        // // Calculate difference in months
        // $months = (date("Y", $date2) - date("Y", $date1)) * 12 + (date("m", $date2) - date("m", $date1));

        // error_log('Total months: ' . $months);
        // $period = $months + 1;

        // if( $period <= 0 ) $period = 1;

        // Calculate the difference in years and months
        $yearPeriod = intval($date->format('Y')) - intval($employmentDate->format('Y'));
        $monthPeriod = intval($date->format('n')) - intval($employmentDate->format('n'));

        // Convert year difference into months and add to month difference
        $period = ($yearPeriod * 12) + $monthPeriod + 1; // Add 1 to ensure first month is counted as 1

        return $period;

    }

    
    // Function to get the next payment date for a weekly payment period. 
    //
    // date             A DateTime object giving the date to use when calculating the next payment date.
    // return           The next payment date as a DateTime object  
    function getNextWeeklyPaymentDate(DateTime $date, int $dayOfWeek) : DateTime {
        $returnDate = new DateTime( $date->format('Y-m-d') );
        $returnDate->modify('+7 days');
        
        while( $date < $returnDate ) {
            $date->modify('+1 day');
            if( $date->format('w') == $dayOfWeek ) {
                $returnDate = $date;
                break;
            }
        }
        
        return $returnDate;
    }
    
    // Function to get the payment start date from its payment date for a weekly payslip.
    //
    // date             A DateTime object giving the payment date to use when calculating the payslip start date.
    // return           The payslip start date.
    function getWeeklyPayslipStartDate(DateTime $date) : DateTime {
        // Get the payslip start date
        $startDate = new DateTime( $date->format('Y-m-d') );
        
        // Get the next weekly payment date and subtract six days
        $startDate->modify('-6 days');
        
        return $startDate;
    }
    
    // // Function to get the payslip period from its payment date for a weekly payslip.
    // //
    // // date             A DateTime object giving the payment date to use when calculating the payslip period.
    // // return           The period this payslip is for.
    // function getWeeklyPayslipPeriod(DateTime $date, int $dayOfWeek) : int {
    //     // Set the end date
    //     $endDate = new DateTime( $date->format('Y-m-d') );
    //     $endDate->setTime(23, 59, 59);
        
    //     // Set the start date to the beginning of the SARS tax year
    //     $startDate = new DateTime( ($endDate->format('Y') . '03' . '01') );
        
    //     // Make sure we remain in the current tax year
    //     if( intval($endDate->format('n')) < 3 ) { 
    //         $startDate->modify('-1 year');
    //     }
    //     $startDate->setTime(0, 0, 0);
        
    //     // Count periods backwards from the pay date to the start of the tax year
    //     $period = 0;
    //     while( $endDate > $startDate ) {
    //         $endDate->modify('-7 days');
    //         $period++;
    //     }
        
    //     return $period;
    // }
    
    // Function to get the number of payment periods in the given tax year for bweekly payslips.
    //
    // date                 A DateTime object giving the last day of the tax year or the employee's end date
    // baseDate             A DateTime object giving the last last payment date, or the employee's start date
    // dayOfWeek            An integer value indicating the day of the week (0 to 13)
    // return               The number of payment periods in the tax year
    function getWeeklyPayslipPeriod(DateTime $date, DateTime $baseDate, int $dayOfWeek) : int {
        // Set the end date
        $endDate = new DateTime( $date->format('Y-m-d') );
        $endDate->setTime(23, 59, 59);
        
        // Set the start date to the beginning of the SARS tax year
        $startDate = new DateTime( ($endDate->format('Y') . '03' . '01') );
        
        // Make sure we remain in the current tax year
        if( intval($endDate->format('n')) < 3 ) { 
            $startDate->modify('-1 year');
        }
        $startDate->setTime(0, 0, 0);
        
        // Make certain the last payslip end date is before the start of the tax year
        $payslipEndDate = new DateTime( $baseDate->format('Y-m-d') );
        while( $payslipEndDate >= $startDate ) {
            $payslipEndDate->modify('-7 days');
        }
        
        // Get the next bi-weekly payment date based from the employment start date
        $payslipEndDate = \PayslipUtil\getNextWeeklyPaymentDate($payslipEndDate, $dayOfWeek);
        
        // Calculate the number of periods in the tax year
        $period = 0;
        while( $payslipEndDate < $endDate ) {
            // Is the period in the SARS tax year?
            if( $payslipEndDate >= $startDate ) {
                $period++;
            }
            
            // Get the next payment date
            $payslipEndDate = \PayslipUtil\getNextWeeklyPaymentDate($payslipEndDate, $dayOfWeek);
        }
        
        // Return the counted periods
        return $period;
    }
    
    // Function to get the next payment date for a bi-weekly payment period. 
    //
    // date             A DateTime object giving the date to use when calculating the next payment date.
    // return           The next payment date as a DateTime object  
    function getNextBiWeeklyPaymentDate(DateTime $date, int $dayOfWeek) : DateTime {
        $returnDate = new DateTime( $date->format('Y-m-d') );
        $returnDate->modify('+14 days');
        
// file_put_contents('php://stderr', print_r(("\n" . 'date: ' . $date->format('Y-m-d')), TRUE));
        
        // Determine whether the payment date is in the first or second week
        $targetWeek = 2;
        if( $dayOfWeek > 6 ) {
            // $targetWeek = 2;
            $dayOfWeek -= 7;
        }
        
        $dayCount = 0;
        $numWeeksCounted = 0;
        while( $date < $returnDate ) {
            // Go to the next day
            $date->modify('+1 day');
            $dayCount++;
            
            // Was the day found?
            if( $date->format('w') == $dayOfWeek ) {
                // Add a week
                $numWeeksCounted++;
                
                // Have the correct number of weeks been counted?
                if( $numWeeksCounted >= $targetWeek ) {
                    $returnDate = $date;
                    break;
                }
            }
        }
        
        return $returnDate;
    }
    
    // Function to get the payment start date from its payment date for a weekly payslip.
    //
    // date             A DateTime object giving the payment date to use when calculating the payslip start date.
    // return           The payslip start date.
    function getBiWeeklyPayslipStartDate(DateTime $date) : DateTime {
        // Get the payslip start date
        $startDate = new DateTime( $date->format('Y-m-d') );
        
        // Get the next weekly payment date and subtract 13 days
        $startDate->modify('-13 days');
        
        return $startDate;
    }
    
    // // Function to get the payslip period from its payment date for a bi-weekly payslip.
    // //
    // // date             A DateTime object giving the payment date to use when calculating the payslip period.
    // // return           The period this payslip is for.
    // function getBiWeeklyPayslipPeriod(DateTime $date, int $dayOfWeek) : int {
    //     // Set the end date
    //     $endDate = new DateTime( $date->format('Y-m-d') );
    //     $endDate->setTime(23, 59, 59);
        
    //     // Set the start date to the beginning of the SARS tax year
    //     $startDate = new DateTime( ($endDate->format('Y') . '03' . '01') );
    //     // $startDate->modify('-13 days');
        
    //     // Make sure we remain in the current tax year
    //     if( intval($endDate->format('n')) < 3 ) { 
    //         $startDate->modify('-1 year');
    //     }
    //     $startDate->setTime(0, 0, 0);
        
    //     // Count periods backwards from the pay date to the start of the tax year
    //     $period = 0;
    //     while( $endDate > $startDate ) {
    //         $endDate->modify('-14 days');
    //         $period++;
    //     }
        
    //     // Return the counted periods
    //     return $period;
    // }
    
    // Function to get the number of payment periods in the given tax year for bi-weekly payslips.
    //
    // date                 A DateTime object giving the last day of the tax year or the employee's end date
    // baseDate             A DateTime object giving the last last payment date, or the employee's start date
    // dayOfWeek            An integer value indicating the day of the week (0 to 13)
    // return               The number of payment periods in the tax year
    function getBiWeeklyPayslipPeriod(DateTime $date, DateTime $baseDate, int $dayOfWeek) : int {
        // Set the end date
        $endDate = new DateTime( $date->format('Y-m-d') );
        $endDate->setTime(23, 59, 59);
        
        // Set the start date to the beginning of the SARS tax year
        $startDate = new DateTime( ($endDate->format('Y') . '03' . '01') );
        
        // Make sure we remain in the current tax year
        if( intval($endDate->format('n')) < 3 ) { 
            $startDate->modify('-1 year');
        }
        $startDate->setTime(0, 0, 0);
        
        // Make certain the last payslip end date is before the start of the tax year
        $payslipEndDate = new DateTime( $baseDate->format('Y-m-d') );
        while( $payslipEndDate >= $startDate ) {
            $payslipEndDate->modify('-14 days');
        }
        
        // Get the next bi-weekly payment date based from the employment start date
        $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $dayOfWeek);
        
        // Calculate the number of periods in the tax year
        $period = 0;
        while( $payslipEndDate < $endDate ) {
            // Is the period in the SARS tax year?
            if( $payslipEndDate >= $startDate ) {
                $period++;
            }
            
            // Get the next payment date
            $payslipEndDate = \PayslipUtil\getNextBiWeeklyPaymentDate($payslipEndDate, $dayOfWeek);
        }
        
        // Return the counted periods
        return $period;
    }
    
    // Function to calculate all calculateable items on a payslip.
    function calculatePayslipItems( &$payslip ) : bool {
        $taxableIncome = 0.0;
        $commissionIncome = 0.0;
        $nonTaxableIncome = 0.0;
        
        // Calculate the number of pay periods in the tax year
        $periodMultiplier = 0;
        if( $payslip['taxPeriod']['type'] === 'MONT' ) {
            $periodMultiplier = 12;
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
            // $isLeapYear = ((($taxYearEnd->format('Y') % 4) == 0) && ((($taxYearEnd->format('Y') % 100) != 0) || (($taxYearEnd->format('Y') %400) == 0)));
            // $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 2, ($isLeapYear ? 29 : 28));
            
            // Get the number of payment periods in the specified tax year
            $periodMultiplier = getWeeklyPayslipPeriod($taxYearEnd, new DateTime($payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
            // $periodMultiplier = 52;
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
            // $isLeapYear = ((($taxYearEnd->format('Y') % 4) == 0) && ((($taxYearEnd->format('Y') % 100) != 0) || (($taxYearEnd->format('Y') %400) == 0)));
            // $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 2, ($isLeapYear ? 29 : 28));
            
            // Get the number of payment periods in the specified tax year
            $periodMultiplier = getBiWeeklyPayslipPeriod($taxYearEnd, new DateTime($payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
            // $periodMultiplier = 26;
        }
        
        // Loop through all items and calculate the provident fund amounts
        for( $i = 0; $i < count($payslip['items']); $i++ ) {
            // Skip the item if it is NOT a provident fund item
            if( ($payslip['items'][$i]['type']['code'] !== '2006') && ($payslip['items'][$i]['type']['code'] !== '4002') ) continue;
            
            // Skip the item if there is no provident fund id or the item should not be auto-calculated
            if( ($payslip['items'][$i]['providentFund']['id'] === null) || ($payslip['items'][$i]['autoCalculate'] !== true) ) continue;
            
            // Calculate provident fund amounts
            $amount = 0.00;
            
            // Are there retirement fund income items?
            if( (count($payslip['items'][$i]['providentFund']['rfiItems']) > 0) ) {
                // For every retirement fund income item
                foreach( $payslip['items'][$i]['providentFund']['rfiItems'] as $rfiItem ) {
                    // For all the items on the payslip
                    $rfiItemAmount = 0.00;
                    for( $j = 0; $j < count($payslip['items']); $j++ ) {
                        // Was the retirement fund income type found?
                        if( $rfiItem['payslipItemTypeCode'] === $payslip['items'][$j]['type']['code'] ) {
                            // Calculate the amount as a percentage of the income
                            $rfiItemAmount = $payslip['items'][$j]['amount'] / 100 * $rfiItem['percentage'];
                            break;
                        }
                    }
                    
                    // Calculate the total of all retirement fund income amounts
                    $amount = $amount + $rfiItemAmount;
                }
                
                // Is it the employee contribution item?
                if( $payslip['items'][$i]['type']['code'] === '2006' ) {
                    $amount = $amount / 100 * $payslip['items'][$i]['providentFund']['employeeAmount'];
                }
                else {
                    $amount = $amount / 100 * $payslip['items'][$i]['providentFund']['employerAmount'];
                }
            }
            
            // Set the provident fund item amount
            $payslip['items'][$i]['amount'] = round($amount, 2);
        }
        
        // Are there no pay periods?
        if( $periodMultiplier <= 0 ) {
            return false;
        }
        
        // Loop through all items and calculate taxable and non taxable income
        $totalIncome = 0;
        $totalOnceOffIncome = 0;
        $totalFringeBenefits = 0;
        $totalAllowances = 0;
        $rtfDeduction = 0;
        $travelAllowanceDeduction = 0;
        foreach( $payslip['items'] as $item ) {
            // If the amount is null, skip it
            if( $item['amount'] === null ) continue;
            
            if( $item['type']['code'] === '1000' ) {                // Salary
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1001' ) {           // Hourly Wage
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1002' ) {           // Daily Wage
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1003' ) {           // Commission
                $taxableIncome = $taxableIncome + $item['amount'];
                $commissionIncome = $commissionIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1004' ) {           // Annual Payment
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalOnceOffIncome = $totalOnceOffIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1005' ) {           // Overtime
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '2005' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '2006' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '2007' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4000' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4001' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4002' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4003' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4004' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4005' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4006' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4007' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4008' ) {
                // $taxableIncome = $taxableIncome + $item['amount']; // Tax exempt
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4009' ) {
                // $taxableIncome = $taxableIncome + $item['amount']; // Tax exempt
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '5000' ) {
                // Only 80% of travel allowance is taxable but the full aloownace amount is used for
                // claculating SDL and UIF
                $travelAllowanceDeduction = $travelAllowanceDeduction + ($item['amount'] * 0.2);
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5001' ) {
                if( $item['units'] !== null ) {
                    $taxableIncome = $taxableIncome + $item['amount'];
                    $totalAllowances = $totalAllowances + $item['amount'];
                    $taxThreshold = getTravelAllowancePrescribedRate( new DateTime( $payslip['toDate'] ) ) * $item['units'];
                    
                    if( $item['amount'] > $taxThreshold ) {
                        $travelAllowanceDeduction = $travelAllowanceDeduction + $taxThreshold; // ($item['amount'] - $taxThreshold);
                        // $nonTaxableIncome = $nonTaxableIncome + $taxThreshold;
                    }
                    else {
                        $travelAllowanceDeduction = $travelAllowanceDeduction + $item['amount'];
                        $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                    }
                }
            }
            else if( $item['type']['code'] === '5002' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5003' ) {
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5004' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5005' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5006' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5007' ) {
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
        }
        
        // Adjust the retirement fund total according to the cap (350,000.00 anually and no more than
        // 27.5% of income)
        if( $rtfDeduction > ($taxableIncome / 100 * 27.5) ) {
            $rtfDeduction = ($taxableIncome / 100 * 27.5);
        }
        
        if( ($rtfDeduction * $periodMultiplier) > 350000 ) {
            $rtfDeduction = (350000 / $periodMultiplier);
        }
        
        // Make sure taxable income is not less than 0.
        if( $taxableIncome < 0.0 ) $taxableIncome = 0.0;
        
        // Subtract the retirment fund deduction allowed from the taxable income
        $payeIncome = $taxableIncome - $rtfDeduction - $travelAllowanceDeduction;
        
        // Make sure PAYE income is not less than 0.
        if( $payeIncome < 0.0 ) $payeIncome = 0.0;
        
        // Calculate UIF, SDL and PAYE on total income
        $totalIncome = $totalIncome + $totalOnceOffIncome + $totalFringeBenefits + $totalAllowances;
        $maxYearlyUifIncomeCap = getUifIncomeCap( new DateTime( $payslip['toDate'] ) );
        for($i = 0; $i < count($payslip['items']); $i++ ) {
            // If the auto calculate is not set then don't calculate the item
            if( $payslip['items'][$i]['autoCalculate'] !== true ) continue;
            
            if( $payslip['items'][$i]['type']['code'] === '2000' ) {
                // Calculate PAYE
                $estimatedPaye = 0;
                $onceOffPaye = 0;
                
                // Should PAYE on once off amounts be calcutaed more accurately?
                if( ($payslip['payeBonusCalculationTypeCode'] === 'ACCU') && ($totalOnceOffIncome !== 0) ) {
                    // Calculate the PAYE excluding the once-off amounts
                    $estimatedPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], ($payeIncome - $totalOnceOffIncome) * $periodMultiplier);
                    
                    // Calculate the PAYE including the once-off amounts
                    $onceOffPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], (($payeIncome - $totalOnceOffIncome) * $periodMultiplier) + $totalOnceOffIncome);
                    
                    // Calculate the PAYE more accurately
                    $onceOffPaye = ($onceOffPaye - $estimatedPaye);
                }
                else {
                    // Calculate the PAYE including the once-off amounts
                    $estimatedPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], $payeIncome * $periodMultiplier);
                }
                $payslip['items'][$i]['amount'] = round(($estimatedPaye / $periodMultiplier) + $onceOffPaye, 2);
            }
            else if( $payslip['items'][$i]['type']['code'] === '2002' ) {
                // Calculate employee UIF contribution
                $estamatedYearlyIncome = round(($totalIncome - $commissionIncome) * $periodMultiplier, 2);
                if( $estamatedYearlyIncome < $maxYearlyUifIncomeCap) {
                    $payslip['items'][$i]['amount'] = round(($totalIncome - $commissionIncome) / 100, 2);
                    if( $payslip['items'][$i]['amount'] < 0.001 ) $payslip['items'][$i]['amount'] = 0.00;
                }
                else {
                    $payslip['items'][$i]['amount'] = round($maxYearlyUifIncomeCap / $periodMultiplier / 100, 2);
                }
            }
            else if( $payslip['items'][$i]['type']['code'] === '3001' ) {
                // Calculate employer UIF contribution
                $estamatedYearlyIncome = round(($totalIncome - $commissionIncome) * $periodMultiplier, 2);
                if( $estamatedYearlyIncome < $maxYearlyUifIncomeCap) {
                    $payslip['items'][$i]['amount'] = round(($totalIncome - $commissionIncome) / 100, 2);
                    if( $payslip['items'][$i]['amount'] < 0.001 ) $payslip['items'][$i]['amount'] = 0.00;
                }
                else {
                    $payslip['items'][$i]['amount'] = round($maxYearlyUifIncomeCap / $periodMultiplier / 100, 2);
                }
            }
            else if( $payslip['items'][$i]['type']['code'] === '3002' ) {
                // Calculate employer SDL contribution
                $payslip['items'][$i]['amount'] = round($payeIncome / 100, 2);
            }
        }
        
        return true;
    }
    
    // Function to calculate and return the payslip totals
    function calculatePayslipTotals( $payslip ): array {
        $taxableIncome = 0.0;
        $commissionIncome = 0.0;
        $nonTaxableIncome = 0.0;
        $paye = 0.0;
        $onceOffPaye = 0.0;
        $sdl = 0.0;
        $employeeUif = 0.0;
        $employerUif = 0.0;
        
        // Calculate the number of pay periods in the tax year
        $periodMultiplier = 0;
        if( $payslip['taxPeriod']['type'] === 'MONT' ) {
            $periodMultiplier = 12;
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
            // $isLeapYear = ((($taxYearEnd->format('Y') % 4) == 0) && ((($taxYearEnd->format('Y') % 100) != 0) || (($taxYearEnd->format('Y') %400) == 0)));
            // $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 2, ($isLeapYear ? 29 : 28));
            
            // Get the number of payment periods in the specified tax year
            $periodMultiplier = getWeeklyPayslipPeriod($taxYearEnd, new DateTime($payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
            // $periodMultiplier = 52;
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
            // $isLeapYear = ((($taxYearEnd->format('Y') % 4) == 0) && ((($taxYearEnd->format('Y') % 100) != 0) || (($taxYearEnd->format('Y') %400) == 0)));
            // $taxYearEnd->setDate( intval($taxYearEnd->format('Y')), 2, ($isLeapYear ? 29 : 28));
            
            // Get the number of payment periods in the specified tax year
            $periodMultiplier = getBiWeeklyPayslipPeriod($taxYearEnd, new DateTime($payslip['toDate']), $payslip['employee']['paymentPeriodEndDay']);
            // $periodMultiplier = 26;
        }
        
        // Are there no pay periods?
        if( $periodMultiplier <= 0 ) {
            return [
                'taxableIncome' => 0.00,
                'regularIncome' => 0.00,
                'irregularIncome' => 0.00,
                'commissionIncome' => 0.00,
                'nonTaxableIncome' => 0.00,
                'paye' => 0.00,
                'sdl' => 0.00,
                'employeeUif' => 0.00,
                'employerUif' => 0.00
            ];
        }
        
        // Loop through all items and calculate taxable and non taxable income
        $totalIncome = 0;
        $totalOnceOffIncome = 0;
        $totalFringeBenefits = 0;
        $totalAllowances = 0;
        $rtfDeduction = 0;
        $travelAllowanceDeduction = 0;
        foreach( $payslip['items'] as $item ) {
            // If the amount is null skip it.
            if( $item['amount'] === null ) continue;
            
            if( $item['type']['code'] === '1000' ) {        // Salary
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1001' ) {   // Hourly Wage
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1002' ) {   // Daily Wage
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1003' ) {   // Commission
                $taxableIncome = $taxableIncome + $item['amount'];
                $commissionIncome = $commissionIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1004' ) {   // Annual Payment
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalOnceOffIncome = $totalOnceOffIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '1005' ) {   // Overtime
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalIncome = $totalIncome + $item['amount'];
            }
            else if( $item['type']['code'] === '2005' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '2006' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '2007' ) {
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4000' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4001' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4002' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4003' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
                $rtfDeduction = $rtfDeduction + $item['amount'];
            }
            else if( $item['type']['code'] === '4004' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4005' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4006' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4007' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4008' ) {
                // $taxableIncome = $taxableIncome + $item['amount']; // Tax exempt
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }
            else if( $item['type']['code'] === '4009' ) {
                // $taxableIncome = $taxableIncome + $item['amount']; // Tax exempt
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalFringeBenefits = $totalFringeBenefits + $item['amount'];
            }            
            else if( $item['type']['code'] === '5000' ) {
                // Only 80% of travel allowance is taxable but the full aloownace amount is used for
                // claculating SDL and UIF
                $travelAllowanceDeduction = $travelAllowanceDeduction + ($item['amount'] * 0.2);
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5001' ) {
                if( $item['units'] !== null ) {
                    $taxableIncome = $taxableIncome + $item['amount'];
                    $totalAllowances = $totalAllowances + $item['amount'];
                    $taxThreshold = getTravelAllowancePrescribedRate( new DateTime( $payslip['toDate'] ) ) * $item['units'];
                    
                    if( $item['amount'] > $taxThreshold ) {
                        $travelAllowanceDeduction = $travelAllowanceDeduction + $taxThreshold; // ($item['amount'] - $taxThreshold);
                        // $nonTaxableIncome = $nonTaxableIncome + $taxThreshold;
                    }
                    else {
                        $travelAllowanceDeduction = $travelAllowanceDeduction + $item['amount'];
                        $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                    }
                }
            }
            else if( $item['type']['code'] === '5002' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5003' ) {
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5004' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5005' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5006' ) {
                $taxableIncome = $taxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
            else if( $item['type']['code'] === '5007' ) {
                $nonTaxableIncome = $nonTaxableIncome + $item['amount'];
                $totalAllowances = $totalAllowances + $item['amount'];
            }
        }
        
        // Adjust the retirement fund total according to the cap (350,000.00 anually and no more than
        // 27.5% of income)
        if( $rtfDeduction > ($taxableIncome / 100 * 27.5) ) {
            $rtfDeduction = ($taxableIncome / 100 * 27.5);
        }
        
        if( ($rtfDeduction * $periodMultiplier) > 350000 ) {
            $rtfDeduction = (350000 / $periodMultiplier);
        }
        
        // Make sure taxable income is not less than 0.
        if( $taxableIncome < 0.0 ) $taxableIncome = 0.0;
        
        // Subtract the retirment fund deduction allowed from the taxable income
        $payeIncome = $taxableIncome - $rtfDeduction - $travelAllowanceDeduction;
        
        // Make sure PAYE income is not less than 0.
        if( $payeIncome < 0.0 ) $payeIncome = 0.0;
        
        // Calculate PAYE
        $estimatedPaye = 0;
        $onceOffPaye = 0;
        
        // Should PAYE on once off amounts be calcutaed more accurately?
        if( ($payslip['payeBonusCalculationTypeCode'] === 'ACCU') && ($totalOnceOffIncome !== 0) ) {
            // Calculate the PAYE excluding the once-off amounts
            $estimatedPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], ($payeIncome - $totalOnceOffIncome) * $periodMultiplier);
            
            // Calculate the PAYE including the once-off amounts
            $onceOffPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], (($payeIncome - $totalOnceOffIncome) * $periodMultiplier) + $totalOnceOffIncome);
            
            // Calculate the PAYE more accurately
            $onceOffPaye = ($onceOffPaye - $estimatedPaye);
        }
        else {
            // Calculate the PAYE including the once-off amounts
            $estimatedPaye = calculatePaye(new DateTime($payslip['toDate']), $payslip['employee']['age'], $payeIncome * $periodMultiplier);
        }
        $paye = round(($estimatedPaye / $periodMultiplier) + $onceOffPaye, 2);
        
        // Calculate employer SDL contribution
        $sdl = round($payeIncome / 100, 2);
        
        // Calculate employee UIF contribution
        $totalIncome = $totalIncome + $totalOnceOffIncome + $totalFringeBenefits + $totalAllowances;
        $maxYearlyUifIncomeCap = getUifIncomeCap( new DateTime( $payslip['toDate'] ) );
        $estamatedYearlyIncome = round(($totalIncome - $commissionIncome) * $periodMultiplier, 2);
        if( $estamatedYearlyIncome < $maxYearlyUifIncomeCap) {
            $employeeUif = round(($totalIncome - $commissionIncome) / 100, 2);
            if( $employeeUif < 0.001 ) $employeeUif = 0.00;
        }
        else {
            $employeeUif = round($maxYearlyUifIncomeCap / $periodMultiplier / 100, 2);
        }
        
        // Calculate employer UIF contribution
        $estamatedYearlyIncome = round(($totalIncome - $commissionIncome) * $periodMultiplier, 2);
        if( $estamatedYearlyIncome < $maxYearlyUifIncomeCap) {
            $employerUif = round(($totalIncome - $commissionIncome) / 100, 2);
            if( $employerUif < 0.001 ) $employerUif = 0.00;
        }
        else {
            $employerUif = round($maxYearlyUifIncomeCap / $periodMultiplier / 100, 2);
        }
        
        $totals = [
            'totalIncome' => round($totalIncome, 2),
            'totalOnceOffIncome' => round($totalOnceOffIncome, 2),
            'commissionIncome' => round($commissionIncome, 2),
            'taxableIncome' => round($taxableIncome, 2),
            'payeIncome' => round($payeIncome, 2),
            'commissionIncome' => round($commissionIncome, 2),
            'nonTaxableIncome' => round($nonTaxableIncome, 2),
            'paye' => $paye,
            'onceOffPaye' => $onceOffPaye,
            'sdl' => $sdl,
            'uifIncome' => round($totalIncome - $commissionIncome, 2),
            'employeeUif' => $employeeUif,
            'employerUif' => $employerUif
        ];
        
        return $totals;
    }
?>