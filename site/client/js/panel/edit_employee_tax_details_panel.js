/* globals app, lx */
'use strict';

// EDIT EMPLOYEE TAX DETAILS PANEL
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
app.panel.EditEmployeeTaxDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var taxDetailsHeading = null;
    var taxDetailsSectionEl = null;
    var incomeTaxNumberTxt = null;
    var enablePayeCorrectionCb = null;
    var sicCodeSelect = null;
    
    var incomeTaxDirective1Heading = null;
    var incomeTaxDirective1SectionEl = null;
    var incomeTaxDirective1Txt = null;
    var incomeTaxDirective1IssuedOnDate = null;
    var incomeTaxDirective1SourceTxt = null;
    var incomeTaxDirective1AmountTxt = null;
    
    var incomeTaxDirective2Heading = null;
    var incomeTaxDirective2SectionEl = null;
    var incomeTaxDirective2Txt = null;
    var incomeTaxDirective2IssuedOnDate = null;
    var incomeTaxDirective2SourceTxt = null;
    var incomeTaxDirective2AmountTxt = null;
    
    var incomeTaxDirective3Heading = null;
    var incomeTaxDirective3SectionEl = null;
    var incomeTaxDirective3Txt = null;
    var incomeTaxDirective3IssuedOnDate = null;
    var incomeTaxDirective3SourceTxt = null;
    var incomeTaxDirective3AmountTxt = null;
    
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
    
    function loadSicCodes() {
        lx.sendJSON({
            url: 'exec.php?c=Types&fn=getSicCodeList',
            data: {
                searchString: sicCodeSelect.getSearchString(),
                limit: 20,
                offset: sicCodeSelect.getItemCount(),
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
                
                sicCodeSelect.addItems( sicCodes );
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
                
                // Set tax details
                incomeTaxNumberTxt.setValue( response.employee.incomeTaxNumber );
                enablePayeCorrectionCb.setValue( response.employee.enablePayeCorrection );
                incomeTaxDirective1Txt.setValue( response.employee.incomeTaxDirective1 );
                incomeTaxDirective1IssuedOnDate.setValue( response.employee.incomeTaxDirective1IssuedOn );
                incomeTaxDirective1SourceTxt.setValue( response.employee.incomeTaxDirective1SourceCode );
                incomeTaxDirective1AmountTxt.setValue( response.employee.incomeTaxDirective1Amount );
                incomeTaxDirective2Txt.setValue( response.employee.incomeTaxDirective2 );
                incomeTaxDirective2IssuedOnDate.setValue( response.employee.incomeTaxDirective2IssuedOn );
                incomeTaxDirective2SourceTxt.setValue( response.employee.incomeTaxDirective2SourceCode );
                incomeTaxDirective2AmountTxt.setValue( response.employee.incomeTaxDirective2Amount );
                incomeTaxDirective3Txt.setValue( response.employee.incomeTaxDirective3 );
                incomeTaxDirective3IssuedOnDate.setValue( response.employee.incomeTaxDirective3IssuedOn );
                incomeTaxDirective3SourceTxt.setValue( response.employee.incomeTaxDirective3SourceCode );
                incomeTaxDirective3AmountTxt.setValue( response.employee.incomeTaxDirective3Amount );
                sicCodeSelect.setValue( response.employee.sicCode, response.employee.sicName );
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
        
        // Create the physicalAddressHeading element
        taxDetailsHeading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Tax Details',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the taxDetailsSectionEl element
        taxDetailsSectionEl = lx.createElement('DIV', {
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
        
        incomeTaxNumberTxt = new lx.component.Textbox({
            renderTo: taxDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Income Tax Number'
        });
        
        sicCodeSelect = new lx.component.Selectbox({
            renderTo: taxDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'SIC Code',
            search: true,
            
            onSearch: function() {
                sicCodeSelect.clear();
                loadSicCodes();
            },
            
            onListScrollEnd: function() {
                loadSicCodes();
            }
        });
        
        enablePayeCorrectionCb = new lx.component.Checkbox({
            renderTo: taxDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Enable Year-End PAYE Correction',
            labelAlign: 'right'
        });
        
        
        //
        // INCOME TAX DIRECTIVE 1 SECTION
        //
        
        // Create the incomeTaxDirective1Heading element
        incomeTaxDirective1Heading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Income Tax Directive 1',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the incomeTaxDirective1SectionEl element
        incomeTaxDirective1SectionEl = lx.createElement('DIV', {
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
        
        incomeTaxDirective1Txt = new lx.component.Textbox({
            renderTo: incomeTaxDirective1SectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Number'
        });
        
        incomeTaxDirective1IssuedOnDate = new lx.component.DatePicker({
            renderTo: incomeTaxDirective1SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Issued On'
        });
        
        incomeTaxDirective1SourceTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective1SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Source Code'
        });
        
        incomeTaxDirective1AmountTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective1SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Amount'
        });
        
        
        //
        // INCOME TAX DIRECTIVE 2 SECTION
        //
        
        // Create the incomeTaxDirective2Heading element
        incomeTaxDirective2Heading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Income Tax Directive 2',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the incomeTaxDirective2SectionEl element
        incomeTaxDirective2SectionEl = lx.createElement('DIV', {
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
        
        incomeTaxDirective2Txt = new lx.component.Textbox({
            renderTo: incomeTaxDirective2SectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Number'
        });
        
        incomeTaxDirective2IssuedOnDate = new lx.component.DatePicker({
            renderTo: incomeTaxDirective2SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Issued On'
        });
        
        incomeTaxDirective2SourceTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective2SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Source Code'
        });
        
        incomeTaxDirective2AmountTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective2SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Amount'
        });
        
        
        //
        // INCOME TAX DIRECTIVE 3 SECTION
        //
        
        // Create the incomeTaxDirective3Heading element
        incomeTaxDirective3Heading = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Income Tax Directive 3',
            margin: '0px 15px',
            width: ''
        });
        
        // Create the incomeTaxDirective3SectionEl element
        incomeTaxDirective3SectionEl = lx.createElement('DIV', {
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
        
        incomeTaxDirective3Txt = new lx.component.Textbox({
            renderTo: incomeTaxDirective3SectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Number'
        });
        
        incomeTaxDirective3IssuedOnDate = new lx.component.DatePicker({
            renderTo: incomeTaxDirective3SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Issued On'
        });
        
        incomeTaxDirective3SourceTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective3SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Source Code'
        });
        
        incomeTaxDirective3AmountTxt = new lx.component.Textbox({
            renderTo: incomeTaxDirective3SectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Amount'
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
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Load panel data
        loadSicCodes();
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
        incomeTaxNumberTxt.focus();
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
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // // Check all required values
        // if( incomeTaxNumberTxt.getValue().trim() === '' ) {
        //     saveBtn.showWarning('The income tax number can not be empty.');
        //     return;
        // }
        
        if( sicCodeSelect.getValue() === null ) {
            saveBtn.showWarning('The SIC code can not be empty.');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=update',
            data: {
                employeeId: employeeId,
                incomeTaxNumber: incomeTaxNumberTxt.getValue().trim(),
                enablePayeCorrection: enablePayeCorrectionCb.getValue(),
                incomeTaxDirective1: incomeTaxDirective1Txt.getValue().trim(),
                incomeTaxDirective1IssuedOn: (incomeTaxDirective1IssuedOnDate.getValue() === '' ? null : incomeTaxDirective1IssuedOnDate.getValue()),
                incomeTaxDirective1SourceCode: incomeTaxDirective1SourceTxt.getValue().trim(),
                incomeTaxDirective1Amount: (incomeTaxDirective1AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective1AmountTxt.getValue().trim()),
                incomeTaxDirective2: incomeTaxDirective2Txt.getValue().trim(),
                incomeTaxDirective2IssuedOn: (incomeTaxDirective2IssuedOnDate.getValue() === '' ? null : incomeTaxDirective2IssuedOnDate.getValue()),
                incomeTaxDirective2SourceCode: incomeTaxDirective2SourceTxt.getValue().trim(),
                incomeTaxDirective2Amount: (incomeTaxDirective2AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective2AmountTxt.getValue().trim()),
                incomeTaxDirective3: incomeTaxDirective3Txt.getValue().trim(),
                incomeTaxDirective3IssuedOn: (incomeTaxDirective3IssuedOnDate.getValue() === '' ? null : incomeTaxDirective3IssuedOnDate.getValue()),
                incomeTaxDirective3SourceCode: incomeTaxDirective3SourceTxt.getValue().trim(),
                incomeTaxDirective3Amount: (incomeTaxDirective3AmountTxt.getValue().trim() === '' ? null : incomeTaxDirective3AmountTxt.getValue().trim()),
                sicCode: sicCodeSelect.getValue()
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