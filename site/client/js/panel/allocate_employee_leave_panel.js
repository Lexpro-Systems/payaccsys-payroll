/* globals app, lx */
'use strict';

// ADD EARNINGS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  employeeId          The ID of the employee to add the earnings item to.
//
// Events:
//
//  onAdd               This event is fired after the earning has been added.
//  onCancel            This event is fired when the user click the cancel button.
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AllocateEmployeeLeave = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var employeeId = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var leaveSectionEl = null;
    var actionSelect = null;
    var descriptionTxt = null;
    var effectiveDate = null;
    var amountTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var allocateBtn = null;
    

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
            innerHTML: 'Allocate Leave'
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
        leaveSectionEl = lx.createElement('DIV', {
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
        
        // Create actionSelect component
        actionSelect = new lx.component.Selectbox({
            renderTo: leaveSectionEl,
            label: 'Item Category',
            margin: '0px 0px 0px 0px',
            
            onChange: actionSelectOnChangeEventHandler
            
        });
        var itemCategories = [
            { value: 'ADJU', text: 'Adjustment' },
            { value: 'LEAR', text: 'Leave Earned' },
            { value: 'LTAK', text: 'Leave Taken' }
        ];
        actionSelect.addItems( itemCategories );
        actionSelect.setValue( 'ADJU', 'Adjustment' );
        
        // Create the effectiveDate component
        effectiveDate = new lx.component.DatePicker({
            renderTo: leaveSectionEl,
            label: 'Effective Date',
            margin: '15px 0px 0px 0px'
        });
        effectiveDate.setValue(new Date().toISOString().slice(0, 10));
        
        // Create the descriptionTxt component
        descriptionTxt = new lx.component.Textbox({
            renderTo: leaveSectionEl,
            label: 'Description',
            margin: '15px 0px 0px 0px'
        });
        
        // Create the amountTxt component
        amountTxt = new lx.component.Textbox({
            renderTo: leaveSectionEl,
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
        
        // Create the allocateBtn component
        allocateBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Allocate',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: allocateBtnClickEventHandler
        });
        
        descriptionTxt.setValue(actionSelect.getText());
        
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
        actionSelect.focus();
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
    
    function actionSelectOnChangeEventHandler() {
        descriptionTxt.setValue(actionSelect.getText());
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function allocateBtnClickEventHandler() {
        
        // Check that a type was selected
        if( actionSelect.getValue() === null ) {
            allocateBtn.showWarning('Please select the allocation action.');
            return;
        }
        
        // Check that an effective date was added
        if( effectiveDate.getValue() === '' || effectiveDate.getValue() === null ) {
            allocateBtn.showWarning('Please enter the effective date for the leave adjustment.');
            return;
        }
        
        // Check that an amount was added
        if( amountTxt.getValue() === '' ) {
            allocateBtn.showWarning('Please enter the amount of leave.');
            return;
        }
        
        // Add the item
        allocateBtn.showLoader();
        allocateBtn.disable();
        
        let leaveData = {
            leaveTypeId: config.leaveTypeId,
            action: actionSelect.getValue(),
            description: descriptionTxt.getValue(),
            date: effectiveDate.getValue(),
            amount: parseFloat(amountTxt.getValue())
        };
        
        if (config.employeeId === null) {
            me.fireEvent('save', {srcPanel: me, leaveData});
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=allocateLeave',
            data: {
                leaveTypeId: config.leaveTypeId,
                employeeId: config.employeeId,
                action: actionSelect.getValue(),
                description: descriptionTxt.getValue(),
                date: effectiveDate.getValue(),
                amount: parseFloat(amountTxt.getValue())
            },
            onSuccess: function( responseText ) {
                allocateBtn.hideLoader();
                allocateBtn.enable();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    allocateBtn.showWarning(response.error);
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