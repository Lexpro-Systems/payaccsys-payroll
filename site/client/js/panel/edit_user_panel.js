/* globals app, lx */
'use strict';

// EDIT USER PANEL
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
app.panel.EditUser = function(config) {
    
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
    var cellNumberTxt = null;
    var isActiveCheckbox = null;
    
    var userRightsSectionEl = null;
    var addUserRightCheckbox = null;
    var removeUserRightCheckbox = null;
    var accessPayrollPortalRightCheckbox = null;
    var accessAttendancePortalRightCheckbox = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtnTooltip = null;
    var saveBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the selected user details
    function loadUserDetails() {
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getUserById',
            data: {
                userId: parseInt(config.userId)
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
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
                if (response.user.isActive) {
                    isActiveCheckbox.setValue('Yes');
                }
                else {
                    isActiveCheckbox.setValue('No');
                }
                
                for( var i = 0; i < response.user.rights.length; i++ ) {
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
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
        nameTxt = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Name:',
            labelWidth: '230px'
        });
        
        // Create the emailTxt component
        emailTxt = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Email:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        // Create the cellNumberTxt component
        cellNumberTxt = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Cell Number:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
        });
        
        
        // Create the isActive component
        isActiveCheckbox = new lx.component.Display({
            renderTo: userDetailsSectionEl,
            label: 'Active:',
            margin: '15px 0px 0px 0px',
            labelWidth: '230px'
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
            margin: '0px 0px 0px 30px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loader.show(false);
        loadUserDetails();
        
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
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Send request to add the user
        lx.sendJSON({
            url: 'exec.php?c=User&fn=update',
            data: {
                userId: parseInt(config.userId),
                attendanceAccessRight: accessAttendancePortalRightCheckbox.getValue(),
                payrollAccessRight: accessPayrollPortalRightCheckbox.getValue()
            },
            
            onSuccess: function( responseText ) {
                
                saveBtn.hideLoader();
                saveBtn.enable();
                var response = JSON.parse(responseText);
                
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