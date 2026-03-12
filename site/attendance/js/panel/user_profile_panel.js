/* globals app, lx */
'use strict';

// USER PROFILE PANEL
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
app.panel.UserProfile = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var nameTxt = null;
    var emailTxt = null;
    var cellphoneTxt = null;
    
    var defaultCompanySectionEl = null;
    var defaultCompanySelect = null;
    
    var companySectionEl = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
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
                
                var response = JSON.parse( responseText );
                
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
                var companies = response.profile.companies;
                var listItems = [{value: null, text: 'None'}];
                var defaultCompanyId = null;
                var defaultCompanyName = 'None';
                for( var i = 0; i < companies.length; i++ ) {
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
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
        var personalDetailsSection = lx.createElement('DIV', {
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
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
        
        loadProfile();
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
        nameTxt.focus();
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
                var response = JSON.parse( responseText );
                
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