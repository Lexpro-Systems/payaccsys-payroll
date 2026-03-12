/* globals app, lx */
'use strict';

// REASON FOR VISIT PANEL
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
app.panel.ViewAttendance = function(config) {
    
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
    var detailsSectionEl = null;
    var nameDisplay = null;
    var cellNumberDisplay = null;
    var emailAddressDisplay = null;
    var vehicleRegistrationDisplay = null;
    var idNumberDisplay = null;
    
    var timeInTimeOutDetailsHeadingEl = null;
    var timeInTimeOutDetailsSectionEl = null;
    var timeInDisplay = null;
    var timeOutDisplay = null;
    var timeDisplay = null;
    
    var reasonForVisitHeadingEl = null;
    var reasonForVisitEl = null;
    
    var temperatureHeadingEl = null;
    var temperatureEl = null;
    
    var noteHeadingEl = null;
    var noteEl = null;
    
    var buttonContainerEl = null;
    var closeBtn = null;
    var closeBtnContainerEl = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadAttendance () {
        let isEmployee = false;
        if (config.status === 'Employee') {
            isEmployee = true;
        }
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
                    reasonForVisitEl.style.display = 'none';
                }
                nameDisplay.setValue(response.attendance.name);
                cellNumberDisplay.setValue(response.attendance.cellNumber);
                
                emailAddressDisplay.setValue(response.attendance.emailAddress);
                timeInDisplay.setValue(response.attendance.timeIn);
                timeOutDisplay.setValue(response.attendance.timeOut);
                timeDisplay.setValue(response.attendance.time);
                reasonForVisitEl.innerHTML = response.attendance.reasonForVisit;
                temperatureEl.innerHTML = response.attendance.temperature;
                noteEl.innerHTML = response.attendance.note;
                
                loader.hide();
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
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onAdd') ) me.addEventListener('add', compConfig.onAdd);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
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
            innerHTML: 'View Attendance'
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
        
        nameDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            label: 'Name:',
            labelWidth: '170px'
        });
        
        emailAddressDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            label: 'Email:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        cellNumberDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            label: 'Cell Number:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        vehicleRegistrationDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            label: 'Vehicle Reg:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        idNumberDisplay = new lx.component.Display({
            renderTo: detailsSectionEl,
            label: 'ID Number:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
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
        
        timeInDisplay = new lx.component.Display({
            renderTo: timeInTimeOutDetailsSectionEl,
            label: 'Time In:',
            labelWidth: '170px',
            margin: '0px 0px 0px 0px'
        });
        
        timeOutDisplay = new lx.component.Display({
            renderTo: timeInTimeOutDetailsSectionEl,
            label: 'Time Out:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        timeDisplay = new lx.component.Display({
            renderTo: timeInTimeOutDetailsSectionEl,
            label: 'Time:',
            labelWidth: '170px',
            margin: '10px 0px 0px 0px'
        });
        
        reasonForVisitHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Reason For Visit',
            margin: '0px 15px',
            width: ''
        });
        
        reasonForVisitEl = lx.createElement('DIV', {
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
        
        temperatureHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Temperature',
            margin: '0px 15px',
            width: ''
        });
        
        temperatureEl = lx.createElement('DIV', {
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
        
        noteHeadingEl = new lx.component.Heading({
            renderTo: contentEl,
            label: 'Notes',
            margin: '0px 15px',
            width: ''
        });
        
        noteEl = lx.createElement('DIV', {
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
        
        closeBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the closeBtn component
        closeBtn = new lx.component.Button({
            renderTo: closeBtnContainerEl,
            label: 'Close',
            width: '120px',
            
            onClick: closeBtnClickEventHandler
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
    function closeBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};