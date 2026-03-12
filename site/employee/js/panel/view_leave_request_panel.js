/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW LEAVE REQUEST PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  requestId           The id of the request to view
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewLeaveRequest = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var centeredContainerEl = null;
    
    var leaveDetailsContainerEl = null;
    var leaveDetailsHeadingContainerEl = null;
    var leaveDetailsHeadingEl = null;
    var leaveDetailsSectionEl = null;
    var leaveTypeDisplay = null;
    var leaveTotalDisplay = null;
    var noteDisplay = null;
    
    var leaveRequestStatusContainerEl = null;
    var leaveRequestStatusHeadingContainerEl = null;
    var leaveRequestStatusHeadingEl = null;
    var leaveRequestStatusSectionEl = null;
    var statusDisplay = null;
    var reasonDeclinedContainerEl = null;
    var reasonDeclinedDisplay = null;
    
    var leaveDaysContainerEl = null;
    var leaveDaysHeadingContainerEl = null;
    var leaveDaysHeadingEl = null;
    var leaveDaysSectionEl = null;
    var leaveDaysGrid = null;
    
    var requestId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the leave request to edit
    function loadLeaveRequest( id ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequest',
            data: {
                requestId: id
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Request Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Set the leave type and note
                leaveTypeDisplay.setValue( response.request.leaveTypeName );
                
                let value; 
                if( response.request.dayFraction == 0.25 ) {
                    value = parseFloat(response.request.totalDays / response.request.dayFraction).toFixed(2) + ' quarter-day(s)';
                }
                else if( response.request.dayFraction == 0.5 ) {
                    value = parseFloat(response.request.totalDays / response.request.dayFraction).toFixed(2) + ' half-day(s)';
                }
                else {
                    value = response.request.totalDays + ' day(s)';
                }
                
                if( response.request.totalHours !== null ) {
                    value = value + ' (' + response.request.totalHours + ' hours)';
                }
                leaveTotalDisplay.setValue( value);
                
                value = '-';
                if( response.request.note.trim() !== '' ) {
                    value = response.request.note;
                }
                noteDisplay.setValue( value );
                
                // Set the leave status
                statusDisplay.setValue( response.request.statusName );
                reasonDeclinedDisplay.setValue( '-' );
                if( response.request.statusCode === 'DECL' ) {
                    reasonDeclinedContainerEl.style.display = 'flex';
                    if( response.request.statusUpdateMessage !== '' ) {
                        reasonDeclinedDisplay.setValue( response.request.statusUpdateMessage );
                    }
                }
                
                // Display the leave days in the grid
                let leaveDays = [];
                for( let i = 0; i < response.request.items.length; i++ ) {
                    let item = response.request.items[i];
                    
                    // Display and update the leave hours
                    if( item.leaveHours !== null ) {
                        item.leaveHours = response.request.items[i].leaveHours + ' h';
                    }
                    else {
                        item.leaveHours = '-';
                    }
                    leaveDays.push(item);
                }
                leaveDaysGrid.clear();
                leaveDaysGrid.addRows( leaveDays );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            requestId: null
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
        requestId = compConfig.requestId;
        
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
                // backgroundColor: app.panelBackgroundColor,
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
                borderColor: app.panelBackgroundColor,
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
            innerHTML: '<i class="fa fa-fw fa-calendar" style="margin: 0px 15px 0px 0px;"></i>View Leave Request'
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
                padding: '0px 0px 0px 0px',
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
                // backgroundColor: '#FFFFFF',
                padding: '0px 0px 0px 0px',
                maxWidth: '768px'
            }
        });
        
        
        //
        // LEAVE DETAILS SECTION
        //
        
        leaveDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        leaveDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '30px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        leaveDetailsHeadingEl = lx.createElement('DIV', {
            parent: leaveDetailsHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Leave Request Details</div>'
        });
        
        leaveDetailsSectionEl = lx.createElement('DIV', {
            parent: leaveDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        leaveTypeDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Leave Type:',
            labelWidth: '120px'
        });
        
        leaveTotalDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Leave Requested:',
            labelWidth: '120px'
        });
        
        noteDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Reason / Notes:',
            labelWidth: '120px'
        });
        
        
        //
        // LEAVE STATUS SECTION
        //
        
        leaveRequestStatusContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        leaveRequestStatusHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveRequestStatusContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '30px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        leaveRequestStatusHeadingEl = lx.createElement('DIV', {
            parent: leaveRequestStatusHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Leave Request Status</div>'
        });
        
        leaveRequestStatusSectionEl = lx.createElement('DIV', {
            parent: leaveRequestStatusContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        statusDisplay = new lx.component.Display({
            renderTo: leaveRequestStatusSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Status:',
            labelWidth: '120px'
        });
        
        reasonDeclinedContainerEl = lx.createElement('DIV', {
            parent: leaveRequestStatusSectionEl,
            style: {
                display: 'none'
            }
        });
        
        reasonDeclinedDisplay = new lx.component.Display({
            renderTo: reasonDeclinedContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Reason Declined:',
            labelWidth: '120px'
        });
        
        
        //
        // LEAVE DAYS SECTION
        //
        
        leaveDaysContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        leaveDaysHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveDaysContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '30px 0px 0px 0px',
                padding: '0px 15px',
                height: '45px',
                fontSize: '16px',
                display: 'flex',
                flexDirection: 'row',
                color: lx.style.global.color,
                backgroundColor: app.sectionBackgroundColor
            }
        });
        
        leaveDaysHeadingEl = lx.createElement('DIV', {
            parent: leaveDaysHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                fontSize: '16px',
                color: '#FFFFFF'
            },
            innerHTML: '<div>Leave Days</div>'
        });
        
        leaveDaysSectionEl = lx.createElement('DIV', {
            parent: leaveDaysContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        leaveDaysGrid = new lx.component.Grid({
            renderTo: leaveDaysSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'leaveDate', name: 'Date'},
                {dataIndex: 'leaveHours', name: '# Hours', alignment: 'center', width: '120px'}
            ]
        });
        
        // Load form data
        loader.show(false);
        loadLeaveRequest( requestId );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};