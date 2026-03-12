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
app.panel.EditEmployeeEmploymentDetails = function(config) {
    
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
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                var departments = [];
                departments.push({value: null, text: 'None'});
                for( var i = 0; i < response.departments.length; i++ ) {
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                }
                
                // departmentSelect.clear();
                departmentSelect.addItems( departments );
            }
        });
    }
    
    function loadPaymentMethods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentMethodList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }
                
                var paymentMethods = [];
                for( var i = 0; i < response.paymentMethods.length; i++ ) {
                    paymentMethods.push({
                        value: response.paymentMethods[i].code,
                        text: response.paymentMethods[i].name
                    });
                }
                
                // paymentMethodSelect.clear();
                paymentMethodSelect.addItems( paymentMethods );
            }
        });
    }
    
    function loadPaymentPeriods() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPaymentPeriodList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payment Methods Failed',
                        message: response.error
                    });
                }
                
                var paymentPeriods = [];
                for( var i = 0; i < response.paymentPeriods.length; i++ ) {
                    // if( response.paymentPeriods[i].code === 'BWEE' ) continue; // Hide the bi-weekly option for now
                    paymentPeriods.push({
                        value: response.paymentPeriods[i].code,
                        text: response.paymentPeriods[i].name
                    });
                }
                
                // paymentPeriodSelect.clear();
                paymentPeriodSelect.addItems( paymentPeriods );
            }
        });
    }
    
    function loadDismissalReasons() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getDismissalReasonList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Reasons Failed',
                        message: response.error
                    });
                }
                
                var reasons = [];
                for( var i = 0; i < response.reasons.length; i++ ) {
                    reasons.push({
                        value: response.reasons[i].code,
                        text: response.reasons[i].name
                    });
                }
                
                dismissalReasonSelect.clear();
                dismissalReasonSelect.addItems( reasons );
            }
        });
    }
    
    function loadEmployee() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=get',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
                
                // Set employment details
                if( response.employee.employmentStartDate !== null ) employmentStartDate.setValue( response.employee.employmentStartDate );
                employmentPositionTxt.setValue( response.employee.employmentPosition );
                departmentSelect.setValue( null, 'None' );
                if( response.employee.departmentId != null && response.employee.departmentId != 0 ) {
                    departmentSelect.setValue( response.employee.departmentId, response.employee.departmentName );
                }
                paymentMethodSelect.setValue( response.employee.paymentMethodCode, response.employee.paymentMethodName );
                paymentPeriodSelect.setValue( response.employee.paymentPeriodCode, response.employee.paymentPeriodName );
                paymentPeriodSelectChangeEventHandler();
                
                if( response.employee.employmentEndDate !== null ) {
                    lx.applyStyle(dismissalContainerEl, {display: 'block'});
                    employmentEndDate.setValue( response.employee.employmentEndDate );
                    dismissalReasonSelect.setValue( response.employee.dismissalReasonCode, response.employee.dismissalReasonName );
                }
                else {
                    lx.applyStyle(dismissalContainerEl, {display: 'none'});
                }
                
                var value = '';
                if( response.employee.paymentPeriodCode === 'WEEK' ) {
                    if( response.employee.paymentPeriodEndDay === 1 ) value = 'Monday';
                    else if( response.employee.paymentPeriodEndDay === 2 ) value = 'Tuesday';
                    else if( response.employee.paymentPeriodEndDay === 3 ) value = 'Wednesday';
                    else if( response.employee.paymentPeriodEndDay === 4 ) value = 'Thursday';
                    else if( response.employee.paymentPeriodEndDay === 5 ) value = 'Friday';
                    else if( response.employee.paymentPeriodEndDay === 6 ) value = 'Saturday';
                    else if( response.employee.paymentPeriodEndDay === 0 ) value = 'Sunday';
                }
                else if( response.employee.paymentPeriodCode === 'BWEE' ) {
                    if( response.employee.paymentPeriodEndDay === 1 ) value = 'Monday';
                    else if( response.employee.paymentPeriodEndDay === 2 ) value = 'Tuesday';
                    else if( response.employee.paymentPeriodEndDay === 3 ) value = 'Wednesday';
                    else if( response.employee.paymentPeriodEndDay === 4 ) value = 'Thursday';
                    else if( response.employee.paymentPeriodEndDay === 5 ) value = 'Friday';
                    else if( response.employee.paymentPeriodEndDay === 6 ) value = 'Saturday';
                    else if( response.employee.paymentPeriodEndDay === 0 ) value = 'Sunday';
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
                else if( response.employee.paymentPeriodCode === 'MONT' ) {
                    if( response.employee.paymentPeriodEndDay === 0 ) {
                        value = 'Last Day';
                    }
                    else {
                        if( response.employee.paymentPeriodEndDay !== null ) {
                            value = response.employee.paymentPeriodEndDay;
                        }
                    }
                }
                
                paymentPeriodEndDaySelect.setValue( response.employee.paymentPeriodEndDay, value );
                
                value = '';
                if( response.employee.paymentPeriodCode === 'WEEK' ) {
                    if( response.employee.paymentDay === 1 ) value = 'Monday';
                    else if( response.employee.paymentDay === 2 ) value = 'Tuesday';
                    else if( response.employee.paymentDay === 3 ) value = 'Wednesday';
                    else if( response.employee.paymentDay === 4 ) value = 'Thursday';
                    else if( response.employee.paymentDay === 5 ) value = 'Friday';
                    else if( response.employee.paymentDay === 6 ) value = 'Saturday';
                    else if( response.employee.paymentDay === 0 ) value = 'Sunday';
                }
                else if( response.employee.paymentPeriodCode === 'BWEE' ) {
                    if( response.employee.paymentDay === 1 ) value = 'Monday';
                    else if( response.employee.paymentDay === 2 ) value = 'Tuesday';
                    else if( response.employee.paymentDay === 3 ) value = 'Wednesday';
                    else if( response.employee.paymentDay === 4 ) value = 'Thursday';
                    else if( response.employee.paymentDay === 5 ) value = 'Friday';
                    else if( response.employee.paymentDay === 6 ) value = 'Saturday';
                    else if( response.employee.paymentDay === 0 ) value = 'Sunday';
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
                else if( response.employee.paymentPeriodCode === 'MONT' ) {
                    if( response.employee.paymentDay === 0 ) {
                        value = 'Last Day';
                    }
                    else {
                        if( response.employee.paymentDay !== null ) {
                            value = response.employee.paymentDay;
                        }
                    }
                }
                
                paymentDaySelect.setValue( response.employee.paymentDay, value );
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
            
            employeeId: null
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
        employmentStartDate.focus();
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
    
    // paymentPeriodSelect change event handler
    function paymentPeriodSelectChangeEventHandler() {
        
        var days = [];
        
        // Set the payment day values depending on the payment period
        if( paymentPeriodSelect.getValue() === 'WEEK' ) {
            days.push(
                {value: 1, text: 'Monday'},
                {value: 2, text: 'Tuesday'},
                {value: 3, text: 'Wednesday'},
                {value: 4, text: 'Thursday'},
                {value: 5, text: 'Friday'},
                {value: 6, text: 'Saturday'},
                {value: 0, text: 'Sunday'}
            );
        }
        else if( paymentPeriodSelect.getValue() === 'BWEE' ) {
            days.push(
                {value: 1, text: 'Monday'},
                {value: 2, text: 'Tuesday'},
                {value: 3, text: 'Wednesday'},
                {value: 4, text: 'Thursday'},
                {value: 5, text: 'Friday'},
                {value: 6, text: 'Saturday'},
                {value: 0, text: 'Sunday'}
                // {value:  1, text: 'Week 1: Monday'},
                // {value:  2, text: 'Week 1: Tuesday'},
                // {value:  3, text: 'Week 1: Wednesday'},
                // {value:  4, text: 'Week 1: Thursday'},
                // {value:  5, text: 'Week 1: Friday'},
                // {value:  6, text: 'Week 1: Saturday'},
                // {value:  0, text: 'Week 1: Sunday'},
                // {value:  8, text: 'Week 2: Monday'},
                // {value:  9, text: 'Week 2: Tuesday'},
                // {value: 10, text: 'Week 2: Wednesday'},
                // {value: 11, text: 'Week 2: Thursday'},
                // {value: 12, text: 'Week 2: Friday'},
                // {value: 13, text: 'Week 2: Saturday'},
                // {value:  7, text: 'Week 2: Sunday'}
            );
        }
        else if( paymentPeriodSelect.getValue() === 'MONT' ) {
            for( var i = 1; i < 29; i++ ) {
                days.push({value: i, text: i});
            }
            days.push({value: 0, text: 'Last Day'});
        }
        else {
            return;
        }
        
        // Set and display the payment period end days
        paymentPeriodEndDaySelect.setValue(null, '');
        paymentPeriodEndDaySelect.clear();
        paymentPeriodEndDaySelect.addItems( days );
        paymentPeriodEndDaySelect.show();
        
        // Set and display the payment days
        paymentDaySelect.setValue(null, '');
        paymentDaySelect.clear();
        paymentDaySelect.addItems( days );
        paymentDaySelect.show();
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Check all required values
        if( employmentStartDate.getValue() === '' || employmentStartDate.getValue() === null) {
            saveBtn.showWarning('The employment date can not be empty.');
            return;
        }
        
        // if( employmentPositionTxt.getValue().trim() === '' ) {
            // saveBtn.showWarning('The employment position can not be empty.');
            // return;
        // }
        
        if( paymentMethodSelect.getValue() === null ) {
            saveBtn.showWarning('The payment method can not be empty.');
            return;
        }
        
        if( paymentPeriodSelect.getValue() === null ) {
            saveBtn.showWarning('The payment period can not be empty.');
            return;
        }
        
        if( paymentPeriodEndDaySelect.getValue() === null ) {
            saveBtn.showWarning('The payment day can not be empty.');
            return;
        }
        
        if( paymentDaySelect.getValue() === null ) {
            saveBtn.showWarning('The payment day can not be empty.');
            return;
        }
        
        // Make provision for null values for the department
        var departmentId = -1;
        if( departmentSelect.getValue() !== null ) {
            departmentId = parseInt(departmentSelect.getValue());
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        var employmentStart = employmentStartDate.getValue();
        if( employmentStart == '' ) employmentStart = null;
        
        var employmentEnd = employmentEndDate.getValue();
        if( employmentEnd == '' ) employmentEnd = null;
        
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
                paymentDay: parseInt(paymentDaySelect.getValue())
            },
            onSuccess: function( responseText ) {
                
                saveBtn.hideLoader();
                saveBtn.enable();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    saveBtn.showWarning(response.error);
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