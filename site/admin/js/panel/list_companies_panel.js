/* globals app, lx */
'use strict';


// LIST BOOKSETS PANEL
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
app.panel.ListCompanies = function(config) {
    
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
    let enabledSelect = null;
    let trialSelect = null;
    let searchTxt = null;
    
    let companySortBar = null;
    
    let companiesGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadCompanies( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = companiesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: companySortBar.getSortItems(),
                isEnabled: enabledSelect.getValue(),
                isTrial: trialSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Companies Failed',
                        message: response.error
                    });
                    return;
                }
                
                let companies = [];
                for( let i = 0; i < response.companies.length; i++ ) {
                    let isActive = 'Yes';
                    if( !response.companies[i].isActive ) {
                        isActive = 'No';
                    }
                    
                    let consultantName = '';
                    if( response.companies[i].consultantId !== null ) {
                        consultantName = response.companies[i].consultantName;
                    }
                    
                    let employeeLimit = '-';
                    if( response.companies[i].employeeLimit !== null ) {
                        employeeLimit = response.companies[i].employeeLimit;
                    }
                    
                    companies.push({
                        id: response.companies[i].id,
                        name: response.companies[i].name,
                        alias: response.companies[i].alias,
                        contactPerson: response.companies[i].contactPerson,
                        contactNumber: response.companies[i].contactNumber,
                        contactEmail: response.companies[i].contactEmail,
                        databaseName: response.companies[i].databaseName,
                        databaseSchema: response.companies[i].databaseSchema,
                        databaseHost: response.companies[i].databaseHost,
                        trialExpiresOn: (response.companies[i].trialExpiresOn !== null ? response.companies[i].trialExpiresOn : '-'),
                        isActive: isActive,
                        employeeLimit: employeeLimit,
                        ownerUserId: response.companies[i].ownerUserId,
                        ownerUserName: response.companies[i].ownerUserName,
                        consultantId: response.companies[i].consultantId,
                        consultantName: consultantName,
                        createdOn: response.companies[i].createdOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) companiesGrid.clear();
                
                // Display the result
                companiesGrid.addRows( companies );
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
            innerHTML: 'Companies'
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
            label: 'Add Company',
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
        
        // Create enabledSelect component
        enabledSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Active Status',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        let status = [];
        status.push({value: null,   text: 'Any Status'});
        status.push({value: true,   text: 'Active'});
        status.push({value: false,  text: 'Inactive'});
        enabledSelect.addItems( status );
        enabledSelect.setValue( null, 'Any Status' );
        
        // Create trialSelect component
        trialSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Trial Status',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        status = [];
        status.push({value: null,   text: 'Any Status'});
        status.push({value: true,   text: 'Trial Active'});
        status.push({value: false,  text: 'Trial Expired'});
        trialSelect.addItems( status );
        trialSelect.setValue( null, 'Any Status' );
        
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
        companySortBar = new lx.component.SortBar({
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
                { name: 'Company Name', dataIndex: 'companyName'},
                { name: 'Contact Person', dataIndex: 'contactPerson'},
                { name: 'Contact Number', dataIndex: 'contactNumber'},
                { name: 'Contact Email', dataIndex: 'contactEmail'},
                { name: 'Consultant Name', dataIndex: 'consultantName'},
                { name: 'Active', dataIndex: 'isEnabled'},
                // { name: 'Total Payruns', dataIndex: 'totalPayruns'},
                // { name: 'Last Payrun', dataIndex: 'lastPayrun'},
                { name: 'Trial End Date', dataIndex: 'trialExpiresOn'},
                { name: 'Created On', dataIndex: 'createdOn'}
            ],
            
            onAddButtonClick: onCompanySortBarAddButtonClick,
            onSortItemClick: onCompanySortBarSortItemClick,
            onRemoveSortItem: onCompanySortBarRemoveSortItem,
            onDraggedSortItem: onCompanySortBarDraggedSortItem
        });
        
        // Add default sort items
        companySortBar.addSortItem(companySortBar.getSortItemCount(), 'Active', 'isEnabled', 'DESC');
        companySortBar.addSortItem(companySortBar.getSortItemCount(), 'Company Name', 'companyName', 'ASC');
        
        
        //
        // RESULT SECTION
        //
        
        // Create companiesGridMenuOptions array
        let companiesGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-fw fa-sign-in-alt" style="margin: 0px 15px 0px 0px;"></i>Quick Login', value: 'quickLogin'},
            // {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create companiesGrid component
        companiesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            
            columns: [
                {dataIndex: 'createdOn', name: 'Created', padding: '0px 0px 0px 20px', width: '100px'},
                {dataIndex: 'name', name: 'Company Name', type: 'button'},
                // {dataIndex: 'alias', name: 'Alias'},
                // {dataIndex: 'contactPerson', name: 'Contact Person'},
                // {dataIndex: 'contactNumber', name: 'Contact Number'},
                // {dataIndex: 'contactEmail', name: 'Contact Email'},
                {dataIndex: 'ownerUserName', name: 'Owner User', type: 'button'},
                {dataIndex: 'consultantName', name: 'Consultant', type: 'button'},
                {dataIndex: 'databaseName', name: 'Database Name', width: '110px'},
                {dataIndex: 'databaseSchema', name: 'Database Schema', width: '150px'},
                // {dataIndex: 'databaseHost', name: 'Database Host', width: '120px'},
                {dataIndex: 'employeeLimit', name: 'Employee Limit', alignment: 'right', width: '100px'},
                {dataIndex: 'trialExpiresOn', name: 'Trial End Date', width: '100px'},
                {dataIndex: 'isActive', name: 'Active', width: '60px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: companiesGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: companiesGridCellClickEventHandler,
            onScrollEnd: companiesGridScrollEndEventHandler,
            onMenuItemClick: companiesGridMenuItemClickEventHandler
        });
        
        // Load companies
        loader.show();
        loadCompanies( true );
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        searchTxt.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onCompanySortBarAddButton click event handler
    function onCompanySortBarAddButtonClick() {
        // have all the sort options been added?
        if( companySortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: companySortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                companySortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loadCompanies( true );
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

    // companySortBarSortItem click event handler
    function onCompanySortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        companySortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loader.show();
        loadCompanies( true );
        return;
    }

    // sortBarRemoveSortItem click event handler
    function onCompanySortBarRemoveSortItem() {
        // Reload the form data
        loader.show();
        loadCompanies( true );
    }

    // onCompanySortBarDraggedSortItem click event handler
    function onCompanySortBarDraggedSortItem() {
        // Reload the form data
        loader.show();
        loadCompanies( true );
    }
    
    // Search component event handler
    function onSearchEventHandler() {
        loader.show();
        loadCompanies( true );
    }
    
    // onSearchResetBtn click event handler
    function onSearchResetBtnClickEventHandler() {
        loader.show();
        searchTxt.setValue('');
        loadCompanies( true );
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler() {
        loader.show();
        loadCompanies( true );
    }
    
    // companiesGrid scroll event handler
    function companiesGridScrollEndEventHandler() {
        loadCompanies( false );
    }
    
    // companiesGrid cell click event handler
    function companiesGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( companiesGrid.getColumnDataIndex(clickEvent.columnIndex) === 'name' ) {
            me.hide();
            
            let viewCompanyPanel = new app.panel.ViewCompany({
                renderTo: app.mainPanel.getContainer(),
                companyId: companiesGrid.getRow(clickEvent.rowIndex).id,
                companyName: companiesGrid.getRow(clickEvent.rowIndex).name
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewCompanyPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                loader.show();
                loadCompanies( true );
                state.panel.destroy();
                state.previousPanel.show();
            });
            
            viewCompanyPanel.show();
            viewCompanyPanel.focus();
        }
        else if( companiesGrid.getColumnDataIndex(clickEvent.columnIndex) === 'consultantName' ) {
            let editConsultantModal = new app.panel.EditConsultant({
                renderTo: app.mainPanel.getContainer(),
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '432px',
                
                consultantId: companiesGrid.getRow(clickEvent.rowIndex).consultantId,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadCompanies( true );
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: editConsultantModal
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            editConsultantModal.showModal();
            editConsultantModal.focus();
        }
        else if( companiesGrid.getColumnDataIndex(clickEvent.columnIndex) === 'ownerUserName' ) {
            let editUserModal = new app.panel.EditUser({
                renderTo: app.mainPanel.getContainer(),
                margin: '40px',
                maxWidth: '500px',
                maxHeight: '509px',
                
                userId: companiesGrid.getRow(clickEvent.rowIndex).ownerUserId,
                companyId: companiesGrid.getRow(clickEvent.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loader.show();
                    loadCompanies( true );
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: editUserModal
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            editUserModal.showModal();
            editUserModal.focus();
        }
    }
    
    // companiesGrid menuitemclick event handler
    function companiesGridMenuItemClickEventHandler( event ) {
        if( event.value === 'view' ) {
            me.hide();
            
            let viewCompanyPanel = new app.panel.ViewCompany({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                companyId: companiesGrid.getRow(event.rowIndex).id,
                companyName: companiesGrid.getRow(event.rowIndex).name
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewCompanyPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                loader.show();
                loadCompanies( true );
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if( event.value === 'quickLogin' ) {
            let quickLoginPanel = new app.panel.QuickLogin({
                renderTo: app.mainPanel.getContainer(),
                margin: '40px',
                height: '',
                maxHeight: '100%',
                maxWidth: '400px',
                companyId: companiesGrid.getRow(event.rowIndex).id,
                companyName: companiesGrid.getRow(event.rowIndex).name,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onUpdate: function() {
                    app.route.popState();
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: quickLoginPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                state.previousPanel.show();
            });
            
            quickLoginPanel.showModal();
            quickLoginPanel.focus();
        }
        else if( event.value === 'remove' ) {
            new lx.component.Messagebox({
                message: 
                    'The company for \'' + 
                    companiesGrid.getRow(event.rowIndex).name + 
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
                                id: parseInt(companiesGrid.getRow(event.rowIndex).id)
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
                                loadCompanies( true );
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
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        me.hide();
        
        let addCompanyPanel = new app.panel.AddCompany({
            renderTo: app.mainPanel.getContainer(),
            
            onAdd: function() {
                loader.show();
                searchTxt.setValue('');
                loadCompanies( true );
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
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};