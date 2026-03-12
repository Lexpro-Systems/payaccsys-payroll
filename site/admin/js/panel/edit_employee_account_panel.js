/* globals app, lx */
'use strict';

// EDIT EMPLOYEE ACCOUNT PANEL
//
// Extends:
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
app.panel.EditEmployeeAccount = function(config) {
    
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
    let saveBtn = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let detailsHeading = null;
    let detailsSectionEl = null;
    let firstNameTxt = null;
    let lastNameTxt = null;
    let emailTxt = null;
    
    let employeeAccountId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    function loadEmployeeAccount() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeAccountId: employeeAccountId
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                    return;
                }
                
                firstNameTxt.setValue( response.employeeAccount.firstName );
                lastNameTxt.setValue( response.employeeAccount.lastName );
                emailTxt.setValue( response.employeeAccount.emailAddress );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            employeeAccountId: null,
            
            onSave: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        
        // Initialize state
        confirmDestroy = false;
        employeeAccountId = compConfig.employeeAccountId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                deisplay: 'flex',
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
            innerHTML: 'Edit Employee Account'
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
        
        // Create save button
        saveBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Save',
            margin: '0px 20px 0px 20px',
            
            onClick: saveBtnClickEventHandler
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
        
        // Create the detailsHeading element
        detailsHeading = lx.createElement('DIV', {
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
            innerHTML: '<div>Employee Account</div>'
        });
        
        // Create the detailsSectionEl
        detailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the firstNameTxt component
        firstNameTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'First Name *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the lastNameTxt component
        lastNameTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Last Name *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Create the emailTxt component
        emailTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Email *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        // Load form data
        loadEmployeeAccount();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        firstNameTxt.focus();
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
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        app.route.popState();
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        if( firstNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the employee first name.');
            return;
        }
        
        if( lastNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the employee first name.');
            return;
        }
        
        if( emailTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the employee email address.');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=update',
            data: {
                employeeAccountId: employeeAccountId,
                firstName: firstNameTxt.getValue().trim(),
                lastName: lastNameTxt.getValue().trim(),
                email: emailTxt.getValue().trim()
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                saveBtn.hideLoader();
                saveBtn.enable();
                
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to update employee account',
                        message: response.error
                    });
                    return;
                }
                
                confirmDestroy = false;
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};