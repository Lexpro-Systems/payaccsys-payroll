/* globals app, lx */
'use strict';


// ATTENDANCE PANEL
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
app.panel.Attendance = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var centeredContainerEl = null;
    
    var filterContainerEl = null;
    var fromDateFilter = null;
    var toDateFilter = null;
    
    var attendanceDetailsContainerEl = null;
    var attendanceDetailsHeadingContainerEl = null;
    var attendanceDetailsHeadingEl = null;
    var attendanceDetailsSectionEl = null;
    var attendanceDetailsMessageEl = null;
    var attendanceGrid = null;
    var attendanceTotalEl = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load attendance balances
    function loadAttendanceDetails( clearResults ) {
        loader.show( false );
        
        // Get the attendance balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=getList',
            data: {
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
                        title: 'Loading Attendance Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Display a message if there isn't any attendance history
                if( (response.attendance.length < 1) && clearResults ) {
                    attendanceDetailsMessageEl.style.display = 'block';
                    attendanceDetailsSectionEl.style.display = 'none';
                    attendanceTotalEl.style.display = 'none';
                    return;
                }
                // attendanceDetailsHeadingContainerEl.style.display = 'flex';
                attendanceDetailsMessageEl.style.display = 'none';
                attendanceDetailsSectionEl.style.display = 'flex';
                attendanceTotalEl.style.display = 'block';
                
                // Format attendance for the grid
                let attendance = [];
                let totatlTime = 0;
                for( let i = 0; i < response.attendance.length; i++ ) {
                    let timeOut = '-';
                    if( response.attendance[i].timeOut !== '' ) {
                        timeOut =response.attendance[i].timeOut;
                    }
                    
                    let time = '-';
                    if( response.attendance[i].time !== '' ) {
                        time = response.attendance[i].time;
                    }
                    
                    attendance.push({
                        id: response.attendance[i].attendanceId,
                        timeIn: response.attendance[i].timeIn,
                        timeOut: timeOut,
                        time: time
                    });
                    totatlTime = totatlTime + Number(response.attendance[i].interval);
                }
                
                // Should attendance balances be cleared?
                if( clearResults ) {
                    attendanceGrid.clear();
                }
                attendanceGrid.addRows(attendance);
                
                // Was a total time calculated?
                if( totatlTime > 0 ) {
                    attendanceTotalEl.innerHTML = 'Total Time: <b>' + secondsToTime(totatlTime) + '</b>';
                }
                else {
                    attendanceTotalEl.innerHTML = '';
                }
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
                borderColor: app.filterBackgroundColor,
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-clock" style="margin: 0px 15px 0px 0px;"></i>Attendance History'
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
        // ATTENDANCE BALANCE SECTION
        //
        
        // Create the attendanceDetailsContainerEl element
        attendanceDetailsContainerEl = lx.createElement('DIV', {
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
        
        // Create the attendanceDetailsHeadingContainerEl element
        attendanceDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: attendanceDetailsContainerEl,
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
        
        // Create the attendanceDetailsHeadingEl element
        attendanceDetailsHeadingEl = lx.createElement('DIV', {
            parent: attendanceDetailsHeadingContainerEl,
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
            innerHTML: '<div>Attendance History For Period</div>'
        });
        
        // Create the menu dropdown button
        var menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: attendanceDetailsHeadingContainerEl,
            margin: 'auto 15px',
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
            parent: attendanceDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
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
        
        // Add a spacer
        new lx.createElement('DIV', {
            parent: filterContainerEl,
            style: {
                renderTo: filterContainerEl,
                flex: '1 1 100%',
                maxWidth: '30px'
            }
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
        
        // Create the attendanceDetailsMessageEl element
        attendanceDetailsMessageEl = lx.createElement('DIV', {
            parent: attendanceDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '30px 15px',
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
            innerHTML: 'No attendance history to display.'
        });
        
        // Create the attendanceDetailsSectionEl element
        attendanceDetailsSectionEl = lx.createElement('DIV', {
            parent: attendanceDetailsContainerEl,
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
        
        // Create the attendanceGrid component
        attendanceGrid = new lx.component.Grid({
            renderTo: attendanceDetailsSectionEl,
            height: '100%',
            flex: '1 1 100%',
            autoSize: false,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'timeIn', name: 'Time In', width: '130px', type: 'button'},
                {dataIndex: 'timeOut', name: 'Time Out', width: '120px'},
                {dataIndex: 'time', name: 'Time', alignment: 'right'}
            ],
            
            onCellClick: attendanceGridCellClickEventHandler
        });
        
        // Create the attendanceTotalEl component
        attendanceTotalEl = new lx.createElement('DIV', {
            parent: attendanceDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 0px 0px',
                textAlign: 'center',
                padding: '10px 15px 10px 15px',
                fontSize: '14px',
                // fontWeight: 'bold',
                // color: '#FFFFFF',
                backgroundColor: app.filterBackgroundColor,
                width: '100%',
                // borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius)
                // borderStyle: 'solid',
                // borderWidth: '0px 1px 1px 1px',
                // borderColor: app.sectionBackgroundColor
            }
        });

        
        // Load the attendance balances
        loadAttendanceDetails( true );
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
    
    // Filter change event handler
    function filterOnChangeEventHandler() {
        loader.show( true );
        loadAttendanceDetails(true);
    }
    
    // Menu dropdown button export click event handler
    function menuDropDownBtnExportElClickEventHandler() {
        // Create the add leave request panel
        let exportAttendancePanel = new app.panel.ExportAttendanceHistory({
            maxWidth: '500px',
            maxHeight: '377px',
            margin: '10px 10px 10px 10px',
            
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
            panel: exportAttendancePanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Display the home panel
        exportAttendancePanel.showModal();
        exportAttendancePanel.focus();
    }
    
    // Attendance grid cell click event handler
    function attendanceGridCellClickEventHandler( event ) {
        if( attendanceGrid.getColumnDataIndex( event.columnIndex ) === 'timeIn' ) {
            me.hide();
            
            let viewAttendancePanel = new app.panel.ViewAttendance({
                renderTo: app.mainPanel.getPanelContainer(),
                attendanceId: event.record.id
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewAttendancePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            viewAttendancePanel.show();
            viewAttendancePanel.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};