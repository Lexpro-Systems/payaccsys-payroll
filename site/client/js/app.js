/* globals app, lx */
'use strict';


//
// CREATE APP OBJECT
//

// APPLICATION CLASS
//
// Events:
//
//  onLogin             This event is fired when the user loggs in.  The event handler receives an event object as its only parameter.
//
//                      event.name:
//                          The name of the user that logged in.
//
function Application() {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var unreadMessages = null;
    
    var switchCompanyModal = null;
    var switchCompanyPanel = null;
    
    var trialModal = null;
    var trialPanel = null;
    var setupWizardModal = null;
    var setupWizardPanel = null;
    
    var numActivePanels = 0;
    
    
    //
    // PUBLIC VARIABLES
    //
    
    // App configuration
    me.config = {
        csrfCookieName: 'payaccsys_payroll_csrf'
    };
    
    // Create application object namespaces
    me.panel =  {};
    me.commonSelectOptions = {};
    me.validators = {};
    me.route = null;

    // App main panel.  Initialized in the init function.
    me.mainPanel = null;
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    // App Init Function
    me.init = function() {
        // Extend the app using the EventEmitter class
        lx.EventEmitter.call(this);
        
        // Create the router to handle back button events
        me.route = new lx.StateManager({
            onStateChange: routeStateChangeEventHandler
        });
        
        // Add our initial state
        app.route.pushState(null, function() {
            // Destroy the router and log out.
            app.route.destroy();
            
            window.history.back(-1);
        });
        
        // Create our upload manager
        app.uploadManager = new app.UploadManager();
        
        // Check if we received an invitation code.  If we did show the invitation main panel.
        if( lx.util.getQueryStringValue('invitation') !== null ) {
            // Display the body once the page has loaded
            document.body.classList.add('loaded');
            document.body.innerHTML = '';
            
            // Display the panel
            new app.panel.InvitationMain({
                renderTo: document.body,
                show: true
            });
            
            return;
        }
        
        // // Check if we received a new company request. If we did show the new company request panel panel.
        // if( lx.util.getQueryStringValue('about') !== null ) {
        //     // Display the body once the page has loaded
        //     document.body.classList.add('loaded');
        //     document.body.innerHTML = '';
            
        //     // Display the panel
        //     new app.panel.About({
        //         renderTo: document.body,
        //         show: true
        //     });
            
        //     return;
        // }
        
        // Check if we received a new company request. If we did show the new company request panel panel.
        if( lx.util.getQueryStringValue('newCompanyRequest') !== null ) {
            // Display the body once the page has loaded
            document.body.classList.add('loaded');
            document.body.innerHTML = '';
            
            // Display the panel
            let newCompanyRequestPanel = new app.panel.NewCompanyRequest({
                renderTo: document.body,
                show: true
            });
            newCompanyRequestPanel.show();
            newCompanyRequestPanel.focus();
            
            return;
        }
        
        window.onbeforeunload = function (event) {
            if (app.uploadManager.getPendingCount() !== 0) {
                // Display the body once the page has loaded
                document.body.classList.add('loaded');
                document.body.innerHTML = '';
                
                // Display message to user
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
        
        // Initialize messages
        unreadMessages = [];
        
        //var profilePanel = new app.panel.TemplateModal({
        //    renderTo: document.body,
        //    show: true
        //});
        //
        //return;
        
        // Check if we are logged in
        lx.sendJSON({
            url: 'exec.php?c=User&fn=isLoggedIn',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                // Display the body once the page has loaded
                document.body.classList.add('loaded');
                document.body.innerHTML = '';
                
                // Depending on the response
                if( response.ok === false ) return;
                
                if( response.isLoggedIn === true ) {
                    // Check if the user should select a company
                    if( response.mustSelectCompany === true ) {
                        // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                        // me.applyStyle(document.body, {
                        //     backgroundPosition: 'right center',
                        //     backgroundRepeat: 'no-repeat',
                        //     backgroundAttachment: 'fixed',
                        //     backgroundSize: 'cover',
                        //     backgroundImage: 'url(gfx/wallpaper.png)'
                        // });
                        
                        // Create the modal window to show the switch company panel in.
                        switchCompanyModal = new lx.component.ModalWindow({
                            margin: '40px',
                            maxWidth: '430px',
                            maxHeight: '600px'
                        });
                        
                        // Create the switch company panel.
                        switchCompanyPanel = new app.panel.SwitchCompany({
                            renderTo: switchCompanyModal.getContainer(),
                            title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Select Company',
                            show: true,
                            
                            onCancel: switchCompanyPanelCancelEventHandler,
                            onCompanySelect: switchCompanyPanelCompanySelectEventHandler
                        });
                        
                        // Show the modal window
                        switchCompanyModal.show();
                    }
                    else if( response.trialExpired === true ) {
                        // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                        // me.applyStyle(document.body, {
                        //     backgroundPosition: 'right center',
                        //     backgroundRepeat: 'no-repeat',
                        //     backgroundAttachment: 'fixed',
                        //     backgroundSize: 'cover',
                        //     backgroundImage: 'url(gfx/wallpaper.png)'
                        // });
                        
                        // Create the modal window to show the switch company panel in.
                        trialModal = new lx.component.ModalWindow({
                            margin: '40px',
                            maxWidth: '440px',
                            maxHeight: '640px'
                        });
                        
                        // Create the switch company panel.
                        trialPanel = new app.panel.Trial({
                            renderTo: trialModal.getContainer(),
                            title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Trial Company',
                            show: true,
                            
                            setupComplete: response.setupComplete,
                            
                            onCancel: trialPanelCancelEventHandler,
                            onContinue: trialPanelContinueEventHandler
                        });
                        
                        // Show the modal window
                        trialModal.show();
                    }
                    else if( response.setupComplete === false ) {
                        // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                        // me.applyStyle(document.body, {
                        //     backgroundPosition: 'right center',
                        //     backgroundRepeat: 'no-repeat',
                        //     backgroundAttachment: 'fixed',
                        //     backgroundSize: 'cover',
                        //     backgroundImage: 'url(gfx/wallpaper.png)'
                        // });
                        
                        // Create and show the wizard panel
                        var setupWizardPanel = new app.panel.SetupWizard({
                            renderTo: document.body,
                            show: true,
                            
                            onCancel: setupWizardPanelCancelEventHandler,
                            onFinish: setupWizardPanelFinishEventHandler
                        });
                        setupWizardPanel.focus();
                        
                        // // Create the modal window to show the setup panel
                        // setupWizardModal = new lx.component.ModalWindow({
                        //     margin: '40px',
                        //     maxWidth: '900px',
                        //     maxHeight: '640px'
                        // });
                        
                        // // Create the switch company panel.
                        // setupWizardPanel = new app.panel.SetupWizard({
                        //     renderTo: setupWizardModal.getContainer(),
                        //     title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Setup Wizard',
                        //     show: true
                        // });
                        
                        // // Show the modal window
                        // setupWizardModal.show();
                    }
                    else {
                        // Show the main panel
                        app.mainPanel = new app.panel.Main({
                            renderTo: document.body,
                            show: true
                        });
                    }
                }
                else {
                    var loginPanel = new app.panel.Login({
                        renderTo: document.body,
                        show: true,
                        
                        onLogin: loginPanelLoginEventHandler
                    });
                    loginPanel.focus();
                }
            }
        });
    };
    
    // Function to check if a given message is unread
    //
    // number       The number of the message to check.
    // return       True if the message is unread and false if not.
    me.checkUnreadMessage = function( number ) {
        return unreadMessages.includes( number );
    };
    
    // Function to add a file to the upload list.
    me.uploadEmployeeDocument = function(description, file) {
        if( app.mainPanel !== null ) app.mainPanel.uploadEmployeeDocument(description, file);
    };
    
    // Function apply a list of CSS styles to an element
    //
    // el           The element to apply the styles to
    // style        An object containing style names as keys and their values.
    me.applyStyle = function(el, style) {
        for( var key in style ) {
            // Skip properties inherited by the style object
            if( !style.hasOwnProperty(key) ) continue;
            
            // Check if the property needs to be translated for compatibility
            if( key === 'display' && style[key] === 'flex' ) {
                
                //
                // DISPLAY FLEX
                //
                
                el.style.display = '-webkit-box';
                el.style.display = '-moz-box';
                el.style.display = '-ms-flexbox';
                el.style.display = '-webkit-flex';
                el.style.display = 'flex';
            }
            else if( key === 'appearance' && style[key] === 'none' ) {
                
                //
                // APPEARANCE PROPERTY
                //
                
                el.style['-webkit-appearance'] = 'none';
                el.style['-moz-appearance'] = 'none';
                el.style.appearance = 'none';
            }
            else if( key === 'flex' ) {
                
                //
                // FLEX PROPERTY
                //
                
                el.style['-webkit-flex'] = style[key];
                el.style['-moz-flex'] = style[key];
                el.style['-ms-flex'] = style[key];
                el.style.flex = style[key];
            }
            else if( key === 'flexDirection' ) {
                
                //
                // FLEX-DIRECTION PROPERTY
                //
                
                el.style['-webkit-flex-direction'] = style[key];
                el.style['-ms-flex-direction'] = style[key];
                el.style.flexDirection = style[key];
            }
            else if( key === 'userSelect' ) {
                
                //
                // USER SELECT PROPERTY
                //
                
                el.style['-webkite-user-select'] = style[key];
                el.style['-moz-user-select'] = style[key];
                el.style['-ms-user-select'] = style[key];
                el.style.userSelect = style[key];
            }
            else if( key === 'lineClamp' ) {
                
                //
                // LINE CLAMP PROPARTY
                //
                
                el.style['-webkit-line-clamp'] = style[key];
                el.style.lineClamp = style[key];
            }
            else {
                
                //
                // HANDLE STYLES THAT DO NOT HAVE COMPATIBILITY ISSUES
                //
                
                el.style[key] = style[key];
            }
        }
    };
    
    // Function create an element, apply styling and add event listeners
    //
    // type             The type of element to create.  For example 'DIV'.
    // config           An object describing the element to add.  The object can have the following properties
    //
    //                  parent:
    //                      An optional property specifying an element to append the created element to.  If it is null
    //                      or omitted the element will be created but not appended to any element.
    //                  className:
    //                      Set the item className property
    //                  style:
    //                      An optional property with a style object as value.
    //
    //                      style = {
    //                          display: 'block',
    //                          backgroundColor: '#151515',
    //                          boxSizing: 'border-box',
    //                          .
    //                          .
    //                          .
    //                      }
    //                  events:
    //                      An optional array of event objects describing the events to attach
    //
    //                      events = [
    //                          {
    //                              type: 'click',
    //                              callback: myClickEventHandlerFunction,
    //                              useCapture: false // Optional.  Defaults to false
    //                          },
    //                          .
    //                          .
    //                          .
    //                      ]
    //                  innerHTML:
    //                      Set the innerHTML of the object.  If not provided the innerHTML will not be set
    //
    // return               The created element or null if an error occurred.
    me.createElement = function(type, config) {
        var newElement = null;
        
        // Create the element
        if( typeof type !== 'undefined' && config.type !== null && config.type !== '' ) {
            newElement = document.createElement( type );
        }
        else {
            console.log('lx.createElement : ERROR : Invalid element type \'' + type + '\' specified.');
            return null;
        }
        
        // Loop through config and apply items
        for( var property in config ) {
            if( config.hasOwnProperty(property) === false ) continue;
            
            if( property === 'style' && config.style !== null ) me.applyStyle(newElement, config.style);
            else if( property === 'parent' && config.parent !== null ) config.parent.appendChild( newElement );
            else if( property === 'events' && config.events !== null ) {
                var useCapture = false;
                for( var i = 0; i < config.events.length; i++ ) {
                    useCapture = false;
                    if( config.events[i].hasOwnProperty('useCapture') && config.events[i].useCapture === true ) useCapture = true;
                    
                    // Check that the event listener has a valid type
                    if( config.events[i].hasOwnProperty('type') === false ) {
                        console.log('lx.createElement : ERROR : Event must have a type property');
                        return false;
                    }
                    if( config.events[i].type === null ) {
                        console.log('lx.createElement : ERROR : Event type can not be null');
                        return false;
                    }
                    
                    // Check that the event listener has a valid callback
                    if( config.events[i].hasOwnProperty('callback') === false ) {
                        console.log('lx.createElement : ERROR : Event must have a callback property');
                        return false;
                    }
                    if( config.events[i].callback === null ) {
                        console.log('lx.createElement : ERROR : Event callback can not be null');
                        return false;
                    }
                    
                    newElement.addEventListener(config.events[i].type, config.events[i].callback, useCapture);
                }
            }
            else {
                newElement[property] = config[property];
            }
        }
        
        return newElement;
    };
    
    // Function to return the number of active panels
    me.getActivePanelCount = function() {
        return numActivePanels;
    };
    
    // Function that should be called whenever an active panel is added to keep count of
    // the number of currently active panels (there should always be at least one)
    me.addActivePanel = function() {
        numActivePanels++;
    };
    
    // Function that should be called whenever an active panel is removed to keep count of
    // the number of currently active panels (there should always be at least one)
    me.removeActivePanel = function() {
        numActivePanels--;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // switchCompanyPanel cancel event handler
    function switchCompanyPanelCancelEventHandler() {
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
    
    // switchCompanyPanel company select event handler
    function switchCompanyPanelCompanySelectEventHandler( event ) {
        // Is the company a trial?
        if( event.isTrial !== true ) {
            // Is setup NOT complete?
            if( event.setupComplete === false ) {
                // Display the gradient background
                // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                // me.applyStyle(document.body, {
                //     backgroundPosition: 'right center',
                //     backgroundRepeat: 'no-repeat',
                //     backgroundAttachment: 'fixed',
                //     backgroundSize: 'cover',
                //     backgroundImage: 'url(gfx/wallpaper.png)'
                // });
                
                // Create and show the wizard panel
                var setupWizardPanel = new app.panel.SetupWizard({
                    renderTo: document.body,
                    show: true,
                    
                    onCancel: setupWizardPanelCancelEventHandler,
                    onFinish: setupWizardPanelFinishEventHandler
                });
                setupWizardPanel.focus();
            }
            else {
                // Show the main panel
                app.mainPanel = new app.panel.Main({
                    renderTo: document.body,
                    show: true
                });
            }
            
            // Set up handler to handle modal window afterhide event
            switchCompanyModal.addEventListener('afterhide', function() {
                switchCompanyPanel.destroy();
                switchCompanyPanel = null;
                
                switchCompanyModal.destroy();
                switchCompanyModal = null;
            });
            
            // Hide the modal window
            switchCompanyModal.hide();
        }
        else {
            // Set up handler to handle modal window afterhide event
            switchCompanyModal.addEventListener('afterhide', function() {
                // Destroy the switch company panel
                switchCompanyPanel.destroy();
                switchCompanyPanel = null;
                
                switchCompanyModal.destroy();
                switchCompanyModal = null;
                
                // Display the gradient background
                // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                // me.applyStyle(document.body, {
                //     backgroundPosition: 'right center',
                //     backgroundRepeat: 'no-repeat',
                //     backgroundAttachment: 'fixed',
                //     backgroundSize: 'cover',
                //     backgroundImage: 'url(gfx/wallpaper.png)'
                // });
                    
                // Show the trial panel
                trialModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '440px',
                    maxHeight: '640px',
                    
                    onAfterShow: function() {
                        // switchCompanyPanel.destroy();
                        // switchCompanyPanel = null;
                        
                        // switchCompanyModal.destroy();
                        // switchCompanyModal = null;
                    }
                });
                
                trialPanel = new app.panel.Trial({
                    renderTo: trialModal.getContainer(),
                    title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Trial Company',
                    show: true,
                    
                    setupComplete: event.setupComplete,
                    
                    onCancel: trialPanelCancelEventHandler,
                    onContinue: trialPanelContinueEventHandler
                });
                
                trialModal.show();
            });
            
            // Hide the modal window
            switchCompanyModal.hide();
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
    
    // switchCompanyPanel company select event handler
    function trialPanelContinueEventHandler( event ) {
        // Is setup NOT complete?
        if( event.setupComplete === false ) {
            // Display the gradient background
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            // me.applyStyle(document.body, {
            //     backgroundPosition: 'right center',
            //     backgroundRepeat: 'no-repeat',
            //     backgroundAttachment: 'fixed',
            //     backgroundSize: 'cover',
            //     backgroundImage: 'url(gfx/wallpaper.png)'
            // });
            
            // Create and show the wizard panel
            var setupWizardPanel = new app.panel.SetupWizard({
                renderTo: document.body,
                show: true,
                
                onCancel: setupWizardPanelCancelEventHandler,
                onFinish: setupWizardPanelFinishEventHandler
            });
            setupWizardPanel.focus();
        }
        else {
            // Show the main panel
            app.mainPanel = new app.panel.Main({
                renderTo: document.body,
                show: true
            });
        }
        
        // Set up handler to handle modal window afterhide event
        trialModal.addEventListener('afterhide', function() {
            trialPanel.destroy();
            trialPanel = null;
            
            trialModal.destroy();
            trialModal = null;
        });
        
        // Hide the modal window
        trialModal.hide();
    }
    
    // setupWizardPanel cancel event handler
    function setupWizardPanelCancelEventHandler() {
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
    
    // setupWizardPanel company select event handler
    function setupWizardPanelFinishEventHandler( event ) {
        let setupWizardPanel = event.srcPanel;
        
        // Hide and destroy the setup panel
        document.body.innerHTML = '';
        setupWizardPanel.destroy();
        setupWizardPanel = null;
        
        // Show the main panel
        app.mainPanel = new app.panel.Main({
            renderTo: document.body,
            show: true
        });
    }
    
    // loginPanel login event handler
    function loginPanelLoginEventHandler( event ) {
        var loginPanel = event.srcPanel;
        
        // Store messages
        unreadMessages = event.unreadMessages;
        
        // Depending on the login requirements
        if( event.mustSelectCompany === true ) {
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            // me.applyStyle(document.body, {
            //     backgroundPosition: 'right center',
            //     backgroundRepeat: 'no-repeat',
            //     backgroundAttachment: 'fixed',
            //     backgroundSize: 'cover',
            //     backgroundImage: 'url(gfx/wallpaper.png)'
            // });
            
            switchCompanyModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '430px',
                maxHeight: '600px',
                
                onAfterShow: function() {
                    loginPanel.destroy();
                    loginPanel = null;
                }
            });
            
            switchCompanyPanel = new app.panel.SwitchCompany({
                renderTo: switchCompanyModal.getContainer(),
                title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Select Company',
                show: true,
                
                onCancel: switchCompanyPanelCancelEventHandler,
                onCompanySelect: switchCompanyPanelCompanySelectEventHandler
            });
            
            switchCompanyModal.show();
        }
        else if( event.isTrial === true ) {
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            // me.applyStyle(document.body, {
            //     backgroundPosition: 'right center',
            //     backgroundRepeat: 'no-repeat',
            //     backgroundAttachment: 'fixed',
            //     backgroundSize: 'cover',
            //     backgroundImage: 'url(gfx/wallpaper.png)'
            // });
            
            trialModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '440px',
                maxHeight: '640px',
                
                onAfterShow: function() {
                    loginPanel.destroy();
                    loginPanel = null;
                }
            });
            
            trialPanel = new app.panel.Trial({
                renderTo: trialModal.getContainer(),
                title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Trial Company',
                show: true,
                
                setupComplete: event.setupComplete,
                
                onCancel: trialPanelCancelEventHandler,
                onContinue: trialPanelContinueEventHandler
            });
            
            trialModal.show();
        }
        else if( event.setupComplete === false ) {
            // Destroy the login panel
            loginPanel.destroy();
            loginPanel = null;
            
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            // me.applyStyle(document.body, {
            //     backgroundPosition: 'right center',
            //     backgroundRepeat: 'no-repeat',
            //     backgroundAttachment: 'fixed',
            //     backgroundSize: 'cover',
            //     backgroundImage: 'url(gfx/wallpaper.png)'
            // });
            
            // Create and show the wizard panel
            var setupWizardPanel = new app.panel.SetupWizard({
                renderTo: document.body,
                show: true,
                
                onCancel: setupWizardPanelCancelEventHandler,
                onFinish: setupWizardPanelFinishEventHandler
            });
            setupWizardPanel.focus();
            
            // // Create the modal window to show the setup panel
            // setupWizardModal = new lx.component.ModalWindow({
            //     margin: '40px',
            //     maxWidth: '900px',
            //     maxHeight: '640px'
            // });
            
            // // Create the switch company panel.
            // setupWizardPanel = new app.panel.SetupWizard({
            //     renderTo: setupWizardModal.getContainer(),
            //     title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Setup Wizard',
            //     show: true
            // });
            
            // // Show the modal window
            // setupWizardModal.show();
        }
        else {
            // Destroy the login panel
            loginPanel.destroy();
            loginPanel = null;
            
            // Show the main panel.
            me.mainPanel = new app.panel.Main({
                renderTo: document.body,
                show: true
            });
        }
    }
    
    // route state change event handler
    function routeStateChangeEventHandler() {
    }
}

// Create global app object
window.app = new Application();