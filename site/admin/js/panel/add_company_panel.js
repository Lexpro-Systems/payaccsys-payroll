/* globals app, lx */
'use strict';


// ADD BOOKSET PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddCompany = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleBackEl = null;
    let titleTextEl = null;
    let cancelBtn = null;
    let addBtn = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let companyDetailsHeading = null;
    let companyDetailsSectionEl = null;
    let companyNameTxt = null;
    let companyAliasTxt = null;
    let companyContactPersonTxt = null;
    let companyContactNumberTxt = null;
    let companyContactEmailTxt = null;
    let companyEmployeeLimitTxt = null;
    let companyEmployeeCodeMaskTxt = null;
    let payeCalculationTypeRadio = null;
    let payeBonusCalculationTypeRadio = null;
    let companyIsTrialCb = null;
    let companyTrialSectionEl = null;
    let companyTrialStartsDate = null;
    let companyTrialExpiresDate = null;
    let companyIsActiveCb = null;
    
    let companyAddressDetailsHeading = null;
    let companyAddressDetailsSectionEl = null;
    let physicalAddressUnitTxt = null;
    let physicalAddressComplexTxt = null;
    let physicalAddressStreetTxt = null;
    let physicalAddressSuburbTxt = null;
    let physicalAddressCityTxt = null;
    let physicalAddressPostalCodeTxt = null;
    let physicalAddressCountrySelect = null;
    
    let companyPostalAddressDetailsHeading = null;
    let companyPostalAddressDetailsSectionEl = null;
    let postalAddressLine1Txt = null;
    let postalAddressLine2Txt = null;
    let postalAddressLine3Txt = null;
    let postalAddressCodeTxt = null;
    
    let ownerDetailsHeading = null;
    let ownerDetailsSectionEl = null;
    let ownerSelect = null;
    let ownerNameTxt = null;
    let ownerEmailTxt = null;
    let ownerCellNumberTxt = null;
    
    let databaseDetailsHeading = null;
    let databaseDetailsSectionEl = null;
    let databaseSchemaTxt = null;
    let databaseServerSelect = null;
    
    let groupDetailsHeading = null;
    let groupDetailsSectionEl = null;
    
    let consultantDetailsHeadingEl = null;
    let consultantDetailsSectionEl = null;
    let consultantContainerEl = null;
    let consultantSelect = null;
    let addConsultantBtn = null;
    
    let leaveSetupHeading = null;
    let leaveSetupSectionEl = null;
    let hourlyLeaveCb = null;
    let dailyLeaveCb = null;
    let annualLeaveCb = null;
    let monthlyLeaveCb = null;
    let sickLeaveCb = null;
    let familyResponsibilityLeaveCb = null;
    let maternityLeaveCb = null;
    
    let adminGroups = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadCountries( ) {
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: {
                searchString: physicalAddressCountrySelect.getSearchString(),
                limit: 20,
                offset: physicalAddressCountrySelect.getItemCount(),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Countries Failed',
                        message: response.error
                    });
                }
                
                let countries = [];
                for( let i = 0; i < response.countries.length; i++ ) {
                    countries.push({
                        value: response.countries[i].code,
                        text: response.countries[i].name
                    });
                }
                
                physicalAddressCountrySelect.addItems( countries );
            }
        });
    }
    
    function loadOwners() {
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getList',
            data: {
                searchString: ownerSelect.getSearchString(),
                limit: 50,
                offset: (ownerSelect.getItemCount() - 1),
                sortOrder: 'ASC',
                limitGroups: false
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Owners Failed',
                        message: response.error
                    });
                    return;
                }
                
                let users = [];
                for( let i = 0; i < response.users.length; i++ ) {
                    users.push({
                        value: response.users[i].id,
                        text: response.users[i].name
                    });
                }
                ownerSelect.addItems( users );
            }
        });
    }
    
    function loadServers() {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getServerList',
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Servers Failed',
                        message: response.error
                    });
                    return;
                }
                
                let servers = [];
                let defaultId = null;
                let defaultName = '';
                
                for( let i = 0; i < response.servers.length; i++ ) {
                    if( response.servers[i].isDefault ) {
                        defaultId = response.servers[i].id;
                        defaultName = response.servers[i].name;
                    }
                    
                    servers.push({
                        value: response.servers[i].id,
                        text: response.servers[i].name
                    });
                }
                
                databaseServerSelect.clear();
                databaseServerSelect.addItems( servers );
                databaseServerSelect.setValue( defaultId, defaultName );
            }
        });
    }
    
    function loadConsultants(defaultId, defaultName) {
        lx.sendJSON({
            url: 'exec.php?c=Consultant&fn=getList',
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Consultants Failed',
                        message: response.error
                    });
                    return;
                }
                
                let consultants = [];
                consultants.push({value: null, text: 'None'});
                for( let i = 0; i < response.consultants.length; i++ ) {
                    consultants.push({
                        value: response.consultants[i].id,
                        text: response.consultants[i].name
                    });
                }
                
                consultantSelect.clear();
                consultantSelect.addItems( consultants );
                consultantSelect.setValue( defaultId, defaultName );
            }
        });
    }
    
    function loadGroups() {
        groupDetailsSectionEl.innerHTML = '';
        
        lx.sendJSON({
            url: 'exec.php?c=Group&fn=getList',
            data: {
                limitGroups: false
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Groups Failed',
                        message: response.error
                    });
                    return;
                }
                
                // For every group the user has access to
                for( let i = 0; i < response.groups.length; i++ ) {
                    // Set the margin depending on whether it's the first item
                    let margin = '0px 0px 0px 0px';
                    if( i > 0 ) {
                        margin = '15px 0px 0px 0px';
                    }
                    
                    // Create a new group object and remember the id
                    let newGroup = {};
                    newGroup.groupId = response.groups[i].id;
                    
                    // Add a checkbox to the object 
                    newGroup.groupCb = new lx.component.Checkbox({
                        renderTo: groupDetailsSectionEl,
                        label: response.groups[i].name,
                        labelAlign: 'left',
                        labelWidth: '220px',
                        maxWidth: '500px',
                        margin: margin,
                        
                        isChecked: false,
                        
                        onChange: defaultComponentChangeEventHandler
                    });
                    
                    // Save the new group object
                    adminGroups.push( newGroup );
                }
            }
        });
    }
    
    // Function to load a company request and set the data
    function loadRequestDetails( requestId ) {
        loader.show();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getRequest',
            data: {
                requestId: parseInt( requestId )
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load request',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                
                companyNameTxt.setValue(response.request.companyName);
                companyAliasTxt.setValue(response.request.companyAlias);
                
                physicalAddressStreetTxt.setValue(response.request.physicalAddressLine1);
                physicalAddressSuburbTxt.setValue(response.request.physicalAddressLine2);
                physicalAddressCityTxt.setValue(response.request.physicalAddressLine3);
                physicalAddressPostalCodeTxt.setValue(response.request.physicalAddressCode);
                
                postalAddressLine1Txt.setValue(response.request.postalAddressLine1);
                postalAddressLine2Txt.setValue(response.request.postalAddressLine2);
                postalAddressLine3Txt.setValue(response.request.postalAddressLine3);
                postalAddressCodeTxt.setValue(response.request.postalAddressCode);
                
                companyContactPersonTxt.setValue(response.request.companyContactPerson);
                companyContactNumberTxt.setValue(response.request.companyPhoneNumber);
                companyContactEmailTxt.setValue(response.request.companyEmailAddress);
                
                ownerNameTxt.setValue(response.request.userName);
                ownerCellNumberTxt.setValue(response.request.userPhoneNumber);
                ownerEmailTxt.setValue(response.request.userEmailAddress);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            requestId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
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
            innerHTML: 'Add Company'
        });
        
        // Create cancel button
        cancelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            height: '32px',
            label: 'Cancel',
            margin: '0px 0px 0px auto',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create add button
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Add',
            margin: '0px 20px 0px 20px',
            
            onClick: addBtnClickEventHandler
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
        
        // Create the companyNameTxt component
        companyNameTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyAliasTxt component
        companyAliasTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Alias *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyContactPersonTxt component
        companyContactPersonTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Person',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyContactNumberTxt component
        companyContactNumberTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Number',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyContactEmailTxt component
        companyContactEmailTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Contact Email',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyEmployeeLimitTxt component
        companyEmployeeLimitTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employee Limit',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the companyEmployeeCodeMaskEl element
        let companyEmployeeCodeMaskEl = lx.createElement('DIV', {
            parent: companyDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'left'
            }
        });
        
        // Create the companyEmployeeCodeMaskTxt component
        companyEmployeeCodeMaskTxt = new lx.component.Textbox({
            renderTo: companyEmployeeCodeMaskEl,
            margin: '15px 0px 0px 0px',
            label: 'Employee Code Mask',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        companyEmployeeCodeMaskTxt.setValue('####');
        
        // Create the companyEmployeeCodeMaskInfoIconEl element
        let companyEmployeeCodeMaskInfoIconEl = lx.createElement('DIV', {
            parent: companyEmployeeCodeMaskEl,
            style: {
                boxSizing: 'border-box',
                margin: 'auto 0px 5px 10px',
                fontSize: '20px',
                color: lx.style.global.highlightColor,
                cursor: 'pointer'
            },
            innerHTML: '<i class="fas fa-info-circle"></i>'
        });
        companyEmployeeCodeMaskInfoIconEl.addEventListener('click', function() {
            let message = 
                // '<span style="float: left; width: 180px;">Mask character \'$\'</span><span>Any character</span><br>' +
                '<span style="float: left; width: 180px;">Mask character \'^\'</span><span>Alphanumeric character</span><br>' +
                // '<span style="float: left; width: 180px;">Mask character \'@\'</span><span>Alphabetic character</span><br>' +
                '<span style="float: left; width: 180px;">Mask character \'#\'</span><span>Numeric character</span><br><br>' +
                'Any other character will be presented unchanged.';
            
            new lx.component.Messagebox({
                title: 'Employee Code Mask Info',
                message: message
            });
        });
        
        // Create the payeCalculationTypeRadio component
        payeCalculationTypeRadio = new lx.component.RadioGroup({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'PAYE Calculation Method',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            items: [
                { text: 'Periodic',      value: 'PERI' },
                { text: 'Tax Averaging', value: 'AVER' },
            ],
            
            onChange: defaultComponentChangeEventHandler
        });
        payeCalculationTypeRadio.setValue('AVER');
        
        // Create the payeBonusCalculationTypeRadio component
        payeBonusCalculationTypeRadio = new lx.component.RadioGroup({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'PAYE Bonus Calculation Method',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            items: [
                { text: 'Standard', value: 'STAN' },
                { text: 'Accurate', value: 'ACCU' },
            ],
            
            onChange: defaultComponentChangeEventHandler
        });
        payeBonusCalculationTypeRadio.setValue('ACCU');
        
        // Create the companyIsTrialCb component
        companyIsTrialCb = new lx.component.Checkbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: false,
            
            onChange: function() {
                // Is the companya trial company?
                if( companyIsTrialCb.getValue() === true ) {
                    // Display the trial section
                    companyTrialSectionEl.style.display = 'flex';
                }
                else {
                    // Hide the trial section
                    companyTrialSectionEl.style.display = 'none';
                }
                
                confirmDestroy = true;
            }
        });
        
        // Create the companyTrialSectionEl
        companyTrialSectionEl = lx.createElement('DIV', {
            parent: companyDetailsSectionEl,
            style: {
                display: 'none',
                flexDirection: 'column',
            }
        });
        
        // Create the companyTrialStartsDate component
        companyTrialStartsDate = new lx.component.DatePicker({
            renderTo: companyTrialSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial Starts',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Set the start date
        let currentDate = new Date();
        companyTrialStartsDate.setValue(currentDate.toISOString().split('T')[0]);
        
        // Create the companyTrialExpiresDate component
        companyTrialExpiresDate = new lx.component.DatePicker({
            renderTo: companyTrialSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Trial Ends',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Set the expiry date
        let expiryDate = new Date();
        expiryDate.setDate(currentDate.getDate() + 30);
        companyTrialExpiresDate.setValue(expiryDate.toISOString().split('T')[0]);
        
        // Create the companyIsActiveCb component
        companyIsActiveCb = new lx.component.Checkbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Active',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        
        //
        // PHYSICAL DETAILS SECTION
        //
        
        // Create the companyAddressDetailsHeading element
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
            innerHTML: '<div>Physical Address</div>'
        });
        
        // Create the companyAddressDetailsSectionEl
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
        
        physicalAddressUnitTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Physical Address Unit',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressComplexTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Complex',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressStreetTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Street',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressSuburbTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Suburb',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressCityTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address City',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Postal Code',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        physicalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: companyAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Country',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            search: true,
            
            onChange: defaultComponentChangeEventHandler,
            
            onSearch: function() {
                physicalAddressCountrySelect.clear();
                loadCountries();
            },
            
            onListScrollEnd: function() {
                loadCountries();
            }
        });
        physicalAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        //
        // POSTAL DETAILS SECTION
        //
        
        // Create the companyPostalAddressDetailsHeading element
        companyPostalAddressDetailsHeading = lx.createElement('DIV', {
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
            innerHTML: '<div>Postal Address</div>'
        });
        
        // Create the companyPostalAddressDetailsSectionEl
        companyPostalAddressDetailsSectionEl = lx.createElement('DIV', {
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
        
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: companyPostalAddressDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Postal Line 1',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: companyPostalAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Postal Line 2',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: companyPostalAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Postal Line 3',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: companyPostalAddressDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Postal Code',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        
        //
        // OWNER DETAILS SECTION
        //
        
        // Create the ownerDetailsHeading element
        ownerDetailsHeading = lx.createElement('DIV', {
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
            innerHTML: '<div>Owner Details</div>'
        });
        
        // Create ownerDetailsSectionEl
        ownerDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the ownerSelect component
        ownerSelect = new lx.component.Selectbox({
            renderTo: ownerDetailsSectionEl,
            label: 'Owners',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            search: true,
            
            onSearch: function() {
                ownerSelect.clear();
                let owner = [];
                owner.push({
                    value: null,
                    text: 'New owner'
                });
                ownerSelect.addItems( owner );
                loadOwners( );
            },
            
            onListScrollEnd: function() {
                loadOwners( );
            },
            
            onChange: ownerSelectOnChangeEventHandler
        });
        ownerSelect.addItems( [{value: null, text: 'New owner'}] );
        ownerSelect.setValue( null, 'New owner' );
        
        // Create the ownerNameTxt component
        ownerNameTxt = new lx.component.Textbox({
            renderTo: ownerDetailsSectionEl,
            label: 'Name',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the ownerEmailTxt component
        ownerEmailTxt = new lx.component.Textbox({
            renderTo: ownerDetailsSectionEl,
            label: 'Email Address',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the ownerCellNumberTxt component
        ownerCellNumberTxt = new lx.component.Textbox({
            renderTo: ownerDetailsSectionEl,
            label: 'Cell Number',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            margin: '15px 0px 0px 0px'
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
        
        // Display the database note
        // let databaseNote = lx.createElement('DIV', {
        //     parent: databaseDetailsSectionEl,
        //     style: {
        //         margin: '0px 0px 0px 0px',
        //         padding: '15px',
        //         backgroundColor: '#FFFFC7',
        //         borderStyle: 'solid',
        //         borderColor: lx.style.global.highlightColor,
        //         borderWidth: '1px',
        //         // color: '#FF0000',
        //         fontSize: '12px'
        //     },
        //     innerHTML: '<div><b>PLEASE NOTE:</b><br><br>The database server value is optional. If no serveris specified, the default server will be used.</div>'
        // });
        
        // Create the databaseSchemaTxt component
        databaseSchemaTxt = new lx.component.Textbox({
            renderTo: databaseDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Schema *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the databaseServerSelect component
        databaseServerSelect = new lx.component.Selectbox({
            renderTo: databaseDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Server *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
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
            
            onChange: defaultComponentChangeEventHandler
        });
        
        addConsultantBtn = new lx.component.Button({
            renderTo: consultantContainerEl,
            label: 'Add',
            margin: '0px 0px 0px 15px',
            style: 'text',
            
            onClick: addConsultantBtnClickEventHandler
        });
        
        
        //
        // LEAVE SETUP SECTION
        //
        
        leaveSetupHeading = lx.createElement('DIV', {
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
            innerHTML: '<div>Leave Setup</div>'
        });
        
        leaveSetupSectionEl = lx.createElement('DIV', {
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
        
        hourlyLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Hourly Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        dailyLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Daily Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        monthlyLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Monthly Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        annualLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Annual Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        sickLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Sick Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        familyResponsibilityLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Family Responsibility Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: true,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        maternityLeaveCb = new lx.component.Checkbox({
            renderTo: leaveSetupSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Maternity Leave',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            isChecked: false,
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Was a request id specified?
        if( compConfig.requestId !== null ) {
            loadRequestDetails( compConfig.requestId );
        }
        
        // Load form data
        loadCountries();
        loadServers();
        loadGroups();
        loadOwners();
        loadConsultants(null, 'None');
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        companyNameTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Default component change event handler
    function defaultComponentChangeEventHandler() {
        confirmDestroy = true;
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // ownerSelect change event handler
    function ownerSelectOnChangeEventHandler() {
        // Was no owner selected?
        if (ownerSelect.getValue() === null) {
            ownerNameTxt.setValue('');
            ownerEmailTxt.setValue('');
            ownerCellNumberTxt.setValue('');
        }
        else {
            lx.sendJSON({
                url: 'exec.php?c=User&fn=getUserById',
                data: {
                    userId: ownerSelect.getValue(),
                    companyId: null
                },
                onSuccess: function( responseText ) {
                    loader.hide();
                    
                    let response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Loading User Failed',
                            message: response.error
                        });
                    }
                    
                    ownerNameTxt.setValue(response.user.name);
                    ownerEmailTxt.setValue(response.user.email);
                    ownerCellNumberTxt.setValue(response.user.cellNumber);
                }
            });
        }
    }
    
    // addConsultantBtn click event handler
    function addConsultantBtnClickEventHandler() {
        // Create a modal window
        let addConsultantModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '432px'
        });
        
        // Create the addConsultantPanel panel
        let addConsultantPanel = new app.panel.AddConsultant({
            renderTo: addConsultantModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function( result ) {
                app.route.popState();
                loadConsultants(result.consultantId, result.consultantName);
                confirmDestroy = true;
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addConsultantModal.addEventListener('destroy', function() {
            addConsultantPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: addConsultantModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addConsultantModal.show();
        addConsultantPanel.focus();
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        app.route.popState();
    }
    
    // Add button click event handler
    function addBtnClickEventHandler() {
        if( companyNameTxt.getValue().trim() === '' ) {
            addBtn.showWarning('Please enter the company name');
            return;
        }
        
        if( companyAliasTxt.getValue().trim() === '' ) {
            addBtn.showWarning('Please enter the company alias');
            return;
        }
        
        let ownerId = ownerSelect.getValue();
        if( ownerId == null ) {
            if( ownerNameTxt.getValue().trim() === '' ) {
                addBtn.showWarning('Please enter the owner name');
                return;
            }
            
            if( ownerEmailTxt.getValue().trim() === '' ) {
                addBtn.showWarning('Please enter the owner email address');
                return;
            }
        }
        else {
            ownerId = parseInt( ownerId );
        }
        
        if( databaseSchemaTxt.getValue().trim() === '' ) {
            addBtn.showWarning('Please enter the database schema');
            return;
        }
        
        if( companyEmployeeCodeMaskTxt.getValue().trim() === '' ) {
            addBtn.showWarning('Please enter the employee code mask');
            return;
        }
        
        let groups = [];
        for( let i = 0; i < adminGroups.length; i++ ) {
            if( adminGroups[i].groupCb.getValue() == true ) {
                groups.push({ id: adminGroups[i].groupId });
            }
        }
        
        if( groups.length <= 0 ) {
            addBtn.showWarning('Please select one or more admin groups');
            return;
        }
        
        let employeeLimit = null;
        if( companyEmployeeLimitTxt.getValue().trim() !== '' ) {
            employeeLimit = parseInt( companyEmployeeLimitTxt.getValue().trim() );
        }
        
        let trialStartsOn = (companyTrialStartsDate.getValue().trim() != '' ? companyTrialStartsDate.getValue().trim() : null );
        let trialExpiresOn = (companyTrialExpiresDate.getValue().trim() != '' ? companyTrialExpiresDate.getValue().trim() : null );
        if( companyIsTrialCb.getValue() !== true ) {
            trialStartsOn = null;
            trialExpiresOn = null;
        }
        
        addBtn.showLoader();
        addBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=add',
            data: {
                companyName: companyNameTxt.getValue().trim(),
                companyAlias: companyAliasTxt.getValue().trim(),
                companyContactPerson: companyContactPersonTxt.getValue().trim(),
                companyContactNumber: companyContactNumberTxt.getValue().trim(),
                companyContactEmail: companyContactEmailTxt.getValue().trim(),
                employeeLimit: employeeLimit,
                employeeCodeMask: companyEmployeeCodeMaskTxt.getValue().trim(),
                payeCalculationTypeCode: payeCalculationTypeRadio.getValue(),
                payeBonusCalculationTypeCode: payeBonusCalculationTypeRadio.getValue(),
                isTrial: companyIsTrialCb.getValue(),
                trialStartsOn: trialStartsOn,
                trialExpiresOn: trialExpiresOn,
                companyIsActive: companyIsActiveCb.getValue(),
                physicalAddressUnit: physicalAddressUnitTxt.getValue(),
                physicalAddressComplex: physicalAddressComplexTxt.getValue(),
                physicalAddressStreet: physicalAddressStreetTxt.getValue(),
                physicalAddressSuburb: physicalAddressSuburbTxt.getValue(),
                physicalAddressCity: physicalAddressCityTxt.getValue(),
                physicalAddressPostalCode: physicalAddressPostalCodeTxt.getValue(),
                physicalAddressCountryCode: physicalAddressCountrySelect.getValue(),
                postalAddressLine1: postalAddressLine1Txt.getValue(),
                postalAddressLine2: postalAddressLine2Txt.getValue(),
                postalAddressLine3: postalAddressLine3Txt.getValue(),
                postalAddressCode: postalAddressCodeTxt.getValue(),
                ownerId: ownerId,
                ownerName: ownerNameTxt.getValue().trim(),
                ownerEmailAddress: ownerEmailTxt.getValue().trim(),
                ownerCellNumber: ownerCellNumberTxt.getValue().trim(),
                databaseSchema: databaseSchemaTxt.getValue().trim(),
                databaseServerId: parseInt(databaseServerSelect.getValue()),
                consultantId: consultantSelect.getValue(),
                hourlyLeave: hourlyLeaveCb.getValue(),
                dailyLeave: dailyLeaveCb.getValue(),
                monthlyLeave: monthlyLeaveCb.getValue(),
                annualLeave: annualLeaveCb.getValue(),
                sickLeave: sickLeaveCb.getValue(),
                familyResponsibilityLeave: familyResponsibilityLeaveCb.getValue(),
                maternityLeave: maternityLeaveCb.getValue(),
                groups: groups
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                addBtn.hideLoader();
                addBtn.enable();
                
                let response = '';
                try {
                    response = JSON.parse(responseText);
                }
                catch( error ) {
                    new lx.component.Messagebox({
                        title: 'Adding Company Failed',
                        message: 'Failed to read server response.'
                    });
                    return;
                }
                
                if( response.ok !== true ) {
                    addBtn.showWarning(response.error);
                    return;
                }
                
                confirmDestroy = false;
                
                me.fireEvent('add', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};