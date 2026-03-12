/* jslint node: true */
/* globals app, lx */
'use strict';


// LIST PAYRUNS PANEL
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
app.panel.ListPayruns = function(config) {
    
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
    var departmentSelect = null;
    var searchTxt = null;
    
    var payrunSortBar = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var payrunsGrid = null;
    

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
    
    // Load payruns
    function loadPayruns(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = payrunsGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Payrun&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: offset,
                sortOrder: 'DESC',
                sortList: payrunSortBar.getSortItems(),
                departmentId: departmentSelect.getValue()
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payruns Failed',
                        message: response.error
                    });
                }
                
                var payruns = [];
                for( var i = 0; i < response.payruns.length; i++ ) {
                    
                    var isProcessed = 'No';
                    if( response.payruns[i].isProcessed ) isProcessed = 'Yes';
                    
                    let departmentName = '-';
                    if( response.payruns[i].departmentId != null ) departmentName = response.payruns[i].departmentName;
                    
                    payruns.push({
                        id: response.payruns[i].id,
                        description: response.payruns[i].description,
                        fromDate: response.payruns[i].fromDate,
                        toDate: response.payruns[i].toDate,
                        departmentId: response.payruns[i].departmentId,
                        departmentName: departmentName,
                        createdOn: response.payruns[i].createdOn,
                        isProcessed: isProcessed,
                        processedOn: response.payruns[i].processedOn,
                        exportedOn: response.payruns[i].exportedOn,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) payrunsGrid.clear();
                
                payrunsGrid.addRows( payruns );
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
        
        // Create the title container
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
            innerHTML: 'Payruns'
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Payrun',
            height: '32px',
            width: '120px',
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
        // SORT SECTION
        //
        
        // Create a sort bar for the payruns
        payrunSortBar = new lx.component.SortBar({
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
                { name: 'Description', dataIndex: 'description'},
                { name: 'Department', dataIndex: 'departmentName'},
                { name: 'From Date', dataIndex: 'fromDate'},
                { name: 'To Date', dataIndex: 'toDate'},
                { name: 'Creation Date', dataIndex: 'createdOn'},
                { name: 'Processed', dataIndex: 'isProcessed'},
                { name: 'Date Processed', dataIndex: 'processedOn'},
                { name: 'Date Exported', dataIndex: 'exportedOn'}
            ],
            
            onAddButtonClick: onPayrunSortBarAddButtonClick,
            onSortItemClick: onPayrunSortBarSortItemClick,
            onRemoveSortItem: onPayrunSortBarRemoveSortItem,
            onDraggedSortItem: onPayrunSortBarDraggedSortItem
        });
        
        // Add default sort items
        payrunSortBar.addSortItem(payrunSortBar.getSortItemCount(), 'Processed', 'isProcessed', 'ASC');
        payrunSortBar.addSortItem(payrunSortBar.getSortItemCount(), 'To Date', 'toDate', 'DESC');
        // payrunSortBar.addSortItem(payrunSortBar.getSortItemCount(), 'Description', 'description', 'ASC');
        
        
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
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 0px 0px 0px'
            }
        });
        
        // Create payrunsGridMenuOptions array
        var payrunsGridMenuOptions = [
            {name: '<i class="fas fa-fw fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fas fa-fw fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit Description', value: 'edit_description'},
            {name: '<i class="fas fa-fw fa-file-download" style="margin: 0px 15px 0px 0px;"></i>Download Report', value: 'report'},
            {name: '<i class="fas fa-fw fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email Payslips', value: 'email_payslips'},
            // {name: '<i class="fas fa-fw fa-external-link-alt" style="margin: 0px 15px 0px 0px;"></i>Post to Lexpro Accounting', value: 'lexpro_post'},
            {name: '<i class="fas fa-fw fa-file-export" style="margin: 0px 15px 0px 0px;"></i>Bank Payments Export', value: 'bank_payments_export'},
            {name: '<i class="fas fa-fw fa-undo" style="margin: 0px 15px 0px 0px;"></i>Undo Processing', value: 'undo_processing'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove Payrun', value: 'remove'}
        ];
        
        // Create payrunsGrid component
        payrunsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'description', name: 'Description', padding: '0px 0px 0px 20px', minWidth: '100px', type: 'button'},
                {dataIndex: 'departmentName', name: 'Department', minWidth: '100px', maxWidth: '300px', wrapText: true},
                {dataIndex: 'fromDate', name: 'From', width: '120px'},
                {dataIndex: 'toDate', name: 'To', width: '120px'},
                {dataIndex: 'createdOn', name: 'Creation Date', width: '120px'},
                {dataIndex: 'isProcessed', name: 'Processed', width: '80px'},
                {dataIndex: 'processedOn', name: 'Date Processed', width: '110px'},
                {dataIndex: 'exportedOn', name: 'Date Exported', width: '110px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: payrunsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onScrollEnd: payrunsGridScrollEndEventHandler,
            onCellClick: payrunsGridCellClickEventHandler,
            onMenuItemClick: payrunsGridMenuItemClickEventHandler 
        });
        
        loader.show( false );
        
        // Load form data
        loadDepartments();
        loadPayruns(true);
        
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
    
    // addSortBtnEl click event handler
    function onPayrunSortBarAddButtonClick() {
        // have all the sort options been added?
        if( payrunSortBar.getSortOptions().length <= 0 ) {
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
            
            sortOptions: payrunSortBar.getSortOptions(), 
            
            onAdd: function( event ) {
                // Close the popup panel
                app.route.popState();
                
                // Add the sort item at the start of the bar
                payrunSortBar.addSortItem(
                    0,
                    event.sortOption.name, 
                    event.sortOption.dataIndex, 
                    event.sortOption.order 
                );
                
                // Reload the form data
                loadPayruns( true );
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
    function onPayrunSortBarSortItemClick( event ) {
        let sortItem = event.sortItem;
        
        // Reverse the sort order of item that was clicke on
        payrunSortBar.updateSortItem(
            sortItem.index, 
            sortItem.name, 
            sortItem.dataIndex, 
            (sortItem.order  === 'ASC' ? 'DESC' : 'ASC')
        );
        
        // Reload the form data
        loadPayruns( true );
        return;
    }
    
    // onPayrunSortBarRemoveSortItem click event handler
    function onPayrunSortBarRemoveSortItem() {
        // Reload the form data
        loadPayruns( true );
    }
    
    // onPayrunSortBarDraggedSortItem click event handler
    function onPayrunSortBarDraggedSortItem() {
        // Reload the form data
        loadPayruns( true );
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show( false );
        loadPayruns(true);
    }
    
    // On search resetBtn click event handler
    function onSearchResetBtnClickEventHandler () {
        loader.show( false );
        searchTxt.setValue('');
        loadPayruns(true);
    }
    
    // Department select on change event handler
    function departmentSelectOnChangeEventHandler (){
        loader.show();
        loadPayruns(true);
    }
    
    // Payruns grid scroll end event handler
    function payrunsGridScrollEndEventHandler() {
        loadPayruns(false);
    }
    
    // Payruns grid cell click event handler
    function payrunsGridCellClickEventHandler( event ) {
        if( event.srcComponent.getColumnDataIndex(event.columnIndex) === 'description' ) {
            me.hide();
            
            var isProcessed = false;
            if( event.record.isProcessed == 'Yes' ) isProcessed = true;
            
            var editPayrunPanel = new app.panel.EditPayrun({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                payrunId: event.record.id,
                payrunDescription: event.record.description,
                isProcessed: isProcessed,
                
                onCancel: function() {
                    app.route.popState();
                    loadPayruns(true);
                },
                
                onSave: function() {
                    loadPayruns(true);
                    app.route.popState();
                },
                
                onProcess: function() {
                    loadPayruns(true);
                    app.route.popState();
                }
            });
            
            var panelState = {
                previousPanel: me,
                panel: editPayrunPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                if( state.panel.updatePayrunGrid ) {
                    payrunsGrid.clear();
                    loadPayruns();
                }
                state.previousPanel.show();
            });
        }
    }
    
    // Payruns grid menu item click event handler
    function payrunsGridMenuItemClickEventHandler( clickEvent ) {
        if( clickEvent.value === 'edit' ) {
            me.hide();
            
            var isProcessed = false;
            if( payrunsGrid.getRow(clickEvent.rowIndex).isProcessed == 'Yes' ) isProcessed = true;
            
            var editPayrunPanel = new app.panel.EditPayrun({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id),
                payrunDescription: payrunsGrid.getRow(clickEvent.rowIndex).description,
                isProcessed: isProcessed,
                
                onCancel: function() {
                    loadPayruns(true);
                    app.route.popState();
                },
                
                onSave: function() {
                    loadPayruns(true);
                    app.route.popState();
                },
                
                onProcess: function() {
                    loadPayruns(true);
                    app.route.popState();
                }
            });
            
            var panelState = {
                previousPanel: me,
                panel: editPayrunPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                if( !state.panel.destroy() ) return false;
                if( state.panel.updatePayrunGrid ) {
                    payrunsGrid.clear();
                    loadPayruns();
                }
                state.previousPanel.show();
            });
        }
        else if( clickEvent.value === 'edit_description' ) {
            // Create a modal window
            var addDepartmentModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '232px'
            });
            
            // Create the addDepartmentPanel panel
            var addDepartmentPanel = new app.panel.EditPayrunDescription({
                renderTo: addDepartmentModal.getContainer(),
                show: true,
                payrunId: payrunsGrid.getRow(clickEvent.rowIndex).id,
                payrunDescription: payrunsGrid.getRow(clickEvent.rowIndex).description,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onSave: function() {
                    loadPayruns(true);
                    app.route.popState();
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
        else if( clickEvent.value === 'email_payslips' ) {
            // Has the payrun not been processed?
            if( payrunsGrid.getRow(clickEvent.rowIndex).isProcessed !== 'Yes' ) {
                new lx.component.Messagebox({
                    title: 'Email Payslips',
                    message: 'The payslips cannot be emailed because the specified payrun has not been processed.'
                });
                return;
            }
            
            // Create a modal window
            var emailPayslipsModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '800px',
                maxHeight: '100%'
            });
            
            // Create the emailPayslipsPanel panel
            var emailPayslipsPanel = new app.panel.EmailPayslips({
                renderTo: emailPayslipsModal.getContainer(),
                show: true,
                
                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id),
                
                onEmail: function() {
                    app.route.popState();
                    new lx.component.Messagebox({
                        title: 'Email Payslips',
                        message: 'The selected payslips were successfully sent.'
                    });
            },
                onCancel: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            emailPayslipsModal.addEventListener('destroy', function() {
                emailPayslipsPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: emailPayslipsModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            emailPayslipsModal.show();
            emailPayslipsPanel.focus();
        }
        else if( clickEvent.value === 'lexpro_post' ) {
            // Has the payrun not been processed?
            if( payrunsGrid.getRow(clickEvent.rowIndex).isProcessed !== 'Yes' ) {
                new lx.component.Messagebox({
                    title: 'Post To Lexpro Accounting',
                    message: 'Transactions cannot be exported to Lexpro Accounting because the specified payrun has not been processed.'
                });
                return;
            }
            
            // Check the Lexpro Accounting connection
            lx.sendJSON({
                url: 'exec.php?c=LexproAccounting&fn=checkConnection',
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Checking Lexpro Accounting Connection',
                            message: response.error
                        });
                    }
                    
                    // Make certain we are connected to Lexpro Accounting and that the configuration is complete
                    if( response.connected != true ) {
                        new lx.component.Messagebox({
                            title: 'Post To Lexpro Accounting',
                            message: 'You are not connected to Lexpro Accounting. Please connect to Lexpro Accounting in the \'Accounting Setup\' tab of the \'Setup\' section.'
                        });
                        return;
                    }
                    else if( response.configComplete != true ) {
                        new lx.component.Messagebox({
                            title: 'Post To Lexpro Accounting',
                            message: 'Your Lexpro Accounting configuration is incomplete. Please configure your Lexpro Accounting settings in the \'Accounting Setup\' tab of the \'Setup\' section.'
                        });
                        return;
                    }
                    
                    // Create a modal window
                    var postToLexproModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '1200px',
                        maxHeight: '100%'
                    });
                    
                    // Create the postToLexproPanel panel
                    var postToLexproPanel = new app.panel.PostToLexpro({
                        renderTo: postToLexproModal.getContainer(),
                        show: true,
                        
                        payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id),
                        payrunDescription: payrunsGrid.getRow(clickEvent.rowIndex).description,
                        
                        onPost: function() {
                            loadPayruns(true);
                            app.route.popState();
                            // new lx.component.Messagebox({
                            //     title: 'Post To Lexpro Accounting',
                            //     message: 'The transactions were successfully posted to Lexpro Accounting.'
                            // });
                        },
                        onCancel: function() {
                            app.route.popState();
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    postToLexproModal.addEventListener('destroy', function() {
                        postToLexproPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    let state = {
                        modal: postToLexproModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    postToLexproModal.show();
                    postToLexproPanel.focus();
                }
            });
        }
        else if( clickEvent.value === 'bank_payments_export' ) {
            // Has the payrun not been processed?
            if( payrunsGrid.getRow(clickEvent.rowIndex).isProcessed !== 'Yes' ) {
                new lx.component.Messagebox({
                    title: 'Bank Payments Export',
                    message: 'Payments cannot be exported because the specified payrun has not been processed.'
                });
                return;
            }
            
            // Create a modal window
            var exportBankPaymentsModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '1024px',
                maxHeight: '100%'
            });
            
            // Create the postToLexproPanel panel
            var exportBankPaymentsPanel = new app.panel.ExportBankPayments({
                renderTo: exportBankPaymentsModal.getContainer(),
                show: true,
                
                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id),
                payrunDescription: payrunsGrid.getRow(clickEvent.rowIndex).description,
                
                onExport: function() {
                    app.route.popState();
                },
                onCancel: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            exportBankPaymentsModal.addEventListener('destroy', function() {
                exportBankPaymentsPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: exportBankPaymentsModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            exportBankPaymentsModal.show();
            exportBankPaymentsPanel.focus();
        }
        else if( clickEvent.value === 'report' ) {
            // Create a modal window
            let runReportModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '235px'
            });
            
            // Create the runReportPanel panel
            let runReportPanel = new app.panel.RunPayrunReport({
                renderTo: runReportModal.getContainer(),
                show: true,
                
                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id),
                
                onCancel: function() {
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            runReportModal.addEventListener('destroy', function() {
                runReportPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: runReportModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            runReportModal.show();
            runReportPanel.focus();
        }
        else if( clickEvent.value === 'undo_processing' ) {
            // Has the payrun not been processed?
            if( payrunsGrid.getRow(clickEvent.rowIndex).isProcessed !== 'Yes' ) {
                new lx.component.Messagebox({
                    title: 'Undo Processing Failed',
                    message: 'The specified payrun has not yet been processed.'
                });
                return;
            }
            
            new lx.component.Messagebox({
                title: 'Undo Processing',
                message: 
                    'Are you certain you wish to undo the processing of \'' + payrunsGrid.getRow(clickEvent.rowIndex).description + '\'?',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'undo', label: 'Undo', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the payrun be un-processed?
                    if( closeEvent.button === 'undo' ) {
                        // Reverse the processing of the payrun
                        lx.sendJSON({
                            url: 'exec.php?c=Payrun&fn=undoProcess',
                            data: {
                                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id)
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Undo Processing Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                loadPayruns(true);
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
        else if( clickEvent.value === 'remove' ) {
            new lx.component.Messagebox({
                title: 'Remove Payrun',
                message: 
                    'Are you certain you wish to permanently remove payrun \'' + payrunsGrid.getRow(clickEvent.rowIndex).description + '\'?',
                buttons: [
                    {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                    {name: 'remove', label: 'Remove', isDefault: true}
                ],
                onClose: function( closeEvent ) {
                    // Should the payrun be removed?
                    if( closeEvent.button === 'remove' ) {
                        // Delete the payrun
                        lx.sendJSON({
                            url: 'exec.php?c=Payrun&fn=remove',
                            data: {
                                payrunId: parseInt(payrunsGrid.getRow(clickEvent.rowIndex).id)
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse(responseText);
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Removing Payrun Failed',
                                        message: response.error
                                    });
                                    return;
                                }
                                
                                loadPayruns(true);
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
    
    // addBtn click event handler
    function addBtnClickEventHandler() {
        // Create a modal window
        var addPayrunModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '500px',
            height: ''
        });
        
        // Create the editCompanyDetails panel
        var addPayrunPanel = new app.panel.AddPayrun({
            renderTo: addPayrunModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            onAdd: function() {
                loadPayruns(true);
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addPayrunModal.addEventListener('destroy', function() {
            addPayrunPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addPayrunModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addPayrunModal.show();
        addPayrunPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};