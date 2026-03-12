/* globals app, lx */
'use strict';

// SIGN-IN EMPLOYEE PANEL
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
app.panel.SignInEmployee = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    var signInTimeContainerEl = null;
    var signInDate = null;
    var signInTimeTxt = null;
    var noteDetailsSectionEl = null;
    var temperatureTxt = null;
    var noteTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var signInBtnContainerEl = null;
    var signInBtn = null;
    

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
            show: false,
            
            lastNote: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSignIn') ) me.addEventListener('sign_in', compConfig.onSignIn);
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
                borderColor: '#DFDFDF',
            },
            innerHTML: 'Sign In Employee'
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
        // DETAILS SECTION
        //
        
        // Create example section
        noteDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create signInTimeContainerEl element
        signInTimeContainerEl = lx.createElement('DIV', {
            parent: noteDetailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end'
            }
        });
        
        signInDate = new lx.component.DatePicker({
            renderTo: signInTimeContainerEl,
            label: 'Date',
            flex: '1 1 100%'
        });


        lx.sendJSON({
            url: 'exec.php?c=User&fn=get',
            onSuccess: function( jsonResult ) {
                let result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load user details'
                    });
                    
                    return;
                }
 
                // Set company and user details
                if( result.user.company.name === 'Lexpro' ) {
                    signInDate.disable();
                    signInTimeTxt.disable();
                }


            }
        });
        
        signInDate.setValue(new Date().toISOString().slice(0, 10));
        
        signInTimeTxt = new lx.component.Textbox({
            renderTo: signInTimeContainerEl,
            label: 'Time',
            width: '80px',
            margin: '0px 0px 0px 20px'
        });
        
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if(hours < 10) {
            hours = '0' + hours;
        }
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        
        signInTimeTxt.setValue(hours + ':' + minutes);
        
        // Create the temperatureTxt component
        temperatureTxt = new lx.component.Textbox({
            renderTo: noteDetailsSectionEl,
            label: 'Temperature',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the noteTxt component
        noteTxt = new lx.component.Textbox({
            renderTo: noteDetailsSectionEl,
            label: 'Notes',
            multiline: true,
            height: '150px',
            margin: '15px 0px 0px 0px'
        });
        if( compConfig.lastNote !== null ) noteTxt.setValue(compConfig.lastNote);
        
        
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
        
        // Create the signInBtnContainerEl element
        signInBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the signInBtn component
        signInBtn = new lx.component.Button({
            renderTo: signInBtnContainerEl,
            label: 'Sign In',
            width: '120px',
            
            onClick: signInBtnClickEventHandler
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
        temperatureTxt.focus();
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
    
    // Sign-in button click event handler
    function signInBtnClickEventHandler() {
        
        if (!lx.util.checkTimeFormat(signInTimeTxt.getValue())) {
            signInBtn.showWarning('Time is invalid. Please enter a time in HH:MM format.');
            return;
        }
        
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if(hours < 10) {
            hours = '0' + hours;
        }
        if(minutes < 10) {
            minutes = '0' + minutes;
        }
        var now = new Date().toISOString().slice(0,10);
        
        if (signInDate.getValue() > now) {
            signInBtn.showWarning('Sign in date cannot be in the future');
            return;
        }
        
        if (signInDate.getValue() == now) {
            if ( signInTimeTxt.getValue() > hours + ':' + minutes ) {
                signInBtn.showWarning('Sign in time cannot be in the future');
                return;
            }
        }
        
        me.fireEvent('sign_in', {
            srcPanel: me, 
            note: noteTxt.getValue().trim(),
            temperature: temperatureTxt.getValue().trim(),
            signInDate: signInDate.getValue(),
            signInTime: signInTimeTxt.getValue()
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};