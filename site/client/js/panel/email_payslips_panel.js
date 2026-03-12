/* globals app, lx */
'use strict';

// EMAIL PAYSLIPS PANEL
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
app.panel.EmailPayslips = function(config) {
    
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
    var emailBtn = null;
    
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
                }
                
                // Loop through all payslips
                let payslips = [];
                for( let i = 0; i < response.payrun.payslips.length; i++ ) {
                    payslips.push({
                        id: response.payrun.payslips[i].id,
                        period: (response.payrun.payslips[i].fromDate + ' to ' + response.payrun.payslips[i].toDate),
                        employeeName: response.payrun.payslips[i].employee.name,
                        emailAddress: response.payrun.payslips[i].employee.emailAddress,
                        download: '<i class="fas fa-download"></i>'
                    });
                }
                payslipsGrid.addRows( payslips );
                
                // Select all the payslips by default
                for( let i = 0; i < payslipsGrid.getRowCount(); i++ ) {
                    payslipsGrid.selectRow(i);
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
        let record = payslipsGrid.getRow(rowIndex);
        let cell = payslipsGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = payslipsGrid.getColumnDataIndex(colIndex);
        let newComponent = null;
        
        cell.innerHTML = '';
        cell.style.overflow = 'visible';
        
        // Create the edit component depending on the dataIndex
        if( dataIndex === 'emailAddress' ) {
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null
            });
        }
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Update the row and destroy the component before moving to the next
            record[payslipsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            payslipsGrid.updateRow(rowIndex, record);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            if( event.key === 13 ) {
                // Update the row and destroy the component before moving to the next
                record[payslipsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                payslipsGrid.updateRow(rowIndex, record);
            }
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[payslipsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                payslipsGrid.updateRow(rowIndex, record);
                
                // Edit the next cell
                if( dataIndex === 'emailAddress' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < payslipsGrid.getRowCount() ) {
                        // Edit the next row
                        editCell(rowIndex + 1, colIndex, false);
                    }
                }
            }
        });
        
        if( focus === true ) newComponent.focus();
        newComponent.setValue( record[payslipsGrid.getColumnDataIndex(colIndex)] );
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
            
            payrunId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onEmail') ) me.addEventListener('email', compConfig.onEmail);
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
            innerHTML: 'Email Payslips'
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
            // autoSize: true,
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'select', width: '60px', type: 'rowSelect'},
                {dataIndex: 'period', name: 'Period', width: '180px'},
                {dataIndex: 'employeeName', name: 'Employee'},
                {dataIndex: 'emailAddress', name: 'Email Address' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">'},
                {dataIndex: 'download', name: '', type: 'button', width: '35px', alignment: 'center'},
            ],
            
            onCellClick: payslipsGridCellClickEventHandler,
            onRowSelect: payslipsGridRowSelectEventHandler,
            onRowDeselect: payslipsGridRowSelectEventHandler,
            onSelectAllRows: payslipsGridRowSelectEventHandler,
            onDeselectAllRows: payslipsGridRowSelectEventHandler
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
            // margin: '0px 15px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        
        // Create the emailBtn component
        emailBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Send',
            width: '120px',
            
            onClick: emailBtnClickEventHandler
        });
        
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
    
    // payslipsGrid cell click event handler
    function payslipsGridCellClickEventHandler( clickEvent ) {
        // Get the data index of the column that was clicked
        let dataIndex = payslipsGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'emailAddress' ) {
            editCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }
        else if( dataIndex === 'download' ) {
            lx.sendForm({
                url: 'exec.php?c=Payslip&fn=downloadPayslip',
                target: '_blank',
                data: {
                    payslipId: parseInt(payslipsGrid.getRow(clickEvent.rowIndex).id)
                }
            });
        }
    }
    
    // payslipsGrid row select event handler
    function payslipsGridRowSelectEventHandler() {
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Email button click event handler
    function emailBtnClickEventHandler() {
        if( payslipsGrid.getSelectedRowCount() < 1) {
            emailBtn.showWarning('No payslips selected.');
            return;
        }
        
        // Get all the selected transactions
        let payslips = [];
        for( let i = 0; i < payslipsGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = payslipsGrid.getRow(i);
            
            // Is the row selected?
            if( payslipsGrid.rowIsSelected(i) === true ) {
                // Was no email address specified?
                if( row.emailAddress.trim() === '' ) {
                    new lx.component.Messagebox({
                        title: 'Emailing Payslips Failed',
                        message: 'No email address specified. Please ensure all selected transactions have valid email addresses.'
                    });
                    return;
                }
                
                // Add the payslip to the list
                payslips.push({
                    id: row.id,
                    emailAddress: row.emailAddress
                });
            }
        }
        
        // Were no payslips selected
        if( payslips.length < 1 ) {
            new lx.component.Messagebox({
                title: 'Emailing Payslips Failed',
                message: 'No payslips selected. Please select the payslips you wish to email.'
            });
            return;
        }
        
        // Email the selected payslip
        emailBtn.disable();
        emailBtn.showLoader();
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=sendPayslips',
            data: {
                emailData: payslips
            },
            onSuccess: function( responseText ) {
                emailBtn.enable();
                emailBtn.hideLoader();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Emailing Payslips Failed',
                        message: response.error
                    });
                }
                
                me.fireEvent('email', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};