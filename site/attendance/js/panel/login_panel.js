/* globals app, lx */
'use strict';

// LOGIN PANEL
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
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.Login = function(config) {
    
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
    var emailTxt = null;
    var passwordTxt = null;
    var rememberMeCheck = null;
    var capsLockEl = null;
    var loginBtn = null;
    var buttonContainerEl = null;
    var forgotPasswordBtn = null;
    

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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onLogin') ) me.addEventListener('onLogin', compConfig.onLogin);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
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
        el.addEventListener('keyup', elKeyUpEventHandler);
        
        
        //
        // CONTENT SECTION
        //
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                width: '100%',
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
        
        // Create centeredContainerEl
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style : {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                maxWidth: '400px',
                minWidth: '340px',
                height: '100%',
                maxHeight: '600px',
                backgroundColor: '#FFFFFF',
                flex: '1 1 auto',
                boxSizing: 'border-box',
                padding: '0px 0px 0px 0px',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
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
                maxWidth: '320px',
                minWidth: '280px'
            },
            innerHTML: '<img src="gfx/payaccsys-logo.svg" style="width: 100%" />'
        });
        
        logoTextEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '10px 40px 0px 40px',
                padding: '0px 0px 30px 0px',
                borderStyle: 'solid',
                color: '#6D6E70',
                // borderColor: '#FC8C3A',
                borderWidth: '0px 0px 1px 0px',
                fontSize: '24px',
                textAlign: 'center'
            },
            innerHTML: 'Attendance Register'
        });
        
        // Create emailTxt component
        emailTxt = new lx.component.Textbox({
            renderTo: centeredContainerEl,
            margin: '40px 40px 0px 40px',
            label: 'Email',
            width: null,
            
            onBlur: emailTxtBlurEventHandler
        });
        
        // Create passwordTxt
        passwordTxt = new lx.component.Password({
            renderTo: centeredContainerEl,
            margin: '30px 40px 0px 40px',
            label: 'Password',
            width: null,
            
            onKeyUp: passwordTxtKeyUpEventHandler,
            onFocus: passwordTxtFocusEventHandler,
            onBlur: passwordTxtBlurEventHandler
        });
        
        // Create buttonContainerEl
        buttonContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: '0px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create capsLockEl element
        capsLockEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                fontSize: '12px',
                height: '35px',
                lineHeight: '35px',
                color: '#E75B54',
                userSelect: 'none',
                transition: 'opacity 0.1s 0.0s ease-in',
                opacity: 0
            },
            innerHTML: '<i style="font-size: 11px;" class="fa fa-fw fa-lock"></i> Caps lock is on'
        });
        
        // Create forgotPasswordBtn
        forgotPasswordBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Forgot Password',
            style: 'text',
            fontSize: '12px',
            
            onClick: forgotPasswordBtnClickEventHandler
        });
        
        // Create rememberMeCheck
        rememberMeCheck = new lx.component.Checkbox({
            renderTo: centeredContainerEl,
            margin: '0px 40px 0px 40px',
            label: 'Remember Me',
            labelAlign: 'right',
            width: null,
            flex: '1 1 100%',
            
            onChange: rememberMeCheckChangeEventHandler
        });
        
        // Create loginBtn
        loginBtn = new lx.component.Button({
            renderTo: centeredContainerEl,
            label: 'Login',
            margin: '40px 40px 0px 40px',
            width: null,
            
            onClick: loginBtnClickEventHandler
        });
        
        // Display the POPI message
        lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                textAlign: 'center',
                margin: '40px 0px 0px 0px',
                padding: '15px 20px',
                fontSize: '12px',
                // color: '#FFFFFF',
                backgroundColor: '#DFDFDF' // '#E74C3C'
            },
            // innerHTML:  
                // '<a onMouseOver="style.color=\'' + lx.style.global.highlightColor + '\'"  onMouseOut="style.color=\'' + lx.style.global.color + '\'" style="margin: auto 15px; text-decoration: none; color:' + lx.style.global.color + ';" href="https://www.lexpro.co.za/privacy-policy" target="_blank">Privacy Policy</a>' + '&nbsp;|&nbsp;' +
                // '<a onMouseOver="style.color=\'' + lx.style.global.highlightColor + '\'"  onMouseOut="style.color=\'' + lx.style.global.color + '\'" style="margin: auto 15px; text-decoration: none; color:' + lx.style.global.color + ';" href="https://www.lexpro.co.za/popia" target="_blank">POPIA Manual</a>'
                
                // 'To read our Privacy Statement and POPIA manual visit:<br>' +
                // '<a style="color: #FC8C3A; font-size: 12px;" href="https://www.lexpro.co.za/legal.html" target="_blank">www.lexpro.co.za</a>'
                // 'Click ' + 
                // '<a style="color: #FC8C3A; font-size: 12px;" href="https://www.lexpro.co.za/privacy-policy" target="_blank">here</a>' +
                // ' to read our Privacy Statement.<br>The POPIA manual can be found ' + 
                // '<a style="color: #FC8C3A; font-size: 12px;" href="https://www.lexpro.co.za/popia" target="_blank">here</a>' +
                // '.'
        });
        
        // Check if the 'Remember me' options was set
        if( localStorage.getItem('payrollLoginEmail') !== null ) {
            rememberMeCheck.setValue( true );
            emailTxt.setValue( localStorage.getItem('payrollLoginEmail') );
        }
        
        
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
        //         maxWidth: '350px',
        //         minWidth: '150px',
        //         margin: 'auto auto'
        //     },
        //     innerHTML: 
        //         '<a href="http://bit.ly/3CskKwo" target="_blank" title="Click to learn more about Lexpro Payments">' + 
        //             '<img src="gfx/payments_launch.gif" alt="lexpro.co.za" style="width: 100%; margin: auto;"></img>' +
        //         '</a>'
        // });
        
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
        if( emailTxt.getValue() === '' ) emailTxt.focus();
        else passwordTxt.focus();
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
        forgotPasswordBtn.destroy();
        loginBtn.destroy();
        rememberMeCheck.destroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // el keyup event handler
    function elKeyUpEventHandler( event ) {
        capsLockIsOn = event.getModifierState('CapsLock');
        
        if( event.keyCode === 13 ){
            loginBtnClickEventHandler();
        }
    }
    
    // emailTxt blur event handler
    function emailTxtBlurEventHandler() {
        emailTxt.hideTooltip();
    }
    
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
    
    // rememberMeCheck change event handler
    function rememberMeCheckChangeEventHandler() {
        // If the checkbox was unchecked clear the user details stored there.
        if( rememberMeCheck.getValue() === false ) localStorage.removeItem('payrollLoginEmail');
    }
    
    // loginBtn click event handler
    function loginBtnClickEventHandler() {
        // Check that the user has entered an email address.  If not show a warning.
        if( emailTxt.getValue() === '' ) {
            emailTxt.showWarning('Please enter your email address.', true);
            emailTxt.focus();
            passwordTxt.clearWarning();
            return;
        }
        
        // Check that the user has entere a password.  If not show a warning.
        if( passwordTxt.getValue() === '' ) {
            passwordTxt.showWarning('Please enter your password.', true);
            passwordTxt.focus();
            emailTxt.clearWarning();
            return;
        }
        
        // Check if we should save the username
        if( rememberMeCheck.getValue() === true ) {
            localStorage.setItem('payrollLoginEmail', emailTxt.getValue());
        }
        else {
            localStorage.removeItem('payrollLoginEmail');
        }
        
        // Clear any existing warnings
        emailTxt.clearWarning();
        passwordTxt.clearWarning();
        
        loginBtn.showLoader();
        loginBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=login',
            data: {
                username: emailTxt.getValue(),
                password: passwordTxt.getValue()
            },
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                // Hide the loader and reanable the login button.
                loginBtn.hideLoader();
                loginBtn.enable();
                
                // Check if an error occurred
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Login Failed',
                        message: response.error,
                    });
                    
                    return;
                }
                
                // Check it the username is valid
                if( response.loginSuccess !== true ) {
                    if( response.hasOwnProperty('usernameValid') && response.usernameValid !== true ) {
                        emailTxt.showWarning(
                            'There is no user registered with this email address.  Please check your email address and try again.', true);
                        emailTxt.focus();
                        passwordTxt.clearWarning();
                        return;
                    }
                    
                    // Check it the username is valid
                    if( response.hasOwnProperty('passwordValid') && response.passwordValid !== true ) {
                        passwordTxt.showWarning('Invalid password entered.  Please check your password and try again.', true);
                        passwordTxt.focus();
                        emailTxt.clearWarning();
                        return;
                    }
                    
                    // Check if the user is inactive
                    if( response.hasOwnProperty('userActive') && response.userActive !== true ) {
                        new lx.component.Messagebox({
                            title: 'Account Inactive',
                            message: 'Your account is no longer active.<br /><br />' +
                                'Please contact support if you believe you are receiving this message in error.'
                        });
                        return;
                    }
                    
                    // Check if the user has been denied access
                    if( response.hasOwnProperty('attendanceAccess') && response.attendanceAccess !== true ) {
                        new lx.component.Messagebox({
                            title: 'Access Denied',
                            message: 'You do not have access to the Attendance Register system.<br /><br />' +
                                'Please contact support if you believe you are receiving this message in error.'
                        });
                        return;
                    }
                    
                    emailTxt.clearWarning();
                    passwordTxt.clearWarning();
                    
                    new lx.component.Messagebox({
                        title: 'Login Failed',
                        message: 'Your login attempt failed.  Please make sure your email address and password is correct.<br /><br />' +
                            'Please contact customer support if the problem persists.'
                    });
                    
                    return;
                }
                
                emailTxt.clearWarning();
                passwordTxt.clearWarning();
                
                // Fires the on login event
                me.fireEvent('onLogin', {srcPanel: me, mustSelectCompany: response.mustSelectCompany, unreadMessages: response.unreadMessages});
            }
        });
    }
    
    // forgotPasswordBtn click event handler    
    function forgotPasswordBtnClickEventHandler() {
        me.hide();
        
        var ResetPasswordPanel = new app.panel.ResetPassword({
            renderTo: document.body,
            show: true,
            email: emailTxt.getValue().trim(),
            
            onCancel: function() {
                ResetPasswordPanel.hide();
                me.show();
            }
        });
        
        ResetPasswordPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};