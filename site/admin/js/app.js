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
    
    var numActivePanels = 0;
    
    // var switchCompanyModal = null;
    // var switchCompanyPanel = null;
    
    
    //
    // PUBLIC VARIABLES
    //
    
    // App configuration
    me.config = {
        csrfCookieName: 'payaccsys_payroll_admin_csrf'
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
        // Extend Application with lx.EventEmitter
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
        
        // // Check if we received an invitation code.  If we did show the invitation main panel.
        // if( lx.util.getQueryStringValue('invitation') !== null ) {
        //     // Display the body once the page has loaded
        //     document.body.classList.add('loaded');
        //     document.body.innerHTML = '';
            
        //     // Display the invitation panel
        //     new app.panel.InvitationMain({
        //         renderTo: document.body,
        //         show: true
        //     });
            
        //     return;
        // }
        
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
                    // Show the main panel
                    app.mainPanel = new app.panel.Main({
                        renderTo: document.body
                    });
                    
                    app.mainPanel.show();
                    app.mainPanel.focus();
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
    
    // // switchCompanyPanel cancel event handler
    // function switchCompanyPanelCancelEventHandler() {
    //     app.sendJSON({
    //         url: 'exec.php?c=User&fn=logout',
    //         onSuccess: function( responseText ) {
    //             var response = JSON.parse( responseText );
                
    //             if( response.ok !== true ) {
    //                 new app.component.Messagebox({
    //                     title: 'Logout Failed',
    //                     message: response.error
    //                 });
                    
    //                 return;
    //             }
                
    //             window.location.reload();
    //         }
    //     });
    // }
    
    // // switchCompanyPanel company select event handler
    // function switchCompanyPanelCompanySelectEventHandler() {
    //     // Show the main panel
    //     app.mainPanel = new app.panel.Main({
    //         renderTo: document.body,
    //     });
        
    //     app.mainPanel.show();
    //     app.mainPanel.focus();
        
    //     // Set up handler to handle modal window afterhide event
    //     switchCompanyModal.addEventListener('afterhide', function() {
    //         switchCompanyPanel.destroy();
    //         switchCompanyPanel = null;
            
    //         switchCompanyModal.destroy();
    //         switchCompanyModal = null;
    //     });
        
    //     // Hide the modal window
    //     switchCompanyModal.hide();
    // }
    
    // loginPanel login event handler
    function loginPanelLoginEventHandler( event ) {
        var loginPanel = event.srcPanel;
        
        // Destroy the login panel
        loginPanel.destroy();
        loginPanel = null;
        
        // Show the main panel.
        me.mainPanel = new app.panel.Main({
            renderTo: document.body
        });
        
        me.mainPanel.show();
        me.mainPanel.focus();
    }
    
    // route state change event handler
    function routeStateChangeEventHandler() {
    }
}

//
// CREATE GLOBAL APP OBJECT
//

window.app = new Application();