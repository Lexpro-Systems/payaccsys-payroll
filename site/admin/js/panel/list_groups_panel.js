/* globals app, lx */
'use strict';

// LIST GROUPS PANEL
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
app.panel.ListGroups = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleTextEl = null;
    let addBtn = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let filterSectionEl = null;
    let searchTxt = null;
    
    let groupsSortBar = null;
    
    let groupsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load groups
    function loadGroups( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = groupsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Group&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: groupsSortBar.getSortItems()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Groups Failed',
                        message: response.error
                    });
                    return;
                }
                
                let groups = [];
                for( let i = 0; i < response.groups.length; i++ ) {
                    groups.push({
                        id: response.groups[i].id,
                        name: response.groups[i].name,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) groupsGrid.clear();
                
                // Display the result
                groupsGrid.addRows( groups );
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
            innerHTML: 'Groups'
        });
        
        // // Create the member search component
        // searchTxt = new lx.component.Searchbox({
        //     renderTo: titleContainerEl,
        //     width: '',
        //     maxWidth: '250px',
        //     height: '32px',
        //     flex: '1 1 auto',
        //     margin: '0px 0px 0px auto',

        //     onSearch: onSearchEventHandler,
        //     onReset: onSearchResetBtnClickEventHandler
        // });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Group',
            height: '32px',
            width: '140px',
            margin: '0px 20px 0px auto',
            
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
        
        // Create employeeStatusSelect component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            maxWidth: '300px',
            margin: '0px 0px 0px auto',
            height: '32px',
            // label: 'Search',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        
        //
        // SORT BAR
        //
        
        // Create a sort bar for the employees
        groupsSortBar = new lx.component.SortBar({
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
                { name: 'Name', dataIndex: 'name'}
            ],
            
            onAddButtonClick: onGroupSortBarAddButtonClick,
            onSortItemClick: onGroupSortBarSortItemClick,
            onRemoveSortItem: onGroupSortBarRemoveSortItem,
            onDraggedSortItem: onGroupSortBarDraggedSortItem
        });
        
        // Add default sort items
        groupsSortBar.addSortItem(groupsSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create groupsGridMenuOptions array
        let groupsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create groupsGrid component
        groupsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'name', name: 'Group Name', padding: '0px 0px 0px 20px', type: 'button'},
                {dataIndex: 'menu', name: '', type: 'menu', options: groupsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: groupsGridCellClickEventHandler,
            
            onScrollEnd: groupsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    me.hide();
                    
                    let editGroupPanel = new app.panel.EditGroup({
                        renderTo: app.mainPanel.getContainer(),
                        
                        groupId: groupsGrid.getRow(clickEvent.rowIndex).id,
                        groupName: groupsGrid.getRow(clickEvent.rowIndex).name,
                        
                        onSave: function() {
                            app.route.popState();
                        }
                    });
                    
                    let panelState = {
                        previousPanel: me,
                        panel: editGroupPanel
                    };
                    
                    app.route.pushState(panelState, function( state ) {
                        if( !state.panel.destroy() ) return false;
                        state.previousPanel.show();
                        loader.show();
                        loadGroups( true );
                    });
                    
                    editGroupPanel.show();
                    editGroupPanel.focus();
                }
                else if( clickEvent.value === 'remove' ) {
                    new lx.component.Messagebox({
                        message: 
                            'The group \'' + 
                            groupsGrid.getRow(clickEvent.rowIndex).name + 
                            '\' will be permanently removed. Are you sure you wish to continue?',
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'delete', label: 'Delete', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the group be removed?
                            if( closeEvent.button === 'delete' ) {
                                // Delete the group
                                lx.sendJSON({
                                    url: 'exec.php?c=Group&fn=remove',
                                    data: {
                                        id: parseInt(groupsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        let response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Group Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        loader.show();
                                        loadGroups( true );
                                        return;
                                    }
                                });
                            }
                            else {
                                return;
                            }
                        }
                    });
                }
            }
        });
        
        // Load groups
        loadGroups();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onGroupSortBarAddButton click event handler
    function onGroupSortBarAddButtonClick() {
        // have all the sort options been added?
        if( groupsSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: groupsSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                groupsSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadGroups( true );
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
    
    // groupsSortBarSortItem click event handler
    function onGroupSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        groupsSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadGroups( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onGroupSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadGroups( true );
    }

    // onGroupSortBarDraggedSortItem click event handler
    function onGroupSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadGroups( true );
    }
    
    // Search component event handler
    function onSearchEventHandler() {
        loader.show();
        loadGroups( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loader.show();
        loadGroups( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadGroups( true );
    }
    
    // groupsGrid scroll end event handler
    function groupsGridScrollEndEventHandler() {
        loadGroups( false );
    }
    
    // groupsGrid cell click event handler
    function groupsGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( groupsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            
            me.hide();
            
            let editGroupPanel = new app.panel.EditGroup({
                renderTo: app.mainPanel.getContainer(),
                
                groupId: groupsGrid.getRow(clickEvent.rowIndex).id,
                groupName: groupsGrid.getRow(clickEvent.rowIndex).name,
                
                onSave: function() {
                    searchTxt.setValue('');
                    loader.show();
                    loadGroups( true );
                    app.route.popState();
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: editGroupPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            editGroupPanel.show();
            editGroupPanel.focus();
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        me.hide();
        
        let addGroupPanel = new app.panel.AddGroup({
            renderTo: app.mainPanel.getContainer(),
            
            onAdd: function() {
                searchTxt.setValue('');
                loader.show();
                loadGroups( true );
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: addGroupPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        addGroupPanel.show();
        addGroupPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};