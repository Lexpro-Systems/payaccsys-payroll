/* globals app, lx */
'use strict';


// ADD USER PANEL
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
//  onAdd               This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.InviteUser = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var userDetailsSectionEl = null;
    var nameTxt = null;
    var emailTxt = null;
    
    var userRightsSectionEl = null;
    var accessPayrollPortalRightCheckbox = null;
    var accessAttendancePortalRightCheckbox = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var inviteBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
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
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
        nameTxt.focus();
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
                name: nameTxt.getValue(),
                emailAddress: emailTxt.getValue(),
                attendanceAccessRight: accessAttendancePortalRightCheckbox.getValue(),
                payrollAccessRight: accessPayrollPortalRightCheckbox.getValue()
            },
            
            onSuccess: function( responseText ) {
                inviteBtn.hideLoader();
                inviteBtn.enable();
                var response = JSON.parse(responseText);
                
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