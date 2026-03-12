/* globals app, lx */
'use strict';

// GENERATE TAX RECONCILIATON OPTIONS PANEL
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
app.panel.GenerateTaxReconciliationOptions = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var taxYearSelect = null;
    var periodSelect = null;
    var noteTxt = null;
    
    
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
                var defaultTaxYear = null;
                for( var i = 0; i < response.taxYears.length; i++ ) {
                    if( i === 0 ) {
                        defaultTaxYear = {
                            value: response.taxYears[i].year,
                            text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                        };
                    }
                    taxYears.push({
                        value: response.taxYears[i].year,
                        text: (response.taxYears[i].year - 1) + ' / ' + response.taxYears[i].year
                    });
                }
                taxYearSelect.addItems( taxYears );
                taxYearSelect.setValue( defaultTaxYear.value, defaultTaxYear.text );
                
                // Load the reconciliation periods
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
                var defaultPeriod = null;
                for( var i = 0; i < response.periods.length; i++ ) {
                    if( i === 0 ) {
                        defaultPeriod = {
                            value: response.periods[i].code,
                            text: response.periods[i].name
                        };
                    }
                    periods.push({
                        value: response.periods[i].code,
                        text: response.periods[i].name
                    });
                }
                periodSelect.addItems( periods );
                periodSelect.setValue( defaultPeriod.value, defaultPeriod.text );
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
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onExport') ) me.addEventListener('export', compConfig.onEmail);
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
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // RECONCILIATION OPTIONS SECTION
        //
        
        lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '50px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Reconciliation Options</div>'
        });
        
        // Create the export options section
        let reconciliationOptionsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        
        // Create the taxYearSelect component
        taxYearSelect = new lx.component.Selectbox({
            renderTo: reconciliationOptionsSectionEl,
            label: 'Tax Year:',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the periodSelect component
        periodSelect = new lx.component.Selectbox({
            renderTo: reconciliationOptionsSectionEl,
            label: 'Period:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Create the noteTxt component
        noteTxt = new lx.component.Textbox({
            renderTo: reconciliationOptionsSectionEl,
            label: 'Note:',
            labelAlign: 'left',
            margin: '20px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px'
        });
        
        // Load form data
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
        
        // Edit it to the new renderTo element
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
    me.validateData = function() {
        let result = {
            status: true,
            error: ''
        };
        
        // Was tax year selected?
        if( taxYearSelect.getValue() === null ) {
            result = {
                status: false,
                error: 'No tax year selected.'
            };
            return result;
        }
        
        // Was no period selected?
        if( periodSelect.getValue() === null ) {
            result = {
                status: false,
                error: 'No period selected.'
            };
            return result;
        }
        
        return result;
    };
    
    // Functions to return panel values
    me.getTaxYear = function() {
        return taxYearSelect.getValue();
    };
    
    me.getPeriod = function() {
        return periodSelect.getValue();
    };
    
    me.getNote = function() {
        return noteTxt.getValue();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};