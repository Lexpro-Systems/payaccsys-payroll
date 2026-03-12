<?php

	//
    // INITIALIZE ENVIRONMENT
    //
		
        // Define index check.  If this is not defined then the user skipped the index page.
        define('INDEX_PAGE_USED', 'Yes');
        
        // Load system config
        require_once('config/config_system.php');
        
        // Load framework files
        include(CONF_SYSTEM_DIR . 'System.php');
        include(CONF_SYSTEM_DIR . 'Controller.php');
		include(CONF_SYSTEM_DIR . 'Security.php');
		include(CONF_SYSTEM_DIR . 'Session.php');
        include(CONF_SYSTEM_DIR . 'Json.php');
        

    //
    // PRE ROUTING PHASE
    //
    // In this phase the controller and its function is loaded.  The controller function will only be executed after passing the security phase
    //
        
        // Check the controller called
        if( isset( $_GET['c'] ) ) $controller = $_GET['c'];
        else $controller = CONF_DEFAULT_CONTROLLER;
        
        // Check the function called on the controller
        if( isset( $_GET['fn'] ) ) $function = $_GET['fn'];
        else $function = CONF_DEFAULT_FUNCTION;
        
        // Check that the controller exist
        if( !file_exists( CONF_CONTROLLER_DIR . $controller . CONF_CONTROLLER_EXTENSION ) ) {
            die('Controller not found.');
        }
        
        // Load the controller
        include(CONF_CONTROLLER_DIR . $controller . CONF_CONTROLLER_EXTENSION);
        
        // Create new controller
        $newController = new $controller;
        
        // Make sure the controller has the member function.
        $rc = new ReflectionClass($controller);
        if( !$rc->hasMethod($function) ) die('Controller \'' . $controller . '\' has no \'' . $function . '\' function');
        
        // Check if the function requires CSRF protection
        $requiresCsrfCheck = $rc->getMethod('requiresCSRFCheck')->invokeArgs($newController, [$function]);
        
        // Check if the function requires authentication
        $requiresAuthentication = $rc->getMethod('requiresAuthentication')->invokeArgs($newController, [$function]);
        
        
    //
    // SESSION SETUP
    //
        
        // Start the session
        Session::init();
        Session::start();
        
        
    //
    // INITIALIZE DATABASE CONNECTION
    //
    
        System::useModule('pgsql');
        
        $database = new Pgsql\PostgresConnection();
        
        // Check if there are any database details cached.  If there are use that to connect to the database
        if( isset($_SESSION['dbCache']) && $_SESSION['dbCache'] !== null ) {
            $dbSettings = $_SESSION['dbCache'];
            
            $dbConnected = $database->connect(
                "host='" . $dbSettings['host'] . "' port='" . CONF_DB_PORT . "' dbname='" . $dbSettings['database'] .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            
            // Set the search path
            if( $dbConnected === true ) {
                $sqlResult = $database->paramQuery('SET search_path TO ' . $dbSettings['schema'], []);
                if( $sqlResult->isValid() === false ) die( json_encode(['ok' => false, 'error' => 'Unable to connect to company']) );
            }
        }
        
        
    //   
    // SECURITY PHASE
    //
        
        // Check CSRF Token. If none exist create it.
        if( isset($_COOKIE[CONF_SESSION_CSRF_COOKIE_NAME]) === true ) {
            // Only check CSRF token if the function requires it
            if( $requiresCsrfCheck === true ) {
                // Check for CSRF token in post data
                if( isset($_POST['csrfToken']) === false ) die( json_encode(['ok' => false, 'error' => 'Invalid CSRF token']) );
                
                // Check that the CSRF token is valid
                if( $_POST['csrfToken'] !== $_COOKIE[CONF_SESSION_CSRF_COOKIE_NAME] ) die( json_encode(['ok' => false, 'error' => 'Invalid CSRF token']) );
            }
        }
        else {
            // Create CSRF Token cookie
            setcookie(CONF_SESSION_CSRF_COOKIE_NAME, Security::generateRandomString(32), 0, "/", '', isset($_SERVER['HTTPS']), false);
        }
        
        // If authentication is required then user can't be null.
        if( $requiresAuthentication === true && System::isLoggedIn() === false ) {
            die( json_encode(['ok' => false, 'error' => 'You are not logged in.']) );
        }
        
        // Enable CORS
        //if( isset($_SERVER['HTTP_ORIGIN']) )
        //{
        //    header('Access-Control-Allow-origin: ' . $_SERVER['HTTP_ORIGIN'] . '');
        //}
        //else
        //{
        //    header('Access-Control-Allow-Origin: *');
        //}
        //header('Access-Control-Allow-Headers: withCredentials');
        //header('Access-Control-Allow-Credentials: true');
        //header('withCredentials: true');
		
		
    //
    // MAINTENANCE PHASE
    //
        
        //die( json_encode(['ok' => false, 'error' => 'System is currently down for scheduled maintenance.']) );
        
        
    //
    // FINAL ROUTING PHASE
    //
    // This phase will execute the controller function supplied.
    //
    
        // Check for JSON data posted
        $data = null;
        if( isset($_POST['data']) ) {
            $data = json_decode($_POST['data'], true);
            
            if( $data === false ) die( json_encode(['ok' => false, 'error' => 'Unable to parse data']) );
        }
        
        // Get the reflection method object
        $rm = $rc->getMethod($function);
        
        // Call the function
        $rm->invokeArgs($newController, [$data, System::getUserData(), $database]);
        
        
    //
    // CLEAN UP PHASE
    //
        
        $database->disconnect();
?>