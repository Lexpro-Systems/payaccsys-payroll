/* globals app, lx */
'use strict';

// LIST EMPLOYEE ACCOUNTS PANEL
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
app.panel.ListEmployeeAccounts = function(config) {
    
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
    let passwordSelect = null;
    let searchTxt = null;
    
    let employeeAccountSortBar = null;
    
    let employeeAccountsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load employee accounts
    function loadEmployeeAccounts( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = employeeAccountsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: employeeAccountSortBar.getSortItems(),
                hasPassword: passwordSelect.getValue(),
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Accounts Failed',
                        message: response.error
                    });
                    return;
                }
                
                let employeeAccounts = [];
                for( let i = 0; i < response.employeeAccounts.length; i++ ) {
                    employeeAccounts.push({
                        id: response.employeeAccounts[i].id, width: '100px',
                        name: response.employeeAccounts[i].firstName + ' ' + response.employeeAccounts[i].lastName,
                        emailAddress: response.employeeAccounts[i].emailAddress,
                        hasPassword: response.employeeAccounts[i].hasPassword,
                        createdOn: response.employeeAccounts[i].createdOn
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) employeeAccountsGrid.clear();
                
                // Display the result
                employeeAccountsGrid.addRows( employeeAccounts );
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
            innerHTML: 'Employee Accounts'
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
        
        // Create passwordSelect component
        passwordSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Password Set',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        let items = [];
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
        employeeAccountSortBar = new lx.component.SortBar({
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
                { name: 'Name', dataIndex: 'name'},
                { name: 'Email Address', dataIndex: 'emailAddress'},
                { name: 'Password Set', dataIndex: 'hasPassword'}
            ],
        
            onAddButtonClick: onUserSortBarAddButtonClick,
            onSortItemClick: onUserSortBarSortItemClick,
            onRemoveSortItem: onUserSortBarRemoveSortItem,
            onDraggedSortItem: onUserSortBarDraggedSortItem
        });
        
        // Add default sort items
        employeeAccountSortBar.addSortItem(employeeAccountSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create employeeAccountsGridMenuOptions array
        let employeeAccountsGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-fw fa-sign-in-alt" style="margin: 0px 15px 0px 0px;"></i>Quick Login', value: 'quickLogin'},
            // {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create employeeAccountsGrid component
        employeeAccountsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'createdOn', name: 'Created On', padding: '0px 0px 0px 20px', width: '100px'},
                {dataIndex: 'name', name: 'Name', type: 'button'},
                {dataIndex: 'emailAddress', name: 'Email Address'},
                {dataIndex: 'hasPassword', name: 'Password Set', alignment: 'center', width: '120px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: employeeAccountsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: employeeAccountsGridCellClickEventHandler,
            onScrollEnd: employeeAccountsGridScrollEndEventHandler,
            onMenuItemClick: employeeAccountsGridMenuItemClickEventHandler
        });
        
        // Load companies
        loader.show();
        loadEmployeeAccounts( true );
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
        if( employeeAccountSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: employeeAccountSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                employeeAccountSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loader.show();
                loadEmployeeAccounts( true );
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
    
    // employeeAccountSortBarSortItem click event handler
    function onUserSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        employeeAccountSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadEmployeeAccounts( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onUserSortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadEmployeeAccounts( true );
    }

    // onUserSortBarDraggedSortItem click event handler
    function onUserSortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadEmployeeAccounts( true );
    }
    
    // Search component event handler
    function onSearchEventHandler (){
        loader.show();
        loadEmployeeAccounts( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show();
        searchTxt.setValue('');
        loadEmployeeAccounts( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadEmployeeAccounts( true );
    }
    
    // employeeAccountsGrid scroll event handler
    function employeeAccountsGridScrollEndEventHandler() {
        loadEmployeeAccounts( false );
    }
    
    function employeeAccountsGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( employeeAccountsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            me.hide();
            
            let viewEmployeeAccountPanel = new app.panel.ViewEmployeeAccount({
                renderTo: app.mainPanel.getContainer(),
                
                employeeAccountId: employeeAccountsGrid.getRow(clickEvent.rowIndex).id,
                employeeAccountName: employeeAccountsGrid.getRow(clickEvent.rowIndex).name
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewEmployeeAccountPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            viewEmployeeAccountPanel.show();
            viewEmployeeAccountPanel.focus();
        }
        else if( employeeAccountsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'consultantName' ) {
            // Create a modal window
            let editConsultantModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '432px'
            });
            
            // Create the editConsultantPanel panel
            let editConsultantPanel = new app.panel.EditConsultant({
                renderTo: editConsultantModal.getContainer(),
                show: true,
                
                consultantId: employeeAccountsGrid.getRow(clickEvent.rowIndex).consultantId,
        
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadEmployeeAccounts( true );
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editConsultantModal.addEventListener('destroy', function() {
                editConsultantPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: editConsultantModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editConsultantModal.show();
            editConsultantPanel.focus();
        }
        else if( employeeAccountsGrid.getColumnDataIndex(clickEvent.columnIndex) === 'ownerUserName' ) {
            // Create a modal window
            let editUserModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '500px',
                maxHeight: '509px'
            });
            
            // Create the editUser panel
            let editUserPanel = new app.panel.EditUser({
                renderTo: editUserModal.getContainer(),
                show: true,
                
                userId: employeeAccountsGrid.getRow(clickEvent.rowIndex).ownerUserId,
                companyId: employeeAccountsGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadEmployeeAccounts( true );
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editUserModal.addEventListener('destroy', function() {
                editUserPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: editUserModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            editUserModal.show();
            editUserPanel.focus();
        }
    }
    
    // employeeAccountsGrid menuitemclick event handler
    function employeeAccountsGridMenuItemClickEventHandler( event ) {
        if( event.value === 'view' ) {
            me.hide();
            
            let viewCompanyPanel = new app.panel.ViewCompany({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                companyId: employeeAccountsGrid.getRow(event.rowIndex).id,
                companyName: employeeAccountsGrid.getRow(event.rowIndex).name
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewCompanyPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                loader.show();
                loadEmployeeAccounts( true );
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if( event.value === 'quickLogin' ) {
            // Create a modal for the quick login panel
            let modalWindow = new lx.component.ModalWindow({
                margin: '40px',
                height: '',
                maxHeight: '100%',
                maxWidth: '400px'
            });
            
            // Create the quickLoginPanel
            let quickLoginPanel = new app.panel.QuickLogin({
                renderTo: modalWindow.getContainer(),
                height: '100%',
                show: true,
                companyId: employeeAccountsGrid.getRow(event.rowIndex).id,
                companyName: employeeAccountsGrid.getRow(event.rowIndex).name,
                
                onCancel: function() {
                    modalWindow.destroy();
                },
                onLogin: function() {
                    modalWindow.destroy();
                }
            });
            
            // Destroy the quick login panel after the model is destroyed
            modalWindow.addEventListener('destroy', function() {
                quickLoginPanel.destroy();
            });
            
            modalWindow.show();
            quickLoginPanel.focus();
        }
        else if( event.value === 'remove' ) {
            new lx.component.Messagebox({
                message: 
                    'The company for \'' + 
                    employeeAccountsGrid.getRow(event.rowIndex).name + 
                    '\' will be permanently removed. Are you sure you wish to continue?<br><br>' +
                    '<b>NOTE:</b> This will NOT remove the schema.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'delete', label: 'Delete', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the company be removed?
                    if( closeEvent.button === 'delete' ) {
                        // Delete the company
                        lx.sendJSON({
                            url: 'exec.php?c=Company&fn=remove',
                            data: {
                                id: parseInt(employeeAccountsGrid.getRow(event.rowIndex).id)
                            },
                            onSuccess: function( responseText ) {
                                let response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Deleting Company Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                loader.show();
                                loadEmployeeAccounts( true );
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
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};