/* globals app, lx */
'use strict';


// EDIT USER PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  userId              The ID of the user to edit.
//  companyId           The ID of the company the user belongs to.
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditUser = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let userDetailsSectionEl = null;
    let nameTxt = null;
    let emailTxt = null;
    let cellNumberTxt = null;
    let isActiveCheckbox = null;
    let isAdminDisplay = null;
    let hasPasswordDisplay = null;
    
    let userRightsContainer = null;
    let userRightsSectionEl = null;
    let accessPayrollPortalRightCheckbox = null;
    let accessAttendancePortalRightCheckbox = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let saveBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the selected user details
    function loadUserDetails() {
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getUserById',
            data: {
                userId: parseInt(config.userId),
                companyId: parseInt(config.companyId)
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load user',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                nameTxt.setValue(response.user.name);
                emailTxt.setValue(response.user.email);
                cellNumberTxt.setValue(response.user.cellNumber);
                isActiveCheckbox.setValue(response.user.isActive);
                
                if (response.user.isAdmin) {
                    isAdminDisplay.setValue('Yes');
                }
                else {
                    isAdminDisplay.setValue('No');
                }
                
                if (response.user.hasPassword) {
                    hasPasswordDisplay.setValue('Yes');
                }
                else {
                    hasPasswordDisplay.setValue('No');
                }
                
                for( let i = 0; i < response.user.rights.length; i++ ) {
                    if( response.user.rights[i].code === 'AAPO' ) {
                        accessAttendancePortalRightCheckbox.setValue(true);
                    }
                    else if( response.user.rights[i].code === 'APPO' ) {
                        accessPayrollPortalRightCheckbox.setValue(true);
                    }
                }
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            userId: null,
            companyId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        // console.log(me);
        // Create the root element.
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
            innerHTML: 'Edit User'
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
        // USER DETAILS SECTION
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'User Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create user details section
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
        
        // Create the nameTxt component
        nameTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Name',
            labelWidth: '230px'
        });
        
        // Create the emailTxt component
        emailTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Email',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        // Create the cellNumberTxt component
        cellNumberTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Cell Number',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        
        // Create the isActive component
        isActiveCheckbox = new lx.component.Checkbox({
            renderTo: userDetailsSectionEl,
            label: 'Active:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        // Create the isAdmin component
        isAdminDisplay = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Admin:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        // Create the hasPassword component
        hasPasswordDisplay = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Password Set:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        //
        // USER RIGHTS SECTION
        //
        
        // Create user rights section
        userRightsContainer = lx.createElement('DIV', {
            parent: contentEl
        });
        
        // Create user details component
        new lx.component.Heading({
            renderTo: userRightsContainer,
            label: 'User Rights',
            margin: '0px 15px',
            width: ''
        });
        
        // Create user rights section
        userRightsSectionEl = lx.createElement('DIV', {
            parent: userRightsContainer,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // NOTE: May be used later
        
        // Create the addUserRightCheckbox component
        // addUserRightCheckbox = new lx.component.Checkbox({
            // renderTo: userRightsSectionEl,
            // label: 'Add User',
            // margin: '0px 0px 0px 0px'
        // });
        
        // Create the removeUserRightCheckbox component
        // removeUserRightCheckbox = new lx.component.Checkbox({
            // renderTo: userRightsSectionEl,
            // label: 'Remove User',
            // margin: '15px 0px 0px 0px'
        // });
        
        // Create the accessAttendancePortalRightCheckbox component
        accessAttendancePortalRightCheckbox = new lx.component.Checkbox({
            renderTo: userRightsSectionEl,
            label: 'Access Attendance Portal',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the accessPayrollPortalRightCheckbox component
        accessPayrollPortalRightCheckbox = new lx.component.Checkbox({
            renderTo: userRightsSectionEl,
            label: 'Access Payroll Portal',
            margin: '15px 0px 0px 0px'
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
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: saveBtnClickEventHandler
        });
        
        if (config.companyId === null) {
            userRightsContainer.style.display = 'none';
        }
        loadUserDetails();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        nameTxt.focus();
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
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Send request to add the user
        lx.sendJSON({
            url: 'exec.php?c=User&fn=update',
            data: {
                userId: parseInt(config.userId),
                companyId: parseInt(config.companyId),
                attendanceAccessRight: accessAttendancePortalRightCheckbox.getValue(),
                payrollAccessRight: accessPayrollPortalRightCheckbox.getValue(),
                name: nameTxt.getValue(),
                email: emailTxt.getValue(),
                cellNumber: cellNumberTxt.getValue(),
                isActive: isActiveCheckbox.getValue()
            },
            
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};