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
    let menuBtnTooltip = null;
    let userNameEl = null;
    
    let userDropdownBtn = null;
    let userDropdownBtnTooltip = null;
    let userDropdownProfileEl = null;
    let userDropdownPasswordEl = null;
    let userDropdownSwitchCompanyEl = null;
    let userDropdownLogoutEl = null;
    
    let contentContainerEl = null;
    
    let menuEl = null;
    let menuAttendanceEl = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
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
                
                // Set company and user details
                userNameEl.innerHTML = result.user.company.name + ': ' + result.user.name;
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%'
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
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
                margin: '0px 0px 0px 10px',
                position: 'relative'
            }
        });
        menuBtnEl.appendChild( lx.icon.create('menu', '#0F0F0F', 16, 1) );
        menuBtnEl.addEventListener('mousedown', menuBtnElMouseDownEventHandler);
        menuBtnEl.addEventListener('mouseup', menuBtnElMouseUpEventHandler);
        
        // Create the logo element
        lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                width: '120px',
                height: '18px',
                backgroundImage: 'url(\'gfx/logo_alt.png\')',
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
            innerHTML: 'Payroll Attendance Register'
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
        
        // Crete the userDropdownSwitchCompanyEl element
        userDropdownSwitchCompanyEl = lx.createElement('DIV', {
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
            innerHTML: '<i class="fa fa-fw fa-exchange-alt" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Switch Company'
        });
        userDropdownSwitchCompanyEl.addEventListener('click', userDropdownSwitchCompanyElClickEventHandler);
        
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
        
        // Create menuAttendanceEl element
        menuAttendanceEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="far fa-fw fa-clock" style="margin: 0px 20px 0px 0px;"></i>Attendance'
        });
        menuAttendanceEl.addEventListener('click', menuAttendanceElClickEventHandler);
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
        
        // let attendancePanel = new app.panel.Attendance({
        //     renderTo: contentContainerEl,
        //     flex: '',
        //     show: true
        // });
        
        // // Push a state for the attendancePanel
        // app.route.pushState({panel: attendancePanel}, function( state ) {
        //     state.panel.destroy();
        // });
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let attendancePanel = new app.panel.Attendance({
                renderTo: contentContainerEl
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
            
            // Display the panel
            attendancePanel.show();
            attendancePanel.focus();
        });
        
        // Load user details
        loadUserDetails();
        
        
        //
        // SHOW MENU TOOLTIPS IF NOT ALREADY READ
        //
        
        // Create menuBtnTooltip component
        if( app.checkUnreadMessage(1) === true ) {
            menuBtnTooltip = new lx.component.Tooltip({
                renderTo: menuBtnEl,
                alignment: 'bottomLeft',
                arrowOffset: 'center',
                width: '100%',
                maxWidth: '265px',
                padding: '15px',
                backgroundColor: '#4885F4',
                message: '<span style="font-size: 14px;">Main Menu</span><br /><br />The main menu can be accessed by clicking on the 3 bar icon.'
            });
            
            // Add gotit button
            new lx.component.Button({
                renderTo: menuBtnTooltip.getContainer(),
                label: 'Got It',
                style: 'text',
                width: '50px',
                margin: '10px 0px 0px auto',
                color: '#FFFFFF',
                
                onClick: function() {
                    menuBtnTooltip.destroy();
                    
                    // Mark the message as read
                    lx.sendJSON({
                        url: 'exec.php?c=User&fn=readUserMessage',
                        data: {
                            number: 1
                        }
                    });
                    
                    // Create userMenu tooltip component
                    if( app.checkUnreadMessage(2) === true ) {
                        userDropdownBtnTooltip = new lx.component.Tooltip({
                            renderTo: userDropdownBtn.getEl(),
                            alignment: 'bottomRight',
                            arrowOffset: 'center',
                            width: '100%',
                            maxWidth: '265px',
                            padding: '15px',
                            backgroundColor: '#4885F4',
                            message: 
                                '<span style="font-size: 14px;">User Menu</span><br /><br />' + 
                                'The user menu can be accessed by clicking on the gear icon.<br /><br />' + 
                                'Here you will find user related options such as ' + 
                                'updating your profile, changing your password or logging out.'
                        });
                        
                        // Add gotit button
                        new lx.component.Button({
                            renderTo: userDropdownBtnTooltip.getContainer(),
                            label: 'Got It',
                            style: 'text',
                            width: '50px',
                            margin: '10px 0px 0px auto',
                            color: '#FFFFFF',
                            
                            onClick: function() {
                                userDropdownBtnTooltip.destroy();
                                
                                // Mark the message as read
                                lx.sendJSON({
                                    url: 'exec.php?c=User&fn=readUserMessage',
                                    data: {
                                        number: 2
                                    }
                                });
                            }
                        });
                        
                        window.setTimeout(function() {
                            userDropdownBtnTooltip.show();
                        }, 300);
                    }
                }
            });
            
            window.setTimeout(function() {
                menuBtnTooltip.show();
            }, 500);
        }
        
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
    
    // Function to get the container from its index
    //
    // index            The index of the container to get
    // return           The container element at index.
    me.getContainer = function() {
        return contentContainerEl;
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
    
    // menuAttendanceEl click event handler
    function menuAttendanceElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let attendancePanel = new app.panel.Attendance({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listPayrunsPanel
        //     app.route.pushState({panel: attendancePanel}, function( state ) {
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
            let attendancePanel = new app.panel.Attendance({
                renderTo: contentContainerEl
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
            
            // Display the panel
            attendancePanel.show();
            attendancePanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // userDropdownProfileEl click event handler
    function userDropdownProfileElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        // Create a modal for the profile panel
        let modalWindow = new lx.component.ModalWindow({
            margin: '40px',
            maxHeight: '100%',
            maxWidth: '600px'
        });
        
        let profilePanel = new app.panel.UserProfile({
            renderTo: modalWindow.getContainer(),
            height: '100%',
            show: true,
            
            onCancel: function() {
                modalWindow.addEventListener('afterhide', function() {
                    modalWindow.destroy();
                    modalWindow = null;
                    profilePanel.destroy();
                    profilePanel = null;
                });
                
                modalWindow.hide();
            }
        });
        
        modalWindow.show();
        profilePanel.focus();
    }
    
    // userDropdownPasswordEl click event handler
    function userDropdownPasswordElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        // Create a modal for the change password panel
        let modalWindow = new lx.component.ModalWindow({
            margin: '40px',
            maxHeight: '369px',
            maxWidth: '350px'
        });
        
        let changePasswordPanel = new app.panel.ChangePassword({
            renderTo: modalWindow.getContainer(),
            height: '100%',
            show: true,
            
            onCancel: function() {
                modalWindow.addEventListener('afterhide', function() {
                    modalWindow.destroy();
                    modalWindow = null;
                    changePasswordPanel.destroy();
                    changePasswordPanel = null;
                });
                
                modalWindow.hide();
            },
            onDone: function() {
                modalWindow.addEventListener('afterhide', function() {
                    modalWindow.destroy();
                    modalWindow = null;
                    changePasswordPanel.destroy();
                    changePasswordPanel = null;
                });
                
                modalWindow.hide();
            }
        });
        
        modalWindow.show();
        changePasswordPanel.focus();
    }
    
    // userDropdownSwitchCompanyEl click event handler
    function userDropdownSwitchCompanyElClickEventHandler() {
        userDropdownBtn.hideDropdown();
        
        // Create a modal window
        let switchCompanyModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '430px',
            maxHeight: '600px'
        });
        
        // Create the editAddressDetailsPanel panel
        let switchCompanyPanel = new app.panel.SwitchCompany({
            renderTo: switchCompanyModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onCompanySelect: function() {
                document.location.reload();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        switchCompanyModal.addEventListener('destroy', function() {
            switchCompanyPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: switchCompanyModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        switchCompanyModal.show();
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