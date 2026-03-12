/* jslint node: true */
/* globals app, lx */
'use strict';


// SELF-SERVICE INVITE PANEL
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
app.panel.SelfServiceInvite = function(config) {
    
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
    var inviteBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load employees
    function loadEmployees(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = employeesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: '',
                limit: null,
                offset: 0,
                sortOrder: 'ASC',
                sortList: [
                    {'dataIndex': 'name', 'order': 'ASC'}
                ],
                employeeStatus: 'employed',
                departmentId: null
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }
                
                // Populate grid
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    let employmentDate = response.employees[i].employmentStartDate + ' to ' + response.employees[i].employmentEndDate;
                    if (response.employees[i].employmentEndDate === null) {
                        employmentDate = response.employees[i].employmentStartDate + ' to present';
                    }
                    employees.push({
                        id: response.employees[i].id,
                        code: response.employees[i].code,
                        name: response.employees[i].alias,
                        email: response.employees[i].emailAddress,
                        cellphone: response.employees[i].cellNumber,
                        department: response.employees[i].departmentName,
                        employmentStatus: response.employees[i].employmentStatus,
                        employmentDate: employmentDate,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) employeesGrid.clear();
                
                employeesGrid.addRows( employees );
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
        if( dataIndex === 'email' ) {
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
                if( dataIndex === 'email' ) {
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
            show: false,
            
            payrunId: null,
            payrunDescription: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onInvite') ) me.addEventListener('invite', compConfig.onInvite);
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
                backgroundColor: '#FFFFFF',
                overflow: 'visible'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '16px',
                flex: '0 0 auto',
                color: lx.style.global.backgroundColor,
                backgroundColor: lx.style.global.highlightColor,
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Self-Service Invite'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 20px 20px 20px',
                overflow: 'auto'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // NOTE SECTION
        //
        
        // // Display a message to the user
        // let noteSectionEl = lx.createElement('DIV', {
        //     parent: contentEl,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         backgroundColor: '#FFFFFF',
        //         borderStyle: 'solid',
        //         borderColor: '#DFDFDF',
        //         borderWidth: '1px',
        //         margin: '20px 0px 0px 0px',
        //         padding: '15px 30px',
        //         width: '100%',
        //         // maxWidth: '900px',
        //         // borderRadius: '15px'
        //     }
        // });
        
        // new lx.createElement('DIV', {
        //     parent: noteSectionEl,
        //     style: {
        //         margin: 'auto 15px auto 0px',
        //         textAlign: 'center',
        //         fontSize: '32px'
        //     },
        //     innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #3B81EB;"></i>'
        // });
        
        // new lx.createElement('DIV', {
        //     parent: noteSectionEl,
        //     style: {
        //         margin: 'auto 0px',
        //         // maxWidth: '700px',
        //         textAlign: 'justify',
        //         fontSize: '14px'
        //     },
        //     innerHTML: 
        //         'This function enables you to invite your employees to use the self-service portal which will give them functionality ' + 
        //         'such as viewing and downloading their payslips, viewing leave and attendance history, requesting leave, and more. The '  +
        //         'selected employees will receive an email containing a link to the self-service portal that will allow them to register ' +
        //         'an account, if they wish to do so.'
        // });
        
        let noteSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#828282', // '#3B81EB',
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px',
                margin: '15px 0px',
                padding: '15px 30px',
                width: '100%',
                // maxWidth: '900px',
                borderRadius: '15px'
            }
        });
        
        new lx.createElement('DIV', {
            parent: noteSectionEl,
            style: {
                margin: 'auto 15px auto 0px',
                textAlign: 'center',
                fontSize: '32px'
            },
            innerHTML: '<i class="fas fa-info-circle" style="margin: auto 10px auto 0px; color: #FFFFF;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: noteSectionEl,
            style: {
                margin: 'auto 0px',
                // maxWidth: '700px',
                textAlign: 'justify',
                fontSize: '14px'
            },
            innerHTML: 
                'This function enables you to invite your employees to use the self-service portal which will give them functionality ' + 
                'such as viewing and downloading their payslips, viewing leave and attendance history, requesting leave, and more. The '  +
                'selected employees will receive an email containing a link to the self-service portal that will allow them to register ' +
                'an account, if they wish to do so.'
        });
        
        
        //
        // EMPLOYEES SECTION
        //
        
        // Create a container for the employees
        let employeesContainer = lx.createElement('DIV', {
            parent: contentEl,
            className: 'flex-column flex-align-center',
            style: {
                boxSizing: 'border-box',
                flex: '1 1 100%',
                // height: '100%',
                overflow: 'auto'
            }
        });
        
        // Create the headingEl element
        let headingEl = lx.createElement('DIV', {
            parent: employeesContainer,
            style: {
                boxSizing: 'border-box',
                margin: '20px 0px 0px 0px',
                display: 'flex',
                width: '100%',
                padding: '0px 5px 0px 5px',
                minHeight: '30px',
                // backgroundColor: '#FFFFFF',
                // borderStyle: 'solid',
                // borderColor: '#DFDFDF',
                // borderWidth: '1px 1px 0px 1px'
            }
        });
        
        // Display the heading text
        lx.createElement('DIV', {
            parent: headingEl,
            style: {
                margin: 'auto 0px auto 0px',
                fontSize: '14px'
            },
            innerHTML: 'Please select the employees to invite from the list below:'
        });
        
        // Create employeesGrid component
        employeesGrid = new lx.component.Grid({
            renderTo: employeesContainer,
            // autoSize: true,
            flex: '1 1 100%',
            width: '100%',
            borderWidth: '1px',
            // margin: '15px 0px 0px 0px',
            
            columns: [
                {dataIndex: 'select', width: '40px', type: 'rowSelect', padding: '0px 0px 0px 5px'},
                {dataIndex: 'code', name: 'Code', width: '100px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'name', name: 'Name', minWidth: '100px'},
                {dataIndex: 'email', name: 'Email Address' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">' },
                // {dataIndex: 'cellphone', name: 'Cellphone Number', width: '130px'},
                {dataIndex: 'department', name: 'Department', minWidth: '150px', maxWidth: '250px', wrapText: true},
                // {dataIndex: 'employmentStatus', name: 'Status', width: '100px'},
                // {dataIndex: 'employmentDate', name: 'Employment Period', width: '180px'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: employeesGridCellClickEventHandler
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
        
        
        // Create the inviteBtn component
        inviteBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Invite',
            width: '120px',
            
            onClick: inviteBtnClickEventHandler
        });
        
        // Load form data
        loadEmployees( compConfig.payrunId );
        
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
    function employeesGridCellClickEventHandler(clickEvent) {
        // Get the data index of the column that was clicked
        let dataIndex = employeesGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'email' ) {
            editCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    
    // Post button click event handler
    function inviteBtnClickEventHandler() {
        // Have no employees been selected?
        if( employeesGrid.getSelectedRowCount() <= 0 ) {
            inviteBtn.showWarning(
                'No employees were selected. Please select one or more employees by clicking on the check mark next to the employee code or the highlighted icon at the top of the column to select all employees.'
            );
            return;
        }
        
        // Display the warning and give the user the option to cancel or continue
        new lx.component.Messagebox({
            title: 'Send Invites',
            message: 'Are you certain you want to send invitations to ' + employeesGrid.getSelectedRowCount() + ' employee(s)?',
            buttons: [
                {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                {name: 'invite', label: 'Invite', isDefault: true}
            ],
            onClose: function( closeEvent ) {
                // Should the payrun employees be posted?
                if( closeEvent.button === 'invite' ) {
                    // Get all the employees from the grid
                    let employees = [];
                    for( let i = 0; i < employeesGrid.getRowCount(); i++ ) {
                        if( employeesGrid.rowIsSelected(i) ) {
                            let record = employeesGrid.getRow(i);
                            employees.push({
                                id: record.id,
                                emailAddress: record.email
                            });
                        }
                    }
                    
                    // Post the payrun employees
                    lx.sendJSON({
                        url: 'exec.php?c=Employee&fn=sendSelfServiceInvites',
                        data: {
                            employees: employees
                        },
                        onSuccess: function( responseText ) {
                            var response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Sending Invites Failed',
                                    message: response.error
                                });
                                return;
                            }
                            
                            me.fireEvent('invite', {srcPanel: me});
                        }
                    });
                }
                else {
                    return;
                }
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};