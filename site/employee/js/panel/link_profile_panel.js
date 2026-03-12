/* globals app, lx */
'use strict';


// LINK PROFILE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  title               Specify a different title for this panel
//
// Events:
//
//  onCompanySelect     This event is fired when a company is selected from the list.
//  onCancel            This event is fired when the user clicks the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.LinkProfile = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var identificationContainerEl = null;
    var identificationMessageEl = null;
    var idNumberTxt = null;
    
    var verifyContainerEl = null;
    var verifyMessageEl = null;
    var codeContainerEl = null;
    
    var loader = null;
    
    var buttonContainerEl = null;
    var continueBtn = null;
    var cancelBtn = null;
    
    var progressIndex = 0;
    var verificationCodeTextboxes = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to create textbox components for each required verification code
    function verificationCodeComponents( numComponents ) {
        // Clear all existing components
        verificationCodeTextboxes = [];
        
        // Depending on the number of 
        if( numComponents === 1 ) {
            // Create the codeTxt component
            let codeTxt = new lx.component.Textbox({
                renderTo: codeContainerEl,
                width: '100%',
                margin: '15px 0px 0px 0px',
                label: 'Verification Code'
            });
            
            // Save the component
            verificationCodeTextboxes.push(codeTxt);
        }
        else {
            for( var i = 0 ; i < numComponents; i++ ) {
                // Create the codeTxt component
                let codeTxt = new lx.component.Textbox({
                    renderTo: codeContainerEl,
                    width: '100%',
                    margin: '15px 0px 0px 0px',
                    label: 'Verification Code #' + (i + 1)
                });
            
                // Save the component
                verificationCodeTextboxes.push(codeTxt);
            }
        }
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            title: '<i class="fa fa-fw fa-exchange-alt" style="margin: 0px 15px 0px 0px;"></i>Link Profile'
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onProfileLink') ) me.addEventListener('profilelink', compConfig.onProfileLink);
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
                width: '100%',
                height: '100%'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '20px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: app.panelBackgroundColor
            },
            innerHTML: compConfig.title
        });
        
        
        //
        // IDENTIFICATION SECTION
        //
        
        // Create the identificationContainerEl element
        identificationContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                flex: '1 1 auto',
                padding: '20px'
            }
        });
        
        // Create identificationMessageEl element
        identificationMessageEl = lx.createElement('DIV', {
            parent: identificationContainerEl,
            style: {
                width: '100%',
                fontSize: '12px'
            },
            innerHTML: 
                'In order to ensure the privacy of your payslips and related information we have to verify that you have access to the relevant company or companies.<br><br>' +
                'Please enter your ID or passport number below and press the \'Continue\' button to start the verification process.'
        });
        
        // Create id number textbox
         idNumberTxt = new lx.component.Textbox({
            renderTo: identificationContainerEl,
            label: 'ID / Passport Number',
            margin: '20px 0px 0px 0px',
            
            // onKeyPress: idNumberTxtKeyPressEventHandler
        });
        
        
        //
        // VERIFY SECTION
        //
        
        verifyContainerEl = lx.createElement('DIV', {
            parent: el,
            className: 'flex-column flex-align-center flex-resize',
            style: {
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                flex: '1 1 auto',
                padding: '20px'
            }
        });
        
        // Create a message to explain the verification code
        verifyMessageEl = lx.createElement('DIV', {
            parent: verifyContainerEl,
            style: {
                fontSize: '12px',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the company list element
        codeContainerEl = lx.createElement('DIV', {
            parent: verifyContainerEl,
            style: {
                // overflow: 'auto',
                flex: '1 1 100%',
                margin: '20px 0px 0px 0px',
                padding: '0px',
                zIndex: 0
            }
        });
        
        // Hide the verify container
        app.applyStyle(verifyContainerEl, {display: 'none'});
        
        
        //
        // BUTTON SECTION
        //
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: el
        });
        loader.hide();
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: app.panelBackgroundColor
            }
        });
        
        // Create the continueBtn component
        continueBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Continue',
            width: '100%',
            margin: '0px 0px 0px 0px',
            tooltipAlign: 'topCenter',
            
            onClick: continueBtnClickEventHandler
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            width: '100%',
            margin: '15px 0px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // continueBtn click event handler
    function continueBtnClickEventHandler() {
        // Depending on the progress
        if( progressIndex === 0 ) {
            // Check that the id or passport number was provided
            if( idNumberTxt.getValue().trim() === '' ) {
                continueBtn.showWarning('Please enter your ID or passport number.', true);
                return;
            }
            
            // Start linking companies
            continueBtn.showLoader();
            continueBtn.disable();
            
            lx.sendJSON({
                url: 'exec.php?c=User&fn=linkCompanies',
                data: {
                    idNumber: idNumberTxt.getValue().trim()
                },
                onSuccess: function(responseText) {
                    continueBtn.hideLoader();
                    continueBtn.enable();
                    
                    var response = JSON.parse( responseText );
                    
                    if( response.ok !== true ) {
                        continueBtn.showWarning(response.error, true);
                        return;
                    }
                    
                    // Update the verification message
                    let emailAddresses = '';
                    for( let i = 0; i < response.emailAddresses.length; i++) {
                        if( i > 0 ) {
                            emailAddresses = emailAddresses + '<br>';
                        }
                        emailAddresses = emailAddresses + response.emailAddresses[i];
                    }
                    
                    // Set the verify message
                    verifyMessageEl.innerHTML = 
                        'We sent an email with a verification code to the following email address:<br><br>' + 
                        emailAddresses +
                        '<br><br>Please enter the code below and press the \'Finish\' button to complete the verification process.';
                    
                    // Change the message if there are more than one code
                    if( response.emailAddresses.length > 1 ) {
                        verifyMessageEl.innerHTML = 
                            'We\'ve sent an email with a unique verification code for each of the relevant companies to the following email addresses:<br><br>' + 
                            emailAddresses +
                            '<br><br>Please enter the codes for the companies you want to access below and press the \'Finish\' button to complete the verification process.';
                    }
                    
                    // Create a textbox for every mailed verification code
                    codeContainerEl.innerHTML = '';
                    verificationCodeComponents( response.emailAddresses.length );
                    
                    // Show the next panel and adjust the progress
                    app.applyStyle(identificationContainerEl, {display: 'none'});
                    app.applyStyle(verifyContainerEl, {display: 'block'});
                    cancelBtn.setLabel('Back');
                    continueBtn.setLabel('Finish');
                    progressIndex = progressIndex + 1;
                }
            });
        }
        else if( progressIndex === 1 ) {
            // Check that at least one verification code was provided
            let verification = [];
            for( let i = 0; i < verificationCodeTextboxes.length; i++ ) {
                if( verificationCodeTextboxes[i].getValue().trim() !== '' ) {
                    verification.push({code: verificationCodeTextboxes[i].getValue().trim() });
                }
            }
            
            if( verification.length < 1 ) {
                continueBtn.showWarning('Please enter one or more verification codes.', true);
                return;
            }
            
            // Finish linking companies
            continueBtn.showLoader();
            continueBtn.disable();
            
            lx.sendJSON({
                url: 'exec.php?c=User&fn=verifyLinkCompanies',
                data: {
                    verification: verification
                },
                onSuccess: function(responseText) {
                    continueBtn.hideLoader();
                    continueBtn.enable();
                    
                    var response = JSON.parse( responseText );
                    
                    if( response.ok !== true ) {
                        continueBtn.showWarning(response.error, true);
                        return;
                    }
                    
                    // Fire the cancel event to re-load the site
                    me.fireEvent('profilelink', {srcPanel: me, numLinked: response.numLinked });
                }
            });
        }
    }
    
    // cancelBtn click event handler
    function cancelBtnClickEventHandler() {
        // Depending on the progress
        if( progressIndex === 0 ) {
            // Fire the cancel event
            me.fireEvent('cancel', {srcPanel: me});
        }
        else if( progressIndex === 1 ) {
            // Show the previous panel and adjust the progress
            app.applyStyle(identificationContainerEl, {display: 'block'});
            app.applyStyle(verifyContainerEl, {display: 'none'});
            cancelBtn.setLabel('Cancel');
            continueBtn.setLabel('Continue');
            progressIndex = progressIndex - 1;
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};