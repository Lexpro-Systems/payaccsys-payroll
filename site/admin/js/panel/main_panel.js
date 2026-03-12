/* globals app, lx */
'use strict';

// MAIN PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
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
    let menuVisible = null;
    let menuBtnActive = null;
    
    let el = null;
    
    let titleBarEl = null;
    let menuBtnEl = null;
    let userNameEl = null;
    
    let userDropdownBtn = null;
    let userDropdownProfileEl = null;
    let userDropdownPasswordEl = null;
    let userDropdownLogoutEl = null;
    
    let contentContainerEl = null;
    
    let menuEl = null;
    let menuCompanyEl = null;
    let menuGroupsEl = null;
    let menuConsultantEl = null;
    let menuInvitationsEl = null;
    let menuUsersEl = null;
    let menuEmployeeAccountsEl = null;
    let menuCompanyRequestsEl = null;
    let menuMaintenanceEl = null;
    let menuReportsEl = null;
    let menuSetupEl = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load user details
    function loadUserDetails() {
        lx.sendJSON({
            url: 'exec.php?c=User&fn=get',
            onSuccess: function( jsonResult ) {
                let result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load user details'
                    });
                    
                    return;
                }
                
                // Set user details
                userNameEl.innerHTML = result.user.name;
            }
        });
    }
    
    
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
        menuVisible = false;
        menuBtnActive = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.panelGetContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                // flex: compConfig.flex
            }
        });
        
        
        //
        // TITLE BAR SECTION
        //
        
        // Create titlebar element
        titleBarEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '45px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create menuBtnEl element
        menuBtnEl = lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                padding: '11px 10px 9px 10px',
                cursor: 'pointer',
                margin: '0px 0px 0px 10px'
            }
        });
        menuBtnEl.appendChild( lx.icon.create('menu', '#0F0F0F', 16, 1) );
        menuBtnEl.addEventListener('mousedown', menuBtnElMouseDownEventHandler);
        menuBtnEl.addEventListener('mouseup', menuBtnElMouseUpEventHandler);
        
        // Create the logo element
        lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                width: '25px',
                height: '18px',
                backgroundImage: 'url(\'gfx/payaccsys-icon1.svg\')',
                backgroundSize: '100%',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                margin: '0px 0px 0px 10px'
            }
        });
        
        // Create the payroll label
        lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                fontSize: '18px',
                color: '#EF4E45',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 1px',
                borderColor: '#EF4E45',
                margin: '0px 0px 0px 10px',
                padding: '0px 0px 0px 10px'
            },
            innerHTML: 'Payroll Admin'
        });
        
        // Create the userNameEl element
        userNameEl = lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                fontSize: '16px',
                margin: '0px 5px 0px auto',
                padding: '0px 15px 0px 0px',
                borderStyle: 'solid',
                borderWidth: '0px 1px 0px 0px',
                borderColor: '#2C333E'
            },
            innerHTML: ''
        });
        
        // Create the user dropdown button component
        userDropdownBtn = new lx.component.DropdownButton({
            renderTo: titleBarEl,
            label: '<i class="fa fa-cog"></i>',
            margin: '0px 10px 0px 0px',
            dropdownAlignment: 'right'
        });
        
        // Create the userDropdownContainerEl element
        let userDropdownContainerEl = lx.createElement('DIV', {
            parent: userDropdownBtn.getContainer(),
            style: {
                padding: '5px 0px'
            }
        });
        
        // Create the userDropdownProfileEl element
        userDropdownProfileEl = lx.createElement('DIV', {
            parent: userDropdownContainerEl,
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-fw fa-user" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Profile'
        });
        userDropdownProfileEl.addEventListener('click', userDropdownProfileElClickEventHandler);
        
        // Create the userDropdownPasswordEl element
        userDropdownPasswordEl = lx.createElement('DIV', {
            parent: userDropdownContainerEl,
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-fw fa-lock" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Change Password'
        });
        userDropdownPasswordEl.addEventListener('click', userDropdownPasswordElClickEventHandler);
        
        // Add a separator
        lx.createElement('DIV', {
            parent: userDropdownContainerEl,
            style: {
                height: '0px',
                borderStyle: 'solid',
                borderColor: '#E8E9EB',
                borderWidth: '1px 0px 0px 0px',
                margin: '5px 0px 0px 0px'
            }
        });
        
        // Create the userDropdownLogoutEl element
        userDropdownLogoutEl = lx.createElement('DIV', {
            parent: userDropdownContainerEl,
            className: 'list-item',
            style: {
                width: '140px',
                margin: '5px 0px 0px 0px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-fw fa-power-off" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Logout'
        });
        userDropdownLogoutEl.addEventListener('click', userDropdownLogoutElClickEventHandler);
        
        
        //
        // CONTENT CONTAINER SECTION
        //
        
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                width: '100%',
                height: '0px',
                flex: '1 1 auto',
                position: 'relative',
                backgroundColor: '#F3F4F'
            }
        });
        
        
        //
        // MENU SECTION
        //
        
        // Create menuEl element
        menuEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '250px',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                position: 'absolute',
                left: '-250px',
                top: '0px',
                transition: 'left 0.15s 0.0s ease-in',
                outline: 'none',
                zIndex: 1000
            },
            tabIndex: 0
        });
        menuEl.addEventListener('blur', menuElBlurEventHandler);
        
        // Create menuCompanyEl element
        menuCompanyEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-database" style="margin: 0px 20px 0px 0px;"></i>Companies'
        });
        menuCompanyEl.addEventListener('click', menuCompanyElClickEventHandler);
        
        // Create menuUsersEl element
        menuUsersEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-user" style="margin: 0px 20px 0px 0px;"></i>Users'
        });
        menuUsersEl.addEventListener('click', menuUsersElClickEventHandler);
        
        // Create menuUsersEl element
        menuEmployeeAccountsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-user" style="margin: 0px 20px 0px 0px;"></i>Employee Accounts'
        });
        menuEmployeeAccountsEl.addEventListener('click', menuEmployeeAccountsElClickEventHandler);
        
        // Create menuGroupsEl element
        menuGroupsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-users" style="margin: 0px 20px 0px 0px;"></i>Groups'
        });
        menuGroupsEl.addEventListener('click', menuGroupsElClickEventHandler);
        
        // Create menuConsultantEl element
        menuConsultantEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-user-friends" style="margin: 0px 20px 0px 0px;"></i>Consultants'
        });
        menuConsultantEl.addEventListener('click', menuConsultantElClickEventHandler);
        
        // Create menuInvitationsEl element
        menuInvitationsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-handshake" style="margin: 0px 20px 0px 0px;"></i>Invitations'
        });
        menuInvitationsEl.addEventListener('click', menuInvitationsElClickEventHandler);
        
        // Create menuCompanyEl element
        menuCompanyRequestsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-tasks" style="margin: 0px 20px 0px 0px;"></i>Company Requests'
        });
        menuCompanyRequestsEl.addEventListener('click', menuCompanyRequestsElClickEventHandler);
        
        // Create menuMaintenanceEl element
        menuMaintenanceEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-wrench" style="margin: 0px 20px 0px 0px;"></i>Maintenance'
        });
        menuMaintenanceEl.addEventListener('click', menuMaintenanceElClickEventHandler);
        
        // Create menuReportsEl element
        menuReportsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-chart-line" style="margin: 0px 20px 0px 0px;"></i>Reports'
        });
        menuReportsEl.addEventListener('click', menuReportsElClickEventHandler);
        
        // Create menuSetupEl element
        menuSetupEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-cogs" style="margin: 0px 20px 0px 0px;"></i>Setup'
        });
        menuSetupEl.addEventListener('click', menuSetupElClickEventHandler);
        
        // // Create the list companies panel as the default panel
        // let listCompaniesPanel = new app.panel.ListCompanies({
        //     renderTo: contentContainerEl,
        //     flex: '',
        // });
        
        // // Push a state for the listCompaniesPanel
        // app.route.pushState({panel: listCompaniesPanel}, function( state ) {
        //     state.panel.destroy();
        // });
        
        // listCompaniesPanel.show();
        // listCompaniesPanel.focus();
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listCompaniesPanel = new app.panel.ListCompanies({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listCompaniesPanel
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
            
            // Display the panel
            listCompaniesPanel.show();
            listCompaniesPanel.focus();
        });
        
        // Load user details
        loadUserDetails();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        
    };
    
    // Function to get the container from its index
    //
    // index            The index of the container to get
    // return           The container element at index.
    me.panelGetContainer = me.getContainer;
    me.getContainer = function() {
        return contentContainerEl;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // menuBtnEl mouse down event handler
    function menuBtnElMouseDownEventHandler() {
        menuBtnActive = true;
    }
    
    // menuBtnEl mouse up event handler
    function menuBtnElMouseUpEventHandler() {
        menuBtnActive = false;
        
        if( menuVisible === true ) {
            menuVisible = false;
            lx.applyStyle(menuEl, {left: '-250px'});
        }
        else {
            menuVisible = true;
            lx.applyStyle(menuEl, {left: '0px'});
            menuEl.focus();
        }
    }
    
    // menuEl blur event handler
    function menuElBlurEventHandler() {
        if( menuVisible === true && menuBtnActive !== true ) {
            menuVisible = false;
            lx.applyStyle(menuEl, {left: '-250px'});
        }
    }
    
    // menuCompanyEl click event handler
    function menuCompanyElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listCompaniesPanel = new app.panel.ListCompanies({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listCompaniesPanel
        //     app.route.pushState({panel: listCompaniesPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     listCompaniesPanel.show();
        //     listCompaniesPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listCompaniesPanel = new app.panel.ListCompanies({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listCompaniesPanel
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
            
            // Display the panel
            listCompaniesPanel.show();
            listCompaniesPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuUsersEl click event handler
    function menuUsersElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listUsersPanel = new app.panel.ListUsers({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listUsersPanel
        //     app.route.pushState({panel: listUsersPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     // Show the panel.
        //     listUsersPanel.show();
        //     listUsersPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listUsersPanel = new app.panel.ListUsers({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listUsersPanel
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
            
            // Display the panel
            listUsersPanel.show();
            listUsersPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuEmployeeAccountsEl click event handler
    function menuEmployeeAccountsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listEmployeeAccountsPanel = new app.panel.ListEmployeeAccounts({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listEmployeeAccountsPanel
        //     app.route.pushState({panel: listEmployeeAccountsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     // Show the panel.
        //     listEmployeeAccountsPanel.show();
        //     listEmployeeAccountsPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listEmployeeAccountsPanel = new app.panel.ListEmployeeAccounts({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listEmployeeAccountsPanel
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
            
            // Display the panel
            listEmployeeAccountsPanel.show();
            listEmployeeAccountsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuGroupsEl click event handler
    function menuGroupsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listGroupsPanel = new app.panel.ListGroups({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listGroupsPanel
        //     app.route.pushState({panel: listGroupsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     // Show the panel.
        //     listGroupsPanel.show();
        //     listGroupsPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listGroupsPanel = new app.panel.ListGroups({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listGroupsPanel
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
            
            // Display the panel
            listGroupsPanel.show();
            listGroupsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuConsultantEl click event handler
    function menuConsultantElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listConsultantsPanel = new app.panel.ListConsultants({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listConsultantsPanel
        //     app.route.pushState({panel: listConsultantsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     // Show the panel.
        //     listConsultantsPanel.show();
        //     listConsultantsPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listConsultantsPanel = new app.panel.ListConsultants({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listConsultantsPanel
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
            
            // Display the panel
            listConsultantsPanel.show();
            listConsultantsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    function menuInvitationsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listInitationsPanel = new app.panel.ListInvitations({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listInitationsPanel
        //     app.route.pushState({panel: listInitationsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listInitationsPanel = new app.panel.ListInvitations({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listInitationsPanel
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
            
            // Display the panel
            listInitationsPanel.show();
            listInitationsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuCompanyRequestsEl click event handler
    function menuCompanyRequestsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listCompanyRequestsPanel = new app.panel.ListCompanyRequests({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the listCompanyRequestsPanel
        //     app.route.pushState({panel: listCompanyRequestsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     listCompanyRequestsPanel.show();
        //     listCompanyRequestsPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listCompanyRequestsPanel = new app.panel.ListCompanyRequests({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listCompanyRequestsPanel
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
            
            // Display the panel
            listCompanyRequestsPanel.show();
            listCompanyRequestsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuMaintenanceEl click event handler
    function menuMaintenanceElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let maintenancePanel = new app.panel.Maintenance({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the maintenancePanel
        //     app.route.pushState({panel: maintenancePanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     maintenancePanel.show();
        //     maintenancePanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let maintenancePanel = new app.panel.Maintenance({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: maintenancePanel
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
            
            // Display the panel
            maintenancePanel.show();
            maintenancePanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuReportsEl click event handler
    function menuReportsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let reportsPanel = new app.panel.Reports({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the maintenancePanel
        //     app.route.pushState({panel: reportsPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     reportsPanel.show();
        //     reportsPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let reportsPanel = new app.panel.Reports({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: reportsPanel
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
            
            // Display the panel
            reportsPanel.show();
            reportsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuSetupEl click event handler
    function menuSetupElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let setupPanel = new app.panel.Setup({
        //         renderTo: contentContainerEl
        //     });
            
        //     // Push a state for the maintenancePanel
        //     app.route.pushState({panel: setupPanel}, function( state ) {
        //         state.panel.destroy();
        //     });
            
        //     setupPanel.show();
        //     setupPanel.focus();
        // });
        
        // // Hide the menu
        // menuVisible = false;
        // lx.applyStyle(menuEl, {left: '-250px'});
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let setupPanel = new app.panel.Setup({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: setupPanel
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
            
            // Display the panel
            setupPanel.show();
            setupPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // userDropdownProfileEl click event handler
    function userDropdownProfileElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        var userProfilePanel = new app.panel.UserProfile({
            renderTo: app.mainPanel.getContainer(),
            margin: '40px',
            maxHeight: '100%',
            maxWidth: '600px',
            
            onCancel: function() {
                app.route.popState();
            }
        });
        userProfilePanel.focus();
        
        var panelState = {
            previousPanel: me,
            panel: userProfilePanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        userProfilePanel.showModal();
        userProfilePanel.focus();
    }
    
    // userDropdownPasswordEl click event handler
    function userDropdownPasswordElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        var changePasswordPanel = new app.panel.ChangePassword({
            renderTo: app.mainPanel.getContainer(),
            maxWidth: '400px',
            maxHeight: '369px'
            
        });
        changePasswordPanel.focus();
        
        var panelState = {
            previousPanel: me,
            panel: changePasswordPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        changePasswordPanel.showModal();
        changePasswordPanel.focus();
        
        // return;
        // let changePasswordPanel = new app.panel.ChangePassword({
        //     maxWidth: '400px',
        //     maxHeight: '369px'
        // });
        
        // app.route.pushState({panel: changePasswordPanel}, function(state) {
        //     state.panel.destroy();
        // });
        
        // changePasswordPanel.showModal();
        // changePasswordPanel.focus();
    }
    
    // userDropdownLogoutEl click event handler
    function userDropdownLogoutElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        // Confirm logout
        new lx.component.Messagebox({
            title: 'Confirm Logout',
            message: 'Are you sure you want to log out?',
            buttons: [
                {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                {name: 'logout', label: 'Logout', isDefault: true}
            ],
            
            onClose: function( event ) {
                if( event.button === 'logout' ) {
                    // Send logout request
                    lx.sendJSON({
                        url: 'exec.php?c=User&fn=logout',
                        onSuccess: function( responseText ) {
                            let response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.compent.Messagebox({
                                    message: 'Logout failed.'
                                });
                                
                                return;
                            }
                            
                            window.location.reload();
                        }
                    });
                }
            }
        });
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};