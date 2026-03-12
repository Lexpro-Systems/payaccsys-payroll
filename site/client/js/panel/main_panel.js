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
    let fileUploads = null;
    
    let el = null;
    let parentEl = null;
    
    let titleBarEl = null;
    let menuBtnEl = null;
    let menuBtnTooltip = null;
    let userNameEl = null;
    
    let uploadContainerEl = null;
    let uploadDropdownBtn = null;
    let uploadProgressEl = null;
    let uploadDropdownEl = null;
    let uploadNotificationEl = null;
    let uploadListEl = null;
    
    let helpDropdownBtn = null;
    let helpDropdownWhatsNewEl = null;
    let helpDropdownManuelEl = null;
    
    let userDropdownBtn = null;
    let userDropdownBtnTooltip = null;
    let userDropdownProfileEl = null;
    let userDropdownPasswordEl = null;
    let userDropdownSwitchCompanyEl = null;
    let userDropdownLogoutEl = null;
    let userDropdownBtnTooltipLocusEl = null;
    
    let contentContainerEl = null;
    
    let menuEl = null;
    let menuEmployeesEl = null;
    let menuPayrollEl = null;
    let menuAttendanceEl = null;
    let menuDepartmentEl = null;
    let menuTagsEl = null;
    let menuTaxReconciliationsEl = null;
    let menuLoansEl = null;
    let menuLeaveRequestsEl = null;
    let menuSetupEl = null;
    let menuReportsEl = null;
    

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
        fileUploads = [];
        
        // Remember the parent element
        parentEl = compConfig.renderTo;
        
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
                flex: compConfig.flex
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
            innerHTML: 'Payroll'
        });
        
        // Create the userNameEl element
        userNameEl = lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                fontSize: '16px',
                margin: '0px 10px 0px auto',
                padding: '0px 20px 0px 0px',
                borderStyle: 'solid',
                borderWidth: '0px 1px 0px 0px',
                borderColor: '#2C333E'
            },
            innerHTML: ''
        });
        
        
        //
        // UPLOAD MENU
        //
        
        // Create the upload container element
        uploadContainerEl = lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                position: 'relative',
                opacity: 0,
                width: '0px',
                transition: 'width 0.2s 0.0s ease-in, opacity 0.3s 0.1s ease-in'
            }
        });
        
        // Create the uploadProgressEl element
        uploadProgressEl = lx.createElement('DIV', {
            parent: uploadContainerEl,
            style: {
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '35px',
                height: '35px'
            },
            innerHTML: 
                '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" ' + 
                    'style="stroke-width: 1px; stroke: #C9E0FC; fill: none; position: absolute; left: 0px; top: 0px;">' + 
                    '<circle transform="rotate(-90, 16, 16)" cx="16" cy="16" r="12"/>' + 
                '</svg>' + 
                '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" ' + 
                    'style="stroke-width: 1px; stroke: #157DF4; stroke-dasharray: 75; stroke-dashoffset: 75; fill: none; ' + 
                    'position: absolute; left: 0px; top: 0px;">' + 
                    
                    '<circle transform="rotate(-90, 16, 16)" cx="16" cy="16" r="12"/>' + 
                '</svg>'
        });
        
        // Create the upload dropdown button component
        uploadDropdownBtn = new lx.component.DropdownButton({
            renderTo: uploadContainerEl,
            label: '<i class="fas fa-upload"></i>',
            dropdownAlignment: 'right'
        });
        
        // Create the upload notification element
        uploadNotificationEl = lx.createElement('DIV', {
            parent: uploadContainerEl,
            style: {
                left: '18px',
                top: '4px',
                opacity: 0,
                position: 'absolute',
                backgroundColor: '#287C1E',
                border: '2px solid #FFFFFF',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                transition: 'opacity 0.2s 0.0s ease-in',
                pointerEvents: 'none'
            }
        });
        
        // Create the uploadDropdownEl element
        uploadDropdownEl = lx.createElement('DIV', {
            parent: uploadDropdownBtn.getContainer(),
            style: {
                minWidth: '30px',
                minHeight: '30px',
                cursor: 'default',
                overflow: 'auto'
            }
        });
        
        // Create the uploadListEl
        uploadListEl = lx.createElement('DIV', {
            parent: uploadDropdownEl,
            style: {
                maxHeight: '600px'
            }
        });
        
        
        //
        // HELP MENU
        //
        
        // Create the user dropdown button component
        helpDropdownBtn = new lx.component.DropdownButton({
            renderTo: titleBarEl,
            label: '<i class="far fa-question-circle"></i>',
            margin: '0px 0px 0px 0px',
            dropdownAlignment: 'right'
        });
        
        // Create the userDropdownContainerEl element
        let helpDropdownContainerEl = lx.createElement('DIV', {
            parent: helpDropdownBtn.getContainer(),
            style: {
                padding: '5px 0px'
            }
        });
        
        // Create the helpDropdownManualEl element
        helpDropdownWhatsNewEl = lx.createElement('DIV', {
            parent: helpDropdownContainerEl,
            className: 'list-item',
            style: {
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-fw fa-bullhorn" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>What\'s New'
        });
        helpDropdownWhatsNewEl.addEventListener('click', helpDropdownWhatsNewElClickEventHandler);
        
        // Create the helpDropdownManualEl element
        helpDropdownManuelEl = lx.createElement('A', {
            parent: helpDropdownContainerEl,
            className: 'list-item',
            style: {
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                width: '140px',
                padding: '8px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px',
                fontSize: '13px'
            },
            href: 'download/lexpro_payroll_manual.pdf',
            target: '_blank',
            innerHTML: '<i class="fa fa-fw fa-book" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Download Manual'
        });
        
        
        //
        // USER MENU
        //
        
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
        
        // Create the userDropdownBtnTooltipLocusEl element
        userDropdownBtnTooltipLocusEl = lx.createElement('DIV', {
            parent: titleBarEl,
            style: {
                position: 'relative',
                width: '0px',
                height: '50%'
            }
        });
         
        
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
        
        // Create menuEmployeesEl element
        menuEmployeesEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-users" style="margin: 0px 20px 0px 0px;"></i>Employees'
        });
        menuEmployeesEl.addEventListener('click', menuEmployeesElClickEventHandler);
        
        // Create menuPayrollEl element
        menuPayrollEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-scroll" style="margin: 0px 20px 0px 0px;"></i>Payroll'
        });
        menuPayrollEl.addEventListener('click', menuPayrollElClickEventHandler);
        
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
            innerHTML: '<i class="fa fa-fw fa-chart-line" style="margin: 0px 20px 0px 0px;"></i>Reports'
        });
        menuReportsEl.addEventListener('click', menuReportsElClickEventHandler);
        
        // Create menuDepartmentEl element
        menuDepartmentEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-project-diagram" style="margin: 0px 20px 0px 0px;"></i>Departments'
        });
        menuDepartmentEl.addEventListener('click', menuDepartmentElClickEventHandler);

        // Create menuTagsEl element
        menuTagsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-tags" style="margin: 0px 20px 0px 0px;"></i>Tags'
        });
        menuTagsEl.addEventListener('click', menuTagsElClickEventHandler);
        
        // Create menuTaxReconciliationsEl element
        menuTaxReconciliationsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-fw fa-certificate" style="margin: 0px 20px 0px 0px;"></i>Tax Reconciliations'
        });
        menuTaxReconciliationsEl.addEventListener('click', menuTaxReconciliationsElClickEventHandler);
        
        // Create menuLoansEl element
        menuLoansEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-money-bill-wave" style="margin: 0px 20px 0px 0px;"></i>Loans'
        });
        menuLoansEl.addEventListener('click', menuLoansElClickEventHandler);
        
        // Create menuLeaveRequestsEl element
        menuLeaveRequestsEl = lx.createElement('DIV', {
            parent: menuEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fas fa-calendar" style="margin: 0px 25px 0px 0px;"></i>Leave Requests'
        });
        menuLeaveRequestsEl.addEventListener('click', menuLeaveRequestsElClickEventHandler);
        
        // Create setupEl element
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
        
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
        
        // let listPayrunsPanel = new app.panel.ListPayruns({
        //     renderTo: contentContainerEl,
        //     flex: '',
        //     show: true
        // });
        
        // // Push a state for the listPayrunsPanel
        // app.route.pushState({panel: listPayrunsPanel}, function( state ) {
        //     state.panel.destroy();
        // });
        
        // Remember that were adding an active panel
        app.route.continueNavigation();
        app.addActivePanel();
        
        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listPayrunsPanel = new app.panel.ListPayruns({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listPayrunsPanel
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
            listPayrunsPanel.show();
            listPayrunsPanel.focus();
        });
        
        // Load user details
        loadUserDetails();
        
        
        // Create menuBtnTooltip component
        if( true === true ) {
            menuBtnTooltip = new lx.component.Tooltip({
                renderTo: uploadContainerEl,
                alignment: 'bottomRight',
                arrowOffset: '10px',
                width: '100%',
                maxWidth: '265px',
                padding: '15px',
                backgroundColor: '#4885F4',
                message: '<span style="font-size: 14px;">Uploads</span><br /><br />' +
                'The document upload information can be accessed by clicking here.</br>' +
                'Here you will be able to track your upload progress and view their status.'
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
                    // lx.sendJSON({
                    //     url: 'exec.php?c=User&fn=readUserMessage',
                    //     data: {
                    //         number: 1
                    //     }
                    // });
                    
                }
            });
            
            window.setTimeout(function() {
                menuBtnTooltip.show();
            }, 500);
        }
        
        
        //
        // SHOW WHATS NEW PANEL IF NOT READ
        //
        
        if( app.checkUnreadMessage(4) === true ) {
            // Create a modal window
            let whatsNewModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '700px',
                maxHeight: '800px'
            });
            
            // Create the whatsNewPanel panel
            let whatsNewPanel = new app.panel.WhatsNew({
                renderTo: whatsNewModal.getContainer(),
                show: true,
                
                onCancel: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            whatsNewModal.addEventListener('destroy', function() {
                whatsNewPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: whatsNewModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            whatsNewModal.show();
        }
        
        
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
                            renderTo: userDropdownBtnTooltipLocusEl, // userDropdownBtn.getContainer(),
                            alignment: 'bottomRight',
                            arrowOffset: '23px',
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
        
        // Set up upload manager events
        app.uploadManager.addEventListener('enqueue', appUploadManagerEnqueueEventHandler);
        app.uploadManager.addEventListener('uploadprogress', appUploadManagerUploadProgressEventHandler);
        app.uploadManager.addEventListener('uploadcomplete', appUploadManagerUploadCompleteEventHandler);
        app.uploadManager.addEventListener('uploadremove', appUploadManagerUploadRemoveEventHandler);
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
    
    // menuEmployeesEl click event handler
    function menuEmployeesElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listEmployeesPanel = new app.panel.ListEmployees({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
        //     listEmployeesPanel.focus();
            
        //     // Push a state for the listEmployeesPanel
        //     app.route.pushState({panel: listEmployeesPanel}, function( state ) {
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
            let listEmployeesPanel = new app.panel.ListEmployees({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listEmployeesPanel
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
            listEmployeesPanel.show();
            listEmployeesPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuPayrollEl click event handler
    function menuPayrollElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listPayrunsPanel = new app.panel.ListPayruns({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listPayrunsPanel
        //     app.route.pushState({panel: listPayrunsPanel}, function( state ) {
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
            let listPayrunsPanel = new app.panel.ListPayruns({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listPayrunsPanel
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
            listPayrunsPanel.show();
            listPayrunsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
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
    
    // menuReportsEl click event handler
    function menuReportsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let reportsPanel = new app.panel.Reports({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listDepartmentsPanel
        //     app.route.pushState({panel: reportsPanel}, function( state ) {
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
    
    // menuDepartmentEl click event handler
    function menuDepartmentElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listDepartmentsPanel = new app.panel.ListDepartments({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listDepartmentsPanel
        //     app.route.pushState({panel: listDepartmentsPanel}, function( state ) {
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
            let listDepartmentsPanel = new app.panel.ListDepartments({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listDepartmentsPanel
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
            listDepartmentsPanel.show();
            listDepartmentsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }

    function menuTagsElClickEventHandler() {
        app.route.continueNavigation();
        app.addActivePanel();

        // Open the panel as the first panel (all other panel are discarded)
        app.route.navigateTo(0, function() {
            // Create the panel
            let listTagsPanel = new app.panel.ListTags({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listTagsPanel
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
            listTagsPanel.show();
            listTagsPanel.focus();
        });
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuTaxReconciliationsEl click event handler
    function menuTaxReconciliationsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listTaxReconciliationsPanel = new app.panel.ListTaxReconciliations({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listTaxReconciliationsPanel
        //     app.route.pushState({panel: listTaxReconciliationsPanel}, function( state ) {
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
            let listTaxReconciliationsPanel = new app.panel.ListTaxReconciliations({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listTaxReconciliationsPanel
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
            listTaxReconciliationsPanel.show();
            listTaxReconciliationsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuLoansEl click event handler
    function menuLoansElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listLoansPanel = new app.panel.ListLoans({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listLoansPanel
        //     app.route.pushState({panel: listLoansPanel}, function( state ) {
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
            let listLoansPanel = new app.panel.ListLoans({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listLoansPanel
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
            listLoansPanel.show();
            listLoansPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuLeaveRequestsEl click event handler
    function menuLeaveRequestsElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listLeaveRequestsPanel = new app.panel.ListLeaveRequests({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listLoansPanel
        //     app.route.pushState({panel: listLeaveRequestsPanel}, function( state ) {
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
            let listLeaveRequestsPanel = new app.panel.ListLeaveRequests({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: listLeaveRequestsPanel
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
            listLeaveRequestsPanel.show();
            listLeaveRequestsPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // menuSetupEl click event handler
    function menuSetupElClickEventHandler() {
        // app.route.navigateTo(0, function() {
        //     let listDepartmentsPanel = new app.panel.ViewSetup({
        //         renderTo: contentContainerEl,
        //         flex: '',
        //         show: true
        //     });
            
        //     // Push a state for the listDepartmentsPanel
        //     app.route.pushState({panel: listDepartmentsPanel}, function( state ) {
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
            let viewSetupPanel = new app.panel.ViewSetup({
                renderTo: contentContainerEl
            });
            
            // Set and push the state
            let state = {
                panel: viewSetupPanel
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
            viewSetupPanel.show();
            viewSetupPanel.focus();
        });
        
        // Hide the menu
        menuVisible = false;
        lx.applyStyle(menuEl, {left: '-250px'});
    }
    
    // helpDropdownWhatsNewEl click event handler
    function helpDropdownWhatsNewElClickEventHandler() {
        // Create a modal window
        let whatsNewModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '700px',
            maxHeight: '800px'
        });
        
        // Create the whatsNewPanel panel
        let whatsNewPanel = new app.panel.WhatsNew({
            renderTo: whatsNewModal.getContainer(),
            show: true,
            showDontShowCheckbox: false,
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        whatsNewModal.addEventListener('destroy', function() {
            whatsNewPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: whatsNewModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        whatsNewModal.show();
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
            onCompanySelect: function( event ) {
                // Is the company not a trial?
                if( event.isTrial != true ) {
                    // Reload the page
                    document.location.reload();
                }
                else {
                    // Set up handler to handle modal window afterhide event
                    switchCompanyModal.addEventListener('afterhide', function() {
                        // Clear the contents of the parent element to display a blank page
                        parentEl.innerHTML = '';
                        
                        // Show the trial panel
                        let trialModal = new lx.component.ModalWindow({
                            margin: '40px',
                            maxWidth: '440px',
                            maxHeight: '640px',
                            
                            onAfterShow: function() {
                                // Display the gradient background
                                // lx.applyStyle(parentEl, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                                // lx.applyStyle(parentEl, {
                                //     backgroundPosition: 'right center',
                                //     backgroundRepeat: 'no-repeat',
                                //     backgroundAttachment: 'fixed',
                                //     backgroundSize: 'cover',
                                //     backgroundImage: 'url(gfx/wallpaper.png)'
                                // });
                            }
                        });
                        
                        new app.panel.Trial({
                            renderTo: trialModal.getContainer(),
                            title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Trial Company',
                            show: true,
                            
                            onCancel: trialPanelCancelEventHandler,
                            onContinue:  function() {
                                document.location.reload();
                            }
                        });
                        
                        trialModal.show();
                    });
                    
                    // Hide the modal window
                    switchCompanyModal.hide();
                }
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
        
        // Check upload manager for pending files
        let message = 'Are you sure you want to log out?';
        if (app.uploadManager.getPendingCount() !== 0) {
            window.onbeforeunload = null;
            message = 'There are file uploads pending. Logging out now will cancel pending uploads. </br> Are you sure you want to log out?';
        }
        
        // Confirm logout
        new lx.component.Messagebox({
            title: 'Confirm Logout',
            message: message,
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
                else {
                    window.onbeforeunload = function (event) {
                        if (app.uploadManager.getPendingCount() !== 0) {
                            event.returnValue = true;
                            new lx.component.Messagebox({
                                title: 'File Uploads',
                                message: 'There are '+ app.uploadManager.getPendingCount() +' file uploads pending.',
                                icon: 'icon_ok',
                                
                                buttons: [
                                    {name: 'ok', label: 'Ok'}
                                ]
                            });
                        }
                    };
                }
            }
        });
    }
    
    // upload button click event handler
    function uploadBtnClickEventHandler( event ) {
        let uploadIndex = null;
        for( let i = 0; i < fileUploads.length; i++ ) {
            if( fileUploads[i].buttonEl === event.currentTarget ) {
                uploadIndex = i;
                break;
            }
        }
        
        // Check that we found the index of the upload
        if( uploadIndex === null ) return;
        
        // Remove the upload clicked
        app.uploadManager.removeUpload( fileUploads[uploadIndex].uploadId );
    }
    
    // appUploadManager enqueue event handler
    function appUploadManagerEnqueueEventHandler( event ) {
        let uploadInfo = app.uploadManager.getUpload( event.uploadId );
        
        // Show the uploads icon
        lx.applyStyle(uploadContainerEl, {
            width: '32px',
            opacity: 1,
            transition: 'width 0.2s 0.0s ease-in, opacity 0.3s 0.2s ease-in'
        });
        
        let fileUpload = {
            uploadId: event.uploadId,
            el: null
        };
        
        // Add an item to the uploadListEl for this file.
        fileUpload.el = lx.createElement('DIV', {
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '400px',
                borderStyle: 'solid',
                borderColor: '#EAEAEA',
                borderWidth: '0px 0px 0px 0px',
                padding: '10px 0px 10px 0px'
            }
        });
        
        // Create iconEl
        fileUpload.iconEl = lx.createElement('DIV', {
            parent: fileUpload.el,
            style: {
                flex: '0 0 auto',
                padding: '10px 25px'
            },
            innerHTML: '<i class="far fa-file" style="font-size: 20px;"></i>'
        });
        
        // Create the detailsContainerEl
        let detailsContainerEl = lx.createElement('DIV', {
            parent: fileUpload.el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: '1 1 100%',
                width: '0px'
            }
        });
        
        // Create the description element
        fileUpload.descriptionEl = lx.createElement('DIV', {
            parent: detailsContainerEl,
            style: {
                flex: '0 0 auto',
                fontSize: '12px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                width: '100%'
            },
            innerHTML: uploadInfo.file.name
        });
        
        // create the progressEl
        fileUpload.progressEl = lx.createElement('DIV', {
            parent: detailsContainerEl,
            style: {
                height: '2px',
                backgroundColor: '#EAEAEA',
                margin: '8px 0px 0px 0px',
                width: '100%'
            },
            innerHTML: '<div style="background-color: #157DF4; width: 0px; height: 100%;"></div>'
        });
        
        let detailsEl = lx.createElement('DIV', {
            parent: detailsContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                margin: '8px 0px 0px 0px',
                fontSize: '10px'
            }
        });
        
        // Create the statusEl element
        fileUpload.statusEl = lx.createElement('DIV', {
            parent: detailsEl,
            innerHTML: 'Pending'
        });
        
        // Create the fileSizeEl element
        fileUpload.fileSizeEl = lx.createElement('DIV', {
            parent: detailsEl,
            innerHTML: '0 / ' + uploadInfo.file.size
        });
        
        // Create the buttonEl element
        fileUpload.buttonEl = lx.createElement('DIV', {
            parent: fileUpload.el,
            style: {
                padding: '10px 25px',
                cursor: 'pointer'
            },
            innerHTML: '<i class="fa fa-times"></i>'
        });
        fileUpload.buttonEl.addEventListener('click', uploadBtnClickEventHandler);
        
        // Add the item to the top of the uploadListEl
        if( uploadListEl.children.length > 0 ) {
            uploadListEl.insertBefore(fileUpload.el, uploadListEl.firstChild);
        }
        else {
            uploadListEl.appendChild( fileUpload.el );
        }
        
        // Show the progress indicator
        lx.applyStyle(uploadProgressEl, {display: 'block'});
        
        fileUploads.push( fileUpload );
    }
    
    // appUploadManager uploadprogress event handler
    function appUploadManagerUploadProgressEventHandler( event ) {
        let progressPercentage = Math.floor(event.uploadProgress / event.uploadSize * 100);
        let totalProgressPecentage = Math.floor(event.totalProgress / event.totalSize * 100);
        
        // Update overall progress display
        lx.applyStyle(uploadProgressEl.children[1], {
            strokeDashoffset: (75 - (75 / 100 * totalProgressPecentage))
        });
        
        // Find the element for the file being uploaded
        let fileUploadIndex = null;
        for( let i = 0; i < fileUploads.length; i++ ) {
            if( fileUploads[i].uploadId === event.uploadId ) {
                fileUploadIndex = i;
                break;
            }
        }
        if( fileUploadIndex === null ) return;
        
        lx.applyStyle(fileUploads[fileUploadIndex].progressEl.firstChild, {
            width: progressPercentage + '%'
        });
        
        fileUploads[fileUploadIndex].statusEl.innerHTML = 'Uploading';
        fileUploads[fileUploadIndex].fileSizeEl.innerHTML = event.uploadProgress + ' / ' + event.uploadSize;
        lx.applyStyle(fileUploads[fileUploadIndex].statusEl, {color: 'inherit'});
    }
    
    // appUploadManager uploadcomplete event handler
    function appUploadManagerUploadCompleteEventHandler( event ) {
        let uploadInfo = app.uploadManager.getUpload( event.uploadId );
        
        for( let i = 0; i < fileUploads.length; i++ ) {
            if( fileUploads[i].uploadId === event.uploadId ) {
                if( uploadInfo.status === 'done' ) {
                    fileUploads[i].buttonEl.innerHTML = '<i class="fa fa-check"></i>';
                    fileUploads[i].statusEl.innerHTML = 'Done';
                    fileUploads[i].fileSizeEl.innerHTML = '';
                }
                else {
                    fileUploads[i].iconEl.innerHTML = '<i class="fa fa-exclamation-triangle"></i>';
                    fileUploads[i].buttonEl.innerHTML = '<i class="fa fa-times"></i>';
                    lx.applyStyle(fileUploads[i].statusEl, {color: lx.style.global.errorColor});
                    fileUploads[i].statusEl.innerHTML = uploadInfo.error;
                    fileUploads[i].fileSizeEl.innerHTML = '';
                }
                
                break;
            }
        }
        
        if( app.uploadManager.getPendingCount() === 0 ) {
            // Reset the upload progress indicator
            lx.applyStyle(uploadProgressEl.children[1], {strokeDashoffset: '75'});
            
            // Hide the progress element
            lx.applyStyle(uploadProgressEl, {display: 'none'});
        }
        
        // Show indicator if an upload failed.
        if( app.uploadManager.getFailedCount() !== 0 ) {
            lx.applyStyle(uploadNotificationEl, {
                backgroundColor: lx.style.global.errorColor,
                opacity: 1
            });
        }
    }
    
    // app.uploadManager uploadremove event handler
    function appUploadManagerUploadRemoveEventHandler( event ) {
        for( let i = 0; i < fileUploads.length; i++ ) {
            if( fileUploads[i].uploadId === event.uploadId ) {
                uploadListEl.removeChild( fileUploads[i].el );
                fileUploads.splice(i, 1);
                break;
            }
        }
        
        if( fileUploads.length === 0 ) {
            uploadDropdownBtn.hideDropdown();
            lx.applyStyle(uploadContainerEl, {
                opacity: 0,
                width: '0px',
                transition: 'opacity 0.3s 0.0s ease-in, width 0.2s 0.3s ease-in'
            });
        }
        
        // Hide indicator if there are no more failed uploads
        if( app.uploadManager.getFailedCount() !== 0 ) {
            lx.applyStyle(uploadNotificationEl, {
                backgroundColor: lx.style.global.errorColor,
                opacity: 1
            });
        }
        else {
            lx.applyStyle(uploadNotificationEl, {
                opacity: 0
            });
        }
    }
    
    // trialPanel cancel event handler
    function trialPanelCancelEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=User&fn=logout',
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Logout Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                window.location.reload();
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};