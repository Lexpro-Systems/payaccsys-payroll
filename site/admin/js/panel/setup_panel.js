/* globals app, lx */
'use strict';


// SETUP PANEL
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
app.panel.Setup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var tabContainerEl = null;
    var tabMarkerEl = null;
    var tabPublicHolidaySetupItemEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var listPublicHolidaysPanel = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
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
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                overflow: '',
                backgroundColor: '#F4F5F6',
                height: '100%'
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
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Setup'
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
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
        
        // Create the tabContainerEl element
        tabContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                width: '220px',
                height: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create tabPublicHolidaySetupItemEl element
        tabPublicHolidaySetupItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Public Holidays'
        });
        tabPublicHolidaySetupItemEl.addEventListener('click', tabPublicHolidaySetupItemElClickEventHandler);
        
        // Create the tabMarkerEl element
        tabMarkerEl = lx.createElement('DIV', {
            parent: tabPublicHolidaySetupItemEl,
            style: {
                backgroundColor: '#F4F5F6',
                width: '35px',
                height: '35px',
                top: '4px',
                left: '213px',
                position: 'absolute',
                transform: 'rotate(45deg)',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
            }
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
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });
        
        
        //
        // CREATE SUB PANELS
        //
        
        listPublicHolidaysPanel = new app.panel.ListPublicHolidays({
            renderTo: contentContainerEl
        });
        listPublicHolidaysPanel.show();
        listPublicHolidaysPanel.focus();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // tabPublicHolidaySetupItemEl click event handler
    function tabPublicHolidaySetupItemElClickEventHandler() {
        listPublicHolidaysPanel.show();
        
        tabPublicHolidaySetupItemEl.appendChild( tabMarkerEl );
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};