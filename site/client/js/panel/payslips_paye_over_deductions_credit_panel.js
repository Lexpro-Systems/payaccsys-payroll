/* globals app, lx */
'use strict';

// PAYE OVER-DEDUCTION CREDIT PAYSLIPS PANEL
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
app.panel.PayslipsPayeOverDeductionsCredit = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;
    var payslips = null;

    var el = null;

    var contentEl = null;
    var loader = null;

    var payslipsGrid = null;

    var buttonContainerEl = null;
    var cancelBtn = null;
    var updateBtn = null;

    var payrunId = null;

    let payslipsChanged = false;  // Initialize the variable
    var itemTypeSelect = null;

    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);

    // ---------------------------
    // Loads the entire payrun
    // ---------------------------

    function loadPayrun(payrunId, payslips) {

        loader.show(false);

        /* Calls the getPayeOverDeductionCredit() function to calculate the tax correction and to retrieve the 
        PAYE Over Deduction for each payslip. */

        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getPayeOverDeductionCredit',
            data: {
                payrunId: payrunId,
                payslipStatusCode: 'ACTI'
            },
            onSuccess: function (responseText) {
                loader.hide();
                var response = JSON.parse(responseText);
                //console.log(response)
                // Executes if an error occurred
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Payrun Failed',
                        message: response.error
                    });
                    return;
                }

                // Now use the payslips array passed in, which is already available
                let payslipsData = [];
                let payslips = response.payrun.payslips;
                // let OD = response.payrun.OverDeductionCredit || {};
                let ODC = response.payrun.newODC || {};
                let ODDebit = response.payrun.OverDeductionDebit || {};
                //Loops through each payslip in the payrun
                payslips.forEach(payslip => {

                    //Initilize the variables
                    let payeAmount = 0;
                    let overDeductionAmount = 0;
                    let overDeductionDebitAmount = 0;

                    //Loops through each item in the payslip
                    payslip.items.forEach(item => {
                        if (item.description && item.description.toUpperCase() === "PAYE") {
                            payeAmount += item.amount || 0;
                        }
                        // else if(item.description === "PAYE OD Debit"){
                        //     odd = item.amount || 0;
                        // }else if(item.description === "PAYE OD Credit Balance"){
                        //     odb += item.amount || 0;
                        // }
                    });

                    //Loops through each payslips overdeduction and retrieves the amount where the payslip ID's match
                    // if (OD && typeof OD === 'object') {
                    //     let employeeId = payslip.employee.id; // top-level key
                    //     let payslipId = payslip.id; 
                    //     if (OD.hasOwnProperty(employeeId) && OD[employeeId].hasOwnProperty(payslipId)) {
                    //         overDeductionAmount = Number(OD[employeeId][payslipId]);
                    //     } else {
                    //         overDeductionAmount = 0;
                    //     }
                    // }
                    if (ODC && typeof ODC === 'object') {
                        let employeeId = payslip.employee.id; // top-level key
                        let payslipId = payslip.id;
                        if (ODC.hasOwnProperty(employeeId) && ODC[employeeId].hasOwnProperty(payslipId)) {
                            overDeductionAmount = Number(ODC[employeeId][payslipId]);
                        } else {
                            overDeductionAmount = 0;
                        }
                    }

                    //Loops through each payslips Over Deduction Debit and retrievs the amount where the payslips ID's match
                    if (ODDebit && typeof ODDebit === 'object') {
                        let employeeId = payslip.employee.id; // top-level key
                        let payslipId = payslip.id;
                        if (ODDebit.hasOwnProperty(employeeId) && ODDebit[employeeId].hasOwnProperty(payslipId)) {
                            overDeductionDebitAmount = Number(ODDebit[employeeId][payslipId]);
                        } else {
                            overDeductionDebitAmount = 0;
                        }
                    }

                    // // Subtracts Over Deduction Debit amount from PAYE, but don't let it go below 0
                    let adjustedPayeAmount = Math.max(payeAmount - overDeductionDebitAmount, 0); // Ensures PAYE doesn't go below 0

                    let ODDebitDisplay = overDeductionDebitAmount;
                    if (ODDebitDisplay <= 0) {
                        ODDebitDisplay = `${lx.util.formatCurrency(overDeductionDebitAmount)}`;
                    } else {
                        ODDebitDisplay = `-${lx.util.formatCurrency(overDeductionDebitAmount)}`;
                    }

                    //let ODDebitDisplay = `-${lx.util.formatCurrency( overDeductionDebitAmount)}`; // Format with negative sign

                    payslipsData.push({
                        empID: payslip.employee.id,
                        id: payslip.id,
                        employeeName: payslip.employee.name,
                        period: `${payslip.fromDate} to ${payslip.toDate}`,
                        payeAmount: lx.util.formatCurrency(payeAmount), // Format PAYE amount
                        overDeductionAmount: lx.util.formatCurrency(overDeductionAmount),
                        taxCorrectionAmount: ODDebitDisplay,
                        adjustedPayeAmount: lx.util.formatCurrency(adjustedPayeAmount)
                    });
                });

                // Add the rows to the grid only if there are valid payslips
                if (payslipsData.length > 0) {
                    payslipsGrid.addRows(payslipsData);

                    // Select all the payslips by default
                    for (let i = 0; i < payslipsGrid.getRowCount(); i++) {
                        payslipsGrid.selectRow(i);
                    }
                }
            }
        });
    }

    // ---------------------------
    // Helper function section
    // ---------------------------  

    // Helper function to update overdeductionAmount values in all rows below the edited row.
    function propagateOverDeductionDelta(rowIndex, oldValue, newValue) {

        // Parse numeric values.
        let oldVal = lx.util.parseCurrency(oldValue);
        let newVal = lx.util.parseCurrency(newValue);

        // Compute difference between new and old value.
        let delta = newVal - oldVal;

        //Checks if the edited payslip employeeID matches with the employee id of the payslips that needs to be updated.
        let editedRow = payslipsGrid.getRow(rowIndex);
        let editedEmpID = editedRow.empID;
        for (let i = rowIndex + 1; i < payslipsGrid.getRowCount(); i++) {
            let row = payslipsGrid.getRow(i);
            if (row.empID !== editedEmpID) {
                break;
            }
            //Gets the updated balance amount.
            let currentOD = lx.util.parseCurrency(row['overDeductionAmount']);
            let updatedOD = currentOD + delta;

            // Update row object and grid
            row['overDeductionAmount'] = lx.util.formatCurrency(updatedOD);
            payslipsGrid.updateRow(i, row);
        }
    }

    /*rowIndex : The row index of the cell to edit.
      colIndex : The column index of the cell to edit.
      focus : Should the component be focussed after being created.*/

    // Function to start editing a text cell
    function editCell(rowIndex, colIndex, focus) {

        // Variable that stores information about the grid
        let record = payslipsGrid.getRow(rowIndex);
        let cell = payslipsGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = payslipsGrid.getColumnDataIndex(colIndex);
        let newComponent = null;
        cell.innerHTML = '';
        cell.style.overflow = 'visible';

        // a reuasble function that contains the overdeduction calculation function, to be used in multiple click events
        function handleEdit(updateGridRow) {

            // Storing the old,new, and currency formatted overdeduction values.
            let oldValue = record['taxCorrectionAmount'];
            let Value = newComponent.getValue();
            let newValue = Value.replace(/[,\s]/g, '');
            let numericNewValue = lx.util.parseCurrency(newValue);
            //let newValue = newComponent.getValue();
            //let numericNewValue = lx.util.parseCurrency(newValue);
            let numericOverDeduction = lx.util.parseCurrency(record['overDeductionAmount']);

            // Validation: The Debit amount must not exceed current overDeductionAmount.
            if (Math.abs(numericNewValue) > numericOverDeduction) {

                //Message panel: ineffiecent balance
                new lx.component.Messagebox({
                    message:
                        'Inceffiecent credit balance!',
                    buttons: [
                        { name: 'back', label: 'back', isCancel: true, style: 'text' }
                    ],
                    onClose: function (closeEvent) {

                        if (closeEvent.button === 'back') {
                            newComponent.setValue(record['taxCorrectionAmount']);
                            record['taxCorrectionAmount'] = formatDebit(oldValue);
                            payslipsGrid.updateRow(rowIndex, record);
                            cell.style.overflow = 'hidden';
                        }
                    }
                })
                return;
            };
            // Format the new value to currency
            record['taxCorrectionAmount'] = formatDebit(newValue);

            // Recalculate PAYE Payable for this row
            recalculateRow(record);

            // Updates overdeduction balance in all rows below
            propagateOverDeductionDelta(rowIndex, oldValue, record['taxCorrectionAmount']);

            // Update the current row in grid
            if (updateGridRow) {
                payslipsGrid.updateRow(rowIndex, record);
            }
            cell.style.overflow = 'hidden';
        }

        // Create the edit component depending on the dataIndex
        if (dataIndex === 'taxCorrectionAmount') {
            newComponent = new lx.component.Textbox({
                renderTo: cell,
                label: null
            });
        }
        // Blur event
        newComponent.addEventListener('blur', function () {
            handleEdit(true);
            newComponent.destroy();
        });

        // Enter key
        newComponent.addEventListener('keydown', function (event) {
            if (event.key === 13) {
                handleEdit(true);
                newComponent.destroy();
            }
            else if (event.key === 9) {
                handleEdit(false);
                newComponent.focus();
                newComponent.destroy();
                payslipsGrid.updateRow(rowIndex, record);

                // Edit the next cell
                if (dataIndex === 'taxCorrectionAmount') {
                    // Are there rows left to edit?
                    if (rowIndex + 1 < payslipsGrid.getRowCount()) {
                        // Edit the next row
                        editCell(rowIndex + 1, colIndex, false);
                    }
                }
            }
        });

        if (focus === true) newComponent.focus();
        newComponent.setValue(record[payslipsGrid.getColumnDataIndex(colIndex)]);
    }

    //
    // PUBLIC FUNCTIONS
    //

    me.init = function (config) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,

            payrunId: null,
            payslips: [], // Initialize payslips as an empty array
        };

        // Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onCancel')) me.addEventListener('cancel', compConfig.onCancel);
        if (compConfig.hasOwnProperty('onUpdate')) me.addEventListener('update', compConfig.onUpdate);
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        payslips = compConfig.payslips;

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
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'PAYE Over-Deduction Credit'
        });


        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6'
            }
        });

        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });


        //
        // PAYSLIP SECTION
        //

        // Create payslipsGrid component
        payslipsGrid = new lx.component.Grid({
            renderTo: contentEl,
            // autoSize: true,
            height: '100%',
            borderWidth: '0px',

            columns: [
                { dataIndex: 'select', width: '60px', type: 'rowSelect' },
                { dataIndex: 'period', name: 'Period', width: '180px' },
                { dataIndex: 'employeeName', name: 'Employee' },
                { dataIndex: 'payeAmount', name: 'PAYE' },
                { dataIndex: 'overDeductionAmount', name: 'PAYE Over-Deduction Credit' },
                { dataIndex: 'taxCorrectionAmount', name: 'PAYE Over-Deduction Debit' },
                { dataIndex: 'adjustedPayeAmount', name: 'PAYE Payable' },
            ],

            onCellClick: payslipsGridCellClickEventHandler,
            onRowSelect: payslipsGridRowSelectEventHandler,
            onRowDeselect: payslipsGridRowSelectEventHandler,
            onSelectAllRows: payslipsGridRowSelectEventHandler,
            onDeselectAllRows: payslipsGridRowSelectEventHandler,
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
            width: '120px',
            style: 'text',
            // margin: '0px 15px 0px 0px',

            onClick: cancelBtnClickEventHandler
        });


        // Create the emailBtn component
        updateBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Update',
            width: '120px',

            onClick: updateBtnClickEventHandler
        });

        // Load form data
        loadPayrun(compConfig.payrunId, compConfig.payslips);


        // If show is set to true show the panel.
        if (compConfig.show === true) me.show();

    };

    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function (renderTo) {
        // Remove it from its current target
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        // Edit it to the new renderTo element
        renderTo.appendChild(el);
    };

    // Function to show the panel
    me.show = function () {
        lx.applyStyle(el, { display: 'flex' });

    };

    // Function to hide the panel
    me.hide = function () {
        lx.applyStyle(el, { display: 'none' });
    };

    // Function to set focus to the panel.
    me.focus = function () {
        // ...
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function () {
        // Check if we need to confirm before destroying the panel.
        if (confirmDestroy === true) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    { name: 'cancel', label: 'Cancel', style: 'text', isCancel: true },
                    { name: 'continue', label: 'Continue', isDefault: true }
                ],
                onClose: function (event) {
                    if (event.button === 'continue') {
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
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        return true;
    };


    //
    // EVENT HANDLERS
    //

    // payslipsGrid cell click event handler
    function payslipsGridCellClickEventHandler(clickEvent) {
        // Get the data index of the column that was clicked
        let dataIndex = payslipsGrid.getColumnDataIndex(clickEvent.columnIndex);

        // Depending on the column clicked
        if (dataIndex === 'taxCorrectionAmount') {
            editCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }

    }

    // payslipsGrid row select event handler
    function payslipsGridRowSelectEventHandler() {
    }

    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', { srcPanel: me });
    }

    // // Update button click event handler
    function updateBtnClickEventHandler() {

        var selectItems = [];
        for (let rowIndex = 0; rowIndex < payslipsGrid.getRowCount(); rowIndex++) {

            // Get the row details
            let row = payslipsGrid.getRow(rowIndex);

            // Do error checking to make sure the paye correction amount is valid
            // ...

            // Is the row selected?
            if (payslipsGrid.rowIsSelected(rowIndex) === true) {
                let item = ({
                    payslipId: row.id,
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
                    amount: lx.util.parseCurrency(Math.abs(row.taxCorrectionAmount)),
                    includeInNettPay: false
                });

                // Add the item to the array
                if (item.amount > 0) {
                    selectItems.push(item);
                }
            }
        }
        //console.log(selectItems);
        me.fireEvent('update', { srcPanel: me, items: selectItems });
        app.route.popState();
    }

    // Formats numbers to currency
    function formatDebit(value) {
        let numericValue = parseFloat(value);
        if (isNaN(numericValue)) numericValue = 0;
        if (numericValue === 0) {
            return "0.00";
        }
        numericValue = -Math.abs(numericValue);
        return numericValue.toFixed(2);
    }
    function recalculateRow(record) {
        // Clean PAYE value
        let payeRaw = record['payeAmount'].toString().replace(/\s/g, '');
        let payeValue = parseFloat(payeRaw) || 0;

        // Current debit value
        let debitValue = parseFloat(record['taxCorrectionAmount']) || 0;

        // Convert debit to positive for comparison
        let actualDebit = debitValue * -1;

        // If debit exceeds PAYE, correct it
        if (actualDebit > payeValue) {
            actualDebit = payeValue;
            debitValue = -actualDebit;

            // Update the record with corrected debit
            record['taxCorrectionAmount'] = debitValue.toFixed(2);
        }

        // Calculate payable
        let payableValue = payeValue - actualDebit;

        record['adjustedPayeAmount'] = lx.util.formatCurrency(payableValue);
    }
    // function recalculateRow(record) {
    //     // Clean PAYE value (remove thousand spaces)
    //     let payeRaw = record['payeAmount'].toString().replace(/\s/g, '');
    //     let payeValue = parseFloat(payeRaw) || 0;

    //     // Debit already formatted
    //     let debitValue = parseFloat(record['taxCorrectionAmount']) || 0;

    //     // Calculate PAYE Payable
    //     let payableValue = payeValue -(debitValue * -1);
    //     record['adjustedPayeAmount'] = lx.util.formatCurrency(payableValue);
    // }

    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};