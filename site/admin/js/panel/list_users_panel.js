/* globals app, lx */
'use strict';


// LIST USERS PANEL
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
app.panel.ListUsers = function(config) {
    
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
    let statusSelect = null;
    let adminSelect = null;
    let passwordSelect = null;
    let searchTxt = null;
    
    let userSortBar = null;
    
    let usersGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadUsers( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = usersGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortList: userSortBar.getSortItems(),
                isActive: statusSelect.getValue(),
                isAdmin: adminSelect.getValue(),
                hasPassword: passwordSelect.getValue(),
                limitGroups: false
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Users Failed',
                        message: response.error
                    });
                    return;
                }
                
                let users = [];
                for( let i = 0; i < response.users.length; i++ ) {
                    let status = 'Active';
                    if( !response.users[i].isActive ) {
                        status = 'Inactive';
                    }
                    
                    let password = 'Yes';
                    if( !response.users[i].hasPassword ) {
                        password = 'No';
                    }
                    
                    let admin = 'Yes';
                    if( !response.users[i].isAdmin ) {
                        admin = 'No';
                    }
                    
                    users.push({
                        id: response.users[i].id,
                        name: response.users[i].name,
                        email: response.users[i].emailAddress,
                        cellphone: response.users[i].cellNumber,
                        status: status,
                        password: password,
                        admin: admin,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) usersGrid.clear();
                
                // Display the result
                usersGrid.addRows( users );
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
            innerHTML: 'Users'
        });
        
        // // Create the member search component
        // searchTxt = new lx.component.Searchbox({
        //     renderTo: titleContainerEl,
        //     width: '',
        //     maxWidth: '250px',
        //     height: '32px',
        //     flex: '1 1 auto',
        //     margin: '0px 20px 0px auto',
            
        //     onSearch: onSearchEventHandler,
        //     onReset: onSearchResetBtnClickEventHandler
        // });
        
        
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
        
        // Create statusSelect component
        statusSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Active Status',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        let items = [];
        items.push({value: null,   text: 'Any Status'});
        items.push({value: true,   text: 'Active'});
        items.push({value: false,  text: 'Inactive'});
        statusSelect.addItems( items );
        statusSelect.setValue( null, 'Any Status' );
        
        // Create adminSelect component
        adminSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Admin Access',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        items = [];
        items.push({value: null,   text: 'Any Status'});
        items.push({value: true,   text: 'Yes'});
        items.push({value: false,  text: 'No'});
        adminSelect.addItems( items );
        adminSelect.setValue( null, 'Any Status' );
        
        // Create passwordSelect component
        passwordSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Password Set',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        items = [];
        items.push({value: null,   text: 'Any Status'});
        items.push({value: true,   text: 'Yes'});
        items.push({value: false,  text: 'No'});
        passwordSelect.addItems( items );
        passwordSelect.setValue( null, 'Any Status' );
        
        // Create employeeStatusSelect component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            maxWidth: '300px',
            margin: '0px 0px 0px auto',
            height: '32px',
            label: 'Search',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        
        //
        // SORT BAR
        //
        
        // Create a sort bar for the employees
        userSortBar = new lx.component.SortBar({
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
                { name: 'Cellphone Number', dataIndex: 'cellNumber'},
                { name: 'Status', dataIndex: 'isActive'},
                { name: 'Admin Access', dataIndex: 'isAdmin'},
                { name: 'Password Set', dataIndex: 'hasPassword'}
            ],
            
            onAddButtonClick: onUserSortBarAddButtonClick,
            onSortItemClick: onUserSortBarSortItemClick,
            onRemoveSortItem: onUserSortBarRemoveSortItem,
            onDraggedSortItem: onUserSortBarDraggedSortItem
        });
        
        // Add default sort items
        userSortBar.addSortItem(userSortBar.getSortItemCount(), 'Status', 'isActive', 'DESC');
        userSortBar.addSortItem(userSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create the user grid menu options
        let usersGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'}
        ];
        
        // Create userGrid component
        usersGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'name', name: 'Name', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'admin', name: 'Admin Access', width: '100px'},
                {dataIndex: 'password', name: 'Password Set', width: '100px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: usersGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '0px', padding: '0px 5px 0px 0px'}
            ],
            
            onCellClick: usersGridCellClickEventHandler,
            onScrollEnd: usersGridScrollEndEventHandler,
            onMenuItemClick: usersGridMenuItemClickEventHandler
        });
        
        // Load users
        loader.show();
        loadUsers( true );
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        searchTxt.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onUserSortBarAddButton click event handler
    function onUserSortBarAddButtonClick() {
        // have all the sort options been added?
        if( userSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: userSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                userSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadUsers( true );
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
    
    // userSortBarSortItem click event handler
    function onUserSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        userSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadUsers( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onUserSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadUsers( true );
    }

    // onUserSortBarDraggedSortItem click event handler
    function onUserSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadUsers( true );
    }
    
    // Search component event handler
    function onSearchEventHandler (){
        loader.show();
        loadUsers( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loader.show();
        loadUsers( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadUsers( true );
    }
    
    // usersGrid scroll end event handler
    function usersGridScrollEndEventHandler() {
        loadUsers( false );
    }
    
    // usersGrid cell click event handler
    function usersGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( usersGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            // Create the editUser panel
            let editUserPanel = new app.panel.EditUser({
                userId: clickEvent.record.id,
                companyId: null,
                
                maxWidth: '500px',
                maxHeight: '509px',
                margin: '40px',
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadUsers( true );
                }
            });
            
            // Create a route entry for the panel
            let state = {
                panel: editUserPanel
            };
            app.route.pushState(state, function( state ) {
                state.panel.destroy();
            });
            
            editUserPanel.showModal();
            editUserPanel.focus();
        }
    }
    
    // usersGridMenuItem click event handler
    function usersGridMenuItemClickEventHandler( clickEvent ) {
        // Depending on the menu item clicked
        if( clickEvent.value === 'edit' ) {
            // Create the editUser panel
            let editUserPanel = new app.panel.EditUser({
                userId: usersGrid.getRow(clickEvent.rowIndex).id,
                companyId: null,
                
                maxWidth: '500px',
                maxHeight: '509px',
                margin: '40px',
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadUsers( true );
                }
            });
            
            // Create a route entry for the panel
            let state = {
                panel: editUserPanel
            };
            app.route.pushState(state, function( state ) {
                state.panel.destroy();
            });
            
            editUserPanel.showModal();
            editUserPanel.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};