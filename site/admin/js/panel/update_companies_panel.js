/* globals app, lx */
'use strict';


// UPDATE COMPANIES PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
// Events:
//
//  onUpdate              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.UpdateCompanies = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let companiesGrid = null;
    
    let buttonContainerEl = null;
    let updateProgressEl = null;
    let closeBtn = null;
    let updateBtnContainerEl = null;
    let updateBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // A recursive function to update company schemas
    function updateSchemas( i, companies, numUpToDate, numUpdated, numFailed ) {
        // Update the specified company
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=updateSchema',
            data: {
                id: companies[i].id
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                let updateStatus = 'Up to date';
                let updateMessage = '\'' + companies[i].name + '\' is up to date. No updates were applied.';
                
                if( response.ok !== true ) {
                    updateStatus = '<span style=\"color:red\">Failed</span>';
                    updateMessage = 'Updating \'' + companies[i].name + '\' failed. ' + response.error;
                    numFailed = numFailed + 1;
                }
                
                // Display the results in the grid
                let isActive = 'Yes';
                if( !companies[i].isActive ) {
                    isActive = 'No';
                }
                    
                let previousVersion = 'n/a';
                let currentVersion = 'n/a';
                let lastUpdated  = 'n/a';
                
                if( updateStatus === 'Up to date' ) {
                    previousVersion = response.updateResult.previousVersion;
                    currentVersion = response.updateResult.currentVersion;
                    lastUpdated = response.updateResult.lastUpdated;
                    
                    if( previousVersion != currentVersion ) {
                        updateMessage = '\'' + companies[i].name + '\' was successfully updated from version ' + previousVersion + ' to ' + currentVersion + '.';
                        updateStatus = '<span style=\"color:green\">Updated</span>';
                        numUpdated = numUpdated + 1;
                    }
                    else {
                        numUpToDate = numUpToDate + 1;
                    }
                }
                
                companiesGrid.addRows([{
                    id: companies[i].id,
                    createdOn: companies[i].createdOn,
                    name: companies[i].name,
                    alias: companies[i].alias,
                    databaseName: companies[i].databaseName,
                    databaseSchema: companies[i].databaseSchema,
                    databaseHost: companies[i].databaseHost,
                    isActive: isActive,
                    previousVersion: previousVersion,
                    currentVersion: currentVersion,
                    lastUpdated: lastUpdated,
                    updateStatus: updateStatus,
                    updateMessage: updateMessage
                }]);
                
                // Display progress
                updateProgressEl.innerHTML = 'Updated ' + (i + 1) + ' of ' + companies.length + '...';
                
                // Was the last company updated?
                if( i == companies.length -1 ) {
                    // Display final progress
                    updateProgressEl.innerHTML = 
                        'Up to date: ' + numUpToDate + '&emsp;|&emsp;' +
                        'Updated: <span style=\"color:green\">' + numUpdated + '</span>&emsp;|&emsp;' +
                        'Failed: <span style=\"color:red\">' + numFailed + '</span>';
                    
                    // Hide the loader and re-anable the buttons
                    updateBtn.hideLoader();
                    updateBtn.enable();
                }
                
                // Prepare to process the next company
                i = i + 1;
                
                // Are there more companies to process?
                if( i < companies.length ) {
                    updateSchemas( i, companies, numUpToDate, numUpdated, numFailed );
                }
                else {
                    return;
                }
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
        if( compConfig.hasOwnProperty('onUpdate') ) me.addEventListener('update', compConfig.onUpdate);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                userSelect: 'none',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Update Company Schemas'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // COMPANIES SECTION
        //
        
        // Create companiesGrid component
        companiesGrid = new lx.component.Grid({
            renderTo: contentEl,
            width: '100%',
            height: '100%',
            
            columns: [
                // {dataIndex: 'createdOn', name: 'Created', padding: '0px 0px 0px 20px', width: '100px'},
                {dataIndex: 'name', name: 'Company Name', padding: '0px 0px 0px 15px'},
                {dataIndex: 'databaseName', name: 'Database Name', width: '150px'},
                {dataIndex: 'databaseSchema', name: 'Database Schema', width: '120px'},
                {dataIndex: 'databaseHost', name: 'Database Host', width: '120px'},
                // {dataIndex: 'isActive', name: 'Active', width: '60px'},
                {dataIndex: 'previousVersion', name: 'Previous Ver.', width: '80px'},
                {dataIndex: 'currentVersion', name: 'Current Ver.', width: '80px'},
                {dataIndex: 'lastUpdated', name: 'Last Updated', width: '120px'},
                {dataIndex: 'updateStatus', name: 'Status', width: '100px', type: 'button'}
            ],
            
            onCellClick: companiesGridCellClickEventHandler
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the updateProgressEl component
        updateProgressEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                // position: 'relative',
                margin: 'auto auto auto 0px'
            },
            innerHTML: ''
        });
        
        // Create the closeBtn component
        closeBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Close',
            style: 'text',
            
            onClick: closeBtnClickEventHandler
        });
        
        // Create the updateBtnContainerEl element
        updateBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the updateBtn component
        updateBtn = new lx.component.Button({
            renderTo: updateBtnContainerEl,
            label: 'Update',
            width: '120px',
            
            onClick: updateBtnClickEventHandler
        });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        me.destroy();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        // Destroy the panel
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Companies grid cell click event handler
    function companiesGridCellClickEventHandler( clickEvent ) {
        // Depending on the column clicked
        if( companiesGrid.getColumnDataIndex(clickEvent.columnIndex) === 'updateStatus' ) {
            new lx.component.Messagebox({
                title: 'Update Status',
                message: companiesGrid.getRow(clickEvent.rowIndex).updateMessage,
            });
        }
    }
    
    // Cancel button click event handler
    function closeBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function updateBtnClickEventHandler() {
        // Clear the grid
        companiesGrid.clear();
        
        // Show loader and prevent user from clicking button twice
        updateBtn.showLoader();
        updateBtn.disable();
        
        // Get a list of companies, and update each if necessary
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=getList',
            data: {
                limitGroups: false
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    // Hide the loader and re-anable the button
                    updateBtn.showWarning(response.error);
                    updateBtn.hideLoader();
                    updateBtn.enable();
                    return;
                }
                
                // Update the schemas for all the companies
                updateSchemas( 0, response.companies, 0, 0, 0 );
                me.fireEvent('update', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};