/* globals app, lx */
'use strict';

// ACTIVE COMPANIES REPORT PANEL
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
app.panel.ActiveCompaniesReport = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var filterSectionEl = null;
    var searchTxt = null;
    var enabledSelect = null;
    var activeSelect = null;
    var trialSelect = null;
    var companiesGrid = null;
    
    var companySortBar = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadCompanies(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = companiesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Report&fn=getActiveCompanyList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: companySortBar.getSortItems(),
                isEnabled: enabledSelect.getValue(),
                isActive: activeSelect.getValue(),
                isTrial: trialSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Companies Failed',
                        message: response.error
                    });
                }
                
                var companies = [];
                for( var i = 0; i < response.companies.length; i++ ) {
                    companies.push({
                        companyId: response.companies[i].companyId,
                        companyName: response.companies[i].companyName,
                        companyAlias: response.companies[i].companyAlias,
                        contactPerson: response.companies[i].contactPerson,
                        contactNumber: response.companies[i].contactNumber,
                        contactEmail: response.companies[i].contactEmail,
                        consultantName: response.companies[i].consultantName,
                        trialExpiresOn: (response.companies[i].trialExpiresOn !== null ? response.companies[i].trialExpiresOn : '-'),
                        isEnabled: response.companies[i].isEnabled,
                        totalPayruns: response.companies[i].totalPayruns,
                        lastPayrun: (response.companies[i].lastPayrun !== null ? response.companies[i].lastPayrun : '-'),
                        createdOn: response.companies[i].createdOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) companiesGrid.clear();
                
                companiesGrid.addRows( companies );
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
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'pointer'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Active Companies Report'
        });
        
        // Create the exportExcelBtn component
        exportExcelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Excel Export',
            width: '130px',
            margin: '0px 0px 0px auto',
            
            onClick: exportExcelBtnOnClickEventHandler
        });
        
        // Create the exportCsvBtn component
        exportCsvBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'CSV Export',
            width: '130px',
            margin: '0px 20px 0px 20px',
            
            onClick: exportCsvBtnOnClickEventHandler
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
                borderWidth: '0px 0px 1px 0px'
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
        var status = [];
        status.push({value: null,   text: 'Any Status'});
        status.push({value: true,   text: 'Active'});
        status.push({value: false,  text: 'Inactive'});
        enabledSelect.addItems( status );
        enabledSelect.setValue( null, 'Any Status' );
        
        // Create activeSelect component
        activeSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Activity Status',
            maxWidth: '200px',
            margin: '0px 20px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        status = [];
        status.push({value: null,   text: 'Any Status'});
        status.push({value: true,   text: 'At Least One Payrun'});
        status.push({value: false,  text: 'No Activity'});
        activeSelect.addItems( status );
        activeSelect.setValue( null, 'Any Status' );
        
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
                { name: 'Company Alias', dataIndex: 'companyAlias'},
                { name: 'Contact Person', dataIndex: 'contactPerson'},
                { name: 'Contact Number', dataIndex: 'contactNumber'},
                { name: 'Contact Email', dataIndex: 'contactEmail'},
                { name: 'Consultant Name', dataIndex: 'consultantName'},
                { name: 'Active', dataIndex: 'isEnabled'},
                { name: 'Total Payruns', dataIndex: 'totalPayruns'},
                { name: 'Last Payrun', dataIndex: 'lastPayrun'},
                { name: 'Trial End Date', dataIndex: 'trialExpiresOn'},
                { name: 'Created On', dataIndex: 'createdOn'}
            ],
            
            onAddButtonClick: onCompanySortBarAddButtonClick,
            onSortItemClick: onCompanySortBarSortItemClick,
            onRemoveSortItem: onCompanySortBarRemoveSortItem,
            onDraggedSortItem: onCompanySortBarDraggedSortItem
        });
        
        // Add default sort items
        companySortBar.addSortItem(companySortBar.getSortItemCount(), 'Company Alias', 'companyAlias', 'ASC');
        companySortBar.addSortItem(companySortBar.getSortItemCount(), 'Created On', 'createdOn', 'DESC');
        
        
        //
        // RESULT GRID
        //
        
        companiesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            flex: '1 1 100%',
            columns: [
                // {dataIndex: 'companyName', name: 'Company Name', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'companyAlias', name: 'Company Alias', minWidth: '120px', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'contactPerson', name: 'Contact Person'},
                {dataIndex: 'contactNumber', name: 'Contact Number', maxWidth: '120px'},
                {dataIndex: 'contactEmail', name: 'Contact Email'},
                {dataIndex: 'consultantName', name: 'Consultant Name'},
                {dataIndex: 'isEnabled', name: 'Active', width: '60px'},
                {dataIndex: 'trialExpiresOn', name: 'Trial End Date', width: '100px'},
                {dataIndex: 'createdOn', name: 'Created On', width: '100px'},
                {dataIndex: 'totalPayruns', name: 'Total Payruns', width: '100px', alignment: 'right'},
                {dataIndex: 'lastPayrun', name: 'Last Payrun', width: '100px'}
            ],
            
            onScrollEnd: companiesGridScrollEndEventHandler,
            onCellClick: companiesGridCellClickEventHandler
        });
        
        loadCompanies(true);
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
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
        loadCompanies( true );
        return;
    }
    
    // sortBarRemoveSortItem click event handler
    function onCompanySortBarRemoveSortItem() {
        // Reload the form data
        loadCompanies( true );
    }
    
    // onCompanySortBarDraggedSortItem click event handler
    function onCompanySortBarDraggedSortItem() {
        // Reload the form data
        loadCompanies( true );
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show();
        loadCompanies(true);
    }
    
    // On search reset btn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loadCompanies(true);
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler (){
        loadCompanies(true);
    }
    
    // Export the report in xls format
    function exportExcelBtnOnClickEventHandler () {
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runActiveCompanyReport',
            target: '_self',
            data: {
                format: 'xls',
                sortOrder: 'ASC',
                sortList: companySortBar.getSortItems(),
                searchString: searchTxt.getValue().trim(),
                isEnabled: enabledSelect.getValue(),
                isActive: activeSelect.getValue(),
                isTrial: trialSelect.getValue()
            }
        });
    }
    
    // Export the report in csv format
    function exportCsvBtnOnClickEventHandler () {
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runActiveCompanyReport',
            target: '_self',
            data: {
                format: 'csv',
                sortOrder: 'ASC',
                sortList: companySortBar.getSortItems(),
                searchString: searchTxt.getValue().trim(),
                isActive: activeSelect.getValue(),
                isEnabled: enabledSelect.getValue(),
                isTrial: trialSelect.getValue()
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    function companiesGridScrollEndEventHandler() {
        loadCompanies(false);
    }
    
    function companiesGridCellClickEventHandler( event ) {
        if( companiesGrid.getColumnDataIndex( event.columnIndex ) === 'companyAlias' ) {
            me.hide();
            
            let viewCompanyPanel = new app.panel.ViewCompany({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                companyId: companiesGrid.getRow(event.rowIndex).companyId,
                companyName: companiesGrid.getRow(event.rowIndex).companyName
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewCompanyPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};