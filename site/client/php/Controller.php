<?php

	//Make sure that this file was not accessed directly
	System::denyDirectAccess();
    
    
    //
    // CONTROLLER CLASS
    //
    
    class Controller {
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        // Function to check if a specific function in the controller requires CSRF validation.  The default function provided here
        // will return true for all names.  In order to whitelist a function the child controller should overwrite this function
        // and return false for any function name where CSRF protection should be disabled.
        //
        // function             The name of the function to check for whitelisting
        // return               True if the CSRF check is required and false if it is not
        public function requiresCSRFCheck($function) {
            if( in_array($function, $this->csrfWhitelist) === true ) return false;
            
            return true;
        }
        
        // This function checks what access level is needed to execute the given function.
        // The default function defined here will allways return CONF_AUTH_ROOT meaning root access required.
        // To change the authentication required this function must be overwritten in the child class.
        // To make a function accessable without authentication return CONF_AUTH_NONE for the function name.
        //
        // function             The name of the function to check.
        // return               The authentication level required to access the function specified by $function.
        public function requiresAuthentication($function) {
            if( in_array($function, $this->authenticationWhitelist) === true ) return false;
            
            return true;
        }
    }
    
?>