/* jslint node: true */
/* globals app, lx */
'use strict';

// LIST LOANS PANEL
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
app.panel.ListLoans = function(config) {
    
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
    
    var loansGrid = null;
    var employeePanels = [];
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    
    // Function to load employees
    function loadLoans(clearGrid) {
        let offset = 0;
        if( !clearGrid ) offset = loansGrid.getRowCount();
        
        lx.sendJSON({
            url: 'exec.php?c=Loan&fn=getList',
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
                        title: 'Loading Loans Failed',
                        message: response.error
                    });
                }
                
                // Populate grid
                var loans = [];
                for( var i = 0; i < response.loans.length; i++ ) {
                    let interestRate = parseFloat(response.loans[i].interestRate);
                    interestRate = interestRate.toFixed(2);
                    interestRate = interestRate + '%';
                    if (response.loans[i].interestRate === null) {
                        interestRate = '';
                    }
                    
                    loans.push({
                        id: response.loans[i].id,
                        employeeId: response.loans[i].employeeId,
                        startDate: response.loans[i].startDate,
                        name: response.loans[i].alias + ' ' + response.loans[i].lastName,
                        description: response.loans[i].description,
                        loanStatus: response.loans[i].loanStatusName,
                        interestRate: interestRate,
                        amount: lx.util.formatCurrency(response.loans[i].principalAmount),
                        balance: lx.util.formatCurrency(response.loans[i].balance),
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                // Should the grid be cleared?
                if( clearGrid ) loansGrid.clear();
                
                loansGrid.addRows( loans );
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
            innerHTML: 'Loans'
        });
        
        // Create the addBtn component
        addBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Add Loan',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px auto',
            
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
        
        // Create loansGridMenuOptions array
        var loansGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'View'},
            {name: '<i class="fa fa-fw fa-times" style="margin: 0px 15px 0px 0px;"></i>Remove', value: 'remove'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download Agreement', value: 'download'}
        ];
        
        // Create loansGrid component
        loansGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            borderWidth: '0px',
            
            columns: [
                {dataIndex: 'startDate', name: 'Start Date', width: '100px', padding: '0px 0px 0px 20px'},
                {dataIndex: 'description', name: 'Description', minWidth: '200px', type: 'button'},
                {dataIndex: 'name', name: 'Employee Name', minWidth: '100px', type: 'button'},
                {dataIndex: 'loanStatus', name: 'Loan Status', width: '100px'},
                {dataIndex: 'interestRate', name: 'Interest Rate',  width: '100px', alignment: 'right'},
                {dataIndex: 'amount', name: 'Amount', width: '100px', alignment: 'right'},
                {dataIndex: 'balance', name: 'Balance', width: '100px', alignment: 'right'},
                {dataIndex: 'menu', name: '', type: 'menu', options: loansGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onScrollEnd: loansGridScrollEndEventHandler,
            onCellClick: loansGridCellClickEventHandler,
            onMenuItemClick: loansGridMenuItemClickEventHandler
        });
        
        // Show loader
        loader.show( false );
        
        // Load page data
        loadLoans(true);
        
        
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
    
    // Search component event handlers
    function onSearchEventHandler (){
        loader.show();
        loadLoans(true);
    }
    
    // On search reset btn click event handler
    function onSearchResetBtnClickEventHandler () {
        searchTxt.setValue('');
        loadLoans(true);
    }
    
    // Employees grid scroll end event handler
    function loansGridScrollEndEventHandler() {
        loadLoans(false);
    }
    
    // Employees grid cell click event handler
    function loansGridCellClickEventHandler( event ) {
        if( loansGrid.getColumnDataIndex( event.columnIndex ) === 'name' ) {
            me.hide();
            
            let viewEmployeePanel = new app.panel.ViewEmployee({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                employeeId: event.record.employeeId,
                employeeName: event.record.name,
                
                onDestroy: function( event ) {
                    if( event.refreshEmployees === true ) {
                        loadLoans(true);
                    }
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewEmployeePanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if( loansGrid.getColumnDataIndex( event.columnIndex ) === 'description' ) {
            me.hide();
            
            let viewLoanPanel = new app.panel.ViewLoans({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                loanId: event.record.id,
                loanDescription: event.record.description,
                employeeId: event.record.employeeId,
                
                onDestroy: function( event ) {
                    if( event.refreshLoans === true ) {
                        loadLoans(true);
                    }
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewLoanPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
    }
    
    // Employees grid menu item click event handler
    function loansGridMenuItemClickEventHandler( event ) {
        if( event.value === 'View' ) {
            me.hide();
            
            let viewLoanPanel = new app.panel.ViewLoans({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                
                loanId: loansGrid.getRow(event.rowIndex).id,
                loanDescription: loansGrid.getRow(event.rowIndex).description,
                
                onDestroy: function( event ) {
                    if( event.refreshLoans === true ) {
                        loadLoans(true);
                    }
                }
            });
            
            let panelState = {
                previousPanel: me,
                panel: viewLoanPanel
            };
            
            app.route.pushState(panelState, function( state ) {
                state.panel.destroy();
                state.previousPanel.show();
            });
        }
        else if( event.value === 'remove' ) {
            lx.sendJSON({
                url: 'exec.php?c=Loan&fn=checkLoanRemoval',
                data: {
                    loanId: loansGrid.getRow(event.rowIndex).id,
                },
                onSuccess: function( responseText ) {
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Unable to Remove Loan',
                            message: response.error
                        });
                        return;
                    }
                    
                    let message = 'Are you sure you want to remove the \'' + loansGrid.getRow(event.rowIndex).description + '\' loan?';
                    if (response.hasPayments) {
                        message = 'There have already been one or more payments for this loan are you sure you want to remove it?';
                    }
                    
                    new lx.component.Messagebox({
                        title: 'Remove Loan',
                        message: 
                            message,
                        buttons: [
                            {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                            {name: 'remove', label: 'Remove', isDefault: true}
                        ],
                        onClose: function( closeEvent ) {
                            if( closeEvent.button === 'remove' ) {
                                lx.sendJSON({
                                    url: 'exec.php?c=Loan&fn=removeLoan',
                                    data: {
                                        loanId: loansGrid.getRow(event.rowIndex).id,
                                    },
                                    onSuccess: function( responseText ) {
                                        var response = JSON.parse(responseText);
                                        
                                        if( response.ok !== true ) {
                                            new lx.component.Messagebox({
                                                title: 'Removing Loan Failed',
                                                message: response.error
                                            });
                                        }
                                        
                                        loader.show();
                                        loadLoans(true);
                                    }
                                });
                            }
                            else {
                                return;
                            }
                        }
                    });
                    
                }
            });
        }
        else if( event.value === 'download' ) {
            lx.sendForm({
                url: 'exec.php?c=Loan&fn=downloadAgreement',
                target: '_blank',
                data: {
                    loanId: parseInt(loansGrid.getRow(event.rowIndex).id)
                }
            });
        }
    }
    
    // Add btn click event handler
    function addBtnClickEventHandler() {
        // Create a modal window
        var addLoanModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '742px'
        });
        
        // Create the addLoanPanel panel
        var addLoanPanel = new app.panel.AddLoan({
            renderTo: addLoanModal.getContainer(),
            show: true,
            employeeSelect: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onAdd: function() {
                app.route.popState();
                loadLoans(true);
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        addLoanModal.addEventListener('destroy', function() {
            addLoanPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: addLoanModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        addLoanModal.show();
        addLoanPanel.focus();
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};