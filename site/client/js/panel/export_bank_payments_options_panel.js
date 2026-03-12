/* globals app, lx */
'use strict';

// EXPORT BANK PAYMENTS OPTIONS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//
// Events:
//
//  onFinish            This event is fired after the profile data was successfully saved
//  onDestroy           This event is fired just before the component is destroyed
//
app.panel.ExportBankPaymentsOptions = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var companyBankSectionEl = null;
    var companyBankSelect = null;
    var addCompanyBankBtn = null;
    var bankSelect = null;
    var accountNumberTxt = null;
    var branchCodeTxt = null;
    var formatSelect = null;
    var paymentDate = null;
    var referenceTxt = null;
    
    var bankAccounts = [];
    
    
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
    
    // Function to load tax periods from the database
    function loadCompanyBankAccounts(defaultValue, defaultText) {
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getBankAccountList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Company Bank Accounts Failed',
                        message: response.error
                    });
                }
                
                // Save all the accounts
                bankAccounts = response.accounts;
                
                // Loop through all accounts
                var accounts = [];
                var defaultAccount = { value: defaultValue, text: defaultText };
                for( var i = 0; i < response.accounts.length; i++ ) {
                    accounts.push({
                        value: response.accounts[i].id,
                        text:response.accounts[i].financialInstitutionName + ' - ' + response.accounts[i].accountNumber
                    });
                }
                
                // Add the accounts to the select control
                companyBankSelect.clear();
                companyBankSelect.addItems( accounts );
                if( defaultAccount !== null ) {
                    companyBankSelect.setValue( defaultAccount.value, defaultAccount.text );
                }
                companyBankSelectOnChangeEventHandler();
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
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onExport') ) me.addEventListener('export', compConfig.onEmail);
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
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // EXPORT OPTIONS
        //
        
        lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 5px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Export Options</div>'
        });
        
        // Create the export options section
        let exportOptionsSectionEl = lx.createElement('DIV', {
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
        
        // Create the paymentDate component
        paymentDate = new lx.component.DatePicker({
            renderTo: exportOptionsSectionEl,
            label: 'Payment Date:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        paymentDate.setValue(new Date().toISOString().slice(0, 10));
        
        // Create the companyBankSectionEl component
        companyBankSectionEl = lx.createElement('DIV', {
            parent: exportOptionsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '20px 0px 0px 0px',
                alignItems: 'center',
                width: '100%'
            }
        });
        
        // Create the companyBankSelect component
        companyBankSelect = new lx.component.Selectbox({
            renderTo: companyBankSectionEl,
            label: 'Company Bank Account:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: companyBankSelectOnChangeEventHandler
        });
        
        // Create the addCompanyBankBtn component
        addCompanyBankBtn = new lx.component.Button({
            renderTo: companyBankSectionEl,
            label: 'Add',
            margin: '0px 0px 0px 15px',
            style: 'text',
            
            onClick: addCompanyBankBtnClickEventHandler
        });
        
        // Create the bankSelect component
        bankSelect = new lx.component.Selectbox({
            renderTo: exportOptionsSectionEl,
            label: 'Bank Name:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the accountNumberTxt component
        accountNumberTxt = new lx.component.Textbox({
            renderTo: exportOptionsSectionEl,
            label: 'Account Number:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the branchCodeTxt component
        branchCodeTxt = new lx.component.Textbox({
            renderTo: exportOptionsSectionEl,
            label: 'Branch Code:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the referenceTxt component
        referenceTxt = new lx.component.Textbox({
            renderTo: exportOptionsSectionEl,
            label: 'Employee Reference:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        referenceTxt.setValue('Salary Payment');
        
        // Create the formatSelect component
        formatSelect = new lx.component.Selectbox({
            renderTo: exportOptionsSectionEl,
            label: 'Export Format:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        formatSelect.addItems([
            { value: 'ACBF', text: 'Bankserv (ACB) Format' },
            { value: 'CSVF', text: 'CSV Format' },
            // { value: 'PAIN', text: 'PAIN Fromat' }
        ]);
        formatSelect.setValue('ACBF', 'Bankserv (ACB) Format');
        
        // Load form data
        loadFinancialInstitutions( bankSelect );
        loadCompanyBankAccounts(null, '');
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
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
        // ...
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
    
    // Function to validate data
    me.validateData = function() {
        let result = {
            status: true,
            error: ''
        };
        
        // Was no bank selected?
        if( bankSelect.getValue() === null ) {
            result = {
                status: false,
                error: 'No bank selected.'
            };
            return result;
        }
        
        // Was no account number specified?
        if( (accountNumberTxt.getValue() === null) || (accountNumberTxt.getValue().trim() === '') ) {
            result = {
                status: false,
                error: 'No account number specified.'
            };
            return result;
        }
        
        // Was no branch code specified?
        if( (branchCodeTxt.getValue() === null) || (branchCodeTxt.getValue().trim() === '') ) {
            result = {
                status: false,
                error: 'No branch code specified.'
            };
            return result;
        }
        
        // Was no payment date selected?
        if( (paymentDate.getValue() === null) || (paymentDate.getValue().trim() === '') ) {
            result = {
                status: false,
                error: 'No payment date specified.'
            };
            return result;
        }
        
        // Was no employee reference specified?
        if( (referenceTxt.getValue() === null) || (referenceTxt.getValue().trim() === '') ) {
            result = {
                status: false,
                error: 'No employee refrence specified.'
            };
            return result;
        }
        
        return result;
    };
    
    // Functions to return panel values
    me.getCompanyBankAccount = function() {
        return companyBankSelect.getValue();
    };
    
    me.getBank = function() {
        return bankSelect.getValue();
    };
    
    me.getAccountNumber = function() {
        return accountNumberTxt.getValue();
    };
    
    me.getBranchCode = function() {
        return branchCodeTxt.getValue();
    };
    
    me.getEmployeeReference = function() {
        return referenceTxt.getValue();
    };
    
    me.getExportFormat = function() {
        return formatSelect.getValue();
    };
    
    me.getPaymentDate = function() {
        return paymentDate.getValue();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // companyBankSelect change event handler
    function companyBankSelectOnChangeEventHandler() {
        // Find the selected account
        for( let i = 0; i < bankAccounts.length; i++ ) {
            if( bankAccounts[i].id == companyBankSelect.getValue() ) {
                // Is CSV format supported?
                if( 'FNBA' === bankAccounts[i].financialInstitutionCode ) {
                    formatSelect.enable();
                }
                else {
                    formatSelect.setValue('ACBF', 'Bankserv (ACB) Format');
                    formatSelect.disable();
                }
                
                // Set the bank  and account number
                bankSelect.setValue( bankAccounts[i].financialInstitutionCode, bankAccounts[i].financialInstitutionName);
                accountNumberTxt.setValue(bankAccounts[i].accountNumber);
                branchCodeTxt.setValue(bankAccounts[i].branchCode);
                break;
            }
        }
    }
    
    // addCompanyBankBtn click event handler
    function addCompanyBankBtnClickEventHandler() {
        // Create a modal window
        var addCompanyBankAccountModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '417px'
        });
        
        // Create the edit addCompanyBankAccount panel
        var addCompanyBankAccountPanel = new app.panel.AddCompanyBankAccount({
            renderTo: addCompanyBankAccountModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function( result ) {
                app.route.popState();
                loadCompanyBankAccounts(result.companyBankAccountId, result.financialInstitutionName + ' - ' + result.accountNumber);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addCompanyBankAccountModal.addEventListener('destroy', function() {
            addCompanyBankAccountPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addCompanyBankAccountModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addCompanyBankAccountModal.show();
        addCompanyBankAccountPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};