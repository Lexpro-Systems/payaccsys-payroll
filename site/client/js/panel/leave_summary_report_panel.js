/* globals app, lx */
'use strict';


// LEAVE SUMMARY REPORT PANEL
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
app.panel.LeaveSummaryReport = function(config) {
    
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
    var leaveTypeSelect = null;
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
    
    
    function loadLeaveSummary() {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Types Failed',
                        message: response.error
                    });
                }
                
                var leaveTypes = [];
                for( var i = 0; i < response.leaveTypes.length; i++ ) {
                    leaveTypes.push({
                        value: response.leaveTypes[i].id,
                        text: response.leaveTypes[i].name
                    });
                }
                
                leaveTypeSelect.addItems( leaveTypes );
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
            innerHTML: 'Leave Summary Report'
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
        
        // Create leaveTypeSelect component
        leaveTypeSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '400px',
            label: 'Leave Types',
            
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
            
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        startDate.setValue(year + '-' + month + '-' + day);
        
        month = '' + (lastDay.getMonth() + 1);
        day = '' + lastDay.getDate();
        year = lastDay.getFullYear();
            
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
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
                {name: 'Code', dataIndex: 'code', width: '100px', padding: '0px 0px 0px 20px'},
                {name: 'Name', dataIndex: 'name', type: 'button'},
                {name: 'Starting Balance', dataIndex: 'startingBalance', width: '120px', alignment: 'right'},
                {name: 'Leave Accrued', dataIndex: 'leaveAccrued', width: '120px', alignment: 'right'},
                {name: 'Adjustment', dataIndex: 'adjustment', width: '120px', alignment: 'right'},
                {name: 'Leave Taken', dataIndex: 'leaveTaken', width: '120px', alignment: 'right'},
                {name: 'Closing Balance', dataIndex: 'closingBalance', width: '120px', alignment: 'right'},
            ],
            
            onCellClick: resultGridCellClickEventHandler
        });
        
        loadLeaveSummary();
        
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
    
    function resultGridCellClickEventHandler ( event ) {
        if( event.columnIndex === 1 ) {
            
            if (event.record.employeeId === null) {
                return;
            }
            
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                employeeId: event.record.employeeId,
                employeeName: event.record.name
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
    
    function exportExcelBtnOnClickEventHandler () {
        
        if( leaveTypeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No leave type selected.',
                message: 'Please select a leave type.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runLeaveSummaryReport',
            target: '_self',
            data: {
                format: 'xls',
                leaveTypeId: leaveTypeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    
    function exportCsvBtnOnClickEventHandler () {
        if( leaveTypeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No leave type selected.',
                message: 'Please select a leave type.'
            });
            return;
        }
        
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runLeaveSummaryReport',
            target: '_self',
            data: {
                format: 'csv',
                leaveTypeId: leaveTypeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            }
        });
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Do sanity checks
        if( leaveTypeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No leave type selected.',
                message: 'Please select a leave type.'
            });
            return;
        }
        
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runLeaveSummaryPdfReport',
            target: '_blank',
            data: {
                leaveTypeId: leaveTypeSelect.getValue(),
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
        if (leaveTypeSelect.getValue() == null) {
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getLeaveSummaryList',
            data: {
                leaveTypeId: leaveTypeSelect.getValue(),
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Summary failed',
                        message: response.error
                    });
                }
                
                var leaveSummary = [];
                for( var i = 0; i < response.leaveSummary.length; i++ ) {
                    
                    let accrued = '-';
                    let adjustment = '-';
                    let leaveTaken = '-';
                    
                    for (var b = 0; b < response.leaveSummary[i].leave.length; b++) {
                        if (response.leaveSummary[i].leave[b].code === 'LEAR') {
                            accrued = response.leaveSummary[i].leave[b].amount;
                            accrued = parseFloat(accrued).toFixed(2)  + ' ' + response.leaveSummary[i].leaveTypeUnit;
                        }
                        if (response.leaveSummary[i].leave[b].code === 'ADJU') {
                            adjustment = response.leaveSummary[i].leave[b].amount;
                            adjustment = parseFloat(adjustment).toFixed(2)  + ' ' + response.leaveSummary[i].leaveTypeUnit;
                        }
                        if (response.leaveSummary[i].leave[b].code === 'LTAK') {
                            leaveTaken = response.leaveSummary[i].leave[b].amount;
                            leaveTaken = parseFloat(leaveTaken).toFixed(2)  + ' ' + response.leaveSummary[i].leaveTypeUnit;
                        }
                    }
                    
                    let startingBalance = parseFloat(response.leaveSummary[i].startingBalanceAmount).toFixed(2)  + ' ' + response.leaveSummary[i].leaveTypeUnit;
                    if (response.leaveSummary[i].startingBalanceAmount === null) {
                        startingBalance = '0.00';
                    }
                    
                    let closingBalance = parseFloat(response.leaveSummary[i].closingBalanceAmount).toFixed(2)  + ' ' + response.leaveSummary[i].leaveTypeUnit;
                    if (response.leaveSummary[i].closingBalanceAmount === null) {
                        closingBalance = '0.00';
                    }
                    leaveSummary.push({
                        employeeId: response.leaveSummary[i].id,
                        code: response.leaveSummary[i].code,
                        name: response.leaveSummary[i].alias,
                        startingBalance: startingBalance,
                        leaveAccrued: accrued,
                        adjustment: adjustment,
                        leaveTaken: leaveTaken,
                        closingBalance: closingBalance,
                    });
                }
                
                resultGrid.clear();
                resultGrid.addRows( leaveSummary );
            }
        });
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};