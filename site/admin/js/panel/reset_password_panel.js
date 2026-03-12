/* globals app, lx */
'use strict';


// LOGIN PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//  email               The email of the password to reset
//
// Events:
//
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.ResetPassword = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentContainerEl = null;
    let loginContainerEl = null;
    
    let resetContainerEl = null;
    let resetMessageEl = null;
    let emailTxt = null;
    let continueBtn = null;
    let cancelBtn = null;
    
    let verifyContainerEl = null;
    let verifyMessageEl = null;
    let verificationCodeTxt = null;
    let passwordTxt = null;
    let confirmPasswordTxt = null;
    let resetErrorLabel = null;
    let resetBtn = null;
    let cancelResetBtn = null;
    let logoContainerEl = null;
    let logoTextEl = null;
    
    let emailAddress = null;
    
    
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
            email: ''
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
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
                // backgroundColor: '#DFDFDF', // '#FC8C3A',
                // backgroundPosition: 'right center',
                // backgroundRepeat: 'no-repeat',
                // backgroundAttachment: 'fixed',
                // backgroundSize: 'cover',
                // backgroundImage: 'url(gfx/wallpaper.png)'
            }
        });
        
        // Create the contentContainerEl
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                // alignItems: 'flex-end',
                justifyContent: 'center',
                boxSizing: 'border-box',
                width: '100%',
                // minWidth: '40%',
                // margin: 'auto auto auto 0px',
                flex: '1 1 auto',
                padding: '0px'
            }
        });
        
        
        //
        // SPACER SECTION
        //
        
        // Add a spacer element so that lging is displayed in the center of the screen
        new lx.createElement('DIV', {
            parent: contentContainerEl,
            style : {
                boxSizing: 'border-box',
                flex: '1 1 100%',
                margin: 'auto'
            }
        });
        
        
        
        //
        // LOGIN FORM SECTION
        //
        
        // Create loginContainerEl
        loginContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style : {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                maxWidth: '400px',
                minWidth: '340px',
                height: '100%',
                maxHeight: '661px',
                backgroundColor: '#FFFFFF',
                flex: '1 1 auto',
                boxSizing: 'border-box',
                padding: '0px 0px 0px 0px',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create logoContianerEl
        logoContainerEl = lx.createElement('DIV', {
            parent: loginContainerEl,
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
        
        // Create logoTextEl element
        logoTextEl = lx.createElement('DIV', {
            parent: loginContainerEl,
            style: {
                margin: '10px 40px 0px 40px',
                padding: '0px 0px 20px 0px',
                borderStyle: 'solid',
                color: '#6D6E70',
                // borderColor: '#FC8C3A',
                borderWidth: '0px 0px 1px 0px',
                fontSize: '24px',
                textAlign: 'center'
            },
            innerHTML: 'Reset Password'
        });
        
        
        //
        // RESET PASSWORD SECTION
        //

        // Create the resetContainerEl element
        resetContainerEl = lx.createElement('DIV', {
            parent: loginContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                padding: '40px 40px 40px 40px'
            }
        });
        
        // Create resetMessageEl element
        resetMessageEl = lx.createElement('DIV', {
            parent: resetContainerEl,
            style: {
                width: '100%',
                fontSize: '12px'
            },
            innerHTML: 'Please enter your email address to start the reset process.'
        });
        
        // Create email textbox
        emailTxt = new lx.component.Textbox({
            renderTo: resetContainerEl,
            label: 'Email',
            margin: '40px 0px auto 0px',
            
            onKeyPress: emailTxtKeyPressEventHandler
        });
        
        // Create continue button
        continueBtn = new lx.component.Button({
            renderTo: resetContainerEl,
            label: 'Continue',
            width: '100%',
            margin: '40px 0px 0px 0px',
            
            onClick: continueBtnClickEventHandler
        });
        
        // Create cancel button
        cancelBtn = new lx.component.Button({
            renderTo: resetContainerEl,
            label: 'Cancel',
            width: '100%',
            margin: '20px 0px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        
        //
        // RESET PASSWORD VERIFY SECTION
        //
        
        verifyContainerEl = document.createElement('DIV');
        verifyContainerEl.className = 'flex-column flex-align-center flex-resize';
        verifyContainerEl.style.boxSizing = 'border-box';
        verifyContainerEl.style.width = '100%';
        verifyContainerEl.style.height = '100%';
        // verifyContainerEl.style.overflow = 'auto';
        verifyContainerEl.style.flex = '1 1 auto';
        verifyContainerEl.style.padding = '40px';
        loginContainerEl.appendChild( verifyContainerEl );

        // Create a message to explain the verification code
        verifyMessageEl = lx.createElement('DIV', {
            parent: verifyContainerEl,
            style: {
                fontSize: '12px',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the verification code textbox
        verificationCodeTxt = new lx.component.Textbox({
            renderTo: verifyContainerEl,
            width: '100%',
            margin: '40px 0px 0px 0px',
            label: 'Verification Code',
            
            onKeyPress: verificationCodeTxtKeyPressEventHandler
        });
        
        // Create the password textbox
        passwordTxt = new lx.component.Password({
            renderTo: verifyContainerEl,
            width: '100%',
            margin: '20px 0px 0px 0px',
            label: 'New Password',
            
            showStrengthMeter: true,
            
            onKeyPress: passwordTxtKeyPressEventHandler
        });
        
        // Create the confirm password textbox
        confirmPasswordTxt = new lx.component.Password({
            renderTo: verifyContainerEl,
            width: '100%',
            margin: '0px 0px 0px 0px',
            label: 'Confirm Password',
            
            onKeyPress: confirmPasswordTxtKeyPressEventHandler
        });
        
        // Create the reset error label
        resetErrorLabel = new lx.component.Label({
            renderTo: verifyContainerEl,
            label: '',
            margin: '20px 0px 0px 0px',
            color: '#FF5555'
        });
        resetErrorLabel.hide();

        // Create reset button
        resetBtn = new lx.component.Button({
            renderTo: verifyContainerEl,
            label: 'Reset Password',
            width: '100%',
            margin: '40px 0px 0px 0px',
            
            onClick: resetBtnClickEventHandler
        });
        
        // Create cancel button
        cancelResetBtn = new lx.component.Button({
            renderTo: verifyContainerEl,
            label: 'Cancel',
            width: '100%',
            margin: '20px 0px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Hide the verification section
        verifyContainerEl.style.display = 'none';
        
        // Set emailTxt if one was provided.
        emailTxt.setValue( compConfig.email );
        
        
        //
        // COVER IMAGE SECTION
        //
        
        // Create loginContainerEl
        let coverImagContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style : {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '1 1 100%',
                margin: 'auto'
            }
        });
        
        // Create the logo element
        // lx.createElement('DIV', {
        //     parent: coverImagContainerEl,
        //     className: 'display-desktop-only',
        //     style: {
        //         boxSizing: 'border-box',
        //         flex: '1 1 100%',
        //         flexDirection: 'column',
        //         alignItems: 'center',
        //         justifyContent: 'center',
        //         maxWidth: '600px',
        //         minWidth: '400px',
        //         margin: 'auto auto'
        //     },
        //     innerHTML: 
        //         '<a href="https://www.lexpro.co.za" target="_blank" title="Click to visit our new website">' + 
        //             '<img src="gfx/website.gif" alt="lexpro.co.za" style="width: 100%; margin: auto;"></img>' +
        //         '</a>'
        // });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        emailTxt.focus();
    };
    
    // Function to clear the panels text fields
    me.clear = function() {
        emailTxt.setValue('');
        passwordTxt.setValue('');
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        el = null;
        
        emailTxt.setValue('');
        passwordTxt.setValue('');
        
        emailTxt.destroy();
        passwordTxt.destroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Password textbox key press event handler
    function passwordTxtKeyPressEventHandler( event ) {
        if( event.srcComponent.key === 13 ) confirmPasswordTxt.focus();
    }
    
    // Confirm password textbox key press event handler
    function confirmPasswordTxtKeyPressEventHandler( event ) {
        if( event.srcComponent.key === 13 ) resetBtnClickEventHandler();
    }
    
    function resetBtnClickEventHandler() {
        // Clear warnings, if any
        verificationCodeTxt.clearWarning();
        passwordTxt.clearWarning();
        confirmPasswordTxt.clearWarning();
        
        // Check for valid verification code
        if( verificationCodeTxt.getValue() === '' ) {
            verificationCodeTxt.showWarning('Please enter your verification code', true);
            verificationCodeTxt.focus();
            return;
        }
        
        // Check for a password strength
        if( passwordTxt.getStrength() < 3 ) {
            passwordTxt.showWarning('Your password is not strong enough. Please make sure you see at least 3 green bars.', true);
            passwordTxt.focus();
            return;
        }
        
        // Check that the confirmation passwords match
        if( passwordTxt.getValue() !== confirmPasswordTxt.getValue() ) {
            confirmPasswordTxt.showWarning('Please make sure your password and confirm password match', true);
            confirmPasswordTxt.focus();
            return;
        }
        
        resetBtn.showLoader();
        resetBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=verifyResetPassword',
            data: {
                email: emailAddress.trim(),
                password: passwordTxt.getValue(),
                verificationCode: verificationCodeTxt.getValue().trim()
            },
            
            onSuccess: function(responseText) {
                resetBtn.hideLoader();
                resetBtn.enable();
                
                let response = JSON.parse( responseText );
                
                if( !response.ok ) {
                    new lx.component.Messagebox({
                        title: 'Reset Password Failed',
                        message: response.error,
                    });
                    
                    return;
                }
                
                new lx.component.Messagebox({
                    title: 'Reset password',
                    message: 'Your password was changed successfully.',
                    buttons: [
                        {name: 'ok', label: 'Ok'}
                    ],
                    onClose: function( event ) {
                        if( event.button === 'ok' ) {
                            me.fireEvent('cancel', {srcPanel: me});
                        }
                    }
                });
                
            }
        });
    }
    
    // Verification code textbox key press event handler
    function verificationCodeTxtKeyPressEventHandler( event ) {
        if( event.srcComponent.key === 13 ) passwordTxt.focus();
    }
    
    // Email textbox key press event handler
    function emailTxtKeyPressEventHandler( event ) {
        if( event.srcComponent.key === 13 ) continueBtnClickEventHandler();
    }
    
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    function continueBtnClickEventHandler () {
        // Check that the user has entered an email address.  If not show a warning.
        if( emailTxt.getValue() === '' ) {
            emailTxt.showWarning('Please enter your email address.', true);
            emailTxt.focus();
            passwordTxt.clearWarning();
            return;
        }
        
        emailAddress = emailTxt.getValue().trim();
        
        // Set the verify message
        verifyMessageEl.innerHTML = 
            'We sent an email to ' + emailTxt.getValue().trim() + ' with your verification code. ' + 
            'Enter the code and choose a new password to reset your password.';
        
        // Start the new registration
        continueBtn.showLoader();
        continueBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=resetPassword',
            data: {
                email: emailAddress
            },
            onSuccess: function(responseText) {
                continueBtn.showLoader();
                continueBtn.disable();
                
                let response = JSON.parse( responseText );
                
                if( !response.ok ) {
                    new lx.component.Messagebox({
                        title: 'Reset password Failed',
                        message: response.error,
                    });
                    
                    return;
                }
                
                // Hide the reset password section and display the verify section
                resetContainerEl.style.display = 'none';
                verifyContainerEl.style.display = '';
                verificationCodeTxt.focus();
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};