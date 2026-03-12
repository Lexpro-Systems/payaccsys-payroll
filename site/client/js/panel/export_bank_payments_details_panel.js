/* globals app, lx */
'use strict';

// EXPORT BANK PAYMENTS DETAILS PANEL
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
app.panel.ExportBankPaymentsDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var paymentsGridDropdownBtn = null;
    var paymentsGrid = null;
    var totalTextbox = null;
    
    var exportFormat = 'ACBF';
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the relevant payments
    function loadPayments( clearGrid ) {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getPaymentList',
            data: {
                payrunId: config.payrunId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payments Failed',
                        message: response.error
                    });
                }
                
                // Loop through all payments
                let payments = [];
                let total = 0;
                for( let i = 0; i < response.payments.length; i++ ) {
                    payments.push({
                        employeeId: response.payments[i].employeeId,
                        payslipId: response.payments[i].payslipId,
                        employeeAlias: response.payments[i].employeeAlias,
                        emailNotify: false,
                        employeeEmailAddress: response.payments[i].employeeEmailAddress,
                        smsNotify: false,
                        employeeCellNumber: response.payments[i].employeeCellNumber,
                        amount: response.payments[i].amount,
                        displayAmount: lx.util.formatCurrency(response.payments[i].amount)
                    });
                    total = total + parseFloat(response.payments[i].amount);
                }
                
                // Set the total
                totalTextbox.setValue(lx.util.formatCurrency(total));
                
                // Should the grid be cleared?
                if( clearGrid ) paymentsGrid.clear();
                paymentsGrid.addRows( payments );
                
                // Select all the payments by default
                for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
                    paymentsGrid.selectRow(i);
                }
            }
        });
    }
    
    // Function to start editing a text cell
    //
    // rowIndex         The row index of the cell to edit.
    // colIndex         The column index of the cell to edit.
    // focus            Should the component be focussed after being created.
    function editCell(rowIndex, colIndex, focus) {
        let record = paymentsGrid.getRow(rowIndex);
        let cell = paymentsGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = paymentsGrid.getColumnDataIndex(colIndex);
        let newComponent = null;
        
        cell.innerHTML = '';
        cell.style.overflow = 'visible';
        
        // Create the edit component depending on the dataIndex
        if( dataIndex === 'employeeEmailAddress' ) {
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null
            });
        }
        else if( dataIndex === 'employeeCellNumber' ) {
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null
            });
        }
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Update the row and destroy the component before moving to the next
            record[paymentsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            paymentsGrid.updateRow(rowIndex, record);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            if( event.key === 13 ) {
                // Update the row and destroy the component before moving to the next
                record[paymentsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                paymentsGrid.updateRow(rowIndex, record);
            }
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[paymentsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                paymentsGrid.updateRow(rowIndex, record);
                
                // Edit the next cell
                if( dataIndex === 'employeeEmailAddress' ) {
                    // Edit the next editable column
                    editCell(rowIndex, colIndex + 2, false);
                }
                else if( dataIndex === 'employeeCellNumber' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < paymentsGrid.getRowCount() ) {
                        // Edit the next row
                        editCell(rowIndex + 1, colIndex - 2, false);
                    }
                }
            }
        });
        
        if( focus === true ) newComponent.focus();
        newComponent.setValue( record[paymentsGrid.getColumnDataIndex(colIndex)] );
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
                padding: '0px 15px 15px 15px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // PAYMENTS SECTION
        //
        
        // Create the paymentsSectionEl element
        let paymentsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 0px 0px'
            }
        });
        
        
        // Create a container for the payments
        let paymentsContainerEl = lx.createElement('DIV', {
            parent: paymentsSectionEl,
            className: 'flex-column flex-align-center',
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                // flex: '1 1 100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        // Create the paymentsGridHeadingEl element
        let paymentsGridHeadingEl = lx.createElement('DIV', {
            parent: paymentsContainerEl,
            className: 'flex-noresize flex-row flex-align-center',
            style: {
                width: '100%',
                height: '40px',
                fontSize: '16px',
                // fontWeight: 'bold',
                backgroundColor: '#FFFFFF',
                padding: '0px 15px 0px 15px',
                margin: '20px 0px 0px 0px',
                boxSizing: 'border-box',
                border: 'solid #EEEEEE',
                borderWidth: '1px 1px 0px 1px'
            },
            innerHTML: 'Payments to Export'
        });
        
        // Create dropdown Button
        paymentsGridDropdownBtn = new lx.component.DropdownButton({
            renderTo: paymentsGridHeadingEl,
            margin: '0px 0px 0px auto',
            label: '<i class="fa fa-ellipsis-v"></i>',
            dropdownAlignment: 'right'
        });
        
        let notifyEmailSelectAllMenuEl = lx.createElement('DIV', {
            parent: paymentsGridDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '150px',
                padding: '8px',
                fontSize: '14px',
                lineHeight: '14px'
            },
            innerHTML: '<i class="fas fa-plus" style="margin: 0px 15px 0px 0px"></i><span style="font-weight:normal;">Email Notify All</span>'
        });
        notifyEmailSelectAllMenuEl.addEventListener('click', notifyEmailSelectAllMenuElClickEventHandler);
        
        let notifyEmailSelectNoneMenuEl = lx.createElement('DIV', {
            parent: paymentsGridDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '150px',
                padding: '8px',
                fontSize: '14px',
                lineHeight: '14px'
            },
            innerHTML: '<i class="fas fa-minus" style="margin: 0px 15px 0px 0px"></i><span style="font-weight:normal;">Email Notify None</span>'
        });
        notifyEmailSelectNoneMenuEl.addEventListener('click', notifyEmailSelectNoneMenuElClickEventHandler);
        
        let notifySmsSelectAllMenuEl = lx.createElement('DIV', {
            parent: paymentsGridDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '150px',
                padding: '8px',
                fontSize: '14px',
                lineHeight: '14px'
            },
            innerHTML: '<i class="fas fa-plus" style="margin: 0px 15px 0px 0px"></i><span style="font-weight:normal;">SMS Notify All</span>'
        });
        notifySmsSelectAllMenuEl.addEventListener('click', notifySmsSelectAllMenuElClickEventHandler);
        
        let notifySmsSelectNoneMenuEl = lx.createElement('DIV', {
            parent: paymentsGridDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '150px',
                padding: '8px',
                fontSize: '14px',
                lineHeight: '14px'
            },
            innerHTML: '<i class="fas fa-minus" style="margin: 0px 15px 0px 0px"></i><span style="font-weight:normal;">SMS Notify None</span>'
        });
        notifySmsSelectNoneMenuEl.addEventListener('click', notifySmsSelectNoneMenuElClickEventHandler);
        
        // Create paymentsGrid component
        paymentsGrid = new lx.component.Grid({
            renderTo: paymentsContainerEl,
            // autoSize: true,
            flex: '1 1 100%',
            width: '100%',
            borderWidth: '1px',
            // margin: '15px 0px 0px 0px',
            
            columns: [
                {dataIndex: 'select', width: '60px', type: 'rowSelect'},
                {dataIndex: 'employeeAlias', name: 'Employee'},
                {dataIndex: 'emailNotify', name: 'Email Notify', width: '80px', type: 'checkbox', alignment: 'center'},
                {dataIndex: 'employeeEmailAddress', name: 'Email Address' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">'},
                {dataIndex: 'smsNotify', name: 'SMS Notify', width: '80px', type: 'checkbox', alignment: 'center'},
                {dataIndex: 'employeeCellNumber', name: 'Cell Number' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">', width: '130px'},
                {dataIndex: 'displayAmount', name: 'Amount', width: '160px', alignment: 'right'}
            ],
            
            onCellClick: paymentsGridCellClickEventHandler,
            onRowSelect: paymentsGridRowSelectEventHandler,
            onRowDeselect: paymentsGridRowDeselectEventHandler,
            onSelectAllRows: paymentsGridRowSelectAllEventHandler,
            onDeselectAllRows: paymentsGridRowDeselectAllEventHandler
        });
        
        
        //
        // EXPORT INFO
        //
        
        // Create the export info section
        let exportInfoSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#F4F5F6',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 0px 0px',
                margin: '20px 0px 0px 0px'
            }
        });
        
        
        // Create the totalTextbox component
        totalTextbox = new lx.component.Textbox({
            renderTo: exportInfoSectionEl,
            labelAlign: 'left',
            labelWidth: '90px',
            label: 'Total Amount:',
            textAlign: 'right',
            // height: '32px',
            width: '250px',
            margin: '0px 0px 0px auto'
        });
        totalTextbox.setValue('0.00');
        totalTextbox.disable();
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        // buttonContainerEl = lx.createElement('DIV', {
        //     parent: el,
        //     style: {
        //         display: 'flex',
        //         flexDirection: 'row',
        //         justifyContent: 'flex-end',
        //         padding: '15px',
        //         borderStyle: 'solid',
        //         borderWidth: '1px 0px 0px 0px',
        //         borderColor: '#DFDFDF'
        //     }
        // });
        
        // Create the cancelBtn component
        // cancelBtn = new lx.component.Button({
        //     renderTo: buttonContainerEl,
        //     label: 'Cancel',
        //     width: '120px',
        //     style: 'text',
        //     margin: '0px 15px 0px 0px',
            
        //     onClick: cancelBtnClickEventHandler
        // });
        
        
        // Create the exportBtn component
        // exportBtn = new lx.component.Button({
        //     renderTo: buttonContainerEl,
        //     label: 'Export',
        //     width: '120px',
            
        //     onClick: exportBtnClickEventHandler
        // });
        
        // Load form data
        loadPayments( true );
        
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
    me.setExportFormat = function( format ) {
        exportFormat = format;
    };
    
    // Function to validate data
    me.validateData = function() {
        let result = {
            status: true,
            error: ''
        };
        
        // Were no payments selected?
        if( paymentsGrid.getSelectedRowCount() < 1) {
            result = {
                status: false,
                error: 'No payments selected.'
            };
            return result;
        }
        
        return result;
    };
    
    // Function to get employee to pay
    me.getEmployees = function() {
        let employees = [];
        
        // Get all the selected employees
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = paymentsGrid.getRow(i);
            
            // Is the row selected?
            if( paymentsGrid.rowIsSelected(i) === true ) {
                // Should the employee be notified via email?
                if( row.emailNotify ) {
                    // Was no email address specified?
                    if( row.employeeEmailAddress.trim() === '' ) {
                        new lx.component.Messagebox({
                            title: 'Exporting Bank Payments Failed',
                            message: 'You have selected to notify \'' +  row.employeeAlias + '\' via email, but no email address was specified.'
                        });
                        return [];
                    }
                }
                
                // Should the employee be notified via SMS?
                if( row.smsNotify ) {
                    // Was no cell number specified?
                    if( row.employeeCellNumber.trim() === '' ) {
                        new lx.component.Messagebox({
                            title: 'Exporting Bank Payments Failed',
                            message: 'You have selected to notify \'' +  row.employeeAlias + '\' via SMS, but no cell number was specified.'
                        });
                        return [];
                    }
                }
                
                // Add the export to the list
                employees.push({
                    id: row.employeeId,
                    payslipId: row.payslipId,
                    emailNotify: row.emailNotify,
                    notifyEmailAddress: row.employeeEmailAddress.trim(),
                    smsNotify: row.smsNotify,
                    notifyCellNumber: row.employeeCellNumber.trim()
                });
            }
        }
        
        return employees;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // paymentsGrid cell click event handler
    function paymentsGridCellClickEventHandler( event ) {
        // Get the data index of the column that was clicked
        let dataIndex = paymentsGrid.getColumnDataIndex(event.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'emailNotify' ) {
            // Is it not the CSV format?
            if( exportFormat !== 'CSVF' ) {
                // Give a message to the user
                new lx.component.Messagebox({
                    title: 'Email Notification Unsupported ',
                    message: 'The selected export format does not support email notifications.'
                });
                
                // Do not change the value of the column
                let row = paymentsGrid.getRow(event.rowIndex);
                if( row.emailNotify === false ) {
                    row.emailNotify = true;
                    paymentsGrid.updateRow(event.rowIndex, row);
                    return;
                }
            }
        }
        else if( dataIndex === 'employeeEmailAddress' ) {
            editCell(event.rowIndex, event.columnIndex, true);
        }
        else if( dataIndex === 'smsNotify' ) {
            // Is it not the CSV format?
            if( exportFormat !== 'CSVF' ) {
                // Give a message to the user
                new lx.component.Messagebox({
                    title: 'SMS Notification Unsupported ',
                    message: 'The selected export format does not support SMS notifications.'
                });
                
                // Do not change the value of the column
                let row = paymentsGrid.getRow(event.rowIndex);
                if( row.smsNotify === false ) {
                    row.smsNotify = true;
                    paymentsGrid.updateRow(event.rowIndex, row);
                    return;
                }
            }
        }
        else if( dataIndex === 'employeeCellNumber' ) {
            editCell(event.rowIndex, event.columnIndex, true);
        }
    }
    
    // paymentsGrid row select event handler
    function paymentsGridRowSelectEventHandler( event ) {
        // Recalculate the total
        let total = 0;
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = paymentsGrid.getRow(i);
            
            // Is the row selected?
            if( (paymentsGrid.rowIsSelected(i) === true) || (i == event.rowIndex) ) {
                total = total + parseFloat( row.amount );
            }
        }
        
        totalTextbox.setValue(lx.util.formatCurrency(total));
    }
    
    // paymentsGrid row deselect event handler
    function paymentsGridRowDeselectEventHandler( event ) {
        // Recalculate the total
        let total = 0;
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = paymentsGrid.getRow(i);
            
            // Is the row selected?
            if( (paymentsGrid.rowIsSelected(i) === true) && (i != event.rowIndex) ) {
                total = total + parseFloat( row.amount );
            }
        }
        totalTextbox.setValue(lx.util.formatCurrency(total));
    }
    
    // paymentsGrid row select all event handler
    function paymentsGridRowSelectAllEventHandler() {
        // Recalculate the total
        let total = 0;
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = paymentsGrid.getRow(i);
            total = total + parseFloat( row.amount );
        }
        totalTextbox.setValue(lx.util.formatCurrency(total));
    }
    
    // paymentsGrid row deselect all event handler
    function paymentsGridRowDeselectAllEventHandler() {
        // Reset the total
        totalTextbox.setValue(lx.util.formatCurrency(0.00));
    }
    
    // notifyEmailSelectAllMenuEl click event handler
    function notifyEmailSelectAllMenuElClickEventHandler() {
        // Hide the dropdown menu
        paymentsGridDropdownBtn.hideDropdown();
        
        // Is it not the CSV format?
        if( exportFormat !== 'CSVF' ) {
            // Give a message to the user
            new lx.component.Messagebox({
                title: 'Email Notification Unsupported ',
                message: 'The selected export format does not support Email notifications.'
            });
            return;
        }
        
        // Mark the payments
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            let row = paymentsGrid.getRow(i);
            row.emailNotify = true;
            paymentsGrid.updateRow(i, row);
        }
    }
    
    // notifyEmailSelectNoneMenuEl click event handler
    function notifyEmailSelectNoneMenuElClickEventHandler() {
        // Hide the dropdown menu
        paymentsGridDropdownBtn.hideDropdown();
        
        // Mark the payments
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            let row = paymentsGrid.getRow(i);
            row.emailNotify = false;
            paymentsGrid.updateRow(i, row);
        }
    }
    
    // notifySmsSelectAllMenuEl click event handler
    function notifySmsSelectAllMenuElClickEventHandler() {
        // Hide the dropdown menu
        paymentsGridDropdownBtn.hideDropdown();
        
        // Is it not the CSV format?
        if( exportFormat !== 'CSVF' ) {
            // Give a message to the user
            new lx.component.Messagebox({
                title: 'SMS Notification Unsupported ',
                message: 'The selected export format does not support SMS notifications.'
            });
            return;
        }
        
        // Mark the payments
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            let row = paymentsGrid.getRow(i);
            row.smsNotify = true;
            paymentsGrid.updateRow(i, row);
        }
    }
    
    // notifySmsSelectNoneMenuEl click event handler
    function notifySmsSelectNoneMenuElClickEventHandler() {
        // Hide the dropdown menu
        paymentsGridDropdownBtn.hideDropdown();
        
        // Mark the payments
        for( let i = 0; i < paymentsGrid.getRowCount(); i++ ) {
            let row = paymentsGrid.getRow(i);
            row.smsNotify = false;
            paymentsGrid.updateRow(i, row);
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};