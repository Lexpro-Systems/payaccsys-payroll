/* globals app, lx */
'use strict';

// EDIT LEXPRO ACCOUNTING CONFIG DETAILS MODAL PANEL
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
app.panel.EditLexproAccountingConfigDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var bankDetailsSectionEl = null;
    var bankSelect = null;
    var accountsSectionEl = null;
    var salaryAccountsSectionEl = null;
    var salaryAccountsContainerEl = null;
    var employeeAccountsContainerEl = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtnTooltip = null;
    var saveBtn = null;
    
    var configItems = [];
    var accountsList = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadConfigData() {
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=listBankAccounts',
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: result.error
                    });
                    loader.hide();
                    return;
                }
                
                var banks = [];
                for( let i = 0; i < result.bankList.length; i++ ) {
                    banks.push({
                        value: result.bankList[i].id,
                        text: result.bankList[i].name
                    });
                }
                bankSelect.addItems( banks );
                banks = result.bankList;
                
                configItems.push({
                    srcComponent: bankSelect,
                    name: 'bank',
                    employeeId: null
                });
                
                lx.sendJSON({
                    url: 'exec.php?c=LexproAccounting&fn=getLexproAccountingConfig',
                    onSuccess: function( jsonResult ) {
                        loader.hide();
                        var result = JSON.parse(jsonResult);
                        if( result.ok !== true ) {
                            new lx.component.Messagebox({
                                message: result.error
                            });
                            loader.hide();
                            return;
                        }
                        
                        for (var i = 0; i < result.accountNumbers.length; i++) {
                            accountsList.push({
                                value: result.accountNumbers[i].accountNumber,
                                text: result.accountNumbers[i].accountNumber + ' - ' + result.accountNumbers[i].name
                            });
                        }
                        
                        for( let i = 0; i < result.configItems.length; i++ ) {
                            if (result.configItems[i].name === 'Bank') {
                                for (var x = 0; x < banks.length; x++) {
                                    if (banks[x].id == result.configItems[i].value) {
                                        bankSelect.setValue(result.configItems[i].value, banks[x].name);
                                    }
                                }
                                continue;
                            }
                            else if (result.configItems[i].name === 'Firm') {
                                continue;
                            }
                            
                            addConfigOption(result.configItems[i].name, result.configItems[i].value, result.configItems[i].employeeId);
                        }
                        loader.hide();
                    }
                });
            }
        });
    }
    
    // Function to add a config option
    function addConfigOption(name, value, employeeId) {
        if( name === 'includeEmployeeName' ) {
            let srcComponent = new lx.component.RadioGroup({
                renderTo: salaryAccountsContainerEl,
                labelWidth: '230px',
                labelAlign: 'left',
                label: 'Include employee name in description?',
                margin: '15px 0px 0px 0px',
                items: [
                    {text: 'Yes', value: true},
                    {text: 'No', value: false}
                ],
            });
            srcComponent.setValue(value);
            
            configItems.push({
                srcComponent: srcComponent,
                name: name,
                employeeId: null
            });
            return;
        }
        else if( name === 'useSingleSalaryAccount' ) {
            let srcComponent = new lx.component.RadioGroup({
                renderTo: salaryAccountsContainerEl,
                labelWidth: '230px',
                labelAlign: 'left',
                label: 'Use single account for salaries?',
                margin: '15px 0px 0px 0px',
                items: [
                    {text: 'Yes', value: true},
                    {text: 'No', value: false}
                ],
                
                onChange: function( event ) {
                    if( event.srcComponent.getValue() === true ) {
                        employeeAccountsContainerEl.style.display = 'none';
                    }
                    else {
                        employeeAccountsContainerEl.style.display = 'block';
                    }
                }
            });
            srcComponent.setValue(value);
            
            configItems.push({
                srcComponent: srcComponent,
                name: name,
                employeeId: null
            });
            
            if( value === true ) {
                employeeAccountsContainerEl.style.display = 'none';
            }
            else {
                employeeAccountsContainerEl.style.display = 'block';
            }
            
            return;
        }
        
        let renderEl = accountsSectionEl;
        if( name === 'Salary' ) {
            renderEl = salaryAccountsContainerEl;
        }
        else if( employeeId != null ) {
            renderEl = employeeAccountsContainerEl;
        }
        
        let srcComponent = new lx.component.Selectbox({
            renderTo: renderEl,
            labelWidth: '230px',
            labelAlign: 'left',
            label: name,
            margin: '15px 0px 0px 0px',
            search: true,
            onSearch: function() {
                
                
                let filter = srcComponent.getSearchString().toUpperCase();
                
                if (filter === '') {
                    srcComponent.clear();
                    srcComponent.addItems(accountsList);
                    return;
                }
                
                let newList = [];
                
                // Loop through all list items, and hide those who don't match the search query
                for (var i = 0; i < accountsList.length; i++) {
                    
                    let text = accountsList[i].text;
                    
                    if (text.toUpperCase().indexOf(filter) > -1) {
                        newList.push(accountsList[i]);
                    }
                    
                }
                srcComponent.clear();
                srcComponent.addItems(newList);
            }
        });
        srcComponent.addItems(accountsList);
        
        for (var i = 0; i < accountsList.length; i++) {
            if (accountsList[i].value === value) {
                srcComponent.setValue(accountsList[i].value, accountsList[i].text);
            }
        }
        
        configItems.push({
            srcComponent: srcComponent,
            name: name,
            employeeId: employeeId
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
            innerHTML: 'Lexpro Accounting Configuration'
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
        loader.show(false);
        
        
        //
        // BANK DETAILS SECTION
        //
        
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Bank Details',
            margin: '0px 15px',
            width: ''
        });
        
        bankDetailsSectionEl = lx.createElement('DIV', {
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
        
        bankSelect = new lx.component.Selectbox({
            renderTo: bankDetailsSectionEl,
            labelWidth: '230px',
            labelAlign: 'left',
            label: 'Bank *'
        });
        
        
        //
        // ACCOUNTS SECTION
        //
        
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'General Accounts',
            margin: '0px 15px',
            width: ''
        });
        
        accountsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 15px 15px',
                padding: '0px 15px 15px 15px'
            }
        });
        
        
        //
        // SALARY ACCOUNTS SECTION
        //
        
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Salary Accounts',
            margin: '0px 15px',
            width: ''
        });
        
        salaryAccountsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '0px 15px 15px 15px'
            }
        });
        
        salaryAccountsContainerEl = lx.createElement('DIV', {
            parent: salaryAccountsSectionEl,
            style: {
                display: 'block'
            }
        });
        
        employeeAccountsContainerEl = lx.createElement('DIV', {
            parent: salaryAccountsSectionEl,
            style: {
                display: 'block'
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
        
        loadConfigData();
        
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
        bankSelect.focus();
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
        // Save the configuration data
        var data = [];
        let hasBank = false;
        for (var i = 0; i < configItems.length; i++) {
            if (configItems[i].name === 'bank') {
                let bankComponent = configItems[i].srcComponent;
                data.push({
                    name: configItems[i].name,
                    value: bankComponent.getValue(),
                    employeeId: null
                });
                
                if( bankComponent.getValue() !== null ) {
                    hasBank = true;
                }
                continue;
            }
            
            let value = '';
            if (configItems[i].srcComponent.getValue() !== null) {
                value = configItems[i].srcComponent.getValue();
            }
            data.push({
                name: configItems[i].name,
                value: value,
                employeeId: configItems[i].employeeId
            });
        }
        
        if( !hasBank ) {
            saveBtn.showWarning('\'Bank\' is required. Please select a bank.');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=saveLexproAccountingConfig',
            data: {
                configData: data
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                saveBtn.hideLoader();
                saveBtn.enable();
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Saving Config Failed',
                        message: result.error
                    });
                    
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