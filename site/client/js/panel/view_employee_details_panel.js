/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE DETAILS PANEL
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
app.panel.ViewEmployeeDetails = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var personalDetailsHeadingEl = null;
    var personalDetailsEditBtn = null;
    var personalDetailsSectionEl = null;
    var employeeNameDisplay = null;
    var fullNamesDisplay = null;
    var aliasDisplay = null;
    var idNumberDisplay = null;
    var passportNumberDisplay = null;
    var dateOfBirthDisplay = null;
    var asylumSeekerDisplay = null;
    var refugeeDisplay = null;
    var retiredDisplay = null;
    
    var contactDetailsHeadingEl = null;
    var contactDetailsEditBtn = null;
    var contactDetailsSectionEl = null;
    var homeNumberDisplay = null;
    var workNumberDisplay = null;
    var cellNumberDisplay = null;
    var faxNumberDisplay = null;
    var emailAddressDisplay = null;
    var emergencyContactPersonDisplay = null;
    var emergencyContactNumberDisplay = null;
    
    var addressHeadingEl = null;
    var addressDetailsEditBtn = null;
    var addressSectionEl = null;
    var physicalAddressDisplay = null;
    var postalAddressDisplay = null;
    var workAddressDisplay = null;
    
    var bankDetailsHeadingEl = null;
    var bankDetailsEditBtn = null;
    var bankDetailsSectionEl = null;
    var bankDetailsInstitutionDisplay = null;
    var bankDetailsAccountTypeDisplay = null;
    var bankDetailsAccountNumberDisplay = null;
    var bankDetailsBranchCodeDisplay = null;
    
    var employmentDetailsHeadingEl = null;
    var employmentDetailsEditBtn = null;
    var employmentDetailsSectionEl = null;
    var employmentDetailsPeriod = null;
    var employmentDurationDisplay = null;
    var employmentEndReasonDisplay = null;
    var employmentPositionDisplay = null;
    var departmentDisplay = null;
    var paymentMethodDisplay = null;
    var paymentPeriodDisplay = null;
    var paymentPeriodEndDayDisplay = null;
    var paymentDayDisplay = null;
    
    var scheduleDetailsHeadingEl = null;
    var scheduleDetailsEditBtn = null;
    var scheduleDetailsSectionEl = null;
    var scheduleDetailsDisplayEl = null;
    var enableLeaveCb = null;
    
    var taxDetailsHeadingEl = null;
    var taxDetailsEditBtn = null;
    var taxDetailsSectionEl = null;
    var incomeTaxNumberDisplay = null;
    var enablePayeCorrectionDisplay = null;
    var incomeTaxDirective1Display = null;
    var incomeTaxDirective1IssuedOnDisplay = null;
    var incomeTaxDirective1SourceDisplay = null;
    var incomeTaxDirective1AmountDisplay = null;
    var incomeTaxDirective2Display = null;
    var incomeTaxDirective2IssuedOnDisplay = null;
    var incomeTaxDirective2SourceDisplay = null;
    var incomeTaxDirective2AmountDisplay = null;
    var incomeTaxDirective3Display = null;
    var incomeTaxDirective3IssuedOnDisplay = null;
    var incomeTaxDirective3SourceDisplay = null;
    var incomeTaxDirective3AmountDisplay = null;
    var sicCodeDisplay = null;
    
    var employeeId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadEmployee( isUpdated ) {
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
                
                var value = '-';
                
                // Set personal details
                var isAsylumSeeker = 'No';
                var isRefugee = 'No';
                var isRetired = 'No';
                
                if( response.employee.isAsylumSeeker ) isAsylumSeeker = 'Yes';
                if( response.employee.isRefugee ) isRefugee = 'Yes';
                if( response.employee.isRetired ) isRetired = 'Yes';
                
                value = '';
                if( response.employee.titleName !== '' ) value = value + response.employee.titleName;
                if( response.employee.initials !== '' ) {
                    if( value !== '' ) value = value + ' ';
                    value = value + response.employee.initials;
                }
                if( response.employee.lastName !== '' ) {
                    if( value !== '' ) value = value + ' ';
                    value = value + response.employee.lastName;
                }
                if( value === '' ) value = '-';
                employeeNameDisplay.setValue( value );
                
                value = '-';
                if( response.employee.fullNames !== '' ) value = response.employee.fullNames;
                fullNamesDisplay.setValue( value );
                
                value = '-';
                if( response.employee.alias !== '' ) value = response.employee.alias;
                aliasDisplay.setValue( value );
                var employeeName = value;
                
                value = '-';
                if( response.employee.idNumber !== '' ) value = response.employee.idNumber;
                idNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.passportNumber !== '' ) {
                    value = response.employee.passportNumber;
                    if( response.employee.passportCountryName !== null ) value = value + ' (' + response.employee.passportCountryName + ')';
                }
                passportNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.dateOfBirth !== '' ) value = response.employee.dateOfBirth;
                dateOfBirthDisplay.setValue( value );
                
                asylumSeekerDisplay.setValue(isAsylumSeeker);
                refugeeDisplay.setValue(isRefugee);
                retiredDisplay.setValue(isRetired);
                
                // Set contact details
                value = '-';
                if( response.employee.emailAddress !== '' ) value = response.employee.emailAddress;
                emailAddressDisplay.setValue( value );
                
                value = '-';
                if( response.employee.cellNumber !== '' ) value = response.employee.cellNumber;
                cellNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.homeNumber !== '' ) value = response.employee.homeNumber;
                homeNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.workNumber !== '' ) value = response.employee.workNumber;
                workNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.faxNumber !== '' ) value = response.employee.faxNumber;
                faxNumberDisplay.setValue( value );
                
                value = '-';
                if( response.employee.emergencyContactPerson !== '' ) value = response.employee.emergencyContactPerson;
                emergencyContactPersonDisplay.setValue( value );
                
                value = '-';
                if( response.employee.emergencyContactNumber !== '' ) value = response.employee.emergencyContactNumber;
                emergencyContactNumberDisplay.setValue( value );
                
                // Set physical address details
                value = '';
                if( response.employee.physicalAddressUnit !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressUnit;
                }
                if( response.employee.physicalAddressComplex !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressComplex;
                }
                if( response.employee.physicalAddressStreet !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressStreet;
                }
                if( response.employee.physicalAddressSuburb !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressSuburb;
                }
                if( response.employee.physicalAddressCity !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressCity;
                }
                if( response.employee.physicalAddressPostalCode !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressPostalCode;
                }
                if( response.employee.physicalAddressCountryName !== null ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.physicalAddressCountryName;
                }
                
                if( value === '' ) value = '-';
                physicalAddressDisplay.setValue( value );
                
                // Set postal address details
                value = '';
                if( response.employee.postalAddressLine1 !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.postalAddressLine1;
                }
                if( response.employee.postalAddressLine2 !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.postalAddressLine2;
                }
                if( response.employee.postalAddressLine3 !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.postalAddressLine3;
                }
                if( response.employee.postalAddressCode !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.postalAddressCode;
                }
                if( response.employee.postalAddressCountryName !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.postalAddressCountryName;
                }
                
                if( value === '' ) value = '-';
                postalAddressDisplay.setValue( value );
                
                // Set work address details
                value = '';
                if( response.employee.workAddressUnit !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressUnit;
                }
                if( response.employee.workAddressComplex !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressComplex;
                }
                if( response.employee.workAddressStreet !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressStreet;
                }
                if( response.employee.workAddressSuburb !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressSuburb;
                }
                if( response.employee.workAddressCity !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressCity;
                }
                if( response.employee.workAddressPostalCode !== '' ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressPostalCode;
                }
                if( response.employee.workAddressCountryName !== null ) {
                    if( value !== '' ) value = value + ', ';
                    value = value + response.employee.workAddressCountryName;
                }
                
                if( value === '' ) value = '-';
                workAddressDisplay.setValue( value );
                
                // Set bank details
                let bankDetails = response.employee.bankDetails;
                
                if( bankDetails.financialInstitution === null ) bankDetailsInstitutionDisplay.setValue('-');
                else bankDetailsInstitutionDisplay.setValue( bankDetails.financialInstitution.name );
                
                if( bankDetails.accountType === null ) bankDetailsAccountTypeDisplay.setValue('-');
                else bankDetailsAccountTypeDisplay.setValue( bankDetails.accountType.name );
                
                if( bankDetails.accountNumber === '' ) bankDetailsAccountNumberDisplay.setValue('-');
                else bankDetailsAccountNumberDisplay.setValue( bankDetails.accountNumber );
                
                if( bankDetails.branchCode === '' ) bankDetailsBranchCodeDisplay.setValue('-');
                else bankDetailsBranchCodeDisplay.setValue( bankDetails.branchCode );
                
                // Set employment details
                value = '-';
                if( response.employee.employmentStartDate !== null ) value = response.employee.employmentStartDate;
                if( response.employee.employmentEndDate !== null ) value = value + ' to ' + response.employee.employmentEndDate;
                else value = value + ' to Present';
                employmentDetailsPeriod.setValue( value );
                
                value = '-';
                if( response.employee.employmentDuration !== null ) {
                    let employmentDuration = response.employee.employmentDuration;
                    value = '';
                    
                    if( employmentDuration.years === 1 ) value = value + employmentDuration.years + ' year';
                    else if( employmentDuration.years > 1 ) value = value + employmentDuration.years + ' years';
                    
                    if( employmentDuration.months === 1 ) value = value + ' ' + employmentDuration.months + ' month';
                    else if( employmentDuration.months > 1 ) value = value + ' ' + employmentDuration.months + ' months';
                    
                    if( employmentDuration.days === 1 ) value = value + ' ' + employmentDuration.days + ' day';
                    else value = value + ' ' + employmentDuration.days + ' days';
                }
                employmentDurationDisplay.setValue( value.trim() );
                
                if( response.employee.dismissalReasonCode !== null ) {
                    employmentEndReasonDisplay.show();
                    employmentEndReasonDisplay.setValue( response.employee.dismissalReasonName );
                }
                else {
                    employmentEndReasonDisplay.hide();
                }
                
                value = '-';
                if( response.employee.employmentPosition !== '' ) value = response.employee.employmentPosition;
                employmentPositionDisplay.setValue( value );
                
                value = '-';
                if( response.employee.departmentName !== null ) value = response.employee.departmentName;
                departmentDisplay.setValue( value );
                
                value = '-';
                if( response.employee.paymentMethodName !== '' ) value = response.employee.paymentMethodName;
                paymentMethodDisplay.setValue( value );
                
                value = '-';
                if( response.employee.paymentPeriodName !== '' ) value = response.employee.paymentPeriodName;
                paymentPeriodDisplay.setValue( value );
                
                value = '-';
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
                        value = 'Last day of the month';
                    }
                    else {
                        if( response.employee.paymentPeriodEndDay !== null ) {
                            value = response.employee.paymentPeriodEndDay;
                        }
                    }
                }
                paymentPeriodEndDayDisplay.setValue( value );
                
                value = '-';
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
                        value = 'Last day of the month';
                    }
                    else {
                        if( response.employee.paymentDay !== null ) {
                            value = response.employee.paymentDay;
                        }
                    }
                }
                paymentDayDisplay.setValue( value );
                
                // Set work schedule details
                if( response.employee.workSchedule !== null ) {
                    var scheduleString = '';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Sunday:</div>';
                    if( response.employee.workSchedule.sunday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.sunday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Monday:</div>';
                    if( response.employee.workSchedule.monday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.monday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Tuesday:</div>';
                    if( response.employee.workSchedule.tuesday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.tuesday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Wednesday:</div>';
                    if( response.employee.workSchedule.wednesday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.wednesday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Thursday:</div>';
                    if( response.employee.workSchedule.thursday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.thursday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Friday:</div>';
                    if( response.employee.workSchedule.friday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.friday + ' hours<br />';
                    
                    scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Saturday:</div>';
                    if( response.employee.workSchedule.saturday === null ) scheduleString = scheduleString + '-<br />';
                    else scheduleString = scheduleString + response.employee.workSchedule.saturday + ' hours<br />';
                    
                    scheduleDetailsDisplayEl.setValue(scheduleString);
                }
                else {
                    scheduleDetailsDisplayEl.setValue('No work schedule set.');
                }
                
                var enableLeaveStatus = false;
                
                if ( response.employee.workSchedule !== null ) {
                    if ( response.employee.workSchedule.enableLeave === null ) {
                        enableLeaveStatus = false;
                    }
                    else if ( response.employee.workSchedule.enableLeave ) {
                        enableLeaveStatus = true;
                    }
                }
                enableLeaveCb.setValue(enableLeaveStatus);
                
                // Set income tax details
                value = '-';
                if( response.employee.incomeTaxNumber !== '' ) value = response.employee.incomeTaxNumber;
                incomeTaxNumberDisplay.setValue( value );
                
                value = 'No';
                if( response.employee.enablePayeCorrection !== false ) value = 'Yes';
                enablePayeCorrectionDisplay.setValue( value );
                
                value = '-';
                if( response.employee.sicName !== '' ) value = response.employee.sicCode + ': ' + response.employee.sicName;
                sicCodeDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective1 !== '' ) value = response.employee.incomeTaxDirective1;
                incomeTaxDirective1Display.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective1IssuedOn !== null ) value = response.employee.incomeTaxDirective1IssuedOn;
                incomeTaxDirective1IssuedOnDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective1SourceCode !== '' ) value = response.employee.incomeTaxDirective1SourceCode;
                incomeTaxDirective1SourceDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective1Amount !== null ) value = response.employee.incomeTaxDirective1Amount;
                incomeTaxDirective1AmountDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective2 !== '' ) value = response.employee.incomeTaxDirective2;
                incomeTaxDirective2Display.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective2IssuedOn !== null ) value = response.employee.incomeTaxDirective2IssuedOn;
                incomeTaxDirective2IssuedOnDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective2SourceCode !== '' ) value = response.employee.incomeTaxDirective2SourceCode;
                incomeTaxDirective2SourceDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective2Amount !== null ) value = response.employee.incomeTaxDirective2Amount;
                incomeTaxDirective2AmountDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective3 !== '' ) value = response.employee.incomeTaxDirective3;
                incomeTaxDirective3Display.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective3IssuedOn !== null ) value = response.employee.incomeTaxDirective3IssuedOn;
                incomeTaxDirective3IssuedOnDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective3SourceCode !== '' ) value = response.employee.incomeTaxDirective3SourceCode;
                incomeTaxDirective3SourceDisplay.setValue( value );
                
                value = '-';
                if( response.employee.incomeTaxDirective3Amount !== null ) value = response.employee.incomeTaxDirective3Amount;
                incomeTaxDirective3AmountDisplay.setValue( value );
                
                // Was the employee updated?
                if( isUpdated === true ) {
                    me.fireEvent('update', {srcPanel: me, refreshEmployees: true, employeeName: employeeName});
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
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        if( compConfig.hasOwnProperty('onUpdate') ) me.addEventListener('update', compConfig.onUpdate);
        
        // Initialize state
        confirmDestroy = false;
        employeeId = compConfig.employeeId;
        
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
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
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
                padding: '0px 15px 15px 15px',
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });
        
        
        //
        // PERSONAL DETAILS SECTION
        //
        
        // Create the personalDetailsHeadingEl element
        personalDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px'
            },
            innerHTML: '<div>Personal Details</div>'
        });
        
        // Create personalDetailsEditBtn component
        personalDetailsEditBtn = new lx.component.Button({
            renderTo: personalDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: personalDetailsEditBtnClickEventhandler
        });
        
        // Create the personalDetailsSectionEl element
        personalDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        employeeNameDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Name:',
            labelWidth: '230px'
        });
        
        fullNamesDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Full Names:',
            labelWidth: '230px'
        });
        
        aliasDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Alias:',
            labelWidth: '230px'
        });
        
        idNumberDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Id Number:',
            labelWidth: '230px'
        });
        
        passportNumberDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Passport:',
            labelWidth: '230px'
        });
        
        dateOfBirthDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Date Of Birth:',
            labelWidth: '230px'
        });
        
        asylumSeekerDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Asylum Seeker:',
            labelWidth: '230px'
        });
        
        refugeeDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Refugee:',
            labelWidth: '230px'
        });
        
        retiredDisplay = new lx.component.Display({
            renderTo: personalDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Retired:',
            labelWidth: '230px'
        });
        
        
        //
        // CONTACT DETAILS SECTION
        //
        
        // Create the contactDetailsHeadingEl element
        contactDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Contact Details</div>'
        });
        
        // Create contactDetailsEditBtn component
        contactDetailsEditBtn = new lx.component.Button({
            renderTo: contactDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: contactDetailsEditBtnClickEventhandler
        });
        
        // Create the contactDetailsSectionEl element
        contactDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        emailAddressDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Email Address:',
            labelWidth: '230px'
        });
        
        cellNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Cell Number:',
            labelWidth: '230px'
        });
        
        homeNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Home Number:',
            labelWidth: '230px'
        });
        
        workNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Work Number:',
            labelWidth: '230px'
        });
        
        faxNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Fax Number:',
            labelWidth: '230px'
        });
        
        emergencyContactPersonDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Emergency Contact Person:',
            labelWidth: '230px'
        });
        
        emergencyContactNumberDisplay = new lx.component.Display({
            renderTo: contactDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Emergency Contact Number:',
            labelWidth: '230px'
        });
        
        
        //
        // ADDRESS DETAILS SECTION
        //
        
        // Create the addressHeadingEl element
        addressHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Address Details</div>'
        });
        
        // Create addressDetailsEditBtn component
        addressDetailsEditBtn = new lx.component.Button({
            renderTo: addressHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: addressDetailsEditBtnClickEventhandler
        });
        
        // Create the addressSectionEl element
        addressSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        physicalAddressDisplay = new lx.component.Display({
            renderTo: addressSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Physical Address:',
            labelWidth: '230px'
        });
        
        postalAddressDisplay = new lx.component.Display({
            renderTo: addressSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Postal Address:',
            labelWidth: '230px'
        });
        
        workAddressDisplay = new lx.component.Display({
            renderTo: addressSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Work Address:',
            labelWidth: '230px'
        });
        
        
        //
        // BANK DETAILS SECTION
        //
        
        // Create the bankDetailsHeadingEl element
        bankDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Bank Details</div>'
        });
        
        // Create bankDetailsEditBtn component
        bankDetailsEditBtn = new lx.component.Button({
            renderTo: bankDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: bankDetailsEditBtnClickEventhandler
        });
        
        // Create the bankDetailsSectionEl element
        bankDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the bankDetailsInstitutionDisplay component
        bankDetailsInstitutionDisplay = new lx.component.Display({
            renderTo: bankDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Financial Institution:',
            labelWidth: '230px'
        });
        
        // Create the bankDetailsAccountTypeDisplay component
        bankDetailsAccountTypeDisplay = new lx.component.Display({
            renderTo: bankDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Account Type:',
            labelWidth: '230px'
        });
        
        // Create the bankDetailsAccountNumberDisplay component
        bankDetailsAccountNumberDisplay = new lx.component.Display({
            renderTo: bankDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Account Number:',
            labelWidth: '230px'
        });
        
        // Create the bankDetailsBranchCodeDisplay component
        bankDetailsBranchCodeDisplay = new lx.component.Display({
            renderTo: bankDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Branch Code:',
            labelWidth: '230px'
        });
        
        
        //
        // EMPLOYMENT DETAILS SECTION
        //
        
        // Create the employmentDetailsHeadingEl element
        employmentDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Employment Details</div>'
        });
        
        // Create employmentDetailsEditBtn component
        employmentDetailsEditBtn = new lx.component.Button({
            renderTo: employmentDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: employmentDetailsEditBtnClickEventhandler
        });
        
        // Create the employmentDetailsSectionEl element
        employmentDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        employmentDetailsPeriod = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Employment Period:',
            labelWidth: '230px'
        });
        
        employmentDurationDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Employment Duration:',
            labelWidth: '230px'
        });
        
        employmentEndReasonDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Employment End Reason:',
            labelWidth: '230px'
        });
        
        employmentPositionDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Employment Position:',
            labelWidth: '230px'
        });
        
        departmentDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Department:',
            labelWidth: '230px'
        });
        
        paymentMethodDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Payment Method:',
            labelWidth: '230px'
        });
        
        paymentPeriodDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Payment Period:',
            labelWidth: '230px'
        });
        
        paymentPeriodEndDayDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Payment Period End Day:',
            labelWidth: '230px'
        });
        
        paymentDayDisplay = new lx.component.Display({
            renderTo: employmentDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Payment Day:',
            labelWidth: '230px'
        });
        
        //
        // WORK SCHEDULE SECTION
        //
    
        // Create the scheduleDetailsHeadingEl element
        scheduleDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Work Schedule</div>'
        });
        
        // Create scheduleDetailsEditBtn component
        scheduleDetailsEditBtn = new lx.component.Button({
            renderTo: scheduleDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: scheduleDetailsEditBtnClickEventhandler
        });
        
        // Create the scheduleDetailsSectionEl element
        scheduleDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create the scheduleDetailsDisplayEl
        scheduleDetailsDisplayEl = new lx.component.Display({
            renderTo: scheduleDetailsSectionEl
        });
        
        enableLeaveCb = new lx.component.Checkbox({
            renderTo: scheduleDetailsSectionEl,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Take schedule into account when calculating leave',
            
            onChange: enableLeaveCbOnChangeEventHandler
        });
        
        
        //
        // TAX DETAILS SECTION
        //
        
        // Create the taxDetailsHeadingEl element
        taxDetailsHeadingEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '900px',
                padding: '15px 15px 0px 15px',
                fontSize: '16px',
                color: '#0F0F0F'
            },
            innerHTML: '<div>Income Tax Details</div>'
        });
        
        // Create taxDetailsEditBtn component
        taxDetailsEditBtn = new lx.component.Button({
            renderTo: taxDetailsHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: taxDetailsEditBtnClickEventhandler
        });
        
        // Create the taxDetailsSectionEl element
        taxDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        incomeTaxNumberDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Income Tax Number:',
            labelWidth: '230px'
        });
        
        enablePayeCorrectionDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Enable Year-End PAYE Correction:',
            labelWidth: '230px'
        });
        
        sicCodeDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'SIC Code:',
            labelWidth: '230px'
        });
        
        new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '20px 0px 0px 0px',
            label: 'Income Tax Directive 1',
            labelWidth: '230px'
        });
        
        incomeTaxDirective1Display = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Number:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective1IssuedOnDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Issued Date:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective1SourceDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Source Code:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective1AmountDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Amount:',
            labelWidth: '230px'
        });
        
        new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '20px 0px 0px 0px',
            label: 'Income Tax Directive 2',
            labelWidth: '230px'
        });
        
        incomeTaxDirective2Display = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Number:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective2IssuedOnDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Issued Date:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective2SourceDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Source Code:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective2AmountDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Amount:',
            labelWidth: '230px'
        });
        
        new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '20px 0px 0px 0px',
            label: 'Income Tax Directive 3',
            labelWidth: '230px'
        });
        
        incomeTaxDirective3Display = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Number:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective3IssuedOnDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Issued Date:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective3SourceDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Source Code:',
            labelWidth: '230px'
        });
        
        incomeTaxDirective3AmountDisplay = new lx.component.Display({
            renderTo: taxDetailsSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Amount:',
            labelWidth: '230px'
        });
        
        // Load form data
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
    
    
    //
    // EVENT HANDLERS
    //
    
    function enableLeaveCbOnChangeEventHandler () {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=updateEmployeeWorkSchedule',
            data: {
                employeeId: employeeId,
                enableLeave: enableLeaveCb.getValue()
            },
            onSuccess: function( responseText ) {
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
            }
        });
    }
    
    function scheduleDetailsEditBtnClickEventhandler () {
        // Create a modal window
        var editEmployeeWorkScheduleModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '517px'
        });
        
        // Create the editEmployeeWorkSchedulePanel panel
        var editEmployeeWorkSchedulePanel = new app.panel.EditEmployeeWorkSchedule({
            renderTo: editEmployeeWorkScheduleModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editEmployeeWorkScheduleModal.addEventListener('destroy', function() {
            editEmployeeWorkSchedulePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editEmployeeWorkScheduleModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editEmployeeWorkScheduleModal.show();
        editEmployeeWorkSchedulePanel.focus();
    }
    
    // personalDetailsEditBtn click event handler
    function personalDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editPersonalDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '800px'
        });
        
        // Create the editPersonalDetailsPanel panel
        var editPersonalDetailsPanel = new app.panel.EditEmployeePersonalDetails({
            renderTo: editPersonalDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editPersonalDetailsModal.addEventListener('destroy', function() {
            editPersonalDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editPersonalDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editPersonalDetailsModal.show();
        editPersonalDetailsPanel.focus();
    }
    
    // contactDetailsEditBtn click event handler
    function contactDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editContactDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '628px'
        });
        
        // Create the editContactDetailsPanel panel
        var editContactDetailsPanel = new app.panel.EditEmployeeContactDetails({
            renderTo: editContactDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editContactDetailsModal.addEventListener('destroy', function() {
            editContactDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editContactDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editContactDetailsModal.show();
        editContactDetailsPanel.focus();
    }
    
    // addressDetailsEditBtn click event handler
    function addressDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editAddressDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '600px'
        });
        
        // Create the editAddressDetailsPanel panel
        var editAddressDetailsPanel = new app.panel.EditEmployeeAddressDetails({
            renderTo: editAddressDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editAddressDetailsModal.addEventListener('destroy', function() {
            editAddressDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editAddressDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editAddressDetailsModal.show();
        editAddressDetailsPanel.focus();
    }
    
    // bankDetailsEditBtn click event handler
    function bankDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editBankDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '440px'
        });
        
        // Create the editBankDetailsPanel panel
        var editBankDetailsPanel = new app.panel.EditEmployeeBankDetails({
            renderTo: editBankDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editBankDetailsModal.addEventListener('destroy', function() {
            editBankDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editBankDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editBankDetailsModal.show();
        editBankDetailsPanel.focus();
    }
    
    // employmentDetailsEditBtn click event handler
    function employmentDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editEmploymentDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '640px'
        });
        
        // Create the editEmploymentDetailsPanel panel
        var editEmploymentDetailsPanel = new app.panel.EditEmployeeEmploymentDetails({
            renderTo: editEmploymentDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editEmploymentDetailsModal.addEventListener('destroy', function() {
            editEmploymentDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editEmploymentDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editEmploymentDetailsModal.show();
        editEmploymentDetailsPanel.focus();
    }
    
    // taxDetailsEditBtn click event handler
    function taxDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editTaxDetailsModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '800px'
        });
        
        // Create the editTaxDetailsPanel panel
        var editTaxDetailsPanel = new app.panel.EditEmployeeTaxDetails({
            renderTo: editTaxDetailsModal.getContainer(),
            show: true,
            
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSave: function() {
                app.route.popState();
                loadEmployee( true );
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editTaxDetailsModal.addEventListener('destroy', function() {
            editTaxDetailsPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editTaxDetailsModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editTaxDetailsModal.show();
        editTaxDetailsPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};