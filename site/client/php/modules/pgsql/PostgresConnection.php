<?php	
	namespace Pgsql;
	
	//Make sure that this file was not accessed directly
	\System::denyDirectAccess();
	
	//=============================================================================
	//	POSGRESQL DATABASE ACCESS LAYER
	//	
	//	This file contains the SQLDatabase and SQLResult class for PostgreSQL.
	//	The class provides access to the database in a generic way to facilitate
	//	easy manipulation of the database.
	//=============================================================================
	
	
	class PostgresConnection
	{
        //
        // PRIVATE MEMBER VARIABLES
        //
        
        private $dbLink;
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
		// Class constructor
		public function __construct() {
			$this->dbLink = null;
		}
		
		// Class destructor
		public function __destruct() {
			//Call parent destructor
			if( $this->dbLink !== null ) $this->disconnect();
		}
		
		// Function to connect to the database
		//
		// $connectionString        A string containing connection details. Example:
		//					        "host='myhost.somewhere.com' port='123' dbname='database' user='admin' password='adminpasswd'"
		// $forceNewConnection      If this is set to true a new connection will be made with each connect.
		// return				    The function returns true on success and false otherwise
		public function connect($connectionString, $forceNewConnection = false) {
			if( $forceNewConnection ) {
				$this->dbLink = pg_connect($connectionString, true);
			}
			else {
				$this->dbLink = pg_connect($connectionString);
			}
			
			if( !$this->dbLink ) {
				$errorArray = error_get_last();
				$this->lastError = $errorArray['message'];
				return false;
			}
            
            return true;
		}
		
		// Function to disconnect from the database
		public function disconnect() {
			if( $this->dbLink !== null ) pg_close( $this->dbLink );
			
			//Set the dbLink variable to null so that the connection can't be closed twice in a row
			$this->dbLink = null;
		}
		
		// Function to send a query to the database server. This function will call the buildQuery function if more than one
		// parameter is given.
		// $queryString					The query to send to the database.
		// return						Return true if query was executed ok and false if an error occurred
		public function query($queryString) {
			//If the connection is null then no connection to the database exists and a query can't be done
			if( $this->dbLink == null ) {
				$this->lastError = 'Unable to execute query. The connection to the database is not open.';
				return new PostgresResult(null, $this->lastError);
			}
            
			$result = pg_query($this->dbLink, $queryString);
			
			//Create a new SQLResult object and return it
			$tmpSQLResult = new PostgresResult($result);
			return $tmpSQLResult;
		}
        
        // Function to send a parameterized query to the database
        public function paramQuery($queryString, $params) {
			//If the connection is null then no connection to the database exists and a query can't be done
			if( $this->dbLink == null ) {
				$this->lastError = 'Unable to execute query. The connection to the database is not open.';
				return new PostgresResult(null, $this->lastError);
			}
			
			if( !is_array($params) ) {
				$this->lastError = 'Parameter 2 of PostgresConnection->paramQuery() must be an array.';
				return new PostgresResult(null, $this->lastError);
			}
            
            // Convert any boolean values to 't' and 'f'
            foreach( $params as $paramKey => $paramValue ) {
                if( is_bool($paramValue) ) {
                    if( $paramValue === true ) $params[$paramKey] = 't';
                    else $params[$paramKey] = 'f';
                }
            }
            
            $result = pg_query_params($this->dbLink, $queryString, $params);
            
            $returnResult = null;
            
            if( $result != null ) {
                $returnResult = new PostgresResult($result, '');
            }
            else {
                $returnResult = new PostgresResult(null, pg_last_error($this->dbLink));
            }
            
            return $returnResult;
        }
        
        // Function to start a transaction
        public function startTransaction() {
			//If the connection is null then no connection to the database exists and a query can't be done
			if( $this->dbLink == null ) {
				$this->lastError = 'Unable to start transaction. The connection to the database is not open.';
				return false;
			}
            
			$result = pg_query($this->dbLink, 'START TRANSACTION;');
			
            return true;
        }
        
        // Function to roll a transaction back
        public function rollbackTransaction() {
			//If the connection is null then no connection to the database exists and a query can't be done
			if( $this->dbLink == null ) {
				$this->lastError = 'Unable to rollback transaction. The connection to the database is not open.';
				return false;
			}
            
			$result = pg_query($this->dbLink, 'ROLLBACK TRANSACTION;');
			
            return true;
        }
        
        // Function to commit a transaction
        public function commitTransaction() {
			//If the connection is null then no connection to the database exists and a query can't be done
			if( $this->dbLink == null ) {
				$this->lastError = 'Unable to commit transaction. The connection to the database is not open.';
				return false;
			}
            
			$result = pg_query($this->dbLink, 'COMMIT TRANSACTION;');
			
            return true;
        }
		
		// Function to check transaction status of the connection
		//
		// return			A constant describing the current transaction state.
		//
		//					PGSAL_TRANSACTION_IDLE:		Connection is currently idle (Not in transactions)
		//					PGSQL_TRANSACTION_ACTIVE:	A command is in progress
		//					PGSQL_TRANSACTION_INTRANS:	Connection is idle in a transaction block
		//					PGSQL_TRANSACTION_INERROR:	Connection is idle in a failed transaction block
		//					PGSQL_TRANSACTION_UNKNOWN:	The connection is bad.
		public function getTransactionStatus() {
			return pg_transaction_status( $this->dbLink );
		}
		
		// Function to check if the connection is in a transaction block.
		//
		// return			True if the connection is in a transaction or a command is in progress.
		//					False otherwise.
		public function inTransaction() {
			$tranStatus = pg_transaction_status( $this->dbLink );
			
			if( $tranStatus === PGSQL_TRANSACTION_ACTIVE  || $tranStatus === PGSQL_TRANSACTION_INTRANS ) {
				return true;
			}
			else {
				return false;
			}
		}
        
        public function getError() {
            pg_last_error( $this->dbLink );
        }
        
        // Function to import a large object to the database.
        //
        // NOTE:    This function must be called in an SQL transaction.
        //
        // fileName         The path to the file to upload.
        // return           The blob ID if the upload wass successful and false otherwise.
        public function importLargeObject( $fileName ) {
            return pg_lo_import($this->dbLink, $fileName);
        }
        
        // Function to unlink (delete) a large object
        //
        // NOTE:    This function must be called in an SQL transaction
        //
        // loId             The ID of the large object to delete
        public function unlinkLargeObject( $loId ) {
            return pg_lo_unlink($this->dbLink, $loId);
        }
	}

?>