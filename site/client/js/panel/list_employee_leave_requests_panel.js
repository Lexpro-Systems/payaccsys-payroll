/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST EMPLOYEE LEAVE REQUESTS
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
app.panel.ListEmployeeLeaveRequests = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var titleContainerEl = null;
    var leaveStatusSelect = null;
    var searchTxt = null;
    var addBtn = null;
    
    var requestsGrid = null;
    
    var employeeId = null;
    var employeeAlias = null;
    
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
                items.push({
                    value: null,
                    text: 'All Requests'
                });
                for( let i = 0; i < response.statuses.length; i++ ) {
                    items.push({
                        value: response.statuses[i].code,
                        text: response.statuses[i].name + ' Requests'
                    });
                }
                leaveStatusSelect.addItems( items );
                leaveStatusSelect.setValue( 'PEND', 'Pending Requests' );
                
                // Load the leave requests
                loadRequests(true);
            }
        });
    }
    
    // Function to load leave requests
    function loadRequests(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = requestsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequestList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                leaveRequestStatusCode: leaveStatusSelect.getValue(),
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Requests Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Populate grid
                var requests = [];
                for( var i = 0; i < response.requests.length; i++ ) {
                    let totalHours = '-';
                    if( response.requests[i].totalHours != null ) {
                        totalHours = response.requests[i].totalHours + ' h';
                    }
                    
                    requests.push({
                        id: response.requests[i].id,
                        addedOn: response.requests[i].addedOn,
                        employeeId: response.requests[i].employeeId,
                        employeeAlias: response.requests[i].employeeAlias,
                        leaveTypeId: response.requests[i].leaveTypeId,
                        leaveTypeName: response.requests[i].leaveTypeName,
                        statusCode: response.requests[i].statusCode,
                        statusName: response.requests[i].statusName,
                        statusUpdatedOn: response.requests[i].statusUpdatedOn,
                        fromDate: response.requests[i].fromDate,
                        toDate: response.requests[i].toDate,
                        totalDays: response.requests[i].totalDays + ' d',
                        totalHours: totalHours,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) requestsGrid.clear();
                
                requestsGrid.addRows( requests );
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
            
            employeeId: null,
            employeeAlias: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        employeeId = compConfig.employeeId;
        employeeAlias = compConfig.employeeAlias;
        
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
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 0px 0px',
                margin: '15px 0px 15px 0px'
            }
        });
        
        // Create the leaveStatusSelect component
        leaveStatusSelect = new lx.component.Selectbox({
            renderTo: titleContainerEl,
            labelAlign: 'left',
            // label: 'Request Status: ',
            // labelWidth: '100px',
            height: '32px',
            width: '180px',
            margin: '0px 0px 0px auto',
            
            onChange: filterOnChangeEventHandler
        });
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 15px 0px 15px',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add',
            height: '32px',
            width: '120px',
            margin: '0px 15px 0px 0px',
            
            onClick: addBtnClickEventHandler
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
        
        // Create requestsGridMenuOptions array
        var requestsGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fa fa-fw fa-pen" style="margin: 0px 15px 0px 0px;"></i>Update Status', value: 'updateStatus'},
            {name: '<i class="fa fa-fw fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Resubmit', value: 'resubmit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create requestsGrid component
        requestsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'addedOn', name: 'Added On', width: '100px', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'employeeAlias', name: 'Employee Alias'},
                {dataIndex: 'leaveTypeName', name: 'Leave Type'},
                {dataIndex: 'statusName', name: 'Status', width: '100px'},
                {dataIndex: 'statusUpdatedOn', name: 'Status Date', width: '100px'},
                {dataIndex: 'fromDate', name: 'From Date', width: '100px'},
                {dataIndex: 'toDate', name: 'To Date', width: '100px'},
                {dataIndex: 'totalDays', name: 'Total Days', width: '100px', alignment: 'right'},
                {dataIndex: 'totalHours', name: 'Total Hours', width: '100px', alignment: 'right'},
                {dataIndex: 'menu', name: '', type: 'menu', options: requestsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onScrollEnd: requestsGridScrollEndEventHandler,
            onCellClick: requestsGridCellClickEventHandler,
            onMenuItemClick: requestsGridMenuItemClickEventHandler
        });
        
        // Load documents
        loadRequestStatuses();
        
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
        searchTxt.focus();
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
    
    // Filter change event handler
    function filterOnChangeEventHandler() {
        loader.show( true );
        loadRequests( true );
    }
    
    function onSearchEventHandler (){
        loadRequests(true);
    }
    
    function onSearchResetBtnClickEventHandler() {
        searchTxt.setValue('');
        loadRequests(true);
    }
    
    
    function requestsGridScrollEndEventHandler() {
        loadRequests(false);
    }
    
    // Requests grid cell click event handler
    function requestsGridCellClickEventHandler( event ) {
        if( requestsGrid.getColumnDataIndex( event.columnIndex ) === 'addedOn' ) {
            config.viewEmployeePanel.hide();
            
            let viewRequestPanel = new app.panel.ViewLeaveRequest({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                requestId: event.record.id,
                loanDescription: event.record.description,
                employeeId: event.record.employeeId,
                
                onDestroy: function( event ) {
                    if( event.refreshLoans === true ) {
                        loadRequests(true);
                    }
                }
            });
            
            let panelState = {
                previousPanel: config.viewEmployeePanel,
                panel: viewRequestPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            // me.hide();
            
            // let viewRequestPanel = new app.panel.ViewLeaveRequest({
            //     renderTo: app.mainPanel.getContainer(),
            //     show: true,
                
            //     requestId: event.record.id,
                
            //     onDestroy: function( event ) {
            //         if( event.refreshRequests === true ) {
            //             loadRequests(true);
            //         }
            //     }
            // });
            
            // let panelState = {
            //     previousPanel: me,
            //     panel: viewRequestPanel
            // };
            
            // app.route.pushState(panelState, function( state ) {
            //     state.panel.destroy();
            //     state.previousPanel.show();
            // });
        }
    }
    
    // Requests grid menu item click event handler
    function requestsGridMenuItemClickEventHandler( clickEvent ) {
        if( clickEvent.value === 'view' ) {
            config.viewEmployeePanel.hide();
            
            let viewRequestPanel = new app.panel.ViewLeaveRequest({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                
                onDestroy: function( event ) {
                    if( event.refreshRequests === true ) {
                        loadRequests(true);
                    }
                }
            });
            
            let panelState = {
                previousPanel: config.viewEmployeePanel,
                panel: viewRequestPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if( clickEvent.value === 'updateStatus' ) {
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
                
                requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    updateLeaveRequestStatusPanel.destroy();
                },
                
                onSave: function() {
                    loadRequests(true);
                    updateLeaveRequestStatusPanel.destroy();
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
        else if( clickEvent.value === 'resubmit' ) {
            // Only pending requests can be resent
            if( requestsGrid.getRow(clickEvent.rowIndex).statusCode !== 'PEND' ) {
                new lx.component.Messagebox({
                    title: 'Unable to Resubmit Leave Request',
                    message: 'Only pending leave requests can be resubmitted to the administrator.'
                });
                return;
            }
            
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
                
                requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    resubmitLeaveRequestPanel.destroy();
                },
                
                onSubmit: function() {
                    // loadRequests(true);
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
        else if( clickEvent.value === 'remove' ) {
            // Only pending requests can be removed
            if( requestsGrid.getRow(clickEvent.rowIndex).statusCode !== 'PEND' ) {
                new lx.component.Messagebox({
                    title: 'Removing Request Failed',
                    message: 'Leave requests with the status \'' + requestsGrid.getRow(clickEvent.rowIndex).statusName + '\' cannot be removed.'
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
                                requestId: requestsGrid.getRow(clickEvent.rowIndex).id
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
                                loadRequests( true );
                            }
                        });
                    }
                }
            });
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler () {
        // Create a modal window
        var addRequestModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '706px'
        });
        
        // Create the addRequestPanel panel
        var addRequestPanel = new app.panel.AddLeaveRequest({
            renderTo: addRequestModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            employeeAlias: employeeAlias,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSubmit: function() {
                app.route.popState();
                loadRequests(true);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addRequestModal.addEventListener('destroy', function() {
            addRequestPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addRequestModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addRequestModal.show();
        addRequestPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};