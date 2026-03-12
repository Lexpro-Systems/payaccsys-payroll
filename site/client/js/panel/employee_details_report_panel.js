/* globals app, lx */
'use strict';

// EMPLOYEE DETAILS REPORT PANEL
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
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.EmployeeDetailsReport = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var filterSectionEl = null;
    var departmentSelect = null;
    var employeeStatusSelect = null;
    var employmentStartDate = null;
    var employmentEndDate = null;
    
    var employeesGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    function loadEmployees( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = employeesGrid.getRowCount();
        
        
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEmployeeDetailsList',
            data: {
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                employeeStatus: employeeStatusSelect.getValue(),
                departmentId: departmentSelect.getValue(),
                employmentStartDate: employmentStartDate.getValue(),
                employmentEndDate: employmentEndDate.getValue()
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
    
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: departmentSelect.getSearchString(),
                limit: 10,
                offset: departmentSelect.getItemCount() -1,
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                    
                }
                departmentSelect.addItems( departments );
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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
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
            innerHTML: 'Employee Details Report'
        });
        
        // Create the exportExcelBtn component
        exportExcelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Excel Export',
            width: '130px',
            margin: '0px 0px 0px auto',
            
            onClick: exportExcelBtnOnClickEventHandler
        });
        
        // Create the exportCsvBtn component
        exportCsvBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'CSV Export',
            width: '130px',
            margin: '0px 0px 0px 20px',
            
            onClick: exportCsvBtnOnClickEventHandler
        });
        
        // Create the exportPdfBtn component
        exportPdfBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'PDF Export',
            width: '130px',
            margin: '0px 20px 0px 20px',
            
            onClick: exportPdfBtnOnClickEventHandler
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
                overflow: 'auto'
            }
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row'
            }
        });
        
        departmentSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            maxWidth: '200px',
            height: '32px',
            margin: '0px 20px 0px 0px',
            label: 'Departments',
            
            search: true,
            
            onSearch: function() {
                departmentSelect.clear();
                var departments = [];
                departments.push({
                    value: null,
                    text: 'All Departments'
                });
                departmentSelect.addItems( departments );
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                loadDepartments();
            },
            
            onChange: filterOnChangeEventHandler
        });
        
        var departments = [];
        departments.push({
            value: null,
            text: 'All Departments'
        });
        departmentSelect.addItems( departments );
        departmentSelect.setValue(null, 'All Departments');
        
        // Create employeeStatusSelect component
        employeeStatusSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            height: '32px',
            margin: '0px 20px 0px 0px',
            label: 'Employment Status',
            
            items: [
                {text: 'All Employees', value: 'all'},
                {text: 'Employed Only', value: 'employed'},
                {text: 'Dismissed Only', value: 'dismissed'}
            ],
            
            onChange: filterOnChangeEventHandler
        });
        employeeStatusSelect.setValue('employed', 'Employed Only');
        
        // Create employeeStatusSelect component
        employmentStartDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            label: 'Employment Start Date',
            
            onChange: filterOnChangeEventHandler
        });
        
        // Create employeeStatusSelect component
        employmentEndDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            label: 'Employment End Date',
            
            onChange: filterOnChangeEventHandler
        });
        
        //
        // RESULT GRID
        //
        
        employeesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'name', name: 'Name', type: 'button'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '130px'},
                {dataIndex: 'department', name: 'Department', minWidth: '150px', maxWidth: '250px'},
                {dataIndex: 'employmentStatus', name: 'Status', width: '100px'},
                {dataIndex: 'employmentDate', name: 'Employment Period', width: '180px'}
            ],
            
            onScrollEnd: employeesGridScrollEndEventHandler,
            onCellClick: employeesGridCellClickEventHandler
        });
        
        loadEmployees( true );
        loadDepartments();
        
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
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    function filterOnChangeEventHandler (){
        loadEmployees( true );
    }
    
    function exportExcelBtnOnClickEventHandler () {
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeesDetailsReport',
            target: '_self',
            data: {
                format: 'xls',
                sortOrder: 'ASC',
                employeeStatus: employeeStatusSelect.getValue(),
                departmentId: departmentSelect.getValue(),
                employmentStartDate: employmentStartDate.getValue(),
                employmentEndDate: employmentEndDate.getValue()
            }
        });
    }
    
    function exportCsvBtnOnClickEventHandler () {
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeesDetailsReport',
            target: '_self',
            data: {
                format: 'csv',
                sortOrder: 'ASC',
                employeeStatus: employeeStatusSelect.getValue(),
                departmentId: departmentSelect.getValue(),
                employmentStartDate: employmentStartDate.getValue(),
                employmentEndDate: employmentEndDate.getValue()
            }
        });
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeesDetailsPdfReport',
            target: '_blank',
            data: {
                sortOrder: 'ASC',
                employeeStatus: employeeStatusSelect.getValue(),
                departmentId: departmentSelect.getValue(),
                employmentStartDate: employmentStartDate.getValue(),
                employmentEndDate: employmentEndDate.getValue()
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    function employeesGridScrollEndEventHandler() {
        loadEmployees( false );
    }
    
    function employeesGridCellClickEventHandler( event ) {
        
        if( employeesGrid.getColumnDataIndex( event.columnIndex ) === 'name' ) {
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: event.record.id,
                employeeName: event.record.name,
                
                onDestroy: function( event ) {
                    if( event.refreshEmployees === true ) {
                        loadEmployees( true );
                    }
                }
            });
            
            var panelState = {
                previousPanel: me,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};