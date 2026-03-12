<?php

class System
{
    //
    // AUTHENTICATION FUNCTIONS
    //
    
    // Function to log a user in.
    //
    // userData             Data to store for the user.
    public static function login( array $userData ) : void {
        // Set new user details
        $_SESSION['loggedIn'] = true;
        $_SESSION['userData'] = $userData;
    }
    
    // Function to get the current user
    public static function getUserData() : ?array {
        if( isset($_SESSION['userData']) ) return $_SESSION['userData'];
        
        return null;
    }
    
    // Function to save data for the user.  Any value that is passed will be stored as given to be retrieved with System::getUserData
    //
    // userData             The user data to store.
    public static function setUserData( array $userData ) : void {
        $_SESSION['userData'] = $userData;
    }
    
    // Function to check if a user is logged in or not
    public static function isLoggedIn() : bool {
        if( isset($_SESSION['loggedIn']) && $_SESSION['loggedIn'] === true ) return true;
        
        return false;
    }
    
    // Function to log a user out.
    public static function logout() : void {
        $_SESSION['loggedIn'] = false;
        unset($_SESSION['userData']);
    }
    
    
    //
    // DATABASE CONNECTION CACHE FUNCTIONS
    //
    
    public static function cacheDbConnection(string $database, string $host, string $schema) : void {
        $_SESSION['dbCache'] = [
            'database' => $database,
            'host' => $host,
            'schema' => $schema
        ];
    }
    
    
    //
    // SECURITY FUNCTIONS
    //
    
    // This function checks that a file was not accessed without going through
    // the main.php file.
    public static function denyDirectAccess() : void {
        if( !defined('INDEX_PAGE_USED') ) die('Direct access denied!');
    }
    
    
    //
    // LOG FUNCTIONS
    //
    
    public static function logError(string $msg) : void {
        $logData = date('Y-m-d H:i:s') . ' ERROR "' . $msg . '"' . PHP_EOL;
        file_put_contents(CONF_LOG_DIR . 'system.log', $logData, FILE_APPEND | LOCK_EX);
    }

    public static function logWarning(string $msg) : void {
        $logData = date('Y-m-d H:i:s') . ' WARNING "' . $msg . '"' . PHP_EOL;
        file_put_contents(CONF_LOG_DIR . 'system.log', $logData, FILE_APPEND | LOCK_EX);
    }

    public static function logAudit(string $msg) : void {
        $logData = date('Y-m-d H:i:s') . ' AUDIT "' . $msg . '"' . PHP_EOL;
        file_put_contents(CONF_LOG_DIR . 'audit.log', $logData, FILE_APPEND | LOCK_EX);
    }

    public static function logNotice(string $msg) : void {
        $logData = date('Y-m-d H:i:s') . ' NOTICE "' . $msg . '"' . PHP_EOL;
        file_put_contents(CONF_LOG_DIR . 'system.log', $logData, FILE_APPEND | LOCK_EX);
    }
    
    public static function logSecurity(string $msg) : void {
        $logData = date('Y-m-d H:i:s') . ' SECURITY "' . $msg . '"' . PHP_EOL;
        file_put_contents(CONF_LOG_DIR . 'security.log', $logData, FILE_APPEND | LOCK_EX);
    }
    
    
    //
    // INCLUDE FUNCTION
    //
        
    // Function to activate a framework module
    public static function useModule(string $moduleName) : void {
        $modulePath = CONF_SYSTEM_DIR . 'modules/' . $moduleName . '/init_module.php';
        
        // Check if the module exists
        if( file_exists($modulePath) ) {
            require_once( $modulePath );
        }
        else {
            die('Module \'' . $moduleName . '\' not found.');
        }
    }
    
    public static function includeFile(string $fileName) : void {
        require_once( CONF_INCLUDE_DIR . $fileName );
    }
}

?>