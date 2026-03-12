/* globals app, lx */
'use strict';


// LEAVE TYPE HISTORY PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.LeaveTypeHistory = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var centeredContainerEl = null;
    
    var filterContainerEl = null;
    var fromDateFilter = null;
    var toDateFilter = null;
    
    var leaveBalanceContainerEl = null;
    var leaveBalanceHeadingContainerEl = null;
    var leaveBalanceHeadingEl = null;
    var leaveBalanceSectionEl = null;
    var leaveBalanceMessageEl = null;
    var leaveBalanceGrid = null;
    
    let leaveTypeId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load leave balances
    function loadLeaveDetails( clearResults ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeHistory',
            data: {
                leaveTypeId: leaveTypeId,
                startDate: fromDateFilter.getValue(),
                endDate: toDateFilter.getValue(),
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Display a message if there isn't any leave history
                if( (response.leave.length < 1) && clearResults ) {
                    leaveBalanceMessageEl.style.display = 'block';
                    leaveBalanceSectionEl.style.display = 'none';
                    return;
                }
                // leaveBalanceHeadingContainerEl.style.display = 'flex';
                leaveBalanceMessageEl.style.display = 'none';
                leaveBalanceSectionEl.style.display = 'flex';
                
                // Format leave for the grid
                let leave = [];
                for( let i = 0; i < response.leave.length; i++ ) {
                    if (response.leave[i].date === null) {
                        continue;
                    }
                    
                    let unit = '';
                    let unitType = '';
                    if(response.leave[i].leaveUnitCode === 'DAYS') {
                        unit = response.leave[i].days + ' Days';
                        unitType = 'd';
                    }
                    else if (response.leave[i].leaveUnitCode === 'HOUR') {
                        unit = response.leave[i].hours + ' Hours';
                        unitType = 'h';
                    }
                    
                    let units = lx.util.formatLeaveUnits(unit, unitType);
                    let balance = lx.util.formatLeaveUnits(response.leave[i].balance, unitType);
                    if(response.leave[i].date === null) {
                        units = '';
                        balance = '';
                    }
                    
                    leave.push({
                        description: response.leave[i].description,
                        date: response.leave[i].date,
                        source: response.leave[i].leaveSourceTypesName,
                        unit: units,
                        balance: balance
                    });
                    
                }
                
                // Should leave balances be cleared?
                if( clearResults ) {
                    leaveBalanceGrid.clear();
                }
                leaveBalanceGrid.addRows(leave);
            }
        });
    }
    
    // Convert time in seconds to string format
    function secondsToTime( seconds ) {
        seconds = Number(seconds);
        // let d = Math.floor(seconds / (3600*24));
        // let h = Math.floor(seconds % (3600*24) / 3600);
        let h = Math.floor(seconds / 3600) + (Math.floor(seconds % 3600 / 60) / 60);
        // let m = Math.floor(seconds % 3600 / 60);
        // let s = Math.floor(seconds % 60);
        
        var time = '';
        
        // if( d > 0 ) {
        //     let value = ' days';
        //     if( d == 1 ) value = ' day';
        //     time = time + d + value;
        // }
        
        if( h > 0 ) {
            let value = ' hours';
            if( h == 1 ) value = ' hour';
            if( time !== '' ) time = time + ', ';
            time = time + h.toFixed(2) + value;
        }
        
        // if( m > 0 ) {
        //     let value = ' minutes';
        //     if( m == 1 ) value = ' minute';
        //     if( time !== '' ) time = time + ' and ';
        //     time = time + m + value;
        // }
        
        // if( s > 0 ) {
        //     let value = ' seconds';
        //     if( s == 1 ) value = ' second';
        //     if( time !== '' ) time = time + ', ';
        //     time = time + s + value;
        // }
        
        return time;
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            leaveTypeId: null,
            leaveTypeName: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('leaveTypeId') ) leaveTypeId = compConfig.leaveTypeId;
        
        // Initialize state
        confirmDestroy = false;
        
        // Clear the background color of the container to show the backgroun image
        me.getContainer().style.backgroundColor = '';
        
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
                // backgroundColor: app.panelBackgroundColor
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
            innerHTML: '<i class="fa fa-fw fa-history" style="margin: 0px 15px 0px 0px;"></i>' + compConfig.leaveTypeName + ' History'
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
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px',
                // backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the centeredContainerEl component
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '768px',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                margin: '0px auto',
                overflow: 'hidden'
            }
        });
        
        
        //
        // LEAVE BALANCE SECTION
        //
        
        // Create the leaveBalanceContainerEl element
        leaveBalanceContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                // backgroundColor: '#FFFFFF',
                overflow: 'hidden',
                flex: '1 1 100%',
            }
        });
        
        // Create the leaveBalanceHeadingContainerEl element
        leaveBalanceHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '768px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Create the leaveBalanceHeadingEl element
        leaveBalanceHeadingEl = lx.createElement('DIV', {
            parent: leaveBalanceHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Leave History</div>'
        });
        
        // Create the menu dropdown button
        var menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: leaveBalanceHeadingContainerEl,
            margin: 'auto 15px auto 15px',
            label: '<i class="fa fa-ellipsis-v" style="color: #FFFFFF"></i>',
            dropdownAlignment: 'right'
        });
        
        // Create the menuDropDownBtnExportEl element
        var menuDropDownBtnExportEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '100px',
                padding: '10px 10px',
                color: lx.style.global.color,
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-file-download" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Export</span>'
        });
        menuDropDownBtnExportEl.addEventListener('click', menuDropDownBtnExportElClickEventHandler);
        
        
        //
        // FILTERS SECTION
        //
        
        // Create the filterContainerEl component
        filterContainerEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'stretch',
                justifyContent: 'space-around',
                // display: 'flex',
                // flexDirection: 'column',
                // // flex: '1 1 auto',
                // justifyContent: 'flex-around',
                // alignItems: 'center',
                width: '100%',
                padding: '0px 10px 5px 10px',
                backgroundColor: app.filterBackgroundColor,
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '0px 1px 0px 1px'
            }
        });
        
        // Create the fromDateFilter component
        fromDateFilter = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            margin: '5px 10px 0px 0px',
            label: 'From:',
            labelAlign: 'left',
            labelWidth: '40px',
            flex: '1 1 100%',
            maxWidth: '280px',
            
            onChange: filterOnChangeEventHandler
        });
        
        // Create the toDateFilter component
        toDateFilter = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            margin: '5px 10px 0px 0px',
            label: 'To:',
            labelAlign: 'left',
            labelWidth: '40px',
            flex: '1 1 100%',
            maxWidth: '280px',
            
            onChange: filterOnChangeEventHandler
        });
        
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        let firstDay = new Date(Date.UTC(year, month, + 1)).toISOString().slice(0, 10);
        let lastDay = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
        fromDateFilter.setValue(firstDay);
        toDateFilter.setValue(lastDay);
        
        
        //
        //
        //
        
        // Create the leaveBalanceMessageEl element
        leaveBalanceMessageEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '15px',
                fontSize: '14px',
                color: 'lx.style.global.color',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '0px 1px 1px 1px',
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                width: '100%',
                maxWidth: '900px',
                display: 'none'
            },
            innerHTML: 'No leave history to display.'
        });
        
        // Create the leaveBalanceSectionEl element
        leaveBalanceSectionEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '5px 5px 5px 5px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        // Create the leaveBalanceGrid component
        leaveBalanceGrid = new lx.component.Grid({
            renderTo: leaveBalanceSectionEl,
            height: '100%',
            flex: '1 1 100%',
            autoSize: false,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'date', name: 'Date', width: '90px', padding: '0px 0px 0px 15px'},
                {dataIndex: 'description', name: 'Description', minWidth: '100px'},
                // {dataIndex: 'source', name: 'Source', width: '120px'},
                {dataIndex: 'unit', name: 'Amount', maxWidth: '100px', alignment: 'right'},
                {dataIndex: 'balance', name: 'Balance', maxWidth: '100px', alignment: 'right', padding: '0px 15px 0px 0px'}
            ],
            
            onCellClick: leaveBalanceGridCellClickEventHandler
        });
        
        // Load the leave balances
        loadLeaveDetails( true );
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
    
    // Function to set focus to the panel.
    me.focus = function() {
        fromDateFilter.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // Filter change event handler
    function filterOnChangeEventHandler() {
        loader.show( true );
        loadLeaveDetails(true);
    }
    
    // Menu dropdown button export click event handler
    function menuDropDownBtnExportElClickEventHandler() {
        // Create the add leave request panel
        let exportLeavePanel = new app.panel.ExportLeaveHistory({
            maxWidth: '500px',
            maxHeight: '377px',
            margin: '10px 10px 10px 10px',
            
            leaveTypeId: leaveTypeId,
            startDate: fromDateFilter.getValue(),
            endDate: toDateFilter.getValue(),
            
            onCancel: function() {
                app.route.popState();
            },
            
            onExport: function() {
                app.route.popState();
            }
        });
        
        // Set and push the state
        let state = {
            panel: exportLeavePanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Display the home panel
        exportLeavePanel.showModal();
        exportLeavePanel.focus();
    }
    
    // Leave grid cell click event handler
    function leaveBalanceGridCellClickEventHandler( event ) {
        if( leaveBalanceGrid.getColumnDataIndex( event.columnIndex ) === 'timeIn' ) {
            me.hide();
            
            let viewLeavePanel = new app.panel.ViewLeave({
                renderTo: app.mainPanel.getPanelContainer(),
                leaveId: event.record.id
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewLeavePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            viewLeavePanel.show();
            viewLeavePanel.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};