/* globals app, lx */
'use strict';

// EDIT INVITATION PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  invitationId             NOTE: The invitation id to edit
//
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditInvitation = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let inviteDetailsSectionEl = null;
    let inviteeDisplay = null;
    let inviteeEmailDisplay = null;
    let senderNameDisplay = null;
    let sentDateDisplay = null;
    let expiryDateDisplay = null;
    let statusDisplay = null;
    
    let userRightsSectionEl = null;
    let accessPayrollPortalRightCheckbox = null;
    let accessAttendancePortalRightCheckbox = null;
    
    let inviteUrlSectionEl = null;
    
    let buttonContainerEl = null;
    let resendBtnContainerEl = null;
    let resendBtnTooltip = null;
    let resendBtn = null;
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
    function loadInviteDetails() {
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=getInvitationById',
            data: {
                invitationId: parseInt(config.invitationId)
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load invite',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                inviteeDisplay.setValue(response.invitation.invitee.name);
                inviteeEmailDisplay.setValue(response.invitation.invitee.emailAddress);
                senderNameDisplay.setValue(response.invitation.sender);
                sentDateDisplay.setValue(response.invitation.sentOn);
                expiryDateDisplay.setValue(response.invitation.expiryDate);
                statusDisplay.setValue(response.invitation.status.name);
                
                inviteUrlSectionEl.innerHTML = response.invitation.url;
                
                for( let i = 0; i < response.invitation.rights.length; i++ ) {
                    if( response.invitation.rights[i].code === 'AAPO' ) {
                        accessAttendancePortalRightCheckbox.setValue(true);
                    }
                    else if( response.invitation.rights[i].code === 'APPO' ) {
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
            invitationId: null
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
                overflow: '',
                backgroundColor: '#F4F5F6'
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
            innerHTML: 'Edit Invitation'
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
        // INVITE DETAILS SECTION
        //
        
        // Create heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Invitation Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create invite details section
        inviteDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the nameDisplay component
        inviteeDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Invitee Name',
            labelWidth: '230px'
        });
        
        // Create the inviteeEmailDisplay component
        inviteeEmailDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Invitee Email',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the senderNameDisplay component
        senderNameDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Sender Name',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        sentDateDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Sent Date',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        expiryDateDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Expiry Date',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        // Create the expiryDateDisplay component
        statusDisplay = new lx.component.Display({
            renderTo: inviteDetailsSectionEl,
            label: 'Status',
            labelWidth: '230px',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // INVITE URL SECTION
        //
        
        // Create user details component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Invite URL',
            margin: '0px 15px',
            width: ''
        });
        
        // Create inviteURL section
        inviteUrlSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px',
                overflow: 'auto',
                fontSize: '12px'
            }
        });
        
        // Add a click event handler for the URL
        inviteUrlSectionEl.addEventListener('click', function( event ) {
            // Select the contents of the source element
            window.getSelection().selectAllChildren(
                event.srcElement
            );
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
        
        // Create the resendBtnContainerEl element
        resendBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px auto 0px 0px'
            }
        });
        
        // Create the resendBtnTooltip component.
        resendBtnTooltip = new lx.component.Tooltip({
            renderTo: resendBtnContainerEl,
            maxWidth: '300px',
            arrowOffset: 'center',
            
            onBlur: resendBtnTooltipBlurEventHandler
        });
        
        // Create the resendBtn component
        resendBtn = new lx.component.Button({
            renderTo: resendBtnContainerEl,
            label: 'Resend Invite',
            width: '120px',
            
            onClick: resendBtnClickEventHandler
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            width: '120px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loadInviteDetails();
        
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
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Send request to add the invitation
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=update',
            data: {
                invitationId: parseInt(config.invitationId),
                attendanceAccessRight: accessAttendancePortalRightCheckbox.getValue(),
                payrollAccessRight: accessPayrollPortalRightCheckbox.getValue()
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
    
    // resendBtnTooltip blur event handler
    function resendBtnTooltipBlurEventHandler( event ) {
        event.srcComponent.hide();
    }
    
    // Save button click event handler
    function resendBtnClickEventHandler() {
        resendBtn.showLoader();
        resendBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=resend',
            data: {
                invitationId: parseInt(config.invitationId)
            },
            onSuccess: function( responseText ) {
                resendBtn.hideLoader();
                resendBtn.enable();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    resendBtnTooltip.setText(response.error);
                    resendBtnTooltip.show();
                    resendBtnTooltip.focus();
                    return;
                }
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};