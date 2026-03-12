<?php
    // CONFIG MAY NOT BE ACCESSED DIRECTLY
    if( !defined('INDEX_PAGE_USED') ) die('Direct access denied!');
    

    //
    // DIRECTORY CONFIG
    //
    
    define('CONF_ROOT_DIR', getcwd() . '/');
    define('CONF_SYSTEM_DIR', CONF_ROOT_DIR . 'php/');
    define('CONF_CONFIG_DIR', CONF_SYSTEM_DIR . 'config/');
    define('CONF_CONTROLLER_DIR', CONF_SYSTEM_DIR . 'controllers/');
    define('CONF_INCLUDE_DIR', CONF_SYSTEM_DIR . 'include/');
    define('CONF_LOG_DIR', CONF_SYSTEM_DIR . 'log/');
    define('CONF_MEDIA_DIR', realpath(CONF_ROOT_DIR . '../media') . '/');
    define('CONF_TEMP_DIR', realpath(CONF_ROOT_DIR . '../temp') . '/');
    
    
    //
    // CONTROLLER CONFIG
    //
    
    define('CONF_CONTROLLER_EXTENSION', '.php');
    define('CONF_DEFAULT_CONTROLLER', 'MainController');
    define('CONF_DEFAULT_FUNCTION', 'DefaultFunction');
    
    
    //
    // SESSION CONFIG
    //
    
    define('CONF_SESSION_COOKIE_NAME', 'lexpro_payroll_attendance_app');
    define('CONF_SESSION_CSRF_COOKIE_NAME', 'lexpro_payroll_attendance_csrf');
    define('CONF_SESSION_LIFETIME', 900);                               // How many seconds a session lasts before expiring
    define('CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME', 'lexpro_payroll_attendance_rt');
    
    
    //
    // URL CONFIG
    //
    
    define('CONF_ROOT_URL', 'http://localhost:8080/lexpro_payroll/site/client');
    define('CONF_MEDIA_URL', 'http://localhost:8080/lexpro_payroll/site/media');
    
    
    //
    // EMAIL CONFIG
    //
    
    define('CONF_EMAIL_FROMADDRESS', 'info@lexproonline.co.za');
    define('CONF_SMTP_HOST', '');
    define('CONF_SMTP_PORT', '');
?>