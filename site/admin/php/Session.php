<?php

//Make sure that this file was not accessed directly
System::denyDirectAccess();

class Session {
    
    //
    // CLASS CONSTANTS
    //
    
    public const STATUS_ACTIVE = 1;
    public const STATUS_EXPIRY_PENDING = 2;
    public const STATUS_EXPIRED = 3;
    
    
    //
    // PUBLIC STATIC FUNCTIONS
    //
    
    // Function to initialize session settings
    public static function init() : void {
        // Set session name
        session_name(CONF_SESSION_COOKIE_NAME);
        
        // Set session cookie security
        //session_set_cookie_params(0, '/', $_SERVER['SERVER_NAME'], isset($_SERVER['HTTPS']), true);
    }
    
    // Function to start the session
    public static function start() : bool {
        // Start session
        session_start();
        
        // Initialize the session if not already initialized
        if( !array_key_exists('status', $_SESSION) ) {
            $_SESSION = [];
            
            // Set the new session to active
            $_SESSION['status'] = self::STATUS_ACTIVE;
            
            // Set expiry time
            if( CONF_SESSION_LIFETIME > -1 ) $_SESSION['expires'] = time() + CONF_SESSION_LIFETIME;
            else $_SESSION['expires'] = -1;
            
            // If a refresh token is set try to refresh the session
            if( isset($_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]) ) self::refresh();
        }
        
