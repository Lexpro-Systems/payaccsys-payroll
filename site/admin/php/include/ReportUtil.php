<?php
    // Set namespace
    namespace ReportUtil;
    
    // Import namespaces
    use \DateTime as DateTime;
    
    // Import files
    \System::includeFile('Util.php');
    
    // Function to get the data required for the active company report
    //
    // @param $data             An object containing the query parameters
    // @param $user             The user object
    // @param $db               The database object
    function getActiveCompanyData($data, $user, $db) {
        // Connect to the system database
        $dbConnected = $db->connect(
            "host='" . CONF_DB_HOST . "' port='" . CONF_DB_PORT . "' dbname='" . CONF_DB_NAME .
            "' user='" . CONF_DB_USER . "' password='" . CONF_DB_PASSWORD . "'"
        );
        if( $dbConnected !== true ) {
            return( ['ok' => false, 'error' => 'Unable to connect to \'' . CONF_DB_NAME . '\' database.'] );
        }
        
        // Set search path to system
        $sqlResult = $db->paramQuery('SET search_path TO system;', []);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Unable to set search path to \'' . 'system' . '\' schema.'] );
        }
        
        
        //
        // BUILD QUERY
        //
        
        $sqlParams = [];
        
        // Create the where clause
        $whereClause = '';
        if( isset($data['searchString']) && $data['searchString'] !== '' ) {
            $sqlParams[] = $data['searchString'];
            $whereClause = 
                ' WHERE (' . 
                'companies.name ILIKE \'%\' || $' . count($sqlParams) . '|| \'%\' ' . 
                ' OR companies.alias ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR companies.contact_person ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR companies.contact_number ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR companies.contact_email ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ' . 
                ' OR consultants.name ILIKE \'%\' || $' . count($sqlParams) . ' || \'%\' ) ';
        }
        
        // Add a filter for is enabled
        if( isset($data['isEnabled']) && ($data['isEnabled'] !== null) ) {
            if( $whereClause !== '' ) {
                $whereClause = $whereClause . ' AND ';
            }
            else {
                $whereClause = 'WHERE ';
            }
            
            $sqlParams[] = $data['isEnabled'];
            $whereClause = $whereClause . ' companies.is_active = $'. count($sqlParams) . ' ';
        }
        
        // Was a trial filter specified?
        if( isset($data['isTrial']) && ($data['isTrial'] !== null) ) {
            if( $whereClause !== '' ) {
                $whereClause = $whereClause . ' AND ';
            }
            else {
                $whereClause = 'WHERE ';
            }
            
            // Should only companies currently on trial be returned
            if( $data['isTrial'] ) {
                $whereClause = $whereClause . ' (';
                $whereClause = $whereClause . ' companies.is_trial = TRUE AND ';
                $whereClause = $whereClause . ' companies.trial_expires_on >= NOW() ';
                $whereClause = $whereClause . ') ';
            }
            else {
                $whereClause = $whereClause . ' (';
                $whereClause = $whereClause . ' companies.is_trial = TRUE AND ';
                $whereClause = $whereClause . ' companies.trial_expires_on < NOW() ';
                $whereClause = $whereClause . ') ';
            }
        }
        
        // Was an active filter specified?
        if( isset($data['isActive']) && ($data['isActive'] !== null) ) {
            if( $whereClause !== '' ) {
                $whereClause = $whereClause . ' AND ';
            }
            else {
                $whereClause = 'WHERE ';
            }
            
            // Should only companies currently on trial be returned
            if( $data['isActive'] ) {
                $whereClause = $whereClause . ' company_payrun_statistics.last_payrun IS NOT NULL ';
            }
            else {
                $whereClause = $whereClause . ' company_payrun_statistics.last_payrun IS NULL ';
            }
        }
        
        // Was a sort list specified?
        $sortClause = '';
        if( isset($data['sortList']) ) {
            // For every item in the sort list
            foreach( $data['sortList'] AS $sortItem ) {
                // Was a valid sort order specified?
                if( $sortItem['order'] !== 'ASC' && $sortItem['order'] !== 'DESC' ) {
                    return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
                }
                
                // Setup the column to sort by
                $column = '';
                switch( $sortItem['dataIndex'] ) {
                    case 'companyAlias':
                        $column = 'companies.alias';
                        break;
                    case 'contactPerson':
                        $column = 'companies.contact_person';
                        break;
                    case 'contactNumber':
                        $column = 'companies.contact_number';
                        break;
                    case 'contactEmail':
                        $column = 'companies.contact_email';
                        break;
                    case 'consultantName':
                        $column = 'consultants.name';
                        break;
                    case 'isEnabled':
                        $column = 'companies.is_active';
                        break;
                    case 'totalPayruns':
                        $column = 'company_payrun_statistics.total_payruns';
                        break;
                    case 'lastPayrun':
                        $column = 'COALESCE(company_payrun_statistics.last_payrun, \'1900-01-01\')';
                        break;
                    case 'trialExpiresOn':
                        $column = 'companies.trial_expires_on';
                        break;
                    case 'createdOn':
                        $column = 'companies.created_on';
                        break;
                    default:
                        return( ['ok' => false, 'error' => 'Invalid sort column specified'] );
                }
                
                // Build the sort clause
                if( $sortClause === '' ) {
                    $sortClause = 'ORDER BY ';
                }
                else {
                    $sortClause = $sortClause . ', ';
                }
                $sortClause = $sortClause . $column . ' ' . $sortItem['order'];
            }
        }
        
        // Add limit, if given
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
        
        // Make certian the company payrun statistics are up to date by calling the stored funtion
        $sqlQuery = 'SELECT refresh_company_payrun_statistics_view();';
        $sqlResult = $db->paramQuery($sqlQuery, []);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Unable to refresh company payrun statistics.'] );
        }
        
        // Load all company details
        $sqlQuery = 
            'SELECT ' .
                'companies.id, ' .
                'companies.name, ' .
                'companies.alias, ' .
                'companies.contact_person, ' .
                'companies.contact_number, ' .
                'companies.contact_email, ' .
                'companies.database_name, ' .
                'companies.database_schema, ' .
                'companies.database_host, ' .
                'companies.is_active, ' .
                'companies.owner_user_id, ' .
                'users.name AS owner_user_name, ' .
                'companies.consultant_id, ' .
                'consultants.name AS consultant_name, ' .
                'companies.is_trial, ' .
                'companies.trial_expires_on, ' .
                'companies.created_on, ' .
                'company_payrun_statistics.total_payruns, ' .
                'company_payrun_statistics.last_payrun ' .
            'FROM ' .
                'companies ' .
            'LEFT JOIN ' .
                'users ON users.id = companies.owner_user_id ' .
            'LEFT JOIN ' .
                'consultants ON consultants.id = companies.consultant_id ' .
            'LEFT JOIN ' .
                'company_payrun_statistics ON company_payrun_statistics.company_id = companies.id  ' .
            $whereClause . ' ' .
            $sortClause . ' ' . 
            $limitOffset;
        $sqlResult = $db->paramQuery($sqlQuery, $sqlParams);
        if( !$sqlResult->isValid() ) {
            return( ['ok' => false, 'error' => 'Database error.'] );
        }
        
        // Create the result
        $companies = [];
        while( $sqlRow = $sqlResult->fetchAssociative() ) {
            // // Was a trial filter specified?
            // if( isset($data['isTrial']) && ($data['isTrial'] !== null) ) {
            //     // Skip all non-trial companies
            //     if( !$sqlRow['is_trial'] ) continue;
                
            //     // Exclude results depending on filter
            //     if( (new DateTime($sqlRow['trial_expires_on']) < new DateTime()) && $data['isTrial'] ) {
            //         continue;
            //     }
            //     else if( (new DateTime($sqlRow['trial_expires_on']) >= new DateTime())&& !$data['isTrial'] ) {
            //         continue;
            //     }
            // }
            
            // Format the enabled value
            $isEnabled = 'No';
            if( $sqlRow['is_active'] ) {
                $isEnabled = 'Yes';
            }
            
            // Save the company details
            $companies[] = [
                'companyId' => $sqlRow['id'],
                'companyName' => $sqlRow['name'],
                'companyAlias' => $sqlRow['alias'],
                'contactPerson' => $sqlRow['contact_person'],
                'contactNumber' => $sqlRow['contact_number'],
                'contactEmail' => $sqlRow['contact_email'],
                'consultantName' => $sqlRow['consultant_name'],
                'isEnabled' => $isEnabled,
                'totalPayruns' => $sqlRow['total_payruns'],
                'lastPayrun' => $sqlRow['last_payrun'],
                'trialExpiresOn' => $sqlRow['trial_expires_on'],
                'createdOn' => $sqlRow['created_on']
            ];
        }
        
        // // Do manual sorting, if necessary
        // if( isset($data['sortList']) && ($orderTotalPayruns || $orderLastPayrun) ) {
        //     // For every item in the sort list
        //     $sortArrays = [];
        //     foreach( $data['sortList'] AS $sortItem ) {
        //         // Was a valid sort order specified?
        //         if( $sortItem['order'] !== 'ASC' && $sortItem['order'] !== 'DESC' ) {
        //             return( ['ok' => false, 'error' => 'Invalid sort order specified'] );
        //         }
                
        //         // Setup the column to sort by
        //         $column = '';
        //         switch( $sortItem['dataIndex'] ) {
        //             case 'companyAlias':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'companyAlias'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'contactPerson':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'contactPerson'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'contactNumber':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'contactNumber'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'contactEmail':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'contactEmail'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'consultantName':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'consultantName'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'isEnabled':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'isEnabled'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NUMERIC
        //                 ];
        //                 break;
        //             case 'totalPayruns':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'totalPayruns'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NUMERIC
        //                 ];
        //                break;
        //             case 'lastPayrun':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'lastPayrun'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'trialExpiresOn':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'trialExpiresOn'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             case 'createdOn':
        //                 $sortArrays[] = [
        //                     array_column($companies, 'createdOn'),
        //                     ($sortItem['order'] == 'ASC' ? SORT_ASC : SORT_DESC),
        //                     SORT_NATURAL | SORT_FLAG_CASE
        //                 ];
        //                 break;
        //             default:
        //                 return( ['ok' => false, 'error' => 'Invalid sort column specified'] );
        //         }
        //     }
            
        //     // Do the manual sort
        //     if( count($sortArrays) == 10 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $sortArrays[5][0], $sortArrays[5][1], $sortArrays[5][2],
        //             $sortArrays[6][0], $sortArrays[6][1], $sortArrays[6][2],
        //             $sortArrays[7][0], $sortArrays[7][1], $sortArrays[7][2],
        //             $sortArrays[8][0], $sortArrays[8][1], $sortArrays[8][2],
        //             $sortArrays[9][0], $sortArrays[9][1], $sortArrays[9][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 9 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $sortArrays[5][0], $sortArrays[5][1], $sortArrays[5][2],
        //             $sortArrays[6][0], $sortArrays[6][1], $sortArrays[6][2],
        //             $sortArrays[7][0], $sortArrays[7][1], $sortArrays[7][2],
        //             $sortArrays[8][0], $sortArrays[8][1], $sortArrays[8][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 8 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $sortArrays[5][0], $sortArrays[5][1], $sortArrays[5][2],
        //             $sortArrays[6][0], $sortArrays[6][1], $sortArrays[6][2],
        //             $sortArrays[7][0], $sortArrays[7][1], $sortArrays[7][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 7 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $sortArrays[5][0], $sortArrays[5][1], $sortArrays[5][2],
        //             $sortArrays[6][0], $sortArrays[6][1], $sortArrays[6][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 6 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $sortArrays[5][0], $sortArrays[5][1], $sortArrays[5][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 5 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $sortArrays[4][0], $sortArrays[4][1], $sortArrays[4][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 4 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $sortArrays[3][0], $sortArrays[3][1], $sortArrays[3][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 3 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $sortArrays[2][0], $sortArrays[2][1], $sortArrays[2][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 2 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $sortArrays[1][0], $sortArrays[1][1], $sortArrays[1][2],
        //             $companies
        //         );
        //     }
        //     else if( count($sortArrays) == 1 ) {
        //         array_multisort(
        //             $sortArrays[0][0], $sortArrays[0][1], $sortArrays[0][2],
        //             $companies
        //         );
        //     }
        // }
        
        // Return the result
        return( ['ok' => true, 'companies' => $companies] );
    }
?>