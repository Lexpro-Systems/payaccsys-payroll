/* jslint node: true */
/* globals app, lx */
'use strict';


// EDIT ATTENDANCE PANEL
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
app.panel.EditAttendance = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentEl = null;
    
    var detailsHeadingEl = null;
    var visitorDetailsSectionEl = null;
    var nameDisplay = null;
    var cellNumberDisplay = null;
    var emailAddressDisplay = null;
    var vehicleRegistrationDisplay = null;
    var idNumberDisplay = null;
    
    var timeInTimeOutDetailsHeadingEl = null;
    var timeInTimeOutDetailsSectionEl = null;
    var signInTimeContainerEl = null;
    var signInDate = null;
    var signInTimeTxt = null;
    var signOutTimeContainerEl = null;
    var signOutDate = null;
    var signOutTimeTxt = null;
    var timeDisplay = null;
    
    var reasonForVisitHeadingEl = null;
    var reasonForVisitSectionEl = null;
    var reasonForVisitTxt = null;
    
    var temperatureHeadingEl = null;
    var temperatureSectionEl = null;
    var temperatureTxt = null;
    
    var noteHeadingEl = null;
    var noteSectionEl = null;
    var noteTxt = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var saveBtn = null;
    var saveBtnContainerEl = null;
    
    var isEmployee = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the specified attendance
    function loadAttendance () {
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=get',
            data: {
                isEmployee: isEmployee,
                attendanceId: config.attendanceId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    loader.hide();
                    new lx.component.Messagebox({
                        title: 'View Attendance Failed',
                        message: response.error
                    });
                    return;
                }
                
                if (!isEmployee) {
                    vehicleRegistrationDisplay.setValue(response.attendance.registration);
                    idNumberDisplay.setValue(response.attendance.idNumber);
                }
                else{
                    vehicleRegistrationDisplay.hide();
                    idNumberDisplay.hide();
                    reasonForVisitHeadingEl.hide();
                    reasonForVisitSectionEl.style.display = 'none';
                }
                nameDisplay.setValue(response.attendance.name);
                cellNumberDisplay.setValue(response.attendance.cellNumber);
                
                emailAddressDisplay.setValue(response.attendance.emailAddress);
                signInDate.setValue(response.attendance.timeIn.substr(0, 10));
                signInTimeTxt.setValue(response.attendance.timeIn.substr(11, 5));
                signOutDate.setValue(response.attendance.timeOut.substr(0, 10));
                signOutTimeTxt.setValue(response.attendance.timeOut.substr(11, 5));
                // timeDisplay.setValue(response.attendance.time);
                onDateTimeChangeEventHandler();
                reasonForVisitTxt.setValue( response.attendance.reasonForVisit );
                temperatureTxt.setValue( response.attendance.temperature );
                noteTxt.setValue( response.attendance.note );
                
                loader.hide();
            }
        });
    }
    
    // Convert time in seconds to string format
    function secondsToTime( seconds ) {
        if( seconds <= 0 ) {
            return '-';
        }
        
        seconds = Number(seconds);
        let d = Math.floor(seconds / (3600*24));
        let h = Math.floor(seconds % (3600*24) / 3600);
        let m = Math.floor(seconds % 3600 / 60);
        // let s = Math.floor(seconds % 60);
        
        var time = '';
        
        if( d > 0 ) {
            let value = ' days';
            if( d == 1 ) value = ' day';
            time = time + d + value;
        }
        
        if( h > 0 ) {
            let value = ' hours';
            if( h == 1 ) value = ' hour';
            if( time !== '' ) time = time + ', ';
            time = time + h + value;
        }
        
        if( m > 0 ) {
            let value = ' minutes';
            if( m == 1 ) value = ' minute';
            if( time !== '' ) time = time + ' and ';
            time = time + m + value;
        }
        
        // if( s > 0 ) {
        //     let value = ' seconds';
        //     if( s == 1 ) value = ' second';
        //     if( time !== '' ) time = time + ', ';
        //     time = time + s + value;
        // }
        
        if( time === '' ) {
            time = '0 minutes';
        }
        
        return time;
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
        
        if (config.status === 'Employee') {
            isEmployee = true;
        }
        
        // Initialize state
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
            innerHTML: 'Edit Attendance'
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
                backgroundColor: '#F4F5F6',
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
                backgroundColor: '#F4F5F6',
                padding: '0px 0px 15px 0px',
                overflow: 'auto'
            }
        });
        
        
        //
        // DETAILS SECTION
        //
        
        detailsHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: config.status,
            margin: '0px 15px',
            width: ''
        });
        
        visitorDetailsSectionEl = lx.createElement('DIV', {
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
        
        nameDisplay = new lx.component.Display({
            renderTo: visitorDetailsSectionEl,
            label: 'Name:',
            labelWidth: '170px'
        });
        
        emailAddressDisplay = new lx.component.Display({
            renderTo: visitorDetailsSectionEl,
            label: 'Email:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        cellNumberDisplay = new lx.component.Display({
            renderTo: visitorDetailsSectionEl,
            label: 'Cell Number:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        vehicleRegistrationDisplay = new lx.component.Display({
            renderTo: visitorDetailsSectionEl,
            label: 'Vehicle Reg:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        idNumberDisplay = new lx.component.Display({
            renderTo: visitorDetailsSectionEl,
            label: 'ID Number:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        
        //
        // TIME IN/OUT SECTION
        //
        
        timeInTimeOutDetailsHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Time In/Out',
            margin: '0px 15px',
            width: ''
        });
        
        timeInTimeOutDetailsSectionEl = lx.createElement('DIV', {
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
        
        signInTimeContainerEl = lx.createElement('DIV', {
            parent: timeInTimeOutDetailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end'
            }
        });
        
        signInDate = new lx.component.DatePicker({
            renderTo: signInTimeContainerEl,
            label: 'Sign-In Date',
            flex: '1 1 100%',
            
            onChange: onDateTimeChangeEventHandler,
            onInput: onDateTimeChangeEventHandler
        });
        
        signInTimeTxt = new lx.component.Textbox({
            renderTo: signInTimeContainerEl,
            label: 'Sign-In Time',
            width: '80px',
            margin: '0px 0px 0px 20px',
            
            onInput: onDateTimeChangeEventHandler
        });
        
        signOutTimeContainerEl = lx.createElement('DIV', {
            parent: timeInTimeOutDetailsSectionEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                margin: '15px 0px 0px 0px'
            }
        });
        
        signOutDate = new lx.component.DatePicker({
            renderTo: signOutTimeContainerEl,
            label: 'Sign-Out Date',
            flex: '1 1 100%',
            
            onChange: onDateTimeChangeEventHandler,
            onInput: onDateTimeChangeEventHandler
        });
        
        signOutTimeTxt = new lx.component.Textbox({
            renderTo: signOutTimeContainerEl,
            label: 'Sign-Out Time',
            width: '80px',
            margin: '0px 0px 0px 20px',
            
            onInput: onDateTimeChangeEventHandler
        });
        
        timeDisplay = new lx.component.Display({
            renderTo: timeInTimeOutDetailsSectionEl,
            label: 'Time:',
            labelWidth: '40px',
            margin: '15px 0px 0px 0px'
        });
        
        
        //
        // REASON FOR VISIT SECTION
        //
        
        reasonForVisitHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Reason For Visit',
            margin: '0px 15px',
            width: ''
        });
        
        reasonForVisitSectionEl = lx.createElement('DIV', {
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
        
        reasonForVisitTxt = new lx.component.Textbox({
            renderTo: reasonForVisitSectionEl,
            // label: 'Reason:',
            labelWidth: '170px'
        });
        
        
        //
        // TEMPERATURE SECTION
        //
        
        temperatureHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Temperature',
            margin: '0px 15px',
            width: ''
        });
        
        temperatureSectionEl = lx.createElement('DIV', {
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
        
        temperatureTxt = new lx.component.Textbox({
            renderTo: temperatureSectionEl,
            // label: 'Temperature:',
            labelWidth: '170px'
        });
        
        
        //
        // NOTE SECTION
        //
        
        noteHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Notes',
            margin: '0px 15px',
            width: ''
        });
        
        noteSectionEl = lx.createElement('DIV', {
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
        
        noteTxt = new lx.component.Textbox({
            renderTo: noteSectionEl,
            // label: 'Note:',
            labelAlign: 'top',
            multiline: true,
            height: '80px'
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
                borderColor: '#DFDFDF',
                margin: '0px 0px 0px 0px'
            }
        });
        
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            style: 'text',
            
            onClick: cancelBtnClickEventHandler
        });
        
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
        
        loader.show( false );
        loadAttendance();
        
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
        signInDate.focus();
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
    
    // Event handler that is called to update the time display
    function onDateTimeChangeEventHandler() {
        var startDate = new Date(signInDate.getValue().trim() + ' ' + signInTimeTxt.getValue().trim());
        var endDate = new Date(signOutDate.getValue().trim() + ' ' + signOutTimeTxt.getValue().trim() + ':01');
        
        var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        
        timeDisplay.setValue( secondsToTime(seconds) );
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        // Check the sign-in date
        if( (signInDate.getValue().trim() === '') || (signInDate.getValue().trim().length !== 10) ) {
            saveBtn.showWarning('Sign-in date is invalid. Please enter a date in CCYY-MM-DD format.');
            return;
        }
        
        // Check the sign-in time
        if( !lx.util.checkTimeFormat( signInTimeTxt.getValue().trim() ) ) {
            saveBtn.showWarning('Sign-in time is invalid. Please enter a time in HH:MM format.');
            return;
        }
        
        // Check the sign-out date
        if( (signOutDate.getValue().trim() === '') || (signOutDate.getValue().trim().length !== 10) ) {
            saveBtn.showWarning('Sign-out date is invalid. Please enter a date in CCYY-MM-DD format.');
            return;
        }
        
        // Check the sign-out time
        if( !lx.util.checkTimeFormat( signOutTimeTxt.getValue().trim() ) ) {
            saveBtn.showWarning('Sign-out time is invalid. Please enter a time in HH:MM format.');
            return;
        }
        
        // Verify that the sign-in date is not after the sign-out date
        if( signInDate.getValue().trim() > signOutDate.getValue().trim() ) {
            saveBtn.showWarning('The sign-in date cannot be after the sign-out date.');
            return;
        }
        
        // Is the sign-in and sign-out on the same day
        if( signOutDate.getValue().trim() == signInDate.getValue().trim() ) {
            // Verify that the sign-in date is not later than the sign-out date
            if( signInTimeTxt.getValue().trim() > signOutTimeTxt.getValue().trim() ) {
                saveBtn.showWarning('The sign-in time cannot be later than the sign-out time.');
                return;
            }
        }
        
        // Get the current date and time
        let hours = new Date().getHours();
        let minutes = new Date().getMinutes();
        
        if( hours < 10 ) {
            hours = '0' + hours;
        }
        
        if( minutes < 10 ) {
            minutes = '0' + minutes;
        }
        
        var now = new Date().toISOString().slice(0, 10);
        
        // Is the sign-in date in the future?
        if (signInDate.getValue().trim() > now) {
            saveBtn.showWarning('Sign-in date cannot be in the future');
            return;
        }
        
        // Is the sign-in date today?
        if( signInDate.getValue().trim() == now ) {
            // Is the sign-in time in the future?
            if ( signInTimeTxt.getValue().trim() > hours + ':' + minutes ) {
                saveBtn.showWarning('Sign-in time cannot be in the future');
                return;
            }
        }
        
        // Is the sign-out date in the future?
        if (signOutDate.getValue().trim() > now) {
            saveBtn.showWarning('Sign-out date cannot be in the future');
            return;
        }
        
        // Is the sign-out date today?
        if( signOutDate.getValue().trim() == now ) {
            // Is the sign-out time in the future?
            if ( signOutTimeTxt.getValue().trim() > hours + ':' + minutes ) {
                saveBtn.showWarning('Sign-out time cannot be in the future');
                return;
            }
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        // Send the request to update the attendance
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=update',
            data: {
                attendanceId: config.attendanceId,
                isEmployee: isEmployee,
                signInDate: signInDate.getValue().trim(),
                signInTime: signInTimeTxt.getValue().trim(),
                signOutDate: signOutDate.getValue().trim(),
                signOutTime: signOutTimeTxt.getValue().trim(),
                reasonForVisit: reasonForVisitTxt.getValue().trim(),
                temperature: temperatureTxt.getValue().trim(),
                note: noteTxt.getValue().trim()
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