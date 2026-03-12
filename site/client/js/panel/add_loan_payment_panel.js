/* globals app, lx */
'use strict';

// ADD LOAN PAYMENT PANEL
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
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.AddLoanPayment = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var loanDetailsSectionEl = null;
    
    var typeRadio = null;
    // var interestRateTxt = null;
    // var interestAmountTxt = null;
    var paidAmountTxt = null;
    var paidOnDate = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var addBtnContainerEl = null;
    var addBtn = null;
    
    // var formChanged = false;
    
    
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
            loadId: null,
            outstandingAmount: null,
            instalmentAmount: null
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
                backgroundColor: '#FFFFFF',
                overflow: 'visible'
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
            innerHTML: 'Add Loan Payment'
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
        // NOTE SECTION
        //
        
        let noteContainerEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end'
            }
        });
        
        new lx.createElement('DIV', {
            parent: noteContainerEl,
            style: {
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                padding: '0px 15px 0px 0px',
                margin: 'auto',
                fontSize: '24px'
            },
            innerHTML:
                '<i class="fa fa-exclamation-triangle" style="color:#E75B54;"></i>'
        });
        
        new lx.createElement('DIV', {
            parent: noteContainerEl,
            style: {
                margin: '0px',
                padding: '0px 0px 0px 15px',
                fontSize: '14px'
            },
            innerHTML:
                'Please note that the payments added here will NOT be reflected on employee payslips.'
        });
        
        
        //
        // LOAN DETAILS SECTION
        //
        
        // Create example section
        loanDetailsSectionEl = lx.createElement('DIV', {
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
        
        // interestRateTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Interest Rate',
        //     margin: '15px 0px 0px 0px',
        // });
        
        // interestAmountTxt = new lx.component.Textbox({
        //     renderTo: loanDetailsSectionEl,
        //     label: 'Interest Amount',
        //     margin: '15px 0px 0px 0px',
        // });
        
        paidOnDate = new lx.component.DatePicker({
            renderTo: loanDetailsSectionEl,
            label: 'Payment Date',
            margin: '0px 0px 0px 0px'
        });
        
        typeRadio = new lx.component.RadioGroup({
            renderTo: loanDetailsSectionEl,
            label: 'Amount Type',
            margin: '15px 0px 0px 0px',
            
            items: [
                { text: 'Outstanding', value: 'OUTS'},
                { text: 'Instalment',  value: 'INST'},
                { text: 'Other',       value: 'OTHE'}
            ],
            
            onChange: typeRadioOnChangeEventHandler
        });
        typeRadio.setValue('OTHE');
        
        paidAmountTxt = new lx.component.Textbox({
            renderTo: loanDetailsSectionEl,
            label: 'Payment Amount',
            margin: '15px 0px 0px 0px',
                
            onFocus: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue( value );
                    event.srcComponent.select();
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            },
                
            onBlur: function( event ) {
                let value = lx.util.parseCurrency(event.srcComponent.getValue());
                if( !isNaN(value) ) {
                    event.srcComponent.setValue(lx.util.formatCurrency(value));
                }
                else {
                    event.srcComponent.setValue( '' );
                }
            }
        });
        // paidAmountTxt.disable();
        
        
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
            label: 'Add',
            width: '120px',
            
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
        paidAmountTxt.getValue();
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
    
    // typeRadio change event handler
    function typeRadioOnChangeEventHandler() {
        if( typeRadio.getValue() === 'OUTS' ) { 
            paidAmountTxt.disable();
            paidAmountTxt.setValue( config.outstandingAmount );
        }
        else if ( typeRadio.getValue() === 'INST' ) { 
            paidAmountTxt.disable();
            paidAmountTxt.setValue( config.instalmentAmount );
        }
        else {
            paidAmountTxt.enable();
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Add button click event handler
    function addBtnClickEventHandler() {
        // Do sanity checks
        if( (paidOnDate.getValue() == '') || (paidOnDate.getValue() == null) ) {
            addBtn.showWarning('Invalid payment date.');
            return;
        }
        
        let paidAmount = lx.util.parseCurrency(paidAmountTxt.getValue());
        if( isNaN(paidAmount) ) {
            addBtn.showWarning('Invalid payment amount.');
            return;
        }
        
        addBtn.showLoader();
        addBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Loan&fn=addPayment',
            data: {
                loanId: config.loanId,
                type: typeRadio.getValue(),
                interestRate: '0.00', // interestRateTxt.getValue(),
                interestAmount: '0.00', // interestAmountTxt.getValue(),
                paidAmount: paidAmount,
                paidOn: paidOnDate.getValue()
            },
            onSuccess: function( responseText ) {
                // Hide the loader and reanable the button
                addBtn.hideLoader();
                addBtn.enable();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    addBtn.showWarning(response.error);
                    return; 
                }
                
                me.fireEvent('add', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};