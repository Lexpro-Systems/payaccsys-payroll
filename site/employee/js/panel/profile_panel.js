/* globals app, lx */
'use strict';


// PROFILE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.Profile = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var centeredContainerEl = null;
    var loader = null;
    
    var firstNameTxt = null;
    var lastNameTxt = null;
    var emailTxt = null;
    var changePasswordCb = null;
    var passwordContainerEl = null;
    var oldPassword = null;
    var newPassword = null;
    var confirmPassword = null;
    
    var companySectionEl = null;
    
    var buttonContainerEl = null;
    var saveBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load profile data
    function loadProfile() {
        // Show the loader.
        loader.show(false);
        
        // Fetch user profile.
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getProfile',
            onSuccess: function( responseText ) {
                // Hide the loader.
                loader.hide();
                
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        tile: 'Loading Profile Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                firstNameTxt.setValue( response.profile.firstName );
                lastNameTxt.setValue( response.profile.lastName );
                emailTxt.setValue( response.profile.emailAddress );
                
                // Load all companies
                var companies = response.profile.companies;
                var listItems = [{value: null, text: 'None'}];
                for( var i = 0; i < companies.length; i++ ) {
                    listItems.push({value: companies[i].id, text: companies[i].name});
                    
                    // Add an item to the companies list
                    lx.createElement('DIV', {
                        parent: companySectionEl,
                        style: {
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderColor: app.sectionBackgroundColor,
                            borderWidth: '1px',
                            padding: '20px',
                            fontSize: '16px',
                            margin: '2px 0px 2px 0px'
                        },
                        innerHTML: companies[i].name
                    });
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
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        
        // Initialize state
        confirmDestroy = false;
        
        // Clear the background color of the container to show the backgroun image
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
                overflow: '',
                // backgroundColor: app.panelBackgroundColor
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-user" style="margin: 0px 15px 0px 0px;"></i>My Profile'
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'hidden'
            }
        });
        
        // Create our loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px 0px 0px 0px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the centeredContainerEl component
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                maxWidth: '768px'
            }
        });
        
        
        //
        // PERSONAL DETAILS SECTION
        //
        
        // Create the container for the entire heading row
        let personalDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Display the heading
        let personalDetailsHeadingEl = lx.createElement('DIV', {
            parent: personalDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Personal Details</div>'
        });
        
        // // Create an edit button
        // let editPersonalDetailsBtnEl = lx.createElement('DIV', {
        //     parent: personalDetailsHeadingContainerEl,
        //     style: {
        //         cursor: 'pointer',
        //         display: 'flex',
        //         width: '28px',
        //         minWidth: '28px',
        //         height: '28px',
        //         minHeight: '28px',
        //         margin: 'auto 15px auto auto',
        //         fontSize: '14px',
        //         color: lx.style.global.backgroundColor,
        //         backgroundColor: lx.style.global.highlightColor,
        //         borderRadius: '50%'
        //     },
        //     innerHTML: '<i class="fa fa-pen" style="margin: auto auto;"></i>'
        // });
        // editPersonalDetailsBtnEl.addEventListener('click', editPersonalDetailsBtnElClickEventHandler);
        
        // Create a section to display the details
        let personalDetailsSectionEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the first name textbox
        firstNameTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'First Name *'
        });
        
        // Create the last name textbox
        lastNameTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Last Name *',
            margin: '20px 0px 0px 0px'
        });
        
        // Create the email textbox
        emailTxt = new lx.component.Textbox({
            renderTo: personalDetailsSectionEl,
            label: 'Email Address *',
            margin: '20px 0px 0px 0px'
        });
        
        // Create the change password checkbox
        changePasswordCb = new lx.component.Checkbox({
            renderTo: personalDetailsSectionEl,
            label: 'Change Password?',
            labelAlign: 'left',
            labelWidth: '120px',
            margin: '20px 0px 0px 0px',
            isChecked: 'false',
            
            onChange: function() {
                if( changePasswordCb.getValue() ) {
                    passwordContainerEl.style.display = 'block';
                }
                else {
                    passwordContainerEl.style.display = 'none';
                }
            },
            onClick: null
        });
        
        // Create the password container
        passwordContainerEl = lx.createElement('DIV', {
            parent: personalDetailsSectionEl,
            style: {
                display: 'none',
                boxSizing: 'border-box',
                margin: '0px 0px 0px 0px',
                width: '100%'
            }
        });
        
        // Create the old password component
        oldPassword =  newPassword = new lx.component.Password({
            renderTo: passwordContainerEl,
            label: 'Old Password *',
            margin: '20px 0px 0px 0px'
        });
        
        // Create the new password component
        newPassword = new lx.component.Password({
            renderTo: passwordContainerEl,
            label: 'New Password *',
            margin: '20px 0px 0px 0px',
            showStrengthMeter: true
        });
        
        // Create the confirm password component
        confirmPassword = new lx.component.Password({
            renderTo:  passwordContainerEl,
            label: 'Confirm Password *',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // COMPANIES SECTION
        //
        
        // Create the container for the entire heading row
        let companyHeadingContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '900px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Display the heading
        let companyHeadingEl = lx.createElement('DIV', {
            parent: companyHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Companies</div>'
        });
        
        // // Create an edit button
        // let editCompaniesBtnEl = lx.createElement('DIV', {
        //     parent: companyHeadingContainerEl,
        //     style: {
        //         cursor: 'pointer',
        //         display: 'flex',
        //         width: '28px',
        //         minWidth: '28px',
        //         height: '28px',
        //         minHeight: '28px',
        //         margin: 'auto 15px auto auto',
        //         fontSize: '14px',
        //         color: lx.style.global.backgroundColor,
        //         backgroundColor: lx.style.global.highlightColor,
        //         borderRadius: '50%'
        //     },
        //     innerHTML: '<i class="fa fa-pen" style="margin: auto auto;"></i>'
        // });
        // editCompaniesBtnEl.addEventListener('click', editCompaniesBtnElClickEventHandler);
        
        // Create a section to display the details
        companySectionEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // // Create companies heading
        // var companyHeadingContainerEl = lx.createElement('DIV', {
        //     parent: centeredContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         margin: '30px 0px 0px 0px',
        //         padding: '0px 15px',
        //         width: '100%',
        //         height: '45px',
        //         fontSize: '16px',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         color: lx.style.global.color,
        //         backgroundColor: app.sectionBackgroundColor
        //     }
        // });
        
        // new lx.createElement('DIV', {
        //     parent: companyHeadingContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         alignItems: 'center',
        //         justifyContent: 'space-between',
        //         width: '100%',
        //         maxWidth: '900px',
        //         fontSize: '16px',
        //         color: '#FFFFFF'
        //     },
        //     innerHTML: '<div>Companies</div>'
        // });
        
        // // Create companies section
        // companySectionEl = lx.createElement('DIV', {
        //     parent: centeredContainerEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         margin: '0px 15px 0px 15px',
        //         width: '100%'
        //     }
        // });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: personalDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                padding: '15px 0px 0px 0px',
                margin: '15px 0px 0px 0px'
            }
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '100%',
            maxWidth: '200px',
            margin: '0px 0px 0px 0px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Function to load profile
        loadProfile();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Do sanity checks
        if( firstNameTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('Please enter a first name');
            return;
        }
        else if( lastNameTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('Please enter a last name');
            return;
        }
        else if( emailTxt.getValue().trim() === '' ) {
            saveBtn.showWarning('Please enter an email address');
            return;
        }
        
        if (changePasswordCb.getValue()) {
            if (oldPassword.getValue() == null || oldPassword.getValue().trim() == '') {
                saveBtn.showWarning('Old password is required');
                return;
            }
            else if ( newPassword.getValue() != null || confirmPassword.getValue() != null ) {
                if ( newPassword.getStrength() < 3 ) {
                    saveBtn.showWarning('Password strength must be at least 3 bars');
                    return;
                }
                else if ( confirmPassword.getValue() != newPassword.getValue() ) {
                    saveBtn.showWarning('Passwords do not match');
                    return;
                }
            }
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Update the user profile
        lx.sendJSON({
            url: 'exec.php?c=User&fn=updateProfile',
            data: {
                firstName: firstNameTxt.getValue(),
                lastName: lastNameTxt.getValue(),
                email: emailTxt.getValue(),
                changePassword: changePasswordCb.getValue(),
                oldPassword: oldPassword.getValue().trim(),
                newPassword: newPassword.getValue().trim()
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    // new lx.component.Messagebox({
                    //     tile: 'Saving Profile Failed',
                    //     message: response.error
                    // });
                    return;
                }
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};