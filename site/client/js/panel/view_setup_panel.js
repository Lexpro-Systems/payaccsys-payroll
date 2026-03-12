/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE PANEL
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
app.panel.ViewSetup = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var tabContainerEl = null;
    var tabMarkerEl = null;
    var tabCompanySetupItemEl = null;
    var tabLeaveSetupItemEl = null;
    var tabUserItemEl = null;
    var tabDocumentItemEl = null;
    var tabRetirementFundItemEl = null;
    var tabApiItemEl = null;
    var tabMiscellaneousItemEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var viewCompanyPanel = null;
    var viewLeaveSetupPanel = null;
    var userSetupPanel = null;
    var documentSetupPanel = null;
    var retirementFundSetupPanel = null;
    var lexproAccountingSetupPanel = null;
    var miscellaneousSetupPanel = null;
    
    
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
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Setup'
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
        
        // Create tabCompanySetupItemEl element
        tabCompanySetupItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Company Setup'
        });
        tabCompanySetupItemEl.addEventListener('click', tabCompanySetupItemElClickEventHandler);
        
        // Create tabLeaveSetupItemEl element
        tabLeaveSetupItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Leave Setup'
        });
        tabLeaveSetupItemEl.addEventListener('click', tabLeaveSetupItemElClickEventHandler);
        
        // Create tabUserItemEl element
        tabUserItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'User Setup'
        });
        tabUserItemEl.addEventListener('click', tabUserItemElClickEventHandler);
        
        // Create tabDocumentItemEl element
        tabDocumentItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Document Setup'
        });
        tabDocumentItemEl.addEventListener('click', tabDocumentItemElClickEventHandler);
        
        // Create tabRetirementFundItemEl element
        tabRetirementFundItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Retirement Fund Setup'
        });
        tabRetirementFundItemEl.addEventListener('click', tabRetirementFundItemElClickEventHandler);
        
        // Create tabApiItemEl element
        tabApiItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Accounting Setup'
        });
        tabApiItemEl.addEventListener('click', tabApiItemElClickEventHandler);
        
        // Create tabMiscellaneousItemEl element
        tabMiscellaneousItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Miscellaneous'
        });
        tabMiscellaneousItemEl.addEventListener('click', tabMiscellaneousItemElClickEventHandler);
        
        // Create the tabMarkerEl element
        tabMarkerEl = lx.createElement('DIV', {
            parent: tabCompanySetupItemEl,
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
        
        viewCompanyPanel = new app.panel.ViewCompany({
            renderTo: contentContainerEl,
            show: true
        });
        
        viewLeaveSetupPanel = new app.panel.ViewLeaveSetup({
            renderTo: contentContainerEl
        });
        
        userSetupPanel = new app.panel.ListUsers({
            renderTo: contentContainerEl
        });
        
        documentSetupPanel = new app.panel.ViewDocumentSetup({
            renderTo: contentContainerEl
        });
        
        retirementFundSetupPanel = new app.panel.ViewRetirementFundSetup({
            renderTo: contentContainerEl
        });
        
        lexproAccountingSetupPanel = new app.panel.ViewLexproAccountingSetup({
            renderTo: contentContainerEl
        });
        
        miscellaneousSetupPanel = new app.panel.MiscellaneousSetup({
            renderTo: contentContainerEl
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
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // tabCompanySetupItemEl click event handler
    function tabCompanySetupItemElClickEventHandler() {
        viewLeaveSetupPanel.hide();
        userSetupPanel.hide();
        documentSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        viewCompanyPanel.show();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.hide();
        
        tabCompanySetupItemEl.appendChild( tabMarkerEl );
    }
    
    // tabCompanySetupItemEl click event handler
    function tabLeaveSetupItemElClickEventHandler() {
        viewCompanyPanel.hide();
        userSetupPanel.hide();
        documentSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        viewLeaveSetupPanel.show();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.hide();
        
        tabLeaveSetupItemEl.appendChild( tabMarkerEl );
    }
    
    // tabUserItemEl click event handler
    function tabUserItemElClickEventHandler() {
        viewCompanyPanel.hide();
        viewLeaveSetupPanel.hide();
        documentSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        userSetupPanel.show();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.hide();
        
        tabUserItemEl.appendChild( tabMarkerEl );
    }
    
    // tabPayslipItem click event handler
    function tabDocumentItemElClickEventHandler() {
        viewCompanyPanel.hide();
        viewLeaveSetupPanel.hide();
        userSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        documentSetupPanel.show();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.hide();
        
        tabDocumentItemEl.appendChild( tabMarkerEl );
    }
    
    // tabRetirementFundItemEl click event handler
    function tabRetirementFundItemElClickEventHandler() {
        viewCompanyPanel.hide();
        viewLeaveSetupPanel.hide();
        userSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        documentSetupPanel.hide();
        retirementFundSetupPanel.show();
        miscellaneousSetupPanel.hide();
        
        tabRetirementFundItemEl.appendChild( tabMarkerEl );
    }
    
    // tabApiItemEl click event handler
    function tabApiItemElClickEventHandler() {
        viewCompanyPanel.hide();
        viewLeaveSetupPanel.hide();
        userSetupPanel.hide();
        documentSetupPanel.hide();
        lexproAccountingSetupPanel.show();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.hide();
        
        tabApiItemEl.appendChild( tabMarkerEl );
    }
    
    // tabMiscellaneousItemEl click event handler
    function tabMiscellaneousItemElClickEventHandler() {
        viewCompanyPanel.hide();
        viewLeaveSetupPanel.hide();
        userSetupPanel.hide();
        documentSetupPanel.hide();
        lexproAccountingSetupPanel.hide();
        retirementFundSetupPanel.hide();
        miscellaneousSetupPanel.show();
        
        tabMiscellaneousItemEl.appendChild( tabMarkerEl );
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};