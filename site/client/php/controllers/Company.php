<?php

    //Make sure that this file was not accessed directly
    System::denyDirectAccess();
    
    // Includes
    System::includeFile('Util.php');
    
    
    //
    // USER CONTROLLER CLASS
    //
    
    class Company extends Controller {
        
        //
        // PROTECTED MEMBER VARIABLES
        //
        
        protected $csrfWhitelist = [];
        protected $authenticationWhitelist = [
            'requestNew'
        ];
        
        
        //
        // PUBLIC FUNCTIONS
        //
        
        // Function to get the details of the currently active company
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        public function get($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Initialize company array
            $company = [];
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // print_r($user);
            $sqlQuery =
                'SELECT ' . 
                    'company_details.id, ' .
                    'company_details.name, ' .
                    'company_details.alias, ' .
                    'company_details.registration_number, ' .
                    'company_details.physical_address_unit, ' .
                    'company_details.physical_address_complex, ' .
                    'company_details.physical_address_street, ' .
                    'company_details.physical_address_suburb, ' .
                    'company_details.physical_address_city, ' .
                    'company_details.physical_address_postal_code, ' .
                    'company_details.physical_address_country_code, ' .
                    'company_details.postal_address_line_1, ' .
                    'company_details.postal_address_line_2, ' .
                    'company_details.postal_address_line_3, ' .
                    'company_details.postal_address_code, ' .
                    'company_details.paye_reference_number, ' .
                    'company_details.sdl_payment_reference_number, ' .
                    'company_details.uif_payment_reference_number, ' .
                    'company_details.uif_registration_number, ' .
                    'company_details.sic_code, ' .
                    'company_details.eti_status_code, ' .
                    'company_details.special_economic_zone_code, ' .
                    'company_details.diplomatic_indemnity, ' .
                    'company_details.sars_contact_first_name, ' .
                    'company_details.sars_contact_last_name, ' .
                    'company_details.sars_contact_email_address, ' .
                    'company_details.sars_contact_business_number, ' .
                    'company_details.sars_contact_cell_number, ' .
                    'company_details.uif_contact_person, ' .
                    'company_details.uif_contact_email_address, ' .
                    'company_details.uif_contact_number, ' .
                    'company_details.tel_number, ' .
                    'company_details.fax_number, ' .
                    'company_details.email_address, ' .
                    'countries.name AS physical_address_country_name, ' .
                    'eti_status_types.name AS eti_status_name, ' .
                    'special_economic_zones.name AS special_economic_zone_name, ' .
                    'sic_codes.name AS sic_name ' .
                'FROM company_details '.
                'LEFT JOIN ' .
                    'countries ON countries.code = company_details.physical_address_country_code ' .
                'LEFT JOIN ' .
                    'eti_status_types ON eti_status_types.code = company_details.eti_status_code ' .
                'LEFT JOIN ' .
                    'special_economic_zones ON special_economic_zones.code = company_details.special_economic_zone_code ' .
                'LEFT JOIN ' .
                    'sic_codes ON sic_codes.code = company_details.sic_code ' .
                'ORDER BY id DESC LIMIT 1; ';
                
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Add details to the company array
            $company['details'] = [];
            
            $company['details'] = [
                'id' => $sqlRow['id'],
                'name' => $sqlRow['name'],
                'alias' => $sqlRow['alias'],
                'registrationNumber' => $sqlRow['registration_number'],
                'physicalAddressUnit' => $sqlRow['physical_address_unit'],
                'physicalAddressComplex' => $sqlRow['physical_address_complex'],
                'physicalAddressStreet' => $sqlRow['physical_address_street'],
                'physicalAddressSuburb' => $sqlRow['physical_address_suburb'],
                'physicalAddressCity' => $sqlRow['physical_address_city'],
                'physicalAddressPostalCode' => $sqlRow['physical_address_postal_code'],
                'physicalAddressCountryCode' => $sqlRow['physical_address_country_code'],
                'physicalAddressCountryName' => $sqlRow['physical_address_country_name'],
                'postalAddressLine1' => $sqlRow['postal_address_line_1'],
                'postalAddressLine2' => $sqlRow['postal_address_line_2'],
                'postalAddressLine3' => $sqlRow['postal_address_line_3'],
                'postalAddressCode' => $sqlRow['postal_address_code'],
                'telNumber' => $sqlRow['tel_number'],
                'faxNumber' => $sqlRow['fax_number'],
                'emailAddress' => $sqlRow['email_address'],
                'payeReferenceNumber' => $sqlRow['paye_reference_number'],
                'sdlPaymentReferenceNumber' => $sqlRow['sdl_payment_reference_number'],
                'uifPaymentReferenceNumber' => $sqlRow['uif_payment_reference_number'],
                'uifRegistrationNumber' => $sqlRow['uif_registration_number'],
                'sicCode' => $sqlRow['sic_code'],
                'sicName' => $sqlRow['sic_name'],
                'etiStatusCode' => $sqlRow['eti_status_code'],
                'etiStatusName' => $sqlRow['eti_status_name'],
                'specialEconomicZoneCode' => $sqlRow['special_economic_zone_code'],
                'specialEconomicZoneName' => $sqlRow['special_economic_zone_name'],
                'diplomaticIndemnity' => $sqlRow['diplomatic_indemnity'],
                'sarsContactFirstName' => $sqlRow['sars_contact_first_name'],
                'sarsContactLastName' => $sqlRow['sars_contact_last_name'],
                'sarsContactEmailAddress' => $sqlRow['sars_contact_email_address'],
                'sarsContactBusinessNumber' => $sqlRow['sars_contact_business_number'],
                'sarsContactCellNumber' => $sqlRow['sars_contact_cell_number'],
                'uifContactPerson' => $sqlRow['uif_contact_person'],
                'uifContactEmailAddress' => $sqlRow['uif_contact_email_address'],
                'uifContactNumber' => $sqlRow['uif_contact_number']
            ];
            
            // Load company details
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Load all users for the company
            $sqlQuery =
                'SELECT ' .
                    'users.id AS user_id, users.name AS user_name, users.email_address AS user_email_address, ' .
                    'users.cell_number AS user_cell_number, company_id ' .
                'FROM ' .
                    'user_company_access ' .
                'LEFT JOIN ' .
                    'users ON user_company_access.user_id = users.id ' . 
                'WHERE ' .
                    'company_id = $1 AND revoked IS FALSE ' .
                'ORDER BY ' .
                    'users.name;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add users to the company array
            $company['users'] = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $company['users'][] = [
                    'id' => $sqlRow['user_id'],
                    'name' => $sqlRow['user_name'],
                    'emailAddress' => $sqlRow['user_email_address'],
                    'cellNumber' => $sqlRow['user_cell_number']
                ];
            }
            
            // Load all users invited to the company
            $sqlQuery =
                'SELECT ' .
                    'user_company_invitations.id AS invitation_id, ' .
                    'user_company_invitations.invitee_email_address, user_company_invitations.invitee_name, ' .
                    'user_company_invitations.status_code, user_company_invitation_status_types.name AS status_name ' . 
                'FROM ' .
                    'user_company_invitations ' .
                'LEFT JOIN ' .
                    'user_company_invitation_status_types ON user_company_invitations.status_code = user_company_invitation_status_types.code ' . 
                'LEFT JOIN ' .
                    'users ON LOWER(user_company_invitations.invitee_email_address) = LOWER(users.email_address) ' .
                'LEFT JOIN ' .
                    'user_company_access ON  ' .
                        'user_company_access.company_id = user_company_invitations.company_id  ' .
                        'AND user_company_access.user_id = users.id AND user_company_access.revoked IS FALSE ' .
                'WHERE ' .
                    'user_company_invitations.company_id = $1 AND user_company_invitations.status_code != \'ACCE\'' .
                'ORDER BY ' .
                    'user_company_invitations.invitee_name;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Add users to the company array
            $company['userInvitations'] = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $company['userInvitations'][] = [
                    'id' => $sqlRow['invitation_id'],
                    'name' => $sqlRow['invitee_name'],
                    'emailAddress' => $sqlRow['invitee_email_address'],
                    'status' => [
                        'code' => $sqlRow['status_code'],
                        'name' => $sqlRow['status_name']
                    ]
                ];
            }
            
            // Send result
            echo( json_encode([
                'ok' => true,
                'company' => $company
            ]) );
            
            return true;
        }
        
        // Function to add a new user to the company
        //
        // Required Parameters
        //  name                    The name of the person being invited.
        //  emailAddress            The email address of the user to add.
        //  attendanceAccessRight   Whether the user has access to the attendance portal (true/ false)
        //  payrollAccessRight      Whether the user has access to the payroll portal (true/ false)
        //
        // Optional Parameters
        //  None
        public function addUser($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'name' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'attendanceAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false],
                'payrollAccessRight' => ['type' => Json::TYPE_BOOL, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Start SQL transaction
            $db->startTransaction();
            
            // Lock the relevant table(s)
            $db->query('LOCK TABLE user_company_access IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE user_company_invitations IN EXCLUSIVE MODE;');
            $db->query('LOCK TABLE users IN EXCLUSIVE MODE;');
            
            // Check if invite was already sent
            $sqlQuery =
                'SELECT ' . 
                    'id ' . 
                'FROM ' . 
                    'user_company_invitations ' . 
                'WHERE ' . 
                    'company_id = $1 AND LOWER(invitee_email_address) = LOWER($2) AND status_code = \'PEND\'';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId'], $data['emailAddress']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'You have already invited a user with the email address ' . $data['emailAddress'] . '.']) );
                return false;
            }
            
            // Check if user was already accepted
            $sqlQuery =
                'SELECT user_company_access.id FROM user_company_access ' .
                'LEFT JOIN ' .
                    'users ON user_company_access.user_id = users.id ' .
                'WHERE user_company_access.company_id = $1 AND LOWER(users.email_address) = LOWER($2) AND revoked IS FALSE';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId'], $data['emailAddress']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlResult->getRowCount() !== 0 ) {
                echo( json_encode(['ok' => false, 'error' => 'This user is already part of the company']) );
                return false;
            }
            
            // Generate a secure random code for the invitation
            $code = Security::generateRandomString(64);
            
            // Add an invitation for the user
            $sqlQuery =
                'INSERT INTO ' .
                    'user_company_invitations (code, company_id, invitee_name, invitee_email_address, sent_by_user_id, sent_on, expires_on, status_code) ' .
                'VALUES ' .
                    '($1, $2, $3, $4, $5, $6, $7, $8) ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $code,                                  // code
                $user['companyId'],                     // company_id
                $data['name'],                          // invitee_name
                $data['emailAddress'],                  // invitee_email_address
                $user['id'],                            // sent_by_user_id
                date('Y-m-d H:i:s'),                    // sent_on
                date('Y-m-d H:i:s', time() + 604800),   // expires_on
                'PEND'                                  // status code
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            $userCompanyInvitationId = $sqlRow['id']; 
            
            // Add the relevant rights
            $insertCount = 0;
            $insertValues = [];
            $sqlQuery = 'INSERT INTO user_company_invitation_rights(user_company_invitation_id, user_right_code) VALUES ';
            
            // Should the attendance portal access right be added?
            $invitationLink = CONF_ATTENDANCE_ROOT_URL . '/index.html?invitation=' . $code;
            if( array_key_exists('attendanceAccessRight', $data) && ($data['attendanceAccessRight'] == true) ) {
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId ;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                
                $insertCount++;
                $insertValues[] = 'AAPO';
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
            }
            
            // Should the payroll portal access right be added?
            if( array_key_exists('payrollAccessRight', $data) && ($data['payrollAccessRight'] == true) ) {
                $invitationLink = CONF_ROOT_URL . '/index.html?invitation=' . $code;
                $insertCount++;
                if( $insertCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $insertValues[] = $userCompanyInvitationId;
                $sqlQuery = $sqlQuery . '($' . $insertCount;
                
                $insertCount++;
                $insertValues[] = 'APPO';
                $sqlQuery = $sqlQuery . ', $' . $insertCount .') ';
            }
            
            // Should any values be inserted?
            if( $insertCount > 0 ) {
                // Execute the query and return the result
                $sqlResult = $db->paramQuery($sqlQuery, $insertValues);
                if( !$sqlResult->isValid() ) {
                    echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                    return false;
                }
            }
            
            // Load company name from database
            $companyName = '';
            $sqlQuery = 'SELECT name FROM companies WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            if( $sqlRow = $sqlResult->fetchAssociative() ) {
                $companyName = $sqlRow['name'];
            }
            
            // Commit SQL transaction
            $db->commitTransaction();
            
            System::useModule('phpmailer');
            // Send the email
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->charSet = 'UTF-8';
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
            
            // Load the template to send.
            $mailText = file_get_contents( CONF_SYSTEM_DIR . 'email_templates/user_company_invitation.html' );
            $mailText = str_replace('$SENDER_NAME', $user['name'], $mailText);
            $mailText = str_replace('$RECIPIENT_NAME', $data['name'], $mailText);
            $mailText = str_replace('$COMPANY_NAME', $companyName, $mailText);
            $mailText = str_replace('$INVITATION_LINK', $invitationLink, $mailText);
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys');
            $mail->addAddress($data['emailAddress'], '');
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = 'Payaccsys Payroll: Invitation to join ' . $companyName;
            $mail->Body    = $mailText;
            $mail->AltBody = $mailText;
            
            $mail->send();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to remove user from company
        //
        // Required Parameters
        //  invitationId                The id of the invite to resend
        //
        // Optional Parameters
        //  None
        public function removeUser($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'userId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check that the user revoking the access is still active and has access to the company
            $sqlQuery = 
                'SELECT ' . 
                    'user_company_access.user_id, user_company_access.company_id, user_company_access.revoked, ' . 
                    'users.is_active ' . 
                'FROM ' . 
                    'user_company_access ' . 
                'LEFT JOIN ' . 
                    'users ON user_company_access.user_id = users.id ' . 
                'WHERE ' . 
                    'user_company_access.user_id = $1 AND user_company_access.company_id = $2 AND user_company_access.revoked = FALSE;'; 
            $sqlResult = $db->paramQuery($sqlQuery, [$user['id'], $user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // If we did not find precisely on row then there was an error
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'You no longer have access to this company and cannot remove it\'s users.']) );
                return false;
            }
            
            // Check that the user is active
            $sqlRow = $sqlResult->fetchAssociative();
            if( $sqlRow['is_active'] !== true ) {
                echo( json_encode(['ok' => false, 'error' => 'You cannot remove users from this company because your account is no longer active.']) );
                return false;
            }
            
            // Start an SQL transaction
            $db->startTransaction();
            
            // Set the revoked flag to true and store the time the access was revoked.
            $sqlQuery = 
                'UPDATE user_company_access SET ' .
                    'revoked = true, ' .
                    'revoked_on = $1 ' .
                'WHERE ' . 
                    'user_id = $2 AND company_id = $3 ';
            $sqlResult = $db->paramQuery($sqlQuery, [date('Y-m-d H:i:s'), $data['userId'], $user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Invalidate all user sessions for this company
            $sqlQuery = 'UPDATE user_sessions SET lifetime = 0 WHERE user_id = $1 AND company_id = $2;';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['userId'], $user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Commit the transaction
            $db->commitTransaction();
            
            // Send result
            echo( json_encode([
                'ok' => true
            ]) );
            
            return true;
        }
        
        // Function to update user
        //
        // Required Parameters
        //  userId              The id of user to update
        //  name                The name of user to update
        //  email               The email of user to update
        //
        // Optional Parameters
        //  isActive                The name of the user if registering.
        //  cellNumber              The cellphone number of the user if registering.
        
        public function update($data, $user, $db) {
            
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'name' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'alias' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'registrationNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressUnit' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressComplex' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressStreet' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressSuburb' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCity' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressPostalCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'physicalAddressCountryCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'postalAddressLine1' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine2' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressLine3' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'postalAddressCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'telNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'faxNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'emailAddress' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'payeReferenceNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sdlPaymentReferenceNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'uifPaymentReferenceNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'uifRegistrationNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sicCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'etiStatusCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'specialEconomicZoneCode' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => true],
                'diplomaticIndemnity' => ['type' => Json::TYPE_BOOL, 'required' => false, 'nullable' => false],
                'sarsContactPerson' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sarsContactEmailAddress' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'sarsContactNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'uifContactPerson' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'uifContactEmailAddress' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'uifContactNumber' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            $sqlQuery =
                'SELECT id FROM company_details ORDER BY id DESC LIMIT 1';
            $sqlResult = $db->paramQuery($sqlQuery, []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            if( $sqlResult->getRowCount() !== 1 ) {
                $sqlQuery =
                    'INSERT INTO company_details( ' .
                            'name, alias, registration_number, physical_address_unit,  ' .
                            'physical_address_complex, physical_address_street, physical_address_suburb,  ' .
                            'physical_address_city, physical_address_postal_code, physical_address_country_code,  ' .
                            'postal_address_line_1, postal_address_line_2, postal_address_line_3,  ' .
                            'postal_address_code, tel_number, fax_number, email_address, ' .
                            'paye_reference_number, sdl_payment_reference_number, ' .
                            'uif_payment_reference_number, uif_registration_number, sic_code,  ' .
                            'eti_status_code, special_economic_zone_code, diplomatic_indemnity,  ' .
                            'sars_contact_first_name, sars_contact_last_name, sars_contact_email_address, ' .
                            'sars_contact_business_number, sars_contact_cell_number, ' .
                            'uif_contact_person, uif_contact_email_address, uif_contact_number) ' .
                    'VALUES ( ' .
                        '\'\', ' .                      // name
                        '\'\', ' .                      // alias
                        '\'\', ' .                      // registration_number
                        '\'\', ' .                      // physical_address_unit
                        '\'\', ' .                      // physical_address_complex
                        '\'\', ' .                      // physical_address_street
                        '\'\', ' .                      // physical_address_suburb
                        '\'\', ' .                      // physical_address_city
                        '\'\', ' .                      // physical_address_postal_code
                        'null, ' .                      // physical_address_country_code
                        '\'\', ' .                      // postal_address_line_1
                        '\'\', ' .                      // postal_address_line_2
                        '\'\', ' .                      // postal_address_line_3
                        '\'\', ' .                      // postal_address_code
                        '\'\', ' .                      // tel_number
                        '\'\', ' .                      // fax_number
                        '\'\', ' .                      // email_address
                        '\'\', ' .                      // paye_reference_number
                        '\'\', ' .                      // sdl_payment_reference_number
                        '\'\', ' .                      // uif_payment_reference_number
                        '\'\', ' .                      // uif_registration_number
                        'null, ' .                      // sic_code
                        'null, ' .                      // eti_status_code
                        'null, ' .                      // special_economic_zone_code
                        'false, ' .                     // diplomatic_indemnity
                        '\'\', ' .                      // sars_contact_first_name
                        '\'\', ' .                      // sars_contact_last_name
                        '\'\', ' .                      // sars_contact_email_address
                        '\'\', ' .                      // sars_contact_business_number
                        '\'\', ' .                      // sars_contact_cell_number
                        '\'\', ' .                      // uif_contact_person
                        '\'\', ' .                      // uif_contact_email_address
                        '\'\' ' .                       // uif_contact_number
                        ') RETURNING id; ';
                    $sqlResult = $db->paramQuery($sqlQuery, []);
                    if( !$sqlResult->isValid() ) {
                        echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                        return false;
                    }
                    $sqlRow = $sqlResult->fetchAssociative();
                    $companyId = $sqlRow['id'];
            }
            else {
                $sqlRow = $sqlResult->fetchAssociative();
                $companyId = $sqlRow['id'];
            }
            
            // Build the query to update the client
            $updateCount = 0;
            $updateValues = [];
            $sqlQuery = 'UPDATE company_details SET ';
            
            if( isset($data['name']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'name = $' . $updateCount;
                $updateValues[] = $data['name'];
            }
            
            if( isset($data['alias']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'alias = $' . $updateCount;
                $updateValues[] = $data['alias'];
            }
            
            if( isset($data['registrationNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'registration_number = $' . $updateCount;
                $updateValues[] = $data['registrationNumber'];
            }
            
            if( isset($data['physicalAddressUnit']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_unit = $' . $updateCount;
                $updateValues[] = $data['physicalAddressUnit'];
            }
            
            if( isset($data['physicalAddressComplex']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_complex = $' . $updateCount;
                $updateValues[] = $data['physicalAddressComplex'];
            }
            
            if( isset($data['physicalAddressStreet']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_street = $' . $updateCount;
                $updateValues[] = $data['physicalAddressStreet'];
            }
            
            if( isset($data['physicalAddressSuburb']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_suburb = $' . $updateCount;
                $updateValues[] = $data['physicalAddressSuburb'];
            }
            
            if( isset($data['physicalAddressCity']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_city = $' . $updateCount;
                $updateValues[] = $data['physicalAddressCity'];
            }
            
            if( isset($data['physicalAddressPostalCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_postal_code = $' . $updateCount;
                $updateValues[] = $data['physicalAddressPostalCode'];
            }
            
            if( isset($data['physicalAddressCountryCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'physical_address_country_code = $' . $updateCount;
                $updateValues[] = $data['physicalAddressCountryCode'];
            }
            
            if( isset($data['postalAddressLine1']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'postal_address_line_1 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine1'];
            }
            
            if( isset($data['postalAddressLine2']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'postal_address_line_2 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine2'];
            }
            
            if( isset($data['postalAddressLine3']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'postal_address_line_3 = $' . $updateCount;
                $updateValues[] = $data['postalAddressLine3'];
            }
            
            if( isset($data['postalAddressCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'postal_address_code = $' . $updateCount;
                $updateValues[] = $data['postalAddressCode'];
            }
            
            if( isset($data['telNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'tel_number = $' . $updateCount;
                $updateValues[] = $data['telNumber'];
            }
            
            if( isset($data['faxNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'fax_number = $' . $updateCount;
                $updateValues[] = $data['faxNumber'];
            }
            
            if( isset($data['emailAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'email_address = $' . $updateCount;
                $updateValues[] = $data['emailAddress'];
            }
            
            if( isset($data['payeReferenceNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'paye_reference_number = $' . $updateCount;
                $updateValues[] = $data['payeReferenceNumber'];
            }
            
            if( isset($data['sdlPaymentReferenceNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sdl_payment_reference_number = $' . $updateCount;
                $updateValues[] = $data['sdlPaymentReferenceNumber'];
            }
            
            if( isset($data['uifPaymentReferenceNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'uif_payment_reference_number = $' . $updateCount;
                $updateValues[] = $data['uifPaymentReferenceNumber'];
            }
            
            if( isset($data['uifRegistrationNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'uif_registration_number = $' . $updateCount;
                $updateValues[] = $data['uifRegistrationNumber'];
            }
            
            if( isset($data['sicCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sic_code = $' . $updateCount;
                $updateValues[] = $data['sicCode'];
            }
            
            if( isset($data['etiStatusCode']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'eti_status_code = $' . $updateCount;
                $updateValues[] = $data['etiStatusCode'];
            }
            
            if( array_key_exists('specialEconomicZoneCode', $data) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'special_economic_zone_code = $' . $updateCount;
                $updateValues[] = $data['specialEconomicZoneCode'];
            }
            
            if( isset($data['diplomaticIndemnity']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'diplomatic_indemnity = $' . $updateCount;
                $updateValues[] = $data['diplomaticIndemnity'];
            }
            
            if( isset($data['sarsContactFirstName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sars_contact_first_name = $' . $updateCount;
                $updateValues[] = $data['sarsContactFirstName'];
            }
            
            if( isset($data['sarsContactLastName']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sars_contact_last_name = $' . $updateCount;
                $updateValues[] = $data['sarsContactLastName'];
            }
            
            if( isset($data['sarsContactEmailAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sars_contact_email_address = $' . $updateCount;
                $updateValues[] = $data['sarsContactEmailAddress'];
            }
            
            if( isset($data['sarsContactBusinessNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sars_contact_business_number = $' . $updateCount;
                $updateValues[] = $data['sarsContactBusinessNumber'];
            }
            
            if( isset($data['sarsContactCellNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'sars_contact_cell_number = $' . $updateCount;
                $updateValues[] = $data['sarsContactCellNumber'];
            }
            
            if( isset($data['uifContactPerson']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'uif_contact_person = $' . $updateCount;
                $updateValues[] = $data['uifContactPerson'];
            }
            
            if( isset($data['uifContactEmailAddress']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'uif_contact_email_address = $' . $updateCount;
                $updateValues[] = $data['uifContactEmailAddress'];
            }
            
            if( isset($data['uifContactNumber']) ) {
                $updateCount++;
                if( $updateCount > 1 ) $sqlQuery = $sqlQuery . ', ';
                $sqlQuery = $sqlQuery . 'uif_contact_number = $' . $updateCount;
                $updateValues[] = $data['uifContactNumber'];
            }
            
            // Set where clause
            $updateCount++;
            $sqlQuery = $sqlQuery . ' WHERE id = $' . $updateCount . ';';
            $updateValues[] = $companyId;
            
            $sqlResult = $db->paramQuery($sqlQuery, $updateValues);
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
        
        // Function to request the creation of a new company
        //
        // Required Parameters
        //  companyName                 The name of the new company
        //  companyAlias                The alias of the new company
        //  userName                    The name of the user 
        //  userEmailAddress            The user's email address
        //
        // Optional Parameters
        //  physicalAddressLine1        Line 1 of the company physical address
        //  physicalAddressLine2        Line 2 of the company physical address
        //  physicalAddressLine3        Line 3 of the company physical address
        //  physicalAddressCode         Postal code of the company physical address
        //  postalAddressLine1          Line 1 of the company postal address
        //  postalAddressLine2          Line 2 of the company postal address
        //  postalAddressLine3          Line 3 of the company postal address
        //  postalAddressCode           Postal code of the company postal address
        //  companyContactPerson        The company contact person
        //  userPhoneNumber             The company phone number
        //  companyEmailAddress         The company email address
        public function requestNew($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'physicalAddressLine1' => '',
                'physicalAddressLine2' => '',
                'physicalAddressLine3' => '',
                'physicalAddressCode' => '',
                'postalAddressLine1' => '',
                'postalAddressLine2' => '',
                'postalAddressLine3' => '',
                'postalAddressCode' => '',
                'companyContactPerson' => '',
                'userPhoneNumber' => '',
                'companyEmailAddress' => ''
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'companyAlias' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'numberOfEmployees' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'userName' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'userEmailAddress' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set our search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Save the company request
            $sqlQuery = 
                'INSERT INTO new_company_requests (' .
                    'company_name, ' . 
                    'company_alias, ' . 
                    'number_of_employees, ' . 
                    'physical_address_line_1, ' . 
                    'physical_address_line_2, ' . 
                    'physical_address_line_3, ' . 
                    'physical_address_code, ' . 
                    'postal_address_line_1, ' . 
                    'postal_address_line_2, ' . 
                    'postal_address_line_3, ' . 
                    'postal_address_code, ' . 
                    'company_contact_person, ' . 
                    'company_phone_number, ' . 
                    'company_email_address, ' . 
                    'user_name, ' . 
                    'user_phone_number, ' . 
                    'user_email_address, ' . 
                    'created_on, ' . 
                    'processed_on ' .
                ') ' .
                'VALUES (' .
                    '$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19 ' . 
                ');';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['companyName'],               // company_name
                $data['companyAlias'],              // company_alias
                $data['numberOfEmployees'],         // number_of_employees
                $data['physicalAddressLine1'],      // physical_address_line_1
                $data['physicalAddressLine2'],      // physical_address_line_2
                $data['physicalAddressLine3'],      // physical_address_line_3
                $data['physicalAddressCode'],       // physical_address_code
                $data['postalAddressLine1'],        // postal_address_line_1
                $data['postalAddressLine2'],        // postal_address_line_2
                $data['postalAddressLine3'],        // postal_address_line_3
                $data['postalAddressCode'],         // postal_address_code
                $data['companyContactPerson'],      // company_contact_person
                $data['companyPhoneNumber'],        // company_phone_number
                $data['companyEmailAddress'],       // company_email_address
                $data['userName'],                  // user_name
                $data['userPhoneNumber'],           // user_phone_number
                $data['userEmailAddress'],          // user_email_address
                date('Y-m-d H:i:s'),                // created_on
                null                                // processed_on
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Use the mailer module to send a notification
            System::useModule('phpmailer');
            
            // Send the email
            $mail = new PHPMailer\PHPMailer\PHPMailer();
            
            //Set SMPT settings
            $mail->isSMTP();
            $mail->Host = CONF_SMTP_HOST;
            $mail->Port = CONF_SMTP_PORT;
            $mail->charSet = 'UTF-8';
            $mail->SMTPAuth = true;
            $mail->Username = CONF_SMTP_USERNAME;
            $mail->Password = CONF_SMTP_PASSW;
            
            //Recipients
            $mail->setFrom(CONF_EMAIL_FROMADDRESS, 'Payaccsys Payroll');
            $mail->addAddress('hein@lexpro.co.za', 'Hein Low');
            $mail->addAddress('julian@lexpro.co.za', 'Julian van Eck');
            $mail->addAddress('alicia@lexpro.co.za', 'Alicia de Lange');
            
            // Set the email text
            $htmlBody = 
                'Team,<br><br>' .
                'Please see details of a new company request for the Payaccsys Payroll system.<br><br>' .
                'Company Name: ' . $data['companyName'] . '<br>' .
                'Company Alias: ' . $data['companyAlias'] . '<br>' .
                'Number of Employees: ' . $data['numberOfEmployees'] . '<br><br>' .
                'Physical Address Line 1: ' . $data['physicalAddressLine1'] . '<br>' .
                'Physical Address Line 2: ' . $data['physicalAddressLine2'] . '<br>' .
                'Physical Address Line 3: ' . $data['physicalAddressLine3'] . '<br>' .
                'Physical Address Code: ' . $data['physicalAddressCode'] . '<br><br>' .
                'Postal Address Line 1: ' . $data['postalAddressLine1'] . '<br>' .
                'Postal Address Line 2: ' . $data['postalAddressLine2'] . '<br>' .
                'Postal Address Line 3: ' . $data['postalAddressLine3'] . '<br>' .
                'Postal Address Code: ' . $data['postalAddressCode'] . '<br><br>' .
                'Company Contact Person: ' . $data['companyContactPerson'] . '<br>' .
                'Company Phone Number: ' . $data['companyPhoneNumber'] . '<br>' .
                'Company Email Address: ' . $data['companyEmailAddress'] . '<br><br>' .
                'User Name: ' . $data['userName'] . '<br>' .
                'User Phone Number: ' . $data['userPhoneNumber'] . '<br>' .
                'User Email Address: ' . $data['userEmailAddress'] . '<br>' .
                'Created On: ' . date('Y-m-d H:i:s') . '<br><br>' .
                'Regards<br>' .
                'Payaccsys Payroll Admin<br><br>';
            
            $plainTexBody = 
                'Team,\r\n\r\n' .
                'Please see details of a new company request for the Payaccsys Payroll system.\r\n\r\n' .
                'Company Name: ' . $data['companyName'] . '\r\n' .
                'Company Alias: ' . $data['companyAlias'] . '\r\n' .
                'Number of Employees: ' . $data['numberOfEmployees'] . '\r\n\r\n' .
                'Physical Address Line 1: ' . $data['physicalAddressLine1'] . '\r\n' .
                'Physical Address Line 2: ' . $data['physicalAddressLine2'] . '\r\n' .
                'Physical Address Line 3: ' . $data['physicalAddressLine3'] . '\r\n' .
                'Physical Address Code: ' . $data['physicalAddressCode'] . '\r\n\r\n' .
                'Postal Address Line 1: ' . $data['postalAddressLine1'] . '\r\n' .
                'Postal Address Line 2: ' . $data['postalAddressLine2'] . '\r\n' .
                'Postal Address Line 3: ' . $data['postalAddressLine3'] . '\r\n' .
                'Postal Address Code: ' . $data['postalAddressCode'] . '\r\n\r\n' .
                'Company Contact Person: ' . $data['companyContactPerson'] . '\r\n' .
                'Company Phone Number: ' . $data['companyPhoneNumber'] . '\r\n' .
                'Company Email Address: ' . $data['companyEmailAddress'] . '\r\n\r\n' .
                'User Name: ' . $data['userName'] . '\r\n' .
                'User Phone Number: ' . $data['userPhoneNumber'] . '\r\n' .
                'User Email Address: ' . $data['userEmailAddress'] . '\r\n' .
                'Created On: ' . date('Y-m-d H:i:s') . '\r\n\r\n' .
                'Regards\r\n' .
                'Payaccsys Payroll Admin\r\n\r\n';
            
            // Set the email content
            $mail->isHTML(true);    // Set email format to HTML
            $mail->Subject = 'New Company Request: ' . $data['companyAlias'];
            $mail->Body    = $htmlBody;
            $mail->AltBody = $plainTexBody;
            
            // Send the email
            $mail->send();
            
            // Send result
            echo( json_encode(['ok' => true]) );
            return true;
        }
        
        // Function to list company bank account
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getBankAccountList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC'
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' WHERE (financial_institutions.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
                $sqlParams[] = $data['offset'];
                $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
            }
            
            // Load all bank accounts in the company_bank_accounts table
            $sqlQuery = 
                'SELECT ' .
                    'company_bank_accounts.id, ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name, ' .
                    'bank_account_types.code AS bank_account_type_code, ' .
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'company_bank_accounts.account_number, ' .
                    'company_bank_accounts.branch_code ' .
                'FROM ' .
                    'company_bank_accounts ' .
                'LEFT JOIN ' .
                    'financial_institutions ON financial_institutions.code = company_bank_accounts.financial_institution_code ' .
                'LEFT JOIN ' .
                    'bank_account_types ON bank_account_types.code = company_bank_accounts.bank_account_type_code ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'financial_institutions.name ' . $data['sortOrder'] . ' ' . 
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create banks array
            $accounts = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $accounts[] = [
                    'id' => $sqlRow['id'],
                    'financialInstitutionCode' => $sqlRow['financial_institution_code'],
                    'financialInstitutionName' => $sqlRow['financial_institution_name'],
                    'bankAccountTypeCode' => $sqlRow['bank_account_type_code'],
                    'bankAccountTypeName' => $sqlRow['bank_account_type_name'],
                    'accountNumber' => $sqlRow['account_number'],
                    'branchCode' => $sqlRow['branch_code']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'accounts' => $accounts]) );
            return true;
        }
        
        // Function to list bank names
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  searchString            A string value that is used to filter the result 
        //  limit                   The maximum number of rows to return
        //  offset                  The offeset value of the result
        //  sortOrder               The order in which the result shoud be sorted (ASC or DESC)
        public function getBankList($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [
                'searchString' => '',
                'limit' => null,
                'offset' => null,
                'sortOrder' => 'ASC'
            ];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Optional parameters
                'searchString' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false],
                'limit' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'offset' => ['type' => Json::TYPE_INT, 'required' => false, 'nullable' => true],
                'sortOrder' => ['type' => Json::TYPE_STRING, 'required' => false, 'nullable' => false]
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
                $whereClause = $whereClause . ' WHERE (financial_institutions.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
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
                $sqlParams[] = $data['offset'];
                $limitOffset = $limitOffset . 'OFFSET $' . count($sqlParams) . ' ';
            }
            
            // Load all bank accounts in the company_bank_accounts table
            $sqlQuery = 
                'SELECT ' .
                    'company_bank_accounts.id, ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name, ' .
                    'bank_account_types.code AS bank_account_type_code, ' .
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'company_bank_accounts.account_number, ' .
                    'company_bank_accounts.branch_code ' .
                'FROM ' .
                    'company_bank_accounts ' .
                'LEFT JOIN ' .
                    'financial_institutions ON financial_institutions.code = company_bank_accounts.financial_institution_code ' .
                'LEFT JOIN ' .
                    'bank_account_types ON bank_account_types.code = company_bank_accounts.bank_account_type_code ' .
                $whereClause . ' ' .
                'ORDER BY ' .
                    'financial_institutions.name ' . $data['sortOrder'] . ', ' . 
                    'company_bank_accounts.account_number ' . $data['sortOrder'] . ' ' .
                $limitOffset;
            $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create banks array
            $accounts = [];
            while( $sqlRow = $sqlResult->fetchAssociative() ) {
                $accounts[] = [
                    'id' => $sqlRow['id'],
                    'financialInstitutionCode' => $sqlRow['financial_institution_code'],
                    'financialInstitutionName' => $sqlRow['financial_institution_name'],
                    'bankAccountTypeCode' => $sqlRow['bank_account_type_code'],
                    'bankAccountTypeName' => $sqlRow['bank_account_type_name'],
                    'accountNumber' => $sqlRow['account_number'],
                    'branchCode' => $sqlRow['branch_code']
                ];
            }
            
            // Send result
            echo( json_encode(['ok' => true, 'accounts' => $accounts]) );
            return true;
        }
        
        
        // Function to add a bank account
        //
        // Required Parameters
        //  financialInstitutionCode           financialInstitutionCode of the company bank account to add
        //  bankTypeCode                       bankTypeCode of the company bank account to add
        //  accountNumber                      accountNumber of the company bank account to add
        //  branchCode                         branchCode of the company bank account to add
        //
        // Optional Parameters
        //  None
        public function addBank($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'financialInstitutionCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'bankTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accountNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'branchCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Add an invitation for the user
            $sqlQuery =
                'INSERT INTO ' .
                    'company_bank_accounts ('.
                        'financial_institution_code, ' .
                        'bank_account_type_code, ' .
                        'account_number, ' .
                        'branch_code ' .
                    ') ' .
                'VALUES ' .
                    '($1, $2, $3, $4) ' .
                'RETURNING id;';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['financialInstitutionCode'],              // financial_institution_code
                $data['bankTypeCode'],                          // bank_account_type_code
                $data['accountNumber'],                         // account_number
                $data['branchCode'],                            // branch_code
            ]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            $sqlRow = $sqlResult->fetchAssociative();
            
            // Send result
            echo( json_encode(['ok' => true, 'companyBankAccountId' => $sqlRow['id']]) );
            
            return true;
        }
        
        // Function to get bank account
        //
        // Required Parameters
        //  companyBankAccountId            ID of bank account to get
        //
        // Optional Parameters
        //
        public function getBankAccount($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                // Required parameters
                'companyBankAccountId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                // Optional parameters
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            
            //
            // BUILD QUERY
            //
            
            $sqlParams = [];
            
            // Load all bank accounts in the company_bank_accounts table
            $sqlQuery = 
                'SELECT ' .
                    'company_bank_accounts.id, ' .
                    'financial_institutions.code AS financial_institution_code, ' .
                    'financial_institutions.name AS financial_institution_name, ' .
                    'bank_account_types.code AS bank_account_type_code, ' .
                    'bank_account_types.name AS bank_account_type_name, ' .
                    'company_bank_accounts.account_number, ' .
                    'company_bank_accounts.branch_code ' .
                'FROM ' .
                    'company_bank_accounts ' .
                'LEFT JOIN ' .
                    'financial_institutions ON financial_institutions.code = company_bank_accounts.financial_institution_code ' .
                'LEFT JOIN ' .
                    'bank_account_types ON bank_account_types.code = company_bank_accounts.bank_account_type_code ' .
                'WHERE company_bank_accounts.id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['companyBankAccountId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Create banks array
            $accounts = [];
            $sqlRow = $sqlResult->fetchAssociative();
            
            $accounts = [
                'id' => $sqlRow['id'],
                'financialInstitutionCode' => $sqlRow['financial_institution_code'],
                'financialInstitutionName' => $sqlRow['financial_institution_name'],
                'bankAccountTypeCode' => $sqlRow['bank_account_type_code'],
                'bankAccountTypeName' => $sqlRow['bank_account_type_name'],
                'accountNumber' => $sqlRow['account_number'],
                'branchCode' => $sqlRow['branch_code']
            ];
            
            // Send result
            echo( json_encode(['ok' => true, 'accounts' => $accounts]) );
            return true;
        }
        
        // Function to update a bank account
        //
        // Required Parameters
        //  companyBankAccountId               companyBankAccountId to update
        //  financialInstitutionCode           financialInstitutionCode of the company bank account to update
        //  bankTypeCode                       bankTypeCode of the company bank account to update
        //  accountNumber                      accountNumber of the company bank account to update
        //  branchCode                         branchCode of the company bank account to update
        //
        // Optional Parameters
        //  None
        public function updateBank($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyBankAccountId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false],
                'financialInstitutionCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'bankTypeCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'accountNumber' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false],
                'branchCode' => ['type' => Json::TYPE_NON_EMPTY_STRING, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // update account
            $sqlQuery =
                'UPDATE ' .
                    'company_bank_accounts ' .
                'SET ' .
                    'financial_institution_code = $1, ' .
                    'bank_account_type_code = $2, ' .
                    'account_number = $3, ' .
                    'branch_code = $4 ' .
                'WHERE  ' .
                    'company_bank_accounts.id = $5 ';
            $sqlResult = $db->paramQuery($sqlQuery, [
                $data['financialInstitutionCode'],              // financial_institution_code
                $data['bankTypeCode'],                          // bank_account_type_code
                $data['accountNumber'],                         // account_number
                $data['branchCode'],                            // branch_code
                $data['companyBankAccountId']
            ]);
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
        
        // Function to remove a bank account
        //
        // Required Parameters
        //  companyBankAccountId               companyBankAccountId to remove
        //
        // Optional Parameters
        //  None
        public function removeBank($data, $user, $db) {
            // Set content type header
            header('Content-Type: application/json');
            
            // Set default parameter values
            $defaults = [];
            Json::copy($defaults, $data);
            
            // Validate data.
            $validationResult = Json::validate($data, [
                'companyBankAccountId' => ['type' => Json::TYPE_INT, 'required' => true, 'nullable' => false]
            ]);
            if( $validationResult !== true ) {
                echo( json_encode(['ok' => false, 'error' => $validationResult]) );
                return false;
            }
            
            // User's company id must not be null
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Remove account
            $sqlQuery = 'DELETE FROM company_bank_accounts WHERE id = $1';
            $sqlResult = $db->paramQuery($sqlQuery, [$data['companyBankAccountId']]);
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
        
        // Function to get company trial details (if any)
        //
        // Required Parameters
        //  None
        //
        // Optional Parameters
        //  None
        //
        public function getTrialDetails($data, $user, $db) : bool {
            // Set content type header
            header('Content-Type: application/json');
            
            // Was no company selected?
            if( $user['companyId'] === null ) {
                echo( json_encode(['ok' => false, 'error' => 'No company selected.']) );
                return false;
            }
            
            // Connect to the system database
            $dbConnected = $db->connect(
                "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
                "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
            );
            if( $dbConnected !== true ) {
                echo( json_encode(['ok' => true, 'error' => 'Unable to connect to system database.']) );
                return false;
            }
            
            // Set search path to system
            $sqlResult = $db->paramQuery('SET search_path TO system;', []);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Load company trial details from id
            $sqlQuery = 
                'SELECT ' . 
                    'companies.name AS company_name, ' . 
                    'companies.is_trial, ' . 
                    'companies.trial_starts_on, ' . 
                    'companies.trial_expires_on, ' . 
                    '(companies.trial_expires_on - CURRENT_DATE) AS days_remaining, ' . 
                    'consultants.name AS consultant_name, ' .
                    'consultants.email_address AS consultant_email_address, ' .
                    'consultants.cell_number AS consultant_cell_number, ' .
                    'consultants.tel_number AS consultant_tel_number ' .
                'FROM ' . 
                    'companies ' . 
                'LEFT JOIN ' . 
                    'consultants ON companies.consultant_id = consultants.id ' . 
                'WHERE ' . 
                    'companies.id = $1;';
            $sqlResult = $db->paramQuery($sqlQuery, [$user['companyId']]);
            if( !$sqlResult->isValid() ) {
                echo( json_encode(['ok' => false, 'error' => 'Database error.']) );
                return false;
            }
            
            // Check if we found the company
            if( $sqlResult->getRowCount() !== 1 ) {
                echo( json_encode(['ok' => false, 'error' => 'Company not found.']) );
                return false;
            }
            
            // Load the company details
            $sqlRow = $sqlResult->fetchAssociative();
            $trialDetails = [
                'companyName' => $sqlRow['company_name'],
                'isTrial' => $sqlRow['is_trial'],
                'startsOn' => $sqlRow['trial_starts_on'],
                'expiresOn' => $sqlRow['trial_expires_on'],
                'daysRemaining' => $sqlRow['days_remaining'],
                'consultantName' => $sqlRow['consultant_name'],
                'consultantEmailAddress' => $sqlRow['consultant_email_address'],
                'consultantCellNumber' => $sqlRow['consultant_cell_number'],
                'consultantTelNumber' => $sqlRow['consultant_tel_number']
            ];
            
            echo( json_encode(['ok' => true, 'trialDetails' => $trialDetails]) );
            return true;
        }
    }
?>
