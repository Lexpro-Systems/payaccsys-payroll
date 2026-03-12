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
    
    var linkProfilePanel = null;
    var switchCompanyPanel = null;
    
    var numActivePanels = 0;
    
    var panelBackgroundColor = null;
    var filterBackgroundColor = null;
    var sectionBackgroundColor = null;
    var sectionTextColor = null;
    var sectionBorderRadius = null;
    var sectionBorderWidth = null;
    
    
    //
    // PUBLIC VARIABLES
    //
    
    // App configuration
    me.config = {
        csrfCookieName: 'payaccsys_payroll_employee_csrf'
    };
    
    // Create application object namespaces
    me.panel =  {};
    me.commonSelectOptions = {};
    me.validators = {};
    me.route = null;
    
    // App main panel.  Initialized in the init function.
    me.mainPanel = null;
    
    // Set app styles
    me.panelBackgroundColor = '#F4F5F6'; // lx.style.global.highlightColor; // '#24388E'; // '#3B81EB'; 
    me.filterBackgroundColor = '#DFDFDF'; // lx.style.global.highlightColor; // '#24388E'; // '#3B81EB'; 
    me.sectionBackgroundColor = '#3C4449'; // lx.style.global.highlightColor; // '#24388E'; // '#3B81EB'; 
    me.sectionTextColor = '#FFFFFF'; // lx.style.global.backgroundColor;
    me.sectionBorderRadius = '7.5px'; // '15px 15px 0px 0px';
    me.sectionBorderWidth = '1px';
    
    
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
            // app.route.destroy();
            
            window.history.back(-1);
        });
        
        // Create our upload manager
        app.uploadManager = new app.UploadManager();
        
        // Check if we received a request to approve a leave request.  If we did show the approve leave request panel.
        if( lx.util.getQueryStringValue('updateLeaveRequestStatus') !== null ) {
            // Display the body once the page has loaded
            document.body.classList.add('loaded');
            document.body.innerHTML = '';
            
            // Display the panel
            new app.panel.UpdateLeaveRequestStatus({
                renderTo: document.body,
                show: true
            });
            
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
        
        // Check if the user is logged in
        lx.sendJSON({
            url: 'exec.php?c=User&fn=isLoggedIn',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                // Display the body once the page has loaded
                document.body.classList.add('loaded');
                document.body.innerHTML = '';
                
                // depending on the response
                if( response.ok === false ) return;
                
                // Is the user logged in?
                if( response.isLoggedIn === true ) {
                    // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                    
                    // Depending on the login result
                    if( response.mustLinkProfile === true ) {
                        // Create the link profile panel
                        linkProfilePanel = new app.panel.LinkProfile({
                            renderTo: document.body,
                            title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Link Company',
                            
                            margin: '20px',
                            maxWidth: '430px',
                            maxHeight: '600px',
                            
                            onAfterShow: function() {
                                if( (typeof loginPanel !== 'undefined') && (loginPanel !== null) ) {
                                    loginPanel.destroy();
                                    loginPanel = null;
                                }
                            },
                            onCancel: linkProfilePanelCancelEventHandler,
                            onProfileLink: linkProfilePanelCompanySelectEventHandler
                        });
                        
                        // Show the modal window
                        linkProfilePanel.showModal();
                        linkProfilePanel.focus();
                    }
                    else if( response.mustSelectCompany === true ) {
                        // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
                        
                        // Create the switch company panel
                        switchCompanyPanel = new app.panel.SwitchCompany({
                            renderTo: document.body,
                            title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Select Company',
                            
                            margin: '40px',
                            maxWidth: '430px',
                            maxHeight: '600px',
                            
                            onAfterShow: function() {
                                loginPanel.destroy();
                                loginPanel = null;
                            },
                            onCancel: switchCompanyPanelCancelEventHandler,
                            onCompanySelect: switchCompanyPanelCompanySelectEventHandler
                        });
                        
                        // Show the modal window
                        switchCompanyPanel.showModal();
                        switchCompanyPanel.focus();
                    }
                    else {
                        // Show the main panel
                        me.mainPanel = new app.panel.Main({
                            renderTo: document.body
                        });
                        me.mainPanel.show();
                        me.mainPanel.focus();
                    }
                }
                else {
                    var loginPanel = new app.panel.Login({
                        renderTo: document.body,
                        
                        onLogin: loginPanelLoginEventHandler
                    });
                    loginPanel.show();
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
        if( me.mainPanel !== null ) me.mainPanel.uploadEmployeeDocument(description, file);
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
    
    me.logout = function() {
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
                                new lx.component.Messagebox({
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
    
    // linkProfilePanel cancel event handler
    function linkProfilePanelCancelEventHandler() {
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
    
    // linkProfilePanel company select event handler
    function linkProfilePanelCompanySelectEventHandler(event) {
        // Was more than one company linked?
        if( event.numLinked > 1 ) {
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            
            // Create the switch company panel
            switchCompanyPanel = new app.panel.SwitchCompany({
                renderTo: document.body,
                title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Select Company',
                
                margin: '20px',
                maxWidth: '430px',
                maxHeight: '600px',
                
                onAfterShow: function() {
                    linkProfilePanel.destroy();
                    linkProfilePanel = null;
                },
                onCancel: switchCompanyPanelCancelEventHandler,
                onCompanySelect: switchCompanyPanelCompanySelectEventHandler
            });
            
            // Show the modal window
            switchCompanyPanel.showModal();
            switchCompanyPanel.focus();
        }
        else {
            // Show the main panel
            me.mainPanel = new app.panel.Main({
                renderTo: document.body
            });
            me.mainPanel.show();
            me.mainPanel.focus();
            
            // Set up handler to handle modal window afterhide event
            linkProfilePanel.addEventListener('afterhide', function() {
                linkProfilePanel.destroy();
                linkProfilePanel = null;
            });
            
            // Hide the modal window
            linkProfilePanel.hide();
        }
    }
    
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
    function switchCompanyPanelCompanySelectEventHandler() {
        // Show the main panel
        me.mainPanel = new app.panel.Main({
            renderTo: document.body
        });
        me.mainPanel.show();
        me.mainPanel.focus();
        
        // Set up handler to handle modal window afterhide event
        switchCompanyPanel.addEventListener('afterhide', function() {
            switchCompanyPanel.destroy();
            switchCompanyPanel = null;
        });
        
        // Hide the modal window
        switchCompanyPanel.hide();
    }
    
    // loginPanel login event handler
    function loginPanelLoginEventHandler( event ) {
        var loginPanel = event.srcPanel;
        
        // Store messages
        unreadMessages = event.unreadMessages;
        
        // Depending on the login result
        if( event.mustLinkProfile === true ) {
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            
            // Create the link profile panel
            linkProfilePanel = new app.panel.LinkProfile({
                renderTo: document.body,
                title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Link Company',
                
                margin: '20px',
                maxWidth: '430px',
                maxHeight: '600px',
                
                onAfterShow: function() {
                    loginPanel.destroy();
                    loginPanel = null;
                },
                onCancel: linkProfilePanelCancelEventHandler,
                onProfileLink: linkProfilePanelCompanySelectEventHandler
            });
            
            // Show the modal window
            linkProfilePanel.showModal();
            linkProfilePanel.focus();
        }
        else if( event.mustSelectCompany === true ) {
            // me.applyStyle(document.body, {background: 'linear-gradient(176deg, #FFAB33, #CD6110)'});
            
            // Create the switch company panel
            switchCompanyPanel = new app.panel.SwitchCompany({
                renderTo: document.body,
                title: '<i class="fa fa-fw fa-building" style="margin: 0px 15px 0px 0px; font-size: 20px;"></i>Select Company',
                
                margin: '20px',
                maxWidth: '430px',
                maxHeight: '600px',
                
                onAfterShow: function() {
                    loginPanel.destroy();
                    loginPanel = null;
                },
                onCancel: switchCompanyPanelCancelEventHandler,
                onCompanySelect: switchCompanyPanelCompanySelectEventHandler
            });
            
            // Show the modal window
            switchCompanyPanel.showModal();
            switchCompanyPanel.focus();
        }
        else {
            // Destroy the login panel
            loginPanel.destroy();
            loginPanel = null;
            
            // Show the main panel
            me.mainPanel = new app.panel.Main({
                renderTo: document.body
            });
            me.mainPanel.show();
            me.mainPanel.focus();
        }
    }
    
    // route state change event handler
    function routeStateChangeEventHandler() {
    }
}

// Create global app object
window.app = new Application();