/* globals app, lx */
'use strict';


// MAIN PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.Main = function(config) {
    
    //
    // PRIVATE letIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    let panelContainerEl = null;
    var bottomMenuContainerEl = null;
    var bottomMenuItemContainerEl = null;
    var bottomMenuPayslipsEl = null;
    // var bottomMenuLeaveEl = null;
    var bottomMenuHomeEl = null;
    // var bottomMenuProfileEl = null;
    var bottomMenuMoreEl = null;
    var mobileMenuLightboxEl = null;
    var mobileMenuContainerEl = null;
    var mobileMenuPanel = null;
    
    
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
        let compConfig = {
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
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
                width: '100%',
                height: '100%',
                flexDirection: 'row',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                overflow: '',
                backgroundColor: '#F0F2F3'
            }
        });
        
        // Create the side menu container
        var sideMenuContainerEl = lx.createElement('DIV', {
            parent: el,
            className: 'display-desktop-only',
            style: {
                width: '300px',
                height: '100%',
                flex: '0 0 auto',
                backgroundColor: '#AAAAFF'
            }
        });
        
        // Create the side menu panel
        var sideMenuPanel = new app.panel.MobileMenu({
            renderTo: sideMenuContainerEl,
            isMobile: false
        });
        sideMenuPanel.show();
        
        // Create the main container
        var verticalContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '100%',
                height: '100%',
                backgroundColor: '#AAFFAA',
                flex: '1 1 100%',
                // maxWidth: '800px',
                // margin: '0px auto',
                // boxShadow: '0px 1px 6px 0px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create the panel container
        // panelContainerEl = lx.createElement('DIV', {
        //     parent: verticalContainerEl,
        //     style: {
        //         position: 'relative',
        //         height: '0px',              // This is required for Safari to work.
        //         flex: '1 1 auto',
        //         overflow: 'hidden',
        //         // backgroundColor: app.panelBackgroundColor,
        //         backgroundPosition: 'right center',
        //         backgroundRepeat: 'no-repeat',
        //         backgroundAttachment: 'fixed',
        //         backgroundSize: 'cover',
        //         backgroundImage: 'url(gfx/background.png)'
        //     }
        // });
        
        // Create the bottom menu container
        bottomMenuContainerEl = lx.createElement('DIV', {
            parent: verticalContainerEl,
            className: 'display-mobile-only',
            style: {
                // color: lx.style.global.highlightColor,
                // backgroundColor: '#FFFFFF',
                color: '#FFFFFF',
                backgroundColor: lx.style.global.highlightColor,
                flex: '0 0 auto',
                borderStyle: 'solid',
                borderColor: '#E2E4E5',
                borderWidth: '1px 0px 0px 0px'
            }
        });
        
        // Create the bottom menu item container
        bottomMenuItemContainerEl = lx.createElement('DIV', {
            parent: bottomMenuContainerEl,
            className: 'display-mobile-only',
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                height: '50px',
                flex: '0 0 auto',
                borderStyle: 'solid',
                borderColor: lx.style.global.highlightColor,
                borderWidth: '3px 0px 0px 0px'
            }
        });
        
        // Create bottom menu payslips element
        bottomMenuPayslipsEl = lx.createElement('DIV', {
            parent: bottomMenuItemContainerEl,
            style: {
                width: '50px',
                height: '50px',
                padding: '10px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                textAlign: 'center',
                borderStyle: 'solid',
                borderColor: lx.style.global.highlightColor,
                borderWidth: '2px 1px 0px 0px'
            },
            innerHTML: '<i class="fa fa-scroll" style="font-size: 17px;"></i><br /><span style="font-size: 10px;">Payslips</span>'
        });
        bottomMenuPayslipsEl.addEventListener('click', bottomMenuPayslipsElClickEventHandler);
        
        // // Create bottom menu leave element
        // bottomMenuLeaveEl = lx.createElement('DIV', {
        //     parent: bottomMenuItemContainerEl,
        //     style: {
        //         width: '50px',
        //         height: '50px',
        //         padding: '10px',
        //         boxSizing: 'border-box',
        //         cursor: 'pointer',
        //         textAlign: 'center',
        //         // borderStyle: 'solid',
        //         // borderColor: lx.style.global.highlightColor,
        //         // borderWidth: '0px 1px 0px 0px'
        //     },
        //     innerHTML: '<i class="fa fa-calendar" style="font-size: 17px;"></i><br /><span style="font-size: 10px;">Leave</span>'
        // });
        // // bottomMenuLeaveEl.addEventListener('click', bottomMenuLeaveElClickEventHandler);
        
        // Create bottom menu home element
        bottomMenuHomeEl = lx.createElement('DIV', {
            parent: bottomMenuItemContainerEl,
            style: {
                width: '50px',
                height: '50px',
                padding: '10px',
                boxSizing: 'border-box',
                cursor: 'pointer',
                textAlign: 'center',
                // borderStyle: 'solid',
                // borderColor: lx.style.global.highlightColor,
                // borderWidth: '0px 1px 0px 0px'
            },
            innerHTML: '<i class="fa fa-home" style="font-size: 17px;"></i><br /><span style="font-size: 10px;">Home</span>'
        });
        bottomMenuHomeEl.addEventListener('click', bottomMenuHomeElClickEventHandler);
        
        // // Create bottom menu profile element
        // bottomMenuProfileEl = lx.createElement('DIV', {
        //     parent: bottomMenuItemContainerEl,
        //     style: {
        //         width: '50px',
        //         height: '50px',
        //         padding: '10px',
        //         overflow: 'hidden',
        //         boxSizing: 'border-box',
        //         cursor: 'pointer',
        //         textAlign: 'center',
        //         // borderStyle: 'solid',
        //         // borderColor: lx.style.global.highlightColor,
        //         // borderWidth: '0px 1px 0px 0px'
        //     },
        //     innerHTML: '<i class="fa fa-user" style="font-size: 17px;"></i><br /><span style="font-size: 10px;">Profile</span>'
        // });
        // // bottomMenuProfileEl.addEventListener('click', bottomMenuProfileElClickEventHandler);
        
        // Create menu more element
        bottomMenuMoreEl = lx.createElement('DIV', {
            parent: bottomMenuItemContainerEl,
            style: {
                width: '50px',
                height: '50px',
                padding: '10px',
                overflow: 'hidden',
                boxSizing: 'border-box',
                cursor: 'pointer',
                textAlign: 'center'
            },
            innerHTML: '<i class="fa fa-bars" style="font-size: 17px;"></i><br /><span style="font-size: 10px;">More</span>'
        });
        bottomMenuMoreEl.addEventListener('click', bottomMenuMoreElClickEventHandler);
        
        // Create the mobile menu lightbox
        mobileMenuLightboxEl = lx.createElement('DIV', {
            parent: panelContainerEl,
            className: 'display-mobile-only',
            style: {
                zIndex: '1000',
                visibility: 'hidden',
                position: 'absolute',
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                top: '0px',
                right: '0px',
                backgroundColor: 'rgba(0, 0, 0, 0.0)',
                transition: 'background-color 0.2s 0s ease-in'
            }
        });
        mobileMenuLightboxEl.addEventListener('click', mobileMenuLightboxElClickEventHandler);
        
        // Create the mobile menu container
        mobileMenuContainerEl = lx.createElement('DIV', {
            parent: panelContainerEl,
            className: 'display-mobile-only',
            style: {
                visibility: 'hidden',
                position: 'absolute',
                width: '300px',
                height: '100%',
                top: '0px',
                right: '-300px',
                overflow: 'hidden',
                zIndex: '1000',
                transform: 'translate3d(0, 0, 0)',
                transition: 'right 0.2s 0.0s ease-out'
            }
        });
        
        // Create the mobile menu panel
        mobileMenuPanel = new app.panel.MobileMenu({
            renderTo: mobileMenuContainerEl,
            isMobile: true
        });
        mobileMenuPanel.show();
        mobileMenuPanel.focus();
        
        // Remember that were adding an active panel
        app.addActivePanel();
        
        // Create the home panel
        let homePanel = new app.panel.Home({
            renderTo: panelContainerEl
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
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    // Function to get the container
    me.panelGetContainer = me.getContainer;
    me.getContainer = function() {
        return me.panelGetContainer();
    };
    
    // Function to get the panel container
    me.getPanelContainer = function() {
        return panelContainerEl;
    };
    
    // Function to show the mobile menu
    me.showMobileMenu = function() {
        // If the menu is already visible do nothing
        if( mobileMenuContainerEl.style.right === '0px' ) return;
        
        lx.applyStyle(mobileMenuContainerEl, {right: '0px'});
        
        lx.applyStyle(mobileMenuContainerEl, {visibility: 'visible'});
        lx.applyStyle(mobileMenuLightboxEl, {visibility: 'visible'});
        window.setTimeout(function() {
            lx.applyStyle(mobileMenuLightboxEl, {backgroundColor: 'rgba(0, 0, 0, 0.5)'});
        }, 5);
    };
    
    // Function to hide the mobile menu
    me.hideMobileMenu = function() {
        // If the menu is already hidden do nothing
        if( mobileMenuContainerEl.style.right !== '0px' ) return;
        
        lx.applyStyle(mobileMenuContainerEl, {right: '-300px'});
        
        mobileMenuLightboxEl.addEventListener('transitionend', mobileMenuLightboxElTransitionendEventHandler);
        lx.applyStyle(mobileMenuLightboxEl, {backgroundColor: 'rgba(0, 0, 0, 0.0)'});
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // bottomMenuMoreEl click event handler
    function bottomMenuMoreElClickEventHandler() {
        if( mobileMenuContainerEl.style.right !== '0px' ) me.showMobileMenu();
        else me.hideMobileMenu();
    }
    
    // mobileMenuLightboxEl click event handler
    function mobileMenuLightboxElClickEventHandler() {
        me.hideMobileMenu();
    }
    
    // mobilemenuLightBoxEl transitionend event handler
    function mobileMenuLightboxElTransitionendEventHandler() {
        lx.applyStyle(mobileMenuContainerEl, {visibility: 'hidden'});
        lx.applyStyle(mobileMenuLightboxEl, {visibility: 'hidden'});
        mobileMenuLightboxEl.removeEventListener('transitionend', mobileMenuLightboxElTransitionendEventHandler);
    }
    
    // bottomMenuPayslipsEl click event handler
    function bottomMenuPayslipsElClickEventHandler() {
        // Hide the mobile menu
        me.hideMobileMenu();
        
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
    }
    
    // bottomMenuHomeEl click event handler
    function bottomMenuHomeElClickEventHandler() {
        // Hide the mobile menu
        me.hideMobileMenu();
        
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
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};