/* globals app, lx */
'use strict';

// ADD PAYSLIP ITEM PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  payslipFromDate     The start date of the payslip.
//  payslipToDate       The end date of the payslip.
//
// Events:
//
//  onAdd               This event is fired after the item has been added.
//  onCancel            This event is fired when the user click the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddPayslipItem = function(config) {
    
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var itemTypes = null;
    var payslipFromDate = null;
    var payslipToDate = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var itemSectionEl = null;
    var itemTypeSelect = null;
    var itemCategoryDisplay = null;
    var itemDescriptionTxt = null;
    var itemAccrualDate = null;
    var itemAutoCheck = null;
    var itemPartOfNettPayContainer = null;
    var itemPartOfNettPayCheck = null;
    var itemAmountTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var addBtn = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadPayslipItemTypes() {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getPayslipItemTypeList',
            data: {
                searchString: itemTypeSelect.getSearchString(),
                sortOrder: 'ASC',
                // isOnceOff: false
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Item Types Failed',
                        message: response.error
                    });
                }
                
                // Store item types
                if (itemTypes === null) {
                    itemTypes = response.itemTypes;
                }
                
                // Add item types to the itemTypeSelect component
                var selectItems = [];
                for( var i = 0; i < response.itemTypes.length; i++ ) {
                    selectItems.push({
                        value: response.itemTypes[i].code,
                        text: response.itemTypes[i].name
                    });
                }
                itemTypeSelect.addItems( selectItems );
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
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payslipFromDate = compConfig.payslipFromDate;
        payslipToDate = compConfig.payslipToDate;
        
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
            innerHTML: 'Add Payslip Item'
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
        // ITEM SECTION
        //
        
        // Create item section
        itemSectionEl = lx.createElement('DIV', {
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
        
        // Create itemTypeSelect component
        itemTypeSelect = new lx.component.Selectbox({
            renderTo: itemSectionEl,
            label: 'Item Type',
            margin: '0px 0px 0px 0px',
            search: true,
            
            onSearch: function() {
                itemTypeSelect.clear();
                loadPayslipItemTypes();
            },
            
            onChange: itemTypeSelectChangeEventHandler
        });
        
        // Create the itemCategoryDisplay component
        itemCategoryDisplay = new lx.component.Display({
            renderTo: itemSectionEl,
            label: 'Item Category:',
            margin: '15px 0px 0px 0px',
            labelWidth: '95px'
        });
        
        // Create the itemDescriptionTxt component
        itemDescriptionTxt = new lx.component.Textbox({
            renderTo: itemSectionEl,
            label: 'Description',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the itemAccrualDate component
        itemAccrualDate = new lx.component.DatePicker({
            renderTo: itemSectionEl,
            label: 'Accrual Date',
            margin: '15px 0px 0px 0px',
            showCalendar: false
        });
        itemAccrualDate.disable();
        
        // Create the itemAutoCheck component
        itemAutoCheck = new lx.component.Checkbox({
            renderTo: itemSectionEl,
            label: 'Auto Calculate',
            labelAlign: 'right',
            margin: '20px 0px 0px 0px',
            
            onChange: itemAutoCheckChangeEventHandler
        });
        itemAutoCheck.disable();
        itemAutoCheck.setValue(false);
        
        // Create item section
        itemPartOfNettPayContainer = lx.createElement('DIV', {
            parent: itemSectionEl,
            style: {
                display: 'none',
                margin: '20px 0px 0px 0px'
            }
        });
        
        // Create the partOfNettPayCheck component
        itemPartOfNettPayCheck = new lx.component.Checkbox({
            renderTo: itemPartOfNettPayContainer,
            label: 'Part of Nett Pay',
            labelAlign: 'right',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the itemAmountTxt component
        itemAmountTxt = new lx.component.Textbox({
            renderTo: itemSectionEl,
            label: 'Amount',
            margin: '15px 0px 0px 0px'
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
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Add',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: addBtnClickEventHandler
        });
        
        loadPayslipItemTypes();
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
        itemTypeSelect.focus();
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
    
    // itemTypeSelect change event handler
    function itemTypeSelectChangeEventHandler() {
        var selectedItemType = null;
        
        // Get the itemType that was selected
        for( var i = 0; i < itemTypes.length; i++ ) {
            if( itemTypeSelect.getValue() === itemTypes[i].code ) {
                selectedItemType = itemTypes[i];
                break;
            }
        }
        
        // If the item type was not found we can't continue
        if( selectedItemType === null ) return false;
        
        // Set the category display to the selected item types category name
        itemCategoryDisplay.setValue(selectedItemType.category.name);
        
        // Set the description to the selected item types name
        itemDescriptionTxt.setValue( selectedItemType.name );
        
        // Enable or disable accrual date depending on the isOnceOff vlag of the item type.
        if( selectedItemType.isOnceOff === true ) {
            itemAccrualDate.setValue(payslipToDate);
            itemAccrualDate.enable();
        }
        else {
            itemAccrualDate.setValue(null);
            itemAccrualDate.disable();
        }
        
        // Set auto calculate depending on the selected item type.
        if( selectedItemType.autoCalculate === true ) {
            itemAutoCheck.enable();
            itemAutoCheck.setValue(true);
            itemAmountTxt.disable();
        }
        else {
            itemAutoCheck.disable();
            itemAutoCheck.setValue(false);
            itemAmountTxt.enable();
        }
        
        // Set the whether the item is part of nett pay
        itemPartOfNettPayCheck.setValue( selectedItemType.includeInNettPay );
        
        // Update the amount label depending on unit
        if( selectedItemType.unit.code === 'FIXE' ) itemAmountTxt.setLabel('Amount');
        else if( selectedItemType.unit.code === 'PHOU') itemAmountTxt.setLabel('Hourly Rate');
        else if( selectedItemType.unit.code === 'PDAY') itemAmountTxt.setLabel('Daily Rate');
        else if( selectedItemType.unit.code === 'PKIL') itemAmountTxt.setLabel('Rate Per Kilometer');
        else if( selectedItemType.unit.code === 'PERC') itemAmountTxt.setLabel('Percentage');
        
        
        // Is it a fringe benefit?
        if( selectedItemType.category.code === 'FBEN' ) {
            lx.applyStyle(itemPartOfNettPayContainer, {display: 'flex'});
        }
        else {
            lx.applyStyle(itemPartOfNettPayContainer, {display: 'none'});
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function addBtnClickEventHandler() {
        // Get the selected item type
        var selectedItemType = null;
        for( var i = 0; i < itemTypes.length; i++ ) {
            if( itemTypeSelect.getValue() === itemTypes[i].code ) {
                selectedItemType = itemTypes[i];
                break;
            }
        }
        
        // Check that a type was selected
        if( itemTypeSelect.getValue() === null ) {
            addBtn.showWarning('Please select an item type.');
            return;
        }
        
        // Check that a description was added
        if( itemDescriptionTxt.getValue() === '' ) {
            addBtn.showWarning('Please enter a description.');
            return;
        }
        
        // If the itemAccrualDate is enabled then check that it was completed
        if( selectedItemType.isOnceOff === true ) {
            if( itemAccrualDate.getValue() === '' ) {
                addBtn.showWarning('Please enter an accrual date.');
                return;
            }
        }
        
        // Get the accrualDate.  If the item is not once off this should be null
        var accrualDate = null;
        if( selectedItemType.isOnceOff === true ) accrualDate = itemAccrualDate.getValue();
        
        // If there is an accrual date, make sure it is in the range of the payslip from and to dates.
        // ... 
        
        // Get the amount.  If the amount is empty change it to null
        var amount = itemAmountTxt.getValue();
        if( amount === '' ) amount = null;
        
        var units = null;
        var rate = null;
        
        if( selectedItemType.unit.code === 'PHOU' || selectedItemType.unit.code === 'PDAY' ||
            selectedItemType.unit.code === 'PKIL' ) {
            rate = amount;
            amount = null;
        }
        
        // Set the item details
        var items = [];
        items.push({
            id: null,
            category: {
                code: selectedItemType.category.code
            },
            type: {
                code: selectedItemType.code,
                unitCode: selectedItemType.unit.code
            },
            providentFund: {
                id: null,
                employeeAmount: null,
                employerAmount: null,
                rfiItems: []
            },
            loan: {
                id: null
            },
            description: itemDescriptionTxt.getValue(),
            accrualDate: accrualDate,
            autoCalculate: itemAutoCheck.getValue(),
            units: units,
            rate: rate,
            amount: amount,
            includeInNettPay: itemPartOfNettPayCheck.getValue()
        });
        
        // Fire the event to add the item
        me.fireEvent('add', {srcPanel: me, items: items});
    }
    
    // itemAutoCheck change event handler
    function itemAutoCheckChangeEventHandler() {
        if( itemAutoCheck.getValue() === true ) itemAmountTxt.disable();
        else itemAmountTxt.enable();
    }
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};