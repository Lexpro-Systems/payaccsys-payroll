/* globals app, lx */
'use strict';


// LIST PAYSLIPS PANEL
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
app.panel.ListPayslips = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var searchTxt = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var payslipsGrid = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadPayslips() {
        lx.sendJSON({
            url: 'exec.php?c=Payslip&fn=getList',
            data: {
                searchString: searchTxt.getValue().trim(),
                limit: 50,
                offset: payslipsGrid.getRowCount(),
                sortOrder: 'DESC',
                employeeId: config.employeeId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Payslips Failed',
                        message: response.error
                    });
                }
                
                var payslips = [];
                for( var i = 0; i < response.payslips.length; i++ ) {
                    payslips.push({
                        id: response.payslips[i].id,
                        emailAddress: response.payslips[i].emailAddress,
                        date: response.payslips[i].fromDate + ' to ' + response.payslips[i].toDate,
                        description: response.payslips[i].description,
                        sarsYear: response.payslips[i].sarsYear,
                        menu: '<i class="fa fa-ellipsis-v"></i>',
                        spacer: ''
                    });
                }
                
                payslipsGrid.addRows( payslips );
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
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 0px 0px',
                margin: '15px 0px 0px 0px'
            }
        });
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 15px 0px auto',

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
                width: '100%',
                height: '100%',
                overflow: 'auto',
                padding: '15px'
            }
        });
        
        // Create payslipsGridMenuOptions array
        var payslipsGridMenuOptions = [
            {name: '<i class="far fa-fw fa-eye" style="margin: 0px 15px 0px 0px;"></i>View', value: 'view'},
            {name: '<i class="fas fa-download" style="margin: 0px 15px 0px 0px;"></i>Download', value: 'download'},
            {name: '<i class="fas fa-envelope" style="margin: 0px 15px 0px 0px;"></i>Email To', value: 'emailTo'}
        ];
        
        // Create payslipsGrid component
        payslipsGrid = new lx.component.Grid({
            renderTo: contentContainerEl,
            width: '100%',
            height: '100%',
            
            columns: [
                {dataIndex: 'date', name: 'Date', width: '190px', padding: '0px 0px 0px 20px', type: 'button'},
                {dataIndex: 'description', name: 'Payrun', minWidth: '200px', wrapText: true},
                {dataIndex: 'sarsYear', name: 'SARS Year', width: '100px'},
                {dataIndex: 'menu', name: '', type: 'menu', options: payslipsGridMenuOptions, width: '50px', alignment: 'center'},
                {dataIndex: 'spacer', name: '', width: '5px', padding: '0px 0px 0px 0px'}
            ],
            
            onCellClick: payslipsGridCellClickEventHandler,
            
            onScrollEnd: payslipsGridScrollEndEventHandler,
            
            onMenuItemClick: function( clickEvent ) {
                if( clickEvent.value === 'download' ) {
                    lx.sendForm({
                        url: 'exec.php?c=Payslip&fn=downloadPayslip',
                        target: '_blank',
                        data: {
                            payslipId: parseInt(payslipsGrid.getRow(clickEvent.rowIndex).id)
                        }
                    });
                }
                else if(clickEvent.value === 'view'){
                    config.viewEmployeePanel.hide();
                    
                    var viewEmployeePanel = new app.panel.ViewPayslip({
                        renderTo: app.mainPanel.getContainer(),
                        show: true,
                        payslipId: parseInt(payslipsGrid.getRow(clickEvent.rowIndex).id),
                        viewEmployeePanel: config.viewEmployeePanel,
                        employeeName: config.employeeName,
                        emailAddress: payslipsGrid.getRow(clickEvent.rowIndex).emailAddress
                        
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
                else if (clickEvent.value === 'emailTo') {
                    // Create a modal window
                    var mailToModal = new lx.component.ModalWindow({
                        margin: '40px',
                        maxWidth: '450px',
                        maxHeight: '232px'
                        
                    });
                    
                    // Create the mailToPanel panel
                    var mailToPanel = new app.panel.MailTo({
                        renderTo: mailToModal.getContainer(),
                        show: true,
                        payslipId: parseInt(payslipsGrid.getRow(clickEvent.rowIndex).id),
                        emailAddress: payslipsGrid.getRow(clickEvent.rowIndex).emailAddress,
                        
                        onCancel: function() {
                            app.route.popState();
                        },
                        
                        onSend: function() {
                            app.route.popState();
                            
                            new lx.component.Messagebox({
                                title: 'Email Payslip',
                                message: 'The email was sent successfully.'
                            });
                        }
                    });
                    
                    // Add destroy event listener to modal to destroy the contained panel.
                    mailToModal.addEventListener('destroy', function() {
                        mailToPanel.destroy();
                    });
                    
                    // Create a route entry for the panel
                    var state = {
                        modal: mailToModal
                    };
                    app.route.pushState(state, function( state ) {
                        state.modal.destroy();
                    });
                    
                    // Show the modal window and focus on the panel
                    mailToModal.show();
                    mailToPanel.focus();
                }
            }
        });
        
        // Load departments
        loadPayslips();
        
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
    
    function onSearchEventHandler (){
        payslipsGrid.clear();
        loadPayslips();
    }
    
    function onSearchResetBtnClickEventHandler () {
        payslipsGrid.clear();
        searchTxt.setValue('');
        loadPayslips();
    }
    
    function payslipsGridScrollEndEventHandler() {
        loadPayslips();
    }
    
    function payslipsGridCellClickEventHandler( event ) {
        
        if( event.columnIndex === 0 ) {
            
            config.viewEmployeePanel.hide();
            
            var viewEmployeePanel = new app.panel.ViewPayslip({
                renderTo: app.mainPanel.getContainer(),
                show: true,
                payslipId: payslipsGrid.getRow(event.rowIndex).id,
                viewEmployeePanel: config.viewEmployeePanel,
                employeeName: config.employeeName,
                emailAddress: payslipsGrid.getRow(event.rowIndex).emailAddress
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