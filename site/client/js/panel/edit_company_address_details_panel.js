/* globals app, lx */
'use strict';

// EDIT COMPANY ADDRESS DETAILS PANEL
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
app.panel.EditCompanyAddressDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var physicalAddressSectionEl = null;
    var physicalAddressCountrySelect = null;
    var physicalAddressCityTxt = null;
    var physicalAddressSuburbTxt = null;
    var physicalAddressStreetTxt = null;
    var physicalAddressComplexTxt = null;
    var physicalAddressUnitTxt = null;
    var physicalAddressPostalCodeTxt = null;
    var postalAddressSectionEl = null;
    var postalAddressLine1Txt = null;
    var postalAddressLine2Txt = null;
    var postalAddressLine3Txt = null;
    var postalAddressCodeTxt = null;
    
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
    
    function loadCountries( ) {
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: {
                searchString: physicalAddressCountrySelect.getSearchString(),
                limit: 20,
                offset: physicalAddressCountrySelect.getItemCount(),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Countries Failed',
                        message: response.error
                    });
                }
                
                var countries = [];
                for( var i = 0; i < response.countries.length; i++ ) {
                    countries.push({
                        value: response.countries[i].code,
                        text: response.countries[i].name
                    });
                }
                
                physicalAddressCountrySelect.addItems( countries );
            }
        });
    }
    
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
                
                physicalAddressCountrySelect.setValue(response.company.details.physicalAddressCountryCode, response.company.details.physicalAddressCountryName);
                physicalAddressCityTxt.setValue(response.company.details.physicalAddressCity);
                physicalAddressSuburbTxt.setValue(response.company.details.physicalAddressSuburb);
                physicalAddressStreetTxt.setValue(response.company.details.physicalAddressStreet);
                physicalAddressComplexTxt.setValue(response.company.details.physicalAddressComplex);
                physicalAddressUnitTxt.setValue(response.company.details.physicalAddressUnit);
                physicalAddressPostalCodeTxt.setValue(response.company.details.physicalAddressPostalCode);
                postalAddressLine1Txt.setValue(response.company.details.postalAddressLine1);
                postalAddressLine2Txt.setValue(response.company.details.postalAddressLine2);
                postalAddressLine3Txt.setValue(response.company.details.postalAddressLine3);
                postalAddressCodeTxt.setValue(response.company.details.postalAddressCode);
                
                
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
            innerHTML: 'Edit Address Details'
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
        // PHYSICAL ADDRESS DETAILS SECTION
        //
        
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Physical Address',
            margin: '0px 15px',
            width: ''
        });
        
        physicalAddressSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        physicalAddressUnitTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Unit',
            margin: '0px 0px 0px 0px'
        });
        
        physicalAddressComplexTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Complex',
            margin: '15px 0px 0px 0px'
        });
        
        physicalAddressStreetTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Street',
            margin: '15px 0px 0px 0px'
        });
        
        physicalAddressSuburbTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Suburb',
            margin: '15px 0px 0px 0px'
        });
        
        physicalAddressCityTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'City',
            margin: '15px 0px 0px 0px'
        });
        
        physicalAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            label: 'Postal Code',
            margin: '15px 0px 0px 0px'
        });
        
        physicalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: physicalAddressSectionEl,
            label: 'Country',
            search: true,
            margin: '15px 0px 0px 0px',
            
            onSearch: function() {
                physicalAddressCountrySelect.clear();
                loadCountries();
            },
            
            onListScrollEnd: function() {
                loadCountries();
            }
        });
        
        
        //
        // POSTAL ADDRESS DETAILS SECTION
        //
        
        // Create example heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Postal Address Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create example section
        postalAddressSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 1'
        });
        
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 2',
            margin: '15px 0px 0px 0px'
        });
        
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Line 3',
            margin: '15px 0px 0px 0px'
        });
        
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: postalAddressSectionEl,
            label: 'Postal Code',
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
        
        loadCountries();
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
        physicalAddressUnitTxt.focus();
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
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: {
                physicalAddressCountryCode: physicalAddressCountrySelect.getValue(),
                physicalAddressCity: physicalAddressCityTxt.getValue(),
                physicalAddressSuburb: physicalAddressSuburbTxt.getValue(),
                physicalAddressStreet: physicalAddressStreetTxt.getValue(),
                physicalAddressComplex: physicalAddressComplexTxt.getValue(),
                physicalAddressUnit: physicalAddressUnitTxt.getValue(),
                physicalAddressPostalCode: physicalAddressPostalCodeTxt.getValue(),
                postalAddressLine1: postalAddressLine1Txt.getValue(),
                postalAddressLine2: postalAddressLine2Txt.getValue(),
                postalAddressLine3: postalAddressLine3Txt.getValue(),
                postalAddressCode: postalAddressCodeTxt.getValue()
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