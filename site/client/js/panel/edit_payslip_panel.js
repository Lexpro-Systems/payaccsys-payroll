/* globals app, lx */
'use strict';

// EDIT PAYSLIP PANEL
//
// Config:
//  renderTo            The parent DOM object of this component.
//  width               Set width of the element. Ex. 100px 100% etc. Defaults to 100%
//  minWidth            Set the minimum width of the component.
//  maxWidth            Set the maximum width of the component.
//  margin              The components margins
//  flex                Set the CSS flexGrow value of this component.
//
// Events:
//  onChange            This event is fired when the value of the component changed.
//  onItemAdd           This event is fired when the 'Add Item' menu it is clicked.
//  onDelete            This event is fired when the 'Remove Payslip' menu it is clicked.
app.panel.EditPayslip = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var items = null;
    var deletedItems = null;
    var employeeId = null;
    var employeeName = null;
    var employeeAge = null;
    var employeePaymentDay = null;
    var payslipId = null;
    var deletePayslip = null;
    var payslipStatusCode = null;
    var payslipFromDate = null;
    var payslipToDate = null;
    var payslipTaxPeriod = null;
    
    var el = null;
    var itemContainerEl = null;
    var statusEl = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to get the item index given the main element or any child of the main element of an item
    function getItemIndexFromElement( element ) {
        // Go through all elements and parent element unitil a child of itemContainerEl was found.
        while( element !== null && element.parentElement !== itemContainerEl ) element = element.parentElement;
        
        // Get the index of the item
        for( var i = 0; i < items.length; i++ ) if( items[i].el === element ) return i;
        
        return null;
    }
    
    // Function to update the status icon color
    function updateStatus() {
        var complete = true;
        
        for( var i = 0; i < items.length; i++ ) {
            if( items[i].amountTxt.getValue() === '' || isNaN(lx.util.parseCurrency(items[i].amountTxt.getValue())) ) {
                complete = false;
                break;
            }
        }
        
        if( complete === true ) {
            statusEl.style.backgroundColor = '#45A517';
        }
        else {
            statusEl.style.backgroundColor = '#FA8B42';
        }
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize defaults
        var compConfig = {
            renderTo: null,
            width: '100%',
            minWidth: '',
            maxWidth: '',
            margin: '0px',
            flex: '0 0 auto'
        };
        
        // Read Config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var prop in config ) {
                if( config.hasOwnProperty(prop) ) compConfig[prop] = config[prop];
            }
        }
        
        // Renderto can not be null
        if( compConfig.renderTo === null ) {
            console.log('lx.component.PayslipEditor : ERROR : renderTo config can not be null or undefined');
            return;
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onChange') ) me.addEventListener('change', compConfig.onChange);
        if( compConfig.hasOwnProperty('onItemAdd') ) me.addEventListener('itemadd', compConfig.onItemAdd);
        if( compConfig.hasOwnProperty('onDelete') ) me.addEventListener('delete', compConfig.onDelete);
        if( compConfig.hasOwnProperty('onRecreate') ) me.addEventListener('recreate', compConfig.onRecreate);
        
        // Initalize state
        items = [];
        deletedItems = [];
        
        // Store payslip and employee details
        deletePayslip = false;
        payslipId = compConfig.payslip.id;
        employeeId = compConfig.payslip.employee.id;
        employeeName = compConfig.payslip.employee.name;
        employeeAge = compConfig.payslip.employee.age;
        employeePaymentDay = compConfig.payslip.employee.paymentPeriodEndDay;
        payslipFromDate = compConfig.payslip.fromDate;
        payslipStatusCode = compConfig.payslip.statusCode;
        payslipToDate = compConfig.payslip.toDate;
        payslipTaxPeriod = {
            type: compConfig.payslip.taxPeriod.type,
            number: compConfig.payslip.taxPeriod.number,
            taxYear: compConfig.payslip.taxPeriod.taxYear,
        };
        
        // Create component div
        el = document.createElement('DIV');
        el.className = 'component-flex-column component-flex-align-stretch';
        el.style.boxSizing = 'border-box';
        el.style.width = compConfig.width;
        el.style.maxWidth = compConfig.maxWidth;
        el.style.minWidth = compConfig.minWidth;
        el.style.backgroundColor = '#FFFFFF';
        el.style.borderStyle = 'solid';
        el.style.borderColor = '#DFDFDF';
        el.style.borderWidth = '1px';
        el.style.flex = compConfig.flex;
        el.style.position = 'relative';
        el.style.margin = compConfig.margin;
        
        var headingPadding = '5px 15px 5px 15px';
        if( !compConfig.isProcessed ) {
            headingPadding = '5px 3px 5px 15px';
        }
        
        // Create the heading element
        var headingEl = document.createElement('DIV');
        headingEl.className = 'component-flex-row component-flex-align-center';
        headingEl.style.padding = headingPadding;
        headingEl.style.fontSize = '16px';
        headingEl.style.minHeight = '35px';
        headingEl.style.borderStyle = 'solid';
        headingEl.style.borderColor = '#DFDFDF';
        headingEl.style.borderWidth = '0px 0px 1px 0px';
        headingEl.innerHTML =
            '<div style="margin: 0px 0px 0px 15px;">' + employeeName + '</div>' +
            '<div style="font-size: 12px; margin: 0px 0px 0px auto;">' + payslipFromDate +
            ' &nbsp;to&nbsp; ' + payslipToDate + '</div>';
        el.appendChild( headingEl );
        
        // Create the statusEl element
        statusEl = document.createElement('DIV');
        statusEl.style.width = '10px';
        statusEl.style.height = '10px';
        statusEl.style.borderRadius = '50%';
        statusEl.style.backgroundColor = '#FFFFFF';
        headingEl.insertBefore(statusEl, headingEl.firstChild);
        
        // Has the paylsip not been processed?
        if( !compConfig.isProcessed ) {
            // Create the menu dropdown button
            var menuDropdownBtn = new lx.component.DropdownButton({
                renderTo: headingEl,
                margin: '0px 0px 0px 8px',
                label: '<i class="fa fa-ellipsis-v"></i>',
                dropdownAlignment: 'right'
            });
            
            // Create the menuDropDownBtnAddEl element
            var menuDropDownBtnAddEl = lx.createElement('DIV', {
                parent: menuDropdownBtn.getContainer(),
                className: 'list-item',
                style: {
                    width: '140px',
                    padding: '8px 10px',
                    borderStyle: 'solid',
                    borderWidth: '0px 0px 0px 3px'
                },
                innerHTML: '<i class="fa fa-fw fa-plus" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Add Item</span>'
            });
            menuDropDownBtnAddEl.addEventListener('click', menuDropDownBtnAddElClickEventHandler);
            
            // Create the menuDropDownBtnRecreateEl element
            var menuDropDownBtnRecreateEl = lx.createElement('DIV', {
                parent: menuDropdownBtn.getContainer(),
                className: 'list-item',
                style: {
                    width: '140px',
                    padding: '8px 10px',
                    borderStyle: 'solid',
                    borderWidth: '0px 0px 0px 3px'
                },
                innerHTML: '<i class="fa fa-fw fa-undo" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Recreate Items</span>'
            });
            menuDropDownBtnRecreateEl.addEventListener('click', menuDropDownBtnRecreateElClickEventHandler);
            
            // Create the menuDropDownBtnDeleteEl element
            var menuDropDownBtnDeleteEl = lx.createElement('DIV', {
                parent: menuDropdownBtn.getContainer(),
                className: 'list-item',
                style: {
                    width: '140px',
                    padding: '8px 10px',
                    borderStyle: 'solid',
                    borderWidth: '0px 0px 0px 3px'
                },
                innerHTML: '<i class="fa fa-fw fa-times" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Remove Payslip</span>'
            });
            menuDropDownBtnDeleteEl.addEventListener('click', menuDropDownBtnDeleteElClickEventHandler);
            
        }
        
        // Create the itemContainerEl element
        itemContainerEl = document.createElement('DIV');
        itemContainerEl.style.padding = '5px 7px 5px 15px';
        el.appendChild( itemContainerEl );
        
        // Create all items
        me.addItems( compConfig.payslip.items, compConfig.isProcessed );
        
        // Add the component to its renderTo target.
        compConfig.renderTo.appendChild( el );
    };
    
    // Function to set focus to the component
    me.focus = function() {
    };
    
    // Function to show or hide the component
    me.show = function() {
        el.style.display = 'block';
    };
    me.hide = function() {
        el.style.display = 'none';
    };
    
    // Function to get the payslip id
    me.getPayslipId = function() {
        return payslipId;
    };
    
    // Function to get the employee id
    me.getEmployeeId = function() {
        return employeeId;
    };
    
    // Function to get the payslip from date
    me.getEmployeeName = function() {
        return employeeName;
    };
    
    // Function to get the payslip status code
    me.getStatusCode = function() {
        return payslipStatusCode;
    };
    
    // Function to get the payslip from date
    me.getFromDate = function() {
        return payslipFromDate;
    };
    
    // Function to get the payslip to date
    me.getToDate = function() {
        return payslipToDate;
    };
    
    // Function to get the amount of items
    me.getItemCount = function() {
        return items.length;
    };
    
    // Function to get the amount of items
    me.deletePayslip = function() {
        // Mark the selected payslip as deleted
        deletePayslip = true;
        payslipStatusCode = 'DELE';
        
        // Hide the selected payslip panel
        el.style.display = 'none';
    };
    
    // Function to get the amount of items
    me.restorePayslip = function() {

        // Mark the selected payslip as deleted
        deletePayslip = false;
        payslipStatusCode = 'ACTI';
        
        // Hide the selected payslip panel
        el.style.display = 'block';
    };
    
    // Function to add one or more items.
    //
    // newItems         An array of item objects
    //
    //                  item = {
    //                      id: 1,
    //                      category: {
    //                          code: items[i].category.code
    //                      },
    //                      type: {
    //                          code: '1000',
    //                          unitCode: 'FIXE'
    //                      },
    //                      providentFund: {
    //                          id: null,
    //                          employeeAmount: null,
    //                          employerAmount: null,
    //                          rfiItems: []
    //                      },
    //                      loan: {
    //                          id: null
    //                      },
    //                      units: null,
    //                      rate: null,
    //                      amount: 2000
    //                  }
    me.addItems = function( newItems, isProcessed ) {
        var newItem = null;
        for( var i = 0; i < newItems.length; i++ ) {
            // Create the new item
            newItem = {
                id: newItems[i].id,
                category: {
                    code: newItems[i].category.code
                },
                type: {
                    code: newItems[i].type.code,
                    unitCode: newItems[i].type.unitCode
                },
                providentFund: {
                    id: newItems[i].providentFund.id,
                    employeeAmount: newItems[i].providentFund.employeeAmount,
                    employerAmount: newItems[i].providentFund.employerAmount,
                    rfiItems: newItems[i].providentFund.rfiItems
                },
                loan: {
                    id: newItems[i].loan.id
                },
                el: null,
                description: '',
                autoCalculate: false,
                unitsTxt: null,
                rateTxt: null,
                amountTxt: null,
                includeInNettPay: null
            };
            
            // Create the item element
            newItem.el = document.createElement('DIV');
            newItem.el.className = 'flex-row flex-align-center';
            newItem.el.style.padding = '4px 0px';
            itemContainerEl.appendChild( newItem.el );
            
            // Create the item label
            var itemLabelEl = document.createElement('DIV');
            itemLabelEl.className = 'flex-resize';
            itemLabelEl.innerHTML = newItems[i].description;
            newItem.el.appendChild( itemLabelEl );
            newItem.description = newItems[i].description;
            
            newItem.autoCalculate = newItems[i].autoCalculate;
            newItem.includeInNettPay = newItems[i].includeInNettPay;
            
            var itemUnitsLabelEl = null;
            var itemRateLabelEl = null;
            var createUnits = false;
            var itemUnitsLabelText = '';
            var itemRateLabelText = '';
            
            if( newItems[i].type.unitCode === 'PHOU' ) {
                createUnits = true;
                itemUnitsLabelText = 'hours @';
                itemRateLabelText = 'per hour';
            }
            else if( newItems[i].type.unitCode === 'PDAY' ) {
                createUnits = true;
                itemUnitsLabelText = 'days @';
                itemRateLabelText = 'per day';
            }
            else if( newItems[i].type.unitCode === 'PKIL' ) {
                createUnits = true;
                itemUnitsLabelText = 'km @';
                itemRateLabelText = 'per km';
            }
            
            if( createUnits === true ) {
                newItem.unitsTxt = new lx.component.Textbox({
                    renderTo: newItem.el,
                    width: '80px',
                    label: null,
                    textAlign: 'right',
                    
                    onChange: itemUnitTxtChangeEventHandler
                });
                
                // Disable the text box if the payrun has been processed
                if( isProcessed ) {
                    newItem.unitsTxt.disable();
                }
                
                itemUnitsLabelEl = document.createElement('DIV');
                itemUnitsLabelEl.style.whiteSpace = 'nowrap';
                itemUnitsLabelEl.style.fontSize = '14px';
                itemUnitsLabelEl.style.padding = '0px 10px';
                itemUnitsLabelEl.style.width = '55px';
                itemUnitsLabelEl.style.flex = '0 0 auto';
                itemUnitsLabelEl.innerHTML = itemUnitsLabelText;
                newItem.el.appendChild( itemUnitsLabelEl );
                
                newItem.rateTxt = new lx.component.Textbox({
                    renderTo: newItem.el,
                    margin: '0px 8px 0px 0px',
                    width: '70px',
                    label: null,
                    textAlign: 'right',
                    
                    onChange: itemRateTxtChangeEventHandler
                });
                
                // Disable the text box if the payrun has been processed
                if( isProcessed ) {
                    newItem.rateTxt.disable();
                }
                
                itemRateLabelEl = document.createElement('DIV');
                itemRateLabelEl.style.whiteSpace = 'nowrap';
                itemRateLabelEl.style.fontSize = '14px';
                itemRateLabelEl.style.padding = '0px 10px';
                itemRateLabelEl.style.width = '55px';
                itemRateLabelEl.style.flex = '0 0 auto';
                itemRateLabelEl.innerHTML = itemRateLabelText;
                newItem.el.appendChild( itemRateLabelEl );
            }
            
            // Create the item amount textbox
            newItem.amountTxt = new lx.component.Textbox({
                renderTo: newItem.el,
                margin: '0px 8px 0px 0px',
                width: '120px',
                label: null,
                textAlign: 'right',
                
                onChange: itemAmountTxtChangeEventHandler
            });
            
            // Disable the amount textbox if the payrun has been processed or the amount is
            // calculated automatically
            if( isProcessed || newItem.autoCalculate ) {
                newItem.amountTxt.disable();
            }
            
            // Set textbox values
            if( createUnits === true ) {
                if( newItems[i].units !== null ) newItem.unitsTxt.setValue( newItems[i].units );
                if( newItems[i].rate !== null ) newItem.rateTxt.setValue( lx.util.formatCurrency(newItems[i].rate) );
                if( newItems[i].amount !== null ) newItem.amountTxt.setValue( lx.util.formatCurrency(newItems[i].amount) );
            }
            else {
                if( newItems[i].amount !== null ) newItem.amountTxt.setValue( lx.util.formatCurrency(newItems[i].amount) );
            }
            
            // Create the deleteEl element (only if the payrun has not been processed)
            if( !isProcessed ) {
                var deleteEl = document.createElement('DIV');
                deleteEl.className = 'flex-noresize';
                deleteEl.style.height = '30px';
                deleteEl.style.textAlign = 'center';
                deleteEl.style.lineHeight = '30px';
                deleteEl.style.margin = '0px 0px 0px 0px';
                deleteEl.style.padding = '0px 8px 0px 7px';
                deleteEl.style.cursor = 'pointer';
                deleteEl.innerHTML = '<i class="fa fa-fw fa-times"></i>';
                deleteEl.addEventListener('click', deleteElChangeEventHandler);
                newItem.el.appendChild( deleteEl );
                
                items.push( newItem );
            }
        }
        
        updateStatus();
    };
    
    // Function to replace all items with new items
    me.replaceItems = function( newItems ) {
        // Mark all items as deleted
        for( let i = 0; i < items.length; i++ ) {
            // Should the item be deleted?
            if( items[i].id !== null ) {
                deletedItems.push( items[i] );
            }
        }
        
        // Clear all the pasylip items
        items = [];
        
        // Clear the item container
        itemContainerEl.innerHTML = '';
        
        // Add the new items
        me.addItems( newItems );
        
        // Update the item calculations
        me.fireEvent('change', {srcComponent: me});
        updateStatus();
    };
    
    // Function to get an item from its index
    me.getItem = function(index) {
        if( index < 0 || index >= items.length ) return null;
        
        var returnObject = {
            category: {
                code: items[index].category.code
            },
            type: {
                code: items[index].type.code,
                unitCode: items[index].type.unitCode
            },
            providentFund: {
                id: items[index].providentFund.id,
                employeeAmount: items[index].providentFund.employeeAmount,
                employerAmount: items[index].providentFund.employerAmount,
                rfiItems: items[index].providentFund.rfiItems
            },
            loan: {
                id: items[index].loan.id
            },
            description: items[index].description,
            accrualDate: null,
            autoCalculate: items[index].autoCalculate,
            units: null,
            rate: null,
            amount: null,
            includeInNettPay: items[index].includeInNettPay
        };
            
        if( items[index].unitsTxt !== null && items[index].unitsTxt.getValue() !== '' ) returnObject.units = lx.util.parseCurrency(items[index].unitsTxt.getValue());
        if( items[index].rateTxt !== null && items[index].rateTxt.getValue() !== '' ) returnObject.rate = lx.util.parseCurrency(items[index].rateTxt.getValue());
        if( items[index].amountTxt !== null && items[index].amountTxt.getValue() !== '' ) returnObject.amount = lx.util.parseCurrency(items[index].amountTxt.getValue());
        
        return returnObject;
    };
    
    // Function to update an item given its index
    me.updateItem = function(index, description, units, rate, amount) {
        if( index < 0 || index >= items.length ) return;
        
        if( items[index].unitsTxt !== null ) {
            if( units !== null ) items[index].unitsTxt.setValue( units );
            else items[index].unitsTxt.setValue('');
        }
        if( items[index].rateTxt !== null ) {
            if( rate !== null ) items[index].rateTxt.setValue( lx.util.formatCurrency(rate) );
            else items[index].rateTxt.setValue('');
        }
        if( items[index].amountTxt !== null ) {
            if( amount !== null ) items[index].amountTxt.setValue( lx.util.formatCurrency(amount) );
            else items[index].amountTxt.setValue('');
        }
        
        updateStatus();
    };
    
    // Function to check whether a payslip is complete
    me.isComplete = function() {
        var complete = true;
        
        for( var i = 0; i < items.length; i++ ) {
            if( items[i].amountTxt.getValue() === '' || isNaN(lx.util.parseCurrency(items[i].amountTxt.getValue())) ) {
                complete = false;
                break;
            }
        }
        
        return complete;
    };
    
    // Function to check whether a payslip is empty
    me.isEmpty = function() {
        var empty = true;
        
        if( items.length > 0 ) empty = false;
        
        return empty;
    };
    
    // Function to create an object representation of the payslip informat
    me.toObject = function() {
        var returnObject = {
            id: payslipId,
            delete: deletePayslip,
            statusCode: payslipStatusCode,
            fromDate: payslipFromDate,
            toDate: payslipToDate,
            employee: {
                id: employeeId,
                name: employeeName,
                age: employeeAge,
                paymentPeriodEndDay: employeePaymentDay
            },
            taxPeriod: {
                type: payslipTaxPeriod.type,
                number: payslipTaxPeriod.number,
                taxYear: payslipTaxPeriod.taxYear
            },
            items: []
        };
        
        var newItem = null;
        
        // Add non deleted items.
        for( let i = 0; i < items.length; i++ ) {
            newItem = {
                id: items[i].id,
                category: {
                    code: items[i].category.code
                },
                type: {
                    code: items[i].type.code,
                    unitCode: items[i].type.unitCode
                },
                providentFund: {
                    id: items[i].providentFund.id,
                    employeeAmount: items[i].providentFund.employeeAmount,
                    employerAmount: items[i].providentFund.employerAmount,
                    rfiItems: items[i].providentFund.rfiItems
                },
                loan: {
                    id: items[i].loan.id
                },
                description: items[i].description,
                accrualDate: null,
                autoCalculate: items[i].autoCalculate,
                units: null,
                rate: null,
                amount: null,
                includeInNettPay: items[i].includeInNettPay
            };
            
            if( items[i].unitsTxt !== null && items[i].unitsTxt.getValue() !== '' ) newItem.units = lx.util.parseCurrency(items[i].unitsTxt.getValue());
            if( items[i].rateTxt !== null && items[i].rateTxt.getValue() !== '' ) newItem.rate = lx.util.parseCurrency(items[i].rateTxt.getValue());
            if( items[i].amountTxt !== null && items[i].amountTxt.getValue() !== '' ) newItem.amount = lx.util.parseCurrency(items[i].amountTxt.getValue());
            
            returnObject.items.push( newItem );
        }
        
        // Add deleted items
        for( let i = 0; i < deletedItems.length; i++ ) {
            newItem = {
                id: deletedItems[i].id,
                category: {
                    code: deletedItems[i].category.code
                },
                type: {
                    code: deletedItems[i].type.code,
                    unitCode: deletedItems[i].type.unitCode
                },
                providentFund: {
                    id: deletedItems[i].providentFund.id,
                    employeeAmount: deletedItems[i].providentFund.employeeAmount,
                    employerAmount: deletedItems[i].providentFund.employerAmount,
                    rfiItems: deletedItems[i].providentFund.rfiItems
                },
                loan: {
                    id: deletedItems[i].loan.id
                },
                description: '',
                accrualDate: null,
                autoCalculate: false,
                units: null,
                rate: null,
                amount: null,
                includeInNettPay: false
            };
            
            if( deletedItems[i].unitsTxt !== null && deletedItems[i].unitsTxt.getValue() !== '' ) {
                newItem.units = lx.util.parseCurrency(deletedItems[i].unitsTxt.getValue());
            }
            if( deletedItems[i].rateTxt !== null && deletedItems[i].rateTxt.getValue() !== '' ) {
                newItem.rate = lx.util.parseCurrency(deletedItems[i].rateTxt.getValue());
            }
            if( deletedItems[i].amountTxt !== null && deletedItems[i].amountTxt.getValue() !== '' ) {
                newItem.amount = lx.util.parseCurrency(deletedItems[i].amountTxt.getValue());
            }
            
            // Mark the item as deleted
            newItem['delete'] = true;
            
            returnObject.items.push( newItem );
        }
        
        return returnObject;
    };
    
    // Function to update payslip items
    me.updateItems = function() {
        let payslip = me.toObject();
        
        // Update the payslip items
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=calculatePayslipItems',
            data: {
                payslip: payslip
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Calculating Payslip Items Failed',
                        message: response.error
                    });
                }
                
                for( let i = 0; i < response.payslips.length; i++ ) {
                    let payslipIndex = null;
                    if( payslip.id ==  response.payslips[i].id ) {
                        payslipIndex = i;
                    }
                    
                    if( payslipIndex === null ) continue;
                    
                    for( let i = 0; i < response.payslips[payslipIndex].items.length; i++ ) {
                        me.updateItem(i, '', response.payslips[payslipIndex].items[i].units, response.payslips[payslipIndex].items[i].rate, response.payslips[payslipIndex].items[i].amount);
                    }
                }
            }
        });
    };
    
    // Function to destroy the component
    me.destroy = function() {
        me = null;
        el.parentNode.removeChild( el );
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // itemUnitTxt change event handler
    function itemUnitTxtChangeEventHandler( event ) {
        var itemIndex = null;
        
        for( var i = 0; i < items.length; i++ ) {
            if( items[i].unitsTxt !== null && items[i].unitsTxt === event.srcComponent ) {
                itemIndex = i;
                break;
            }
        }
        
        if( items[itemIndex].unitsTxt.getValue() === null || items[itemIndex].unitsTxt.getValue() === '' ) {
            items[itemIndex].amountTxt.setValue('');
            return;
        }
        
        if( items[itemIndex].rateTxt.getValue() === null || items[itemIndex].rateTxt.getValue() === '' ) {
            items[itemIndex].amountTxt.setValue('');
            return;
        }
        
        var value = lx.util.formatCurrency(parseFloat(items[itemIndex].unitsTxt.getValue()) * lx.util.parseCurrency(items[itemIndex].rateTxt.getValue()));
        items[itemIndex].amountTxt.setValue( value );
        
        // Fire the onchange event
        me.fireEvent('change', {srcComponent: me});
        updateStatus();
    }
    
    // itemRateTxt change event handler
    function itemRateTxtChangeEventHandler( event ) {
        var itemIndex = null;
        
        for( var i = 0; i < items.length; i++ ) {
            if( items[i].rateTxt !== null && items[i].rateTxt === event.srcComponent ) {
                itemIndex = i;
                break;
            }
        }
        
        if( items[itemIndex].unitsTxt.getValue() === null || items[itemIndex].unitsTxt.getValue() === '' ) {
            items[itemIndex].amountTxt.setValue('');
            return;
        }
        
        if( items[itemIndex].rateTxt.getValue() === null || items[itemIndex].rateTxt.getValue() === '' ) {
            items[itemIndex].amountTxt.setValue('');
            return;
        }
        
        var value = lx.util.formatCurrency(parseFloat(items[itemIndex].unitsTxt.getValue()) * lx.util.parseCurrency(items[itemIndex].rateTxt.getValue()));
        items[itemIndex].amountTxt.setValue( value );
        
        // Fire the onchange event
        me.fireEvent('change', {srcComponent: me});
        updateStatus();
    }
    
    // itemAmountTxt change event handler
    function itemAmountTxtChangeEventHandler( event ) {
        var itemIndex = null;
        for( var i = 0; i < items.length; i++ ) {
            if( items[i].amountTxt !== null && items[i].amountTxt === event.srcComponent ) {
                itemIndex = i;
                break;
            }
        }
        
        var rate = null;
        if( items[itemIndex].rateTxt !== null && items[itemIndex].rateTxt.getValue() !== '' ) rate = lx.util.parseCurrency(items[itemIndex].rateTxt.getValue());
        
        var amount = null;
        if( items[itemIndex].amountTxt !== null && items[itemIndex].amountTxt.getValue() !== '' ) amount = lx.util.parseCurrency(items[itemIndex].amountTxt.getValue());
        if( isNaN(amount) ) amount = null;
        
        if( items[itemIndex].unitsTxt !== null ) {
            if( rate !== null && amount !== null ) items[itemIndex].unitsTxt.setValue( amount / rate );
            else items[itemIndex].unitsTxt.setValue('');
        }
        
        // Format the amount entered
        if( amount !== null ) items[itemIndex].amountTxt.setValue( lx.util.formatCurrency( amount ) );
        
        // Fire the onchange event
        me.fireEvent('change', {srcComponent: me});
        updateStatus();
    }
    
    // deleteEl click event handler
    function deleteElChangeEventHandler( event ) {
        var itemIndex = getItemIndexFromElement(event.currentTarget);
        
        // Don't display the item
        itemContainerEl.removeChild(items[itemIndex].el);
        
        // Should the item be deleted?
        if( items[itemIndex].id !== null ) {
            deletedItems.push( items[itemIndex] );
        }
        
        // Remove the item from the array
        items.splice(itemIndex, 1);
        
        me.fireEvent('change', {srcComponent: me});
        updateStatus();
    }
    
    // menuDropDownBtnAddEl click event handler
    function menuDropDownBtnAddElClickEventHandler() {
        // Create a modal window
        var addItemModal = new lx.component.ModalWindow({
            height: '100%',
            maxWidth: '430px',
            maxHeight: '515px',
            margin: '40px'
        });
        
        // Create the addPayslipItem component
        var addPayslipItem = new app.panel.AddPayslipItem({
            renderTo: addItemModal.getContainer(),
            show: true,
            payslipFromDate: payslipFromDate,
            payslipToDate: payslipToDate,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function( event ) {
                //console.log('edit_payslip_panel ', event);
                app.route.popState();
                me.addItems( event.items );
                me.fireEvent('itemadd', {srcComponent: me});
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addItemModal.addEventListener('destroy', function() {
            addPayslipItem.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addItemModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addItemModal.show();
        addPayslipItem.focus();
    }
    
    // menuDropDownBtnDeleteEl click event handler
    function menuDropDownBtnDeleteElClickEventHandler() {
        new lx.component.Messagebox({
            title: 'Remove payslip',
            message: 'Are you certain you wish to remove the selected payslip for \'' + employeeName + '\' and all its items.',
            buttons: [
                {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                {name: 'delete', label: 'Remove', isDefault: true}
            ],
            onClose: function( event ) {
                if( event.button === 'delete' ) {
                    // Fire the delete event
                    me.fireEvent('delete', {srcComponent: me, payslipId: payslipId});
                }
            }
        });
    }
    
    // menuDropDownBtnRecreateEl click event handler
    function menuDropDownBtnRecreateElClickEventHandler() {
        new lx.component.Messagebox({
            title: 'Recreate payslip items',
            message: 'The items of the selected payslip for \'' + employeeName + '\' will be removed and recreated. Are you certain you wish to continue?',
            buttons: [
                {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                {name: 'recreate', label: 'Recreate', isDefault: true}
            ],
            onClose: function( event ) {
                if( event.button === 'recreate' ) {
                    // Fire the recreate event
                    me.fireEvent('recreate', {srcComponent: me, payslipId: payslipId});
                }
            }
        });
    }
    
    // Init the menu
    me.init( config );
};