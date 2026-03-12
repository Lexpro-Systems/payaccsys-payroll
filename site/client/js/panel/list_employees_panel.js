/* globals app, lx */
'use strict';


// LIST EMPLOYEES PANEL
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
app.panel.ListEmployees = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var filterSectionEl = null;
    var searchTxt = null;
    var employeeStatusSelect = null;
    var departmentSelect = null;
    var selfServiceInviteBtn = null;
    var allocateLeaveBtn = null;
    var importEmployeeBtn = null;
    // var oldAddBtn = null;
    var addBtn = null;
    
    var employeeSortBar = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var employeesGrid = null;
    var employeePanels = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Checks all panels for changes. Returns true or false
    function checkAddPageChange() {
        let addPanels = me.getPanels();
        let panelChanged = false;
        
        if( addPanels.detailsPanel.getPageChanged() ) {
            panelChanged = true;
        }
        else if( addPanels.workSchedulePanel.getPageChanged() ) {
            panelChanged = true;
        }
        else if( addPanels.earningsPanel.getPageChanged() ) {
            panelChanged = true;
        }
        else if( addPanels.retirementFundsPanel.getPageChanged() ) {
            panelChanged = true;
        }
        else if( addPanels.leavePanel.getPageChanged() ) {
            panelChanged = true;
        }
        else if( addPanels.otherPanel.getPageChanged() ) {
            panelChanged = true;
        }
        return panelChanged;
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
    
    // Function to load employees
    function loadEmployees(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = employeesGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC',
                sortList: employeeSortBar.getSortItems(),
                employeeStatus: employeeStatusSelect.getValue(),
                departmentId: departmentSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }
                
                // Populate grid
                var employees = [];
                for( var i = 0; i < response.employees.length; i++ ) {
                    let employmentDate = response.employees[i].employmentStartDate + ' to ' + response.employees[i].employmentEndDate;
                    if (response.employees[i].employmentEndDate === null) {
                        employmentDate = response.employees[i].employmentStartDate + ' to present';
                    }
                    employees.push({
                        id: response.employees[i].id,
                        code: response.employees[i].code,
                        name: response.employees[i].alias,
                        email: response.employees[i].emailAddress,
                        cellphone: response.employees[i].cellNumber,
                        department: response.employees[i].departmentName,
                        employmentStatus: response.employees[i].employmentStatus,
                        employmentDate: employmentDate,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) employeesGrid.clear();
                
                employeesGrid.addRows( employees );
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
        // TITLE SECTION
        //
        
        // Create title container
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
                borderWidth: '0px 0px 1px 0px',
                flex: '0 0 auto',
                padding: '0px 20px 0px 0px'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Employees'
        });
        
        // Create the importEmployeeBtn component
        importEmployeeBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Import',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px auto',
            
            onClick: importEmployeeBtnClickEventHandler
        });
        
        // Create the selfServiceInviteBtn component
        selfServiceInviteBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Self-Service',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: selfServiceInviteBtnClickEventHandler
        });
        
        // Create the allocateLeaveBtn component
        allocateLeaveBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Allocate Leave',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: allocateLeaveBtnClickEventHandler
        });
        
        // // Create the oldAddBtn component
        // oldAddBtn = new lx.component.Button({
        //     renderTo: titleContainerEl,
        //     label: '<div style="width: 100%; height: 100%; padding: 6px 0px;">Old Add Employee</div>',
        //     height: '32px',
        //     width: '140px',
        //     margin: '0px 0px 0px 20px',
        //     backgroundColor: '#FF0000',
            
        //     onClick: oldAddBtnClickEventHandler
        // });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Employee',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: addBtnClickEventHandler
        });
        
        
        //
        // FILTER SECTION
        //
        
        // Create the exampleSectionEl element
        filterSectionEl = lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '10px 20px 10px 20px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                // backgroundColor: lx.style.global.backgroundColor,
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create department select
        departmentSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            height: '32px',
            width: '250px',
            margin: '0px 0px 0px 0px',
            
            search: true,
            
            onSearch: function() {
                departmentSelect.clear();
                var departments = [];
                departments.push({
                    value: null,
                    text: 'All Departments'
                });
                departmentSelect.addItems( departments );
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                loadDepartments();
            },
            
            onChange: departmentSelectOnChangeEventHandler
        });
        
        // Set department select data
        var departments = [];
        departments.push({
            value: null,
            text: 'All Departments'
        });
        departmentSelect.addItems( departments );
        departmentSelect.setValue(null, 'All Departments');
        
        // Create employeeStatusSelect component
        employeeStatusSelect = new lx.component.Selectbox({
            renderTo: filterSectionEl,
            labelAlignment: 'left',
            height: '32px',
            width: '150px',
            margin: '0px 0px 0px 20px',
            
            items: [
                {text: 'All Employees', value: 'all'},
                {text: 'Employed Only', value: 'employed'},
                {text: 'Dismissed Only', value: 'dismissed'}
            ],
            
            onChange: employeeStatusSelectOnChangeEventHandler
        });
        employeeStatusSelect.setValue('employed', 'Employed Only');
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: filterSectionEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px auto',
            
            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        // // Create the user dropdown button component
        // let titleDropdownBtn = new lx.component.DropdownButton({
        //     renderTo: titleContainerEl,
        //     label: '<i class="fa fa-ellipsis-v" style="margin: 0px 0px 0px 0px; font-size: 16px;"></i>',
        //     width: '20px',
        //     margin: '0px 0px 0px 15px',
        //     dropdownAlignment: 'right'
        // });
        
        // // Create the titleDropdownContainerEl element
        // let titleDropdownContainerEl = lx.createElement('DIV', {
        //     parent: titleDropdownBtn.getContainer(),
        //     style: {
        //         padding: '5px 0px'
        //     }
        // });
        
        // // Create the titleDropdownManualEl element
        // let titleDropdownWhatsNewEl = lx.createElement('DIV', {
        //     parent: titleDropdownContainerEl,
        //     className: 'list-item',
        //     style: {
        //         width: '140px',
        //         padding: '8px 10px',
        //         borderStyle: 'solid',
        //         borderWidth: '0px 0px 0px 3px',
        //         fontSize: '13px'
        //     },
        //     innerHTML: '<i class="fa fa-fw fa-bullhorn" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>What\'s New'
        // });
        // // titleDropdownWhatsNewEl.addEventListener('click', titleDropdownWhatsNewElClickEventHandler);
        
        // // Create the titleDropdownManualEl element
        // let titleDropdownManuelEl = lx.createElement('A', {
        //     parent: titleDropdownContainerEl,
        //     className: 'list-item',
        //     style: {
        //         display: 'block',
        //         textDecoration: 'none',
        //         color: 'inherit',
        //         width: '140px',
        //         padding: '8px 10px',
        //         borderStyle: 'solid',
        //         borderWidth: '0px 0px 0px 3px',
        //         fontSize: '13px'
        //     },
        //     innerHTML: '<i class="fa fa-fw fa-book" style="margin: 0px 15px 0px 0px; font-size: 12px;"></i>Download Manual'
        // });
        
        
        //
        // SORT BAR SECTION
        //
        
        // Create a sort bar for the employees
        employeeSortBar = new lx.component.SortBar({
            renderTo: el,
            backgroundColor: '#F9FAFB', // lx.style.global.backgroundColor,
            orderIndicatorColor: '#ffffffff',
            dragHighlightColor: '#B0B0B0',
            width: '100%',
            
            displayToolTips: true,
            allowAddItems: true,
            allowRemoveItems: true,
            allowDragItems: true,
            
            sortOptions: [
                { name: 'Code', dataIndex: 'code'},
                { name: 'Name', dataIndex: 'name'},
                { name: 'Email Address', dataIndex: 'email'},
                { name: 'Cellphone Number', dataIndex: 'cellphone'},
                { name: 'Department', dataIndex: 'department'},
                { name: 'Employee Status', dataIndex: 'employmentStatus'},
                { name: 'Employment Period', dataIndex: 'employmentDate'}
            ],
            
            onAddButtonClick: onEmployeeSortBarAddButtonClick,
            onSortItemClick: onEmployeeSortBarSortItemClick,
            onRemoveSortItem: onEmployeeSortBarRemoveSortItem,
            onDraggedSortItem: onEmployeeSortBarDraggedSortItem
        });
        
        // Add default sort items
        employeeSortBar.addSortItem(employeeSortBar.getSortItemCount(), 'Name', 'name', 'ASC');
        employeeSortBar.addSortItem(employeeSortBar.getSortItemCount(), 'Code', 'code', 'ASC');
        
        
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
                overflow: 'auto',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 0px 0px'
            }
        });
        
        // Create employeesGridMenuOptions array
        var employeesGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'View'},
        ];
        
        // Create employeesGrid component
        employeesGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'code', name: 'Code', width: '100px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'name', name: 'Name', type: 'button', minWidth: '100px'},
                {dataIndex: 'email', name: 'Email Address'},
                {dataIndex: 'cellphone', name: 'Cellphone Number', width: '130px'},
                {dataIndex: 'department', name: 'Department', minWidth: '150px', maxWidth: '250px', wrapText: true},
                {dataIndex: 'employmentStatus', name: 'Status', minWidth: '100px', maxWidth: '150px',},
                {dataIndex: 'employmentDate', name: 'Employment Period', width: '180px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: employeesGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onScrollEnd: employeesGridScrollEndEventHandler,
            onCellClick: employeesGridCellClickEventHandler,
            onMenuItemClick: employeesGridMenuItemClickEventHandler
        });
        
        // Add defualt sort items
        // addSortItem('Name', 'name', 'ASC');
        
        // Show loader
        loader.show( false );
        
        // Load page data
        loadDepartments();
        loadEmployees(true);
        
        
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
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    // Function to get all employee add panels
    me.getPanels = function() {
        return employeePanels;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // onEmployeeSortBarAddButton click event handler
    function onEmployeeSortBarAddButtonClick() {
        // have all the sort options been added?
        if( employeeSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: employeeSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                employeeSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loadEmployees( true );
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
    function onEmployeeSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        employeeSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loadEmployees( true );
        return;
    }
    
    // onEmployeeSortBarRemoveSortItem click event handler
    function onEmployeeSortBarRemoveSortItem() {
        // Reload the form data
        loadEmployees( true );
    }
    
    // onEmployeeSortBarDraggedSortItem click event handler
    function onEmployeeSortBarDraggedSortItem() {
        // Reload the form data
        loadEmployees( true );
    }
    
    // Department select on change event handler
    function departmentSelectOnChangeEventHandler (){
        loader.show();
        loadEmployees(true);
    }
    
    // Employee status select on change event handler
    function employeeStatusSelectOnChangeEventHandler (){
        loader.show();
        loadEmployees(true);
    }
    
    // Search component event handlers
    function onSearchEventHandler () {
        loader.show();
        loadEmployees(true);
    }
    
    // On search reset btn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loadEmployees(true);
    }
    
    // Employees grid scroll end event handler
    function employeesGridScrollEndEventHandler() {
        loadEmployees(false);
    }
    
    // Employees grid cell click event handler
    function employeesGridCellClickEventHandler( event ) {
        if( employeesGrid.getColumnDataIndex( event.columnIndex ) === 'name' ) {
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: event.record.id,
                employeeName: event.record.name,
                
                onDestroy: function( event ) {
                    if( event.refreshEmployees == true ) {
                        loadEmployees(true);
                    }
                }
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
    
    // Employees grid menu item click event handler
    function employeesGridMenuItemClickEventHandler( event ) {
        if( event.value === 'View' ) {
            me.hide();
            
            var viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: employeesGrid.getRow(event.rowIndex).id,
                employeeName: employeesGrid.getRow(event.rowIndex).name,
                
                onDestroy: function( event ) {
                    if( event.refreshEmployees == true ) {
                        loadEmployees(true);
                    }
                }
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
    
    // selfServiceInviteBtnClickEventHandler click event handler 
    function selfServiceInviteBtnClickEventHandler() {
        // Create a modal window
        var selfServiceInviteModal = new lx.component.ModalWindow({
            margin: '20px',
            maxHeight: '1200px',
            maxWidth: '980px'
        });
        
        // Create the self-service invite panel
        var selfServiceInvitePanel = new app.panel.SelfServiceInvite({
            renderTo: selfServiceInviteModal.getContainer(),
            show: true,
            
            onInvite: function() {
                app.route.popState();
                // loadEmployees(true);
            },
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        selfServiceInviteModal.addEventListener('destroy', function() {
            selfServiceInvitePanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: selfServiceInviteModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        selfServiceInviteModal.show();
        selfServiceInvitePanel.focus();
    }
    
    // allocateLeaveBtn click event handler 
    function allocateLeaveBtnClickEventHandler() {
        // Create a modal window
        var allocateLeaveModal = new lx.component.ModalWindow({
            margin: '20px',
            maxHeight: '1200px',
            maxWidth: '980px'
        });
        
        // Create the allocate leave panel
        var allocateLeavePanel = new app.panel.AllocateLeave({
            renderTo: allocateLeaveModal.getContainer(),
            show: true,
            
            onFinish: function() {
                app.route.popState();
                loadEmployees(true);
            },
            
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        allocateLeaveModal.addEventListener('destroy', function() {
            allocateLeavePanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: allocateLeaveModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        allocateLeaveModal.show();
        allocateLeavePanel.focus();
    }
    
    // importEmployeeBtn click event handler 
    function importEmployeeBtnClickEventHandler() {
        // Create a modal window
        var importEmployeesModal = new lx.component.ModalWindow({
            margin: '20px',
            maxHeight: '100%',
            maxWidth: '980px'
        });
        
        // Create the import employees panel
        var importEmployeesPanel = new app.panel.ImportEmployees({
            renderTo: importEmployeesModal.getContainer(),
            show: true,
            
            // employeeId: filterEmployeeSelect.getValue(),
            // startDate: filterStartDate.getValue(),
            // endDate: filterEndDate.getValue(),
            
            onImport: function() {
                app.route.popState();
                loadEmployees(true);
            },
            onCancel: function() {
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        importEmployeesModal.addEventListener('destroy', function() {
            importEmployeesPanel.destroy();
        });
        
        // Create a route entry for the panel
        let state = {
            modal: importEmployeesModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        importEmployeesModal.show();
        importEmployeesPanel.focus();
    }
    
    // Add btn click event handler
    function addBtnClickEventHandler() {
        // Check if the employee limit has been reached
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getLimit',
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                // Was the employee limit reached?
                if( (response.limit.employeeLimit !== null) && (response.limit.employeeCount >= response.limit.employeeLimit) ) {
                    new lx.component.Messagebox({
                        title: 'Adding Employee Failed',
                        message: 'Unable to add another employee. Your company is limited to ' + response.limit.employeeLimit + ' employees.'
                    });
                    return;
                }
                
                // Create a modal window
                var addEmployeeModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxHeight: '100%',
                    maxWidth: '840px'
                });
                
                // Create the addEmployeeDetailsPanel panel
                var addEmployeeWizardPanel = new app.panel.AddEmployeeWizard({
                    renderTo: addEmployeeModal.getContainer(),
                    show: true,
                    mainPanel: me,
                    
                    onCancel: function( event ) {
                        if( event.formChanged ) {
                            new lx.component.Messagebox({
                                title: 'You have unsaved changes',
                                message: 'If you continue the changes will be lost.',
                                buttons: [
                                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                                    {name: 'continue', label: 'Continue', isDefault: true}
                                ],
                                onClose: function( event ) {
                                    if( event.button === 'continue' ) {
                                        app.route.popState();
                                    }
                                }
                            });
                            
                            return false;
                        }
                        else {
                            app.route.popState();
                        }
                    },
                    
                    onFinish: function() {
                        app.route.popState();
                        loadEmployees(true);
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                addEmployeeModal.addEventListener('destroy', function() {
                    addEmployeeWizardPanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: addEmployeeModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                addEmployeeModal.show();
                addEmployeeWizardPanel.focus();
            }
        });
    }
    
    // // Add btn click event handler
    // function oldAddBtnClickEventHandler() {
    //     // Check if the employee limit has been reached
    //     lx.sendJSON({
    //         url: 'exec.php?c=Employee&fn=getLimit',
    //         onSuccess: function( responseText ) {
    //             let response = JSON.parse(responseText);
                
    //             // Was the employee limit reached?
    //             if( (response.limit.employeeLimit !== null) && (response.limit.employeeCount >= response.limit.employeeLimit) ) {
    //                 new lx.component.Messagebox({
    //                     title: 'Adding Employee Failed',
    //                     message: 'Unable to add another employee. Your company is limited to ' + response.limit.employeeLimit + ' employees.'
    //                 });
    //                 return;
    //             }
                
                
    //             //
    //             // EMPLOYEE DETAILS SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeDetailsModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeDetailsPanel panel
    //             var addEmployeeDetailsPanel = new app.panel.AddEmployeeDetails({
    //                 renderTo: addEmployeeDetailsModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         app.route.popState();
    //                     }
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeDetailsModal.addEventListener('destroy', function() {
    //                 addEmployeeDetailsPanel.destroy();
    //             });
                
    //             // Create a route entry for the panel
    //             var state = {
    //                 modal: addEmployeeDetailsModal
    //             };
    //             app.route.pushState(state, function( state ) {
    //                 state.modal.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeDetailsModal.show();
    //             addEmployeeDetailsPanel.focus();
                
                
    //             //
    //             // OTHER DETAILS SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeOtherDetailsModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeOtherDetailsPanel panel
    //             var addEmployeeOtherDetailsPanel = new app.panel.AddEmployeeOtherDetails({
    //                 renderTo: addEmployeeOtherDetailsModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     addEmployeeOtherDetailsModal.hide();
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         addEmployeeOtherDetailsModal.hide();
    //                         app.route.popState();
    //                     }
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeOtherDetailsModal.addEventListener('destroy', function() {
    //                 addEmployeeOtherDetailsPanel.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeOtherDetailsModal.hide();
                
                
    //             //
    //             // EARNINGS SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeEarningsModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeEarningsPanel panel
    //             var addEmployeeEarningsPanel = new app.panel.AddEmployeeEarnings({
    //                 renderTo: addEmployeeEarningsModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text'},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     addEmployeeEarningsModal.hide();
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         addEmployeeEarningsModal.hide();
    //                         app.route.popState();
    //                     }
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeEarningsModal.addEventListener('destroy', function() {
    //                 addEmployeeEarningsPanel.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeEarningsModal.hide();
                
                
    //             //
    //             // RETIREMENT FUNDS SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeRetirementFundsModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeRetirementFundsPanel panel
    //             var addEmployeeRetirementFundsPanel = new app.panel.AddEmployeeRetirementFunds({
    //                 renderTo: addEmployeeRetirementFundsModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     addEmployeeRetirementFundsModal.hide();
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         addEmployeeRetirementFundsModal.hide();
    //                         app.route.popState();
    //                     }
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeRetirementFundsModal.addEventListener('destroy', function() {
    //                 addEmployeeRetirementFundsPanel.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeRetirementFundsModal.hide();
                
                
    //             //
    //             // LEAVE SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeLeaveModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeLeavePanel panel
    //             var addEmployeeLeavePanel = new app.panel.AddEmployeeLeave({
    //                 renderTo: addEmployeeLeaveModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     addEmployeeLeaveModal.hide();
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         addEmployeeLeaveModal.hide();
    //                         app.route.popState();
    //                     }
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeLeaveModal.addEventListener('destroy', function() {
    //                 addEmployeeLeavePanel.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeLeaveModal.hide();
                
                
    //             //
    //             // EMPLOYEE WORK SCHEDULE SECTION
    //             //
                
    //             // Create a modal window
    //             var addEmployeeWorkScheduleModal = new lx.component.ModalWindow({
    //                 margin: '20px',
    //                 maxWidth: '700px',
    //                 maxHeight: '100%'
    //             });
                
    //             // Create the addEmployeeWorkSchedulePanel panel
    //             var addEmployeeWorkSchedulePanel = new app.panel.AddEmployeeWorkSchedule({
    //                 renderTo: addEmployeeWorkScheduleModal.getContainer(),
    //                 show: true,
    //                 mainPanel: me,
                    
    //                 onCancel: function() {
    //                     if (checkAddPageChange()) {
    //                         new lx.component.Messagebox({
    //                             title: 'You have unsaved changes',
    //                             message: 'If you continue the changes will be lost.',
    //                             buttons: [
    //                                 {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
    //                                 {name: 'continue', label: 'Continue', isDefault: true}
    //                             ],
    //                             onClose: function( event ) {
    //                                 if( event.button === 'continue' ) {
    //                                     addEmployeeWorkScheduleModal.hide();
    //                                     app.route.popState();
    //                                 }
    //                             }
    //                         });
                            
    //                         return false;
    //                     }
    //                     else {
    //                         addEmployeeWorkScheduleModal.hide();
    //                         app.route.popState();
    //                     }
    //                 },
    //                 onAdd: function() {
    //                     loadEmployees(true);
    //                 }
    //             });
                
    //             // Add destroy event listener to modal to destroy the contained panel.
    //             addEmployeeWorkScheduleModal.addEventListener('destroy', function() {
    //                 addEmployeeWorkSchedulePanel.destroy();
    //             });
                
    //             // Show the modal window and focus on the panel
    //             addEmployeeWorkScheduleModal.hide();
                
                
    //             //
    //             // ASSIGN EVENT LISTENERS
    //             //
                
    //             // Add employee details back function
    //             addEmployeeDetailsPanel.addEventListener('back', function() {
    //                 app.route.popState();
    //             });
                
    //             // Add employee details next function
    //             addEmployeeDetailsPanel.addEventListener('next', function() {
    //                 if(addEmployeeDetailsPanel.getPageErrors().error) {
    //                     addEmployeeDetailsPanel.getCurrentNextBtn().showWarning(addEmployeeDetailsPanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 addEmployeeDetailsModal.hide();
    //                 addEmployeeOtherDetailsModal.show();
    //                 addEmployeeOtherDetailsPanel.focus();
    //             });
                
    //             // Add employee other details back function
    //             addEmployeeOtherDetailsPanel.addEventListener('back', function() {
    //                 addEmployeeOtherDetailsModal.hide();
    //                 addEmployeeDetailsModal.show();
    //                 addEmployeeDetailsPanel.focus();
    //             });
                
    //             // Add employee other details next function
    //             addEmployeeOtherDetailsPanel.addEventListener('next', function() {
    //                 if(addEmployeeOtherDetailsPanel.getPageErrors().error) {
    //                     addEmployeeOtherDetailsPanel.getCurrentNextBtn().showWarning(addEmployeeOtherDetailsPanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 addEmployeeOtherDetailsModal.hide();
    //                 addEmployeeEarningsModal.show();
    //                 addEmployeeEarningsPanel.focus();
    //             });
                
    //             // Add employee earnings back function
    //             addEmployeeEarningsPanel.addEventListener('back', function() {
    //                 addEmployeeEarningsModal.hide();
    //                 addEmployeeOtherDetailsModal.show();
    //                 addEmployeeOtherDetailsPanel.focus();
    //             });
                
    //             // Add employee earnings next function
    //             addEmployeeEarningsPanel.addEventListener('next', function() {
    //                 if(addEmployeeEarningsPanel.getPageErrors().error) {
    //                     addEmployeeEarningsPanel.getCurrentNextBtn().showWarning(addEmployeeEarningsPanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 addEmployeeEarningsModal.hide();
    //                 addEmployeeRetirementFundsModal.show();
    //                 addEmployeeRetirementFundsPanel.focus();
    //             });
                
    //             // Add employee retirement fund back function
    //             addEmployeeRetirementFundsPanel.addEventListener('back', function() {
    //                 addEmployeeRetirementFundsModal.hide();
    //                 addEmployeeEarningsModal.show();
    //                 addEmployeeEarningsPanel.focus();
    //             });
                
    //             // Add employee retirement fund next function
    //             addEmployeeRetirementFundsPanel.addEventListener('next', function() {
    //                 if(addEmployeeRetirementFundsPanel.getPageErrors().error) {
    //                     addEmployeeRetirementFundsPanel.getCurrentNextBtn().showWarning(addEmployeeRetirementFundsPanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 addEmployeeRetirementFundsModal.hide();
    //                 addEmployeeLeaveModal.show();
    //                 addEmployeeLeavePanel.focus();
    //             });
                
    //             // Add employee leave back function
    //             addEmployeeLeavePanel.addEventListener('back', function() {
    //                 addEmployeeLeaveModal.hide();
    //                 addEmployeeRetirementFundsModal.show();
    //                 addEmployeeRetirementFundsPanel.focus();
    //             });
                
    //             // Add employee leave next function
    //             addEmployeeLeavePanel.addEventListener('next', function() {
    //                 if(addEmployeeLeavePanel.getPageErrors().error) {
    //                     addEmployeeLeavePanel.getCurrentNextBtn().showWarning(addEmployeeLeavePanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 addEmployeeLeaveModal.hide();
    //                 addEmployeeWorkScheduleModal.show();
    //                 addEmployeeWorkSchedulePanel.focus();
    //             });
                
    //             // Add employee work schedule back function
    //             addEmployeeWorkSchedulePanel.addEventListener('back', function() {
    //                 addEmployeeWorkScheduleModal.hide();
    //                 addEmployeeLeaveModal.show();
    //                 addEmployeeLeavePanel.focus();
    //             });
                
    //             // Add employee work schedule next function
    //             addEmployeeWorkSchedulePanel.addEventListener('add', function() {
    //                 if(addEmployeeWorkSchedulePanel.getPageErrors().error) {
    //                     addEmployeeWorkSchedulePanel.getCurrentNextBtn().showWarning(addEmployeeWorkSchedulePanel.getPageErrors().errorMessage);
    //                     return;
    //                 }
                    
    //                 let leave = {leave: addEmployeeLeavePanel.getPageData()};
    //                 let employee = Object.assign(addEmployeeDetailsPanel.getPageData(), addEmployeeOtherDetailsPanel.getPageData());
    //                 employee = Object.assign(employee, addEmployeeEarningsPanel.getPageData());
    //                 employee = Object.assign(employee, addEmployeeRetirementFundsPanel.getPageData());
    //                 employee = Object.assign(employee, leave);
    //                 employee = Object.assign(employee, addEmployeeWorkSchedulePanel.getPageData());
                    
    //                 lx.sendJSON({
    //                     url: 'exec.php?c=Employee&fn=add',
    //                     data: employee,
    //                     onSuccess: function( responseText ) {
    //                         response = JSON.parse(responseText);
                            
    //                         // Hide the loader and reanable the button
    //                         addBtn.hideLoader();
    //                         addBtn.enable();
                            
    //                         var response = '';
    //                         try {
    //                             response = JSON.parse(responseText);
    //                         }
    //                         catch( error ) {
    //                             new lx.component.Messagebox({
    //                                 title: 'Adding Employee Failed',
    //                                 message: response.error
    //                             });
    //                             return;
    //                         }
                            
    //                         // if( response.ok !== true ) {
    //                         //     addBtn.showWarning(response.error);
    //                         //     return;
    //                         // }
    //                         if( response.ok !== true ) {
    //                             new lx.component.Messagebox({
    //                                 title: 'Adding Employee Failed',
    //                                 message: response.error
    //                             });
    //                             return;
    //                         }
                            
    //                         addEmployeeDetailsPanel.destroy();
    //                         addEmployeeOtherDetailsPanel.destroy();
    //                         addEmployeeEarningsPanel.destroy();
    //                         addEmployeeRetirementFundsPanel.destroy();
    //                         addEmployeeLeavePanel.destroy();
    //                         addEmployeeWorkScheduleModal.hide();
    //                         addEmployeeWorkSchedulePanel.destroy();
                            
    //                         app.route.popState();
                            
    //                         loadEmployees(true);
    //                     }
    //                 });
    //             });
                
    //             employeePanels = {
    //                 detailsPanel: addEmployeeDetailsPanel,
    //                 workSchedulePanel: addEmployeeWorkSchedulePanel,
    //                 otherPanel: addEmployeeOtherDetailsPanel,
    //                 earningsPanel: addEmployeeEarningsPanel,
    //                 retirementFundsPanel: addEmployeeRetirementFundsPanel,
    //                 leavePanel: addEmployeeLeavePanel
    //             };
    //         }
    //     });
    // }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};