/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW TAX RECONCILIATION PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  reconciliationId    The id of the tax reconciliation to view.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewTaxReconciliation = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var exportBtn = null;
    
    var loaderContainerEl = null;
    var tabContainerEl = null;
    var tabMarkerEl = null;
    var tabDetailsItemEl = null;
    var tabCertificatesItemEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var detailsPanel = null;
    var certificatesPanel = null;
    
    var reconciliationId = null;
    var generatedOn = null;
    var refreshReconciliations = false;
    
    
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
            show: false,
            
            reconciliationId: null,
            generatedOn: null
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
        reconciliationId = compConfig.reconciliationId;
        generatedOn = compConfig.generatedOn;
        
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
            innerHTML: 'Tax Reconciliation: ' + generatedOn
        });
        
        // Create the exportBtn component
        exportBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'SARS Export',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px auto',
            
            onClick: exportBtnClickEventHandler
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
        
        // Create the tabContainerEl element
        tabContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                width: '220px',
                height: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create tabDetailsItemEl element
        tabDetailsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Details'
        });
        tabDetailsItemEl.addEventListener('click', tabDetailsItemElClickEventHandler);
        
        // Create tabCertificatesItemEl element
        tabCertificatesItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Tax Certificates'
        });
        tabCertificatesItemEl.addEventListener('click', tabCertificatesItemElClickEventHandler);
        
        // Create the tabMarkerEl element
        tabMarkerEl = lx.createElement('DIV', {
            parent: tabDetailsItemEl,
            style: {
                backgroundColor: '#F4F5F6',
                width: '35px',
                height: '35px',
                top: '4px',
                left: '213px',
                position: 'absolute',
                transform: 'rotate(45deg)',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
            }
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
        // CREATE SUB PANELS
        //
        
        detailsPanel = new app.panel.ViewTaxReconciliationDetails({
            renderTo: contentContainerEl,
            show: true,
            
            reconciliationId: reconciliationId
        });
        
        certificatesPanel = new app.panel.ListTaxReconciliationCertificates({
            renderTo: contentContainerEl,
            reconciliationId: reconciliationId,
            viewTaxReconciliationPanel: me
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
        me.fireEvent('destroy', {srcPanel: me, refreshReconciliations: refreshReconciliations});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    me.getPanels = function() {
        let panels = null;
        panels = {
            detailsPanel: detailsPanel,
            certificatesPanel: certificatesPanel
        };
        
        return panels;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // tabDetailsItemEl click event handler
    function tabDetailsItemElClickEventHandler() {
        detailsPanel.show();
        certificatesPanel.hide();
        
        // titleTextEl.innerHTML = 'Tax Reconciliation Details (' + generatedOn + ')';
        tabDetailsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabCertificatesItemEl click event handler
    function tabCertificatesItemElClickEventHandler() {
        detailsPanel.hide();
        certificatesPanel.show();
        
        // titleTextEl.innerHTML = 'Tax Certificate Details (' + generatedOn + ')';
        tabCertificatesItemEl.appendChild( tabMarkerEl );
    }
    
    // exportBtn click event hander
    function exportBtnClickEventHandler() {
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
            
            reconciliationId: config.reconciliationId,
            
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
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};