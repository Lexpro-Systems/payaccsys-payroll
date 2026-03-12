/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST TAX RECONCILIATIONS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ListTaxReconciliations = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    var generateBtn = null;
    
    var filterSectionEl = null;
    var taxYearSelect = null;
    var periodSelect = null;
    var searchTxt = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var reconciliationsGrid = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load tax periods from the database
    function loadTaxYears() {
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getTaxYearList',
            data: {
                searchString: '',
                limit: 20,
                offset: taxYearSelect.getItemCount(),
                sortOrder: 'DESC'
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Periods Failed',
                        message: response.error
                    });
                }
                
                var taxYears = [];
                var defaultTaxYear = { value: null, text: 'All Tax Years' };
                taxYears.push(defaultTaxYear);
                for( var i = 0; i < response.taxYears.length; i++ ) {
                    // if( i === 0 ) {
                    //     defaultTaxYear = {
                    //         value: response.taxYears[i].year,
                    //         text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    //     };
                    // }
                    taxYears.push({
                        value: response.taxYears[i].year,
                        text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    });
                }
                taxYearSelect.addItems( taxYears );
                taxYearSelect.setValue( defaultTaxYear.value, defaultTaxYear.text );
                
                // Load the IRP5 types
                loadReconciliationPeriods( true );
            }
        });
    }
    
    // Function to load IRP5 types from the database
    function loadReconciliationPeriods() {
        lx.sendJSON({
            url: 'exec.php?c=TaxReconciliation&fn=getPeriodList',
            data: {
                searchString: '',
                limit: 20,
                offset: periodSelect.getItemCount(),
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Reconciliation Periods Failed',
                        message: response.error
                    });
                }
                
                var periods = [];
                var defaultPeriod = { value: null, text: 'All Periods' };
                periods.push(defaultPeriod);
                for( var i = 0; i < response.periods.length; i++ ) {
                    periods.push({
                        value: response.periods[i].code,
                        text: response.periods[i].name
                    });
                }
                periodSelect.addItems( periods );
                periodSelect.setValue( defaultPeriod.value, defaultPeriod.text );
                
                // Load the reconciliations
                loadReconciliations( true );
            }
        });
    }
    
    // Function to load IRP5s from the database
    function loadReconciliations( clearGrid ) {
        let offset = 0;
        if( !clearGrid ) offset = reconciliationsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=TaxReconciliation&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                taxYear: ( taxYearSelect.getValue() !== null ? parseInt( taxYearSelect.getValue() ) : null),
                periodCode: periodSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Tax Reconciliation Failed',
                        message: response.error
                    });
                }
                
                // Setup the grid rows
                var reconciliations = [];
                for( var i = 0; i < response.reconciliations.length; i++ ) {
                    reconciliations.push({
                        id: response.reconciliations[i].id,
                        generatedOn: response.reconciliations[i].generatedOn,
                        taxYear: response.reconciliations[i].taxYear,
                        taxYearDescription: ((response.reconciliations[i].taxYear - 1) + ' / ' + response.reconciliations[i].taxYear),
                        periodCode: response.reconciliations[i].periodCode,
                        periodName: response.reconciliations[i].periodName,
                        note: response.reconciliations[i].note,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) reconciliationsGrid.clear();
                
                // Add the rows to the grid
                reconciliationsGrid.addRows( reconciliations );
            }
        });
    }
    
    
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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
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
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 15px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Tax Reconciliations'
        });
        
        // Create the generateBtn component
        generateBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Generate',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px auto',
            
            onClick: generateBtnClickEventHandler
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '10px 20px 10px 20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                // backgroundColor: lx.style.global.backgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the taxYearSelect component
        taxYearSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            height: '32px',
            width: '140px',
            margin: '0px 0px 0px 0px',
            
            onChange: taxYearSelectOnChangeEventHandler
        });
        
        // Create the periodSelect component
        periodSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            height: '32px',
            width: '140px',
            margin: '0px 0px 0px 20px',
            
            onChange: taxYearSelectOnChangeEventHandler
        });
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
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
        loader.show( true );
        
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
        
        // Create reconciliationsGridMenuOptions array
        var reconciliationsGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-fw fa-file-export" style="margin: 0px 15px 0px 0px;"></i>SARS Export', value: 'export'},
            {name: '<i class="fas fa-fw fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email Tax Certificates', value: 'emailTaxCertificates'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create reconciliationsGrid component
        reconciliationsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'generatedOn', name: 'Generated On',  width: '180px', type: 'button', padding: '0px 0px 0px 20px'},
                {dataIndex: 'taxYearDescription', name: 'Tax Year', width: '100px'},
                {dataIndex: 'periodName', name: 'Period', width: '110px'},
                {dataIndex: 'note', name: 'Note', minWidth: '200px', wrapText: true},
                {dataIndex: 'menu', name: '', type: 'menu', options: reconciliationsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: reconciliationsGridCellClickEventHandler,
            onScrollEnd: reconciliationsGridScrollEndEventHandler,
            onMenuItemClick: reconciliationsGridMenuItemClickEventHandler
        });
        
        // Load the tax years and IRP5s
        loadTaxYears();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Add it to the new renderTo element
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
        searchTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // taxYearSelect change event handler
    function taxYearSelectOnChangeEventHandler() {
        loader.show( true );
        loadReconciliations( true );
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show( true );
        loadReconciliations( true );
    }
    
    // On search resetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show( true );
        searchTxt.setValue('');
        loadReconciliations( true );
    }
    
    // reconciliationsGrid scroll end event handler
    function reconciliationsGridScrollEndEventHandler() {
        loadReconciliations( false );
    }
    
    // rreconciliationsGrid cell click event handler 
    function reconciliationsGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'generatedOn' ) {
            me.hide();
            
            var viewTaxReconciliationPanel = new app.panel.ViewTaxReconciliation({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                reconciliationId: reconciliationsGrid.getRow(event.rowIndex).id,
                generatedOn: reconciliationsGrid.getRow(event.rowIndex).generatedOn
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewTaxReconciliationPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
            
        }
        else if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'employeeName' ) {
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: reconciliationsGrid.getRow(event.rowIndex).employeeId,
                employeeName: reconciliationsGrid.getRow(event.rowIndex).employeeName
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    // reconciliationsGrid menu item click event handler 
    function reconciliationsGridMenuItemClickEventHandler( event ) {
        // Depending on the menu item clicked
        if(event.value === 'view'){
            me.hide();
            
            var viewTaxReconciliationPanel = new app.panel.ViewTaxReconciliation({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                reconciliationId: parseInt(reconciliationsGrid.getRow(event.rowIndex).id),
                generatedOn: reconciliationsGrid.getRow(event.rowIndex).generatedOn
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewTaxReconciliationPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if (event.value === 'export') {
            // Create a modal window
            var exportReconciliationModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '429px'
            });
            
            // Create the exportReconciliationPanel panel
            var exportReconciliationPanel = new app.panel.ExportReconciliation({
                renderTo: exportReconciliationModal.getContainer(),
                show: true,
                
                reconciliationId: parseInt(reconciliationsGrid.getRow(event.rowIndex).id),
                
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
        else if (event.value === 'emailTaxCertificates') {
            // Create a modal window
            var mailToModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '1024px',
                maxHeight: '1024px'
            });
            
            // Create the mailToPanel panel
            var mailToPanel = new app.panel.EmailTaxCertificates({
                renderTo: mailToModal.getContainer(),
                show: true,
                reconciliationId: parseInt(reconciliationsGrid.getRow(event.rowIndex).id),
                emailAddress: reconciliationsGrid.getRow(event.rowIndex).employeeEmailAddress,
                
                onSend: function() {
                    app.route.popState();
                    new lx.component.Messagebox({
                        title: 'Email Tax Certificates',
                        message: 'The emails were sent successfully.'
                    });
                },
                    onCancel: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            mailToModal.addEventListener('destroy', function() {
                mailToPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: mailToModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            mailToModal.show();
            mailToPanel.focus();
        }
        else if (event.value === 'remove') {
            new lx.component.Messagebox({
                title: 'Remove Tax Reconciliation',
                message: 
                    'Are you certain you wish to permanently remove the tax reconciliation generated on &quot;' + reconciliationsGrid.getRow(event.rowIndex).generatedOn + '?&quot;',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'remove', label: 'Remove', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the payrun be removed?
                    if( closeEvent.button === 'remove' ) {
                        // Delete the tax reconciliation
                        lx.sendJSON({
                            url: 'exec.php?c=TaxReconciliation&fn=remove',
                            data: {
                                id: parseInt(reconciliationsGrid.getRow(event.rowIndex).id)
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Removing Tax Reconciliation Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                loadReconciliations( true );
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
    
    // generateBtn click event handler
    function generateBtnClickEventHandler() {
        // Create a modal window
        var generateTaxReconciliationModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '1024px',
            maxHeight: '100%'
        });
        
        // Create the generateTaxReconciliationPanel panel
        var generateTaxReconciliationPanel = new app.panel.GenerateTaxReconciliation({
            renderTo: generateTaxReconciliationModal.getContainer(),
            show: true,
            
            onGenerate: function() {
                app.route.popState();
                loadReconciliations( true );
            },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        generateTaxReconciliationModal.addEventListener('destroy', function() {
            generateTaxReconciliationPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: generateTaxReconciliationModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        generateTaxReconciliationModal.show();
        generateTaxReconciliationPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};