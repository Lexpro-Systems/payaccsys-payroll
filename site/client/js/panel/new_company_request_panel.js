/* globals app, lx, fbq */
'use strict';


// NEW COMPANY REQUEST PANEL
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
app.panel.NewCompanyRequest = function(config) {
    
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
    
    var companyDetailsSectionEl = null;
    var companyNameTxt = null;
    var companyAliasTxt = null;
    var numberOfEmployeesTxt = null;
    var physicalAddressLine1Txt = null;
    var physicalAddressLine2Txt = null;
    var physicalAddressLine3Txt = null;
    var physicalAddressCodeTxt = null;
    var postalAddressLine1Txt = null;
    var postalAddressLine2Txt = null;
    var postalAddressLine3Txt = null;
    var postalAddressCodeTxt = null;
    var companyContactPersonTxt = null;
    var companyPhoneNumberTxt = null;
    var companyEmailAddressTxt = null;
    
    var userDetailsSectionEl = null;
    var userNameTxt = null;
    var userPhoneNumberTxt = null;
    var userEmailAddressTxt = null;
    
    var submitBtn = null;
    
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
        
        
        // Track the page view for facebook
        // lx.createElement('DIV', {
        //     parent: el,
        //     innerHTML: '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=679920823427970&ev=PageView"/>'
        // });
        
        // var nativeBridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.receiveImgPixel;
        // if (nativeBridge) {
        //     const postObj = {
        //         id: '679920823427970',
        //         ev: 'PageView',
        //         cd: ''
        //         // dpo: {data-processing-options},          // Optional CCPA param
        //         // dpoco: {data-processing-option-country}, // Optional CCPA param
        //         // dpost: {data-processing-option-state},   // Optional CCPA param
        //     };
        //     nativeBridge.postMessage(JSON.stringify(postObj));
        // }
        
        // Track the page view for facebook
        fbq('track', 'PageView');
        
        
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
                boxSizing: 'border-box',
                flex: '0 0 auto',
                width: '100%',
                maxWidth: '500px',
                minWidth: '360px',
                position: 'relative',
                margin: 'auto 0px',
                padding: '40px 40px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)',
            }
        });
        
        loader = new lx.component.Loader({
            renderTo: el,
            backgroundColor: null,
            color: '#FFFFFF',
            visible: false
        });
        
        
        //
        // WELCOME SECTION
        //
        
        // Create the welcomeSectionEl element
        welcomeSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                // padding: '20px'
            }
        });
        
        // // Create welcome section icon
        // lx.createElement('DIV', {
        //     parent: welcomeSectionEl,
        //     style: {
        //         display: 'flex',
        //         flexDirection: 'row',
        //         alignItems: 'center',
        //         justifyContent: 'center',
        //         width: '100px',
        //         height: '100px',
        //         border: 'solid 1px #FA8B42',
        //         borderRadius: '50%',
        //         margin: '20px 0px 0px 0px'
        //     },
        //     innerHTML: '<i class="fas fa-pen-fancy" style="font-size: 40px; color: #FA8B42;"></i>'
        // });
        
        // Display the lexpro logo
        lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                width: '320px'
            },
            innerHTML: '<img src="gfx/payaccsys-logo.svg" style="width: 100%" />'
        });
        
        // Create welcomeMessageEl element
        welcomeMessageEl = lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '30px 0px 0px 0px',
                padding: '0px 0px',
                textAlign: 'center',
                fontSize: '18px'
            },
            innerHTML: 'Please submit your details to register for Lexpro Payroll and Attendance.' +
                '<p style="font-size: 12px;"><br>Items marked with * are required</p>'
        });
        
        
        //
        // CREATE COMPANY DETAILS SECTION
        //
        
        // Create the companyDetailsSectionEl element
        companyDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                alignItems: 'center',
                margin: '40px 0px 0px 0px',
                width: '100%'
            }
        });
        
        // Create an heading component
        new lx.component.Heading({
            renderTo: companyDetailsSectionEl,
            label: 'Company Details',
            margin: '0px 0px 0px 0px',
            padding: '0px',
            width: '100%'
        });
        
        // Create the companyAliasTxt component
        companyAliasTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Company Name *',
            labelAlign: 'top',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
            
            validators: [
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onBlur: function() {
                companyAliasTxt.validate();
            }
        });
        
        // Create the companyNameTxt component
        companyNameTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Registered Company Name *',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
            
            validators: [
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onBlur: function() {
                companyNameTxt.validate();
            }
        });
        
        // Create the companyNameTxt component
        numberOfEmployeesTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Number of Employees *',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
            
            validators: [
                function(value) {
                    let number = parseInt(value);
                    if( !isNaN(number) ) {
                        if( number < 1 ) {
                            return 'Should not be less than 1';
                        }
                    }
                    else {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onFocus: function( event ) {
                let value = parseInt(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseInt(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(parseInt(value));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
                numberOfEmployeesTxt.validate();
            }
        });
        
        // Create an heading component
        new lx.component.Heading({
            renderTo: companyDetailsSectionEl,
            label: 'Company Physical Address',
            margin: '40px 0px 0px 0px',
            padding: '0px',
            width: '100%'
        });
        
        // Create the physicalAddressLine1Txt component
        physicalAddressLine1Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 1',
            labelAlign: 'top',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the physicalAddressLine2Txt component
        physicalAddressLine2Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 2',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the physicalAddressLine3Txt component
        physicalAddressLine3Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 3',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the physicalAddressCodeTxt component
        physicalAddressCodeTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Code',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create an heading component
        new lx.component.Heading({
            renderTo: companyDetailsSectionEl,
            label: 'Company Postal Address',
            margin: '40px 0px 0px 0px',
            padding: '0px',
            width: '100%'
        });
        
        // Create the postalAddressLine1Txt component
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 1',
            labelAlign: 'top',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the postalAddressLine2Txt component
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 2',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the postalAddressLine3Txt component
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Line 3',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the postalAddressCodeTxt component
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Code',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create an heading component
        new lx.component.Heading({
            renderTo: companyDetailsSectionEl,
            label: 'Company Contact Details',
            margin: '40px 0px 0px 0px',
            padding: '0px',
            width: '100%'
        });
        
        // Create the companyContactPersonTxt component
        companyContactPersonTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Contact Person',
            labelAlign: 'top',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the companycompanyPhoneNumberTxtAliasTxt component
        companyPhoneNumberTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Company Phone Number',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        // Create the companyEmailAddressTxt component
        companyEmailAddressTxt = new lx.component.Textbox({
            renderTo: companyDetailsSectionEl,
            label: 'Company Email Address',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        
        
        //
        // CREATE USER DETAILS SECTION
        //
        
        // Create the userDetailsSectionEl element
        userDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                alignItems: 'left',
                margin: '40px 0px 0px 0px',
                width: '100%'
            }
        });
        
        // Create an heading component
        new lx.component.Heading({
            renderTo: userDetailsSectionEl,
            label: 'User Details',
            margin: '0px 0px 0px 0px',
            padding: '0px',
            width: '100%'
        });
        
        // Create the userNameTxt component
        userNameTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Name *',
            labelAlign: 'top',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
            
            validators: [
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onBlur: function() {
                userNameTxt.validate();
            }
        });
        
        // Create the userEmailAddressTxt component
        userEmailAddressTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Email Address *',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
            
            validators: [
                function(value) {
                    if( value.trim() === '' ) {
                        return 'Value is required';
                    }
                    return true;
                }
            ],
            
            onBlur: function() {
                userEmailAddressTxt.validate();
            }
        });
        
        // Create the userPhoneNumberTxt component
        userPhoneNumberTxt = new lx.component.Textbox({
            renderTo: userDetailsSectionEl,
            label: 'Phone Number',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
//             maxWidth: '500px'
        });
        
        
        //
        // BUTTON SECTION
        //
        
        // Create the buttonContainerEl element
        var buttonContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px'
            }
        });
        
        // Create the submitBtn component
        submitBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Submit Request',
            margin: '0px auto',
            flex: '1 1 auto',
            maxWidth: '260px',
            
            onClick: submitBtnClickEventHandler
        });
        
        
        //
        // BACK TO LOGIN SECTION
        //
        
        lx.createElement('A', {
            parent: contentContainerEl,
            style: {
                display: 'inline-block',
                color: '#EF4E45',
                fontSize: '14px',
                margin: '20px 0px 0px 0px',
                cursor: 'pointer',
                textDecoration: 'none'
            },
            href: "index.html",
            innerHTML: 'Back to Payroll Login'
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
        companyAliasTxt.focus();
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
    
    // submitBtn click event handler
    function submitBtnClickEventHandler() {
        // Check the required values
        if( companyAliasTxt.getValue().trim() === '' ) {
            submitBtn.showWarning('Company name is required.');
            return;
        }
        else if( companyNameTxt.getValue().trim() === '' ) {
            submitBtn.showWarning('Registered company name is required.');
            return;
        }
        else if( numberOfEmployeesTxt.getValue().trim() === '' ) {
            submitBtn.showWarning('Number of employees required.');
            return;
        }
        else if( userNameTxt.getValue().trim() === '' ) {
            submitBtn.showWarning('User name is required.');
            return;
        }
        else if( userEmailAddressTxt.getValue().trim() === '' ) {
            submitBtn.showWarning('User email address is required.');
            return;
        }
        
        submitBtn.showLoader();
        submitBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=requestNew',
            data: {
                companyName: companyNameTxt.getValue().trim(),
                companyAlias: companyAliasTxt.getValue().trim(),
                numberOfEmployees: parseInt(numberOfEmployeesTxt.getValue()),
                physicalAddressLine1: physicalAddressLine1Txt.getValue().trim(),
                physicalAddressLine2: physicalAddressLine2Txt.getValue().trim(),
                physicalAddressLine3: physicalAddressLine3Txt.getValue().trim(),
                physicalAddressCode: physicalAddressCodeTxt.getValue().trim(),
                postalAddressLine1: postalAddressLine1Txt.getValue().trim(),
                postalAddressLine2: postalAddressLine2Txt.getValue().trim(),
                postalAddressLine3: postalAddressLine3Txt.getValue().trim(),
                postalAddressCode: postalAddressCodeTxt.getValue().trim(),
                companyContactPerson: companyContactPersonTxt.getValue().trim(),
                companyPhoneNumber: companyPhoneNumberTxt.getValue().trim(),
                companyEmailAddress: companyEmailAddressTxt.getValue().trim(),
                userName: userNameTxt.getValue().trim(),
                userPhoneNumber: userPhoneNumberTxt.getValue().trim(),
                userEmailAddress: userEmailAddressTxt.getValue().trim()
            },
            onSuccess: function( responseText ) {
                submitBtn.hideLoader();
                submitBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to submit request',
                        message: response.error
                    });
                    return;
                }
                
                new lx.component.Messagebox({
                    title: 'Request submitted successfully',
                    message: 'Thank you for your interest in Payaccsys Payroll. We will contact you via email with details on how to access your account as soon as your request has been processed.',
                    onClose: function() {
                        document.location.href = 'index.html';
                    }
                });
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};