/* globals app, lx */
'use strict';

// GENERATE TAX RECONCILIATON PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  employeeId          The ID of the employee to view.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.GenerateTaxReconciliation = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleEl = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var backBtn = null;
    var nextBtn = null;
    
    var optionsPanel = null;
    var exceptionsPanel = null;
    
    var refreshEmployees = false;
    
    var currentPage = null;
    

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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onGenerate') ) me.addEventListener('generate', compConfig.onGenerate);
        
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
        
        
        //
        // TITLE SECTION
        //
        
        titleEl = lx.createElement('DIV', {
            parent: el,
            style: {
                overflow: 'auto',
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Generate Tax Reconciliation: (1/2)'
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
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
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });
        
        
        //
        // BUTTON SECTION
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
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            margin: '0px 15px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the backBtn component
        backBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Back',
            width: '120px',
            margin: '0px 15px 0px 0px',
            
            onClick: backBtnClickEventHandler
        });
        backBtn.disable();
        
        // Create the nextBtn component
        nextBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Next',
            width: '120px',
            margin: '0px 0px 0px 0px',
            
            onClick: nextBtnClickEventHandler
        });
        
        
        //
        // CREATE SUB PANELS
        //
        
        // Create optionsPanel sub panel
        optionsPanel = new app.panel.GenerateTaxReconciliationOptions({
            renderTo: contentContainerEl,
            show: true
        });
        
        // Create exceptionsPanel sub panel
        exceptionsPanel = new app.panel.GenerateTaxReconciliationExceptions({
            renderTo: contentContainerEl
        });
        exceptionsPanel.hide();
        
        // Set current page
        currentPage = optionsPanel;
        
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
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', {srcPanel: me, refreshEmployees: refreshEmployees});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    //
    // EVENT HANDLERS
    //
    
    // cancelBtn click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // backBtn click event handler
    function backBtnClickEventHandler() {
        if( currentPage === exceptionsPanel ) {
            exceptionsPanel.hide();
            optionsPanel.show();
            currentPage = optionsPanel;
            
            backBtn.disable();
            
            titleEl.innerHTML = 'Generate Tax Reconciliation: (1/2)';
            
            nextBtn.setLabel('Next');
        }
    }
    
    // nextBtn click event handler
    function nextBtnClickEventHandler() {
        if( currentPage === optionsPanel ) {
            // Check if the panel data is valid
            let result = currentPage.validateData();
            if( result.status !== true ) {
                nextBtn.showWarning(result.error);
                return;
            }
            
            // Hide the current panel and show the next
            optionsPanel.hide();
            
            // Generate a list of exceptions
            exceptionsPanel.generateExceptions( optionsPanel.getTaxYear(), optionsPanel.getPeriod() );
            
            // Show the next panel
            exceptionsPanel.show();
            currentPage = exceptionsPanel;
            
            // Make certain we can go back
            backBtn.enable();
            
            // Update the title and button labels
            titleEl.innerHTML = 'Generate Tax Reconciliation: (2/2)';
            nextBtn.setLabel('Generate');
        }
        else if( currentPage === exceptionsPanel ) {
            // Check if the panel data is valid
            let result = currentPage.validateData();
            if( result.status !== true ) {
                nextBtn.showWarning(result.error);
                return;
            }
            
            // Get the reconciliation options
            let taxYear = optionsPanel.getTaxYear();
            let periodCode = optionsPanel.getPeriod();
            let note = optionsPanel.getNote();
            
            // Check the reconciliations to generate
            nextBtn.disable();
            nextBtn.showLoader();
            lx.sendJSON({
                url: 'exec.php?c=TaxReconciliation&fn=generate',
                data: {
                    taxYear: taxYear,
                    periodCode: periodCode,
                    note: note
                },
                onSuccess: function( responseText ) {
                    nextBtn.enable();
                    nextBtn.hideLoader();
                    
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Generating Tax Reconciliation Failed',
                            message: response.error
                        });
                        return;
                    }
                    
                    me.fireEvent('generate', {srcPanel: me});
                    
                    // new lx.component.Messagebox({
                    //     title: 'Generate Tax Reconciliation',
                    //     message: 'The tax reconciliation were successfully generated. Do you wish to generate another?',
                    //     buttons: [
                    //         {name: 'yes', label: 'Yes'},
                    //         {name: 'no', label: 'No'}
                    //     ],
                    //     onClose: function( event ) {
                    //         app.route.enableNavigation();
                    //         if( event.button === 'no' ) {
                    //             me.fireEvent('generate', {srcPanel: me});
                    //         }
                    //     }
                    // });
                }
            });
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};