/* jslint node: true */
/* globals app, lx */
'use strict';


// VIEW EMPLOYEE PANEL
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
app.panel.ViewEmployee = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleBackEl = null;
    var titleTextEl = null;
    var employeBtn = null;
    
    var loaderContainerEl = null;
    var tabContainerEl = null;
    var tabMarkerEl = null;
    var tabDetailsItemEl = null;
    var tabEarningsItemEl = null;
    var tabRetirementFundsItemEl = null;
    var tabLeaveItemEl = null;
    var tabLeaveRequestsItemEl = null;
    var tabPayslipItemEl = null;
    var tabIrp5ItemEl = null;
    var tabLoansItemEl = null;
    var tabDocumentsItemEl = null;
    var tabAttendanceItemEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    var detailsPanel = null;
    var earningsPanel = null;
    var retirementFundsPanel = null;
    var leavePanel = null;
    var leaveRequestsPanel = null;
    var payslipsPanel = null;
    var taxCertificatePanel = null;
    var loansPanel = null;
    var documentsPanel  = null;
    var attendancePanel  = null;
    
    var employeeId = null;
    var employeeName = null;
    var refreshEmployees = false;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    function loadEmployeeStatus() {
        
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getEmploymentStatus',
            data: {
                employeeId: config.employeeId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employee Status Failed',
                        message: response.error
                    });
                }
                
                if (response.employeeStatus === 'EMPL') {
                    employeBtn.setLabel('End Employment');
                    employeBtn.removeEventListener('click', employeeEmployBtnClickEventHandler);
                    employeBtn.addEventListener('click', employeeDismissBtnClickEventHandler);
                }
                else {
                    employeBtn.setLabel('Employ Again');
                    employeBtn.removeEventListener('click', employeeDismissBtnClickEventHandler);
                    employeBtn.addEventListener('click', employeeEmployBtnClickEventHandler);
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
            show: false,
            
            employeeId: null,
            employeeName: null
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
        employeeName = compConfig.employeeName;
        
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
            innerHTML: 'Employee: ' + compConfig.employeeName
        });
        
        
        // Create the employeBtn component
        employeBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'End Employment',
            height: '32px',
            width: '140px',
            margin: '0px 20px 0px auto',
            
            // onClick: employeBtnClickEventHandler
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
        
        // Create the tabContainerEl element
        tabContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                backgroundColor: '#FFFFFF',
                width: '220px',
                height: '100%',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 1px 0px 0px',
                flex: '0 0 auto'
            }
        });
        
        // Create tabDetailsItemEl element
        tabDetailsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Details'
        });
        tabDetailsItemEl.addEventListener('click', tabDetailsItemElClickEventHandler);
        
        // Create tabEarningsItemEl element
        tabEarningsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Earnings / Deductions'
        });
        tabEarningsItemEl.addEventListener('click', tabEarningsItemElClickEventHandler);
        
        // Create tabRetirementFundsItemEl element
        tabRetirementFundsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Retirement Funds'
        });
        tabRetirementFundsItemEl.addEventListener('click', tabRetirementFundsItemElClickEventHandler);
        
        // Create tabLeaveItemEl element
        tabLeaveItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Leave'
        });
        tabLeaveItemEl.addEventListener('click', tabLeaveItemElClickEventHandler);
        
        // Create tabLeaveRequestsItemEl element
        tabLeaveRequestsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Leave Requests'
        });
        tabLeaveRequestsItemEl.addEventListener('click', tabLeaveRequestsItemElClickEventHandler);
        
        // Create tabPayslipItemEl element
        tabPayslipItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Payslips'
        });
        tabPayslipItemEl.addEventListener('click', tabPayslipItemElClickEventHandler);
        
        // Create tabIrp5ItemEl element
        tabIrp5ItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Tax Certificates'
        });
        tabIrp5ItemEl.addEventListener('click', tabIrp5ItemElClickEventHandler);
        
        // Create tabLoansItemEl element
        tabLoansItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Loans'
        });
        tabLoansItemEl.addEventListener('click', tabLoansItemElClickEventHandler);
        
        // Create tabDocumentsItemEl element
        tabDocumentsItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Documents'
        });
        tabDocumentsItemEl.addEventListener('click', tabDocumentsItemElClickEventHandler);
        
        // Create tabAttendanceItemEl element
        tabAttendanceItemEl = lx.createElement('DIV', {
            parent: tabContainerEl,
            className: 'list-item',
            style: {
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                position: 'relative'
            },
            innerHTML: 'Attendance History'
        });
        tabAttendanceItemEl.addEventListener('click', tabAttendanceItemElClickEventHandler);
        
        // Create the tabMarkerEl element
        tabMarkerEl = lx.createElement('DIV', {
            parent: tabDetailsItemEl,
            style: {
                backgroundColor: '#F4F5F6',
                width: '35px',
                height: '35px',
                top: '4px',
                left: '213px',
                position: 'absolute',
                transform: 'rotate(45deg)',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
            }
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
                backgroundColor: '#F4F5F6',
                zIndex: 1
            }
        });
        
        
        //
        // CREATE SUB PANELS
        //
        
        detailsPanel = new app.panel.ViewEmployeeDetails({
            renderTo: contentContainerEl,
            show: true,
            
            employeeId: employeeId,
            
            onUpdate:  function( event ) {
                refreshEmployees = event.refreshEmployees;
                if( refreshEmployees ) {
                    titleTextEl.innerHTML = 'Employee: ' + event.employeeName;
                }
            }
        });
        
        earningsPanel = new app.panel.ViewEmployeeEarnings({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            mainPanel: me
        });
        
        retirementFundsPanel = new app.panel.ViewEmployeeRetirementFunds({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            mainPanel: me
        });
        
        leavePanel = new app.panel.ViewEmployeeLeave({
            renderTo: contentContainerEl,
            employeeId: employeeId
        });
        
        leaveRequestsPanel = new app.panel.ListEmployeeLeaveRequests({
            renderTo: contentContainerEl,
            viewEmployeePanel: me,
            employeeId: employeeId,
            employeeAlias: employeeName
        });
        
        payslipsPanel = new app.panel.ListPayslips({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            viewEmployeePanel: me,
            employeeName: compConfig.employeeName
        });
        
        taxCertificatePanel = new app.panel.ListEmployeeTaxCertificate({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            viewEmployeePanel: me,
            employeeName: compConfig.employeeName
        });
        
        loansPanel = new app.panel.ListEmployeeLoans({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            viewEmployeePanel: me,
            employeeName: compConfig.employeeName
        });
        
        documentsPanel = new app.panel.ListEmployeeDocuments({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            viewEmployeePanel: me,
            employeeName: compConfig.employeeName
        });
        
        attendancePanel = new app.panel.ListEmployeeAttendance({
            renderTo: contentContainerEl,
            employeeId: employeeId,
            viewEmployeePanel: me,
            employeeName: compConfig.employeeName
        });
        
        loadEmployeeStatus();
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
        me.fireEvent('destroy', {srcPanel: me, refreshEmployees: refreshEmployees});
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    me.getPanels = function() {
        let panels = null;
        panels = {
            detailsPanel: detailsPanel,
            earningsPanel: earningsPanel,
            retirementFundsPanel: retirementFundsPanel,
            leavePanel: leavePanel,
            leaveRequestsPanel: leaveRequestsPanel,
            payslipsPanel: payslipsPanel,
            taxCertificatePanel: taxCertificatePanel,
            loansPanel: loansPanel
        };
        
        return panels;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    function employeeDismissBtnClickEventHandler(){
        // Create a modal window
        var dismissEmployeeModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '500px',
            maxHeight: '300px'
        });
        
        // Create the editCompanyDetails panel
        var dismissEmployeePanel = new app.panel.DismissEmployee({
            renderTo: dismissEmployeeModal.getContainer(),
            show: true,
            employeeId: config.employeeId,
            
            onCancel: function() {
                app.route.popState();
            },
            onDismiss: function() {
                app.route.popState();
                loadEmployeeStatus();
                detailsPanel.destroy();
                detailsPanel = new app.panel.ViewEmployeeDetails({
                    renderTo: contentContainerEl,
                    show: true,
                    employeeId: employeeId
                });
                earningsPanel.destroy();
                earningsPanel = new app.panel.ViewEmployeeEarnings({
                    renderTo: contentContainerEl,
                    employeeId: employeeId,
                    
                });
                refreshEmployees = true;
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        dismissEmployeeModal.addEventListener('destroy', function() {
            dismissEmployeePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: dismissEmployeeModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        dismissEmployeeModal.show();
        dismissEmployeePanel.focus();
    }
    
    function employeeEmployBtnClickEventHandler(){
        // Check if the employee limit has been reached
        lx.sendJSON({
            url: 'exec.php?c=Employee&fn=getLimit',
            onSuccess: function( responseText ) {
                let response = JSON.parse(responseText);
                
                // Was the employee limit reached?
                if( (response.limit.employeeLimit !== null) && (response.limit.employeeCount >= response.limit.employeeLimit) ) {
                    new lx.component.Messagebox({
                        title: 'Adding Employee Failed',
                        message: 'Unable to employ the specified employee. Your company is limited to ' + response.limit.employeeLimit + ' employees.'
                    });
                    return;
                }
                
                // Create a modal window
                var employEmployeeModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '500px',
                    maxHeight: '232px'
                });
                
                // Create the editCompanyDetails panel
                var employEmployeePanel = new app.panel.EmployEmployee({
                    renderTo: employEmployeeModal.getContainer(),
                    show: true,
                    employeeId: config.employeeId,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    onEmploy: function() {
                        app.route.popState();
                        loadEmployeeStatus();
                        detailsPanel.destroy();
                        detailsPanel = new app.panel.ViewEmployeeDetails({
                            renderTo: contentContainerEl,
                            show: true,
                            employeeId: employeeId
                        });
                        earningsPanel.destroy();
                        earningsPanel = new app.panel.ViewEmployeeEarnings({
                            renderTo: contentContainerEl,
                            employeeId: employeeId,
                            
                        });
                        refreshEmployees = true;
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                employEmployeeModal.addEventListener('destroy', function() {
                    employEmployeePanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: employEmployeeModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                employEmployeeModal.show();
                employEmployeePanel.focus();
            }
        });
        
        return;
    }
    
    // titleBackEl click event handler
    function titleBackElClickEventHandler() {
        app.route.popState();
    }
    
    // tabDetailsItemEl click event handler
    function tabDetailsItemElClickEventHandler() {
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        detailsPanel.show();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabDetailsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabDetailsItemEl click event handler
    function tabEarningsItemElClickEventHandler() {
        detailsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        earningsPanel.show();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabEarningsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabLeaveItemEl click event handler
    function tabLeaveItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        payslipsPanel.hide();
        leavePanel.show();
        leaveRequestsPanel.hide();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabLeaveItemEl.appendChild( tabMarkerEl );
    }
    
    // tabLeaveItemEl click event handler
    function tabLeaveRequestsItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        payslipsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.show();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabLeaveRequestsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabLeaveItemEl click event handler
    function tabRetirementFundsItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        payslipsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        retirementFundsPanel.show();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabRetirementFundsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabPayslipItemEl click event handler
    function tabPayslipItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.show();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabPayslipItemEl.appendChild( tabMarkerEl );
    }
    
    // tabIrp5ItemEl click event handler
    function tabIrp5ItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        retirementFundsPanel.hide();
        taxCertificatePanel.show();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabIrp5ItemEl.appendChild( tabMarkerEl );
    }
    
    // tabLoansItemEl click event handler
    function tabLoansItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.show();
        documentsPanel.hide();
        attendancePanel.hide();
        
        tabLoansItemEl.appendChild( tabMarkerEl );
    }
    
    // tabDocumentsItemEl click event handler
    function tabDocumentsItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.show();
        attendancePanel.hide();
        
        tabDocumentsItemEl.appendChild( tabMarkerEl );
    }
    
    // tabAttendanceItemEl click event handler
    function tabAttendanceItemElClickEventHandler() {
        detailsPanel.hide();
        earningsPanel.hide();
        leavePanel.hide();
        leaveRequestsPanel.hide();
        payslipsPanel.hide();
        retirementFundsPanel.hide();
        taxCertificatePanel.hide();
        loansPanel.hide();
        documentsPanel.hide();
        attendancePanel.show();
        
        tabAttendanceItemEl.appendChild( tabMarkerEl );
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};