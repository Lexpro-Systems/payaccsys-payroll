<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Use the spout module
    use Box\Spout\Writer\Common\Creator\WriterEntityFactory;
    use Box\Spout\Common\Type;
    System::useModule('spout');
    
    // Includes
    System::includeFile('Util.php');
    System::includeFile('ReportUtil.php');
    
    
    //
    // REPORT CONTROLLER CLASS
    //
    
    class Report extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        // Function to run employees details report
        //
        // Required Parameters
        //  format                   Format of the file to download
        //
        // Optional Parameters
        //  searchString             A string value that is used to filter the result 
        //  limit                    The maximum number of rows to return
        //  offset                   The offeset value of the result
        //  sortOrder                The order in which the result shoud be sorted (ASC or DESC)
        // 
        public function runActiveCompanyReport($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortList' => null,
                'isEnabled' => null,
                'isActive' => null,
                'isTrial' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'format' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortList' => ['type' => Json::TYPE_ARRAY, 'required' => false, 'nullable' => true, 'rules' => [
                    ['type' => Json::TYPE_OBJECT, 'required' => true, 'nullable' => false, 'rules' => [
                        'dataIndex' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => true],
                        'order' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
                    ]]
                ]],
                'isEnabled' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isActive' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isTrial' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getActiveCompanyData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Write out headers 
            $headers = [];
            $headers [] = [
                "COMPANY NAME",
                "COMPANY ALIAS",
                "CONTACT PERSON",
                "CONTACT NUMBER",
                "CONTACT EMAIL",
                "CONSULTANT",
                "ACTIVE",
                "TRIAL END DATE",
                "CREATED ON",
                "TOTAL PAYRUNS",
                "LAST PAYRUN"
            ];
            
            $writer = $this->writeReport($data, 'active_company_report_' . date('Y-m-d'), $headers);
            
            // For every company
            foreach( $reportData['companies'] AS $company ) {
                // Write content to file
                $content = [
                    $company['companyName'],
                    $company['companyAlias'],
                    $company['contactPerson'],
                    $company['contactNumber'],
                    $company['contactEmail'],
                    $company['consultantName'],
                    $company['isEnabled'],
                    $company['trialExpiresOn'],
                    $company['createdOn'],
                    $company['totalPayruns'],
                    ($company['lastPayrun'] !== null ? $company['lastPayrun'] : '')
                ];
                $writer->addRow(WriterEntityFactory::createRowFromArray($content, null));
            }
            
            $writer->close();
            return true;
        }
        
        // Function to list employee birthdays
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getActiveCompanyList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC',
                'isEnabled' => null,
                'isActive' => null,
                'isTrial' => null
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                // ...
                
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'isEnabled' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isActive' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true],
                'isTrial' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => true]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the data for the specified report
            $reportData = \ReportUtil\getActiveCompanyData($data, $user, $db);
            if( $reportData['ok'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => $reportData['error']]) );
                return false;
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'companies' => $reportData['companies']]) );
            return true;
        }
        
        
        //
        // PRIVATE FUNCTIONS
        //
        
        // @param $data             The request data
        // @param $report           Name The name of the report
        // @param $headers          The report fieldnames
        private function writeReport($data, $reportName, $headers) {
            //set format
            $formatType = 'xls';
            
            if(isset($data['format']) && $data['format'] !== '') {
                if(in_array($data['format'], array('xls','csv','xlsx'))) {
                   $formatType = trim($data['format']);
                }
                if($formatType == 'xlsx' || $formatType == 'xls'){
                    $formatType = 'xlsx';
                }
            }
            
            // Create the file name for the report
            $fileName = $reportName .'_'. date('Ymd') . '.'.$formatType;
            
            $writer = null;
            if($formatType == 'xlsx') {
               $writer = WriterEntityFactory::createXLSXWriter();
            }
            else {
                $writer = WriterEntityFactory::createCSVWriter();
            }
            $writer->openToBrowser($fileName); 
            
            //wirte headers
            foreach($headers as $header ) {
                $writer->addRow(WriterEntityFactory::createRowFromArray($header, null));
            }
            
            return $writer;
        }
        
    }
?>
