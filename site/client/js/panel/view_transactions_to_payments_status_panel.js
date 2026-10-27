/* globals app, lx */
'use strict';

// SEND PAYSLIPS TO SPENDL WALLET PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//  payrunId:           The ID of the payrun to display and send to the Spendl Wallet API
//
// Events:
//
//  onSend:              Fired after the current payrun has been successfully sent to the Spendl Wallet API
//  onCancel:            Fired when the user cancels and closes the panel
//  onDestroy:           Fired just before the panel is destroyed
//
app.panel.SendTransactionStatus = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var payslipsGrid = null;
    
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
    function loadPayrun( payrunId, deliveryResults ) {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=get',
            data: {
                payrunId: payrunId,
                payslipStatusCode: 'ACTI'
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payrun Failed',
                        message: response.error
                    });
                    return;
                }

                var resultsByEmployeeCode = {};

                if (Array.isArray(deliveryResults)) {
                    for (var resultIndex = 0; resultIndex < deliveryResults.length; resultIndex++) {
                        var deliveryResult = deliveryResults[resultIndex];

                        resultsByEmployeeCode[deliveryResult.employeeCode] = deliveryResult;
                    }
                }
                
                // Loop through all payslips
                let payslips = [];
                for( let i = 0; i < response.payrun.payslips.length; i++ ) {

                    let payslip = response.payrun.payslips[i];
                    let employee = payslip.employee;
                    
                    var deliveryResult = resultsByEmployeeCode['EMP' + employee.empCode] || null;

                    var statusCode = '-';
                    var type = 'Not available';
                    var details = 'No stored delivery status is available yet.';

                    if (deliveryResult !== null) {
                        statusCode =
                            typeof deliveryResult.httpStatus !== 'undefined' ? deliveryResult.httpStatus : '-';

                        if (deliveryResult.ok === true) {
                            type = deliveryResult.status || 'submitted';
                            details = 'Payslip submitted to Spendl Wallet.';
                        } else {
                            type = deliveryResult.errorType || 'failed';
                            details = deliveryResult.error || 'Unable to send the payslip to Spendl Wallet.';
                        }
                    }

                    payslips.push({
                        id: payslip.id,
                        employeeCode: employee.empCode,
                        employeeAlias: employee.name,
                        employeeSurname: employee.employeeSurname,
                        period: (payslip.fromDate + ' to ' + payslip.toDate),
                        statusCode: statusCode,
                        type: type,
                        details: details,
                        retry: '<i class="fas fa-fw fa-redo"></i>',
                    });
                }
                payslipsGrid.addRows(payslips);
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
            innerHTML: 'View Spendl Wallet Status'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // PAYSLIP SECTION
        //
        
        // Create payslipsGrid component
        payslipsGrid = new lx.component.Grid({
            renderTo: contentEl,
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'employeeCode', name: 'Employee Code', width: '100px'},
                {dataIndex: 'employeeAlias', name: 'Name', width: '140px'},
                {dataIndex: 'employeeSurname', name: 'Surname', width: '140px'},
                {dataIndex: 'period', name: 'Payslip Date', width: '180px' },
                {dataIndex: 'statusCode', name: 'Status Code', width: '100px'},
                {dataIndex: 'type', name: 'Type', width: '120px'},
                {dataIndex: 'details', name: 'Details'},
                {dataIndex: 'retry', name: 'Retry', type: 'button', width: '85px', alignment: 'center'},
            ],
            
            onCellClick: payslipsGridCellClickEventHandler
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
        
        // Create the cancelBtn component to close the panel
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'OK',
            width: '120px',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        
        // Create the sendBtn component
        sendBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Retry All',
            width: '120px',
            
            onClick: sendBtnClickEventHandler
        });
        
        // Load form data
        loadPayrun( compConfig.payrunId, compConfig.deliveryResults);
        
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
    
    // payslipsGrid cell click event handler
    function payslipsGridCellClickEventHandler( clickEvent ) {
        // Get the data index of the column that was clicked
        let dataIndex = payslipsGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'retry' ) {
            // lx.sendForm({
            //     url: 'exec.php?c=Payslip&fn=downloadPayslip',
            //     target: '_blank',
            //     data: {
            //         payslipId: parseInt(payslipsGrid.getRow(clickEvent.rowIndex).id)
            //     }
            // });
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Send button click event handler
    function sendBtnClickEventHandler() {
        
        // Send selected payrun's ID to Spendl API-function
        // sendBtn.disable();
        // sendBtn.showLoader();
        // lx.sendJSON({
        //     url: 'exec.php?c=Payslip&fn=sendPayslips',
        //     data: {
        //         payrunId: payrunId
        //     },
        //     onSuccess: function( responseText ) {
        //         sendBtn.enable();
        //         sendBtn.hideLoader();
                
        //         var response = JSON.parse(responseText);
                
        //         if( response.ok !== true ) {
        //             new lx.component.Messagebox({
        //                 title: 'sending Payslips to Spendl Wallet Failed',
        //                 message: response.error
        //             });
        //             return;
        //         }
                
        //         me.fireEvent('send', {srcPanel: me});
        //     }
        // });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};