/* globals app, lx */
'use strict';

// UIF REPORT PANEL
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

app.panel.UI19Report = function(config){

    /**************************
     PRIVATE VARIABLES
    **************************/
    
/* This is where all of the UI19Report.js files variables are initialized */

    var me = this;
    var confirmDestroy = null;
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var menuSpacer = null;
    var loader = null;
    var filterSectionEl = null;

    var departmentSelect = null;
    var employeeStatusSelect = null;
    var employmentStartDate = null;
    var employmentEndDate = null;
    
    var employeesGrid = null;
    
    /**************************
     OBJECT EXTENSIONS
    **************************/
    
    /*This inbuilt library function allows this JS file to be loaded as an object on the index.html*/
    lx.EventEmitter.call(this); //Location: LibLX
    
    /**************************
     PRIVATE FUNCTIONS
    **************************/
    
    /* This function retrieves all of the employee details from the database to be used in the JS file */
    function loadEmployees( clearGrid ) {

        //Resets the grid layout for the entire page
        let offset = 0;
        if( !clearGrid ) offset = employeesGrid.getRowCount();
        
        /*This sends initial data to the getEmployeeDetailsList function in the Report.php, which is responsable for
          executing the database logic and returning the result*/
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEmployeeDetailsList', //Location: Report.php, Line: 745
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
                         loader.hide();
                         var response = JSON.parse(responseText); // parses the result and stores it in the response variables
                        
                         // if results failed than displays error messages
                         if( response.ok !== true ){ 
                             new lx.component.Messagebox({title: 'Loading Employees Failed', message: response.error});
                           }
                
                         var employees = [];

                         /* loops throught the response and loads the nessessery data into the employees array. */
                         for( var i = 0; i < response.employees.length; i++ ) {
                             let employmentDate = response.employees[i].employmentStartDate + ' to ' + response.employees[i].employmentEndDate;

                             if (response.employees[i].employmentEndDate === null) {
                                 employmentDate = response.employees[i].employmentStartDate + ' to present';
                                }

                             employees.push({
                                 id: response.employees[i].id,
                                 code: response.employees[i].code,
                                 name: response.employees[i].alias,
                                // firstname: response.employees[i].firstName,
                                // lastname: response.employees[i].lastName,
                                 email: response.employees[i].emailAddress,
                                 cellphone: response.employees[i].cellNumber,
                                 department: response.employees[i].departmentName,
                                 employmentStatus: response.employees[i].employmentStatus,
                                 employmentDate: employmentDate,
                                 id_numba: response.employees[i].id_numba,
                                 wage_type: response.employees[i].wage_type,
                                 wage_tariff: response.employees[i].wage_tariff,
                                 total_earnings: response.employees[i].total_earnings,
                                 menu: '<i class="fa fa-ellipsis-v"></i>',
                                 spacer: '|'
                                });
                            }
                        for (let i = 0; i < 4; i++) {
                        employees.push({
                            id: '',
                            code: '',
                            name: '',
                            email: '',
                            cellphone: '',
                            department: '',
                            employmentStatus: '',
                            employmentDate: '',
                            menu: '',       // no menu icon on empty rows
                            spacer: ''
                        });
                    }
                         // Clears the grid if the codition is met.
                         if( clearGrid ) employeesGrid.clear();
                         employeesGrid.addRows( employees );
                        }
        });
    }
    
    /* This retrieves all of the departments form the database. */
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
    
    
      /**************************
       PUBLIC FUNCTIONS
      **************************/
    

    /*This loades all of the components which will be used to create the UI19 web page.*/
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
        /* This removes(destroys) the components of the previous page, making it ready to load the IU19 page */
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        //This basicaly sets the main container for the index.html in which the components will be loaded.
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                width: '100%',
                height: '100%',
                overflow: 'auto',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 0px 0px'
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

        //Creates the departments dropdown filter
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
                loadDepartments(); //Location: this file, Line:121
            },
            onListScrollEnd: function() {
                loadDepartments();//Location: this file, Line:121
            },
            onChange: filterOnChangeEventHandler //location: this file, line: 486
        });
        
        // This resets the departments dropdown to display "All Departments"
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
            
           /*items: [
                {text: 'All Employees', value: 'all'},
                {text: 'Employed Only', value: 'employed'},
               {text: 'Dismissed Only', value: 'dismissed'}
            ],*/
            
            onChange: filterOnChangeEventHandler //location: this file, line: 486
        });
        employeeStatusSelect.setValue('dismissed', 'Dismissed Only');
        
        // Create employeeStatusSelect component
        employmentStartDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            label: 'Employment Start Date',
            
            onChange: filterOnChangeEventHandler//location: this file, line: 486
        });
        
        // Create employeeStatusSelect component
        employmentEndDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            label: 'Employment End Date',
            
            onChange: filterOnChangeEventHandler //location: this file, line: 486
        });

        // Create PdfActionMenu  array
        var PdfActionMenu = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download', value: 'download'},
            {name: '<i class="fas fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email To', value: 'emailTo'}
        ];
        
        //
        // RESULT GRID
        //
        // 2025-06-19 Ray King - Report additions new columns
        /* This displays all of the employee details retrieved from the DB in a grid. */
        employeesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
               { dataIndex: 'id', name: '', width: '0px',minWidth: '0px',maxWidth: '0px',padding: '0px',hidden: true},
                {dataIndex: 'code', name: 'Code', width: '100px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'name', name: 'Name', type: 'button'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '130px'},
                {dataIndex: 'department', name: 'Department', minWidth: '150px', maxWidth: '250px'},
                {dataIndex: 'employmentStatus', name: 'Status', width: '100px'},
                {dataIndex: 'employmentDate', name: 'Employment Period', width: '180px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: PdfActionMenu, width: '50px', alignment: 'center'},
            ],
            onScrollEnd: employeesGridScrollEndEventHandler, //Location: this file, line:483
            onCellClick: employeesGridCellClickEventHandler, //Location: this file, line:487

            // This adds clickEvents to my PdfActionMenu options.
             onMenuItemClick: function( clickEvent ) {

               var rowData = employeesGrid.getRow(clickEvent.rowIndex);
               var employeeId = rowData.id;
               var employeeEmail = rowData.email;
               var name = rowData.name;
               if( clickEvent.value === 'view' ) {
                viewUI19Pdf(employeeId); // Location: this file, line: 515
                }else if(clickEvent.value === 'download'){ 
                downloadUI19Pdf(employeeId);
                }
                else if (clickEvent.value === 'emailTo') { 
                emailUI19Pdf(employeeId,employeeEmail,name); 
                }
            } 
        });
                
        loadEmployees( true ); //Location: this file, Line: 58
        loadDepartments(); //Location: this file, Line:121
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
    
    /*Reloads all employees after it has been filtered */
    function filterOnChangeEventHandler (){
        loadEmployees( true ); //Location: this file, Line: 58
    }
    
    // titleBackEl click event handler
    /* Allows this page to navigate to the previuos page */
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    /*Prevents the employees from reloading after scrolling through the list of employees */
    function employeesGridScrollEndEventHandler() {
        loadEmployees( true ); //Location: this file, Line: 58
    }
    
    // This loads another page when you click on the employees name, containing all of the employees details.
    function employeesGridCellClickEventHandler( event ) {
        
        if( employeesGrid.getColumnDataIndex( event.columnIndex ) === 'name' ) {
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({ //location: js/panel/view_employee_panel.js
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: event.record.id,
                employeeName: event.record.name,
                
                onDestroy: function( event ) {
                    if( event.refreshEmployees === true ) {
                        loadEmployees( true ); //Location: this file, Line: 58
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
    // Loads the pdf in the browser when the "view" option is clicked
    function viewUI19Pdf(employeeId){

        lx.sendForm({
            url: 'exec.php?c=Report&fn=runUI19Details', // Location: php/controllers/Report.php , line: 5292
            target: '_blank', // opens a blank(new) tab in the browser to display the pdf.
            data: {
                employeeId: employeeId,
                 mode: 'view' // tell PHP we want to view
            }
        });

    }

    // Download function
    function downloadUI19Pdf(employeeId){
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runUI19Details',
            target: '_blank', // can also be _self if you want
            data: {
                employeeId: employeeId,
                mode: 'download' // tell PHP we want to download
            }
        });
    }
    function emailUI19Pdf(employeeId,employeeEmail,name){
       var mailToModal = new lx.component.ModalWindow({
        margin: '40px',
        maxWidth: '450px',
        maxHeight: '232px'
        });

        var mailToPanel = new app.panel.MailTo({
            renderTo: mailToModal.getContainer(),
            show: true,
            ui19EmployeeId: employeeId,
            emailAddress: employeeEmail,
            onCancel: function() {
                app.route.popState();
            },

            onSend: function() {
                app.route.popState();

                new lx.component.Messagebox({
                    title: 'Email UI19',
                    message: 'UI19 was emailed successfully.'
                });
            }
        });

        mailToModal.addEventListener('destroy', function() {
            mailToPanel.destroy();
        });

        var state = { modal: mailToModal };
        app.route.pushState(state, function(state) {
            state.modal.destroy();
        });

        mailToModal.show();
        mailToPanel.focus();
    }
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
}

