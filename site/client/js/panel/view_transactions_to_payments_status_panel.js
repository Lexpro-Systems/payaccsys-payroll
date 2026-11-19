/* globals app, lx */
'use strict';

// PAYACCSYS PAYMENTS INTEGRATED RESULT PANEL
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
//  onCancel:            Fired when the user cancels and closes the panel
//  onDestroy:           Fired just before the panel is destroyed
//
app.panel.PaymentsIntegratedStatus = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var gridContainerEl = null;
    var loader = null;

    var responseResult = null;

    var batchSettingsEl = null;
    var batchSettingsHeadingEl = null;
    var batchReference = null;
    var batchStatus = null;
    var availableBalance = null;
    var totalPayments = null;
    var totalFees = null;
    var totalDeductions = null;
    
    var paymentsGrid = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    
    var payrunId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //

    // Function to create a response field with a label and value
    function createResponseField(parent, label, value, width) {
        var fieldEl = lx.createElement('DIV', {
            parent: parent,
            style: {
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                width: width,
                minWidth: '160px'
            }
        });

        var labelEl = lx.createElement('DIV', {
            parent: fieldEl,
            style: {
                margin: '0px 0px 5px 0px',
                fontSize: '12px',
                color: '#666666'
            }
        });

        labelEl.textContent = label;

        var valueEl = lx.createElement('DIV', {
            parent: fieldEl,
            style: {
                minHeight: '20px',
                fontSize: '14px',
                color: '#0F0F0F',
                overflowWrap: 'anywhere'
            }
        });

        valueEl.textContent = value === null || typeof value === 'undefined' || String(value).trim() === '' ? '-' : String(value);

        return valueEl;
    }

    // Function to format an amount
    function formatAmount(value) {
        var amount = Number(value);

        if (!Number.isFinite(amount)) {
            return '-';
        }

        return amount.toFixed(2);
    }

    function displayResponse(response) {
        if (response === null || typeof response !== 'object') {
            new lx.component.Messagebox({
                title: 'Loading Payment Result Failed',
                message: 'No payment response is available.'
            });

            return;
        }

        var payments = Array.isArray(response.payments) ? response.payments : [];

        paymentsGrid.addRows(payments);
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
            response: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        responseResult = compConfig.response;

        // Validate and load provider response data into the grid
        displayResponse(responseResult);
        
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
            innerHTML: 'Payaccsys Payments Integrated Results'
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
            innerHTML: '<div>Batch Results</div>'
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

        createResponseField(batchSettingsEl, 'Batch Description', responseResult.batchDescription, '300px');

        createResponseField(batchSettingsEl, 'Status', responseResult.status, '260px');

        createResponseField(batchSettingsEl, 'Batch Reference', responseResult.batchReference, '180px');

        createResponseField(batchSettingsEl, 'Available Balance', formatAmount(responseResult.availableBalance), '160px');

        createResponseField(batchSettingsEl, 'Total Payments', formatAmount(responseResult.totalPayments), '160px');

        createResponseField(batchSettingsEl, 'Total Fees', formatAmount(responseResult.totalFees), '160px');

        createResponseField(batchSettingsEl, 'Total Deductions', formatAmount(responseResult.totalDeductions), '160px');

        createResponseField(batchSettingsEl, 'Submitted', responseResult.summary ? responseResult.summary.submitted : null, '120px');

        createResponseField(batchSettingsEl, 'Returned', responseResult.summary ? responseResult.summary.returned : null, '120px');

        var warningText = Array.isArray(responseResult.warnings) && responseResult.warnings.length > 0 ? responseResult.warnings.join(' ') : 'None';

        createResponseField(batchSettingsEl, 'Warnings', warningText, '400px');

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
            innerHTML: '<div>Payments: Result Fields</div>'
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
                {dataIndex: 'employeeName', name: 'Employee Name', width: '160px'},
                {dataIndex: 'employeeSurname', name: 'Employee Surname', width: '160px'},
                {dataIndex: 'supplierCode', name: 'Supplier Code', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '140px'},
                {dataIndex: 'paymentReference', name: 'Transaction Reference', width: '140px'},                
                {dataIndex: 'payslipId', name: 'Payslip ID', width: '120px'},
                {dataIndex: 'amount', name: 'Nett Pay Amount', width: '120px'},
                {dataIndex: 'fee', name: 'Fee', width: '130px'},
                {dataIndex: 'product', name: 'Service Type', width: '140px'},
                {dataIndex: 'message', name: 'Failure Reason', width:'180px'}
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
            label: 'OK',
            width: '120px',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
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
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};
