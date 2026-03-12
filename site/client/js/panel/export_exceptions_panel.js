/* globals app, lx */
'use strict';

// EXPORT EXCEPTIONS PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//
// Events:
//
//  onClose             This event is fired when the panel is closed
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.ExportExceptions = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var exportDetailsSectionEl = null;
    var exportFormatRadio = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var exportBtnContainerEl = null;
    var exportBtn = null;
    
    var exceptions = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            exceptions: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onClose') ) me.addEventListener('close', compConfig.onClose);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Save search string and filters, if any
        exceptions = compConfig.exceptions;
        
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
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Export Exceptions'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
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
        // EXPORT DETAILS SECTION
        //
        
        // Create example section
        exportDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Create the exportFormatRadio component
        exportFormatRadio = new lx.component.RadioGroup({
            renderTo: exportDetailsSectionEl,
            label: 'Export Format',
            margin: '0px 0px 0px 0px',
            items: [
                {text: 'Excel', value: 'xls'},
                {text: 'CSV', value: 'csv'}
            ]
        });
        exportFormatRadio.setValue('xls');
        
        
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
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        exportFormatRadio.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('close', {srcPanel: me});
    }
    
    // Export button click event handler
    function exportBtnClickEventHandler() {
        lx.sendForm({
            url: 'exec.php?c=Employee&fn=exportImportExceptionList',
            target: '_self',
            data: {
                format: exportFormatRadio.getValue(),
                exceptions: exceptions
            }
        });
        
        me.fireEvent('close', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};