<?php    
    namespace LexproApi;
    
    //Make sure that this file was not accessed directly
    \System::denyDirectAccess();
    
    //=============================================================================
    //    LEXPRO API ACCESS LAYER
    //    
    //    This file contains the Connection class used to connect to the lexpro API.
    //=============================================================================
    
    class Connection
    {
        //
        // PUBLIC CLASS CONSTANTS
        //
        
        public const BANK_ACCOUNT_TRUST = 1;
        public const BANK_ACCOUNT_BUSINESS = 2;
        
        public const ACCOUNT_ACTIVE = 1;
        public const ACCOUNT_INACTIVE = 2;
        
        //
        // PRIVATE MEMBER VARIABLES
        //
        
        private $apiUrl;
        private $accessToken;
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Class constructor
        public function __construct(string $apiUrl) {
            $this->apiUrl = $apiUrl;
            $this->accessToken = null;
        }
        
        // Class destructor
        public function __destruct() {
        }
        
        // Function to set the access token
        public function setAccessToken(string $accessToken) {
            $this->accessToken = $accessToken;
        }
        
        // Function to get an access token for a given user.
        //
        // firm                The firm (bookset) to log in to.
        // username            The username of the user to log in as.
        // password            The user's password.
        // persistent        Should the login be persistent or not.
        public function getAccessToken(string $apiKey, string $firm, string $username, string $password, bool $persistent = false) : array {
            // Create the JSON request to send.
            $jsonData = json_encode([
                'apiKey' => $apiKey,
                'firm' => $firm,
                'username' => $username,
                'password' => $password,
                'persistent' => $persistent
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=User&fn=login', $jsonData);
        }
        
        // Function to check if an access token is still valid.
        public function checkAccessToken() : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode([
                'accessToken' => $this->accessToken
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=User&fn=checkAccessToken', $jsonData);
        }
        
        // Function to release an access token.
        public function releaseAccessToken() : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode([
                'accessToken' => $this->accessToken
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=User&fn=logout', $jsonData);
        }
        
        // Function to post transactions
        //
        // transactions                An array containing the transactions to post.
        //
        //    "transactions": [
        //        {
        //            "accountNumber":"ZF0000",
        //            "date":"2020-01-01",
        //            "description":"Test Transaction",
        //            "reference":"Ref. 1000",
        //            "type":"FO",
        //            "bankAccount":{
        //                "id":1
        //            },
        //            "businessDebit":500.0,
        //            "businessCredit":0.0,
        //            "trustDebit":0.0,
        //            "trustCredit":0.0
        //        },
        //        .
        //        .
        //        .
        //    ]
        //
        public function postTransaction(array $transactions) : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode([
                'accessToken' => $this->accessToken,
                'transactions' => $transactions
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=Transaction&fn=post', $jsonData);
        }
        
        // Function to get available bank accounts
        //
        //  startAccountNumber:     Only account from this value onwards will be retrieved.  If a partial account number is provided any account
        //                          starting with the value or a larger value will be retrieved. Optional. Defaults to null
        //                          
        //  endAccountNumber:       Only account up to this value will be retrieved.  If a partial account number is provided any account
        //                          starting with the value or a smaller value will be retrieved. Optional. Defaults to null
        //                          
        // includeTypes             The type of bank accounts to retreive.  Values are:
        //                              - BANK_ACCOUNT_BUSINESS for business accounts only
        //                              - BANK_ACCOUNT_TRUST for trust accounts only
        //                              - BANK_ACCOUNT_BUSINESS || BANK_ACCOUNT_TRUST for both trust and business accounts
        //                                 
        public function listBankAccounts( int $includeTypes ) : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Check which types of accounts to get
            $includeBusiness = true;
            $includeTrust = true;
            
            if( isset($includeTypes) ) {
                if( $includeTypes === self::BANK_ACCOUNT_BUSINESS ) {
                    $includeBusiness = true;
                    $includeTrust = false;
                }
                else if( $includeTypes === self::BANK_ACCOUNT_TRUST ) {
                    $includeBusiness = false;
                    $includeTrust = true;
                }
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode([
                'accessToken' => $this->accessToken,
                'includeTrust' => $includeTrust,
                'includeBusiness' => $includeBusiness
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=BankAccount&fn=getList', $jsonData);
        }
        
        // Function to get available bank accounts
        //
        // bankId              Bank id of bank to get
        public function getBankAccount( int $bankAccountId ) : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode([
                'accessToken' => $this->accessToken,
                'bankAccount' => ['id' => $bankAccountId]
            ]);
            
            return $this->sendJson($this->apiUrl . '?c=BankAccount&fn=get', $jsonData);
        }
        
        
        // Function to get available bank accounts
        //
        // includeTypes                The type of accounts to retreive.  Values are:
        //                            - ACCOUNT_ACTIVE Should active accounts be included in the result. Optional. Default true
        //                            - ACCOUNT_INACTIVE Should inactive accounts be included in the result. Optional. Default true
        public function listAccounts( ?string $start = null, ?string $end = null, int $includeTypes = ACCOUNT_ACTIVE ) : array {
            // Check that an access token is set.
            if( $this->accessToken === null ) {
                return [
                    'ok' => false,
                    'error' => 'No access token set.'
                ];
            }
            
            // Check which types of accounts to get
            $includeActive = true;
            $includeInactive = true;
            
            if( isset($includeTypes) ) {
                if( $includeTypes === self::ACCOUNT_ACTIVE ) {
                    $includeActive = true;
                    $includeInactive = false;
                }
                else if( $includeTypes === self::ACCOUNT_INACTIVE ) {
                    $includeActive = false;
                    $includeInactive = true;
                }
            }
            $data = [
                'accessToken' => $this->accessToken,
                'includeActive' => $includeActive,
                'includeInactive' => $includeInactive
            ];
            
            if ($start !== null) {
                $data['startAccountNumber'] = $start;
            }
            
            if ($end !== null) {
                $data['startAccountNumber'] = $end;
            }
            
            // Create the JSON request to send.
            $jsonData = json_encode($data);
            
            return $this->sendJson($this->apiUrl . '?c=Account&fn=getList', $jsonData);
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // Function to send JSON data with cURL
        private function sendJson(string $url, string $jsonData) : array {
            // Initialize curl.
            $curlHandle = curl_init();
            
            // Set request URL.
            curl_setopt($curlHandle, CURLOPT_URL, $url);
            
            // Set curl to post data
            curl_setopt($curlHandle, CURLOPT_POST, true);
            
            // Set JSON data to post
            curl_setopt($curlHandle, CURLOPT_POSTFIELDS, $jsonData);
            
            // Set curl to return the result on success
            curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, true);
            
            // If you receive SSL errors disable SSL checks.  NOT RECCOMENDED FOR PRODUCTION.
            curl_setopt($curlHandle, CURLOPT_SSL_VERIFYHOST, false);
            curl_setopt($curlHandle, CURLOPT_SSL_VERIFYPEER, false);
            
            // Set required headers
            curl_setopt($curlHandle, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',       // We are sending JSON
                'Content-Length: ' . strlen($jsonData)  // Our number of bytes in our JSON
            ]);
            
            $curlResult = curl_exec($curlHandle);
            
            // Check for an error
            if( curl_errno($curlHandle) ) {
                $result = [
                    'ok' => false,
                    'error' => curl_error($curlHandle)
                ];
            }
            else {
                $result = json_decode($curlResult, true);
                
                // Check if the JSON was parsed successfully
                if( $result === null ) {
                    $result = [
                        'ok' => false,
                        'error' => 'Failed to parse result. Invalid JSON received from server.'
                    ];
                }
            }
            
            return $result;
        }
    }
?>