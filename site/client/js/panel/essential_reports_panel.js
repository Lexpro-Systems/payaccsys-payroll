/* jslint node: true */
/* globals app, lx */
'use strict';


// ESSENTIAL REPORTS PANEL
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
app.panel.EssentialReports = function(config) {
    
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
    
    var emp201SectionEl = null;
    var emp201Btn = null;
    
    var emp501SectionEl = null;
    var emp501Btn = null;
    
    var uifSectionEl = null;
    var uifBtn = null;
    
    var returnOfEarningsSectionEl = null;
    var returnOfEarningsBtn = null;

    var coidaReportSectionEl = null;
    var coidaReportBtn = null;
    
    
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
        //     innerHTML: 'Essential Reports'
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
        // EMP 201 SECTION
        //
        
        // Create the emp201SectionEl element
        emp201SectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">EMP 201</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Company\'s SARS Obligations. Show each employee\'s PAYE, UIF and SDL for a specified month in a given tax year.' + 
                '</div></div>'
        });
        
        // Create the emp201Btn component
        emp201Btn = new lx.component.Button({
            renderTo: emp201SectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: emp201BtnClickEventHandler
        });
        
        
        //
        // EMP 501 SECTION
        //
        
        // Create the emp501SectionEl element
        emp501SectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">EMP 501</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Company\'s SARS reconciliation details. Shows PAYE, UIF and SDL totals for the relevant months of a given tax year.' + 
                '</div></div>'
        });
        
        // Create the emp501Btn component
        emp501Btn = new lx.component.Button({
            renderTo: emp501SectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: emp501BtnClickEventHandler
        });
        
        
        //
        // UIF SECTION
        //
        
        // Create the uifSectionEl element
        uifSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">UIF</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show each employee\'s UIF details for a specified payrun.' + 
                '</div></div>'
        });
        
        // Create the netPayBtn component
        uifBtn = new lx.component.Button({
            renderTo: uifSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: uifBtnClickEventHandler
        });
        
        
        //
        // RETURN OF EARNINGS SECTION
        //
        
        // Create the returnOfEarningsSectionEl element
        // returnOfEarningsSectionEl = lx.createElement('DIV', {
        //     parent: contentContainerEl,
        //     style: {
        //         backgroundColor: '#FFFFFF',
        //         borderStyle: 'solid',
        //         borderColor: '#DFDFDF',
        //         borderWidth: '1px',
        //         margin: '20px 0px 0px 0px',
        //         padding: '15px',
        //         width: '100%',
        //         maxWidth: '900px',
        //         boxSizing: 'border-box',
        //         display: 'flex',
        //         flexDirection: 'row',
        //         alignItems: 'center',
        //         justifyContent: 'space-between'
        //     },
        //     innerHTML: 
        //         '<div><div style="font-size: 18px;">Return of Earnings (Workmen&apos;s Compensation)</div>' + 
        //         '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
        //             'Display the details required for completing the Return of Earnings (ROE) submission required by the The Compensation for Occupational Injuries and Diseases Act 130 of 1993.' + 
        //         '</div></div>'
        // });
        
        // // Create the returnOfEarningsBtn component
        // returnOfEarningsBtn = new lx.component.Button({
        //     renderTo: returnOfEarningsSectionEl,
        //     label: 'Open',
        //     width: '120px',
        //     margin: '0px 0px 0px 30px',
            
        //     onClick: returnOfEarningsBtnClickEventHandler
        // });

        // Create the coidaReportSectionEl element
        coidaReportSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">COIDA - Detailed payroll report</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Display the details required by the The Compensation for Occupational Injuries and Diseases Act 130 of 1993 with regards to employee earnings during the financial year.' + 
                '</div></div>'
        });
        
        // Create the returnOfEarningsBtn component
        coidaReportBtn = new lx.component.Button({
            renderTo: coidaReportSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: coidaReportBtnClickEventHandler
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
    
    // emp501Btn click event handler
    function emp501BtnClickEventHandler() {
        config.parentPanel.hide();
        
        var emp501ReportPanel = new app.panel.Emp501Report({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        emp501ReportPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: emp501ReportPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // emp201Btn click event handler
    function emp201BtnClickEventHandler() {
        config.parentPanel.hide();
        
        var empPanel = new app.panel.EmpReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        empPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: empPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // returnOfEarningsBtn click event handler
    // function returnOfEarningsBtnClickEventHandler() {
    //     config.parentPanel.hide();
        
    //     var returnOfEarningsPanel = new app.panel.ReturnOfEarningsReport({
    //         renderTo: app.mainPanel.getContainer(),
    //         show: true
    //     });
    //     returnOfEarningsPanel.focus();
        
    //     var panelState = {
    //         previousPanel: config.parentPanel,
    //         panel: returnOfEarningsPanel
    //     };
        
    //     app.route.pushState(panelState, function( state ) {
    //         state.panel.destroy();
    //         state.previousPanel.show();
    //     });
    // }

    // coidaReportBtn click event handler
    function coidaReportBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var coidaReportPanel = new app.panel.CoidaReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        coidaReportPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: coidaReportPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // uifBtn click event handler
    function uifBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var uifPanel = new app.panel.UifReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        uifPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: uifPanel
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