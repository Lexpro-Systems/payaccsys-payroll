/* globals app, lx */
'use strict';

// EDIT EMPLOYEE WORK SCHEDULE PANEL
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
app.panel.EditEmployeeWorkSchedule = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var workScheduleDetailsSection = null;
    
    var mondayContainer = null;
    var mondayCb = null;
    var mondayHoursTxt = null;
    var mondayHoursLabel = null;
    
    var tuesdayContainer = null;
    var tuesdayCb = null;
    var tuesdayHoursTxt = null;
    var tuesdayHoursLabel = null;
    
    var wednesdayContainer = null;
    var wednesdayCb = null;
    var wednesdayHoursTxt = null;
    var wednesdayHoursLabel = null;
    
    var thursdayContainer = null;
    var thursdayCb = null;
    var thursdayHoursTxt = null;
    var thursdayHoursLabel = null;
    
    var fridayContainer = null;
    var fridayCb = null;
    var fridayHoursTxt = null;
    var fridayHoursLabel = null;
    
    var saturdayContainer = null;
    var saturdayCb = null;
    var saturdayHoursTxt = null;
    var saturdayHoursLabel = null;
    
    var sundayContainer = null;
    var sundayCb = null;
    var sundayHoursTxt = null;
    var sundayHoursLabel = null;
    
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
    
    function loadWorkSchedule() {
        loader.show( false );
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getWorkSchedule',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Schedule Failed',
                        message: response.error
                    });
                }
                // return;
                if ( response.workSchedule.length === 0 ) {
                    mondayCb.setValue(false);
                    mondayHoursTxt.disable();
                    mondayHoursTxt.setValue('');
                    tuesdayCb.setValue(false);
                    tuesdayHoursTxt.disable();
                    tuesdayHoursTxt.setValue('');
                    wednesdayCb.setValue(false);
                    wednesdayHoursTxt.disable();
                    wednesdayHoursTxt.setValue('');
                    thursdayCb.setValue(false);
                    thursdayHoursTxt.disable();
                    thursdayHoursTxt.setValue('');
                    fridayCb.setValue(false);
                    fridayHoursTxt.disable();
                    fridayHoursTxt.setValue('');
                    saturdayCb.setValue(false);
                    saturdayHoursTxt.disable();
                    saturdayHoursTxt.setValue('');
                    sundayCb.setValue(false);
                    sundayHoursTxt.disable();
                    sundayHoursTxt.setValue('');
                }
                else {
                    
                    if(response.workSchedule.monday !== null) {
                        mondayCb.setValue(true);
                        mondayHoursTxt.setValue(response.workSchedule.monday);
                    }
                    else {
                        mondayCb.setValue(false);
                        mondayHoursTxt.disable();
                    }
                    if(response.workSchedule.tuesday !== null) {
                        tuesdayCb.setValue(true);
                        tuesdayHoursTxt.setValue(response.workSchedule.tuesday);
                    }
                    else {
                        tuesdayCb.setValue(false);
                        tuesdayHoursTxt.disable();
                    }
                    if(response.workSchedule.wednesday !== null) {
                        wednesdayCb.setValue(true);
                        wednesdayHoursTxt.setValue(response.workSchedule.wednesday);
                    }
                    else {
                        wednesdayCb.setValue(false);
                        wednesdayHoursTxt.disable();
                    }
                    if(response.workSchedule.thursday !== null) {
                        thursdayCb.setValue(true);
                        thursdayHoursTxt.setValue(response.workSchedule.thursday);
                    }
                    else {
                        thursdayCb.setValue(false);
                        thursdayHoursTxt.disable();
                    }
                    if(response.workSchedule.friday !== null) {
                        fridayCb.setValue(true);
                        fridayHoursTxt.setValue(response.workSchedule.friday);
                    }
                    else {
                        fridayCb.setValue(false);
                        fridayHoursTxt.disable();
                    }
                    if(response.workSchedule.saturday !== null) {
                        saturdayCb.setValue(true);
                        saturdayHoursTxt.setValue(response.workSchedule.saturday);
                    }
                    else {
                        saturdayCb.setValue(false);
                        saturdayHoursTxt.disable();
                    }
                    if(response.workSchedule.sunday !== null) {
                        sundayCb.setValue(true);
                        sundayHoursTxt.setValue(response.workSchedule.sunday);
                    }
                    else {
                        sundayCb.setValue(false);
                        sundayHoursTxt.disable();
                    }
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
            innerHTML: 'Edit Work Schedule'
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
                padding: '15px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // WORK SCHEDULE SECTION
        //
        
        // Create the workScheduleDetailsSection section
        workScheduleDetailsSection = lx.createElement('DIV', {
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
        
        mondayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        mondayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        mondayCb = new lx.component.Checkbox({
            renderTo: mondayContainer,
            margin: '0px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Monday',
            width: '120px',
            
            onChange: mondayCbOnChangeEventHandler
        });
        
        mondayHoursTxt = new lx.component.Textbox({
            renderTo: mondayContainer,
            margin: '0px 0px 0px 0px',
            width: '200px'
        });
        
        mondayHoursLabel = new lx.component.Label({
            renderTo: mondayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        tuesdayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        tuesdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        tuesdayCb = new lx.component.Checkbox({
            renderTo: tuesdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Tuesday',
            width: '120px',
            
            onChange: tuesdayCbOnChangeEventHandler
        });
        
        tuesdayHoursTxt = new lx.component.Textbox({
            renderTo: tuesdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
        });
        
        tuesdayHoursLabel = new lx.component.Label({
            renderTo: tuesdayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        wednesdayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        wednesdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        wednesdayCb = new lx.component.Checkbox({
            renderTo: wednesdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Wednesday',
            width: '120px',
            
            onChange: wednesdayCbOnChangeEventHandler
        });
        
        wednesdayHoursTxt = new lx.component.Textbox({
            renderTo: wednesdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
        });
        
        wednesdayHoursLabel = new lx.component.Label({
            renderTo: wednesdayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        thursdayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        thursdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        thursdayCb = new lx.component.Checkbox({
            renderTo: thursdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Thursday',
            width: '120px',
            
            onChange: thursdayCbOnChangeEventHandler
        });
        
        thursdayHoursTxt = new lx.component.Textbox({
            renderTo: thursdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
        });
        
        thursdayHoursLabel = new lx.component.Label({
            renderTo: thursdayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        fridayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        fridayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        fridayCb = new lx.component.Checkbox({
            renderTo: fridayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Friday',
            width: '120px',
            
            onChange: fridayCbOnChangeEventHandler
        });
        
        fridayHoursTxt = new lx.component.Textbox({
            renderTo: fridayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
        });
        
        fridayHoursLabel = new lx.component.Label({
            renderTo: fridayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        saturdayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        saturdayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        saturdayCb = new lx.component.Checkbox({
            renderTo: saturdayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Saturday',
            width: '120px',
            
            onChange: saturdayCbOnChangeEventHandler
        });
        
        saturdayHoursTxt = new lx.component.Textbox({
            renderTo: saturdayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
            
        });
        
        saturdayHoursLabel = new lx.component.Label({
            renderTo: saturdayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
        });
        
        sundayContainer = lx.createElement('DIV', {
            parent: workScheduleDetailsSection,
            style: {
                backgroundColor: '#FFFFFF'
            }
        });
        sundayContainer.className = 'flex-row flex-justify-content flex-align-center';
        
        sundayCb = new lx.component.Checkbox({
            renderTo: sundayContainer,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label:' Sunday',
            width: '120px',
            
            onChange: sundayCbOnChangeEventHandler
        });
        
        sundayHoursTxt = new lx.component.Textbox({
            renderTo: sundayContainer,
            margin: '15px 0px 0px 0px',
            width: '200px'
            
        });
        
        sundayHoursLabel = new lx.component.Label({
            renderTo: sundayContainer,
            text: 'Hours',
            padding: '0px 0px 0px 10px'
            
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
        
        // Load panel data
        loadWorkSchedule();
        
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
        mondayCb.setFocus();
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
    
    function mondayCbOnChangeEventHandler() {
        if (mondayCb.getValue()) {
            mondayHoursTxt.enable();
        }
        else {
            mondayHoursTxt.disable();
            mondayHoursTxt.setValue('');
        }
    }
    
    function tuesdayCbOnChangeEventHandler() {
        if (tuesdayCb.getValue()) {
            tuesdayHoursTxt.enable();
        }
        else {
            tuesdayHoursTxt.disable();
            tuesdayHoursTxt.setValue('');
        }
    }
    
    function wednesdayCbOnChangeEventHandler() {
        if (wednesdayCb.getValue()) {
            wednesdayHoursTxt.enable();
        }
        else {
            wednesdayHoursTxt.disable();
            wednesdayHoursTxt.setValue('');
        }
    }
    
    function thursdayCbOnChangeEventHandler() {
        if (thursdayCb.getValue()) {
            thursdayHoursTxt.enable();
        }
        else {
            thursdayHoursTxt.disable();
            thursdayHoursTxt.setValue('');
        }
    }
    
    function fridayCbOnChangeEventHandler() {
        if (fridayCb.getValue()) {
            fridayHoursTxt.enable();
        }
        else {
            fridayHoursTxt.disable();
            fridayHoursTxt.setValue('');
        }
    }
    
    function saturdayCbOnChangeEventHandler() {
        if (saturdayCb.getValue()) {
            saturdayHoursTxt.enable();
        }
        else {
            saturdayHoursTxt.disable();
            saturdayHoursTxt.setValue('');
        }
    }
    
    function sundayCbOnChangeEventHandler() {
        if (sundayCb.getValue()) {
            sundayHoursTxt.enable();
        }
        else {
            sundayHoursTxt.disable();
            sundayHoursTxt.setValue('');
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        
        let mondayValue = null;
        let tuesdayValue = null;
        let wednesdayValue = null;
        let thursdayValue = null;
        let fridayValue = null;
        let saturdayValue = null;
        let sundayValue = null;
        
        // Check all required values
        if( mondayCb.getValue() ) {
            if (mondayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Monday.');
                return;
            }
            if (!isNaN(parseInt(mondayHoursTxt.getValue()))) {
                if (parseInt(mondayHoursTxt.getValue()) <= 0 || parseInt(mondayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Monday.');
                    return;
                }
            }
            mondayValue = mondayHoursTxt.getValue();
        }
        
        if( tuesdayCb.getValue() ) {
            if (tuesdayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Tuesday.');
                return;
            }
            if (!isNaN(parseInt(tuesdayHoursTxt.getValue()))) {
                if (parseInt(tuesdayHoursTxt.getValue()) <= 0 || parseInt(tuesdayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Tuesday.');
                    return;
                }
            }
            tuesdayValue = tuesdayHoursTxt.getValue();
        }
        
        if( wednesdayCb.getValue() ) {
            if (wednesdayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Wednesday.');
                return;
            }
            if (!isNaN(parseInt(wednesdayHoursTxt.getValue()))) {
                if (parseInt(wednesdayHoursTxt.getValue()) <= 0 || parseInt(wednesdayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Wednesday.');
                    return;
                }
            }
            wednesdayValue = wednesdayHoursTxt.getValue();
        }
        
        if( thursdayCb.getValue() ) {
            if (thursdayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Thursday.');
                return;
            }
            if (!isNaN(parseInt(thursdayHoursTxt.getValue()))) {
                if (parseInt(thursdayHoursTxt.getValue()) <= 0 || parseInt(thursdayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Thursday.');
                    return;
                }
            }
            thursdayValue = thursdayHoursTxt.getValue();
        }
        
        if( fridayCb.getValue() ) {
            if (fridayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Friday.');
                return;
            }
            if (!isNaN(parseInt(fridayHoursTxt.getValue()))) {
                if (parseInt(fridayHoursTxt.getValue()) <= 0 || parseInt(fridayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Friday.');
                    return;
                }
            }
            fridayValue = fridayHoursTxt.getValue();
        }
        
        if( saturdayCb.getValue() ) {
            if (saturdayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Saturday.');
                return;
            }
            if (!isNaN(parseInt(saturdayHoursTxt.getValue()))) {
                if (parseInt(saturdayHoursTxt.getValue()) <= 0 || parseInt(saturdayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Saturday.');
                    return;
                }
            }
            saturdayValue = saturdayHoursTxt.getValue();
        }
        
        if( sundayCb.getValue() ) {
            if (sundayHoursTxt.getValue() === '') {
                saveBtn.showWarning('Please enter the number of hours for Sunday.');
                return;
            }
            if (!isNaN(parseInt(sundayHoursTxt.getValue()))) {
                if (parseInt(sundayHoursTxt.getValue()) <= 0 || parseInt(sundayHoursTxt.getValue()) >= 25) {
                    saveBtn.showWarning('Please enter a number between 1 and 24 for Sunday.');
                    return;
                }
            }
            sundayValue = sundayHoursTxt.getValue();
        }
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=updateEmployeeWorkSchedule',
            data: {
                employeeId: parseInt(employeeId),
                monday: parseInt(mondayValue),
                tuesday: parseInt(tuesdayValue),
                wednesday: parseInt(wednesdayValue),
                thursday: parseInt(thursdayValue),
                friday: parseInt(fridayValue),
                saturday: parseInt(saturdayValue),
                sunday: parseInt(sundayValue)
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