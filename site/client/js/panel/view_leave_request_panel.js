/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW LEAVE REQUEST PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  requestId           The id of the request to view
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewLeaveRequest = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var updateStatusBtn = null;
    var resubmitBtn = null;
    var editBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var centeredContainerEl = null;
    
    var leaveDetailsContainerEl = null;
    var leaveDetailsHeadingEl = null;
    var leaveDetailsSectionEl = null;
    var addedOnDisplay = null;
    var employeeAliasDisplay = null;
    var leaveTypeDisplay = null;
    var leaveTotalDisplay = null;
    var leaveAvailableDisplay = null;
    var noteDisplay = null;
    
    var leaveRequestStatusContainerEl = null;
    var leaveRequestStatusHeadingEl = null;
    var leaveRequestStatusSectionEl = null;
    var statusDisplay = null;
    var statusDateDisplay = null;
    var reasonDeclinedContainerEl = null;
    var reasonDeclinedDisplay = null;
    
    var leaveDaysContainerEl = null;
    var leaveDaysHeadingEl = null;
    var leaveDaysSectionEl = null;
    var leaveDaysGrid = null;
    
    var requestId = null;
    var refreshRequests = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the leave request to edit
    function loadLeaveRequest( id ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequest',
            data: {
                requestId: id
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Request Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Set the added on date
                addedOnDisplay.setValue( response.request.addedOn );
                
                // Set the employee alias
                employeeAliasDisplay.setValue( response.request.employeeAlias );
                
                // Set the leave type and note
                leaveTypeDisplay.setValue( response.request.leaveTypeName );
                
                let value = '';
                value = parseFloat(response.request.totalDays).toFixed(2) + ' days';
                if( response.request.dayFraction == 0.25 ) {
                    value = value + ' (' + parseFloat(response.request.totalDays / response.request.dayFraction).toFixed(2) + ' quarter-days)';
                }
                else if( response.request.dayFraction == 0.5 ) {
                    value = value + ' (' + parseFloat(response.request.totalDays / response.request.dayFraction).toFixed(2) + ' half-days)';
                }
                
                if( response.request.totalHours !== null ) {
                    value = value + ' (' + parseFloat(response.request.totalHours).toFixed(2) + ' hours)';
                }
                leaveTotalDisplay.setValue( value );
                
                value = '-';
                if( response.request.note.trim() !== '' ) {
                    value = response.request.note;
                }
                noteDisplay.setValue( value );
                
                // Display the leave available
                loadLeaveAvailable( response.request.employeeId, response.request.leaveTypeId );
                
                // Set the leave status
                statusDisplay.setValue( response.request.statusName );
                statusDateDisplay.setValue( '-' );
                if( response.request.statusUpdatedOn !== null ) {
                    statusDateDisplay.setValue( response.request.statusUpdatedOn );
                }
                if( response.request.statusCode === 'DECL' ) {
                    reasonDeclinedContainerEl.style.display = 'flex';
                }
                reasonDeclinedDisplay.setValue( '-' );
                if( response.request.statusCode === 'DECL' ) {
                    reasonDeclinedContainerEl.style.display = 'flex';
                    if( response.request.statusUpdateMessage !== '' ) {
                        reasonDeclinedDisplay.setValue( response.request.statusUpdateMessage );
                    }
                }
                
                // Disable the edit button if the status is not pending
                if( response.request.statusCode !== 'PEND' ) {
                    resubmitBtn.disable();
                    editBtn.disable();
                }
                
                // Display the leave days in the grid
                let leaveDays = [];
                for( let i = 0; i < response.request.items.length; i++ ) {
                    let item = response.request.items[i];
                    
                    // Display and update the leave hours
                    if( item.leaveHours !== null ) {
                        item.leaveHours = response.request.items[i].leaveHours + ' h';
                    }
                    else {
                        item.leaveHours = '-';
                    }
                    leaveDays.push(item);
                }
                leaveDaysGrid.clear();
                leaveDaysGrid.addRows( leaveDays );
            }
        });
    }
    
    // Function to load leave available
    function loadLeaveAvailable( employeeId, leaveTypeId ) {
        // loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getBalances',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Display the leave available
                for( let i = 0; i < response.balances.length; i++ ) {
                    if( leaveTypeId === response.balances[i].leaveTypeId ) {
                        leaveAvailableDisplay.setValue( parseFloat(response.balances[i].balance).toFixed(2) + ' ' + response.balances[i].unit );
                        break;
                    }
                }
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
            show: false,
            requestId: null
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
        requestId = compConfig.requestId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                backgroundColor: '#F4F5F6',
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        // Create the titleContainerEl element
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
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'View Leave Request'
        });
        
        // Create the editBtn component
        updateStatusBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Update Status',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: updateStatusBtnClickEventHandler
        });
        
        // Create the editBtn component
        resubmitBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Resubmit',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 20px',
            
            onClick: resubmitBtnClickEventHandler
        });
        
        // Create the editBtn component
        editBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Edit Request',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 0px',
            
            onClick: editBtnClickEventHandler
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
                padding: '0px 15px 15px 15px',
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });
        
        // Create the centeredContainerEl component
        centeredContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                maxWidth: '900px'
            }
        });
        
        
        //
        // LEAVE DETAILS SECTION
        //
        
        leaveDetailsContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        leaveDetailsHeadingEl = lx.createElement('DIV', {
            parent: leaveDetailsContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Request Details</div>'
        });
        
        leaveDetailsSectionEl = lx.createElement('DIV', {
            parent: leaveDetailsContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        addedOnDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Added On:',
            labelWidth: '230px'
        });
        
        employeeAliasDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employee Alias:',
            labelWidth: '230px'
        });
        
        leaveTypeDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Leave Type:',
            labelWidth: '230px'
        });
        
        leaveTotalDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Leave Requested:',
            labelWidth: '230px'
        });
        
        leaveAvailableDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Leave Available:',
            labelWidth: '230px'
        });
        
        noteDisplay = new lx.component.Display({
            renderTo: leaveDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Reason / Notes:',
            labelWidth: '230px'
        });
        
        
        //
        // LEAVE STATUS SECTION
        //
        
        leaveRequestStatusContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px',
            }
        });
        
        leaveRequestStatusHeadingEl = lx.createElement('DIV', {
            parent: leaveRequestStatusContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Request Status</div>'
        });
        
        leaveRequestStatusSectionEl = lx.createElement('DIV', {
            parent: leaveRequestStatusContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                padding: '15px'
            }
        });
        
        statusDisplay = new lx.component.Display({
            renderTo: leaveRequestStatusSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Status:',
            labelWidth: '230px'
        });
        
        statusDateDisplay = new lx.component.Display({
            renderTo: leaveRequestStatusSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Date Updated:',
            labelWidth: '230px'
        });
        
        reasonDeclinedContainerEl = lx.createElement('DIV', {
            parent: leaveRequestStatusSectionEl,
            style: {
                display: 'none'
            }
        });
        
        reasonDeclinedDisplay = new lx.component.Display({
            renderTo: reasonDeclinedContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Reason Declined:',
            labelWidth: '230px'
        });
        
        
        //
        // LEAVE DAYS SECTION
        //
        
        leaveDaysContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        leaveDaysHeadingEl = lx.createElement('DIV', {
            parent: leaveDaysContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Days</div>'
        });
        
        leaveDaysSectionEl = lx.createElement('DIV', {
            parent: leaveDaysContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        leaveDaysGrid = new lx.component.Grid({
            renderTo: leaveDaysSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'leaveDate', name: 'Date'},
                {dataIndex: 'leaveHours', name: '# Hours', alignment: 'center', width: '120px'}
            ]
        });
        
        // Load form data
        loader.show(false);
        loadLeaveRequest( requestId );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
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
        me.fireEvent('destroy', { refreshRequests: refreshRequests});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // updateStatusBtn click event handler
    function updateStatusBtnClickEventHandler() {
        // Create a modal window
        var updateLeaveRequestStatusModal = new lx.component.ModalWindow({
            maxWidth: '500px',
            maxHeight: '720px',
            margin: '10px'
        });
        
        // Create the updateLeaveRequestStatusPanel panel
        var updateLeaveRequestStatusPanel = new app.panel.UpdateLeaveRequestStatus({
            renderTo: updateLeaveRequestStatusModal.getContainer(),
            show: true,
            
            requestId: requestId,
            
            onCancel: function() {
                updateLeaveRequestStatusPanel.destroy();
            },
            
            onSave: function() {
                loadLeaveRequest( requestId );
                updateLeaveRequestStatusPanel.destroy();
                refreshRequests = true;
            },
            
            onDestroy: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        updateLeaveRequestStatusModal.addEventListener('destroy', function() {
        });
        
        // Create a route entry for the panel
        var state = {
            modal: updateLeaveRequestStatusModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        updateLeaveRequestStatusModal.show();
        updateLeaveRequestStatusPanel.focus();
    }
    
    // resubmitBtn click event handler
    function resubmitBtnClickEventHandler() {
        // Create a modal window
        var resubmitLeaveRequestModal = new lx.component.ModalWindow({
            maxWidth: '500px',
            maxHeight: '233px',
            margin: '10px'
        });
        
        // Create the resubmitLeaveRequestPanel panel
        var resubmitLeaveRequestPanel = new app.panel.ResubmitLeaveRequest({
            renderTo: resubmitLeaveRequestModal.getContainer(),
            show: true,
            
            requestId: requestId,
            
            onCancel: function() {
                resubmitLeaveRequestPanel.destroy();
            },
            
            onSubmit: function() {
                // loadLeaveRequest( requestId );
                resubmitLeaveRequestPanel.destroy();
            },
            
            onDestroy: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        resubmitLeaveRequestModal.addEventListener('destroy', function() {
        });
        
        // Create a route entry for the panel
        let state = {
            modal: resubmitLeaveRequestModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        resubmitLeaveRequestModal.show();
        resubmitLeaveRequestPanel.focus();
    }
    
    // editBtn click event handler
    function editBtnClickEventHandler() {
        // Create a modal window
        var editRequestModal = new lx.component.ModalWindow({
            maxWidth: '500px',
            maxHeight: '720px',
            margin: '10px'
        });
        
        // Create the editRequestPanel panel
        var editRequestPanel = new app.panel.EditLeaveRequest({
            renderTo: editRequestModal.getContainer(),
            show: true,
            
            requestId: requestId,
            
            onCancel: function() {
                editRequestPanel.destroy();
            },
            
            onSave: function() {
                loadLeaveRequest( requestId );
                editRequestPanel.destroy();
                refreshRequests = true;
            },
            
            onDestroy: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editRequestModal.addEventListener('destroy', function() {
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editRequestModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editRequestModal.show();
        editRequestPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};