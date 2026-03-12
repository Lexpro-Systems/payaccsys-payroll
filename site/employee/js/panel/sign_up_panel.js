/* globals app, lx */
'use strict';

// SIGN UP PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.SignUp = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var capsLockIsOn = null;
    
    var el = null;
    
    var contentContainerEl = null;
    
    var centeredContainerEl = null;
    var logoContainerEl = null;
    var logoTextEl = null;
    
    var signUpDetailsContainerEl = null;
    var signUpMessageEl = null;
    var firstNameTxt = null;
    var lastNameTxt = null;
    var emailTxt = null;
    var confirmEmailTxt = null;
    var passwordTxt = null;
    var confirmPasswordTxt = null;
    var capsLockEl = null;
    var signUpBtn = null;
    var cancelBtn = null;
    
    
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
        var compConfig = {
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onSignUp') ) me.addEventListener('sign_up', compConfig.onSignUp);
        
        // Initialize state
        confirmDestroy = false;
        
        // Clear the background of the container to display the document background
        me.getContainer().style.backgroundColor = '';
        
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
                overflow: 'auto',
                padding: '20px',
                // background: 'linear-gradient(176deg, #FFAB33, #CD6110)',
                // backgroundColor: app.panelBackgroundColor, // '#FC8C3A',
                // backgroundPosition: 'right center',
                // backgroundRepeat: 'no-repeat',
                // backgroundAttachment: 'fixed',
                // backgroundSize: 'cover',
                // backgroundImage: 'url(gfx/wallpaper.png)'
            }
        });
        // el.addEventListener('keyup', elKeyUpEventHandler);
        
        
        //
        // CONTENT SECTION
        //
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                width: '100%',
                flex: '1 1 auto',
                padding: '0px'
            }
        });
        
        // Create centeredContainerEl
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style : {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                maxWidth: '400px',
                minWidth: '300px',
                height: '100%',
                maxHeight: '860px',
                backgroundColor: '#FFFFFF',
                flex: '1 1 auto',
                boxSizing: 'border-box',
                padding: '0px 0px 30px 0px',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        
        //
        // LOGO SECTION
        //
        
        // Create logoContianerEl
        logoContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                margin: '40px 0px 0px 0px'
            }
        });
        
        // Create the logo element
        lx.createElement('DIV', {
            parent: logoContainerEl,
            style: {
                width: '280px'
            },
            innerHTML: '<img src="gfx/payaccsys-logo.svg" style="width: 100%" />'
        });
        
        logoTextEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '10px 40px 0px 40px',
                padding: '0px 0px 30px 0px',
                borderStyle: 'solid',
                // borderColor: '#FC8C3A',
                borderWidth: '0px 0px 1px 0px',
                fontSize: '24px',
                textAlign: 'center'
            },
            innerHTML: 'Sign Up'
        });
        
        
        //
        // SIGN UP DETAILS SECTION
        //
        
        // Create the signUpDetailsContainerEl element
        signUpDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                display: 'flex',
                flex: '1 1 100%',
                flexDirection: 'column',
                alignItems: 'center',
                // maxHeight: '20px',
                boxSizing: 'border-box',
                padding: '40px 40px 0px 40px'
            }
        });
        
        // Create signUpMessageEl element
        signUpMessageEl = lx.createElement('DIV', {
            parent: signUpDetailsContainerEl,
            style: {
                width: '100%',
                fontSize: '12px'
            },
            innerHTML: 'Please enter your details below and click on the \'Sign Up\' button to register a new account.'
        });
        
        // Create firstNameTxt component
        firstNameTxt = new lx.component.Textbox({
            renderTo: signUpDetailsContainerEl,
            margin: '20px 0px 0px 0px',
            label: 'First Name *'
        });
        
        // Create lastNameTxt component
        lastNameTxt = new lx.component.Textbox({
            renderTo: signUpDetailsContainerEl,
            margin: '20px 0px 0px 0px',
            label: 'Last Name *'
        });
        
        // Create emailTxt
        emailTxt = new lx.component.Textbox({
            renderTo: signUpDetailsContainerEl,
            margin: '20px 0px 0px 0px',
            label: 'Email Address *'
        });
        
        // Create confirmEmailTxt
        confirmEmailTxt = new lx.component.Textbox({
            renderTo: signUpDetailsContainerEl,
            margin: '20px 0px 0px 0px',
            label: 'Confirm Email Address *'
        });
        
        // Create the password textbox
        passwordTxt = new lx.component.Password({
            renderTo: signUpDetailsContainerEl,
            width: '100%',
            margin: '20px 0px 0px 0px',
            label: 'Password *',
            
            showStrengthMeter: true,
            
            onKeyUp: passwordTxtKeyUpEventHandler,
            onFocus: passwordTxtFocusEventHandler,
            onBlur: passwordTxtBlurEventHandler
        });
        
        // Create the confirm password textbox
        confirmPasswordTxt = new lx.component.Password({
            renderTo: signUpDetailsContainerEl,
            width: '100%',
            margin: '5px 0px 0px 0px',
            label: 'Confirm Password *'
        });
        
        // Create capsLockEl element
        capsLockEl = lx.createElement('DIV', {
            parent: signUpDetailsContainerEl,
            style: {
                fontSize: '12px',
                height: '35px',
                width: '100%',
                lineHeight: '35px',
                color: '#E75B54',
                userSelect: 'none',
                transition: 'opacity 0.1s 0.0s ease-in',
                opacity: 0,
            },
            innerHTML: '<i style="font-size: 11px;" class="fa fa-fw fa-lock"></i> Caps lock is on'
        });
        
        // Create sign up button
        signUpBtn = new lx.component.Button({
            renderTo: signUpDetailsContainerEl,
            label: 'Sign Up',
            width: '100%',
            margin: '20px 0px 0px 0px',
            tooltipAlign: 'topCenter',
            
            onClick: signUpBtnClickEventHandler
        });
        
        // Create cancel button
        cancelBtn = new lx.component.Button({
            renderTo: signUpDetailsContainerEl,
            label: 'Cancel',
            // width: '100%',
            margin: '10px 0px 0px 0px',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        firstNameTxt.focus();
    };
    
    // Function to clear the panels text fields
    me.clear = function() {
        firstNameTxt.setValue('');
        lastNameTxt.setValue('');
        emailTxt.setValue('');
        confirmEmailTxt.setValue('');
        passwordTxt.setValue('');
        confirmPasswordTxt.setValue('');
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        el = null;
        
        firstNameTxt.setValue('');
        lastNameTxt.setValue('');
        emailTxt.setValue('');
        confirmEmailTxt.setValue('');
        passwordTxt.setValue('');
        confirmPasswordTxt.setValue('');
        
        firstNameTxt.destroy();
        lastNameTxt.destroy();
        emailTxt.destroy();
        confirmEmailTxt.setValue('');
        passwordTxt.destroy();
        confirmPasswordTxt.destroy();
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // passwordTxt focus event handler
    function passwordTxtFocusEventHandler() {
        if( capsLockIsOn === true ) {
            lx.applyStyle(capsLockEl, {opacity: 1});
        }
    }
    
    // passwordTxt focus event handler
    function passwordTxtBlurEventHandler() {
        lx.applyStyle(capsLockEl, {opacity: 0});
        passwordTxt.hideTooltip();
    }
    
    // passwordTxt keyup event handler
    function passwordTxtKeyUpEventHandler() {
        capsLockIsOn = event.getModifierState('CapsLock');
        
        if( capsLockIsOn === true ) lx.applyStyle(capsLockEl, {opacity: 1});
        else lx.applyStyle(capsLockEl, {opacity: 0});
    }
    
    // signUpBtn click event handler
    function signUpBtnClickEventHandler() {
        // Clear all warnings
        firstNameTxt.clearWarning();
        lastNameTxt.clearWarning();
        emailTxt.clearWarning();
        confirmEmailTxt.clearWarning();
        passwordTxt.clearWarning();
        confirmPasswordTxt.clearWarning();
        
        // Check that the user has entered a first name.  If not show a warning.
        if( firstNameTxt.getValue().trim() === '' ) {
            signUpBtn.showWarning('Please enter your first name.', true);
            return;
        }
        
        // Check that the user has entered a last name.  If not show a warning.
        if( lastNameTxt.getValue().trim() === '' ) {
            signUpBtn.showWarning('Please enter your last name.', true);
            return;
        }
        
        // Check that the user has entered an email address.  If not show a warning.
        if( emailTxt.getValue().trim() === '' ) {
            signUpBtn.showWarning('Please enter your email address.', true);
            return;
        }
        
        // Check that the confirmation email match
        if( emailTxt.getValue() !== confirmEmailTxt.getValue() ) {
            signUpBtn.showWarning('Please make sure your email and confirm email addresses match', true);
            return;
        }
        
        // Check for a password strength
        if( passwordTxt.getStrength() < 3 ) {
            signUpBtn.showWarning('Your password is not strong enough. Please make sure you see at least 3 green bars.', true);
            return;
        }
        
        // Check that the confirmation passwords match
        if( passwordTxt.getValue() !== confirmPasswordTxt.getValue() ) {
            signUpBtn.showWarning('Please make sure your password and confirm password match', true);
            return;
        }
        
        // Start the new registration
        signUpBtn.showLoader();
        signUpBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=register',
            data: {
                firstName: firstNameTxt.getValue().trim(),
                lastName: lastNameTxt.getValue().trim(),
                emailAddress: emailTxt.getValue().trim(),
                password: passwordTxt.getValue().trim()
            },
            onSuccess: function(responseText) {
                signUpBtn.hideLoader();
                signUpBtn.enable();
                
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    signUpBtn.showWarning(response.error, true);
                    return;
                }
                
                // Fires the on sign_up event
                me.fireEvent('sign_up', {
                    srcPanel: me, 
                    email: emailTxt.getValue().trim(), 
                    password: passwordTxt.getValue().trim()
                });
            }
        });
    }
    
    // cancelBtn click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};