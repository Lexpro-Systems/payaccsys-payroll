/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST DEPARTMENTS PANEL
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
app.panel.ListDepartments = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    var addBtn = null;
    
    var filterSectionEl = null;
    var searchTxt = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var departmentsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadDepartments(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = departmentsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'ASC'
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
                
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    departments.push({
                        id: response.departments[i].id,
                        name: response.departments[i].name,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) departmentsGrid.clear();
                
                departmentsGrid.addRows( departments );
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
        
        // Create the titleContainerEl
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
                flex: '0 0 auto'
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
            innerHTML: 'Departments'
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Department',
            height: '32px',
            width: '140px',
            margin: '0px 20px 0px auto',
            
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
                overflow: 'auto'
            }
        });
        
        // Create departmentsGridMenuOptions array
        var departmentsGridMenuOptions = [
            {name: '<i class="fas fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create departmentsGrid component
        departmentsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'name', name: 'Name', minWidth: '300px', padding: '0px 0px 0px 20px', type: 'button'},
                {dataIndex: 'menu', name: '', type: 'menu', options: departmentsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: departmentsGridCellClickEventHandler,
            
            onScrollEnd: departmentsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'edit' ) {
                    // Create a modal window
                    var editDepartmentModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '450px',
                        maxHeight: '232px'
                    });
                    
                    // Create the editDepartmentPanel panel
                    var editDepartmentPanel = new app.panel.EditDepartment({
                        renderTo: editDepartmentModal.getContainer(),
                        show: true,
                        
                        departmentId: departmentsGrid.getRow(clickEvent.rowIndex).id,
                
                        onCancel: function() {
                            app.route.popState();
                        },
                        
                        onSave: function() {
                            app.route.popState();
                            loadDepartments(true);
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    editDepartmentModal.addEventListener('destroy', function() {
                        editDepartmentPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    var state = {
                        modal: editDepartmentModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    editDepartmentModal.show();
                    editDepartmentPanel.focus();
                }
                else if( clickEvent.value === 'remove' ) {
                    // Check if there are any employees in the specified department
                    lx.sendJSON({
                        url: 'exec.php?c=Employee&fn=getList',
                        data: {
                            departmentId: parseInt(departmentsGrid.getRow(clickEvent.rowIndex).id)
                        },
                        onSuccess: function( responseText ) {
                            var response = JSON.parse(responseText);
                            
                            if( response.ok !== true ) {
                                new lx.component.Messagebox({
                                    title: 'Loading Employees Failed',
                                    message: response.error
                                });
                                return;
                            }
                            
                            // Are there employees in the department
                            if( response.employees.length > 0 ) {
                                new lx.component.Messagebox({
                                    message: 
                                        'There are currently ' + 
                                        response.employees.length + 
                                        ' employee(s) in the \'' + 
                                        departmentsGrid.getRow(clickEvent.rowIndex).name + 
                                        '\' department. Are you sure you wish to delete it?',
                                    buttons: [
                                        {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                                        {name: 'delete', label: 'Delete', isDefault: true}
                                    ],
                                    onClose: function( closeEvent ) {
                                        // Should the department be removed?
                                        if( closeEvent.button === 'delete' ) {
                                            // Delete the department
                                            lx.sendJSON({
                                                url: 'exec.php?c=Department&fn=remove',
                                                data: {
                                                    departmentId: parseInt(departmentsGrid.getRow(clickEvent.rowIndex).id)
                                                },
                                                onSuccess: function( responseText ) {
                                                    var response = JSON.parse(responseText);
                                                    
                                                    if( response.ok !== true ) {
                                                        new lx.component.Messagebox({
                                                            title: 'Deleting Department Failed',
                                                            message: response.error
                                                        });
                                                        return;
                                                    }
                                                    
                                                    loadDepartments(true);
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
                            else {
                                // Delete the department
                                lx.sendJSON({
                                    url: 'exec.php?c=Department&fn=remove',
                                    data: {
                                        departmentId: parseInt(departmentsGrid.getRow(clickEvent.rowIndex).id)
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Deleting Department Failed',
                                                message: response.error
                                            });
                                            return;
                                        }
                                        
                                        loadDepartments(true);
                                        return;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
        
        loader.show( false );
        
        // Load departments
        loadDepartments(true);
        
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
    
    
    //
    // EVENT HANDLERS
    //
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show( true );
        loadDepartments(true);
    }
    
    // On search ResetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show( true );
        searchTxt.setValue('');
        loadDepartments(true);
    }
    
    // DepartmentsGrid scroll end event handler
    function departmentsGridScrollEndEventHandler() {
        loadDepartments(false);
    }
    
    // DepartmentsGrid cell click event handler
    function departmentsGridCellClickEventHandler( event ) {
        if( event.columnIndex === 0 ) {
            // Create a modal window
            var editDepartmentModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '232px'
            });
            
            // Create the editDepartmentPanel panel
            var editDepartmentPanel = new app.panel.EditDepartment({
                renderTo: editDepartmentModal.getContainer(),
                show: true,
                
                departmentId: event.record.id,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    app.route.popState();
                    loadDepartments(true);
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editDepartmentModal.addEventListener('destroy', function() {
                editDepartmentPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editDepartmentModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            editDepartmentModal.show();
            editDepartmentPanel.focus();
        }
    }
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        // Create a modal window
        var addDepartmentModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '232px'
        });
        
        // Create the addDepartmentPanel panel
        var addDepartmentPanel = new app.panel.AddDepartment({
            renderTo: addDepartmentModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                loadDepartments(true);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addDepartmentModal.addEventListener('destroy', function() {
            addDepartmentPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addDepartmentModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addDepartmentModal.show();
        addDepartmentPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};