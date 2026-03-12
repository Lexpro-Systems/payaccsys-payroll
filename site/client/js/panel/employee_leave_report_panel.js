/* globals app, lx */
'use strict';


// EMPLOYEE LEAVE REPORT PANEL
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
app.panel.EmployeeLeaveReport = function(config) {
    
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
    var employeeSelect = null;
    var startDate = null;
    var endDate = null;
    
    var resultGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load employees
    function loadEmployees( srcSelect ) {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: srcSelect.getSearchString(),
                limit: 20,
                offset: srcSelect.getItemCount(),
                sortList: [
                    {'dataIndex': 'name', 'order': 'ASC'}
                ]
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
                        text: 
                            '<div class="flex-row" style="width=100%; overflow: hidden;">' + 
                                '<div class="flex-resize" style="overflow: hidden; text-overflow: ellipsis; ' +
                                'margin: 0px 5px 0px 0px;">' +
                                    response.employees[i].alias +
                                '</div>' +
                                '<div class="flex-noresize" style="overflow: hidden; text-overflow: ellipsis; ' +
                                'margin: 0px 5px 0px 0px;">' +
                                response.employees[i].code + 
                                '</div>' +
                            '</div>'
                    });
                }
                
                srcSelect.addItems( employees );
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
            innerHTML: 'Employee Leave Report'
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
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
        
        // Create employeeSelect component
        employeeSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Employee',
            maxWidth: '400px',
            margin: '0px 0px 0px 20px',
            search: true,
            
            onSearch: function() {
                employeeSelect.clear();
                loadEmployees( employeeSelect );
            },
            
            onListScrollEnd: function() {
                loadEmployees( employeeSelect );
            },
            
            onChange: filterOnChangeEvent
        });
        
        startDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'Start Date',
            width: '250px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEvent
        });
        
        endDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'End Date',
            width: '250px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEvent
        });
        
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        var month = '' + (firstDay.getMonth() + 1);
        var day = '' + firstDay.getDate();
        var year = firstDay.getFullYear();
            
        if(month.length < 2) {
            month = '0' + month;
        }
        if(day.length < 2) {
            day = '0' + day;
        }
        startDate.setValue(year + '-' + month + '-' + day);
        
        month = '' + (lastDay.getMonth() + 1);
        day = '' + lastDay.getDate();
        year = lastDay.getFullYear();
            
        if(month.length < 2) {
            month = '0' + month;
        }
        if(day.length < 2) {
            day = '0' + day;
        }
        endDate.setValue(year + '-' + month + '-' + day);
        
        //
        // RESULT GRID
        //
        
        resultGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                {name: 'Leave Type', dataIndex: 'leaveType', padding: '0px 0px 0px 20px'},
                {name: 'Starting Balance', dataIndex: 'startingBalance', width: '120px', alignment: 'right'},
                {name: 'Leave Accrued', dataIndex: 'leaveAccrued', width: '120px', alignment: 'right'},
                {name: 'Adjustment', dataIndex: 'adjustment', width: '120px', alignment: 'right'},
                {name: 'Leave Taken', dataIndex: 'leaveTaken', width: '120px', alignment: 'right'},
                {name: 'Closing Balance', dataIndex: 'closingBalance', width: '120px', alignment: 'right'},
            ],
            
            onCellClick: resultGridCellClickEventHandler
        });
        
        loadEmployees( employeeSelect );
        
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
    
    function resultGridCellClickEventHandler() {
        // Nothing to do here
    }
    
    function exportExcelBtnOnClickEventHandler () {
        if( employeeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeeLeaveReport',
            target: '_self',
            data: {
                format: 'xls',
                employeeId: employeeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    
    function exportCsvBtnOnClickEventHandler () {
        if( employeeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeeLeaveReport',
            target: '_self',
            data: {
                format: 'csv',
                employeeId: employeeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Do sanity checks
        if( employeeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No employee selected',
                message: 'Please select an employee.'
            });
            return;
        }
        
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runEmployeeLeavePdfReport',
            target: '_blank',
            data: {
                employeeId: employeeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    function filterOnChangeEvent() {
        if(employeeSelect.getValue() == null) {
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getEmployeeLeaveList',
            data: {
                employeeId: employeeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Leave Details Failed',
                        message: response.error
                    });
                    return;
                }
                
                var employeeLeave = [];
                for( var i = 0; i < response.employeeLeave.length; i++ ) {
                    let accrued = parseFloat(response.employeeLeave[i].accrued).toFixed(2)  + ' ' + response.employeeLeave[i].leaveTypeUnit.charAt(0);
                    if(response.employeeLeave[i].accrued === null || response.employeeLeave[i].accrued === 0) {
                        accrued = '-';
                    }
                    
                    let adjustment = parseFloat(response.employeeLeave[i].adjustment).toFixed(2)  + ' ' + response.employeeLeave[i].leaveTypeUnit.charAt(0);
                    if(response.employeeLeave[i].adjustment === null || response.employeeLeave[i].adjustment === 0) {
                        adjustment = '-';
                    }
                    
                    let leaveTaken = parseFloat(response.employeeLeave[i].leaveTaken).toFixed(2)  + ' ' + response.employeeLeave[i].leaveTypeUnit.charAt(0);
                    if(response.employeeLeave[i].leaveTaken === null || response.employeeLeave[i].leaveTaken === 0) {
                        leaveTaken = '-';
                    }
                    
                    let startingBalance = parseFloat(response.employeeLeave[i].startingBalance).toFixed(2)  + ' ' + response.employeeLeave[i].leaveTypeUnit.charAt(0);
                    if(response.employeeLeave[i].startingBalanceAmount === null) {
                        startingBalance = '0.00';
                    }
                    
                    let closingBalance = parseFloat(response.employeeLeave[i].closingBalance).toFixed(2)  + ' ' + response.employeeLeave[i].leaveTypeUnit.charAt(0);
                    if(response.employeeLeave[i].closingBalanceAmount === null) {
                        closingBalance = '0.00';
                    }
                    
                    employeeLeave.push({
                        leaveTypeId: response.employeeLeave[i].leaveTypeId,
                        leaveType: response.employeeLeave[i].leaveType,
                        startingBalance: startingBalance,
                        leaveAccrued: accrued,
                        adjustment: adjustment,
                        leaveTaken: leaveTaken,
                        closingBalance: closingBalance
                    });
                }
                
                resultGrid.clear();
                resultGrid.addRows( employeeLeave );
            }
        });
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};