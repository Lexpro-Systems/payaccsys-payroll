<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // LOAN AGREEMENT CONTROLLER CLASS
    //
    
    class LoanAgreementConfig extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [
            'getLoanAgreementImage'
        ];
        protected $authenticationWhitelist = [];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        
        // Function to get a loan agreement media resource
        //
        // Get Parameters
        //  name             The name of the resource to get.
        public function getLoanAgreementImage($data, $user, $db) {
            header('Content-Type: application/json');
            
            // Use the $_GET['name'] parameter to get the required resource
            if( !isset($_GET['name']) ) {
                http_response_code(404);
                return false;
            }
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            $resourcePath = realpath(CONF_CLIENT_DIR . $sqlRow['value'] .'/loan_agreement_images/'. $_GET['name']);
            
            // if( $resourcePath !== NULL ) {
            //     $resourcePath = str_replace('\\', '/', $resourcePath);
            //     $resourcePath = str_replace('//', '/', $resourcePath);
            // }
            
            // Check that the path is safe
            $safePath = realpath(CONF_CLIENT_DIR);
            if( substr($resourcePath, 0, strlen($safePath)) !== $safePath ) {
                http_response_code(404);
                return false;
            };
            
            // Check if the file exists
            if( !file_exists($resourcePath) ) {
                http_response_code(404);
                return false;
            }
            
            // If all checks passed send the file back to the client
            header('Content-Length: ' . filesize($resourcePath));
            header('Content-Type: ' . image_type_to_mime_type(exif_imagetype($resourcePath)));
            header('Cache-Control: cache, max-age=31536000');
            header('Expires: ' . date('D, d M Y H:i:s \G\M\T', time() + 31536000));
            header('Pragma: cache');
            header('Last-Modified: ' . date('D, d M Y H:i:s \G\M\T', filemtime($resourcePath)));
            ob_clean();   // discard any data in the output buffer (if possible)
            flush();      // flush headers (if possible)
            readfile( $resourcePath );
            
            return true;
        }
        
        // Function to list loan agreement templates
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        // None
        public function updateLoanAgreementTemplatesConfig($data, $user, $db) {
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanAgreementTemplateId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            for ($i=0; $i < count($data['configData']); $i++) {
                $value = $data['configData'][$i]['value'];
                if ($data['configData'][$i]['type'] === 'image') {
                    
                    $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\';';
                    $sqlResult = $db->paramQuery($sqlQuery, []);
                    
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    
                    $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] . '/loan_agreement_images/';
                    
                    if( $sqlResult->getRowCount() === 0 ) {
                        echo( json_encode(['ok' => false, 'error' => 'No image directory found']) );
                        return false;
                    }
                    else if($imageDir === '') {
                        echo( json_encode(['ok' => false, 'error' => 'No image directory found']) );
                        return false;
                    }
                    
                    if (!file_exists($imageDir)) {
                        mkdir($imageDir, 0777, true);
                    }
                    
                    $sqlQuery = 'SELECT value FROM loan_agreement_template_config WHERE name = $1;';
                    $sqlResult = $db->paramQuery($sqlQuery, [$data['configData'][$i]['label']]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    
                    $sqlRow = $sqlResult->fetchAssociative();
                    
                    if( $sqlResult->getRowCount() !== 0 ) {
                        if (file_exists($imageDir . $sqlRow['value'] . '.png')) {
                            unlink($imageDir . $sqlRow['value'] . '.png');
                        }
                    }
                    
                    // Generate a random code for the specified check-in
                    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    $charactersLength = strlen($characters);
                    $imageName = '';
                    for ($x = 0; $x < 8; $x++) {
                        $imageName = $imageName . $characters[rand(0, $charactersLength - 1)];
                    }
                    
                    
                    file_put_contents($imageDir . '/' . $imageName . '.png', base64_decode(explode( ',', $data['configData'][$i]['value'])[1]));
                    $image = $this->processImage($imageDir . '/' . $imageName . '.png');
                    $file = imagepng($image, $imageDir . '/' . $imageName . '.png');
                    
                    // $filepath = $_FILES[$data['configData'][$i]['label']]['tmp_name'];
                    // $image = $this->processImage($filepath);
                    // $file = imagepng($image, $imageDir . '/' . $imageName . '.png');
                    
                    $value = $imageName;
                }
                
                $sqlQuery = 'SELECT id, name, value FROM loan_agreement_template_config WHERE loan_agreement_template_id = $1 AND name = $2';
                $sqlResult = $db->paramQuery($sqlQuery, [
                    $data['loanAgreementTemplateId'],
                    $data['configData'][$i]['label']
                ]);
                
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                
                if( $sqlResult->getRowCount() === 0 ) {
                    if ($value !== '') {
                        $sqlQuery =  'INSERT INTO loan_agreement_template_config (loan_agreement_template_id, name, value) VALUES ($1, $2, $3);';
                        $sqlResult = $db->paramQuery($sqlQuery, [
                            $data['loanAgreementTemplateId'],
                            $data['configData'][$i]['label'],
                            $value
                        ]);
                        if( !$sqlResult->isValid() ) {
                            echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                            return false;
                        }
                    }
                }
                else if($sqlResult->getRowCount() === 1){
                    $sqlQuery =  'UPDATE loan_agreement_template_config SET value = $1 WHERE loan_agreement_template_id = $2 AND name = $3;';
                    $sqlResult = $db->paramQuery($sqlQuery, [
                        $value,
                        $data['loanAgreementTemplateId'],
                        $data['configData'][$i]['label']
                    ]);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                }
            }
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
        }
        
        // Function to list loan agreements templates
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        // None
        public function getLoanAgreementTemplatesConfig($data, $user, $db) {
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanAgreementTemplateId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Get the client data directory (where loan agreement images are stored)
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $clientDataDir = $sqlRow['value'];
            
            // Get the specified loan agreement template
            $sqlQuery = 'SELECT id, name, description FROM loan_agreement_templates WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanAgreementTemplateId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Loan agreement template not found.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            $printerTemplateConfig = [];
            
            // Depending on the template selected
            if ($sqlRow['name'] === 'default') {
                // Get the required loan agreement printer configuration items
                System::includeFile('loan_agreement_printing/LoanAgreementPrinterDefault.php');
                $printer = new LoanAgreementPrinter();
                $printerTemplateConfig = $printer->getConfigParameters();
            }
            
            // Get all the values for the specified configuration
            $sqlQuery = 'SELECT id, loan_agreement_template_id, name, value FROM loan_agreement_template_config WHERE loan_agreement_template_id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['loanAgreementTemplateId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $savedTemplateConfig = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $savedTemplateConfig[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'value' => $sqlRow['value']
                ];
            }
            
            $templateConfig = [];
            $clientDataDirExists = false;
            
            if ($clientDataDir !== '') {
                if (file_exists(CONF_CLIENT_DIR . $clientDataDir .'/')) {
                    $clientDataDirExists = true;
                }
            }
            
            for ($i=0; $i < count($printerTemplateConfig); $i++) {
                $value = '';
                $id = null;
                for ($b=0; $b < count($savedTemplateConfig); $b++) { 
                    
                    if ($printerTemplateConfig[$i]['name'] === $savedTemplateConfig[$b]['name']) {
                        $value = $savedTemplateConfig[$b]['value'];
                        
                        if ($printerTemplateConfig[$i]['type'] === 'image') {
                            
                            $value = '';
                            if ($savedTemplateConfig[$b]['value'] !== '') {
                                $value = '/' . $savedTemplateConfig[$b]['value'] .'.png';
                                
                                $filePath = CONF_CLIENT_DIR . $clientDataDir .'/loan_agreement_images/' . $savedTemplateConfig[$b]['value'] .'.png';
                                
                                $value = '';
                                if (file_exists($filePath)) {
                                    $value = 'exec.php?c=LoanAgreementConfig&fn=getLoanAgreementImage&name=' . urlencode($savedTemplateConfig[$b]['value'] .'.png') . '&v=' . filemtime($filePath);
                                }
                                
                            }
                        }
                    }
                    
                    if ($value === '') {
                        $value = $printerTemplateConfig[$i]['default'];
                    }
                }
                
                if ($printerTemplateConfig[$i]['name'] === 'image') {
                    $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\'';
                    $sqlResult = $db->paramQuery($sqlQuery, []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    
                    $value = '';
                    if ($savedTemplateConfig[$b]['value'] !== '') {
                        $value = $sqlRow['value'] . '/' . $savedTemplateConfig[$b]['value'] .'.png';
                    }
                }
                
                $templateConfig[] = [
                    'name' => $printerTemplateConfig[$i]['name'],
                    'description' => $printerTemplateConfig[$i]['description'],
                    'value' => $value,
                    'type' => $printerTemplateConfig[$i]['type']
                ];
            }
            
            echo( json_encode([
                'ok' => true,
                'templateConfig' => $templateConfig,
                'clientDataDirExists' => $clientDataDirExists
            ]) );
        }
        
        // Function to list loan agreement templates
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        // None
        public function getLoanAgreementTemplatesList($data, $user, $db) {
            
            $sqlQuery = 'SELECT value FROM config WHERE name = \'loan_agreement_template\'';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $usedTemplate = $sqlRow['value'];
            
            $sqlQuery = 'SELECT id, name, description FROM loan_agreement_templates ORDER BY name ASC';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $loanAgreementTemplates = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                
                $currentTemplate = false;
                if ($usedTemplate === $sqlRow['name']) {
                    $currentTemplate = true;
                }
                
                $loanAgreementTemplates[] = [
                    'id' => $sqlRow['id'],
                    'name' => $sqlRow['name'],
                    'description' => $sqlRow['description'],
                    'currentTemplate' => $currentTemplate
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'loanAgreementTemplates' => $loanAgreementTemplates
            ]) );
        }
        
        
        // Function to list loan agreements
        //
        // Required Parameters
        //  loanAgreementId               The id of the loan agreement to download
        //
        public function downloadLoanAgreementPreview($data, $user, $db) {
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'loanAgreementTemplateId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Load the loan agreement template
            System::includeFile('loan_agreement_printing/LoanAgreementPrinterDefault.php');
            
            // Create a random folder in the temp directory
            $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            $charactersLength = strlen($characters);
            
            $destDir = '';
            for ($i = 0; $i < 32; $i++) {
                $destDir = $destDir . $characters[rand(0, $charactersLength - 1)];
            }
            $destDir = CONF_TEMP_DIR . $destDir . '/';
            
            // Does the destination folder not exist?
            if (!file_exists($destDir)) {
                mkdir($destDir, 0777, true);
            }
            
            // Load the loan agreement template
            System::includeFile('loan_agreement_printing/LoanAgreementPrinterDefault.php');
            
            
            // Get saved config
            $sqlQuery = 'SELECT value FROM config WHERE name = \'client_data_dir\';';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            
            if (!$sqlResult->isValid()) {
                echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Construct the $config array with saved data
            $config = [];
            $imageDir = CONF_CLIENT_DIR . $sqlRow['value'] . '/loan_agreement_images/';
            
            if (!file_exists($imageDir)) {
                mkdir($imageDir, 0777, true);
            }
            
            $savedImagesList = scandir($imageDir);
            for ($i = 0; $i < count($savedImagesList); $i++) {
                $sqlQuery = 'SELECT name FROM loan_agreement_template_config WHERE value = $1 AND loan_agreement_template_id = $2;';
                $sqlResult = $db->paramQuery($sqlQuery, [substr($savedImagesList[$i], 0, strpos($savedImagesList[$i], '.')), $data['loanAgreementTemplateId']]);
                
                if (!$sqlResult->isValid()) {
                    echo (json_encode(['ok' => false, 'error' => 'Database error.']));
                    return false;
                }
                
                if ($sqlResult->getRowCount() === 0) {
                    continue;
                }
                
                $sqlRow = $sqlResult->fetchAssociative();
                
                $found = false;
                for ($x = 0;$x < count($config);$x++) {
                    if (isset($config[$x][$sqlRow['name']])) {
                        $found = true;
                        break;
                    }
                }
                
                if (!$found) {
                    $config[$sqlRow['name']] = $imageDir . $savedImagesList[$i];
                }
            }
            
            // Fill $config with preview data
            $images = [];
            for ($i=0; $i < count($data['configData']); $i++) {
                if ($data['configData'][$i]['type'] === 'image') {
                    file_put_contents($destDir . $data['configData'][$i]['label'] . '.png', base64_decode(explode( ',', $data['configData'][$i]['value'])[1]));
                    $image = $this->processImage($destDir . $data['configData'][$i]['label'] . '.png');
                    $file = imagepng($image, $destDir . $data['configData'][$i]['label'] . '.png');
                    
                    $images[] = [
                        'imageDir' => $destDir . $data['configData'][$i]['label'] . '.png'
                    ];
                    
                    $config[$data['configData'][$i]['label']] = $destDir . '' . $data['configData'][$i]['label'] . '.png';
                    continue;
                }
                
                $config[$data['configData'][$i]['label']] = $data['configData'][$i]['value'];
            }
            

            
            // Create a new loan agreement printer
            $printer = new LoanAgreementPrinter([]);
            
            $templateConfig = $printer->getConfigParameters();
            
            // Clear previous loan agreement printer details, if any
            $printer->clear();
            $printer->setConfig($config);
            
            // Print the loan agreement
            $printer->printLoanAgreement();
            
            // Create a random filename for the loan agreement
            $filename = '';
            for ($i = 0; $i < 32; $i++) {
                $filename = $filename . $characters[rand(0, $charactersLength - 1)];
            }
            $filename = $destDir . $filename . '.pdf';
            
            ob_end_clean();
            
            for ($i=0; $i < count($images); $i++) {
                if (file_exists($images[$i]['imageDir'])) {
                    unlink($images[$i]['imageDir']);
                }
            }
            rmdir($destDir);
            
            // Download the file
            $printer->output($filename);
            
            unset($printer);
        }
        
        // Function to resize image to 800x600 or 600x800 depending on the longest side of the original image
        // Formats image to jpg
        // Removes orientation from image
        // 
        // Required parameter
        // filepath    e.g. $_FILES[$key]['tmp_name']; if take from $_FILES
        //
        private function processImage( $filepath) {
            
            $formattedImage = $this->formatFile($filepath);
            
            $imageSize = getimagesize($filepath);
            $originalWidth = $imageSize[0];
            $originalHeight = $imageSize[1];
            
            
            $newWidth = 600;
            $newHeight = 800;
            
            if ( $originalWidth > 800 || $originalHeight > 600 ) {
                if ( $originalWidth > $originalHeight) {
                    $aspect = $originalWidth/$originalHeight;
                    $newHeight = 600;
                    $newWidth = $aspect * 600;
                }
                else if ( $originalHeight > $originalWidth) {
                    $aspect = $originalHeight/$originalWidth;
                    $newWidth = 800;
                    $newHeight = $aspect * 800;
                }
            }
            else {
                $newWidth = $originalWidth;
                $newHeight = $originalHeight;
            }
            
            $size = min(imagesx($formattedImage), imagesy($formattedImage));
            list($width, $height) = getimagesize($filepath);
            $resizedImage = imagecreatetruecolor((int)$newWidth, (int)$newHeight);
            imagecopyresized($resizedImage, $formattedImage, 0, 0, 0, 0, (int)$newWidth, (int)$newHeight, $width, $height);
            
            return $resizedImage;
        }
        
        private function formatFile($filepath) {
            
            $type = exif_imagetype($filepath);
            
            $allowedTypes = array( 
                // 1,  // [] gif 
                2,  // [] jpg 
                3,  // [] png 
                6   // [] bmp 
            ); 
            
            if (!in_array($type, $allowedTypes)) { 
                return false;
            } 
               
            switch ($type) { 
                case 2 : 
                    $im = $this->imageFixOrientation($filepath);
                    break; 
                case 3 : 
                    $im = imageCreateFromPng($filepath); 
                    break; 
                case 6 : 
                    $im = $this->imageCreateFromBMP($filepath); 
                    break; 
            }
            
            return $im;
        }
        
        private function imageCreateFromBMP($filename) {
             if (! $f1 = fopen($filename,"rb")) return FALSE;
             
             $FILE = unpack("vfile_type/Vfile_size/Vreserved/Vbitmap_offset", fread($f1,14));
             if ($FILE['file_type'] != 19778) return FALSE;
             
             $BMP = unpack('Vheader_size/Vwidth/Vheight/vplanes/vbits_per_pixel'.
                 '/Vcompression/Vsize_bitmap/Vhoriz_resolution'.
                 '/Vvert_resolution/Vcolors_used/Vcolors_important', fread($f1,40));
             $BMP['colors'] = pow(2,$BMP['bits_per_pixel']);
             
             if ($BMP['size_bitmap'] == 0) $BMP['size_bitmap'] = $FILE['file_size'] - $FILE['bitmap_offset'];
             $BMP['bytes_per_pixel'] = $BMP['bits_per_pixel']/8;
             $BMP['bytes_per_pixel2'] = ceil($BMP['bytes_per_pixel']);
             $BMP['decal'] = ($BMP['width']*$BMP['bytes_per_pixel']/4);
             $BMP['decal'] -= floor($BMP['width']*$BMP['bytes_per_pixel']/4);
             $BMP['decal'] = 4-(4*$BMP['decal']);
             if ($BMP['decal'] == 4) $BMP['decal'] = 0;
             
             $PALETTE = array();
             if ($BMP['colors'] < 16777216 && $BMP['colors'] != 65536) {
                 $PALETTE = unpack('V'.$BMP['colors'], fread($f1,$BMP['colors']*4));
             }
             
             $IMG = fread($f1,$BMP['size_bitmap']);
             $VIDE = chr(0);
             
             $res = imagecreatetruecolor($BMP['width'],$BMP['height']);
             $P = 0;
             $Y = $BMP['height']-1;
             while ($Y >= 0) {
                 $X=0;
                 while ($X < $BMP['width']) {
                     if ($BMP['bits_per_pixel'] == 24)
                         $COLOR = unpack("V",substr($IMG,$P,3).$VIDE);
                     elseif ($BMP['bits_per_pixel'] == 16) {
                         $COLOR = unpack("v",substr($IMG,$P,2));
                         $blue  = ($COLOR[1] & 0x001f) << 3;
                         $green = ($COLOR[1] & 0x07e0) >> 3;
                         $red   = ($COLOR[1] & 0xf800) >> 8;
                         $COLOR[1] = $red * 65536 + $green * 256 + $blue;
                     }
                     elseif ($BMP['bits_per_pixel'] == 8) {
                         $COLOR = unpack("n",$VIDE.substr($IMG,$P,1));
                         $COLOR[1] = $PALETTE[$COLOR[1]+1];
                     }
                     elseif ($BMP['bits_per_pixel'] == 4) {
                         $COLOR = unpack("n",$VIDE.substr($IMG,floor($P),1));
                         if (($P*2)%2 == 0) $COLOR[1] = ($COLOR[1] >> 4) ; else $COLOR[1] = ($COLOR[1] & 0x0F);
                         $COLOR[1] = $PALETTE[$COLOR[1]+1];
                     }
                     elseif ($BMP['bits_per_pixel'] == 1) {
                         $COLOR = unpack("n",$VIDE.substr($IMG,floor($P),1));
                         if     (($P*8)%8 == 0) $COLOR[1] =  $COLOR[1]        >>7;
                         elseif (($P*8)%8 == 1) $COLOR[1] = ($COLOR[1] & 0x40)>>6;
                         elseif (($P*8)%8 == 2) $COLOR[1] = ($COLOR[1] & 0x20)>>5;
                         elseif (($P*8)%8 == 3) $COLOR[1] = ($COLOR[1] & 0x10)>>4;
                         elseif (($P*8)%8 == 4) $COLOR[1] = ($COLOR[1] & 0x8)>>3;
                         elseif (($P*8)%8 == 5) $COLOR[1] = ($COLOR[1] & 0x4)>>2;
                         elseif (($P*8)%8 == 6) $COLOR[1] = ($COLOR[1] & 0x2)>>1;
                         elseif (($P*8)%8 == 7) $COLOR[1] = ($COLOR[1] & 0x1);
                         $COLOR[1] = $PALETTE[$COLOR[1]+1];
                     }
                     else
                         return FALSE;
                     
                     imagesetpixel($res,$X,$Y,$COLOR[1]);
                     
                     $X++;
                     $P += $BMP['bytes_per_pixel'];
                 }
                 $Y--;
                 $P+=$BMP['decal'];
             }
             
             fclose($f1);
             return $res;
        }
        
        private function imageFixOrientation($filename) {

            // Known error in exif_read_data. If this catch block is fired the image wont rotate
            set_error_handler(function() {
                throw new Exception();
            }, E_WARNING);
            
            try{
                $exif = exif_read_data($filename);
            }
            catch (Exception $e) {
                $exif = false;
            }
            finally {
                restore_error_handler();
            }
            
            if(!$exif) {
                $image = imagecreatefromjpeg($filename);
            }
        
            if (!empty($exif['Orientation'])) {
                $image = imagecreatefromjpeg($filename);
                switch ($exif['Orientation']) {
                    case 3:
                        $image = imagerotate($image, 180, 0);
                        break;
                         
                    case 6:
                        $image = imagerotate($image, -90, 0);
                        break;
                         
                    case 8:
                        $image = imagerotate($image, 90, 0);
                        break;
                }
            }
            else {
                $image = imagecreatefromjpeg($filename);
            }
             
            return $image;
        }
    }
?>