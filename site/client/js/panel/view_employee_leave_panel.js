/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE LEAVE PANEL
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
app.panel.ViewEmployeeLeave = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    var filterContainerEl = null;
    var startDate = null;
    var endDate = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    var leaveTypes = [];
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // reloadLeaveType
    function reloadLeaveType(leaveTypeId) {
        
        let typeContainerEl = null;
        let currentLeaveTypeIndex = null;
        for (var i = 0; i < leaveTypes.length; i++) {
            if(leaveTypes[i].leaveTypeId === leaveTypeId) {
                typeContainerEl = leaveTypes[i].typeContainerEl;
                currentLeaveTypeIndex = i;
            }
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getLeaveTypeList',
            data: {
                employeeId: config.employeeId,
                startDate: (startDate.getValue().trim() !== '' ? startDate.getValue().trim() : null),
                endDate: (endDate.getValue().trim() !== '' ? endDate.getValue().trim() : null)
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    
                    return;
                }
                
                // Add leave type sections
                for( let i = 0; i < result.leaveTypes.length; i++ ) {
                    
                    if (result.leaveTypes[i].id === leaveTypeId) {
                        typeContainerEl.innerHTML = '';
                        
                        // Create the type's heading bar
                        let typeHeadingEl = lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                padding: '0px 3px 0px 15px',
                                height: '45px',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 1px 0px',
                                borderColor: '#DFDFDF'
                            }
                        });
                        
                        // Create the type's heading bar
                        let leaveHeadingContainerEl = lx.createElement('DIV', {
                            parent: typeHeadingEl,
                            style: {
                                margin: '0px 0px 0px 0px',
                                display: 'flex',
                                flexDirection: 'row',
                            }
                        });
                        
                        // Create the menu dropdown button
                        let subscribeCheckbox = new lx.component.Checkbox({
                            renderTo: leaveHeadingContainerEl,
                            label: null,
                            margin: '0px 10px 0px 0px',
                            width: ''
                        });
                        subscribeCheckbox.addEventListener('click', subscribeCheckboxChangeEventHandler.bind(me, result.leaveTypes[i].id));
                        leaveTypes[currentLeaveTypeIndex].leaveTypeId = result.leaveTypes[i].id;
                        leaveTypes[currentLeaveTypeIndex].subscribeCheckboxEl = subscribeCheckbox;
                        leaveTypes[currentLeaveTypeIndex].typeContainerEl = typeContainerEl;
                        if( result.leaveTypes[i].isSubscribed === false ) {
                            subscribeCheckbox.setValue(false);
                        }
                        else {
                            subscribeCheckbox.setValue(true);
                        }
                        
                        // Create the type's heading bar
                        lx.createElement('DIV', {
                            parent: leaveHeadingContainerEl,
                            style: {
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            },
                            innerHTML: result.leaveTypes[i].name
                        });
                        
                        // Create the menu dropdown button
                        let typeDropDownBtn = new lx.component.DropdownButton({
                            renderTo: typeHeadingEl,
                            margin: '0px 0px 0px 5px',
                            label: '<i class="fa fa-ellipsis-v"></i>',
                            dropdownAlignment: 'right'
                        });
                        
                        // Create the menuDropDownBtnAddEl element
                        let typeDropDownBtnAllocateEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Allocate</span>'
                        });
                        typeDropDownBtnAllocateEl.addEventListener('click', typeDropDownBtnAllocatetElClickEventHandler.bind(me, result.leaveTypes[i].id));
                        
                        let typeDropDownBtnResetEl = lx.createElement('DIV', {
                            parent: typeDropDownBtn.getContainer(),
                            className: 'list-item',
                            style: {
                                width: '100px',
                                padding: '8px 10px',
                                borderStyle: 'solid',
                                borderWidth: '0px 0px 0px 3px'
                            },
                            innerHTML: '<i class="fas fa-reply" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Reset</span>'
                        });
                        typeDropDownBtnResetEl.addEventListener('click', menuDropDownBtnLeaveActionElClickEventHandler.bind(me, result.leaveTypes[i].id));
                        
                        if (result.leaveTypes[i].leave.length === 0) {
                            if( result.leaveTypes[i].isSubscribed === false ) {
                                lx.createElement('DIV', {
                                    parent: typeContainerEl,
                                    style: {
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        padding: '15px 15px'
                                        
                                    },
                                    innerHTML: 'The employee does not have any leave of this type.'
                                });
                            }
                            else {
                                lx.createElement('DIV', {
                                    parent: typeContainerEl,
                                    style: {
                                        boxSizing: 'border-box',
                                        width: '100%',
                                        padding: '15px 15px'
                                        
                                    },
                                    innerHTML: 'The employee does not have any leave of this type for the specified period.'
                                });
                            }
                            continue;
                        }
                        let typeItemEl = lx.createElement('DIV', {
                            parent: typeContainerEl,
                            style: {
                                boxSizing: 'border-box',
                                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                                width: '100%',
                                // padding: '10px 15px'
                                
                            },
                            // innerHTML: ruleText
                        });
                        
                        let leaveGrid = new lx.component.Grid({
                            renderTo: typeItemEl,
                            autoSize: true,
                            borderWidth: '0px',
                            
                            columns: [
                                {dataIndex: 'date', name: 'Date', width: '120px', padding: '0px 0px 0px 15px'},
                                {dataIndex: 'description', name: 'Description'},
                                {dataIndex: 'source', name: 'Source', width: '120px'},
                                {dataIndex: 'unit', name: 'Amount', width: '120px', alignment: 'right'},
                                {dataIndex: 'balance', name: 'Balance', width: '120px', alignment: 'right', padding: '0px 15px 0px 0px'}
                            ]
                        });
                        
                        let leave = [];
                        for( let j = 0; j < result.leaveTypes[i].leave.length; j++ ) {
                            
                            if (result.leaveTypes[i].leave[j].date === null) {
                                continue;
                            }
                            
                            let unit = '';
                            let unitType = '';
                            if(result.leaveTypes[i].leaveUnitCode === 'DAYS') {
                                unit = result.leaveTypes[i].leave[j].days + ' Days';
                                unitType = 'd';
                            }
                            else if (result.leaveTypes[i].leaveUnitCode === 'HOUR') {
                                unit = result.leaveTypes[i].leave[j].hours + ' Hours';
                                unitType = 'h';
                            }
                            
                            let units = lx.util.formatLeaveUnits(unit, unitType);
                            let balance = lx.util.formatLeaveUnits(result.leaveTypes[i].leave[j].balance, unitType);
                            if(result.leaveTypes[i].leave[j].date === null) {
                                units = '';
                                balance = '';
                            }
                            leave.push({
                                description: result.leaveTypes[i].leave[j].description,
                                date: result.leaveTypes[i].leave[j].date,
                                source: result.leaveTypes[i].leave[j].leaveSourceTypesName,
                                unit: units,
                                balance: balance
                            });
                            
                        }
                        leaveGrid.clear();
                        leaveGrid.addRows( leave );
                        break;
                    }
                }
            }
        });
        
    }
    
    // Function to load leave types
    function loadLeaveTypes() {
        leaveTypes = [];
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getLeaveTypeList',
            data: {
                employeeId: config.employeeId,
                startDate: (startDate.getValue().trim() !== '' ? startDate.getValue().trim() : null),
                endDate: (endDate.getValue().trim() !== '' ? endDate.getValue().trim() : null)
            },
            onSuccess: function( jsonResult ) {
                var result = JSON.parse(jsonResult);
                
                // Check if the function was successful.
                if( result.ok !== true ) {
                    new lx.component.Messagebox({
                        message: 'Unable to load leave types.'
                    });
                    
                    return;
                }
                
                // Add leave type sections
                for( let i = 0; i < result.leaveTypes.length; i++ ) {
                    
                    // Create the type's container
                    let typeContainerEl = lx.createElement('DIV', {
                        parent: contentContainerEl,
                        style: {
                            width: '100%',
                            maxWidth: '900px',
                            margin: '20px 0px 0px 0px',
                            // padding: '0px 0px 20px 0px',
                            backgroundColor: '#FFFFFF',
                            borderStyle: 'solid',
                            borderWidth: '1px',
                            borderColor: '#DFDFDF',
                            minWidth: '532px'
                        }
                    });
                    
                    // Create the type's heading bar
                    let typeHeadingEl = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            padding: '0px 3px 0px 15px',
                            height: '45px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 1px 0px',
                            borderColor: '#DFDFDF'
                        }
                    });
                    
                    // Create the type's heading bar
                    let leaveHeadingContainerEl = lx.createElement('DIV', {
                        parent: typeHeadingEl,
                        style: {
                            margin: '0px 0px 0px 0px',
                            display: 'flex',
                            flexDirection: 'row',
                        }
                    });
                    
                    // Create the menu dropdown button
                    let subscribeCheckbox = new lx.component.Checkbox({
                        renderTo: leaveHeadingContainerEl,
                        label: null,
                        margin: '0px 10px 0px 0px',
                        width: ''
                    });
                    subscribeCheckbox.addEventListener('click', subscribeCheckboxChangeEventHandler.bind(me, result.leaveTypes[i].id));
                    if (result.leaveTypes[i].isSubscribed === false) {
                        subscribeCheckbox.setValue(false);
                    }
                    else {
                        subscribeCheckbox.setValue(true);
                    }
                    leaveTypes.push({
                        leaveTypeId: result.leaveTypes[i].id,
                        name: result.leaveTypes[i].name,
                        subscribeCheckboxEl: subscribeCheckbox,
                        typeContainerEl: typeContainerEl
                    });
                    
                    // Create the type's heading bar
                    lx.createElement('DIV', {
                        parent: leaveHeadingContainerEl,
                        style: {
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        },
                        innerHTML: result.leaveTypes[i].name
                    });
                    
                    // Create the menu dropdown button
                    let typeDropDownBtn = new lx.component.DropdownButton({
                        renderTo: typeHeadingEl,
                        margin: '0px 0px 0px 5px',
                        label: '<i class="fa fa-ellipsis-v"></i>',
                        dropdownAlignment: 'right'
                    });
                    
                    // Create the menuDropDownBtnAddEl element
                    let typeDropDownBtnAllocateEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Allocate</span>'
                    });
                    typeDropDownBtnAllocateEl.addEventListener('click', typeDropDownBtnAllocatetElClickEventHandler.bind(me, result.leaveTypes[i].id));
                    
                    let typeDropDownBtnResetEl = lx.createElement('DIV', {
                        parent: typeDropDownBtn.getContainer(),
                        className: 'list-item',
                        style: {
                            width: '100px',
                            padding: '8px 10px',
                            borderStyle: 'solid',
                            borderWidth: '0px 0px 0px 3px'
                        },
                        innerHTML: '<i class="fas fa-reply" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Reset</span>'
                    });
                    typeDropDownBtnResetEl.addEventListener('click', menuDropDownBtnLeaveActionElClickEventHandler.bind(me, result.leaveTypes[i].id));
                    
                    if (result.leaveTypes[i].leave.length === 0) {
                        if( result.leaveTypes[i].isSubscribed === false ) {
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '15px 15px'
                                    
                                },
                                innerHTML: 'The employee does not have any leave of this type.'
                            });
                        }
                        else {
                            lx.createElement('DIV', {
                                parent: typeContainerEl,
                                style: {
                                    boxSizing: 'border-box',
                                    width: '100%',
                                    padding: '15px 15px'
                                    
                                },
                                innerHTML: 'The employee does not have any leave of this type for the specified period.'
                            });
                        }
                        continue;
                    }
                    let typeItemEl = lx.createElement('DIV', {
                        parent: typeContainerEl,
                        style: {
                            boxSizing: 'border-box',
                            width: '100%',
                            // padding: '10px 15px'
                            
                        },
                        // innerHTML: ruleText
                    });
                    
                    let leaveGrid = new lx.component.Grid({
                        renderTo: typeItemEl,
                        autoSize: true,
                        borderWidth: '0px',
                        
                        columns: [
                            {dataIndex: 'date', name: 'Date', width: '120px', padding: '0px 0px 0px 15px'},
                            {dataIndex: 'description', name: 'Description'},
                            {dataIndex: 'source', name: 'Source', width: '120px'},
                            {dataIndex: 'unit', name: 'Amount', width: '120px', alignment: 'right'},
                            {dataIndex: 'balance', name: 'Balance', width: '120px', alignment: 'right', padding: '0px 15px 0px 0px'}
                        ]
                    });
                    
                    let leave = [];
                    for( let j = 0; j < result.leaveTypes[i].leave.length; j++ ) {
                        
                        if (result.leaveTypes[i].leave[j].date === null) {
                            continue;
                        }
                        
                        let unit = '';
                        let unitType = '';
                        if(result.leaveTypes[i].leaveUnitCode === 'DAYS') {
                            unit = result.leaveTypes[i].leave[j].days + ' Days';
                            unitType = 'd';
                        }
                        else if (result.leaveTypes[i].leaveUnitCode === 'HOUR') {
                            unit = result.leaveTypes[i].leave[j].hours + ' Hours';
                            unitType = 'h';
                        }
                        
                        let units = lx.util.formatLeaveUnits(unit, unitType);
                        let balance = lx.util.formatLeaveUnits(result.leaveTypes[i].leave[j].balance, unitType);
                        if(result.leaveTypes[i].leave[j].date === null) {
                            units = '';
                            balance = '';
                        }
                        leave.push({
                            description: result.leaveTypes[i].leave[j].description,
                            date: result.leaveTypes[i].leave[j].date,
                            source: result.leaveTypes[i].leave[j].leaveSourceTypesName,
                            unit: units,
                            balance: balance
                        });
                        
                    }
                    leaveGrid.clear();
                    leaveGrid.addRows( leave );
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
        // FILTER SECTION
        //
        
        // Container for dipslaying filters
        filterContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#EFEFEF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px',
                margin: '0px 0px 0px 0px',
                padding: '15px 20px'
            }
        });
        
        // The start date for the leave to be displayed
        startDate = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            label: 'Start Date:',
            labelAlign: 'left',
            labelWidth: '70px',
            width: '210px',
            margin: '0px 0px 0px auto',
            
            onChange: filterOnChangeEvent
        });
        
        // The end date for the leave to be displayed
        endDate = new lx.component.DatePicker({
            renderTo: filterContainerEl,
            label: 'End Date:',
            labelAlign: 'left',
            labelWidth: '65px',
            width: '210px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEvent
        });
        
        var date = new Date();
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Set the default start date
        var month = '' + ((lastDay.getMonth() % 12) + 1);
        var day = '' + firstDay.getDate();
        var year = firstDay.getFullYear() - 1;
            
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        startDate.setValue(year + '-' + month + '-' + day);
        
        // Set the default end date
        // month = '' + (lastDay.getMonth() + 1);
        // day = '' + lastDay.getDate();
        // year = lastDay.getFullYear();
        month = '' + (date.getMonth() + 1);
        day = '' + date.getDate();
        year = date.getFullYear();
        
        if (month.length < 2) {
            month = '0' + month;
        }
        if (day.length < 2) {
            day = '0' + day;
        }
        endDate.setValue(year + '-' + month + '-' + day);
        
        
        
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
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '0px 15px 15px 15px'
            }
        });
        
        // Load leave types
        loadLeaveTypes();
        
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
    
    function menuDropDownBtnLeaveActionElClickEventHandler(leaveTypeId) {
        // Get the name of the leave type being reset.
        let leaveTypeName = '';
        for( var i = 0; i < leaveTypes.length; i++ ) {
            if( leaveTypes[i].leaveTypeId === leaveTypeId ) {
                leaveTypeName = leaveTypes[i].name;
                break;
            }
        }
        
        new lx.component.Messagebox({
            title: 'Reset Leave',
            message: 
                'Are you sure you want to reset the employee\'s leave for the \'' + leaveTypeName + '\' type?',
            buttons: [
                {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                {name: 'reset', label: 'Reset', isDefault: true}
            ],
            onClose: function( closeEvent ) {
                // Should the payrun be processed?
                if( closeEvent.button === 'reset' ) {
                    lx.sendJSON({
                        url: 'exec.php?c=Employee&fn=resetLeave',
                        data: {
                            leaveTypeId: leaveTypeId,
                            employeeId: config.employeeId
                        },
                        onSuccess: function( responseText ) {
                            var response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Employee leave',
                                    message: response.error
                                });
                            }
                            contentContainerEl.innerHTML = '';
                            loadLeaveTypes();
                        }
                    });
                }
                else {
                    return;
                }
            }
        });
    }
    
    function subscribeCheckboxChangeEventHandler(leaveTypeId) {
        // Find the leave type to subscribe to.
        let leaveType = null;
        for (var i = 0; i < leaveTypes.length; i++) {
            if(leaveTypes[i].leaveTypeId === leaveTypeId){
                leaveType = leaveTypes[i];
                break;
            }
        }
        
        // Check that the leave type was found.
        if( leaveType === null ) {
            let action = '';
            if( leaveTypes[i].subscribeCheckboxEl.getValue() === true ) action = 'disable';
            else action = 'enable';
            
            new lx.component.Messagebox({
                message: 'Failed to ' + action + ' leave type for employee.'
            });
            
            return;
        }
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=subscribeLeave',
            data: {
                leaveTypeId: leaveTypeId,
                employeeId: config.employeeId,
                unsubscribe: leaveType.subscribeCheckboxEl.getValue()
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Employee leave',
                        message: response.error
                    });
                }
                reloadLeaveType(leaveTypeId);
            }
        });
        
    }
    
    // typeDropDownBtnAllocatetEl click event handler
    function typeDropDownBtnAllocatetElClickEventHandler(leaveTypeId) {
        // Create a modal window
        var viewLeaveTypeModel = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '434px'
        });
        
        // Create the editAddressDetailsPanel panel
        var editLeaveTypePanel = new app.panel.AllocateEmployeeLeave({
            renderTo: viewLeaveTypeModel.getContainer(),
            show: true,
            leaveTypeId: leaveTypeId,
            employeeId: config.employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                contentContainerEl.innerHTML = '';
                loadLeaveTypes();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        viewLeaveTypeModel.addEventListener('destroy', function() {
            editLeaveTypePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: viewLeaveTypeModel
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        viewLeaveTypeModel.show();
    }
    
    // The event that is fire when a filter is changed
    function filterOnChangeEvent() {
        contentContainerEl.innerHTML = '';
        loadLeaveTypes();
    }
    
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};