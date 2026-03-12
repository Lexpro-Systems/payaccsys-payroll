/* globals app, lx */
'use strict';

// ADD GROUP PANEL
//
// Extends:
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddGroup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let titleContainerEl = null;
    let titleBackEl = null;
    let titleTextEl = null;
    let cancelBtn = null;
    let addBtn = null;
    
    let loaderContainerEl = null;
    let contentContainerEl = null;
    let loader = null;
    
    let groupDetailsHeading = null;
    let groupDetailsSectionEl = null;
    let groupNameTxt = null;
    
    let userDetailsHeadingEl = null;
    let userDetailsSectionEl = null;
    let userAddSelect = null;
    let usersGrid = null;
    
    let companyDetailsHeadingEl = null;
    let companyDetailsSectionEl = null;
    let companyAddSelect = null;
    let companiesGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load users
    //
    // clearList            If true the list will be cleared before loading new items.
    function loadUsers(clearList) {
        let offset = 0;
        if (clearList !== true) offset = userAddSelect.getItemCount();
       
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getList',
            data: {
                searchString: userAddSelect.getSearchString(),
                limit: 50,
                offset: offset,
                isAdmin: true,
                limitGroups: false
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Users Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                let users = [];
                for (let i = 0; i < response.users.length; i++) {
                    users.push({
                        text: response.users[i].name,
                        value: response.users[i].id
                    });
                }
                
                if (clearList === true) userAddSelect.clear();
                userAddSelect.addItems(users);
            }
        });
    }
    
    // Function to load companies
    //
    // clearList            If true the list will be cleared before loading new items.
    function loadCompanies(clearList) {
        let offset = 0;
        if (clearList !== true) offset = companyAddSelect.getItemCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getList',
            data: {
                searchString: companyAddSelect.getSearchString(),
                limit: 50,
                offset: offset,
                limitGroups: true
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Companies Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                let companies = [];
                for (let i = 0; i < response.companies.length; i++) {
                    companies.push({
                        text: response.companies[i].name,
                        value: response.companies[i].id
                    });
                }
                
                if (clearList === true) companyAddSelect.clear();
                companyAddSelect.addItems(companies);
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        let compConfig = {
            onAdd: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
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
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto'
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
            innerHTML: 'Add Group'
        });
        
        // Create cancel button
        cancelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            height: '32px',
            label: 'Cancel',
            margin: '0px 0px 0px auto',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create add button
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            width: '100px',
            height: '32px',
            label: 'Add',
            margin: '0px 20px 0px 20px',
            
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
        
        
        //
        // GROUP DETAILS SECTION
        //
        
        // Create the groupDetailsHeading element
        groupDetailsHeading = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Group Details</div>'
        });
        
        // Create the groupDetailsSectionEl
        groupDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the groupNameTxt component
        groupNameTxt = new lx.component.Textbox({
            renderTo: groupDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name *',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            
            onChange: defaultComponentChangeEventHandler
        });
        
        
        //
        // USERS SECTION
        //
        
        // Create the userDetailsHeadingEl element
        userDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Users</div>'
        });
        
        // Create userDetailsSectionEl element
        userDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        // Create userAddSelect component
        userAddSelect = new lx.component.Selectbox({
            renderTo: userDetailsSectionEl,
            margin: '15px 15px 15px 15px',
            label: 'Select user to add',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            search: true,
                        
            onSearch: userAddSelectSearchEventHandler,
            onListScrollEnd: userAddSelectListScrollEndEventHandler,
            onChange: userAddSelectChangeEventHandler
        });
        
        // Create usersGrid component
        usersGrid = new lx.component.Grid({
            renderTo: userDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'name', name: 'Name', padding: '0px 0px 0px 15px'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'remove', name: '', width: '80px', type: 'button'}
            ],
            
            onCellClick: usersGridCellClickEventHandler
        });
        
        
        //
        // COMPANIES SECTION
        //
        
        // Create the companyDetailsHeadingEl element
        companyDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '30px 15px 15px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Companies</div>'
        });
        
        // Create companyDetailsSectionEl element
        companyDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
            }
        });
        
        // Create companyAddSelect component
        companyAddSelect = new lx.component.Selectbox({
            renderTo: companyDetailsSectionEl,
            margin: '15px 15px 15px 15px',
            label: 'Select company to add',
            labelAlign: 'left',
            labelWidth: '220px',
            maxWidth: '500px',
            search: true,
                        
            onSearch: companyAddSelectSearchEventHandler,
            onListScrollEnd: companyAddSelectListScrollEndEventHandler,
            onChange: companyAddSelectChangeEventHandler
        });
        
        // Create companiesGrid component
        companiesGrid = new lx.component.Grid({
            renderTo: companyDetailsSectionEl,
            autoSize: true,
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'name', name: 'Name', padding: '0px 0px 0px 15px'},
                {dataIndex: 'alias', name: 'Alias'},
                {dataIndex: 'schema', name: 'Schema', width: '120px'},
                {dataIndex: 'status', name: 'Status', width: '80px'},
                {dataIndex: 'remove', name: '', width: '80px', type: 'button'}
            ],
            
            onCellClick: companiesGridCellClickEventHandler
        });
        
        // Load form data
        loadUsers(true);
        loadCompanies(true);
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        groupNameTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyEvent = me.fireEvent('destroy', null);
        if( destroyEvent === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Default component change event handler
    function defaultComponentChangeEventHandler() {
        confirmDestroy = true;
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // userAddSelect search event handler
    function userAddSelectSearchEventHandler() {
        loadUsers(true);
    }
    
    // userAddSelect scroll end event handler
    function userAddSelectListScrollEndEventHandler() {
        loadUsers(false);
    }
    
    // userAddSelect change event handler
    function userAddSelectChangeEventHandler() {
        let userId = userAddSelect.getValue();
        
        // Check if the selected user has already been added
        for (let i = 0; i < usersGrid.getRowCount(); i++) {
            let rowDetails = usersGrid.getRow(i);
            if( rowDetails.id === userId ) {
                new lx.component.Messagebox({
                    title: 'User Already Added',
                    message: '\'' + rowDetails.name + '\' has already been added as a user.'
                });
                
                userAddSelect.setValue(null, '');
                return false;
            }
        }
        
        // Load the user's details
        lx.sendJSON({
            url: 'exec.php?c=User&fn=getUserById',
            data: {
                userId: userId,
                companyId: null
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading User Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                // Set the user status
                let status = 'Active';
                if( response.user.isActive == false ) status = 'Inactive';
                
                // Insert the user into the grid
                usersGrid.addRows([
                    {
                        id: response.user.id,
                        name: response.user.name,
                        email: response.user.email,
                        cellphone: response.user.cellNumber,
                        status: status,
                        remove: 'Remove'
                    }
                ]);
                
                // Clear the select
                userAddSelect.setValue(null, '');
                confirmDestroy = true;
            }
        });
    }
    
    // usersGrid cell click event handler
    function usersGridCellClickEventHandler(event) {
        // Depending on the column clicked
        if( usersGrid.getColumnDataIndex(event.columnIndex) === 'remove' ) {
            let userId = event.srcComponent.getRow(event.rowIndex).id;
        
            // Find and remove the selected user
            for (let i = 0; i < usersGrid.getRowCount(); i++) {
                let rowDetails = usersGrid.getRow(i);
                if( rowDetails.id === userId ) {
                    usersGrid.removeRow(i);
                    confirmDestroy = true;
                    break;
                }
            }
        }
    }
    
    // companyAddSelect search event handler
    function companyAddSelectSearchEventHandler() {
        loadCompanies(true);
    }
    
    // companyAddSelect scroll end event handler
    function companyAddSelectListScrollEndEventHandler() {
        loadCompanies(false);
    }
    
    // companyAddSelect change event handler
    function companyAddSelectChangeEventHandler() {
        let companyId = companyAddSelect.getValue();
        
        // Check if the selected company has already been added
        for (let i = 0; i < companiesGrid.getRowCount(); i++) {
            let rowDetails = companiesGrid.getRow(i);
            if( rowDetails.id === companyId ) {
                new lx.component.Messagebox({
                    title: 'Company Already Added',
                    message: '\'' + rowDetails.name + '\' has already been added as a company.'
                });
                
                companyAddSelect.setValue(null, '');
                return false;
            }
        }
        
        // Load the company's details
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=get',
            data: {
                id: companyId
            },
            onSuccess: function (responseText) {
                let response = JSON.parse(responseText);
                
                // Check that the response is ok
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Company Failed',
                        message: response.error
                    });
                    
                    return false;
                }
                
                // Set the company status
                let status = 'Active';
                if( response.company.isActive == false ) status = 'Inactive';
                
                // Insert the company into the grid
                companiesGrid.addRows([
                    {
                        id: response.company.id,
                        name: response.company.name,
                        alias: response.company.alias,
                        schema: response.company.databaseSchema,
                        status: status,
                        remove: 'Remove'
                    }
                ]);
                
                // Clear the select
                companyAddSelect.setValue(null, '');
                confirmDestroy = true;
            }
        });
    }
    
    // companiesGrid cell click event handler
    function companiesGridCellClickEventHandler(event) {
        // Depending on the column clicked
        if( companiesGrid.getColumnDataIndex(event.columnIndex) === 'remove' ) {
            let companyId = event.srcComponent.getRow(event.rowIndex).id;
        
            // Find and remove the selected company
            for (let i = 0; i < companiesGrid.getRowCount(); i++) {
                let rowDetails = companiesGrid.getRow(i);
                if( rowDetails.id === companyId ) {
                    companiesGrid.removeRow(i);
                    confirmDestroy = true;
                    break;
                }
            }
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        app.route.popState();
    }
    
    // Add button click event handler
    function addBtnClickEventHandler() {
        if( groupNameTxt.getValue() === '' ) {
            addBtn.showWarning('Please enter the group name');
            return;
        }
        
        let users = [];
        for( let i = 0; i < usersGrid.getRowCount(); i++ ) {
            let rowDetails = usersGrid.getRow(i);
            users.push({ id: rowDetails.id });
        }
        
        let companies = [];
        for( let i = 0; i < companiesGrid.getRowCount(); i++ ) {
            let rowDetails =companiesGrid.getRow(i);
            companies.push({ id: rowDetails.id });
        }
        
        addBtn.showLoader();
        addBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Group&fn=add',
            data: {
                name: groupNameTxt.getValue().trim(),
                users: users,
                companies: companies
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                addBtn.hideLoader();
                addBtn.enable();
                
                let response = '';
                try {
                    response = JSON.parse(responseText);
                }
                catch( error ) {
                    new lx.component.Messagebox({
                        title: 'Adding Group Failed',
                        message: 'Failed to read server response.'
                    });
                    return;
                }
                
                if( response.ok !== true ) {
                    addBtn.showWarning(response.error);
                    return;
                }
                
                confirmDestroy = false;
                me.fireEvent('add', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};