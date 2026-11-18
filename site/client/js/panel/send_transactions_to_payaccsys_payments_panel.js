/* globals app, lx */
'use strict';

// SEND PAYMENTS TO PAYACCSYS PAYMENTS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//  payrunId:           The ID of the payrun of which payments will be sent to the Payaccsys Payments API
//
// Events:
//
//  onSend:              Fired after the payments from the current payrun has been successfully internally validated and are ready to be sent to the Payments API
//  onCancel:            Fired when the user cancels and closes the panel
//  onDestroy:           Fired just before the panel is destroyed
//
app.panel.SendTransactions = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var gridContainerEl = null;
    var loader = null;

    var batchSettingsEl = null;
    var batchSettingsHeadingEl = null;
    var batchDescriptionTxt = null;
    var paymentDate = null;
    var paymentReferenceTxt = null;
    var paymentOptionSelect = null;
    
    var paymentsGrid = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var sendBtn = null;
    
    var payrunId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the payrun data
    function loadPayrun( payrunId ) {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getPaymentsBatchPreview',
            data: {
                payrunId: payrunId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Transactions Failed',
                        message: response.error
                    });
                    return;
                }
                
                batchSettingsHeadingEl.textContent = 'Batch Settings';
                batchDescriptionTxt.setValue('Payrun: ' + String(response.batch.description || ''));
                paymentDate.setValue(response.batch.actionDate);
                paymentReferenceTxt.setValue(response.batch.paymentReference);
                paymentOptionSelect.setValue('SAMEDAY', 'Same Day');
                
                // Prepare the payments for display in the grid
                let transactions = response.batch.transactions;

                for( let i = 0; i < transactions.length; i++ ) {
                    let transaction = transactions[i];
                    let statusMessage = transaction.localCheck.message;
 
                    transaction.localCheckDisplay = '<span ' + 'title="' + escapeHtml(statusMessage) + '" ' + 'style="' + 'display: block;' + 'overflow: hidden;' + 'text-overflow: ellipsis;' + 'white-space: nowrap;' + '">' + escapeHtml(statusMessage) + '</span>';
                }
                paymentsGrid.addRows(transactions);
                if(response.batch.ready === true){
                    sendBtn.enable();
                } else {
                    sendBtn.disable();
                }
            }
        });
    } 
    // Function to escape HTML special characters in a string for safe display in the payments grid
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
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
            payrunId: null,
            deliveryResults: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onSend') ) me.addEventListener('send', compConfig.onSend);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        
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
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Send Payments to Payaccsys Payments Integrated'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                overflowX: 'auto',
                overflowY: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                flex: '1 1 100%',
                minWidth: '0px',
                backgroundColor: '#F4F5F6'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });

        // Create the gridContainerEl element
        gridContainerEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: '1800px',
                flex: '1 1 auto',
                minHeight: '0px'
            }
        });

        //
        // BATCH SETTINGS SECTION
        //

        // Create the batch settings heading element
        batchSettingsHeadingEl = lx.createElement('DIV', {
            parent: gridContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: '0 0 auto',
                fontSize: '16px',
                color: '#0F0F0F',
                margin: '15px'
            },
            innerHTML: '<div>Batch Settings</div>'
        });

        // Create the batchSettingsEl element
        batchSettingsEl = lx.createElement('DIV', {
            parent: gridContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '15px',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '100%',
                backgroundColor: '#FFFFFF',
                borderStyle: 'none',
                margin: '0px',
                padding: '15px',
                flex: '0 0 auto'
            }
        });

        // Create batch settings components
        batchDescriptionTxt = new lx.component.Textbox({
            renderTo: batchSettingsEl,
            label: 'Batch Description *',
            width: '300px'
        });

        paymentReferenceTxt = new lx.component.Textbox({
            renderTo: batchSettingsEl,
            label: 'Payment Ref *',
            width: '160px'
        });

        paymentOptionSelect = new lx.component.Selectbox({
            renderTo: batchSettingsEl,
            label: 'Payment Option *',
            width: '160px',
            items: [
                {value: 'RTC', text: 'RTC'},
                {value: 'SAMEDAY', text: 'Same Day'},
                {value: 'STANDARD', text: 'Standard'}
            ]
        });

        paymentDate = new lx.component.DatePicker({
            renderTo: batchSettingsEl,
            label: 'Payment Date *',
            width: '160px'
        });

        //
        // PAYMENTS SECTION
        //

        // Create the payment rows heading element
        var paymentRowsHeadingEl = lx.createElement('DIV', {
            parent: gridContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                flex: '0 0 auto',
                fontSize: '16px',
                color: '#0F0F0F',
                margin: '15px'
            },
            innerHTML: '<div>Payment Rows</div>'
        });

        var paymentsGridContainerEl = lx.createElement('DIV', {
            parent: gridContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                flex: '1 1 auto',
                minHeight: '0px'
            }
        });
        
        // Create paymentsGrid component
        paymentsGrid = new lx.component.Grid({
            renderTo: paymentsGridContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'uniqueReference', name: 'Emp Ref', width: '100px'},
                {dataIndex: 'supplierType', name: 'Supplier Type', width: '120px'},
                {dataIndex: 'employeeAlias', name: 'Name', width: '140px'},
                {dataIndex: 'employeeSurname', name: 'Surname', width: '140px'},
                {dataIndex: 'emailAddress', name: 'Email Address', width: '180px'},
                {dataIndex: 'bankName', name: 'Bank Name', width: '140px'},
                {dataIndex: 'accountNumber', name: 'Account Number', width: '140px'},
                {dataIndex: 'branchCode', name: 'Branch Code', width: '100px'},
                {dataIndex: 'accountTypeName', name: 'Account Type', width: '130px'},
                {dataIndex: 'payslipId', name: 'Payslip ID', width: '120px'},
                {dataIndex: 'amount', name: 'Nett Pay Amount', width: '120px'},
                {dataIndex: 'localCheckDisplay', name: 'Status', type: 'html'}
            ]
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
            width: '120px',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });        
        
        // Create the sendBtn component
        sendBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Send',
            width: '120px',
            
            onClick: sendBtnClickEventHandler
        });
        sendBtn.disable();
        
        // Load form data
        loadPayrun( compConfig.payrunId );
        
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
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }

    function sendBtnClickEventHandler() {

         // Send payment fields to Payaccsys Payments Integrated API-function
        sendBtn.disable();
        sendBtn.showLoader();
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=paymentsIntegratedApiCaller',
            data: {
                payrunId: payrunId,
                batchDescription: batchDescriptionTxt.getValue(),
                paymentDate: paymentDate.getValue(),
                paymentReference: paymentReferenceTxt.getValue(),
                paymentOption: paymentOptionSelect.getValue()
            },
            onSuccess: function( responseText ) {
                sendBtn.enable();
                sendBtn.hideLoader();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Sending payments to Payaccsys Payments Integrated failed',
                        message: response.error
                    });
                    return;
                }
                
                me.fireEvent('send', {srcPanel: me, results: response.payments || [], summary: response.summary || null});
            }
        });

    }    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};
