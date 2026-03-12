/* globals app, lx */
'use strict';


// REPORTS PANEL
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
app.panel.Reports = function(config) {
    
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
    
    var activeCompaniesSectionEl = null;
    var activeCompaniesBtn = null;
    
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
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Reports'
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
        // ACTIVE COMPANIES REPORT SECTION
        //
        
        // Create the activeCompaniesSectionEl element
        activeCompaniesSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '20px 0px 0px 0px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
            },
            innerHTML: 
                '<div><div style="font-size: 18px;">Active Companies</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show a list of companies with an indication whether they are active or not.' + 
                '</div></div>'
        });
        
        // Create the netPayBtn component
        activeCompaniesBtn = new lx.component.Button({
            renderTo: activeCompaniesSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: activeCompaniesBtnClickEventHandler
        });
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    function activeCompaniesBtnClickEventHandler() {
        me.hide();
        
        // Create the report panel
        let activeCompaniesReportPanel = new app.panel.ActiveCompaniesReport({
            renderTo: app.mainPanel.getContainer()
        });
        
        // Set and push the state
        let panelState = {
            previousPanel: me,
            panel: activeCompaniesReportPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    
        // Display the report panel
        activeCompaniesReportPanel.show();
        activeCompaniesReportPanel.focus();
    }
  
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};