/* globals app, lx */
'use strict';

// Edit EARNINGS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  employeeId          The ID of the employee to edit the earnings item to.
//
// Events:
//
//  onSave               This event is fired after the earning has been edited.
//  onCancel            This event is fired when the user click the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditOnceOffPayslipConfigItem = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var itemTypes = null;
    var employeeId = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var itemSectionEl = null;
    var itemTypeSelect = null;
    var itemCategoryDisplay = null;
    var itemDescriptionTxt = null;
    var itemAccrualDate = null;
    var itemAmountTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtn = null;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadPayslip() {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=get',
            data: {
                payslipItemId: config.payslipItemId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Failed to load payslip',
                        message: response.error
                    });
                    
                    return;
                }
                
                itemTypeSelect.setValue(response.payslip.payslipItemTypeCode, response.payslip.payslipItemTypeName);
                itemCategoryDisplay.setValue(response.payslip.payslipCategoryName);
                itemDescriptionTxt.setValue(response.payslip.description);
                itemAccrualDate.setValue(response.payslip.accrualDate);
                itemAmountTxt.setValue(lx.util.formatCurrency(response.payslip.amount));
            }
        });
    }
    
    function loadPayslipItemTypes() {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getPayslipItemTypeList',
            data: {
                searchString: itemTypeSelect.getSearchString(),
                sortOrder: 'ASC',
                isOnceOff: false
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
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        employeeId = compConfig.employeeId;
        
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
            innerHTML: 'Edit Once-Off Item'
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
        
        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Save',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loadPayslip();
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
    
    // earningsTypeSelect change event handler
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
        
        // Update the amount label depending on unit
        if( selectedItemType.unit.code === 'FIXE' ) itemAmountTxt.setLabel('Amount');
        else if( selectedItemType.unit.code === 'PHOU') itemAmountTxt.setLabel('Hourly Rate');
        else if( selectedItemType.unit.code === 'PDAY') itemAmountTxt.setLabel('Daily Rate');
        else if( selectedItemType.unit.code === 'PKIL') itemAmountTxt.setLabel('Rate Per Kilometer');
        else if( selectedItemType.unit.code === 'PERC') itemAmountTxt.setLabel('Percentage');
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        
        // Check that a type was selected
        if( itemTypeSelect.getValue() === null ) {
            saveBtn.showWarning('Please select an earnings type.');
            return;
        }
        
        // Check that a description was added
        if( itemDescriptionTxt.getValue() === '' ) {
            saveBtn.showWarning('Please enter a description.');
            return;
        }
        
        // Get the amount.  If the amount is empty change it to null
        var amount = itemAmountTxt.getValue();
        if( amount === '' ) amount = null;
        
        saveBtn.showLoader();
        saveBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=editPayslipItem',
            data: {
                payslipItemId: config.payslipItemId,
                typeCode: itemTypeSelect.getValue(),
                employeeId: employeeId,
                description: itemDescriptionTxt.getValue(),
                accrualDate: itemAccrualDate.getValue(),
                autoCalculate: false,
                isOnceOff: true,
                amount: lx.util.parseCurrency(amount)
            },
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};