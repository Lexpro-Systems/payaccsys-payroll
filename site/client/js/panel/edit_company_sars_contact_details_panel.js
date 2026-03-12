/* globals app, lx */
'use strict';

// TEMPLATE MODAL PANEL
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
app.panel.EditCompanySarsContactDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var sarsDetailsSectionEl = null;
    var sarsContactFirstNameTxt = null;
    var sarsContactLastNameTxt = null;
    var emailAddressTxt = null;
    var sarsContactBusinessNumberTxt = null;
    var sarsContactCellNumberTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtnTooltip = null;
    var saveBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load company details
    function loadCompanyDetails() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load details',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                
                sarsContactFirstNameTxt.setValue(response.company.details.sarsContactFirstName);
                sarsContactLastNameTxt.setValue(response.company.details.sarsContactLastName);
                emailAddressTxt.setValue(response.company.details.sarsContactEmailAddress);
                sarsContactBusinessNumberTxt.setValue(response.company.details.sarsContactBusinessNumber);
                sarsContactCellNumberTxt.setValue(response.company.details.sarsContactCellNumber);
                
                loader.hide();
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
            innerHTML: 'Edit SARS Contact Details'
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
        // SARS CONTACT PERSON SECTION
        //
        
        sarsDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        sarsContactFirstNameTxt = new lx.component.Textbox({
            renderTo: sarsDetailsSectionEl,
            label: 'First Name'
        });
        
        sarsContactLastNameTxt = new lx.component.Textbox({
            renderTo: sarsDetailsSectionEl,
            label: 'Last Name',
            margin: '15px 0px 0px 0px'
        });
        
        emailAddressTxt = new lx.component.Textbox({
            renderTo: sarsDetailsSectionEl,
            label: 'Email Address',
            margin: '15px 0px 0px 0px'
        });
        
        sarsContactBusinessNumberTxt = new lx.component.Textbox({
            renderTo: sarsDetailsSectionEl,
            label: 'Contact Business Number',
            margin: '15px 0px 0px 0px'
        });
        
        sarsContactCellNumberTxt = new lx.component.Textbox({
            renderTo: sarsDetailsSectionEl,
            label: 'Contact Cell Number',
            margin: '15px 0px 0px 0px'
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
        
        // Create the saveBtnContainerEl element
        saveBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the saveBtnTooltip component.
        saveBtnTooltip = new lx.component.Tooltip({
            renderTo: saveBtnContainerEl,
            maxWidth: '300px',
            arrowOffset: 'center',
            
            onBlur: saveBtnTooltipBlurEventHandler
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loadCompanyDetails();
        
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
        sarsContactFirstNameTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
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
    
    // saveBtnTooltip blur event handler
    function saveBtnTooltipBlurEventHandler( event ) {
        event.srcComponent.hide();
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Validate all fields
        sarsContactFirstNameTxt.validate();
        sarsContactLastNameTxt.validate();
        emailAddressTxt.validate();
        sarsContactBusinessNumberTxt.validate();
        sarsContactCellNumberTxt.validate();
        
        // Check that a valid company name was entered.
        if( sarsContactFirstNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Your SARS contact first name can not be empty.');
            return;
        }
        
        // Check that a valid company name was entered.
        if( sarsContactLastNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Your SARS contact last name can not be empty.');
            return;
        }
        
        // Check that a valid company alias was entered.
        if( emailAddressTxt.getValue() === '' ) {
            saveBtn.showWarning('Your SARS contact email can not be empty.');
            return;
        }
        
        // Check that a valid company sarsContactBusinessNumberTxt was entered.
        if( sarsContactBusinessNumberTxt.getValue() === '' ) {
            saveBtn.showWarning('Your SARS contact business number can not be empty.');
            return;
        }
        
        // Check that a valid company sarsContactCellNumberTxt was entered.
        if( sarsContactCellNumberTxt.getValue() === '' ) {
            saveBtn.showWarning('Your SARS contact cell number can not be empty.');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: {
                sarsContactFirstName: sarsContactFirstNameTxt.getValue(),
                sarsContactLastName: sarsContactLastNameTxt.getValue(),
                sarsContactEmailAddress: emailAddressTxt.getValue(),
                sarsContactBusinessNumber: sarsContactBusinessNumberTxt.getValue(),
                sarsContactCellNumber: sarsContactCellNumberTxt.getValue()
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
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