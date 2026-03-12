/* globals app, lx */
'use strict';

// QUICK LOGIN PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onLogin             This event is fired after the quick login was successful.
//  onCancel            This event is fired when the user click the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.QuickLogin = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    let companyId = null;
    let companyName = null;
    
    let el = null;
    
    let loaderContainerEl = null;
    let loader = null;
    let contentEl = null;
    
    let passwordSectionEl = null;
    let passwordTxt = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let loginBtn = null;
    

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
            companyId: null,
            companyName: ''
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onLogin') ) me.addEventListener('login', compConfig.onLogin);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        companyId = compConfig.companyId;
        companyName = compConfig.companyName;
        
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
            innerHTML: 'Quick Login: ' + companyName
        });
        
        // Create the loaderContainerEl element
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                position: 'relative',
                overflow: 'auto'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                boxSizing: 'border-box',
                height: '100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px',
                overflow: 'auto'
            }
        });
        
        
        //
        // PASSWORD SECTION
        //
        
        // Create example section
        passwordSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                margin: '15px 15px 0px 15px',
            }
        });
        
        // Create the passwordTxt component
        passwordTxt = new lx.component.Password({
            renderTo: passwordSectionEl,
            label: 'Please enter your password',
            
            onKeyPress: passwordTxtKeypressEventHandler
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
        
        // Create the loginBtn component
        loginBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Quick Login',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: loginBtnClickEventHandler
        });
        
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        passwordTxt.focus();
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
        
        // Destroy the panel
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // passwordTxt keypress event handler
    function passwordTxtKeypressEventHandler( event ) {
        if( event.key === 13 ) {
            loginBtn.fireEvent('click');
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function loginBtnClickEventHandler() {
        // Check that a password was entered.
        if( passwordTxt.getValue() === '' ) {
            loginBtn.showWarning('Please enter your password.');
            return false;
        }
        
        // Call User.createQuickAccessToken PHP function
        lx.sendJSON({
            url: 'exec.php?c=User&fn=createQuickAccessToken',
            data: {
                companyId: companyId,
                password: passwordTxt.getValue()
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    loginBtn.showWarning( response.error );
                    return;
                }
                
                // Open a new window and browse to the quick access url
                lx.sendForm({
                    target: 'lexproPayrollQuickAccess',
                    url: response.quickAccessUrl,
                    data: {
                        quickAccessToken: response.quickAccessToken
                    }
                });
                
                // Fire the login event.
                me.fireEvent('login', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};