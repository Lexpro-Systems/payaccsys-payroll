/* globals app, lx */
'use strict';


// LIST INVITATIONS PANEL
//
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
app.panel.ListInvitations = function(config) {
    
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
    let inviteStatusSelect = null;
    let searchTxt = null;
    
    let invitationSortBar = null;
    
    let invitationsGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load invitation statuses
    function loadInvitationStatuses() {
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=getStatusList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Invitation Statuses Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Add leave statuses to select
                let items = [];
                items.push({
                    value: null,
                    text: 'All Invitations'
                });
                for( let i = 0; i < response.statuses.length; i++ ) {
                    items.push({
                        value: response.statuses[i].code,
                        text: response.statuses[i].name + ' Invitations'
                    });
                }
                inviteStatusSelect.addItems( items );
                inviteStatusSelect.setValue( 'PEND', 'Pending Invitations' );
                
                // Load the invitations
                loader.show();
                loadInvitations( true );
            }
        });
    }
    
    // Function to load invitations
    function loadInvitations( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = invitationsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Invitation&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: invitationSortBar.getSortItems(),
                invitationStatusCode: inviteStatusSelect.getValue()
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                loader.hide();
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Invitations Failed',
                        message: response.error
                    });
                    return;
                }
                
                let invitations = [];
                for( let i = 0; i < response.invitations.length; i++ ) {
                    invitations.push({
                        id: response.invitations[i].id,
                        icon: '<i class="far fa-envelope"></i>',
                        company: response.invitations[i].company.name,
                        name: response.invitations[i].name,
                        email: response.invitations[i].emailAddress,
                        cellphone: '-',
                        status: response.invitations[i].status.name,
                        expiresOn: response.invitations[i].expiresOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>'
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) invitationsGrid.clear();
                
                // Display the result
                invitationsGrid.addRows( invitations );
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {};
        
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
            innerHTML: 'Invitations'
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
        
        // Create the inviteStatusSelect component
        inviteStatusSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlign: 'left',
            // label: 'Invite Status: ',
            // labelWidth: '100px',
            height: '32px',
            width: '180px',
            margin: '0px 20px 0px 0px',
            
            onChange: filterOnChangeEventHandler
        });
        
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
        invitationSortBar = new lx.component.SortBar({
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
                { name: 'Name', dataIndex: 'name'},
                { name: 'Email Address', dataIndex: 'emailAddress'},
                { name: 'Company', dataIndex: 'companyName'},
                { name: 'Status', dataIndex: 'statusName'},
                { name: 'Expires On', dataIndex: 'expiresOn'}
            ],
            
            onAddButtonClick: onInvitationSortBarAddButtonClick,
            onSortItemClick: onInvitationSortBarSortItemClick,
            onRemoveSortItem: onInvitationSortBarRemoveSortItem,
            onDraggedSortItem: onInvitationSortBarDraggedSortItem
        });
        
        // Add default sort items
        invitationSortBar.addSortItem(invitationSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create invitationsGridMenuOptions array
        let invitationsGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'}
        ];
        
        // Create invitationsGrid component
        invitationsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'name', name: 'Name', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'company', name: 'Company'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'expiresOn', name: 'Expires On', width: '120px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: invitationsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '0px', padding: '0px 5px 0px 0px'}
            ],
            
            onCellClick: invitationsGridCellClickEventHandler,
            
            onScrollEnd: invitationsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'view' ) {
                    let viewInvitationModal = new app.panel.ViewInvitation({
                        renderTo: app.mainPanel.getContainer(),
                        margin: '40px',
                        maxWidth: '500px',
                        maxHeight: '672px',
                        
                        invitationId: clickEvent.srcComponent.getRow(clickEvent.rowIndex).id,
                        
                        onClose: function() {
                            app.route.popState();
                        }
                    });
                    
                    let panelState = {
                        previousPanel: me,
                        panel: viewInvitationModal
                    };
                    
                    app.route.pushState(panelState, function( state ) {
                        if( !state.panel.destroy() ) return false;
                        state.previousPanel.show();
                    });
                    
                    viewInvitationModal.showModal();
                    viewInvitationModal.focus();
                }
            }
        });
        
        // Load companies
        loadInvitationStatuses();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onInvitationSortBarAddButton click event handler
    function onInvitationSortBarAddButtonClick() {
        // have all the sort options been added?
        if( invitationSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: invitationSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                invitationSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadInvitations( true );
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
    
    // invitationSortBarSortItem click event handler
    function onInvitationSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        invitationSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadInvitations( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onInvitationSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadInvitations( true );
    }

    // onInvitationSortBarDraggedSortItem click event handler
    function onInvitationSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadInvitations( true );
    }
    
    // Search component event handler
    function onSearchEventHandler (){
        loader.show( true );
        loadInvitations( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show( true );
        searchTxt.setValue('');
        loadInvitations( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadInvitations( true );
    }
    
    // invitationsGrid scroll end event handler
    function invitationsGridScrollEndEventHandler() {
        loadInvitations( false );
    }
    
    // invitationsGrid cell click event handler
    function invitationsGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( invitationsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            let viewInvitationModal = new app.panel.ViewInvitation({
                renderTo: app.mainPanel.getContainer(),
                margin: '40px',
                maxWidth: '500px',
                maxHeight: '672px',
                
                invitationId: clickEvent.record.id,
                
                onClose: function() {
                    app.route.popState();
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewInvitationModal
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            viewInvitationModal.showModal();
            viewInvitationModal.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};