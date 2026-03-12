<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('LeaveUtil.php');
    System::includeFile('NumberMask.php');
    
    
    //
    // EMPLOYEE CONTROLLER CLASS
    //
    
    class Document extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get document categories
        //
        // Required Parameters
        public function getCategoryList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            $sqlQuery = 'SELECT id, name FROM document_categories;';
            
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $categories = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $categories[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name']
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'categories' => $categories
            ]) );
            
            return true;
        }
        
        // Function to remove a document
        //
        // Required Parameters
        //  documentId              Id of the document to get
        public function removeDocument($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'documentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get document query
            $sqlQuery = 
                'SELECT ' .
                    'employee_id, file_types.extension ' .
                'FROM ' .
                    'employee_documents ' .
                'LEFT JOIN ' .
                    'file_types ON employee_documents.file_type_code = file_types.code ' .
                'WHERE employee_documents.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['documentId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $realFileName = $data['documentId'] . '.' . $sqlRow['extension'];
            $employeeId = $sqlRow['employee_id'];
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $companyFolder = $sqlRow['value'];
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder)) {
                echo( json_encode(['ok' => false, 'error' => 'No company directory found. Please contact support.']) );
                return false;
            }
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents')) {
                echo( json_encode(['ok' => false, 'error' => 'File does not exist. Please contact support']) );
                return false;
            }
            
            // check if employee folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/' . $employeeId)) {
                echo( json_encode(['ok' => false, 'error' => 'File does not exist. Please contact support']) );
                return false;
            }
            
            unlink(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/' . $employeeId . '/' . $realFileName);
            
            // Get document query
            $sqlQuery = 
                'DELETE FROM employee_documents WHERE employee_documents.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['documentId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
            
        }
        
        // Function to download a document
        //
        // Required Parameters
        //  documentId              Id of the document to get
        //
        // Optional Parameters
        //  none
        public function download($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'documentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get document query
            $sqlQuery = 
                'SELECT ' .
                    'employee_id, description, file_type_code, file_types.extension, mime_type ' .
                'FROM ' .
                    'employee_documents ' .
                'LEFT JOIN ' .
                    'file_types ON employee_documents.file_type_code = file_types.code ' .
                'WHERE employee_documents.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['documentId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $filename = $sqlRow['description'] . '.' . $sqlRow['extension'];
            $realFileName = $data['documentId'] . '.' . $sqlRow['extension'];
            $employeeId = $sqlRow['employee_id'];
            $mimeType = $sqlRow['mime_type'];
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $companyFolder = $sqlRow['value'];
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder)) {
                echo( json_encode(['ok' => false, 'error' => 'No company directory found. Please contact support.']) );
                return false;
            }
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents')) {
                echo( json_encode(['ok' => false, 'error' => 'File does not exist. Please contact support']) );
                return false;
            }
            
            // check if employee folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/' . $employeeId)) {
                echo( json_encode(['ok' => false, 'error' => 'File does not exist. Please contact support']) );
                return false;
            }
            
            
            $resourcePath = realpath(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/' . $employeeId . '/' . $realFileName);
            header('Content-Length: ' . filesize($resourcePath));
            header('Content-Type: ' . $mimeType);
            header('Cache-Control: cache, max-age=31536000');
            header('Content-Disposition: attachment; filename="' . $filename . '";');
            ob_clean();   // discard any data in the output buffer (if possible)
            flush();      // flush headers (if possible)
            readfile( $resourcePath );
            return true;
        }
        
        // Function to to update the specified document details
        //
        // Required Parameters
        //  documentId              The id of the employee whose details to update
        //
        // Optional Parameters
        //  documentCategoryId                 The documents document category
        //  description                          The documents description
        //  filename                             The documents filename
        //  fileTypeCode                       The documents file type 
        //  size                                 The documents size
        public function update($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'documentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'documentCategoryId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'description' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'filename' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => false],
                'fileTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => false, 'nullable' => true],
                'size' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $updateQuery = 'UPDATE employee_documents SET ';
            
            if( isset($data['documentCategoryId']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'document_category_id = $' . $updateCount;
                $updateValues[] = $data['documentCategoryId'];
            }
            
            if( isset($data['description']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'description = $' . $updateCount;
                $updateValues[] = $data['description'];
            }
            
            if( isset($data['filename']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'filename = $' . $updateCount;
                $updateValues[] = $data['filename'];
            }
            
            if( isset($data['fileTypeCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'file_type_code = $' . $updateCount;
                $updateValues[] = $data['fileTypeCode'];
            }
            
            if( isset($data['size']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $updateQuery = $updateQuery . ', ';
                $updateQuery = $updateQuery . 'size = $' . $updateCount;
                $updateValues[] = $data['size'];
            }
            
            // Update if at least one parameter was updated
            if( $updateCount > 0 ) {
                $updateCount++;
                $updateQuery = $updateQuery . ' WHERE id = $' . $updateCount . ';';
                $updateValues[] = $data['documentId'];
                
                $updateResult = $db->paramQuery($updateQuery, $updateValues);
                if( !$updateResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to get a document
        //
        // Required Parameters
        //  documentId              Id of the document to get
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'documentId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get document query
            $sqlQuery = 
                'SELECT ' .
                    'employee_documents.id, employee_id, document_category_id, description, filename, ' .
                    'file_type_code, size, uploaded_on, uploaded_by_user_id, document_categories.name AS document_category_name ' .
                'FROM ' .
                    'employee_documents ' .
                'LEFT JOIN ' .
                    'document_categories ON employee_documents.document_category_id = document_categories.id ' .
                'WHERE employee_documents.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['documentId']]);//$sqlParams
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Create employees array
            $document = [];
            
            $document = [
                'id' => $sqlRow['id'],
                'employeeId' => $sqlRow['employee_id'],
                'documentCategoryId' => $sqlRow['document_category_id'],
                'description' => $sqlRow['description'],
                'filename' => $sqlRow['filename'],
                'fileTypeCode' => $sqlRow['file_type_code'],
                'size' => $sqlRow['size'],
                'uploadedOn' => $sqlRow['uploaded_on'],
                'uploadedByUserId' => $sqlRow['uploaded_by_user_id'],
                'documentCategoryName' => $sqlRow['document_category_name']
            ];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'document' => $document
            ]) );
            
            return true;
        }
        
        // Function to list employee documents
        //
        // Required Parameters
        //  employeeId              Id of the employee who's documents to get
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getDocumentList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'DESC'
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'documentId' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // Build where clause if a search string was given
            $whereClause = '';
            if( isset($data['searchString']) && $data['searchString'] !== '' ) {
                $sqlParams[] = $data['searchString'];
                $whereClause = $whereClause . 'WHERE ( ';
                $whereClause = $whereClause . '(employee_documents.description ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) OR ';
                $whereClause = $whereClause . '(employee_documents.filename ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' )';
                $whereClause = $whereClause . ') ';
            }
            
            // Should a employeeId filter be added?
            if( isset($data['employeeId']) && $data['employeeId'] !== '' ) {
                if( $whereClause === '') {
                    $whereClause = 'WHERE ' ;
                }
                else {
                    $whereClause = $whereClause . 'AND ';
                }
                $sqlParams[] = $data['employeeId'];
                $whereClause = $whereClause . ' employee_documents.employee_id = $' . count($sqlParams);
            }
            
            $ignoreOffset = false;
            if (isset($data['documentId'])) {
                
                $documentId = $data['documentId'];
                if ($data['documentId'] === null) {
                    $documentId = 0;
                }
                
                if( $whereClause === '') {
                    $whereClause = 'WHERE ' ;
                }
                else {
                    $whereClause = $whereClause . ' AND ';
                }
                $sqlParams[] = $documentId;
                $whereClause = $whereClause . ' employee_documents.id > $' . count($sqlParams);
                $ignoreOffset = true;
            }
            
            // Check that sort order given is valid
            if( $data['sortOrder'] !== 'ASC' && $data['sortOrder'] !== 'DESC' ) {
                echo(json_encode(['ok' => false, 'error' => 'Invalid sort order specified']));
                return false;
            }
            
            // Process limit offset
            $limitOffset = '';
            if( $data['limit'] !== null ) {
                $sqlParams[] = $data['limit'];
                $limitOffset = $limitOffset . 'LIMIT $' . count($sqlParams) . ' ';
            }
            
            // Add offset if given
            if( $data['offset'] !== null ) {
                if (!$ignoreOffset) {
                    $sqlParams[] = $data['offset'];
                    $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
                }
            }
            
            // Load all employees from the employees table
            $sqlQuery = 
                'SELECT ' .
                    'employee_documents.id, employee_id, document_category_id, description, filename, ' .
                    'file_type_code, size, uploaded_on, uploaded_by_user_id, document_categories.name AS document_category_name ' .
                'FROM ' .
                    'employee_documents ' .
                'LEFT JOIN ' .
                    'document_categories ON employee_documents.document_category_id = document_categories.id ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'employee_documents.uploaded_on ' . $data['sortOrder'] . ' ' .
                $limitOffset;
                
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create employees array
            $documents = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $documents[] = [
                    'id' => $sqlRow['id'],
                    'employeeId' => $sqlRow['employee_id'],
                    'documentCategoryId' => $sqlRow['document_category_id'],
                    'description' => $sqlRow['description'],
                    'filename' => $sqlRow['filename'],
                    'fileTypeCode' => $sqlRow['file_type_code'],
                    'size' => $sqlRow['size'],
                    'uploadedOn' => $sqlRow['uploaded_on'],
                    'uploadedByUserId' => $sqlRow['uploaded_by_user_id'],
                    'documentCategoryName' => $sqlRow['document_category_name']
                ];
            }
            
            // Get the latest document id
            $sqlQuery = 'SELECT MAX(id) AS id FROM employee_documents WHERE employee_id = $1';
                
            $sqlResult = $db->paramQuery($sqlQuery, [$data['employeeId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $latestDocumentId = $sqlRow['id'];
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'documents' => $documents,
                'latestDocumentId' => $latestDocumentId
            ]) );
            
            return true;
        }
        
        // Function to upload the specified employee's documents
        //
        // Required Parameters
        //  employeeId              The id of the employee whose documents to upload
        //
        //
        public function uploadDocument($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            $filename = $_FILES['file']['name'];
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'employeeId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'description' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'filename' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
                
                // document_category_id
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $extensionCheck = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
            if (pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION) === 'jpg') {
                $extensionCheck = 'jpeg';
            }
            
            if($_FILES['file']['error'] === 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the maximum upload file size.']));
                return false;
            }
            else if($_FILES['file']['error'] === 2 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file exceeds the max file size directive that was specified in the HTML form.']));
                return false;
            }
            else if($_FILES['file']['error'] === 3 ) {
                echo( json_encode(['ok' => false, 'error' => 'The uploaded file was only partially uploaded.']));
                return false;
            }
            else if($_FILES['file']['error'] === 4 ) {
                echo( json_encode(['ok' => false, 'error' => 'No file was uploaded.']));
                return false;
            }
            else if($_FILES['file']['error'] === 6 ) {
                echo( json_encode(['ok' => false, 'error' => 'Missing a temporary folder.']));
                return false;
            }
            else if($_FILES['file']['error'] === 7 ) {
                echo( json_encode(['ok' => false, 'error' => 'Failed to write file to disk.']));
                return false;
            }
            else if($_FILES['file']['error'] === 8 ) {
                echo( json_encode(['ok' => false, 'error' => 'PHP extension stopped the file upload.']));
                return false;
            }
            
            // Get the file type code and extension
            $sqlQuery = 'SELECT code, extension FROM file_types WHERE extension = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$extensionCheck]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() === 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'Files of this type (' . pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION) . 
                    ') are not allowed to be uploaded.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $fileTypeCode = $sqlRow['code'];
            $fileExtension = $sqlRow['extension'];
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $companyFolder = $sqlRow['value'];
            
            if ($companyFolder === '') {
                echo( json_encode(['ok' => false, 'error' => 'No company directory configured. Please contact support.']) );
                return false;
            }
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder)) {
                echo( json_encode(['ok' => false, 'error' => 'No company directory found. Please contact support.']) );
                return false;
            }
            
            // check if employee doucments folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents')) {
                mkdir(CONF_CLIENT_DIR . $companyFolder . '/employee_documents', 0777, true);
            }
            
            // check if employee folder exists
            if (!file_exists(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/' . $data['employeeId'])) {
                mkdir(CONF_CLIENT_DIR . $companyFolder . '/employee_documents/'. $data['employeeId'], 0777, true);
            }
            
            // Build the query to insert the item.
            $sqlQuery =
                'INSERT INTO employee_documents( ' .
                    'employee_id, document_category_id, description, filename, file_type_code, size, uploaded_on, uploaded_by_user_id) ' .
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id; ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['employeeId'],                                         // employee_id
                null,                                                        // document_category_id
                substr($filename, 0, strrpos($filename, ".")),               // description
                $filename,                                                   // filename
                $fileTypeCode,                                               // file_type_code
                $_FILES['file']['size'],                                     // size
                date('Y-m-d H:i:s', time()),                                 // uploaded_on
                $user['id']                                                  // uploaded_by_user_id
            ]);
            
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $documentId = $sqlRow['id'];
            
            // Load all employees from the employees table
            $sqlQuery = 
                'SELECT ' .
                    'employee_documents.id, employee_id, document_category_id, description, filename, ' .
                    'file_type_code, size, uploaded_on, uploaded_by_user_id, document_categories.name AS document_category_name ' .
                'FROM ' .
                    'employee_documents ' .
                'LEFT JOIN ' .
                    'document_categories ON employee_documents.document_category_id = document_categories.id ' .
                'WHERE employee_documents.id = $1 ';
            $sqlResult = $db->paramQuery($sqlQuery, [$documentId]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            $document = [
                'id' => $sqlRow['id'],
                'employeeId' => $sqlRow['employee_id'],
                'documentCategoryId' => $sqlRow['document_category_id'],
                'description' => $sqlRow['description'],
                'filename' => $sqlRow['filename'],
                'fileTypeCode' => $sqlRow['file_type_code'],
                'size' => $sqlRow['size'],
                'uploadedOn' => $sqlRow['uploaded_on'],
                'uploadedByUserId' => $sqlRow['uploaded_by_user_id'],
                'documentCategoryName' => $sqlRow['document_category_name']
            ];
            
            // Save file to disk
            move_uploaded_file($_FILES['file']['tmp_name'], CONF_CLIENT_DIR . $companyFolder . '/employee_documents/'. $data['employeeId'] .'/'. $documentId . '.' . $fileExtension);
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'document' => $document
            ]) );
            
            return true;
        }
        
    }
?>
