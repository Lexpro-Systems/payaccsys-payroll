/* jslint node: true */
/* globals app, lx */
'use strict';


// LEAVE REPORTS PANEL
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
app.panel.LeaveReports = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    // var titleContainerEl = null;
    // var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var leaveSummarySectionEl = null;
    var leaveSummaryBtn = null;
    
    var employeeLeaveSectionEl = null;
    var employeeLeaveBtn = null;
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
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
        
        // titleContainerEl = lx.createElement('DIV', {
        //     parent: el,
        //     style: {
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         flex: '0 0 auto',
        //         alignItems: 'center',
        //         width: '100%',
        //         height: '50px',
        //         backgroundColor: '#FFFFFF',
        //         borderStyle: 'solid',
        //         borderColor: '#DFDFDF',
        //         borderWidth: '0px 0px 1px 0px'
        //     }
        // });
        
        // // Create the title text element
        // titleTextEl = lx.createElement('DIV', {
        //     parent: titleContainerEl,
        //     style: {
        //         fontSize: '16px',
        //         margin: '0px 0px 0px 20px',
        //         userSelect: 'none'
        //     },
        //     innerHTML: 'Leave Reports'
        // });
        
        
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
        // LEAVE SUMMARY SECTION
        //
        
        // Create the nettPaySectionEl element
        leaveSummarySectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Leave Summary</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show a summary of each employee\'s leave details per leave type.' + 
                '</div></div>'
        });
        
        // Create the netPayBtn component
        leaveSummaryBtn = new lx.component.Button({
            renderTo: leaveSummarySectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: leaveSummaryBtnClickEventHandler
        });
        
        
        //
        // EMPLOYEE LEAVE SECTION
        //
        
        // Create the employeeLeaveSectionEl element
        employeeLeaveSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Employee Leave</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show the leave balance details for each individual employee.' + 
                '</div></div>'
        });
        
        // Create the employeeLeaveBtn component
        employeeLeaveBtn = new lx.component.Button({
            renderTo: employeeLeaveSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: employeeLeaveBtnClickEventHandler
        });
        
        
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
    
    function leaveSummaryBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var leaveSummaryPanel = new app.panel.LeaveSummaryReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        leaveSummaryPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: leaveSummaryPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    function employeeLeaveBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var employeeLeaveReportPanel = new app.panel.EmployeeLeaveReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        employeeLeaveReportPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: employeeLeaveReportPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};