/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE EARNINGS PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//  employeeId          The ID of the employee to view.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.ViewEmployeeEarnings = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var employeeId = null;
    
    var el = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var recurringHeadingEl = null;
    var recurringAddBtn = null;
    var recurringSectionEl = null;
    var recurringItemsGrid = null;
    
    var onceOffHeadingEl = null;
    var onceOffAddBtn = null;
    var onceOffSectionEl = null;
    var onceOffItemsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadItems() {
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getPayslipItemList',
            data: {
                employeeId: employeeId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse( responseText );
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslip Items Failed',
                        message: response.error
                    });
                    
                    return;
                }
                
                var recurringItems = [];
                var onceOffItems = [];
                var item = null;
                var newItem = null;
                var amount = '';
                
                for( var i = 0; i < response.payslipItems.length; i++ ) {
                    item = response.payslipItems[i];
                    
                    if( item.autoCalculate === true ) {
                        amount = 'auto';
                    }
                    else {
                        amount = item.amount;
                        if (amount === null) {
                            amount = '';
                        }
                        else {
                            amount = lx.util.formatCurrency(amount, null);
                        }
                        
                        if( amount === '' || amount === null ) {
                            amount = '-';
                        }
                        else {
                            if( item.itemType.unit.code == 'PHOU' ) amount = amount + ' per hour';
                            else if( item.itemType.unit.code == 'PDAY' ) amount = amount + ' per day';
                            else if( item.itemType.unit.code == 'PERC' ) amount = amount + '%';
                            else if( item.itemType.unit.code == 'PKIL' ) amount = amount + ' per km';
                        }
                    }
                    
                    if (item.id === null) {
                        newItem = {
                            id: item.id,
                            description: item.description,
                            accrualDate: null,
                            amount: amount,
                            menu: '<i class="fa fa-ellipsis-v"></i>',
                            spacer: '',
                            providentFundId: item.providentFund.id
                        };
                    }
                    else {
                        newItem = {
                            id: item.id,
                            description: item.description,
                            accrualDate: null,
                            amount: amount,
                            menu: '<i class="fa fa-ellipsis-v"></i>',
                            spacer: '',
                            providentFundId: null
                        };
                    }
                    
                    if( item.itemType.category.code === 'INCO' ) newItem.category = 'Earnings';
                    else if( item.itemType.category.code === 'DEDU' ) newItem.category = 'Deductions';
                    else if( item.itemType.category.code === 'CONT' ) newItem.category = 'Company Contributions';
                    else if( item.itemType.category.code === 'FBEN' ) newItem.category = 'Fringe Benefits';
                    else if( item.itemType.category.code === 'ALLO' ) newItem.category = 'Allowances';
                    
                    // Split the once off an recurring items
                    if( item.accrualDate === null ) {
                        recurringItems.push( newItem );
                    }
                    else {
                        newItem.accrualDate = item.accrualDate;
                        onceOffItems.push( newItem );
                    }
                    
                }
                
                // Add recurring items to the grid
                recurringItemsGrid.clear();
                recurringItemsGrid.addGroup('Earnings');
                recurringItemsGrid.addGroup('Deductions');
                recurringItemsGrid.addGroup('Company Contributions');
                recurringItemsGrid.addGroup('Fringe Benefits');
                recurringItemsGrid.addGroup('Allowances');
                recurringItemsGrid.addRows( recurringItems );
                
                // Add once off items to the grid
                onceOffItemsGrid.clear();
                onceOffItemsGrid.addRows( onceOffItems );
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
        // RECURRING ITEMS SECTION
        //
        
        // Create the recurringHeadingEl element
        recurringHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Recurring Items</div>'
        });
        
        // Create recurringAddBtn component
        recurringAddBtn = new lx.component.Button({
            renderTo: recurringHeadingEl,
            label: 'Add',
            style: 'text',
            
            onClick: recurringAddBtnClickEventHandler
        });
        
        // Create the recurringSectionEl element
        recurringSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px'
            }
        });
        
        // Create employeesGridMenuOptions array
        var recurringItemsGridMenuOptions = [
            {name: '<i class="fa fa-fw fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create the recurringItemsGrid component
        recurringItemsGrid = new lx.component.Grid({
            renderTo: recurringSectionEl,
            borderWidth: '0px',
            autoSize: true,
            groupBy: 'category',
            
            columns: [
                {dataIndex: 'description', name: 'Description', padding: '0px 10px 0px 15px', type: 'button'},
                {dataIndex: 'amount', name: 'Amount', width: '160px', alignment: 'right'},
                {dataIndex: 'menu', name: '', type: 'menu', options: recurringItemsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: recurringItemsGridCellClickEventHandler,
            onMenuItemClick: recurringItemsGridMenuItemClickEventHandler
        });
        
        
        //
        // ONCE OFF ITEMS SECTION
        //
        
        // Create the recurringHeadingEl element
        onceOffHeadingEl = lx.createElement('DIV', {
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
            innerHTML: '<div>Once-off Items</div>'
        });
        
        // Create onceOffAddBtn component
        onceOffAddBtn = new lx.component.Button({
            renderTo: onceOffHeadingEl,
            label: 'Add',
            style: 'text',
            
            onClick: onceOffAddBtnClickEventHandler
        });
        
        // Create the onceOffSectionEl element
        onceOffSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                width: '100%',
                maxWidth: '900px',
                boxSizing: 'border-box'
            }
        });
        
        // Create employeesGridMenuOptions array
        var onceOffItemsGridMenuOptions = [
            {name: '<i class="fa fa-fw fa-pencil-alt" style="margin: 0px 15px 0px 0px;"></i>Edit', value: 'edit'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'}
        ];
        
        // Create the onceOffItemsGrid component
        onceOffItemsGrid = new lx.component.Grid({
            renderTo: onceOffSectionEl,
            borderWidth: '0px',
            autoSize: true,
            
            columns: [
                {dataIndex: 'description', name: 'Description', padding: '0px 10px 0px 15px', type: 'button'},
                {dataIndex: 'accrualDate', name: 'Accrual Date', width: '90px'},
                {dataIndex: 'amount', name: 'Amount', width: '160px', alignment: 'right'},
                {dataIndex: 'menu', name: '', type: 'menu', options: onceOffItemsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: onceOffItemsGridCellClickEventHandler,
            onMenuItemClick: onceOffItemsGridMenuItemClickEventHandler
        });
        
        
        // Load items
        loadItems();
        
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
    
    me.reloadPage = function() {
        recurringItemsGrid.clear();
        onceOffItemsGrid.clear();
        
        // Load leave types
        loadItems();
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // recurringAddBtn click event handler
    function recurringAddBtnClickEventHandler() {
        // Create a modal window
        var addRecurringPayslipConfigItemModal = new lx.component.ModalWindow({
            height: '100%',
            maxWidth: '430px',
            maxHeight: '500px',
            margin: '40px'
        });
        
        // Create the addEarningsPanel component
        var addRecurringPayslipConfigItemPanel = new app.panel.AddRecurringPayslipConfigItem({
            renderTo: addRecurringPayslipConfigItemModal.getContainer(),
            show: true,
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                loadItems();
                
                // Update retirement funds panel
                config.mainPanel.getPanels().retirementFundsPanel.reloadPage();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addRecurringPayslipConfigItemModal.addEventListener('destroy', function() {
            addRecurringPayslipConfigItemPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addRecurringPayslipConfigItemModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addRecurringPayslipConfigItemModal.show();
        addRecurringPayslipConfigItemPanel.focus();
    }
    
    // recurringItemsGrid menuitemclick event handler
    function recurringItemsGridMenuItemClickEventHandler( event ) {
        if( event.value === 'edit' ) {
            if (event.srcComponent.getRow(event.rowIndex).id === null) {
                new lx.component.Messagebox({
                    title: 'Unable to edit item',
                    message: 'This item is a retirement fund and can\'t be changed' ,
                    icon: 'icon_error'
                });
                return;
            }
            
            var editRecurringPayslipConfigItemModal = new lx.component.ModalWindow({
                height: '100%',
                maxWidth: '430px',
                maxHeight: '500px',
                margin: '40px'
            });
            
            // Create the editCompanyDetails panel
            var editRecurringPayslipConfigItemPanel = new app.panel.EditRecurringPayslipConfigItem({
                renderTo: editRecurringPayslipConfigItemModal.getContainer(),
                show: true,
                payslipItemId: event.srcComponent.getRow(event.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loadItems();
                    
                    // Update retirement funds panel
                    config.mainPanel.getPanels().retirementFundsPanel.reloadPage();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editRecurringPayslipConfigItemModal.addEventListener('destroy', function() {
                editRecurringPayslipConfigItemPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editRecurringPayslipConfigItemModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            editRecurringPayslipConfigItemModal.show();
            editRecurringPayslipConfigItemPanel.focus();
        }
        else if( event.value === 'remove' ) {
            
            var rowIndex = event.rowIndex;
            var srcComponent = event.srcComponent;
            if (event.srcComponent.getRow(event.rowIndex).id === null) {
                new lx.component.Messagebox({
                    title: 'Unable to edit item',
                    message: 'This item is a retirement fund and can\'t be changed' ,
                    icon: 'icon_error'
                });
                return;
            }
            
            lx.sendJSON({
                url: 'exec.php?c=Payslip&fn=checkRemove',
                data: {
                    payslipItemId: srcComponent.getRow(rowIndex).id,
                    employeeId: config.employeeId
                },
                onSuccess: function( responseText ) {
                    var response = JSON.parse( responseText );
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to remove item',
                            message: response.error,
                            icon: 'icon_error'
                        });
                        return;
                    }
                    
                    let message = 'The \'' + srcComponent.getRow(rowIndex).description + '\' item is used to calculate retirement fund contributions. Are you sure you want to remove it?';
                    if (response.removable) {
                        message = 'Are you sure you want to remove the \'' + srcComponent.getRow(rowIndex).description + '\' item?';
                    }
                    
                    new lx.component.Messagebox({
                        title: 'Confirm Item Removal',
                        message: message,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( event ) {
                            if( event.button === 'remove' ) {
                                lx.sendJSON({
                                    url: 'exec.php?c=Payslip&fn=remove',
                                    data: {
                                        payslipItemId: srcComponent.getRow(rowIndex).id
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse( responseText );
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Unable to remove item',
                                                message: response.error,
                                                icon: 'icon_error'
                                            });
                                            return;
                                        }
                                        
                                        // Remove the item from the grid
                                        srcComponent.removeRow(rowIndex);
                                        
                                        // Update retirement funds panel
                                        config.mainPanel.getPanels().retirementFundsPanel.reloadPage();
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }
    }
    
    // recurringItemsGrid cellclick event handler
    function recurringItemsGridCellClickEventHandler( event ) {
        // Depending on the column clicked
        if( event.columnIndex === 0 ) {
            if (event.srcComponent.getRow(event.rowIndex).id === null) {
                new lx.component.Messagebox({
                    title: 'Unable to edit item',
                    message: 'This item is a retirement fund and can\'t be changed' ,
                    icon: 'icon_error'
                });
                return;
            }
            
            var editRecurringPayslipConfigItemModal = new lx.component.ModalWindow({
                height: '100%',
                maxWidth: '430px',
                maxHeight: '500px',
                margin: '40px'
            });
            
            // Create the editCompanyDetails panel
            var editRecurringPayslipConfigItemPanel = new app.panel.EditRecurringPayslipConfigItem({
                renderTo: editRecurringPayslipConfigItemModal.getContainer(),
                show: true,
                payslipItemId: event.srcComponent.getRow(event.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loadItems();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            editRecurringPayslipConfigItemModal.addEventListener('destroy', function() {
                editRecurringPayslipConfigItemPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: editRecurringPayslipConfigItemModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            editRecurringPayslipConfigItemModal.show();
            editRecurringPayslipConfigItemPanel.focus();
        }
    }
    
    // onceOffAddBtn click event handler
    function onceOffAddBtnClickEventHandler() {
        // Create a modal window
        var addOnceOffPayslipConfigItemModal = new lx.component.ModalWindow({
            height: '100%',
            maxWidth: '430px',
            maxHeight: '466px',
            margin: '40px'
        });
        
        // Create the addOnceOffPayslipConfigItemPanel component
        var addOnceOffPayslipConfigItemPanel = new app.panel.AddOnceOffPayslipConfigItem({
            renderTo: addOnceOffPayslipConfigItemModal.getContainer(),
            show: true,
            employeeId: employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            onSave: function() {
                app.route.popState();
                loadItems();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addOnceOffPayslipConfigItemModal.addEventListener('destroy', function() {
            addOnceOffPayslipConfigItemPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addOnceOffPayslipConfigItemModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        addOnceOffPayslipConfigItemModal.show();
        addOnceOffPayslipConfigItemPanel.focus();
    }
    
    // onceOffItemsGrid menuitemclick event handler
    function onceOffItemsGridMenuItemClickEventHandler( event ) {
        if( event.value === 'edit' ) {
            var EditOnceOffPayslipConfigItemModal = new lx.component.ModalWindow({
                height: '100%',
                maxWidth: '430px',
                maxHeight: '466px',
                margin: '40px'
            });
            
            // Create the editCompanyDetails panel
            var EditOnceOffPayslipConfigItemPanel = new app.panel.EditOnceOffPayslipConfigItem({
                renderTo: EditOnceOffPayslipConfigItemModal.getContainer(),
                show: true,
                payslipItemId: event.srcComponent.getRow(event.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loadItems();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            EditOnceOffPayslipConfigItemModal.addEventListener('destroy', function() {
                EditOnceOffPayslipConfigItemPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: EditOnceOffPayslipConfigItemModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            EditOnceOffPayslipConfigItemModal.show();
            EditOnceOffPayslipConfigItemPanel.focus();
        }
        else if( event.value === 'remove' ) {
            var rowIndex = event.rowIndex;
            var srcComponent = event.srcComponent;
            
            new lx.component.Messagebox({
                title: 'Confirm Item Removal',
                message: 'Are you sure you want to remove the \'' + srcComponent.getRow(rowIndex).description + '\' item?',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'remove', label: 'Remove', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'remove' ) {
                        lx.sendJSON({
                            url: 'exec.php?c=Payslip&fn=remove',
                            data: {
                                payslipItemId: srcComponent.getRow(rowIndex).id
                            },
                            onSuccess: function( responseText ) {
                                var response = JSON.parse( responseText );
                                
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Unable to remove item',
                                        message: response.error,
                                        icon: 'icon_error'
                                    });
                                    return;
                                }
                                
                                // Remove the item from the grid
                                srcComponent.removeRow(rowIndex);
                            }
                        });
                    }
                }
            });
        }
        
    }
    
    // onceOffItemsGrid cellclick event handler
    function onceOffItemsGridCellClickEventHandler( event ) {
        if( event.columnIndex === 0 ) {
            var EditOnceOffPayslipConfigItemModal = new lx.component.ModalWindow({
                height: '100%',
                maxWidth: '430px',
                maxHeight: '466px',
                margin: '40px'
            });
            
            // Create the editCompanyDetails panel
            var EditOnceOffPayslipConfigItemPanel = new app.panel.EditOnceOffPayslipConfigItem({
                renderTo: EditOnceOffPayslipConfigItemModal.getContainer(),
                show: true,
                payslipItemId: event.srcComponent.getRow(event.rowIndex).id,
                
                onCancel: function() {
                    app.route.popState();
                },
                onSave: function() {
                    app.route.popState();
                    loadItems();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            EditOnceOffPayslipConfigItemModal.addEventListener('destroy', function() {
                EditOnceOffPayslipConfigItemPanel.destroy();
            });
            
            // Create a route entry for the panel
            var state = {
                modal: EditOnceOffPayslipConfigItemModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            EditOnceOffPayslipConfigItemModal.show();
            EditOnceOffPayslipConfigItemPanel.focus();
        }
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};