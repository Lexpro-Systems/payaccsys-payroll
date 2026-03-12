/* globals app, lx */
'use strict';

// ADD PAYSLIPS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//
// Events:
//
//  onFinish            This event is fired after the profile data was successfully saved
//  onDestroy           This event is fired just before the component is destroyed
//
app.panel.AddPayslips = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var payslipMessageEl = null;
    var payslipSectionEl = null;
    
    var buttonContainerEl = null;
    var finishBtn = null;
    
    var payrunId = null;
    var numPayslipsDisplayed = 0;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to add a payslip element
    function createPayslipCard( payslip ) {
        let buttonLabel = 'Restore';
        let statusColor = '#E72B2B';
        if( payslip.statusCode === 'NEWX' ) {
            buttonLabel = 'Add';
            statusColor = '#45A517';
        }
        
        // Create the payslip card element
        let payslipCardEl = lx.createElement('DIV', {
            parent: payslipSectionEl,
            className: 'flex-column flex-align-center flex-noresize',
            style: {
                width: '100%',
                maxWidth: '900px',
                margin: '20px 0px 0px 0px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the payslip card container element
        let payslipCardElContainerEl = lx.createElement('DIV', {
            parent: payslipCardEl,
            className: 'flex-row flex-align-center',
            style: {
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // Create the payslip card description element
        let payslipCardDescriptionEl = lx.createElement('DIV', {
            parent: payslipCardElContainerEl,
            className: 'flex-resize', 
            style: {
                padding: '15px'
            }
        });
        payslipCardDescriptionEl.innerHTML =
            '<div class="flex-row flex-align-center" style="margin: 0px 0px 0px 0px;">' +
                '<div class="flex-noresize" style="width: 10px; height: 10px; border-radius: 50%; background-color: ' + statusColor + ';"></div>' + 
                '<div class="flex-noresize" style="font-size: 16px; margin: 0px 0px 0px 10px;">' + payslip.employee.name + '</div>' +
            '</div>' +
            '<div style="font-size: 12px; color: #999999; margin: 3px 0px 0px 20px;">' + payslip.fromDate + ' to ' + payslip.toDate + '</div>';
            
        // Create the buttonContainerEl element
        let buttonContainerEl = lx.createElement('DIV', {
            parent: payslipCardElContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px'
            }
        });
        
        // Create the addBtn component
        new lx.component.Button({
            renderTo: buttonContainerEl,
            label: buttonLabel,
            width: '120px',
            
            onClick: function() {
                payslipCardEl.style.display = 'none';
                numPayslipsDisplayed--;
                
                if( numPayslipsDisplayed < 1 ) {
                    payslipMessageEl.style.display = 'block';
                }
                
                payslip.statusCode = 'ACTI';
                me.fireEvent('add', {srcPanel: me, payslip: payslip});
            }
        });
    }
    
    // Function to refresh the payrun and load payslips from the database
    //
    //  addedPayslipIds             An array of payslip ids of payslips that have already been added
    //  deletedPayslips             An array of payslips that have been marked for deletion
    function loadPayslips( addedPayslipIds, deletedPayslips ) {
        loader.show();
        
        // Refresh the specified payrun
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=refresh',
            data: {
                payrunId: payrunId
            },
            onSuccess: function( responseText ) {
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Refreshing Payrun Failed',
                        message: response.error
                    });
                }
                
                // Get the payrun details
                lx.sendJSON({
                    url: 'exec.php?c=Payrun&fn=get',
                    data: {
                        payrunId: payrunId
                    },
                    onSuccess: function( responseText ) {
                        loader.hide();
                        
                        var response = JSON.parse( responseText );
                        
                        // Check that the response is ok
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Loading Payrun Failed',
                                message: response.error
                            });
                        }
                        
                        // Remove all payslip elements
                        payslipSectionEl.innerHTML = '';
                        
                        // Loop through all payslips
                        let payslip = null;
                        for( let i = 0; i < response.payrun.payslips.length; i++ ) {
                            payslip = response.payrun.payslips[i];
                            
                            // Check if the specified payslip has already been added
                            let isAdded = false;
                            for( let j = 0; j < addedPayslipIds.length; j++ ) {
                                if( addedPayslipIds[j] == payslip.id ) {
                                    isAdded = true;
                                    break;
                                }
                            }
                            
                            // Skip the payslip if already added
                            if( isAdded ) continue;
                            
                            // Is the payslip not already displayed?
                            if( payslip.statusCode !== 'ACTI' ) {
                                createPayslipCard( payslip );
                                numPayslipsDisplayed++;
                            }
                        }
                        
                        // Loop through all the deleted payslips
                        for( let i = 0; i < deletedPayslips.length; i++ ) {
                            payslip = deletedPayslips[i];
                            
                            // Is the payslip not already displayed?
                            if( payslip.statusCode !== 'ACTI' ) {
                                createPayslipCard( payslip );
                                numPayslipsDisplayed++;
                            }
                        }
                        
                        // Are there no payslips to display?
                        if( numPayslipsDisplayed < 1 ) {
                            payslipMessageEl.style.display = 'block';
                        }
                    }
                });
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
            show: false,
            
            payrunId: null,
            addedPayslipIds: [],
            deletedPayslips: []
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onFinish') ) me.addEventListener('finish', compConfig.onFinish);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        
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
            innerHTML: 'Add Payslips'
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
        // PAYSLIP SECTION
        //
        
        payslipMessageEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                // width: '100%',
                // maxWidth: '900px',
                margin: '15px',
                padding: '15px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderWidth: '1px',
                borderColor: '#DFDFDF',
                display: 'none'
            }
        });
        payslipMessageEl.innerHTML = '<div style="font-size: 14px;">No payslips available.</div>';
        
        // Create payslip section
        payslipSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                margin: '0px 15px 0px 15px'
            }
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
        
        // Create the finishBtn component
        finishBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Done',
            width: '120px',
            
            onClick: finishBtnClickEventHandler
        });
        
        // Load form data
        loadPayslips( compConfig.addedPayslipIds, compConfig.deletedPayslips );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
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
        // ...
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
    
    // Finish button click event handler
    function finishBtnClickEventHandler() {
        me.fireEvent('finish', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};