/* globals app, lx */
'use strict';

// ADD RETIREMENT PANEL
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
app.panel.AddRetirementFund = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var itemSectionEl = null;
    var nameTxt = null;
    var providentFundCalculationTypes = null;
    var employeeAmountTxt = null;
    var employerAmountTxt = null;
    
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
    
    // Function to format a string as a numerical value with the given precision
    function formatNumerical(value, precision) {
        // var precision = 4;
        var valueParts = ('' + parseFloat(value).toFixed(precision)).split('.');
        var strParts = [];
        
        var offset = 0;
        if( valueParts[0][0] === '-' || valueParts[0][0] === '+' ) offset = ((valueParts[0].length - 1) % 3) + 1;
        else offset = valueParts[0].length % 3;
        
        if( offset > 0 ) strParts.push(valueParts[0].substr(0, offset));
        
        for( var i = 0; i < (valueParts[0].length - offset) / 3; i++ ) {
            strParts.push(valueParts[0].substring(offset + (i * 3), offset + (i * 3) + 3));
        }
        
        return strParts.join(' ') + '.' + valueParts[1];
    }
    
    // Function to parse to convert a numerical string value to a floating point value
    function parseNumerical( value ) {
        return parseFloat( String(value).replace(/\s/g, '') );
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
            innerHTML: 'Add Retirement Fund'
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
        
        // Create the itemDescriptionTxt component
        nameTxt = new lx.component.Textbox({
            renderTo: itemSectionEl,
            label: 'Fund Name',
            margin: '0px 0px 0px 0px'
        });
        
        // Create the bankDetailsAccountTypeRadio component
        providentFundCalculationTypes = new lx.component.RadioGroup({
            renderTo: itemSectionEl,
            margin: '20px 0px 0px 0px',
            maxWidth: '500px',
            
            items: [
                {text: 'Percentage', value: 'PRFI'},
                {text: 'Fixed', value: 'FIXE'}
            ],
            
            onChange: providentFundCalculationTypesOnChangeEventHandler
        });
        providentFundCalculationTypes.setValue('PRFI');
        
        // Create the employeeAmountTxt component
        employeeAmountTxt = new lx.component.Textbox({
            renderTo: itemSectionEl,
            label: 'Percentage of Income Contributed by Employee',
            margin: '15px 0px 0px 0px',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(formatNumerical(value , (providentFundCalculationTypes.getValue() === 'FIXE' ? 2 : 2) ));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            }
        });
        employeeAmountTxt.setValue( '0.00' );
        
        // Create the employerAmountTxt component
        employerAmountTxt = new lx.component.Textbox({
            renderTo: itemSectionEl,
            label: 'Percentage of Income Contributed by Employer',
            margin: '15px 0px 0px 0px',
            
            onFocus: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
            
            onBlur: function( event ) {
                let value = parseNumerical(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(formatNumerical(value, (providentFundCalculationTypes.getValue() === 'FIXE' ? 2 : 2) ));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            }
        });
        employerAmountTxt.setValue( '0.00' );
        
        
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
        nameTxt.focus();
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
    
    // Provident fund calculation type radio button change event handler
    function providentFundCalculationTypesOnChangeEventHandler(){
        if(providentFundCalculationTypes.getValue() === 'FIXE') {
            employeeAmountTxt.setLabel('Amount Contributed by Employee');
            employerAmountTxt.setLabel('Amount Contributed by Employer');
        }
        else {
            employeeAmountTxt.setLabel('Percentage of Income Contributed by Employee');
            employerAmountTxt.setLabel('Percentage of Income Contributed by Employer');
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function addBtnClickEventHandler() {
        
        // Check that name was enetered
        if( nameTxt.getValue() === '' ) {
            addBtn.showWarning('Please enter a fund name.');
            return;
        }
        
        if( employeeAmountTxt.getValue() === '' ) {
            if(providentFundCalculationTypes.getValue() === 'FIXE') {
                addBtn.showWarning('Please enter an employee amount.');
                return;
            }
            else {
                addBtn.showWarning('Please enter an employee percentage.');
                return;
            }
        }
        
        if( employerAmountTxt.getValue() === '' ) {
            if(providentFundCalculationTypes.getValue() === 'FIXE') {
                addBtn.showWarning('Please enter an employer amount.');
                return;
            }
            else {
                addBtn.showWarning('Please enter an employer percentage.');
                return;
            }
        }
        
        // Add the item
        addBtn.showLoader();
        addBtn.disable();
        lx.sendJSON({
            url: 'exec.php?c=ProvidentFund&fn=add',
            data: {
                providentFundName: nameTxt.getValue(),
                providentFundCalculationType: providentFundCalculationTypes.getValue(),
                employeeAmount: parseNumerical(employeeAmountTxt.getValue()),
                employerAmount: parseNumerical(employerAmountTxt.getValue())
            },
            onSuccess: function( responseText ) {
                addBtn.hideLoader();
                addBtn.enable();
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    addBtn.showWarning(response.error);
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