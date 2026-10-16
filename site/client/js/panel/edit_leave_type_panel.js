/* globals app, lx */
'use strict';

// EDIT LEAVE TYPE PANEL
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
app.panel.EditLeaveType = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;
    var rules = null;

    var el = null;

    var contentEl = null;
    var loader = null;

    var detailsSectionEl = null;
    var detailsNameTxt = null;
    var earnTypeSelect = null;
    var useStartDateRadio = null;
    var startDateContainerEl = null;
    var startDate = null;

    var rulesSectionEl = null;
    var rulesHeadingEl = null;
    var rulesContainerEl = null;

    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    var resetInterval = null;
    var carryOverInterval = null;


    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PRIVATE FUNCTIONS
    //

    // Function to add a leave rule.
    //
    // ruleData             The data for the rule.
    // insertIndex          The index to insert the new rule at.  For example if the index is given as 3 then after inserting the new rule will be
    //                      at index 3 and the rule previously at 3 will be at 4.
    function addLeaveRule(ruleData, insertIndex) {
        // Set styles depending on position of rule in list
        let ruleMargin = '15px';
        if (rules.length === 0) ruleMargin = '0px';

        // Create rule wrapper.
        const ruleWrapper = lx.createElement('DIV', {
            parent: rulesContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '10px 0px',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });

        // Create the rulesHeadingEl element
        rulesHeadingEl = lx.createElement('DIV', {
            parent: ruleWrapper,
            style: {
                display: 'flex',
                flexDirection: 'row',
                boxSizing: 'border-box',
                width: '100%',
                height: '25px'
            },
            innerHTML:
                '<div style="width: 80px; margin: 0px 0px 0px 0px;">From month</div>' +
                '<div style="width: 130px; margin: 0px 0px 0px 10px;">Earn</div>' +
                '<div style="width: 310px; margin: 0px 0px 0px 10px;">Every</div>' //+ 
            //'<div style="width: 80px; margin: 0px 0px 0px 10px;">Resetting</div>'
        });

        //Create row inside ruleWrapper
        let ruleEl = lx.createElement('DIV', {
            parent: ruleWrapper,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '35px'
                //margin: ruleMargin + ' 0px 0px 0px'
            }
        });

        // Create ruleMonthTxt component
        let ruleMonthTxt = new lx.component.Textbox({
            renderTo: ruleEl,
            width: '80px'
        });
        ruleMonthTxt.setValue(ruleData.startMonth);

        // Create ruleEarnTxt component
        let ruleEarnTxt = new lx.component.Textbox({
            renderTo: ruleEl,
            width: '80px',
            margin: '0px 0px 0px 10px'
        });
        ruleEarnTxt.setValue(ruleData.amount);

        // Create ruleEarnTypeSelect component
        let ruleEarnTypeDisplay = new lx.component.Label({
            renderTo: ruleEl,
            width: '40px',
            margin: '0px 0px 0px 10px',

        });
        ruleEarnTypeDisplay.setText(earnTypeSelect.getText());

        // Create ruleXTxt component
        let ruleXTxt = new lx.component.Textbox({
            renderTo: ruleEl,
            width: '40px',
            margin: '0px 0px 0px 10px'
        });
        ruleXTxt.setValue(ruleData.accrualInterval);

        // Create ruleCycleTypeSelect component.
        let ruleCycleTypeSelect = new lx.component.Selectbox({
            renderTo: ruleEl,
            width: '265px',
            margin: '0px 0px 0px 5px',

            items: [
                { value: 'DWOR', text: 'Days worked' },
                { value: 'HWOR', text: 'Hours worked' },
                { value: 'PAYS', text: 'Payslips processed' },
                { value: 'PPEE', text: 'Payment Period End Day (Accrue/end)' }, //added the PPEE
                { value: 'PPES', text: 'Payment Period End Day (Accrue/beginning)' }, //added the PPES
                { value: 'DCEN', text: 'Day cycle (Accrue at end)' },
                { value: 'DCST', text: 'Day cycle (Accrue at beginning)' },
                { value: 'MCEN', text: 'Month cycle (Accrue at end)' },
                { value: 'MCST', text: 'Month cycle (Accrue at beginning)' },
                { value: 'YCEN', text: 'Year cycle (Accrue at end)' },
                { value: 'YCST', text: 'Year cycle (Accrue at beginning)' }
            ]
        });
        if (ruleData.accrualType.code === 'DWOR') ruleCycleTypeSelect.setValue('DWOR', 'Days worked');
        else if (ruleData.accrualType.code === 'HWOR') ruleCycleTypeSelect.setValue('HWOR', 'Hours worked');
        else if (ruleData.accrualType.code === 'PAYS') ruleCycleTypeSelect.setValue('PAYS', 'Payslips processed');
        else if (ruleData.accrualType.code === 'PPEE') ruleCycleTypeSelect.setValue('PPEE', 'Payment Period End Day (Accrue/end)'); //added the PPEE for else if
        else if (ruleData.accrualType.code === 'PPES') ruleCycleTypeSelect.setValue('PPES', 'Payment Period End Day (Accrue/beginning)'); //added the PPES for else if
        else if (ruleData.accrualType.code === 'DCEN') ruleCycleTypeSelect.setValue('DCEN', 'Day cycle (Accrue at end)');
        else if (ruleData.accrualType.code === 'DCST') ruleCycleTypeSelect.setValue('DCST', 'Day cycle (Accrue at beginning)');
        else if (ruleData.accrualType.code === 'MCEN') ruleCycleTypeSelect.setValue('MCEN', 'Month cycle (Accrue at end)');
        else if (ruleData.accrualType.code === 'MCST') ruleCycleTypeSelect.setValue('MCST', 'Month cycle (Accrue at beginning)');
        else if (ruleData.accrualType.code === 'YCEN') ruleCycleTypeSelect.setValue('YCEN', 'Year cycle (Accrue at end)');
        else if (ruleData.accrualType.code === 'YCST') ruleCycleTypeSelect.setValue('YCST', 'Year cycle (Accrue at beginning)');

        // Create reset rules section
        const resetSection = createResetSection(ruleWrapper);

        //Converts values to true Booleans
        const resetAccrued = !!ruleData.resetAccrued;
        const resetTaken = !!ruleData.resetTaken;

        //console.log(resetSection.select.getValue());

        //Set selectbox values
        if (resetAccrued && resetTaken) {
            resetSection.select.setValue('BOTH', 'Both');
        }
        else if (resetAccrued) {
            resetSection.select.setValue('ACCR', 'Accrued');
        }
        else if (resetTaken) {
            resetSection.select.setValue('TAKE', 'Taken');
        }
        else {
            resetSection.select.setValue('NONE', 'None');
        }

        //Populate textboxes if data is available from ruleData (allow 0 as valid input)
        if (ruleData.resetInterval !== null && ruleData.resetInterval !== undefined) {
            resetSection.resetIntervalText.setValue(ruleData.resetInterval);
        }

        if (ruleData.carryOverInterval !== null && ruleData.carryOverInterval !== undefined) {
            resetSection.carryOverIntervalText.setValue(ruleData.carryOverInterval);
        }

        //Enable/disable reset section textboxes
        const value = resetSection.select.getValue();
        applyResetState(value, resetSection.resetIntervalText, resetSection.carryOverIntervalText);


        // let ruleResetSelect = new lx.component.Selectbox({
        //     renderTo: ruleEl,
        //     width: '100px',
        //     margin: '0px 0px 0px 10px',

        //     items: [
        //         {value: 'NONE', text: 'None'},
        //         {value: 'ACCR', text: 'Accrued'},
        //         {value: 'TAKE', text: 'Taken'},
        //         {value: 'BOTH', text: 'Both'}
        //     ]
        // });

        //Reset Selectbox Section
        // if( ruleData.resetAccrued === true && ruleData.resetTaken === true ) resetData.select.setValue('BOTH', 'Both');
        // else if( ruleData.resetAccrued === true && ruleData.resetTaken === false ) resetData.select.setValue('ACCR', 'Accrued');
        // else if( ruleData.resetAccrued === false && ruleData.resetTaken === true) resetData.select.setValue('TAKE', 'Taken');
        // else if( ruleData.resetAccrued === false && ruleData.resetTaken === false ) resetData.select.setValue('NONE', 'None');

        // Create addEl el
        let addEl = lx.createElement('DIV', {
            parent: ruleEl,
            style: {
                margin: '0px 0px 0px 10px',
                padding: '9px 11px',
                cursor: 'pointer',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-plus"></i>'
        });
        addEl.addEventListener('click', ruleAddBtnElClickEventHandler);

        // Create removeEl el
        let removeEl = lx.createElement('DIV', {
            parent: ruleEl,
            style: {
                padding: '9px 11px',
                cursor: 'pointer',
                fontSize: '13px'
            },
            innerHTML: '<i class="fa fa-minus"></i>'
        });
        removeEl.addEventListener('click', ruleRemoveBtnElClickEventHandler);

        // Add the rule into the rulesContainerEl at given index.
        if (typeof insertIndex === 'undefined' || insertIndex === null || insertIndex >= rules.length || insertIndex < 0) {
            //rulesContainerEl.appendChild( ruleEl );
            rulesContainerEl.appendChild(ruleWrapper);

            // Add rule to the rules array
            rules.push({
                id: ruleData.id,
                wrapper: ruleWrapper,
                el: ruleEl,
                monthTxt: ruleMonthTxt,
                earnTxt: ruleEarnTxt,
                earnTypeDisplay: ruleEarnTypeDisplay,
                xTxt: ruleXTxt,
                cycleTypeSelect: ruleCycleTypeSelect,
                //resetSelect: ruleResetSelect
                resetSelect: resetSection.select,
                resetIntervalTxt: resetSection.resetIntervalText,
                carryOverIntervalTxt: resetSection.carryOverIntervalText
            });
        }
        else {
            //rulesContainerEl.insertBefore(ruleEl, rules[insertIndex].el);
            rulesContainerEl.insertBefore(ruleWrapper, rules[insertIndex].wrapper);

            // Add rule to the rules array
            rules.splice(insertIndex, 0, {
                id: ruleData.id,
                wrapper: ruleWrapper,
                el: ruleEl,
                monthTxt: ruleMonthTxt,
                earnTxt: ruleEarnTxt,
                earnTypeDisplay: ruleEarnTypeDisplay,
                xTxt: ruleXTxt,
                cycleTypeSelect: ruleCycleTypeSelect,
                //resetSelect: ruleResetSelect
                resetSelect: resetSection.select,
                resetIntervalTxt: resetSection.resetIntervalText,
                carryOverIntervalTxt: resetSection.carryOverIntervalText
            });
        }
        updateRuleBorders();
    }

    // Function to set focus to a given rule
    function focusRule(ruleIndex) {
        if (ruleIndex < 0 || ruleIndex >= rules.length) return;

        rules[ruleIndex].monthTxt.focus();
    }

    // Function to load leave types from server
    function loadLeaveType(leaveTypeId) {
        loader.show(false);

        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getType',
            data: {
                leaveTypeId: leaveTypeId
            },
            onSuccess: function (responseText) {
                loader.hide();

                var response = JSON.parse(responseText);

                // Check if the function was successful.
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types. ' + response.error
                    });

                    return;
                }

                // Load details
                detailsNameTxt.setValue(response.leaveType.name);
                earnTypeSelect.setValue(response.leaveType.leaveUnitCode, response.leaveType.leaveUnitName);

                if (response.leaveType.startDate !== null) {
                    startDate.setValue(response.leaveType.startDate);
                    useStartDateRadio.setValue('CUSD');
                }
                useStartDateRadioOnChangeEventHandler();

                // Load rules
                for (let i = 0; i < response.leaveType.rules.length; i++) {
                    addLeaveRule(response.leaveType.rules[i]);
                }

                // If there are no rules add an empty one
                if (response.leaveType.rules.length === 0) {
                    let newRule = {
                        id: null,
                        startMonth: '',
                        amount: '',
                        unit: {
                            code: 'DAYS'
                        },
                        accrualInterval: '',
                        accrualType: {
                            code: null
                        },
                        resetAccrued: false,
                        resetTaken: false
                    };

                    // Add the new rule
                    addLeaveRule(newRule, 0);
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
            show: false
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
        rules = [];
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
            innerHTML: 'Edit Leave Type'
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
        // DETAILS SECTION
        //

        // Create details heading component
        new lx.component.Heading({
            renderTo: contentEl,
            label: 'Details',
            margin: '0px 15px',
            width: ''
        });

        // Create detailsSectionEl element
        detailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });

        // Create the detailsNameTxt component
        detailsNameTxt = new lx.component.Textbox({
            renderTo: detailsSectionEl,
            label: 'Name'
        });

        // Create earnTypeSelect component
        earnTypeSelect = new lx.component.Selectbox({
            renderTo: detailsSectionEl,
            label: 'Unit Type',
            margin: '20px 0px 0px 0px',

            items: [
                { text: 'Days', value: 'DAYS' },
                { text: 'Hours', value: 'HOUR' }
            ],

            onChange: earnTypeSelectChangeEventHandler
        });
        earnTypeSelect.setValue('DAYS', 'Days');

        // Create a label for the useStartDateRadio component
        new lx.component.Label({
            renderTo: detailsSectionEl,
            margin: '15px 0px 0px 0px',
            color: lx.style.global.labelColor,
            fontSize: lx.style.global.labelFontSize,
            text: 'Start On'
        });

        // Create a container for the component as well as the info icon
        let useStartDateContainerEl = new lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '3px 0px 0px 0px'
            }
        });

        // Create the useStartDateRadio component
        useStartDateRadio = new lx.component.RadioGroup({
            renderTo: useStartDateContainerEl,
            margin: '3px 0px 0px 0px',
            minWidth: '500px',

            items: [
                { text: 'Employment Date', value: 'EMPD' },
                { text: 'Custom Date', value: 'CUSD' }
            ],

            onChange: useStartDateRadioOnChangeEventHandler
        });
        useStartDateRadio.setValue('EMPD');

        // Create an info icon
        let useStartDateInfoEl = new lx.createElement('DIV', {
            parent: useStartDateContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px auto 10px',
                fontSize: '12px',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });

        // Create the element used to position the tooltip
        let useStartDateTooltipLocusEl = lx.createElement('DIV', {
            parent: useStartDateContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 0px 0px',
                width: '0px',
                height: '30px'
            }
        });

        // Create the tooltip component
        let useStartDateInfoTooltip = new lx.component.Tooltip({
            renderTo: useStartDateTooltipLocusEl,
            alignment: 'topRight',
            arrowOffset: '8px',
            width: '100%',
            maxWidth: '540px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message:
                '<span style="font-size: 12px;">' +
                'Indicates whether leave should be calculated from the employment date or a custom date. For example:<br><br>' +
                'If an employee earns a set amount of leave at the beginning of every year &quot;Custom Date&quot; should be selected which will allow the user to enter the start date (the 1st of January of the current year in this case).<br><br>' +
                'If, on the other hand, an employee earns leave for days or hours worked, &quot;Employment Date&quot; should be selected.' +
                '</span>'
        });
        useStartDateInfoEl.addEventListener('mouseenter', function () { useStartDateInfoTooltip.show(); });
        useStartDateInfoEl.addEventListener('mouseleave', function () { useStartDateInfoTooltip.hide(); });

        // Create the startDateContainerEl
        startDateContainerEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                display: 'none',
                boxSizing: 'border-box',
                width: '100%'
            }
        });

        // Create the startDate component
        startDate = new lx.component.DatePicker({
            renderTo: startDateContainerEl,
            label: 'Start Date',
            margin: '15px 0px 0px 0px'
        });
        startDate.disable();


        //
        // RULES SECTION
        //

        // Create a container for the component as well as the info icon
        let rulesHeadingContainerEl = new lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                margin: '0px 15px 0px 15px'
            }
        });

        // Create rules heading component
        new lx.component.Heading({
            renderTo: rulesHeadingContainerEl,
            label: 'Leave Rules',
            margin: '0px 0px',
            width: ''
        });

        // Create the element used to position the tooltip
        let rulesHeadingTooltipLocusEl = lx.createElement('DIV', {
            parent: rulesHeadingContainerEl,
            style: {
                position: 'relative',
                margin: 'auto 0px 2px 0px',
                width: '0px',
                height: '30px'
            }
        });

        // Create an info icon
        let rulesHeadingInfoEl = new lx.createElement('DIV', {
            parent: rulesHeadingContainerEl,
            style: {
                cursor: 'pointer',
                display: 'flex',
                width: '24px',
                minWidth: '24px',
                height: '24px',
                minHeight: '24px',
                margin: 'auto 0px 8px 0px',
                fontSize: '12px',
                color: lx.style.global.backgroundColor,
                backgroundColor: '#3B81EB',
                borderRadius: '50%'
            },
            innerHTML: '<i class="fa fa-question" style="margin: auto auto;"></i>'
        });

        // Create the tooltip component
        let rulesHeadingInfoTooltip = new lx.component.Tooltip({
            renderTo: rulesHeadingTooltipLocusEl,
            position: 'relative',
            alignment: 'topLeft',
            arrowOffset: '7px',
            width: '100%',
            maxWidth: '700px',
            margin: '5px 10px',
            backgroundColor: '#3B81EB', // '#4885F4',
            message:
                // '<div style="max-height: 100px; overflow: auto;">' +  
                '<span style="font-size: 10px;">' +
                'Leave rules determine when and how leave is earned and reset. It consists of the following components:<br>' +
                '&quot;From Month&quot; - Indicates the number of months from the employment date or user specified date before the rule takes effect.<br>' +
                '&quot;Earn&quot; - The number of days/hours of leave to earn when the rule takes effect.<br>' +
                '&quot;Every&quot; - Specifies the frequency of leave earned. For example: &quot;8 hours worked&quot; if the employee earns leave for every 8 hours worked, or &quot;1 year cycle (accrue at beginning)&quot; if leave is earned at the beginning of every year.<br><br>' +
                '&quot;Resetting&quot; - Indicates what happens to any existing leave taken and accrued when the rule takes effect. Can be one of the following:<br>' +
                '&quot;None&quot; - the current accrued leave and leave taken will be preserved.<br>' +
                '&quot;Taken&quot; - any leave taken will be reset to zero.<br>' +
                '&quot;Accrued&quot; - any accrued leave will be lost.<br>' +
                '&quot;Both&quot; - any accrued leave will be lost and any leave taken will be reset to zero.<br>' +
                'For example, if an employee has earned 7 days leave, has taken 1 day, and earns another 5 days when the rule takes effect:<br>' +
                'If &quot;None&quot; was specified the employee will now have 11 days [5+7-1]. ' +
                'If &quot;Taken&quot; was specified the employee will now have 12 [5+7-0].<br>' +
                'If &quot;Accrued&quot; was specified the employee will now have 4 days [5+0-1]. ' +
                'If &quot;Both&quot; was specified the employee will now have 5 days [5+0-0].<br>' +
                'If &quot;Taken&quot;, &quot;Accrued&quot; or &quot;Both&quot; is selected, the default number of months until leave is reset, should be specified. Specified leave can be carried over for an additional number of months if &quot;Months to carry over specified leave&quot; is filled in.<br>' +
                'For example, if &quot;Default number of months in period&quot; - &quot;12&quot; any specified leave will be reset after 12 months. If &quot;Months to carry over specified leave&quot; - &quot;6&quot; any specified leave will be carried over for six additional months (12+6=18 months) before it is reset.' +
                '</span>' // +
            // '</dive>'
        });
        rulesHeadingInfoEl.addEventListener('mouseenter', function () { rulesHeadingInfoTooltip.show(); });
        rulesHeadingInfoEl.addEventListener('mouseleave', function () { rulesHeadingInfoTooltip.hide(); });

        // Create rules section
        rulesSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '0px 15px 0px 15px',
                padding: '15px'
            }
        });

        // // Create the rulesHeadingEl element
        // rulesHeadingEl = lx.createElement('DIV', {
        //     parent: rulesSectionEl,
        //     style: {
        //         display: 'flex',
        //         flexDirection: 'row',
        //         boxSizing: 'border-box',
        //         width: '100%',
        //         height: '25px'
        //     },
        //     innerHTML:
        //         '<div style="width: 80px; margin: 0px 0px 0px 0px;">From month</div>' +
        //         '<div style="width: 130px; margin: 0px 0px 0px 10px;">Earn</div>' + 
        //         '<div style="width: 310px; margin: 0px 0px 0px 10px;">Every</div>' //+ 
        //         //'<div style="width: 80px; margin: 0px 0px 0px 10px;">Resetting</div>'
        // });

        // Create the rulesContainerEl
        rulesContainerEl = lx.createElement('DIV', {
            parent: rulesSectionEl,
            style: {
                boxSizing: 'border-box',
                width: '100%'
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

        // Load leave type
        loadLeaveType(compConfig.leaveTypeId);

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
        detailsNameTxt.focus();
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

    // earnTypeSelect change event handler
    function earnTypeSelectChangeEventHandler() {
        for (let i = 0; i < rules.length; i++) {
            rules[i].earnTypeDisplay.setText(earnTypeSelect.getText());
        }
    }

    // useStartDateRadio change event handler
    function useStartDateRadioOnChangeEventHandler() {
        // Allow the user to specify a custom start date for the leave type?
        if (useStartDateRadio.getValue() === 'CUSD') {
            startDate.enable();
            lx.applyStyle(startDateContainerEl, { display: 'block' });
        } else {
            startDate.disable();
            lx.applyStyle(startDateContainerEl, { display: 'none' });
        }
    }

    // Rule addBtnEl click event handler
    function ruleAddBtnElClickEventHandler(event) {
        // Find the rule that was clicked
        let ruleIndex = null;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].el === event.currentTarget.parentElement) {
                ruleIndex = i;
                break;
            }
        }

        // If no ruleIndex is set then we did not find the rule.
        if (ruleIndex === null) return;

        // Create a blank rule
        let newRule = {
            id: null,
            startMonth: '',
            amount: '',
            unit: {
                code: 'DAYS'
            },
            accrualInterval: '',
            accrualType: {
                code: null
            },
            resetAccrued: false,
            resetTaken: false
        };

        // Add the new rule
        addLeaveRule(newRule, ruleIndex + 1);

        // Set focus to the new rule
        focusRule(ruleIndex + 1);
    }

    // Rule removeBtnEl click event handler
    function ruleRemoveBtnElClickEventHandler(event) {
        // Find the rule that was clicked
        let ruleIndex = null;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].el === event.currentTarget.parentElement) {
                ruleIndex = i;
                break;
            }
        }

        // If no ruleIndex is set then we did not find the rule.
        if (ruleIndex === null) return;

        // Remove the rule element
        rulesContainerEl.removeChild(rules[ruleIndex].wrapper);
        // rulesContainerEl.removeChild( rules[ruleIndex].el );
        rules.splice(ruleIndex, 1);

        updateRuleBorders();

        // If the first item was removed fix padding
        if (ruleIndex === 0 && rules.length > 0) {
            rules[0].wrapper.style.margin = '0px';
            //rules[0].el.style.margin = '0px';
        }

        // If there are 0 rules add an empty rule.
        if (rules.length === 0) {
            let newRule = {
                id: null,
                startMonth: '',
                amount: '',
                unit: {
                    code: 'DAYS'
                },
                accrualInterval: '',
                accrualType: {
                    code: null
                },
                resetAccrued: false,
                resetTaken: false
            };

            // Add the new rule
            addLeaveRule(newRule, ruleIndex + 1);
        }
    }

    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', { srcPanel: me });
    }

    // Save button click event handler
    function saveBtnClickEventHandler() {

        var ruleData = [];
        if (detailsNameTxt.getValue() === '') {
            saveBtn.showWarning('Please enter leave type name .');

            return;
        }

        var startDateValue = null;
        if (useStartDateRadio.getValue() === 'CUSD') {
            if (startDate.getValue() === '') {
                saveBtn.showWarning('Please enter the leave type start date.');
                return;
            }
            startDateValue = startDate.getValue();
        }

        saveBtn.showLoader();
        saveBtn.disable();

        for (var i = 0; i < rules.length; i++) {
            var completionCounter = 0;

            if (rules[i].monthTxt.getValue() === null || rules[i].monthTxt.getValue() === '') {
                completionCounter++;
            }

            if (rules[i].earnTxt.getValue() === null || rules[i].earnTxt.getValue() === '') {
                completionCounter++;
            }

            if (rules[i].xTxt.getValue() === null || rules[i].xTxt.getValue() === '') {
                completionCounter++;
            }

            if (rules[i].cycleTypeSelect.getValue() === null || rules[i].cycleTypeSelect.getValue() === '') {
                completionCounter++;
            }

            if (rules[i].resetSelect.getValue() === null || rules[i].resetSelect.getValue() === 'NONE') {
                if (completionCounter > 0) {
                    completionCounter++;
                }
            }

            if (completionCounter === 5) {
                continue;
            }
            else if (completionCounter < 5 && completionCounter > 0) {
                new lx.component.Messagebox({
                    title: 'Unable to edit leave type',
                    message: 'The leave type has an incomplete rule',
                    icon: 'icon_error'
                });
                saveBtn.hideLoader();
                saveBtn.enable();
                return;
            }
            else if (completionCounter === 0) {
                const resetValue = rules[i].resetSelect.getValue();

                let value = rules[i].resetIntervalTxt.getValue();
                if (value === null || value === undefined || value.trim() === "") {
                    resetInterval = 0;
                } else {
                    resetInterval = parseInt(rules[i].resetIntervalTxt.getValue())
                }

                let carryOverValue = rules[i].carryOverIntervalTxt.getValue();
                //console.log(carryOverValue);
                if (carryOverValue === null || carryOverValue === undefined || carryOverValue.trim() === "") {
                    carryOverInterval = 0;
                } else {
                    carryOverInterval = parseInt(rules[i].carryOverIntervalTxt.getValue())
                }

                //Check if default period is greater than or equal to accrualIntervalMonths of Year Cycles  
                if (resetValue !== 'NONE' && (rules[i].cycleTypeSelect.getValue() === 'YCST' || rules[i].cycleTypeSelect.getValue() === 'YCEN')) {
                    var accrualIntervalMonths = rules[i].xTxt.getValue() * 12
                    //console.log(accrualIntervalMonths);
                    if (accrualIntervalMonths > rules[i].resetIntervalTxt.getValue()) {
                        saveBtn.showWarning('Default period can\'t be less than Accrual interval.');
                        setTimeout(() => { rules[i].resetIntervalTxt.focus(); }, 2500);

                        //Clean up UI state to enable user to save after correcting interval
                        saveBtn.hideLoader();
                        saveBtn.enable();
                        return;
                    }
                };

                //Debugging:
                //console.log('Pushing rule:', rules[i]);

                ruleData.push({
                    id: rules[i].id,
                    month: parseInt(rules[i].monthTxt.getValue()),
                    amount: rules[i].earnTxt.getValue(),
                    days: parseInt(rules[i].xTxt.getValue()),
                    cycleType: rules[i].cycleTypeSelect.getValue(),
                    reset: rules[i].resetSelect.getValue(),
                    //Get reset section textbox values
                    resetInterval: resetInterval,
                    carryOverInterval: carryOverInterval
                });
            }

        }

        saveBtn.hideLoader();

        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=update',
            data: {
                leaveTypeId: config.leaveTypeId,
                leaveTypeName: detailsNameTxt.getValue(),
                earnType: earnTypeSelect.getValue(),
                startDate: startDateValue,
                ruleData: ruleData
            },
            onSuccess: function (responseText) {

                saveBtn.hideLoader();
                saveBtn.enable();
                loader.hide();

                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    saveBtn.showWarning(response.error);
                    return;
                }
                //Debugging:
                //console.log('FINAL ruleData:', ruleData);
                me.fireEvent('save', { srcPanel: me });
            }
        });
    }

    // Reset Rules Event Handler

    function createResetSection(parentEl) {

        // Create reset rules section
        const resetRulesSectionEl = lx.createElement('DIV', {
            parent: parentEl,
            style: {
                backgroundColor: '#FFFFFF',
                // margin: '0px 0px 0px 0px',
                // padding: '0px'
                marginTop: '10px'
            }
        });

        // Create the resetRulesHeadingEl element
        const resetRulesHeadingEl = lx.createElement('DIV', {
            parent: resetRulesSectionEl,
            style: {
                display: 'flex',
                width: '100%',
                marginTop: '10px',
                marginBottom: '2px',
                gap: '8px'

            }
        });

        // Left heading: Resetting Section
        const resettingHeading = lx.createElement('DIV', {
            parent: resetRulesHeadingEl,
            innerHTML: 'Resetting',
            style: {
                flex: '0 0 220px'
                // fontWeight: '600'
            }
        });

        // Right heading: Carry Over Section
        lx.createElement('DIV', {
            parent: resetRulesHeadingEl,
            // innerHTML: 'Carry Over',
            style: {
                flex: '1'
                //  fontWeight: '600'
            }
        })

        // Create row container for content section
        const resetRulesRow = lx.createElement('DIV', {
            parent: resetRulesSectionEl,
            style: {
                display: 'flex',
                //width: '100%',
                marginTop: '10px',
                alignItems: 'flex-start',
                //gap: '5px'
            }
        });

        //Left: Resetting section
        const leftColumn = lx.createElement('DIV', {
            parent: resetRulesRow,
            style: {
                //flex: '1'
                flex: '0 0 110px' //only take up needed space, not full size of column
            }
        });

        const resetRulesSelect = new lx.component.Selectbox({
            renderTo: leftColumn,
            margin: '0px',
            //minWidth: '150px',
            width: '100px',
            height: '35px',
            textColor: '#000',
            backgroundColor: '#FFFFFF',
            highlightColor: '#e0e0e0',
            items: [
                { value: 'NONE', text: 'None' },
                { value: 'TAKE', text: 'Taken' },
                { value: 'ACCR', text: 'Accrued' },
                { value: 'BOTH', text: 'Both' }
            ]
        });

        // Right column (Reset Interval Section)
        const rightColumn = lx.createElement('DIV', {
            parent: resetRulesRow,
            style: {
                flex: '1',
                // marginTop: '100px',
                maxWidth: '500px'
            }
        });

        //Reset Section container (reset interval & carry over)
        const resetIntervalRow = lx.createElement('DIV', {
            parent: rightColumn,
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: '0 0 auto'
            }
        });

        //Reset Interval Section
        const resetWrapper = lx.createElement('DIV', {
            parent: resetIntervalRow,
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: '0 0 auto'
            }
        });

        //Reset Interval textbox label
        new lx.component.Label({
            renderTo: resetWrapper,
            text: 'Default number of months in period:',
            style: {
                marginBottom: '0px'
            }
        });

        // Reset Interval textbox
        const resetIntervalTxt = new lx.component.Textbox({
            renderTo: resetWrapper,
            width: '60px'
        });

        //Carry Over Section
        const carryOverWrapper = lx.createElement('DIV', {
            parent: resetIntervalRow,
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: '0 0 auto'
            }
        });

        //Carry Over Interval textbox label
        new lx.component.Label({
            renderTo: carryOverWrapper,
            text: 'Months to carry over specified leave:',
            style: {
                marginBottom: '0px'
            }
        });

        //Carry Over Interval textbox
        const carryOverIntervalTxt = new lx.component.Textbox({
            renderTo: carryOverWrapper,
            width: '60px'
        });

        //Reset Interval Textbox validation - only whole numbers allowed as valid input
        resetIntervalTxt.addEventListener('change', function () {
            const value = resetIntervalTxt.getValue();
            if (!/^\d+$/.test(value)) {
                resetIntervalTxt.setValue('');
                resetIntervalTxt.showWarning('Please enter a valid whole number.');
                resetIntervalTxt.focus();
            }
            else {
                resetIntervalTxt.clearWarning();
            }
        });

        //Clear warning when user starts typing
        resetIntervalTxt.addEventListener('input', function () {
            resetIntervalTxt.clearWarning();
        });

        // Carry Over Textbox validation - only whole numbers allowed as valid input
        carryOverIntervalTxt.addEventListener('change', function () {
            const value = carryOverIntervalTxt.getValue();
            if (!/^\d+$/.test(value)) {
                carryOverIntervalTxt.setValue('');
                carryOverIntervalTxt.showWarning('Please enter a valid whole number.');
                carryOverIntervalTxt.focus();
            }
            else {
                carryOverIntervalTxt.clearWarning();
            }
        });

        //Clear warning when user starts typing
        carryOverIntervalTxt.addEventListener('input', function () {
            carryOverIntervalTxt.clearWarning();
        });

        //Set initial value of select box (default: none) and state of textboxes (disabled)
        resetRulesSelect.setValue('NONE');
        resetIntervalTxt.disable();
        carryOverIntervalTxt.disable();

        //Enable Reset Interval and Carry Over textbox editing when "taken", "both" or "accrued" is selected
        resetRulesSelect.addEventListener('change', function () {
            applyResetState(resetRulesSelect.getValue(), resetIntervalTxt, carryOverIntervalTxt, true);
        });

        //return data to make visible to add function
        return {
            section: resetRulesSectionEl,
            select: resetRulesSelect,
            resetIntervalText: resetIntervalTxt,
            carryOverIntervalText: carryOverIntervalTxt
        };
    }

    // Function to ensure default values are set and reset section textboxes are enabled when required
    function applyResetState(value, resetIntervalTxt, carryOverIntervalTxt, shouldFocus = false) {

        const shouldEnable = (value == 'TAKE' || value == 'ACCR' || value == 'BOTH');

        if (shouldEnable) {

            const resetValue = resetIntervalTxt.getValue();
            const cOValue = carryOverIntervalTxt.getValue();
            //Enable textboxes
            resetIntervalTxt.enable();
            carryOverIntervalTxt.enable();
            //Set default values without overriding user input
            if (resetValue === null || resetValue === undefined || resetValue === '') {
                resetIntervalTxt.setValue(12);
            }
            if (cOValue === null || cOValue === undefined || cOValue === '') {
                carryOverIntervalTxt.setValue(6);
            }
            //Set focus to first textbox when user changes selectbox from 'None'
            if (shouldFocus) {
                resetIntervalTxt.focus();
            }
        }
        else {
            //Disable textboxes if "None" is selected
            resetIntervalTxt.disable();
            carryOverIntervalTxt.disable();
            //Clear textboxes
            resetIntervalTxt.setValue('');
            carryOverIntervalTxt.setValue('');
            //Clear warnings
            resetIntervalTxt.clearWarning();
            carryOverIntervalTxt.clearWarning();
        }
    }

    // Function to remove border from last rule
    function updateRuleBorders() {

        rules.forEach(function (rule, index) {
            if (index === rules.length - 1) {
                rule.wrapper.style.borderWidth = '0px';
            }
            else {
                rule.wrapper.style.borderWidth = '0px 0px 1px 0px';
            }
        });

    }

    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};