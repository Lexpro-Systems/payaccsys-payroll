/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW DEPARTMENT DEFAULT DETAILS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  departmentId:       The ID of the department to configure.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewDefaultDetails = function (config) {

    //
    // PRIVATE VARIABLES
    //

    var me = this;
    var confirmDestroy = null;
    var el = null;
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var WDDetailsHeadingEl = null;
    var WDDetailsEditBtn = null;
    var WDDetailsSectionEl = null;
    var WDDetailsEmptyEl = null;
    var mondayDWCb = null;
    var tuesdayDWCb = null;
    var wednesdayDWCb = null;
    var thursdayDWCb = null;
    var fridayDWCb = null;
    var saturdayDWCb = null;
    var sundayDWCb = null;
    var enableLeaveCb = null;
    var scheduleDetailsHeadingEl = null;
    var scheduleDetailsEditBtn = null;
    var scheduleDetailsSectionEl = null;
    var scheduleDetailsDisplayEl = null;
    var departmentId = null;

    //
    // OBJECT EXTENSIONS
    //

    lx.EventEmitter.call(this);


    //
    // PRIVATE FUNCTIONS
    //

    function loadDepartment(departmentId) {
        loader.show(false);
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=get',
            data: {
                departmentId: departmentId
            },
            onSuccess: function (responseText) {
                loader.hide();
                var response = JSON.parse(responseText);
                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Department Default Details Failed',
                        message: response.error
                    });
                }

                var value = '-';

                // Set work schedule details
                if (response.department.workSchedule !== null) {
                    var scheduleString = '';

                    if (response.department.workSchedule.enableLeave) {
                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Sunday:</div>';
                        if (response.department.workSchedule.sunday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.sunday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Monday:</div>';
                        if (response.department.workSchedule.monday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.monday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Tuesday:</div>';
                        if (response.department.workSchedule.tuesday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.tuesday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Wednesday:</div>';
                        if (response.department.workSchedule.wednesday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.wednesday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Thursday:</div>';
                        if (response.department.workSchedule.thursday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.thursday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Friday:</div>';
                        if (response.department.workSchedule.friday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.friday + ' hours<br />';

                        scheduleString = scheduleString + '<div style="display: inline-block; width: 90px;">Saturday:</div>';
                        if (response.department.workSchedule.saturday === null) scheduleString = scheduleString + '-<br />';
                        else scheduleString = scheduleString + response.department.workSchedule.saturday + ' hours<br />';

                        scheduleDetailsDisplayEl.setValue(scheduleString);

                    } else {
                        scheduleDetailsDisplayEl.setValue('No work schedule set.');
                    }

                    // if (response.department.workSchedule.wdEnableLeave) {

                    // mondayDWCb.setValue(response.department.workSchedule.mondaywd);
                    // tuesdayDWCb.setValue(response.department.workSchedule.tuesdaywd);
                    // wednesdayDWCb.setValue(response.department.workSchedule.wednesdaywd);
                    // thursdayDWCb.setValue(response.department.workSchedule.thursdaywd);
                    // fridayDWCb.setValue(response.department.workSchedule.fridaywd);
                    // saturdayDWCb.setValue(response.department.workSchedule.saturdaywd);
                    // sundayDWCb.setValue(response.department.workSchedule.sundaywd);

                    // } else {
                    //     WDDetailsSectionEl.innerHTML = "No workdays configured.";
                    // }
                    refreshWorkDaysSection(response.department.workSchedule);
                }
                else {
                    scheduleDetailsDisplayEl.setValue('No work schedule set.');
                    // WDDetailsSectionEl.innerHTML = "No workdays configured.";
                    refreshWorkDaysSection(null);
                }

                var enableLeaveStatus = false;

                if (response.department.workSchedule !== null) {
                    if (response.department.workSchedule.enableLeave === null) {
                        enableLeaveStatus = false;
                    }
                    else if (response.department.workSchedule.enableLeave) {
                        enableLeaveStatus = true;
                    }
                }
                enableLeaveCb.setValue(enableLeaveStatus);

            }
        });
    }


    //
    // PUBLIC FUNCTIONS
    //

    me.init = function (config) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,

            departmentId: null
        };

        // Parse user config
        if (typeof config !== 'undefined' && config !== null) {
            for (var property in config) {
                if (config.hasOwnProperty(property)) compConfig[property] = config[property];
            }
        }

        // Attach external event handlers
        if (compConfig.hasOwnProperty('onDestroy')) me.addEventListener('destroy', compConfig.onDestroy);

        // Initialize state
        confirmDestroy = false;
        departmentId = compConfig.departmentId;

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
        // Days Worked SECTION
        //

        // Create the scheduleDetailsHeadingEl element
        WDDetailsHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Employee Working Days</div>'
        });

        // Create scheduleDetailsEditBtn component
        WDDetailsEditBtn = new lx.component.Button({
            renderTo: WDDetailsHeadingEl,
            label: 'Edit',
            style: 'text',

            onClick: WDDetailsEditBtnClickEventhandler
        });

        // Create the scheduleDetailsSectionEl element
        WDDetailsSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px 15px 15px 50px',
                gap: '10px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'flex'
            }
        });

        mondayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Monday',
            width: '100px',
        });
        tuesdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            //margin: '15px 0px 0px 0px',
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Tuesday',
            width: '100px',

            //onChange: tuesdayCbOnChangeEventHandler
        });
        wednesdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px 15px 0px 0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Wednesday',
            width: '100px',

        });
        thursdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            //margin: '15px 0px 0px 0px',
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Thursday',
            width: '100px',

        });
        fridayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            //margin: '15px 0px 0px 0px',
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Friday',
            width: '100px',

        });
        saturdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            //margin: '15px 0px 0px 0px',
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Saturday',
            width: '100px',

        });
        sundayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            //margin: '15px 0px 0px 0px',
            margin: '0px',
            // labelAlign: 'left',
            labelAlign: 'right',
            label: 'Sunday',
            width: '100px',
        });

        WDDetailsEmptyEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                padding: '15px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box',
                display: 'none'
            },
            innerHTML: 'No workdays configured.'
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
        // Load form data
        loadDepartment(departmentId);

        // If show is set to true show the panel.
        if (compConfig.show === true) me.show();
    };

    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function (renderTo) {
        // Remove it from its current target
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        // Add it to the new renderTo element
        renderTo.appendChild(el);
    };

    // Function to show the panel
    me.show = function () {
        lx.applyStyle(el, { display: 'flex' });
    };

    // Function to hide the panel
    me.hide = function () {
        lx.applyStyle(el, { display: 'none' });
    };

    // Function to set focus to the panel.
    me.focus = function () {
    };

    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function () {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);

        // Remove the panel from its parent
        if (el.parentElement !== null) el.parentElement.removeChild(el);

        return true;
    };


    //
    // EVENT HANDLERS
    //

    function scheduleDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editDepartmentWorkScheduleModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '517px'
        });

        // Create the editEmployeeWorkSchedulePanel panel
        var editDepartmentWorkSchedulePanel = new app.panel.EditEmployeeWorkSchedule({
            renderTo: editDepartmentWorkScheduleModal.getContainer(),
            show: true,
            departmentId: departmentId,
            employeeId: null,

            onCancel: function () {
                app.route.popState();
            },

            onSave: function () {
                app.route.popState();
                loadDepartment(departmentId);
            }
        });

        // Add destroy event listener to modal to destroy the contained panel.
        editDepartmentWorkScheduleModal.addEventListener('destroy', function () {
            editDepartmentWorkSchedulePanel.destroy();
        });

        // Create a route entry for the panel
        var state = {
            modal: editDepartmentWorkScheduleModal
        };
        app.route.pushState(state, function (state) {
            state.modal.destroy();
        });

        // Show the modal window and focus on the panel
        editDepartmentWorkScheduleModal.show();
        editDepartmentWorkSchedulePanel.focus();
    }

    function WDDetailsEditBtnClickEventhandler() {
        // Create a modal window
        var editDepartmentWorkDaysModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '1000px',
            maxHeight: '300px'
        });

        // Create the editEmployeeWorkSchedulePanel panel
        var editDepartmentWorkDaysPanel = new app.panel.EditEmployeeWorkDays({
            renderTo: editDepartmentWorkDaysModal.getContainer(),
            show: true,
            departmentId: departmentId,
            employeeId: null,

            onCancel: function () {
                app.route.popState();
            },

            onSave: function () {
                app.route.popState();
                loadDepartment(departmentId);
            }
        });

        // Add destroy event listener to modal to destroy the contained panel.
        editDepartmentWorkDaysModal.addEventListener('destroy', function () {
            editDepartmentWorkDaysPanel.destroy();
        });

        // Create a route entry for the panel
        var state = {
            modal: editDepartmentWorkDaysModal
        };
        app.route.pushState(state, function (state) {
            state.modal.destroy();
        });

        // Show the modal window and focus on the panel
        editDepartmentWorkDaysModal.show();
        editDepartmentWorkDaysPanel.focus();
    }

    function enableLeaveCbOnChangeEventHandler() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=updateEmployeeWorkSchedule',
            data: {
                employeeId: null,
                departmentId: departmentId,
                enableLeave: enableLeaveCb.getValue()
            },
            onSuccess: function (responseText) {

                var response = JSON.parse(responseText);

                if (response.ok !== true) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Failed',
                        message: response.error
                    });
                }
            }
        });
    }

    function refreshWorkDaysSection(workSchedule) {
        WDDetailsSectionEl.innerHTML = '';
        mondayDWCb = null;
        tuesdayDWCb = null;
        wednesdayDWCb = null;
        thursdayDWCb = null;
        fridayDWCb = null;
        saturdayDWCb = null;
        sundayDWCb = null;

        if (workSchedule === null || !workSchedule.wdEnableLeave) {
            WDDetailsSectionEl.innerHTML = 'No workdays configured.';
            return;
        }

        mondayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Monday',
            width: '100px'
        });
        tuesdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Tuesday',
            width: '100px'
        });
        wednesdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px 15px 0px 0px',
            labelAlign: 'right',
            label: 'Wednesday',
            width: '100px'
        });
        thursdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Thursday',
            width: '100px'
        });
        fridayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Friday',
            width: '100px'
        });
        saturdayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Saturday',
            width: '100px'
        });
        sundayDWCb = new lx.component.Checkbox({
            renderTo: WDDetailsSectionEl,
            margin: '0px',
            labelAlign: 'right',
            label: 'Sunday',
            width: '100px'
        });

        mondayDWCb.setValue(workSchedule.mondaywd);
        tuesdayDWCb.setValue(workSchedule.tuesdaywd);
        wednesdayDWCb.setValue(workSchedule.wednesdaywd);
        thursdayDWCb.setValue(workSchedule.thursdaywd);
        fridayDWCb.setValue(workSchedule.fridaywd);
        saturdayDWCb.setValue(workSchedule.saturdaywd);
        sundayDWCb.setValue(workSchedule.sundaywd);
    }

    //
    // INITIALIZE OBJECT
    //

    me.init(config);
};
