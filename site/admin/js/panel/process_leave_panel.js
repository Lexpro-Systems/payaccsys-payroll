/* globals app, lx */
'use strict';


// PROCESS LEAVE PANEL
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
app.panel.ProcessLeave = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let confirmDestroy = null;
    
    let el = null;
    
    let contentEl = null;
    let loader = null;
    
    let filtersSectionEl = null;
    let startDate = null;
    let endDate = null;
    
    let companiesGrid = null;
    
    let buttonContainerEl = null;
    let updateProgressEl = null;
    let closeBtn = null;
    let processBtnContainerEl = null;
    let processBtn = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // A recursive function to process the leave of a number of companies sequentially
    function processLeave( i, companies, numUpToDate, numUpdated, numFailed ) {
        // Process leave for the specified company
        lx.sendJSON({
            url: 'exec.php?c=Company&fn=processLeave',
            data: {
                id: companies[i].id,
                startDate: startDate.getValue(),
                endDate: endDate.getValue()
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                let updateStatus = 'Up to date';
                let updateMessage = 'Leave for \'' + companies[i].name + '\' is up to date. No leave was updated.';
                let numDays = 0;
                
                // Was calculating leave NOT successful?
                if( response.ok !== true ) {
                    // Update the status
                    updateStatus = '<span style=\"color:red\">Failed</span>';
                    updateMessage = 'Calculating leave for \'' + companies[i].name + '\' failed. ' + response.error;
                    numFailed = numFailed + 1;
                }
                else {
                    // Save the number of days for which leave was processed
                    numDays = response.numDaysProcessed;
                    
                    // Was leave processed?
                    if( numDays > 0 ) {
                        updateMessage = 'Leave was processed successfully for \'' + companies[i].name + '\' for ' + numDays + ' day(s).';
                        updateStatus = '<span style=\"color:green\">Updated</span>';
                        numUpdated = numUpdated + 1;
                    }
                    else {
                        numUpToDate = numUpToDate + 1;
                    }
                }
                
                // Display the result in the companies grid
                companiesGrid.addRows([{
                    id: companies[i].id,
                    createdOn: companies[i].createdOn,
                    name: companies[i].name,
                    alias: companies[i].alias,
                    databaseName: companies[i].databaseName,
                    databaseSchema: companies[i].databaseSchema,
                    databaseHost: companies[i].databaseHost,
                    daysProcessed: numDays,
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
                    processBtn.hideLoader();
                    processBtn.enable();
                }
                
                // Prepare to process the next company
                i = i + 1;
                
                // Are there more companies to process?
                if( i < companies.length ) {
                    processLeave( i, companies, numUpToDate, numUpdated, numFailed );
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
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( let property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onProcess') ) me.addEventListener('process', compConfig.onUpdate);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Process Leave'
        });
        
        
        //
        // FILTERS SECTION
        //
        
        // Create the filtersSectionEl element
        filtersSectionEl = lx.createElement('DIV', {
            parent: el,
            style: {
                backgroundColor: '#FFFFFF',
                padding: '15px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'left'
            }
        });
        
        // Create the startDate component
        startDate = new lx.component.DatePicker({
            renderTo: filtersSectionEl,
            label: 'Start Date',
            width: '300px',
            margin: '0px 20px 0px 0px'
        });
        
        
        // Create the endDate component
        endDate = new lx.component.DatePicker({
            renderTo: filtersSectionEl,
            label: 'End Date',
            width: '300px',
            margin: '0px 0px 0px 0px'
        });
        
        
        //
        // CONTENT SECTION
        //
        
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
        
        // Create companiesGrid component
        companiesGrid = new lx.component.Grid({
            renderTo: contentEl,
            width: '100%',
            height: '100%',
           //  margin: '20px 0px 0px 0px',
            
            columns: [
                {dataIndex: 'name', name: 'Company Name', padding: '0px 0px 0px 15px'},
                {dataIndex: 'databaseName', name: 'Database Name', width: '150px'},
                {dataIndex: 'databaseSchema', name: 'Database Schema', width: '120px'},
                {dataIndex: 'databaseHost', name: 'Database Host', width: '120px'},
                {dataIndex: 'daysProcessed', name: '# Days', width: '80px', alignment: 'right'},
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
        
        // Create the processBtnContainerEl element
        processBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the processBtn component
        processBtn = new lx.component.Button({
            renderTo: processBtnContainerEl,
            label: 'Process',
            width: '120px',
            
            onClick: processBtnClickEventHandler
        });
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Update it to the new renderTo element
        renderTo.appendChild( el );
    };
    
    // Function to show the panel
    me.show = function() {
        lx.applyStyle(el, {display: 'flex'});
    };
    
    // Function to hide the panel
    me.hide = function() {
        lx.applyStyle(el, {display: 'none'});
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
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
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
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
                title: 'Leave Status',
                message: companiesGrid.getRow(clickEvent.rowIndex).updateMessage,
            });
        }
    }
    
    // Cancel button click event handler
    function closeBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function processBtnClickEventHandler() {
        // Were no valid dates specified?
        if( startDate.getValue() === '' || startDate.getValue() === null) {
            processBtn.showWarning('The start date can not be empty.');
            return;
        }
        if( endDate.getValue() === '' || endDate.getValue() === null) {
            processBtn.showWarning('The end date can not be empty.');
            return;
        }
        
        // Clear the grid
        companiesGrid.clear();
        
        // Show loader and prevent user from clicking button twice
        processBtn.showLoader();
        processBtn.disable();
        
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
                    processBtn.showWarning(response.error);
                    return;
                }
                
                // Process leave for all the companies
                processLeave( 0, response.companies, 0, 0, 0 );
                me.fireEvent('process', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};