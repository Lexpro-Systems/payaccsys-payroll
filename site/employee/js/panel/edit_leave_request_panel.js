/* globals app, lx */
'use strict';


// EDIT LEAVE REQUEST PANEL
//
// Extends
//
//  lx.component.Panel
//
// Config:
//
//  requestId:          The id of the leave request to edit
//
// Events:
//
//  onSave              This event is fired after the profile data was successfully saved.
//  onCancel            This event is fired when the user click the cancel button
//  onDestroy           This event is fired just before the component is destroyed.
//
app.panel.EditLeaveRequest = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentEl = null;
    
    var leaveDetailsSectionEl = null;
    var leaveTypeSelect = null;
    var leaveDayTypeContainerEl = null;
    var leaveDayTypeRadio = null;
    var leaveHoursPerDayContainerEl = null;
    var leaveHoursPerDayTxt = null;
    var leaveNotesTxt = null;
    
    let calendarSectionEl = null;
    let calendarEl = null;
    let calendarContainerEl = null;
    let leaveAvailableEl = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtnContainerEl = null;
    var saveBtn = null;
    
    let pageNum = 1;
    let currentYear = null;
    let currentMonth = null;
    let monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
        'November', 'December'];
    let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let selectedDates = [];
    let leaveUnit = 'hours';
    let leaveAvailable = 0;
    let numLeaveDaysRequested = 0;
    let leaveTypes = [];
    let calendarScrollAdjust = 0;
    let requestId = null;
    let publicHolidays = null;
    let leaveDayFraction = 1;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.component.Panel.call(this, config);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load leave balances
    function loadLeaveBalances( clearBalances ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getBalances',
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Format leave balances for the grid
                leaveTypes = [];
                for( let i = 0; i < response.balances.length; i++ ) {
                    leaveTypes.push({
                        text: response.balances[i].leaveType,
                        value: response.balances[i].leaveTypeId,
                        balance: parseFloat(response.balances[i].balance).toFixed(2),
                        unit: response.balances[i].unit
                    });
                }
                
                // Should leave balances be cleared?
                if( clearBalances ) {
                    leaveTypeSelect.clear();
                }
                leaveTypeSelect.addItems( leaveTypes );
                
                // Load the leave request
                loadLeaveRequest( requestId );
            }
        });
    }
    
    // Function to load the leave request to edit
    function loadLeaveRequest( id ) {
        loader.show( false );
        
        // Get the leave balances from the database
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getRequest',
            data: {
                requestId: id
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Request Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Set the leave type, hours and reason
                leaveTypeSelect.setValue( response.request.leaveTypeId, response.request.leaveTypeName );
                leaveTypeSelectChangeEventHandler();
                leaveHoursPerDayTxt.setValue( '8' );
                leaveNotesTxt.setValue( response.request.note );
                
                // Set the leave days
                for( let i = 0; i < response.request.items.length; i++ ) {
                    let item = response.request.items[i];
                    
                    // Display and update the leave hours
                    if( i === 0 ) {
                        // Was leave hours specified?
                        if( item.leaveHours !== null ) {
                            leaveHoursPerDayTxt.setValue( item.leaveHours );
                        }
                        
                        // Display and update the leave day type
                        if( item.dayFraction == 0.25 ) {
                            leaveDayTypeRadio.setValue( 'QUAR' );
                            leaveDayFraction = item.dayFraction;
                        }
                        else if( item.dayFraction == 0.5 ) {
                            leaveDayTypeRadio.setValue( 'HALF' );
                            leaveDayFraction = item.dayFraction;
                        }
                        else {
                            leaveDayTypeRadio.setValue( 'FULL' );
                            leaveDayFraction = 1;
                        }
                    }
                    
                    // Set the selected dates
                    selectedDates.push( item.leaveDate );
                }
            }
        });
    }
    
    // Function to create a calendar month section
    function createCalendarMonth(targetEl, year, month) {
        let dayEl = null;
        let numWeeks = 0;
        
        // Clear the target element
        // targetEl.innerHTML = '';
        
        year = parseInt(year);
        month = parseInt(month);
        
        let calendarStart = new Date(year, month, 1);
        let dayOfWeek = calendarStart.getDay();
        let today = new Date();
        
        // Adjust date to start on Sunday
        calendarStart.setDate( calendarStart.getDate() - dayOfWeek );
        
        // Create the calendarMonthContainerEl element
        let calendarMonthContainerEl = lx.createElement('DIV', {
            parent: targetEl,
            style: {
                boxSizing: 'border-box',
                margin: '0px 0px 15px 0px',
                border: 'solid 0px #EEEEEE'
            }
        });
        
        // Create the week day names
        for( let i = 0; i < 7; i++ ) {
            dayEl = lx.createElement('DIV', {
                parent: calendarMonthContainerEl,
                className: 'component-disable-select',
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    padding: '3px',
                    width: '14.28%',
                    flex: '1 1 100%',
                    height: '40px',
                    fontSize: '12px',
                    cssFloat: 'left',
                    textAlign: 'left',
                    // lineHeight: '32px',
                    color: '#444D5A',
                    backgroundColor: app.panelBackgroundColor
                },
                innerHTML: dayNames[i]
            });
        }
        
        // For very posiible day in the month
        for( let i = 1; i < 43; i++ ) {
            // Convert the calendar date to a string
            let calendarDate = calendarStart.getFullYear() + '-' + 
                ((calendarStart.getMonth() + 1) > 9 ? '' : '0') + (calendarStart.getMonth() + 1) + '-' +
                ((calendarStart.getDate()) > 9 ? '' : '0') + calendarStart.getDate();
            
            // Determine if the day is a public holiday
            let isPublicHoliday = false;
            for( let j = 0; j < publicHolidays.length; j++ ) {
                // console.log(calendarStart.getDate() + ' == ' + publicHolidays[j].date);
                if( calendarDate == publicHolidays[j].date ) {
                    isPublicHoliday = true;
                    break;
                }
            }
            
            // Set the color and border depending on whether the day is today or the day is in the month 
            let color = '#444D5A';
            let backgroundColor = '#FFFFFF';
            let border = 'solid 0px #EEEEEE';
            let cursor = 'pointer';
            if( calendarStart.getFullYear() === today.getFullYear() && calendarStart.getMonth() === today.getMonth() && calendarStart.getDate() === today.getDate() ) {
                color = lx.style.global.highlightColor;
                border = 'solid 1px ' + lx.style.global.highlightColor;
            }
            else if( calendarStart.getMonth() === month ) {
                if( !isPublicHoliday ) {
                    color = '#444D5A';
                }
                else {
                    color = '#F08080';
                    // backgroundColor = app.panelBackgroundColor;
                    border = 'solid 1px #F08080';
                }
            }
            else {
                color = '#CCCCCC';
                cursor = 'auto';
            }
            
            // Create the dayEl element
            dayEl = lx.createElement('DIV', {
                parent: calendarMonthContainerEl,
                className: 'component-disable-select date-picker-date-item',
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    width: '14.28%',
                    height: '40px',
                    fontSize: '12px',
                    cssFloat: 'left',
                    textAlign: 'left',
                    padding: '3px',
                    cursor: cursor,
                    color: color,
                    backgroundColor: backgroundColor,
                    border: border
                },
                innerHTML: calendarStart.getDate()
            });
            
            // Create the checkbox element
            let checkEl = lx.createElement('DIV', {
                parent: dayEl,
                style: {
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    flex: '1 1 100%',
                    // height: '100%'
                    fontSize: '18px',
                    color: lx.style.global.highlightColor
                }
            });
            
            // Save details for the day
            dayEl.isSelected = false;
            dayEl.isInMonth = (calendarStart.getMonth() === month);
            dayEl.isPublicHoliday = isPublicHoliday;
            dayEl.monthIndex = month;
            dayEl.yearIndex = year;
            dayEl.dayIndex = i - dayOfWeek;
            dayEl.checkEl = checkEl;
            
            // Go to the next day
            calendarStart.setDate( calendarStart.getDate() + 1 );
            
            // Is it the end of a week?
            if( i % 7 === 0 ) {
                // Remember how many line were added
                numWeeks = numWeeks + 1;
                
                // Stop adding days if we have reached the end of the month
                if( calendarStart.getMonth() !== month ) {
                    break;
                }
            }
        }
        
        return numWeeks;
    }
    
    // Function to create and display the calendar
    function createCalendar() {
        let currentDate = new Date();
        let thisYear = currentDate.getFullYear();
        let thisMonth = currentDate.getMonth();
        let numMonthsListed = 14;
        
        // Calculate the from date
        let startMonth = thisMonth - 1;
        let startYear = thisYear;
        if( startMonth <= 0 ) {
            startMonth = startMonth + 12;
            startYear = startYear - 1;
        }
        let fromDate = startYear + '-' + (startMonth > 9 ? '' : '0') + startMonth + '-01';
        
        // Calculate the to date
        let endMonth = parseInt(startMonth) + numMonthsListed;
        let endYear = startYear;
        while( (endMonth - 12) > 0 ) {
            endMonth = endMonth - 12;
            endYear = endYear + 1;
        }
        let toDate = endYear + '-' + (endMonth > 9 ? '' : '0') + endMonth + '-01';
        
        // Get the public holidays from the database
        lx.sendJSON({
            url: 'exec.php?c=Holiday&fn=getList',
            data: {
                sortOrder: 'ASC',
                fromDate: fromDate,
                toDate: toDate
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Save the public holidays
                publicHolidays = response.holidays;
                
                // Adjust the start month since js dates use a zero based index for months
                startMonth = startMonth - 1;
                
                // For the number of month to list
                for( let i = 0; i < numMonthsListed; i++ ) {
                    // Add the month name
                    lx.createElement('DIV', {
                        parent: calendarContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            color: '#FFFFFF',
                            backgroundColor: app.sectionBackgroundColor,
                            fontSize: '16px',
                            textAlign: 'center',
                            padding: '10px'
                        },
                        innerHTML: monthNames[startMonth] +  ' ' + startYear
                    });
                    
                    // Add a calendar for the specified month and year
                    let numWeeks = createCalendarMonth(calendarContainerEl, startYear, startMonth);
                    
                    // Calculate the amount that the calendar container should be scrolled to display
                    // the current month (we should scroll past the first two months)
                    if( i < 2  ) {
                        calendarScrollAdjust = calendarScrollAdjust + ((numWeeks + 1) * 40) + 39 + 15;
                    }
                    
                    // Go to the next month
                    startMonth = startMonth + 1;
                    
                    // Is the next month in the following year?
                    if( startMonth > 11)  {
                        // Start at the first month of the new year
                        startMonth = 0;
                        startYear = startYear + 1;
                    }
                }
            }
        });
    }
    
    // Function to check selected dates on the calendar
    function checkSelectedCalendarDates() {
        // Reset the number of leave days requested
        numLeaveDaysRequested = 0;
        
        // For every month in the calendar container
        for( let i = 0; i < calendarContainerEl.childNodes.length; i++ ) {
            let calendarMonthContainerEl = null;
            
            // Every second container contains the days of the month
            if( i % 2 !== 0 ) {
                calendarMonthContainerEl = calendarContainerEl.childNodes[i];
            }
            else {
                continue;
            }
            
            // For every day element in the month
            for( let j = 0; j <= calendarMonthContainerEl.childNodes.length; j++ ) {
                let skipMonth = true;
                let dayEl = calendarMonthContainerEl.childNodes[j];
                let checkEl = null;
                
                // Skip all elements that does not have a day element
                if( dayEl === undefined || dayEl === null ) {
                    continue;
                }
                
                // Skip all elements that does not have a check element
                if( dayEl.checkEl === undefined || dayEl.checkEl === null ) {
                    continue;
                }
                checkEl = dayEl.checkEl;
                
                // Skip all elements that is not in the current month
                if( !dayEl.isInMonth ) continue;
                
                // Get the date of the element
                let newDate = new Date();
                newDate.setFullYear(dayEl.yearIndex);
                newDate.setMonth(dayEl.monthIndex, dayEl.dayIndex);
                let elementDate = newDate.toISOString().substr(0, 10);
                
                // Check if the month should be skipped
                for( let k = 0; k < selectedDates.length; k++ ) {
                    if( elementDate.substring(0, 6) === selectedDates[k].substring(0, 6) ) {
                        skipMonth = false;
                        break;
                    }
                }
                if( skipMonth ) break;
                
                // Check the date if it has been selected
                for( let k = 0; k < selectedDates.length; k++ ) {
                    // Is the selected date on the date of the given element?
                    if( selectedDates[k] === elementDate ) {
                        // Check the selected date
                        checkEl.innerHTML = '<i class="fa fa-check" style="margin: auto auto;"></i>';
                        dayEl.isSelected = true;
                        
                        // Adjust the leave available
                        numLeaveDaysRequested = numLeaveDaysRequested + 1;
                        let leaveRequested = numLeaveDaysRequested;
                        if( leaveUnit === 'hours' ) {
                            leaveRequested = numLeaveDaysRequested * leaveHoursPerDayTxt.getValue();
                        }
                        else {
                            leaveRequested = numLeaveDaysRequested * leaveDayFraction;
                        }
                        leaveAvailableEl.innerHTML = 'Available Leave: ' + parseFloat(leaveAvailable - leaveRequested).toFixed(2) + ' ' + leaveUnit;
                        break;
                    }
                }
            }
        }
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            requestId: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        requestId = compConfig.requestId;
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onSave') ) me.addEventListener('save', compConfig.onSave);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        
        // Initialize date
        let currentDate = new Date();
        currentYear = currentDate.getFullYear();
        currentMonth = currentDate.getMonth();
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: me.getContainer(),
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
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
                borderColor: app.panelBackgroundColor
            },
            innerHTML: 'Edit Leave Request'
        });
        
        // Create the loaderContainerEl element
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                flex: '1 1 100%',
                backgroundColor: app.panelBackgroundColor,
                position: 'relative',
                overflow: 'auto'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                boxSizing: 'border-box',
                height: '100%',
                backgroundColor: app.panelBackgroundColor,
                padding: '15px',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch'
            }
        });
        
        
        //
        // LEAVE DETAILS SECTION
        //
        
        // Create the leaveDetailsSectionEl element
        leaveDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                padding: '15px',
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                flex: '1 1 100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #DFDFDF'
            }
        });
        
        // Display a note to the user
        lx.createElement('DIV', {
            parent: leaveDetailsSectionEl,
            style: {
                boxSizing: 'border-box',
                fontSize: '16px',
                textAlign: 'justify',
                margin: '0px 0px 0px 0px',
                padding: '30px 30px',
                color: '#FFFFFF',
                backgroundColor: app.sectionBackgroundColor
            },
            innerHTML: 'Select your leave type and click on the &apos;Next&apos; button to pick your leave days.'
        });
        
        // Create the leaveTypeSelect component
        leaveTypeSelect = new lx.component.Selectbox({
            renderTo: leaveDetailsSectionEl,
            label: 'Leave Type: ',
            labelAlign: 'top',
            // maxWidth: '400px',
            margin: '15px 0px 0px 0px',
            
            onChange: leaveTypeSelectChangeEventHandler
        });
        
        // Create the leaveDayTypeContainerEl element
        leaveDayTypeContainerEl = lx.createElement('DIV', {
            parent: leaveDetailsSectionEl,
            style: {
                display: 'none'
            }
        });
        
        // Create the leaveHoursPerDayContainerEl component
        leaveDayTypeRadio = new lx.component.RadioGroup({
            renderTo: leaveDayTypeContainerEl,
            label: 'Full, half, or quarter day? ',
            labelAlign: 'top',
            margin: '15px 0px 0px 0px',
            width: '100%',
            
            items: [
                {text: 'Full Day', value: 'FULL'},
                {text: 'Half Day', value: 'HALF'},
                {text: 'Quarter Day', value: 'QUAR'}
            ],
            
            onChange: leaveDayTypeRadioChangeEventHandler
        });
        leaveDayTypeRadio.setValue('FULL');
        
        // Create the leaveHoursPerDayContainerEl element
        leaveHoursPerDayContainerEl = lx.createElement('DIV', {
            parent: leaveDetailsSectionEl,
            style: {
                display: 'none'
            }
        });
        
        // Create the leaveHoursPerDayContainerEl component
        leaveHoursPerDayTxt = new lx.component.Textbox({
            renderTo: leaveHoursPerDayContainerEl,
            label: 'Hours Per Day: ',
            labelAlign: 'top',
            // maxWidth: '400px',
            margin: '15px 0px 0px 0px',
            
            onChange: leaveHoursPerDayTxtChangeEventHandler
        });
        leaveHoursPerDayTxt.setValue('8');
        
        // Create the leaveNotesTxt component
        leaveNotesTxt = new lx.component.Textbox({
            renderTo: leaveDetailsSectionEl,
            label: 'Reason / Notes: ',
            labelAlign: 'top',
            multiline: true,
            height: '80px',
            margin: '15px 0px 0px 0px'
        });
        
        // Add a spacer element
        lx.createElement('DIV', {
            parent: leaveDetailsSectionEl,
            style: {
                flex: '1 1 100%'
            }
        });
        
        
        //
        // CALENDAR SECTION
        //
        
        // Create the calendarSectionEl element
        calendarSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                boxSizing: 'border-box',
                padding: '15px',
                overflow: 'auto',
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                flex: '1 1 100%',
                backgroundColor: '#FFFFFF',
                border: '1px solid #DFDFDF'
            }
        });
        
        // Display a note to the user
        leaveAvailableEl = lx.createElement('DIV', {
            parent: calendarSectionEl,
            style: {
                boxSizing: 'border-box',
                fontSize: '16px',
                textAlign: 'left',
                padding: '10px',
                color: '#FFFFFF',
                backgroundColor: '#676767'
                // backgroundColor: app.sectionBackgroundColor
            },
            innerHTML: 'Available Leave: ' + leaveAvailable + ' ' + leaveUnit
        });
        
        // Create the calendarEl element
        calendarEl = lx.createElement('DIV', {
            parent: calendarSectionEl,
            style: {
                boxSizing: 'border-box',
                border: 'solid #BABABA 1px',
                // backgroundColor: '#EEEEEE',
                margin: '15px 0px 0px 0px',
                overflow: 'auto',
                display: 'flex',
            }
        });
        
        // Create the calendarContainerEl element
        calendarContainerEl = lx.createElement('DIV', {
            parent: calendarEl,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                backgroundColor: '#FFFFFF',
                flex: '1 1 100%'
            }
        });
        calendarContainerEl.addEventListener('click', calendarClickEventHandler);
        
        // Create the leave calendar
        createCalendar();
        
        
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
                borderColor: app.panelBackgroundColor
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
            label: 'Next',
            width: '120px',
            
            onClick: saveBtnClickEventHandler
        });
        
        loadLeaveBalances( true );
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        leaveTypeSelect.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.panelDestroy = me.destroy;
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            app.route.pauseNavigation();
            app.route.disableNavigation();
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    app.route.enableNavigation();
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        app.route.continueNavigation();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        let destroyResult = me.fireEvent('destroy', null);
        if( destroyResult === false ) return false;
        
        me.panelDestroy();
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // leaveTypeSelect change event handler
    function leaveTypeSelectChangeEventHandler() {
        let leaveTypeIndex = null;
        let leaveTypeId = leaveTypeSelect.getValue();
        
        // Get details about the selected item
        for( let i = 0; i < leaveTypes.length; i++ ) {
            if( leaveTypes[i].value === leaveTypeId ) {
                leaveTypeIndex = i;
                break;
            }
        }
        
        // Set the leave available and leave unit
        leaveAvailable = leaveTypes[leaveTypeIndex].balance;
        leaveUnit = leaveTypes[leaveTypeIndex].unit;
        
        // Display the number of hours in a day (if applicable) and leave available
        let leaveRequested = numLeaveDaysRequested;
        if( leaveUnit === 'hours' ) {
            leaveRequested = numLeaveDaysRequested * leaveHoursPerDayTxt.getValue();
            leaveHoursPerDayContainerEl.style.display = 'flex';
            leaveDayTypeContainerEl.style.display = 'none';
        }
        else {
            leaveHoursPerDayContainerEl.style.display = 'none';
            leaveDayTypeContainerEl.style.display = 'flex';
        }
        leaveAvailableEl.innerHTML = 'Available Leave: ' + parseFloat(leaveAvailable - leaveRequested).toFixed(2) + ' ' + leaveUnit;
    }
    
    // leaveDayTypeRadio change event handler
    function leaveDayTypeRadioChangeEventHandler() {
        // Adjust the leave day modifier
        if( leaveDayTypeRadio.getValue() === 'QUAR' ) {
            leaveDayFraction = 0.25;
        }
        else if( leaveDayTypeRadio.getValue() === 'HALF' ) {
            leaveDayFraction = 0.5;
        }
        else {
            leaveDayFraction = 1;
        }
    }
    
    // leaveHoursPerDayTxt change event handler
    function leaveHoursPerDayTxtChangeEventHandler() {
        // Adjust the leave available
        let leaveRequested = numLeaveDaysRequested;
        if( leaveUnit === 'hours' ) {
            leaveRequested = numLeaveDaysRequested * leaveHoursPerDayTxt.getValue();
        }
        leaveAvailableEl.innerHTML = 'Available Leave: ' + parseFloat(leaveAvailable - leaveRequested).toFixed(2) + ' ' + leaveUnit;
    }
    
    // calendarEl click event handler
    function calendarClickEventHandler( event ) {
        let dayEl = event.target;
        let checkEl = null;
        
        // Skip non day elements
        let hasDayElement = false;
        while( dayEl !== null ) {
            if( !dayEl.hasOwnProperty('dayIndex') || dayEl.dayIndex === null ) {
                dayEl = dayEl.parentNode;
            }
            else {
                hasDayElement = true;
                checkEl = dayEl.checkEl;
                break;
            }
        }
        if( !hasDayElement ) return;
        
        // Skip if the spesified date is not in the given month
        if( !dayEl.isInMonth ) return;
        
        // Get the selected date
        let newDate = new Date();
        newDate.setFullYear(dayEl.yearIndex);
        newDate.setMonth(dayEl.monthIndex, dayEl.dayIndex);
        let selectedDate = newDate.toISOString().substr(0, 10);
        
        // Depending on whether the day was selected or deselected
        dayEl.isSelected = !dayEl.isSelected;
        if( dayEl.isSelected ) {
            // Display a check and add the date to the array
            checkEl.innerHTML = '<i class="fa fa-check" style="margin: auto auto;"></i>';
            if( selectedDates.indexOf( selectedDate ) < 0 ) {
                // Save the date
                selectedDates.push( selectedDate );
                
                // Adjust the leave available
                numLeaveDaysRequested = numLeaveDaysRequested + 1;
                let leaveRequested = numLeaveDaysRequested;
                if( leaveUnit === 'hours' ) {
                    leaveRequested = numLeaveDaysRequested * leaveHoursPerDayTxt.getValue();
                }
                else {
                    leaveRequested = numLeaveDaysRequested * leaveDayFraction;
                }
                leaveAvailableEl.innerHTML = 'Available Leave: ' + parseFloat(leaveAvailable - leaveRequested).toFixed(2) + ' ' + leaveUnit;
            }
        }
        else {
            // Clear the check and remove the date from the array
            checkEl.innerHTML = '';
            let index = selectedDates.indexOf( selectedDate );
            if (index > -1) {
                // Remove the date
                selectedDates.splice(index, 1);
                
                // Adjust the leave available
                numLeaveDaysRequested = numLeaveDaysRequested - 1;
                let leaveRequested = numLeaveDaysRequested;
                if( leaveUnit === 'hours' ) {
                    leaveRequested = numLeaveDaysRequested * leaveHoursPerDayTxt.getValue();
                }
                else {
                    leaveRequested = numLeaveDaysRequested * leaveDayFraction;
                }
                leaveAvailableEl.innerHTML = 'Available Leave: ' + parseFloat(leaveAvailable - leaveRequested).toFixed(2) + ' ' + leaveUnit;
            }
        }
        
        if( selectedDates.length > 0 ) {
            confirmDestroy = true;
        }
        else {
            confirmDestroy = false;
        }
        
        // console.log( selectedDates );
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        if( pageNum === 1 ) {
            // Fire the cancel event
            me.fireEvent('cancel', {srcPanel: me});
            return;
        }
        
        // Hide the second section and display the first
        calendarSectionEl.style.display = 'none';
        leaveDetailsSectionEl.style.display = 'flex';
        
        // Adjust the label of the bottons
        cancelBtn.setLabel( 'Cancel' );
        saveBtn.setLabel( 'Next' );
        
        // Adjust the page number
        pageNum--;
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        let leaveHours = null;
        
        // Are we on the first page?
        if( pageNum === 1 ) {
            // Was no leave type selected?
            if( leaveTypeSelect.getValue() === null ) {
                saveBtn.showWarning('No leave type selected');
                return;
            }
            
            // Was no leave hours specified?
            if( leaveUnit === 'hours' ) {
                if( leaveHoursPerDayTxt.getValue().trim() == '' ) {
                    saveBtn.showWarning('No hours per day specified');
                    return;
                }
                leaveHours = leaveHoursPerDayTxt.getValue();
            }
            
            // Reset the leave available and check the selected dates
            checkSelectedCalendarDates();
            
            // Hide the first section and display the next
            leaveDetailsSectionEl.style.display = 'none';
            calendarSectionEl.style.display = 'flex';
            
            // Adjust the label of the buttons
            cancelBtn.setLabel( 'Back' );
            saveBtn.setLabel( 'Save' );
            
            // Adjust the scrolling of the calendar to display the current month
            if( calendarEl.scrollTop <= 0 ) {
                calendarEl.scrollTop = calendarScrollAdjust;
                // calendarEl.scrollTop = ( ((calendarEl.scrollHeight / 13) * 2) + 0);
            }
            
            // Adjust the page number
            pageNum++;
            return;
        }
        
        // Was no leave hours specified?
        if( leaveUnit === 'hours' ) {
            if( leaveHoursPerDayTxt.getValue().trim() == '' ) {
                saveBtn.showWarning('No hours per day specified');
                return;
            }
            leaveHours = leaveHoursPerDayTxt.getValue();
        }
        
        // Were no days selected?
        if( selectedDates.length  < 1 ) {
            saveBtn.showWarning('No leave days selected');
            return;
        }
        
        // Set request data to be added
        let request = {
            requestId: requestId,
            leaveTypeId: leaveTypeSelect.getValue(),
            note: leaveNotesTxt.getValue(),
            items: []
        };
        for( let i = 0; i < selectedDates.length; i++ ) {
            request.items.push({
                leaveDate: selectedDates[i],
                dayFraction: leaveDayFraction,
                leaveHours: leaveHours
            });
        }
        
        // Add the leave request
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=updateRequest',
            data: request,
            onSuccess: function( responseText ) {
                saveBtn.hideLoader();
                saveBtn.enable();
                
                let response = JSON.parse( responseText );
                
                // Check if the response was ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Updating Leave Request Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                // Fire the submit event
                confirmDestroy = false;
                me.fireEvent('save', {srcPanel: me});
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};