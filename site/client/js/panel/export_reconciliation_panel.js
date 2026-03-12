/* globals app, lx */
'use strict';


// EXPORT RECONCILIATION PANEL
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
//  onExport            This event is fired after the reconciliation has been successfully exported.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ExportReconciliation = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var reconciliationDetailsSectionEl = null;
    var disclaimerDisplay = null;
    var disclaimerCb = null;
    var typeSelect = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var exportBtnContainerEl = null;
    var exportBtn = null;
    
    var reconciliationId = null;
    
    
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
            
            reconciliationId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onExport') ) me.addEventListener('export', compConfig.onExport);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        reconciliationId = compConfig.reconciliationId;
        
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
            innerHTML: 'Export SARS Reconciliation'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'visible',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // DEPARTMNT DETAILS SECTION
        //
        
        // Create example section
        reconciliationDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create a heading for the disclaimer
        new lx.component.Heading({
            renderTo: reconciliationDetailsSectionEl,
            label: 'DISCLAIMER:',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '900px',
            padding: '0px 0px 0px 0px',
            fontSize: '16px'
        });
        
        // Create the disclaimerDisplay component
        disclaimerDisplay = new lx.createElement('DIV', {
        // disclaimerDisplay = new lx.component.Display({
            parent: reconciliationDetailsSectionEl,
            style: {
                textAlign: 'justify',
                margin: '15px 0px 0px 0px',
                padding: '0px'
            },
            innerHTML:
                'Whilst we do our utmost to ensure that the information contained in the ' +
                'SARS export is correct and accurate, it is the user&#39;s responsibility to ' +
                'check and ensure the accuracy of the information submitted to SARS and ' +
                'Lexpro Systems (Pty) Ltd will not be held accountable for any loss or ' +
                'damages due to the aforementioned submissions.'
        });
        
        // Create the disclaimerCb component
        disclaimerCb = new lx.component.Checkbox({
            renderTo: reconciliationDetailsSectionEl,
            label: 'I have read and understood the disclaimer',
            labelAlign: 'right',
            margin: '15px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '500px',
            isChecked: false
        });
        
        // Create the typeSelect component
        typeSelect = new lx.component.Selectbox({
            renderTo: reconciliationDetailsSectionEl,
            label: 'Type',
            margin: '15px 0px 0px 0px'
        });
        typeSelect.addItems([
            { value: 'TEST', text: 'Test' },
            { value: 'LIVE', text: 'Live' }
        ]);
        typeSelect.setValue( 'TEST', 'Test' );
        
        
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
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
        // Create the exportBtnContainerEl element
        exportBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the exportBtn component
        exportBtn = new lx.component.Button({
            renderTo: exportBtnContainerEl,
            label: 'Export',
            width: '120px',
            
            onClick: exportBtnClickEventHandler
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
        
        // Save it to the new renderTo element
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
        typeSelect.focus();
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
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Export button click event handler
    function exportBtnClickEventHandler() {
        // Check that disclaimer was accepted
        if( !disclaimerCb.getValue() ) {
            new lx.component.Messagebox({
                title: 'Disclaimer not checked',
                message: 'Please indicate whether you have read and understood the disclaimer before exporting.'
            });
            return;
        }
        
        // Export the reconciliation
        lx.sendForm({
            url: 'exec.php?c=TaxReconciliation&fn=exportSars',
            target: '_self',
            data: {
                reconciliationId: config.reconciliationId,
                type: typeSelect.getValue()
            }
        });
                    
        me.fireEvent('export', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};