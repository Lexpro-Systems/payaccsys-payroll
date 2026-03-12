/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST ATTENDANCE HISTORY PANEL
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
app.panel.ListAttendanceHistory = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var allocateBtn = null;
    var exportBtn = null;
    
    var typeSelect = null;
    var departmentSelect = null;
    var startDate = null;
    var endDate = null;
    var searchTxt = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var attendanceSortBar = null;
    
    var attendanceGrid = null;
    
    let refreshAttendance = false;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Load the attendance history
    function loadAttendanceHistory(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = attendanceGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                sortList: attendanceSortBar.getSortItems(),
                startDate: (startDate.getValue() !== '' ? startDate.getValue() : null),
                endDate: (endDate.getValue() !== '' ? endDate.getValue() : null),
                type: typeSelect.getValue(),
                departmentId: departmentSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                var persons = [];
                for( var i = 0; i < response.persons.length; i++ ) {
                    
                    let status = 'Visitor';
                    if (response.persons[i].isEmployee == true) {
                        status = 'Employee';
                    }
                    persons.push({
                        id: response.persons[i].id,
                        attendanceId: response.persons[i].attendanceId,
                        status: status,
                        cellNumber: response.persons[i].cellNumber,
                        name: response.persons[i].alias,
                        timeIn: response.persons[i].timeIn,
                        timeOut: response.persons[i].timeOut,
                        time: response.persons[i].time,
                        temperature: response.persons[i].temperature,
                        note: response.persons[i].note,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) attendanceGrid.clear();
                
                attendanceGrid.addRows( persons );
            }
        });
    }
    
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
    
    // Set default dates
    function setDefaultDates() {
        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth();
        let firstDay = new Date(Date.UTC(year, month, + 1)).toISOString().slice(0, 10);
        let lastDay = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
        startDate.setValue(firstDay);
        endDate.setValue(lastDay);
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
        
        // Creates title container
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 0px 0px',
                flex: '0 0 auto'
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
                cursor: 'pointer'
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
            innerHTML: 'Attendance History'
        });
        
        // Create the allocateBtn component
        allocateBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Capture',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px auto',
            
            onClick: allocateBtnClickEventHandler
        });
        
        // Create the exportBtn component
        exportBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Export',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 0px',
            
            onClick: exportBtnClickEventHandler
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        var filterSectionEl = lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                borderStyle: 'solid',
                borderWidth: '1px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        
        // Create typeSelect component
        typeSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Attendee Type',
            maxWidth: '200px',
            margin: '0px 0px 0px 0px',
            height: '32px',
            
            onChange: filterOnChangeEventHandler
        });
        var types = [];
        types.push({value: null,    text: 'Any Type'});
        types.push({value: 'VISI',  text: 'Visitors'});
        types.push({value: 'EMPL',  text: 'Employees'});
        typeSelect.addItems( types );
        typeSelect.setValue( null, 'Any Type' );
        
        // Create departmentSelect component
        departmentSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            label: 'Department',
            maxWidth: '250px',
            margin: '0px 0px 0px 20px',
            height: '32px',
            
            
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
            },
            
            onChange: filterOnChangeEventHandler
        });
        
        // Select the default department
        var departments = [];
        departments.push({
            value: null,
            text: 'All Departments'
        });
        departmentSelect.addItems( departments );
        loadDepartments();
        departmentSelect.setValue(null, 'All Departments');
        
        // creates startDate
        startDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'Start Date',
            labelAlign: 'top',
            labelWidth: '70px',
            height: '32px',
            width: '150px',
            margin: '0px 0px 0px 20px',
            
            onChange: filterOnChangeEventHandler
        });
        
        // creates endDate
        endDate = new lx.component.DatePicker({
            renderTo: filterSectionEl,
            label: 'End Date',
            labelAlign: 'top',
            labelWidth: '70px',
            height: '32px',
            width: '150px',
            margin: '0px 20px 0px 20px',
            
            onChange: filterOnChangeEventHandler
        });
        
        // Create employeeStatusSelect component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            label: 'Find',
            width: '',
            maxWidth: '300px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        
        //
        // SORT BAR SECTION
        //
        
        // Create a sort bar for the employees
        attendanceSortBar = new lx.component.SortBar({
            renderTo: el,
            backgroundColor: '#F9FAFB', // lx.style.global.backgroundColor,
            orderIndicatorColor: '#B44500',
            dragHighlightColor: '#B0B0B0',
            width: '100%',
            
            displayToolTips: true,
            allowAddItems: true,
            allowRemoveItems: true,
            allowDragItems: true,
            
            sortOptions: [
                { name: 'Name', dataIndex: 'alias'},
                // { name: 'Email Address', dataIndex: 'email'},
                { name: 'Cellphone Number', dataIndex: 'cellNumber'},
                { name: 'Time In', dataIndex: 'timeIn'},
                { name: 'Time Out', dataIndex: 'timeOut'},
                { name: 'Time', dataIndex: 'time'},
                { name: 'Temperature', dataIndex: 'temperature'},
                { name: 'Note', dataIndex: 'note'}
            ],
            
            onAddButtonClick: onAttendanceSortBarAddButtonClick,
            onSortItemClick: onAttendanceSortBarSortItemClick,
            onRemoveSortItem: onAttendanceSortBarRemoveSortItem,
            onDraggedSortItem: onAttendanceSortBarDraggedSortItem
        });
        
        // Add default sort items
        attendanceSortBar.addSortItem(attendanceSortBar.getSortItemCount(), 'Time Out', 'timeOut',  'DESC');
        attendanceSortBar.addSortItem(attendanceSortBar.getSortItemCount(), 'Time In',  'timeIn',   'DESC');
        attendanceSortBar.addSortItem(attendanceSortBar.getSortItemCount(), 'Name',     'alias',    'ASC');
        
        
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
                overflow: 'auto'
            }
        });
        
        // Create attendanceGridMenuOptions array
        var attendanceGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-fw fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create attendanceGrid component
        attendanceGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'status', name: 'Type', width: '80px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'name', name: 'Name', type: 'button'},
                {dataIndex: 'cellNumber', name: 'Cellphone Number', width: '150px'},
                {dataIndex: 'timeIn', name: 'Time In', width: '160px'},
                {dataIndex: 'timeOut', name: 'Time Out', width: '160px'},
                {dataIndex: 'time', name: 'Time', width: '120px'},
                {dataIndex: 'temperature', name: 'Temperature', minWidth: '100px', maxWidth: '150px'},
                {dataIndex: 'note', name: 'Note'},
                {dataIndex: 'menu', name: '', type: 'menu', options: attendanceGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: attendanceGridCellClickEventHandler,
            
            onScrollEnd: attendanceGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'view' ) {
                    let viewAttendanceModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '450px',
                        maxHeight: '541px'
                    });
                    
                    // Create the viewAttendancePanel panel
                    let viewAttendancePanel = new app.panel.ViewAttendance({
                        renderTo: viewAttendanceModal.getContainer(),
                        show: true,
                        status: attendanceGrid.getRow(clickEvent.rowIndex).status,
                        attendanceId: attendanceGrid.getRow(clickEvent.rowIndex).attendanceId,
                        
                        onCancel: function() {
                            app.route.popState();
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    viewAttendanceModal.addEventListener('destroy', function() {
                        viewAttendancePanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    let state = {
                        modal: viewAttendanceModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    viewAttendanceModal.show();
                    viewAttendancePanel.focus();
                }
                else if( clickEvent.value === 'edit' ) {
                    // Can't edit the attendance if no time out
                    if( attendanceGrid.getRow(clickEvent.rowIndex).timeOut === null || attendanceGrid.getRow(clickEvent.rowIndex).time === null ) {
                        new lx.component.Messagebox({
                            title: 'Unable To Edit Attendance',
                            message: 'The employee or visitor has not yet signed out of the attendance register. Please sign out the employee or visitor before editing the attendance.'
                        });
                        return;
                    }
                    
                    let editAttendanceModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '450px',
                        maxHeight: '541px'
                    });
                    
                    // Create the viewAttendancePanel panel
                    let editAttendancePanel = new app.panel.EditAttendance({
                        renderTo: editAttendanceModal.getContainer(),
                        show: true,
                        status: attendanceGrid.getRow(clickEvent.rowIndex).status,
                        attendanceId: attendanceGrid.getRow(clickEvent.rowIndex).attendanceId,
                        
                        onSave: function() {
                            refreshAttendance = true;
                            loadAttendanceHistory(true);
                            app.route.popState();
                        },
                        
                        onCancel: function() {
                            app.route.popState();
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    editAttendanceModal.addEventListener('destroy', function() {
                        editAttendancePanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    let state = {
                        modal: editAttendanceModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    editAttendanceModal.show();
                    editAttendancePanel.focus();
                }
                else if( clickEvent.value === 'remove' ) {
                    new lx.component.Messagebox({
                        title: 'Remove Attendance',
                        message: 
                            'Are you certain you wish to permanently remove this attendance entry for &quot;' + attendanceGrid.getRow(clickEvent.rowIndex).name + '?&quot;',
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            // Should the payrun be removed?
                            if( closeEvent.button === 'remove' ) {
                                // Delete the payrun
                                
                                let isEmployee = true;
                                if (attendanceGrid.getRow(clickEvent.rowIndex).status === 'Visitor') {
                                    isEmployee = false;
                                }
                                
                                lx.sendJSON({
                                    url: 'exec.php?c=Attendance&fn=removeAttendance',
                                    data: {
                                        id: parseInt(attendanceGrid.getRow(clickEvent.rowIndex).attendanceId),
                                        isEmployee: isEmployee
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Removing Attendance Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        refreshAttendance = true;
                                        loadAttendanceHistory(true);
                                        return;
                                    }
                                });
                            }
                            else {
                                return;
                            }
                        }
                    });
                }
            }
        });
        
        loader.show( false );
        
        // Load departments
        setDefaultDates();
        loadAttendanceHistory(true);
        
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
        searchTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', {srcPanel: me, refreshAttendance: refreshAttendance});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        // refreshAttendance
        app.route.popState();
    }
    
    // Filter on change event handler
    function filterOnChangeEventHandler () {
        loader.show( true );
        loadAttendanceHistory(true);
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show( true );
        loadAttendanceHistory(true);
    }
    
    function onSearchResetBtnClickEventHandler () {
        loader.show( true );
        searchTxt.setValue('');
        loadAttendanceHistory( true );
    }
    
    // onAttendanceSortBarAddButton click event handler
    function onAttendanceSortBarAddButtonClick() {
        // have all the sort options been added?
        if( attendanceSortBar.getSortOptions().length <= 0 ) {
            new lx.component.Messagebox({
                title: 'Add Sort Item',
                message: 'There are no more sort items to add. All the available sort items have already been added.'
            });
            return;
        }
        
        // Create the addSortItemModal panel
        let addSortItemModal = new app.panel.AddSortItem({
            renderTo: app.mainPanel.getContainer(),
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '302px',
            
            sortOptions: attendanceSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                attendanceSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loadAttendanceHistory( true );
            },
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        let panelState = {
            previousPanel: me,
            panel: addSortItemModal
        };
        
        app.route.pushState(panelState, function( state ) {
            if( !state.panel.destroy() ) return false;
            state.previousPanel.show();
        });
        
        addSortItemModal.showModal();
        addSortItemModal.focus();
    }
    
    // updateSortItemBtnEl click event handler
    function onAttendanceSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        attendanceSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loadAttendanceHistory( true );
        return;
    }
    
    // onAttendanceSortBarRemoveSortItem click event handler
    function onAttendanceSortBarRemoveSortItem() {
        // Reload the form data
        loadAttendanceHistory( true );
    }
    
    // onAttendanceSortBarDraggedSortItem click event handler
    function onAttendanceSortBarDraggedSortItem() {
        // Reload the form data
        loadAttendanceHistory( true );
    }
    
    // allocateBtn click event handler
    function allocateBtnClickEventHandler() {
        // Create a modal window
        var allocateAttendanceModal = new lx.component.ModalWindow({
            margin: '20px',
            maxHeight: '1200px',
            maxWidth: '1200px'
        });
        
        // Create the allocate leave panel
        var allocateAttendancePanel = new app.panel.AllocateAttendance({
            renderTo: allocateAttendanceModal.getContainer(),
            show: true,
            
            onFinish: function() {
                app.route.popState();
                refreshAttendance = true;
                loadAttendanceHistory(true);
            },
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        allocateAttendanceModal.addEventListener('destroy', function() {
            allocateAttendancePanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: allocateAttendanceModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        allocateAttendanceModal.show();
        allocateAttendancePanel.focus();
    }
    
    // exportBtn click event handler
    function exportBtnClickEventHandler() {
        // Create a modal window
        var exportModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '524px'
        });
        
        // Create the exportPanel panel
        var exportPanel = new app.panel.ExportAttendanceHistory({
            renderTo: exportModal.getContainer(),
            show: true,
            
            searchString: searchTxt.getValue().trim(),
            startDate: startDate.getValue(),
            endDate: endDate.getValue(),
            typeText: typeSelect.getText(),
            typeValue: typeSelect.getValue(),
            departmentId: departmentSelect.getValue(),
            departmentName: departmentSelect.getText(),
            sortList: attendanceSortBar.getSortItems(),
            
            onCancel: function() {
                app.route.popState();
            },
            
            onExport: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        exportModal.addEventListener('destroy', function() {
            exportPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: exportModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        exportModal.show();
        exportPanel.focus();
    }
    
    // Grid component event handlers
    function attendanceGridScrollEndEventHandler() {
        loadAttendanceHistory( false );
    }
    
    // attendanceGrid cell click event handler
    function attendanceGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( attendanceGrid.getColumnDataIndex( event.columnIndex ) === 'name' ) {
            // Is it a visitor?
            if (attendanceGrid.getRow(event.rowIndex).status === 'Visitor') {
                var addVisitorModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '450px',
                    maxHeight: '541px'
                });
                
                // Create the addVisitorPanel panel
                var addVisitorPanel = new app.panel.EditVisitor({
                    renderTo: addVisitorModal.getContainer(),
                    show: true,
                    visitorId: attendanceGrid.getRow(event.rowIndex).id,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    
                    onSave: function() {
                        app.route.popState();
                        loadAttendanceHistory(true);
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                addVisitorModal.addEventListener('destroy', function() {
                    addVisitorPanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: addVisitorModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                addVisitorModal.show();
                addVisitorPanel.focus();
                return;
            }
            me.hide();
            
            // It's an employee
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                employeeId: attendanceGrid.getRow(event.rowIndex).id,
                employeeName: attendanceGrid.getRow(event.rowIndex).name
            });
            
            var panelState = {
                previousPanel: me,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};