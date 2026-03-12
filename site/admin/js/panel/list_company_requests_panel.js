/* globals app, lx */
'use strict';

// LIST COMPANY REQUESTS PANEL
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
app.panel.ListCompanyRequests = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleTextEl = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let filterSectionEl = null;
    let processedFilterSelect = null;
    let searchTxt = null;
    
    let requestSortBar = null;
    
    let requestsGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load company requests
    function loadRequests( clearGrid ) {
        // loader.show();
        let offset = 0;
        if( !clearGrid ) offset = requestsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getRequestList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                sortList: requestSortBar.getSortItems(),
                processedFilter: processedFilterSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Requests Failed',
                        message: response.error
                    });
                    return;
                }
                
                let requests = [];
                for( let i = 0; i < response.requests.length; i++ ) {
                    let processed = false;
                    if( response.requests[i].processedOn != null ) {
                        processed = true;
                    }
                    
                    requests.push({
                        id: response.requests[i].id,
                        createdOn: response.requests[i].createdOn,
                        companyName: response.requests[i].companyName,
                        companyAlias: response.requests[i].companyAlias,
                        userName: response.requests[i].userName,
                        userPhoneNumber: response.requests[i].userPhoneNumber,
                        userEmailAddress: response.requests[i].userEmailAddress,
                        processed: processed,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) requestsGrid.clear();
                
                // Display the result
                requestsGrid.addRows( requests );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            
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
                borderWidth: '0px 0px 0px 0px',
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
            innerHTML: 'Company Requests'
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                padding: '10px 20px 15px 20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                backgroundColor: lx.style.global.backgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 1px 0px'
            }
        });
        
        // Create processedFilterSelect component
        processedFilterSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            height: '32px',
            width: '160px',
            margin: '0px 20px 0px 0px',
            
            items: [
                {text: 'Show All', value: 'show_all'},
                {text: 'Processed Only', value: 'processed_only'},
                {text: 'Unprocessed Only', value: 'unprocessed_only'}
            ],
            
            onChange: filterOnChangeEventHandler
        });
        processedFilterSelect.setValue('unprocessed_only', 'Unprocessed Only');
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        
        //
        // SORT BAR
        //
        
        // Create a sort bar for the employees
        requestSortBar = new lx.component.SortBar({
            renderTo: contentContainerEl,
            backgroundColor: '#F8F8F8',
            orderIndicatorColor: '#B44500',
            dragHighlightColor: '#B0B0B0',
            width: '100%',
            
            displayToolTips: true,
            allowAddItems: true,
            allowRemoveItems: true,
            allowDragItems: true,
            
            sortOptions: [
                { name: 'Created On', dataIndex: 'createdOn'},
                { name: 'Company Alias', dataIndex: 'companyAlias'},
                { name: 'User Name', dataIndex: 'userName'},
                { name: 'User Phone Number', dataIndex: 'userPhoneNumber'},
                { name: 'User Email Address', dataIndex: 'userEmailAddress'},
                { name: 'Processed', dataIndex: 'processed'},
            ],
            
            onAddButtonClick: onRequestSortBarAddButtonClick,
            onSortItemClick: onRequestSortBarSortItemClick,
            onRemoveSortItem: onRequestSortBarRemoveSortItem,
            onDraggedSortItem: onRequestSortBarDraggedSortItem
        });
        
        // Add default sort items
        requestSortBar.addSortItem(requestSortBar.getSortItemCount(), 'Processed', 'processed', 'DESC');
        requestSortBar.addSortItem(requestSortBar.getSortItemCount(), 'Created On', 'createdOn', 'DESC');
        requestSortBar.addSortItem(requestSortBar.getSortItemCount(), 'User Name', 'userName', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create requestsGridMenuOptions array
        let requestsGridMenuOptions = [
            {name: '<i class="fas fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-plus" style="margin: 0px 15px 0px 0px;"></i>Add Company', value: 'add_company'}
        ];
        
        // Create requestsGrid component
        requestsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'createdOn', name: 'Created On', padding: '0px 0px 0px 20px', width: '160px', type: 'button'},
                // {dataIndex: 'companyName', name: 'Company Name'},
                {dataIndex: 'companyAlias', name: 'Company Alias'},
                {dataIndex: 'userName', name: 'User Name'},
                {dataIndex: 'userPhoneNumber', name: 'User Phone No.', width: '140px'},
                {dataIndex: 'userEmailAddress', name: 'User Email'},
                {dataIndex: 'processed', name: 'Processed', width: '80px', alignment: 'center', type: 'checkbox'},
                {dataIndex: 'menu', name: '', type: 'menu', options: requestsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: requestsGridCellClickEventHandler,
            
            onScrollEnd: requestsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'view' ) {
                    // Create a modal window
                    let viewCompanyRequestModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '560px',
                        // maxHeight: '432px'
                    });
                    
                    // Create the viewCompanyRequestPanel panel
                    let viewCompanyRequestPanel = new app.panel.ViewCompanyRequest({
                        renderTo: viewCompanyRequestModal.getContainer(),
                        show: true,
                        
                        requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                        
                        onClose: function() {
                            app.route.popState();
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    viewCompanyRequestModal.addEventListener('destroy', function() {
                        viewCompanyRequestPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    let state = {
                        modal: viewCompanyRequestModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    viewCompanyRequestModal.show();
                    viewCompanyRequestPanel.focus();
                }
                else if( clickEvent.value === 'add_company' ) {
                    me.hide();
                    
                    let addCompanyPanel = new app.panel.AddCompany({
                        renderTo: app.mainPanel.getContainer(),
                        
                        requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                        
                        onAdd: function() {
                            app.route.popState();
                        }
                    });
                    
                    let panelState = {
                        previousPanel: me,
                        panel: addCompanyPanel
                    };
                    
                    app.route.pushState(panelState, function( state ) {
                        if( !state.panel.destroy() ) return false;
                        state.previousPanel.show();
                    });
                    
                    addCompanyPanel.show();
                    addCompanyPanel.focus();
                }
            }
        });
        
        // Load requests
        loader.show();
        loadRequests( true );
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    
    // onRequestSortBarAddButton click event handler
    function onRequestSortBarAddButtonClick() {
        // have all the sort options been added?
        if( requestSortBar.getSortOptions().length <= 0 ) {
            new lx.component.Messagebox({
                title: 'Add Sort Item',
                message: 'There are no more sort items to add. All the available sort items have already been added.'
            });
            return;
        }
        
        // Create the addSortItemModal panel
        let addSortItemModal = new app.panel.AddSortItem({
            renderTo: app.mainPanel.getContainer(),
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '302px',
            
            sortOptions: requestSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                requestSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadRequests( true );
            },
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: addSortItemModal
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        addSortItemModal.showModal();
        addSortItemModal.focus();
    }
    
    // requestSortBarSortItem click event handler
    function onRequestSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        requestSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadRequests( true );
        return;
    }
    
    // sortBarRemoveSortItem click event handler
    function onRequestSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadRequests( true );
    }
    
    // onRequestSortBarDraggedSortItem click event handler
    function onRequestSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadRequests( true );
    }
    
    // Search component event handler
    function onSearchEventHandler (){
        loader.show();
        loadRequests( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show();
        searchTxt.setValue('');
        loadRequests( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadRequests( true );
    }
    
    // requestsGrid scroll end event handler
    function requestsGridScrollEndEventHandler() {
        loadRequests( false );
    }
    
    // requestsGrid cell click event handler
    function requestsGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( requestsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'createdOn' ) {
            // Create a modal window
            let viewCompanyRequestModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '560px',
                // maxHeight: '432px'
            });
            
            // Create the viewCompanyRequestPanel panel
            let viewCompanyRequestPanel = new app.panel.ViewCompanyRequest({
                renderTo: viewCompanyRequestModal.getContainer(),
                show: true,
                
                requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                
                onClose: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            viewCompanyRequestModal.addEventListener('destroy', function() {
                viewCompanyRequestPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: viewCompanyRequestModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            viewCompanyRequestModal.show();
            viewCompanyRequestPanel.focus();
        }
        else if( requestsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'processed' ) {
            // NOTE:
            //
            // The onCellClick event for the grid (where this function is called from) happens before the 
            // value of the checkbox in the grid gets updated, so use the opposite value of the current
            // value to update the transaction.
            //
            lx.sendJSON({
                url: 'exec.php?c=Company&fn=updateRequest',
                data: {
                    requestId: requestsGrid.getRow(clickEvent.rowIndex).id,
                    process: !requestsGrid.getRow(clickEvent.rowIndex).processed
                },
                onSuccess: function( responseText ) {
                    loader.hide();
                    
                    let response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Processing Request Failed',
                            message: response.error
                        });
                        return;
                    }
                    
                    // Refresh the grid to show/hide request depending on the filter
                    if( processedFilterSelect.getValue() !== 'show_all' ) {
                        onSearchEventHandler();
                    }
                }
            });
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};