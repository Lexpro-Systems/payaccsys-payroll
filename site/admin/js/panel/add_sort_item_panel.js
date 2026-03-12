/* globals app, lx */
'use strict';

// ADD SORT ITEM PANEL
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
//  onCancel             This event is fired when the panel is closed
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddSortItem = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var sortItemDetailsSectionEl = null;
    var sortBySelect = null;
    var sortOrderGroup = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var addBtnContainerEl = null;
    var addBtn = null;
    
    var selectedValue = null;
    var selectedText = '';
    
    
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
            sortOptions: [],
            selectedValue: null,
            selectedText: '',
            selectedOrder: 'ASC'
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onUpdate') ) me.addEventListener('update', compConfig.onUpdate);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Save default values, if any
        selectedValue = compConfig.selectedValue;
        selectedText = compConfig.selectedText;
        
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
            innerHTML: (compConfig.selectedValue === null ? 'Add Sort Item' : 'Update Sort Item' )
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
        // SORT ITEM DETAILS SECTION
        //
        
        // Create note details section
        sortItemDetailsSectionEl = lx.createElement('DIV', {
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
        
        // Format the sort options for display in a list
        let sortOptionList = [];
        for( let i = 0; i < compConfig.sortOptions.length; i++ ) {
            sortOptionList.push({
                'text': compConfig.sortOptions[i].name,
                'value': compConfig.sortOptions[i].dataIndex
            });
        }
        
        // Create the sortOrderGroup component
        sortBySelect = new lx.component.Selectbox({
            renderTo: sortItemDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Sort By *',
            
            items: sortOptionList
        });
        sortBySelect.setValue( compConfig.selectedValue, compConfig.selectedText );
        
        // Create the sortOrderGroup component
        sortOrderGroup = new lx.component.RadioGroup({
            renderTo: sortItemDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Sort Order *',
            
            items: [
                { text: 'Ascending',  value: 'ASC'  },
                { text: 'Descending', value: 'DESC' }
            ]
        });
        if( compConfig.selectedOrder === 'ASC' ) {
            sortOrderGroup.setValue( 'ASC' );
        }
        else {
            sortOrderGroup.setValue( 'DESC' );
        }
        
        
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
        
        // Create the addBtnContainerEl element
        addBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: addBtnContainerEl,
            label: (compConfig.selectedValue === null ? 'Add' : 'Update' ),
            width: '120px',
            
            onClick: addBtnClickEventHandler
        });
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        sortBySelect.focus();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Export button click event handler
    function addBtnClickEventHandler() {
        // Check that a sort by was seleted
        if( sortBySelect.getValue() === null || sortBySelect.getValue() === '' ) {
            addBtn.showWarning('Please select the value to sort by');
            return;
        }
        
        let sortOption = {
            name: sortBySelect.getText(),
            dataIndex: sortBySelect.getValue(),
            order: sortOrderGroup.getValue()
        };
        
        // addBtn.showLoader();
        addBtn.disable();
        
        // Fire the event to add the note
        if( selectedValue === null ) {
            me.fireEvent('add', {srcPanel: me, sortOption: sortOption});
        }
        else {
            me.fireEvent('update', {srcPanel: me, sortOption: sortOption});
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};