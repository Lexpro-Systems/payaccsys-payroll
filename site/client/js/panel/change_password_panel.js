/* globals app, lx */
'use strict';

// CHANGE PASSWORD PANEL
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
//  onCancel            This event is fired when the user clicks the cancel button.
//  onDone              This event is fired when the user clicks the doen button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ChangePassword = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let passwordPanelEl = null;
    let contentEl = null;
    let loader = null;
    
    let passwordSectionEl = null;
    let passwordOldTxt = null;
    let passwordNewTxt = null;
    let passwordConfirmTxt = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let changeBtn = null;
    
    let successPanelEl = null;
    let successIconEl = null;
    let successMessageEl = null;
    let successButtonContainerEl = null;
    let doneBtn = null;
    

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
        if( compConfig.hasOwnProperty('onDone') ) me.addEventListener('done', compConfig.onDone);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flex: compConfig.flex,
                position: 'relative',
                backgroundColor: '#FFFFFF',
                width: compConfig.width,
                height: compConfig.height
            }
        });
        
        // Create the passwordPanelEl that will contain all elements and components to reset your password.
        passwordPanelEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: passwordPanelEl,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Change Password'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: passwordPanelEl,
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
        // PASSWORD SECTION SECTION
        //
        
        // Create password section
        passwordSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create passwordOldTxt component
        passwordOldTxt = new lx.component.Password({
            renderTo: passwordSectionEl,
            label: 'Current Password'
        });
        
        // Create passwordNewTxt component
        passwordNewTxt = new lx.component.Password({
            renderTo: passwordSectionEl,
            label: 'New Password',
            margin: '15px 0px 0px 0px',
            showStrengthMeter: true
        });
        
        // Create passwordConfirmTxt component
        passwordConfirmTxt = new lx.component.Password({
            renderTo: passwordSectionEl,
            label: 'Confirm New Password'
        });
        
        
        //
        // PASSWORD BUTTON SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: passwordPanelEl,
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
        
        // Create the changeBtn component
        changeBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Change',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: changeBtnClickEventHandler
        });
        
        
        //
        // CREATE SUCCESS MESSAGE SECTION
        //
        
        successPanelEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                opacity: 0,
                position: 'absolute',
                left: '0px',
                top: '0px',
                backgroundColor: '#FFFFFF',
                transition: 'opacity 0.25s 0.0s ease-in'
            }
        });
        
        successIconEl = lx.createElement('DIV', {
            parent: successPanelEl,
            style: {
                width: '130px',
                height: '130px',
                margin: '50px 0px 0px 0px'
            }
        });
        
        // Add the icon
        successIconEl.appendChild( lx.icon.create('check_in_circle', '#45A517', 130, 1) );
        
        successMessageEl = lx.createElement('DIV', {
            parent: successPanelEl,
            style: {
                margin: '30px 0px 0px 0px',
                padding: '15px'
            },
            innerHTML: 'Your password was changed successfully.'
        });
        
        // Create the successButtonContainerEl element
        successButtonContainerEl = lx.createElement('DIV', {
            parent: successPanelEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                margin: 'auto 0px 0px 0px',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF',
                width: '100%'
            }
        });
        
        // Create the cancelBtn component
        doneBtn = new lx.component.Button({
            renderTo: successButtonContainerEl,
            label: 'Done',
            width: '120px',
            
            onClick: doneBtnClickEventHandler
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
        lx.applyStyle(el, {display: 'block'});
    };
    
    // Function to hide the panel
    me.hide = function() {
        lx.applyStyle(el, {display: 'none'});
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        passwordOldTxt.focus();
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
    function changeBtnClickEventHandler() {
        // Check that a current password was entered
        if( passwordOldTxt.getValue() === '' ) {
            changeBtn.showWarning('Please enter your current password.');
            return;
        }
        
        // Check that a new password was entered
        if( passwordNewTxt.getValue() === '' ) {
            changeBtn.showWarning('Please enter a new password.');
            return;
        }
        
        // Check that the new password is trong enough
        if( passwordNewTxt.getStrength() < 3 ) {
            changeBtn.showWarning('Your password is not strong enough. Please make sure you see at least 3 green bars.');
            return;
        }
        
        // Check that a confirm password was entered
        if( passwordConfirmTxt.getValue() === '' ) {
            changeBtn.showWarning('Please confirm your new password.');
            return;
        }
        
        // Check that the new password and confirm password match
        if( passwordNewTxt.getValue() !== passwordConfirmTxt.getValue() ) {
            changeBtn.showWarning('Your new password and the confirm password do not match.');
            return;
        }
        
        // Send the change password request
        changeBtn.showLoader();
        changeBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=User&fn=changePassword',
            data: {
                currentPassword: passwordOldTxt.getValue(),
                newPassword: passwordNewTxt.getValue()
            },
            onSuccess: function( responseText ) {
                
                changeBtn.hideLoader();
                changeBtn.enable();
                
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    changeBtn.showWarning( response.error );
                    return;
                }
                
                // Show the success panel.
                lx.applyStyle(successPanelEl, {display: 'flex'});
                
                window.setTimeout(function() {
                    lx.applyStyle(successPanelEl, {opacity: 1});
                }, 5);
            }
        });
    }
    
    // Save button click event handler
    function doneBtnClickEventHandler() {
        me.fireEvent('done', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};