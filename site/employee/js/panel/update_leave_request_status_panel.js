/* globals app, lx */
'use strict';

// UPDATE LEAVE REQUEST STATUS PANEL
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
app.panel.UpdateLeaveRequestStatus = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentContainerEl = null;
    var loader = null;
    
    var welcomeSectionEl = null;
    var welcomeMessageEl = null;
    var welcomeDeclineBtn = null;
    var welcomeApprovetBtn = null;
    
    var successSectionEl = null;
    var successMessageEl = null;
    var successFinishBtn = null;
    
    var errorSectionEl = null;
    var errorMessageEl = null;
    var errorButtonContainerEl = null;
    var errorOkBtn = null;
    
    var leaveRequestCode = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the requests details
    function loadRequest() {
        // Get the request code
        leaveRequestCode = lx.util.getQueryStringValue('updateLeaveRequestStatus');
        
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getSentRequest',
            data: {
                code: leaveRequestCode
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                loader.destroy();
                
                // Show the contentSectionEl
                lx.applyStyle(contentContainerEl, {display: 'flex'});
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    errorMessageEl.innerHTML = response.error;
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Check if the request was declined
                if( response.request.statusCode === 'DECL' ) {
                    errorMessageEl.innerHTML = 'The leave request has already been declined.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Check if the request was accepted
                if( response.request.statusCode === 'APPR' ) {
                    errorMessageEl.innerHTML = 'The leave request has already been approved.';
                    
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    lx.applyStyle(errorButtonContainerEl, {display: 'none'});
                    
                    return;
                }
                
                // Set the leave description
                let leaveDescription = '';
                leaveDescription = response.request.employeeAlias + ' (' + response.request.employeeCode + '), ' +
                    'an employee of ' + response.request.companyAlias + ', has requested ';
                leaveDescription = leaveDescription + parseFloat(response.request.totalDays).toFixed(2) + ' day(s) ';
                if( response.request.dayFraction == 0.25 ) {
                    leaveDescription = leaveDescription + '[' + parseFloat( response.request.totalDays / response.request.dayFraction ).toFixed(0) + ' quarter-day(s)] ';
                }
                else if( response.request.dayFraction == 0.5 ) {
                    leaveDescription = leaveDescription + '[' + parseFloat( response.request.totalDays / response.request.dayFraction ).toFixed(0) + ' half-day(s)] ';
                }
                
                if( response.request.unitCode === 'HOUR' ) {
                    leaveDescription = leaveDescription + '(' + parseFloat(response.request.totalHours).toFixed(2) + ' hours) ';
                }
                leaveDescription = leaveDescription + 'of \'' + response.request.leaveTypeName + '\' ';
                if( (response.request.totalDays / response.request.dayFraction) > 1 ) {
                    leaveDescription = leaveDescription + 'from ' + response.request.fromDate + ' ';
                    leaveDescription = leaveDescription + 'to ' + response.request.toDate + '.';
                }
                else {
                    leaveDescription = leaveDescription + 'on ' + response.request.fromDate + '.';
                }
                
                // Show the welcom3 message
                lx.applyStyle(welcomeSectionEl, {display: 'flex'});
                
                // Initialize welcome message text
                welcomeMessageEl.innerHTML = '<span style="font-size: 16px;">Good day</span><br /><br />' + leaveDescription;
                
                // Was  reason / note given?
                if( response.request.note !== '' ) {
                    welcomeMessageEl.innerHTML = welcomeMessageEl.innerHTML +
                        '<br /><br />Reason/Note: ' + response.request.note;
                }
                
                // Set the leave available
                let leaveAvailable = parseFloat(response.request.leaveAvailable).toFixed(2);
                if( response.request.unitCode === 'HOUR' ) {
                    leaveAvailable = leaveAvailable + ' hours';
                }
                else {
                    leaveAvailable = leaveAvailable + ' days';
                }
                
                welcomeMessageEl.innerHTML = welcomeMessageEl.innerHTML +
                    '<br /><br />' + response.request.employeeAlias + ' has ' + 
                    leaveAvailable +  ' of \'' + response.request.leaveTypeName + '\' ' + ' available.';
            }
        });
    }
    
    
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
                overflow: 'auto',
                padding: '30px',
                // background: 'linear-gradient(176deg, #FFAB33, #CD6110)',
                // backgroundColor: app.panelBackgroundColor, // '#FC8C3A',
                // backgroundPosition: 'right center',
                // backgroundRepeat: 'no-repeat',
                // backgroundAttachment: 'fixed',
                // backgroundSize: 'cover',
                // backgroundImage: 'url(gfx/wallpaper.png)'
            }
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                flex: '0 0 auto',
                width: '100%',
                maxWidth: '380px',
                minWidth: '300px',
                position: 'relative',
                margin: 'auto 0px'
            }
        });
        
        loader = new lx.component.Loader({
            renderTo: el,
            backgroundColor: null,
            color: '#FFFFFF',
            visible: true
        });
        
        
        //
        // WELCOME SECTION
        //
        
        // Create the welcomeSectionEl element
        welcomeSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create welcom section icon
        lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #FA8B42',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="far fa-envelope" style="font-size: 40px; color: #FA8B42;"></i>'
        });
        
        // Create welcomeMessageEl element
        welcomeMessageEl = lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                boxSizing: 'border-box',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'justify'
            }
        });
        
        // Create the welcomeButtonContainerEl element
        var welcomeButtonContainerEl = lx.createElement('DIV', {
            parent: welcomeSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the welcomeDeclineBtn component
        welcomeDeclineBtn = new lx.component.Button({
            renderTo: welcomeButtonContainerEl,
            label: 'Decline',
            flex: '1 1 100%',
            
            onClick: welcomeDeclineBtnClickEventHandler
        });
        
        // Create the welcomeApprovetBtn component
        welcomeApprovetBtn = new lx.component.Button({
            renderTo: welcomeButtonContainerEl,
            label: 'Approve',
            flex: '1 1 100%',
            margin: '0px 0px 0px 40px',
            
            onClick: welcomeApprovetBtnClickEventHandler
        });
        
        
        //
        // CREATE SUCCESS SECTION
        //
        
        // Create the successSectionEl element
        successSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)'
            }
        });
        
        // Create account section icon
        lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #0E8350',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="fa fa-check" style="font-size: 40px; color: #0E8350; margin: 3px 0px 0px 3px;"></i>'
        });
        
        // Create successMessageEl element
        successMessageEl = lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'center',
                fontSize: '16px'
            }
        });
        
        // Create the successButtonContainerEl element
        var successButtonContainerEl = lx.createElement('DIV', {
            parent: successSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the successFinishBtn component
        successFinishBtn = new lx.component.Button({
            renderTo: successButtonContainerEl,
            label: 'Finish',
            flex: '1 1 100%',
            
            onClick: successFinishBtnClickEventHandler
        });
        
        
        //
        // ERROR SECTION
        //
        
        // Create the errorSectionEl element
        errorSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px 0px 40px 0px',
                backgroundColor: '#FFFFFF',
                boxShadow: '3px 3px 6px 2px rgba(0, 0, 0, 0.5)',
                width: '100%'
            }
        });
        
        // Create error section icon
        lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100px',
                height: '100px',
                border: 'solid 1px #E75B54',
                borderRadius: '50%',
                margin: '60px 0px 0px 0px'
            },
            innerHTML: '<i class="fa fa-times" style="font-size: 40px; color: #E75B54;"></i>'
        });
        
        // Create errorMessageEl element
        errorMessageEl = lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px',
                textAlign: 'center',
                fontSize: '16px'
            }
        });
        
        // Create the errorButtonContainerEl element
        errorButtonContainerEl = lx.createElement('DIV', {
            parent: errorSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                width: '100%',
                margin: '60px 0px 0px 0px',
                padding: '0px 40px'
            }
        });
        
        // Create the errorOkBtn component
        errorOkBtn = new lx.component.Button({
            renderTo: errorButtonContainerEl,
            label: 'Ok',
            flex: '1 1 100%',
            maxWidth: '200px'
        });
        
        
        //
        // BACK TO LOGIN SECTION
        //
        
        // lx.createElement('A', {
        //     parent: contentContainerEl,
        //     style: {
        //         display: 'inline-block',
        //         color: '#FFFFFF',
        //         fontSize: '16px',
        //         margin: '20px 0px 0px 0px',
        //         cursor: 'pointer',
        //         textDecoration: 'none'
        //     },
        //     href: "index.html",
        //     innerHTML: 'Payroll Login'
        // });
        
        // Load request details
        loadRequest();
        
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
    
    // welcomeDeclineBtn click event handler
    function welcomeDeclineBtnClickEventHandler() {
        // Create the add leave request panel
        let leaveRequestDeclinePanel = new app.panel.LeaveRequestDecline({
            maxWidth: '500px',
            maxHeight: '280px',
            margin: '10px',
            
            onCancel: function() {
                app.route.popState();
            },
            
            onDecline: function( declineEvent ) {
                app.route.popState();
                
                welcomeDeclineBtn.showLoader();
                welcomeDeclineBtn.disable();
                lx.sendJSON({
                    url: 'exec.php?c=Leave&fn=updateSentRequestStatus',
                    data: {
                        code:leaveRequestCode,
                        statusCode: 'DECL',
                        statusUpdateMessage: declineEvent.message
                    },
                    onSuccess: function( responseText ) {
                        welcomeDeclineBtn.hideLoader();
                        welcomeDeclineBtn.enable();
                        var response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            errorMessageEl.innerHTML = response.error;
                            lx.applyStyle(welcomeSectionEl, {display: 'none'});
                            lx.applyStyle(errorSectionEl, {display: 'flex'});
                            return;
                        }
                        
                        // If the request was successfully declined show the success section
                        successMessageEl.innerHTML = 'You have successfully declined the request.';
                        
                        lx.applyStyle(welcomeSectionEl, {display: 'none'});
                        lx.applyStyle(successSectionEl, {display: 'flex'});
                    }
                });
            }
        });
        
        // Set and push the state
        let state = {
            panel: leaveRequestDeclinePanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Display the home panel
        leaveRequestDeclinePanel.showModal();
        leaveRequestDeclinePanel.focus();

        
        // welcomeDeclineBtn.showLoader();
        // welcomeDeclineBtn.disable();
        // lx.sendJSON({
        //     url: 'exec.php?c=Leave&fn=updateSentRequestStatus',
        //     data: {
        //         code:leaveRequestCode,
        //         statusCode: 'DECL',
        //         statusUpdateMessage: ''
        //     },
        //     onSuccess: function( responseText ) {
        //         welcomeDeclineBtn.hideLoader();
        //         welcomeDeclineBtn.enable();
        //         var response = JSON.parse(responseText);
                
        //         if( response.ok !== true ) {
        //             errorMessageEl.innerHTML = response.error;
        //             lx.applyStyle(welcomeSectionEl, {display: 'none'});
        //             lx.applyStyle(errorSectionEl, {display: 'flex'});
        //             return;
        //         }
                
        //         // If the request was successfully declined show the success section
        //         successMessageEl.innerHTML = 'You have successfully declined the request.';
                
        //         lx.applyStyle(welcomeSectionEl, {display: 'none'});
        //         lx.applyStyle(successSectionEl, {display: 'flex'});
        //     }
        // });
    }
    
    // welcomeApprovetBtn clicke event handler
    function welcomeApprovetBtnClickEventHandler() {
        welcomeDeclineBtn.showLoader();
        welcomeDeclineBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=updateSentRequestStatus',
            data: {
                code: leaveRequestCode,
                statusCode: 'APPR',
                statusUpdateMessage: ''
            },
            onSuccess: function( responseText ) {
                welcomeDeclineBtn.hideLoader();
                welcomeDeclineBtn.enable();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    errorMessageEl.innerHTML = response.error;
                    lx.applyStyle(welcomeSectionEl, {display: 'none'});
                    lx.applyStyle(errorSectionEl, {display: 'flex'});
                    return;
                }
                
                // If the request was successfully approved show the success section
                successMessageEl.innerHTML = 'You have successfully approved the request.';
                
                lx.applyStyle(welcomeSectionEl, {display: 'none'});
                lx.applyStyle(successSectionEl, {display: 'flex'});
            }
        });
    }
    
    // successFinishBtn click event handler
    function successFinishBtnClickEventHandler() {
        document.location.href = 'index.html';
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};