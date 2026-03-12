/* globals app, lx */
'use strict';


// ADD LEAVE TYPE PANEL
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
app.panel.AddLeaveType = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var rules = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var presetsSectionEl = null;
    var presetRadioButton = null;
    
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
    var nextBtnContainerEl = null;
    var nextBtn = null;
    

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
        if( rules.length === 0 ) ruleMargin = '0px';
        
        // Create rule element.
        let ruleEl = lx.createElement('DIV', {
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '35px',
                margin: ruleMargin + ' 0px 0px 0px'
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
                {value: 'DWOR', text: 'Days worked'},
                {value: 'HWOR', text: 'Hours worked'},
                {value: 'PAYS', text: 'Payslips processed'},
                {value: 'DCEN', text: 'Day cycle (Accrue at end)'},
                {value: 'DCST', text: 'Day cycle (Accrue at beginning)'},
                {value: 'MCEN', text: 'Month cycle (Accrue at end)'},
                {value: 'MCST', text: 'Month cycle (Accrue at beginning)'},
                {value: 'YCEN', text: 'Year cycle (Accrue at end)'},
                {value: 'YCST', text: 'Year cycle (Accrue at beginning)'}
            ]
        });
        if( ruleData.accrualType.code === 'DWOR' ) ruleCycleTypeSelect.setValue('DWOR', 'Days worked');
        else if( ruleData.accrualType.code === 'HWOR' ) ruleCycleTypeSelect.setValue('HWOR', 'Hours worked');
        else if( ruleData.accrualType.code === 'PAYS' ) ruleCycleTypeSelect.setValue('PAYS', 'Payslips processed');
        else if( ruleData.accrualType.code === 'DCEN' ) ruleCycleTypeSelect.setValue('DCEN', 'Day cycle (Accrue at end)');
        else if( ruleData.accrualType.code === 'DCST' ) ruleCycleTypeSelect.setValue('DCST', 'Day cycle (Accrue at beginning)');
        else if( ruleData.accrualType.code === 'MCEN' ) ruleCycleTypeSelect.setValue('MCEN', 'Month cycle (Accrue at end)');
        else if( ruleData.accrualType.code === 'MCST' ) ruleCycleTypeSelect.setValue('MCST', 'Month cycle (Accrue at beginning)');
        else if( ruleData.accrualType.code === 'YCEN' ) ruleCycleTypeSelect.setValue('YCEN', 'Year cycle (Accrue at end)');
        else if( ruleData.accrualType.code === 'YCST' ) ruleCycleTypeSelect.setValue('YCST', 'Year cycle (Accrue at beginning)');
        
        // Create ruleResetSelect component
        let ruleResetSelect = new lx.component.Selectbox({
            renderTo: ruleEl,
            width: '100px',
            margin: '0px 0px 0px 10px',
            
            items: [
                {value: 'NONE', text: 'None'},
                {value: 'ACCR', text: 'Accrued'},
                {value: 'TAKE', text: 'Taken'},
                {value: 'BOTH', text: 'Both'}
            ]
        });
        if( ruleData.resetAccrued === true && ruleData.resetTaken === true ) ruleResetSelect.setValue('BOTH', 'Both');
        else if( ruleData.resetAccrued === true && ruleData.resetTaken === false ) ruleResetSelect.setValue('ACCR', 'Accrued');
        else if( ruleData.resetAccrued === false && ruleData.resetTaken === true) ruleResetSelect.setValue('TAKE', 'Taken');
        else if( ruleData.resetAccrued === false && ruleData.resetTaken === false ) ruleResetSelect.setValue('NONE', 'None');
        
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
        if( typeof insertIndex === 'undefined' || insertIndex === null || insertIndex >= rules.length || insertIndex < 0 ) {
            rulesContainerEl.appendChild( ruleEl );
            
            // Add rule to the rules array
            rules.push({
                id: ruleData.id,
                el: ruleEl,
                monthTxt: ruleMonthTxt,
                earnTxt: ruleEarnTxt,
                earnTypeDisplay: ruleEarnTypeDisplay,
                xTxt: ruleXTxt,
                cycleTypeSelect: ruleCycleTypeSelect,
                resetSelect: ruleResetSelect
            });
        }
        else {
            rulesContainerEl.insertBefore(ruleEl, rules[insertIndex].el);
            
            // Add rule to the rules array
            rules.splice(insertIndex, 0, {
                id: ruleData.id,
                el: ruleEl,
                monthTxt: ruleMonthTxt,
                earnTxt: ruleEarnTxt,
                xTxt: ruleXTxt,
                cycleTypeSelect: ruleCycleTypeSelect,
                resetSelect: ruleResetSelect
            });
        }
    }
    
    // Function to set focus to a given rule
    function focusRule(ruleIndex) {
        if( ruleIndex < 0 || ruleIndex >= rules.length ) return;
        
        rules[ruleIndex].monthTxt.focus();
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
            innerHTML: 'Add Leave Type'
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
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
        // PRESETS SECTION
        //
        
        presetsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                flex: '1 1 100%',
                margin: '0px 15px',
            }
        });
        
        // Create details heading component
        new lx.component.Heading({
            renderTo: presetsSectionEl,
            label: 'Presets',
            margin: '0px 0px',
            width: ''
        });
        
        // 
        presetRadioButton = new lx.component.RadioButtonGroup({
            renderTo: presetsSectionEl,
            margin: '0px 0px 0px 0px',
            minWidth: '500px',
            textColor: lx.style.global.backgroundColor,
            backgroundColor: lx.style.global.highlightColor,
            highlightColor: '#56B174', // '#35C062', // '#909090', // '#30313C', // '#FF6D00', // '#C0C0C0', // lx.style.global.highlightColor,
            
            items: [
                {
                    text: 
                        '<div style="margin: auto 0px; display: flex; flex-direction: row;">' + 
                            '<div style="margin: auto 0px; font-size: 14px; min-width: 120px;">Annual Leave</div> ' + 
                            '<div style="font-size: 14px; flex: 1 1 100%;">A set amount of leave is earned at the beginning of each year</div> ' + 
                        '</div>', 
                    value: 'ANNU'
                },
                {
                    text: 
                        '<div style="margin: auto 0px; display: flex; flex-direction: row;">' + 
                            '<div style="margin: auto 0px; font-size: 14px; min-width: 120px;">Monthly Leave</div> ' + 
                            '<div style="font-size: 14px; flex: 1 1 100%;">A set amount of leave is earned at the end of every month</div> ' + 
                            // '<div style="font-size: 9px;">A set amount of leave is earned at the end of every month</div> ' +
                        '</div>', 
                    value: 'MONT'
                },
                {
                    text: 
                        '<div style="margin: auto 0px; display: flex; flex-direction: row;">' + 
                            '<div style="margin: auto 0px; font-size: 14px; min-width: 120px;">Daily Leave</div> ' + 
                            '<div style="margin: auto 0px; display: flex; flex-direction: row; flex: 1 1 100%;">' + 
                                '<div style="margin: auto 0px; font-size: 14px; flex: 1 1 100%;">Leave is earned for a set number of days worked</div> ' + 
                                '<div style="margin: auto 0px auto 15px; font-size: 18px; color: #AF2C2C;"><i class="fas fa-exclamation-triangle" style="margin: 0px 5px auto 0px;"></i></div> ' +
                                '<div style="margin: auto 20px auto 5px; font-size: 12px; flex: 1 1 100%; max-width: 180px; min-width: 180px; color: #AF2C2C;">Work-schedule is required for employees not earning a daily wage</div> ' +
                            '</div>' +
                        '</div>', 
                    value: 'DAIL'
                },
                {
                    text: 
                        '<div style="margin: auto 0px; display: flex; flex-direction: row;">' + 
                            '<div style="margin: auto 0px; font-size: 14px; min-width: 120px;">Hourly Leave</div> ' + 
                            '<div style="margin: auto 0px; display: flex; flex-direction: row; flex: 1 1 100%;">' + 
                                '<div style="margin: auto 0px; font-size: 14px; flex: 1 1 100%;">Leave is earned for a set number of hours worked</div> ' + 
                                '<div style="margin: auto 0px auto 15px; font-size: 18px; color: #AF2C2C;"><i class="fas fa-exclamation-triangle" style="margin: 0px 5px auto 0px;"></i></div> ' +
                                '<div style="margin: auto 20px auto 5px; font-size: 12px; flex: 1 1 100%; max-width: 180px; min-width: 180px; color: #AF2C2C;">Only for employees earning an hourly wage</div> ' +
                            '</div>' +
                        '</div>', 
                    value: 'HOUR'
                },
                {
                    text: 
                        '<div style="margin: auto 0px; display: flex; flex-direction: row;">' + 
                            '<div style="margin: auto 0px; font-size: 14px; min-width: 120px;">Custom Leave</div> ' + 
                            '<div style="font-size: 14px; flex: 1 1 100%;">Create a leave type with one or more custom rules</div> ' + 
                        '</div>', 
                    value: 'CUST'
                }
            ],
            
            
            onChange: function() {
                // Depending on the preset selected
                if( presetRadioButton.getValue() == 'ANNU' ) {
                    // Setup the leave type
                    detailsNameTxt.setValue('Annual Leave');
                    earnTypeSelect.setValue('DAYS', 'Days');
                    useStartDateRadio.setValue('CUSD');
                    useStartDateRadio.fireEvent('change', {srcPanel: me});
                    
                    // Set default start date to the beginnig of the year
                    let currentDate = new Date();
                    startDate.setValue( currentDate.getFullYear() + '-01-01');
                    
                    // Remove all existing rules
                    for( let i = rules.length-1; i >= 0; i-- ) {
                        rulesContainerEl.removeChild( rules[i].el );
                        rules.splice(i, 1);
                    }
                    
                    // Have all rules been removed?
                    if( rules.length === 0 ) {
                        // Setup the preset rule
                        let newRule = {
                            id: null,
                            startMonth: '1',
                            amount: '15',
                            unit: {
                                code: 'DAYS'
                            },
                            accrualInterval: '1',
                            accrualType: {
                                code: 'YCST'
                            },
                            resetAccrued: false,
                            resetTaken: false
                        };
                        
                        // Add the new rule
                        addLeaveRule(newRule, 1);
                    }
                    
                    // Update rules according to earn type
                    earnTypeSelect.fireEvent('change', {srcPanel: me});
                }
                else if( presetRadioButton.getValue() == 'MONT' ) {
                    // Setup the leave type
                    detailsNameTxt.setValue('Monthly Leave');
                    earnTypeSelect.setValue('DAYS', 'Days');
                    useStartDateRadio.setValue('EMPD');
                    useStartDateRadio.fireEvent('change', {srcPanel: me});
                    startDate.setValue('');
                    
                    // Remove all existing rules
                    for( let i = rules.length-1; i >= 0; i-- ) {
                        rulesContainerEl.removeChild( rules[i].el );
                        rules.splice(i, 1);
                    }
                    
                    // Have all rules been removed?
                    if( rules.length === 0 ) {
                        // Setup the preset rule
                        let newRule = {
                            id: null,
                            startMonth: '1',
                            amount: '1.25',
                            unit: {
                                code: 'DAYS'
                            },
                            accrualInterval: '1',
                            accrualType: {
                                code: 'MCEN'
                            },
                            resetAccrued: false,
                            resetTaken: false
                        };
                        
                        // Add the new rule
                        addLeaveRule(newRule, 1);
                    }
                    
                    // Update rules according to earn type
                    earnTypeSelect.fireEvent('change', {srcPanel: me});
                }
                else if( presetRadioButton.getValue() == 'DAIL' ) {
                    // Setup the leave type
                    detailsNameTxt.setValue('Daily Leave');
                    earnTypeSelect.setValue('DAYS', 'Days');
                    useStartDateRadio.setValue('EMPD');
                    useStartDateRadio.fireEvent('change', {srcPanel: me});
                    startDate.setValue('');
                    
                    // Remove all existing rules
                    for( let i = rules.length-1; i >= 0; i-- ) {
                        rulesContainerEl.removeChild( rules[i].el );
                        rules.splice(i, 1);
                    }
                    
                    // Have all rules been removed?
                    if( rules.length === 0 ) {
                        // Setup the preset rule
                        let newRule = {
                            id: null,
                            startMonth: '1',
                            amount: '1',
                            unit: {
                                code: 'DAYS'
                            },
                            accrualInterval: '17',
                            accrualType: {
                                code: 'DWOR'
                            },
                            resetAccrued: false,
                            resetTaken: false
                        };
                        
                        // Add the new rule
                        addLeaveRule(newRule, 1);
                    }
                    
                    // Update rules according to earn type
                    earnTypeSelect.fireEvent('change', {srcPanel: me});
                }
                else if( presetRadioButton.getValue() == 'HOUR' ) {
                    // Setup the leave type
                    detailsNameTxt.setValue('Hourly Leave');
                    earnTypeSelect.setValue('HOUR', 'Hours');
                    useStartDateRadio.setValue('EMPD');
                    useStartDateRadio.fireEvent('change', {srcPanel: me});
                    startDate.setValue('');
                    // Remove all existing rules
                    for( let i = rules.length-1; i >= 0; i-- ) {
                        rulesContainerEl.removeChild( rules[i].el );
                        rules.splice(i, 1);
                    }
                    
                    // Have all rules been removed?
                    if( rules.length === 0 ) {
                        // Setup the preset rule
                        let newRule = {
                            id: null,
                            startMonth: '1',
                            amount: '1',
                            unit: {
                                code: 'HOUR'
                            },
                            accrualInterval: '17',
                            accrualType: {
                                code: 'HWOR'
                            },
                            resetAccrued: false,
                            resetTaken: false
                        };
                        
                        // Add the new rule
                        addLeaveRule(newRule, 1);
                    }
                    
                    // Update rules according to earn type
                    earnTypeSelect.fireEvent('change', {srcPanel: me});
                }
                else if( presetRadioButton.getValue() == 'CUST' ) {
                    // Setup the leave type
                    detailsNameTxt.setValue('');
                    earnTypeSelect.setValue('DAYS', 'Days');
                    useStartDateRadio.setValue('EMPD');
                    useStartDateRadio.fireEvent('change', {srcPanel: me});
                    startDate.setValue('');
                    
                    // Remove all existing rules
                    for( let i = rules.length-1; i >= 0; i-- ) {
                        rulesContainerEl.removeChild( rules[i].el );
                        rules.splice(i, 1);
                    }
                    
                    // Have all rules been removed?
                    if( rules.length === 0 ) {
                        // Setup the preset rule
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
                        addLeaveRule(newRule, 1);
                    }
                    
                    // Update rules according to earn type
                    earnTypeSelect.fireEvent('change', {srcPanel: me});
                }
            }
        });
        presetRadioButton.setValue('CUST');
        
        
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
            margin: '15px 0px 0px 0px',
            maxWidth: '500px',
            
            items: [
                {text: 'Days', value: 'DAYS'},
                {text: 'Hours', value: 'HOUR'}
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
            margin: '0px 0px 0px 0px',
            minWidth: '500px',
            
            items: [
                {text: 'Employment Date', value: 'EMPD'},
                {text: 'Custom Date', value: 'CUSD'}
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
                color:  lx.style.global.backgroundColor,
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
        useStartDateInfoEl.addEventListener('mouseenter', function() { useStartDateInfoTooltip.show(); });
        useStartDateInfoEl.addEventListener('mouseleave', function() { useStartDateInfoTooltip.hide(); });
        
        // Create the startDateContainerEl
        startDateContainerEl = lx.createElement('DIV', {
            parent: detailsSectionEl,
            style: {
                display: 'none',
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                width: '100%',
                maxWidth: '500px'
            }
        });
        
        // Create the startDate component
        startDate = new lx.component.DatePicker({
            renderTo: startDateContainerEl,
            label: 'Start Date'
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
            label: 'Rules',
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
                color:  lx.style.global.backgroundColor,
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
                    '<span style="font-size: 12px;">' +  
                        'Rules determine when and how leave is earned and consist of the following components:<br><br>' +
                        '&quot;From Month&quot; - Indicates the number of months from the employment date or user specified date before the rule takes effect.<br><br>' +
                        '&quot;Earn&quot; - The number of days/hours of leave to earn when the rule takes effect.<br><br>' +
                        '&quot;Every&quot; - Specifies the frequency of leave earned. For example: &quot;8 hours worked&quot; if the employee earns leave for every 8 hours worked, or &quot;1 year cycle (accrue at beginning)&quot; if leave is earned at the beginning of every year.<br><br>' +
                        '&quot;Resetting&quot; - Indicates what happens to any existing leave taken and accrued when the rule takes effect. Can be one of the following: ' + 
                        '&quot;None&quot; - the current accrued leave and leave taken will be preserved. ' +
                        '&quot;Both&quot; - any accrued leave will be lost and any leave taken will be reset to zero. ' +
                        '&quot;Accrued&quot; - any accrued leave will be lost. ' +
                        '&quot;Taken&quot; - any leave taken will be reset to zero.<br><br>' +
                        'For example, if an employee has earned 7 days leave, has taken 1 day, and earns another 5 days when the rule takes effect: ' + 
                        'If &quot;None&quot; was specified the employee will now have 11 days [5+7-1]. ' +
                        'If &quot;Both&quot; was specified the employee will now have 5 days [5+0-0]. ' +
                        'If &quot;Accrued&quot; was specified the employee will now have 4 days [5+0-1]. ' +
                        'If &quot;Taken&quot; was specified the employee will now have 12 [5+7-0]. ' +
                    '</span>' // +
                // '</dive>'
        });
        rulesHeadingInfoEl.addEventListener('mouseenter', function() { rulesHeadingInfoTooltip.show(); });
        rulesHeadingInfoEl.addEventListener('mouseleave', function() { rulesHeadingInfoTooltip.hide(); });
        
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
        
        // Create the rulesHeadingEl element
        rulesHeadingEl = lx.createElement('DIV', {
            parent: rulesSectionEl,
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
                '<div style="width: 310px; margin: 0px 0px 0px 10px;">Every</div>' + 
                '<div style="width: 80px; margin: 0px 0px 0px 10px;">Resetting</div>'
        });
        
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
        
        // Create the nextBtnContainerEl element
        nextBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the nextBtn component
        nextBtn = new lx.component.Button({
            renderTo: nextBtnContainerEl,
            label: 'Save',
            width: '120px',
            
            onClick: nextBtnClickEventHandler
        });
        
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
        detailsNameTxt.focus();
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
    
    // earnTypeSelect change event handler
    function earnTypeSelectChangeEventHandler() {
        for( let i = 0; i < rules.length; i++ ) {
            rules[i].earnTypeDisplay.setText(earnTypeSelect.getText());
        }
    }
    
    // useStartDateRadio change event handler
    function useStartDateRadioOnChangeEventHandler() {
        // Allow the user to specify a custom start date for the leave type?
        if( useStartDateRadio.getValue() === 'CUSD' ) {
            startDate.enable();
            lx.applyStyle(startDateContainerEl, {display: 'block'});
        } else {
            startDate.disable();
            lx.applyStyle(startDateContainerEl, {display: 'none'});
        }
    }
    
    // Rule addBtnEl click event handler
    function ruleAddBtnElClickEventHandler( event ) {
        // Find the rule that was clicked
        let ruleIndex = null;
        for( let i = 0; i < rules.length; i++ ) {
            if( rules[i].el === event.currentTarget.parentElement ) {
                ruleIndex = i;
                break;
            }
        }
        
        // If no ruleIndex is set then we did not find the rule.
        if( ruleIndex === null ) return;
        
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
    function ruleRemoveBtnElClickEventHandler( event ) {
        // Find the rule that was clicked
        let ruleIndex = null;
        for( let i = 0; i < rules.length; i++ ) {
            if( rules[i].el === event.currentTarget.parentElement ) {
                ruleIndex = i;
                break;
            }
        }
        
        // If no ruleIndex is set then we did not find the rule.
        if( ruleIndex === null ) return;
        
        // Remove the rule element
        rulesContainerEl.removeChild( rules[ruleIndex].el );
        rules.splice(ruleIndex, 1);
        
        // If the first item was removed fix padding
        if( ruleIndex === 0 && rules.length > 0 ) {
            rules[0].el.style.margin = '0px';
        }
        
        // If there are 0 rules add an empty rule.
        if( rules.length === 0 ) {
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
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function nextBtnClickEventHandler() {
        var ruleData = [];
        if( detailsNameTxt.getValue() === '' ) {
            nextBtn.showWarning('Please enter leave type name.');
            return;
        }
        
        var startDateValue = null;
        if( useStartDateRadio.getValue() === 'CUSD' ) {
            if( startDate.getValue() === '' ) {
                nextBtn.showWarning('Please enter the leave type start date.');
                return;
            }
            startDateValue = startDate.getValue();
        }
        
        for (var i = 0; i < rules.length; i++) {
            var completionCounter = 0;
            
            if (rules[i].monthTxt.getValue() === null || rules[i].monthTxt.getValue() === '') {
                completionCounter++;
            }
            
            if(rules[i].earnTxt.getValue() === null || rules[i].earnTxt.getValue() === '') {
                completionCounter++;
            }
            
            if(rules[i].xTxt.getValue() === null || rules[i].xTxt.getValue() === '') {
                completionCounter++;
            }
            
            if(rules[i].cycleTypeSelect.getValue() === null || rules[i].cycleTypeSelect.getValue() === '') {
                completionCounter++;
            }
            
            if(rules[i].resetSelect.getValue() === null || rules[i].resetSelect.getValue() === 'NONE') {
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
                return;
            }
            else if(completionCounter === 0) {
                ruleData.push({
                    id: rules[i].id,
                    month: parseInt(rules[i].monthTxt.getValue()),
                    amount: rules[i].earnTxt.getValue(),
                    days: parseInt(rules[i].xTxt.getValue()),
                    cycleType: rules[i].cycleTypeSelect.getValue(),
                    reset: rules[i].resetSelect.getValue()
                });
            }
        }
        
        nextBtn.showLoader();
        nextBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=add',
            data: {
                leaveTypeId: config.leaveTypeId,
                leaveTypeName: detailsNameTxt.getValue(),
                earnType: earnTypeSelect.getValue(),
                startDate: startDateValue,
                ruleData: ruleData
            },
            onSuccess: function( responseText ) {
                
                nextBtn.hideLoader();
                nextBtn.enable();
                
                var response = JSON.parse( responseText );
                
                if( response.ok !== true ) {
                    nextBtn.showWarning(response.error);
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