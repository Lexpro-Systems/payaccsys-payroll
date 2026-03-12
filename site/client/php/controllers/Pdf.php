<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    
    
    //
    // USER CONTROLLER CLASS
    //
    
    class Pdf extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [
            'testPrint',
            'printPayslip'
        ];
        protected $authenticationWhitelist = [
            'isLoggedIn',
            'login',
            'resetPassword',
            'verifyResetPassword',
            'printPayslip'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to check if a user is logged in or not.
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function testPrint($data, $user, $db) {
            System::useModule('phpmailer');
            
            // Load the template
            System::includeFile('payslip_printing/PayslipPrinterDefault.php');
            
            // Create a new payslip printer
            $printer = new PayslipPrinter();
            
            // Set payslip details
            $printer->setCompanyName('Lexpro Systems');
            
            // Print the payslip
            $printer->printPayslip();
            
            // Save the file
            $printer->saveToFile(CONF_TEMP_DIR . 'test.pdf');
            
            // Send the email
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
        
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            $mail->addAddress('julian@lexpro.co.za', 'Julian');
        
            // Attachments
            $mail->addAttachment(CONF_TEMP_DIR . 'test.pdf', 'test.pdf');
        
            // Content
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Here is the subject';
            $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
            $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
        
            $mail->send();
            
            // Delete the PDF
            unlink(CONF_TEMP_DIR . 'test.pdf');
            
            echo( json_encode(['ok' => true]) );
        }
        
        // Function to make a pdf payslip without sending a email
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function printPayslip($data, $user, $db) {
            System::useModule('phpmailer');
            
            // Load the template
            System::includeFile('payslip_printing/PayslipPrinterDefault.php');
            
            // Create a new payslip printer
            $printer = new PayslipPrinter();
            
            // Set payslip details
            $printer->setCompanyName('Payaccsys Systems');
            
            $printer->setCompanyAddress('line1', 'line2', 'line3', 'line4');
            $printer->setCompanyTel('082 458 7982');
            // cell number
            // website
            $printer->setCompanyEmail('lexpro@mail');
            $printer->setEmployeeName('Ben');
            $printer->setEmployeeDepartment('IT DEPT');
            // employee ref
            $printer->setEmployeeAddress('line1', 'line2', 'line3', 'line4');
            $printer->setEmployeeCell('666');
            $printer->setEmployeeEmail('ben@mail');
            
            $printer->setEmployeePosition('Senior Programmer');
            $printer->setPayslipFromDate('2016-02-02');
            $printer->setPayslipToDate('2018-02-02');
            
            
            $printer->addPayslipItem('Income', '444', 11.33336);
            $printer->addPayslipItem('Income', '444', 11.33336);
            $printer->addPayslipItem('Income', '444', 11.33336);
            $printer->addPayslipItem('Income', '444', 11.33336);
            $printer->addPayslipItem('Income', '444', 11.33336);
            $printer->addPayslipItem('Deductions', '444', 22.6666);
            $printer->addPayslipItem('Deductions', '444', 22.6666);
            $printer->addPayslipItem('Deductions', '333', 11);
            $printer->addPayslipItem('Company Contributions', '2222', 11);
            $printer->addPayslipItem('Fringe Benefits', '777', 22);
            $printer->addPayslipItem('Allowances', '686', 22);
            $printer->addPayslipItem('Allowances', '686', 22);
            $printer->addPayslipItem('Allowances', '686', 22);
            $printer->addPayslipItem('Income', '2221122', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('Company Contributions', '3333', 22);
            $printer->addPayslipItem('type', 'des', 11);
            $printer->addPayslipItem('type', 'des', 11);
            $printer->addPayslipItem('type', 'des', 11);
            $printer->addPayslipItem('2', '222', 22);
            $printer->addPayslipItem('2', '222', 22);
            $printer->addPayslipItem('2', '222', 22);
            $printer->addPayslipItem('2', '222', 22);
            
            
            $printer->addLeaveItem('Leave', '3333', 22, 333);
            $printer->addLeaveItem('Leave', '3333', 22, 333);
            $printer->addLeaveItem('Leave', '3333', 22, 333);
            $printer->addLeaveItem('Leave', '3333', 22, 333);
            
            // Print the payslip
            $printer->printPayslip();
            
            // Save the file
            $printer->saveToFile(CONF_TEMP_DIR . 'test.pdf');
        }
    }
?>
