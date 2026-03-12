/* globals app, lx */
'use strict';

// INVITATION MAIN PANEL
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
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.InvitationMain = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentContainerEl = null;
    var loader = null;
    
    var welcomeSectionEl = null;
    var welcomeMessageEl = null;
    var welcomeDeclineBtn = null;
    var welcomeAcceptBtn = null;
    var welcomeCreateAccountBtn = null;
    
    var accountSectionEl = null;
    var accountFormContainerEl = null;
    var accountNameTxt = null;
    var accountCellNumberTxt = null;
    var accountPassword = null;
    var accountConfirmPassword = null;
    var accountCancelBtn = null;
    var accountCreateAccountBtn = null;
    
    var successSectionEl = null;
    var successMessageEl = null;
    var successFinishBtn = null;
    
    var errorSectionEl = null;
    var errorMessageEl = null;
    var errorButtonContainerEl = null;
    var errorOkBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the invitations details
    function loadInvitation() {
        // Get the invitation code
        var invitationCode = lx.util.getQueryStringValue('invitation');
        
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=get',
            data: {
                code: invitationCode
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                loader.destroy();
                
                // Show the contentSectionEl
                lx.applyStyle(contentContainerEl, {display: 'flex'});
                
                // Check if the invitation was found
                if( response.invitation.found !== true ) {
                    errorMessageEl.innerHTML = 'The invitation could not be found.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Check if the invitation was declined
                if( response.invitation.status.code === 'DECL' ) {
                    errorMessageEl.innerHTML = 'The invitation was declined.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Check if the invitation was accepted
                if( response.invitation.status.code === 'ACCE' ) {
                    errorMessageEl.innerHTML = 'The invitation has already been accepted.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Check if the invitation has expired
                if( response.invitation.expired === true ) {
                    errorMessageEl.innerHTML = 'The invitation has expired.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Set the person's name on the create account section
                accountNameTxt.setValue(response.invitation.invitee.name);
                
                // Show the welcom message
                lx.applyStyle(welcomeSectionEl, {display: 'flex'});
                
                // Initialize welcome message text
                welcomeMessageEl.innerHTML =
                    '<span style="font-size: 16px;">Hi ' + response.invitation.invitee.name + '</span><br /><br />' +
                    response.invitation.sender + ' invited you to the ' + response.invitation.company.name + ' company.';
                    
                // If the user is not registered notify the user of this.
                if( response.invitation.registeredUserId === null ) {
                    welcomeMessageEl.innerHTML = welcomeMessageEl.innerHTML +
                        '<br /><br />' + 
                        'In order to accept this invitation you must have an account on Lexpro Payroll.';
                        
                    // Show the create account button and hide the accept button.
                    welcomeCreateAccountBtn.show();
                    welcomeAcceptBtn.hide();
                }
                else if( response.invitation.userHasPassword !== true ) {
                    welcomeMessageEl.innerHTML = welcomeMessageEl.innerHTML +
                        '<br /><br />' + 
                        'In order to accept this invitation you must have an account on Lexpro Payroll.';
                        
                    // Load the specified user's details
                    lx.sendJSON({
                        url: 'exec.php?c=User&fn=getUserById',
                        data: {
                            userId: response.invitation.registeredUserId
                        },
                        onSuccess: function( responseText ) {
                            var response = JSON.parse(responseText);
                            
                            accountNameTxt.setValue(response.user.name);
                            accountCellNumberTxt.setValue(response.user.cellNumber);
                        }
                    });
                        
                    // Show the update account button and hide the accept button.
                    welcomeCreateAccountBtn.show();
                    welcomeAcceptBtn.hide();
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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
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
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
                overflow: 'auto',
                padding: '30px',
                // background: 'linear-gradient(176deg, #FFAB33, #CD6110)',
                // backgroundColor: '#DFDFDF', // '#FC8C3A',
                // backgroundPosition: 'right center',
                // backgroundRepeat: 'no-repeat',
                // backgroundAttachment: 'fixed',
                // backgroundSize: 'cover',
                // backgroundImage: 'url(gfx/wallpaper.png)'
            }
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                flex: '0 0 auto',
                width: '100%',
                maxWidth: '380px',
                minWidth: '300px',
                position: 'relative',
                margin: 'auto 0px'
            }
        });
        
        loader = new lx.component.Loader({
            renderTo: el,
            backgroundColor: null,
            color: '#FFFFFF',
            visible: true
        });
        
        
        //
        // WELCOME SECTION
        //
        
        // Create the welcomeSectionEl element
        welcomeSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create welcom section icon
        lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #FA8B42',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="far fa-envelope" style="font-size: 40px; color: #FA8B42;"></i>'
        });
        
        // Create welcomeMessageEl element
        welcomeMessageEl = lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'left'
            }
        });
        
        // Create the welcomeButtonContainerEl element
        var welcomeButtonContainerEl = lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the welcomeDeclineBtn component
        welcomeDeclineBtn = new lx.component.Button({
            renderTo: welcomeButtonContainerEl,
            label: 'Decline',
            flex: '1 1 100%',
            
            onClick: welcomeDeclineBtnClickEventHandler
        });
        
        // Create the welcomeAcceptBtn component
        welcomeAcceptBtn = new lx.component.Button({
            renderTo: welcomeButtonContainerEl,
            label: 'Accept',
            flex: '1 1 100%',
            margin: '0px 0px 0px 40px',
            
            onClick: welcomeAcceptBtnClickEventHandler
        });
        
        // Create the welcomeCreateAccountBtn component
        welcomeCreateAccountBtn = new lx.component.Button({
            renderTo: welcomeButtonContainerEl,
            label: 'Create Account',
            flex: '1 1 100%',
            margin: '0px 0px 0px 40px',
            
            onClick: welcomeCreateAccountBtnClickEventhandler
        });
        welcomeCreateAccountBtn.hide();
        
        
        //
        // CREATE ACCOUNT SECTION
        //
        
        // Create the accountSectionEl element
        accountSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)',
                width: '100%'
            }
        });
        
        // Create account section icon
        lx.createElement('DIV', {
            parent: accountSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #FA8B42',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="far fa-user" style="font-size: 40px; color: #FA8B42;"></i>'
        });
        
        // Create accountFormContainerEl element
        accountFormContainerEl = lx.createElement('DIV', {
            parent: accountSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                width: '100%'
            }
        });
        
        // Create accountNameTxt component
        accountNameTxt = new lx.component.Textbox({
            renderTo: accountFormContainerEl,
            label: 'Name *',
            
            validators: [
                app.validators.required
            ]
        });
        
        // Create accountCellNumberTxt component
        accountCellNumberTxt = new lx.component.Textbox({
            renderTo: accountFormContainerEl,
            label: 'Cellphone Number',
            margin: '20px 0px 0px 0px'
        });
        
        // Create accountPassword component
        accountPassword = new lx.component.Password({
            renderTo: accountFormContainerEl,
            label: 'Password *',
            showStrengthMeter: true,
            margin: '20px 0px 0px 0px',
            
            validators: [
                app.validators.required
            ]
        });
        
        // Create accountPassword component
        accountConfirmPassword = new lx.component.Password({
            renderTo: accountFormContainerEl,
            label: 'Confirm Password *',
            margin: '0px 0px 0px 0px',
            
            validators: [
                app.validators.required
            ]
        });
        
        // Create the accountButtonContainerEl element
        var accountButtonContainerEl = lx.createElement('DIV', {
            parent: accountSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the accountCancelBtn component
        accountCancelBtn = new lx.component.Button({
            renderTo: accountButtonContainerEl,
            label: 'Cancel',
            flex: '1 1 0px',
            
            onClick: accountCancelBtnClickEventHandler
        });
        
        // Create the accountCreateAccountBtn component
        accountCreateAccountBtn = new lx.component.Button({
            renderTo: accountButtonContainerEl,
            label: 'Create Account',
            flex: '1 1 0px',
            margin: '0px 0px 0px 40px',
            
            onClick: accountCreateAccountBtnClickEventHandler
        });
        
        
        //
        // CREATE SUCCESS SECTION
        //
        
        // Create the successSectionEl element
        successSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create account section icon
        lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #0E8350',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="fa fa-check" style="font-size: 40px; color: #0E8350; margin: 3px 0px 0px 3px;"></i>'
        });
        
        // Create successMessageEl element
        successMessageEl = lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'center',
                fontSize: '16px'
            }
        });
        
        // Create the successButtonContainerEl element
        var successButtonContainerEl = lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the successFinishBtn component
        successFinishBtn = new lx.component.Button({
            renderTo: successButtonContainerEl,
            label: 'Finish',
            flex: '1 1 100%',
            
            onClick: successFinishBtnClickEventHandler
        });
        
        
        //
        // ERROR SECTION
        //
        
        // Create the errorSectionEl element
        errorSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)',
                width: '100%'
            }
        });
        
        // Create error section icon
        lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #E75B54',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="fa fa-times" style="font-size: 40px; color: #E75B54;"></i>'
        });
        
        // Create errorMessageEl element
        errorMessageEl = lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'center',
                fontSize: '16px'
            }
        });
        
        // Create the errorButtonContainerEl element
        errorButtonContainerEl = lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the errorOkBtn component
        errorOkBtn = new lx.component.Button({
            renderTo: errorButtonContainerEl,
            label: 'Ok',
            flex: '1 1 100%',
            maxWidth: '200px'
        });
        
        
        //
        // BACK TO LOGIN SECTION
        //
        
        lx.createElement('A', {
            parent: contentContainerEl,
            style: {
                display: 'inline-block',
                color: lx.style.global.highlightColor, // '#FFFFFF', 
                fontSize: '14px',
                margin: '20px 0px 0px 0px',
                cursor: 'pointer',
                textDecoration: 'none'
            },
            href: "index.html",
            innerHTML: 'Go to Attendance Login'
        });
        
        
        // Load invitation details
        loadInvitation();
        
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
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // welcomeDeclineBtn click event handler
    function welcomeDeclineBtnClickEventHandler() {
        // Get the invitation code
        var invitationCode = lx.util.getQueryStringValue('invitation');
        welcomeDeclineBtn.showLoader();
        welcomeDeclineBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=decline',
            data: {
                code: invitationCode
            },
            onSuccess: function( responseText ) {
                welcomeDeclineBtn.hideLoader();
                welcomeDeclineBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    errorMessageEl.innerHTML = 'The invitation could not be found.';
                    lx.applyStyle(welcomeSectionEl, {display: 'none'});
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    return;
                }
                
                // If the invitation was successfully declined show the success section
                successMessageEl.innerHTML = 'You have successfully declined the invitation.';
                
                lx.applyStyle(welcomeSectionEl, {display: 'none'});
                lx.applyStyle(successSectionEl, {display: 'flex'});
            }
        });
    }
    
    // welcomeAcceptBtn clicke event handler
    function welcomeAcceptBtnClickEventHandler() {
        // Get the invitation code
        var invitationCode = lx.util.getQueryStringValue('invitation');
        welcomeAcceptBtn.showLoader();
        welcomeAcceptBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=accept',
            data: {
                code: invitationCode
            },
            onSuccess: function( responseText ) {
                welcomeAcceptBtn.hideLoader();
                welcomeAcceptBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    errorMessageEl.innerHTML = 'Accepting of the invitation failed. <br /><br />' + response.error;
                    lx.applyStyle(welcomeSectionEl, {display: 'none'});
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    
                    errorOkBtn.addEventListener('click', function() {
                        lx.applyStyle(errorSectionEl, {display: 'none'});
                        lx.applyStyle(welcomeSectionEl, {display: 'flex'});
                    });
                    
                    return;
                }
                
                // If the invitation was successfully declined show the success section
                successMessageEl.innerHTML = 'You have successfully accepted the invitation.';
                
                lx.applyStyle(welcomeSectionEl, {display: 'none'});
                lx.applyStyle(successSectionEl, {display: 'flex'});
            }
        });
    }
    
    // welcomeCreateAccountBtn click event handler
    function welcomeCreateAccountBtnClickEventhandler() {
        lx.applyStyle(welcomeSectionEl, {display: 'none'});
        lx.applyStyle(accountSectionEl, {display: 'flex'});
        accountNameTxt.focus();
    }
    
    // accountCancelBtn click event handler
    function accountCancelBtnClickEventHandler() {
        accountCellNumberTxt.setValue('');
        accountPassword.setValue('');
        accountConfirmPassword.setValue('');
        
        lx.applyStyle(accountSectionEl, {display: 'none'});
        lx.applyStyle(welcomeSectionEl, {display: 'flex'});
    }
    
    // accountCreateAccountBtn click event handler
    function accountCreateAccountBtnClickEventHandler() {
        // Check that a name has been entered.
        if( accountNameTxt.getValue() === '' ) {
            accountCreateAccountBtn.showWarning('Please enter your name.');
            return false;
        }
        
        // Check that a password has been entered.
        if( accountPassword.getValue() === '' ) {
            accountCreateAccountBtn.showWarning('Please enter a password.');
            return false;
        }
        
        // Check that the password is strong enough
        if( accountPassword.getStrength() < 3 ) {
            accountCreateAccountBtn.showWarning('Your password is not strong enough.  Please make sure that you see at least 3 green bars.');
            return false;
        }
        
        // Check that the password has been confirmed.
        if( accountConfirmPassword.getValue() === '' ) {
            accountCreateAccountBtn.showWarning('Please confirm your password.');
            return false;
        }
        
        // Check that the password and confirm passwords match.
        if( accountPassword.getValue() !== accountConfirmPassword.getValue() ) {
            accountCreateAccountBtn.showWarning('Your password and confirm password do not match. Please make sure you entered them correctly.');
            return false;
        }
        
        accountCreateAccountBtn.showLoader();
        accountCreateAccountBtn.disable();
        // Accept the invitation
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=accept',
            data: {
                code: lx.util.getQueryStringValue('invitation'),
                name: accountNameTxt.getValue(),
                cellNumber: accountCellNumberTxt.getValue(),
                password: accountPassword.getValue()
            },
            onSuccess: function( responseText ) {
                accountCreateAccountBtn.hideLoader();
                accountCreateAccountBtn.enable();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    errorMessageEl.innerHTML = 'Accepting of the invitation failed. <br /><br />' + response.error;
                    lx.applyStyle(accountSectionEl, {display: 'none'});
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    
                    errorOkBtn.addEventListener('click', function() {
                        lx.applyStyle(errorSectionEl, {display: 'none'});
                        lx.applyStyle(accountSectionEl, {display: 'flex'});
                    });
                    return false;
                }
                
                // Show the success panel.
                successMessageEl.innerHTML =
                    'You have successfully created an account and accepted the invitation. <br /><br />Click \'Finish\' to continue to Lexpro Payroll.';
                
                lx.applyStyle(accountSectionEl, {display: 'none'});
                lx.applyStyle(successSectionEl, {display: 'flex'});
                
            }
        });
        
        return true;
    }
    
    // successFinishBtn click event handler
    function successFinishBtnClickEventHandler() {
        document.location.href = 'index.html';
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};