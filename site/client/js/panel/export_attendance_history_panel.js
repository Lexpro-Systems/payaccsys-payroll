/* globals app, lx */
'use strict';

// EXPORT ATTENDANCE HISTORY PANEL
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
app.panel.ExportAttendanceHistory = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var exportDetailsSectionEl = null;
    var exportFormatRadio = null;
    var startDate = null;
    var endDate = null;
    var typeSelect = null;
    var departmentSelect = null;
    
    var buttonContainerEl = null;
    var cancelBtn = null;
    var exportBtnContainerEl = null;
    var exportBtn = null;
    
    var searchString = '';
    var sortList = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    // Function to load departments
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: departmentSelect.getSearchString(),
                limit: 10,
                offset: departmentSelect.getItemCount() -1,
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                // Populate departments select box
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                    
                }
                departmentSelect.addItems( departments );
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
            
            searchString: null,
            sortlist: null,
            startDate: null,
            endDate: null,
            typeValue: null,
            typeText: null,
            departmentId: null,
            departmentName: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onExport') ) me.addEventListener('export', compConfig.onExport);
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Save search string and sort list , if any
        searchString = compConfig.searchString;
        sortList = compConfig.sortList;
        
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
            innerHTML: 'Export Attendance Register History'
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
                padding: '0px 0px 15px 0px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // EXPORT DETAILS SECTION
        //
        
        // Create example section
        exportDetailsSectionEl = lx.createElement('DIV', {
            parent: contentEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                margin: '15px 15px 0px 15px',
                padding: '15px'
            }
        });
        
        // Create the exportFormatRadio component
        exportFormatRadio = new lx.component.RadioGroup({
            renderTo: exportDetailsSectionEl,
            label: 'Export Format',
            margin: '0px 0px 0px 0px',
            items: [
                {text: 'Excel', value: 'xls'},
                {text: 'CSV', value: 'csv'},
                {text: 'PDF', value: 'pdf'}
            ]
        });
        exportFormatRadio.setValue('xls');
        
        // Create the startDate component
        startDate = new lx.component.DatePicker({
            renderTo: exportDetailsSectionEl,
            label: 'Start Date',
            margin: '20px 0px 0px 0px'
        });
        startDate.setValue( compConfig.startDate );
        
        // Create the endDate component
        endDate = new lx.component.DatePicker({
            renderTo: exportDetailsSectionEl,
            label: 'End Date',
            margin: '20px 0px 0px 0px'
        });
        endDate.setValue( compConfig.endDate );
        
        // Create birthdayDaySelect component
        typeSelect = new lx.component.Selectbox({
            renderTo: exportDetailsSectionEl,
            label: 'Attendee Type',
            margin: '20px 0px 0px 0px'
        });
        var types = [];
        types.push({value: null,    text: 'Any Type'});
        types.push({value: 'VISI',  text: 'Visitors'});
        types.push({value: 'EMPL',  text: 'Employees'});
        typeSelect.addItems( types );
        typeSelect.setValue( compConfig.typeValue, compConfig.typeText );
        
        // Create departmentSelect component
        departmentSelect = new lx.component.Selectbox({
            renderTo: exportDetailsSectionEl,
            label: 'Department',
            margin: '20px 0px 0px 0px',
            
            search: true,
            
            onSearch: function() {
                // Clear the departments
                departmentSelect.clear();
                
                // Add the item for all departments
                var departments = [];
                departments.push({
                    value: null,
                    text: 'All Departments'
                });
                departmentSelect.addItems( departments );
                
                // Load the departments
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                // Load the departments
                loadDepartments();
            }
        });
        departmentSelect.addItems( [{
            value: null,
            text: 'All Departments'
            }]
        );
        departmentSelect.setValue( compConfig.departmentId, compConfig.departmentName );
        
        
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
        
        // Create the exportBtnContainerEl element
        exportBtnContainerEl = lx.createElement('DIV', {
            parent: buttonContainerEl,
            style: {
                position: 'relative',
                margin: '0px 0px 0px 30px'
            }
        });
        
        // Create the exportBtn component
        exportBtn = new lx.component.Button({
            renderTo: exportBtnContainerEl,
            label: 'Export',
            width: '120px',
            
            onClick: exportBtnClickEventHandler
        });
        
        // Load the panel data
        loadDepartments();
        
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
        exportFormatRadio.focus();
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
    
    // Export button click event handler
    function exportBtnClickEventHandler() {
        if( exportFormatRadio.getValue() === 'pdf' ) {
            lx.sendForm({
                url: 'exec.php?c=Attendance&fn=exportHistoryPdf',
                target: '_blank',
                data: {
                    searchString: searchString,
                    sortList: sortList,
                    startDate: (startDate.getValue() !== '' ? startDate.getValue() : null),
                    endDate: (endDate.getValue() !== '' ? endDate.getValue() : null),
                    type: typeSelect.getValue(),
                    departmentId: departmentSelect.getValue()
                }
            });
        }
        else {
            lx.sendForm({
                url: 'exec.php?c=Attendance&fn=exportHistory',
                target: '_self',
                data: {
                    format: exportFormatRadio.getValue(),
                    sortList: sortList,
                    searchString: searchString,
                    startDate: (startDate.getValue() !== '' ? startDate.getValue() : null),
                    endDate: (endDate.getValue() !== '' ? endDate.getValue() : null),
                    type: typeSelect.getValue(),
                    departmentId: departmentSelect.getValue()
                }
            });
        }
        me.fireEvent('export', {srcPanel: me});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};