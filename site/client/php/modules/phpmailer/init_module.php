<?php
	//Make sure that this file was not accessed directly
	System::denyDirectAccess();

    // Include Mail class
    require_once( dirname(__FILE__) . '/Exception.php');
    require_once( dirname(__FILE__) . '/PHPMailer.php');
    require_once( dirname(__FILE__) . '/SMTP.php');
?>