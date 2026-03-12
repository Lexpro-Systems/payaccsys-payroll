<?php
	//Make sure that this file was not accessed directly
	System::denyDirectAccess();
    
    // Include the postgres config
    require_once(CONF_CONFIG_DIR . 'config_database.php');
    
    require_once('PostgresConnection.php');
    require_once('PostgresResult.php');
?>