/* globals app, lx */
'use strict';

// EDIT EMPLOYEE EMPLOYMENT DETAILS PANEL
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
app.panel.EditEmployeeEmploymentDetails = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;

    var el = null;

    var contentEl = null;
    var loader = null;

    var employmentDetailsSectionEl = null;
    var employmentStartDate = null;
    var dismissalContainerEl = null;
    var employmentEndDate = null;
    var dismissalReasonSelect = null;
    var employmentPositionTxt = null;
    var departmentSelect = null;
    var paymentMethodSelect = null;
    var paymentPeriodSelect = null;

    var twiceMonthlyFirstBatchHeadingEl = null;
    var twiceMonthlyFirstBatchContainerEl = null;
    var twiceMonthlySelectFirstStartDay = null;
    var twiceMonthlySelectFirstEndDay = null;
    var twiceMonthlySelectFirstPaymentDayContainerEl = null;
    var twiceMonthlySelectFirstPaymentDay = null;
    var twiceMonthlySecondBatchHeadingEl = null;
    var twiceMonthlySecondBatchContainerEl = null;
    var twiceMonthlySelectSecondStartDay = null;
    var twiceMonthlySelectSecondEndDay = null;
    var twiceMonthlySelectSecondPaymentDayContainerEl = null;
    var twiceMonthlySelectSecondPaymentDay = null;

    var bweeButtonsContainerEl = null;
    var employmentDateBtn = null;
    var customDateBtn = null;

    var bweeCustomContainerEl = null;
    var bweeCustomPaymentPeriodStartDatePicker = null;
    var bweeCustomPaymentDayDatePicker = null;

    var paymentPeriodEndDaySelect = null;
    var paymentDaySelect = null;

    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;

    var employeeId = null;


    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PRIVATE FUNCTIONS
    //

    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }

                var departments = [];
                departments.push({ value: null, text: 'None' });
                for (var i = 0; i < response.departments.length; i++) {
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                }

                // departmentSelect.clear();
                departmentSelect.addItems(departments);
            }
        });
    }

    function loadPaymentMethods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentMethodList',
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }

                var paymentMethods = [];
                for (var i = 0; i < response.paymentMethods.length; i++) {
                    paymentMethods.push({
                        value: response.paymentMethods[i].code,
                        text: response.paymentMethods[i].name
                    });
                }

                // paymentMethodSelect.clear();
                paymentMethodSelect.addItems(paymentMethods);
            }
        });
    }

    function loadPaymentPeriods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentPeriodList',
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }

                var paymentPeriods = [];
                for (var i = 0; i < response.paymentPeriods.length; i++) {
                    // if( response.paymentPeriods[i].code === 'BWEE' ) continue; // Hide the bi-weekly option for now
                    paymentPeriods.push({
                        value: response.paymentPeriods[i].code,
                        text: response.paymentPeriods[i].name
                    });
                }

                // paymentPeriodSelect.clear();
                paymentPeriodSelect.addItems(paymentPeriods);
            }
        });
    }

    function loadDismissalReasons() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getDismissalReasonList',
            onSuccess: function (responseText) {
                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Reasons Failed',
                        message: response.error
                    });
                }

                var reasons = [];
                for (var i = 0; i < response.reasons.length; i++) {
                    reasons.push({
                        value: response.reasons[i].code,
                        text: response.reasons[i].name
                    });
                }

                dismissalReasonSelect.clear();
                dismissalReasonSelect.addItems(reasons);
            }
        });
    }

    function loadEmployee() {
        loader.show(false);

        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeId: employeeId
            },
            onSuccess: function (responseText) {
                loader.hide();

                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }

                // Set employment details
                if (response.employee.employmentStartDate !== null) employmentStartDate.setValue(response.employee.employmentStartDate);
                employmentPositionTxt.setValue(response.employee.employmentPosition);
                departmentSelect.setValue(null, 'None');
                if (response.employee.departmentId != null && response.employee.departmentId != 0) {
                    departmentSelect.setValue(response.employee.departmentId, response.employee.departmentName);
                }
                paymentMethodSelect.setValue(response.employee.paymentMethodCode, response.employee.paymentMethodName);
                paymentPeriodSelect.setValue(response.employee.paymentPeriodCode, response.employee.paymentPeriodName);
                paymentPeriodSelectChangeEventHandler();

                if (response.employee.employmentEndDate !== null) {
                    lx.applyStyle(dismissalContainerEl, { display: 'block' });
                    employmentEndDate.setValue(response.employee.employmentEndDate);
                    dismissalReasonSelect.setValue(response.employee.dismissalReasonCode, response.employee.dismissalReasonName);
                }
                else {
                    lx.applyStyle(dismissalContainerEl, { display: 'none' });
                }

                var value = '';
                if (response.employee.paymentPeriodCode === 'WEEK') {
                    if (response.employee.paymentPeriodEndDay === 1) value = 'Monday';
                    else if (response.employee.paymentPeriodEndDay === 2) value = 'Tuesday';
                    else if (response.employee.paymentPeriodEndDay === 3) value = 'Wednesday';
                    else if (response.employee.paymentPeriodEndDay === 4) value = 'Thursday';
                    else if (response.employee.paymentPeriodEndDay === 5) value = 'Friday';
                    else if (response.employee.paymentPeriodEndDay === 6) value = 'Saturday';
                    else if (response.employee.paymentPeriodEndDay === 0) value = 'Sunday';
                }
                else if (response.employee.paymentPeriodCode === 'BWEE') {
                    if (response.employee.paymentPeriodEndDay === 1) value = 'Monday';
                    else if (response.employee.paymentPeriodEndDay === 2) value = 'Tuesday';
                    else if (response.employee.paymentPeriodEndDay === 3) value = 'Wednesday';
                    else if (response.employee.paymentPeriodEndDay === 4) value = 'Thursday';
                    else if (response.employee.paymentPeriodEndDay === 5) value = 'Friday';
                    else if (response.employee.paymentPeriodEndDay === 6) value = 'Saturday';
                    else if (response.employee.paymentPeriodEndDay === 0) value = 'Sunday';
                    // if( response.employee.paymentPeriodEndDay === 1 ) value = 'Week 1: Monday';
                    // else if( response.employee.paymentPeriodEndDay === 2 ) value = 'Week 1: Tuesday';
                    // else if( response.employee.paymentPeriodEndDay === 3 ) value = 'Week 1: Wednesday';
                    // else if( response.employee.paymentPeriodEndDay === 4 ) value = 'Week 1: Thursday';
                    // else if( response.employee.paymentPeriodEndDay === 5 ) value = 'Week 1: Friday';
                    // else if( response.employee.paymentPeriodEndDay === 6 ) value = 'Week 1: Saturday';
                    // else if( response.employee.paymentPeriodEndDay === 0 ) value = 'Week 1: Sunday';
                    // else if( response.employee.paymentPeriodEndDay === 8 ) value = 'Week 2: Monday';
                    // else if( response.employee.paymentPeriodEndDay === 9 ) value = 'Week 2: Tuesday';
                    // else if( response.employee.paymentPeriodEndDay === 10 ) value = 'Week 2: Wednesday';
                    // else if( response.employee.paymentPeriodEndDay === 11 ) value = 'Week 2: Thursday';
                    // else if( response.employee.paymentPeriodEndDay === 12 ) value = 'Week 2: Friday';
                    // else if( response.employee.paymentPeriodEndDay === 13 ) value = 'Week 2: Saturday';
                    // else if( response.employee.paymentPeriodEndDay === 7 ) value = 'Week 2: Sunday';
                }
                else if (response.employee.paymentPeriodCode === 'MONT') {
                    if (response.employee.paymentPeriodEndDay === 0) {
                        value = 'Last Day';
                    }
                    else {
                        if (response.employee.paymentPeriodEndDay !== null) {
                            value = response.employee.paymentPeriodEndDay;
                        }
                    }
                }

                paymentPeriodEndDaySelect.setValue(response.employee.paymentPeriodEndDay, value);

                value = '';
                if (response.employee.paymentPeriodCode === 'WEEK') {
                    if (response.employee.paymentDay === 1) value = 'Monday';
                    else if (response.employee.paymentDay === 2) value = 'Tuesday';
                    else if (response.employee.paymentDay === 3) value = 'Wednesday';
                    else if (response.employee.paymentDay === 4) value = 'Thursday';
                    else if (response.employee.paymentDay === 5) value = 'Friday';
                    else if (response.employee.paymentDay === 6) value = 'Saturday';
                    else if (response.employee.paymentDay === 0) value = 'Sunday';
                }
                else if (response.employee.paymentPeriodCode === 'BWEE') {
                    if (response.employee.paymentDay === 1) value = 'Monday';
                    else if (response.employee.paymentDay === 2) value = 'Tuesday';
                    else if (response.employee.paymentDay === 3) value = 'Wednesday';
                    else if (response.employee.paymentDay === 4) value = 'Thursday';
                    else if (response.employee.paymentDay === 5) value = 'Friday';
                    else if (response.employee.paymentDay === 6) value = 'Saturday';
                    else if (response.employee.paymentDay === 0) value = 'Sunday';
                    // if( response.employee.paymentDay === 1 ) value = 'Week 1: Monday';
                    // else if( response.employee.paymentDay === 2 ) value = 'Week 1: Tuesday';
                    // else if( response.employee.paymentDay === 3 ) value = 'Week 1: Wednesday';
                    // else if( response.employee.paymentDay === 4 ) value = 'Week 1: Thursday';
                    // else if( response.employee.paymentDay === 5 ) value = 'Week 1: Friday';
                    // else if( response.employee.paymentDay === 6 ) value = 'Week 1: Saturday';
                    // else if( response.employee.paymentDay === 0 ) value = 'Week 1: Sunday';
                    // else if( response.employee.paymentDay === 8 ) value = 'Week 2: Monday';
                    // else if( response.employee.paymentDay === 9 ) value = 'Week 2: Tuesday';
                    // else if( response.employee.paymentDay === 10 ) value = 'Week 2: Wednesday';
                    // else if( response.employee.paymentDay === 11 ) value = 'Week 2: Thursday';
                    // else if( response.employee.paymentDay === 12 ) value = 'Week 2: Friday';
                    // else if( response.employee.paymentDay === 13 ) value = 'Week 2: Saturday';
                    // else if( response.employee.paymentDay === 7 ) value = 'Week 2: Sunday';
                }
                else if (response.employee.paymentPeriodCode === 'MONT') {
                    if (response.employee.paymentDay === 0) {
                        value = 'Last Day';
                    }
                    else {
                        if (response.employee.paymentDay !== null) {
                            value = response.employee.paymentDay;
                        }
                    }
                }

                paymentDaySelect.setValue(response.employee.paymentDay, value);

                if (response.employee.paymentPeriodCode === 'BWEE') {
                    if (bweeButtonsContainerEl) bweeButtonsContainerEl.style.display = 'flex';
                    if (response.employee.bweeCustomPped) {

                        paymentPeriodEndDaySelect.hide();
                        paymentDaySelect.hide();

                        bweeCustomContainerEl.style.display = 'block';

                        bweeCustomPaymentPeriodStartDatePicker.setValue(
                            response.employee.bweeCustomPped
                        );

                        bweeCustomPaymentDayDatePicker.setValue(
                            response.employee.bweeCustomPaymentDay
                        );

                    } else {

                        paymentPeriodEndDaySelect.show();
                        paymentDaySelect.show();

                        bweeCustomContainerEl.style.display = 'none';
                    }
                } else {
                    if (bweeButtonsContainerEl) bweeButtonsContainerEl.style.display = 'none';
                    paymentPeriodEndDaySelect.show();
                    paymentDaySelect.show();

                    bweeCustomContainerEl.style.display = 'none';
                }
            }
        });
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

            employeeId: null
        };

        // Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onSave')) me.addEventListener('save', compConfig.onSave);
        if (compConfig.hasOwnProperty('onCancel')) me.addEventListener('cancel', compConfig.onCancel);
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

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
            innerHTML: 'Edit Employment Details'
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
        // EMPLOYMENT DETAILS SECTION
        //

        // Create the employmentDetailsSectionEl element
        employmentDetailsSectionEl = lx.createElement('DIV', {
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

        employmentStartDate = new lx.component.DatePicker({
            renderTo: employmentDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Employment Start Date',
            showCalendar: false
        });

        dismissalContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                margin: '15px 0px 0px 0px',
                padding: '0px',
                display: 'none'
            }
        });

        employmentEndDate = new lx.component.DatePicker({
            renderTo: dismissalContainerEl,
            margin: '0px 0px 0px 0px',
            label: 'Employment End Date',
            showCalendar: false
        });

        dismissalReasonSelect = new lx.component.Selectbox({
            renderTo: dismissalContainerEl,
            margin: '15px 0px 0px 0px',
            label: 'Employment End Reason'
        });

        employmentPositionTxt = new lx.component.Textbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Employment Position'
        });

        departmentSelect = new lx.component.Selectbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Department'
        });

        paymentMethodSelect = new lx.component.Selectbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Payment Method'
        });

        paymentPeriodSelect = new lx.component.Selectbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Payment Period',

            onChange: paymentPeriodSelectChangeEventHandler
        });

        // BWEE BUTTONS CONTAINER
        bweeButtonsContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'row',
                alignItems: 'center',
                margin: '15px 0px 0px 0px',
                width: '100%'
            }
        });

        employmentDateBtn = new lx.component.Button({
            renderTo: bweeButtonsContainerEl,
            label: 'Employment Date',
            margin: '0px 10px 0px 0px',

            onClick: function () {
                bweeCustomPaymentPeriodStartDatePicker.setValue('');
                bweeCustomPaymentDayDatePicker.setValue('');

                bweeCustomContainerEl.style.display = 'none';
                paymentPeriodEndDaySelect.show();
                paymentDaySelect.show();
            }
        });

        customDateBtn = new lx.component.Button({
            renderTo: bweeButtonsContainerEl,
            label: 'Custom Date',
            margin: '0px 0px 0px 0px',

            onClick: function () {
                paymentPeriodEndDaySelect.setValue(null, '');
                paymentDaySelect.setValue(null, '');

                bweeCustomContainerEl.style.display = 'block';
                paymentPeriodEndDaySelect.hide();
                paymentDaySelect.hide();
            }
        });

        // TWICE MONTHLY OPTION

        //FIRST PAYMENT PERIOD SECTION
        twiceMonthlyFirstBatchHeadingEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                display: 'none',
                boxSizing: 'border-box',
                width: '100%',
                margin: '24px 0px 8px 0px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'left'
            },
            innerHTML: 'First Payment Period'
        });

        twiceMonthlyFirstBatchContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                columnGap: '24px',
                rowGap: '16px',
                width: '100%',
                padding: '16px',
                border: '1px solid #D9D9D9',
                margin: '16px 0px 0px 0px'
            }
        });

        //FIRST BATCH START DAY

        let twiceMonthlyFirstStartDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlyFirstBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                width: '100%'
            }
        });

        twiceMonthlySelectFirstStartDay = new lx.component.Selectbox({
            renderTo: twiceMonthlyFirstStartDayContainerEl,
            label: 'First Payment Period Start *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyStartDayChangeEventHandler
        });

        //FIRST BATCH END DAY

        let twiceMonthlyFirstEndDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlyFirstBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                width: '100%'
            }
        });

        twiceMonthlySelectFirstEndDay = new lx.component.Selectbox({
            renderTo: twiceMonthlyFirstEndDayContainerEl,
            label: 'First Payment Period End *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyEndDayChangeEventHandler
        });

        //FIRST BATCH PAYMENT DAY

        twiceMonthlySelectFirstPaymentDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlyFirstBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                width: '100%',
                gridColumn: '1'
            }
        });

        twiceMonthlySelectFirstPaymentDay = new lx.component.Selectbox({
            renderTo: twiceMonthlySelectFirstPaymentDayContainerEl,
            label: 'First Payment Day *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyPaymentDayChangeEventHandler
        });

        // SECOND BATCH START DAY

        //SECOND PAYMENT PERIOD SECTION
        twiceMonthlySecondBatchHeadingEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                display: 'none',
                boxSizing: 'border-box',
                width: '100%',
                margin: '24px 0px 8px 0px',
                fontSize: '12px',
                fontWeight: '600',
                textAlign: 'left'
            },
            innerHTML: 'Second Payment Period'
        });

        twiceMonthlySecondBatchContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                columnGap: '24px',
                rowGap: '16px',
                width: '100%',
                padding: '16px',
                border: '1px solid #D9D9D9',
                margin: '16px 0px 0px 0px'
            }
        });

        //SECOND BATCH START DAY

        let twiceMonthlySecondStartDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlySecondBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                width: '100%'
            }
        });

        twiceMonthlySelectSecondStartDay = new lx.component.Selectbox({
            renderTo: twiceMonthlySecondStartDayContainerEl,
            label: 'Second Payment Period Start *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyStartDayChangeEventHandler
        });

        //SECOND BATCH END DAY

        let twiceMonthlySecondEndDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlySecondBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                width: '100%'
            }
        });

        twiceMonthlySelectSecondEndDay = new lx.component.Selectbox({
            renderTo: twiceMonthlySecondEndDayContainerEl,
            label: 'Second Payment Period End *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyEndDayChangeEventHandler
        });

        //SECOND BATCH PAYMENT DAY

        twiceMonthlySelectSecondPaymentDayContainerEl = lx.createElement('DIV', {
            parent: twiceMonthlySecondBatchContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                width: '100%',
                gridColumn: '1'
            }
        });

        twiceMonthlySelectSecondPaymentDay = new lx.component.Selectbox({
            renderTo: twiceMonthlySelectSecondPaymentDayContainerEl,
            label: 'Second Payment Day *',
            labelAlign: 'left',
            margin: '0px 0px 0px 0px',
            labelWidth: '220px',
            maxWidth: '350px',

            onChange: twiceMonthlyPaymentDayChangeEventHandler
        });

        paymentPeriodEndDaySelect = new lx.component.Selectbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Payment Period End Day'
        });
        paymentPeriodEndDaySelect.hide();

        paymentDaySelect = new lx.component.Selectbox({
            renderTo: employmentDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            label: 'Payment Day'
        });

        bweeCustomContainerEl = lx.createElement('DIV', {
            parent: employmentDetailsSectionEl,
            style: {
                display: 'none'
            }
        });

        bweeCustomPaymentPeriodStartDatePicker = new lx.component.DatePicker({
            renderTo: bweeCustomContainerEl,
            margin: '10px 0px 0px 0px',
            label: 'Custom Payment Period Start',
            labelWidth: '230px'
        });

        bweeCustomPaymentDayDatePicker = new lx.component.DatePicker({
            renderTo: bweeCustomContainerEl,
            margin: '10px 0px 0px 0px',
            label: 'Custom Payment Day',
            labelWidth: '230px',
        });
        paymentDaySelect.hide();

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

        // Create the saveBtnContainerEl element
        saveBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });

        // Create the saveBtn component
        saveBtn = new lx.component.Button({
            renderTo: saveBtnContainerEl,
            label: 'Save',
            width: '120px',

            onClick: saveBtnClickEventHandler
        });

        // Load panel data
        loadDepartments();
        loadPaymentMethods();
        loadPaymentPeriods();
        loadDismissalReasons();
        loadEmployee();

        // If show is set to true show the panel.
        if (compConfig.show === true) me.show();
    };

    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function (renderTo) {
        // Remove it from its current target
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        // Add it to the new renderTo element
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
        employmentStartDate.focus();
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

    //Function to determine if next day is the day after previous day; 
    //Day 28 is an exception, as in Feb the next day is 1, but could be 29;
    //Thus 28 should not be selected as a proper end day choice and trigger warning display. 
    function isNextDay(endValue, startValue) {

        const end = parseInt(endValue, 10);
        const start = parseInt(startValue, 10);

        if (end === 0) {
            return start === 1;
        }
        if (end === 28) {
            return false;
        }

        return start === end + 1;
    }

    //Function to show warning if start and end days do not follow each other 
    //(indicating that all days in month are not covered)
    function validateTwiceMonthlyCoverage() {

        const firstStart = twiceMonthlySelectFirstStartDay.getValue();
        const firstEnd = twiceMonthlySelectFirstEndDay.getValue();
        const secondStart = twiceMonthlySelectSecondStartDay.getValue();
        const secondEnd = twiceMonthlySelectSecondEndDay.getValue();

        const isEmpty = value => value === null || value === '';

        const firstBoundaryInvalid =
            !isEmpty(firstEnd) &&
            !isEmpty(secondStart) &&
            !isNextDay(firstEnd, secondStart);

        const secondBoundaryInvalid =
            !isEmpty(secondEnd) &&
            !isEmpty(firstStart) &&
            !isNextDay(secondEnd, firstStart);

        if (firstBoundaryInvalid || secondBoundaryInvalid) {
            saveBtn.showWarning(
                'The payment periods do not cover all days in the month.'
            );
        }

    }

    //Parses last day 
    const comparableDay = value => {
        const day = parseInt(value, 10);
        return day === 0 ? 32 : day;
    };

    //Function to ensure Payment days are after End days
    function validateTwiceMonthlyPaymentDays() {
        const firstEnd = twiceMonthlySelectFirstEndDay.getValue();
        const firstPayment = twiceMonthlySelectFirstPaymentDay.getValue();
        const secondEnd = twiceMonthlySelectSecondEndDay.getValue();
        const secondPayment = twiceMonthlySelectSecondPaymentDay.getValue();

        const isEmpty = value => value === null || value === '';

        if (
            (!isEmpty(firstEnd) &&
                !isEmpty(firstPayment) &&
                comparableDay(firstPayment) < comparableDay(firstEnd)) ||
            (!isEmpty(secondEnd) &&
                !isEmpty(secondPayment) &&
                comparableDay(secondPayment) < comparableDay(secondEnd))
        ) {
            saveBtn.showWarning(
                'Selected Payment Day is before Payment Period End.'
            );
        }
    }

    function twiceMonthlyStartDayChangeEventHandler() {
        validateTwiceMonthlyCoverage();
    }

    function twiceMonthlyPaymentDayChangeEventHandler() {
        validateTwiceMonthlyPaymentDays();
    }

    function twiceMonthlyEndDayChangeEventHandler() {
        validateTwiceMonthlyCoverage();
    }

    // paymentPeriodSelect change event handler
    function paymentPeriodSelectChangeEventHandler() {

        var days = [];
        const startDays = [];
        const endDays = [];
        const paymentDays = [];

        // Set the payment day values depending on the payment period
        if (paymentPeriodSelect.getValue() === 'WEEK') {
            days.push(
                { value: 1, text: 'Monday' },
                { value: 2, text: 'Tuesday' },
                { value: 3, text: 'Wednesday' },
                { value: 4, text: 'Thursday' },
                { value: 5, text: 'Friday' },
                { value: 6, text: 'Saturday' },
                { value: 0, text: 'Sunday' }
            );
        }
        else if (paymentPeriodSelect.getValue() === 'BWEE') {
            days.push(
                { value: 1, text: 'Monday' },
                { value: 2, text: 'Tuesday' },
                { value: 3, text: 'Wednesday' },
                { value: 4, text: 'Thursday' },
                { value: 5, text: 'Friday' },
                { value: 6, text: 'Saturday' },
                { value: 0, text: 'Sunday' }
            );
        }
        else if (paymentPeriodSelect.getValue() === 'MONT') {
            for (var i = 1; i < 29; i++) {
                days.push({ value: i, text: i });
            }
            days.push({ value: 0, text: 'Last Day' });
        }
        else if (paymentPeriodSelect.getValue() === 'TWMO') {
            for (let i = 1; i < 29; i++) {
                startDays.push({ value: i, text: i });
            }

            for (let i = 1; i < 28; i++) {
                endDays.push({ value: i, text: i });
            }
            endDays.push({ value: 0, text: 'Last Day' });

            for (var i = 1; i < 29; i++) {
                paymentDays.push({ value: i, text: i });
            }
            paymentDays.push({ value: 0, text: 'Last Day' });
        }
        else {
            return;
        }

        //Show/hide "twice monthly" options container
        const isTwiceMonthly = paymentPeriodSelect.getValue() === 'TWMO';

        if (isTwiceMonthly) {
            paymentPeriodEndDaySelect.hide();
            paymentDaySelect.hide();
            twiceMonthlyFirstBatchHeadingEl.style.display = 'block';
            twiceMonthlyFirstBatchContainerEl.style.display = 'grid';
            twiceMonthlySecondBatchHeadingEl.style.display = 'block';
            twiceMonthlySecondBatchContainerEl.style.display = 'grid';
        }
        else {
            paymentPeriodEndDaySelect.show();
            paymentDaySelect.show();
            twiceMonthlyFirstBatchHeadingEl.style.display = 'none';
            twiceMonthlyFirstBatchContainerEl.style.display = 'none';
            twiceMonthlySecondBatchHeadingEl.style.display = 'none';
            twiceMonthlySecondBatchContainerEl.style.display = 'none';
        }

        // Set and display the batch payment period start and end days
        // First payment period
        twiceMonthlySelectFirstStartDay.setValue(null, '');
        twiceMonthlySelectFirstStartDay.clear();
        twiceMonthlySelectFirstStartDay.addItems(startDays);

        twiceMonthlySelectFirstEndDay.setValue(null, '');
        twiceMonthlySelectFirstEndDay.clear();
        twiceMonthlySelectFirstEndDay.addItems(endDays);

        // Second payment period
        twiceMonthlySelectSecondStartDay.setValue(null, '');
        twiceMonthlySelectSecondStartDay.clear();
        twiceMonthlySelectSecondStartDay.addItems(startDays);

        twiceMonthlySelectSecondEndDay.setValue(null, '');
        twiceMonthlySelectSecondEndDay.clear();
        twiceMonthlySelectSecondEndDay.addItems(endDays);

        // Set and display the batch payment days
        // First payment period
        twiceMonthlySelectFirstPaymentDay.setValue(null, '');
        twiceMonthlySelectFirstPaymentDay.clear();
        twiceMonthlySelectFirstPaymentDay.addItems(paymentDays);

        // Second payment period
        twiceMonthlySelectSecondPaymentDay.setValue(null, '');
        twiceMonthlySelectSecondPaymentDay.clear();
        twiceMonthlySelectSecondPaymentDay.addItems(paymentDays);

        // Set and display the payment period end days
        paymentPeriodEndDaySelect.setValue(null, '');
        paymentPeriodEndDaySelect.clear();
        paymentPeriodEndDaySelect.addItems(days);
        //paymentPeriodEndDaySelect.show();

        // Set and display the payment days
        paymentDaySelect.setValue(null, '');
        paymentDaySelect.clear();
        paymentDaySelect.addItems(days);

        if (paymentPeriodSelect.getValue() === 'BWEE') {
            if (bweeButtonsContainerEl) bweeButtonsContainerEl.style.display = 'flex';
            if (bweeCustomContainerEl.style.display === 'block') {
                paymentPeriodEndDaySelect.hide();
                paymentDaySelect.hide();
            } else {
                paymentPeriodEndDaySelect.show();
                paymentDaySelect.show();
            }
        } else {
            if (bweeButtonsContainerEl) bweeButtonsContainerEl.style.display = 'none';
            if (bweeCustomContainerEl) bweeCustomContainerEl.style.display = 'none';
            if (!isTwiceMonthly) {
                paymentPeriodEndDaySelect.show();
                paymentDaySelect.show();
            }
        }
        //paymentDaySelect.show();
    }

    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', { srcPanel: me });
    }

    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Check all required values
        if (employmentStartDate.getValue() === '' || employmentStartDate.getValue() === null) {
            saveBtn.showWarning('The employment date can not be empty.');
            return;
        }

        // if( employmentPositionTxt.getValue().trim() === '' ) {
        // saveBtn.showWarning('The employment position can not be empty.');
        // return;
        // }

        if (paymentMethodSelect.getValue() === null) {
            saveBtn.showWarning('The payment method can not be empty.');
            return;
        }

        if (paymentPeriodSelect.getValue() === null) {
            saveBtn.showWarning('The payment period can not be empty.');
            return;
        }

        let isTwiceMonthly = paymentPeriodSelect.getValue() === "TWMO";
        let hasStandardEndDay = paymentPeriodEndDaySelect.getValue() !== null;
        let hasStandardPaymentDay = paymentDaySelect.getValue() !== null;
        let hasStandard = hasStandardEndDay || hasStandardPaymentDay;
        let hasCustomBwee = paymentPeriodSelect.getValue() === 'BWEE' && bweeCustomContainerEl.style.display !== 'none';

        const isEmptySelect = select => select.getValue() === null || select.getValue() === '';

        if (isTwiceMonthly) {
            if (isEmptySelect(twiceMonthlySelectFirstStartDay)) {
                saveBtn.showWarning('The First Payment Period Start can not be empty.');
                return;
            }
            if (isEmptySelect(twiceMonthlySelectFirstEndDay)) {
                saveBtn.showWarning('The First Payment Period End can not be empty.');
                return;
            }
            if (isEmptySelect(twiceMonthlySelectFirstPaymentDay)) {
                saveBtn.showWarning('The First Payment Day can not be empty.');
                return;
            }
            if (isEmptySelect(twiceMonthlySelectSecondStartDay)) {
                saveBtn.showWarning('The Second Payment Period Start can not be empty.');
                return;
            }
            if (isEmptySelect(twiceMonthlySelectSecondEndDay)) {
                saveBtn.showWarning('The Second Payment Period End can not be empty.');
                return;
            }
            if (isEmptySelect(twiceMonthlySelectSecondPaymentDay)) {
                saveBtn.showWarning('The Second Payment Day can not be empty.');
                return;
            }
        } else if (hasCustomBwee) {

            if (bweeCustomPaymentPeriodStartDatePicker.getValue() === '' || bweeCustomPaymentPeriodStartDatePicker.getValue() === null) {
                saveBtn.showWarning('The Custom Payment Period Start can not be empty.');
                return;
            }

            if (bweeCustomPaymentDayDatePicker.getValue() === '' || bweeCustomPaymentDayDatePicker.getValue() === null) {
                saveBtn.showWarning('The Custom Payment Day can not be empty.');
                return;
            }

            var startDate = new Date(bweeCustomPaymentPeriodStartDatePicker.getValue());
            var paymentDate = new Date(bweeCustomPaymentDayDatePicker.getValue());

            var minimumPaymentDate = new Date(startDate);
            minimumPaymentDate.setDate(minimumPaymentDate.getDate() + 13);

            if (paymentDate < minimumPaymentDate) {
                saveBtn.showWarning(
                    'The Custom Payment Day must be at least 13 days after the Custom Payment Period Start.'
                );
                return;
            }

        } else if (hasStandard) {
            if (!hasStandardEndDay) {
                saveBtn.showWarning('The payment period end day can not be empty.');
                return;
            }
            if (!hasStandardPaymentDay) {
                saveBtn.showWarning('The payment day can not be empty.');
                return;
            }
        }

        // if( paymentPeriodEndDaySelect.getValue() === null ) {
        //     saveBtn.showWarning('The payment day can not be empty.');
        //     return;
        // }

        // if( paymentDaySelect.getValue() === null ) {
        //     saveBtn.showWarning('The payment day can not be empty.');
        //     return;
        // }

        // Make provision for null values for the department
        var departmentId = -1;
        if (departmentSelect.getValue() !== null) {
            departmentId = parseInt(departmentSelect.getValue());
        }

        saveBtn.showLoader();
        saveBtn.disable();

        var employmentStart = employmentStartDate.getValue();
        if (employmentStart == '') employmentStart = null;

        var employmentEnd = employmentEndDate.getValue();
        if (employmentEnd == '') employmentEnd = null;

        console.log(bweeCustomPaymentPeriodStartDatePicker.getValue());
        console.log(bweeCustomPaymentDayDatePicker.getValue());

        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=update',
            data: {
                employeeId: employeeId,
                employmentStartDate: employmentStart,
                employmentEndDate: employmentEnd,
                dismissalReasonCode: dismissalReasonSelect.getValue(),
                employmentPosition: employmentPositionTxt.getValue().trim(),
                departmentId: departmentId,
                paymentMethodCode: paymentMethodSelect.getValue(),
                paymentPeriodCode: paymentPeriodSelect.getValue(),
                paymentPeriodEndDay: parseInt(paymentPeriodEndDaySelect.getValue()),
                paymentDay: parseInt(paymentDaySelect.getValue()),
                bweeCustomPpsd: bweeCustomPaymentPeriodStartDatePicker.getValue() === '' ? null : bweeCustomPaymentPeriodStartDatePicker.getValue(),
                bweeCustomPaymentDay: bweeCustomPaymentDayDatePicker.getValue() === '' ? null : bweeCustomPaymentDayDatePicker.getValue(),
                twiceMonthlySelectFirstStartDay: twiceMonthlySelectFirstStartDay.getValue() === '' ? null : parseInt(twiceMonthlySelectFirstStartDay.getValue(), 10),
                twiceMonthlySelectFirstEndDay: twiceMonthlySelectFirstEndDay.getValue() === '' ? null : parseInt(twiceMonthlySelectFirstEndDay.getValue(), 10),
                twiceMonthlySelectFirstPaymentDay: twiceMonthlySelectFirstPaymentDay.getValue() === '' ? null : parseInt(twiceMonthlySelectFirstPaymentDay.getValue(), 10),
                twiceMonthlySelectSecondStartDay: twiceMonthlySelectSecondStartDay.getValue() === '' ? null : parseInt(twiceMonthlySelectSecondStartDay.getValue(), 10),
                twiceMonthlySelectSecondEndDay: twiceMonthlySelectSecondEndDay.getValue() === '' ? null : parseInt(twiceMonthlySelectSecondEndDay.getValue(), 10),
                twiceMonthlySelectSecondPaymentDay: twiceMonthlySelectSecondPaymentDay.getValue() === '' ? null : parseInt(twiceMonthlySelectSecondPaymentDay.getValue(), 10),
            },
            onSuccess: function (responseText) {

                saveBtn.hideLoader();
                saveBtn.enable();

                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    saveBtn.showWarning(response.error);
                    return;
                }

                me.fireEvent('save', { srcPanel: me });
            }
        });
    }


    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};