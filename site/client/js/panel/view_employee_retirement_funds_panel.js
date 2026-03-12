/* jslint node: true */
/* globals app */
'use strict';


// VIEW EMPLOYEE RETIREMENT FUNDS PANEL
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
app.panel.ViewEmployeeRetirementFunds = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var providentFunds = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to update the rfi items of the specified provident fund
    //
    // providentFundIndex       The index of the provident fund to update
    function updateRfiItems( providentFundIndex ) {
        // Add the rfi items, if any
        let rfiItems = [];
        for( let i = 0; i < providentFunds[providentFundIndex].rfiItems.length; i++ ) {
            // Was the rfi item selected?
            if( providentFunds[providentFundIndex].rfiItems[i].selectedCb.getValue() ) {
                // Check if the percentage is valid
                let percentage = providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue();
                if( isNaN(providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue()) ) {
                    new lx.component.Messagebox({
                        title: 'Retirement Fund Subscription Failed',
                        message: 'The specified income item percentage is not a valid number.'
                    });
                    
                    focusRfiItem( providentFundIndex, i );
                    return;
                }
                
                // Add the rfi item
                rfiItems.push({
                    payslipConfigItemId: providentFunds[providentFundIndex].rfiItems[i].payslipConfigItemId,
                    percentage: percentage
                });
            }
        }
        
        // Update the provident fund rfi items
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=updateProvidentFundRfiItems',
            data: {
                providentFundId: providentFunds[providentFundIndex].id,
                employeeId: config.employeeId,
                rfiItems: rfiItems
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Retirement Fund Failed',
                        message: result.error
                    });
                    
                    return;
                }
            }
        });
    }
    
    // Function to create the provident fund display elements
    //
    // providentFundIndex       The index of the provident fund to display.
    // providentFundData        The data for the provident fund income.
    function createProvidentFundSection( providentFundIndex, providentFundData ) {
        let fundContainerEl = null;
        
        // Does a provident fund container exist?
        if( providentFunds[providentFundIndex].fundContainerEl !== null ) {
            // Clear the provident fund container
            fundContainerEl = providentFunds[providentFundIndex].fundContainerEl;
            fundContainerEl.innerHTML = '';
        }
        else {
            // Create the fund's container
            fundContainerEl = lx.createElement('DIV', {
                parent: contentContainerEl,
                style: {
                    width: '100%',
                    maxWidth: '900px',
                    margin: '20px 0px 0px 0px',
                    backgroundColor: '#FFFFFF',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    borderColor: '#DFDFDF',
                    minWidth: '532px'
                }
            });
        }
        
        // Create the fund's heading
        let fundHeadingEl = lx.createElement('DIV', {
            parent: fundContainerEl,
            style: {
                padding: '0px 3px 0px 15px',
                height: '45px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the fund's heading bar
        let fundHeadingContainerEl = lx.createElement('DIV', {
            parent: fundHeadingEl,
            style: {
                margin: '0px 0px 0px 0px',
                display: 'flex',
                flexDirection: 'row',
            }
        });
        
        // Create the subscribe checkbox
        let subscribeCb = new lx.component.Checkbox({
            renderTo: fundHeadingContainerEl,
            label: null,
            margin: '0px 10px 0px 0px',
            width: ''
        });
        subscribeCb.addEventListener('click', subscribeCbChangeEventHandler.bind(me, {id: providentFundData.id}));
        
        // Is the employee subscribed to the specified provident fund?
        if( providentFundData.joinedOn !== null ) {
            subscribeCb.setValue(true);
        }
        else {
            subscribeCb.setValue(false);
        }
        
        // Save the provident fund details
        providentFunds[providentFundIndex].name = providentFundData.name;
        providentFunds[providentFundIndex].subscribeCb = subscribeCb;
        providentFunds[providentFundIndex].fundContainerEl = fundContainerEl;
        providentFunds[providentFundIndex].rfiItems = [];
        
        // Set the provident fund's name
        lx.createElement('DIV', {
            parent: fundHeadingContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
            },
            innerHTML: providentFundData.name
        });
        
        // Is the employee not a member of the specified fund?
        if( providentFundData.joinedOn === null ) {
            lx.createElement('DIV', {
                parent: fundContainerEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '15px 15px'
                    
                },
                innerHTML: 'The employee is not a member of this retirement fund.'
            });
            
            // Nothing further to do
            return;
        }
        
        // Is the provident fund contribution calculated from rfi items?
        if( providentFundData.typeCode === 'PRFI' ) {
            // Display a message of how the provident fun contribution is calculated
            lx.createElement('DIV', {
                parent: fundContainerEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '15px 15px 0px 15px'
                    
                },
                innerHTML: 
                    'The retirement fund contribution will be calculated as a percentage of the employee\'s earnings. ' + 
                    'The employee will contribute ' + 
                    lx.util.formatCurrency( providentFundData.employeeAmount ) + 
                    '% and the employer will contribute ' + 
                    lx.util.formatCurrency( providentFundData.employerAmount ) + 
                    '% of the following selected income items:'
            });
            
            // Display the retirment fund income items
            let rfiItemsEl = lx.createElement('DIV', {
                parent: fundContainerEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '15px 15px'
                    
                }
            });
            
            // Create retirment fund heading element
            lx.createElement('DIV', {
                parent: rfiItemsEl,
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    width: '480px',
                    height: '35px',
                    margin: '0px 0px 0px 0px',
                    // borderStyle: 'solid',
                    // borderWidth: '0px 0px 1px 0px',
                    // borderColor: '#DFDFDF'
                },
                innerHTML:
                    '<div style="width: 40px; margin: 0px 0px 0px 0px">Select</div>' +
                    '<div style="width: 320px; margin: 0px 0px 0px 10px">Income</div>' +
                    '<div style="text-align: right; width: 100px; margin: 0px 0px 0px 10px">Percentage</div>'
            });
            
            // For every retirment fund income item
            for( let j = 0; j < providentFundData.rfiItems.length; j++ ) {
                let percentage = '100.00';
                if( providentFundData.rfiItems[j].percentage !== null ) {
                    percentage = providentFundData.rfiItems[j].percentage;
                }
                
                let rfiItemData = {
                    id: providentFundData.rfiItems[j].id,
                    providentFundId: providentFundData.id,
                    payslipConfigItemId: providentFundData.rfiItems[j].payslipConfigItemId,
                    description: providentFundData.rfiItems[j].description,
                    percentage: percentage
                };
                
                // Add the new rfi item
                addRfiItem(providentFundIndex, rfiItemData, null, rfiItemsEl);
            }
        }
        else {
            // Display a message of how the provident fun contribution is calculated
            lx.createElement('DIV', {
                parent: fundContainerEl,
                style: {
                    boxSizing: 'border-box',
                    width: '100%',
                    padding: '15px 15px'
                    
                },
                innerHTML: 
                    'The retirement fund contribution is fixed at ' + 
                    lx.util.formatCurrency( providentFundData.employeeAmount ) + 
                    ' for the employee and ' + 
                    lx.util.formatCurrency( providentFundData.employerAmount ) + 
                    ' for the employer.'
            });
        }
    }
    
    // Function to add a retirement fund incomr item.
    //
    // providentFundIndex       The index of the provident fund for which to add the rfi item.
    // rfiItemData              The data for the retirment fund income item.
    // insertIndex              The index to insert the new retirement fund income item at. For example if the 
    //                          index is given as 3 then after inserting the new rule will be at index 3 and 
    //                          the rule previously at 3 will be at 4.
    function addRfiItem(providentFundIndex, rfiItemData, insertIndex, rfiItemContainerEl) {
        // Set styles depending wheter items have been added already for the specified provident fund
        let rfiItemMargin = '0px';
        for( let i = 0; i < providentFunds[providentFundIndex].rfiItems.length; i++ ) {
            if( providentFunds[providentFundIndex].rfiItems[i].providentFundId === rfiItemData.providentFundId ) {
                rfiItemMargin = '15px';
                break;
            }
        }
    
        // Create retirment fund income item element
        let rfiItemEl = lx.createElement('DIV', {
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '35px',
                margin: rfiItemMargin + ' 0px 0px 0px'
            }
        });
        
        // Create selectedCb component
        let selectedCb = new lx.component.Checkbox({
            renderTo: rfiItemEl,
            width: '40px',
            
            onChange: rfiItemSelectedCbOnChangeEventHandler
        });
        if( rfiItemData.id === null ) {
            selectedCb.setValue(false);
        }
        else {
            selectedCb.setValue(true);
        }
        
        // Create descriptionTxt component
        let descriptionDisplay = new lx.component.Display({
            renderTo: rfiItemEl,
            width: '320px',
            // flex: '1 1 auto',
            margin: '0px 0px 0px 10px'
        });
        descriptionDisplay.setValue(rfiItemData.description);
        
        // Create percentageTxt component
        let percentageTxt = new lx.component.Textbox({
            renderTo: rfiItemEl,
            width: '100px',
            margin: '0px 0px 0px 10px',
            textAlign: 'right',
            
            validators: [
                function(value) {
                    if( value === '' ) {
                        return 'The ' + rfiItemData.description + ' value should be between 0 and 100';
                    }
                    else if( parseInt(value) > 100 ) {
                        return 'The ' + rfiItemData.description + ' value should be between 0 and 100';
                    }
                    else if( parseInt(value) < 0 ) {
                        return 'The ' + rfiItemData.description + ' value should be between 0 and 100';
                    }
                    return true;
                }
            ],
            
            onChange: rfiItemPercentageTxtOnChangeEventHandler
        });
        percentageTxt.setValue(lx.util.formatCurrency( rfiItemData.percentage ));
        if( rfiItemData.id === null ) {
            percentageTxt.disable();
        }
        
        // Add the rule into the rulesContainerEl at given index.
        if( typeof insertIndex === 'undefined' || insertIndex === null || insertIndex >= providentFunds[providentFundIndex].rfiItems.length || insertIndex < 0 ) {
            rfiItemContainerEl.appendChild( rfiItemEl );
            
            // Add rule to the rules array
            providentFunds[providentFundIndex].rfiItems.push({
                id: rfiItemData.id,
                providentFundId: rfiItemData.providentFundId,
                payslipConfigItemId: rfiItemData.payslipConfigItemId,
                el: rfiItemEl,
                selectedCb: selectedCb,
                percentageTxt: percentageTxt
            });
        }
        else {
            rfiItemContainerEl.insertBefore(rfiItemEl, providentFunds[providentFundIndex].rfiItems[insertIndex].el);
            
            // Add rule to the rules array
            providentFunds[providentFundIndex].rfiItems.splice(insertIndex, 0, {
                id: rfiItemData.id,
                payslipConfigItemId: rfiItemData.payslipConfigItemId,
                el: rfiItemEl,
                selectedCb: selectedCb,
                percentageTxt: percentageTxt
            });
        }
    }
    
    // Function to set focus to a given rfi item
    function focusRfiItem( providentFundIndex, rfiItemIndex ) {
        if( rfiItemIndex < 0 || rfiItemIndex >= providentFunds[providentFundIndex].rfiItems.length ) return;
        
        providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.focus();
    }
    
    // Function to re-load a specified provident fund
    function loadProvidentFund( providentFundIndex ) {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getProvidentFund',
            data: {
                employeeId: config.employeeId,
                providentFundId: providentFunds[providentFundIndex].id
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Retirement Fund Failed',
                        message: result.error
                    });
                    
                    return;
                }
                
                // Create the specified provident fund
                createProvidentFundSection( providentFundIndex, result.providentFund );
            }
        });
    }
    
    // Function to load provident funds
    function loadProvidentFunds() {
        providentFunds = [];
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getProvidentFundList',
            data: {
                employeeId: config.employeeId
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Retirement Funds Failed',
                        message: result.error
                    });
                    
                    return;
                }
                
                // Add provident fund sections
                for( let i = 0; i < result.providentFunds.length; i++ ) {
                    // Save the provident fund details
                    providentFunds.push({
                        id: result.providentFunds[i].id,
                        name: result.providentFunds[i].name,
                        subscribeCb: null,
                        fundContainerEl: null,
                        rfiItems: []
                    });
                    let providentFundIndex = providentFunds.length - 1;
                    
                    // Create the specified provident fund
                    createProvidentFundSection( providentFundIndex, result.providentFunds[i] );
                }
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
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
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
                padding: '0px 15px 15px 15px'
            }
        });
        
        // Load leave types
        loadProvidentFunds();
        
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
    
    me.reloadPage = function() {
        providentFunds = [];
        contentContainerEl.innerHTML = '';
        // Load leave types
        loadProvidentFunds();
    };
    
    //
    // EVENT HANDLERS
    //
    
    // subscribeCb change event handler
    function subscribeCbChangeEventHandler( event ) {
        // Get the index of the selected item
        let providentFundIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            if( providentFunds[i].id === event.id ) {
                providentFundIndex = i;
                break;
            }
        }
        if( providentFundIndex === null ) return;
        
        // Was the provident fund selected?
        if( !providentFunds[providentFundIndex].subscribeCb.getValue() ) {
            // Add the rfi items, if any
            let rfiItems = [];
            for( let i = 0; i < providentFunds[providentFundIndex].rfiItems.length; i++ ) {
                // Was the rfi item selected?
                if( providentFunds[providentFundIndex].rfiItems[i].selectedCb.getValue() ) {
                    // Check if the percentage is valid
                    let percentage = providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue();
                    if( isNaN(providentFunds[providentFundIndex].rfiItems[i].percentageTxt.getValue()) ) {
                        new lx.component.Messagebox({
                            title: 'Retirement Fund Subscription Failed',
                            message: 'The specified income item percentage is not a valid number.'
                        });
                        
                        focusRfiItem( providentFundIndex, i );
                        return;
                    }
                    
                    // Add the rfi item
                    rfiItems.push({
                        payslipConfigItemId: providentFunds[providentFundIndex].rfiItems[i].payslipConfigItemId,
                        percentage: percentage
                    });
                }
            }
            
            // Subscribe the specified provident fund
            lx.sendJSON({
                url: 'exec.php?c=Employee&fn=subscribeProvidentFund',
                data: {
                    providentFundId: providentFunds[providentFundIndex].id,
                    employeeId: config.employeeId,
                    rfiItems: rfiItems
                },
                onSuccess: function( jsonResult ) {
                    var result = JSON.parse(jsonResult);
                    
                    // Check if the function was successful.
                    if( result.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Retirement Fund Subscription Failed',
                            message: result.error
                        });
                        
                        return;
                    }
                    
                    // Re-load the specified provident fund
                    loadProvidentFund( providentFundIndex );
                    
                    // Update earnings panel
                    config.mainPanel.getPanels().earningsPanel.reloadPage();
                }
            });
        }
        else {
            // Unsubscribe the specified provident fund
            lx.sendJSON({
                url: 'exec.php?c=Employee&fn=unsubscribeProvidentFund',
                data: {
                    providentFundId: providentFunds[providentFundIndex].id,
                    employeeId: config.employeeId
                },
                onSuccess: function( jsonResult ) {
                    var result = JSON.parse(jsonResult);
                    
                    // Check if the function was successful.
                    if( result.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Retirement Fund Unsubscription Failed',
                            message: result.error
                        });
                        
                        return;
                    }
                    
                    // Re-load the specified provident fund
                    loadProvidentFund( providentFundIndex );
                    
                    // Update earnings panel
                    config.mainPanel.getPanels().earningsPanel.reloadPage();
                }
            });
        }
    }
    
    // Retirement fund income item selecletedCb change event handler
    function rfiItemSelectedCbOnChangeEventHandler( event ) {
        // Get the index of the selected item
        let providentFundIndex = 0;
        let rfiItemIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            for( let j = 0; j < providentFunds[i].rfiItems.length; j++ ) {
                if( providentFunds[i].rfiItems[j].selectedCb === event.srcComponent ) {
                    providentFundIndex = i;
                    rfiItemIndex = j;
                    break;
                }
            }
        }
        if( rfiItemIndex === null ) return;
        
        // Was the rfi item selected?
        if( providentFunds[providentFundIndex].rfiItems[rfiItemIndex].selectedCb.getValue() === true ) {
            providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.enable();
            focusRfiItem(providentFundIndex, rfiItemIndex);
        }
        else {
            providentFunds[providentFundIndex].rfiItems[rfiItemIndex].percentageTxt.disable();
        }
        
        // Update the rfi items
        updateRfiItems( providentFundIndex );
    }
    
    // Retirement fund income item percentageTxt change event handler
    function rfiItemPercentageTxtOnChangeEventHandler( event ) {
        // Get the index of the selected item
        let providentFundIndex = 0;
        let rfiItemIndex = null;
        for( let i = 0; i < providentFunds.length; i++ ) {
            for( let j = 0; j < providentFunds[i].rfiItems.length; j++ ) {
                if( providentFunds[i].rfiItems[j].percentageTxt === event.srcComponent ) {
                    providentFundIndex = i;
                    rfiItemIndex = j;
                    if (providentFunds[i].rfiItems[j].percentageTxt.getValue() === '') {
                        providentFunds[i].rfiItems[j].percentageTxt.validate();
                        if (providentFunds[i].rfiItems[j].percentageTxt.validate() !== true) {
                            return;
                        }
                        
                    }
                    break;
                }
            }
        }
        if( rfiItemIndex === null ) return;
        
        // Update the rfi items
        updateRfiItems( providentFundIndex );
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};