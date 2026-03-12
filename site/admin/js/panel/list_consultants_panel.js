/* globals app, lx */
'use strict';

// LIST CONSULTANTS PANEL
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
app.panel.ListConsultants = function(config) {
    
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
    
    let consultantSortBar = null;
    
    let consultantsGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadConsultants( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = consultantsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Consultant&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: consultantSortBar.getSortItems()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Consultants Failed',
                        message: response.error
                    });
                    return;
                }
                
                let consultants = [];
                for( let i = 0; i < response.consultants.length; i++ ) {
                    consultants.push({
                        id: response.consultants[i].id,
                        name: response.consultants[i].name,
                        emailAddress: response.consultants[i].emailAddress,
                        telNumber: response.consultants[i].telNumber,
                        cellNumber: response.consultants[i].cellNumber,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) consultantsGrid.clear();
                
                // Display the result
                consultantsGrid.addRows( consultants );
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
            innerHTML: 'Consultants'
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
            label: 'Add Consultant',
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
        consultantSortBar = new lx.component.SortBar({
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
                { name: 'Telephone Number', dataIndex: 'telNumber'}
            ],
            
            onAddButtonClick: onConsultantSortBarAddButtonClick,
            onSortItemClick: onConsultantSortBarSortItemClick,
            onRemoveSortItem: onConsultantSortBarRemoveSortItem,
            onDraggedSortItem: onConsultantSortBarDraggedSortItem
        });
        
        // Add default sort items
        consultantSortBar.addSortItem(consultantSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create consultantsGridMenuOptions array
        let consultantsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create consultantsGrid component
        consultantsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'name', name: 'Name', padding: '0px 0px 0px 20px', type: 'button'},
                {dataIndex: 'emailAddress', name: 'Email Address'},
                {dataIndex: 'telNumber', name: 'Tel. Number', width: '160px'},
                {dataIndex: 'cellNumber', name: 'Cell Number', width: '160px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: consultantsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: consultantsGridCellClickEventHandler,
            
            onScrollEnd: consultantsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    let editConsultantPanel = new app.panel.EditConsultant({
                        renderTo: app.mainPanel.getContainer(),
                        margin: '40px',
                        maxWidth: '450px',
                        maxHeight: '432px',
                        
                        consultantId: consultantsGrid.getRow(clickEvent.rowIndex).id,
                        
                        onCancel: function() {
                            app.route.popState();
                        },
                        onSave: function() {
                            app.route.popState();
                            consultantsGrid.clear();
                            loadConsultants();
                        }
                    });
                    
                    let panelState = {
                        previousPanel: me,
                        panel: editConsultantPanel
                    };
                    
                    app.route.pushState(panelState, function( state ) {
                        if( !state.panel.destroy() ) return false;
                        state.previousPanel.show();
                    });
                    
                    editConsultantPanel.showModal();
                    editConsultantPanel.focus();
                }
                else if( clickEvent.value === 'remove' ) {
                    new lx.component.Messagebox({
                        message: 
                            '\'' + consultantsGrid.getRow(clickEvent.rowIndex).name + 
                            '\' will be permanently deleted. Are you sure you wish to continue?',
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'delete', label: 'Delete', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the consultant be removed?
                            if( closeEvent.button === 'delete' ) {
                                // Delete the consultant
                                lx.sendJSON({
                                    url: 'exec.php?c=Consultant&fn=remove',
                                    data: {
                                        id: parseInt(consultantsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        let response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Consultant Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        consultantsGrid.clear();
                                        loadConsultants();
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
        
        // Load consultants
        loadConsultants();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onConsultantSortBarAddButton click event handler
    function onConsultantSortBarAddButtonClick() {
        // have all the sort options been added?
        if( consultantSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: consultantSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                consultantSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadConsultants( true );
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
    
    // consultantSortBarSortItem click event handler
    function onConsultantSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        consultantSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadConsultants( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onConsultantSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadConsultants( true );
    }

    // onConsultantSortBarDraggedSortItem click event handler
    function onConsultantSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadConsultants( true );
    }
    
    // Search component event handler
    function onSearchEventHandler (){
        consultantsGrid.clear();
        loadConsultants();
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        consultantsGrid.clear();
        searchTxt.setValue('');
        loadConsultants();
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadConsultants( true );
    }
    
    // consultantsGrid scroll end event handler
    function consultantsGridScrollEndEventHandler() {
        loadConsultants();
    }
    
    // consultantsGrid cell click event handler
    function consultantsGridCellClickEventHandler( clickEvent ) {
        if( consultantsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            
            let editConsultantPanel = new app.panel.EditConsultant({
                renderTo: app.mainPanel.getContainer(),
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '432px',
                
                consultantId: clickEvent.record.id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    consultantsGrid.clear();
                    loadConsultants();
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: editConsultantPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            editConsultantPanel.showModal();
            editConsultantPanel.focus();
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        // Create the addConsultantPanel panel
        let addConsultantPanel = new app.panel.AddConsultant({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '432px',
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                consultantsGrid.clear();
                loadConsultants();
            }
        });
        
        // Create a route entry for the panel
        let state = {
            panel: addConsultantPanel
        };
        app.route.pushState(state, function( state ) {
            state.panel.destroy();
        });
        
        // Show the modal window and focus on the panel
        addConsultantPanel.showModal();
        addConsultantPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};