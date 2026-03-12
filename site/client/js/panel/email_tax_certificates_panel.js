/* globals app, lx */
'use strict';


// EMAIL TAX CERTIFICATES PANEL
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
app.panel.EmailTaxCertificates = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var employeesGrid = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var emailBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the relevant employees
    function loadEmployees( clearGrid ) {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=getEmployeeList',
            data: {
                reconciliationId: config.reconciliationId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }
                
                // Loop through all employees
                let employees = [];
                for( let i = 0; i < response.employees.length; i++ ) {
                    employees.push({
                        employeeId: response.employees[i].employeeId,
                        employeeAlias: response.employees[i].employeeAlias,
                        employeeEmailAddress: response.employees[i].employeeEmailAddress,
                        taxCertificateId: response.employees[i].taxCertificateId,
                        taxYear: response.employees[i].taxYear,
                        periodCode: response.employees[i].periodCode,
                        periodName: response.employees[i].periodName,
                        typeCode: response.employees[i].typeCode,
                        typeName: response.employees[i].typeName,
                        generatedOn: response.employees[i].generatedOn
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) employeesGrid.clear();
                employeesGrid.addRows( employees );
                
                // Select all the employees by default
                for( let i = 0; i < employeesGrid.getRowCount(); i++ ) {
                    employeesGrid.selectRow(i);
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
        let record = employeesGrid.getRow(rowIndex);
        let cell = employeesGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = employeesGrid.getColumnDataIndex(colIndex);
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
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Update the row and destroy the component before moving to the next
            record[employeesGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            employeesGrid.updateRow(rowIndex, record);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            if( event.key === 13 ) {
                // Update the row and destroy the component before moving to the next
                record[employeesGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                employeesGrid.updateRow(rowIndex, record);
            }
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[employeesGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                employeesGrid.updateRow(rowIndex, record);
                
                // Edit the next cell
                if( dataIndex === 'employeeEmailAddress' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < employeesGrid.getRowCount() ) {
                        // Edit the next row
                        editCell(rowIndex + 1, colIndex, false);
                    }
                }
            }
        });
        
        if( focus === true ) newComponent.focus();
        newComponent.setValue( record[employeesGrid.getColumnDataIndex(colIndex)] );
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
        if( compConfig.hasOwnProperty('onSend') ) me.addEventListener('send', compConfig.onSend);
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
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Email Tax Certificates'
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
                padding: '0px 20px 20px 20px'
            }
        });
        
        
        //
        // EMPLOYEES SECTION
        //
        
        let employeesSectionEl = lx.createElement('DIV', {
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
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: employeesSectionEl
        });
        
        // Create a container for the employees
        let employeesContainerEl = lx.createElement('DIV', {
            parent: employeesSectionEl,
            className: 'flex-column flex-align-center',
            style: {
                // flex: '1 1 100%',
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                height: '100%',
                overflow: 'auto'
            }
        });
        
        // Create a heading for the grid
        new lx.component.Heading({
            renderTo: employeesContainerEl,
            label: 'Tax certificates will be sent to the following employees:',
            padding: '15px 15px 5px 15px',
            margin: '0px'
        });
        
        // Create employeesGrid component
        employeesGrid = new lx.component.Grid({
            renderTo: employeesContainerEl,
            // autoSize: true,
            flex: '1 1 100%',
            width: '100%',
            borderWidth: '1px',
            // margin: '15px 0px 0px 0px',
            
            columns: [
                {dataIndex: 'select', width: '60px', type: 'rowSelect'},
                {dataIndex: 'employeeAlias', name: 'Employee', width: '200px'},
                {dataIndex: 'employeeEmailAddress', name: 'Email Address' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">'},
                {dataIndex: 'taxYear', name: 'Tax Year', width: '80px'},
                {dataIndex: 'periodName', name: 'Period', width: '80px'},
                {dataIndex: 'typeName', name: 'Type', width: '80px'},
                {dataIndex: 'generatedOn', name: 'Generated On', width: '150px'}
            ],
            
            onCellClick: employeesGridCellClickEventHandler,
            onRowSelect: employeesGridRowSelectEventHandler,
            onRowDeselect: employeesGridRowSelectEventHandler,
            onSelectAllRows: employeesGridRowSelectEventHandler,
            onDeselectAllRows: employeesGridRowSelectEventHandler
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
            margin: '0px 15px 0px 0px',
            
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
        loadEmployees( true );
        
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
    
    // employeesGrid cell click event handler
    function employeesGridCellClickEventHandler( clickEvent ) {
        // Get the data index of the column that was clicked
        let dataIndex = employeesGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'employeeEmailAddress' ) {
            editCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }
    }
    
    // employeesGrid row select event handler
    function employeesGridRowSelectEventHandler() {
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Email button click event handler
    function emailBtnClickEventHandler() {
        if( employeesGrid.getSelectedRowCount() < 1) {
            emailBtn.showWarning('No employees selected.');
            return;
        }
        
        // Get all the selected transactions
        let taxCertificates = [];
        for( let i = 0; i < employeesGrid.getRowCount(); i++ ) {
            // Get the row details
            let row = employeesGrid.getRow(i);
            
            // Is the row selected?
            if( employeesGrid.rowIsSelected(i) === true ) {
                // Was no email address specified?
                if( row.employeeEmailAddress.trim() === '' ) {
                    new lx.component.Messagebox({
                        title: 'Emailing Tax Certificates Failed',
                        message: 'No email address specified. Please ensure all selected transactions have valid email addresses.'
                    });
                    return;
                }
                
                // Add the tax certificates to the list
                taxCertificates.push({
                    id: row.taxCertificateId,
                    emailAddress: row.employeeEmailAddress
                });
            }
        }
        
        // Were no employees selected
        if( taxCertificates.length < 1 ) {
            new lx.component.Messagebox({
                title: 'Emailing Tax Certificates Failed',
                message: 'No employees selected. Please select the employees to send tax certificates to.'
            });
            return;
        }
        
        // Email the selected payslip
        emailBtn.disable();
        emailBtn.showLoader();
        lx.sendJSON({
            url: 'exec.php?c=TaxCertificate&fn=send',
            data: {
                taxCertificates: taxCertificates
            },
            onSuccess: function( responseText ) {
                emailBtn.enable();
                emailBtn.hideLoader();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Emailing Tax Certificates Failed',
                        message: response.error
                    });
                }
                
                me.fireEvent('send', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};