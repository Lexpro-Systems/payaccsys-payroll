/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW ATTENDANCE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  attendanceId           The id of the attendance to view
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewAttendance = function(config) {
    
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
    
    var timeDetailsContainerEl = null;
    var timeDetailsHeadingContainerEl = null;
    var timeDetailsHeadingEl = null;
    var timeDetailsSectionEl = null;
    var timeInDisplay = null;
    var timeOutDisplay = null;
    var timeDisplay = null;
    
    var temperatureContainerEl = null;
    var temperatureHeadingContainerEl = null;
    var temperatureHeadingEl = null;
    var temperatureSectionEl = null;
    var temperatureDisplay = null;
    
    var noteContainerEl = null;
    var noteHeadingContainerEl = null;
    var noteHeadingEl = null;
    var noteSectionEl = null;
    var noteDisplay = null;
    
    var attendanceId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the attendance attendance to edit
    function loadAttendance( id ) {
        loader.show( false );
        
        // Get the attendance balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=get',
            data: {
                attendanceId: id
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Attendance  Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Set the attendance details
                timeInDisplay.setValue( response.attendance.timeIn );
                
                let value = '-';
                if( response.attendance.timeOut !== null ) {
                    value = response.attendance.timeOut;
                }
                timeOutDisplay.setValue( value );
                
                value = '-';
                if( response.attendance.time !== '' ) {
                    value = response.attendance.time;
                }
                timeDisplay.setValue( value );
                
                // Set the temperature 
                value = '-';
                if( response.attendance.temperature.trim() !== '' ) {
                    value = response.attendance.temperature;
                }
                temperatureDisplay.setValue( value );
                
                // Set the note 
                value = '-';
                if( response.attendance.note.trim() !== '' ) {
                    value = response.attendance.note;
                }
                noteDisplay.setValue( value );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            attendanceId: null
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
        attendanceId = compConfig.attendanceId;
        
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
            innerHTML: '<i class="fa fa-fw fa-clock" style="margin: 0px 15px 0px 0px;"></i>View Attendance '
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
                padding: '0px 15px 15px 15px',
                maxWidth: '768px'
            }
        });
        
        
        //
        // ATTENDANCE DETAILS SECTION
        //
        
        timeDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        timeDetailsHeadingContainerEl = lx.createElement('DIV', {
            parent: timeDetailsContainerEl,
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
        
        timeDetailsHeadingEl = lx.createElement('DIV', {
            parent: timeDetailsHeadingContainerEl,
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
            innerHTML: '<div>Time Details</div>'
        });
        
        timeDetailsSectionEl = lx.createElement('DIV', {
            parent: timeDetailsContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        timeInDisplay = new lx.component.Display({
            renderTo: timeDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Time In:',
            labelWidth: '120px'
        });
        
        timeOutDisplay = new lx.component.Display({
            renderTo: timeDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Time Out:',
            labelWidth: '120px'
        });
        
        timeDisplay = new lx.component.Display({
            renderTo: timeDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Time:',
            labelWidth: '120px'
        });
        
        
        //
        // TEMPERATURE SECTION
        //
        
        temperatureContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        temperatureHeadingContainerEl = lx.createElement('DIV', {
            parent: temperatureContainerEl,
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
        
        temperatureHeadingEl = lx.createElement('DIV', {
            parent: temperatureHeadingContainerEl,
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
            innerHTML: '<div>Temperature</div>'
        });
        
        temperatureSectionEl = lx.createElement('DIV', {
            parent: temperatureContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        temperatureDisplay = new lx.component.Display({
            renderTo: temperatureSectionEl,
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // NOTE SECTION
        //
        
        noteContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        noteHeadingContainerEl = lx.createElement('DIV', {
            parent: noteContainerEl,
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
        
        noteHeadingEl = lx.createElement('DIV', {
            parent: noteHeadingContainerEl,
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
            innerHTML: '<div>Note</div>'
        });
        
        noteSectionEl = lx.createElement('DIV', {
            parent: noteContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        noteDisplay = new lx.component.Display({
            renderTo: noteSectionEl,
            margin: '0px 0px 0px 0px'
        });
        
        
        // Load form data
        loader.show(false);
        loadAttendance( attendanceId );
        
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