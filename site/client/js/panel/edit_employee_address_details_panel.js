/* globals app, lx */
'use strict';

// EDIT EMPLOYEE ADDRESS DETAILS PANEL
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
app.panel.EditEmployeeAddressDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var physicalAddressHeading = null;
    var physicalAddressSectionEl = null;
    var physicalAddressUnitTxt = null;
    var physicalAddressComplexTxt = null;
    var physicalAddressStreetTxt = null;
    var physicalAddressSuburbTxt = null;
    var physicalAddressCityTxt = null;
    var physicalAddressPostalCodeTxt = null;
    var physicalAddressCountrySelect = null;
    
    var postalAddressHeading = null;
    var postalAddressCb = null;
    var postalAddressSectionEl = null;
    var postalAddressContainerEl = null;
    var postalAddressLine1Txt = null;
    var postalAddressLine2Txt = null;
    var postalAddressLine3Txt = null;
    var postalAddressCodeTxt = null;
    var postalAddressCountrySelect = null;
    
    var workAddressHeading = null;
    var workAddressSectionEl = null;
    var useCompanyWorkAddressCb = null;
    var workAddressContainerEl = null;
    var workAddressUnitTxt = null;
    var workAddressComplexTxt = null;
    var workAddressStreetTxt = null;
    var workAddressSuburbTxt = null;
    var workAddressCityTxt = null;
    var workAddressPostalCodeTxt = null;
    var workAddressCountrySelect = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    
    var employeeId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadCountries( srcSelect ) {
        lx.sendJSON({
            url: 'exec.php?c=Address&fn=getCountryList',
            data: {
                searchString: srcSelect.getSearchString(),
                limit: 20,
                offset: srcSelect.getItemCount(),
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
                
                srcSelect.addItems( countries );
            }
        });
    }
    
    function loadEmployee() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
                
                // Set address details
                physicalAddressUnitTxt.setValue( response.employee.physicalAddressUnit );
                physicalAddressComplexTxt.setValue( response.employee.physicalAddressComplex );
                physicalAddressStreetTxt.setValue( response.employee.physicalAddressStreet );
                physicalAddressSuburbTxt.setValue( response.employee.physicalAddressSuburb );
                physicalAddressCityTxt.setValue( response.employee.physicalAddressCity );
                physicalAddressPostalCodeTxt.setValue( response.employee.physicalAddressPostalCode );
                physicalAddressCountrySelect.setValue( response.employee.physicalAddressCountryCode, response.employee.physicalAddressCountryName );
                
                postalAddressCb.setValue( response.employee.postalSameAsPhysicalAddress );
                postalAddressLine1Txt.setValue( response.employee.postalAddressLine1 );
                postalAddressLine2Txt.setValue( response.employee.postalAddressLine2 );
                postalAddressLine3Txt.setValue( response.employee.postalAddressLine3 );
                postalAddressCodeTxt.setValue( response.employee.postalAddressCode );
                postalAddressCountrySelect.setValue( response.employee.postalAddressCountryCode, response.employee.postalAddressCountryName );
                postalAddressCbChangeEventHandler();
                
                useCompanyWorkAddressCb.setValue(response.employee.workSameAsCompanyAddress);
                workAddressUnitTxt.setValue( response.employee.workAddressUnit );
                workAddressComplexTxt.setValue( response.employee.workAddressComplex );
                workAddressStreetTxt.setValue( response.employee.workAddressStreet );
                workAddressSuburbTxt.setValue( response.employee.workAddressSuburb );
                workAddressCityTxt.setValue( response.employee.workAddressCity );
                workAddressPostalCodeTxt.setValue( response.employee.workAddressPostalCode );
                workAddressCountrySelect.setValue( response.employee.workAddressCountryCode, response.employee.workAddressCountryName );
                useCompanyWorkAddressCbChangeEventHandler();
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
            show: false,
            
            employeeId: null
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
        employeeId = compConfig.employeeId;
        
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
        // PHYSICAL ADDRESS SECTION
        //
        
        // Create the physicalAddressHeading element
        physicalAddressHeading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Physical Address',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the physicalAddressSectionEl element
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
            margin: '0px 0px 0px 0px',
            label: 'Physical Address Unit'
        });
        
        physicalAddressComplexTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Complex'
        });
        
        physicalAddressStreetTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Street'
        });
        
        physicalAddressSuburbTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Suburb'
        });
        
        physicalAddressCityTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address City'
        });
        
        physicalAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Postal Code'
        });
        
        physicalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: physicalAddressSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Physical Address Country',
            search: true,
            
            onSearch: function() {
                physicalAddressCountrySelect.clear();
                loadCountries( physicalAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( physicalAddressCountrySelect );
            }
        });
        loadCountries( physicalAddressCountrySelect );
        // physicalAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        
        //
        // POSTAL ADDRESS SECTION
        //
        
        // Create the postalAddressHeading element
        postalAddressHeading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Postal Address',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the postalAddressSectionEl element
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
        
        postalAddressCb = new lx.component.Checkbox({
            renderTo: postalAddressSectionEl,
            label: 'Use physical address',
            margin: '0px 0px 0px 0px',
            labelAlign: 'right',
            isChecked: false,
            
            onChange: postalAddressCbChangeEventHandler
        });
        
        postalAddressContainerEl = lx.createElement('DIV', {
            parent: postalAddressSectionEl,
            style: {
                display: 'none'
            }
        });
        
        postalAddressLine1Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 1',
            margin: '15px 0px 0px 0px'
        });
        
        postalAddressLine2Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 2',
            margin: '15px 0px 0px 0px',
        });
        
        postalAddressLine3Txt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Line 3',
            margin: '15px 0px 0px 0px',
        });
        
        postalAddressCodeTxt = new lx.component.Textbox({
            renderTo: postalAddressContainerEl,
            label: 'Code',
            margin: '15px 0px 0px 0px',
        });
        
        postalAddressCountrySelect = new lx.component.Selectbox({
            renderTo: postalAddressContainerEl,
            label: 'Country',
            margin: '15px 0px 0px 0px',
            search: true,
            
            onSearch: function() {
                postalAddressCountrySelect.clear();
                loadCountries( postalAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( postalAddressCountrySelect );
            }
        });
        loadCountries( postalAddressCountrySelect );
        // postalAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        
        //
        // WORK ADDRESS SECTION
        //
        
        // Create the workAddressHeading element
        workAddressHeading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Work Address',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the workAddressSectionEl element
        workAddressSectionEl = lx.createElement('DIV', {
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
        
        useCompanyWorkAddressCb = new lx.component.Checkbox({
            renderTo: workAddressSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Use the company address',
            labelAlign: 'right',
            isChecked: false,
            
            onChange: useCompanyWorkAddressCbChangeEventHandler
        });
        
        workAddressContainerEl = lx.createElement('DIV', {
            parent: workAddressSectionEl,
            style: {
                display: 'block'
            }
        });
        
        workAddressUnitTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Unit'
        });
        
        workAddressComplexTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Complex'
        });
        
        workAddressStreetTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Street'
        });
        
        workAddressSuburbTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Suburb'
        });
        
        workAddressCityTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address City'
        });
        
        workAddressPostalCodeTxt = new lx.component.Textbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Postal Code'
        });
        
        workAddressCountrySelect = new lx.component.Selectbox({
            renderTo: workAddressContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Work Address Country',
            search: true,
            
            onSearch: function() {
                workAddressCountrySelect.clear();
                loadCountries( workAddressCountrySelect );
            },
            
            onListScrollEnd: function() {
                loadCountries( workAddressCountrySelect );
            }
        });
        loadCountries( workAddressCountrySelect );
        // workAddressCountrySelect.setValue('ZAF', 'South Africa');
        
        
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
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Load panel data
        loadEmployee();
        
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
    
    function postalAddressCbChangeEventHandler() {
        if( postalAddressCb.getValue() == true ) {
            lx.applyStyle( postalAddressContainerEl, {display: 'none'} );
        }
        else {
            lx.applyStyle( postalAddressContainerEl, {display: 'block'} );
        }
    }
    
    // useCompanyWorkAddressCb on change event handler
    function useCompanyWorkAddressCbChangeEventHandler() {
        if( useCompanyWorkAddressCb.getValue() == true ) {
            lx.applyStyle( workAddressContainerEl, {display: 'none'} );
        }
        else {
            lx.applyStyle( workAddressContainerEl, {display: 'block'} );
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=update',
            data: {
                employeeId: employeeId,
                physicalAddressUnit: physicalAddressUnitTxt.getValue().trim(),
                physicalAddressComplex: physicalAddressComplexTxt.getValue().trim(),
                physicalAddressStreet: physicalAddressStreetTxt.getValue().trim(),
                physicalAddressSuburb: physicalAddressSuburbTxt.getValue().trim(),
                physicalAddressCity: physicalAddressCityTxt.getValue().trim(),
                physicalAddressPostalCode: physicalAddressPostalCodeTxt.getValue().trim(),
                physicalAddressCountryCode: physicalAddressCountrySelect.getValue(),
                postalSameAsPhysical: postalAddressCb.getValue(),
                postalAddressLine1: postalAddressLine1Txt.getValue().trim(),
                postalAddressLine2: postalAddressLine2Txt.getValue().trim(),
                postalAddressLine3: postalAddressLine3Txt.getValue().trim(),
                postalAddressCode: postalAddressCodeTxt.getValue().trim(),
                postalAddressCountryCode: postalAddressCountrySelect.getValue(),
                useCompanyWorkAddress: useCompanyWorkAddressCb.getValue(),
                workAddressUnit: workAddressUnitTxt.getValue().trim(),
                workAddressComplex: workAddressComplexTxt.getValue().trim(),
                workAddressStreet: workAddressStreetTxt.getValue().trim(),
                workAddressSuburb: workAddressSuburbTxt.getValue().trim(),
                workAddressCity: workAddressCityTxt.getValue().trim(),
                workAddressPostalCode: workAddressPostalCodeTxt.getValue().trim(),
                workAddressCountryCode: workAddressCountrySelect.getValue()
            },
            onSuccess: function( responseText ) {
                
                saveBtn.hideLoader();
                saveBtn.enable();
                
                var response = JSON.parse(responseText);
                
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