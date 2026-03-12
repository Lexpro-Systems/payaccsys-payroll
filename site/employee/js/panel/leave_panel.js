/* globals app, lx */
'use strict';


// LEAVE PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.Leave = function(config) {
    
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
    var centeredContainerEl = null;
    
    var leaveBalanceContainerEl = null;
    var leaveBalanceHeadingContainerEl = null;
    var leaveBalanceHeadingEl = null;
    var leaveBalanceSectionEl = null;
    var leaveBalanceGrid = null;
    
    var leaveRequestContainerEl = null;
    var leaveRequestHeadingContainerEl = null;
    var leaveRequestHeadingEl = null;
    var addLeaveRequestBtnEl = null;
    var leaveRequestNoteEl = null;
    var leaveRequestSectionEl = null;
    
    var leaveRequestList = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load leave balances
    function loadLeaveBalances( clearResults ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getBalances',
            onSuccess: function( responseText ) {
                // loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Format leave balances for the grid
                let balances = [];
                for( let i = 0; i < response.balances.length; i++ ) {
                    balances.push({
                        leaveTypeId: response.balances[i].leaveTypeId,
                        description: response.balances[i].leaveType,
                        descriptionDisplay: '<div style="text-wrap: wrap;">' + response.balances[i].leaveType + '</div>',
                        balance: parseFloat(response.balances[i].balance).toFixed(2) + ' ' + response.balances[i].unit,
                        viewBtn: '<i class="fa fa-chevron-circle-right" style="margin: auto auto; font-size: 24px;"></i>'
                    });
                }
                
                // Should leave balances be cleared?
                if( clearResults ) {
                    leaveBalanceGrid.clear();
                }
                leaveBalanceGrid.addRows(balances);
                
                // Load all the leave requests
                loadLeaveRequests( true );
            }
        });
    }
    
    // Function to load leave requests
    function loadLeaveRequests( clearResults ) {
        // Get the leave requests from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequestList',
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Requests Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Should all results be cleared?
                if( clearResults ) {
                    leaveRequestSectionEl.innerHTML = '';
                    leaveRequestList = [];
                }
                
                // Display a message if there aren't any requests
                if( (response.requests.length < 1) && clearResults ) {
                    leaveRequestNoteEl.style.display = 'block';
                    leaveRequestSectionEl.style.display = 'none';
                    return;
                }
                else {
                    leaveRequestNoteEl.style.display = 'none';
                    leaveRequestSectionEl.style.display = 'flex';
                }
                
                // Create a card for each leave request
                for( let i = 0; i < response.requests.length; i++ ) {
                    let request = response.requests[i];
                    
                    let leaveDescription = '';
                    if( request.dayFraction == 0.25 ) {
                        leaveDescription = leaveDescription + parseFloat( request.totalDays / request.dayFraction ).toFixed(0) + ' quarter-day(s)';
                    }
                    else if( request.dayFraction == 0.5 ) {
                        leaveDescription = leaveDescription + parseFloat( request.totalDays / request.dayFraction ).toFixed(0) + ' half-day(s)';
                    }
                    else {
                        leaveDescription = leaveDescription + parseFloat( request.totalDays).toFixed(0) + ' day(s) ';
                    }
                    
                    if( request.unitCode === 'HOUR' ) {
                        leaveDescription = leaveDescription + '(' + request.totalHours + ' hours) ';
                    }
                    leaveDescription = leaveDescription + 'of \'' + request.leaveTypeName + '\' ';
                    if( (request.totalDays / request.dayFraction) > 1 ) {
                        leaveDescription = leaveDescription + 'from ' + request.fromDate + ' ';
                        leaveDescription = leaveDescription + 'to ' + request.toDate;
                    }
                    else {
                        leaveDescription = leaveDescription + 'on ' + request.fromDate;
                    }
                    
                    // Create a new request item
                    let requestItem = {
                        id: request.id,
                        statusCode: request.statusCode,
                        statusName: request.statusName
                    };
                    
                    // Set the border color of the card depending on the leave request status
                    let requestItemBorderColor = lx.style.global.highlightColor;
                    let removeButtonColor = '#E74C3C';
                    if( request.statusCode === 'APPR' ) {
                        requestItemBorderColor = '#2ECC71';
                        removeButtonColor = '#666666';
                    }
                    else if( request.statusCode === 'DECL' ) {
                        requestItemBorderColor = '#E74C3C';
                        removeButtonColor = '#666666';
                    }
                    
                    // Create the card main element
                    let requestItemEl = lx.createElement('DIV', {
                        parent: leaveRequestSectionEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            margin: '0px 0px 5px 0px',
                            display: 'flex',
                            flex: '0 0 auto',
                            flexDirection: 'row',
                            alignItems: 'stretch',
                            justifyContent: 'space-between',
                            padding: '10px 10px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px 1px 1px 5px',
                            borderColor: requestItemBorderColor
                        }
                    });
                    
                    // Create the container for the request details
                    let requestDetailsCointainerEl =  lx.createElement('DIV', {
                        parent: requestItemEl,
                        style: {
                            // cursor: 'pointer',
                            flex: '1 1 100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            margin: '0px 0px 0px 0px'
                        }
                    });
                    // requestDetailsCointainerEl.addEventListener('click', requestItemElClickEventHandler.bind(this, {requestItem: requestItem}) );
                    
                    // Create the menu dropdown button
                    var menuDropdownBtn = new lx.component.DropdownButton({
                        renderTo: requestItemEl,
                        margin: 'auto 0px',
                        label: '<i class="fa fa-ellipsis-v"></i>',
                        dropdownAlignment: 'right'
                    });
                    
                    if( request.statusCode === 'PEND' ) {
                        // Create the menuDropDownBtnEditEl element
                        let menuDropDownBtnEditEl = lx.createElement('DIV', {
                            parent: menuDropdownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '10px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Edit</span>'
                        });
                        menuDropDownBtnEditEl.addEventListener('click', requestItemElClickEventHandler.bind(this, {requestItem: requestItem}) );
                        
                        // Create the menuDropDownBtnRemoveEl element
                        let menuDropDownBtnRemoveEl = lx.createElement('DIV', {
                            parent: menuDropdownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '10px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove</span>'
                        });
                        menuDropDownBtnRemoveEl.addEventListener('click', removeRequestElClickEventHandler.bind(this, {requestItem: requestItem}) );
                    }
                    else {
                        // Create the menuDropDownBtnViewEl element
                        let menuDropDownBtnViewEl = lx.createElement('DIV', {
                            parent: menuDropdownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '10px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-eye" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">View</span>'
                        });
                        menuDropDownBtnViewEl.addEventListener('click', requestItemElClickEventHandler.bind(this, {requestItem: requestItem}) );
                    }
                   
                    // Display the date the request was made
                    lx.createElement('DIV', {
                        parent: requestDetailsCointainerEl,
                        style: {
                            color: '#7A7A7A',
                            fontSize: '12px'
                        },
                        innerHTML: request.addedOn
                    });
                    
                    // Display the request description
                    lx.createElement('DIV', {
                        parent: requestDetailsCointainerEl,
                        style: {
                            // color: '#FFFFFF',
                            fontSize: 'calc(12px + 0.25vw)',
                            margin: '8px 0px 0px 0px'
                        },
                        innerHTML: '' + leaveDescription
                    });
                    
                    // Display the request status
                    lx.createElement('DIV', {
                        parent: requestDetailsCointainerEl,
                        style: {
                            margin: '8px 0px 0px 0px',
                            fontSize: '12px'
                        },
                        innerHTML: 'Status: ' + request.statusName
                    });
                    
                    // Add the item to the request list array
                    leaveRequestList.push( requestItem );
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
        
        // Clear the background color of the container to show the backgroun image
        me.getContainer().style.backgroundColor = '';
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: '',
                // backgroundColor: app.panelBackgroundColor
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
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
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
            innerHTML: '<i class="fa fa-fw fa-calendar" style="margin: 0px 15px 0px 0px;"></i>Leave'
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
                flex: '1 1 100%',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px',
                // backgroundColor: '#FFFFFF'
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
                maxWidth: '768px',
                // backgroundColor: '#FFFFFF',
                padding: '0px 15px 15px 15px',
                margin: '0px auto'
            }
        });
        
        
        //
        // LEAVE BALANCE SECTION
        //
        
        // Create the leaveBalanceContainerEl element
        leaveBalanceContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '0px 0px 0px 0px',
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // Create the leaveBalanceHeadingContainerEl element
        leaveBalanceHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '768px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Create the leaveBalanceHeadingEl element
        leaveBalanceHeadingEl = lx.createElement('DIV', {
            parent: leaveBalanceHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Available Leave</div>'
        });
        
        // Create the leaveBalanceSectionEl element
        leaveBalanceSectionEl = lx.createElement('DIV', {
            parent: leaveBalanceContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '5px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'auto'
            }
        });
        
        // Create the leaveBalanceGrid component
        leaveBalanceGrid = new lx.component.Grid({
            renderTo: leaveBalanceSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'descriptionDisplay', name: 'Description'},
                {dataIndex: 'balance', name: 'Available', alignment: 'right', width: '120px'},
                {dataIndex: 'viewBtn', name: null, type: 'button', alignment: 'center', width: '50px'},
            ],
            
            onCellClick: leaveBalanceGridCellClickEventHandler
        });
        
        
        //
        // LEAVE REQUEST SECTION
        //
        
        // Create the leaveRequestContainerEl element
        leaveRequestContainerEl = lx.createElement('DIV', {
            parent: centeredContainerEl,
            style: {
                margin: '15px 0px 0px 0px',
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // Create the leaveRequestHeadingContainerEl element
        leaveRequestHeadingContainerEl = lx.createElement('DIV', {
            parent: leaveRequestContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                maxWidth: '768px',
                margin: '15px 0px 0px 0px',
                color: app.sectionTextColor,
                backgroundColor: app.sectionBackgroundColor,
                borderRadius: (app.sectionBorderRadius + ' ' + app.sectionBorderRadius + ' 0px 0px')
            }
        });
        
        // Create the leaveRequestHeadingContainerEl element
        leaveRequestHeadingEl = lx.createElement('DIV', {
            parent: leaveRequestHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '10px 15px 10px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Leave Requests</div>'
        });
        
        // Create the addLeaveRequestBtnEl element
        addLeaveRequestBtnEl =  lx.createElement('DIV', {
            parent: leaveRequestHeadingContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '30px',
                minWidth: '30px',
                height: '30px',
                minHeight: '30px',
                margin: 'auto 15px auto 15px',
                fontSize: '16px',
                color:  '#FFFFFF', // lx.style.global.highlightColor,
                backgroundColor: lx.style.global.highlightColor, // '#FFFFFF',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-plus" style="margin: auto auto;"></i>'
        });
        addLeaveRequestBtnEl.addEventListener('click', addLeaveRequestBtnElClickEventHandler);
        
        // Create the leaveRequestSectionEl element
        leaveRequestSectionEl = lx.createElement('DIV', {
            parent: leaveRequestContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: app.sectionBorderWidth,
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                padding: '15px',
                width: '100%',
                maxWidth: '768px',
                boxSizing: 'border-box',
                overflow: 'visible'
            }
        });
       
        // Create the leaveRequestNoteEl element
        leaveRequestNoteEl = lx.createElement('DIV', {
            parent: leaveRequestContainerEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px',
                padding: '30px 15px',
                fontSize: '14px',
                width: '100%',
                maxWidth: '900px',
                color: 'lx.style.global.color',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: app.sectionBackgroundColor,
                borderWidth: '0px 1px 1px 1px',
                borderRadius: ('0px 0px ' + app.sectionBorderRadius + ' ' + app.sectionBorderRadius),
                // minHeight: '200px',
                flex: '1 1 100%'
            },
            innerHTML: 'No upcoming or pending leave requests to display'
        });
        
        // Load the leave balances
        loadLeaveBalances( true );
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Leave balance grid cell click event handler
    function leaveBalanceGridCellClickEventHandler( event ) {
        // Depending on the cell clicked
        if( leaveBalanceGrid.getColumnDataIndex( event.columnIndex ) === 'viewBtn' ) {
            // Hide the current panel
            me.hide();
            
            // Show the leave history for the specified leave type
            let leaveTypeHistoryPanel = new app.panel.LeaveTypeHistory({
                renderTo: app.mainPanel.getPanelContainer(),
                leaveTypeId: leaveBalanceGrid.getRow(event.rowIndex).leaveTypeId,
                leaveTypeName: leaveBalanceGrid.getRow(event.rowIndex).description
            });
            
            let panelState = {
                previousPanel: me,
                panel: leaveTypeHistoryPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            leaveTypeHistoryPanel.show();
            leaveTypeHistoryPanel.focus();
        }
    }
    
    // addLeaveRequestBtn click event handler
    function addLeaveRequestBtnElClickEventHandler() {
        // Create the add leave request panel
        let addLeaveRequestPanel = new app.panel.AddLeaveRequest({
            maxWidth: '500px',
            maxHeight: '720px',
            margin: '10px',
            
            onCancel: function() {
                app.route.popState();
            },
            onSubmit: function() {
                loadLeaveRequests(true);
                app.route.popState();
            }
        });
        
        // Set and push the state
        let state = {
            panel: addLeaveRequestPanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Display the home panel
        addLeaveRequestPanel.showModal();
        addLeaveRequestPanel.focus();
    }
    
    // requestItemEl click event handler
    function requestItemElClickEventHandler( clickEvent ) {
        // Make sure request item id is not null or undefined
        if( typeof clickEvent.requestItem.id === 'undefined' || clickEvent.requestItem.id === null ) return;
        
        // Only pending requests can be edited
        if( clickEvent.requestItem.statusCode === 'PEND' ) {
            // Create the edit leave request panel
            let editLeaveRequestPanel = new app.panel.EditLeaveRequest({
                maxWidth: '500px',
                maxHeight: '720px',
                margin: '10px',
                
                requestId: clickEvent.requestItem.id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    loadLeaveRequests(true);
                    app.route.popState();
                }
            });
            
            // Set and push the state
            let state = {
                panel: editLeaveRequestPanel
            };
            app.route.pushState(state, function( state ) {
                state.panel.destroy();
            });
            
            // Display the home panel
            editLeaveRequestPanel.showModal();
            editLeaveRequestPanel.focus();
        }
        else {
            // View the leave request
            me.hide();
            
            let viewLeaveRequestPanel = new app.panel.ViewLeaveRequest({
                renderTo: app.mainPanel.getPanelContainer(),
                requestId: clickEvent.requestItem.id
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewLeaveRequestPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            viewLeaveRequestPanel.show();
            viewLeaveRequestPanel.focus();
        }
    }
    
    // addLeaveRequestBtn click event handler
    function removeRequestElClickEventHandler( clickEvent ) {
        // Make sure request item id is not null or undefined
        if( typeof clickEvent.requestItem.id === 'undefined' || clickEvent.requestItem.id === null ) return;
        
        // Only pending requests can be removed
        if( clickEvent.requestItem.statusCode !== 'PEND' ) {
            new lx.component.Messagebox({
                title: 'Removing Request Failed',
                message: 'Leave requests with the status \'' + clickEvent.requestItem.statusName + '\' cannot be removed.'
            });
            return;
        }
        
        // Verify whether the user wishes to proceed
        new lx.component.Messagebox({
            title: 'Remove Leave Request',
            message: 'Are you certain you wish to remove the specified leave request?',
            buttons: [
                {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                {name: 'remove', label: 'Remove', isDefault: true}
            ],
            onClose: function( event ) {
                if( event.button === 'remove' ) {
                    // Send a request to remove the specified leave request
                    lx.sendJSON({
                        url: 'exec.php?c=Leave&fn=removeRequest',
                        data: {
                            requestId: clickEvent.requestItem.id
                        },
                        onSuccess: function( responseText ) {
                            let response = JSON.parse( responseText );
                            
                            // Check if the response was ok
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Removing Request Failed',
                                    message: response.error
                                });
                                return;
                            }
                            
                            // Reload the leave requests
                            loadLeaveRequests( true );
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