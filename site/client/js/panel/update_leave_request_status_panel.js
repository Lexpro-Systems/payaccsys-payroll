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
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.UpdateLeaveRequestStatus = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var leaveRequestDetailsSectionEl = null;
    var descriptionDisplay = null;
    var noteDisplay = null;
    var leaveAvailableDisplay = null;
    
    var statusDetailsSectionEl = null;
    var statusSelect = null;
    var statusUpdateMessageContainerEl = null;
    var statusUpdateMessageTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    
    var requestId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load leave request statuses
    function loadRequestStatuses() {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequestStatusList',
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Request Statuses Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Add leave statuses to select
                let items = [];
                for( let i = 0; i < response.statuses.length; i++ ) {
                    items.push({
                        value: response.statuses[i].code,
                        text: response.statuses[i].name
                    });
                }
                statusSelect.addItems( items );
            }
        });
    }
    
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
                
                let request = response.request;
                
                // Get the leave balances from the database
                lx.sendJSON({
                    url: 'exec.php?c=Leave&fn=getBalances',
                    data: {
                        employeeId: request.employeeId
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
                        let leaveAvailable;
                        for( let i = 0; i < response.balances.length; i++ ) {
                            if( request.leaveTypeId === response.balances[i].leaveTypeId ) {
                                leaveAvailable = parseFloat(response.balances[i].balance).toFixed(2) + ' ' + response.balances[i].unit;
                            }
                        }
                        
                        // Set the leave description
                        let leaveDescription = '';
                        leaveDescription = request.employeeAlias + ' requested ';
                        leaveDescription = leaveDescription + parseFloat(request.totalDays).toFixed(2) + ' day(s) ';
                        if( request.dayFraction == 0.25 ) {
                            leaveDescription = leaveDescription + '[' + parseFloat( request.totalDays / request.dayFraction ).toFixed(0) + ' quarter-day(s)] ';
                        }
                        else if( request.dayFraction == 0.5 ) {
                            leaveDescription = leaveDescription + '[' + parseFloat( request.totalDays / request.dayFraction ).toFixed(0) + ' half-day(s)] ';
                        }
                        
                        
                        if( request.unitCode === 'HOUR' ) {
                            leaveDescription = leaveDescription + '(' + parseFloat(request.totalHours).toFixed(2) + ' hours) ';
                        }
                        leaveDescription = leaveDescription + 'of \'' + request.leaveTypeName + '\' ';
                        if( (request.totalDays / request.dayFraction) > 1 ) {
                            leaveDescription = leaveDescription + 'from ' + request.fromDate + ' ';
                            leaveDescription = leaveDescription + 'to ' + request.toDate;
                        }
                        else {
                            leaveDescription = leaveDescription + 'on ' + request.fromDate;
                        }
                        descriptionDisplay.setValue( leaveDescription );
                        
                        // Set the leave note
                        noteDisplay.setValue( request.note );
                        
                        // Set the leave note
                        leaveAvailableDisplay.setValue( leaveAvailable );
                        
                        // Set the current status
                        statusSelect.setValue( request.statusCode, request.statusName );
                        statusSelectChangeEventHandler();
                        
                        // Set the status update message
                        statusUpdateMessageTxt.setValue( request.statusUpdateMessage );
                    }
                });
            }
        });
    }
    
    // // Function to load leave available
    // function getLeaveAvailable( employeeId, leaveTypeId ) {
    //     // loader.show( false );
        
    //     // Get the leave balances from the database
    //     lx.sendJSON({
    //         url: 'exec.php?c=Leave&fn=getBalances',
    //         data: {
    //             employeeId: employeeId
    //         },
    //         onSuccess: function( responseText ) {
    //             loader.hide();
                
    //             let response = JSON.parse( responseText );
                
    //             // Check if the response was ok
    //             if( response.ok !== true ) {
    //                 new lx.component.Messagebox({
    //                     title: 'Loading Leave Failed',
    //                     message: response.error
    //                 });
                    
    //                 return;
    //             }
                
    //             // Display the leave available
    //             for( let i = 0; i < response.balances.length; i++ ) {
    //                 if( leaveTypeId === response.balances[i].leaveTypeId ) {
    //                     return( parseFloat(response.balances[i].balance).toFixed(2) + ' ' + response.balances[i].unit );
    //                 }
    //             }
                
    //             return 'n/a';
    //         }
    //     });
    // }
    
    
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        requestId = compConfig.requestId;
        
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
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Update Leave Request Status'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // LEAVE REQUEST DETAILS SECTION
        //
        
        // Create a heading for the section
        lx.createElement('DIV', {
            parent: contentEl,
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
            innerHTML: '<div>Request Details</div>'
        });
        
        // Create leaveRequestDetailsSectionEl element
        leaveRequestDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create a heading for the description
        lx.createElement('DIV', {
            parent: leaveRequestDetailsSectionEl,
            style: {
                margin: '0px 0px 0px 0px',
                fontSize: '12px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Description:</div>'
        });
        
        // Create the descriptionDisplay component
        descriptionDisplay = new lx.component.Display({
            renderTo: leaveRequestDetailsSectionEl,
            margin: '5px 0px 0px 0px',
            // label: 'Description:',
            labelAlign: 'top'
        });
        
        // Create a heading for the note
        lx.createElement('DIV', {
            parent: leaveRequestDetailsSectionEl,
            style: {
                margin: '15px 0px 0px 0px',
                fontSize: '12px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Reason / Notes:</div>'
        });
        
        // Create the noteDisplay component
        noteDisplay = new lx.component.Display({
            renderTo: leaveRequestDetailsSectionEl,
            margin: '5px 0px 0px 0px',
            // label: 'Reason / Notes:',
            labelAlign: 'top'
        });
        
        // Create a heading for the note
        lx.createElement('DIV', {
            parent: leaveRequestDetailsSectionEl,
            style: {
                margin: '15px 0px 0px 0px',
                fontSize: '12px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Leave Available:</div>'
        });
        
        // Create the leaveAvailableDisplay component
        leaveAvailableDisplay = new lx.component.Display({
            renderTo: leaveRequestDetailsSectionEl,
            margin: '5px 0px 0px 0px',
            // label: 'Leave Available:',
            labelAlign: 'top'
        });
        
        
        //
        // STATUS DETAILS SECTION
        //
        
        // Create a heading for the section
        lx.createElement('DIV', {
            parent: contentEl,
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
            innerHTML: '<div>Status Details</div>'
        });
        
        // Create statusDetailsSectionEl element
        statusDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the statusSelect component
        statusSelect = new lx.component.Selectbox({
            renderTo: statusDetailsSectionEl,
            label: 'Status: ',
            labelAlign: 'top',
            // maxWidth: '400px',
            margin: '0px 0px 0px 0px',
            
            onChange: statusSelectChangeEventHandler
        });
        
        // Create the statusUpdateMessageContainerEl element
        statusUpdateMessageContainerEl = lx.createElement('DIV', {
            parent: statusDetailsSectionEl,
            style: {
                display: 'none'
            }
        });
        
        // Create the statusUpdateMessageTxt component
        statusUpdateMessageTxt = new lx.component.Textbox({
            renderTo: statusUpdateMessageContainerEl,
            label: 'Reason Declined:',
            labelAlign: 'top',
            multiline: true,
            height: '80px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the saveBtnContainerEl element
        saveBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        // Load page data
        loadRequestStatuses();
        loadLeaveRequest( compConfig.requestId );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
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
        statusSelect.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        me.destroy();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // statusSelect change event handler
    function statusSelectChangeEventHandler() {
        // Was the leave request declined?
        if( statusSelect.getValue() === 'DECL' ) {
            // Show the status update message component
            statusUpdateMessageContainerEl.style.display = 'flex';
        }
        else {
            // Hide the status update message component
            statusUpdateMessageContainerEl.style.display = 'none';
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Set the status update message, if any
        let statusUpdateMessage = '';
        if( statusSelect.getValue() === 'DECL' ) {
            statusUpdateMessage = statusUpdateMessageTxt.getValue().trim();
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=updateRequestStatus',
            data: {
                requestId: requestId,
                statusCode: statusSelect.getValue(),
                statusUpdateMessage: statusUpdateMessage
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Leave Request Status Failed',
                        message: response.error
                    });
                    return;
                }
                
                me.fireEvent('save', { srcPanel: me });
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};