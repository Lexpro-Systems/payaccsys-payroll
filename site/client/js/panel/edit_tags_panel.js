/* globals app, lx */
'use strict';

// EDIT TAGS PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  tagsId             NOTE: Complete this section
//  tagName           NOTE: Complete this section
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditTags = function(config) {

    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleBackEl = null;
    let titleTextEl = null;
    let cancelBtn = null;
    let saveBtn = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let tagDetailsHeading = null;
    let tagDetailsSectionEl = null;
    let tagNameTxt = null;
    
    let employeeDetailsHeadingEl = null;
    let employeeDetailsSectionEl = null;
    let employeeAddSelect = null;
    let employeesGrid = null;
    
    let tagsId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);


    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the tags
    function loadTags() {
        lx.sendJSON({
            url: 'exec.php?c=Tags&fn=get',
            data: {
                id: tagsId
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                //let status = '';
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Tag Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                tagNameTxt.setValue( response.tags.name );
                
                let employees = [];
                for (let i = 0; i < response.tags.employees.length; i++) {
                    // if( response.tags.employees[i].isActive === true ) status = 'Active';
                    // else status = 'Inactive';
                    
                    
                    employees.push({
                        id: response.tags.employees[i].id,
                        name: response.tags.employees[i].name,
                        email: response.tags.employees[i].emailAddress,
                        cellphone: response.tags.employees[i].cellNumber,
                        remove: 'Remove'
                    });
                }
                employeesGrid.addRows(employees);
            }
        });
    }

    // Function to load employees
    //
    // clearList            If true the list will be cleared before loading new items.
    function loadEmployees( clearList ) {
        let offset = 0;
        if (clearList !== true) offset = employeeAddSelect.getItemCount();

       lx.sendJSON({
           url: 'exec.php?c=Employee&fn=getList',
           data: {
               searchString: employeeAddSelect.getSearchString(),
               limit: 20,
               offset: offset,
               sortList: [
                   {'dataIndex': 'name', 'order': 'ASC'}
               ],
               employeeStatus: 'employed'
           },
           onSuccess: function( responseText ) {
               var response = JSON.parse(responseText);
               
               if( response.ok !== true ) {
                   new lx.component.Messagebox({
                       title: 'Loading Employees Failed',
                       message: response.error
                   });
               }
               
               var employees = [];
               for( var i = 0; i < response.employees.length; i++ ) {
                   employees.push({
                       value: response.employees[i].id,
                       text: response.employees[i].alias
                   });
               }
               
               if (clearList === true) employeeAddSelect.clear();
               employeeAddSelect.addItems(employees);
           }
       });
   }

    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {

        // Initialize component config
        let compConfig = {
            tagsId: null,
            tagName: null
        };

        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        
        // Initialize state
        confirmDestroy = false;
        tagsId = compConfig.tagsId;

        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                backgroundColor: '#F4F5F6'
            }
        });


        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
            }
        });

        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Edit Tag: ' + compConfig.tagName
        });
        
        // Create cancel button
        cancelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            height: '32px',
            label: 'Cancel',
            margin: '0px 0px 0px auto',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create add button
        saveBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Save',
            margin: '0px 20px 0px 20px',
            
            onClick: saveBtnClickEventHandler
        });


        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                flex: '1 1 100%',
                overflow: 'hidden'
            }
        });
        
        // Create our loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });

        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px 15px 15px 15px'
            }
        });


        //
        // TAG DETAILS SECTION
        //
        
        // Create the tagDetailsHeading element
        tagDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Tag Details</div>'
        });

        // Create the tagDetailsSectionEl
        tagDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });

        // Create the tagNameTxt component
        tagNameTxt = new lx.component.Textbox({
            renderTo: tagDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });


        //
        // EMPLOYEES SECTION
        //
        
        // Create the employeeDetailsHeadingEl element
        employeeDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employees</div>'
        });

        // Create employeeDetailsSectionEl element
        employeeDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });

        // Create employeeAddSelect component
        employeeAddSelect = new lx.component.Selectbox({
            renderTo: employeeDetailsSectionEl,
            margin: '15px 15px 15px 15px',
            label: 'Select employee to add',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            search: true,
            
            onSearch: employeeAddSelectSearchEventHandler,
            onListScrollEnd: employeeAddSelectListScrollEndEventHandler,
            onChange: employeeAddSelectChangeEventHandler
        });

        // Create employeesGrid component
        employeesGrid = new lx.component.Grid({
            renderTo: employeeDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'name', name: 'Name', padding: '0px 0px 0px 15px'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '120px'},
                {dataIndex: 'remove', name: '', width: '80px', type: 'button'}
            ],
            
            onCellClick: employeesGridCellClickEventHandler
        });

        // Load form data
        loadTags();
        loadEmployees(true);
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        tagNameTxt.focus();
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };


    //
    // EVENT HANDLERS
    //
    
    // Default component change event handler
    function defaultComponentChangeEventHandler() {
        confirmDestroy = true;
    }

    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }

    // employeeAddSelect search event handler
    function employeeAddSelectSearchEventHandler() {
        loadEmployees(true);
    }
    
    // employeeAddSelect scroll end event handler
    function employeeAddSelectListScrollEndEventHandler() {
        loadEmployees(false);
    }

    // employeeAddSelect change event handler
    function employeeAddSelectChangeEventHandler() {
        let employeeId = employeeAddSelect.getValue();
        
        // Check if the selected employee has already been added
        for (let i = 0; i < employeesGrid.getRowCount(); i++) {
            let rowDetails = employeesGrid.getRow(i);
            if( rowDetails.id === employeeId ) {
                new lx.component.Messagebox({
                    title: 'Employee Already Added',
                    message: '\'' + rowDetails.name + '\' has already been added as a employee.'
                });
                
                employeeAddSelect.setValue(null, '');
                return false;
            }
        }
        
        // Load the user's details
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeId: employeeId
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                // Set the user status
               // let status = 'Active';
               // if( response.user.isActive == false ) status = 'Inactive';

                // Insert the employee into the grid
                employeesGrid.addRows([
                    {
                        id: employeeId,
                        name: response.employee.alias,
                        email: response.employee.emailAddress,
                        cellphone: response.employee.cellNumber,
                        //status: status,
                        remove: 'Remove'
                    }
                ]);
                
                // Clear the select
                employeeAddSelect.setValue(null, '');
                confirmDestroy = true;
            }
        });
    }

    // employeesGrid cell click event handler
    function employeesGridCellClickEventHandler(event) {
        // Depending on the column clicked
        if( employeesGrid.getColumnDataIndex(event.columnIndex) === 'remove' ) {
            let employeeId = event.srcComponent.getRow(event.rowIndex).id;
        
            // Find and remove the selected employee
            for (let i = 0; i < employeesGrid.getRowCount(); i++) {
                let rowDetails = employeesGrid.getRow(i);
                if( rowDetails.id === employeeId ) {
                    employeesGrid.removeRow(i);
                    confirmDestroy = true;
                    break;
                }
            }
        }
    }

    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        app.route.popState();
    }

    // Add button click event handler
    function saveBtnClickEventHandler() {
        if( tagNameTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter the tag name');
            return;
        }
        
        let employees = [];
        for( let i = 0; i < employeesGrid.getRowCount(); i++ ) {
            let rowDetails = employeesGrid.getRow(i);
            employees.push({ id: rowDetails.id });
        }

        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Tags&fn=update',
            data: {
                id: tagsId,
                name: tagNameTxt.getValue().trim(),
                employees: employees
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                saveBtn.hideLoader();
                saveBtn.enable();
                
                let response = '';
                try {
                    response = JSON.parse(responseText);
                }
                catch( error ) {
                    new lx.component.Messagebox({
                        title: 'Editing Tag Failed',
                        message: 'Failed to read server response.'
                    });
                    return;
                }
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                confirmDestroy = false;
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }

    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};