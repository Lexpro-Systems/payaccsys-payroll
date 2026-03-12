/* globals app, lx */
'use strict';

// USER PROFILE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.UserProfile = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let nameTxt = null;
    let emailTxt = null;
    let cellphoneTxt = null;
    
    let defaultCompanySectionEl = null;
    let defaultCompanySelect = null;
    
    let companySectionEl = null;
    
    let buttonContainerEl = null;
    let cancelBtn = null;
    let saveBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadProfile() {
        // Show the loader.
        loader.show(false);
        
        // Fetch user profile.
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getProfile',
            onSuccess: function( responseText ) {
                // Hide the loader.
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        tile: 'Loading Profile Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                nameTxt.setValue( response.profile.name );
                emailTxt.setValue( response.profile.emailAddress );
                cellphoneTxt.setValue( response.profile.cellNumber );
                
                // Load all companies
                defaultCompanySelect.clear();
                let companies = response.profile.companies;
                let listItems = [{value: null, text: 'None'}];
                let defaultCompanyId = null;
                let defaultCompanyName = 'None';
                for( let i = 0; i < companies.length; i++ ) {
                    listItems.push({value: companies[i].id, text: companies[i].name});
                    if( companies[i].isDefault === true ) {
                        defaultCompanyId = companies[i].id;
                        defaultCompanyName = companies[i].name;
                    }
                    
                    // Add an item to the companies list
                    lx.createElement('DIV', {
                        parent: companySectionEl,
                        style: {
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderColor: '#DFDFDF',
                            borderWidth: '1px',
                            padding: '20px',
                            fontSize: '16px',
                            margin: '2px'
                        },
                        innerHTML: companies[i].name
                    });
                }
                defaultCompanySelect.addItems( listItems );
                defaultCompanySelect.setValue(defaultCompanyId, defaultCompanyName);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
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
            innerHTML: '<i class="fa fa-fw fa-user" style="margin: 0px 15px 0px 0px;"></i>My Profile'
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
        // PERSONAL DETAILS SECTION
        //
        
        // Create personal details heading
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Personal Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create personal details section
        let personalDetailsSection = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                margin: '0px 15px 0px 15px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px'
            }
        });
        
        // Create the name textbox
        nameTxt = new lx.component.Textbox({
            renderTo: personalDetailsSection,
            label: 'Name'
        });
        
        // Create the email textbox
        emailTxt = new lx.component.Textbox({
            renderTo: personalDetailsSection,
            label: 'Email',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the cellphone textbox
        cellphoneTxt = new lx.component.Textbox({
            renderTo: personalDetailsSection,
            label: 'Cellphone Number',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // DEFAULT COMPANY SECTION
        //
        
        // Create default company heading
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Default Company',
            margin: '5px 15px 0px 15px',
            width: ''
        });
        
        // Create the default company section
        defaultCompanySectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                margin: '0px 15px 0px 15px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px'
            }
        });
        
        // Create the default company select
        defaultCompanySelect = new lx.component.Selectbox({
            renderTo: defaultCompanySectionEl,
            label: ''
        });
        
        
        //
        // COMPANIES SECTION
        //
        
        // Create companies heading
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Companies',
            margin: '5px 15px 0px 15px',
            width: ''
        });
        
        // Create companies section
        companySectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                margin: '0px 15px 0px 15px'
            }
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
        
        // Create the cancelBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loadProfile();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        nameTxt.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        
        if( nameTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter a name');
            
            return;
        }
        else if( emailTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter a email address');
            
            return;
        }
        else if( cellphoneTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter a cellphone number');
            
            return;
        }
        saveBtn.showLoader();
        saveBtn.disable();
        // Fetch user profile.
        lx.sendJSON({
            url: 'exec.php?c=User&fn=updateUserProfile',
            data: {
                name: nameTxt.getValue(),
                email: emailTxt.getValue(),
                cellNumber: cellphoneTxt.getValue(),
                defaultCompanyId: defaultCompanySelect.getValue()
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                let response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                me.fireEvent('cancel', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};