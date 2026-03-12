/* globals app, lx */
'use strict';

// INVITE USER PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//  companyId             NOTE: Complete this section
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.InviteUser = function(config) {
    
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
    
    let userRightsSectionEl = null;
    let accessPayrollPortalRightCheckbox = null;
    let accessAttendancePortalRightCheckbox = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let inviteBtn = null;
    
    let companyId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            companyId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Set company id
        companyId = parseInt(compConfig.companyId);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
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
            innerHTML: 'Invite User'
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
        
        // Create example section
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
            label: 'Name'
        });
        
        // Create the emailTxt component
        emailTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Email Address',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // USER RIGHTS SECTION
        //
        
        // Create user details component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'User Rights',
            margin: '0px 15px',
            width: ''
        });
        
        // Create user rights section
        userRightsSectionEl = lx.createElement('DIV', {
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
        
        // Create the inviteBtn component
        inviteBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Send Invite',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: inviteBtnClickEventHandler
        });
        
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
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function inviteBtnClickEventHandler() {
        
        // Validate all fields
        nameTxt.validate();
        emailTxt.validate();
        
        // Check that a name was entered.
        if( nameTxt.getValue() === '' ) {
            inviteBtn.showWarning('Please enter a name for the user.');
            return;
        }
        
        // Check that an email address was entered.
        if( emailTxt.getValue() === '' ) {
            inviteBtn.showWarning('Please enter the user\'s email address.');
            return;
        }
        
        inviteBtn.showLoader();
        inviteBtn.disable();
        
        // Send request to add the user
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=addUser',
            data: {
                companyId: companyId,
                name: nameTxt.getValue(),
                emailAddress: emailTxt.getValue(),
                attendanceAccessRight: accessAttendancePortalRightCheckbox.getValue(),
                payrollAccessRight: accessPayrollPortalRightCheckbox.getValue()
            },
            
            onSuccess: function( responseText ) {
                inviteBtn.hideLoader();
                inviteBtn.enable();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    inviteBtn.showWarning(response.error);
                    return;
                }
                
                new lx.component.Messagebox({
                    title: 'Invite Sent',
                    message: 'An email with further instructions has been sent to ' + emailTxt.getValue() + '.',
                    icon: 'icon_ok'
                });
                me.fireEvent('add', {srcPanel: me});
            }
        });
        
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};