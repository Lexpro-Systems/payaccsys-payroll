/* jslint node: true */
/* globals app, lx */
'use strict';


// MISCELLANEOUS SETUP PANEL
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
app.panel.MiscellaneousSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var employeesSectionEl = null;
    var sendBirthdayNotificationsCb = null;
    
    var payrunsSectionEl = null;
    var emailPayslipsCb = null;
    
    var leaveRequestSectionEl = null;
    var leaveRequestEditBtn = null;
    var leaveRequestAdminEmailDisplay = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load setup details
    function loadSetup() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=get',
            
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Setup Failed',
                        message: response.error
                    });
                    return;
                }
                
                sendBirthdayNotificationsCb.setValue( response.setup.sendBirthdayNotifications );
                emailPayslipsCb.setValue( response.setup.emailPayslipsOnPayrunProcess );
                leaveRequestAdminEmailDisplay.setValue( response.setup.leaveRequestAdminEmailAddress );
                
                loader.hide();
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
                overflow: '',
                backgroundColor: '#F4F5F6'
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Miscellaneous'
        });
        
        
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
        // EMPLOYEES SECTION
        //
        
        // Create the employees heading element
        lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '50px',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employees</div>'
        });
        
        // Create the employeesSectionEl element
        employeesSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let sendBirthdayNotificationsContainerEl = new lx.createElement('DIV', {
            parent: employeesSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the sendBirthdayNotificationsCb component
        sendBirthdayNotificationsCb = new lx.component.Checkbox({
            renderTo: sendBirthdayNotificationsContainerEl,
            label: 'Send Birthday Notifications',
            labelAlign: 'left',
            margin: '0px auto 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            width: '500px',
            
            onChange: sendBirthdayNotificationsCbChangeEventHandler
        });
        
        // Create an info icon
        let sendBirthdayNotificationsInfoEl = new lx.createElement('DIV', {
            parent: sendBirthdayNotificationsContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the element used to position the tooltip
        let sendBirthdayNotificationsTooltipLocusEl = lx.createElement('DIV', {
            parent: sendBirthdayNotificationsContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let sendBirthdayNotificationsTooltip = new lx.component.Tooltip({
            renderTo: sendBirthdayNotificationsTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'If this option is checked, all employees, apart from the person(s) whose birthday it is, will receive an email notifying them of birthdays on the evening prior to the birthday.' +
                '</span>'
        });
        sendBirthdayNotificationsInfoEl.addEventListener('mouseenter', function() { sendBirthdayNotificationsTooltip.show(); });
        sendBirthdayNotificationsInfoEl.addEventListener('mouseleave', function() { sendBirthdayNotificationsTooltip.hide(); });
        
        
        //
        // PAYRUNS SECTION
        //
        
        // Create the payruns heading element
        lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '50px',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Payruns</div>'
        });
        
        // Create the payrunsSectionEl element
        payrunsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let emailPayslipsContainerEl = new lx.createElement('DIV', {
            parent: payrunsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the emailPayslipsCb component
        emailPayslipsCb = new lx.component.Checkbox({
            renderTo: emailPayslipsContainerEl,
            label: 'Email Payslips on Process',
            labelAlign: 'left',
            margin: '0px auto 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            width: '500px',
            
            onChange: emailPayslipsCbChangeEventHandler
        });
        
        // Create an info icon
        let emailPayslipsInfoEl = new lx.createElement('DIV', {
            parent: emailPayslipsContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the element used to position the tooltip
        let emailPayslipsTooltipLocusEl = lx.createElement('DIV', {
            parent: emailPayslipsContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let emailPayslipsTooltip = new lx.component.Tooltip({
            renderTo: emailPayslipsTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'This signifies the default option for emailing payslips when processing payruns. The option is not enforced and may overridden when the payrun is processed.' +
                '</span>'
        });
        emailPayslipsInfoEl.addEventListener('mouseenter', function() { emailPayslipsTooltip.show(); });
        emailPayslipsInfoEl.addEventListener('mouseleave', function() { emailPayslipsTooltip.hide(); });
        
        
        //
        // LEAVE REQUESTS SECTION
        //
        
        // Create the leave request heading element
        let leaveRequestHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Requests</div>'
        });
        
        // Create leaveRequestEditBtn component
        leaveRequestEditBtn = new lx.component.Button({
            renderTo: leaveRequestHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: leaveRequestEditBtnClickEventhandler
        });
        
        // Create leaveRequestSectionEl element
        leaveRequestSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '20px 15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create a container for the component as well as the info icon
        let leaveRequestAdminEmailContainerEl = new lx.createElement('DIV', {
            parent: leaveRequestSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px'
            }
        });
        
        // Create the company name display component
        leaveRequestAdminEmailDisplay = new lx.component.Display({
            renderTo: leaveRequestAdminEmailContainerEl,
            fontSize: '14px',
            label: 'Administrator Email Address:',
            labelWidth: '220px',
            margin: '0px auto 0px 0px',
            maxWidth: '600px'
        });
        
        // Create an info icon
        let leaveRequestAdminEmailInfoEl = new lx.createElement('DIV', {
            parent: leaveRequestAdminEmailContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the element used to position the tooltip
        let leaveRequestAdminEmailTooltipLocusEl = lx.createElement('DIV', {
            parent: leaveRequestAdminEmailContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });
        
        // Create the tooltip component
        let leaveRequestAdminEmailTooltip = new lx.component.Tooltip({
            renderTo: leaveRequestAdminEmailTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'The email address of the person responsible for approving and declining leave requests. When a leave request is made an email will be sent to this email address with the option to approve or decline the request.<br><br>' +
                    'If no email address is provided, leave requests may still be approved or declined from the &quot;Leave Requests&quot; section.' +
                '</span>'
        });
        leaveRequestAdminEmailInfoEl.addEventListener('mouseenter', function() { leaveRequestAdminEmailTooltip.show(); });
        leaveRequestAdminEmailInfoEl.addEventListener('mouseleave', function() { leaveRequestAdminEmailTooltip.hide(); });
        
        // Load employees details.
        loadSetup();
        
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
    
    // sendBirthdayNotificationsCb change event handler
    function sendBirthdayNotificationsCbChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=update',
            data: {
                sendBirthdayNotifications: sendBirthdayNotificationsCb.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Setup Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // sendBirthdayNotificationsCb change event handler
    function emailPayslipsCbChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Setup&fn=update',
            data: {
                emailPayslipsOnPayrunProcess: emailPayslipsCb.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Setup Failed',
                        message: response.error
                    });
                    return;
                }
            }
        });
    }
    
    // leaveRequestEditBtn click event handler
    function leaveRequestEditBtnClickEventhandler() {
        // Create a modal window
        var editLeaveRequestAdminDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '232px'
        });
        
        // Create the editLeaveRequestAdminDetailsPanel panel
        var editLeaveRequestAdminDetailsPanel = new app.panel.EditLeaveRequestAdminDetails({
            renderTo: editLeaveRequestAdminDetailsModal.getContainer(),
            show: true,
            
            emailAddress: leaveRequestAdminEmailDisplay.getValue(),
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function( event ) {
                app.route.popState();
                if( event.emailAddress !== '' ) {
                    leaveRequestAdminEmailDisplay.setValue( event.emailAddress );
                }
                else {
                    leaveRequestAdminEmailDisplay.setValue( '-' );
                }
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editLeaveRequestAdminDetailsModal.addEventListener('destroy', function() {
            editLeaveRequestAdminDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editLeaveRequestAdminDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editLeaveRequestAdminDetailsModal.show();
        editLeaveRequestAdminDetailsPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};