        // Check if the session has expired
        if( CONF_SESSION_LIFETIME > -1 && time() >= $_SESSION['expires'] ) {
            if( $_SESSION['status'] === self::STATUS_ACTIVE ) {
                // Mark the session as expiry pending and give a further 60 seconds expiry period to allow any other pending
                // requests to finish with the old session.
                $_SESSION['status'] = self::STATUS_EXPIRY_PENDING;
                $_SESSION['expires'] = time() + 60;
                
                // Start a new session
                session_regenerate_id();
                
                // Clear all session data
                $_SESSION = [];
                
                // Set the new session to active
                $_SESSION['status'] = self::STATUS_ACTIVE;
                
                // Set expiry time
                if( CONF_SESSION_LIFETIME > -1 ) $_SESSION['expires'] = time() + CONF_SESSION_LIFETIME;
                else $_SESSION['expires'] = -1;
                
                // If a refresh token is set try to refresh the session
                if( isset($_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]) ) self::refresh();
            }
            else {
                $_SESSION['status'] === self::STATUS_EXPIRED;
                
                // Log access attempt to expired session.
                $user = System::getUserData();
                System::logSecurity('Attempt to access system with expired session. User ID: ' . $user['id'] . ', Company ID: ' . 
                    $user['companyId'] . ', Remote Address: ' . $_SERVER['REMOTE_ADDR']);
                
                // Start a new session for the user
                session_regenerate_id();
                
                // Clear all session data
                $_SESSION = [];
                
                // Init the session
                $_SESSION['status'] = self::STATUS_ACTIVE;
                if( CONF_SESSION_LIFETIME > -1 ) $_SESSION['expires'] = time() + CONF_SESSION_LIFETIME;
                else $_SESSION['expires'] = -1;
            }
        }
        
        return true;
    }
    
    // Function to expire the session.  When the session is expired it enters an 'expiry pending' status for 60 seconds allowing for pending request
    // to complete.  After the 60 seconds grace period the session enters an 'expired' status allowing no further use of the session.
    public static function expire() : bool {
        $_SESSION['status'] = self::STATUS_EXPIRY_PENDING;
        $_SESSION['expires'] = time() + 60;
        
        return true;
    }
    
    // Function to regenerate the session.  When a session is regenrated it recieves a new session ID.  Its status is set to active and
    // its expiry time is reset.
    //
    // deleteOldSession         If true the old session will be deleted and false it will be kept.
    public static function regenerate(bool $deleteOldSession = false) : bool {
        session_regenerate_id( $deleteOldSession );
        
        // Init the status and set session lifetime
        $_SESSION['status'] = self::STATUS_ACTIVE;
        if( CONF_SESSION_LIFETIME > -1 ) $_SESSION['expires'] = time() + CONF_SESSION_LIFETIME;
        else $_SESSION['expires'] = -1;
        
        return true;
    }
    
    // Function to destroy the session
    //
    // return               True if the session was destroyed and false otherwise
    public static function destroy() : bool {
        // Destroy the persistent session token cookie
        if( isset($_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]) ) {
            unset($_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]);
            setcookie(CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME, '', time() - 3600, '/', '', isset($_SERVER['HTTPS']), true);
        }
        
        // Destroy the session cookie
        setcookie(session_name(), '', time() - 42000, '/', $_SERVER['SERVER_NAME'], isset($_SERVER['HTTPS']), true);
        
        // Destroy session data
        $_SESSION = [];
        
        // Destroy the session
        session_destroy();
        
        return true;
    }
    
    // Function to close the session.  Session variable will no longer be available to read or write.
    public static function close() : void {
        session_write_close();
    }
    
    // Function to set the session refresh token
    //
    // token                    The token to set
    // lifetime                 The lifetime for the token
    public static function setRefreshToken(string $token, int $lifetime = 0) : bool {
        // Calculate expiry time from lifetime
        $expiryTime = 0;
        if( $lifetime > 0 ) $expiryTime = time() + $lifetime;
        
        // Calculate cookie value
        $cookieValue = $token;
        if( $lifetime > 0 ) $cookieValue = $lifetime . ':' . $token;
        
        // Save the refresh token in a cookie
        $_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME] = $cookieValue;
        setcookie(CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME, $cookieValue, $expiryTime, '/', '', isset($_SERVER['HTTPS']), true);
        
        return true;
    }
    
    // Function to get the session refresh token
    //
    // return               The session refresh token.  If it was not set then null will be returned.
    public static function getRefreshToken() : ?string {
        if( isset($_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]) ) return $_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME];
        
        return null;
    }
    
    // Function to refresh the session.  This will trigger a check to make sure the session is still valid.  This will automatically be
    // called when the session has expired but a refresh token is available.
    //
    // return               True if the session was refreshed and false otherwise.
    public static function refresh() : bool {
        // Load current session lifetime and token
        $refreshToken = explode(':', $_COOKIE[CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME]);
        $lifetime = 0;
        if( count($refreshToken) === 2 ) {
            $lifetime = intval($refreshToken[0]);
            $refreshToken = $refreshToken[1];
        }
        else if( count($refreshToken) === 1 ) {
            $refreshToken = $refreshToken[0];
            $lifetime = 0;
        }
        else {
            $refreshToken = null;
            $lifetime = 1;
        }
        
        // Check that the token is still valid
        $tokenValid = self::refreshSession($refreshToken);
        
        // If the token is not valid unset the refresh token cookie and return false.
        if( $tokenValid === false ) {
            setcookie(session_name(), '', time() - 42000, '/', $_SERVER['SERVER_NAME'], isset($_SERVER['HTTPS']), true);
            return false;
        }
        
        // Calculate new expiry time
        $expiryTime = 0;
        if( $lifetime > 0 ) $expiryTime = time() + $lifetime;
        
        // Calculate cookie value
        $cookieValue = $refreshToken;
        if( $lifetime > 0 ) $cookieValue = $lifetime . ':' . $refreshToken;
        
        // Update session cookie expiry
        setcookie(CONF_SESSION_REFRESH_TOKEN_COOKIE_NAME, $cookieValue, $expiryTime, '/', '', isset($_SERVER['HTTPS']), true);
        
        return true;
    }
    
    // System specific session refresh function.
    //
    // refreshToken         The refresh token to use when refreshing the session
    // return               True if the session was refreshed and false otherwise
    public static function refreshSession( $refreshToken ) : bool {
        // Create a new database connection
        System::useModule('pgsql');
        $systemDb = new Pgsql\PostgresConnection();
        
        // Connect to the main database to check user's login
        $dbConnected = $systemDb->connect(
            "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
            "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
        );
        if( $dbConnected !== true ) {
            echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
            return false;
        }
        
        // Set our search path to system
        $sqlResult = $systemDb->paramQuery('SET search_path TO system;', []);
        if( !$sqlResult->isValid() ) {
            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
            return false;
        }
        
        // Check if there is a refresh token in the DB that matches the given one
        $sqlQuery = 
            'SELECT ' .
                'user_sessions.id, user_sessions.user_id, user_sessions.company_id, user_sessions.refresh_token, ' . 
                'user_sessions.lifetime, user_sessions.last_accessed_on, ' .
                'users.name AS name, users.is_active AS user_is_active, ' . 
                'companies.database_name, companies.database_schema, companies.database_host, companies.is_active AS company_is_active ' .
            'FROM ' .
                'user_sessions ' .
            'LEFT JOIN ' . 
                'users ON user_sessions.user_id = users.id ' . 
            'LEFT JOIN ' . 
                'companies ON user_sessions.company_id = companies.id ' . 
            'WHERE ' .
                'refresh_token = $1';
        $sqlResult = $systemDb->paramQuery($sqlQuery, [$refreshToken]);
        if( !$sqlResult->isValid() ) return false;
        
        // Check if we found a token
        if( $sqlResult->getRowCount() !== 1 ) return false;
        
        $sqlRow = $sqlResult->fetchAssociative();
        
        // If the token expired return false
        if( strtotime($sqlRow['last_accessed_on']) + intval($sqlRow['lifetime']) <= time() ) return false;
        
        // If the company is not null restore the users DB Cache settings
        if( $sqlRow['company_id'] !== null ) {
            $_SESSION['dbCache'] = [
                'host' => $sqlRow['database_host'],
                'database' => $sqlRow['database_name'],
                'schema' => $sqlRow['database_schema']
            ];
        }
        
        // Restore the user's session and log him in.
        System::login([
            'id' => $sqlRow['user_id'],
            'name' => $sqlRow['name'],
            'companyId' => $sqlRow['company_id']
        ]);
        
        // Update the last access time of the user's session.
        $sqlQuery = 'UPDATE user_sessions SET last_accessed_on = $1 WHERE id = $2;';
        $sqlResult = $systemDb->paramQuery($sqlQuery, [date('Y-m-d H:i:s'), $sqlRow['id']]);
        
        return true;
    }
};

?>