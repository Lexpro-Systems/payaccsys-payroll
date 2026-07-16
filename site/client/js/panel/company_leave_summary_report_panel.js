/* globals app, lx */
'use strict';


// COMPANY LEAVE SUMMARY REPORT PANEL
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
app.panel.CompanyLeaveSummaryReport = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    
    var exportExcelBtn = null;
    var exportCsvBtn = null;
    var exportPdfBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var filterSectionEl = null;
    var leaveTypeSelect = null;
    var startDate = null;
    var endDate = null;
    
    var resultGrid = null;

    let calendarScrollAdjust = 0;
    let publicHolidays = [];
    let leaveItemsByDate = {};
    let calendarContainerEl = null;

    var leaveCalendarItems = [];

    let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    let calendarMonthElements = {}; 
   // let leaveItemEl = null;

    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadLeaveSummary() {
        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getTypeList',
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Leave Types Failed',
                        message: response.error
                    });
                    return;
                }
                
                var leaveTypes = [];

                leaveTypes.push({
                    value: 0,
                    text: 'All Leave Types'
                });

                for( var i = 0; i < response.leaveTypes.length; i++ ) {
                    //console.log(response.leaveTypes[i].id);
                    leaveTypes.push({
                        value: response.leaveTypes[i].id,
                        text: response.leaveTypes[i].name
                    });
                }
                 //Set "All Leave Types" as default selection
                leaveTypeSelect.setValue(0);
                leaveTypeSelect.addItems( leaveTypes );
               
            }
        });
    }
    
    function loadCompanyLeaveCalendarItems(fromDate, toDate, callback) {

        var selectedLeaveTypeId = parseInt(leaveTypeSelect.getValue());

        if(isNaN(selectedLeaveTypeId)) {
            selectedLeaveTypeId = 0;
        }

        lx.sendJSON({
            url: 'exec.php?c=Leave&fn=getCompanyLeaveCalendarItems',
            data: {
                fromDate: fromDate,
                toDate: toDate,
                leaveTypeId: selectedLeaveTypeId
            },
            onSuccess: function( responseText ) {
                //console.log('getCompanyLeaveItems raw response:', responseText);
                var response = JSON.parse(responseText);

                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Company Leave Failed',
                        message: response.error
                    });
                    return;
                }

                leaveCalendarItems = response.leaveCalendarItems || [];

                //console.log('Company leave items:', leaveCalendarItems);

                if( typeof callback === 'function' ) {
                callback();
                }
            }
        });
    }

    // Function to create each day cell and decide what to display in the cell
    function createCalendarMonth(targetEl, year, month, publicHolidays, leaveItemsByDate) {
        let dayEl = null;
        let numWeeks = 0;
        let leaveItems = [];
          
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
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    padding: '10px 10px 10px 0px',
                    width: '14.28%',
                    flex: '1 1 100%',
                    fontSize: '12px',
                    cssFloat: 'left',
                    textAlign: 'left',
                    color: '#444D5A',
                    backgroundColor: '#F4F5F6'
                },
                innerHTML: dayNames[i]
            });
        }
       
        //For every posible day in the month
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
            let cursor = 'auto';
            if( calendarStart.getFullYear() === today.getFullYear() && calendarStart.getMonth() === today.getMonth() && calendarStart.getDate() === today.getDate() ) {
                color = lx.style.global.highlightColor;
                border = 'solid 1px ' + lx.style.global.highlightColor;
            }
            else if( calendarStart.getMonth() === month ) {
                if( !isPublicHoliday ) {
                    color = '#444D5A';
                }
                else {
                    color = '#f70505';
                    // backgroundColor = '#F4F5F6';
                    border = 'solid 1px #f70505';
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
                flexDirection: 'column',
                alignItems: 'stretch',
                width: '14.28%',
                minHeight: '85px',
                fontSize: '12px',
                cssFloat: 'left',
                textAlign: 'left',
                padding: '3px',
                cursor: 'auto',
                color: color,
                backgroundColor: backgroundColor,
                border: border,
                overflow: 'hidden'
                }
            });

            lx.createElement('DIV', {
                parent: dayEl,
                style: {
                    fontWeight: 'bold',
                    margin: '0px 0px 4px 0px',
                    color: color
                },
                innerHTML: calendarStart.getDate()
            });

            let leaveItems = (leaveItemsByDate && leaveItemsByDate[calendarDate]) ? leaveItemsByDate[calendarDate] : [];

            for( let l = 0; l < leaveItems.length; l++ ) {

                var leaveItem = leaveItems[l];
                var durationText = getLeaveDurationText(leaveItem);
                var leaveText = '';

                if(!leaveItem.employeeName) {
                    leaveText = leaveItem.leaveTypeName;
                } 
                else if(!leaveItem.leaveTypeName){
                    leaveText = leaveItem.employeeName;
                }
                else{
                    leaveText = leaveItem.employeeName + ' - ' + leaveItem.leaveTypeName;
                }

                if( durationText !== '' ) {
                    leaveText += ' (' + durationText + ')';
                }

                let leaveItemEl = lx.createElement('DIV', {
                    parent: dayEl,
                    style: {
                        boxSizing: 'border-box',
                        backgroundColor: '#EAF7F8',
                        borderStyle: 'solid',
                        borderColor: '#4DCDD8',
                        borderWidth: '0px 0px 0px 3px',
                        padding: '2px 4px',
                        margin: '2px 0px 0px 0px',
                        fontSize: '11px',
                        color: '#30313C',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer'
                    },
                    textContent: leaveText
                    //innerHTML: leaveText
                });
                leaveItemEl.title = leaveText;
            }
            
            // Save details for the day
            dayEl.isSelected = false;
            dayEl.isInMonth = (calendarStart.getMonth() === month);
            dayEl.isPublicHoliday = isPublicHoliday;

            dayEl.monthIndex = month;
            dayEl.yearIndex = year;
            dayEl.dayIndex = i - dayOfWeek;
            
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

    //Function to determine singular or plural for leave duration text
    function getLeaveDurationText(leaveItem) {
        var hours = Number(leaveItem.hours);
        var days = Number(leaveItem.days);

        if( !isNaN(hours) && hours > 0 ) {
            return hours === 1 ? '1 hour' : hours + ' hours';
        }

        if( !isNaN(days) && days > 0 && days < 1 ) {
            return days + ' day';
        }

        if( !isNaN(days) && days >= 1 ) {
            return days === 1 ? '1 day' : days + ' days';
        }

        return '';
    }

    //Function to scroll to selected month based on Start date filter 
    function scrollCalendarToDate(dateValue) {
        if(dateValue === null || dateValue === undefined || dateValue === '') {
            return;
        }

        if(calendarContainerEl === null || calendarContainerEl === undefined) {
            return;
        }

        let dateObj = new Date(dateValue);

        if(isNaN(dateObj.getTime())) {
            return;
        }

        let monthKey = dateObj.getFullYear() + '-' +
            ((dateObj.getMonth() + 1) > 9 ? '' : '0') + (dateObj.getMonth() + 1);

        let monthHeadingEl = calendarMonthElements[monthKey];

        if(monthHeadingEl === undefined || monthHeadingEl === null) {
            return;
        }

        //Sets correct scrolling position for calendar months to begin directly underneath title
        let containerRect = calendarContainerEl.getBoundingClientRect();
        let headingRect = monthHeadingEl.getBoundingClientRect();

        calendarContainerEl.scrollTop = calendarContainerEl.scrollTop + (headingRect.top - containerRect.top);

    }


    // Group leave items by date so all leave taken can be displayed in the correct calendar day block.
    function groupLeaveItemsByDate(leaveCalendarItems) {
        let groupedLeaveItems = {};

        for( let i = 0; i < leaveCalendarItems.length; i++ ) {
            let leaveItem = leaveCalendarItems[i];

            let dateKey = leaveItem.leaveDate;

                if (groupedLeaveItems[dateKey] === undefined) {
                    groupedLeaveItems[dateKey] = [];
                }

            groupedLeaveItems[dateKey].push(leaveItem);
        }

        return groupedLeaveItems;
    }

    function getMonthDifference(fromDateObj, toDateObj) {
        return (
            (toDateObj.getFullYear() - fromDateObj.getFullYear()) * 12
        ) + (toDateObj.getMonth() - fromDateObj.getMonth()) + 1;
    }

    //Convert date objects into string format for PHP
    function formatDate(date) {
        let month = '' + (date.getMonth() + 1);
        let day = '' + date.getDate();
        let year = date.getFullYear();

        if( month.length < 2 ) {
            month = '0' + month;
        }

        if( day.length < 2 ) {
            day = '0' + day;
        }

        return year + '-' + month + '-' + day;
    }
    
    // Function to create and display the calendar
    function createCalendar() {
        
        var selectedLeaveTypeId = leaveTypeSelect.getValue();

        // if(selectedLeaveTypeId == 'All'){
        //     //Load all leave types

        // } else{
        //     //Load only selected leave types

        // }

        let filterFromDate = startDate.getValue();
        let filterToDate = endDate.getValue();

        if( filterFromDate === null || filterFromDate === undefined || filterFromDate === '' ||
            filterToDate === null || filterToDate === undefined || filterToDate === '' ) {
            return;
        }
        
        let filterFromDateObj = new Date(filterFromDate);
        let filterToDateObj = new Date(filterToDate);

        if( isNaN(filterFromDateObj.getTime()) || isNaN(filterToDateObj.getTime()) ) {
            return;
        }
        
        if( filterFromDateObj > filterToDateObj ) {
            new lx.component.Messagebox({
                title: 'Invalid Date Range',
                message: 'The start date cannot be after the end date.'
            });
            return;
        }

        // Calendar display should start 12 months before the filter start month.
        let calendarDataFromDateObj = new Date(
            filterFromDateObj.getFullYear(),
            filterFromDateObj.getMonth() - 12,
            1
        );

        // Calendar display should end 12 months after the filter end month.
        let calendarDataToDateObj = new Date(
            filterToDateObj.getFullYear(),
            filterToDateObj.getMonth() + 13,
            0
        );

        let startYear = calendarDataFromDateObj.getFullYear();
        let startMonth = calendarDataFromDateObj.getMonth();

        let numMonthsListed = getMonthDifference(calendarDataFromDateObj, calendarDataToDateObj);

        let fromDate = formatDate(calendarDataFromDateObj);
        let toDate = formatDate(calendarDataToDateObj);

        calendarContainerEl.innerHTML = '';
        calendarScrollAdjust = 0;
        calendarMonthElements = {};
        
        //Get the public holidays from the database
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
                        title: 'Loading Public Holidays Failed',
                        message: response.error
                    });
                    
                    return;
            }
                
            // Save the public holidays
            publicHolidays = response.holidays || [];

            //Get all leave items grouped by date
            loadCompanyLeaveCalendarItems(fromDate, toDate, function() {
            leaveItemsByDate = groupLeaveItemsByDate(leaveCalendarItems);

            renderCalendarMonths(
                startYear,
                startMonth,
                numMonthsListed,
                publicHolidays,
                leaveItemsByDate
            );

            scrollCalendarToDate(filterFromDate);
            });
            }
        });
    }

    function renderCalendarMonths(startYear, startMonth, numMonthsListed, publicHolidays, leaveItemsByDate) {
    for( let i = 0; i < numMonthsListed; i++ ) {

    let monthKey = startYear + '-' + ((startMonth + 1) > 9 ? '' : '0') + (startMonth + 1);

       let monthHeadingEl = lx.createElement('DIV', {
            parent: calendarContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                //height: '40px',
                color: '#FFFFFF',
                backgroundColor: '#30313C',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '10px'
            },
            innerHTML: monthNames[startMonth] + ' ' + startYear
        });

        calendarMonthElements[monthKey] = monthHeadingEl;

        createCalendarMonth(
            calendarContainerEl,
            startYear,
            startMonth,
            publicHolidays,
            leaveItemsByDate
        );

        startMonth = startMonth + 1;

        if( startMonth > 11 ) {
            startMonth = 0;
            startYear = startYear + 1;
        }
    }

        scrollCalendarToDate(startDate.getValue());
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
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the titleBackEl element
        titleBackEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '40px',
                height: '40px',
                padding: '11px 0px 0px 11px',
                margin: '0px 9px 0px 9px',
                cursor: 'auto'
            }
        });
        titleBackEl.appendChild( lx.icon.create('left_arrow', '#444D5A', 18, 1.2) );
        titleBackEl.addEventListener('click', titleBackElClickEventHandler);
        titleContainerEl.appendChild( titleBackEl );
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 0px',
                userSelect: 'none'
            },
            innerHTML: 'Company Leave Summary Report'
        });
        
        // Create the exportExcelBtn component
        exportExcelBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Excel Export',
            width: '130px',
            margin: '0px 0px 0px auto',
            
            onClick: exportExcelBtnOnClickEventHandler
        });
        
        // Create the exportCsvBtn component
        exportCsvBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'CSV Export',
            width: '130px',
            margin: '0px 0px 0px 20px',
            
            onClick: exportCsvBtnOnClickEventHandler
        });
        
        // Create the exportPdfBtn component
        exportPdfBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'PDF Export',
            width: '130px',
            margin: '0px 20px 0px 20px',
            
            onClick: exportPdfBtnOnClickEventHandler
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
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row'
            }
        });
        
        // Create leaveTypeSelect component
        leaveTypeSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            maxWidth: '400px',
            label: 'Leave Types',
           // value: 0,
            
            onChange: filterOnChangeEvent
        });
        
        startDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'Start Date',
            width: '250px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEvent
        });
        
        endDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'End Date',
            width: '250px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEvent
        });
        
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        var month = '' + (firstDay.getMonth() + 1);
        var day = '' + firstDay.getDate();
        var year = firstDay.getFullYear();
            
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        startDate.setValue(year + '-' + month + '-' + day);
        
        month = '' + (lastDay.getMonth() + 1);
        day = '' + lastDay.getDate();
        year = lastDay.getFullYear();
            
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        endDate.setValue(year + '-' + month + '-' + day);

        //
        // CALENDAR CONTAINER FOR RESULTS
        //

        calendarContainerEl = lx.createElement('DIV', {
        parent: contentContainerEl,
        style: {
            boxSizing: 'border-box',
            width: '100%',
            height: 'calc(100vh - 180px)',
            overflowY: 'auto',
            backgroundColor: '#FFFFFF',
            borderStyle: 'solid',
            borderColor: '#DFDFDF',
            borderWidth: '1px',
            padding: '10px'
            }
         });
        
        loadLeaveSummary();
        createCalendar();
        
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

    function exportCompanyLeaveSummary (format) {
        // Do sanity checks
        if( leaveTypeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No leave type selected.',
                message: 'Please select a leave type.'
            });
            return;
        }

        let leaveTypeName = '';

        if(leaveTypeSelect.getValue() == '0' || leaveTypeSelect.getValue() == 0){
            leaveTypeName = 'All Leave Types';
        } else {
        leaveTypeName = leaveTypeSelect.getText();
        }
        
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runCompanyLeaveSummaryReport',
            target: '_blank',
            data: {
                format: format,
                leaveTypeId: leaveTypeSelect.getValue(),
                leaveTypeName: leaveTypeName,
                startDate: startDate.getValue(),
                endDate: endDate.getValue(),
                leaveCalendarItems: JSON.stringify(leaveCalendarItems)
            }
        });
    }

    function exportCsvBtnOnClickEventHandler () {

        exportCompanyLeaveSummary('csv');
    }
    
    function exportExcelBtnOnClickEventHandler () {
        
         exportCompanyLeaveSummary('xlsx');
    }
    
    // exportPdfBtn click event handler
    function exportPdfBtnOnClickEventHandler () {
        // Do sanity checks
        if( leaveTypeSelect.getValue() === null ) {
            new lx.component.Messagebox({
                title: 'No leave type selected.',
                message: 'Please select a leave type.'
            });
            return;
        }

        let leaveTypeName = '';

        if(leaveTypeSelect.getValue() == '0' || leaveTypeSelect.getValue() == 0){
            leaveTypeName = 'All Leave Types';
        } else {
        leaveTypeName = leaveTypeSelect.getText();
        }
        
        // Open the report in a new tab
        lx.sendForm({
            url: 'exec.php?c=Report&fn=runCompanyLeaveSummaryPdfReport',
            target: '_blank',
            data: {
                leaveTypeId: leaveTypeSelect.getValue(),
                leaveTypeName: leaveTypeName,
                startDate: startDate.getValue(),
                endDate: endDate.getValue(),
                leaveCalendarItems: JSON.stringify(leaveCalendarItems)
            }
        });
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    function filterOnChangeEvent() {

        if( calendarContainerEl === null || calendarContainerEl === undefined ) {
        return;
        }

        createCalendar();
    };
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};