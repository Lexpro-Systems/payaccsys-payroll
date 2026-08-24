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
app.panel.EditPayslip = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var items = null;
    var payrunPayslips = null;
    var payrunId = null;
    var deletedItems = null;
    var isEncrypted = null;
    var availableODBalance = null;
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
    var lockIconEl = null;
    var el = null;
    var itemContainerEl = null;
    var statusEl = null;
    var nameContainer = null;
    var dateContainer = null;


    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PRIVATE FUNCTIONS
    //

    // Function to get the item index given the main element or any child of the main element of an item
    function getItemIndexFromElement(element) {
        // Go through all elements and parent element unitil a child of itemContainerEl was found.
        while (element !== null && element.parentElement !== itemContainerEl) element = element.parentElement;

        // Get the index of the item
        for (var i = 0; i < items.length; i++) if (items[i].el === element) return i;

        return null;
    }

    // Function to update the status icon color
    function updateStatus() {
        var complete = true;

        for (var i = 0; i < items.length; i++) {
            // Remove comma if exists
            // if (items[i].amountTxt.getValue().length > 0) {
            //     let cleanValue;
            //     cleanValue = Number(items[i].amountTxt.getValue().replace(/[^0-9\-.]+/g, ''));
            //     items[i].amountTxt.setValue(cleanValue);
            // }

            if (items[i].amountTxt.getValue() === '' || isNaN(lx.util.parseCurrency(items[i].amountTxt.getValue()))) {
                complete = false;
                break;
            }
        }

        if (complete === true) {
            statusEl.style.backgroundColor = '#45A517';
        }
        else {
            statusEl.style.backgroundColor = '#FA8B42';
        }
    }

    // Function to display the lock icon if user clicks Encryption
    function updateEncryptionIcon() {
        lockIconEl.style.display = isEncrypted ? 'inline-block' : 'none';
    }

    // Function to adjust the running Over Deduction Balance, by including balances in prior payslips in current (unprocessed) payrun

    function calculateCurrentPayrunODCreditBalAdjustment(employeeId, currentPayslip) {

        // Debugging:
        // console.log("Current payslip:", currentPayslip);
        // console.log("Index in array:", payrunPayslips.indexOf(currentPayslip));
        // console.log("Array length:", payrunPayslips.length);
        // console.log(payrunPayslips.includes(me));

        var adjustment = 0;

        // Stop at current payslip
        var currentIndex = payrunPayslips.indexOf(currentPayslip);

        for (var i = 0; i < currentIndex; i++) {

            var payslipPanel = payrunPayslips[i];

            if (!payslipPanel || typeof payslipPanel.getItem !== 'function') continue;


            // Only for current employee
            if (Number(payslipPanel.getEmployeeId()) !== Number(employeeId)) continue;

            var index = 0;
            var item = null;

            while ((item = payslipPanel.getItem(index)) !== null) {

                if (!item.type || !item.type.code) {
                    index++;
                    continue;
                }

                //var amount = item.amount !== null ? item.amount : 0; //This line doesn't allow for textbox values that aren't saved yet
                //Rather:

                var amount = 0;

                if (item.amountTxt && item.amountTxt.getValue() !== '') {
                    amount = Math.abs(lx.util.parseCurrency(item.amountTxt.getValue())) || 0;
                }
                else if (item.amount !== null && item.amount !== undefined) {
                    amount = Math.abs(item.amount);
                }


                // PAYE Over Deduction credit
                if (item.type.code === '2001' && item.description === 'PAYE Over Deduction') {
                    adjustment += amount;
                }

                // PAYE OD debit
                if (item.type.code === '2010') {
                    adjustment -= amount;
                }

                index++;
            }

        }

        // console.log("Payslip order:",
        // payrunPayslips.map(p => p.getToDate())
        // );

        return adjustment;
    }

    function getRemainingODBalance() {

        if (availableODBalance === null) return 0;

        var totalDebits = 0;

        // Loop to get total of all OD Debit items added to one payslip
        for (var i = 0; i < items.length; i++) {

            var item = items[i];

            if (!item.type || item.type.code !== '2010') continue;

            var value = lx.util.parseCurrency(item.amountTxt.getValue()) || 0;

            totalDebits += value;
        }
        //remaing balance, after od debit items were added to same payslip
        return availableODBalance - totalDebits;
    }

    // Function to allow all edit payslip panels to refresh their OD balance
    function refreshODBalances() {

        for (var i = 0; i < payrunPayslips.length; i++) {

            let panel = payrunPayslips[i]; //to ensure each panel only references itself

            if (!panel || typeof panel.getTotalODBalance !== 'function') continue; //skip if panel is null or doesn't support OD balance calculation

            panel.getTotalODBalance(function (balance) {
                if (typeof panel.setAvailableODBalance === 'function') {
                    panel.setAvailableODBalance(balance);
                }
            });
        }
    }


    // (Updated) Function to add validation to OD debit items to ensure debit value doesn't exceed available credit
    // Fires on 'change' and called in additem to ensure validation takes place during edit and add events
    // Receives amount entered in textbox, to ensure correct value is validated
    function validateODDebit(item, enteredAmount) {

        if (!item.amountTxt) return;

        // Use enteredAmount if available, otherwise read from textbox
        var entered = enteredAmount;
        if (entered === undefined || entered === null) {
            entered = Math.abs(lx.util.parseCurrency(item.amountTxt.getValue())) || 0; //Prevents NaN cases if value entered is empty string or other characters
        }
        //Recalculate base balance first, then get entered value
        getTotalODBalance(function (balance) {
            availableODBalance = balance;

            var remaining = getRemainingODBalance() + entered; //including current value entered in textbox

            //Debugging:
            // console.log("validating: balance, entered, remaining", balance, entered, remaining);

            if (entered > remaining) {
                new lx.component.Messagebox({
                    title: 'Invalid Amount',
                    message: 'Cannot exceed remaining credit of R ' + remaining.toFixed(2) + '.',
                    onClose: function () {

                        item.amountTxt.setValue(
                            lx.util.formatCurrency(remaining)
                        );

                        item.amountTxt.focus();
                    }
                });
            }
        });

    }

    // Create Over Deduction Debit item to be added to payslip
    // To use in useOverDeductionCreditEventHandler function
    function createODDebitItem(balance) {
        return {
            id: null,
            category: {
                code: 'DEDU'
            },
            type: {
                code: '2010',
                unitCode: 'FIXE'
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
            description: 'PAYE OD Debit',
            accrualDate: null,
            autoCalculate: false,
            units: null,
            rate: null,
            // User can enter desired amount to use
            amount: null,
            availableCredit: balance,
            includeInNettPay: false
        };
    }

    function getTotalODBalance(callback) {

        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getOverDeductionBalance',
            data: {
                employeeId: employeeId,
                sarsYear: payslipTaxPeriod.taxYear,
                toDate: payslipToDate,
                //Exclude current payrun from database query to avoid inclusion of "saved" (but unprocessed) payruns
                excludePayrunId: payrunId
            },
            onSuccess: function (responseText) {

                // Debugging to see what comes from database:
                //console.log('RAW RESPONSE:', responseText);

                // if (!responseText) {
                //     console.log('Empty response from server');
                //     return;
                // }
                // console.log(employeeId);
                // console.log(payslipTaxPeriod);
                // console.log("Sending excludePayrunId:", payrunId);

                var response = JSON.parse(responseText);

                var historicalBalance = parseFloat(response.availableBalance || 0); // Credit balance from previous payslips as stored in db
                var currentPayrunAdjustment = calculateCurrentPayrunODCreditBalAdjustment(employeeId, me); // Include debits and credits of all previous payslips, for current employee in current payrun
                var availableCredit = historicalBalance + currentPayrunAdjustment;
                callback(availableCredit);
            }

        });
    }

    function useOverDeductionCreditEventHandler() {

        // To ensure balance has loaded
        if (availableODBalance === null) return;

        //Refresh OD balance to include previous payslips in current payrun's changes
        getTotalODBalance(function (balance) {
            availableODBalance = balance;

            // calculate remaing credit after OD debit items added in current payslip
            var availableCredit = getRemainingODBalance();

            if (availableCredit <= 0) {
                return; // no useCreditBalance pop-up if no credit available
            }
            new lx.component.Messagebox({
                title: 'Use PAYE Over Deduction Credit',
                message: 'Available Credit: R ' + availableCredit.toFixed(2) +
                    '\n\nWould you like to use it?',
                buttons: [
                    { name: 'cancel', label: 'No', style: 'text', isCancel: true },
                    { name: 'ok', label: 'Yes' }
                ],
                onClose: function (event) {

                    if (event.button === 'ok') {

                        // Remove any existing OD item (2001) on this payslip
                        for (var i = items.length - 1; i >= 0; i--) {

                            var item = items[i];

                            if (item.type && item.type.code === '2001' && item.description === 'PAYE Over Deduction') {
                                removeItemByIndex(i)
                            }
                            //Functions refactored to calculate remaining balance, including current payslip OD debit items
                            //This section is inconsistent with rest of system that allows duplicate user entries, so removed it
                            // else if(item.type && item.type.code === '2010'){
                            //       removeItemByIndex(i)
                            // }
                        }

                        // Add OD debit item
                        var odItem = createODDebitItem(availableCredit);
                        me.addItems([odItem]);

                        refreshODBalances();

                        // Revalidate all OD debit items
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].type && items[i].type.code === '2010') {
                                validateODDebit(items[i]);
                            }
                        }

                        // Notify payrun that items changed
                        me.fireEvent('itemadd', { srcComponent: me });

                        //Validation moved to addItems(), so this line is no longer relevant
                        // attachODDebitValidation(maxDebit);
                    }
                }
            });


        });
    }

    //
    // PUBLIC FUNCTIONS
    //

    me.init = function (config) {
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
        if (typeof config !== 'undefined' && config !== null) {
            for (var prop in config) {
                if (config.hasOwnProperty(prop)) compConfig[prop] = config[prop];
            }
        }

        // Renderto can not be null
        // if( compConfig.renderTo === null ) {
        //     //console.log('lx.component.PayslipEditor : ERROR : renderTo config can not be null or undefined');
        //     return;
        // }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onChange')) me.addEventListener('change', compConfig.onChange);
        if (compConfig.hasOwnProperty('onItemAdd')) me.addEventListener('itemadd', compConfig.onItemAdd);
        if (compConfig.hasOwnProperty('onDelete')) me.addEventListener('delete', compConfig.onDelete);
        if (compConfig.hasOwnProperty('onEncrypt')) me.addEventListener('encrypt', compConfig.onEncrypt);
        if (compConfig.hasOwnProperty('onRecreate')) me.addEventListener('recreate', compConfig.onRecreate);

        // Initalize state
        items = [];
        deletedItems = [];

        // Store payslip and employee details
        payrunPayslips = compConfig.payrunPayslips || [];
        payrunId = compConfig.payrunId || null;
        deletePayslip = false;
        payslipId = compConfig.payslip.id;
        isEncrypted = compConfig.payslip.is_encrypted === true;
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

        getTotalODBalance(function (balance) {
            availableODBalance = balance;
        });

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
        if (!compConfig.isProcessed) {
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

        // lockIconEl to be displayed when isEncrypted is true
        lockIconEl = document.createElement('i');
        lockIconEl.className = 'fa fa-lock';
        lockIconEl.style.color = '#282626';
        lockIconEl.style.marginLeft = '8px';
        lockIconEl.style.display = 'none';

        // Create container for employeeName
        nameContainer = document.createElement('div');
        nameContainer.style.margin = '0px 0px 0px 15px';
        nameContainer.textContent = employeeName;


        // Append lockIconEl to name
        nameContainer.appendChild(lockIconEl);
        updateEncryptionIcon();

        // Append nameContainer to heading element
        headingEl.appendChild(nameContainer);
        el.appendChild(headingEl);


        // Create date container
        dateContainer = document.createElement('div');
        dateContainer.style.fontSize = '12px';
        dateContainer.style.margin = '0px 0px 0px auto';
        dateContainer.textContent = payslipFromDate + ' to ' + payslipToDate;

        // Append dateContainer to heading element
        headingEl.appendChild(dateContainer);

        // Create the statusEl element
        statusEl = document.createElement('DIV');
        statusEl.style.width = '10px';
        statusEl.style.height = '10px';
        statusEl.style.borderRadius = '50%';
        statusEl.style.backgroundColor = '#FFFFFF';
        headingEl.insertBefore(statusEl, headingEl.firstChild);




        // Has the paylsip not been processed?
        if (!compConfig.isProcessed) {
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
                    //width: '140px',
                    width: '100%',
                    boxSizing: 'border-box',
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
                    //width: '220px',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 12px',
                    borderStyle: 'solid',
                    borderWidth: '0px 0px 0px 3px',
                    display: 'flex'
                },
                innerHTML: '<i class="fa fa-fw fa-undo" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Recreate Items</span>'
            });
            menuDropDownBtnRecreateEl.addEventListener('click', menuDropDownBtnRecreateElClickEventHandler);

            // Create the menuDropDownBtnEncryptionEl element
            var menuDropDownBtnEncryptEl = lx.createElement('DIV', {
                parent: menuDropdownBtn.getContainer(),
                className: 'list-item',
                style: {
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: '220px',
                    padding: '8px 10px',
                    borderStyle: 'solid',
                    borderWidth: '0px 0px 0px 3px'
                },
                innerHTML: '<i class="fa fa-fw fa-lock" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Add/Remove Encryption</span>'
            });
            menuDropDownBtnEncryptEl.addEventListener('click', menuDropDownBtnEncryptElClickEventHandler);

            // Create the menuDropDownBtnDeleteEl element
            var menuDropDownBtnDeleteEl = lx.createElement('DIV', {
                parent: menuDropdownBtn.getContainer(),
                className: 'list-item',
                style: {
                    //width: '140px',
                    width: '100%',
                    boxSizing: 'border-box',
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
        el.appendChild(itemContainerEl);

        // Create all items
        me.addItems(compConfig.payslip.items, compConfig.isProcessed);

        // Add the component to its renderTo target.
        compConfig.renderTo.appendChild(el);
    };

    // Function to set focus to the component
    me.focus = function () {
    };

    // Function to show or hide the component
    me.show = function () {
        el.style.display = 'block';
    };
    me.hide = function () {
        el.style.display = 'none';
    };

    // Function to get the payslip id
    me.getPayslipId = function () {
        return payslipId;
    };

    // Function to get the employee id
    me.getEmployeeId = function () {
        return employeeId;
    };

    // Function to get the payslip from date
    me.getEmployeeName = function () {
        return employeeName;
    };

    // Function to get the payslip status code
    me.getStatusCode = function () {
        return payslipStatusCode;
    };

    // Function to get the payslip from date
    me.getFromDate = function () {
        return payslipFromDate;
    };

    // Function to get the payslip to date
    me.getToDate = function () {
        return payslipToDate;
    };

    // Function to get the amount of items
    me.getItemCount = function () {
        return items.length;
    };

    // Funtion to get available OD Balance
    me.getAvailableODBalance = function () {
        return availableODBalance;
    };

    // Function to set amount
    me.setAvailableODBalance = function (balance) {
        availableODBalance = balance;
    };

    // Function to get the amount of items
    me.deletePayslip = function () {
        // Mark the selected payslip as deleted
        deletePayslip = true;
        payslipStatusCode = 'DELE';

        // Hide the selected payslip panel
        el.style.display = 'none';
    };

    // Function to get the amount of items
    me.restorePayslip = function () {

        // Mark the selected payslip as restored
        deletePayslip = false;
        payslipStatusCode = 'ACTI';

        // Display the selected payslip panel
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
    me.addItems = function (newItems, isProcessed) {
        var newItem = null;
        for (var i = 0; i < newItems.length; i++) {
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

            // Copy availableCredit if it exists (to display in OD Debit item txtBox label)
            if (newItems[i].availableCredit !== undefined) {
                newItem.availableCredit = newItems[i].availableCredit;
            }

            // Create the item element
            newItem.el = document.createElement('DIV');
            newItem.el.className = 'flex-row flex-align-center';
            newItem.el.style.padding = '4px 0px';
            itemContainerEl.appendChild(newItem.el);

            //--------------------------------------------------------------

            // Create the item label
            var itemLabelEl = document.createElement('DIV');
            itemLabelEl.className = 'flex-resize';
            itemLabelEl.innerHTML = newItems[i].description;
            newItem.el.appendChild(itemLabelEl);
            newItem.description = newItems[i].description;

            //---------------------------------------------------------

            newItem.autoCalculate = newItems[i].autoCalculate;
            newItem.includeInNettPay = newItems[i].includeInNettPay;

            var itemUnitsLabelEl = null;
            var itemRateLabelEl = null;
            var createUnits = false;
            var itemUnitsLabelText = '';
            var itemRateLabelText = '';

            if (newItems[i].type.unitCode === 'PHOU') {
                createUnits = true;
                itemUnitsLabelText = 'hours @';
                itemRateLabelText = 'per hour';
            }
            else if (newItems[i].type.unitCode === 'PDAY') {
                createUnits = true;
                itemUnitsLabelText = 'days @';
                itemRateLabelText = 'per day';
            }
            else if (newItems[i].type.unitCode === 'PKIL') {
                createUnits = true;
                itemUnitsLabelText = 'km @';
                itemRateLabelText = 'per km';
            }
            else if (newItems[i].type.code === '1006') {
                createUnits = true;
                itemUnitsLabelText = 'leave balance @';
                itemRateLabelText = 'per unit(day/hour)';
            }

            if (createUnits === true) {
                newItem.unitsTxt = new lx.component.Textbox({
                    renderTo: newItem.el,
                    width: '80px',
                    label: null,
                    textAlign: 'right',

                    onChange: itemUnitTxtChangeEventHandler
                });

                // Disable the text box if the payrun has been processed
                if (isProcessed) {
                    newItem.unitsTxt.disable();
                }

                itemUnitsLabelEl = document.createElement('DIV');
                itemUnitsLabelEl.style.whiteSpace = 'nowrap';
                itemUnitsLabelEl.style.fontSize = '14px';
                itemUnitsLabelEl.style.padding = '0px 10px';
                itemUnitsLabelEl.style.width = '55px';
                itemUnitsLabelEl.style.flex = '0 0 auto';
                itemUnitsLabelEl.innerHTML = itemUnitsLabelText;
                newItem.el.appendChild(itemUnitsLabelEl);

                if (newItems[i].type.code === '1006') {
                    newItem.rateTxt = new lx.component.Textbox({
                        renderTo: newItem.el,
                        margin: '0px 8px 0px 55px',
                        width: '70px',
                        label: null,
                        textAlign: 'right',

                        onChange: itemRateTxtChangeEventHandler
                    });

                } else {
                    newItem.rateTxt = new lx.component.Textbox({
                        renderTo: newItem.el,
                        margin: '0px 8px 0px 0px',
                        width: '70px',
                        label: null,
                        textAlign: 'right',

                        onChange: itemRateTxtChangeEventHandler
                    });
                }

                // newItem.rateTxt = new lx.component.Textbox({
                //     renderTo: newItem.el,
                //     margin: '0px 8px 0px 0px',
                //     width: '70px',
                //     label: null,
                //     textAlign: 'right',

                //     onChange: itemRateTxtChangeEventHandler
                // });

                // Disable the text box if the payrun has been processed
                if (isProcessed) {
                    newItem.rateTxt.disable();
                }

                itemRateLabelEl = document.createElement('DIV');
                itemRateLabelEl.style.whiteSpace = 'nowrap';
                itemRateLabelEl.style.fontSize = '14px';
                itemRateLabelEl.style.padding = '0px 10px';
                itemRateLabelEl.style.width = '55px';
                itemRateLabelEl.style.flex = '0 0 auto';
                itemRateLabelEl.innerHTML = itemRateLabelText;
                newItem.el.appendChild(itemRateLabelEl);
            }

            // Create vertical wrapper for label and textbox
            newItem.amountWrapperEl = lx.createElement('DIV', {
                parent: newItem.el,
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    margin: '0px 8px 0px 0px'
                }
            });

            // If OD Debit item added, add label above textbox
            if (newItem.type &&
                newItem.type.code === '2010' &&
                newItem.availableCredit !== undefined) {

                newItem.availableBalanceLbl = lx.createElement('DIV', {
                    parent: newItem.amountWrapperEl,
                    style: {
                        fontSize: '11px',
                        color: '#6c757d',
                        marginBottom: '4px',
                        textAlign: 'right',
                        width: '120px'
                    },
                    innerHTML: 'Available Credit:<br>R ' +
                        newItem.availableCredit.toFixed(2)
                });
            }

            if (newItems[i].type.code === '1006') {
                newItem.amountTxt = new lx.component.Textbox({
                    renderTo: newItem.amountWrapperEl,
                    width: '120px',
                    margin: '0px 8px 0px 65px',
                    label: null,
                    textAlign: 'right',
                    onChange: itemAmountTxtChangeEventHandler
                });

            } else {
                newItem.amountTxt = new lx.component.Textbox({
                    renderTo: newItem.amountWrapperEl,
                    width: '120px',
                    margin: '0px 8px 0px 0px',
                    label: null,
                    textAlign: 'right',
                    onChange: itemAmountTxtChangeEventHandler
                });

            }

            // Create textbox inside wrapper
            // newItem.amountTxt = new lx.component.Textbox({
            //     renderTo: newItem.amountWrapperEl,
            //     width: '120px',
            //     label: null,
            //     textAlign: 'right',
            //     onChange: itemAmountTxtChangeEventHandler
            // });

            //Updated validation handling, to apply to all OD Debit items (not only ones added through Annual Payment pop-up)
            //To ensure amount used can't be more than available credit
            if (newItem.type.code === '2010') {

                // attachODDebitValidation(newItem);

                // Validate newly added items
                validateODDebit(newItem);

                //Previous validation working with 'maxDebit', but incomplete, because OD Debit items in same current payslip where
                //not included in calculations
                //Refactored function used above

                //     var maxDebit = newItem.availableCredit;

                //   if(maxDebit === undefined)  {
                //     //maxDebit = calculateCurrentPayrunODCreditBalAdjustment(employeeId, me);
                //     maxDebit = availableODBalance;
                //   }

            }

            // Function to add validation to OD Debit item
            //if (newItem.type.code === '2010' && newItem.availableCredit !== undefined){
            //attachODDebitValidation(newItem, newItem.availableCredit);
            //}

            // Disable the amount textbox if the payrun has been processed or the amount is
            // calculated automatically
            if (isProcessed || newItem.autoCalculate) {
                newItem.amountTxt.disable();
            }

            // Set textbox values
            if (createUnits === true) {
                if (newItems[i].units !== null) newItem.unitsTxt.setValue(newItems[i].units);
                if (newItems[i].rate !== null) newItem.rateTxt.setValue(lx.util.formatCurrency(newItems[i].rate));
                //Ensures all values added in amount textboxes are positive
                if (newItems[i].amount !== null) newItem.amountTxt.setValue(lx.util.formatCurrency(Math.abs(newItems[i].amount)));
            }
            else {
                if (newItems[i].amount !== null) newItem.amountTxt.setValue(lx.util.formatCurrency(Math.abs(newItems[i].amount)));
            }

            // Create the deleteEl element (only if the payrun has not been processed)
            if (!isProcessed) {
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
                newItem.el.appendChild(deleteEl);

                items.push(newItem);
            }
        }

        updateStatus();
    };

    // Function to replace all items with new items
    me.replaceItems = function (newItems) {
        // Mark all items as deleted
        for (let i = 0; i < items.length; i++) {
            // Should the item be deleted?
            if (items[i].id !== null) {
                deletedItems.push(items[i]);
            }
        }

        // Clear all the pasylip items
        items = [];

        // Clear the item container
        itemContainerEl.innerHTML = '';

        // Add the new items
        me.addItems(newItems);

        // Update the item calculations
        me.fireEvent('change', { srcComponent: me });
        updateStatus();
    };

    // Function to get an item from its index
    me.getItem = function (index) {
        if (index < 0 || index >= items.length) return null;

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

        if (items[index].unitsTxt !== null && items[index].unitsTxt.getValue() !== '') returnObject.units = lx.util.parseCurrency(items[index].unitsTxt.getValue());
        if (items[index].rateTxt !== null && items[index].rateTxt.getValue() !== '') returnObject.rate = lx.util.parseCurrency(items[index].rateTxt.getValue());
        if (items[index].amountTxt !== null && items[index].amountTxt.getValue() !== '') returnObject.amount = lx.util.parseCurrency(items[index].amountTxt.getValue());

        return returnObject;
    };

    // Function to update an item given its index
    me.updateItem = function (index, description, units, rate, amount) {
        if (index < 0 || index >= items.length) return;

        if (items[index].unitsTxt !== null) {
            if (units !== null) items[index].unitsTxt.setValue(units);
            else items[index].unitsTxt.setValue('');
        }
        if (items[index].rateTxt !== null) {
            if (rate !== null) items[index].rateTxt.setValue(lx.util.formatCurrency(rate));
            else items[index].rateTxt.setValue('');
        }
        if (items[index].amountTxt !== null) {
            if (amount !== null) items[index].amountTxt.setValue(lx.util.formatCurrency(amount));
            else items[index].amountTxt.setValue('');
        }

        updateStatus();
    };

    me.updateOrAddItemByDescription = function (newItem) {

        var foundIndex = -1;
        var removeIndex = -1;

        // Find item by description
        for (var i = 0; i < items.length; i++) {
            if (items[i].description === newItem.description) {
                foundIndex = i;
            }

            if (items[i].description === "PAYE Over Deduction") {
                removeIndex = i;
            }
            // Stop if both were found
            if (foundIndex !== -1 && removeIndex !== -1) {
                break;
            }

        }

        if (foundIndex !== -1) {
            // ✅ Update existing item amount
            if (items[foundIndex].amountTxt !== null) {
                items[foundIndex].amountTxt.setValue(
                    lx.util.formatCurrency(newItem.amount)
                );
            }
        }
        else {
            // ✅ Add new item if it does not exist
            if (removeIndex !== -1) {
                removeItemByIndex(removeIndex);
            }
            me.addItems([newItem], false);
        }

        updateStatus();
    };
    // Function to check whether a payslip is complete
    me.isComplete = function () {
        var complete = true;

        for (var i = 0; i < items.length; i++) {
            if (items[i].amountTxt.getValue() === '' || isNaN(lx.util.parseCurrency(items[i].amountTxt.getValue()))) {
                complete = false;
                break;
            }
        }

        return complete;
    };

    // Function to check whether a payslip is empty
    me.isEmpty = function () {
        var empty = true;

        if (items.length > 0) empty = false;

        return empty;
    };

    // Function to create an object representation of the payslip informat
    me.toObject = function () {
        var returnObject = {
            id: payslipId,
            is_encrypted: isEncrypted,
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
        for (let i = 0; i < items.length; i++) {
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

            if (items[i].unitsTxt !== null && items[i].unitsTxt.getValue() !== '') newItem.units = lx.util.parseCurrency(items[i].unitsTxt.getValue());
            if (items[i].rateTxt !== null && items[i].rateTxt.getValue() !== '') newItem.rate = lx.util.parseCurrency(items[i].rateTxt.getValue());
            if (items[i].amountTxt !== null && items[i].amountTxt.getValue() !== '') newItem.amount = lx.util.parseCurrency(items[i].amountTxt.getValue());

            returnObject.items.push(newItem);
        }

        // Add deleted items
        for (let i = 0; i < deletedItems.length; i++) {
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

            if (deletedItems[i].unitsTxt !== null && deletedItems[i].unitsTxt.getValue() !== '') {
                newItem.units = lx.util.parseCurrency(deletedItems[i].unitsTxt.getValue());
            }
            if (deletedItems[i].rateTxt !== null && deletedItems[i].rateTxt.getValue() !== '') {
                newItem.rate = lx.util.parseCurrency(deletedItems[i].rateTxt.getValue());
            }
            if (deletedItems[i].amountTxt !== null && deletedItems[i].amountTxt.getValue() !== '') {
                newItem.amount = lx.util.parseCurrency(deletedItems[i].amountTxt.getValue());
            }

            // Mark the item as deleted
            newItem['delete'] = true;

            returnObject.items.push(newItem);
        }

        return returnObject;
    };

    // Function to update payslip items
    me.updateItems = function () {
        let payslip = me.toObject();

        // Update the payslip items
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=calculatePayslipItems',
            data: {
                payslip: payslip
            },
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Calculating Payslip Items Failed',
                        message: response.error
                    });
                }

                for (let i = 0; i < response.payslips.length; i++) {
                    let payslipIndex = null;
                    if (payslip.id == response.payslips[i].id) {
                        payslipIndex = i;
                    }

                    if (payslipIndex === null) continue;

                    for (let i = 0; i < response.payslips[payslipIndex].items.length; i++) {
                        me.updateItem(i, '', response.payslips[payslipIndex].items[i].units, response.payslips[payslipIndex].items[i].rate, response.payslips[payslipIndex].items[i].amount);
                    }
                }
            }
        });
    };

    // Function to destroy the component
    me.destroy = function () {
        me = null;
        el.parentNode.removeChild(el);
    };


    //
    // EVENT HANDLERS
    //

    // itemUnitTxt change event handler
    function itemUnitTxtChangeEventHandler(event) {
        var itemIndex = null;

        for (var i = 0; i < items.length; i++) {
            if (items[i].unitsTxt !== null && items[i].unitsTxt === event.srcComponent) {
                itemIndex = i;
                break;
            }
        }

        if (items[itemIndex].unitsTxt.getValue() === null || items[itemIndex].unitsTxt.getValue() === '') {
            items[itemIndex].amountTxt.setValue('');
            return;
        }

        if (items[itemIndex].rateTxt.getValue() === null || items[itemIndex].rateTxt.getValue() === '') {
            items[itemIndex].amountTxt.setValue('');
            return;
        }

        var value = lx.util.formatCurrency(parseFloat(items[itemIndex].unitsTxt.getValue()) * lx.util.parseCurrency(items[itemIndex].rateTxt.getValue()));
        items[itemIndex].amountTxt.setValue(value);

        // Fire the onchange event
        me.fireEvent('change', { srcComponent: me });
        updateStatus();
    }

    // itemRateTxt change event handler
    function itemRateTxtChangeEventHandler(event) {
        var itemIndex = null;

        for (var i = 0; i < items.length; i++) {
            if (items[i].rateTxt !== null && items[i].rateTxt === event.srcComponent) {
                itemIndex = i;
                break;
            }
        }

        if (items[itemIndex].unitsTxt.getValue() === null || items[itemIndex].unitsTxt.getValue() === '') {
            items[itemIndex].amountTxt.setValue('');
            return;
        }

        if (items[itemIndex].rateTxt.getValue() === null || items[itemIndex].rateTxt.getValue() === '') {
            items[itemIndex].amountTxt.setValue('');
            return;
        }

        var value = lx.util.formatCurrency(parseFloat(items[itemIndex].unitsTxt.getValue()) * lx.util.parseCurrency(items[itemIndex].rateTxt.getValue()));
        items[itemIndex].amountTxt.setValue(value);

        // Fire the onchange event
        me.fireEvent('change', { srcComponent: me });
        updateStatus();
    }

    // itemAmountTxt change event handler
    function itemAmountTxtChangeEventHandler(event) {
        var itemIndex = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].amountTxt !== null && items[i].amountTxt === event.srcComponent) {
                itemIndex = i;
                // console.log(items[i])
                break;
            }
        }

        // Check if comma exists
        if (items[itemIndex].amountTxt.getValue().includes(',')) {
            // Remove comma
            items[itemIndex].amountTxt.setValue(items[itemIndex].amountTxt.getValue().replace(/,/g, ''));
        }

        var rate = null;
        if (items[itemIndex].rateTxt !== null && items[itemIndex].rateTxt.getValue() !== '') rate = lx.util.parseCurrency(items[itemIndex].rateTxt.getValue());

        var amount = null;
        if (items[itemIndex].amountTxt !== null && items[itemIndex].amountTxt.getValue() !== '') amount = Math.abs(lx.util.parseCurrency(items[itemIndex].amountTxt.getValue())); //items[itemIndex].amountTxt.getValue());
        if (isNaN(amount)) amount = null;

        if (items[itemIndex].unitsTxt !== null) {
            if (rate !== null && amount !== null) items[itemIndex].unitsTxt.setValue(amount / rate);
            else items[itemIndex].unitsTxt.setValue('');
        }

        // Update OD debit balances accross all payslips
        refreshODBalances();

        // Validate OD debit item
        if (items[itemIndex].type && items[itemIndex].type.code === '2010') {
            validateODDebit(items[itemIndex], Math.abs(amount));
        }

        // Format the amount entered and ensure value is positive
        if (amount !== null) items[itemIndex].amountTxt.setValue(lx.util.formatCurrency(Math.abs(amount)));

        // Fire the onchange event
        me.fireEvent('change', { srcComponent: me });

        updateStatus();
    }

    // deleteEl click function
    function removeItemByIndex(itemIndex) {
        // Don't display the item
        itemContainerEl.removeChild(items[itemIndex].el);

        // Should the item be deleted?
        if (items[itemIndex].id !== null) {
            deletedItems.push(items[itemIndex]);
        }

        // Remove the item from the array
        items.splice(itemIndex, 1);

        me.fireEvent('change', { srcComponent: me });
        updateStatus();
    }

    // deleteEl click event handler
    function deleteElChangeEventHandler(event) {
        var itemIndex = getItemIndexFromElement(event.currentTarget);
        removeItemByIndex(itemIndex);
    }

    // menuDropDownBtnAddEl click event handler
    function menuDropDownBtnAddElClickEventHandler() {

        //Gaurd added to prevent invalid balance from being used if server hasn't returned value yet
        // if (availableODBalance === null) {
        // new lx.component.Messagebox({
        //     title: 'Please Wait',
        //     message: 'Loading Over Deduction balance...'
        // });
        // return;
        // }

        //Calculate available OD Credit before openeing Add Item panel to send correct value
        getTotalODBalance(function (balance) {
            availableODBalance = balance;
            var remainingBalance = getRemainingODBalance();
            openAddPanel(remainingBalance);
        });

        function openAddPanel(remainingBalance) {

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

                //Available OD credit balance to be sent to add_payslip_item_panel.js for use in OD debit item display
                availableODBalance: remainingBalance,

                onCancel: function () {
                    app.route.popState();
                },

                onAdd: function (event) {
                    app.route.popState();
                    me.addItems(event.items);

                    // Check if Annual Payment or Leave payout was added
                    var annualItem = event.items.find(function (item) {
                        return item.type.code === '1004' || item.type.code === '1006';
                    });

                    if (annualItem && annualItem.amount) {
                        useOverDeductionCreditEventHandler();
                    }

                    me.fireEvent('itemadd', { srcComponent: me });
                }
            });

            // Add destroy event listener to modal to destroy the contained panel.
            addItemModal.addEventListener('destroy', function () {
                addPayslipItem.destroy();
            });

            // Create a route entry for the panel
            var state = {
                modal: addItemModal
            };
            app.route.pushState(state, function (state) {
                state.modal.destroy();
            });

            addItemModal.show();
            addPayslipItem.focus();
        }
    }

    // menuDropDownBtnEncryptEl click event handler
    function menuDropDownBtnEncryptElClickEventHandler() {
        //Encryption toggle
        isEncrypted = !isEncrypted;

        //Update UI to display icon
        updateEncryptionIcon();

        // Notify parent
        me.fireEvent('encrypt', {
            srcComponent: me
        });
    }


    // menuDropDownBtnDeleteEl click event handler
    function menuDropDownBtnDeleteElClickEventHandler() {
        new lx.component.Messagebox({
            title: 'Remove payslip',
            message: 'Are you certain you wish to remove the selected payslip for \'' + employeeName + '\' and all its items.',
            buttons: [
                { name: 'cancel', label: 'Cancel', style: 'text', isCancel: true },
                { name: 'delete', label: 'Remove', isDefault: true }
            ],
            onClose: function (event) {
                if (event.button === 'delete') {
                    // Fire the delete event
                    me.fireEvent('delete', { srcComponent: me, payslipId: payslipId });
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
                { name: 'cancel', label: 'Cancel', style: 'text', isCancel: true },
                { name: 'recreate', label: 'Recreate', isDefault: true }
            ],
            onClose: function (event) {
                if (event.button === 'recreate') {
                    // Fire the recreate event
                    me.fireEvent('recreate', { srcComponent: me, payslipId: payslipId });
                }
            }
        });
    }

    // Init the menu
    me.init(config);
};