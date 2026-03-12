/* jslint node: true */
/* globals app, lx */
'use strict';


// PAYRUN REPORTS PANEL
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
app.panel.PayrunReports = function(config) {
    
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
    
    var earningsAnalysisSectionEl = null;
    var earningsAnalysisBtn = null;
    
    var nettPaySectionEl = null;
    var netPayBtn = null;
    
    var payslipItemsSectionEl = null;
    var payslipItemsBtn = null;
    
    var overtimeSectionEl = null;
    var overtimeBtn = null;

    var payslipItemSpecifiedSectionEl = null;
    var payslipItemSpecifiedBtn = null;
    
    
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
        //     innerHTML: 'Payrun Reports'
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
        // EARNINGS ANALYSIS SECTION
        //
        
        // Create the earningsAnalysisSectionEl element
        earningsAnalysisSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Earnings / Cost Analysis</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show each employee\'s earnings, deductions, fringe benefits, allowances and company contributions for a payrun or over a period.' + 
                '</div></div>'
        });
        
        // Create the earningsAnalysisBtn component
        earningsAnalysisBtn = new lx.component.Button({
            renderTo: earningsAnalysisSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: earningsAnalysisBtnClickEventHandler
        });
        
        
        //
        // NETT PAY SECTION
        //
        
        // Create the nettPaySectionEl element
        nettPaySectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Nett Pay</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Show each employee\'s payment method, banking details and nett pay for a payrun.' + 
                '</div></div>'
        });
        
        // Create the netPayBtn component
        netPayBtn = new lx.component.Button({
            renderTo: nettPaySectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: nettPayBtnClickEventHandler
        });
        
        
        //
        // PAYSLIP ITEMS SECTION
        //
        
        // Create the payslipItemsSectionEl element
        payslipItemsSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Payslip Items ( Overview ) </div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Display payslip item totals for each employee in a specified payrun or over a period.' + 
                '</div></div>'
        });
        
        // Create the payslipItemsBtn component
        payslipItemsBtn = new lx.component.Button({
            renderTo: payslipItemsSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: payslipItemsBtnClickEventHandler
        });


        //
        // PAYSLIP ITEM SPECIFIED SECTION
        //
        
        // Create the payslipItemSpecifiedSectionEl element
        payslipItemSpecifiedSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Payslip Items ( Specified )</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Display details about a specified recurring payslip item in a payrun or over a period for each employee.' + 
                '</div></div>'
        });
        
        // Create the payslipItemSpecifiedBtn component
        payslipItemSpecifiedBtn = new lx.component.Button({
            renderTo: payslipItemSpecifiedSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: payslipItemSpecifiedBtnClickEventHandler
        });
        
        
        //
        // OVERTIME SECTION
        //
        
        // Create the overtimeSectionEl element
        overtimeSectionEl = lx.createElement('DIV', {
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
                '<div><div style="font-size: 18px;">Overtime</div>' + 
                '<div style="font-size: 12px; margin: 10px 0px 0px 0px;">' + 
                    'Display the overtime details for each employee in a specified payrun or over a period.' + 
                '</div></div>'
        });
        
        // Create the overtimeBtn component
        overtimeBtn = new lx.component.Button({
            renderTo: overtimeSectionEl,
            label: 'Open',
            width: '120px',
            margin: '0px 0px 0px 30px',
            
            onClick: overtimeBtnClickEventHandler
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
    
    // earningsAnalysisBtn click event handler
    function earningsAnalysisBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var earningsCostAnalysisPanel = new app.panel.EarningsCostAnalysisReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        earningsCostAnalysisPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: earningsCostAnalysisPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // nettPayBtn click event handler
    function nettPayBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var nettPayPanel = new app.panel.NettPayReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        nettPayPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: nettPayPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // payslipItemsBtn click event handler
    function payslipItemsBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var payslipItemsPanel = new app.panel.PayslipItemsReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        payslipItemsPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: payslipItemsPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // overtimeBtn click event handler
    function overtimeBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var overtimePanel = new app.panel.OvertimeReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        overtimePanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: overtimePanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }

    // payrunItemSpecifiedBtn click event handler
    function payslipItemSpecifiedBtnClickEventHandler() {
        config.parentPanel.hide();
        
        var payslipItemsSpecifiedPanel = new app.panel.PayslipItemsSpecifiedReport({
            renderTo: app.mainPanel.getContainer(),
            show: true
        });
        payslipItemsSpecifiedPanel.focus();
        
        var panelState = {
            previousPanel: config.parentPanel,
            panel: payslipItemsSpecifiedPanel
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