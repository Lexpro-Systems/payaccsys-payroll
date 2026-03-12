/* jslint node: true */
/* globals app */
'use strict';


// VIEW EMPLOYEE WORK SCHEDULE PANEL
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
app.panel.ViewEmployeeWorkSchedule = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var workScheduleHeadingEl = null;
    var workScheduleEditBtn = null;
    var workScheduleSectionEl = null;
    var mondayHoursDisplay = null;
    var tuesdayHoursDisplay = null;
    var wednesdayHoursDisplay = null;
    var thursdayHoursDisplay = null;
    var fridayHoursDisplay = null;
    var saturdayHoursDisplay = null;
    var sundayHoursDisplay = null;
    var enableLeaveDisplay = null;
    
    var employeeId = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadWorkSchedule() {
        loader.show();
        
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
                
                var monday = '-';
                var tuesday = '-';
                var wednesday = '-';
                var thursday = '-';
                var friday = '-';
                var saturday = '-';
                var sunday = '-';
                
                if( response.workSchedule.monday !== null ){
                    monday = response.workSchedule.monday;
                }
                if( response.workSchedule.tuesday !== null ){
                    tuesday = response.workSchedule.tuesday;
                }
                if( response.workSchedule.wednesday !== null ){
                    wednesday = response.workSchedule.wednesday;
                }
                if( response.workSchedule.thursday !== null ){
                    thursday = response.workSchedule.thursday;
                }
                if( response.workSchedule.friday !== null ){
                    friday = response.workSchedule.friday;
                }
                if( response.workSchedule.saturday !== null ){
                    saturday = response.workSchedule.saturday;
                }
                if( response.workSchedule.sunday !== null ){
                    sunday = response.workSchedule.sunday;
                }
                
                var enableLeave = 'No';
                if( response.workSchedule.enableLeave ){
                    enableLeave = 'Yes'
                }
                
                mondayHoursDisplay.setValue(monday);
                tuesdayHoursDisplay.setValue(tuesday);
                wednesdayHoursDisplay.setValue(wednesday);
                thursdayHoursDisplay.setValue(thursday);
                fridayHoursDisplay.setValue(friday);
                saturdayHoursDisplay.setValue(saturday);
                sundayHoursDisplay.setValue(sunday);
                enableLeaveDisplay.setValue(enableLeave);
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
        
        // Create the workScheduleHeadingEl element
        workScheduleHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Work Schedule</div>'
        });
        
        // Create workScheduleEditBtn component
        workScheduleEditBtn = new lx.component.Button({
            renderTo: workScheduleHeadingEl,
            label: 'Edit',
            style: 'text',
            
            onClick: workScheduleEditBtnClickEventhandler
        });
        
        // Create the workScheduleSectionEl element
        workScheduleSectionEl = lx.createElement('DIV', {
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
        
        mondayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '0px 0px 0px 0px',
            label: 'Monday Hours:',
            labelWidth: '230px'
        });
        
        tuesdayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Tuesday Hours:',
            labelWidth: '230px'
        });
        
        wednesdayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Wednesday Hours:',
            labelWidth: '230px'
        });
        
        thursdayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Thursday Hours:',
            labelWidth: '230px'
        });
        
        fridayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Friday Hours:',
            labelWidth: '230px'
        });
        
        saturdayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Saturday Hours:',
            labelWidth: '230px'
        });
        
        sundayHoursDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Sunday Hours:',
            labelWidth: '230px'
        });
        
        enableLeaveDisplay = new lx.component.Display({
            renderTo: workScheduleSectionEl,
            margin: '10px 0px 0px 0px',
            label: 'Take schedule into account when calculating leave:',
            labelWidth: '230px'
        });
        
        // Load form data
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
    
    // workScheduleEditBtn click event handler
    function workScheduleEditBtnClickEventhandler() {
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
                loadWorkSchedule();
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
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};