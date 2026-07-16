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
app.panel.EditEmployeeWorkDays = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;

    var workScheduleDetailsSection = null;
    var mondayCb = null;
    var tuesdayCb = null;
    var wednesdayCb = null;
    var thursdayCb = null;
    var fridayCb = null;
    var saturdayCb = null;
    var sundayCb = null;
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
            innerHTML: 'Edit Employee Work Days'
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
                margin: '30px 15px 0px 15px',
                padding: '15px 15px 25px 60px',
                display: 'flex'
            }
        });
        
        mondayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Monday',
            width: '120px',
            
        });
        
        tuesdayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Tuesday',
            width: '120px',
        
        });
        
        wednesdayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Wednesday',
            width: '120px',
            
        });
        
        thursdayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Thursday',
            width: '120px',
            
        });
        
        fridayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Friday',
            width: '120px',
            
        });
        
        saturdayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label: 'Saturday',
            width: '120px',
            
        });
        
        sundayCb = new lx.component.Checkbox({
            renderTo: workScheduleDetailsSection,
            margin: '15px 0px 0px 0px',
            labelAlign: 'right',
            label:' Sunday',
            width: '120px',

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
        //loadWorkSchedule();
        
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
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Save button click event handler
    function saveBtnClickEventHandler() {
        
        let enableLeave = false;
        let mondayValue = null;
        let tuesdayValue = null;
        let wednesdayValue = null;
        let thursdayValue = null;
        let fridayValue = null;
        let saturdayValue = null;
        let sundayValue = null;
        let mondayWd = mondayCb.getValue();
        let tuesdayWd = tuesdayCb.getValue();
        let wednesdayWd = wednesdayCb.getValue();
        let thursdayWd = thursdayCb.getValue();
        let fridayWd = fridayCb.getValue();
        let saturdayWd = saturdayCb.getValue();
        let sundayWd = sundayCb.getValue();
        let wdEnableLeave = false;
        if(mondayWd || tuesdayWd || wednesdayWd || thursdayWd || fridayWd || saturdayWd || sundayWd){
          wdEnableLeave = true;
        };
        
        
        saveBtn.showLoader();
        saveBtn.disable();
        
        console.log(`
        Monday: ${mondayWd}
        Tuesday: ${tuesdayWd}
        Wednesday: ${wednesdayWd}
        Thursday: ${thursdayWd}
        Friday: ${fridayWd}
        Saturday: ${saturdayWd}
        Sunday: ${sundayWd}
        wdEnableLeave: ${wdEnableLeave}
        `);
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=updateEmployeeWorkSchedule',
            data: {
                employeeId: parseInt(employeeId),
                monday: mondayValue,
                tuesday: tuesdayValue,
                wednesday: wednesdayValue,
                thursday: thursdayValue,
                friday: fridayValue,
                saturday: saturdayValue,
                sunday: sundayValue,
                mondayWd: mondayWd,
                tuesdayWd:  tuesdayWd,
                wednesdayWd: wednesdayWd,
                thursdayWd: thursdayWd,
                fridayWd: fridayWd,
                saturdayWd: saturdayWd,
                sundayWd: sundayWd,
                wdEnableLeave: wdEnableLeave
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