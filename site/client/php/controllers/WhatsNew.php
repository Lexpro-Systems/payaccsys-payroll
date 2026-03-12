<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    
    //
    // TYPES CONTROLLER CLASS
    //
    
    class WhatsNew extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function get the latest 'Whats New' release number
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getLatest($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, []);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $directories = scandir(CONF_ROOT_DIR . '/whats_new/');
            
            $dirIndex = count($directories) - 1;
            $latestRelease = null;
            while( $dirIndex >= 0 ) {
                // Skip . and .. entries
                if( $latestRelease === '.' || $latestRelease === '..' ) continue;
                
                // Skip files
                if( is_dir(CONF_ROOT_DIR . '/whats_new/' . $directories[$dirIndex]) !== true ) continue;
                
                $latestRelease = $directories[$dirIndex];
                break;
            }
            
            echo(json_encode([
                'ok' => true,
                'latestRelease' => $latestRelease
            ]));
        }
        
        
        // Function get a list of 'Whats New' release numbers
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function getList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, []);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $directories = scandir(CONF_ROOT_DIR . '/whats_new/');
            
            $dirIndex = count($directories) - 1;
            $releases = [];
            while( $dirIndex >= 0 ) {
                // Skip . and .. entries
                if( $directories[$dirIndex] === '.' || $directories[$dirIndex] === '..' ) {
                    $dirIndex = $dirIndex -1;
                    continue;
                }
                
                // Skip files
                if( is_dir(CONF_ROOT_DIR . '/whats_new/' . $directories[$dirIndex]) !== true ) continue;
                
                // Save the release number
                $releases[] = $directories[$dirIndex];
                
                // Next directory
                $dirIndex = $dirIndex -1;
            }
            
            echo(json_encode([
                'ok' => true,
                'releases' => $releases
            ]));
        }
    }
?>
