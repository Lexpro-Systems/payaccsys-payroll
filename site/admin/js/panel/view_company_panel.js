/* globals app, lx */
'use strict';


// VIEW BOOKSET PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ViewCompany = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var editBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var companyDetailsHeading = null;
    var companyDetailsSectionEl = null;
    var companyNameDisplay = null;
    var companyAliasDisplay = null;
    var companyContactPersonDisplay = null;
    var companyContactNumberDisplay = null;
    var companyContactEmailDisplay = null;
    var companyOwnerDisplay = null;
    var companyEmployeeLimitDisplay = null;
    var companyEmployeeCodeMaskDisplay = null;
    var payeCalculationTypeDisplay = null;
    var payeBonusCalculationTypeDisplay = null;
    var companyIsTrialDisplay = null;
    var companyTrialStartsOnDisplay = null;
    var companyTrialExpiresOnDisplay = null;
    var companyIsActiveDisplay = null;
    
    var companyAddressDetailsHeading = null;
    var companyAddressDetailsSectionEl = null;
    var physicalAddressDisplay = null;
    var postalAddressDisplay = null;
    
    var databaseDetailsHeading = null;
    var databaseDetailsSectionEl = null;
    var databaseNameDisplay = null;
    var databaseSchemaDisplay = null;
    var databaseHostDisplay = null;
    
    var groupDetailsHeading = null;
    var groupDetailsSectionEl = null;
    
    var consultantDetailsHeadingEl = null;
    var consultantDetailsSectionEl = null;
    var consultantContainerEl = null;
    var consultantSelect = null;
    var addConsultantBtn = null;
    
    var userDetailsHeadingEl = null;
    var userDetailsSectionEl = null;
    var inviteUserBtn = null;
    var usersGrid = null;
    
    var companyId = null;
    var adminGroups = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load consultants
    function loadConsultants(defaultId, defaultName, hasChanged) {
        lx.sendJSON({
            url: 'exec.php?c=Consultant&fn=getList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Consultants Failed',
                        message: response.error
                    });
                    return;
                }
                
                var consultants = [];
                consultants.push({value: null, text: 'None'});
                for( var i = 0; i < response.consultants.length; i++ ) {
                    consultants.push({
                        value: response.consultants[i].id,
                        text: response.consultants[i].name
                    });
                }
                
                consultantSelect.clear();
                consultantSelect.addItems( consultants );
                consultantSelect.setValue( defaultId, defaultName );
                
                // Has the consultant changed?
                if( hasChanged ) {
                    consultantSelectChangeEventHandler();
                }
            }
        });
    }
    
    // Function to load users
    function loadUsers() {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getUserList',
            data: {
                companyId: companyId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Users Failed',
                        message: response.error
                    });
                }
                
                // Load user invitations
                let users = [];
                for( let i = 0; i < response.invitations.length; i++ ) {
                    users.push({
                        type: 'INVI',
                        id: response.invitations[i].id,
                        icon: '<i class="far fa-envelope"></i>',
                        name: response.invitations[i].name,
                        email: response.invitations[i].emailAddress,
                        cellphone: '-',
                        status: response.invitations[i].status.name,
                        menu: '<i class="fa fa-ellipsis-v"></i>'
                    });
                }
                
                // Load users into the grid
                for( let i = 0; i < response.users.length; i++ ) {
                    users.push({
                        type: 'USER',
                        id: response.users[i].id,
                        icon: '<i class="far fa-user"></i>',
                        name: response.users[i].name,
                        email: response.users[i].emailAddress,
                        cellphone: response.users[i].cellNumber,
                        status: 'Active',
                        menu: '<i class="fa fa-ellipsis-v"></i>'
                    });
                }
                
                usersGrid.clear();
                usersGrid.addRows( users );
            }
        });
    }
    
    // Function to load company data
    function loadCompany() {
        loader.show();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            data: {
                id: companyId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Company Failed',
                        message: response.error
                    });
                    app.route.popState();
                    return;
                }
                
                var value = '-';
                
                value = '-';
                if( response.company.name !== '' ) value = response.company.name;
                companyNameDisplay.setValue( value );
                
                value = '-';
                if( response.company.alias !== '' ) value = response.company.alias;
                companyAliasDisplay.setValue( value );
                
                value = '-';
                if( response.company.contactPerson !== '' ) value = response.company.contactPerson;
                companyContactPersonDisplay.setValue( value );
                
                value = '-';
                if( response.company.contactNumber !== '' ) value = response.company.contactNumber;
                companyContactNumberDisplay.setValue( value );
                
                value = '-';
                if( response.company.contactEmail !== '' ) value = response.company.contactEmail;
                companyContactEmailDisplay.setValue( value );
                
                value = '-';
                if( response.company.ownerUserName !== '' ) value = response.company.ownerUserName;
                companyOwnerDisplay.setValue( value );
                
                var employeeLimit = '-';
                if( response.company.employeeLimit !== null ) employeeLimit = response.company.employeeLimit;
                companyEmployeeLimitDisplay.setValue( employeeLimit );
                
                var employeeCodeMask = '-';
                if( response.company.employeeCodeMask !== null ) employeeCodeMask = response.company.employeeCodeMask;
                companyEmployeeCodeMaskDisplay.setValue( employeeCodeMask );
                
                value = '-';
                if( response.company.payeCalculationTypeName !== '' ) value = response.company.payeCalculationTypeName;
                payeCalculationTypeDisplay.setValue( value );
                
                value = '-';
                if( response.company.payeBonusCalculationTypeName !== '' ) value = response.company.payeBonusCalculationTypeName;
                payeBonusCalculationTypeDisplay.setValue( value );
                
                var isTrial = 'No';
                if( response.company.isTrial ) isTrial = 'Yes';
                companyIsTrialDisplay.setValue( isTrial );
                
                value = '-';
                if( response.company.trialStartsOn !== null ) value = response.company.trialStartsOn;
                companyTrialStartsOnDisplay.setValue( value );
                
                value = '-';
                if( response.company.trialExpiresOn !== null ) value = response.company.trialExpiresOn;
                companyTrialExpiresOnDisplay.setValue( value );
                
                var isActive = 'No';
                if( response.company.isActive ) isActive = 'Yes';
                companyIsActiveDisplay.setValue( isActive );
                
                value = '-';
                if( response.company.databaseName !== '' ) value = response.company.databaseName;
                databaseNameDisplay.setValue( value );
                
                value = '-';
                if( response.company.databaseSchema !== '' ) value = response.company.databaseSchema;
                databaseSchemaDisplay.setValue( value );
                
                value = '-';
                if( response.company.databaseHost !== '' ) value = response.company.databaseHost;
                databaseHostDisplay.setValue( value );
                
                value = 'None';
                if( response.company.consultantId !== null ) value = response.company.consultantName;
                loadConsultants(response.company.consultantId , value, false);
                
                // Set physical address details
                value = '';
                if( response.company.physicalAddressUnit !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressUnit;
                }
                if( response.company.physicalAddressComplex !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressComplex;
                }
                if( response.company.physicalAddressStreet !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressStreet;
                }
                if( response.company.physicalAddressSuburb !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressSuburb;
                }
                if( response.company.physicalAddressCity !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressCity;
                }
                if( response.company.physicalAddressPostalCode !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressPostalCode;
                }
                if( response.company.physicalAddressCountryName !== null ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.physicalAddressCountryName;
                }
                
                if( value === '' ) value = '-';
                physicalAddressDisplay.setValue( value );
                
                // Set postal address details
                value = '';
                if( response.company.postalAddressLine1 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.postalAddressLine1;
                }
                if( response.company.postalAddressLine2 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.postalAddressLine2;
                }
                if( response.company.postalAddressLine3 !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.postalAddressLine3;
                }
                if( response.company.postalAddressCode !== '' ) {
                    if( value !== '' ) value = value + '<br />';
                    value = value + response.company.postalAddressCode;
                }
                
                if( value === '' ) value = '-';
                postalAddressDisplay.setValue( value );
                
                
                let companyGroups = response.company.groups;
                groupDetailsSectionEl.innerHTML = '';
                
                // Load all the available groups for the user
                lx.sendJSON({
                    url: 'exec.php?c=Group&fn=getList',
                    data: {
                        limitGroups: false
                    },
                    onSuccess: function( responseText ) {
                        var response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Loading Groups Failed',
                                message: response.error
                            });
                        }
                        
                        // For every group accessable by the current user
                        for( var i = 0; i < response.groups.length; i++ ) {
                            // Check if the group has access
                            let value = false;
                            for( var j = 0; j < companyGroups.length; j++ ) {
                                if( companyGroups[j].id == response.groups[i].id ) {
                                    value = true;
                                    break;
                                }
                            }
                            
                            // Set the margin depending on if it's the first item
                            let margin = '0px 0px 0px 0px';
                            if( i > 0 ) {
                                margin = '15px 0px 0px 0px';
                            }
                            
                            // Create a new group object and remember the id
                            let newGroup = {};
                            newGroup.groupId = response.groups[i].id;
                            
                            // Add a checkbox to the object and set the value
                            newGroup.groupCb = new lx.component.Checkbox({
                                renderTo: groupDetailsSectionEl,
                                label: response.groups[i].name,
                                labelAlign: 'left',
                                labelWidth: '220px',
                                maxWidth: '500px',
                                margin: margin,
                                
                                isChecked: true,
                                
                                onChange: groupCbChangeEventHandler
                            });
                            newGroup.groupCb.setValue(value);
                            
                            // Save the new group object
                            adminGroups.push( newGroup );
                        }
                    }
                });
                
                // Load all the users
                loadUsers();
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,
            
            companyId: null,
            companyName: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        
        // Initialize state
        confirmDestroy = false;
        companyId = compConfig.companyId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
                overflow: '',
                backgroundColor: '#F4F5F6'
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'View Company: ' + compConfig.companyName
        });
        
        // Create add button
        editBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Edit',
            margin: '0px 20px 0px auto',
            
            onClick: editBtnClickEventHandler
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'hidden'
            }
        });
        
        // Create our loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px 15px 15px 15px'
            }
        });
        
        
        //
        // COMPANY DETAILS SECTION
        //
        
        // Create the companyDetailsHeading element
        companyDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Company Details</div>'
        });
        
        // Create the companyDetailsSectionEl
        companyDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the companyNameDisplay component
        companyNameDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyAliasDisplay component
        companyAliasDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Alias',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyContactPersonDisplay component
        companyContactPersonDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Person',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyContactNumberDisplay component
        companyContactNumberDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Number',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyContactEmailDisplay component
        companyContactEmailDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Email',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyOwnerDisplay component
        companyOwnerDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Owner User',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyEmployeeLimitDisplay component
        companyEmployeeLimitDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employee Limit',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyEmployeeCodeMaskDisplay component
        companyEmployeeCodeMaskDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employee Code Mask',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the payeCalculationTypeDisplay component
        payeCalculationTypeDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'PAYE Calculation Method',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the payeBonusCalculationTypeDisplay component
        payeBonusCalculationTypeDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'PAYE Bonus Calculation Method',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyIsTrialDisplay component
        companyIsTrialDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyTrialStartsOnDisplay component
        companyTrialStartsOnDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial Start',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyTrialExpiresOnDisplay component
        companyTrialExpiresOnDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial End',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the companyIsActiveDisplay component
        companyIsActiveDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Active',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        companyAddressDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Address Details</div>'
        });
        
        companyAddressDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        physicalAddressDisplay = new lx.component.Display({
            renderTo: companyAddressDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Physical Address:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        postalAddressDisplay = new lx.component.Display({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Postal Address:',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        //
        // DATABASE DETAILS SECTION
        //
        
        // Create the databaseDetailsHeading element
        databaseDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Database Details</div>'
        });
        
        // Create databaseDetailsSectionEl
        databaseDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the databaseSchemaDisplay component
        databaseSchemaDisplay = new lx.component.Display({
            renderTo: databaseDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Schema',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the databaseNameDisplay component
        databaseNameDisplay = new lx.component.Display({
            renderTo: databaseDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Name',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the databaseHostDisplay component
        databaseHostDisplay = new lx.component.Display({
            renderTo: databaseDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Host',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        
        //
        // GROUP DETAILS SECTION
        //
        
        // Create the groupDetailsHeading element
        groupDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Admin Group Access</div>'
        });
        
        // Create groupDetailsSectionEl
        groupDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        
        //
        // CONSULTANT DETAILS SECTION
        //
        
        consultantDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Consultant Details</div>'
        });

        consultantDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });

        consultantContainerEl = lx.createElement('DIV', {
            parent: consultantDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px',
                alignItems: 'center',
                width: '100%'
            }
        });
        
        consultantSelect = new lx.component.Selectbox({
            renderTo: consultantContainerEl,
            margin: '0px 0px 0px 0px',
            label: 'Consultant',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: consultantSelectChangeEventHandler
        });
        
        addConsultantBtn = new lx.component.Button({
            renderTo: consultantContainerEl,
            label: 'Add',
            margin: '0px 0px 0px 15px',
            style: 'text',
            
            onClick: addConsultantBtnClickEventHandler
        });
        
        
        //
        // USERS SECTION
        //
        
        // Create the userDetailsHeadingEl element
        userDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>User Details</div>'
        });
        
        // Create inviteUserBtn component
        inviteUserBtn = new lx.component.Button({
            renderTo: userDetailsHeadingEl,
            label: 'Invite',
            style: 'text',
            
            onClick: inviteUserBtnClickEventhandler
        });
        
        // Create userDetailsSectionEl element
        userDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        // Create the user grid menu options
        var usersGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create userGrid component
        usersGrid = new lx.component.Grid({
            renderTo: userDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'icon', name: '', width: '30px'},
                {dataIndex: 'name', name: 'Name', type: 'button'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: usersGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '0px', padding: '0px 5px 0px 0px'}
            ],
            
            onCellClick: usersGridCellClickEventHandler,
            onMenuItemClick: usersGridMenuItemClickEventHandler
        });
        
        // Load form data
        loadCompany();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Add it to the new renderTo element
        renderTo.appendChild( el );
    };
    
    // Function to show the panel
    me.show = function() {
        lx.applyStyle(el, {display: 'flex'});
    };
    
    // Function to hide the panel
    me.hide = function() {
        lx.applyStyle(el, {display: 'none'});
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        me.destroy();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // groupCb change event handler
    function groupCbChangeEventHandler( event ) {
        let groups = [];
        for( let i = 0; i < adminGroups.length; i++ ) {
            if( adminGroups[i].groupCb.getValue() == true ) {
                groups.push({ id: adminGroups[i].groupId });
            }
        }
        
        if( groups.length <= 0 ) {
            new lx.component.Messagebox({
                title: 'Admin Group Access',
                message: 'Unable to deselect admin group. At least one admin group must have access to the company.'
            });
            event.srcComponent.setValue( true );
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: {
                id: companyId,
                groups: groups
            },
            onSuccess: function( responseText ) {
                var response = '';
                try {
                    response = JSON.parse(responseText);
                }
                catch( error ) {
                    new lx.component.Messagebox({
                        title: 'Editing Company Failed',
                        message: 'Failed to read server response.'
                    });
                    return;
                }
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Editing Company Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // consultantSelect change event handler
    function consultantSelectChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: {
                id: companyId,
                consultantId: consultantSelect.getValue()
            },
            onSuccess: function( responseText ) {
                var response = '';
                try {
                    response = JSON.parse(responseText);
                }
                catch( error ) {
                    new lx.component.Messagebox({
                        title: 'Editing Company Failed',
                        message: 'Failed to read server response.'
                    });
                    return;
                }
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Editing Company Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // addConsultantBtn click event handler
    function addConsultantBtnClickEventHandler() {
        // Create a modal window
        var addConsultantModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '432px'
        });
        
        // Create the addConsultantPanel panel
        var addConsultantPanel = new app.panel.AddConsultant({
            renderTo: addConsultantModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function( result ) {
                app.route.popState();
                loadConsultants(result.consultantId, result.consultantName, true);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addConsultantModal.addEventListener('destroy', function() {
            addConsultantPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addConsultantModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addConsultantModal.show();
        addConsultantPanel.focus();
    }
    
    // inviteUserBtn click event handler
    function inviteUserBtnClickEventhandler() {
        // Create a modal window
        var addUserModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '488px'
        });
        
        // Create the addUserPanel panel
        var addUserPanel = new app.panel.InviteUser({
            renderTo: addUserModal.getContainer(),
            show: true,
            
            companyId: companyId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                loadUsers();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addUserModal.addEventListener('destroy', function() {
            addUserPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addUserModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addUserModal.show();
        addUserPanel.focus();
    }
    
    // usersGridMenuItem click event handler
    function usersGridMenuItemClickEventHandler(event) {
        // Depending on the menu item clicked
        if (event.value === 'edit') {
            if(event.srcComponent.getRow(event.rowIndex).type === 'INVI') {
                
                // Create the panel
                let editInvitationPanel = new app.panel.EditInvitation({
                    invitationId: event.srcComponent.getRow(event.rowIndex).id,
                    
                    maxWidth: '500px',
                    maxHeight: '672px',
                    margin: '40px',
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUsers();
                    }
                });
                
                // Create a route entry for the panel
                let state = {
                    panel: editInvitationPanel
                };
                app.route.pushState(state, function( state ) {
                    state.panel.destroy();
                });
                
                editInvitationPanel.showModal();
                editInvitationPanel.focus();
                
            }
            else if(event.srcComponent.getRow(event.rowIndex).type === 'USER') {
                // Create the editUser panel
                let editUserPanel = new app.panel.EditUser({
                    userId: event.srcComponent.getRow(event.rowIndex).id,
                    companyId: companyId,
                    
                    maxWidth: '500px',
                    maxHeight: '509px',
                    margin: '40px',
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUsers();
                    }
                });
                
                // Create a route entry for the panel
                let state = {
                    panel: editUserPanel
                };
                app.route.pushState(state, function( state ) {
                    state.panel.destroy();
                });
                
                editUserPanel.showModal();
                editUserPanel.focus();
            }
        }
        else if (event.value === 'remove') {
            var invitationId = event.srcComponent.getRow(event.rowIndex).id;
            if(event.srcComponent.getRow(event.rowIndex).type === 'INVI') {
                new lx.component.Messagebox({
                    title: 'Remove Invitation',
                    message: 'Are you sure you want to remove this invitation?',
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'remove', label: 'Remove', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'remove' ) {
                            
                            lx.sendJSON({
                                url: 'exec.php?c=Invitation&fn=remove',
                                data: {
                                    invitationId: invitationId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Unable to remove invitation',
                                            message: response.error,
                                            icon: 'icon_error'
                                        });
                                        return;
                                    }
                                    usersGrid.clear();
                                    loadUsers();
                                    loader.hide();
                                }
                            });
                        }
                    }
                });
            }
            else if(event.srcComponent.getRow(event.rowIndex).type === 'USER') {
                var userId = event.srcComponent.getRow(event.rowIndex).id;
                new lx.component.Messagebox({
                    title: 'Remove User',
                    message: 'Are you sure you want to remove this user from the company?',
                    buttons: [
                        {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                        {name: 'remove', label: 'Remove', isDefault: true}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'remove' ) {
                            lx.sendJSON({
                                url: 'exec.php?c=Company&fn=removeUser',
                                data: {
                                    companyId: companyId,
                                    userId: userId
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse( responseText );
                                    
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Unable to remove invitation',
                                            message: response.error,
                                            icon: 'icon_error'
                                        });
                                        return;
                                    }
                                    usersGrid.clear();
                                    loadUsers();
                                    loader.hide();
                                }
                            });
                        }
                    }
                });
            }
        }
        
    }
    
    // usersGrid cell click event handler
    function usersGridCellClickEventHandler(event) {
        // Depending on the column clicked
        if( usersGrid.getColumnDataIndex(event.columnIndex) === 'name' ) {
            // Depending on the type
            if (event.record.type === 'USER') {
                
                // Create the editUser panel
                let editUserPanel = new app.panel.EditUser({
                    userId: event.srcComponent.getRow(event.rowIndex).id,
                    companyId: companyId,
                    
                    maxWidth: '500px',
                    maxHeight: '509px',
                    margin: '40px',
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUsers();
                    }
                });
                
                // Create a route entry for the panel
                let state = {
                    panel: editUserPanel
                };
                app.route.pushState(state, function( state ) {
                    state.panel.destroy();
                });
                
                editUserPanel.showModal();
                editUserPanel.focus();
            }
            else if (event.record.type === 'INVI') {
                
                // Create the panel
                let editInvitationModal = new app.panel.EditInvitation({
                    invitationId: event.record.id,
                    
                    maxWidth: '500px',
                    maxHeight: '672px',
                    margin: '40px',
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onSave: function() {
                        app.route.popState();
                        usersGrid.clear();
                        loadUsers();
                    }
                });
                
                // Create a route entry for the panel
                let state = {
                    panel: editInvitationModal
                };
                app.route.pushState(state, function( state ) {
                    state.panel.destroy();
                });
                
                editInvitationModal.showModal();
                editInvitationModal.focus();
            }
        }
    }
    
    // Edit button click event handler
    function editBtnClickEventHandler() {
        me.hide();
        
        var editCompanyPanel = new app.panel.EditCompany({
            renderTo: app.mainPanel.getContainer(),
            
            companyId: companyId,
            
            onSave: function() {
                loadCompany();
                app.route.popState();
            }
        });
        editCompanyPanel.focus();
        
        var panelState = {
            previousPanel: me,
            panel: editCompanyPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        editCompanyPanel.show();
        editCompanyPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};