/* globals app, lx */
'use strict';

// ADD COMPANY BANK ACCOUNT PANEL
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
app.panel.EditCompanyBankAccount = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var bankAccountSection = null;
    var bankNameSelect = null;
    var bankTypeRadio = null;
    var accountNumberTxt = null;
    var branchCodeTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtnTooltip = null;
    var saveBtn = null;
    var companyBankAccountId = null;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load financial institutions into a selectbox.
    //
    // srcSelect            The select control to load the financial institutions into
    function loadFinancialInstitutions( srcSelect ) {
        // Build data to send
        var data = {
            searchString: srcSelect.getSearchString(),
            limit: 20,
            offset: srcSelect.getItemCount(),
            sortOrder: 'ASC'
        };
        
        // Send the request to get the financial institution data
        lx.sendJSON({
            url: 'exec.php?c=FinancialInstitution&fn=getList',
            data: data,
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                // Was the request not successful?
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Financial Institutions Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Add the institutions to an array
                var institutions = [];
                for( var i = 0; i < response.institutions.length; i++ ) {
                    institutions.push({
                        value: response.institutions[i].code,
                        text: response.institutions[i].name
                    });
                }
                
                // Add the items to the select
                srcSelect.addItems( institutions );
            }
        });
    }
    
    // Function to load company details
    function loadBankAccount(companyBankAccountId) {
        // console.log(companyBankAccountId);
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getBankAccount',
            data: {
                companyBankAccountId: companyBankAccountId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                loader.hide();
                // console.log(response);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Bank Account Failed',
                        message: response.error
                    });
                }
                
                bankNameSelect.setValue( response.accounts.financialInstitutionCode, response.accounts.financialInstitutionName );
                bankTypeRadio.setValue(response.accounts.bankAccountTypeCode);
                accountNumberTxt.setValue(response.accounts.accountNumber);
                branchCodeTxt.setValue(response.accounts.branchCode);
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
            innerHTML: 'Edit Bank Account'
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
        
        bankAccountSection = lx.createElement('DIV', {
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
        
        bankNameSelect = new lx.component.Selectbox({
            renderTo: bankAccountSection,
            label: 'Bank Name'
        });
        
        // Create the bankTypeRadio component
        bankTypeRadio = new lx.component.RadioGroup({
            renderTo: bankAccountSection,
            label: 'Account Type',
            labelAlign: 'left',
            margin: '15px 0px 0px 0px',
            labelWidth: '100px',
            maxWidth: '500px',
            
            items: app.commonSelectOptions.bankAccountTypes
        });
        bankTypeRadio.setValue('CACC');
        
        accountNumberTxt = new lx.component.Textbox({
            renderTo: bankAccountSection,
            label: 'Account Number',
            margin: '15px 0px 0px 0px'
        });
        
        branchCodeTxt = new lx.component.Textbox({
            renderTo: bankAccountSection,
            label: 'Branch Code',
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
        
        // Load form data
        loadFinancialInstitutions( bankNameSelect );
        companyBankAccountId = compConfig.companyBankAccountId;
        loadBankAccount( companyBankAccountId );
        
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
        bankNameSelect.focus();
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
        bankNameSelect.validate();
        accountNumberTxt.validate();
        branchCodeTxt.validate();
        
        if(bankNameSelect.getValue() === null) {
            saveBtn.showWarning('Your bank name can not be empty');
            return;
        }
        
        if(accountNumberTxt.getValue() === '') {
            saveBtn.showWarning('Your bank account number can not be empty');
            return;
        }
        
        if(branchCodeTxt.getValue() === '') {
            saveBtn.showWarning('Your branch code can not be empty');
            return;
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=updateBank',
            data: {
                companyBankAccountId: companyBankAccountId,
                financialInstitutionCode: bankNameSelect.getValue(),
                bankTypeCode: bankTypeRadio.getValue(),
                accountNumber: accountNumberTxt.getValue(),
                branchCode: branchCodeTxt.getValue()
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