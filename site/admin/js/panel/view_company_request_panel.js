/* globals app, lx */
'use strict';


// VIEW COMPANY REQUEST PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  requestId             Id of the request to view
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ViewCompanyRequest = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let requestDetailsSectionEl = null;
    let createdOnDisplay = null;
    let processedOnDisplay = null;
    
    let companyDetailsSectionEl = null;
    let companyNameDisplay = null;
    let companyAliasDisplay = null;
    let numberOfEmployeesDisplay = null;
    
    let physicalAddressSectionEl = null;
    let physicalAddressLine1Display = null;
    let physicalAddressLine2Display = null;
    let physicalAddressLine3Display = null;
    let physicalAddressCodeDisplay = null;
    
    let postalAddressSectionEl = null;
    let postalAddressLine1Display = null;
    let postalAddressLine2Display = null;
    let postalAddressLine3Display = null;
    let postalAddressCodeDisplay = null;
    
    let companyContactDetailsSectionEl = null;
    let companyContactPersonDisplay = null;
    let companyPhoneNumberDisplay = null;
    let companyEmailAddressDisplay = null;
    
    let userDetailsSectionEl = null;
    let userNameDisplay = null;
    let userPhoneNumberDisplay = null;
    let userEmailAddressDisplay = null;
    
    let buttonContainerEl = null;
    let closeBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the company request's details
    function loadRequestDetails() {
        loader.show();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getRequest',
            data: {
                requestId: parseInt(config.requestId)
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
                
                createdOnDisplay.setValue(response.request.createdOn);
                processedOnDisplay.setValue(response.request.processedOn);
                
                companyNameDisplay.setValue(response.request.companyName);
                companyAliasDisplay.setValue(response.request.companyAlias);
                numberOfEmployeesDisplay.setValue((response.request.numberOfEmployees !== null ? response.request.numberOfEmployees : '-'));
                
                physicalAddressLine1Display.setValue(response.request.physicalAddressLine1);
                physicalAddressLine2Display.setValue(response.request.physicalAddressLine2);
                physicalAddressLine3Display.setValue(response.request.physicalAddressLine3);
                physicalAddressCodeDisplay.setValue(response.request.physicalAddressCode);
                
                postalAddressLine1Display.setValue(response.request.postalAddressLine1);
                postalAddressLine2Display.setValue(response.request.postalAddressLine2);
                postalAddressLine3Display.setValue(response.request.postalAddressLine3);
                postalAddressCodeDisplay.setValue(response.request.postalAddressCode);
                
                companyContactPersonDisplay.setValue(response.request.companyContactPerson);
                companyPhoneNumberDisplay.setValue(response.request.companyPhoneNumber);
                companyEmailAddressDisplay.setValue(response.request.companyEmailAddress);
                
                userNameDisplay.setValue(response.request.userName);
                userPhoneNumberDisplay.setValue(response.request.userPhoneNumber);
                userEmailAddressDisplay.setValue(response.request.userEmailAddress);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onClose') ) me.addEventListener('close', compConfig.onClose);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'View Company Request'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // REQUEST DETAILS SECTION
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Request Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create request details section
        requestDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the createdOnDisplay component
        createdOnDisplay = new lx.component.Display({
            renderTo: requestDetailsSectionEl,
            label: 'Created On',
            labelWidth: '230px'
        });
        
        // Create the processedOnDisplay component
        processedOnDisplay = new lx.component.Display({
            renderTo: requestDetailsSectionEl,
            label: 'Processed On',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // COMPANY DETAILS SECTION
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Company Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create company details section
        companyDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the companyNameDisplay component
        companyNameDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Registered Name',
            labelWidth: '230px'
        });
        
        // Create the companyAliasDisplay component
        companyAliasDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Alias',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the numberOfEmployeesDisplay component
        numberOfEmployeesDisplay = new lx.component.Display({
            renderTo: companyDetailsSectionEl,
            label: 'Number of Employees',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // COMPANY PHYSICAL ADDRESS DISPLAY
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Company Physical Address',
            margin: '0px 15px',
            width: ''
        });
        
        // Create physicalAddress section
        physicalAddressSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the physicalAddressLine1Display component
        physicalAddressLine1Display = new lx.component.Display({
            renderTo: physicalAddressSectionEl,
            label: 'Line 1',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the physicalAddressLine2Display component
        physicalAddressLine2Display = new lx.component.Display({
            renderTo: physicalAddressSectionEl,
            label: 'Line 2',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the physicalAddressLine3Display component
        physicalAddressLine3Display = new lx.component.Display({
            renderTo: physicalAddressSectionEl,
            label: 'Line 3',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the physicalAddressCodeDisplay component
        physicalAddressCodeDisplay = new lx.component.Display({
            renderTo: physicalAddressSectionEl,
            label: 'Code',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // COMPANY POSTAL ADDRESS DISPLAY
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Company Postal Address',
            margin: '0px 15px',
            width: ''
        });
        
        // Create postalAddress section
        postalAddressSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the postalAddressLine1Display component
        postalAddressLine1Display = new lx.component.Display({
            renderTo: postalAddressSectionEl,
            label: 'Line 1',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the postalAddressLine2Display component
        postalAddressLine2Display = new lx.component.Display({
            renderTo: postalAddressSectionEl,
            label: 'Line 2',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the postalAddressLine3Display component
        postalAddressLine3Display = new lx.component.Display({
            renderTo: postalAddressSectionEl,
            label: 'Line 3',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the postalAddressCodeDisplay component
        postalAddressCodeDisplay = new lx.component.Display({
            renderTo: postalAddressSectionEl,
            label: 'Code',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // COMPANY CONTACT DETAILS DISPLAY
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Company Contact Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create companyContactDetails section
        companyContactDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the companyContactPersonDisplay component
        companyContactPersonDisplay = new lx.component.Display({
            renderTo: companyContactDetailsSectionEl,
            label: 'Contact Person',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the companyPhoneNumberDisplay component
        companyPhoneNumberDisplay = new lx.component.Display({
            renderTo: companyContactDetailsSectionEl,
            label: 'Phone Number',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the companyEmailAddressDisplay component
        companyEmailAddressDisplay = new lx.component.Display({
            renderTo: companyContactDetailsSectionEl,
            label: 'Email Address',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // USER DETAILS DISPLAY
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'User Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create userDetailsSectionEl section
        userDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the userNameDisplay component
        userNameDisplay = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Name',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the userPhoneNumberDisplay component
        userPhoneNumberDisplay = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Phone Number',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the userEmailAddressDisplay component
        userEmailAddressDisplay = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Email Address',
            labelWidth: '230px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the closeBtn component
        closeBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Close',
            width: '120px',
            
            onClick: closeBtnClickEventHandler
        });
        
        loader.show(false);
        loadRequestDetails();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
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
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Close button click event handler
    function closeBtnClickEventHandler() {
        me.fireEvent('close', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};