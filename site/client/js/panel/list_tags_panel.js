/* globals app, lx */
'use strict';

// LIST TAGS PANEL
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
app.panel.ListTags = function(config) {

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
    
    let tagsSortBar = null;
    
    let tagsGrid = null;

    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);


    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load tags
    function loadTags( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = tagsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Tags&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: tagsSortBar.getSortItems()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tags Failed',
                        message: response.error
                    });
                    return;
                }
                
                let tags = [];
                for( let i = 0; i < response.tags.length; i++ ) {
                    tags.push({
                        id: response.tags[i].id,
                        name: response.tags[i].name,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) tagsGrid.clear();
                
                // Display the result
                tagsGrid.addRows( tags );
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
            innerHTML: 'Tags'
        });

        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Tags',
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
        tagsSortBar = new lx.component.SortBar({
            renderTo: contentContainerEl,
            backgroundColor: '#F8F8F8',
            orderIndicatorColor: '#ffffffff',
            dragHighlightColor: '#B0B0B0',
            width: '100%',
            
            displayToolTips: true,
            allowAddItems: true,
            allowRemoveItems: true,
            allowDragItems: true,
            
            sortOptions: [
                { name: 'Name', dataIndex: 'name'}
            ],
            
            onAddButtonClick: onTagsSortBarAddButtonClick,
            onSortItemClick: onTagsSortBarSortItemClick,
            onRemoveSortItem: onTagsSortBarRemoveSortItem,
            onDraggedSortItem: onTagsSortBarDraggedSortItem
        });
        
        // Add default sort items
        tagsSortBar.addSortItem(tagsSortBar.getSortItemCount(), 'Name', 'name', 'ASC');

        //
        // RESULT SECTION
        //
        
        // Create tagsGridMenuOptions array
        let tagsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];

        // Create tagsGrid component
        tagsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'name', name: 'Tag Name', padding: '0px 0px 0px 20px', type: 'button'},
                {dataIndex: 'menu', name: '', type: 'menu', options: tagsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: tagsGridCellClickEventHandler,
            
            onScrollEnd: tagsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    me.hide();
                    
                    let editTagsPanel = new app.panel.EditTags({
                        renderTo: app.mainPanel.getContainer(),
                        
                        tagsId: tagsGrid.getRow(clickEvent.rowIndex).id,
                        tagName: tagsGrid.getRow(clickEvent.rowIndex).name,
                        
                        onSave: function() {
                            app.route.popState();
                        }
                    });
                    
                    let panelState = {
                        previousPanel: me,
                        panel: editTagsPanel
                    };
                    
                    app.route.pushState(panelState, function( state ) {
                        if( !state.panel.destroy() ) return false;
                        state.previousPanel.show();
                        loader.show();
                        loadTags( true );
                    });
                    
                    editTagsPanel.show();
                    editTagsPanel.focus();
                }
                else if( clickEvent.value === 'remove' ) {
                    new lx.component.Messagebox({
                        message: 
                            'The tag \'' + 
                            tagsGrid.getRow(clickEvent.rowIndex).name + 
                            '\' will be permanently removed. Are you sure you wish to continue?',
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'delete', label: 'Delete', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the tag be removed?
                            if( closeEvent.button === 'delete' ) {
                                // Delete the tags
                                lx.sendJSON({
                                    url: 'exec.php?c=Tags&fn=remove',
                                    data: {
                                        id: parseInt(tagsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        let response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Tag Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        loader.show();
                                        loadTags( true );
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

        // Load tags
        loadTags();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };

    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onTagSortBarAddButton click event handler
    function onTagsSortBarAddButtonClick() {
        // have all the sort options been added?
        if( tagsSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: tagsSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                tagsSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadTags( true );
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

    // tagsSortBarSortItem click event handler
    function onTagsSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        tagsSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadTags( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onTagsSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadTags( true );
    }

    // onTagsSortBarDraggedSortItem click event handler
    function onTagsSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadTags( true );
    }

    // Search component event handler
    function onSearchEventHandler() {
        loader.show();
        loadTags( true );
    }

    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loader.show();
        loadTags( true );
    }

    // tagsGrid scroll end event handler
    function tagsGridScrollEndEventHandler() {
        loadTags( false );
    }

    // tagsGrid cell click event handler
    function tagsGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( tagsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            
            me.hide();
            
            let editTagsPanel = new app.panel.EditTags({
                renderTo: app.mainPanel.getContainer(),
                
                tagsId: tagsGrid.getRow(clickEvent.rowIndex).id,
                tagName: tagsGrid.getRow(clickEvent.rowIndex).name,
                
                onSave: function() {
                    searchTxt.setValue('');
                    loader.show();
                    loadTags( true );
                    app.route.popState();
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: editTagsPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            editTagsPanel.show();
            editTagsPanel.focus();
        }
    }

    // addBtn click event handler
    function addBtnClickEventHandler() {
        me.hide();
        
        let addTagsPanel = new app.panel.AddTags({
            renderTo: app.mainPanel.getContainer(),
            
            onAdd: function() {
                searchTxt.setValue('');
                loader.show();
                loadTags( true );
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: addTagsPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        addTagsPanel.show();
        addTagsPanel.focus();
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );

};