/* globals app, lx */
'use strict';

// EDIT COMPANY TAX DETAILS MODAL PANEL
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
app.panel.EditCompanyTaxDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var taxDetailsSectionEl = null;
    var payeReferenceNumberTxt = null;
    var sdlPaymentReferenceNumberTxt = null;
    var uifPaymentReferenceNumberTxt = null;
    var uifRegistrationNumberTxt = null;
    var standardIndustryClassificationSelectbox = null;
    var employmentTaxIncentiveSelect = null;
    var specialEconomicZoneSelect = null;
    var diplomaticIndemnityCheckbox = null;
    
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
    
    function loadSicCodes() {
        lx.sendJSON({
            url: 'exec.php?c=Types&fn=getSicCodeList',
            data: {
                searchString: standardIndustryClassificationSelectbox.getSearchString(),
                limit: 20,
                offset: standardIndustryClassificationSelectbox.getItemCount(),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading SIC Codes Failed',
                        message: response.error
                    });
                }
                
                var sicCodes = [];
                for( var i = 0; i < response.sicCodes.length; i++ ) {
                    sicCodes.push({
                        value: response.sicCodes[i].code,
                        text: response.sicCodes[i].code + ': ' + response.sicCodes[i].name
                    });
                }
                
                standardIndustryClassificationSelectbox.addItems( sicCodes );
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
                
                payeReferenceNumberTxt.setValue(response.company.details.payeReferenceNumber);
                sdlPaymentReferenceNumberTxt.setValue(response.company.details.sdlPaymentReferenceNumber);
                uifPaymentReferenceNumberTxt.setValue(response.company.details.uifPaymentReferenceNumber);
                uifRegistrationNumberTxt.setValue(response.company.details.uifRegistrationNumber);
                standardIndustryClassificationSelectbox.setValue(response.company.details.sicCode, response.company.details.sicCode +': ' + response.company.details.sicName);
                if (response.company.details.sicCode === null) {
                    standardIndustryClassificationSelectbox.setValue(null, '');
                }
                
                employmentTaxIncentiveSelect.setValue(response.company.details.etiStatusCode, response.company.details.etiStatusName);
                
                if (response.company.details.specialEconomicZoneCode === null || response.company.details.specialEconomicZoneCode === '') {
                    specialEconomicZoneSelect.setValue(null, 'None');
                }
                else {
                    specialEconomicZoneSelect.setValue(response.company.details.specialEconomicZoneCode, response.company.details.specialEconomicZoneName);
                }
                
                diplomaticIndemnityCheckbox.setValue(response.company.details.diplomaticIndemnity);
                
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
            innerHTML: 'Edit Tax Details'
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
        // TAX DETAILS SECTION
        //
        
        taxDetailsSectionEl = lx.createElement('DIV', {
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
        
        payeReferenceNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            label: 'PAYE Reference Number'
        });
        
        sdlPaymentReferenceNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            label: 'SDL Payment Reference Number',
            margin: '15px 0px 0px 0px'
        });
        
        uifPaymentReferenceNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            label: 'UIF Payment Reference Number',
            margin: '15px 0px 0px 0px'
        });
        
        uifRegistrationNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            label: 'UIF Registration Number',
            margin: '15px 0px 0px 0px'
        });
        
        standardIndustryClassificationSelectbox = new lx.component.Selectbox({
            renderTo: taxDetailsSectionEl,
            label: 'Standard Industry Classification',
            margin: '15px 0px 0px 0px',
            search: true,
            
            onSearch: function() {
                standardIndustryClassificationSelectbox.clear();
                loadSicCodes();
            },
            
            onListScrollEnd: function() {
                loadSicCodes();
            }
        });
        
        employmentTaxIncentiveSelect = new lx.component.Selectbox({
            renderTo: taxDetailsSectionEl,
            label: 'Employment Tax Incentive',
            margin: '15px 0px 0px 0px',
            
            items: app.commonSelectOptions.etiStatusTypes
        });
        
        specialEconomicZoneSelect = new lx.component.Selectbox({
            renderTo: taxDetailsSectionEl,
            label: 'Special Economic Zone',
            margin: '15px 0px 0px 0px',
            
            // items: app.commonSelectOptions.specialEconomicZones
        });
        
        var items = [];
        items.push({ text: 'None', value: null });
        for (var i = 0; i < app.commonSelectOptions.specialEconomicZones.length; i++) {
            items.push(app.commonSelectOptions.specialEconomicZones[i]);
        }
        specialEconomicZoneSelect.addItems( items );
        specialEconomicZoneSelect.setValue(null, 'None');
        
        diplomaticIndemnityCheckbox = new lx.component.Checkbox({
            renderTo: taxDetailsSectionEl,
            label: 'Diplomatic Indemnity',
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
        
        loadSicCodes();
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
        payeReferenceNumberTxt.focus();
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
        payeReferenceNumberTxt.validate();
        sdlPaymentReferenceNumberTxt.validate();
        uifPaymentReferenceNumberTxt.validate();
        uifRegistrationNumberTxt.validate();
        standardIndustryClassificationSelectbox.validate();
        employmentTaxIncentiveSelect.validate();
        
        if(payeReferenceNumberTxt.getValue() === '') {
            saveBtn.showWarning('Your PAYE reference number can not be empty');
            return;
        }
        
        // if(sdlPaymentReferenceNumberTxt.getValue() === '') {
        //     saveBtn.showWarning('Your SDL payment reference number can not be empty');
        //     return;
        // }
        
        if(uifPaymentReferenceNumberTxt.getValue() === '') {
            saveBtn.showWarning('Your UIF payment reference number can not be empty');
            return;
        }
        
        if(uifRegistrationNumberTxt.getValue() === '') {
            saveBtn.showWarning('Your UIF registration number can not be empty');
            return;
        }
        
        if(standardIndustryClassificationSelectbox.getValue() === '' || standardIndustryClassificationSelectbox.getValue() === null) {
            saveBtn.showWarning('Your standard industry classification can not be empty');
            return;
        }
        
        if(employmentTaxIncentiveSelect.getValue() === '' || employmentTaxIncentiveSelect.getValue() === null) {
            saveBtn.showWarning('Your employment tax incentive can not be empty');
            return;
        }
        
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=update',
            data: {
                payeReferenceNumber: payeReferenceNumberTxt.getValue(),
                sdlPaymentReferenceNumber: sdlPaymentReferenceNumberTxt.getValue(),
                uifPaymentReferenceNumber: uifPaymentReferenceNumberTxt.getValue(),
                uifRegistrationNumber: uifRegistrationNumberTxt.getValue(),
                sicCode: standardIndustryClassificationSelectbox.getValue(),
                etiStatusCode: employmentTaxIncentiveSelect.getValue(),
                specialEconomicZoneCode: specialEconomicZoneSelect.getValue(),
                diplomaticIndemnity: diplomaticIndemnityCheckbox.getValue()
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