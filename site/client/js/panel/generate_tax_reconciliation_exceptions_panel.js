/* globals app, lx */
'use strict';

// GENERATE TAX RECONCILIATON EXCEPTIONS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//
// Events:
//
//  onFinish            This event is fired after the profile data was successfully saved
//  onDestroy           This event is fired just before the component is destroyed
//
app.panel.GenerateTaxReconciliationExceptions = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var exceptionReportHeadingEl = null;
    var exportBtn = null;
    
    var exceptionsMessageEl = null;
    var exceptionDetailsSectionEl = null;
    var exceptionsGrid = null;
    
    var hasCriticalExceptions = null;
    var exceptions = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onGenerate') ) me.addEventListener('generate', compConfig.onEmail);
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
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                backgroundColor: '#F4F5F6',
                padding: '0px 15px 15px 15px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // EXCEPTIONS SECTION
        //
        
        // Create a container for the component as well as the info icon
        let exceptionReportHeadingContainerEl = new lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 0px 0px 0px',
                width: '100%'
            }
        });
        
        // Create the personalDetailsHeadingEl element
        exceptionReportHeadingEl = lx.createElement('DIV', {
            parent: exceptionReportHeadingContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                // width: '100%',
                height: '50px',
                padding: '15px 0px 0px 0px',
                fontSize: '16px'
            },
            innerHTML: 'Exception Report'
        });
        
        // Create the element used to position the tooltip
        let exceptionReportTooltipLocusEl = lx.createElement('DIV', {
            parent: exceptionReportHeadingContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 5px 10px',
                width: '0px',
                height: '1px'
            }
        });
        
        // Create an info icon
        let exceptionReportInfoEl = new lx.createElement('DIV', {
            parent: exceptionReportHeadingContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto auto 7px 0px',
                fontSize: '12px',
                color:  lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });
        
        // Create the tooltip component
        let exceptionReportTooltip = new lx.component.Tooltip({
            renderTo: exceptionReportTooltipLocusEl,
            alignment: 'bottomLeft',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: 'auto auto 5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message: 
                '<span style="font-size: 12px;">' +  
                    'Please note that, if exceptions were found, you will not be able to continue until all exceptions are checked or resolved.<br><br>' +
                    'Exceptions marked <i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i> are critical exceptions and the process cannot be completed until they are resolved.<br><br>' +
                    'Exceptions marked <i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i> are warnings and you may continue as long as they are checked to indicate that you have taken note of them. The exceptions can be checked either by clicking on the check-mark to the left of the warning icon or clicking on the highlighted check icon at the top of the list to check/uncheck all exceptions in the list.<br><br>' +
                    'Finally, if there are many critical exceptions, the exceptions may be exported to file by clicking on the &quot;Export&quot; button to the right allowing them to be resolved before returning to the function.' +
                '</span>'
        });
        exceptionReportInfoEl.addEventListener('mouseenter', function() { exceptionReportTooltip.show(); });
        exceptionReportInfoEl.addEventListener('mouseleave', function() { exceptionReportTooltip.hide(); });
        
        // Create personalDetailsEditBtn component
        exportBtn = new lx.component.Button({
            renderTo: exceptionReportHeadingContainerEl,
            margin: 'auto 0px 0px 0px',
            label: 'Export',
            style: 'text',
            
            onClick: exportBtnClickEventhandler
        });
        exportBtn.hide();
        
        // Create exceptions message element
        exceptionsMessageEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF',
                margin: '0px 0px 15px 0px',
                padding: '15px',
                display: 'none'
            }
        });
        exceptionsMessageEl.innerHTML = '<div style="font-size: 14px;">No exceptions found.</div>';
        
        // Create exceptions section
        exceptionDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#FFFFFF'
            }
        });
        
        // Create exceptionsGrid component
        exceptionsGrid = new lx.component.Grid({
            renderTo: exceptionDetailsSectionEl,
            // autoSize: true,
            flex: '1 1 100%',
            width: '100%',
            // borderWidth: '0px',
            
            columns: [
                {dataIndex: 'select', width: '50px', type: 'rowSelect'},
                {dataIndex: 'statusIcon', name: '', width: '40px'},
                {dataIndex: 'source', name: 'Source', width: '150px'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'showMore', name: '', width: '120px', type: 'button'},
            ],
            
            onCellClick: exceptionsGridCellClickEventHandler,
            onRowSelect: exceptionsGridRowSelectEventHandler,
            onRowDeselect: exceptionsGridRowSelectEventHandler,
            onSelectAllRows: exceptionsGridRowSelectEventHandler,
            onDeselectAllRows: exceptionsGridRowSelectEventHandler
        });
        
        // // Create the exportExcelBtn component
        // let exportExcelBtn = new lx.component.Button({
        //     renderTo: exceptionDetailsSectionEl,
        //     label: 'Excel Export',
        //     width: '130px',
        //     margin: '0px 0px 0px auto',
            
        //     // onClick: exportExcelBtnOnClickEventHandler
        // });
        
        // // Create the exportCsvBtn component
        // let exportCsvBtn = new lx.component.Button({
        //     renderTo: exceptionDetailsSectionEl,
        //     label: 'CSV Export',
        //     width: '130px',
        //     margin: '0px 20px 0px 20px',
            
        //     // onClick: exportCsvBtnOnClickEventHandler
        // });
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
        renderTo.appendChild( el );
    };
    
    // Function to show the panel
    me.show = function() {
        lx.applyStyle(el, {display: 'flex'});
    };
    
    // Function to hide the panel
    me.hide = function() {
        loader.show();
        lx.applyStyle(el, {display: 'none'});
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        // ...
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
    
    // Function to validate data
    me.generateExceptions = function( taxYear, periodCode ) {
        hasCriticalExceptions = false;
        
        loader.show();
        lx.sendJSON({
            url: 'exec.php?c=TaxReconciliation&fn=getExceptions',
            data: {
                taxYear: parseInt(taxYear),
                periodCode: periodCode
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Generateing Exceptions Failed',
                        message: response.error
                    });
                    return;
                }
                
                // Are there no exceptions?
                if( response.exceptions.length < 1 ) {
                    // Clear the exceptions grid
                    exceptions = [];
                    exportBtn.hide();
                    exceptionsGrid.clear();
                    
                    // Display a message to the user
                    exceptionsMessageEl.style.display = 'block';
                    exceptionDetailsSectionEl.style.display = 'none';
                }
                else {
                    // Display the exceptions
                    exportBtn.show();
                    exceptionsMessageEl.style.display = 'none';
                    exceptionDetailsSectionEl.style.display = 'flex';
                    
                    exceptions = [];
                    for( var i = 0; i < response.exceptions.length; i++ ) {
                        var statusIcon = '<i class="fa fa-exclamation-circle" style="color:' + lx.style.global.highlightColor + ';"></i>';
                        if( response.exceptions[i].isCritical ) {
                            statusIcon = '<i class="fa fa-exclamation-triangle" style="color:#E74C3C;"></i>';
                            hasCriticalExceptions = true;
                        }
                        
                        exceptions.push({
                            statusIcon: statusIcon,
                            isCritical: response.exceptions[i].isCritical,
                            source: response.exceptions[i].source,
                            description: response.exceptions[i].description,
                            fullDescription: response.exceptions[i].fullDescription,
                            showMore: 'Show details...'
                        });
                        
                        // Clear the grid and add the exceptions
                        exceptionsGrid.clear();
                        exceptionsGrid.addRows( exceptions );
                    }
                }
            }
        });
    };
    
    // Function to validate data
    me.validateData = function() {
        let result = {
            status: true,
            error: ''
        };
        
        // Are there critical exceptions?
        if( hasCriticalExceptions ) {
            result = {
                status: false,
                error: 'Critical exceptions found. Please resolve all critical exceptions before generating the reconciliation.'
            };
            return result;
        }
        
        // Are there critical exceptions?
        if( exceptionsGrid.getSelectedRowCount() !== exceptionsGrid.getRowCount() ) {
            result = {
                status: false,
                error: 'Exceptions have been found. Please check all exceptions before generating the reconciliation.'
            };
            return result;
        }
        
        return result;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // exportBtn click event handler
    function exportBtnClickEventhandler() {
        // Create a modal window
        var exportReconciliationModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '234px'
        });
        
        // Create the exportReconciliationPanel panel
        var exportReconciliationPanel = new app.panel.ExportReconciliationExceptions({
            renderTo: exportReconciliationModal.getContainer(),
            show: true,
            
            exceptions: exceptions,
            
            onExport: function() {
                app.route.popState();
            },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        exportReconciliationModal.addEventListener('destroy', function() {
            exportReconciliationPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: exportReconciliationModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        exportReconciliationModal.show();
        exportReconciliationPanel.focus();
    }
    
    // exceptionsGrid cell click event handler
    function exceptionsGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'showMore' ) {
            new lx.component.Messagebox({
                title: 'Exception Details',
                message: exceptionsGrid.getRow(event.rowIndex).fullDescription
            });
        }
    }
    
    // exceptionsGrid row select event handler
    function exceptionsGridRowSelectEventHandler() {
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};