/* globals app, lx */
'use strict';

// MOBILE MENU PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  isMobile            Whether the menu is mobile or not (true or false)
//
// Events:
//
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.MobileMenu = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    
    var el = null;
    var fixedContainerEl = null;
    
    var payslipsItemEl = null;
    var homeItemEl = null;
    var leaveItemEl = null;
    var attendanceItemEl = null;
    var taxCertificatesItemEl = null;
    var logoutItemEl = null;
    
    
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
            isMobile: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Set up app event handlers
        // lx.addEventListener('login', appLoginEventHandler);
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'block',
                boxSizing: 'border-box',
                overflow: 'hidden',
                width: '100%',
                height: '100%',
                backgroundColor: '#E2E4E5'
            }
        });
        
        // Create the fixed container
        fixedContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 auto',
                boxSizing: 'border-box',
                padding: '0px 0px 0px 0px',
                maxWidth: '300px',
                height: '100%',
                color: '#FFFFFF',
                backgroundColor: lx.style.global.highlightColor, // app.sectionBackgroundColor, 
                margin: '0px 1px 0px 0px'
            }
        });
        
        // Create the logo element
        lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                height: '80px',
                backgroundColor: '#FFFFFF',
                backgroundImage: 'url(\'gfx/payaccsys-logo.svg\')',
                backgroundSize: '65%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                margin: '0px auto'
            }
        });
        
        
        //
        // MENU ITEM SECTION
        //
        
        // Create the home item
        homeItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                padding: '10px 20px',
                fontSize: '14px',
                margin: '15px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-home" style="margin: 0px 20px 0px 0px;"></i>Home'
        });
        homeItemEl.addEventListener('click', homeItemElClickEventHandler);
        
        // Create the payslips item
        payslipsItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                padding: '10px 20px',
                fontSize: '14px',
                margin: '0px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-scroll" style="margin: 0px 20px 0px 0px;"></i>Payslips'
        });
        payslipsItemEl.addEventListener('click', payslipsItemElClickEventHandler);
        
        // Create leave item
        leaveItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                padding: '10px 20px',
                fontSize: '14px',
                margin: '0px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-calendar" style="margin: 0px 20px 0px 0px;"></i>Leave'
        });
        leaveItemEl.addEventListener('click', leaveItemElClickEventHandler);
        
        // Create attendance item
        attendanceItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                padding: '10px 20px',
                fontSize: '14px',
                margin: '0px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-clock" style="margin: 0px 20px 0px 0px;"></i>Attendance'
        });
        attendanceItemEl.addEventListener('click', attendanceItemElClickEventHandler);
        
        // Create tax certificate item
        taxCertificatesItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                padding: '10px 20px',
                fontSize: '14px',
                margin: '0px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-certificate" style="margin: 0px 20px 0px 0px;"></i>Tax Certificates'
        });
        taxCertificatesItemEl.addEventListener('click', taxCertificatesItemElClickEventHandler);
        
        // Create a divider
        lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                // display: 'flex',
                // flex: '1 1 100%',
                height: '0px',
                width: '90%',
                margin: '15px auto',
                borderStyle: 'solid',
                borderColor: '#E2E4E5',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create sign out item
        logoutItemEl = lx.createElement('DIV', {
            parent: fixedContainerEl,
            style: {
                // width: '100%',
                padding: '10px 20px',
                fontSize: '14px',
                margin: '0px 0px 0px 0px',
                cursor: 'pointer',
                display: 'none'
            },
            innerHTML: '<i class="fa fa-fw fa-power-off"" style="margin: 0px 20px 0px 0px;"></i>Logout'
        });
        logoutItemEl.addEventListener('click', logoutItemElClickEventHandler);
        
        // Is it not the mobile menu?
        // if( config.isMobile === false ) {
            // Display the desktop menu items
            lx.applyStyle(homeItemEl, {display: 'flex'});
            lx.applyStyle(payslipsItemEl, {display: 'flex'});
            lx.applyStyle(logoutItemEl, {display: 'flex'});
            lx.applyStyle(leaveItemEl, {display: 'flex'});
            lx.applyStyle(attendanceItemEl, {display: 'flex'});
            lx.applyStyle(taxCertificatesItemEl, {display: 'flex'});
        // }
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // homeItemEl click event handler
    function homeItemElClickEventHandler() {
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the home panel
            let homePanel = new app.panel.Home({
                renderTo: app.mainPanel.getPanelContainer()
            });
            
            // Set and push the state
            let state = {
                panel: homePanel
            };
            app.route.pushState(state, function( state ) {
                // Make certain there is always at least one active panel
                if( app.getActivePanelCount() > 1 ) {
                    state.panel.destroy();
                    app.removeActivePanel();
                }
                else {
                    app.route.pauseNavigation();
                }
            });
            
            // Display the home panel
            homePanel.show();
            homePanel.focus();
        });
        
        // Hide the menu
        app.mainPanel.hideMobileMenu();
    }
    
    // payslipsItemEl click event handler
    function payslipsItemElClickEventHandler() {
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the payslips panel
            let payslipsPanel = new app.panel.Payslips({
                renderTo: app.mainPanel.getPanelContainer()
            });
            
            // Set and push the state
            let state = {
                panel: payslipsPanel
            };
            app.route.pushState(state, function( state ) {
                // Make certain there is always at least one active panel
                if( app.getActivePanelCount() > 1 ) {
                    state.panel.destroy();
                    app.removeActivePanel();
                }
                else {
                    app.route.pauseNavigation();
                }
            });
            
            // Display the payslips panel
            payslipsPanel.show();
            payslipsPanel.focus();
        });
        
        // Hide the menu
        app.mainPanel.hideMobileMenu();
    }
    
    // leaveItemEl click event handler
    function leaveItemElClickEventHandler() {
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the leave panel
            let leavePanel = new app.panel.Leave({
                renderTo: app.mainPanel.getPanelContainer()
            });
            
            // Set and push the state
            let state = {
                panel: leavePanel
            };
            app.route.pushState(state, function( state ) {
                // Make certain there is always at least one active panel
                if( app.getActivePanelCount() > 1 ) {
                    state.panel.destroy();
                    app.removeActivePanel();
                }
                else {
                    app.route.pauseNavigation();
                }
            });
            
            // Display the leave panel
            leavePanel.show();
            leavePanel.focus();
        });
        
        // Hide the menu
        app.mainPanel.hideMobileMenu();
    }
    
    // attendanceItemEl click event handler
    function attendanceItemElClickEventHandler() {
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the leave panel
            let attendancePanel = new app.panel.Attendance({
                renderTo: app.mainPanel.getPanelContainer()
            });
            
            // Set and push the state
            let state = {
                panel: attendancePanel
            };
            app.route.pushState(state, function( state ) {
                // Make certain there is always at least one active panel
                if( app.getActivePanelCount() > 1 ) {
                    state.panel.destroy();
                    app.removeActivePanel();
                }
                else {
                    app.route.pauseNavigation();
                }
            });
            
            // Display the leave panel
            attendancePanel.show();
            attendancePanel.focus();
        });
        
        // Hide the menu
        app.mainPanel.hideMobileMenu();
    }
    
    // taxCertificatesItemEl click event handler
    function taxCertificatesItemElClickEventHandler() {
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the tax certificates panel
            let taxCertificatesPanel = new app.panel.TaxCertificates({
                renderTo: app.mainPanel.getPanelContainer()
            });
            
            // Set and push the state
            let state = {
                panel: taxCertificatesPanel
            };
            app.route.pushState(state, function( state ) {
                // Make certain there is always at least one active panel
                if( app.getActivePanelCount() > 1 ) {
                    state.panel.destroy();
                    app.removeActivePanel();
                }
                else {
                    app.route.pauseNavigation();
                }
            });
            
            // Display the payslips panel
            taxCertificatesPanel.show();
            taxCertificatesPanel.focus();
        });
        
        // Hide the menu
        app.mainPanel.hideMobileMenu();
    }
    
    // logoutItemEl click event handler
    function logoutItemElClickEventHandler() {
        app.logout();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};